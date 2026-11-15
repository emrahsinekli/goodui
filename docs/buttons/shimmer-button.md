# Shimmer button

> A light sweep runs across the button. Pure CSS; the sweep is removed for reduced motion.

Shimmer button for React and shadcn: CSS light sweep across a CTA

Page: https://goodui.dev/components/buttons/shimmer-button

## Install

```bash
npx shadcn@latest add @goodui/shimmer-button
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/shimmer-button.json`. The file lands in `components/goodui/shimmer-button.tsx`.

## When to use

- One call to action that should catch the eye on a landing or pricing page ("Start free trial").
- An upgrade prompt inside an app, where a slow sweep hints at the action without a badge.
- When you want a single standalone file with no variants to learn: one primary-colored button with a sweep.

## When not to use

- You already use the Core button: button with animation="shimmer" gives the same sweep plus every variant, tone, size and the loading state. That is the simpler choice in most apps.
- Several buttons on one screen: a looping sweep on each one competes for attention; keep shimmer to the main action and use button for the rest.
- Async actions that need loading, success and error feedback: use stateful-button.

## Pick by what matters

| Need | Use |
| --- | --- |
| Calmer, occasional sweep | duration={4} |
| Faster, more energetic sweep | duration={1.6} |
| Band visible on a light or custom background | shimmerColor="rgb(255 255 255 / 0.7)" or a brand color, plus your own className for the face |
| Same sweep with variants, tones and loading | button with animation="shimmer" |

## Usage

```tsx
import { Sparkles } from "lucide-react"
import { ShimmerButton } from "@/components/goodui/shimmer-button"

export function UpgradeCta({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <ShimmerButton onClick={onUpgrade}>
      <Sparkles />
      Upgrade to Pro
    </ShimmerButton>
  )
}
```

### Large hero button with a slower sweep

```tsx
<ShimmerButton duration={3.6} className="h-12 rounded-full px-8 text-base">
  Book your first cleaning
</ShimmerButton>
```

### Custom face and band color

```tsx
<ShimmerButton
  className="bg-emerald-600 text-white hover:bg-emerald-600/90"
  shimmerColor="rgb(255 255 255 / 0.6)"
>
  Accept quote · $240
</ShimmerButton>
```

## API

### ShimmerButton

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| duration | `number` | `2.4` | Seconds per sweep. |
| shimmerColor | `string` | — | Color of the light band. |

Also accepts every <button> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | Activates the button (native <button>). |
| Tab | Moves focus; a focus ring shows on keyboard focus only. |

## Accessibility

- Renders a native <button> and passes every button attribute through, so type, disabled, form and aria-* work as usual.
- The light band is a ::after pseudo-element with pointer-events: none; it is not announced and never blocks clicks.
- Disabled buttons get 50% opacity and no pointer events.

## Motion

- A 45%-wide light band, skewed by -20deg, sweeps from left to right on an ease-in-out loop every `duration` seconds (2.4 s by default).
- Press scales the button to 0.98; hover deepens the shadow.
- Reduced motion: the sweep is removed (animation off, band hidden); the button stays fully usable.

## Performance

- The sweep is a CSS transform animation on one pseudo-element; no JavaScript runs while it loops.

## Notes for AI

- Pass content as children (icons go inline before or after the text); there is no variant, size or icon prop.
- Restyle the face with className (bg-*, h-*, rounded-*, px-*); the sweep follows the border radius because the button clips overflow.
- duration is in seconds, not milliseconds.
- Use it for one main action per screen; for full variant control use the Core button with animation="shimmer" instead.

## FAQ

**What is the difference from the Core button's shimmer animation?**

Both sweep a light band. The Core button adds variants, tones, sizes, icons and loading, and sweeps every 2.6 s; ShimmerButton is a single small file with a configurable duration and band color.

**The band is hard to see on my button.**

The default band is white at 45% opacity, made for a dark or saturated face. On a light face pass a stronger or darker shimmerColor.

## Related

- button: https://goodui.dev/components/core/button
- shiny-text: https://goodui.dev/components/text/shiny-text
- border-beam-button: https://goodui.dev/components/buttons/border-beam-button
- rainbow-button: https://goodui.dev/components/buttons/rainbow-button

Last updated: 2026-11-02
