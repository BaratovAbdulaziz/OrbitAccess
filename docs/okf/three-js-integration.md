---
title: Three.js Integration
summary: Which Three.js version the 3D hero uses, why it is pinned, how it is loaded without a bundler, and how to upgrade it safely.
tags: [frontend, three.js, cdn, importmap, landing-page]
related:
  - ./hero-3d-scene.md
  - ./motion-and-accessibility.md
---

# Three.js Integration

## Version

**Three.js `0.185.1` (r185), pinned**, loaded from jsDelivr.

Why this choice:

- r185 is the latest stable release line at time of writing (July 2026) and receives security/bug fixes.
- The version is **pinned, not `@latest`**: three.js removes deprecated APIs in minor releases
  (r185 itself removed deprecated code), so an unpinned tag could silently break the hero on a
  future visit.
- Only core (`build/three.module.js`) is used — no addons — so upgrade surface is small.

## Loading (no bundler, no build step)

`views/landing.js` emits two tags inside the landing markup:

```html
<script type="importmap">
{"imports":{
  "three":"https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js",
  "three/addons/":"https://cdn.jsdelivr.net/npm/three@0.185.1/examples/jsm/"
}}
</script>
<script type="module" src="/hero3d.js"></script>
```

- The **import map** maps the bare specifier `"three"` (and the `three/addons/` prefix for any
  future addon use) to the CDN ES module build. It must appear before the first module script,
  which it does — both tags are adjacent in the hero section.
- `public/hero3d.js` is served by an explicit static route in `server.js`
  (`GET /hero3d.js`, same pattern as `/landing.js`). Inside, it does `await import("three")`;
  if that import fails (offline, old browser without import-map support), the module catches the
  rejection and falls back to the anime.js orb hero instead of erroring.

## File layout

```
public/hero3d.js     self-contained IIFE; exposes window.OrbitHero3D.init()
views/landing.js     stage container + importmap + module script tag
server.js            one static route: /hero3d.js -> public/hero3d.js
style.css            .hero-stage styles ("hero 3D stage" block)
```

## Upgrading Three.js later

1. Pick the new version and skim its [migration guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide).
2. Update **both URLs** in the import map in `views/landing.js` to the same new version.
3. No other file references the three.js version. `public/hero3d.js` only imports `"three"` and
   uses stable core APIs (`WebGLRenderer`, `PerspectiveCamera`, sprites, lines, torus/sphere
   geometry), so most upgrades need zero code changes.
4. Verify with the checklist in [motion-and-accessibility.md](./motion-and-accessibility.md)
   (reduced-motion freeze, tab-background pausing, off-screen pausing).

If you ever want offline builds, `npm i three` + serving `node_modules/three/build/three.module.js`
through a route mirroring `/vendor/anime.min.js` works without touching `hero3d.js`.
