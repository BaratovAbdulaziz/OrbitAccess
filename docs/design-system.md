---
title: Design system
description: Orbit Access visual language — tokens, type, and component rules.
section: Reference
order: 8
---

# Design system

The canonical spec lives in [`DESIGN.md`](../DESIGN.md) at the repo root. This file summarizes what the CSS actually implements.

## Surfaces

| Token | Light | Use |
|---|---|---|
| Canvas | `#faf9f5` | Page floor — warm cream, never pure white. |
| Card | `#efe9de` | Feature/stat cards. |
| Dark surface | `#181715` | Code windows, footer, featured tiles. |
| Hairline | `#e6dfd8` | 1px borders that read as elevation, not ink. |

## Accent

Coral `#cc785c` (active `#a9583e`) is reserved for primary CTAs, inline links, step numerals, and the admin role chip — scarce on individual elements, generous only on full-bleed moments. Teal `#5db8a6` signals connected/status states.

## Type

- **Display:** Copernicus/Tiempos stack, EB Garamond fallback — weight **400**, negative tracking (-0.3 → -1.5px). Never bold.
- **Body/UI:** Inter (humanist sans) — 400 body, 500 labels/buttons.
- **Code:** JetBrains Mono.

Scale: display-xl 64 · lg 48 · sm 28; title-lg 22 · md 18 · sm 16; body-md 16 · sm 14; caption 13; caption-uppercase 12/1.5px tracking.

## Shape & rhythm

Radius scale 4/6/**8**(buttons, inputs)/**12**(cards)/**16**(hero)· pill badges. Spacing base 4px; sections breathe at 96px; card padding 32px.

## Components inventory

Top nav (64px) · button-primary/secondary/text/icon-circular · feature-card · product-mockup-card-dark · code-window-card · connector-tile · stat tiles · badge-pill/coral · text-input (40px, coral focus ring) · category tabs · dark CTA band · dark footer.

## Panel-specific additions

`.acc-tile` expandable rows (name-first hierarchy, muted metadata sub-line), shimmer skeletons for loading states, desaturated permission selects, neutral role chips with only `admin` tinted, teal note banners, and the Notion twin (`nt-static` heads, emoji medallions).

Dark mode is token-driven via `[data-theme="dark"]` overrides — no per-component dark styles.
