import { readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
const P = "d:/APP/trae/traeProject/ai-video/videos/meaning-of-life/";
// 1) remove leftover worker test files
for (const f of ["compositions/frames/_probe.html", "compositions/frames/_wtest.html", "compositions/frames/.writetest.html"]) {
  if (existsSync(P + f)) { rmSync(P + f); console.log("deleted " + f); }
}
// 2) 04-twist: add data-composition-id to the #root div
{
  const p = P + "compositions/frames/04-twist.html";
  let s = readFileSync(p, "utf8");
  if (!s.includes('<div id="root" data-composition-id')) {
    s = s.replace('<div id="root" class="clip"', '<div id="root" data-composition-id="04-twist" class="clip"');
    writeFileSync(p, s, "utf8");
    console.log("04-twist: composition-id added to root div");
  } else { console.log("04-twist: already ok"); }
}
// 3) caption skin: insert @font-face declarations (idempotent)
{
  const p = P + ".hyperframes/caption-skin.html";
  let s = readFileSync(p, "utf8");
  if (!s.includes('@font-face')) {
    const block = "@font-face { font-family: \"HfDisplaySerif\"; src: local(\"STZhongsong\"); font-weight: 400; font-style: normal; }\n  @font-face { font-family: \"HfDisplaySerif\"; src: local(\"STZhongsong\"); font-weight: 700; font-style: normal; }\n  @font-face { font-family: \"HfBodySans\"; src: local(\"Microsoft YaHei\"); font-weight: 400; font-style: normal; }\n  @font-face { font-family: \"HfBodySans\"; src: local(\"Microsoft YaHei\"); font-weight: 700; font-style: normal; }\n";
    s = s.replace("<style>", "<style>\n  " + block);
    writeFileSync(p, s, "utf8");
    console.log("caption skin: @font-face inserted");
  } else { console.log("caption skin: already has @font-face"); }
  if (!s.includes('"HfDisplaySerif", "STZhongsong", "SimSun"')) {
    s = s.replace('var(--font-display, "Instrument Serif"), Georgia, serif', 'var(--font-display, "Instrument Serif"), "HfDisplaySerif", "STZhongsong", "SimSun", Georgia, serif');
    writeFileSync(p, s, "utf8");
    console.log("caption skin: display fallback patched");
  }
  if (!s.includes('"HfBodySans", ui-monospace')) {
    s = s.replace('var(--font-body, "JetBrains Mono"), ui-monospace, monospace', 'var(--font-body, "JetBrains Mono"), "HfBodySans", ui-monospace, monospace');
    writeFileSync(p, s, "utf8");
    console.log("caption skin: body fallback patched");
  }
}