# Glow border

> A slowly rotating gradient arc travels around the card border with a soft glow that intensifies on hover and focus.

Glowing gradient border card for React and shadcn: rotating conic glow

Page: https://goodui.dev/components/cards/glow-border

## Install

```bash
npx shadcn@latest add @goodui/glow-border
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/glow-border.json`. The file lands in `components/goodui/glow-border.tsx`.

## When to use

- The selected or recommended plan on a pricing page (active keeps the glow on).
- Feature or AI cards on a dark landing section, where a soft colored halo adds depth.
- Forms or prompt boxes whose glow should strengthen while the user is typing inside (focus-within).

## When not to use

- A Core card that only needs a glow on hover: card with animation="glow" (or shadow="glow") is simpler and keeps variants and parts.
- A thin traveling highlight instead of a halo: use border-beam.
- Many cards in a grid: one glowing card stands out, many cancel each other. Use spotlight-card with SpotlightGroup.

## Pick by what matters

| Need | Use |
| --- | --- |
| Selected plan | active |
| Brand colors | colors={["var(--primary)", "#22d3ee"]} |
| Stronger halo at rest | restOpacity={0.45} blur={20} |
| Thicker border | borderWidth={2} |
| Padding on the content | innerClassName="p-6" |

## Usage

```tsx
import { GlowBorder } from "@/components/goodui/glow-border"

export function PlanCard({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  return (
    <GlowBorder active={selected} innerClassName="p-6">
      <h3 className="font-semibold">Business</h3>
      <p className="mt-2 text-3xl font-bold">$99<span className="text-base font-normal text-muted-foreground">/month</span></p>
      <p className="mt-2 text-sm text-muted-foreground">Unlimited locations, priority support, API access.</p>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="mt-6 h-10 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground"
      >
        {selected ? "Selected" : "Choose Business"}
      </button>
    </GlowBorder>
  )
}
```

### Prompt box that glows while typing

```tsx
<GlowBorder colors={["#a855f7", "#ec4899", "#f59e0b"]} innerClassName="p-2" duration={4}>
  <textarea
    aria-label="Describe the job"
    placeholder="3-bed move-out clean, Friday morning, pets in the house…"
    className="min-h-24 w-full resize-none bg-transparent p-2 text-sm outline-none"
  />
</GlowBorder>
```

## API

### GlowBorder

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| colors | `string[]` | `["var(--chart-1)", "var(--chart-4)", "var(--chart-5)"]` | Colors of the moving arc. Defaults to the theme's chart colors. |
| duration | `number` | `6` | Seconds per rotation. |
| borderWidth | `number` | `1` | Border width in px. |
| blur | `number` | `14` | Glow blur in px. |
| restOpacity | `number` | `0.25` | Glow opacity at rest and on hover/focus (0–1). |
| hoverOpacity | `number` | `0.75` | Glow opacity on hover, with focus inside, or while active (0 to 1). |
| active | `boolean` | `false` | Keep the intense state on, e.g. for a selected plan. |
| innerClassName | `string` | — | Classes for the inner surface. |

Also accepts every <div> attribute.

## Accessibility

- Two plain <div>s (border and inner surface); the glow is a pseudo-element that ignores the pointer and is not announced.
- The glow strengthens on :focus-within, so keyboard users get the same emphasis as hover.
- active is visual only: if it means "selected", also expose it on the control (aria-pressed, a radio, or text).

## Motion

- A conic gradient arc covering about half of the circle rotates around the border once every `duration` s (6), linear; a blurred copy (`blur` px, 14) glows behind it.
- On hover, focus inside, or when active, the glow rises from `restOpacity` (0.25) to `hoverOpacity` (0.75) and blurs 1.4x more, over 0.4 s. In dark mode the resting glow is 1.6x stronger.
- Rotation pauses while the card is off-screen.
- Reduced motion: the arc stops rotating and the glow change is instant. Browsers without @property support show the arc without rotation.

## Performance

- CSS only, animating one registered custom property; an IntersectionObserver pauses it off-screen. The blurred glow costs paint time, so keep it to a few cards per screen.

## Notes for AI

- Content padding goes in innerClassName (the inner surface); className styles the outer border box (radius, width).
- The outer box is rounded-xl; change it with className (rounded-2xl) and the inner surface follows (rounded-[inherit]).
- colors defaults to the theme's --chart-1, --chart-4, --chart-5; pass two or more CSS colors for brand colors.
- The inner surface is bg-card; override it with innerClassName if the card sits on a different surface.

## FAQ

**Why does the arc not rotate in my browser?**

Rotation animates a registered CSS custom property (@property). Browsers without it show the arc in a fixed position.

**Can I keep the glow on without hover?**

Yes, pass active. It uses the same strength as hover.

## Related

- border-beam: https://goodui.dev/components/cards/border-beam
- spotlight-card: https://goodui.dev/components/cards/spotlight-card
- card: https://goodui.dev/components/core/card
- aurora: https://goodui.dev/components/backgrounds/aurora

Last updated: 2026-11-02
