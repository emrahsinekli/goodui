# Confetti

> Hand-written canvas 2D confetti with flipping paper physics, fired over the page from an element or inside a contained canvas via ref, and a no-op under reduced motion.

Confetti for React and shadcn without canvas-confetti: burst from a button or inside a card

Page: https://goodui.dev/components/feedback/confetti

## Install

```bash
npx shadcn@latest add @goodui/confetti
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/confetti.json`. The file lands in `components/goodui/confetti.tsx`.

## When to use

- A real milestone: first booking received, plan upgraded, onboarding finished, goal reached.
- Payment success screens, fired once from the confirm button or from inside the receipt card.
- Playful moments in consumer apps where a burst from the clicked element feels rewarding.

## When not to use

- Routine saves and confirmations: use a toast-stack success toast; confetti on every action quickly gets annoying.
- The success state itself: pair confetti with success-check so the result is clear even with reduced motion.
- Continuous decorative motion: use particles.

## Pick by what matters

| Need | Use |
| --- | --- |
| Keep a milestone rare | once="first-booking" fires a single time per page load |
| Burst over the whole page from a button | fireConfetti({ element: e.currentTarget }) |
| Burst at a pointer position | fireConfetti({ origin: { x: e.clientX, y: e.clientY } }) |
| Confetti clipped to one card | <Confetti ref={ref} /> in a relative overflow-hidden parent, then ref.current.fire() |
| Side cannons | two fire calls with angle 60 and 120 from the bottom corners |
| Soft, brand-colored | colors={[…]} shapes={["circle"]} startVelocity 22, gravity 0.6 |

## Usage

```tsx
import { PartyPopper } from "lucide-react"
import { fireConfetti } from "@/components/goodui/confetti"
import { Button } from "@/components/ui/button"

export function PublishBookingPage({ onPublish }: { onPublish: () => Promise<void> }) {
  return (
    <Button
      onClick={async (e) => {
        const button = e.currentTarget
        await onPublish()
        fireConfetti({ element: button, particleCount: 120, spread: 80 })
      }}
    >
      <PartyPopper /> Publish booking page
    </Button>
  )
}
```

### Contained in a payment card, two cannons

```tsx
const confetti = React.useRef<ConfettiHandle>(null)
const card = React.useRef<HTMLDivElement>(null)

function onPaid() {
  const rect = card.current?.getBoundingClientRect()
  if (!rect) return
  confetti.current?.fire({ origin: { x: rect.left + 8, y: rect.bottom - 8 }, angle: 60, spread: 50, startVelocity: 30, particleCount: 60 })
  confetti.current?.fire({ origin: { x: rect.right - 8, y: rect.bottom - 8 }, angle: 120, spread: 50, startVelocity: 30, particleCount: 60 })
}

<div ref={card} className="relative overflow-hidden rounded-2xl border bg-card p-5">
  <Confetti ref={confetti} />
  …
</div>
```

### Gentle brand-colored burst

```tsx
fireConfetti({
  element: e.currentTarget,
  particleCount: 45,
  spread: 120,
  startVelocity: 22,
  gravity: 0.6,
  shapes: ["circle"],
  colors: ["#a78bfa", "#c4b5fd", "#f0abfc", "#fbcfe8"],
  scalar: 0.8,
})
```

## API

### Confetti

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| ref | `React.Ref<ConfettiHandle>` | — | Receives { fire(options), clear() } to burst inside this canvas. |
| sound | `boolean \| SoundName` | — | Default `sound` for fire(): "celebrate" (true) or a sound name, when the visitor has sounds on. Off by default. |

Also accepts every <canvas> attribute.

## Accessibility

- Both canvases are aria-hidden and pointer-events: none, so they never block clicks or reach screen readers.
- Confetti is decoration only: announce the success itself in text (success-check, a toast or a heading).

## Motion

- Each piece launches in a cone around angle (default 90°, straight up; spread 70°) at 50–120% of startVelocity (38), slows by decay (0.91) per frame, falls with gravity, wobbles sideways and flips by scaling one axis with cos(), like paper.
- Pieces live about 220 frames (±20%) and fade out over the last 35% of their life; anything that falls 40px below the canvas is dropped.
- Physics is frame-rate independent (normalised to 60 fps, capped at 3 frames per step).
- Reduced motion: fireConfetti() and ref.fire() do nothing at all.

## Performance

- Canvas 2D drawn by hand, no dependencies. The loop runs only while pieces are alive, pauses while the tab is hidden, and the contained canvas also pauses when scrolled off-screen (IntersectionObserver).
- The page canvas is created on the first fireConfetti() call and removed when the last piece is gone. Device pixel ratio is capped at 2.

## Notes for AI

- Call fireConfetti() in an event handler or effect, never during render.
- origin is in viewport px (clientX / clientY) for both fireConfetti and ref.fire; the contained canvas converts it.
- angle is in degrees where 90 is up, 0 is right and 180 is left; spread is the cone width in degrees.
- The <Confetti /> canvas is absolute inset-0: put it in a parent with position relative (and overflow-hidden to clip).
- Do not install or import canvas-confetti; the option names (particleCount, spread, startVelocity, decay, ticks, scalar) are already similar.

## FAQ

**Is the API the same as canvas-confetti?**

Close but not identical: the main options share names, while origin is in viewport px instead of 0–1 fractions, and element bursts from an element's center.

**Why does nothing happen on my machine?**

Your OS probably has reduced motion turned on; confetti is a no-op then. Show the success another way too.

## Related

- success-check: https://goodui.dev/components/feedback/success-check
- toast-stack: https://goodui.dev/components/feedback/toast-stack
- particles: https://goodui.dev/components/backgrounds/particles
- multi-step-loader: https://goodui.dev/components/feedback/multi-step-loader

Last updated: 2026-11-02
