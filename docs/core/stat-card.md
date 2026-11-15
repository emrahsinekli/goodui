# Stat Card

> KPI card with seven variants, tones, shadows and sizes: count-up or rolling NumberFlow values, auto-toned delta badges (invertible for no-show rates), line, area or bar sparklines that draw in, icons, footers and a skeleton state.

KPI stat card for React and shadcn: count-up value, delta badge and sparkline

Page: https://goodui.dev/components/core/stat-card

## Install

```bash
npx shadcn@latest add @goodui/stat-card
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/stat-card.json`. The file lands in `components/goodui/stat-card.tsx`.

## When to use

- The row of headline numbers at the top of a dashboard: revenue, bookings, new clients, no-show rate.
- A metric with its change since last period and a small trend line, without pulling in a chart library.
- Metrics that load asynchronously: loading shows a matching skeleton.
- Live numbers that update in place: numberFlow rolls the digits on every change.

## When not to use

- A full chart with axes, tooltips and several series: use a chart component.
- Just an animated number in a sentence or table cell: use number-flow or counter-up.
- A trend chip on its own: use delta-badge. A tiny trend line on its own: use sparkline-draw.

## Pick by what matters

| Need | Use |
| --- | --- |
| Scrub the sparkline | scrub (data in the same unit as value) |
| Default dashboard row | variant="outline" (default) with data and chart="area" |
| One hero metric that stands out | variant="gradient" or shadow="glow" |
| Calm, tinted cards grouped by category | variant="soft" with a tone per group |
| Icon-led cards in a sidebar or narrow column | variant="split" with icon, size="sm" |
| Daily counts (bookings per day) | chart="bars" |
| Lower is better (no-shows, churn, wait time) | invertDelta |
| Real-time values | numberFlow (digits roll on each change), animation="draw" |
| Static reports or print | animation="none" |

## Usage

```tsx
import { CalendarCheck, DollarSign, UserX } from "lucide-react"
import { StatCard } from "@/components/goodui/stat-card"

export function DashboardStats() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard
        label="Revenue"
        value={48210}
        format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
        delta={12.4}
        deltaLabel="vs last month"
        data={[31, 34, 33, 38, 41, 39, 45, 48]}
        icon={<DollarSign />}
      />
      <StatCard label="Bookings" value={1284} delta={4.1} data={[38, 42, 40, 51, 47, 55, 61]} chart="bars" icon={<CalendarCheck />} tone="info" />
      <StatCard label="No-show rate" value={3.2} suffix="%" delta={-0.8} invertDelta deltaSuffix=" pts" icon={<UserX />} tone="warning" footer="Deposits enabled since Oct 4" />
    </div>
  )
}
```

### Loading state

```tsx
<StatCard label="Revenue" value={data?.revenue ?? 0} loading={isLoading} data={data?.trend} />
```

### Compact numbers with rolling digits

```tsx
<StatCard label="Page views" value={views} compact numberFlow variant="soft" tone="success" />
```

### Clickable card

```tsx
<a href="/reports/revenue" className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
  <StatCard label="Revenue" value={48210} prefix="$" interactive />
</a>
```

## API

### StatCard

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| label (required) | `React.ReactNode` | — | Metric name shown above the value. |
| value (required) | `number \| string` | — | A number (animated and formatted) or any preformatted string. Numeric strings like "1,284" count too. |
| prefix | `string` | `""` | Text before the formatted number, e.g. "$". |
| suffix | `string` | `""` | Text after the formatted number, e.g. "%" or " ms". |
| format | `Intl.NumberFormatOptions` | — | Intl.NumberFormat options, e.g. { style: "currency", currency: "USD" }. |
| compact | `boolean` | — | Short notation: 12.4K, 1.2M. |
| locale | `string` | — | Locale for number formatting. Defaults to the GooduiLocaleProvider language, else en-US. |
| delta | `number \| string` | — | Change in percent, e.g. 12.5 or -3. |
| deltaLabel | `React.ReactNode` | — | Muted text beside the value, e.g. "vs last month". |
| deltaSuffix | `string` | `"%"` | Unit after the delta number; "%" by default. |
| invertDelta | `boolean` | — | A drop is good news (cancellations, no-shows, wait time). |
| data | `number[] \| string` | — | Sparkline points: [12, 18, 15] or "12,18,15". |
| chart | `"line" \| "area" \| "bars"` | `"area"` | Sparkline style for data: line, area (default) or bars. |
| icon | `React.ReactNode` | — | Icon in a tinted tile beside the label, or in the side block with variant="split". |
| footer | `React.ReactNode` | — | Muted line at the bottom of the card. |
| variant | `"plain" \| "outline" \| "soft" \| "gradient" \| "glass" \| "neo" \| "split"` | `"outline"` | Surface: plain, outline (default), soft, gradient, glass, neo, or split (icon block on the start side). |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"primary"` | Accent for the icon, sparkline, soft and gradient surfaces and glow. Delta colors are separate (good/bad). |
| shadow | `"none" \| "sm" \| "md" \| "lg" \| "glow"` | `"none"` | Drop shadow; glow uses the tone. Ignored by neo. |
| shape | `"square" \| "rounded" \| "round"` | `"rounded"` | Corner radius: square, rounded or round. |
| size | `"sm" \| "md" \| "lg"` | `"md"` |  |
| animation | `"none" \| "count" \| "draw" \| "full"` | `"full"` | count counts the value up on view, draw draws the sparkline in, full does both. |
| numberFlow | `boolean` | — | Roll digits with NumberFlow. |
| scrub | `boolean` | — | Scrub the sparkline with the pointer: the value and delta roll to each point. data must be in the same unit as value. |
| loading | `boolean` | — | Skeleton state while the metric loads. |
| interactive | `boolean` | — | Hover lift, for cards that link somewhere. |
| labels | `Partial<StatCardLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Accessibility

- The counting number is aria-hidden; screen readers read the final formatted value from a visually hidden copy, once. With numberFlow, NumberFlow handles its own screen-reader text.
- The delta adds visually hidden "increase", "decrease" or "no change" after the number, so the trend does not rely on the arrow or color. Translate with labels.
- The sparkline and its end dot are aria-hidden; describe the trend in deltaLabel or footer if it matters.
- loading sets aria-busy on the card.
- interactive only adds a hover lift; the card is a <div>, so wrap it in a link or button for keyboard access.

## Motion

- count: when 30% of the card is in view, the value counts up from 0 over 1.2 s with an ease-out curve; later value changes tween from the current number.
- draw: the line draws in over 1.1 s, the area fades in, then the end dot pops in at 1.1 s; bars grow from the bottom, 40 ms apart. full (default) does count and draw together.
- numberFlow: digits roll to the new value on every change instead of tweening.
- interactive: the card lifts 2px in 200 ms on hover (neo cards grow their offset shadow). The loading skeleton shimmers every 1.4 s.
- Reduced motion: the value shows the final number at once, the chart is drawn, the skeleton is static and the hover lift does not animate.

## Performance

- One IntersectionObserver per card, disconnected after the first reveal. The count-up uses requestAnimationFrame for 1.2 s; the sparkline is measured with a ResizeObserver and redrawn only when its size changes.

## Notes for AI

- value can be a number or a string. Numeric strings like "1,284" animate; other strings ("2h 15m", "N/A") are shown as they are.
- Use format (Intl.NumberFormat options) for currency and percent, or prefix and suffix for simple units. Do not pre-format numbers you want animated.
- delta is a change in percent by default; set deltaSuffix for other units (" pts", ""). Trend color is automatic: up is good unless invertDelta.
- data needs at least 2 points to draw a sparkline; it accepts [12, 18, 15] or "12,18,15".
- Default is variant="outline" tone="primary" chart="area" animation="full" locale="en-US"; pass locale for other number formats. labels translates the delta's screen-reader words.

## FAQ

**How do I show currency?**

Pass format={{ style: "currency", currency: "EUR" }} and optionally locale="de-DE". The count-up formats every frame with the same formatter.

**Why is my sparkline missing?**

It only renders with 2 or more finite points in data. With loading set it shows a skeleton in its place.

## Related

- number-flow: https://goodui.dev/components/numbers/number-flow
- delta-badge: https://goodui.dev/components/numbers/delta-badge
- sparkline-draw: https://goodui.dev/components/numbers/sparkline-draw
- card: https://goodui.dev/components/core/card

Last updated: 2026-11-04
