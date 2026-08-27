---
title: Orbit object documentation bundle
summary: Index of OKF documentation for the Orbit interactive hero object — concept, implementation, and motion/accessibility.
tags: [documentation, index]
related:
  - ./orbit-object.md
  - ./implementation.md
  - ./motion-and-accessibility.md
---

# Orbit Object Documentation Bundle

This directory contains the OKF (Open Knowledge Format) documentation for the Orbit landing page hero object.

## Files

| File | Description |
|------|-------------|
| [`orbit-object.md`](./orbit-object.md) | **Concept & interaction** — what the object is, resting/open/close states, visual language, interaction model |
| [`implementation.md`](./implementation.md) | **Technical deep-dive** — why CSS 3D over Three.js, file structure, initialization flow, core modules, extension guide for adding nodes |
| [`motion-and-accessibility.md`](./motion-and-accessibility.md) | **Motion & a11y** — reduced-motion handling, off-screen pausing, keyboard model, focus management, ARIA, performance guardrails, test checklist |

## Quick Links

- **Start here**: [orbit-object.md](./orbit-object.md) for the product/design view
- **For developers**: [implementation.md](./implementation.md) for architecture and extension
- **For QA/a11y**: [motion-and-accessibility.md](./motion-and-accessibility.md) for testing criteria

## Related Code

| File | Path |
|------|------|
| Main object logic | `public/orbit-object.js` |
| Server-rendered markup | `views/landing.js` (search `ORBIT_OBJECT`) |
| Styles | `style.css` (search `/* orbit object`) |
| Static route | `server.js` (search `/orbit-object.js`) |

## Version Note

This bundle documents the **CSS 3D + vanilla JS + animejs** implementation (replaces the earlier Three.js `hero3d.js` prototype). The Three.js version was removed in favor of zero-dependency, offline-capable, natively-accessible CSS 3D.