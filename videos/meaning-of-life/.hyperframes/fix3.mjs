import { readFileSync, writeFileSync } from "node:fs";
const P = "d:/APP/trae/traeProject/ai-video/videos/meaning-of-life/compositions/frames/";
// 1) rename digit-prefixed element ids (keep data-composition-id untouched)
const renames = { "04-twist-": "f04twist-", "06-now-": "f06now-" };
for (const [from, to] of Object.entries(renames)) {
  const p = P + (from === "04-twist-" ? "04-twist.html" : "06-now.html");
  let s = readFileSync(p, "utf8");
  const before = (s.match(new RegExp(from.replace("-", "\\-"), "g")) || []).length;
  s = s.split(from).join(to);
  writeFileSync(p, s, "utf8");
  console.log(`${from.replace("-", "")}: renamed ${before} occurrences -> ${to}`);
  if (s.includes(`data-composition-id="${from.slice(0, 2)}-${from.slice(2, -1)}"`)) {
    console.log("  (data-composition-id preserved)");
  }
}
// 2) mark decorative watermark text with data-layout-ignore
{
  const p = P + "01-question.html";
  let s = readFileSync(p, "utf8");
  if (!s.includes("f01q-mark") ) console.log("WARN: f01q-mark not found");
  s = s.replace(/<div id="f01q-mark"/, '<div id="f01q-mark" data-layout-ignore');
  writeFileSync(p, s, "utf8");
  console.log("01-question: mark marked data-layout-ignore");
}
{
  const p = P + "04-twist.html";
  let s = readFileSync(p, "utf8");
  s = s.replace(/<div id="f04twist-mark"/, '<div id="f04twist-mark" data-layout-ignore');
  writeFileSync(p, s, "utf8");
  console.log("04-twist: mark marked data-layout-ignore");
}