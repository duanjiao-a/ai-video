# shotcraft-remotion — 三源流水线 Remotion 工具库

从 ai-video-2（video-shotcraft）抽取固化的可复用资产与脚本，用于**RunningHub 生图 →
EdgeTTS 旁白 → Remotion 动画**的三源流水线视频制作。做新视频不需要再翻原仓库。

## 目录结构

```text
shotcraft-remotion/
├── scaffold.mjs               # 脚手架：一键新建视频项目
├── scripts/
│   ├── generate-textures.mjs  # RunningHub 批量生图（manifest 驱动，幂等）
│   └── generate-tts.py        # EdgeTTS 旁白（mp3 + srt + durations.json）
├── remotion/                  # 固化 Remotion 骨架（scaffold 拷贝源）
│   ├── src/lib/               # 通用组件：PageCam / Caption / DigitRoll / FlashCut / FlatPanel / ClipCard / VerticalTicker / helpers
│   └── src/skeleton/          # 三源骨架：Main / Scenes / SceneBg / BigText / Caption / style …
├── cards/                     # 镜头卡库（用卡先校验卡名 → 读卡 → 拷源码）
│   ├── library.json           # 卡名 → style-key 校验索引（gallery/api 导出）
│   ├── shots/                 # 157 张镜头配方卡（10 个功能分类）
│   ├── sequences/             # 可复用整片结构模式
│   └── demos/                 # 221 个参考实现 TSX（含 _fixtures / _textures）
├── audio/sfx/                 # 149 个 SFX，16 类（transition/impact/riser/camera/…）
└── docs/                      # 方法论
    ├── pipeline.md            # 端到端生产流水线
    ├── aesthetic-rules.md     # 视觉 QA 准则
    ├── sound-design.md        # SFX 分类索引与用法
    ├── music-beat-sync.md     # BGM 卡点
    └── guided-free-creation.md# 共同创作流程
```

## 快速开始

```bash
# 1. 新建项目（--sfx 拷入 SFX 库，--install 自动装依赖）
node scaffold.mjs --out ../videos/my-video --sfx --install

# 2. 写 DESIGN.md 分镜表，再生成背景图
node scripts/generate-textures.mjs --manifest textures.json --out ../videos/my-video/public/textures

# 3. 生成旁白 + 字幕
python scripts/generate-tts.py --segments segments.json --out ../videos/my-video/public/audio/tts

# 4. 在项目里适配镜头卡、预览、渲染
cd ../videos/my-video && npm run dev
npm run render                    # 带 BGM 版
npm run render:nobgm              # 无 BGM 版（--props=props-nobgm.json）
```

## 三源流水线规范

| 步骤 | 工具 | 产物 |
|---|---|---|
| 1. 分镜 | 手写 | `DESIGN.md`（scaffold 已生成模板） |
| 2. 生图 | `generate-textures.mjs` | `public/textures/bg-<场景>.png` |
| 3. 旁白 | `generate-tts.py` | `public/audio/tts/tts-<段>.mp3` + `.srt` + `durations.json` |
| 4. 动画 | Remotion 骨架 + 镜头卡 | `src/skeleton/` 逐镜头适配 |
| 5. 渲染 | `npm run render` | `out/*.mp4`（带/无 BGM 两版） |

**关键约定**：
- 命名：背景图 `bg-<场景>.png`；旁白 `tts-<段>.mp3/.srt`；时长回填 `durations.json`
- 帧号：TTS 段帧号 = `round(时长 × 30)`，与场景 Sequence、字幕区间严格对齐
- 确定性：禁 `Date.now()` / `Math.random()`，伪随机用固定种子（见 `src/lib/helpers/rand.ts`）
- 节奏：每镜头单一动效，落定后 hold ≥ 0.5s；SFX 帧号写死不再平移
- 镜头卡：先 `cards/library.json` 校验卡名 → 读 `cards/shots/` 卡片全文 → 按"参考实现"定位 `cards/demos/` 准确源码，复制适配（改背景/文案/色板，保留缓动时值、转场、已知坑规避等调校参数）

## 生成脚本用法

### generate-textures.mjs（RunningHub 批量生图）

```bash
node scripts/generate-textures.mjs --manifest textures.json --out <视频>/public/textures [--host ai] [--key <key>]
```

`textures.json`：

```json
{
  "style": "海绵宝宝动画风格，明亮卡通渲染，粗黑描边，16:9 宽银幕构图，无文字无水印",
  "assets": [
    { "file": "bg-open.png", "prompt": "海底小镇全景，阳光光束……", "aspectRatio": "16:9", "resolution": "1k", "quality": "low" }
  ]
}
```

- 幂等：已存在则跳过；单张失败不中断，末尾汇总可重跑
- 密钥：`--key` > 环境变量 `RUNNINGHUB_API_KEY_AI`/`RUNNINGHUB_API_KEY_CN` > 内置默认
- 单张模式：`--prompt "……" --out ./output`（v4 兼容）

### generate-tts.py（EdgeTTS 旁白）

```bash
python scripts/generate-tts.py --segments segments.json --out <视频>/public/audio/tts \
    [--voice zh-CN-XiaoxiaoNeural] [--rate 1.2] [--timeout 30] [--retries 3]
```

`segments.json`：

```json
[
  { "name": "tts-open", "text": "为什么你减肥总是失败？" },
  { "name": "tts-r1", "text": "第一，节食越狠，反弹越凶。" }
]
```

- edge_tts 6.x/7.x 兼容；流式超时兜底 + 重试 + 空文件清理（服务不稳定，必须带重试）
- 幂等：已生成则跳过；输出 mp3 + srt（词级时间戳）+ `durations.json`

## BGM

工具库不内置 BGM（避免重复占地）。从 `ai-video-2/assets/audio/bgm/` 按需拷贝到项目
`public/audio/`，并在 `src/skeleton/Main.tsx` 的 `bgmVolume`/`<Audio>` 处改文件名。
两版渲染：`npm run render`（带）与 `npm run render:nobgm`（无）。

## 依赖

- Node ≥ 16（`@remotion/cli` 4.0.484 / remotion 4.0.484 / react 19）
- Python + `pip install edge-tts`
- 部分 demo 需 `@remotion/motion-blur`（见 `cards/demos/README.md`）
- 渲染：Chrome headless-shell（Remotion 自动下载）；低核机器加 `--concurrency=1`
