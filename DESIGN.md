---
version: 1.0
name: OrbitAccess Design System
description: A premium, 3D-first landing page design system for OrbitAccess — an SMB access-management platform. Warm cream canvas with coral accent, serif display headlines, and an interactive 3D storytelling scene as the primary communication mechanism.
---

## Overview

OrbitAccess is an SMB access-management platform. The landing page explains the product through an interactive 3D story: an employee joins, receives access through OrbitAccess, and when they leave, access is revoked. The entire page is one continuous scroll-driven narrative.

The visual language is: **minimal, premium, technical, friendly, spacious, polished, 3D, interactive, confident.**

The brand anchors on a warm cream canvas with coral accent — the same palette that signals human warmth rather than cold enterprise software. The 3D scene is not decoration; it is the primary storytelling mechanism.

---

## Colors

### Brand & Accent
- **Coral / Primary** (`--primary` — #cc785c): The signature accent. Used on primary CTAs, the brand wordmark accent, and full-bleed callout cards.
- **Coral Active** (`--primary-active` — #a9583e): Press/hover darker variant.
- **Coral Disabled** (`--primary-disabled` — #e6dfd8): Desaturated cream-tinted disabled state.
- **Accent Teal** (`--accent-teal` — #5db8a6): Used on "active" status indicators, connected app states, secondary highlights.
- **Accent Amber** (`--accent-amber` — #e8a55a): Warning states, category badges, warm highlights.

### Surface
- **Canvas** (`--canvas` — #faf9f5): Default page floor. Warm cream — deliberately not pure white.
- **Surface Soft** (`--surface-soft` — #f5f0e8): Section dividers, subtle band backgrounds.
- **Surface Card** (`--surface-card` — #efe9de): Feature cards, content cards. One step darker than canvas.
- **Surface Dark** (`--surface-dark` — #181715): 3D scene background, product mockups, dark cards, footer.
- **Surface Dark Elevated** (`--surface-dark-elevated` — #252320): Elevated cards inside dark bands.
- **Hairline** (`--hairline` — #e6dfd8): 1px border tone on cream surfaces.
- **Hairline Soft** (`--hairline-soft` — #ebe6df): Barely-visible divider.

### Text
- **Ink** (`--ink` — #141413): All headlines and primary text. Warm dark.
- **Body** (`--body-c` — #3d3d3a): Default running-text.
- **Body Strong** (`--body-strong` — #252523): Emphasized paragraphs.
- **Muted** (`--muted` — #6c6a64): Sub-headings, secondary text.
- **Muted Soft** (`--muted-soft` — #8e8b82): Captions, fine-print.
- **On Primary** (`--on-primary` — #ffffff): Text on coral buttons.
- **On Dark** (`--on-dark` — #faf9f5): Cream-white on dark surfaces.
- **On Dark Soft** (`--on-dark-soft` — #a09d96): Secondary labels on dark.

### 3D Scene Colors
- **Scene Background** (`--scene-bg` — #0f0e0c): Deep dark for the 3D environment.
- **Hub Glow** (`--hub-glow` — #cc785c): Coral glow on the central OrbitAccess hub.
- **Hub Active** (`--hub-active` — #5db8a6): Teal glow when hub is active/provisioning.
- **App Node Inactive** (`--app-inactive` — #3d3d3a): Muted app nodes before connection.
- **App Node Active** (`--app-active` — #5db8a6): Teal when connected.
- **Connection Arc** (`--connection-arc` — #cc785c40): Semi-transparent coral arc.
- **Access Card** (`--access-card` — #e8a55a): Amber/gold for the access card token.
- **Employee Silhouette** (`--employee-color` — #faf9f5): Light silhouette on dark scene.

### Semantic
- **Success** (`--success` — #5db872): Green status dots, "available" indicators.
- **Warning** (`--warning` — #d4a017): Warning callouts.
- **Error** (`--error` — #c64545): Validation errors.

---

## Typography

### Font Family
- **Display**: `Copernicus, Tiempos Headline, 'EB Garamond', serif` — weight 400, negative tracking.
- **Body**: `Inter, -apple-system, BlinkMacSystemFont, sans-serif` — weight 400/500.
- **Code**: `'JetBrains Mono', ui-monospace, monospace` — weight 400.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `display-xl` | 64px | 400 | 1.05 | -1.5px | Hero headline |
| `display-lg` | 48px | 400 | 1.1 | -1px | Section headlines |
| `display-md` | 36px | 400 | 1.15 | -0.5px | Sub-section headlines |
| `display-sm` | 28px | 400 | 1.2 | -0.3px | Card headlines, CTA text |
| `title-lg` | 22px | 500 | 1.3 | 0 | Card titles |
| `title-md` | 18px | 500 | 1.4 | 0 | Feature titles, intro paragraphs |
| `title-sm` | 16px | 500 | 1.4 | 0 | List labels, small titles |
| `body-md` | 16px | 400 | 1.55 | 0 | Default running text |
| `body-sm` | 14px | 400 | 1.55 | 0 | Footer body, fine-print |
| `caption` | 13px | 500 | 1.4 | 0 | Badge labels |
| `caption-uppercase` | 12px | 500 | 1.4 | 1.5px | Category tags |
| `code` | 14px | 400 | 1.6 | 0 | Code blocks |
| `button` | 14px | 500 | 1.0 | 0 | Button labels |
| `nav-link` | 14px | 500 | 1.4 | 0 | Navigation items |

### Principles
- Display sizes use weight 400 (regular), never bold.
- Negative letter-spacing (-0.3 to -1.5px) on display sizes is non-negotiable.
- Body type stays at weight 400 for paragraphs, weight 500 for labels.
- Serif display + sans body = the editorial voice. Never swap.

---

## Spacing

Base unit: 4px.

| Token | Value |
|---|---|
| `xxs` | 4px |
| `xs` | 8px |
| `sm` | 12px |
| `md` | 16px |
| `lg` | 24px |
| `xl` | 32px |
| `xxl` | 48px |
| `section` | 96px |

- Section padding: 96px between major bands.
- Card internal padding: 32px.
- CTA band padding: 48–64px.

---

## Border Radius

| Token | Value | Use |
|---|---|---|
| `xs` | 4px | Badge accents |
| `sm` | 6px | Small buttons |
| `md` | 8px | Standard buttons, inputs |
| `lg` | 12px | Content cards |
| `xl` | 16px | Hero containers, large cards |
| `pill` | 9999px | Badge pills |
| `full` | 50% | Circular avatars, icon buttons |

---

## Shadows & Elevation

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow, no border | Body sections, nav, hero |
| Soft hairline | 1px `--hairline` border | Inputs, sub-nav |
| Cream card | `--surface-card` bg, no shadow | Feature cards |
| Dark surface | `--surface-dark` bg, no shadow | Product mockups, 3D scene |
| Subtle drop | `0 1px 3px rgba(20,20,19,0.08)` | Hover-elevated states (rare) |

**Elevation philosophy: color-block first, shadow rare.** Depth comes from cream-vs-dark surface contrast.

---

## Components

### Button Primary
- Background: `--primary` (#cc785c)
- Text: `--on-primary` (white)
- Typography: `button` (Inter 14px/500)
- Padding: 12px 20px, height 40px
- Radius: `--radius-md` (8px)
- Active: darkens to `--primary-active`

### Button Secondary
- Background: `--canvas`
- Text: `--ink`
- Border: 1px `--hairline`
- Same dimensions as primary

### Button Secondary on Dark
- Background: `--surface-dark-elevated`
- Text: `--on-dark`
- Used over dark surfaces

### Text Link
- Background: transparent
- Text: `--primary` (coral)
- Typography: `body-md`

### Top Navigation
- Background: `--canvas` (cream)
- Text: `--ink`
- Typography: `nav-link` (Inter 14px/500)
- Height: 64px
- Becomes compact/sticky after scrolling (height reduces to 56px, subtle hairline border appears)

### Feature Card
- Background: `--surface-card`
- Text: `--ink`
- Typography: `title-md`
- Radius: `--radius-lg` (12px)
- Padding: 32px

### Dark Product Card
- Background: `--surface-dark`
- Text: `--on-dark`
- Radius: `--radius-lg`
- Padding: 32px

### CTA Band Coral
- Background: `--primary`
- Text: `--on-primary`
- Typography: `display-sm`
- Radius: `--radius-lg`
- Padding: 64px

### Badge Pill
- Background: `--surface-card`
- Text: `--ink`
- Typography: `caption`
- Radius: `--radius-pill`
- Padding: 4px 12px

---

## Section Spacing

All major sections use `{spacing.section}` (96px) vertical padding.

Section order:
1. Navbar (sticky, 64px)
2. Hero (100vh with 3D scene)
3. Problem (96px padding)
4. Product Preview (96px padding)
5. Employee View (96px padding)
6. Automation (96px padding)
7. Integrations (96px padding)
8. Security (96px padding)
9. Growth (96px padding)
10. Simple Steps (96px padding)
11. Final CTA (96px padding)
12. Footer (dark, 64px padding)

---

## 3D Visual Language

### Geometry Style
- **Soft, rounded, friendly.** No sharp edges. No aggressive angles.
- Hub: Rounded torus or soft sphere with glow ring.
- Employee: Simple capsule/pill silhouette — not a realistic human.
- Applications: Rounded box or cylinder with a small icon indicator.
- Access Card: Small flat rounded rectangle with glow.
- Connection Lines: Animated arcs (bezier curves), not straight lines.

### Material Style
- **Matte primary surfaces** with subtle emissive accents.
- Hub: Dark body + coral emissive glow ring.
- Employee: Light/cream matte silhouette.
- Apps: Muted dark bodies + teal emissive when active.
- Access Card: Amber/gold emissive.
- Environment: Very subtle grid plane, no texture.

### Lighting
- **Soft ambient** (intensity 0.3–0.5) as base.
- **One directional key light** (warm, intensity 0.8) from upper-right.
- **Point light on hub** (coral tint, intensity 0.5) for glow effect.
- **No harsh shadows.** Use contact-shadow or no shadows.

### Camera
- Perspective camera, FOV 50.
- Initial position: [0, 2, 8] looking at [0, 0, 0].
- Camera moves via scroll — never via user drag (no orbit controls).

---

## Animation Principles

### Core Rule
**Animation explains. If an animation does not communicate employee/access/app/provisioning/revocation/organization, it does not belong.**

### Scroll-Driven Story
- Scroll position = timeline.
- One continuous 3D scene persists across sections.
- Camera choreography is scroll-controlled.
- No scroll-jacking. Native scroll with `position: sticky`.

### Object State Machine
Every major object has defined states:
```
Employee: idle → approaching → receiving → working → leaving → gone
Hub: idle → activating → provisioning → revoking → idle
Application: inactive → connecting → active → disconnecting → inactive
AccessCard: hidden → generated → traveling → active → returning → stored
```

### Easing
- Use smooth interpolation (lerp, smoothstep).
- No spring/bounce physics.
- No abrupt snapping.
- No excessive parallax.

### Reduced Motion
When `prefers-reduced-motion: reduce`:
- Disable camera choreography.
- Disable object walking/movement.
- Use simple fades between states.
- 3D scene stays mostly static.

---

## Responsive Behavior

### Breakpoints
| Name | Width | Changes |
|---|---|---|
| Mobile | < 768px | Hamburger nav, hero 32px headline, 3D scene simplified (hub + employee + 2 apps), sections stack, feature grids 1-up |
| Tablet | 768–1024px | Nav horizontal but tight, 3D scene with 3 apps, grids 2-up |
| Desktop | 1024–1440px | Full nav, full 3D scene (5 apps), grids 3-up |
| Wide | > 1440px | Same as desktop, max content 1200px |

### 3D Scene on Mobile
- Reduce app nodes from 5 to 2.
- Simplify camera choreography.
- If WebGL performance is poor (< 30fps), fall back to simplified 2D card-based layout.
- Story must remain understandable at every breakpoint.

---

## Accessibility

- Semantic HTML: `<nav>`, `<main>`, `<section>`, `<h1>`–`<h3>`.
- ARIA labels on 3D canvas: `role="img" aria-label="Interactive 3D scene showing OrbitAccess managing employee access"`.
- Keyboard-navigable CTA buttons and nav links.
- Sufficient contrast: #141413 on #faf9f5 = 14.8:1 ratio.
- `prefers-reduced-motion`: Full fallback to static/fade-only animations.
- 3D scene is supplementary — text content communicates the same information.

---

## What NOT to Do

- Do NOT use generic SaaS templates.
- Do NOT use stock photography.
- Do NOT use fake product screenshots — build the UI with code.
- Do NOT make every section a card grid.
- Do NOT add random gradients or meaningless animations.
- Do NOT add fake customer logos, testimonials, or security certifications.
- Do NOT use excessive glassmorphism.
- Do NOT use matrix-style backgrounds or excessive neon.
- Do NOT use lock icons everywhere.
- Do NOT add unnecessary floating blobs or particles.
- Do NOT make the 3D scene decorative instead of explanatory.
- Do NOT use spring/bounce physics in animations.
- Do NOT invent integrations that don't exist (only GitHub and Notion for MVP).
- Do NOT use Inter for display headlines — serif is the brand voice.
- Do NOT add cool blue or cyan as a brand accent — coral is the brand.
- Do NOT repeat the same surface mode in two consecutive bands.

---

## Correct vs Incorrect Examples

### Hero Headline
```
CORRECT: <h1 className="font-display text-display-xl tracking-tight">Employee access, without the busywork.</h1>
INCORRECT: <h1 className="font-sans text-4xl font-bold">Streamline Your Access Management</h1>
```

### Button
```
CORRECT: <button className="bg-primary text-on-primary font-button px-5 py-3 rounded-md">Get started</button>
INCORRECT: <button className="bg-blue-600 text-white font-bold px-8 py-4 rounded-full shadow-lg">Try Now Free →</button>
```

### Section Background
```
CORRECT: <section className="bg-canvas py-section">...</section>
INCORRECT: <section className="bg-gradient-to-br from-purple-900 to-blue-900 py-20">...</section>
```

### 3D Scene
```
CORRECT: Scroll-driven animation showing employee approaching hub, access card traveling, apps connecting.
INCORRECT: Random floating objects with particle effects and spinning camera.
```
