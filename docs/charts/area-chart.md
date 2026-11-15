# Area chart

> Area chart that draws its line in on view, morphs between 1W / 1M / 1Y ranges, and rolls its headline value as a hairline and tooltip follow the pointer or the arrow keys.

Animated area chart for React and shadcn: draw-in, range morph, scrubbable with a rolling headline

Page: https://goodui.dev/components/charts/area-chart

## Install

```bash
npx shadcn@latest add @goodui/area-chart
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/area-chart.json`. The file lands in `components/goodui/area-chart.tsx`.

## When to use

- One metric over time with a headline that matters: revenue, bookings, visits, MRR.
- A time-range picker (1W / 1M / 1Y) where the curve should morph instead of flashing a new chart.
- Dashboards where the number should follow the pointer: hover or arrow through the points and the headline rolls to each value.

## When not to use

- Several series on one axis: use line-chart, which has a legend and a crosshair that reads every series.
- A trend under a KPI with no axes: use sparkline-draw or kpi-trend.
- Values that are not a magnitude from zero (temperatures, scores): an area fill implies volume, so use line-chart with baseline="auto".

## Pick by what matters

| Need | Use |
| --- | --- |
| A drop is good news | invertChange |
| No change pill or grain | showChange={false} grain={false} |
| Revenue card with ranges | ranges={[{ key, label, data }]} with format={{ style: "currency", currency: "USD" }} |
| Headline shows the latest value, not the sum | headline="last" (or "average", or "none") |
| Exact readings matter more than looks | curve="linear" |
| Compact card without axis chrome | axis={false} grid={false} height={150} |
| Percentages | formatValue={(v) => `${v}%`} formatTick={(v) => `${v}%`} |

## Usage

```tsx
import { AreaChart } from "@/components/goodui/area-chart"

const ranges = [
  { key: "1w", label: "1W", data: [{ label: "Mon", value: 1480 }, { label: "Tue", value: 1720 } /* … */] },
  { key: "1m", label: "1M", data: days.map((d) => ({ label: d.label, value: d.revenue })) },
  { key: "1y", label: "1Y", data: months.map((m) => ({ label: m.label, value: m.revenue })) },
]

export function RevenueCard() {
  return (
    <div className="rounded-xl border bg-card p-5">
      <AreaChart ranges={ranges} defaultRange="1m" title="Revenue" description="this period" format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} height={220} />
    </div>
  )
}
```

### Single series, headline on the latest point

```tsx
<AreaChart data={bookings} title="Bookings" headline="last" description="today" color="var(--chart-2)" height={150} axis={false} grid={false} />
```

### Controlled range (the app owns the selection)

```tsx
const [range, setRange] = React.useState("1m")
<AreaChart ranges={ranges} range={range} onRangeChange={setRange} title="Visits" />
```

### Translated

```tsx
<AreaChart
  data={data}
  title="Umsatz"
  locale="de-DE"
  format={{ style: "currency", currency: "EUR" }}
  labels={{ range: "Zeitraum", columnLabel: "Zeitraum", columnValue: "Wert", noData: "Keine Daten", point: (label, value) => `${label}: ${value}` }}
/>
```

## API

### AreaChart

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| color | `string` | `"var(--chart-1)"` | Any CSS color for the line and gradient. Defaults to the theme's first chart color. |
| data | `AreaPoint[]` | — | Points in order, oldest first. Changing them morphs the curve to the new shape. |
| ranges | `AreaRange[]` | — | Named data sets with a built-in picker (1W / 1M / 1Y); the curve morphs between them. Takes precedence over data. |
| range | `string` | — | Selected range key (controlled). |
| defaultRange | `string` | — | Initial range key when uncontrolled; defaults to the first. |
| onRangeChange | `(key: string) => void` | — |  |
| title | `React.ReactNode` | — | Metric name above the headline, e.g. "Revenue". |
| headline | `"total" \| "last" \| "average" \| "none"` | `"total"` | What the rolling headline shows while nobody is scrubbing: the sum, the latest point, the average, or nothing. |
| showChange | `boolean` | `true` | Pill with the change from the first point, following the scrub position. Its arrow flips when the sign does. |
| invertChange | `boolean` | `false` | A drop is good news (no-shows, wait time): swaps the pill's colors. |
| grain | `boolean` | `true` | Film grain over the gradient fill. |
| description | `React.ReactNode` | — | Muted text beside the headline, replaced by the hovered point's label while scrubbing. |
| height | `number` | `220` | Plot height in px, axes included. The width follows the container. |
| curve | `"smooth" \| "linear"` | `"smooth"` | smooth: monotone curve that never overshoots the data. linear: straight segments. |
| grid | `boolean` | `true` | Horizontal hairline gridlines. |
| axis | `boolean` | `true` | Value ticks on the start side. |
| axisWidth | `number` | `44` | Space reserved for the value ticks, in px. |
| format | `Intl.NumberFormatOptions` | — | Intl.NumberFormat options for the headline, tooltip and ticks, e.g. { style: "currency", currency: "USD" }. |
| locale | `string` | `"en-US"` |  |
| formatValue | `(value: number) => string` | — | Replaces the default formatter for the tooltip, table and screen readers. |
| formatTick | `(value: number) => string` | — | Replaces the default tick formatter (compact above 10,000). |
| samples | `number` | `160` | Resampled points along the curve; a constant count is what lets 7 and 365 points morph into each other. |
| duration | `number` | `1.1` | Seconds the line takes to draw in. |
| labels | `Partial<AreaChartLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Focuses the plot and highlights the latest point. |
| ArrowLeft / ArrowRight | Moves the hairline one point; the headline rolls to that value. |
| Home / End | Jumps to the first or last point. |
| Escape | Clears the highlight and tooltip. |
| Arrow keys in the range picker | Selects the previous or next range (radio group). |

## Accessibility

- The plot is role="group" with aria-roledescription="area chart" and an aria-label built from the data ("Revenue: from $1,480 to $2,110, low …, high …"); your aria-label replaces it.
- A screen-reader-only table lists every point (period, value) under the chart; the SVG itself is aria-hidden.
- The highlighted point is announced through a polite live region as "<label>: <value>".
- The range picker is a radiogroup of real buttons with aria-checked and roving tabindex.
- All built-in strings (summary, point, range, column headers, noData) go through labels.

## Motion

- While scrubbing, the line past the pointer dims, a dashed crosshair marks the point, the headline rolls with the fast spring, and the change pill's arrow flips when the sign does.
- On first view (IntersectionObserver, 20% visible) the line draws in with pathLength over duration (1.1 s, ease [0.65, 0, 0.35, 1]); the gradient area fades in over 0.7 s from 40% of that; the end dot pops on a spring (stiffness 420, damping 22) at 85%; x labels fade in left to right.
- Switching ranges or changing data morphs the path on a spring (stiffness 190, damping 30, mass 0.9). Every data set is resampled to `samples` points (160), so 7 and 365 points share one path shape; y ticks cross-fade and slide to their new positions.
- The hairline and active dot follow the pointer on a stiff spring (stiffness 600, damping 40); the headline digits roll with NumberFlow.
- A container resize re-lays the chart out instantly (no morph), and x labels that appear after the entrance fade in over 0.2 s without the stagger.
- The end dot sends out a ring every 2.4 s (CSS).
- Reduced motion: everything appears at its final state at once, morphs are instant, the ring is hidden; the gate waits for mount so the first client render matches the server.

## Performance

- One ResizeObserver per chart measures the width before paint; the SVG is rendered only after measuring. Resampling runs once per data change and the path strings are short (two numbers per sample).

## Notes for AI

- Give ranges or data, not both; ranges wins. Each range's data is its own array of { label, value } in time order.
- format takes Intl.NumberFormat options and is used for the headline, tooltip and ticks; use formatValue/formatTick for custom strings (e.g. percentages).
- The width follows the parent; set height in px through the prop, not a Tailwind class.
- color takes any CSS color or variable (default var(--chart-1)); do not pass a Tailwind class.
- Pass a string title so the screen reader summary and table caption name the metric.

## FAQ

**Why does a 365-point range look slightly smoothed?**

Each data set is resampled to `samples` points (160 by default) so the morph works; raise samples for dense daily data.

**Does the smooth curve invent peaks?**

No. It uses monotone cubic interpolation (Fritsch–Carlson), which never goes above a peak or below a dip in your data.

**What renders on the server?**

The header and an empty plot of the right height; the SVG renders after the width is measured, and the entrance plays once the chart is in view.

## Related

- line-chart: https://goodui.dev/components/charts/line-chart
- sparkline-draw: https://goodui.dev/components/numbers/sparkline-draw
- kpi-trend: https://goodui.dev/components/charts/kpi-trend
- number-flow: https://goodui.dev/components/numbers/number-flow

Last updated: 2026-11-04
