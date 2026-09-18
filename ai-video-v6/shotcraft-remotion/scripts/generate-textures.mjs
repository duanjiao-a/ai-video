// RunningHub 文生图批量生成脚本（固化版）
//
// 从 scripts/generate-weightloss-assets.mjs + ai-video-v4/runninghub-ai-image/run-image.mjs
// 合并固化的通用脚本：manifest 驱动批量生图（异步提交 + 轮询 + 下载 + 幂等跳过）。
//
// 用法：
//   node scripts/generate-textures.mjs --manifest textures.json --out <视频>/public/textures
//       [--host ai] [--key <API_KEY>] [--timeout 300]
//
//   # 单张模式（v4 兼容）：
//   node scripts/generate-textures.mjs --prompt "一只坐在沙滩上的橘猫" --out ./output
//
// manifest.json 格式：
//   {
//     "style": "统一风格前缀（可选，自动拼在每个 prompt 前，保证全片画风一致）",
//     "assets": [
//       { "file": "bg-open.png", "prompt": "海底小镇全景……", "aspectRatio": "16:9", "resolution": "1k", "quality": "low" }
//     ]
//   }
//
// 说明：
//   - 幂等：目标文件已存在则跳过（重跑不重复扣费）
//   - 单张失败不中断，最后汇总失败清单，可重跑
//   - API：全能图片G-2-文生图-官方稳定版，异步任务 + 轮询
//   - 密钥优先级：--key 参数 > 环境变量 RUNNINGHUB_API_KEY_<HOST> > 内置默认 key

import fs from "node:fs";
import path from "node:path";
import https from "node:https";

// ============ 配置 ============
const STATIONS = {
  cn: {
    base: "https://www.runninghub.cn",
    key: "06d3f9f56aa94934b86f82872547b0f3",
    envKey: "RUNNINGHUB_API_KEY_CN",
  },
  ai: {
    base: "https://www.runninghub.ai",
    key: "8252133ffc2d4b7aa72158caa98eab9b",
    envKey: "RUNNINGHUB_API_KEY_AI",
  },
};

const API_PATH = "/openapi/v2/rhart-image-g-2-official/text-to-image";
const VALID_ASPECT = ["1:1","1:2","2:1","1:3","3:1","2:3","3:2","3:4","4:3","4:5","5:4","9:16","21:9","9:21","16:9"];
const VALID_RES = ["1k","2k","4k"];
const VALID_Q = ["low","medium","high"];

function parseArgs(argv) {
  const get = (flag, def) => {
    const i = argv.indexOf(flag);
    return i !== -1 && argv[i + 1] ? argv[i + 1] : def;
  };
  return {
    manifest: get("--manifest", ""),
    prompt: get("--prompt", ""),
    out: get("--out", ""),
    aspectRatio: get("--aspectRatio", "16:9"),
    resolution: get("--resolution", "1k"),
    quality: get("--quality", "low"),
    host: (get("--host", "ai") || "ai").toLowerCase(),
    key: get("--key", ""),
    timeout: Number(get("--timeout", "300")), // 单张轮询上限（秒）
  };
}

function fail(msg) {
  console.error(`[ERROR] ${msg}`);
  process.exit(1);
}

function validate(opt) {
  if (!opt.manifest && !opt.prompt.trim()) {
    fail("必须提供 --manifest <json> 或 --prompt <文本>");
  }
  if (!opt.out) fail("缺少 --out <输出目录>");
  if (opt.manifest && !fs.existsSync(opt.manifest)) fail(`manifest 文件不存在: ${opt.manifest}`);
  if (!VALID_ASPECT.includes(opt.aspectRatio)) fail(`aspectRatio 非法: [${VALID_ASPECT.join(", ")}]`);
  if (!VALID_RES.includes(opt.resolution)) fail(`resolution 非法: [${VALID_RES.join(", ")}]`);
  if (!VALID_Q.includes(opt.quality)) fail(`quality 非法: [${VALID_Q.join(", ")}]`);
  if (!["cn", "ai"].includes(opt.host)) fail("host 非法，可选: cn | ai");
  if (!Number.isFinite(opt.timeout) || opt.timeout <= 0) fail("timeout 必须为正数");
}

const opt = parseArgs(process.argv.slice(2));
validate(opt);

const station = STATIONS[opt.host] || STATIONS.ai;
const API_BASE = station.base;
const API_KEY = opt.key || process.env[station.envKey] || station.key;
const OUT_DIR = path.resolve(opt.out);

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
          reject(new Error(`JSON 解析失败: ${body.slice(0, 300)}`));
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

// ============ RunningHub API ============
async function submitTask(prompt, aspectRatio, resolution, quality) {
  const body = JSON.stringify({ prompt, aspectRatio, resolution, quality });
  const res = await fetchJson(`${API_BASE}${API_PATH}`, {
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

// ============ 单张生成 ============
async function generateOne(asset) {
  const dest = path.join(OUT_DIR, asset.file);

  if (fs.existsSync(dest)) {
    console.log(`[SKIP] ${asset.file} 已存在，跳过`);
    return { ...asset, status: "skipped" };
  }

  console.log(`[SUBMIT] ${asset.file} → 提交任务...`);
  const submitRes = await submitTask(asset.prompt, asset.aspectRatio, asset.resolution, asset.quality);
  const taskId = submitRes.taskId;
  console.log(`[TASK]   ${asset.file} → taskId=${taskId}, status=${submitRes.status}`);

  const start = Date.now();
  const maxWait = opt.timeout * 1000;
  const pollInterval = 5000;

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
      return { ...asset, status: "ok", taskId, url: imgUrl };
    }

    if (q.status === "FAILED") {
      throw new Error(`任务失败: ${q.errorMessage || JSON.stringify(q.failedReason)}`);
    }
    // QUEUED / RUNNING 继续等
  }

  throw new Error(`任务超时 ${maxWait / 1000}s: ${asset.file}`);
}

// ============ 主流程 ============
async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 组装素材清单
  let stylePrefix = "";
  let assets = [];
  if (opt.manifest) {
    const manifest = JSON.parse(fs.readFileSync(opt.manifest, "utf-8"));
    stylePrefix = manifest.style || "";
    assets = manifest.assets;
    if (!Array.isArray(assets) || assets.length === 0) {
      fail("manifest.assets 必须是非空数组");
    }
  } else {
    assets = [{ file: "output.png", prompt: opt.prompt }];
  }

  // 默认参数回填 + 风格前缀拼接
  assets = assets.map((a) => ({
    file: a.file,
    prompt: stylePrefix + a.prompt,
    aspectRatio: a.aspectRatio || opt.aspectRatio,
    resolution: a.resolution || opt.resolution,
    quality: a.quality || opt.quality,
  }));

  console.log(`\n========== RunningHub 背景素材批量生成 ==========`);
  console.log(`API:    ${API_BASE}${API_PATH}`);
  console.log(`站点:   ${opt.host}`);
  console.log(`输出:   ${OUT_DIR}`);
  console.log(`素材数: ${assets.length}\n`);

  const results = [];
  // 顺序执行（避免并发触发 API 限流）
  for (const asset of assets) {
    try {
      results.push(await generateOne(asset));
    } catch (e) {
      console.error(`[FAIL]   ${asset.file} ✗ ${e.message}\n`);
      results.push({ ...asset, status: "error", error: e.message });
    }
  }

  const ok = results.filter((r) => r.status === "ok");
  const skipped = results.filter((r) => r.status === "skipped");
  const failed = results.filter((r) => r.status === "error");

  console.log(`\n========== 生成汇总 ==========`);
  console.log(`成功: ${ok.length} / ${assets.length} | 跳过: ${skipped.length} | 失败: ${failed.length}`);
  if (failed.length > 0) {
    console.log(`\n失败清单（可重跑脚本，已成功的会自动跳过）:`);
    failed.forEach((r) => console.log(`  - ${r.file}: ${r.error}`));
    process.exitCode = 1;
  }
  console.log(`\n下一步：素材就绪后进入 Remotion 工程逐镜头实现。`);
}

main().catch((e) => {
  console.error("[FATAL]", e);
  process.exit(1);
});
