#!/usr/bin/env node
// tts-edge.mjs — regenerate narration with Microsoft Edge TTS (edge-tts protocol).
// Reads SCRIPT.md, synthesizes each line with zh-CN-XiaoxiaoNeural (晓晓),
// converts to 44.1k mono wav into assets/voice/NN.wav, collects real
// word-boundary timings, and prints a JSON summary for metadata updates.
//
//   node .hyperframes/tts-edge.mjs [--rate -0.05] [--voice zh-CN-XiaoxiaoNeural]
//
// Output JSON: [{ id, path, duration_s, words: [{text,start,end}] }]

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(HERE, "..");
const SCRIPT_PATH = join(PROJECT, "SCRIPT.md");
const VOICE_DIR = join(PROJECT, "assets", "voice");
const FFMPEG = join(HERE, "bin", "ffmpeg.exe");
const TMP_DIR = join(PROJECT, ".hyperframes", ".tts-edge-tmp");

const flag = (argv, name, def) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : def;
};
// rate is a RELATIVE delta (e.g. -0.05 = 5% slower); SSML gets the multiplier (0.95).
const rateDelta = Number(flag(process.argv.slice(2), "rate", "0")) || 0;
const voice = flag(process.argv.slice(2), "voice", "zh-CN-XiaoxiaoNeural");

// SCRIPT.md → [{ frame, text }] — same grammar as the skill's audio.mjs.
function parseScript(md) {
  const out = [];
  let cur = null;
  const flush = () => {
    if (cur && cur.text.trim()) out.push({ frame: cur.frame, text: cur.text.trim() });
    cur = null;
  };
  for (const line of md.split(/\r?\n/)) {
    const h = line.match(/^#{2,3}\s+.*?\(frame\s+(\d+)\)/i);
    if (h) {
      flush();
      cur = { frame: Number(h[1]), text: "" };
      continue;
    }
    if (!cur) continue;
    if (/^\s*\*\*/.test(line)) continue;
    const m = line.match(/^(?: {4,}|\t)(.+)$/);
    if (m) cur.text += (cur.text ? " " : "") + m[1].trim();
  }
  flush();
  return out;
}

const xmlEscape = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const pad2 = (n) => String(n).padStart(2, "0");

function convertToWav(tmpMp3, outWav) {
  const r = spawnSync(
    FFMPEG,
    ["-y", "-loglevel", "error", "-i", tmpMp3, "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le", outWav],
    { stdio: "pipe" },
  );
  if (r.status !== 0 || !existsSync(outWav)) {
    throw new Error(`ffmpeg failed: ${String(r.stderr ?? "").slice(-300)}`);
  }
}

function wavDuration(outWav) {
  const probe = join(HERE, "bin", "ffprobe.exe");
  try {
    const out = execFileSync(
      probe,
      ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", outWav],
      { encoding: "utf8" },
    );
    return parseFloat(out.trim());
  } catch {
    const r = spawnSync(FFMPEG, ["-i", outWav], { encoding: "utf8" });
    const m = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(r.stderr ?? "");
    if (!m) throw new Error("cannot read duration");
    return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  }
}

const lines = parseScript(readFileSync(SCRIPT_PATH, "utf8"));
if (!lines.length) {
  console.error("no narration lines found in SCRIPT.md");
  process.exit(1);
}

mkdirSync(VOICE_DIR, { recursive: true });
rmSync(TMP_DIR, { recursive: true, force: true });
mkdirSync(TMP_DIR, { recursive: true });

const tts = new MsEdgeTTS();
await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, {
  wordBoundaryEnabled: true,
});

const results = [];
try {
  for (const l of lines) {
    const id = pad2(l.frame);
    const outWav = join(VOICE_DIR, `${id}.wav`);
    const lineDir = join(TMP_DIR, id);
    mkdirSync(lineDir, { recursive: true });
    process.stdout.write(`· synth line ${id} (${l.text.length} chars)… `);
    // toFile handles the WebSocket stream lifecycle (audio + boundary metadata).
    const { audioFilePath, metadataFilePath } = await tts.toFile(
      lineDir,
      xmlEscape(l.text),
      rateDelta ? { rate: 1 + rateDelta } : undefined,
    );
    const words = [];
    if (metadataFilePath && existsSync(metadataFilePath)) {
      const meta = JSON.parse(readFileSync(metadataFilePath, "utf8"));
      for (const entry of meta.Metadata ?? []) {
        if (entry.Type === "WordBoundary" && entry.Data?.text?.Text) {
          words.push({
            text: entry.Data.text.Text,
            start: entry.Data.Offset / 1e7,
            end: (entry.Data.Offset + entry.Data.Duration) / 1e7,
          });
        }
      }
    }
    convertToWav(audioFilePath, outWav);
    const duration_s = wavDuration(outWav);
    results.push({ id, frame: l.frame, path: `assets/voice/${id}.wav`, duration_s, words });
    process.stdout.write(`ok ${duration_s.toFixed(3)}s · ${words.length} words\n`);
  }
} finally {
  tts.close();
  rmSync(TMP_DIR, { recursive: true, force: true });
}

// Persist the machine-readable result for the metadata update step.
const OUT = join(HERE, "tts-edge-result.json");
writeFileSync(OUT, JSON.stringify(results, null, 2));
console.log(`✓ results → ${OUT}`);
console.log(JSON.stringify(results, null, 2));
