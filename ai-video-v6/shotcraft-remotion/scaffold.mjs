// shotcraft-remotion 脚手架：一键新建三源流水线视频项目
//
// 用法：
//   node scaffold.mjs --out <项目路径> [--sfx] [--install] [--force]
//
// 选项：
//   --out <path>    项目目录（如 videos/my-video）。package 名取目录名。
//   --sfx           把工具库 audio/sfx/ 全部拷入项目 public/audio/sfx/（约 12MB）
//   --install       拷完后在项目内自动执行 npm install
//   --force         覆盖已存在的非空目录（默认拒绝）
//
// 示例：
//   node scaffold.mjs --out ../videos/spongebob-economy --sfx --install
//
// 产物：
//   <out>/
//     package.json / remotion.config.ts / tsconfig.json / .gitignore
//     src/index.ts / src/Root.tsx
//     src/skeleton/        ← 三源流水线骨架（Main/Scenes/SceneBg/BigText/Caption/style…）
//     src/lib/             ← 通用 Remotion 组件（PageCam/DigitRoll/FlashCut/…）
//     public/textures/     ← 生图输出目录（scripts/generate-textures.mjs --out 指向这里）
//     public/audio/tts/    ← TTS 输出目录（scripts/generate-tts.py --out 指向这里）
//     public/audio/sfx/    ← --sfx 时拷入 SFX 库
//     public/clips/        ← 真实视频素材（ClipCard 用）
//     props-nobgm.json     ← 渲无 BGM 版：--props=props-nobgm.json
//     DESIGN.md            ← 分镜表模板

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const TOOLKIT_ROOT = path.resolve(import.meta.dirname);

function fail(msg) {
  console.error(`[ERROR] ${msg}`);
  process.exit(1);
}

function parseArgs(argv) {
  const get = (flag, def) => {
    const i = argv.indexOf(flag);
    return i !== -1 && argv[i + 1] ? argv[i + 1] : def;
  };
  return {
    out: get("--out", ""),
    sfx: argv.includes("--sfx"),
    install: argv.includes("--install"),
    force: argv.includes("--force"),
  };
}

const opt = parseArgs(process.argv.slice(2));
if (!opt.out) fail("缺少 --out <项目路径>");

const OUT = path.resolve(opt.out);
if (fs.existsSync(OUT) && fs.readdirSync(OUT).length > 0 && !opt.force) {
  fail(`目标目录已存在且非空: ${OUT}\n  加 --force 覆盖，或换个目录名。`);
}

// ── 1. 拷贝 Remotion 骨架 ───────────────────────────────────────────────────
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(path.join(TOOLKIT_ROOT, "remotion"), OUT, { recursive: true });
console.log(`[OK] 骨架已拷贝 → ${OUT}`);

// ── 2. 铺资源目录 ───────────────────────────────────────────────────────────
const assetDirs = ["public/textures", "public/audio/tts", "public/audio/sfx", "public/clips"];
for (const d of assetDirs) {
  fs.mkdirSync(path.join(OUT, d), { recursive: true });
}
console.log(`[OK] 资源目录: ${assetDirs.join(", ")}`);

// ── 3. SFX 库（可选） ───────────────────────────────────────────────────────
if (opt.sfx) {
  const sfxSrc = path.join(TOOLKIT_ROOT, "audio", "sfx");
  const sfxDest = path.join(OUT, "public", "audio", "sfx");
  fs.cpSync(sfxSrc, sfxDest, { recursive: true });
  const n = fs.readdirSync(sfxSrc, { recursive: true }).filter((f) => fs.statSync(path.join(sfxSrc, f)).isFile()).length;
  console.log(`[OK] SFX 库已拷入 public/audio/sfx/（${n} 个文件）`);
} else {
  console.log(`[..] 未拷 SFX；需要时: node ${path.join(TOOLKIT_ROOT, "scaffold.mjs")} --out ${opt.out} --sfx 或手动拷贝`);
}

// ── 4. package.json 改名 + props-nobgm.json + DESIGN.md ────────────────────
const pkgPath = path.join(OUT, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
pkg.name = path.basename(OUT).toLowerCase().replace(/[^a-z0-9-]+/g, "-");
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`[OK] package.json name = ${pkg.name}`);

fs.writeFileSync(path.join(OUT, "props-nobgm.json"), JSON.stringify({ bgm: false }, null, 2) + "\n");

const designStub = `# ${path.basename(OUT)} — 设计 spec

> 三源流水线：RunningHub 生图 → EdgeTTS 旁白 → Remotion 动画。参考骨架 src/skeleton/。

## 一、基础信息

| 项 | 值 |
|---|---|
| 规格 | 1920×1080 @ 30fps，____ 帧（____s） |
| 画幅 | 16:9 横屏 |
| 风格 | ____ |
| 生图 | RunningHub API（1k / low，16:9） |
| 旁白 | edge-tts，zh-CN-XiaoxiaoNeural，+20% |

## 二、视觉 tokens

- **色板**：____
- **字体**：____
- **动效性格**：____
- **运镜**：每场景背景 scale 1.00 → 1.04/1.05 线性缓推

## 三、分镜表

| # | shot | from | dur | 背景图 | 画面内容 | 屏幕大字 |
|---|------|------|-----|--------|----------|----------|
| 1 | open | 0 | 100 | bg-open | ____ | ____ |

## 四、底部字幕（与 TTS 旁白对齐）

| 帧区间 | 字幕 |
|---|---|
| ____ | ____ |

## 五、音频方案

- **TTS 旁白**：6 段 mp3 + srt 存 public/audio/tts/（scripts/generate-tts.py）
- **BGM**：____（音量 0.3，首尾淡入淡出；终渲两版带/无 BGM）
- **SFX 钉帧表**：见 src/skeleton/Main.tsx

## 六、素材清单（RunningHub，1k/low，16:9）

| 文件 | 场景 |
|---|---|
| bg-open.png | ____ |
`;
fs.writeFileSync(path.join(OUT, "DESIGN.md"), designStub);
console.log(`[OK] props-nobgm.json + DESIGN.md 已生成`);

// ── 5. npm install（可选） ──────────────────────────────────────────────────
if (opt.install) {
  console.log(`[..] npm install ...`);
  const r = spawnSync("npm", ["install"], { cwd: OUT, stdio: "inherit", shell: true });
  if (r.status !== 0) {
    console.error(`[ERROR] npm install 失败（可稍后在项目内手动执行）`);
    process.exit(r.status || 1);
  }
  console.log(`[OK] npm install 完成`);
}

// ── 6. 下一步指引 ───────────────────────────────────────────────────────────
console.log(`\n========== 项目已就绪: ${OUT} ==========`);
console.log(`1. 写 DESIGN.md 分镜表`);
console.log(`2. 生背景图: node ${path.join(TOOLKIT_ROOT, "scripts", "generate-textures.mjs")} --manifest textures.json --out ${path.join(OUT, "public", "textures")}`);
console.log(`3. 生旁白:   python ${path.join(TOOLKIT_ROOT, "scripts", "generate-tts.py")} --segments segments.json --out ${path.join(OUT, "public", "audio", "tts")}`);
console.log(`4. 预览:     npm run dev   （在项目目录内）`);
console.log(`5. 渲染:     npm run render && npm run render:nobgm`);
console.log(`6. 镜头卡库: ${path.join(TOOLKIT_ROOT, "cards")}（cards/library.json 校验卡名 → cards/shots/ 卡片 → cards/demos/ 源码）`);
