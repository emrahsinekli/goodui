# Dot grid

> A dot or line grid background with a radial, top or edge fade and an optional glow that follows the pointer. Pure CSS.

Dot grid background for React and shadcn: dot and grid pattern with fade and cursor glow

Page: https://goodui.dev/components/backgrounds/dot-grid

## Install

```bash
npx shadcn@latest add @goodui/dot-grid
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/dot-grid.json`. The file lands in `components/goodui/dot-grid.tsx`.

## When to use

- Behind a hero, pricing header or empty state, to add texture without color.
- Developer-tool and SaaS pages that want a blueprint or graph-paper feel (variant="lines").
- Interactive sections where the grid should brighten around the cursor (highlight).

## When not to use

- Moving texture: use flickering-grid (canvas) or particles.
- Soft colored light instead of a pattern: use aurora.
- Behind dense text or tables: the pattern makes small text harder to read. Use a plain bg-muted surface.

## Pick by what matters

| Need | Use |
| --- | --- |
| Dots fading out from the center | variant="dots" fade="radial" (defaults) |
| Graph-paper lines | variant="lines" gap={32} |
| Pattern under a header that fades downward | fade="top" |
| Soft edges on all sides | fade="edges" |
| Glow following the cursor | highlight |

## Usage

```tsx
import { DotGrid } from "@/components/goodui/dot-grid"

export function Hero() {
  return (
    <section className="relative overflow-hidden py-28 text-center">
      <DotGrid highlight />
      <div className="relative">
        <h1 className="text-5xl font-bold tracking-tight">Run your cleaning business from one screen</h1>
        <p className="mt-4 text-muted-foreground">Bookings, crews, invoices and reminders.</p>
      </div>
    </section>
  )
}
```

### Line grid under a pricing header

```tsx
<header className="relative overflow-hidden py-20">
  <DotGrid variant="lines" gap={32} fade="top" />
  <h2 className="relative text-center text-4xl font-semibold">Simple pricing</h2>
</header>
```

### Brand-tinted dots

```tsx
<DotGrid gap={18} size={1.2} color="color-mix(in oklch, var(--primary) 35%, transparent)" fade="edges" />
```

## API

### DotGrid

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| variant | `"dots" \| "lines"` | `"dots"` | "dots" is a dot pattern; "lines" a square line grid. |
| gap | `number` | `22` | Distance between dots or lines, in px. |
| size | `number` | `1` | Dot radius or line width, in px. |
| fade | `"none" \| "bottom" \| "top" \| "radial" \| "edges"` | `"radial"` | Where the pattern fades out: "radial" \| "top" \| "bottom" \| "edges" \| "none". |
| highlight | `boolean` | `false` | Brighten the pattern around the pointer (listens on the parent element). |
| highlightColor | `string` | `"color-mix(in oklch, var(--chart-1) 90%, transparent)"` | Color of the pattern inside the pointer highlight. Defaults to the theme's --chart-1. |
| highlightRadius | `number` | `180` | Radius of the pointer highlight, in px. |

Also accepts every <div> attribute.

## Accessibility

- The grid is aria-hidden and has pointer-events: none, so it is never announced and never blocks clicks.
- The default color is the foreground at low opacity (22% for dots, 9% for lines), so it follows light and dark themes.

## Motion

- The pattern itself does not move.
- With highlight, a brighter copy of the pattern shows in a circle (`highlightRadius` px, 180) around the pointer and fades in and out over 0.4 s.
- Reduced motion: the highlight appears and disappears without the fade.

## Performance

- The pattern is CSS gradients. The highlight listens to pointer moves on the parent element and updates two CSS variables once per animation frame; React does not re-render.

## Notes for AI

- Place it as the first child of a relative (usually overflow-hidden) parent, and give the content after it position: relative so it paints above.
- highlight listens on the parent element, so the glow works across the whole section, not only over the grid.
- gap, size and highlightRadius are px; color is any CSS color.
- fade values: radial, top, bottom, edges, none.

## FAQ

**Does it work in dark mode?**

Yes. The default color mixes the theme's --foreground with transparency, so it adapts to light and dark.

**Why do I not see the cursor glow?**

highlight is off by default and the glow is drawn only while the pointer is over the parent element. Check that the parent is the section you hover.

## Related

- flickering-grid: https://goodui.dev/components/backgrounds/flickering-grid
- aurora: https://goodui.dev/components/backgrounds/aurora
- particles: https://goodui.dev/components/backgrounds/particles
- spotlight-card: https://goodui.dev/components/cards/spotlight-card

Last updated: 2026-11-02
