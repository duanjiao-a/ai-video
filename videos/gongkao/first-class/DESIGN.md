# first-class — 设计 spec（步骤4 + 步骤5 记录）

> 三源流水线：RunningHub 生图 → EdgeTTS 旁白 → Remotion 动画。
> 上游：`脚本.md`（步骤1）、`步骤2-生图.md`、`步骤3-TTS.md`。
> 状态：**成片已渲染** `out/main.mp4`（98.33s / 2948 帧 / 52.9 MB）。

## 一、基础信息

| 项 | 值 |
|---|---|
| 规格 | **1280×720 @ 30fps，2948 帧 = 98.27s** |
| 画幅 | 16:9 横屏 |
| 风格 | 海绵宝宝动画风背景 + 证书纸感卡片 |
| 生图 | RunningHub G-2 文生图，1k / low / 16:9（6 张） |
| 旁白 | edge-tts `zh-CN-XiaoxiaoNeural`，+20%（6 段，实测 98.26s） |
| BGM | **无**（用户明确"不需要 bgm"） |
| 动画来源 | **镜头卡库随机抽签**（`pick-cards.mjs`，seed=20270917），见第三节 |
| Composition | `Main`（`npx remotion studio src/index.ts`） |

## 二、卡点对齐（这次返工的主因）

### 2.1 上一版错在哪

上一版把画面元素的出场帧**手写死**（8 / 208 / 348 …），跟旁白没有任何关系。
用 srt 词级时间轴一量，偏差是这样的：

| 画面元素 | 上一版出场帧 | 该词实际被念到 | 偏差 |
|---|---|---|---|
| r1「国考 = 中央机关」 | 8 | 119 | **早 3.7s** |
| r1「大半岗位/只招应届生」 | 348 | 578 | **早 7.7s** |
| r2「岗位多 · 离家近」 | 208 | 277 | 早 2.3s |
| r3「应届生：两个都报」 | 8 | 90 | 早 2.7s |
| r4「上岸概率更高」 | 210 | 361 | **早 5.0s** |

画面永远比旁白先讲，观众看到的就是"上面在动的和嘴里说的不是一回事"。

### 2.2 现在的做法：卡点不手写

`build-captions.py` 新增卡点输出，产出 `src/narration.ts`：

```
export const A: Record<string, { abs; rel; end }> = { 'r1.central': {abs:630, rel:119, end:139}, ... }
```

- 现在共 **44 个卡点**，每一个都是「这句话在第几帧被念到」的反推值：
  把「去掉标点的旁白全文」与「srt 词串拼接」做逐字等式校验（6 段全等），
  由此把词时间戳映射回原文每个字，再查短语的起止帧。
- `Main.tsx` 的 SFX 表 `from` 字段**全部**写 `A['xxx'].abs`，没有一个是字面量。
- 各卡窗口的 `Sequence from` / 卡片内部阈值同样取 `A[...]`；`Scenes.tsx` 里
  每个窗口上方都注释了它对齐的是哪个卡点。
- `Main.tsx` 末尾有一条断言：`SHOT_START[cat] !== SHOTS[x].from` 就抛错，
  防止"改了分镜起点忘了改卡点表"造成整体错位。

查词工具：`python build-captions.py --find "中央机关"`。

## 三、动画来源：从镜头卡库随机抽签

### 3.1 抽签规则

`pick-cards.mjs`（seed=20270917，可复现）从
`ai-video-v6/shotcraft-remotion/cards/` 抽卡，只抽**可移植**的：
demo 用 `<DesignStage>`（480×270 设计坐标等比放大）+ 不依赖
`@remotion/motion-blur` + 不依赖 `_textures/` 整页截图。
157 张卡里符合条件的有 **52 张**。

### 3.2 抽中并落地的 11 张

| 槽位 | 卡（类别） | 卡内核 | 本片换掉的部分 |
|---|---|---|---|
| open | `typography/vertical-word-roll-blur-cycle` | 句干不动 + 三行遮罩窗竖向滚轮，相邻行垂直 blur + 落定染色 | 占位词 → 旁白里的词；灰底 → 纸面牌；进度源 → 窗口内帧 |
| r1 | `ui-entrance/platform-hinge-rise` | 底座 scaleX 撑开 → 圆牌落下 → 两块主体绕底角反向翻起 + 阻尼摆动 → 结论台升入 | SUBJECT/CONTEXT/OUTCOME → 中央机关 / 直属机构 / 统一招录公务员 |
| r2 | `data/avatar-grid-radial-build-colorize` | 网格按环号分环生长（只显形不位移）+ 铺满后随机格染色 + 中央挖空 | 头像占位 → 招录层级词；红格语义 → 联考集中 |
| r3 | `effects/assemble-then-type-flyin` | ① 空骨架四方飞入贴合 ② 文字逐字 3D 旋转落位 | Acme 占位版面 → 两张报名表 |
| r4 | `ui-entrance/list-reveal` | 逐项 outBack 找位 + 整容器线性漂移（两层运动分离） | Dashboard/Settings → 往届生优势四条 |
| outro | `outro/logo-shrink-wordmark-lockup` | 切口弧环 5.4→1 收束（带过冲刹车）→ 愈合 → 左移让位 → 字标逐字落定 | BRAND → 国考省考；标语 → 记忆口诀 |
| cut1 | `transition/white-flash-logo-simplify-cut` | 彩色液态字标 → 冲白 → 扁平字标 | 底色近黑 → 纸色 |
| cut2 | `transition/gradient-transition` | linear/radial/conic 三类渐变逐参数插值过渡 | 中央 label 换成切段名 |
| cut3 | `transition/cube-navigation` | rig 转面 + 法线明暗（面朝相机变亮、背离沉下去） | 六面 → 两面（来自/去向） |
| cut4 | `transition/mosaic-reframe` | 瓦片在两种排版间连续变形（位置/尺寸各自插值 + index 微 stagger） | 深蓝渐变砖 → 纸黄/海蓝/海绵黄三色 |
| cut5 | `effects/scanline-assemble-flyin` | 亮扫描线纵扫，扫到哪块就地飞入贴合（outBack + 残影 blur） | 近黑舞台 → 纸底墨线 |

**关于皮肤**：库里的 demo 是给产品暗场片调校的**中性灰占位件**
（`#0a0b10` 底 + SUBJECT/OUTCOME/Dashboard 假文案）。原样贴到海底场景上
既不对味也读不出内容，所以统一换成 `src/cards/skin.ts` 的纸感皮肤
（纸黄 / 墨蓝 / 海绵黄 / 印章红）。五个转场卡尤其明显：它们的原底色都是
近黑，全屏黑卡夹在明亮海底镜头里会读作"信号断了"，因此只保留各卡的动作、
把舞台换成纸色。

### 3.3 抽到的卡不够盖满整段怎么办

抽签只给了 6 张内容卡，而每段旁白 12–21s，单卡只有 3.5–6s。做法是
**把同一张卡的两条内核拆开用在不同的句子上**，不额外发明手法：

- `assemble-then-type-flyin` 的"骨架飞入"内核 → 也用在 r1 的四个招人单位牌
  （`parts.tsx` 的 `Tag`），"逐字 3D 落位"内核 → 也用在 r4/open 的行卡
  （`parts.tsx` 的 `FlyChars` / `Line`）。
- `vertical-word-roll-blur-cycle` 的滚轮内核 → open 用了两次：一次滚词
  （今天要学习的是 → 国考省考），一次滚数字（距离报名不到 → 30 天）。

## 四、分镜表与卡窗口

| # | shot | 帧区间 | 背景图 | 卡窗口（分镜相对帧） |
|---|------|--------|--------|--------------------|
| 1 | open | 0–510 | bg-open | 词轮 50–180（落定 95）· 数字轮 196–300（落定 242）· 字卡 296–428 · 字卡 452–511 |
| 2 | r1 | 511–1129 | bg-r1 | 平台翻起 100–210（双面落定 119）· 单位牌 218–338 · 字卡 400–540 · 字卡 542–619 |
| 3 | r2 | 1130–1753 | bg-r2 | 字卡 60–160 · 单位网格 160–410（标题 277 / 染色 361）· 字卡 396–506 · 字卡 506–624 |
| 4 | r3 | 1754–2175 | bg-r3 | 装配合成 60–420（两个都报 90 / 国考表 122 / 省考表 165 / 错开 227 / 翻倍 377） |
| 5 | r4 | 2176–2593 | bg-r4 | 字卡 36–96 · 字卡 88–164 · 字卡 164–198 · 优势列表 196–406（行 206/240/264/320）· 字卡 356–418 |
| 6 | outro | 2594–2947 | bg-outro | 字卡 0–40 · 字标锁定 36–336（收束 43 / 让位 77 / 字标 80 / 口诀 143 / CTA 257） |
| — | 合计 | **2948** | 6 张 | 5 个切点：511 / 1130 / 1754 / 2176 / 2594 |

转场卡跨骑窗口：**切点前 16 帧起、共 24 帧**。偏前侧是有意的——切点前的
16 帧基本落在上一段 MP3 的尾部静音里，切点后只压 7 帧（≈0.23s，仍在下一段
起音间隙内），这样转场不盖住下一句开头和刚出现的字幕。

## 五、底部字幕

- **内容 = 旁白全文照抄，不精简**：`build-captions.py` 切成 **44 块**
  （open 8 / r1 8 / r2 10 / r3 6 / r4 7 / outro 5），最长 21 字。
- **只在标点处切**：第一版按"≤14 字"硬切，切出了「招|录公务员」「三|月」
  「更|高」「上|岸」这种断在词中间的读法，还产出过 1 个字、只显示 7 帧的碎块。
  中文没有空格，按字数切必然切坏双字词。改成句末标点必切 + 逗号类累计 ≥9 字
  才切 + 26 字安全阀后，44 块全部落在句读上。
- 时间轴来自 srt 词级时间戳（见 2.2 的对齐方法），不是按字数平均分配。
- 字高 40px @720p ≈ 5.6% 帧高，等价 1080p 的 60px 档（aesthetic-rules Q11）。
- 生成命令：`npm run captions`（改文案或重录 TTS 后必须重跑）。

## 六、声音

两条轨：TTS 旁白 + SFX 钉帧表，无 BGM。SFX 的 `from` 全部取 `A[...].abs`。
音色只用真实物件拟音（纸 / 打字机 / 钟表 / 水泡 / 水晶），不用合成 UI 提示音
（aesthetic-rules S1）。5 个切点各配一次 `transition/whoosh-big`。

未做：aesthetic-rules S5 的输出音轨偏移补偿（AAC priming ≈1.28f @30fps）。
影响 ≈43ms，对词级字幕不构成可感知错位。

## 七、工程结构

```text
src/
├── index.ts / Root.tsx       入口 + Composition（1280×720 / 30fps / 2948f）
├── captions.ts               自动生成：底部字幕块
├── narration.ts              自动生成：44 个卡点（abs / rel / end）
├── cards/                    ← 从卡库移植的组件（本片动画都在这里）
│   ├── motion.ts             卡库共享件 E / seg / lerp / rand + useLocalT
│   ├── skin.ts               纸感皮肤（色板 / 材质 / 描边）
│   ├── parts.tsx             FlyChars / Tag / Line（跨场景复用的卡内核）
│   ├── WordRoll.tsx          ← typography/vertical-word-roll-blur-cycle
│   ├── HingeRise.tsx         ← ui-entrance/platform-hinge-rise
│   ├── UnitGrid.tsx          ← data/avatar-grid-radial-build-colorize
│   ├── AssembleForms.tsx     ← effects/assemble-then-type-flyin
│   ├── BenefitList.tsx       ← ui-entrance/list-reveal
│   ├── OutroLockup.tsx       ← outro/logo-shrink-wordmark-lockup
│   └── cuts.tsx              ← 5 张转场卡
└── skeleton/
    ├── Main.tsx              总装：SHOTS / TTS / SFX 钉帧 / 分镜 / 转场卡
    ├── Scenes.tsx            6 个分镜 = 背景 + 卡窗口（帧号全部来自 narration.ts）
    ├── SceneBg.tsx           背景图 + 1.00→1.03 缓推 + 气泡 + 顶部 scrim
    ├── Caption.tsx           底部字幕
    ├── Bubbles.tsx           气泡层（固定种子 PRNG）
    └── style.ts              字幕/气泡用的基础 tokens
```

`src/lib/` 是脚手架带过来的通用组件（3D/PageCam 等），本项目未使用；
其依赖 `three` / `@react-three/fiber` 未安装，已在 `tsconfig.json` 里 exclude。

## 八、命令

```bash
npm run captions     # 重生成 src/captions.ts + src/narration.ts（改文案/重录 TTS 后必跑）
npm run typecheck    # tsc --noEmit
npm run dev          # remotion studio 预览
npm run render       # 渲染成片 → out/main.mp4
node pick-cards.mjs  # 重看这次抽签结果（同 seed 结果相同）
node qa-frames.mjs out/qa   # 逐帧体检
```

## 九、QA 记录

已抽 **32 帧**渲染静帧（`out/qa/`，帧号全部对着卡点选），`qa-frames.mjs` 量化：

| 检查项 | 方法 | 结果 |
|---|---|---|
| 有没有黑屏/空屏 | 全帧亮度 + 各带 edge | 无空帧；卡片之间是刻意的"呼吸帧"（无大字属设计） |
| 卡点对不对得上旁白 | 帧号直接取自 `A[...]`，人工比对锚点表 | 全部一致（帧号不是手写的，无法漂移） |
| 卡片是否真的渲出来 | 上 30% 白像素占比 | 有卡的帧 4–58%；`f630/f740/f1300` 等 0.02–0.04% 是**卡片还在入场中**或卡片画在 216px 以下（度量带不覆盖），非缺失 |
| 底部字幕是否居中 | 字幕带左右留白对称性 | 卡片不侵入字幕带后，对称性恢复（差 ≤1.5 个百分点） |
| 转场卡是否突兀 | 全帧亮度 | 首版 5 张卡全是近黑舞台（亮度 29–74）→ 已改纸色舞台（100–227） |
| 网格是否压住字幕 | 视觉带重叠 | 首版 5 行网格第 5 行压到字幕带 → 改 4 行 + 网格下止 576px |
| **角色是否在场 / 形象是否统一 / 画风是否是原版动画风** | **需要人眼** | **未验证** |
| **卡片有没有挡住角色 / 观感是否顺** | **需要人眼** | **未验证** |
| **多音字读音（招录 / 户籍 / 往届）** | **需要人耳** | **未验证** |
| **SFX 音量是否合适** | **需要人耳** | **未验证（我是按语义盲选的）** |

## 十、遗留

1. **6 张背景图仍未人眼核对**（步骤2 的门被"直接步骤三"跳过）。
2. 背景图 1360×768 按 `objectFit: cover` 裁进 1280×720，左右各裁约 2.6%，
   角色若贴边会被裁到。
3. 卡片尺寸/位置是按 1280×720 手排的，未与人眼确认过是否压住角色。
4. 音轨偏移补偿未做（见第六节）。
