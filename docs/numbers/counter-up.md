# Counter up

> Counts from 0 (or from) to the value with an ease-out curve when it scrolls into view, with locale formatting, once or replay-on-return, and counts from the current value when it changes.

Count up animation on scroll for React and shadcn: animated stats counter

Page: https://goodui.dev/components/numbers/counter-up

## Install

```bash
npx shadcn@latest add @goodui/counter-up
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/counter-up.json`. The file lands in `components/goodui/counter-up.tsx`.

## When to use

- Stats rows on a landing page ("12,480 bookings this year") that should count when they scroll into view.
- KPI cards on first load, so the numbers draw the eye once.
- A total that changes later (new clients added): it counts from the current value to the new one.

## When not to use

- A live value that changes often and should feel like an odometer: use number-flow.
- Numbers in tables or forms that people read and compare: plain text, motion slows reading there.
- Showing a change (+8.2%) rather than a total: use delta-badge.

## Pick by what matters

| Need | Use |
| --- | --- |
| Count once when the section first appears | defaults (once is true) |
| Replay every time it comes back into view | once={false} |
| Inside a scrolling panel instead of the page | root={panelRef} |
| Start only when fully visible | amount={1} |
| Stagger a row of stats | delay={index * 0.08} |

## Usage

```tsx
import { CounterUp } from "@/components/goodui/counter-up"

const stats = [
  { label: "Bookings this year", value: 12480 },
  { label: "Revenue", value: 384920, format: { style: "currency", currency: "USD", maximumFractionDigits: 0 } as Intl.NumberFormatOptions },
  { label: "Average rating", value: 4.9, suffix: " / 5" },
  { label: "Clients who rebook", value: 68, suffix: "%" },
]

export function Stats() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((s, i) => (
        <div key={s.label} className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">{s.label}</div>
          <CounterUp
            value={s.value}
            format={s.format}
            suffix={s.suffix}
            delay={i * 0.08}
            className="mt-1 text-2xl font-semibold tracking-tight"
          />
        </div>
      ))}
    </div>
  )
}
```

### Count from a baseline and chain an action

```tsx
<CounterUp
  value={2847}
  from={2600}
  duration={0.9}
  onComplete={() => setShowBadge(true)}
/>
```

### Replay inside a scroll container

```tsx
const panel = React.useRef<HTMLDivElement>(null)

<div ref={panel} className="h-64 overflow-y-auto">
  …
  <CounterUp value={1260} suffix=" h" once={false} root={panel} amount={0.9} />
</div>
```

## API

### CounterUp

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| value (required) | `number` | — | Target value. Changing it later counts from the current value to the new one. |
| from | `number` | `0` | Start value for the first count. |
| duration | `number` | `1.6` | Seconds the count takes. |
| delay | `number` | `0` | Seconds to wait after the element enters the viewport. |
| ease | `Easing \| Easing[]` | `[0.16, 1, 0.3, 1]` | motion easing for the count; defaults to a strong ease-out [0.16, 1, 0.3, 1]. |
| format | `Intl.NumberFormatOptions` | — | Intl.NumberFormat options, e.g. { style: "currency", currency: "USD" }. |
| locale | `string` | — | Locale passed to Intl.NumberFormat ("de-DE" gives 1.234,5). Defaults to the GooduiLocaleProvider language, else en-US. |
| prefix | `string` | `""` | Text placed before the formatted number. |
| suffix | `string` | `""` | Text placed after the formatted number, e.g. "%" or " / 5". |
| once | `boolean` | `true` | Count only the first time it scrolls into view. With false it resets when it leaves and replays on return. |
| amount | `number` | `0.5` | Share of the element that must be visible before it starts, 0 to 1. |
| root | `React.RefObject<Element \| null>` | — | Scroll container to observe instead of the viewport. |
| onComplete | `() => void` | — | Called when a count finishes (also right away when reduced motion skips it). |

Also accepts every <span> attribute.

## Accessibility

- The final formatted value sits in an sr-only span from the start; the counting text is aria-hidden, so screen readers read the real number, not intermediate frames.
- The rest of the props go to the root <span>, so you can add aria-describedby or an id.

## Motion

- Counts with motion's animate() over duration (default 1.6 s) on the ease [0.16, 1, 0.3, 1], starting when amount (default 0.5) of the element is visible, after delay.
- Intermediate frames keep the target's decimal places (4.9 counts as 0.0, 0.1…), unless format sets fraction digits or uses currency.
- With once={false} it resets to from when it leaves the view and counts again on return.
- Reduced motion: the final value is written immediately and onComplete still fires.

## Performance

- Each frame writes textContent directly on the DOM node, so counting never re-renders React. The animation is stopped on unmount or when value changes mid-count.

## Notes for AI

- Pass the target as a number to value; format with format and locale, not by building a string.
- Use suffix for units ("%", " h", " / 5") and format.style "currency" for money.
- For a counter inside an overflow container, pass that container's ref as root, or it will count as soon as the page shows it.
- To replay on a button click, change its key (it remounts and counts from from); there is no replay method.
- It renders an inline-block span: put typography classes on it directly.

## FAQ

**Why does it start at 0 before scrolling into view?**

The server and the first render show from (default 0). The count starts when the element is in view, so a stat below the fold is still at 0 until the user gets there.

**What happens when value changes after the first count?**

It counts from the number currently shown to the new value with the same duration and ease, instead of restarting from from.

## Related

- number-flow: https://goodui.dev/components/numbers/number-flow
- stat-card: https://goodui.dev/components/core/stat-card
- delta-badge: https://goodui.dev/components/numbers/delta-badge
- text-reveal: https://goodui.dev/components/text/text-reveal

Last updated: 2026-11-02
