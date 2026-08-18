// 捕获 Frame 1 在 t=5s 的静帧作为图生视频输入
// 用法: node .hyperframes/capture-poster.mjs
import puppeteer from "puppeteer";

const URL = "http://localhost:5173";          // npm run dev 起的地址,按实际改
const OUT = ".tmp/frame01-poster.png";
const CAPTURE_AT_MS = 5000;                   // 5s — 标题完全浮现的稳定时刻

const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.goto(URL, { waitUntil: "networkidle0" });

// 推进 GSAP timeline 到 5s
await page.evaluate((ms) => {
  const tl = window.__timelines?.["main"];
  if (tl) tl.seek(ms / 1000);
}, CAPTURE_AT_MS);

await page.screenshot({ path: OUT, type: "png", clip: { x: 0, y: 0, width: 1920, height: 1080 } });
await browser.close();
console.log("poster saved:", OUT);
