---
title: Orbit object implementation
summary: Technical details of the CSS 3D orbit object — why CSS transforms over Three.js, file structure, initialization, and extension guide.
tags: [frontend, architecture, css-3d, javascript]
related:
  - ./orbit-object.md
  - ./motion-and-accessibility.md
---

# Orbit Object Implementation

## Why CSS 3D Transforms (Not Three.js)

| Factor | CSS 3D + Vanilla JS | Three.js (r185) |
|--------|---------------------|-----------------|
| **Dependencies** | Zero (animejs already in stack) | +1 CDN dependency (three@0.185.1) |
| **Network** | Works offline | Fails offline → fallback required |
| **Bundle size** | ~4 KB (orbit-object.js) | ~13 KB (hero3d.js) + Three.js runtime |
| **Browser support** | All modern browsers (IE11+ with prefixes) | WebGL required |
| **Icon billboarding** | Trivial (2D SVG always faces camera) | Requires quaternion copy per frame |
| **Depth sorting** | Manual z-index (2 lines) | Automatic but opaque |
| **Accessibility** | Native `<button>`, SVG, HTML panel | Canvas — requires ARIA overlay |
| **Reduced motion** | Instant CSS toggle | Custom pause/resume logic |
| **Maintenance** | 1 file, ~300 LOC | 1 file + importmap + CDN pinning |

**Decision**: The object is geometrically simple (spheres → circles, orbits → projected ellipses, panel → CSS 3D card). CSS 3D delivers identical visual quality with zero dependencies, offline support, native accessibility, and simpler maintenance.

## File Structure

```
public/
  orbit-object.js      # Self-contained interactive object (~300 LOC)
views/
  landing.js           # Server-rendered markup + inline <script src="/orbit-object.js" defer>
server.js              # Static route: GET /orbit-object.js
style.css              # Appended .oo-* component styles
docs/okf/
  orbit-object.md      # Concept & interaction
  implementation.md    # This file
  motion-and-accessibility.md
  README.md
```

## Initialization Flow

1. **Server renders** `views/landing.js → homeLoggedOut()` → includes `ORBIT_OBJECT` template string
2. Markup contains:
   - `<div class="hero-stage oo-root" data-orbit-object>` — root container
   - `<script src="/orbit-object.js" defer>` — classic script (not module)
3. **Client loads** `orbit-object.js` (deferred)
4. **IIFE runs** on `DOMContentLoaded`:
   - Finds `[data-orbit-object]` host
   - Feature-detects: `transform` support, `prefers-reduced-motion`
   - If unsupported → `useFallback()` adds `.hero-fallback` to `.hero-band`, removes `.js` from `<html>`
   - Otherwise → binds events, starts rAF loop, adds `.has-orbit` to `.hero-band` (hides legacy orbs)
5. **Exposes** `window.OrbitObject = { init }` for idempotent re-initialization (e.g., after AJAX nav — not used here)

## Core Modules (inside orbit-object.js)

| Module | Responsibility |
|--------|----------------|
| **Projection math** | `orbitPosition(node, angle)` → 3D → `project(x,y,z)` → 2D screen coords with perspective factor |
| **rAF tick** | Advances angles, updates node transforms, redraws SVG arc paths, lerps `speedMul` for smooth start/stop |
| **State machine** | `rest → opening → open → closing → rest` with async transitions via `animejs` |
| **Dock targeting** | `computeDockTargets()` measures panel column headers → nodes fly to exact positions |
| **Pause/resume** | `IntersectionObserver` (100px margin) + `visibilitychange` gate the rAF loop |
| **Fallback** | `useFallback()` hides object, shows static hero, cleans up globals |

## Adding a Third Orbiting Node (Future Integration)

1. **Add config** to `NODES` array in `orbit-object.js`:
   ```js
   const NEW_NODE = { name: "Linear", key: "ln", radius: 240, speed: 0.00028, phase: 4.2, incline: 0.18, color: "var(--amber)" };
   const NODES = [GITHUB_NODE, NOTION_NODE, NEW_NODE];
   ```
2. **Add markup** in `views/landing.js` `ORBIT_OBJECT` template:
   ```html
   <div class="oo-node oo-node--ln" aria-hidden="true" style="--node-color: var(--amber);">${LINEAR_ICON}</div>
   <path class="oo-arc" stroke="var(--amber)" .../>
   ```
3. **Add panel column** in `oo-panel-body`:
   ```html
   <div class="oo-col oo-col--ln">…</div>
   ```
4. **Add dock target** — `computeDockTargets()` auto-discovers `.oo-col--ln`
5. **CSS** — existing `.oo-node`/`.oo-arc` rules apply via `var(--node-color)` and stroke color

No other changes needed. The projection math, tick loop, state machine, and dock logic are all data-driven.

## Configuration Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `PERSPECTIVE` | 900 | CSS perspective distance (px) |
| `HUB_SIZE` | 56 | Hub diameter (px) |
| `NODE_SIZE` | 32 | Node diameter (px) |
| `OPEN_HUB_SCALE` | 1.35 | Hub scale when open |
| `DOCK_SCALE` | 0.9 | Node scale when docked |
| `GITHUB_NODE.radius` | 140 | Inner orbit radius (px at z=0) |
| `NOTION_NODE.radius` | 195 | Outer orbit radius (px at z=0) |
| `GITHUB_NODE.speed` | 0.00048 | Rad/ms → ~26s/rev |
| `NOTION_NODE.speed` | -0.00033 | Rad/ms → ~38s/rev (retrograde) |
| `GITHUB_NODE.incline` | 0.32 | Orbit tilt (rad) |
| `NOTION_NODE.incline` | -0.26 | Orbit tilt (rad, opposite) |

## Browser Compatibility

| Feature | Minimum | Fallback |
|---------|---------|----------|
| CSS `transform` 3D | Chrome 12, Firefox 16, Safari 9, Edge 12 | `.hero-fallback` |
| `IntersectionObserver` | Chrome 51, Firefox 55, Safari 12.1 | Polyfill not loaded — loop runs always |
| `requestAnimationFrame` | Universal (IE10+) | — |
| `animejs` v4 (UMD) | Bundled via `/vendor/anime.min.js` | Open/close still works (CSS transitions) |

## Performance Notes

- **rAF loop**: ~0.1 ms/frame (2 nodes, 2 arcs, simple math)
- **DOM reads**: `getBoundingClientRect()` only on open/close/resize
- **DOM writes**: `style.transform`/`opacity` on 4 elements/frame
- **No layout thrashing**: All reads batched before writes
- **GPU compositing**: `transform`/`opacity` only → compositor thread
- **Memory**: Zero allocations in hot path (reuses objects)