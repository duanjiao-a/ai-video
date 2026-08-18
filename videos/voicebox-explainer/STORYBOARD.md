---
format: 1920x1080
duration: 58s
message: "Voicebox 是完全开源的本地 AI 语音工作室——克隆、生成、听写、代理语音，一个应用全搞定"
arc: 介绍 → 能力 → 引擎 → 架构 → 集成 → 号召
audience: 开发者和 AI 爱好者
mode: autonomous
music: ambient tech underscore
---

## Video direction

- **palette system** — from `frame.md`: deep dark navy `void` (#0A0E1A) ground everywhere; electric cyan `wave` (#00E5FF) as the primary accent (sound-wave energy); violet `pulse` (#7C4DFF) as the secondary accent; white `light` (#FFFFFF) for all display type; muted gray `dim` (#8B92A8) for secondary type. No shadows on type; depth comes from layered glow blooms and hairline rules. 0 radius on data blocks, 4px radius on pills/buttons.
- **type** — display: Space Grotesk 700, tight line-height, negative tracking (CJK: Noto Sans SC 700); body: Inter 400/600 (CJK: Noto Sans SC 400); data/chrome: JetBrains Mono 400. Every load-bearing line ≥ 1.4cqw. Micro-labels uppercase, 0.16–0.24em tracking. The pagenum lives bottom-right on every frame.
- **motion grammar + shot model** — one long-tail smooth settle (`power3`) everywhere, no bounce; every frame is a VO-paced shot sequence: at t=0 only what the VO says enters, each next piece reveals on its spoken cue across the back ~50% — never front-load; ends on a held read (stillness beats bad motion); the only sanctioned aliveness during a hold is subtle waveform jitter. All motion inside a paused GSAP timeline registered on `window.__timelines`; no CSS transitions/keyframes for motion; `fromTo` entrances; no repeat/yoyo, no Math.random/Date.now.
- **rhythm / held-frame allocation** — Frame 1 opens with a title reveal + waveform animation; Frame 2 enumerates 4 capabilities in a grid cascade; Frame 3 shows 7 engine cards assembling; Frame 4 is the architecture diagram (3 layers stacking); Frame 5 is the MCP flow (agent → voicebox → speaker); Frame 6 resolves with a CTA on a glow-bloom background.
- **negative list** — no purple-blue "AI" gradient soup, no generic SaaS dashboard cards, no browser chrome mockups; no slideshow (front-load then freeze), no screensaver (everything floating independently), no lazy breathing, no bad back-half pan/push.

---

## Frame 1 — 标题：什么是 Voicebox

- scene: 深色背景中，"Voicebox" 大标题逐字浮现，声波线条在背景中律动
- duration: 9.0s
- poster: 5s
- transition_in: cut
- voiceover: "Voicebox——一个完全开源的AI语音工作室，运行在你的本地机器上。"
- blueprint: kinetic-type-beats (Adapt)
- focal: 标题「Voicebox」
- roles: 标题 = foreground subject · 声波线条 = background (atmosphere) · 副标题 = supporting
- sfx: whoosh-short
- src: compositions/frames/01-title.html

以声波开场。深色画布上，电光青色的波形线条从中心向外扩散。
"Voicebox" 大标题在波形中心逐字浮现，副标题"开源 AI 语音工作室"在下方。

Adapt: keep the word-beats signature; the beats are the title's own characters assembling.
Scene 1 (0.0–1.5s): dark void ground; a cyan waveform ring expands from center (atmosphere, ~50% frame); a top micro-label 「OPEN SOURCE」 tracks in from the left edge.
Scene 2 (1.5–5.0s): as the VO says each phrase, the title builds letter-by-letter via per-character staggered reveal, centered, display size ~10cqw — 「Voice」「box」 each lands on its own beat; the waveform pulses once behind as support.
Scene 3 (5.0–9.0s): the subtitle 「开源 AI 语音工作室」 fades in below; the waveform settles to a gentle idle; subtle jitter only.

## Frame 2 — 四大核心能力

- scene: 2×2 网格，四个能力卡片依次浮现
- duration: 10.0s
- transition_in: crossfade
- voiceover: "它能克隆任何声音，生成23种语言的语音，全局热键听写到任意应用，还能让AI代理用你克隆的声音说话。"
- blueprint: grid-card-assemble (Adapt)
- focal: 四个能力卡片
- roles: 四卡片 = foreground subject · 编号 = supporting · 声波底纹 = background
- sfx: none
- src: compositions/frames/02-capabilities.html

四个核心能力以 2×2 网格依次浮现，每个卡片有图标和标题。
Voice Cloning · Speech Generation · Dictation · Agent Voice

Adapt: keep the staggered-cascade signature; cards become hairline-edged blocks with cyan icons.
Scene 1 (0.0–2.0s): dark ground; a micro-label 「核心能力」 enters top-left with a 1px cyan hairline under it.
Scene 2 (2.0–8.0s): as the VO names each, four blocks self-assemble in a staggered cascade, each = cyan icon + title + body note, separated by 1px hairlines: 01 声音克隆 · 02 语音生成 · 03 全局听写 · 04 代理语音.
Scene 3 (8.0–10.0s): blocks hold and read; subtle waveform jitter in the background.

## Frame 3 — 七个 TTS 引擎

- scene: 竖列清单，七个引擎逐行展示
- duration: 10.0s
- transition_in: crossfade
- voiceover: "内置七个TTS引擎：Qwen3-TTS、Chatterbox、Kokoro、HumeAI TADA等。"
- blueprint: constellation-hub (Adapt)
- focal: 引擎清单的七行条目
- roles: 七条目 = foreground subject · 引擎编号 = supporting · 声波底纹 = background
- sfx: none
- src: compositions/frames/03-engines.html

七个 TTS 引擎以竖列清单形式逐行展示，每行有引擎名、语言数和特点。
从 82M 的 Kokoro 到 3B 的 TADA，展示丰富的引擎选择。

Adapt: keep the staggered-cascade signature; engines become hairline strand-rows with mono labels.
Scene 1 (0.0–2.0s): dark ground; a micro-label 「7 TTS ENGINES」 enters top-left.
Scene 2 (2.0–8.0s): as the VO mentions engines, rows self-assemble in a staggered cascade: Qwen3-TTS · Qwen CustomVoice · LuxTTS · Chatterbox Multilingual · Chatterbox Turbo · HumeAI TADA · Kokoro — each with language count and model size in mono.
Scene 3 (8.0–10.0s): rows hold; a subtle cyan bloom pulses once behind the list.

## Frame 4 — 技术架构

- scene: 三层架构图，从上到下：Tauri/React → FastAPI → MLX/PyTorch
- duration: 10.0s
- transition_in: crossfade
- voiceover: "架构上，前端用Tauri和React构建，后端是Python FastAPI，本地运行MLX或PyTorch。"
- blueprint: titlecard-reveal (Adapt)
- focal: 三层架构堆叠图
- roles: 三层 = foreground subject · 连接线 = supporting · 数据流标注 = background
- sfx: none
- src: compositions/frames/04-architecture.html

三层架构图从上到下堆叠：前端 Tauri + React、后端 Python FastAPI、推理层 MLX/PyTorch。
每层有标签和关键组件，层与层之间有数据流连线。

Adapt: keep the layer-stacking signature; each layer slides in on its VO cue.
Scene 1 (0.0–2.0s): dark ground; a micro-label 「ARCHITECTURE」 enters top-left.
Scene 2 (2.0–7.0s): as the VO names each layer, three horizontal bands stack from top: ① Tauri (Rust) + React (Frontend) ② Python FastAPI (Backend, 90 endpoints) ③ MLX / PyTorch (Inference) — each lands with a 1px cyan top border, labels in mono.
Scene 3 (7.0–10.0s): the stack holds; a "100% LOCAL" badge fades in at the bottom; subtle jitter only.

## Frame 5 — MCP 集成

- scene: 流程图：Agent → voicebox.speak → 克隆声音输出
- duration: 10.0s
- transition_in: crossfade
- voiceover: "内置MCP服务器，任何支持MCP的AI代理，只需一个工具调用，就能用你克隆的声音说话。"
- blueprint: kinetic-type-beats (Adapt)
- focal: MCP 流程图
- roles: 流程图 = foreground subject · 代码片段 = supporting · 声波输出 = background
- sfx: sparkle
- src: compositions/frames/05-mcp.html

MCP 集成流程图：左侧 AI Agent（Claude Code / Cursor / Cline），
中间 voicebox.speak 工具调用，右侧克隆声音输出。
代码片段在底部浮现。

Adapt: keep the flow-diagram signature; nodes pop in on VO cues with connector lines drawing between them.
Scene 1 (0.0–2.0s): dark ground; a micro-label 「MCP INTEGRATION」 enters top-left.
Scene 2 (2.0–7.0s): three nodes assemble left-to-right on the VO: ① AI Agent (Claude Code · Cursor · Cline) ② voicebox.speak() tool call ③ 🔊 Cloned Voice Output — cyan connector lines draw between them as each lands.
Scene 3 (7.0–10.0s): a code snippet `await voicebox.speak({ text, profile })` fades in below; the output node gets a cyan glow pulse; subtle jitter only.

## Frame 6 — 开源号召

- scene: "完全开源" 大字 + GitHub CTA + 平台图标
- duration: 9.0s
- transition_in: crossfade
- voiceover: "完全开源，支持macOS、Windows和Linux。现在就去GitHub搜索Voicebox。"
- blueprint: kinetic-type-beats (Adapt)
- focal: 「完全开源」+ GitHub CTA
- roles: CTA = foreground subject · 平台图标 = supporting · 声波底纹 = background
- sfx: chime
- src: compositions/frames/06-opensource.html

温暖收束。"完全开源" 以大字定格，下方是 GitHub 链接和三个平台图标。
电光青色光晕最亮，画面最满，然后缓缓归于平静。

Adapt: keep the statement-builds-across-beats signature; resolve with a glow bloom.
Scene 1 (0.0–2.0s): dark ground; a cyan glow-bloom re-blooms bright center; micro-label 「OPEN SOURCE」 tracks in above.
Scene 2 (2.0–6.0s): the statement 「完全开源」 builds beat by beat, centered, display ~8cqw; below it, 「macOS · Windows · Linux」 fades in with platform icons; a GitHub URL `github.com/jamiepine/voicebox` appears in mono.
Scene 3 (6.0–9.0s): everything holds still; a soft chime blooms once; the pagenum sits bottom-right; subtle jitter only, then full stillness to the end.
