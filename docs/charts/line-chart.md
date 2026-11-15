# Line chart

> Multi-series lines that draw in staggered, a legend that toggles series while the scale refits, a crosshair that reads every series at once, and a dashed forecast segment behind a divider.

Multi-series line chart for React and shadcn: legend toggles, crosshair tooltip, dashed forecast

Page: https://goodui.dev/components/charts/line-chart

## Install

```bash
npx shadcn@latest add @goodui/line-chart
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/line-chart.json`. The file lands in `components/goodui/line-chart.tsx`.

## When to use

- Two to five series on one scale: this year vs last year, response time by channel, plan vs actual.
- A projection: pass forecastFrom and the tail of every line turns dashed behind a "Forecast" divider.
- Readers who need to hide a noisy series and let the scale refit (legend toggles).

## When not to use

- One metric with a headline: use area-chart.
- Two measures of different scale: never a dual axis; use two charts or index both to 100.
- Rank changes rather than values: use bump-chart.

## Pick by what matters

| Need | Use |
| --- | --- |
| Actual vs last year | two series, forecastFrom for the projected months |
| Series with very different ranges | baseline="auto" zooms to the data; toggle series in the legend |
| Exact values | curve="linear" |
| Legend above the plot | legend="top" |
| Control hidden series from the app | hidden + onHiddenChange |

## Usage

```tsx
import { LineChart } from "@/components/goodui/line-chart"

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function BookingsChart() {
  return (
    <LineChart
      title="Bookings per month"
      categories={months}
      series={[
        { key: "this", label: "This year", data: [412, 438, 471, 455, 502, 548, 561, 539, 590, 628, 655, 690] },
        { key: "last", label: "Last year", data: [368, 372, 401, 395, 430, 462, 478, 470, 495, 520, 541, 560] },
      ]}
      forecastFrom={9}
      height={240}
    />
  )
}
```

### Minutes, zoomed scale, legend on top

```tsx
<LineChart title="First response time" categories={weeks} series={byChannel} baseline="auto" legend="top" curve="linear" formatValue={(v) => `${v} min`} />
```

### Legend rendered elsewhere

```tsx
const [hidden, setHidden] = React.useState<string[]>([])
<ChartLegend items={items} hidden={hidden} onHiddenChange={setHidden} />
<LineChart categories={weeks} series={series} hidden={hidden} onHiddenChange={setHidden} legend="none" />
```

## API

### LineChart

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| series (required) | `LineSeries[]` | — |  |
| categories (required) | `string[]` | — | X labels, one per data point. |
| title | `React.ReactNode` | — | Chart name for screen readers and the table caption. |
| forecastFrom | `number` | — | Index from which the lines are drawn dashed (a projection); a divider labelled "Forecast" marks it. |
| hidden | `string[]` | — | Keys of hidden series (controlled). |
| defaultHidden | `string[]` | — |  |
| onHiddenChange | `(hidden: string[]) => void` | — |  |
| legend | `"top" \| "bottom" \| "none"` | `"bottom"` | Legend placement; a single series shows none. |
| height | `number` | `240` | Plot height in px, axes included. The width follows the container. |
| curve | `"smooth" \| "linear"` | `"smooth"` |  |
| baseline | `"zero" \| "auto"` | `"zero"` | zero keeps 0 in view; auto zooms to the data. |
| grid | `boolean` | `true` |  |
| axis | `boolean` | `true` |  |
| axisWidth | `number` | `44` |  |
| endDots | `boolean` | `true` | Ring dot on the last point of every line. |
| format | `Intl.NumberFormatOptions` | — | Intl.NumberFormat options for values and ticks. |
| locale | `string` | `"en-US"` |  |
| formatValue | `(value: number) => string` | — |  |
| formatTick | `(value: number) => string` | — |  |
| samples | `number` | `160` | Resampled points per line; constant, so lines morph when the data changes. |
| duration | `number` | `1.1` | Seconds one line takes to draw; lines stagger by 0.12 s. |
| labels | `Partial<LineChartLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Focuses the plot and shows the crosshair on the latest period; then moves on to the legend buttons. |
| ArrowLeft / ArrowRight | Moves the crosshair one period. |
| Home / End | Jumps to the first or last period. |
| Escape | Clears the crosshair. |
| Enter / Space on a legend item | Hides or shows that series. |

## Accessibility

- The plot is role="group" with aria-roledescription="line chart" and a summary label ("Bookings per month: 2 series over 12 periods"); your aria-label replaces it.
- A screen-reader-only table has one row per period and one column per series, with forecast periods marked.
- The crosshair position is announced through a polite live region: "Oct: This year 628, Last year 520".
- Legend items are buttons with aria-pressed (chart-legend); hidden series leave the scale and the tooltip.
- All built-in strings (summary, point, forecast, legend, column header, noData) go through labels.

## Motion

- On first view each line draws in with pathLength over duration (1.1 s, ease [0.65, 0, 0.35, 1]), staggered 0.12 s per series; the dashed forecast segment fades in as the solid part reaches it; end dots pop on a spring (stiffness 420, damping 22).
- Data changes and legend toggles morph the paths and slide the ticks on a spring (stiffness 190, damping 30, mass 0.9); lines are resampled to `samples` points so shapes with different lengths still morph.
- The crosshair and its dots snap to the pointer on a stiff spring (stiffness 600, damping 40). Hovering a legend item dims the other lines to 25% over 0.2 s.
- A container resize re-lays the chart out instantly (no morph); labels that appear after the entrance fade in over 0.2 s.
- Reduced motion: lines, dots and labels appear at once, morphs are instant.

## Performance

- One ResizeObserver per chart; paths are rebuilt only when data, size or hidden series change. No timers.

## Notes for AI

- series[i].data must have one value per category, in the same order. Keys must be unique; colors default to --chart-1 … --chart-5 by series order (give colors explicitly past five series).
- forecastFrom is an index into categories: lines are dashed from that point on. It needs 0 < forecastFrom < categories.length.
- Legends show only for two or more series; a single series has no legend box by design.
- Width follows the parent; height is a px prop. Do not wrap it in a fixed-width container smaller than ~240px.

## FAQ

**Can I put two different units on one chart?**

No, and that is deliberate: a second y-axis invents correlations. Render two charts, or convert both series to an index (100 at the first period).

**What happens when every series is hidden?**

The scale keeps 0..1, the tooltip is empty and the table still lists the data.

## Related

- area-chart: https://goodui.dev/components/charts/area-chart
- bar-chart: https://goodui.dev/components/charts/bar-chart
- chart-legend: https://goodui.dev/components/charts/chart-legend
- bump-chart: https://goodui.dev/components/charts/bump-chart

Last updated: 2026-11-03
