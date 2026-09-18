# -*- coding: utf-8 -*-
"""通用 edge-tts 旁白生成脚本（单文件、跨视频复用）。

从 MoneyPrinterTurbo app/services/voice.py 提炼并固化的 edge-tts 方案：
  - edge_tts 6.x/7.x 兼容（boundary 参数探测）
  - 流式超时兜底（daemon 线程 + Queue，默认 30s）
  - 重试 + 空文件清理
输出与现有 Remotion 流水线兼容：每段 mp3 + srt，汇总 durations.json
（时长 -> 帧号 = round(时长 × 30) 由分镜表使用）。

依赖：pip install edge-tts（项目内 mpt-tts-mcp/.venv 与 MoneyPrinterTurbo-main/.venv 均已装 7.2.7）

用法:
  python generate-tts.py --segments segments.json --out <视频>/public/audio/tts
      [--voice zh-CN-XiaoxiaoNeural] [--rate 1.2] [--timeout 30] [--retries 3]

segments.json:
  [
    {"name": "tts-open", "text": "比奇堡第一届市长竞选辩论大会，正式开始！"},
    {"name": "tts-r1", "text": "比奇堡经济低迷，水母失业……"}
  ]
"""
import argparse
import asyncio
import inspect
import json
import os
import queue
import threading
import time

import edge_tts

DEFAULT_VOICE = "zh-CN-XiaoxiaoNeural"
DEFAULT_RATE = 1.2          # +20%，与旧脚本一致
DEFAULT_TIMEOUT = 30.0      # 单次流式请求超时（秒），<=0 表示禁用
DEFAULT_RETRIES = 3


# ── 基础工具 ────────────────────────────────────────────────────────────────
def srt_ts(ms: int) -> str:
    h = int(ms // 3600000)
    m = int((ms % 3600000) // 60000)
    s = int((ms % 60000) // 1000)
    mm = int(ms % 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{mm:03d}"


def convert_rate_to_percent(rate: float) -> str:
    """edge-tts 要求带符号百分比（如 "+20%"）；round 到 0 时也要带符号。"""
    try:
        rate = float(rate)
    except (TypeError, ValueError):
        rate = 1.0
    if rate <= 0:
        rate = 1.0
    percent = round((rate - 1.0) * 100)
    if percent >= 0:
        return f"+{percent}%"
    return f"{percent}%"


def ensure_file_path_exists(file_path: str) -> None:
    """edge_tts 7.x 在真正发请求前就会先打开目标文件，目录必须存在。"""
    parent = os.path.dirname(file_path)
    if parent:
        os.makedirs(parent, exist_ok=True)


# ── edge-tts 版本兼容 ───────────────────────────────────────────────────────
def create_edge_tts_communicate(text: str, voice_name: str, rate_str: str):
    """兼容 edge_tts 6.x（无 boundary 参数）与 7.x（有 boundary 参数）。"""
    kwargs = {"rate": rate_str}
    if "boundary" in inspect.signature(edge_tts.Communicate).parameters:
        kwargs["boundary"] = "WordBoundary"
    return edge_tts.Communicate(text, voice_name, **kwargs)


# ── 流式超时兜底 ────────────────────────────────────────────────────────────
def _stream_sync_with_timeout(communicate, on_chunk, timeout_seconds: float) -> None:
    """带总超时地消费 stream_sync()：阻塞迭代放 daemon 线程，主线程经 Queue 取块。"""
    stream_queue = queue.Queue()
    done_marker = object()

    def _produce_chunks():
        try:
            for chunk in communicate.stream_sync():
                stream_queue.put(("chunk", chunk))
            stream_queue.put(("done", done_marker))
        except Exception as e:
            stream_queue.put(("error", e))

    threading.Thread(target=_produce_chunks, daemon=True).start()
    deadline = time.monotonic() + timeout_seconds
    while True:
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise TimeoutError(f"edge_tts stream timed out after {timeout_seconds:g}s")
        try:
            item_type, payload = stream_queue.get(timeout=min(0.5, remaining))
        except queue.Empty:
            continue
        if item_type == "chunk":
            on_chunk(payload)
        elif item_type == "error":
            raise payload
        elif item_type == "done":
            return


def stream_edge_tts_chunks(communicate, on_chunk, timeout_seconds) -> None:
    """统一消费 edge_tts 7.x 的 stream_sync() 与旧版的异步 stream()。"""
    if hasattr(communicate, "stream_sync"):
        if timeout_seconds:
            _stream_sync_with_timeout(communicate, on_chunk, timeout_seconds)
            return
        for chunk in communicate.stream_sync():
            on_chunk(chunk)
        return
    if not hasattr(communicate, "stream"):
        raise AttributeError("edge_tts communicate object has no stream method")

    async def _consume():
        async for chunk in communicate.stream():
            on_chunk(chunk)

    loop = asyncio.new_event_loop()
    try:
        if timeout_seconds:
            loop.run_until_complete(asyncio.wait_for(_consume(), timeout=timeout_seconds))
        else:
            loop.run_until_complete(_consume())
    finally:
        loop.close()


# ── 单段生成 ────────────────────────────────────────────────────────────────
def generate_one(name: str, text: str, out_dir: str, voice: str, rate: float,
                 timeout: float, max_retry: int) -> dict:
    mp3 = os.path.join(out_dir, f"{name}.mp3")
    srt = os.path.join(out_dir, f"{name}.srt")
    rate_str = convert_rate_to_percent(rate)
    last_error = None

    for attempt in range(1, max_retry + 1):
        try:
            ensure_file_path_exists(mp3)
            communicate = create_edge_tts_communicate(text, voice, rate_str)
            cues = []  # [(start_ms, end_ms, text)]
            with open(mp3, "wb") as f:
                def _on_chunk(chunk):
                    chunk_type = chunk["type"]
                    if chunk_type == "audio":
                        f.write(chunk["data"])
                    elif chunk_type in ("WordBoundary", "SentenceBoundary"):
                        # offset/duration 单位是 100ns -> 转 ms
                        start_ms = chunk["offset"] / 10000
                        end_ms = (chunk["offset"] + chunk["duration"]) / 10000
                        cues.append((start_ms, end_ms, chunk["text"]))

                stream_edge_tts_chunks(communicate, _on_chunk, timeout_seconds=timeout)

            if os.path.getsize(mp3) == 0:
                raise edge_tts.exceptions.NoAudioReceived("空音频")
            if not cues:
                raise RuntimeError("无 WordBoundary 边界事件")

            lines = []
            for i, (st, en, wtext) in enumerate(cues, 1):
                lines.append(f"{i}\n{srt_ts(st)} --> {srt_ts(en)}\n{wtext}\n")
            with open(srt, "w", encoding="utf-8") as f:
                f.write("\n".join(lines))

            dur = round(cues[-1][1] / 1000, 3)
            print(f"[OK] {name}.mp3  {dur}s")
            return {"name": name, "text": text, "duration": dur, "voice": voice, "rate": rate_str}
        except Exception as e:
            last_error = e
            # 首包前失败会留下 0 字节文件，直接清理；已写入部分数据则保留现场。
            if os.path.exists(mp3) and os.path.getsize(mp3) == 0:
                try:
                    os.remove(mp3)
                except OSError:
                    pass
            if attempt >= max_retry:
                break
            wait = attempt * 2
            print(f"[RETRY] {name} 第{attempt}次失败({type(e).__name__})，{wait}s 后重试...")
            time.sleep(wait)

    raise RuntimeError(f"{name} 生成失败: {last_error}")


def srt_duration(srt_path: str) -> float:
    """幂等跳过时从已有 srt 末条字幕解析时长（秒）。"""
    end_ms = 0.0
    try:
        with open(srt_path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if "-->" in line:
                    end_part = line.split("-->")[1].strip()
                    h, m, s = end_part.split(":")
                    end_ms = int(h) * 3600000 + int(m) * 60000 + float(s.replace(",", ".")) * 1000
    except Exception:
        pass
    return round(end_ms / 1000, 3)


# ── 主流程 ──────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="edge-tts 旁白生成（mp3 + srt + durations.json）")
    parser.add_argument("--segments", required=True, help="分镜文案 JSON：[{name, text}, ...]")
    parser.add_argument("--out", required=True, help="输出目录（如 <视频>/public/audio/tts）")
    parser.add_argument("--voice", default=DEFAULT_VOICE, help=f"音色，默认 {DEFAULT_VOICE}")
    parser.add_argument("--rate", type=float, default=DEFAULT_RATE,
                        help=f"语速倍率，默认 {DEFAULT_RATE}（+20%）")
    parser.add_argument("--timeout", type=float, default=DEFAULT_TIMEOUT,
                        help=f"单次流式超时秒数，<=0 禁用，默认 {DEFAULT_TIMEOUT}")
    parser.add_argument("--retries", type=int, default=DEFAULT_RETRIES,
                        help=f"失败重试次数，默认 {DEFAULT_RETRIES}")
    args = parser.parse_args()

    with open(args.segments, encoding="utf-8") as f:
        segments = json.load(f)
    if not segments or not all("name" in s and "text" in s for s in segments):
        parser.error("segments 必须是 [{\"name\": ..., \"text\": ...}, ...] 格式")

    os.makedirs(args.out, exist_ok=True)
    results = []
    for seg in segments:
        name, text = seg["name"], seg["text"]
        mp3 = os.path.join(args.out, f"{name}.mp3")
        srt = os.path.join(args.out, f"{name}.srt")
        # 幂等：已存在且非空则跳过（重跑不重复请求）
        if (os.path.exists(mp3) and os.path.exists(srt)
                and os.path.getsize(mp3) > 0 and os.path.getsize(srt) > 0):
            dur = srt_duration(srt)
            print(f"[SKIP] {name} 已存在（{dur}s）")
            results.append({"name": name, "text": text, "duration": dur,
                            "voice": args.voice, "rate": convert_rate_to_percent(args.rate)})
            continue
        results.append(generate_one(name, text, args.out, args.voice,
                                    args.rate, args.timeout, args.retries))

    total = sum(r["duration"] for r in results)
    print(f"\n总时长: {round(total, 2)}s")
    durations_path = os.path.join(args.out, "durations.json")
    with open(durations_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"durations.json 已写入: {durations_path}")


if __name__ == "__main__":
    main()
