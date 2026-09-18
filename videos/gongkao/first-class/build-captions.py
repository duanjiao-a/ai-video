# -*- coding: utf-8 -*-
"""把 srt 词级时间轴摊成"按句读切块"的底部字幕，产出 src/captions.ts。

为什么需要这一步：
  - 规格要求「底部字幕 = 旁白文案全文」（照抄不精简），一段旁白约 60~110 字，
    整段铺在 1280×720 上根本读不了，必须切成块逐块显示。
  - 切块位置必须落在句读处（。！？，、：），且每块的起止时间要贴着旁白的实际发音。
  - srt 只给"词"的时间戳、且丢掉了标点；本脚本用「去掉标点的旁白全文 == srt 词串拼接」
    这条等式把词时间戳映射回原文的每个字，再按标点切块。

用法:
  python build-captions.py                 # 用默认路径
  python build-captions.py --check         # 只校验对齐，不写文件

输出: src/captions.ts（自动生成，不要手改）
  每个分镜一份 cue 列表，from/dur 单位是帧，**相对该分镜自己的起点**。
"""
import argparse
import json
import os
import re
import sys

PUNCT = "，。：、？！；：“”‘’（）《》〈〉【】…—·,.?!;:\"'()[]{} "
PUNCT_SET = set(PUNCT)
# 可切块的标点，按"优先级从高到低"给权重
HARD_STOP = set("。！？")
SOFT_STOP = set("，、：；")

# 切块策略：**只在标点处切**，宁可一行长一点，也不要在词中间断开。
# 中文没有空格，一旦按字数硬切就会切断双字词（实测出现过「招|录公务员」「三|月」
# 「更|高」「上|岸」这类断法，读起来是错的）。所以把 MAX_CHARS 放到只当安全阀，
# 靠 MIN_SOFT 把碎短块并回上一块。
MAX_CHARS = 26   # 安全阀：仅在整段没有标点时兜底（本片实际最长自然块 20 字）
MIN_HARD = 2     # 句末（。！？）基本总是切
MIN_SOFT = 9     # 逗号类（，、：；）累计到 9 字才切

# 分镜绝对起点（必须与 src/skeleton/Main.tsx 的 SHOTS.from 一致）
SHOTS = {
    "tts-open": 0,
    "tts-r1": 511,
    "tts-r2": 1130,
    "tts-r3": 1754,
    "tts-r4": 2176,
    "tts-outro": 2594,
}

# 动画卡点锚：画面上每个大字/卡片该在哪一帧出场，由"这个词被念到的时刻"决定。
# 手写帧号是本片第一版的翻车原因——大字比旁白早 1.5–7.7s 出现，观众读到的
# 是"画面对不上旁白"。所有卡点一律走这张表。
ANCHORS = [
    ("open.hook", "tts-open", "局长，该学习了"),
    ("open.stem", "tts-open", "今天要学习的是"),
    ("open.topic", "tts-open", "国考省考"),
    ("open.y2027", "tts-open", "2027国考"),
    ("open.month", "tts-open", "不到一个月"),
    ("open.ninety", "tts-open", "百分之九十"),
    ("open.ready", "tts-open", "准备好了吗"),
    ("r1.first", "tts-r1", "先说国考"),
    ("r1.full", "tts-r1", "全称国家公务员考试"),
    ("r1.central", "tts-r1", "中央机关"),
    ("r1.units", "tts-r1", "比如部委"),
    ("r1.rail", "tts-r1", "铁路公安"),
    ("r1.unified", "tts-r1", "报名和笔试全国统一时间"),
    ("r1.oct", "tts-r1", "一般每年十月报名"),
    ("r1.nov", "tts-r1", "十一月底笔试"),
    ("r1.fresh", "tts-r1", "而且大半岗位只招应届生"),
    ("r2.second", "tts-r2", "再说省考"),
    ("r2.self", "tts-r2", "各省自己组织"),
    ("r2.levels", "tts-r2", "招的单位覆盖省"),
    ("r2.near", "tts-r2", "离家近"),
    ("r2.joint", "tts-r2", "搞“联考”"),
    ("r2.march", "tts-r2", "来年三月左右笔试"),
    ("r2.friendly", "tts-r2", "就是对户籍和往届相对友好"),
    ("r2.anyone", "tts-r2", "往届生也能报"),
    ("r3.who", "tts-r3", "应届生该考哪个"),
    ("r3.both", "tts-r3", "两个都报"),
    ("r3.nov", "tts-r3", "国考十一月底考"),
    ("r3.march", "tts-r3", "省考联考在来年三月考"),
    ("r3.stagger", "tts-r3", "时间正好错开"),
    ("r3.double", "tts-r3", "机会直接翻倍"),
    ("r4.who", "tts-r4", "那往届生呢"),
    ("r4.prov", "tts-r4", "优先主攻省考"),
    ("r4.limit", "tts-r4", "国考对往届生限制多"),
    ("r4.fierce", "tts-r4", "竞争惨烈"),
    ("r4.near", "tts-r4", "省考岗位多、离家近"),
    ("r4.hukou", "tts-r4", "还有一堆限本省户籍的岗位"),
    ("r4.odds", "tts-r4", "上岸概率明显更高"),
    ("outro.mnemonic", "tts-outro", "最后记住一句话"),
    ("outro.central", "tts-outro", "国考考中央"),
    ("outro.local", "tts-outro", "地方归省考"),
    ("outro.fresh", "tts-outro", "应届两头抓"),
    ("outro.past", "tts-outro", "往届盯本省"),
    ("outro.signup", "tts-outro", "2027国考报名马上开始"),
    ("outro.cta", "tts-outro", "赶紧去看公告"),
]


def strip_punct(s):
    return "".join(ch for ch in s if ch not in PUNCT_SET)


def parse_srt(path):
    cues = []
    with open(path, encoding="utf-8") as f:
        blocks = f.read().strip().split("\n\n")
    for b in blocks:
        lines = [ln for ln in b.split("\n") if ln.strip()]
        if len(lines) < 3:
            continue
        m = re.match(r"(\d+):(\d+):(\d+),(\d+)\s*-->\s*(\d+):(\d+):(\d+),(\d+)", lines[1])
        if not m:
            continue
        g = [int(x) for x in m.groups()]
        start = (g[0] * 3600 + g[1] * 60 + g[2]) * 1000 + g[3]
        end = (g[4] * 3600 + g[5] * 60 + g[6]) * 1000 + g[7]
        cues.append((start, end, "".join(lines[2:])))
    return cues


def chunk_text(text):
    """按标点把旁白原文切成显示块，返回 [(start_idx, end_idx_exclusive)]。"""
    chunks = []
    start = 0
    n = len(text)
    for i, ch in enumerate(text):
        ln = i - start + 1
        is_hard = ch in HARD_STOP
        is_soft = ch in SOFT_STOP
        if (is_hard and ln >= MIN_HARD) or (is_soft and ln >= MIN_SOFT) or ln >= MAX_CHARS:
            chunks.append((start, i + 1))
            start = i + 1
    if start < n:
        chunks.append((start, n))
    # 去掉纯标点/空白的块，并剔除切点后的空白
    out = []
    for s, e in chunks:
        seg = text[s:e]
        if strip_punct(seg).strip():
            out.append((s, e))
        elif out:
            out[-1] = (out[-1][0], e)
    return out


def build_one(text, cues):
    """返回 (cues_out, warn)。cues_out 每项 {from,dur,text}（帧，相对分镜起点）。"""
    spoken = "".join(c[2] for c in cues)
    plain = strip_punct(text)
    if spoken != plain:
        return None, f"对齐失败: srt 词串与旁白正文不一致\n  srt: {spoken}\n  txt: {plain}"

    # srt 词 -> 它在 plain 里的字符区间
    char_to_cue = []
    for ci, (st, en, tok) in enumerate(cues):
        char_to_cue.extend([ci] * len(tok))

    # 原文每个字 -> 它在 plain 里的下标（标点记 -1）
    plain_idx = []
    k = 0
    for ch in text:
        if ch in PUNCT_SET:
            plain_idx.append(-1)
        else:
            plain_idx.append(k)
            k += 1

    def ms_at(plain_i, field):
        if plain_i < 0 or plain_i >= len(char_to_cue):
            return None
        return cues[char_to_cue[plain_i]][field]

    raw = []
    for s, e in chunk_text(text):
        first = next((p for p in (plain_idx[s:e]) if p >= 0), None)
        last = next((p for p in reversed(plain_idx[s:e]) if p >= 0), None)
        if first is None:
            continue
        raw.append({
            "text": text[s:e].strip("　 "),
            "start_ms": ms_at(first, 0),
            "end_ms": ms_at(last, 1),
        })

    # 块与块之间不留缝：前一块延到后一块的起点（末块用自己的结束时间）
    for i in range(len(raw) - 1):
        raw[i]["end_ms"] = max(raw[i]["end_ms"], raw[i + 1]["start_ms"])

    out = []
    for r in raw:
        f = round(r["start_ms"] / 1000 * 30)
        t = round(r["end_ms"] / 1000 * 30)
        out.append({"from": f, "dur": max(1, t - f), "text": r["text"]})
    return out, None


def phrase_frames(text, cues, phrase):
    """返回 phrase 在旁白里的 (起始帧, 结束帧)，相对该分镜；找不到返回 None。"""
    needle = strip_punct(phrase)
    plain = strip_punct(text)
    pos = plain.find(needle)
    if pos < 0:
        return None
    char_to_cue = []
    for ci, (st, en, tok) in enumerate(cues):
        char_to_cue.extend([ci] * len(tok))
    if not char_to_cue:
        return None
    i0 = pos
    i1 = min(pos + len(needle) - 1, len(char_to_cue) - 1)
    start_ms = cues[char_to_cue[i0]][0]
    end_ms = cues[char_to_cue[i1]][1]
    return round(start_ms / 1000 * 30), round(end_ms / 1000 * 30)


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser()
    ap.add_argument("--segments", default=os.path.join(here, "segments.json"))
    ap.add_argument("--srt-dir", default=os.path.join(here, "public", "audio", "tts"))
    ap.add_argument("--out", default=os.path.join(here, "src", "captions.ts"))
    ap.add_argument("--check", action="store_true", help="只校验对齐，不写文件")
    ap.add_argument("--find", default="", help="查一个词/短语在旁白里被念到的帧号（相对该分镜）")
    args = ap.parse_args()

    with open(args.segments, encoding="utf-8") as f:
        segments = json.load(f)

    # ── 查词模式：给动画"卡点"用 ────────────────────────────────────────────
    # 画面上的大字/卡片应该在该词被念到的那一刻出场，而不是拍脑袋定帧号。
    if args.find:
        needle = strip_punct(args.find)
        for seg in segments:
            text = seg["text"]
            plain = strip_punct(text)
            pos = plain.find(needle)
            if pos < 0:
                continue
            cues = parse_srt(os.path.join(args.srt_dir, seg["name"] + ".srt"))
            char_to_cue = []
            for ci, (st, en, tok) in enumerate(cues):
                char_to_cue.extend([ci] * len(tok))
            i0, i1 = pos, min(pos + len(needle) - 1, len(char_to_cue) - 1)
            start_ms = cues[char_to_cue[i0]][0]
            end_ms = cues[char_to_cue[i1]][1]
            print(
                f"{seg['name']:10} 「{args.find}」 → 相对帧 "
                f"{round(start_ms/1000*30)}–{round(end_ms/1000*30)}"
                f"（第 {round(start_ms/1000*30)/30:.2f}s 起）"
            )
        return 0

    result = {}
    bad = 0
    for seg in segments:
        name, text = seg["name"], seg["text"]
        srt = os.path.join(args.srt_dir, name + ".srt")
        if not os.path.exists(srt):
            print(f"[MISS] {name}: 找不到 {srt}")
            bad += 1
            continue
        cues = parse_srt(srt)
        out, warn = build_one(text, cues)
        if warn:
            print(f"[FAIL] {name}: {warn}")
            bad += 1
            continue
        result[name] = out
        total = sum(c["dur"] for c in out)
        print(f"[OK]   {name}: {len(out)} 块, 覆盖 {total}f, 最长块 "
              f"{max(len(c['text']) for c in out)} 字")

    if bad:
        print(f"\n{bad} 段失败，未写文件。")
        return 1
    if args.check:
        print("\n[check] 对齐全部通过，未写文件。")
        return 0

    body = json.dumps(result, ensure_ascii=False, indent=2)
    # JSON 是合法 TS 字面量，直接内联成常量
    ts = (
        "// 自动生成，请勿手改：由 build-captions.py 依据 public/audio/tts/*.srt 生成。\n"
        "// from/dur 单位为帧（30fps），相对所属分镜的起点。\n"
        "export type CaptionCue = { from: number; dur: number; text: string };\n\n"
        "export const CAPTIONS: Record<string, CaptionCue[]> = "
        + body
        + ";\n"
    )
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        f.write(ts)
    print(f"\n已写入 {args.out}")

    # ── 卡点表：动画帧号一律从"词被念到的时刻"反推 ────────────────────────
    anchors = {}
    missing = []
    for key, seg_name, phrase in ANCHORS:
        seg = next((s for s in segments if s["name"] == seg_name), None)
        if seg is None:
            missing.append(f"{key}: 没有分镜 {seg_name}")
            continue
        cues = parse_srt(os.path.join(args.srt_dir, seg_name + ".srt"))
        rng = phrase_frames(seg["text"], cues, phrase)
        if rng is None:
            missing.append(f"{key}: 旁白里找不到「{phrase}」")
            continue
        anchors[key] = {"abs": SHOTS[seg_name] + rng[0], "rel": rng[0], "end": rng[1]}

    lines = [
        "// 自动生成，请勿手改：由 build-captions.py 依据 public/audio/tts/*.srt 生成。",
        "//",
        "// 卡点表：每个动画元素该在第几帧出场，由「那个词被念到的时刻」决定，",
        "// 不是拍脑袋定的帧号（第一版就是拍脑袋，大字比旁白早 1.5–7.7s，观众读作对不上）。",
        "// abs = 全片绝对帧号；rel/end = 相对所属分镜起点的帧号。",
        "",
        "export type Anchor = { abs: number; rel: number; end: number };",
        "",
        "export const SHOT_START: Record<string, number> = "
        + json.dumps(SHOTS, ensure_ascii=False, indent=2)
        + ";",
        "",
        "export const A: Record<string, Anchor> = "
        + json.dumps(anchors, ensure_ascii=False, indent=2)
        + ";",
        "",
    ]
    nar_path = os.path.join(os.path.dirname(args.out), "narration.ts")
    with open(nar_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"已写入 {nar_path}（{len(anchors)} 个卡点）")
    if missing:
        print("\n未解析的卡点（需要修正措辞）：")
        for m in missing:
            print("  - " + m)
    return 0


if __name__ == "__main__":
    sys.exit(main())
