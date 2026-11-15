# Marquee

> An endless horizontal or vertical marquee with faded edges that pauses on hover, shown with customer logos, testimonials and a live bookings ticker.

Infinite marquee for React and shadcn: logo scroller and testimonial ticker

Page: https://goodui.dev/components/backgrounds/marquee

## Install

```bash
npx shadcn@latest add @goodui/marquee
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/marquee.json`. The file lands in `components/goodui/marquee.tsx`.

## When to use

- A "trusted by" row of customer logos under a hero.
- Testimonial walls: two or three rows moving in opposite directions, or vertical columns.
- A live ticker of recent bookings or sign-ups ("Maya booked a deep clean · 2 min ago").

## When not to use

- Text that should react to scroll speed: use scroll-velocity.
- Content people must read or click in order (pricing, steps): use a static grid; moving items are hard to compare.
- A carousel with prev/next controls and one item at a time: a marquee has no paging. Use a carousel component.

## Pick by what matters

| Need | Use |
| --- | --- |
| Logo row | defaults (horizontal, faded edges, pauses on hover) |
| Second row moving the other way | reverse |
| Vertical testimonial columns | vertical with a fixed height (className="h-96") |
| Slower | duration={60} |
| Content shorter than the container | repeat={4} |
| Never pause | pauseOnHover={false} |

## Usage

```tsx
import { Marquee } from "@/components/goodui/marquee"

const reviews = [
  { name: "Maya C.", text: "Our no-shows dropped by half in the first month." },
  { name: "Leo P.", text: "Clients book at midnight. I wake up to a full calendar." },
  { name: "Ana S.", text: "Deposits alone paid for the subscription." },
  { name: "Sam O.", text: "Crew schedules finally live in one place." },
]

export function Testimonials() {
  return (
    <section className="space-y-4 py-16">
      <Marquee gap="1rem" duration={45}>
        {reviews.map((r) => (
          <figure key={r.name} className="w-72 rounded-xl border bg-card p-4">
            <blockquote className="text-sm">{r.text}</blockquote>
            <figcaption className="mt-3 text-xs text-muted-foreground">{r.name}</figcaption>
          </figure>
        ))}
      </Marquee>
    </section>
  )
}
```

### Logo row

```tsx
<Marquee duration={30} gap="3rem" fadeSize="20%">
  {logos.map((l) => (
    <img key={l.name} src={l.src} alt={l.name} className="h-7 w-auto opacity-60 grayscale" />
  ))}
</Marquee>
```

### Vertical column

```tsx
<Marquee vertical reverse duration={35} className="h-[420px]">
  {reviews.map((r) => <ReviewCard key={r.name} {...r} />)}
</Marquee>
```

## API

### Marquee

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| reverse | `boolean` | `false` | Scroll toward the inline start (right-to-left in LTR, left-to-right under dir="rtl") or bottom-to-top when false; the other way when true. |
| pauseOnHover | `boolean` | `true` | Pause while the pointer is over it or focus is inside it. |
| vertical | `boolean` | `false` | Scroll vertically instead of horizontally; give the marquee a height. |
| duration | `number` | `40` | Seconds for one copy to pass. |
| gap | `string` | `"1rem"` | Space between items and between copies (any CSS length). |
| repeat | `number` | `3` | How many copies to render; raise it if the content is shorter than the container. |
| fade | `boolean` | `true` | Fade the edges with a mask. |
| fadeSize | `string` | `"12%"` | Length of each faded edge (any CSS length). |
| align | `"start" \| "center" \| "end" \| "stretch"` | — | Cross-axis alignment of the items. Defaults to center (horizontal) or stretch (vertical). |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Focus moves only through the first copy (the duplicates are inert); with pauseOnHover, focus inside pauses the marquee. |

## Accessibility

- Only the first copy is exposed: the extra copies are aria-hidden and inert, so screen readers read each item once and Tab skips the duplicates.
- pauseOnHover (default) also pauses while focus is inside, so links in the marquee can be read and clicked.
- Reduced motion turns it into a plain scrollable row (or column) with only one copy, so every item stays reachable.

## Motion

- Each copy slides by its own length plus the gap in a seamless linear loop; one copy passes every `duration` s (40).
- Edges fade with a mask (`fadeSize`, 12%).
- It pauses on hover and focus (pauseOnHover), while off-screen and while the tab is hidden.
- Reduced motion: no movement; duplicates are hidden and the row becomes scrollable.

## Performance

- CSS transform animation; no JavaScript runs per frame. An IntersectionObserver pauses it off-screen.

## Notes for AI

- Children are the items, rendered directly inside each track; do not wrap them in an extra flex container.
- gap and fadeSize take CSS lengths as strings ("1rem", "12%"), not numbers. duration is seconds.
- vertical needs a height on the marquee (className="h-96").
- Under dir="rtl" a horizontal marquee moves left-to-right so the copies loop seamlessly; reverse flips it as usual.
- Do not put aria-label on plain divs inside items (it is not allowed there); use role="img" with the label, or sr-only text, e.g. for a star rating.
- Give images alt text: the first copy is the accessible one.
- If you see a gap at the end of the loop, raise repeat; the content must be at least as long as the container.

## FAQ

**Why does the loop show an empty gap?**

The copies together must cover the container. Raise repeat (default 3) for short content or wide screens.

**Can people click links inside it?**

Yes. It pauses on hover and focus by default, and only the first copy is focusable.

## Related

- scroll-velocity: https://goodui.dev/components/text/scroll-velocity
- animated-list: https://goodui.dev/components/lists/animated-list
- card: https://goodui.dev/components/core/card
- progressive-blur: https://goodui.dev/components/cards/progressive-blur

Last updated: 2026-11-02
