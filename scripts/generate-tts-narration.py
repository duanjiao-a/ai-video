# -*- coding: utf-8 -*-
"""edge-tts 旁白生成：6 段对应 6 个镜头，输出 mp3 + srt，并解析时长写 durations.json"""
import asyncio
import json
import os
import re
import edge_tts

VOICE = "zh-CN-XiaoxiaoNeural"
RATE = "+20%"
OUT = r"d:\APP\trae\traeProject\ai-video\weight-loss\public\audio\tts"

SEGMENTS = [
    ("tts-open", "为什么你减肥总是失败？"),
    ("tts-r1", "第一，节食越狠，反弹越凶。饿到崩溃，只会暴食。"),
    ("tts-r2", "第二，熬夜失眠，食欲激素失控。睡不够，真的会越吃越多。"),
    ("tts-r3", "第三，只做有氧，不练力量。肌肉流失，代谢越来越低。"),
    ("tts-r4", "第四，天天盯体重秤。数字波动的是水分，心态先崩了。"),
    ("tts-outro", "慢慢来，才瘦得久。"),
]

def srt_ts(ms):
    h = int(ms // 3600000)
    m = int((ms % 3600000) // 60000)
    s = int((ms % 60000) // 1000)
    mm = int(ms % 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{mm:03d}"

async def gen(name, text):
    mp3 = os.path.join(OUT, f"{name}.mp3")
    srt = os.path.join(OUT, f"{name}.srt")
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

async def main():
    os.makedirs(OUT, exist_ok=True)
    results = []
    for name, text in SEGMENTS:
        # 幂等：已存在且时长可用则跳过
        srt = os.path.join(OUT, f"{name}.srt")
        mp3 = os.path.join(OUT, f"{name}.mp3")
        if os.path.exists(mp3) and os.path.exists(srt) and os.path.getsize(mp3) > 0 and os.path.getsize(srt) > 0:
            print(f"[SKIP] {name} 已存在")
            results.append({"name": name, "text": text, "duration": 0.0, "voice": VOICE, "rate": RATE})
            continue
        results.append(await gen(name, text))
    total = sum(r["duration"] for r in results)
    print(f"\n总时长: {round(total, 2)}s")
    with open(os.path.join(OUT, "durations.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("durations.json 已写入")

asyncio.run(main())
