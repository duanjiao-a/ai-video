// 逐帧体检：解码 QA 截帧，量每个横带的细节密度 / 亮度 / 饱和度。
//
// 为什么需要它：Remotion 只保证"渲出来了"，不保证"画面对"。
// aesthetic-rules P1 要求交付前自己渲染截帧逐一检查；本脚本把"检查"里
// 能自动化的部分（有没有字、字在不在该在的带里、是不是一片黑）量出来，
// 人眼只需要看剩下那部分（角色形象、画风、字读不读得顺）。
//
// 用法: node qa-frames.mjs out/qa
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not png");
  let off = 8;
  let ihdr = null;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      ihdr = {
        w: data.readUInt32BE(0),
        h: data.readUInt32BE(4),
        depth: data[8],
        color: data[9],
        interlace: data[12],
      };
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    off += 12 + len;
  }
  if (!ihdr) throw new Error("no IHDR");
  if (ihdr.depth !== 8) throw new Error("unsupported bitDepth " + ihdr.depth);
  if (ihdr.interlace !== 0) throw new Error("interlaced unsupported");
  const ch = { 0: 1, 2: 3, 4: 2, 6: 4 }[ihdr.color];
  if (!ch) throw new Error("unsupported colorType " + ihdr.color);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const w = ihdr.w;
  const h = ihdr.h;
  const stride = w * ch;
  const out = Buffer.alloc(stride * h);
  const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0;
      const b = prev ? prev[i] : 0;
      const c = prev && i >= ch ? prev[i - ch] : 0;
      let v = line[i];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) v += paeth(a, b, c);
      cur[i] = v & 0xff;
    }
  }
  return { w, h, ch, px: out };
}

/** 横带定义：与画面布局约定对齐（上方大字区 / 中段角色区 / 底部字幕区） */
const BANDS = [
  ["topA", 0.0, 0.13], // 大字主行
  ["topB", 0.13, 0.27], // 大字副行 / 顶部 pill
  ["midA", 0.27, 0.5], // 信息卡 / 名词条
  ["midB", 0.5, 0.8], // 角色主体
  ["bot", 0.8, 1.0], // 字幕条
];

function analyze(file) {
  const img = decodePng(fs.readFileSync(file));
  const { w, h, ch, px } = img;
  const lum = new Float32Array(w * h);
  let satSum = 0;
  let satN = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * ch;
      const r = px[i];
      const g = px[i + 1];
      const b = px[i + 2];
      lum[y * w + x] = 0.299 * r + 0.587 * g + 0.114 * b;
      if ((x + y) % 5 === 0) {
        const mx = Math.max(r, g, b);
        const mn = Math.min(r, g, b);
        satSum += mx === 0 ? 0 : (mx - mn) / mx;
        satN++;
      }
    }
  }
  // 白字占比：白字 + 深色描边是本片唯一的高亮像素来源（背景被顶部 scrim 压暗），
  // 所以"亮于 205 的像素占比"是"这一带有没有字"最直接的证据。
  const white = (y0f, y1f) => {
    const y0 = Math.floor(h * y0f);
    const y1 = Math.floor(h * y1f);
    let c = 0;
    let n = 0;
    for (let y = y0; y < y1; y++) {
      for (let x = 0; x < w; x++) {
        if (lum[y * w + x] > 205) c++;
        n++;
      }
    }
    return c / n;
  };

  // 字幕条的水平占位：在字幕带里找最左/最右的白像素，换算成屏宽百分比。
  // 用途：验证字幕居中（左留白 ≈ 右留白）且没有溢出画面边界。
  // 只扫字幕 pill 自己占的那几行（bottom:34 + 内容高约 76px ⇒ 84.6%–95.3% 帧高），
  // 否则会扫到 pill 上下的背景亮部，把"字幕占位"量成背景亮斑的位置。
  const captionSpan = () => {
    const y0 = Math.floor(h * 0.855);
    const y1 = Math.floor(h * 0.945);
    let minX = w;
    let maxX = -1;
    for (let y = y0; y < y1; y++) {
      for (let x = 0; x < w; x++) {
        if (lum[y * w + x] > 205) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }
    if (maxX < 0) return null;
    return { left: minX / w, right: 1 - maxX / w };
  };

  const rows = {};
  for (const [name, y0f, y1f] of BANDS) {
    const y0 = Math.floor(h * y0f);
    const y1 = Math.floor(h * y1f);
    let e = 0;
    let n = 0;
    let l = 0;
    for (let y = Math.max(1, y0); y < Math.min(h - 1, y1); y += 2) {
      for (let x = 1; x < w - 1; x += 2) {
        e += Math.abs(lum[y * w + x + 1] - lum[y * w + x - 1]);
        e += Math.abs(lum[(y + 1) * w + x] - lum[(y - 1) * w + x]);
        l += lum[y * w + x];
        n++;
      }
    }
    rows[name] = { edge: e / n, lum: l / n };
  }
  return {
    w,
    h,
    sat: satSum / satN,
    rows,
    whiteTop: white(0.0, 0.3),
    whiteBot: white(0.78, 1.0),
    span: captionSpan(),
  };
}

const dir = process.argv[2] || "out/qa";
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".png"))
  .sort();
console.log(`目录: ${path.resolve(dir)}  (${files.length} 帧)\n`);
const head = ["帧", "大字区", "副行区", "信息卡", "角色区", "字幕区", "白字↑", "白字↓", "左留白", "右留白", "亮度", "饱和"];
console.log(head.map((s, i) => s.padEnd(i === 0 ? 10 : 9)).join(""));
let warn = 0;
for (const f of files) {
  const r = analyze(path.join(dir, f));
  const v = [r.rows.topA.edge, r.rows.topB.edge, r.rows.midA.edge, r.rows.midB.edge, r.rows.bot.edge];
  const lum = (r.rows.midB.lum + r.rows.topA.lum) / 2;
  const cells = [
    f.replace(/^f|\.png$/g, ""),
    ...v.map((x) => x.toFixed(1)),
    (r.whiteTop * 100).toFixed(2),
    (r.whiteBot * 100).toFixed(2),
    r.span ? (r.span.left * 100).toFixed(1) : "-",
    r.span ? (r.span.right * 100).toFixed(1) : "-",
    lum.toFixed(0),
    r.sat.toFixed(2),
  ];
  const flags = [];
  // 画面不该是一片黑/一片白
  if (lum < 40) flags.push("过暗");
  if (lum > 225) flags.push("过曝");
  // 上方 0–30% 是屏幕大字区：得有白字
  if (r.whiteTop < 0.002) flags.push("无大字?");
  // 下方 78–100% 是字幕条：得有白字与白描边
  if (r.whiteBot < 0.002) flags.push("无字幕?");
  // 字幕条左右留白应当对称（居中）且不为 0（未顶到画面边界）
  if (r.span) {
    if (Math.abs(r.span.left - r.span.right) > 0.06) flags.push("字幕偏心?");
    if (r.span.left < 0.008 || r.span.right < 0.008) flags.push("字幕贴边?");
  }
  if (flags.length) warn++;
  console.log(
    cells.map((s, i) => String(s).padEnd(i === 0 ? 10 : 9)).join("") +
      (flags.length ? "  <== " + flags.join(" ") : ""),
  );
}
console.log(`\n${warn} / ${files.length} 帧带告警（告警只说明"该带没有细节"，需要人眼确认是不是设计如此）`);
