import { readFileSync, writeFileSync } from "node:fs";
const storyboard = readFileSync("STORYBOARD.md", "utf8");
const voices = { 1: 7.573, 2: 7.893, 3: 7.275, 4: 7.061, 5: 8.299, 6: 9.024 };
let lines = storyboard.split(/\r?\n/);
let cur = null;
for (let i = 0; i < lines.length; i++) {
  const h = lines[i].match(/^## Frame (\d+)/);
  if (h) { cur = Number(h[1]); continue; }
  if (cur != null && voices[cur]) {
    const m = lines[i].match(/^(\s*[-*]\s+duration\s*:\s*).*/);
    if (m) { lines[i] = `${m[1]}${(voices[cur] + 2).toFixed(3)}s`; delete voices[cur]; }
  }
}
writeFileSync("STORYBOARD.md", lines.join("\n"));
console.log("durations padded +2s per frame");