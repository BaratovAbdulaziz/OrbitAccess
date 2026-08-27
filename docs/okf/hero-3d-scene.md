---
title: Hero 3D Scene
summary: Three.js-based animated hero replacing the product-mockup hero, depicting GitHub and Notion orbiting a central Orbit hub with flowing data arcs.
tags: [frontend, three.js, landing-page, design, webgl]
related:
  - ./three-js-integration.md
  - ./motion-and-accessibility.md
---

# Hero 3D Scene

The landing-page hero features a real-time 3D scene rendered with Three.js. It visualizes the
product metaphor directly:

- A **central glowing hub** represents Orbit itself — a warm core wrapped in a translucent shell,
  two thin orbital rings, and layered additive glow sprites (fake bloom).
- Two **smaller nodes** orbit the hub on inclined planes:
  - a **GitHub node** (neutral gray, GitHub mark rasterized onto a canvas texture via `Path2D`),
  - a **Notion node** (brand teal from the app palette, a stylized serif "N").
- **Light-trail arcs** connect each node to the hub. Each arc is a quadratic Bézier rebuilt every
  frame between the node's live world position and the hub, with glowing "packet" sprites that
  travel along the curve toward the hub — implying *data flowing in from both sources into one place*.
- A sparse additive-blend **starfield** and a subtle camera drift give depth without noise.

## Design intent

The scene is deliberately calm: one hub, two satellites, slow revolutions (~26s / ~38s per orbit).
It should read as "everything important circles one calm center," not as a screensaver.

The stage sits in a fixed-size dark card (`.hero-stage`) so the scene looks identical in light and
dark themes; page content scrolls over it while the scene gently recedes and fades on scroll so it
never competes with sections below.

## Where things live

| Piece | Path |
| --- | --- |
| Scene code | `public/hero3d.js` |
| Stage markup + importmap | `views/landing.js` (`MOCK_WINDOW` constant) |
| Stage CSS | bottom of `style.css` ("hero 3D stage" block) |
| Docs bundle | `docs/okf/` |

## Fallback

If WebGL is unavailable, Three.js fails to load from the CDN, or the WebGL context is lost, the
scene removes itself (`useFallback()`), restores the previous anime.js orb hero, and un-gates all
`.js`-hidden elements so nothing is left invisible. See [motion-and-accessibility.md](./motion-and-accessibility.md).

Related: [three-js-integration.md](./three-js-integration.md) covers versions, loading, and upgrades.
