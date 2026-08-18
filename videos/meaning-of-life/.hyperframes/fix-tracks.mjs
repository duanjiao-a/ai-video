import { readFileSync, writeFileSync } from "node:fs";
const files = [
  "d:/APP/trae/traeProject/ai-video/videos/meaning-of-life/compositions/frames/01-question.html",
  "d:/APP/trae/traeProject/ai-video/videos/meaning-of-life/compositions/frames/06-now.html",
];
for (const p of files) {
  let s = readFileSync(p, "utf8");
  let i = 0;
  s = s.replace(/data-track-index="[0-9]+"/g, () => `data-track-index="${i++}"`);
  writeFileSync(p, s, "utf8");
  const m = s.match(/data-track-index="[0-9]+"/g) || [];
  console.log(p.split("/").pop() + " -> " + m.join(" "));
}