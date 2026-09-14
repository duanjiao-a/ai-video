# ai-video-2（video-shotcraft）提示词总结

ai-video-2 实际是 **`video-shotcraft`** —— 一个面向 AI Agent（Claude Code / Codex）的电影感产品宣传片制作技能库。基于 [Remotion](https://www.remotion.dev/) 框架，通过**真实页面截图 + 2.5D 运镜 + 节奏卡点 + 电影级 SFX** 生成确定性、帧精确的宣传片。

- 规模：**152 张镜头配方卡 · 209 个动态样片 · 1 套已验收完整模板（Ink Press）**
- 入口文件：[SKILL.md](file:///d:/APP/trae/traeProject/ai-video/ai-video-2/SKILL.md)
- 在线画廊：[vincentwei1021.github.io/video-shotcraft](https://vincentwei1021.github.io/video-shotcraft/)（可浏览样片、多选复制卡名）

---

## 一、通用提示词模板（复制后只换主题即可套用）

> 用法：把下面「【…】」里的内容换成你的主题，其余保留。三套模板覆盖三种完整宣传片模式；单镜头模板做局部动效。

### 模板 1：自主自由创作（最常用，风格全权交给 Agent）

```text
用 video-shotcraft 给【主题：如 XX 产品 / XX 角色 / XX 主题】做一支【约 45 秒】1920×1080 的宣传片，
风格从【主题】自身的视觉里生长，你全权决定视觉方向、镜头、素材和音频，连续推进到成片，中途不用等我确认。

【主题素材】：【产品路径 / 网站 URL / 录屏 / 角色资料 / 页面截图】
【核心卖点】：【一句话核心价值】
【必须展示的内容】：【功能 1 / 角色特征 1 / 亮点 1】、【功能 2】、【功能 3】
【目标受众】：【谁在看，什么场景】
【规格】：【时长 ~45s，画幅 1920×1080 @ 30fps，语言 中文/英文】
【风格约束】：【可选：指定基调，如"纸墨琥珀"/"科技 HUD"/"柔和治愈"；不写则 Agent 从主题视觉提取】
【镜头约束】：【可选：点名要用的镜头卡，如 "用 deck-deal-flyin 和 row-embed"】
【BGM】：【已选某曲路径 / 由 Agent 按主题气质选强鼓点电子底】
【数据合规】：【公开演示数据 / 需要脱敏 / 全部虚构 mock】
【验收要求】：【交付带 BGM + 无 BGM 两版；完成后出静帧让我验收】
【导出】：【完成后导出剪映工程文件】
```

### 模板 2：共同创作（要参与关键决策时）

```text
用 video-shotcraft 给【主题】做一支宣传片，关键决策我想参与确认。
【主题素材】：【路径/URL/资料】
【主题定位】：【一段描述】
【目标受众】：【描述】
【BGM】：【已选某曲路径，或待定】
在产品简报、视觉方向、镜头映射、最终分镜四处暂停等我确认，其余你来推进。
```

### 模板 3：模板路线（直接复刻 Ink Press 纸墨琥珀风）

```text
用 video-shotcraft 的 Ink Press 模板给【主题】做一支宣传片。
【主题素材路径】：【本地 dev server URL 或仓库路径】
【必须展示的内容】：【功能/内容 1】、【功能 2】、【功能 3】
【数据口径】：【公开演示数据 / 脱敏 / 全部虚构 mock】
终渲交付：带 BGM 版 + 无 BGM 版两版。
```

### 模板 4：单镜头 / 单动效

```text
用【镜头卡名，如 spotlight-hero-card】这张卡给【主题】做一段【开场动效】：
主角元素：【素材路径】
背景页面：【素材路径】
目标画幅：1920×1080，时长约【4.6s】
完成后出静帧让我验收。
```

### 换主题时必改 / 不必改的字段

| 必改（主题相关） | 不必改（通用约束，保留即可） |
|---|---|
| 主题名称、素材路径/URL、角色或产品资料 | 画幅 1920×1080 @ 30fps、时长量级 |
| 核心卖点 / 必须展示的内容清单 | 三件套采集（真实截图 + 元素切片 + layout.json） |
| 风格基调（或授权 Agent 从主题视觉提取） | 数据合规口径、确定性渲染、双版本终渲 |
| 点名的镜头卡（可选） | 呼吸/hold 帧预算、SFX 钉帧表、独立终检 |

> 注意：**"视觉语言必须从主题自身生长"** 是硬规则——换主题时不要沿用上一个主题的配色/字体/材质，要让 Agent 从新主题的设计系统或视觉资料重新提取 tokens。

---

## 二、调用入口与四种模式判断

完整宣传片有三种互不合并的模式 + 一种单镜头用法。调用前先判断用户是否已明确选择；已选择时直接执行，不重复询问。

| 模式 | 触发语 | 流程 |
|---|---|---|
| **① 模板路线** | "用 Ink Press 模板做宣传片" | 读 [template/TEMPLATE.md](file:///d:/APP/trae/traeProject/ai-video/ai-video-2/template/TEMPLATE.md)，按"换产品复现指南"逐镜头替换素材/文案/品牌 |
| **② 自主自由创作** | 授权 Agent 全权决定 | 读 [references/pipeline.md](file:///d:/APP/trae/traeProject/ai-video/ai-video-2/references/pipeline.md)，阶段 0 连续推进到阶段 7，不逐阶段暂停 |
| **③ 共同创作** | "关键决策我想参与确认" | 读 [references/guided-free-creation.md](file:///d:/APP/trae/traeProject/ai-video/ai-video-2/references/guided-free-creation.md)，在产品简报/视觉方向/镜头映射/分镜处逐级确认 |
| **④ 单镜头/单动效** | 点名某张镜头卡 | 按 Gallery 名称解析规则校验卡名 → 读卡全文 → 按"参考实现"定位 demo TSX → 适配素材 |

**两个例外**（不再询问模式）：
- 用户已点名 Ink Press 模板 → 视为模板模式已选定，直接执行；
- 用户已明确指定镜头卡 → 镜头约束已选定，直接按卡实现；若还需做完整宣传片，只询问"自主自由创作还是共同创作"。

**用户尚未提供可检查的项目时**：先做最小只读产品检查（定位/功能/页面视觉/可展示状态/素材风险），给出三种模式并说明各自依据与 Agent 推荐，明确询问"根据产品检查，我推荐 ×× 模式，要按这个继续吗？"——不默认推荐 Ink Press。

---

## 三、提示词骨架（每部分作用）

```text
[mode]       模板路线 / 自主自由创作 / 共同创作 / 单镜头
[theme]      主题名 + 素材路径/URL/资料（换主题时只动这里）
[spec]       时长 + 画幅（1920×1080 @ 30fps）+ 语言
[style]      视觉方向（从主题提取 tokens）或指定 Ink Press / 授权 Agent 自选
[shots]      指定镜头卡名（可选）或交由 Agent 选卡
[audio]      BGM（已选/未选）+ 是否配音 + SFX 词汇
[data]       数据合规口径
[accept]     验收要求（静帧/双版本/剪映导出）
```

| 部分 | 作用 | 说明 |
|------|------|------|
| **Mode（模式）** | 选择工作流 | 三种模式不可合并；已选则不重复询问 |
| **Theme（主题）** | 制作输入 | 产品路径/网址/录屏/页面截图/角色资料皆可；换主题时唯一必改项 |
| **Spec（规格）** | 时长 + 画幅 | 默认 1920×1080 @ 30fps；Ink Press 模板为 36.2s |
| **Style（风格）** | 视觉方向 | 从主题设计系统提取字体/色板/栅格 tokens，不另造"宣传片皮肤" |
| **Shots（镜头卡）** | 指定动效 | 命名需匹配 `gallery/api/library.json` 的 `style-key` |
| **Audio（音频）** | BGM 与 SFX | 已选 BGM 必须先做节奏分析再分镜；BGM 用 `bgm` inputProp 包住 |
| **Accept（验收）** | 交付标准 | 静帧验收 + 双版本终渲 + 剪映工程导出（可选） |

---

## 四、八阶段流水线（自主自由创作）

[references/pipeline.md](file:///d:/APP/trae/traeProject/ai-video/ai-video-2/references/pipeline.md) 的完整流程；共同创作从阶段 4 接入，不重跑阶段 0–3。

| 阶段 | 目标 | 产出 |
|------|------|------|
| **0 产品理解** | 只读检查定位/功能/页面/视觉 tokens/数据风险 | 产品简报；需求到执行决策表；数据与音频约束 |
| **1 视觉方向** | 用静态 styleframe 锁定全片色板/字体/光感/运镜气质 | 选定方向 styleframe；tokens + 动效性格表 |
| **2 镜头映射** | 为每个必须展示的功能选运动语法（不写完整分镜） | 功能到镜头映射表；选中卡名 + demo 源码定位 |
| **3 分镜放行** | 排成有能量曲线的镜头序列，转成帧级实施计划 | 设计 spec（含分镜表）；帧级时间轴 |
| **4 素材采集** | 起本地 dev server，跑 capture 脚本产出三件套 | 整页 2x 截图、元素切片、layout.json |
| **5 逐镜头实现** | 按帧级时间轴逐镜头落地，每镜头完成即静帧验收 | 逐镜头 commit；`out/qa/` 静帧档案；每轮全片 mp4 |
| **6 声音设计** | BGM 定能量骨架，SFX 逐拍钉帧（画面锁定后才动） | 带声整片；SFX 钉帧表（相对帧表达式） |
| **7 验收** | 独立 subagent 终检 + 对照 aesthetic-rules 过 checklist | 审查报告 + 终渲成片（带 BGM / 无 BGM 两版） |

**两条执行原则**：
1. 最终设计 spec + 分镜共同构成制作放行；放行后不重新打开已确认的业务/创意问题。
2. 验收贯穿全程——每个镜头以 `npx remotion still` 静帧肉眼验收收尾，不是最后一个阶段才验收。

### 全片能量骨架（promo-energy-arc）

[references/sequences/promo-energy-arc.md](file:///d:/APP/trae/traeProject/ai-video/ai-video-2/references/sequences/promo-energy-arc.md) 是分镜阶段的默认填空骨架（模板片 1085f 与两次独立复现均收敛到同一骨架）：

| 段位 | 时长占比 | 能量 | 职责 | 候选卡 |
|------|----------|------|------|--------|
| ① 品牌开场 | 8–12% | 低 | 字标压印 + hold ≥1s，交棒产品页面 | brand-ink-open |
| ② 单主角立传 | 12–15% | 中 | 一个主角、一条完整动作弧 ≥3s | spotlight-hero-card |
| ③ 功能爬升段 | 55–65% | 中高⇄低交替 | 每镜绑一个独特功能，一种手法只当一次主角 | deck-deal-flyin / type-and-filter / list-stack-press / row-embed 等 |
| ④ 发布会收场 | 13–16% | 峰值 | 已展示功能各出代表元素合影围住字标 | outro-group-photo-launch |

**填空流程**：列功能清单 → 数功能镜头数 N → 按段位表分配总帧数（先扣 ①②④ 与字卡预算，剩余给 ③ 均分；**每镜先划走 hold/rest 帧再排动效**）→ ③ 段高能量镜与稳节奏镜间隔排列 → 逐槽位扫 shots/ frontmatter 挑卡 → 逐接缝选转场式。

**呼吸字卡规则**：每 1–2 个功能镜头后插一张 paper-title-card，单张 50–55f（≈1.8s），全片 2–4 张；字卡文案与 outro 重复即删。

---

## 五、镜头配方卡分类（152 张 / 10 大类）

[references/shots/](file:///d:/APP/trae/traeProject/ai-video/ai-video-2/references/shots) 下的镜头词汇库：

| 类别 | 用途 | 代表卡 |
|------|------|--------|
| **camera（运镜）** | 2.5D 相机运动、3D 场景 | basic-3d-scene、crash-zoom-punch、graze-face-tour、terminal-3d、space-camera-moves |
| **data（数据）** | 数据可视化、计数、粒子 | counter-confetti、chart-live-moves、timeline-travel、odometer-digit-roll、particle-sand-fill |
| **effects（特效）** | 光效、扫描、HUD、冲击反馈 | spotlight-sweep-moves、impact-feedback、slam-entrance-moves、aurora-bloom-bg-flip、fui-hud-moves |
| **interaction（交互）** | 真实交互动作演示 | ai-stream-response、command-palette-summon、theme-switch-moves、type-and-filter、voice-waveform-live |
| **opening（开场）** | 品牌开场、立主角 | brand-ink-open、spotlight-hero-card、crane-rise-reveal、fracture、text-as-mask |
| **outro（结尾）** | 收尾、logo 落定、字标退场 | outro-group-photo-launch、grain-dissolve、ui-to-brand-morph、neon-triple-marquee |
| **rhythm（节奏）** | 卡点、蒙太奇、分屏 | beat-cut-moves、smear-multiples、speed-ramp-freeze、panel-grid-moves、trailer-grammar-moves |
| **transition（转场）** | 场景切换、镜头过渡 | shot-transitions（whip-pan/portal-wipe/mask-wipe 六式）、card-flip-reveal、cube-navigation、page-turn-transitions |
| **typography（文字）** | 文字入场、字体动效 | scramble、split-flap-title、flying-words、gradient-word-sweep、paper-title-card、typing-code-block |
| **ui-entrance（UI 入场）** | UI 元素入场、组件组装 | deck-deal-flyin、row-embed、card-stack、radial-wave、skeleton-reveal、list-stack-press |

每张卡含：用途、能量、建议时长、参数表、实现笔记、已知坑、参考实现路径。**用卡前必须**：用 `gallery/api/library.json` 校验卡名与 `style-key` → 读卡全文 → 按"参考实现"定位准确 demo TSX 全文——demo 源码是调校过的参数真相（缓动、时值配比、摘罩时机、已知坑规避），凭卡名新写等于放弃全部调校积累。

---

## 六、品牌→动效参数推导表

不凭手感挑 easing/时长，先把主题放到两根轴上：
- **能量轴**：低（沉稳/premium）↔ 高（运动/startup/娱乐）——决定时长、过冲、squash 幅度
- **调性轴**：严肃（金融/医疗/enterprise）↔ 活泼（消费/社交/儿童）——决定路径曲直、次级动作多寡

| 预设（品类） | 主时长@30fps | 入场 easing | 过冲 | squash |
|---|---|---|---|---|
| 专业信赖（fintech/enterprise/B2B）| ~21f | bezier(0,0,0.2,1) | 1.0 不弹 | 0 |
| 精致高端（奢侈品/时尚）| ~48f | bezier(0.4,0,0.6,1) | ≤1.02 | 0 |
| 活力大胆（体育/游戏/startup）| ~18f | bezier(0.16,1,0.3,1) | 1.12 | 0.25 |
| 活泼愉悦（消费/社交）| ~27f | bezier(0.34,1.56,0.64,1) | 1.08 | 0.18 |
| 平静关怀（健康/教育）| ~42f | ease-in-out 对称 | 1.0 | ≤0.04 |
| 亲和友好（小微/社区）| ~26f | bezier(0.25,0.46,0.45,0.94) | 1.04 | 0.08 |

自检两条：①用三个词描述成片动效，与品牌词对得上吗；②同一套 tokens 必须同时管入场/转场/hold 节奏——一个品牌一种动效嗓音，混用两套读作拼盘。落地要弹的场合 y1 必须 >1；"专业信赖不弹"指无落地隐喻的淡入/推移类动作。

---

## 七、声音设计词汇表

### BGM 选型
- 已选 BGM → 先做节奏分析（librosa 网格拟合求真实 BPM/相位 + kick/snare/hihat 三分类鼓点定位），网格按瞬态覆盖率验收通过后才分镜；渲后从成片抽音轨回测切点误差 ≤3f
- 未选 → 按片种选强鼓点、强节奏的电子底（tech-house 类），判据是"典型的产品宣传视频"气质；候选曲必须垫进成片试听，单听曲子不可靠
- BGM `<Audio>` 用 `bgm` inputProp 包住（与 SFX 解耦），终渲固定交付两版：带 BGM 版 + 无 BGM 版（保留 SFX）

### SFX 五大词汇（按片种选，不按事件选）

| 词汇 | 含义 | 目录 |
|------|------|------|
| **whoosh** | 运镜飞入 | `transition/` |
| **impact** | 落地、冲击 | `impact/` |
| **riser** | 铺垫、能量爬升 | `riser/` |
| **sparkle** | 光效、扫描 | **`light/`**（无 `sparkle/` 目录） |
| **transition** | 场景切换 | `transition/` |

**S1 禁音色不禁动作**：禁用游戏音包**音色**（合成器 pluck/bloop、卡通弹跳）；画面真有点击/开关/碎裂就该配拟音。`sfx/ui/` 需逐个试听（18 个里一半以上是合成反馈音 tone/bleep/notification，正属禁列，只有 `switch-*` 等少数是真实开关拟音）；`sfx/glass/` 是真实碎裂材质音不在禁列。

### 16 类 SFX 目录速查（共 149 个）

| 类别 | 数量 | 装什么 |
|------|------|--------|
| `transition/` | 23 | whoosh / sweep / swoosh / 风 |
| `impact/` | 14 | 冲击 / 砸 / 落地 |
| `light/` | 10 | sparkle / 光效 / 魔法（词汇表的 sparkle） |
| `paper/` | 10 | 翻页 / 撕纸 / 纸张 |
| `text/` | 13 | 键盘 / 打字 / 粉笔 / 笔 |
| `camera/` | 10 | 快门 / 对焦 / 变焦 |
| `data/` | 13 | 数字 / 故障 / 扫描 |
| `ui/` | 18 | 开关 / 选择 / 提示音（需逐个试听） |
| `film/` | 8 | 胶片 / 唱片 / 投影 |
| `scifi/` | 5 | 高科技 / 太空 / 机械 |
| `mech/` | 8 | 门锁 / 齿轮 / 机械 |
| `glass/` | 4 | 玻璃碎裂（真实材质，不在禁列） |
| `fluid/` | 5 | 水 / 沙 / 液体 |
| `counter/` | 4 | 时钟 / 倒计时 |
| `crowd/` | 3 | 掌声 / 心跳 |
| `riser/` | 1 | 电影级 riser |

### 关键钉帧规则
- **声明式钉帧表**：单文件 `{ from, src, volume }[]`，逐条注释对应画面动作；**from 一律写相对表达式**（`SHOTS.x.from + offset`，卡点片写 `beatF(n)`），绝不写裸数字帧号——时间线平移时钉帧表自动跟随
- **长样本（>5s，库里 21 个）必须显式给 `durationInFrames`**：靠 Sequence 截断而非剪音频文件
- **音量按素材实测峰值给**：`volume` 是乘法系数不是目标音量；库里 7 个录得轻的素材（峰值 <-12dB）照抄 0.2–0.6 会被鼓底盖住，首选换同类别录得好的素材或预归一化，必要时给 >1 增益（须以渲染产物验峰防削波）
- **连发防机枪感三招**：双样本交替、音量阶梯递减（如 pop 六连 0.40→0.25）、间隔加速贴动画曲线
- **结尾固定句式**：`riser`（组装段起）→ `impact`（字标落地，全片音量峰值）→ `sparkle`（余韵，取自 `sfx/light/`）

---

## 八、审美准则（核心判例速查）

[references/aesthetic-rules.md](file:///d:/APP/trae/traeProject/ai-video/ai-video-2/references/aesthetic-rules.md)：

### 节奏（R）
- **R1**：关键信息落定后必须呼吸，品牌字标 hold ≥1s（30f）
- **R2**：速度感来自加速度不是匀速快；群体运动挂物理隐喻，收尾留 0.5s 停顿
- **R3**：节奏宁慢勿快；主体动作弧 ≥3s，交互演示按真人操作速度

### 质感·运镜·构图（Q）
- **Q1**：复刻既有页面必须真实截图；手搓 UI 限非复刻场景且质量/表达达标；数据按风险口径处理
- **Q2**：3D 透视下 UI 纹理按原生尺寸 2–4 倍 rasterize 后向下采样；放大走布局级 CSS `zoom` 而非 transform scale（Chromium 先降采样再放大必糊，与相机/DoF 无关）；文字发糊先查纹理分辨率链路（2x 整页 + 关键元素 4x 单独截图），别先动相机/DoF
- **Q3**：镜头要稳，产品宣传片默认不加手持抖动
- **Q4**：高光/扫光宁缺毋滥，不群发，一个镜头最多给主角一次，必须裁进圆角边界
- **Q5**：开场只给一个主角——单主体 + 完整动作弧（聚光→推近→悬浮→归位）
- **Q6**：机位服务可读性——信息密集镜头正视，文字特写侧向水平，风格化倾斜逐镜头验证
- **Q7**：物件特写四件套——侧面倾斜角 + 可感知高度 + orbit 环绕 + 反差深色材质背景
- **Q8**：结尾做成"发布会合影"——全片元素四方飞入围住字标，能量推到全片峰值（crane + 舞台光 + 粒子）
- **Q9**：飞入动画终点必须是页面布局真实槽位，元素不悬浮在页面上方
- **Q10**：文档类镜头的 mock 内容要出版级——原生排版、文字铺满、完整版式（侧栏/评论）入镜
- **Q11**：要被读的文字有效字高：字幕 ≥56px（≥5.2% 帧高），辅助文字 ≥32px（≥3%）；按渲染帧实际像素量不按 fontSize；文字只有"纹理"（虚化）或"要读"（达标）两态，不存在中间态

### 声音（S）
- **S1**：配乐与音效按"片种"选——强鼓点电子底 + 电影系 SFX 词汇，禁游戏音包音色（禁音色不禁动作）
- **S2**：SFX 逐拍钉帧管理；连发音效做双样本交替 + 音量阶梯递减 + 间隔加速
- **S3**：声音永远排在画面锁定之后；时间线一动，SFX 全表重钉
- **S4**：拟音优先于装饰音——画面动作配该动作的真实声音，音频裁到与动作严格等长

### 文案（C）/ 流程（P）
- **C1**：文案在画面锁定后按最终镜头重写一遍，纯动画段落也配解说 caption，不留哑巴段落
- **C2**：标语写"主题 + 具体内容名 + 具体收益"，抽象隐喻词一律具体化
- **P1**：交付前必须自己渲染截帧逐一检查，不把首检交给用户
- **P4**：先列功能清单逐一对应镜头；一种动画手法全片只当一次主角，重复镜头/重复 tagline 一律删

---

## 九、八条核心理念

1. **复刻既有页面必须用真实截图**；手搓 UI 限非复刻场景，且质量与表达明确性是硬门槛。起 dev server → 无头浏览器截全页 2x 纹理 + 元素级抠图 + layout.json 坐标表。
2. **整支视频的视觉语言必须从主题自身生长**，不能另造一套不相干的"宣传片皮肤"。从主题设计系统提取字体/色板/栅格 tokens，片中所有元素复用或克制扩展这套 tokens。
3. **电影感来自运镜、光影、节奏与声音的配合**，不来自炫技动画。被反复认可的是单主角完整动作弧、物理隐喻驱动的加速度、侧斜机位 orbit 环绕特写、riser→impact→sparkle 的声音句式。
4. **每个镜头只讲一个动效；关键信息落定后必须呼吸**。一种动画手法全片只当一次主角；节奏偏好单向——历史反馈全部指向"放慢/停留"，从未有一次"太慢了"。
5. **强节奏 BGM 的片子，所有转场和动效必须卡在拍上**。librosa 网格拟合求真实 BPM/相位 + kick/snare/hihat 三分类鼓点定位，网格按瞬态覆盖率验收通过后才分镜；渲后从成片抽音轨回测切点误差 ≤3f。
6. **用镜头卡动效必须先解析 Gallery 索引并读准确的 demo 实现代码**。先用 `gallery/api/library.json` 校验卡名与 `style-key`，再按卡片"参考实现"定位具体 TSX；配方卡"已知坑/命门"标注的参数不得降档，质量标准只升不降。
7. **共同创作把廉价确认物前置，自主自由创作把同样的判断留作执行记录**。产品简报→需求到执行决策表→文字方向→styleframe→镜头映射→分镜的顺序不变。
8. **验收贯穿全程 + 交付前独立审查**。阶段 5 起每个镜头用 `npx remotion still` 出静帧自检，每轮修改后整片渲染 + ffmpeg 抽帧回看；交付前必须派干净上下文的 subagent 做独立终检（制作者有确认偏差，首检永远不能交给用户）。

---

## 十、核心组件与资产

### assets/lib/（可复用 Remotion 组件，copy 进新项目使用）

| 组件 | 作用 |
|------|------|
| **PageCam** | 2.5D 页面相机——一切"真实页面"镜头的地基（整页截图 + 关键帧 `{frame,cx,cy,zoom,rotX/Y/Z,persp}` 插值运镜；3D 放大走 CSS `zoom`，坐标按 `Tx = 960/zoom − cx` 换算） |
| **Caption** | 底部通栏解说字幕（≥60px 档） |
| **FlashCut** | 暖白闪转场，只盖硬切两侧 10f |
| **DigitRoll** | 里程表数字滚动 |
| **FlatPanel** | 3D 面板（需 `three` + `@react-three/fiber` + `@remotion/three`） |
| **VerticalTicker** | 3D 无限滚动墙 |
| **helpers/** | `rand`（确定性伪随机 mulberry32）、`shake`、`camera`、`motion`（缓动表） |

### 素材采集三件套
- 复制 [assets/scripts/capture-template.mjs](file:///d:/APP/trae/traeProject/ai-video/ai-video-2/assets/scripts/capture-template.mjs) 进项目，改 `BASE_URL` 与选择器
- 产出：**全页 2x 截图**（viewport 1920×1080、`deviceScaleFactor: 2`，截图前 `document.fonts.ready` + 600ms settle）+ **per-element cutout**（按语义选择器逐元素截图，透明底，可加空 backplate）+ **layout.json**（元素 `{x,y,w,h}` bbox + 每页 `pageH`）
- 支持按页/按元素增量重采；活数据源先按数据口径冻结/虚构/脱敏再采集

### 音频资产
- `assets/audio/bgm/` — 5 首 BGM 备选（强鼓点电子底）
- `assets/audio/sfx/<类别>/` — 149 个 SFX 按 16 类分目录
- 授权：Mixkit License（免费商用、免署名），见 [ATTRIBUTION.md](file:///d:/APP/trae/traeProject/ai-video/ai-video-2/assets/audio/ATTRIBUTION.md)

---

## 十一、推荐工作流

1. 安装技能：`npx skills add Vincentwei1021/video-shotcraft`（或 git clone + 软链到 `~/.claude/skills/` 或 `~/.codex/skills/`）
2. 在 AI Agent 中说"用 video-shotcraft 给【主题】做一支宣传片"（或直接粘贴第一章的模板）
3. 提供主题素材路径/网址/录屏/页面截图/角色资料
4. Agent 做最小只读主题检查，提供三种模式并推荐（或直接点名 Ink Press / 指定镜头卡）
5. 用户确认模式（或授权 Agent 自选）
6. 按对应流程推进：模板路线 / pipeline.md / guided-free-creation.md
7. 阶段 4 起本地 dev server，跑 capture 脚本采集三件套
8. 阶段 5 逐镜头实现 + 静帧验收（`npx remotion still`）
9. 阶段 6 声音设计（画面锁定后才动）
10. 阶段 7 独立 subagent 终检 + 双版本终渲
11. 交付后询问是否导出剪映工程文件（读 [references/jianying-export.md](file:///d:/APP/trae/traeProject/ai-video/ai-video-2/references/jianying-export.md)，用 `jianying-export/mac_draft.py` / `windows_draft.py`，需 `pip install pyJianYingDraft`）

### 渲染命令
```bash
# 预览
npx remotion studio src/index.ts

# 渲染成片
npx remotion render src/index.ts AiflPromo out/promo.mp4

# 验收静帧
npx remotion still src/index.ts AiflPromo out/qa/f150.png --frame=150

# 无 BGM 版（Windows 必须走文件，不能内联 JSON）
npx remotion render src/index.ts AiflPromo out/promo-nobgm.mp4 --props=props-nobgm.json
# props-nobgm.json 内容：{"bgm":false}
```

### Headless/CI 注意事项
- 低核机器加 `--concurrency=1`
- 用 chrome-headless-shell 而非系统 Chrome
- CDN 被阻时用 `--browser-executable=<本地 chrome-headless-shell 路径>`

---

## 十二、关键术语表

| 术语 | 含义 |
|------|------|
| **镜头配方卡** | 152 张 Markdown 文档，每张含用途/能量/时长/参数/实现笔记/已知坑/参考实现路径 |
| **PageCam** | 2.5D 页面相机组件，一切"真实页面"镜头的地基 |
| **layout.json** | 页面元素坐标表 `{x,y,w,h}` + 每页 `pageH`，供飞行目标位/遮罩位置/入场区域直接使用 |
| **styleframe** | 纯 HTML/CSS 静态关键画面（2–3 张 1920×1080），锁定色板/字体/光感/运镜气质 |
| **能量弧** | 全片骨架——低开品牌 → 单主角立传 → 字卡呼吸间隔的功能爬升段 → 发布会峰值收场 |
| **呼吸字卡** | paper-title-card，每 1–2 个功能镜头后插一张，单张 50–55f（≈1.8s） |
| **hold/rest 帧预算** | 排时间线时预留的静止帧——品牌字标 ≥30f、批量动效收尾 15f、开场主体动作 ≥3s |
| **SFX 钉帧表** | `{from, src, volume}[]` 声明式数组，逐条注释对应画面动作，from 一律写相对表达式 |
| **beatF(n)** | 卡点片用拍号表达时间，镜头边界锚到拍号 |
| **bgm inputProp** | BGM 的 `<Audio>` 用布尔 inputProp 包住，与 SFX 解耦，从同一时间线渲出带/无 BGM 两版 |
| **确定性渲染** | 禁 `Date.now()`/`Math.random()`，一切伪随机固定种子（mulberry32/哈希，seed 从 index 派生） |
| **Ink Press** | 已验收的完整宣传片模板——36.2s、1920×1080、30fps、10 镜、纸墨琥珀风格、SFX-only 无 BGM 版 |

---

*本总结基于 [ai-video-2](file:///d:/APP/trae/traeProject/ai-video/ai-video-2)（video-shotcraft）项目的最新内容整理：SKILL.md、references/pipeline.md、references/guided-free-creation.md、references/aesthetic-rules.md、references/sound-design.md、references/music-beat-sync.md、references/sequences/promo-energy-arc.md、template/TEMPLATE.md、项目介绍.md 与 gallery/api/library.json。使用方式：复制第一章的通用提示词模板，替换【主题】相关字段即可直接套用。*
