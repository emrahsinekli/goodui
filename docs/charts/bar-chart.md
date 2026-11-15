# Bar chart

> Grouped, stacked or horizontal bars that grow from the baseline on view and morph when data changes, with a gliding hover band, legend toggles, value labels and 2px surface gaps between segments.

Animated bar chart for React and shadcn: grouped, stacked and horizontal bars with a hover band

Page: https://goodui.dev/components/charts/bar-chart

## Install

```bash
npx shadcn@latest add @goodui/bar-chart
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/bar-chart.json`. The file lands in `components/goodui/bar-chart.tsx`.

## When to use

- Comparing categories: revenue by service line per month, bookings by weekday.
- Parts of a total per category (stacked): bookings by channel, costs by type.
- Ranked lists with long labels: horizontal mode puts the names on the start side and the values at the bar tips.

## When not to use

- A single value against a goal: use meter, radial-progress or gauge.
- Many periods of a continuous metric: use area-chart or line-chart.
- Steps that add up to a total: use waterfall-chart.

## Pick by what matters

| Need | Use |
| --- | --- |
| Series side by side | mode="grouped" (default) |
| Series on top of each other | mode="stacked" (values ≥ 0, 2px surface gaps between segments) |
| Ranked categories, long names | orientation="horizontal" axisWidth={150} valueLabels |
| Print the numbers | valueLabels (stack totals in stacked mode) |
| Thinner or thicker bars | barSize (max thickness in px, default 24) and radius |

## Usage

```tsx
import { BarChart } from "@/components/goodui/bar-chart"

export function RevenueByService() {
  return (
    <BarChart
      title="Revenue by service line"
      categories={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]}
      series={[
        { key: "hair", label: "Hair", data: [18400, 19100, 21300, 20200, 23800, 25100] },
        { key: "nails", label: "Nails", data: [8200, 8900, 9400, 9900, 10800, 11200] },
        { key: "spa", label: "Spa", data: [5100, 5600, 5200, 6400, 7100, 7600] },
      ]}
      format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
      height={230}
    />
  )
}
```

### Stacked bookings by channel

```tsx
<BarChart title="Bookings by channel" mode="stacked" categories={days} series={[online, app, phone]} />
```

### Horizontal ranking with values at the tips

```tsx
<BarChart title="Top services" orientation="horizontal" categories={services} series={[{ key: "revenue", label: "Revenue", data: revenue }]} valueLabels axisWidth={150} format={usd} />
```

## API

### BarChart

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| series (required) | `BarSeries[]` | — |  |
| categories (required) | `string[]` | — |  |
| title | `React.ReactNode` | — | Chart name for screen readers and the table caption. |
| mode | `"grouped" \| "stacked"` | `"grouped"` | grouped: one bar per series side by side. stacked: one bar per category, segments separated by a 2px gap. |
| orientation | `"vertical" \| "horizontal"` | `"vertical"` | vertical columns or horizontal bars (category labels on the start side, values along the bottom). |
| valueLabels | `boolean` | `false` | Prints the value at each bar's end (the stack total in stacked mode). |
| barSize | `number` | `24` | Maximum bar thickness in px; the rest of the slot stays air. |
| radius | `number` | `4` | Corner radius of the data end in px. The baseline end stays square. |
| hidden | `string[]` | — | Keys of hidden series (controlled). |
| defaultHidden | `string[]` | — |  |
| onHiddenChange | `(hidden: string[]) => void` | — |  |
| legend | `"top" \| "bottom" \| "none"` | `"bottom"` | Legend placement; a single series shows none. |
| height | `number` | — | Plot height in px, axes included. Horizontal charts default to a row height per category. |
| rowHeight | `number` | `34` | Row height per category in horizontal mode. |
| grid | `boolean` | `true` |  |
| axis | `boolean` | `true` |  |
| axisWidth | `number` | — | Space for the value ticks (vertical) or the category labels (horizontal), in px. |
| format | `Intl.NumberFormatOptions` | — |  |
| locale | `string` | `"en-US"` |  |
| formatValue | `(value: number) => string` | — |  |
| formatTick | `(value: number) => string` | — |  |
| labels | `Partial<BarChartLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Focuses the plot and highlights the first category; then the legend buttons. |
| Arrow keys | Moves the highlight one category (any arrow works in both orientations). |
| Home / End | First or last category. |
| Escape | Clears the highlight. |

## Accessibility

- The plot is role="group" with aria-roledescription="bar chart" and a summary label ("Revenue by service line: 3 series across 6 categories").
- A screen-reader-only table lists every category with one column per series (plus a total column when stacked).
- The highlighted category is announced through a polite live region with every series value.
- Legend items are aria-pressed buttons (chart-legend); the stacked total shows in the tooltip and the table.
- Bars are ≤ 24px thick with a 4px rounded data end and a square baseline end; adjacent bars and stacked segments are separated by a 2px surface gap, not a stroke.

## Motion

- On first view bars grow from the baseline on a spring (stiffness 170, damping 26, mass 0.9), staggered 35 ms per category and 50 ms per series; value labels fade in after 0.45 s.
- Data changes and legend toggles morph the bars to their new size on the same spring; the ticks slide and cross-fade. A container resize re-lays the bars out instantly.
- The hover band glides to the pointed category on a stiff spring (600 / 40); other categories dim to 75% and a dimmed series (legend hover) to 30%.
- Reduced motion: bars appear at full size at once and the band moves instantly.

## Performance

- Paths are plain SVG path strings with quadratic corners, so every bar shares one template and animates with one motion value each. One ResizeObserver per chart.

## Notes for AI

- series[i].data has one value per category. Stacked mode expects values ≥ 0; grouped mode accepts negatives (bars grow downward).
- Horizontal charts size themselves from rowHeight × categories unless height is given; vertical charts default to 240px.
- axisWidth reserves space for value ticks (vertical, default 44) or category labels (horizontal, default 96): raise it for long names.
- Colors default to --chart-1 … --chart-5 in series order; set series[i].color for anything else. Keep the same color for the same entity across charts.

## FAQ

**How do I show totals on stacked bars?**

Pass valueLabels; in stacked mode it prints the stack total above each column (or at the tip in horizontal mode).

**Can categories be dense (30 days)?**

Yes: category labels thin out automatically (every k-th label that fits), bars shrink to fit their slot and the hover band still lands on every category.

## Related

- line-chart: https://goodui.dev/components/charts/line-chart
- waterfall-chart: https://goodui.dev/components/charts/waterfall-chart
- chart-legend: https://goodui.dev/components/charts/chart-legend
- funnel-chart: https://goodui.dev/components/charts/funnel-chart

Last updated: 2026-11-03
