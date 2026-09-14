# 守护甜心角色介绍视频 — RunningHub 素材生成脚本
#
# 用法：
#   1. 设置环境变量：set RUNNINGHUB_API_KEY=你的key   (PowerShell: $env:RUNNINGHUB_API_KEY="...")
#   2. 运行：node scripts/generate-shugo-chara-assets.mjs
#   3. 生成的图片会下载到 public/textures/
#
# API：全能图片G-2-文生图-官方稳定版（异步任务 + 轮询）
# 文档：https://www.runninghub.cn/runninghub-api-doc-cn/api-448969296.md

import fs from "node:fs";
import path from "node:path";
import https from "node:https";

// ============ 配置 ============
const API_BASE = "https://www.runninghub.ai";
const API_KEY = process.env.RUNNINGHUB_API_KEY;
const OUT_DIR = path.resolve(process.cwd(), "public/textures");

if (!API_KEY) {
  console.error("[ERROR] 请先设置环境变量 RUNNINGHUB_API_KEY");
  console.error("  PowerShell:  $env:RUNNINGHUB_API_KEY=\"你的key\"");
  console.error("  CMD:         set RUNNINGHUB_API_KEY=你的key");
  process.exit(1);
}

// ============ 素材清单 ============
// 每条素材 = 固定文件名 + 提示词 + 参数
// 文件名固定 = 确定性渲染（ai-video-2 铁律：禁 Math.random，素材路径固定）
const ASSETS = [
  // ---- 角色立绘（5 人合一，16:9 横版）----
  // 一张图同时容纳 5 个角色，保证画风统一；
  // Remotion 端可用 overflow:hidden + 各角色区域的 mask/crop 切出单人立绘
  {
    file: "characters-group.png",
    prompt: "守护甜心主题全员立绘合影，五人并排站立从左到右依次为：小兰（粉红头发粉色啦啦队装红色发带活力少女形象）→ 米奇（深蓝头发蓝色画家贝雷帽蓝色围巾冷静艺术家形象手持画笔调色板）→ 日奈森亚梦（粉色十字发夹双马尾长发黄色眼睛圣夜学园校园制服灰色西装白衬衫红色格子短裙酷酷的少女漫主角）→ 舒舒（绿色头发绿色女仆装绿色头巾温柔女仆形象手持料理道具）→ 戴雅（金黄色头发金色王冠金色连衣裙闪耀光芒高贵皇室形象）。五人全身站立，画风统一的少女漫干净线稿，柔和粉色调，透明背景PNG，高质量",
    aspectRatio: "16:9",
    resolution: "1k",
    quality: "low",
  },

  // ---- 背景素材（16:9 横版）----
  {
    file: "bg-main-pink-gradient.png",
    prompt: "守护甜心主题场景背景，圣夜学园校园氛围，粉白色梦幻渐变天空，柔和少女漫色调，散景光斑，少量樱花花瓣和闪光粒子飘落，干净通透，大量留白，适合作为角色介绍视频主背景，16:9宽屏构图，高质量",
    aspectRatio: "16:9",
    resolution: "1k",
    quality: "low",
  },
  {
    file: "bg-finale-sparkle.png",
    prompt: "守护甜心主题合影收尾背景，金色闪耀粒子光效，舞台聚光灯效果，星光闪闪，华丽魔法少女变身场景氛围，粉金色调，适合作为五人合影围住字标收尾镜头背景，16:9宽屏构图，高质量",
    aspectRatio: "16:9",
    resolution: "1k",
    quality: "low",
  },
  {
    file: "bg-card-texture.png",
    prompt: "守护甜心主题档案卡背景，白色卡片纹理，淡粉色边框装饰，守护甜心标志性的星星和爱心X形贴纸元素点缀，柔和阴影，适合作为角色档案信息卡背景，16:9宽屏构图，高质量",
    aspectRatio: "16:9",
    resolution: "1k",
    quality: "low",
  },
];

// ============ HTTP 工具 ============
function fetchJson(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(body) });
        } catch (e) {
          reject(new Error(`JSON 解析失败: ${body.slice(0, 200)}`));
        }
      });
    });
    req.on("error", reject);
    req.write(options.body || "");
    req.end();
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`下载失败 HTTP ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve(dest)));
      })
      .on("error", reject);
  });
}

// ============ RunningHub API 调用 ============
async function submitTask(asset) {
  const body = JSON.stringify({
    prompt: asset.prompt,
    aspectRatio: asset.aspectRatio,
    resolution: asset.resolution,
    quality: asset.quality,
  });

  const res = await fetchJson(`${API_BASE}/openapi/v2/rhart-image-g-2-official/text-to-image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body,
  });

  if (res.status !== 200) {
    throw new Error(`提交任务失败 HTTP ${res.status}: ${JSON.stringify(res.json)}`);
  }
  return res.json;
}

async function queryTask(taskId) {
  const body = JSON.stringify({ taskId });
  const res = await fetchJson(`${API_BASE}/openapi/v2/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body,
  });
  if (res.status !== 200) {
    throw new Error(`查询任务失败 HTTP ${res.status}: ${JSON.stringify(res.json)}`);
  }
  return res.json;
}

// ============ 主流程 ============
async function generateOne(asset) {
  const dest = path.join(OUT_DIR, asset.file);

  // 幂等性：已存在则跳过（重跑时避免重复扣费）
  if (fs.existsSync(dest)) {
    console.log(`[SKIP] ${asset.file} 已存在，跳过`);
    return { ...asset, status: "skipped" };
  }

  console.log(`[SUBMIT] ${asset.file} → 提交任务...`);
  const submitRes = await submitTask(asset);
  const taskId = submitRes.taskId;
  console.log(`[TASK]   ${asset.file} → taskId=${taskId}, status=${submitRes.status}`);

  // 轮询（每 5 秒一次，最多 120 秒）
  const start = Date.now();
  const maxWait = 120000;
  let pollInterval = 5000;

  while (Date.now() - start < maxWait) {
    await new Promise((r) => setTimeout(r, pollInterval));
    const q = await queryTask(taskId);
    console.log(`[POLL]   ${asset.file} → ${q.status} (${Math.round((Date.now() - start) / 1000)}s)`);

    if (q.status === "SUCCESS") {
      if (!q.results || q.results.length === 0) {
        throw new Error(`任务成功但无结果: ${JSON.stringify(q)}`);
      }
      const imgUrl = q.results[0].url;
      console.log(`[DOWNLOAD] ${asset.file} → ${imgUrl}`);
      await downloadFile(imgUrl, dest);
      console.log(`[DONE]   ${asset.file} ✓ (${Math.round((Date.now() - start) / 1000)}s)`);
      return { ...asset, status: "ok", taskId, url: imgUrl, cost: q.usage?.taskCostTime };
    }

    if (q.status === "FAILED") {
      throw new Error(`任务失败: ${q.errorMessage || JSON.stringify(q.failedReason)}`);
    }

    // QUEUED / RUNNING 继续等
  }

  throw new Error(`任务超时 ${maxWait / 1000}s: ${asset.file}`);
}

async function main() {
  // 准备目录
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`\n========== RunningHub 素材批量生成 ==========`);
  console.log(`API:    ${API_BASE}/openapi/v2/rhart-image-g-2-official/text-to-image`);
  console.log(`输出:   ${OUT_DIR}`);
  console.log(`素材数: ${ASSETS.length}\n`);

  const results = [];
  // 顺序执行（避免并发触发 API 限流）
  for (const asset of ASSETS) {
    try {
      const r = await generateOne(asset);
      results.push(r);
    } catch (e) {
      console.error(`[FAIL]   ${asset.file} ✗ ${e.message}\n`);
      results.push({ ...asset, status: "error", error: e.message });
    }
  }

  // 汇总
  console.log(`\n========== 生成汇总 ==========`);
  const ok = results.filter((r) => r.status === "ok");
  const skipped = results.filter((r) => r.status === "skipped");
  const failed = results.filter((r) => r.status === "error");

  console.log(`成功: ${ok.length} / ${ASSETS.length}`);
  console.log(`跳过: ${skipped.length}`);
  console.log(`失败: ${failed.length}`);

  if (failed.length > 0) {
    console.log(`\n失败清单（可重跑脚本，已成功的会自动跳过）:`);
    failed.forEach((r) => console.log(`  - ${r.file}: ${r.error}`));
  }

  // 生成 layout.json（供 Remotion PageCam 读取坐标）
  // 5 人并排在一张 16:9 (1920x1080) 里 → 每人约 384px 宽
  // Remotion 用 overflow:hidden + 此坐标切片即可拿到单人立绘区域
  const charW = 384;
  const charH = 1080;
  const layout = {
    canvas: { w: 1920, h: 1080 },
    elements: {
      // 5 人合一图源：characters-group.png
      "character-ran": { src: "characters-group.png", x: 0, y: 0, w: charW, h: charH },
      "character-miki": { src: "characters-group.png", x: charW, y: 0, w: charW, h: charH },
      "character-amu": { src: "characters-group.png", x: charW * 2, y: 0, w: charW, h: charH },
      "character-su": { src: "characters-group.png", x: charW * 3, y: 0, w: charW, h: charH },
      "character-dia": { src: "characters-group.png", x: charW * 4, y: 0, w: charW, h: charH },
      // 背景全屏
      "bg-main-pink-gradient": { x: 0, y: 0, w: 1920, h: 1080 },
      "bg-finale-sparkle": { x: 0, y: 0, w: 1920, h: 1080 },
      "bg-card-texture": { x: 360, y: 140, w: 1200, h: 800 },
    },
  };
  const layoutPath = path.join(OUT_DIR, "layout.json");
  fs.writeFileSync(layoutPath, JSON.stringify(layout, null, 2));
  console.log(`\n[layout.json] 已生成: ${layoutPath}`);
  console.log(`\n下一步：进入 ai-video-2 模板目录，让 Agent 按提示词用这些素材制作视频。`);
}

main().catch((e) => {
  console.error("[FATAL]", e);
  process.exit(1);
});
