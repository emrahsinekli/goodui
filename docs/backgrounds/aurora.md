# Aurora

> Soft colored light drifts slowly behind a section, with light and dark palettes and only transform animations for low CPU.

Aurora background for React and shadcn: soft animated gradient mesh

Page: https://goodui.dev/components/backgrounds/aurora

## Install

```bash
npx shadcn@latest add @goodui/aurora
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/aurora.json`. The file lands in `components/goodui/aurora.tsx`.

## When to use

- Hero sections and sign-up pages that need color and calm motion behind the headline.
- Behind glass UI (liquid-glass-button), which needs something colorful to blur.
- Pricing or CTA banners that should follow the theme (palette="brand").

## When not to use

- Behind data-dense app screens: moving color behind numbers is distracting. Use a plain background or dot-grid.
- A crisp, technical texture: use dot-grid or flickering-grid.
- Text that needs a gradient: use gradient-text.

## Pick by what matters

| Need | Use |
| --- | --- |
| Cool teal and violet | palette="aurora" (default) |
| Warm peach and pink | palette="sunset" |
| Calm blues | palette="ocean" |
| Follow the theme's chart colors | palette="brand" |
| Exact colors in both themes | colors={["#…", "#…", "#…", "#…"]} |
| Quieter | intensity={0.5} speed={0.6} |

## Usage

```tsx
import { Aurora } from "@/components/goodui/aurora"

export function SignupHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border px-6 py-24 text-center">
      <Aurora palette="brand" intensity={0.8} />
      <div className="relative">
        <h1 className="text-4xl font-semibold tracking-tight">Start taking bookings today</h1>
        <p className="mt-3 text-muted-foreground">14-day free trial. No card needed.</p>
      </div>
    </section>
  )
}
```

### Sunset palette behind a glass toolbar

```tsx
<div className="relative h-80 overflow-hidden rounded-2xl">
  <Aurora palette="sunset" speed={1.4} />
  <div className="absolute inset-x-0 top-6 flex justify-center">
    <LiquidGlassToolbar defaultValue="week" aria-label="Calendar range">
      <LiquidGlassToolbarItem value="day">Day</LiquidGlassToolbarItem>
      <LiquidGlassToolbarItem value="week">Week</LiquidGlassToolbarItem>
    </LiquidGlassToolbar>
  </div>
</div>
```

## API

### Aurora

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| palette | `"aurora" \| "sunset" \| "ocean" \| "brand"` | `"aurora"` | Theme-aware preset; "brand" mixes the theme's chart colors. |
| colors | `[string, string, string, string]` | — | Custom colors for the four blobs (overrides the palette in both themes). |
| speed | `number` | `1` | Speed multiplier; 1 is a slow drift. |
| intensity | `number` | `0.9` | Blob opacity, 0–1. |

Also accepts every <div> attribute.

## Accessibility

- The layer is aria-hidden and has pointer-events: none.
- Light-mode palettes are pale and dark-mode palettes deep, so foreground text keeps its usual color on top. Check contrast yourself with custom colors or high intensity.

## Motion

- Four radial-gradient blobs drift, scale and alternate direction on ease-in-out loops of 18, 22, 26 and 20 s, divided by `speed`.
- Only transform is animated; the blobs are soft gradients, not filter: blur.
- It pauses while off-screen and while the tab is hidden.
- Reduced motion: the blobs stay still; the colors remain.

## Performance

- CSS keyframes on four elements, transform only, so the compositor does the work and no JavaScript runs per frame.

## Notes for AI

- Place it inside a relative overflow-hidden parent; it fills it with absolute inset-0. Give the content after it position: relative.
- colors must be exactly four CSS colors and replaces the palette in both light and dark.
- speed is a multiplier (2 is twice as fast); intensity is blob opacity from 0 to 1.
- The "brand" palette mixes --chart-1, --chart-2, --chart-4 and --chart-5 with the background, so it follows the theme.

## FAQ

**Does it change between light and dark?**

Yes. Every preset has a pale light-mode set and a deeper dark-mode set. Custom colors are used in both.

**Can I make it static?**

There is no off switch for the motion besides reduced motion; for a still look use a very low speed, or a CSS gradient background.

## Related

- dot-grid: https://goodui.dev/components/backgrounds/dot-grid
- particles: https://goodui.dev/components/backgrounds/particles
- gradient-text: https://goodui.dev/components/text/gradient-text
- liquid-glass-button: https://goodui.dev/components/buttons/liquid-glass-button

Last updated: 2026-11-02
