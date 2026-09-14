// 为什么你减肥总是失败？ — RunningHub 背景素材生成脚本
//
// 用法：
//   1. 设置环境变量：$env:RUNNINGHUB_API_KEY="你的key"
//   2. 运行：node scripts/generate-weightloss-assets.mjs
//   3. 生成的图片会下载到 weight-loss/public/textures/
//
// API：全能图片G-2-文生图-官方稳定版（异步任务 + 轮询）
// 文档：https://www.runninghub.cn/runninghub-api-doc-cn/api-448969296.md

import fs from "node:fs";
import path from "node:path";
import https from "node:https";

// ============ 配置 ============
const API_BASE = "https://www.runninghub.ai";
const API_KEY = process.env.RUNNINGHUB_API_KEY;
const OUT_DIR = path.resolve(process.cwd(), "weight-loss/public/textures");

if (!API_KEY) {
  console.error("[ERROR] 请先设置环境变量 RUNNINGHUB_API_KEY");
  process.exit(1);
}

// ============ 素材清单 ============
// 6 张 16:9 场景背景。风格统一前缀保证画风一致。
// 用户取向：尽量还原海绵宝宝原版画风（自用；对外商用有版权风险）。
// 分辨率：1k / low（用户指定，控制成本；背景不做高倍特写推近）
const STYLE_PREFIX =
  "海绵宝宝动画风格（SpongeBob SquarePants classic animation style），" +
  "明亮卡通渲染，粗黑描边，高饱和荧光色，海蓝色透明海水，上升气泡，" +
  "圆润可爱造型，画面干净通透，无文字，无水印，16:9 宽银幕构图，高清细节";

const ASSETS = [
  {
    file: "bg-open.png",
    prompt:
      STYLE_PREFIX +
      "，海底小镇全景，阳光光束从海面射入海底，珊瑚礁和海草丛随水流摇曳，" +
      "海底沙地上散落海星贝壳，远处有卡通风格的海底小屋窗户透出暖光，" +
      "整体明亮欢快朝气，适合作为健康科普视频开场背景",
    aspectRatio: "16:9",
    resolution: "1k",
    quality: "low",
  },
  {
    file: "bg-starve.png",
    prompt:
      STYLE_PREFIX +
      "，海底餐厅厨房场景，空荡荡的白色餐盘上只放着一片绿叶，" +
      "旁边一杯柠檬水，柜台上有卡通风格的磅秤和计分板，" +
      "画面略带反差喜感（表面励志但暗示吃不饱），适合作为" +
      "“极端节食导致暴食反弹”镜头背景",
    aspectRatio: "16:9",
    resolution: "1k",
    quality: "low",
  },
  {
    file: "bg-night.png",
    prompt:
      STYLE_PREFIX +
      "，深夜海底场景，深蓝紫色调，一轮卡通月亮在海面上方打哈欠" +
      "（月亮有困倦的卡通表情），海水里飘着零星的夜光浮游生物，" +
      "海底小屋窗户亮着昏黄的灯，床边有咖啡杯和零食包装袋，" +
      "氛围疲惫又好笑，适合作为“熬夜失眠导致食欲失控”镜头背景",
    aspectRatio: "16:9",
    resolution: "1k",
    quality: "low",
  },
  {
    file: "bg-cardio.png",
    prompt:
      STYLE_PREFIX +
      "，海底小镇跑步道场景，珊瑚铺成的小路上有卡通跑步道标线，" +
      "路边水母和章鱼举着小旗子当观众，远处小房子和灯塔，" +
      "阳光明媚，运动感十足，适合作为“只做有氧不练力量”镜头背景",
    aspectRatio: "16:9",
    resolution: "1k",
    quality: "low",
  },
  {
    file: "bg-scale.png",
    prompt:
      STYLE_PREFIX +
      "，海底沙滩场景，沙滩中央放着一台卡通风格的体重秤" +
      "（秤面指针左右晃动），旁边散落贝壳、海星和一只抱头苦恼表情的" +
      "小海豹，身后海面有起伏的波浪，氛围轻松幽默，" +
      "适合作为“天天称体重心态崩溃”镜头背景",
    aspectRatio: "16:9",
    resolution: "1k",
    quality: "low",
  },
  {
    file: "bg-outro.png",
    prompt:
      STYLE_PREFIX +
      "，海底日落场景，暖金色夕阳透过海面洒下温柔光柱，" +
      "海底小镇安静祥和，海草缓缓摇曳，金色泡泡缓缓上升，" +
      "画面温暖治愈充满希望，适合作为视频结尾收尾背景",
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

  // 轮询（每 5 秒一次，最多 240 秒；2k medium 出图更慢）
  const start = Date.now();
  const maxWait = 240000;
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

  console.log(`\n========== RunningHub 背景素材批量生成 ==========`);
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

  console.log(`\n下一步：素材就绪后进入 weight-loss 工程逐镜头实现。`);
}

main().catch((e) => {
  console.error("[FATAL]", e);
  process.exit(1);
});
