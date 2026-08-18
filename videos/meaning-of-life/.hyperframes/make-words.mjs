// make-words.mjs — phrase-level word timings for the caption karaoke.
import { readFileSync, writeFileSync } from "node:fs";
const SCRIPT = process.argv[2] ?? "./SCRIPT.md";
const META = process.argv[3] ?? "./audio_meta.json";
function parseScript(md) {
  const out = [];
  let cur = null;
  const flush = () => { if (cur && cur.text.trim()) out.push({ frame: cur.frame, text: cur.text.trim() }); cur = null; };
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
function phrases(text) {
  return text.split(/([，、；：。？！——…])/g).map((s) => s.trim()).filter(Boolean);
}
function chars(s) { return [...s].filter((c) => !/\s/.test(c)).length; }
const lines = parseScript(readFileSync(SCRIPT, "utf8"));
const byFrame = new Map(lines.map((l) => [l.frame, l.text]));
const meta = JSON.parse(readFileSync(META, "utf8"));
let totalWords = 0;
for (const v of meta.voices ?? []) {
  const text = byFrame.get(v.frame);
  if (!text) continue;
  const ps = phrases(text);
  const weights = ps.map(chars);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const dur = v.duration_s;
  let t = 0;
  const words = [];
  ps.forEach((p, i) => {
    const seg = dur * (weights[i] / total);
    words.push({ id: `w${i}`, text: p, start: +(t.toFixed(3)), end: +((t + seg).toFixed(3)) });
    t += seg;
  });
  v.words = words;
  totalWords += words.length;
}
writeFileSync(META, JSON.stringify(meta, null, 2));
console.log(`✓ make-words: ${meta.voices.length} voices, ${totalWords} phrases written → ${META}`);