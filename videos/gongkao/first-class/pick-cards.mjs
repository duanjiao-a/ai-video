// 从镜头卡库里"随机挑卡"的抽签器。
//
// 为什么要脚本抽签而不是手挑：手挑会不自觉地挑回自己熟悉的那几张（上一条
// 视频就是"大字 + 名词条"一套用到底，跟别的项目长得一样）。用固定种子抽签
// 既能保证随机性，又能复现同一组结果。
//
// 只抽**可移植**的卡：
//   - demo 用 <DesignStage>（480×270 设计坐标，等比放大，改分辨率不用动参数）
//   - 不依赖 @remotion/motion-blur（本项目没装）
//   - 不依赖 _textures/ 整页截图（本项目没有那些素材）
//
// 用法: node pick-cards.mjs [--seed 20270917]
import fs from "node:fs";
import path from "node:path";

const CARDS = path.resolve(
  "D:/APP/trae/traeProject/ai-video/ai-video-v6/shotcraft-remotion/cards",
);

const seedArg = process.argv.indexOf("--seed");
const SEED = seedArg !== -1 ? Number(process.argv[seedArg + 1]) : 20270917;

/** 确定性伪随机（同 seed 永远同一组抽签结果） */
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 抽签槽位：每个槽位限定可用的卡类别（类型对了才谈得上随机） */
const SLOTS = [
  { id: "open", want: 1, cats: ["opening", "typography"] },
  { id: "r1", want: 1, cats: ["typography", "ui-entrance", "data"] },
  { id: "r2", want: 1, cats: ["ui-entrance", "data", "interaction"] },
  { id: "r3", want: 1, cats: ["data", "effects"] },
  { id: "r4", want: 1, cats: ["interaction", "typography", "ui-entrance"] },
  { id: "outro", want: 1, cats: ["outro"] },
  { id: "cut1", want: 1, cats: ["transition"] },
  { id: "cut2", want: 1, cats: ["transition"] },
  { id: "cut3", want: 1, cats: ["transition"] },
  { id: "cut4", want: 1, cats: ["transition", "effects"] },
  { id: "cut5", want: 1, cats: ["transition", "effects"] },
];

function scan() {
  const demosRoot = path.join(CARDS, "demos");
  const out = [];
  for (const cat of fs.readdirSync(demosRoot)) {
    const catDir = path.join(demosRoot, cat);
    if (!fs.statSync(catDir).isDirectory() || cat.startsWith("_")) continue;
    for (const card of fs.readdirSync(catDir)) {
      const cardDir = path.join(catDir, card);
      if (!fs.statSync(cardDir).isDirectory()) continue;
      const files = fs
        .readdirSync(cardDir)
        .filter((f) => f.endsWith(".tsx"))
        .map((f) => path.join(cardDir, f));
      if (files.length === 0) continue;
      const blob = files.map((f) => fs.readFileSync(f, "utf-8")).join("\n");
      const portable =
        blob.includes("DesignStage") &&
        !blob.includes("motion-blur") &&
        !blob.includes("staticFile") &&
        !blob.includes("Fixtures");
      if (!portable) continue;
      const m = blob.match(/_DURATION\s*=\s*(\d+)/);
      out.push({
        cat,
        card,
        dir: path.relative(CARDS, cardDir).replace(/\\/g, "/"),
        files: files.map((f) => path.basename(f)),
        duration: m ? Number(m[1]) : null,
      });
    }
  }
  return out;
}

const pool = scan();
console.log(`可移植卡池：${pool.length} 张（seed=${SEED}）\n`);

const rnd = mulberry32(SEED);
const used = new Set();
const picked = [];
for (const slot of SLOTS) {
  const cands = pool.filter(
    (c) => slot.cats.includes(c.cat) && !used.has(c.card),
  );
  if (cands.length === 0) {
    console.log(`${slot.id}: 候选为空`);
    continue;
  }
  const pick = [];
  for (let i = 0; i < slot.want && cands.length; i++) {
    const j = Math.floor(rnd() * cands.length);
    const [c] = cands.splice(j, 1);
    used.add(c.card);
    pick.push(c);
  }
  picked.push({ slot: slot.id, cards: pick });
  console.log(
    `${slot.id.padEnd(6)} ← ` +
      pick.map((c) => `${c.card} [${c.cat}${c.duration ? ` ${c.duration}f` : ""}]`).join(", "),
  );
}

console.log("\n--- 抽中卡的 demo 路径 ---");
for (const p of picked) {
  for (const c of p.cards) {
    console.log(`${p.slot.padEnd(6)} ${c.dir}/  (${c.files.join(", ")})`);
  }
}
