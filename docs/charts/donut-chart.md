# Donut chart

> Donut or pie whose slices sweep in clockwise, re-share the ring when a legend item is toggled, push out on hover and roll the center total to the slice under the pointer.

Animated donut and pie chart for React and shadcn: sweeping arcs, rolling center total, legend with shares

Page: https://goodui.dev/components/charts/donut-chart

## Install

```bash
npx shadcn@latest add @goodui/donut-chart
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/donut-chart.json`. The file lands in `components/goodui/donut-chart.tsx`.

## When to use

- A part-to-whole glance with up to six slices: bookings by channel, revenue by payment method.
- A total that should sit in the middle and switch to the hovered slice's value.
- Readers who want to drop a slice (legend toggle) and see the rest re-share the ring.

## When not to use

- Comparing close values: use bar-chart; slices within a few percent of each other are hard to read.
- More than about six parts: fold the tail into "Other" or use treemap.
- A single value vs a goal: use radial-progress.

## Pick by what matters

| Need | Use |
| --- | --- |
| Classic donut with total | variant="donut" (default), title names the total |
| Full disc | variant="pie" (readout under the chart) |
| Thin accent ring | thickness={10} legend="end" |
| Money values | format={{ style: "currency", currency: "USD" }} |
| Hide shares in the legend | showPercent={false} |

## Usage

```tsx
import { DonutChart } from "@/components/goodui/donut-chart"

export function ChannelsCard() {
  return (
    <DonutChart
      title="Bookings"
      data={[
        { label: "Online", value: 612 },
        { label: "App", value: 348 },
        { label: "Phone", value: 191 },
        { label: "Walk-in", value: 133 },
      ]}
      size={180}
      thickness={22}
      legend="bottom"
    />
  )
}
```

### Pie with money

```tsx
<DonutChart title="Revenue" variant="pie" data={payments} size={150} legend="bottom" format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} />
```

### Controlled hidden slices

```tsx
const [hidden, setHidden] = React.useState<string[]>([])
<DonutChart data={channels} hidden={hidden} onHiddenChange={setHidden} />
```

## API

### DonutChart

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| data (required) | `DonutSlice[]` | — |  |
| title | `React.ReactNode` | — | Name shown under the center number and used by screen readers. |
| variant | `"donut" \| "pie"` | `"donut"` | donut (ring with the total in the middle) or pie (full disc, readout under it). |
| size | `number` | `200` | Diameter in px. |
| thickness | `number` | `24` | Ring thickness in px (donut). |
| gap | `number` | `2` | Surface gap between slices in px. |
| legend | `"end" \| "bottom" \| "none"` | `"end"` | Legend placement, with each slice's share. |
| showPercent | `boolean` | `true` | Show "42%" next to legend labels. |
| hidden | `string[]` | — | Keys of hidden slices (controlled); hidden slices leave the ring and the others re-share it. |
| defaultHidden | `string[]` | — |  |
| onHiddenChange | `(hidden: string[]) => void` | — |  |
| format | `Intl.NumberFormatOptions` | — | Intl.NumberFormat options for the values, e.g. { style: "currency", currency: "USD" }. |
| locale | `string` | `"en-US"` |  |
| formatValue | `(value: number) => string` | — |  |
| duration | `number` | `1` | Seconds the whole ring takes to sweep in. |
| labels | `Partial<DonutChartLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Focuses the ring; then the legend buttons. |
| Arrow keys | Cycles the active slice; its value and share show in the middle. |
| Home / End | First or last slice. |
| Escape | Clears the active slice. |
| Enter / Space on a legend item | Hides or shows the slice. |

## Accessibility

- The ring is role="group" with aria-roledescription="donut chart" (or "pie chart") and a summary that lists the total and every share.
- A screen-reader-only table lists label, value and share for all slices, hidden ones included.
- The active slice is announced through a polite live region ("Online: 612, 48%").
- The percentage shown in the middle is aria-hidden; the live region and table carry it.
- Legend items are aria-pressed buttons; all built-in strings go through labels.

## Motion

- On first view the slices sweep in clockwise one after another, each taking its share of duration (1 s) so the whole ring completes in one pass.
- Toggling a slice re-shares the ring: lengths and offsets move on a spring (stiffness 160, damping 26). The center total rolls with NumberFlow.
- Hovering a slice (or its legend item) pushes it out by 4px on a spring (stiffness 400, damping 24) and dims the others to 45%.
- Reduced motion: the ring appears complete, re-shares and hover are instant.

## Performance

- Slices are stroked circles using pathLength normalization, so no arc math runs per frame; one gap-adjusted dash per slice.

## Notes for AI

- data values must be ≥ 0; zero-value slices are kept in the legend and table but draw nothing.
- keys default to labels, so labels must be unique unless you pass key.
- Colors default to --chart-1 … --chart-5 in data order; set color per slice for more than five or for semantic colors.
- size and thickness are px props; the component is not fluid, so place it in a flex or grid cell.
- For a pie, the readout appears under the chart (there is no center).

## FAQ

**Why are the gaps between slices wedge-shaped?**

They are 2px along the ring's center line; with thick rings the inner edge gap gets slightly narrower than the outer. Set gap={0} for none.

**Can the center show something custom?**

The center shows the total or the active slice. For custom content, overlay your own element on the parent; it is a plain positioned div.

## Related

- radial-progress: https://goodui.dev/components/charts/radial-progress
- treemap: https://goodui.dev/components/charts/treemap
- bar-chart: https://goodui.dev/components/charts/bar-chart
- chart-legend: https://goodui.dev/components/charts/chart-legend

Last updated: 2026-11-03
