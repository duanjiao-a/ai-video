#!/usr/bin/env node
// apply-edge-tts.mjs — fold the edge-tts synthesis results into the project:
//   1. audio_engine_meta.json — provider/voice/durations/words/total
//   2. audio_meta.json        — frame-keyed voices with real word timings
//   3. STORYBOARD.md          — per-frame duration lines
// The index.html timeline is updated separately (simple value swaps).

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(HERE, "..");
const r3 = (x) => Number(x.toFixed(3));

const results = JSON.parse(readFileSync(join(HERE, "tts-edge-result.json"), "utf8"));
const byId = new Map(results.map((r) => [r.id, r]));

// ── timeline ────────────────────────────────────────────────────────────────
// Convention used by the existing index.html: voice i starts at S_i; the next
// scene starts S_i + d_i + 2.0; scene duration = d + 2.5 (last: + 2.0); audio
// element duration = d + 2.0; total = last start + last audio duration.
const durs = ["01", "02", "03", "04", "05", "06"].map((id) => byId.get(id).duration_s);
const starts = [];
let acc = 0;
for (let i = 0; i < durs.length; i++) {
  starts.push(acc);
  acc += durs[i] + 2.0;
}
const audioDur = durs.map((d) => d + 2.0);
const sceneDur = durs.map((d, i) => d + (i === durs.length - 1 ? 2.0 : 2.5));
const total = r3(starts[starts.length - 1] + audioDur[audioDur.length - 1]);

// ── 1. audio_engine_meta.json ──────────────────────────────────────────────
const enginePath = join(PROJECT, "audio_engine_meta.json");
const engine = JSON.parse(readFileSync(enginePath, "utf8"));
engine.tts_provider = "edge-tts";
engine.voice_id = "zh-CN-XiaoxiaoNeural";
engine.voices = results.map((r) => ({
  id: r.id,
  path: r.path,
  duration_s: r3(r.duration_s),
  words: r.words.map((w) => ({
    text: w.text,
    start: r3(w.start),
    end: r3(w.end),
  })),
}));
engine.total_duration_s = total;
if (engine.bgm) engine.bgm.duration_s = total;
if (engine.bgm_target_duration_s != null) engine.bgm_target_duration_s = total;
writeFileSync(enginePath, JSON.stringify(engine, null, 2));

// ── 2. audio_meta.json (frame-keyed) ───────────────────────────────────────
const metaPath = join(PROJECT, "audio_meta.json");
const meta = JSON.parse(readFileSync(metaPath, "utf8"));
meta.bgm.duration_s = total;
meta.voices = results.map((r) => ({
  frame: r.frame,
  path: r.path,
  duration_s: r3(r.duration_s),
  words: r.words.map((w) => ({
    id: `w${r.words.indexOf(w)}`,
    text: w.text,
    start: r3(w.start),
    end: r3(w.end),
  })),
}));
writeFileSync(metaPath, JSON.stringify(meta, null, 2));

// ── 3. STORYBOARD.md durations ─────────────────────────────────────────────
const storyPath = join(PROJECT, "STORYBOARD.md");
const storyRaw = readFileSync(storyPath, "utf8");
const lines = storyRaw.split(/\r?\n/);
const FRAME_RE = /^#{2,3}\s+(?:frame|beat|scene)\b.*?(\d+)/i;
const DUR_RE = /^(\s*[-*]\s+duration\s*:\s*).*/i;
let cur = null;
let updated = 0;
const durByFrame = new Map(results.map((r) => [r.frame, r3(audioDur[results.indexOf(r)])]));
for (let i = 0; i < lines.length; i++) {
  const h = lines[i].match(FRAME_RE);
  if (h) {
    cur = Number(h[1]);
    continue;
  }
  if (cur != null && durByFrame.has(cur)) {
    const m = lines[i].match(DUR_RE);
    if (m) {
      lines[i] = `${m[1]}${durByFrame.get(cur)}s`;
      durByFrame.delete(cur);
      updated++;
    }
  }
}
writeFileSync(storyPath, lines.join("\n"));

console.log(`✓ apply-edge-tts: ${results.length} voices · total ${total}s · storyboard ${updated} durations`);
console.log(JSON.stringify({
  durs: durs.map((d) => r3(d)),
  starts: starts.map(r3),
  audioDur: audioDur.map(r3),
  sceneDur: sceneDur.map(r3),
  total,
}, null, 2));
