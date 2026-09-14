// RunningHub ComfyUI 工作流 API 接入脚本（异步提交 + 轮询 + 下载）
//
// 参考文档：ai-video-v3/api接入.md
//
// 用法：
//   1. 设置环境变量：$env:RUNNINGHUB_API_KEY="你的key"
//   2. （可选）指定工作流 / 节点参数：
//        $env:RUNNINGHUB_WORKFLOW_ID="2097875587942666242"
//      nodeInfoList 通过 --nodeInfo 传 JSON，或用纯文本变体生成。
//   3. 运行：
//        node ai-video-v3/run-workflow.mjs                    # 空 nodeInfoList 跑通测试
//        node ai-video-v3/run-workflow.mjs --nodeInfo '[...]'
//   4. 生成的视频会下载到 ai-video-v3/output/
//
// 说明：
//   - 测试工作流不带 nodeInfoList 即可跑通（走工作流默认参数）。
//   - 真实视频参数（prompt/首帧图等）之后通过 --nodeInfo 回填。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";

// ============ 配置 ============
const API_BASE = "https://www.runninghub.cn";
const API_KEY = process.env.RUNNINGHUB_API_KEY;
const WORKFLOW_ID = process.env.RUNNINGHUB_WORKFLOW_ID || "2097875587942666242";
const OUT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "output");

// 解析命令行参数（支持 --nodeInfo 'JSON字符串'）
const args = process.argv.slice(2);
const nodeIndex = args.indexOf("--nodeInfo");
let nodeInfoList = [];
if (nodeIndex !== -1 && args[nodeIndex + 1]) {
  try {
    nodeInfoList = JSON.parse(args[nodeIndex + 1]);
  } catch (e) {
    console.error("[ERROR] --nodeInfo 参数不是合法 JSON");
    process.exit(1);
  }
}

if (!API_KEY) {
  console.error("[ERROR] 请先设置环境变量 RUNNINGHUB_API_KEY");
  process.exit(1);
}

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

// ============ RunningHub 工作流 API 调用 ============
async function submitTask() {
  const body = JSON.stringify({
    addMetadata: true,
    nodeInfoList,
    instanceType: "default",
    usePersonalQueue: "false",
  });

  const res = await fetchJson(`${API_BASE}/openapi/v2/run/workflow/${WORKFLOW_ID}`, {
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
async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`\n========== RunningHub 工作流 API ==========`);
  console.log(`API:       ${API_BASE}/openapi/v2/run/workflow/${WORKFLOW_ID}`);
  console.log(`nodeInfoList: ${JSON.stringify(nodeInfoList) || "(空，走默认参数)"}`);
  console.log(`输出目录:  ${OUT_DIR}\n`);

  // 提交
  const submitRes = await submitTask();
  const taskId = submitRes.taskId;
  console.log(`[SUBMIT] taskId=${taskId}, status=${submitRes.status}`);

  // 轮询（每 10 秒一次，最多 600 秒；视频生成更慢）
  const maxWait = 600000;
  const pollInterval = 10000;
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    await new Promise((r) => setTimeout(r, pollInterval));
    const q = await queryTask(taskId);
    console.log(`[POLL]   status=${q.status} (${Math.round((Date.now() - start) / 1000)}s)`);

    if (q.status === "SUCCESS") {
      if (!q.results || q.results.length === 0) {
        console.log(`[WARN]   任务成功但无 results，跳过下载`);
        console.log(JSON.stringify(q, null, 2));
        return;
      }
      for (const item of q.results) {
        if (!item.url) continue;
        const ext = item.outputType || path.extname(new URL(item.url).pathname) || "bin";
        const dest = path.join(OUT_DIR, `${taskId}-${item.nodeId || "out"}.${ext}`);
        console.log(`[DOWNLOAD] ${item.url}`);
        await downloadFile(item.url, dest);
        console.log(`[DONE]   → ${dest}`);
      }
      console.log(`\n任务耗时: ${q.usage?.taskCostTime}s`);
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