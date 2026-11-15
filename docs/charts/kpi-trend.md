# KPI trend

> KPI tile family: the number rolls in on view and on every change (NumberFlow), the delta badge pops and pulses, the sparkline draws itself (SparklineDraw), and a group lines tiles up with hairline dividers.

KPI tile with rolling number, delta badge and sparkline for React and shadcn

Page: https://goodui.dev/components/charts/kpi-trend

## Install

```bash
npx shadcn@latest add @goodui/kpi-trend
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/kpi-trend.json`. The file lands in `components/goodui/kpi-trend.tsx`.

## When to use

- The row of headline metrics at the top of a dashboard: revenue, bookings, no-show rate, average ticket.
- Live numbers: values and sparklines that update every few seconds without re-rendering the layout.
- Any metric with a change vs the previous period and a 7–14 point trend.

## When not to use

- A metric that needs full variant, tone, shadow and shape layers: use the Core stat-card.
- A single hero number without trend: counter-up or number-flow alone.
- A chart with axes: area-chart.

## Pick by what matters

| Need | Use |
| --- | --- |
| Four metrics in one framed row | <KpiTrendGroup columns={4}> with KpiTrend tiles |
| Wide tile with the trend beside the number | layout="row" size="lg" |
| Compact list of metrics | size="sm" layout="row" |
| Rate where down is good | invertDelta (no-shows, churn, wait time) |
| Money | format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} |

## Usage

```tsx
import { KpiTrend, KpiTrendGroup } from "@/components/goodui/kpi-trend"

export function Overview({ revenue, bookings, noShow }: { revenue: number[]; bookings: number[]; noShow: number[] }) {
  const last = (a: number[]) => a[a.length - 1] ?? 0
  return (
    <KpiTrendGroup columns={3}>
      <KpiTrend label="Revenue" value={last(revenue)} format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} delta={12.4} deltaLabel="vs last week" data={revenue} />
      <KpiTrend label="Bookings" value={last(bookings)} delta={3.1} deltaLabel="vs last week" data={bookings} color="var(--chart-2)" />
      <KpiTrend label="No-show rate" value={last(noShow)} suffix="%" delta={-0.8} invertDelta deltaLabel="vs last week" data={noShow} color="var(--chart-5)" />
    </KpiTrendGroup>
  )
}
```

### Wide, interactive tile

```tsx
<KpiTrend label="Monthly recurring revenue" value={48210} format={usd} delta={12.4} deltaLabel="vs September" data={mrr} layout="row" size="lg" interactive onClick={open} />
```

### Translated delta text

```tsx
<KpiTrend label="Umsatz" value={48210} locale="de-DE" format={{ style: "currency", currency: "EUR" }} delta={12.4} labels={{ increase: "mehr", decrease: "weniger", noChange: "unverändert" }} />
```

## API

### KpiTrend

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| label (required) | `React.ReactNode` | — | Metric name above the value. |
| value (required) | `number` | — |  |
| color | `string` | `"var(--chart-1)"` | Sparkline color. Defaults to the theme's first chart color. |
| format | `Intl.NumberFormatOptions` | — | Intl.NumberFormat options, e.g. { style: "currency", currency: "USD", maximumFractionDigits: 0 }. |
| locale | `string` | `"en-US"` |  |
| prefix | `string` | `""` | Text before the number. |
| suffix | `string` | `""` | Text after the number, e.g. "%". |
| delta | `number` | — | Change vs the previous period, e.g. 12.4 for +12.4%. |
| deltaSuffix | `string` | `"%"` | Unit after the delta number. |
| deltaDecimals | `number` | `1` | Decimals of the delta. |
| invertDelta | `boolean` | — | A drop is good news (no-shows, churn, wait time). |
| deltaLabel | `React.ReactNode` | — | Muted text after the delta, e.g. "vs last week". |
| data | `number[]` | — | Sparkline values, oldest first. |
| pointLabels | `string[]` | — | One label per sparkline point, shown in its tooltip. |
| layout | `"stack" \| "row"` | `"stack"` | stack: sparkline under the number. row: sparkline on the end side. |
| size | `"sm" \| "md" \| "lg"` | `"md"` |  |
| interactive | `boolean` | — | Hover lift for tiles that link somewhere. |
| labels | `Partial<KpiTrendLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

### KpiTrendGroup

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| columns | `2 \| 3 \| 4` | `4` | Tiles per row on wide screens; they stack to one and two columns below. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Focuses the sparkline (from sparkline-draw). |
| ArrowLeft / ArrowRight, Home / End | Moves the sparkline's highlighted point; the value shows in its tooltip. |

## Accessibility

- The value is rendered once as screen-reader text with the final formatted number; the rolling digits are aria-hidden.
- The delta badge carries sr-only text "+12.4% increase" (or decrease / no change) through labels; color and arrow are extra.
- The sparkline is sparkline-draw with its own summary label (the tile label) and keyboard scrubbing.
- KpiTrendGroup draws hairline dividers with background color, so tiles have no nested borders.

## Motion

- On first view (30% visible) the number rolls up from 0 with NumberFlow digit springs (stiffness 140, damping 20), the delta badge pops in (0.45 s, overshooting ease) and the sparkline draws itself (sparkline-draw, 0.9 s).
- A new value rolls the digits; a new delta pulses a 8px ring in its tone for 0.6 s; new sparkline data redraws the line.
- interactive tiles lift 2px on hover (0.2 s).
- Reduced motion: digits snap, no pop, no pulse, the sparkline appears drawn.

## Performance

- Each tile owns one IntersectionObserver until it is seen; updates re-render the tile only.

## Notes for AI

- value is the current number; delta is the percent change (or any number with deltaSuffix). Pass invertDelta for metrics where a drop is good.
- data is the sparkline (oldest first) and pointLabels names its points; keep both the same length.
- format is Intl.NumberFormat options; prefix/suffix wrap the formatted number ("%").
- Use KpiTrendGroup for a framed row; standalone tiles get their own rounded border.

## FAQ

**How is this different from stat-card?**

stat-card is the layered Core primitive (variants, tones, shadows, shapes). KpiTrend is the chart-group tile tuned for live updates: rolling digits, pulsing delta and a redrawing sparkline, with a group that lines tiles up.

**Will the numbers roll from 0 on every render?**

No: only on first view. Later changes roll from the previous value.

## Related

- stat-card: https://goodui.dev/components/core/stat-card
- sparkline-draw: https://goodui.dev/components/numbers/sparkline-draw
- number-flow: https://goodui.dev/components/numbers/number-flow
- delta-badge: https://goodui.dev/components/numbers/delta-badge
- counter-up: https://goodui.dev/components/numbers/counter-up

Last updated: 2026-11-03
