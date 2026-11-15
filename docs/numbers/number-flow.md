# Number flow

> Digits roll to the new value with locale formatting, prefixes and suffixes.

Animated rolling number for React and shadcn: digits roll to the new value

Page: https://goodui.dev/components/numbers/number-flow

## Install

```bash
npx shadcn@latest add @goodui/number-flow
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/number-flow.json`. The file lands in `components/goodui/number-flow.tsx`.

## When to use

- A live value that changes while the user watches: revenue on a dashboard, a cart total, seats left.
- Prices that switch with a monthly/yearly toggle, so the change is visible instead of a jump.
- Small counts next to controls (+ / - steppers) where each change should feel physical.

## When not to use

- A number that should count up once when it scrolls into view: use counter-up.
- Showing the change itself (+12.4%) rather than the value: use delta-badge.
- Values in a dense table that update often: use cell-flash, which signals the direction without moving the layout.

## Usage

```tsx
import { NumberFlow } from "@/components/goodui/number-flow"

export function PlanPrice({ yearly }: { yearly: boolean }) {
  return (
    <div className="flex items-baseline gap-1">
      <NumberFlow
        value={yearly ? 39 : 49}
        format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
        className="text-4xl font-semibold tracking-tight"
      />
      <span className="text-sm text-muted-foreground">per seat / month</span>
    </div>
  )
}
```

### Dashboard revenue in another locale

```tsx
<NumberFlow
  value={48295.5}
  locale="de-DE"
  format={{ style: "currency", currency: "EUR" }}
  className="text-3xl font-semibold"
/>
```

### Percent with prefix and suffix

```tsx
<NumberFlow value={0.684} format={{ style: "percent", maximumFractionDigits: 1 }} />
<NumberFlow value={1284} prefix="~" suffix=" bookings" />
```

## API

### NumberFlow

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| value (required) | `number` | — | Number to show. Changing it rolls each digit to its new value. |
| format | `Intl.NumberFormatOptions` | — | Intl.NumberFormat options, e.g. { style: "currency", currency: "USD" }. |
| locale | `string` | — | Locale passed to Intl.NumberFormat ("de-DE" gives 1.234,5). Defaults to the GooduiLocaleProvider language, else en-US. |
| prefix | `string` | `""` | Text placed before the formatted number, e.g. "~". |
| suffix | `string` | `""` | Text placed after the formatted number, e.g. " / mo". |
| speed | `"smooth" \| "fast"` | `"smooth"` | fast: snappier roll with no stagger, for values driven by a pointer (scrubbing a chart). |
| className | `string` | — | Classes merged onto the root element. |

## Accessibility

- The formatted value is rendered once in an sr-only span; the rolling digit columns are aria-hidden, so screen readers never read ten digits per column.
- There is no aria-live region: wrap it in your own live region if a change must be announced.

## Motion

- Each digit is a 0-9 column that slides on a spring (stiffness 140, damping 20, mass 0.8). A 9 going to 0 rolls back down the column through every digit, it does not wrap.
- Separators, currency symbols, prefix and suffix swap instantly; only digits roll.
- Characters are keyed by their distance from the end, so units stay in their column when the number gains or loses digits.
- Reduced motion: the transition becomes duration 0, so digits snap to the new value.

## Performance

- Each digit is one motion span animating transform only. There are no timers; nothing runs while the value is stable.

## Notes for AI

- Pass a number to value and formatting through format (Intl.NumberFormatOptions) and locale; do not pre-format it into a string.
- For currency use format={{ style: "currency", currency: "USD" }}, not prefix="$".
- It animates on value change only; it does not count up on mount. Use counter-up for that.
- Give the font size and weight through className; the component sets tabular-nums itself.
- There is no labels prop: the only text it renders is the formatted value.

## FAQ

**Does it animate on first render?**

No. initial is false, so it shows the value immediately and only rolls when value changes. Use counter-up for a count from zero.

**Can it show decimals and currencies?**

Yes. Anything Intl.NumberFormat formats works: currency, percent, compact notation, fixed fraction digits, any locale. Each digit in the output rolls.

## Related

- counter-up: https://goodui.dev/components/numbers/counter-up
- delta-badge: https://goodui.dev/components/numbers/delta-badge
- cell-flash: https://goodui.dev/components/numbers/cell-flash
- stat-card: https://goodui.dev/components/core/stat-card

Last updated: 2026-11-04
