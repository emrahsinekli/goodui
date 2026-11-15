# Delta badge

> "+12.4%" change badge whose digits roll, arrow rotates to the new direction and background pulses green or red, with an inverted mode for metrics where down is good.

Percent change badge for React and shadcn: animated +12.4% delta with up and down arrows

Page: https://goodui.dev/components/numbers/delta-badge

## Install

```bash
npx shadcn@latest add @goodui/delta-badge
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/delta-badge.json`. The file lands in `components/goodui/delta-badge.tsx`.

## When to use

- Next to a KPI to show the change from the previous period: "+12.4%" revenue vs last week.
- Metrics where down is good (cancellations, churn, costs) with goodWhen="down", so a drop shows green.
- Comparison tables that refresh, where the change should be noticed when it updates.

## When not to use

- Showing the value itself rather than its change: use number-flow.
- Signalling that a table cell just changed, up or down: use cell-flash.
- Status labels like "Paid" or "Overdue": use badge.

## Pick by what matters

| Need | Use |
| --- | --- |
| Inline in a KPI card or table | variant="soft" (default) |
| Strong emphasis on a hero stat | variant="solid" |
| Quiet, on busy backgrounds | variant="outline" |
| Lower is better (churn, no-shows, cost) | goodWhen="down" |
| Absolute change, not percent | suffix="" or suffix=" pts" |

## Usage

```tsx
import { DeltaBadge } from "@/components/goodui/delta-badge"

const rows = [
  { label: "Revenue", value: "$48,295", delta: 12.4 },
  { label: "Bookings", value: "1,284", delta: 4.1 },
  { label: "Cancellations", value: "38", delta: -3.2, goodWhen: "down" as const },
]

export function WeekOverWeek() {
  return (
    <div className="divide-y rounded-xl border bg-card">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="text-sm font-medium">{r.label}</div>
            <div className="text-xs text-muted-foreground tabular-nums">{r.value}</div>
          </div>
          <DeltaBadge value={r.delta} goodWhen={r.goodWhen} />
        </div>
      ))}
    </div>
  )
}
```

### Small solid and outline badges

```tsx
<DeltaBadge value={12.4} variant="solid" size="sm" />
<DeltaBadge value={-3.2} goodWhen="down" variant="outline" size="sm" />
<DeltaBadge value={0} size="sm" />
```

### Whole-number change without the arrow

```tsx
<DeltaBadge value={7} decimals={0} suffix=" pts" hideIcon />
```

## API

### DeltaBadge

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| value (required) | `number` | — | The change, e.g. 12.4 for +12.4%. |
| decimals | `number` | `1` | Decimals shown. |
| suffix | `string` | `"%"` | Text after the number; use "" or " pts" for non-percent changes. |
| goodWhen | `"up" \| "down"` | `"up"` | Which direction is good. Use "down" for churn, no-shows or costs. |
| variant | `"soft" \| "solid" \| "outline"` | `"soft"` | soft: tinted background, solid: filled green or red with white text, outline: colored border and text. |
| size | `"sm" \| "md"` | `"md"` | sm is 20px tall with 11px text, md is 24px with 12px text. |
| hideIcon | `boolean` | `false` | Hide the arrow icon. |
| labels | `Partial<DeltaBadgeLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <span> attribute.

## Accessibility

- An sr-only span reads the change in words, e.g. "Up 12.4%", "Down 3.2%" or "No change, 0.0%"; the arrow, sign and rolling digits are aria-hidden. Translate the words with labels (up, down, flat).
- Green and red are not the only signal: the sign, the arrow direction and the words all say the direction.
- There is no aria-live region; changes are not announced on their own.

## Motion

- Digits roll through number-flow. The arrow rotates on a spring (stiffness 260, damping 18): up at 0°, down at 180°, sideways at 90° for no change.
- When the rounded value changes, a tinted ring grows to 1.35x and fades over 0.6 s, and the number scales 1 → 1.12 → 1 in 0.35 s. Nothing pulses on first render.
- Background and text colors cross-fade over 300 ms when the tone flips.
- Reduced motion: no ring and no scale pulse; the arrow and digits snap to the new state.

## Notes for AI

- value is the change itself in percent units (12.4 means +12.4%), not a ratio (0.124) and not the new total.
- Do not add a + or − yourself; the badge adds the sign and uses the true minus character.
- Color comes from direction and goodWhen; there is no tone prop. Use goodWhen="down" for cancellations, churn, refunds and costs.
- The value is rounded to decimals (default 1) before deciding the direction, so 0.04 shows as flat "0.0%".
- labels={{ up: (a) => `Plus ${a}`, down: (a) => `Minus ${a}`, flat: (a) => `Unverändert, ${a}` }} translates the screen-reader text; a is the formatted amount with suffix.

## FAQ

**Why is my drop shown in green?**

goodWhen="down" is set, so a decrease counts as good. Remove it for metrics where up is good.

**Does it work in a table that re-renders often?**

Yes. It only pulses when the rounded value actually changes, so re-renders with the same value do nothing.

## Related

- number-flow: https://goodui.dev/components/numbers/number-flow
- stat-card: https://goodui.dev/components/core/stat-card
- cell-flash: https://goodui.dev/components/numbers/cell-flash
- badge: https://goodui.dev/components/core/badge

Last updated: 2026-11-02
