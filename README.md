# ai-video

用 AI 生成视频的**几种方法论**的实践仓库。包含多套可选管线（RunningHub 生图 + EdgeTTS 旁白 + Remotion / hyperframes 动画的「三源流水线」，以及视频数据 API、第三方开源工具等）、自己的工具脚本与真实产出视频项目。

## 目录结构

```
ai-video/
├── ai-video-v6/shotcraft-remotion/  # ★ 主流水线工具库（自研）：三源流水线的固化脚手架/镜头卡/SFX/生成脚本
├── ai-video-v3/            # 实验：RunningHub 云端 ComfyUI 工作流 API 接入（Minimax H3 等）
├── ai-video-v4/            # 实验：RunningHub 标准模型 API 接入（rhart-image-g-2 文生图）
├── ai-video-v5/TTS/        # EdgeTTS 旁白生成脚本（自研，单文件、带重试；已被 v6 固化包含）
├── scripts/                # 资产生成脚本：RunningHub 生图 + EdgeTTS 旁白
├── videos/                 # 实际产出视频的工程（Remotion / hyperframes）
├── mpt-tts-mcp/            # 自研 TTS MCP 服务（抽取自 MoneyPrinterTurbo）
├── out/                    # 视频导出产物（如 meaning-of-life 的渲染输出）
├── video-out/              # 视频输出探针与测试（Minimax-Hs-TEST 等）
│
├── a-hyperframes/          # 【vendored】hyperframes 引擎（Remotion 上游框架，不入库）
├── ai-video-2/             # 【vendored】video-shotcraft 原仓库（Remotion 电影感宣传片技能库）
├── MoneyPrinterTurbo-main/ # 【vendored】MoneyPrinterTurbo 开源项目（不入库）
└── README.md
```

> `.gitignore` 中已忽略第三方 / vendored 项目（`MoneyPrinterTurbo-main/`、`a-hyperframes/`、`ai-video-2/` 及 `*.zip`），以及 `renders/`、`snapshots/`、音频视频产物等大型产物。

## 核心方法论（三源流水线）

主路径为 **RunningHub 生图 + EdgeTTS 旁白 + Remotion 动画** 的三源流水线。当前推荐直接使用已固化的工具库 [ai-video-v6/shotcraft-remotion](ai-video-v6/shotcraft-remotion)（从 `ai-video-2`（video-shotcraft）抽取的可复用资产 + 一键脚手架），做新视频无需翻原仓库：

```bash
# 1. 新建 Remotion 视频项目（--sfx 拷入 SFX 库，--install 自动装依赖）
node ai-video-v6/shotcraft-remotion/scaffold.mjs --out ../videos/my-video --sfx --install

# 2. 写 DESIGN.md 分镜表 → 生成背景图
node ai-video-v6/shotcraft-remotion/scripts/generate-textures.mjs --manifest textures.json --out ../videos/my-video/public/textures

# 3. 生成旁白 + 字幕（mp3 + srt + durations.json）
python ai-video-v6/shotcraft-remotion/scripts/generate-tts.py --segments segments.json --out ../videos/my-video/public/audio/tts

# 4. 在项目里适配镜头卡、预览、渲染（带 / 无 BGM 两版）
cd ../videos/my-video && npm run dev && npm run render && npm run render:nobgm
```

管线拆解：

1. **RunningHub 生图**（角色 / 背景图源）
   - 标准模型 API：`POST /openapi/v2/rhart-image-g-2-official/text-to-image`（异步 + 轮询 `POST /openapi/v2/query`）
   - 批量化脚本：`ai-video-v6/.../scripts/generate-textures.mjs`（manifest 驱动、幂等）；早期单视频脚本见 [scripts/](scripts/) 下 `generate-*-assets.mjs`
   - 教训：角色驱动的动效视频，背景 prompt 必须包含主要角色 + 统一角色锚点 + 构图留白，否则只会得到纯背景。
2. **EdgeTTS 旁白**（配音 + 字幕 + 时长）
   - 脚本：`ai-video-v6/.../scripts/generate-tts.py`（edge_tts 6.x/7.x 兼容，带超时回退 + 空文件重试 + 幂等）
   - 输出 `mp3 + srt(字级时间戳) + durations.json`；时长换算帧号 `round(秒×30)` 供 Remotion 使用。
3. **Remotion 动画 / 合成**（成片）
   - 由 `scaffold.mjs` 从 `remotion/` 骨架拷贝生成（Root / src / public），再按镜头卡逐镜头适配
   - 另有一类 **hyperframes** 工程：`videos/meaning-of-life/`、`videos/voicebox-explainer/`（`.hyperframes` + `compositions`）

## 各子项目说明

### 自研工具与实验

| 路径 | 说明 |
| --- | --- |
| [ai-video-v6/shotcraft-remotion](ai-video-v6/shotcraft-remotion) | ★ 主流水线工具库：`scaffold.mjs` 一键新建项目 + `scripts/`（`generate-textures.mjs` / `generate-tts.py`）+ 固化 `remotion/` 骨架 + `cards/`（157 镜头配方卡 / 序列 / 221 demo）+ `audio/sfx/`（149 SFX，16 类）+ `docs/` 方法论。详见其 [README](ai-video-v6/shotcraft-remotion/README.md) |
| [ai-video-v3/Minimax-H3-](ai-video-v3/Minimax-H3-) | 实验：RunningHub 云端 ComfyUI 工作流 API 接入（`run-workflow.mjs` 提交工作流任务） |
| [ai-video-v4/runninghub-ai-image](ai-video-v4/runninghub-ai-image) | 实验：RunningHub 标准模型文生图 API 接入（`run-image.mjs`） |
| [ai-video-v5/TTS](ai-video-v5/TTS) | EdgeTTS 旁白生成：`generate-tts.py`（推荐）+ `generate-edge-tts.py`（已被 v6 固化包含） |
| [scripts](scripts) | 早期单视频资产生成脚本：`generate-hongguantiaokong-assets.mjs`、`generate-shugo-chara-assets.mjs`、`generate-weightloss-assets.mjs`（RunningHub 生图）；`generate-tts-*.py`（EdgeTTS 旁白） |
| [mpt-tts-mcp](mpt-tts-mcp) | 自研 TTS MCP 服务（uv 管理，`server.py` / `voice.py` / `subtitle.py`），把 MoneyPrinterTurbo 的 TTS 能力以 MCP 形式暴露 |

### 产出视频工程（videos/）

| 工程 | 技术栈 | 内容 |
| --- | --- | --- |
| [gongkao/hongguantiaokong](videos/gongkao/hongguantiaokong) | Remotion | 《比奇堡大选？3分钟搞懂"宏观调控"！》——角色驱动 + 屏幕大字，8 镜头对应 8 段旁白 |
| [weight-loss](videos/weight-loss) | Remotion | 减肥主题（骨架模板，后续视频复制的基准） |
| [meaning-of-life](videos/meaning-of-life) | hyperframes | 人生意义主题（含 BRIEF / STORYBOARD / 分镜与渲染） |
| [voicebox-explainer](videos/voicebox-explainer) | hyperframes | 语音合成（voicebox）科普讲解 |
| [voicebox-analysis](videos/voicebox-analysis) | — | voicebox 架构分析文档 |

### Vendored 第三方（不入库，仅供参考 / 复用）

| 路径 | 说明 |
| --- | --- |
| [a-hyperframes](a-hyperframes) | hyperframes 引擎（引擎 / CLI / producer / player / studio / skills），是 hyperframes 视频工程的上游 |
| [ai-video-2](ai-video-2) | **video-shotcraft 原仓库**——基于 Remotion 的电影感产品宣传片 Agent 技能库（镜头配方卡 + 在线画廊 + 动效工作台），附中文提示词总结；其可复用公共资产已抽取固化到 `ai-video-v6/shotcraft-remotion` |
| [MoneyPrinterTurbo-main](MoneyPrinterTurbo-main) | MoneyPrinterTurbo 开源项目（webui / cli / 配乐 / 字幕 / 视频合成管线），其 TTS 能力已被抽取为 `mpt-tts-mcp` |

## 常用约定

- **TTS 音色 / 语速**：默认 `zh-CN-XiaoxiaoNeural`、`+20%` 语速；EdgeTTS **服务不稳定**，脚本必须带重试。
- **Remotion 复刻骨架**：新项目一律用 `ai-video-v6/shotcraft-remotion/scaffold.mjs` 生成，不再手动复制 `videos/weight-loss/`（后者为早期手工复制模板）。
- **RunningHub 角色一致性**：每角色维护一段固定外观描述作锚点，跨场景复用；场景 prompt 点名出场角色并留构图空白。
- **清理**：`npm run` 全量 clone 前注意 vendored 项目与大型媒体产物已被 `.gitignore` 排除。

## 环境注意（Windows）

- 不要向 C 盘写入下载 / 缓存；npm、pip 等缓存统一指向 `D:\APP\caches\`（参见用户配置）。
- 脚本大多以 **Node（.mjs）+ Python（.py，venv）** 运行；TTS 脚本依赖 venv 内的 edge-tts。