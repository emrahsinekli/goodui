# Flickering grid

> A canvas grid of small squares that flicker in opacity, follows the theme color, is sharp on retina and pauses off-screen.

Flickering grid background for React and shadcn: animated canvas squares

Page: https://goodui.dev/components/backgrounds/flickering-grid

## Install

```bash
npx shadcn@latest add @goodui/flickering-grid
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/flickering-grid.json`. The file lands in `components/goodui/flickering-grid.tsx`.

## When to use

- Hero and CTA sections of developer tools and AI products that want a living, digital texture.
- Behind a status or "system online" panel, where subtle flicker suggests activity.
- Cards and banners that should follow the theme color, including after a light/dark switch.

## When not to use

- A still pattern: use dot-grid, which is pure CSS and costs nothing at runtime.
- Soft, calm motion: use aurora.
- Behind long reading content or data tables: constant flicker pulls the eye. Use dot-grid with fade.

## Pick by what matters

| Need | Use |
| --- | --- |
| Barely-there texture | maxOpacity={0.12} flickerChance={0.15} |
| Brand colored | color="var(--primary)" |
| Chunkier pixels | squareSize={6} gap={4} |
| Cheaper on low-end devices | fps={15} |
| Freeze it | paused |

## Usage

```tsx
import { FlickeringGrid } from "@/components/goodui/flickering-grid"

export function ApiCta() {
  return (
    <section className="relative overflow-hidden rounded-2xl border bg-card px-6 py-20 text-center">
      <FlickeringGrid color="var(--primary)" maxOpacity={0.18} className="[mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="relative">
        <h2 className="text-3xl font-semibold">Sync bookings with your own app</h2>
        <p className="mt-2 text-muted-foreground">REST API and webhooks on every plan.</p>
      </div>
    </section>
  )
}
```

## API

### FlickeringGrid

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| squareSize | `number` | `4` | Side of each square, in px. |
| gap | `number` | `6` | Space between squares, in px. |
| flickerChance | `number` | `0.3` | Share of squares that change per second (0–1). |
| maxOpacity | `number` | `0.25` | Highest square opacity (0–1). |
| fps | `number` | `30` | Frames per second; flicker reads fine at 24–30 and costs half of 60. |
| paused | `boolean` | `false` | Stop flickering and keep the current frame. |

Also accepts every <div> attribute.

## Accessibility

- The canvas wrapper is aria-hidden and has pointer-events: none.
- Keep maxOpacity low behind text; the default is 0.25.

## Motion

- Each frame, a share of squares (`flickerChance` per second, 0.3) picks a new random opacity between 0 and `maxOpacity`. It draws at `fps` frames per second (30).
- It pauses while off-screen, while the tab is hidden and when paused is set.
- Reduced motion: one still frame is drawn and nothing animates.

## Performance

- Canvas 2D, sized to the container with devicePixelRatio (capped at 2) so squares stay sharp on retina screens. A ResizeObserver redraws on resize.
- The color is resolved once and re-read when the class, style or data-theme attribute of <html> changes or the system color scheme changes, not every frame.

## Notes for AI

- Place it inside a relative parent; it fills it with absolute inset-0. Give the content after it position: relative.
- color accepts any CSS color or variable (oklch, var(--primary)); it is resolved for canvas automatically.
- squareSize and gap are px; flickerChance and maxOpacity are 0 to 1.
- To fade the edges, add a mask with className, as in the usage example; there is no fade prop.

## FAQ

**Does it follow dark mode?**

Yes. With the default var(--foreground), or any theme variable, it re-reads the color when the theme class on <html> changes.

**Does it keep running when nobody sees it?**

No. It stops while off-screen, in a hidden tab and when paused, and draws at 30 fps by default. Lower fps for even less work.

## Related

- dot-grid: https://goodui.dev/components/backgrounds/dot-grid
- particles: https://goodui.dev/components/backgrounds/particles
- aurora: https://goodui.dev/components/backgrounds/aurora
- glow-border: https://goodui.dev/components/cards/glow-border

Last updated: 2026-11-02
