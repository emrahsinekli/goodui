# Waterfall chart

> Running totals as floating bars that step in one after another in success and danger tones, with neutral total bars, connectors, signed value labels and a tooltip with the running total.

Animated waterfall chart for React and shadcn: running totals with green and red steps

Page: https://goodui.dev/components/charts/waterfall-chart

## Install

```bash
npx shadcn@latest add @goodui/waterfall-chart
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/waterfall-chart.json`. The file lands in `components/goodui/waterfall-chart.tsx`.

## When to use

- How a total was reached: opening balance, inflows, outflows, closing balance.
- Price build-ups: list price, discounts, add-ons, tip, paid.
- Variance bridges: last month, plus/minus drivers, this month.

## When not to use

- Categories that do not accumulate: use bar-chart.
- A trend over many periods: use area-chart or line-chart.
- Parts of a whole without order: donut-chart or treemap.

## Pick by what matters

| Need | Use |
| --- | --- |
| Opening and closing totals | start={opening} with a total step first and last |
| No printed numbers | valueLabels={false} (tooltip and table keep them) |
| Brand colors | colors={{ positive, negative, total }} |
| Thicker bars | barSize={36} |

## Usage

```tsx
import { WaterfallChart } from "@/components/goodui/waterfall-chart"

export function CashFlow() {
  return (
    <WaterfallChart
      title="Cash flow"
      start={24000}
      steps={[
        { label: "Opening", value: 0, total: true },
        { label: "Bookings", value: 18400 },
        { label: "Retail", value: 3200 },
        { label: "Payroll", value: -11600 },
        { label: "Rent", value: -4200 },
        { label: "Marketing", value: -1800 },
        { label: "Refunds", value: -900 },
        { label: "Closing", value: 0, total: true },
      ]}
      format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
      formatTick={(v) => `$${Math.round(v / 1000)}k`}
    />
  )
}
```

### Price build-up

```tsx
<WaterfallChart title="Price build-up" start={120} steps={[{ label: "List price", value: 0, total: true }, { label: "Package", value: -12 }, { label: "Add-ons", value: 14 }, { label: "Paid", value: 0, total: true }]} format={usd} barSize={36} />
```

## API

### WaterfallChart

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| steps (required) | `WaterfallStep[]` | — |  |
| start | `number` | `0` | Running total before the first step, e.g. an opening balance that a leading total step then draws. |
| title | `React.ReactNode` | — | Chart name for screen readers and the table caption. |
| height | `number` | `240` | Plot height in px, axes included. |
| barSize | `number` | `28` | Maximum bar thickness in px. |
| radius | `number` | `4` |  |
| connectors | `boolean` | `true` | Hairlines joining each bar's end to the next bar's start. |
| valueLabels | `boolean` | `true` | Signed change above each bar (the total on total bars). |
| colors | `{ positive?: string; negative?: string; total?: string }` | — | Colors for increases, decreases and totals. Default to the kit's success, danger and neutral tones. |
| grid | `boolean` | `true` |  |
| axis | `boolean` | `true` |  |
| axisWidth | `number` | `44` |  |
| format | `Intl.NumberFormatOptions` | — |  |
| locale | `string` | `"en-US"` |  |
| formatValue | `(value: number) => string` | — |  |
| formatTick | `(value: number) => string` | — |  |
| duration | `number` | `0.5` | Seconds a bar takes to grow; bars run one after another at 80 ms. |
| labels | `Partial<WaterfallChartLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Focuses the plot and highlights the first step. |
| ArrowLeft / ArrowRight | Previous or next step. |
| Home / End | First or last step. |
| Escape | Clears the highlight. |

## Accessibility

- The plot is role="group" with aria-roledescription="waterfall chart" and a summary ("Cash flow: from $24,000 to $27,100").
- A screen-reader-only table lists step, signed change and running total.
- The highlighted step is announced as "<step>: +$3,200, total $45,600" through a polite live region.
- Increases, decreases and totals use the kit's success, danger and neutral tones with dark variants, and every bar also carries its signed value label and a connector, so direction is never color-only.

## Motion

- On first view bars grow from their starting level on a spring (stiffness 190, damping 28), one after another 80 ms apart; connectors draw in and labels fade at 50–60% of each bar's turn.
- Data changes morph the bars on the same spring with the same cadence; a container resize re-lays them out instantly.
- Hovering or arrowing to a step shows a highlight band and dims the other bars to 70%.
- Reduced motion: bars, connectors and labels appear at once.

## Performance

- Bars are quadratic-corner path strings sharing one template; one ResizeObserver per chart.

## Notes for AI

- value is the change from the previous step; for total steps value is ignored and the bar draws the running total from zero.
- start sets the running total before the first step (an opening balance). Negative running totals are supported; the zero line is drawn darker.
- When steps are narrower than 54px the signed labels stay on the total bars only (the tooltip and table keep every change); step labels thin out so neighbours never touch, and the last label is always kept.
- format is used for values and ticks; formatTick overrides the axis only.

## FAQ

**Can totals sit in the middle?**

Yes; any step with total: true draws the running total so far, e.g. a subtotal after income before costs.

**Why is the opening bar neutral?**

Totals are facts, not changes; only the steps between them are green or red.

## Related

- bar-chart: https://goodui.dev/components/charts/bar-chart
- funnel-chart: https://goodui.dev/components/charts/funnel-chart
- kpi-trend: https://goodui.dev/components/charts/kpi-trend

Last updated: 2026-11-03
