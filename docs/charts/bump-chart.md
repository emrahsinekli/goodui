# Bump chart

> Rank-over-time lines that draw in with popping dots and names at the line ends; hovering or arrowing through periods and neighbours highlights one item and reads its change.

Animated bump chart for React and shadcn: rank changes over time with highlighted lines

Page: https://goodui.dev/components/charts/bump-chart

## Install

```bash
npx shadcn@latest add @goodui/bump-chart
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/bump-chart.json`. The file lands in `components/goodui/bump-chart.tsx`.

## When to use

- Who is first, second, third over time: most booked services by month, staff by revenue by week, plans by sign-ups.
- Stories about overtaking ("Balayage took the top spot in June") rather than exact values.
- Up to about six items; names sit at the line ends so no legend is needed.

## When not to use

- Exact values matter: use line-chart.
- Many items (10+): lines tangle; show a table with rank deltas instead.
- A single period: a ranked horizontal bar-chart is the right form.

## Pick by what matters

| Need | Use |
| --- | --- |
| Monthly service ranking | series={[{ key, label, ranks }]} periods={months} |
| Tighter rows | rowHeight={34} |
| No #1…#n column | rankLabels={false} |
| Longer names at the end | labelWidth={120} |

## Usage

```tsx
import { BumpChart } from "@/components/goodui/bump-chart"

export function ServiceRanking() {
  return (
    <BumpChart
      title="Most booked services"
      periods={["May", "Jun", "Jul", "Aug", "Sep", "Oct"]}
      series={[
        { key: "balayage", label: "Balayage", ranks: [2, 1, 1, 1, 2, 1] },
        { key: "fade", label: "Skin fade", ranks: [1, 2, 3, 2, 1, 2] },
        { key: "manicure", label: "Gel manicure", ranks: [3, 3, 2, 3, 3, 4] },
        { key: "massage", label: "Deep tissue", ranks: [5, 4, 4, 5, 4, 3] },
        { key: "brows", label: "Brow lamination", ranks: [4, 5, 5, 4, 5, 5] },
      ]}
      rowHeight={40}
      labelWidth={104}
    />
  )
}
```

### Weekly staff leaderboard

```tsx
<BumpChart title="Staff by revenue" periods={weeks} series={staff} rowHeight={34} labelWidth={64} rankLabels={false} />
```

## API

### BumpChart

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| series (required) | `BumpSeries[]` | — |  |
| periods (required) | `string[]` | — |  |
| title | `React.ReactNode` | — | Chart name for screen readers and the table caption. |
| rowHeight | `number` | `36` | Vertical space per rank in px. |
| labelWidth | `number` | `88` | Space reserved for the names at the end side, in px. |
| rankLabels | `boolean` | `true` | "#1 … #n" on the start side. |
| strokeWidth | `number` | `2.5` |  |
| duration | `number` | `1.1` | Seconds one line takes to draw; lines stagger by 0.1 s. |
| labels | `Partial<BumpChartLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Focuses the chart and highlights the first item at the last period. |
| ArrowLeft / ArrowRight | Previous or next period on the same item. |
| ArrowUp / ArrowDown | The item ranked just above or below at that period. |
| Home / End | First or last period. |
| Escape | Clears the highlight. |

## Accessibility

- The chart is role="group" with aria-roledescription="bump chart" and a summary ("Most booked services: rank of 5 items over 6 periods").
- A screen-reader-only table lists each period with every item's rank.
- The highlighted point is announced as "<item>: #2 in Jun, up 1" through a polite live region.
- Names are printed at the line ends, so identity never relies on color; the rank axis is printed on the start side.
- Built-in strings (rank, up, down, same, summary, point, column header, noData) go through labels.

## Motion

- On first view each line draws in from the first period with pathLength over duration (1.1 s, ease [0.65, 0, 0.35, 1]), 0.1 s apart; the dots pop on a spring (stiffness 420, damping 22) as the line reaches them and the names slide in at the end.
- Hovering a line, a dot or arrowing to a point fades the other items to 22% over 0.2 s; the active dot grows by 1.5px.
- Reduced motion: lines, dots and names appear at once.

## Performance

- Each line is one cubic path plus a transparent 16px hit path for easy hovering; dots sit in motion groups translated once per layout.

## Notes for AI

- ranks are 1-based and one per period; the number of rows is the largest rank (at least the number of series).
- Lines are smooth S-curves between periods; there is no value axis, only rank.
- Colors default to --chart-1 … --chart-5 by series order; keep one color per entity across charts.
- The chart sizes its own height (rows × rowHeight + axis); the width follows the parent, with labelWidth reserved for names.

## FAQ

**Can an item be missing in some periods?**

Leave the rank undefined at that index: the line skips the point. Ranks arrays shorter than periods simply end early.

**Can I show values on hover?**

The tooltip shows the rank and the change; attach values to your labels or use line-chart for values.

## Related

- line-chart: https://goodui.dev/components/charts/line-chart
- bar-chart: https://goodui.dev/components/charts/bar-chart
- chart-legend: https://goodui.dev/components/charts/chart-legend

Last updated: 2026-11-03
