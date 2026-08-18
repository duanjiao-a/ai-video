#!/usr/bin/env node
// gen-tts.mjs — Simple TTS generation using msedge-tts toStream
// Reads SCRIPT.md, synthesizes each line, converts to WAV.

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, createWriteStream } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(HERE, "..");
const SCRIPT_PATH = join(PROJECT, "SCRIPT.md");
const VOICE_DIR = join(PROJECT, "assets", "voice");
const FFMPEG = join(HERE, "bin", "ffmpeg.exe");
const FFPROBE = join(HERE, "bin", "ffprobe.exe");

const voice = "zh-CN-XiaoxiaoNeural";
const rateDelta = -0.05; // 5% slower

function parseScript(md) {
  const out = [];
  let cur = null;
  const flush = () => {
    if (cur && cur.text.trim()) out.push({ frame: cur.frame, text: cur.text.trim() });
    cur = null;
  };
  for (const line of md.split(/\r?\n/)) {
    const h = line.match(/^#{2,3}\s+.*?\(frame\s+(\d+)\)/i);
    if (h) { flush(); cur = { frame: Number(h[1]), text: "" }; continue; }
    if (!cur) continue;
    if (/^\s*\*\*/.test(line)) continue;
    const m = line.match(/^(?: {4,}|\t)(.+)$/);
    if (m) cur.text += (cur.text ? " " : "") + m[1].trim();
  }
  flush();
  return out;
}

function wavDuration(outWav) {
  try {
    const out = execFileSync(FFPROBE,
      ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", outWav],
      { encoding: "utf8" });
    return parseFloat(out.trim());
  } catch {
    return 0;
  }
}

const pad2 = (n) => String(n).padStart(2, "0");
const xmlEscape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const lines = parseScript(readFileSync(SCRIPT_PATH, "utf8"));
if (!lines.length) { console.error("no narration lines found"); process.exit(1); }

mkdirSync(VOICE_DIR, { recursive: true });

const results = [];
for (const l of lines) {
  const id = pad2(l.frame);
  const outWav = join(VOICE_DIR, `${id}.wav`);
  const tmpMp3 = join(VOICE_DIR, `${id}.tmp.mp3`);
  process.stdout.write(`· synth line ${id} (${l.text.length} chars)… `);

  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

  const { audioStream } = tts.toStream(xmlEscape(l.text), rateDelta ? { rate: 1 + rateDelta } : undefined);

  await new Promise((resolve, reject) => {
    const ws = createWriteStream(tmpMp3);
    audioStream.on("data", (chunk) => ws.write(chunk));
    audioStream.on("end", () => { ws.end(); resolve(); });
    audioStream.on("error", reject);
    ws.on("error", reject);
  });

  tts.close();

  // Convert mp3 to wav
  const r = spawnSync(FFMPEG,
    ["-y", "-loglevel", "error", "-i", tmpMp3, "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le", outWav],
    { stdio: "pipe" });

  if (r.status !== 0 || !existsSync(outWav)) {
    console.error(`FAIL: ${String(r.stderr ?? "").slice(-200)}`);
    process.exit(1);
  }

  // Clean up temp mp3
  try { require("fs").unlinkSync(tmpMp3); } catch {}

  const duration_s = wavDuration(outWav);
  results.push({ id, frame: l.frame, path: `assets/voice/${id}.wav`, duration_s });
  process.stdout.write(`ok ${duration_s.toFixed(3)}s\n`);
}

const OUT = join(HERE, "tts-result.json");
writeFileSync(OUT, JSON.stringify(results, null, 2));
console.log(`\n✓ ${results.length} voices generated → ${OUT}`);
console.log(JSON.stringify(results, null, 2));
