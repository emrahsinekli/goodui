# Particles

> Canvas particles drift gently, link up with fine lines and move out of the pointer's way; density scales with the area.

Particles background for React and shadcn: a dot field that bends around the cursor and ripples on click

Page: https://goodui.dev/components/backgrounds/particles

## Install

```bash
npx shadcn@latest add @goodui/particles
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/particles.json`. The file lands in `components/goodui/particles.tsx`.

## When to use

- Hero sections that should answer the visitor: the dot field bends around the pointer and ripples on click.
- Login and sign-up screens that need gentle motion behind a centered form.
- Interactive landing sections where the background should move out of the cursor's way.

## When not to use

- A still texture: use dot-grid.
- Soft color without detail: use aurora, which is CSS-only.
- Behind dense app UI or long text: moving dots and lines compete with content. Use dot-grid with a fade.

## Pick by what matters

| Need | Use |
| --- | --- |
| Interactive dot field | defaults |
| Constellation with lines | variant="constellation" |
| Floating dust, no lines | variant="constellation" connect={false} density={2} |
| Background only, no pointer reaction | repel={false} |
| Brand colored | accent="var(--primary)" (near the pointer) or color="var(--primary)" (every dot) |
| Lighter on low-end devices | spacing={28} |

## Usage

```tsx
import type { ReactNode } from "react"
import { Particles } from "@/components/goodui/particles"

export function LoginBackdrop({ children }: { children: ReactNode }) {
  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden bg-background">
      <Particles accent="var(--chart-1)" />
      <div className="relative w-full max-w-sm rounded-2xl border bg-card p-6 shadow-sm">{children}</div>
    </main>
  )
}
```

### Dust only, no lines, no pointer reaction (the older look)

```tsx
<Particles variant="constellation" connect={false} repel={false} density={2} size={[0.5, 1.2]} speed={6} />
```

## API

### Particles

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| variant | `"field" \| "constellation"` | — | field: a dot grid that breathes, bends around the pointer and ripples on click. constellation: the drifting linked dots. |
| spacing | `number` | `20` | Field only: px between dots. |
| accent | `string` | `"var(--chart-1)"` | Field only: color the dots take near the pointer and in a ripple. |
| fade | `boolean` | `true` | Field only: fade the dots out toward the edges so the content stays readable. |
| density | `number` | — | Constellation only: particles per 10,000 px² of area. |
| maxParticles | `number` | `220` | Constellation only: hard cap on the particle count. |
| size | `[number, number]` | `[0.6, 1.8]` | Radius range in px. |
| speed | `number` | `10` | Constellation: drift speed in px per second. Field: 10 is the normal breathing pace. |
| connect | `boolean` | — | Constellation only: draw lines between nearby particles. Passing this or `density` without `variant` selects the constellation. |
| linkDistance | `number` | `110` | Max distance for a connecting line, in px. |
| repel | `boolean` | `true` | React to the pointer (listens on the parent element). |
| repelRadius | `number` | — | Distance in px within which the pointer pushes dots away. Defaults to 150 for the field and 110 for the constellation. |

Also accepts every <div> attribute.

## Accessibility

- The canvas wrapper is aria-hidden and has pointer-events: none, so content above it stays clickable.
- Reduced motion shows one still frame.

## Motion

- Field (default): dots on a grid breathe in slow crossing waves. Each has its own spring: the pointer pushes dots within `repelRadius` px (150) away and tints them `accent`; a click sends a ring outward. With no pointer a slow ghost wanders the field.
- Constellation: each particle drifts in its own direction at 40% to 100% of `speed` px per second (10) and wraps around the edges.
- With connect, particles closer than `linkDistance` px (110) are joined by thin lines that fade with distance.
- With repel, the pointer pushes particles within `repelRadius` px (110) away; they ease back to their own drift.
- It pauses while off-screen and while the tab is hidden. Reduced motion: one still frame is drawn.

## Performance

- Field: dots are batched into 8 alpha steps, so the cost is a dozen fills per frame; raise `spacing` on very large areas.
- Constellation: Canvas 2D, devicePixelRatio capped at 2. The count is density per 10,000 px² of area, capped by maxParticles (220).
- Lines are checked between every pair of particles, so cost grows quickly with the count; lower density or turn off connect on large areas.
- The color is resolved once and re-read when the theme class on <html> or the system color scheme changes.

## Notes for AI

- Place it inside a relative parent; it fills it with absolute inset-0. Give the content after it position: relative.
- With no variant and no connect prop you get the field. Passing connect or density without variant selects the constellation, so older usage keeps its look. density and maxParticles only affect the constellation; spacing, accent and fade only the field.
- repel listens to pointer moves on the parent element, since the canvas itself ignores the pointer.
- size is a [min, max] radius tuple in px; speed is px per second.
- color accepts any CSS color or variable and is resolved for canvas automatically.

## FAQ

**Is this tsParticles or particles.js?**

No. It is a small hand-written Canvas 2D component with no dependencies.

**Does it follow dark mode?**

Yes. With the default var(--foreground), or any theme variable, it re-reads the color when the theme changes.

## Related

- dot-grid: https://goodui.dev/components/backgrounds/dot-grid
- flickering-grid: https://goodui.dev/components/backgrounds/flickering-grid
- aurora: https://goodui.dev/components/backgrounds/aurora
- spotlight-card: https://goodui.dev/components/cards/spotlight-card

Last updated: 2026-11-04
