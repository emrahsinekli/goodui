# Border beam

> Wraps any card or input and runs a light beam around its border, matching the element's corner radius automatically.

Border beam animation for React and shadcn: light beam around any card or input

Page: https://goodui.dev/components/cards/border-beam

## Install

```bash
npx shadcn@latest add @goodui/border-beam
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/border-beam.json`. The file lands in `components/goodui/border-beam.tsx`.

## When to use

- Highlighting the recommended pricing plan or the one card that is new.
- Drawing the eye to an input that matters (an AI prompt box, a search field) without changing its style.
- Hero product screenshots and code blocks that need a subtle sign of life.

## When not to use

- A Core card that just needs a moving border: card with animation="border-beam" is simpler. Use BorderBeam to wrap anything else (inputs, images, your own cards) or to tune size, speed, colors and beam count.
- A button: use border-beam-button, which is built for it and keeps a static gradient for reduced motion.
- A soft colored glow around the whole edge: use glow-border.

## Pick by what matters

| Need | Use |
| --- | --- |
| Recommended plan card | defaults around the card |
| Two beams chasing each other | beams={2} |
| Calmer | duration={10} |
| Card with a 2px border | borderWidth={2} |
| Several beams out of sync | delay={…} on each |
| Radius the measurement gets wrong | radius={16} |

## Usage

```tsx
import { BorderBeam } from "@/components/goodui/border-beam"

export function RecommendedPlan() {
  return (
    <BorderBeam className="rounded-2xl" beams={2} duration={8}>
      <div className="rounded-2xl border bg-card p-6">
        <p className="text-sm font-medium text-primary">Most popular</p>
        <h3 className="mt-1 text-xl font-semibold">Team</h3>
        <p className="mt-4 text-3xl font-bold">$49<span className="text-base font-normal text-muted-foreground">/month</span></p>
        <p className="mt-2 text-sm text-muted-foreground">Up to 10 staff, online payments, SMS reminders.</p>
      </div>
    </BorderBeam>
  )
}
```

### Around an AI prompt input

```tsx
<BorderBeam className="w-full max-w-md" colorFrom="#a855f7" colorTo="#38bdf8" size={60} duration={4}>
  <input
    aria-label="Ask the assistant"
    placeholder="Move all Friday bookings to Saturday…"
    className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
  />
</BorderBeam>
```

## API

### BorderBeam

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| size | `number` | `80` | Length of the beam in px. |
| duration | `number` | `6` | Seconds per lap. |
| delay | `number` | `0` | Seconds to offset the start (useful for several beams). |
| colorFrom | `string` | `"var(--chart-1)"` | Head color of the beam. Defaults to the theme's --chart-1. |
| colorTo | `string` | `"var(--chart-4)"` | Tail color of the beam. Defaults to the theme's --chart-4. |
| borderWidth | `number` | `1` | Width of the lit ring in px; match the border of the wrapped element. |
| radius | `number` | — | Corner radius of the path. Defaults to the wrapped element's own radius. |
| reverse | `boolean` | `false` | Run the beam the other way around the border. |
| beams | `1 \| 2` | `1` | Number of beams, spaced evenly around the border. |

Also accepts every <div> attribute.

## Accessibility

- The beam layer is aria-hidden with pointer-events: none, so the wrapped element works exactly as before (focus, typing, clicks).
- BorderBeam adds a wrapper <div> but no roles.

## Motion

- A gradient beam `size` px long (80) travels the border on a CSS offset-path rect() that uses the same corner radius, one lap every `duration` s (6), linear. beams={2} spaces two beams half a lap apart; reverse runs it the other way.
- The beam pauses while the element is off-screen.
- Reduced motion: the beam is hidden; the wrapped element's own border stays.
- Browsers without offset-path rect() support: the beam is hidden.

## Performance

- CSS animation on one or two small elements; an IntersectionObserver pauses it off-screen.

## Notes for AI

- Wrap exactly one element whose box matches the wrapper: the beam follows the wrapper's edges. Make the child fill it (w-full) or size the wrapper with className.
- The corner radius is read once from the first child (or the wrapper) on mount; if it changes later, pass radius explicitly.
- Match borderWidth to the child's border width so the lit ring lines up with it.
- Default colors are the theme's --chart-1 and --chart-4; size is px, duration and delay are seconds.

## FAQ

**Why is there no beam?**

The beam is hidden for reduced motion and in browsers without offset-path rect(). Without a radius prop, it also waits until the radius has been measured after mount.

**Core card animation="border-beam" or BorderBeam?**

The Core card's beam is a rotating conic gradient built into the card. BorderBeam wraps any element and runs a beam along the exact rounded-rect path, with size, speed, colors, direction and two beams.

## Related

- border-beam-button: https://goodui.dev/components/buttons/border-beam-button
- glow-border: https://goodui.dev/components/cards/glow-border
- card: https://goodui.dev/components/core/card
- spotlight-card: https://goodui.dev/components/cards/spotlight-card

Last updated: 2026-11-02
