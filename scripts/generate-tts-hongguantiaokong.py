# -*- coding: utf-8 -*-
"""edge-tts 旁白生成：《比奇堡大选？3分钟搞懂"宏观调控"！》8 段对应 8 个镜头，
输出 mp3 + srt，并解析时长写 durations.json（帧号 = round(时长×30) 由 DESIGN.md 使用）"""
import asyncio
import json
import os
import random
import edge_tts

VOICE = "zh-CN-XiaoxiaoNeural"
RATE = "+20%"
OUT = r"d:\APP\trae\traeProject\ai-video\videos\gongkao\hongguantiaokong\public\audio\tts"

# 与 DESIGN.md §五 一一对应
SEGMENTS = [
    ("tts-open",
     "比奇堡第一届市长竞选辩论大会，正式开始！今天的辩题是——经济怎么搞？三分钟，搞懂宏观调控！"),
    ("tts-r1",
     "比奇堡经济低迷，水母失业，蟹堡王销量下滑——这叫总需求不足。国家出手调节，让总供给和总需求平衡，这就是宏观调控！三大手段：经济、法律、行政。"),
    ("tts-r2",
     "珊迪的方案：政府主动出击！增加支出、发行国债、减少税收——经济冷，政府花！这叫扩张性财政政策。"),
    ("tts-r3",
     "蟹老板不服：与其政府乱花钱，不如减税，让企业自己投、老百姓自己花——这叫供给侧改革，靠市场自己调节！"),
    ("tts-r4",
     "吵什么吵！搞经济还得看央行！不动税收、不搞基建，直接调货币：降利率、降准备金率、买进国债——扩张性货币政策！"),
    ("tts-r5",
     "反过来，经济过热、物价飞涨怎么办？反着来！加税、加息、少花钱——紧缩性政策！口诀：经济热，要收紧。"),
    ("tts-r6",
     "公考就爱考三件事：判断政策类型，判断扩张还是紧缩，按形势选对策。下次做题，先把口诀背出来！"),
    ("tts-outro",
     "派大星承诺每天免费发蟹堡，结果物价飞涨、赤字爆炸。这种免费午餐，叫民粹主义。宏观调控，要科学！"),
]


def srt_ts(ms):
    h = int(ms // 3600000)
    m = int((ms % 3600000) // 60000)
    s = int((ms % 60000) // 1000)
    mm = int(ms % 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{mm:03d}"


async def gen(name, text, max_retry=3):
    mp3 = os.path.join(OUT, f"{name}.mp3")
    srt = os.path.join(OUT, f"{name}.srt")
    for attempt in range(1, max_retry + 1):
        try:
            communicate = edge_tts.Communicate(text, VOICE, rate=RATE)
            audio = bytearray()
            cues = []
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio.extend(chunk["data"])
                elif chunk["type"] in ("WordBoundary", "SentenceBoundary"):
                    # offset/duration 单位是 100ns → 转 ms
                    start_ms = chunk["offset"] / 10000
                    end_ms = (chunk["offset"] + chunk["duration"]) / 10000
                    cues.append((start_ms, end_ms, chunk["text"]))
            if not audio:
                raise edge_tts.exceptions.NoAudioReceived("空音频")
            with open(mp3, "wb") as f:
                f.write(audio)
            lines = []
            for i, (st, en, wtext) in enumerate(cues, 1):
                lines.append(f"{i}\n{srt_ts(st)} --> {srt_ts(en)}\n{wtext}\n")
            with open(srt, "w", encoding="utf-8") as f:
                f.write("\n".join(lines))
            dur = round(cues[-1][1] / 1000, 3) if cues else 0.0
            print(f"[OK] {name}.mp3  {dur}s")
            return {"name": name, "text": text, "duration": dur, "voice": VOICE, "rate": RATE}
        except Exception as e:
            if attempt >= max_retry:
                raise
            wait = attempt * 2
            print(f"[RETRY] {name} 第{attempt}次失败({type(e).__name__})，{wait}s 后重试...")
            await asyncio.sleep(wait)
    raise RuntimeError(f"{name} 生成失败")


def srt_duration(srt_path):
    """从已有 srt 解析末条字幕结束时间（秒），用于幂等跳过时回填时长"""
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


async def main():
    os.makedirs(OUT, exist_ok=True)
    results = []
    for name, text in SEGMENTS:
        # 幂等：已存在且非空则跳过（重跑不重复请求）
        srt = os.path.join(OUT, f"{name}.srt")
        mp3 = os.path.join(OUT, f"{name}.mp3")
        if os.path.exists(mp3) and os.path.exists(srt) and os.path.getsize(mp3) > 0 and os.path.getsize(srt) > 0:
            dur = srt_duration(srt)
            print(f"[SKIP] {name} 已存在（{dur}s）")
            results.append({"name": name, "text": text, "duration": dur, "voice": VOICE, "rate": RATE})
            continue
        results.append(await gen(name, text))
    total = sum(r["duration"] for r in results)
    print(f"\n总时长: {round(total, 2)}s")
    with open(os.path.join(OUT, "durations.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("durations.json 已写入")


asyncio.run(main())
