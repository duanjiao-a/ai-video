# ai-video-2 视频制作提示词

> 直接粘贴下面这段给 Agent 即可启动三源流水线（RunningHub 生图 + EdgeTTS 旁白 + ai-video-2 动画）。
> 参考工程：`videos/weight-loss/`（DESIGN.md + src/wl/）。

***

## 提示词（复制以下整段）

```
用 ai-video-2（Remotion）做一支 1280×720 @ 30 fps 的视频，三源流水线：RunningHub API 生成背景素材 → EdgeTTS 生成旁白和字幕 → ai-video-2 组装动画并渲染。流程第一步和第二步完成后结束，让我确认一下。

主题：__填主题__
时长：90s
风格：海绵宝宝动画风背景（用户取向：尽量还原原版画风，仅自用）
旁白音色：zh-CN-XiaoxiaoNeural，语速 +20%（可改）
BGM：自选

流程：
1. 先写脚本与分镜表存到 videos/<项目>/DESIGN.md，按"开场 → 3~4 个要点段 → 收尾"切分；每段旁白同步配上字幕。分镜表里面要新增使用的动效卡名、visual_prompt（发给 RunningHub 的详细绘图提示词）。
2. RunningHub 文生图RunningHub API（gpt-image-2/text-to-image/stable，1k / low，16:9）为每个场景生成 16:9、1k 、low的海绵宝宝主题背景图，保存到 public/textures/bg-<场景名>.png，固定文件名；风格全片统一。
3. EdgeTTS 对每段旁白生成 tts-<段>.mp3 + tts-<段>.srt，时长汇总到 public/audio/tts/durations.json；帧号按 round(时长×30) 换算并对齐场景 Sequence。
4. 开场镜头固定用 carousel-3d 镜头卡（demos/ui-entrance/carousel-3d/Carousel3D.tsx）：把 RunningHub 已生成的全部素材作为圆环上的卡面（front/back 同一图，双面同向贴图 + backface-visibility:hidden），环匀速自转一整圈无缝 loop，相机钉浅俯角近景不动；卡数=素材张数，半径按 卡宽≈2 倍调；保留卡片"卡自身不参与旋转、只绕 Y 公转"和地面反光盘等命门参数。
5. 其余要点段/收尾的动画从 ai-video-2 模板库找着用，不从零手写：先看 gallery/api/library.json 校验卡名与 style-key，再按 references/shots/ 下对应卡片全文 + demos/ 里"参考实现"指向的准确 demo TSX 源码，复制适配到当前场景（改背景/文案/色板，保留缓动时值、转场、已知坑规避等调校参数）；每镜头对应一张镜头配方卡，不凭卡名凭空新写。
6. 在 src/ 建 Remotion 工程（可复制 weight-loss 骨架）：Root.tsx 注册 Composition；style.ts 放色板/字体/easing；SceneBg 背景做 1.00→1.04 缓推；BigText 屏幕大字分字入场+slam；Caption 底部字幕对齐 TTS；Main.tsx 总装 TTS+SFX 钉帧+BGM（可关）+跨骑转场。每一段分镜中间间隔0.5s即可，不要太长了。
7. 渲染前静帧自检，如果视觉审查截图检测失败后不需要重新截图，直接进行下一步。整片渲染后 ffmpeg 抽帧回看；交付带/无 BGM 两版（通过 props 控制 <Audio> 的 volume 为 0 即可生成无 BGM 版本，无需渲染两遍）。
8. 输出内容放到videos目录下新建文件夹。

硬约束：确定性渲染（禁 Date.now()/Math.random()，伪随机固定种子）；每镜头只讲一个动效，关键信息落定后留 hold≥0.5s；SFX 帧号写死不再平移；视觉 tokens 全片统一；动画必须从模板库镜头卡复用，卡片"已知坑/命门"参数不得降档。
```

***

## 用法

1. 复制上面整段提示词。
2. 把 `__填...__` 替换成你的内容（主题必填，其他可留空由 Agent 推断）。
3. 粘贴给 Agent，它自主推进全程并渲染交付。

### 最简版（只给主题）

```
用 ai-video-2 做一支 30s 的 1920×1080 视频，三源流水线：RunningHub 生图 + EdgeTTS 旁白 + Remotion 动画。主题：__填主题__。动画从 ai-video-2 模板库（gallery/api/library.json 校验卡名 → references/shots/ 卡片全文 → demos/ 准确 demo 源码）找镜头卡复用适配，不从零手写。其余按默认（清新风格、zh-CN-XiaoxiaoNeural +20%、自选 BGM），自主完成分镜、素材、旁白、动画、渲染并交付带/无 BGM 两版。参考工程：videos/weight-loss/。
```

### 字段说明

| 字段   | 作用                 | 默认                   |
| ---- | ------------------ | -------------------- |
| 主题   | 视频主题/文案            | 必填                   |
| 时长   | 总秒数                | 30s                  |
| 风格   | 画风关键词（如扁平插画/水彩/3D） | 由主题推断                |
| 旁白音色 | EdgeTTS 音色         | zh-CN-XiaoxiaoNeural |
| BGM  | 背景音乐曲目             | 自选                   |

## 约束速查

- **素材命名**：`public/textures/bg-<场景>.png`，固定文件名
- **旁白命名**：`public/audio/tts/tts-<段>.mp3` + `.srt` + `durations.json`
- **时间线**：TTS 段帧号 = `round(时长 × 30)`，与场景 Sequence、底部字幕区间严格对齐
- **确定性**：禁 `Date.now()`/`Math.random()`，固定种子
- **节奏**：每镜头单一动效，落定后 hold≥0.5s
- **交付**：带 BGM + 无 BGM 两版 mp4

```
```

