import { readFileSync, writeFileSync } from "node:fs";
const P = "d:/APP/trae/traeProject/ai-video/videos/meaning-of-life/";
// 04-twist: drop class="clip" from the root div
{
  const p = P + "compositions/frames/04-twist.html";
  let s = readFileSync(p, "utf8");
  s = s.replace('<div id="root" data-composition-id="04-twist" class="clip"', '<div id="root" data-composition-id="04-twist"');
  writeFileSync(p, s, "utf8");
  console.log("04-twist: root clip class removed");
}
// caption skin: add @font-face for the token-flattened families
{
  const p = P + ".hyperframes/caption-skin.html";
  let s = readFileSync(p, "utf8");
  const extra = "@font-face { font-family: \"Instrument Serif\"; src: local(\"STZhongsong\"); font-weight: 400; font-style: normal; }\n  @font-face { font-family: \"Archivo\"; src: local(\"Microsoft YaHei\"); font-weight: 400; font-style: normal; }\n  @font-face { font-family: \"STZhongsong\"; src: local(\"STZhongsong\"); font-weight: 400; font-style: normal; }\n  @font-face { font-family: \"SimSun\"; src: local(\"SimSun\"); font-weight: 400; font-style: normal; }\n";
  if (!s.includes('font-family: "Instrument Serif"')) {
    s = s.replace('<style>', "<style>\n  " + extra);
    writeFileSync(p, s, "utf8");
    console.log("caption skin: extra @font-face added");
  } else { console.log("caption skin: extra @font-face already present"); }
}