---
version: alpha
name: Soundwave Dark — Frame (video / frame layer)
description: >
  Video-first design system for Voicebox explainer. Dark navy ground, electric cyan as
  sound-wave energy, violet as secondary pulse, white display type, mono data chrome.
  Space Grotesk display + Inter body + JetBrains Mono data. 1px hairline rules,
  glow blooms for depth (no shadows), 0 radius on data blocks, 4px on pills.
unit: the frame — 1920×1080 primary
principle: dark canvas · cyan energy · white type · mono data · glow not shadow

colors:
  void: "#0A0E1A"
  void-deep: "#060912"
  surface: "#131825"
  surface-light: "#1A2030"
  wave: "#00E5FF"
  wave-soft: "#4DEEFF"
  wave-dim: "rgba(0, 229, 255, 0.15)"
  pulse: "#7C4DFF"
  pulse-soft: "#9C7FFF"
  light: "#FFFFFF"
  dim: "#8B92A8"
  dimmer: "#4A5068"

typography:
  body:    { fontFamily: "Inter", cqw: 0.85, weight: 400, lineHeight: 1.5, color: "dim" }
  body-lede:{ fontFamily: "Inter", cqw: 0.95, weight: 400, lineHeight: 1.55, color: "light" }
  micro-label:{ fontFamily: "Inter", px: 13, weight: 600, tracking: "0.24em", upper: true, color: "wave" }
  rail-label:{ fontFamily: "Inter", px: 13, weight: 600, tracking: "0.32em", upper: true, color: "wave" }
  mono-data:{ fontFamily: "JetBrains Mono", cqw: 0.73, weight: 400, tracking: "0.04em", color: "dim" }
  mono-label:{ fontFamily: "JetBrains Mono", px: 14, weight: 400, tracking: "0.06em", color: "wave" }
  pagenum: { fontFamily: "JetBrains Mono", px: 13, weight: 400, tracking: "0.08em", color: "dimmer" }
  headline-sm:{ fontFamily: "Space Grotesk", cqw: 2.2, weight: 700, lineHeight: 1.1, color: "light" }
  headline:{ fontFamily: "Space Grotesk", cqw: 3.5, weight: 700, lineHeight: 1.05, color: "light", tracking: "-0.02em" }
  display:{ fontFamily: "Space Grotesk", cqw: 10.0, weight: 700, lineHeight: 0.95, color: "light", tracking: "-0.03em" }
  display-sm:{ fontFamily: "Space Grotesk", cqw: 5.0, weight: 700, lineHeight: 1.0, color: "light", tracking: "-0.02em" }

spacing:
  pad-edge: "4cqw"
  pad-region: "4.2cqw"
  gap-region: "2.5cqw"

components:
  glow-bloom:
    background: "radial gradient {colors.wave} core at 8-12% → {colors.wave-soft} → {colors.wave-dim} → transparent on {colors.void}"
    size: "40–65% of the frame, off-center or behind the focal element"
    description: "The primary depth layer. One per frame; a flat dark frame reads as broken."
  pulse-bloom:
    background: "radial {colors.pulse} at 12–18% opacity"
    placement: "corner opposite the glow-bloom"
    description: "Subordinate counter-accent; never dominant."
  surface-block:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.wave} at 20%"
    rounded: "4px"
    description: "A content container — used for capability cards, engine rows, architecture layers."
  hairline-rule:
    rule: "1px solid {colors.wave} at 20%"
    description: "Structural separator. The primary border treatment."
  data-row:
    borderBottom: "1px {colors.wave} 12%"
    typography: "{typography.mono-label} · {typography.headline-sm} · {typography.mono-data}"
    description: "Tabular row — mono index · sans title · mono metadata (right)."
  pill:
    backgroundColor: "{colors.wave-dim}"
    border: "1px solid {colors.wave} at 30%"
    rounded: "4px"
    typography: "{typography.mono-label}"
    description: "Small tag/badge — rounded, cyan-tinted."
  pagenum:
    typography: "{typography.pagenum}"
    color: "{colors.dimmer}"
    placement: "bottom-right"
    description: "The only persistent chrome."
---

# Soundwave Dark — Frame (video / frame layer)

## Overview

Soundwave Dark at frame scale is a **tech-product design system** in the register of a modern
audio app UI: deep dark navy, electric cyan as the sound-wave energy accent, violet as a
subordinate pulse, white display type, and JetBrains Mono for all data/chrome. No cards with
shadows — depth is delivered by soft radial **glow blooms**, 1px hairline rules, and surface
blocks with subtle cyan borders. The mood sits between a Linear product page and a Spotify
audio visualization: confident, technical, energetic but restrained.

**Key characteristics at frame scale:**

- **Deep dark navy ground** on every frame; never pure black, never gray.
- **Electric cyan** (`{colors.wave}`) as the primary accent for all highlights, borders, and blooms; **violet** (`{colors.pulse}`) only as a subordinate counter-bloom.
- **Space Grotesk 700** display (tight, negative-tracked); **Inter** body + micro-labels; **JetBrains Mono** data.
- **1px hairline rules** at cyan 20% are the primary border — surface blocks use 4px radius; data blocks use 0 radius.
- **Glow bloom** is the primary depth layer on every frame; a pulse counter-bloom adds energy tension.
- **Tech-restrained** — sparse reads as premium; crowding breaks the product feel.

## The Frame

### Frame Craft Bar

- **Squint** — one Space Grotesk moment dominates at 3–6× its neighbor; the glow bloom centers the eye.
- **Silence** — frames read **50–60% empty**; the **data list is the one dense exception** (density via quiet hairline repetition, not richness).
- **Energy** — **one accent color** (cyan) for all highlights and rules; **one glow bloom** per frame (+ optional subordinate pulse); never use violet as dominant fill.
- **Reference** — aim at a **Linear / Vercel / Raycast product page**; failure looks like a **generic SaaS dashboard** (card mosaic) or a **purple-blue AI gradient soup**.

- **Primary:** 1920×1080 (16:9). Display authored in **`cqw`** (`px ÷ 1920 × 100 = cqw`).
- **Safe area:** `pad-edge` 4cqw — the elegance depends on edge negative space; only blooms bleed.

**The container law (load-bearing).** Every frame ground sets `container-type: size`; ALL
frame-relative units are `cqw`/`cqh` against it — never `vw`. Hairlines stay 1px; bloom sizes scale
as `%` of the frame.

## Colors

`{colors.void}` is the universal ground; `{colors.wave}` (electric cyan) is **every highlight,
every border accent, every bloom core**. `{colors.pulse}` appears **only** as a 12–18% counter-bloom
— never a fill, never text. `{colors.light}` (white) is all display type; `{colors.dim}` (muted gray)
is secondary type. **The system never inverts** — white on dark is correct; cyan text on dark only
for micro-labels and data.

## Typography

Two ramps. The **reading/data ramp** (Inter body 0.85cqw, micro-labels in px, JetBrains Mono
data) carries copy + chrome; the **display ramp** (Space Grotesk `headline-sm` 2.2cqw →
`display` 10cqw) carries every headline, title, and statement.

- **Legibility floor:** any load-bearing line ≥ **1.4cqw**; mono/labels in px are chrome only.
- **Space Grotesk is weight 700 for display**, 400 for body (Inter handles body); **micro-labels uppercase Inter 600, ≥0.16em**; **mono for all data/labels**.

## Depth & Surface

Atmospheric, not structural. Depth from:

- **Glow bloom** — the primary layer: a radial (wave 8–12% core → wave-soft → wave-dim → void 0%), 40–65% of the frame. One per frame.
- **Pulse bloom** — a 12–18% violet counter-bloom in the opposite corner; always subordinate.
- **Surface block** — `{colors.surface}` with 1px cyan 20% border, 4px radius.
- **Hairline rules** — 1px cyan 20% for structural separation.

**Ceiling:** zero box-shadow on type, zero text-shadow, zero border-radius on data blocks, no border thicker than 1px (except surface blocks which use 1px).

## Components

- **glow-bloom / pulse-bloom** — the atmospheric depth set.
- **surface-block** — the content container (cards, rows, layers).
- **hairline-rule** — the structural separator.
- **data-row** — tabular row with mono index + sans title + mono metadata.
- **pill** — small cyan-tinted tag/badge.
- **pagenum** — the bottom-right mono chrome.

## Frame Treatments

### 1 · Title (identity · move: display + glow bloom · centered)

**Ground** void + a large glow-bloom (center) + a pulse counter-bloom (corner). **Composes**
micro-label, display, headline-sm, pagenum. **Focal** a 1-line Space Grotesk `display` in white,
centered, under a micro-label. **Chrome** pagenum. **Accent** the glow bloom + cyan. **Silence**
the bloom holds the open space. **Density** low.

### 2 · Grid (capabilities · move: 2×2 cascade · left)

**Ground** void + a subtle glow-bloom (top-right). **Composes** micro-label, surface-blocks.
**Focal** a 2×2 grid of surface-blocks — each with cyan icon + headline-sm + body — assembling in
a staggered cascade. **Chrome** micro-label; pagenum. **Accent** cyan borders on blocks. **Density**
standard.

### 3 · List (engines · move: hairline tabular rows · left)

**Ground** void (bloom optional, subtle). **Composes** headline-sm + micro-label topbar, data-rows.
**Focal** a tabular list — mono index · sans title · mono metadata — separated by hairline rules.
**Chrome** pagenum. **Density** dense-exception.

### 4 · Architecture (diagram · move: layer stacking · centered)

**Ground** void + a center glow-bloom. **Composes** surface-blocks (horizontal bands), hairline
connectors. **Focal** three stacked horizontal bands — each with mono layer label + sans title +
body — stacking top-to-bottom on VO cues. **Chrome** pagenum. **Accent** cyan top borders. **Density**
standard.

### 5 · Flow (MCP · move: node diagram · left-to-right)

**Ground** void + a pulse counter-bloom. **Composes** surface-blocks (nodes), connector lines.
**Focal** three nodes left-to-right — Agent → voicebox.speak() → Voice Output — with cyan connector
lines drawing between them. **Chrome** code snippet below; pagenum. **Density** standard.

### 6 · CTA (statement · move: display + glow bloom · centered)

**Ground** void + a bright glow-bloom (center). **Composes** micro-label, display, pill, mono-data.
**Focal** a Space Grotesk `display` statement in white, centered, on a bright bloom. **Chrome**
GitHub URL in mono; platform pills; pagenum. **Accent** the bloom. **Silence** ~55%. **Density** low.

## Composition Rules

### Do

- Start on **deep dark navy**; add **one glow bloom** (optionally a pulse counter-bloom) — atmosphere is the depth.
- Set every display line in **white**; use **Space Grotesk 700** for display, **Inter** body, **JetBrains Mono** for all data/labels.
- Make every separator a **1px cyan hairline** (20% opacity); use **surface blocks** with 4px radius for content containers.
- Keep micro-labels **uppercase Inter 600, 0.16–0.24em, cyan**; pin the **pagenum** bottom-right in mono.
- Lean sparse; centered on title/CTA, left on list/grid.

### Don't

- No drop shadows on type, no text-shadow, no border thicker than 1px (except surface blocks).
- No violet as dominant fill or text; no purple-blue gradient soup.
- No mono for body/display; no font substitutes.
- Don't crowd the canvas — sparse reads as premium; don't omit the bloom (flat void reads as broken).

## Pre-Render Self-Audit

- **Squint** — one Space Grotesk display moment dominates; the glow bloom centers the eye.
- **Silence** — sparse frames 50–60% open; only the data list runs dense.
- **One accent** — cyan for all highlights + rules; violet counter-bloom only; no inversion.
- **Type** — Space Grotesk 700 tight negative-tracked; micro-labels uppercase 0.16em+ cyan; mono data; ≥1.4cqw floor.
- **Depth** — 0 type shadow, 0 text-shadow, 1px hairlines only; one glow bloom present.
- **Anchor** — centered on title/CTA, left on list/grid; pagenum bottom-right.

## Known Gaps

- **Motion intentionally out of scope at frame level.** frame.md specifies composition only.
- **Space Grotesk + Inter + JetBrains Mono via Google Fonts.** CJK: Noto Sans SC (display + body); no exact Hanzi geometric equal — keep engine names Latin.
- **Glow blooms, pulse blooms, surface blocks, and hairline rules are CSS-only; no external imagery is required.**
