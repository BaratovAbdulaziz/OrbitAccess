---
title: Orbit interactive object
summary: A single 3D hub-and-orbit object in the hero that opens on click to reveal how GitHub and Notion data merge into the Orbit dashboard.
tags: [frontend, landing-page, interaction-design]
related:
  - ./implementation.md
  - ./motion-and-accessibility.md
---

# Orbit Interactive Object

## Concept

The Orbit object is the centerpiece of the landing page hero — a single, self-contained interactive 3D object that embodies the product's core metaphor: **GitHub and Notion orbiting a unified dashboard**.

### Resting State

- A central **hub** (the Orbit logo) sits at the center
- Two **nodes** orbit slowly in 3D space:
  - **GitHub node** (purple, inner orbit, ~26s revolution)
  - **Notion node** (teal, outer orbit, ~38s revolution)
- Subtle **arc paths** connect each node to the hub, with animated dash flow suggesting data streaming inward
- Gentle **pulsing rings** around the hub add depth and life
- The entire assembly uses CSS 3D transforms with a 900px perspective — no WebGL, no Three.js

### Open State (Click Hub)

Clicking the hub triggers an "unfold" sequence:

1. **Anticipation**: orbit speed eases to zero; nodes detach from their paths
2. **Fly-out**: nodes animate to dock positions flanking the reveal panel
3. **Hub expands**: scales up 1.35× with intensified glow
4. **Panel unfolds**: a card rotates open on a horizontal hinge (CSS `rotateX`) from behind the hub, revealing:
   - Left column: GitHub stats (repos, orgs, stars) with animated counters
   - Right column: Notion stats (pages, databases, workspaces) with animated counters
   - Merge arrow between columns
   - Footer: "One dashboard" result badge + "Sign in with GitHub · connect Notion once"
5. **Close button** appears in panel header; clicking it or the hub again reverses the sequence

### Close State

Clicking the hub again (or the panel's × button, or pressing Escape) reverses the unfold:

1. Panel folds back (rotateX → -96°)
2. Nodes fly back to their orbital positions
3. Hub scales down to 1×
4. Orbit motion resumes smoothly from where it paused

## Interaction Model

| Trigger | From Rest | From Open |
|---------|-----------|-----------|
| Click hub | Open | Close |
| Click panel × | — | Close |
| Press Escape | — | Close |
| Tab hidden / off-screen | Pause orbit | — |

## Visual Language

- **Colors**: Reuses existing CSS variables (`--primary` for GitHub, `--teal` for Notion, `--surface-dark-elevated` for panel)
- **Typography**: `--font-display` for numbers/titles, system UI for body
- **Motion**: `cubic-bezier(0.34, 1.56, 0.64, 1)` (overshoot "out(3)" feel) for opens, `inOutSine` for closes
- **Depth**: 900px perspective, projected orbits with depth-based opacity/scale/z-index
- **Glow**: CSS `filter: blur()` + radial gradients — no WebGL bloom needed