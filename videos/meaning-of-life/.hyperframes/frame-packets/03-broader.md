# Frame packet: 03-broader

## Project inputs

- Project: D:\APP\trae\traeProject\ai-video\videos\meaning-of-life
- Design tokens: D:\APP\trae\traeProject\ai-video\videos\meaning-of-life\frame.md
- RULES_DIR: d:\APP\trae\traeProject\ai-video\a-hyperframes\skills\hyperframes-animation\rules

## Assigned storyboard block

## Frame 3 — 更广阔的答案

- scene: 编号列表展开：贡献、体验、联结
- duration: 10s
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

## Selected motion rule: center-outward-expansion

---
name: center-outward-expansion
description: Elements start clustered at screen center and expand outward to their final positions, driven by a shared progress value.
metadata:
  tags: expansion, scatter, center, reveal, layout, sync, burst
---

# Center-Outward Expansion

Elements begin at one shared center point and radiate outward to their final positions — the entry beat itself, or motion driven by another animation's progress (a counting number, a beat). Flat 2D cousin of [depth-scatter-assemble.md](depth-scatter-assemble.md) (per-element 3D cloud): here every element shares the SAME origin.

## How It Works

Each element carries its final offset as `data-target-x/y`. Its position lerps between center and target: `x = targetX × progress`. Self-centering is baked as `xPercent/yPercent: -50` so the tweened `x`/`y` are pure offsets from the stage center. Standalone burst = per-item staggered `fromTo`; driven burst = one shared proxy (see Variations).

## Recipe

```html
<!-- inside a standard scene clip (hyperframes-core) -->
<div class="burst-wrap">
  <div class="burst-item" data-target-x="-360" data-target-y="-180">{itemA}</div>
  <div class="burst-item" data-target-x="360" data-target-y="-180">{itemB}</div>
  <div class="burst-item" data-target-x="0" data-target-y="360">{itemC}</div>
</div>
```

```css
.burst-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
}
.burst-item {
  position: absolute;
  top: 50%;
  left: 50%; /* GSAP xPercent/yPercent -50 bakes the centering; x/y tween the offset */
  will-change: transform;
}
```

```js
document.querySelectorAll(".burst-item").forEach((el, i) => {
  tl.fromTo(
    el,
    { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 0.6, opacity: 0 },
    {
      x: Number(el.dataset.targetX),
      y: Number(el.dataset.targetY),
      scale: 1,
      opacity: 1,
      duration: EXPAND_DUR,
      ease: EXPAND_EASE,
    },
    ENTRY_AT + i * STAGGER,
  );
});
```

## Variations

- **Synced to a driver (chord)**: when the burst shadows a counter / beat, drop the stagger and drive all items from ONE 0→1 proxy tween with the driver's exact duration AND ease; `onUpdate` writes `translate(-50%,-50%) translate(targetX*p, targetY*p)` per item — the two read as one beat.
- **Partially-spread start**: with 6+ items the full cluster piles up — start from `{ x: targetX * START_PROGRESS, ... }`.
- **Idle micro-float**: hand off to [sine-wave-loop.md](sine-wave-loop.md) after landing instead of freezing.

## Values

| token          | range                | notes                                                            |
| -------------- | -------------------- | ---------------------------------------------------------------- |
| ITEM_COUNT     | 3–8                  | > 8 = visual chaos mid-expansion; low counts want wider spread   |
| EXPAND_DUR     | 1.0–1.8s             | must equal the driver's duration in the synced variant           |
| EXPAND_EASE    | `power3.out` default | `power2.out` gentler, `expo.out` dramatic stop; NEVER `in` eases |
| STAGGER        | 0.04–0.08s           | tighter = chord; looser = lazy arpeggio                          |
| ENTRY_AT       | 0–0.5s               | a beat of compositional quiet before the burst                   |
| START_PROGRESS | 0–0.5                | 0 = dramatic full cluster; ~0.3 avoids the pile-up               |

## Critical Constraints

- **Tween `x`/`y` over the baked `xPercent/yPercent: -50`** — mutating `left`/`top` fights the centering and causes pixel jitter.
- **Out-easing only** — `in` easings read as items being sucked back mid-air.
- **No other absolute-positioned siblings inside `.burst-wrap`** — they'd steal the centered baseline.
- **❗ The burst IS the beat** — don't park a "real headline" label below it (the eye snaps to the label and ignores the burst). If a label is needed, reveal it post-burst in the same stack.
- Synced variant: identical duration + ease as the driver, or the chord falls apart.

## See also

`counting-dynamic-scale` (the classic chord driver) · `depth-scatter-assemble` (3D per-element cloud) · `card-morph-anchor` (burst out of a morphed card) · `sine-wave-loop` (post-landing life).
