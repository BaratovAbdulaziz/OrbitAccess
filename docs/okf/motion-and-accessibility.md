---
title: Orbit object motion and accessibility
summary: How prefers-reduced-motion, off-screen pausing, and keyboard interaction work for the Orbit object.
tags: [accessibility, motion, performance]
related:
  - ./orbit-object.md
  - ./implementation.md
---

# Motion and Accessibility

## prefers-reduced-motion

### Detection
```js
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
```
Checked once at initialization.

### Behavior When `true`

| Aspect | Resting State | Open/Close |
|--------|---------------|------------|
| **Orbit animation** | **Disabled** — nodes frozen at `phase` angles (GitHub: 0, Notion: 2.1 rad) | N/A |
| **Hub rings** | CSS `animation: none` via `@media (prefers-reduced-motion)` | N/A |
| **Arcs** | Static at 0.35 opacity | N/A |
| **Panel unfold** | N/A | **Instant** — CSS `transition: none`, `transform: none`, `opacity: 1` forced |
| **Node fly-out** | N/A | **Instant** — `transition: none` forced on `.oo-node` |
| **Counters** | N/A | Set to final values immediately (no anime) |

### Implementation

- **CSS**: `@media (prefers-reduced-motion: reduce)` block in `style.css` disables animations and forces end states
- **JS**: Early return in `init()` after positioning nodes at static pose — no rAF loop started
- **State machine**: Skipped entirely; `open()`/`close()` toggle `.visible` class on panel directly

### Rationale

Users who prefer reduced motion get the **same information** (hub, two nodes, panel content) without **any continuous or transitional motion**. The object remains fully interactive — click hub → panel appears instantly.

## Off-Screen / Background Pausing

### Triggers

| Trigger | API | Threshold |
|---------|-----|-----------|
| Element off-screen | `IntersectionObserver` | 100px root margin |
| Tab hidden | `document.visibilitychange` | `document.hidden === true` |

### Behavior

- **Resting state**: rAF loop **paused** (`cancelAnimationFrame`)
- **Opening/closing**: Transitions **continue** (animejs runs independently)
- **Open state**: No loop running (static)
- **Resume**: When both visible + tab active + `rest` state → new rAF loop starts

### Code Flow

```js
// In init()
const obs = new IntersectionObserver((entries) => {
  entries.forEach((entry) => { visible = entry.isIntersecting; maybeStartLoop(); });
}, { rootMargin: "100px", threshold: 0 });
obs.observe(stage);

document.addEventListener("visibilitychange", () => {
  tabVisible = !document.hidden;
  maybeStartLoop();
});

function maybeStartLoop() {
  if (visible && tabVisible && state === "rest" && !reducedMotion && !rafId) {
    lastTime = 0;
    rafId = requestAnimationFrame(tick);
  }
}
```

### Why 100px Root Margin

Starts the loop **before** the hero enters viewport — eliminates "pop-in" on scroll. The margin is generous enough for slow scroll but small enough to not waste cycles on distant elements.

## Keyboard Interaction

### Hub Button

```html
<button type="button" class="oo-hub"
        aria-expanded="false"
        aria-controls="oo-panel"
        aria-label="Toggle Orbit preview">
```

| Key | Action |
|-----|--------|
| `Enter` / `Space` | Toggle open/close (native `<button>` behavior) |
| `Tab` | Moves focus in/out naturally |

### Panel Close Button

```html
<button type="button" class="oo-close" aria-label="Collapse Orbit">×</button>
```

| Key | Action |
|-----|--------|
| `Enter` / `Space` | Close panel (returns focus to hub) |
| `Escape` | Close panel (global listener, returns focus to hub) |

### Focus Management

```js
function finishOpen() {
  // ...
  if (closeBtn) closeBtn.focus({ preventScroll: true });
}

function finishClose() {
  // ...
  hub.focus({ preventScroll: true });
}
```

- **Open**: Focus moves to close button (logical "next action")
- **Close**: Focus returns to hub (origin of interaction)
- **Escape**: Works from anywhere in panel, returns to hub

### ARIA Attributes

| Element | Attributes |
|---------|------------|
| `.oo-hub` | `aria-expanded="true/false"`, `aria-controls="oo-panel"`, `aria-label` |
| `.oo-panel` | `id="oo-panel"`, `hidden` (toggled), `role="region"` implicit via heading |
| `.oo-panel-title` | `<h2>` — labels the region |
| `.oo-close` | `aria-label="Collapse Orbit"` |
| `.oo-node`, `.oo-arc`, `.oo-hub-ring` | `aria-hidden="true"` (decorative) |

### Screen Reader Experience

1. **Resting**: "Toggle Orbit preview, button, collapsed"
2. **After click**: "Toggle Orbit preview, button, expanded" → focus on "Collapse Orbit, button"
3. **Panel content**: Heading "Your sources, one orbit" → two sections with lists (GitHub/Notion stats) → "One dashboard" result → note
4. **Close**: Back to hub, "collapsed"

## Animation Loop Performance Guardrails

| Guard | Implementation |
|-------|----------------|
| **Max frame delta** | `dt = Math.min(50, time - lastTime)` — prevents jump after tab wake |
| **Speed lerp** | `speedMul += (target - speedMul) * min(1, dt * 0.006)` — smooth 0↔1 transitions |
| **No allocations in tick** | Reuses position objects, no array creation |
| **Batched DOM writes** | All `style.transform`/`opacity` after all math |
| **Zero layout reads in tick** | `getBoundingClientRect()` only on open/close/resize |

## Testing Checklist

- [ ] `prefers-reduced-motion: reduce` — no orbit, instant open/close, counters at final values
- [ ] `prefers-reduced-motion: no-preference` — smooth orbit, animated unfold/fold
- [ ] Scroll hero off-screen → orbit pauses → scroll back → resumes smoothly
- [ ] Switch tab away → orbit pauses → switch back → resumes smoothly
- [ ] Tab through page: hub reachable → Enter opens → Tab to close button → Enter closes → focus back on hub
- [ ] Press Escape in open state → closes → focus on hub
- [ ] Screen reader (NVDA/VoiceOver): announces expanded/collapsed, panel content readable
- [ ] Mobile: touch hub opens, touch close button closes, touch outside panel (no close — intentional)
- [ ] Resize window in open state → panel re-centers, dock targets update
- [ ] No WebGL / old browser → `.hero-fallback` activates, static hero shown