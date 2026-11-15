# Progressive blur

> Blur that grows stronger toward the edge of a scroll container, built from stacked backdrop-filter layers; shown on a scrolling bookings list.

Progressive blur for React and shadcn: gradient blur at the edge of a scroll list

Page: https://goodui.dev/components/cards/progressive-blur

## Install

```bash
npx shadcn@latest add @goodui/progressive-blur
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/progressive-blur.json`. The file lands in `components/goodui/progressive-blur.tsx`.

## When to use

- The bottom (or top) edge of a scrolling list, so items soften away instead of being cut off: bookings, messages, notifications.
- Under a sticky header or floating toolbar, where content should blur as it scrolls beneath.
- Image cards with a caption at the bottom, where a blur band keeps the text readable over the photo.

## When not to use

- Hinting that a horizontal row continues: a plain mask fade is cheaper; marquee has one built in for moving rows.
- Long, fast-scrolling pages on low-end phones: stacked backdrop-filter layers cost GPU time. Use a gradient fade (fadeColor alone, or a CSS mask) there.
- Hiding content for privacy or paywalls: blur is not access control.

## Pick by what matters

| Need | Use |
| --- | --- |
| Bottom of a scroll list | side="bottom" (default) |
| Under a sticky header | side="top" |
| Also fade into the card color | fadeColor="var(--card)" |
| Smoother | layers={8} |
| Cheaper | layers={3} |
| Fixed height band | size={96} (px) or size="6rem" |

## Usage

```tsx
import { ProgressiveBlur } from "@/components/goodui/progressive-blur"

const bookings = [
  { time: "09:00", client: "Maya Chen", service: "Deep clean · 3 bed" },
  { time: "11:30", client: "Leo Park", service: "Move-out clean" },
  { time: "13:00", client: "Ana Silva", service: "Windows" },
  { time: "15:30", client: "Sam Ortiz", service: "Office · weekly" },
  { time: "17:00", client: "Iris Novak", service: "Carpet steam" },
]

export function TodayList() {
  return (
    <div className="relative h-72 overflow-hidden rounded-xl border bg-card">
      <ul className="h-full divide-y overflow-y-auto pb-16">
        {bookings.map((b) => (
          <li key={b.time} className="flex gap-4 px-4 py-3 text-sm">
            <span className="w-12 font-mono text-muted-foreground">{b.time}</span>
            <span className="font-medium">{b.client}</span>
            <span className="ms-auto text-muted-foreground">{b.service}</span>
          </li>
        ))}
      </ul>
      <ProgressiveBlur side="bottom" size={80} fadeColor="var(--card)" />
    </div>
  )
}
```

### Blur under a sticky header

```tsx
<div className="relative h-[480px] overflow-hidden">
  <header className="absolute inset-x-0 top-0 z-20 h-14 px-4">Messages</header>
  <ProgressiveBlur side="top" size={88} blur={10} />
  <div className="h-full overflow-y-auto pt-14">{/* messages */}</div>
</div>
```

## API

### ProgressiveBlur

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| side | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Edge the blur sits on; it grows toward that edge. |
| size | `string \| number` | `"35%"` | Size of the blurred band (any CSS length). |
| blur | `number` | `8` | Blur in px at the very edge. |
| layers | `number` | `6` | Number of stacked layers; more is smoother, fewer is cheaper. |
| fadeColor | `string` | — | Also fade to this color at the edge (e.g. "var(--card)"). Off when undefined. |

Also accepts every <div> attribute.

## Accessibility

- The blur is aria-hidden and has pointer-events: none, so content under it stays clickable and scrollable.
- Leave scroll padding (pb-16 or similar) so the last item can scroll fully out from under the blur.
- Give the scroll container tabIndex={0} and an aria-label (unless it already holds focusable items), so keyboard users can scroll it.

## Motion

- No animation: the blur is static and only changes as content scrolls beneath it, so reduced motion needs no special handling.

## Performance

- Each layer is one backdrop-filter element; the blur doubles per layer up to `blur` px (8). Fewer layers are cheaper, more are smoother (default 6).
- Keep it to a few instances per screen, especially on mobile.

## Notes for AI

- Place it inside a relative (and usually overflow-hidden) wrapper, as a sibling of the scroll container, not inside the scrolling element.
- size accepts a number (px) or any CSS length; blur is px at the very edge.
- side uses physical edges (top, bottom, left, right); it does not flip in RTL.
- fadeColor should match the surface behind the list (var(--card), var(--background)).
- It renders at z-10; raise sticky headers above it if they should stay sharp.

## FAQ

**Why use several layers instead of one blur?**

A single backdrop-filter has one strength. Stacking masked layers whose blur doubles toward the edge makes the blur grow smoothly.

**Browsers without backdrop-filter?**

The layers then do nothing; add fadeColor so the edge still fades.

## Related

- marquee: https://goodui.dev/components/backgrounds/marquee
- card: https://goodui.dev/components/core/card
- animated-list: https://goodui.dev/components/lists/animated-list
- spotlight-card: https://goodui.dev/components/cards/spotlight-card

Last updated: 2026-11-02
