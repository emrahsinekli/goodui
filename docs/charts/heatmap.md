# Heatmap

> Calendar (GitHub-style) or matrix heatmap on one hue with cells that pop in column by column, a tooltip, arrow-key navigation that scrolls the calendar along, and a Less–More scale.

Calendar and matrix heatmap for React and shadcn: GitHub-style contribution graph with tooltips

Page: https://goodui.dev/components/charts/heatmap

## Install

```bash
npx shadcn@latest add @goodui/heatmap
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/heatmap.json`. The file lands in `components/goodui/heatmap.tsx`.

## When to use

- Activity per day over months: bookings, orders, check-ins, commits.
- Intensity across two dimensions: weekday × hour, staff × service, region × month (matrix mode).
- Spotting patterns (busy Saturdays, dead Mondays) rather than reading exact values.

## When not to use

- Exact comparisons between a few values: use bar-chart.
- A single trend: use area-chart.
- Categorical identity (which team): a heatmap encodes magnitude on one hue only.

## Pick by what matters

| Need | Use |
| --- | --- |
| Last 6 months of daily activity | mode="calendar" data={[{ date, value }]} weeks={26} |
| Weekday × hour | mode="matrix" rows={days} columns={hours} values={grid} |
| Skewed data where a few huge days flatten the rest | scale="quantile" |
| Finer scale | steps={5} (levels above zero) |

## Usage

```tsx
import { Heatmap } from "@/components/goodui/heatmap"

const data = bookings.map((b) => ({ date: b.day, value: b.count })) // { date: "2026-10-28", value: 14 }

export function ActivityCard() {
  return <Heatmap title="Bookings per day" data={data} end="2026-11-02" weeks={26} formatValue={(v) => `${v} bookings`} />
}
```

### Busiest hours matrix

```tsx
<Heatmap
  mode="matrix"
  title="Busiest hours"
  rows={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}
  columns={["9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"]}
  values={grid}
  color="var(--chart-4)"
  steps={5}
  labels={{ cell: (label, value) => `${label}:00 — ${value}` }}
/>
```

### Sunday-first weeks

```tsx
<Heatmap data={data} weekStart={0} locale="en-US" />
```

## API

### Heatmap

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| title | `React.ReactNode` | — | Chart name for screen readers. |
| color | `string` | `"var(--chart-1)"` | One hue; intensity is its opacity in `steps` levels. Defaults to the theme's first chart color. |
| mode | `"calendar" \| "matrix"` | `"calendar"` | calendar: weeks as columns, weekdays as rows (needs data). matrix: rows × columns (needs rows, columns, values). |
| data | `HeatmapCell[]` | — | Calendar values by ISO date. Days without an entry count as 0. |
| end | `string` | — | Last day of the calendar (ISO). Defaults to the latest date in data. |
| weeks | `number` | `26` | Weeks shown in calendar mode. |
| weekStart | `0 \| 1` | `1` | First weekday: 1 Monday (default) or 0 Sunday. |
| rows | `string[]` | — | Matrix row labels. |
| columns | `string[]` | — | Matrix column labels. |
| values | `number[][]` | — | Matrix values, values[row][column]. |
| steps | `number` | `4` | Number of intensity levels above zero. |
| scale | `"linear" \| "quantile"` | `"linear"` | linear splits 0..max evenly; quantile gives each level the same number of cells. |
| cellSize | `number` | `12` | Cell size in px (calendar) or minimum cell size (matrix, cells stretch to the width). |
| cellGap | `number` | `3` |  |
| legend | `boolean` | `true` | Less … More scale under the chart. |
| format | `Intl.NumberFormatOptions` | — |  |
| locale | `string` | `"en-US"` |  |
| formatValue | `(value: number) => string` | — |  |
| formatDate | `(date: Date) => string` | — | Formats calendar dates for the tooltip and screen readers. |
| labels | `Partial<HeatmapLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Focuses the heatmap and highlights the latest cell. |
| ArrowLeft / ArrowRight | Previous or next week (calendar) or column (matrix); the calendar scrolls to keep the cell visible. |
| ArrowUp / ArrowDown | Previous or next weekday or row. |
| Home / End | First or last cell. |
| Escape | Clears the highlight. |

## Accessibility

- The chart is role="group" with aria-roledescription="heatmap" and a summary ("Bookings per day: 182 cells, highest 31").
- The highlighted cell is announced through a polite live region as "<date or row · column>: <value>".
- Intensity uses one hue in `steps` opacity levels on both themes; empty days use the muted surface. A Less … More scale explains it.
- The calendar scrolls horizontally inside the card (latest weeks first) instead of overflowing the page.
- Built-in strings (less, more, cell, summary, noData) go through labels; dates format through Intl in `locale` or formatDate.

## Motion

- On first view cells pop in (scale 0.55 → 1 with a fade, 0.45 s, ease [0.2, 0.8, 0.2, 1]) column by column, 14 ms apart, as a pure CSS animation.
- The tooltip follows the pointed or focused cell; the active cell gets a 1.5px foreground outline.
- Reduced motion: cells are visible at once.

## Performance

- Cells are plain SVG rects with a CSS entrance; hover uses one delegated pointermove handler on the SVG instead of a listener per cell. 26 weeks is 182 rects.

## Notes for AI

- Calendar mode needs data (ISO dates, local time); days without an entry count as 0. Set end to pin the last day (defaults to the latest date in data).
- Matrix mode needs rows, columns and values[row][column] (same lengths).
- color is one hue (any CSS color); do not pass several colors, intensity is opacity.
- cellSize is fixed in calendar mode and a minimum in matrix mode, where cells stretch to the container width.

## FAQ

**How are the levels computed?**

linear splits 0..max into `steps` equal bands; quantile puts the same number of non-zero cells in each level. Zero is always its own level.

**Can I show a whole year?**

Yes, weeks={52}; the calendar scrolls horizontally in narrow cards and starts scrolled to the latest week.

## Related

- bar-chart: https://goodui.dev/components/charts/bar-chart
- timeline-chart: https://goodui.dev/components/charts/timeline-chart
- treemap: https://goodui.dev/components/charts/treemap

Last updated: 2026-11-03
