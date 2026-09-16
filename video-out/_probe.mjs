import fs from "node:fs";
const p = "./video-out/Minimax-Hs-TEST/2099420876452876289-214.mp4";
const b = fs.readFileSync(p);
function parseVerAtom(i, atom) {
  const v = b[i + 4];
  if (v === 1) {
    const bs = i + 4;
    // version(1)+flags(3)+creation(8)+modification(8)+timescale(4)+duration(8)
    const ts = b.readUInt32BE(bs + 20);
    const d = Number(b.readBigUInt64BE(bs + 24));
    return { ts, d };
  } else {
    // version(1)+flags(3)+creation(4)+modification(4)+timescale(4)+duration(4)
    const ts = b.readUInt32BE(i + 20);
    const d = b.readUInt32BE(i + 24);
    return { ts, d };
  }
}
for (let i = 0; i < b.length - 8; i++) {
  if (b.toString("latin1", i, i + 4) === "mvhd") {
    const r = parseVerAtom(i, "mvhd");
    console.log("mvhd -> timescale:", r.ts, "duration:", r.d, "秒:", (r.d / r.ts).toFixed(2));
  }
  if (b.toString("latin1", i, i + 4) === "mdhd") {
    const r = parseVerAtom(i, "mdhd");
    console.log("mdhd -> timescale:", r.ts, "duration:", r.d, "秒:", (r.d / r.ts).toFixed(2));
  }
}
// 估计帧数：统计 stss 数量（关键帧）
let stssCount = -1;
for (let i = 0; i < b.length - 8; i++) {
  if (b.toString("latin1", i, i + 4) === "stss") {
    const n = b.readUInt32BE(i + 8);
    stssCount = n;
  }
}
console.log("stss(关键帧sample数):", stssCount);
function traverse(topStart, topEnd, depth) {
  let o = topStart;
  while (o < topEnd - 8) {
    const sz = b.readUInt32BE(o);
    const t = b.toString("latin1", o + 4, o + 8);
    console.log("  ".repeat(depth) + t + " sz=" + sz);
    if (sz < 8) break;
    o += sz;
  }
}
let moovStart = -1;
for (let o = 0; o < b.length - 8;) { const sz = b.readUInt32BE(o); const t = b.toString("latin1", o + 4, o + 8); if (t === "moov") moovStart = o; if (sz < 8) break; o += sz; }
traverse(moovStart, moovStart + 400, 1);