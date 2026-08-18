---
format: 1920x1080
duration: 60s
message: "人生的意义不是被找到的答案，而是我们亲手创造的日常"
arc: 疑问 → 探索 → 顿悟 → 收束
audience: 对生活有困惑的普通观众
mode: autonomous
music: calm cinematic underscore
---

## Video direction

- **palette system** — from `frame.md`: warm parchment `paper` (#E9E5DB) ground everywhere; a single deep indigo `ink` (#1B2566) for every line of type and every hairline; solar yellow `sun` (#F1EE2E) only as radial sun-bloom / soft haze / a yellow-panel moment; `ember` (#E26B4A) only as a 15–22% counter-bloom. Never invert (no yellow text on ink), no shadows, no rounded corners, 1px hairlines only.
- **type** — display: Instrument Serif 400, tight line-height, negative tracking (CJK: Smiley Sans); body: Archivo (CJK: Noto Serif SC); data/chrome: JetBrains Mono (CJK labels: Noto Sans SC). Every load-bearing line ≥ 1.4cqw. Micro-labels uppercase, 0.16–0.32em tracking. The pagenum lives bottom-right on every frame.
- **motion grammar + shot model** — one long-tail smooth settle (`power3`) everywhere, no bounce; every frame is a VO-paced shot sequence: at t=0 only what the VO says enters, each next piece reveals on its spoken cue across the back ~50% — never front-load; ends on a held read (stillness beats bad motion); the only sanctioned aliveness during a hold is subtle jitter. All motion inside a paused GSAP timeline registered on `window.__timelines`; no CSS transitions/keyframes for motion; `fromTo` entrances; no repeat/yoyo, no Math.random/Date.now.
- **rhythm / held-frame allocation** — Frame 4 is the held breather before the climax (still, open, minimal); Frame 1 opens slow; Frames 2–3 enumerate; Frame 5 is the active climax; Frame 6 resolves warm and still.
- **negative list** — no floating bokeh / purple-blue "AI" gradients, no decorative generic shapes, no browser chrome; no slideshow (front-load then freeze), no screensaver (everything floating independently), no lazy breathing, no bad back-half pan/push.

---

## Frame 1 — 深夜之问

- scene: 暖黄光晕中，一句大字「人，为什么活着？」缓缓浮现
- duration: 8.48s
- poster: 5s
- transition_in: cut
- voiceover: "你有没有在某个深夜，问过自己——人，为什么活着？"
- blueprint: kinetic-type-beats (Adapt)
- focal: 问句「人，为什么活着？」
- roles: 问句 = foreground subject · sun-bloom = background (atmosphere) · 问号笔画 = supporting
- sfx: whoosh-short
- src: compositions/frames/01-question.html

以沉默开场。暖黄太阳光晕铺满纸面，一个孤独的问号在留白中生长。
这是全片的问题：人生的意义是什么。克制、安静，像一次自问。

Adapt: keep the word-beats signature; the beats are the question's own characters assembling rather than token swaps.
Scene 1 (0.0–1.2s): bare parchment + sun-bloom low-left (atmosphere, ~60% frame); a top micro-label 「关于存在的提问」tracks in from the left edge; nothing else. Layered-depth, ~65% open.
Scene 2 (1.2–4.2s): as the VO says each phrase, the question builds word-chunk by word-chunk via **per-word staggered reveal** (`dynamic-content-sequencing`), left-anchored, display size ~8cqw — 「人，」「为什么」「活着？」each lands on its own beat; a giant serif ？(≈22cqw, ink at 12% opacity) fades in behind as a supporting watermark. Asymmetric 60/40, 3 depth layers.
Scene 3 (4.2–10.0s): the full question holds still and reads; the bloom breathes once (finite) and settles; at most subtle jitter (`sine-wave-loop`, low amplitude) — no drift, no re-push. The question stays open and unanswered.

## Frame 2 — 幸福的小事

- scene: 竖排目录列出微小而确凿的幸福
- duration: 9.248s
- transition_in: crossfade
- voiceover: "有人说，答案藏在幸福里：一顿好饭，一次散步，一阵晚风。"
- blueprint: grid-card-assemble (Adapt)
- focal: 幸福清单的三行条目
- roles: 三条目 = foreground subject · 编号 01/02/03 = supporting · sun-bloom = background (subtle)
- sfx: none
- src: compositions/frames/02-happiness.html

引入第一种答案：幸福由微小的事物构成。用 strand-list 式的编号行，
每一项都是一件小事，纸面上方太阳光晕柔柔地亮着。

Adapt: keep the staggered-cascade signature; cards become hairline strand-rows with serif numerals.
Scene 1 (0.0–2.0s): paper + a soft sun-bloom top-center; a small micro-label 「幸福」enters top-left with a 1px ink hairline under it. Centered-lean, open.
Scene 2 (2.0–7.0s): as the VO names each item, three strand-rows **self-assemble in a staggered cascade** (`dynamic-content-sequencing`), each row = serif numeral (JetBrains Mono, ink) + serif title + body note, separated by 1px soft hairlines: 01 一顿好饭 · 02 一次散步 · 03 一阵晚风 — one row per spoken cue, landing left-anchored under the label. Asymmetric 60/40, 3 depth layers.
Scene 3 (7.0–10.0s): rows hold and read; a subtle bloom brightens behind the list and settles; subtle jitter only.

## Frame 3 — 更广阔的答案

- scene: 编号列表展开：贡献、体验、联结
- duration: 9.272s
- transition_in: crossfade
- voiceover: "也有人说，意义在于被需要，在于去爱、去痛、去冒险、去感受。"
- blueprint: constellation-hub (Adapt)
- focal: 中心词「意义」与环绕它的动词群
- roles: 中心词 = foreground subject · 动词环 = supporting · ember counter-bloom = background
- sfx: none
- src: compositions/frames/03-broader.html

第二种答案，更广阔：贡献、体验、联结。同款 strand 列表继续生长，
黄光晕渐亮，情绪微微抬升。配一处 ember 暖色轻晕作对照。

Adapt: keep the ring-around-center signature; icons become serif verb-words orbiting the hub word, no camera push (a bloom resolve instead).
Scene 1 (0.0–2.0s): paper; the word 「意义」 seats center-left as the hub (Instrument Serif ~9cqw, ink), under a micro-label 「另一种答案」; an ember counter-bloom warms the opposite corner. Centered, open.
Scene 2 (2.0–7.5s): as the VO names each, five serif verbs **spring into a ring around the center** (`center-outward-expansion`) — 被需要 · 去爱 · 去痛 · 去冒险 · 去感受 — each landing on its spoken cue at its own orbital position, hairline connectors (1px, ink 18%) faint between them and the hub. Centered ring, ~55% of frame.
Scene 3 (7.5–10.0s): the ring holds; the hub word gets a soft sun-bloom behind it (bloom blooms once, finite) and settles; subtle jitter only.

## Frame 4 — 转折：也许没有预设的答案

- scene: 大幅斜体引文，居中，留白极多
- duration: 8.312s
- transition_in: crossfade
- voiceover: "但也许，人生并没有一个预先写好的答案。"
- blueprint: titlecard-reveal (Reproduce)
- focal: 斜体引文「也许，人生没有预设的答案」
- roles: 引文 = foreground subject · 超大引号 = supporting · sun-bloom (退到背后) = background
- sfx: none
- src: compositions/frames/04-twist.html

情绪的转折点。居中 manifesto 式斜体引文，超大引号，60% 以上留白。
光晕退到背后，安静到几乎停顿。全片唯一的「否定」，也是关键的转。

Reproduce: one restrained reveal then a still hold — exactly the breather beat.
Scene 1 (0.0–2.5s): bare parchment, bloom withdrawn to a faint haze behind center; an oversized serif 引号 (≈18cqw, ink 10%) sits above the text zone. Centered, ~70% open.
Scene 2 (2.5–6.0s): the italic display line 「也许，人生没有」+ 「预设的答案。」reveals as ONE restrained **slide-up crossfade** (`dynamic-content-sequencing`), centered at y≈0.42, display ~6.5cqw, ink; the giant quote mark firms to ink 18% behind it. Centered, deliberate, slow.
Scene 3 (6.0–10.0s): the line holds in near-total stillness — the deliberate held breather; no drift, no breathing; only the faintest jitter.

## Frame 5 — 意义由你创造

- scene: 金句大字「意义不是被找到，而是被创造的」逐行浮现
- duration: 9.224s
- transition_in: crossfade
- voiceover: "意义不是被找到的，而是被创造的。它在你专注的每一刻里生长。"
- blueprint: kinetic-type-beats (Adapt)
- focal: 金句里的「创造」
- roles: 金句 = foreground subject · 「创造」字 = focal accent · sun-bloom = background
- sfx: sparkle
- src: compositions/frames/05-create.html

顿悟。金句以大字排版逐行浮现，太阳光晕重新亮起，黄色面板元素轻触。
这是全片的中心论点：意义是动词，不是名词。

Adapt: keep the statement-builds-across-beats signature; resolve with a bloom, not a product lockup.
Scene 1 (0.0–1.5s): sun-bloom re-blooms bright center-left (the color returns after the dark beat); micro-label 「答案」tracks in above. Layered-depth, open.
Scene 2 (1.5–5.5s): the two-line statement builds **beat by beat via kinetic beat-slam** (`kinetic-beat-slam`) on the VO: 「意义」「不是被找到的，」「而是被创造的。」each line lands with its own entrance (per-word staggered reveal), left-anchored, display ~7cqw; a 1px hairline rule extends beneath as it completes. Asymmetric 60/40.
Scene 3 (5.5–8.0s): the payoff line 「它在你专注的每一刻里生长。」reveals word-by-word as the VO says it (`dynamic-content-sequencing`), smaller, under the main statement; 「专注」and「此刻」get a **keyword glow** (`asr-keyword-glow`) as the VO reaches them.
Scene 4 (8.0–10.0s): everything holds still; a soft sparkle bursts once behind 「创造」and settles; subtle jitter only.

## Frame 6 — 就在此刻

- scene: 收束金句「意义，就在此刻」于黄色面板上定格
- duration: 11.888s
- transition_in: crossfade
- voiceover: "所以，不必急着追问。走在路上，风会告诉你；意义，就在此刻。"
- blueprint: kinetic-type-beats (Adapt)
- focal: 「意义，就在此刻」
- roles: 金句 = foreground subject (ink on sun) · yellow-panel = background statement · sun-bloom = supporting
- sfx: chime
- src: compositions/frames/06-now.html

温暖收束。ink-on-yellow 的 signature 黄面板，一句「意义，就在此刻」。
光晕最亮，画面最满，然后缓缓归于纸面，pagenum 停在右下角。结束。

Adapt: keep the snap-beat-by-beat signature; land on a held ink-on-sun panel instead of a product lockup.
Scene 1 (0.0–3.0s): paper ground; a full-height sun **yellow-panel** (right third, ink on top) slides up into place (`dynamic-content-sequencing`); the paper side stays open with a soft ember counter-bloom. Split, 2/3 paper : 1/3 sun.
Scene 2 (3.0–7.0s): on the VO, the panel lines snap in beat-by-beat: 「不必急着追问。」(paper side, body size) then 「意义，」「就在此刻。」(ink on the sun panel, display ~6cqw, staggered) — each lands on its cue. Split-screen, 2 zones.
Scene 3 (7.0–10.0s): the panel holds as the film's final still; a soft chime blooms once; the pagenum (JetBrains Mono, ink 75%) sits bottom-right; subtle jitter only, then full stillness to the end.
