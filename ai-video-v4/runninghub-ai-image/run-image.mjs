// RunningHub 标准模型 API 接入脚本 — 文生图（异步提交 + 轮询 + 下载）
//
// 参考文档：ai-video-v4/runninghub-ai-image/api接入.md
// 注意：标准模型 API 仅支持企业级-共享 API Key。
//
// 用法：
//   node runninghub-ai-image/run-image.mjs --prompt "你的画面描述" [选项]
//
// 选项：
//   --prompt <文本>        图像描述（必填）
//   --aspectRatio <枚举>   默认 16:9
//   --resolution <枚举>    默认 1k   [1k, 2k, 4k]
//   --quality <枚举>       默认 low [low, medium, high]
//   --host <cn|ai>         站点，默认 ai（本接口文档为国际站 runninghub.ai）
//
// 示例：
//   node runninghub-ai-image/run-image.mjs --prompt "一只坐在沙滩上的橘猫，黄昏"
//   node runninghub-ai-image/run-image.mjs --prompt "海底小镇" --aspectRatio 1:1 --resolution 1k --quality low --host cn
//
// 生成的图片会下载到本目录的 output/；若指定图片参数指向本机文件，可用 --ref 指向参考图。

import fs from "node:fs";
import path from "node:path";
import https from "node:https";

// ============ 配置 ============
// 站点切换：--host cn（中国站 runninghub.cn）| ai（国际站 runninghub.ai，默认）
// 密钥可用环境变量覆盖：中国站 RUNNINGHUB_API_KEY_CN，国际站 RUNNINGHUB_API_KEY_AI
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
    prompt: get("--prompt", ""),
    aspectRatio: get("--aspectRatio", "16:9"),
    resolution: get("--resolution", "1k"),
    quality: get("--quality", "low"),
    host: (get("--host", "ai") || "ai").toLowerCase(),
    ref: get("--ref", ""),
  };
}

function validate(opt) {
  if (!opt.prompt.trim()) {
    console.error("[ERROR] 缺少 --prompt 参数");
    process.exit(1);
  }
  if (!VALID_ASPECT.includes(opt.aspectRatio)) {
    console.error(`[ERROR] aspectRatio 非法，可选: [${VALID_ASPECT.join(", ")}]`);
    process.exit(1);
  }
  if (!VALID_RES.includes(opt.resolution)) {
    console.error(`[ERROR] resolution 非法，可选: [${VALID_RES.join(", ")}]`);
    process.exit(1);
  }
  if (!VALID_Q.includes(opt.quality)) {
    console.error(`[ERROR] quality 非法，可选: [${VALID_Q.join(", ")}]`);
    process.exit(1);
  }
  if (!["cn", "ai"].includes(opt.host)) {
    console.error("[ERROR] host 非法，可选: cn | ai");
    process.exit(1);
  }
}

const opt = parseArgs(process.argv.slice(2));
validate(opt);

const station = STATIONS[opt.host] || STATIONS.ai;
const API_BASE = station.base;
const API_KEY = process.env[station.envKey] || station.key;
const OUT_DIR = path.resolve(import.meta.dirname, "output");

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

// ============ RunningHub 文生图 API 调用 ============
async function submitTask() {
  const body = JSON.stringify({
    prompt: opt.prompt,
    aspectRatio: opt.aspectRatio,
    resolution: opt.resolution,
    quality: opt.quality,
  });

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
  const res = await fetchJson(`${API_BASE}/openapi/v2/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ taskId }),
  });
  if (res.status !== 200) {
    throw new Error(`查询任务失败 HTTP ${res.status}: ${JSON.stringify(res.json)}`);
  }
  return res.json;
}

// ============ 主流程 ============
async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`\n========== RunningHub 文生图 API ==========`);
  console.log(`站点:      ${opt.host} -> ${API_BASE}`);
  console.log(`prompt:    ${opt.prompt}`);
  console.log(`参数:      ${opt.aspectRatio} / ${opt.resolution} / ${opt.quality}`);
  console.log(`输出目录:  ${OUT_DIR}\n`);

  const submitRes = await submitTask();
  const taskId = submitRes.taskId;
  console.log(`[SUBMIT] taskId=${taskId}, status=${submitRes.status}`);

  const maxWait = 300000; // 5 分钟；高清出图更慢
  const pollInterval = 5000;
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    await new Promise((r) => setTimeout(r, pollInterval));
    const q = await queryTask(taskId);
    console.log(`[POLL]   status=${q.status} (${Math.round((Date.now() - start) / 1000)}s)`);

    if (q.status === "SUCCESS") {
      if (!q.results || q.results.length === 0) {
        console.log(`[WARN]   任务成功但无 results`);
        console.log(JSON.stringify(q, null, 2));
        return;
      }
      for (const item of q.results) {
        if (!item.url) continue;
        const ext = item.outputType || path.extname(new URL(item.url).pathname) || "png";
        const dest = path.join(OUT_DIR, `${taskId}-${item.nodeId || "out"}.${ext}`);
        console.log(`[DOWNLOAD] ${item.url}`);
        await downloadFile(item.url, dest);
        console.log(`[DONE]   → ${dest}`);
      }
      return;
    }

    if (q.status === "FAILED") {
      throw new Error(`任务失败: ${q.errorMessage || JSON.stringify(q.failedReason)}`);
    }
    // QUEUED / RUNNING 继续等
  }

  throw new Error(`任务超时 ${maxWait / 1000}s: ${taskId}`);
}

main().catch((e) => {
  console.error("[FATAL]", e);
  process.exit(1);
});