// 比奇堡大选？3分钟搞懂"宏观调控"！ — RunningHub 背景素材生成脚本
//
// 用法：
//   1. 设置环境变量：$env:RUNNINGHUB_API_KEY="你的key"
//   2. 运行：node scripts/generate-hongguantiaokong-assets.mjs
//   3. 生成的图片会下载到 videos/gongkao/hongguantiaokong/public/textures/
//
// API：全能图片G-2-文生图-官方稳定版（异步任务 + 轮询）
// 文档：https://www.runninghub.cn/runninghub-api-doc-cn/api-448969296.md
// 参数：16:9 / 1k / low（用户指定）

import fs from "node:fs";
import path from "node:path";
import https from "node:https";

// ============ 配置 ============
const API_BASE = "https://www.runninghub.ai";
const API_KEY = process.env.RUNNINGHUB_API_KEY;
const OUT_DIR = path.resolve(process.cwd(), "videos/gongkao/hongguantiaokong/public/textures");

if (!API_KEY) {
  console.error("[ERROR] 请先设置环境变量 RUNNINGHUB_API_KEY");
  console.error("  PowerShell:  $env:RUNNINGHUB_API_KEY=\"你的key\"");
  process.exit(1);
}

// ============ 素材清单 ============
// 8 张 16:9 场景背景，与 DESIGN.md §六 的 visual_prompt 一一对应。
// 固定文件名 = 确定性渲染；风格统一前缀保证画风一致。
// 用户取向：尽量还原海绵宝宝原版画风（自用；对外商用有版权风险）。
const STYLE_PREFIX =
  "海绵宝宝动画风格（SpongeBob SquarePants classic animation style），" +
  "明亮卡通渲染，粗黑描边，高饱和荧光色，海蓝色透明海水，上升气泡，" +
  "圆润可爱造型，画面干净通透，无文字，无水印，16:9 宽银幕构图，高清细节";

const ASSETS = [
  {
    file: "bg-open.png",
    prompt:
      STYLE_PREFIX +
      "，比奇堡海底小镇中心广场竞选辩论舞台，主持人海绵宝宝（黄色方形海绵，" +
      "两颗大门牙，白衬衫红领带，棕色短裤）站在舞台中央举着麦克风热情主持，" +
      "台下海星形长椅坐满鱼群观众远景剪影，悬挂竞选彩旗和星星旗帜，珊瑚建筑环绕，" +
      "阳光光束从海面射入，气氛热闹隆重；角色主体下方居中，上方留白",
    aspectRatio: "16:9",
    resolution: "1k",
    quality: "low",
  },
  {
    file: "bg-demand.png",
    prompt:
      STYLE_PREFIX +
      "，海底商业街萧条景象，松鼠科学家珊迪（白色潜水服，玻璃头盔，棕毛尾巴）" +
      "站在街中央扶眼镜认真讲解，身旁红色螃蟹蟹老板（白色衬衫，大蟹钳）拍着桌子一脸不服，" +
      "卡通汉堡餐厅门口冷冷清清，商铺挂着空贝壳招租标志，水母飘过，" +
      "几只表情低落的小鱼坐在路边，灰蓝色调略带低迷；角色主体下方居中，上方留白",
    aspectRatio: "16:9",
    resolution: "1k",
    quality: "low",
  },
  {
    file: "bg-fiscal.png",
    prompt:
      STYLE_PREFIX +
      "，海底市政建设工地，松鼠科学家珊迪（白色潜水服，玻璃头盔）举着图表激情演讲，" +
      "身后卡通挖掘机和吊车正在修建珊瑚路、铺设水母网，海藻公园施工围挡上画着" +
      "戴安全帽的贝壳图案，黄色工程车，海狸和章鱼卡通工人忙碌，热火朝天，" +
      "阳光明亮，充满干劲；角色主体下方居中，上方留白",
    aspectRatio: "16:9",
    resolution: "1k",
    quality: "low",
  },
  {
    file: "bg-market.png",
    prompt:
      STYLE_PREFIX +
      "，海底餐厅内部，红色螃蟹蟹老板（白色衬衫，大蟹钳，眼柄大眼睛）" +
      "站在柜台后搓着蟹钳奸笑，点餐柜台前排着长队，顾客们（各种卡通鱼类）手里拿着贝壳货币，" +
      "吧台厨师忙碌做汉堡，菜单牌上画着图形化汉堡图案，市场氛围热闹繁荣，" +
      "经济活力十足，暖色调；角色主体下方居中，上方留白",
    aspectRatio: "16:9",
    resolution: "1k",
    quality: "low",
  },
  {
    file: "bg-cbank.png",
    prompt:
      STYLE_PREFIX +
      "，海底中央银行大厅，绿色小生物痞老板（一只大眼睛，橙色短裤）" +
      "坐在微型潜艇里得意指挥，巨型金色贝壳钱币堆成小山，大理石柱子，" +
      "卡通保险库大门微微开启透出金光，管道输送金币，监控屏幕上画着波形线图形，" +
      "庄重又好笑，金色蓝色调；角色主体下方居中，上方留白",
    aspectRatio: "16:9",
    resolution: "1k",
    quality: "low",
  },
  {
    file: "bg-hot.png",
    prompt:
      STYLE_PREFIX +
      "，海底市场物价飞涨，红色螃蟹蟹老板（白色衬衫，大蟹钳）捂着胸口一脸惊恐" +
      "看着餐厅门口巨型图形菜单牌上汉堡图标旁的爆炸符号和红色上升箭头，" +
      "居民们围着菜单牌目瞪口呆，红色橙色过热色调，热气升腾的搞笑氛围；" +
      "角色主体下方居中，上方留白",
    aspectRatio: "16:9",
    resolution: "1k",
    quality: "low",
  },
  {
    file: "bg-exam.png",
    prompt:
      STYLE_PREFIX +
      "，海底图书馆安静的学习角落，墨绿色章鱼章鱼哥（长鼻子，厌世表情，白衬衫黑领带）" +
      "举着手慢悠悠提问，书桌上一摞厚厚的卡通书本，一盏亮着的台灯，" +
      "墙上卡通挂钟，书架里排满书本，认真又无奈的氛围；角色主体下方居中，上方留白",
    aspectRatio: "16:9",
    resolution: "1k",
    quality: "low",
  },
  {
    file: "bg-outro.png",
    prompt:
      STYLE_PREFIX +
      "，比奇堡广场狂欢，粉色胖海星派大星（绿色短裤，憨厚呆萌表情，流口水傻笑）" +
      "高举一个蟹堡站在台上，身后舞台上堆着蟹堡小山，彩带和纸屑漫天飞舞，" +
      "周围鱼群观众欢呼跳跃，金色彩带，夕阳金光，热闹搞怪；角色主体下方居中，上方留白",
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

  // 轮询（每 5 秒一次，最多 240 秒）
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

  console.log(`\n下一步：素材就绪后进入 hongguantiaokong 工程逐镜头实现。`);
}

main().catch((e) => {
  console.error("[FATAL]", e);
  process.exit(1);
});
