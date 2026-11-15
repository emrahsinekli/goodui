# Funnel chart

> Funnel whose stage bars grow open one after another on an ordinal ramp, with drop-off chips between stages, conversion from the first stage beside each value, and arrow-key rows.

Animated funnel chart for React and shadcn: stages with drop-off percentages and conversion

Page: https://goodui.dev/components/charts/funnel-chart

## Install

```bash
npx shadcn@latest add @goodui/funnel-chart
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/funnel-chart.json`. The file lands in `components/goodui/funnel-chart.tsx`.

## When to use

- Sequential steps where each loses people: visited → picked a slot → paid.
- Onboarding or trial flows where the drop-off between two specific steps is the story.
- Reports where the conversion from the first step should be printed, not hovered for.

## When not to use

- Steps that are not ordered or do not lose volume: use bar-chart.
- A single conversion rate: a stat tile (kpi-trend) says it better.
- Flows with branches: a funnel is linear by definition.

## Pick by what matters

| Need | Use |
| --- | --- |
| Classic centered funnel | align="center" (default) |
| Ranked-list feel with long labels | align="start" labelWidth={140} |
| Only the numbers | showDropOff={false} showConversion={false} |
| Brand hue | color="var(--chart-2)" (the ramp derives from it) |

## Usage

```tsx
import { FunnelChart } from "@/components/goodui/funnel-chart"

export function BookingFunnel() {
  return (
    <FunnelChart
      title="Booking funnel"
      stages={[
        { label: "Visited", value: 12400 },
        { label: "Viewed services", value: 8100 },
        { label: "Picked a slot", value: 3900 },
        { label: "Entered details", value: 2600 },
        { label: "Paid deposit", value: 2150 },
      ]}
    />
  )
}
```

### Start-aligned, green ramp

```tsx
<FunnelChart title="Trial to paid" stages={trial} align="start" color="var(--chart-2)" labelWidth={136} />
```

### Translated chips

```tsx
<FunnelChart stages={stages} locale="de-DE" labels={{ dropOff: (p) => `−${p}`, conversion: (p, first) => `${p} von ${first}` }} />
```

## API

### FunnelChart

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| stages (required) | `FunnelStage[]` | — |  |
| title | `React.ReactNode` | — | Chart name for screen readers and the table caption. |
| color | `string` | `"var(--chart-1)"` | Base hue of the ordinal ramp (first stage full, later stages lighter). |
| align | `"center" \| "start"` | `"center"` | center: symmetric funnel. start: bars aligned to the start side, like a ranked list. |
| showDropOff | `boolean` | `true` | "−38%" chips between stages. |
| showConversion | `boolean` | `true` | Share of the first stage beside each value. |
| labelWidth | `number` | `112` | Width of the label column in px. |
| rowHeight | `number` | `40` |  |
| format | `Intl.NumberFormatOptions` | — |  |
| locale | `string` | `"en-US"` |  |
| formatValue | `(value: number) => string` | — |  |
| duration | `number` | `0.8` | Seconds the first bar takes to grow; each next one starts 0.08 s later. |
| labels | `Partial<FunnelChartLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Focuses the funnel and highlights the first stage. |
| ArrowUp / ArrowDown | Moves the highlight one stage (Left/Right work too). |
| Home / End | First or last stage. |
| Escape | Clears the highlight. |

## Accessibility

- The funnel is role="group" with aria-roledescription="funnel chart" and a summary ("Booking funnel: from 12,400 to 2,150, 17% overall").
- A screen-reader-only table lists stage, value and conversion from the first stage.
- The highlighted stage is announced with its value, conversion and the drop-off from the previous stage.
- Values and conversion percentages are printed beside every row, so no reading depends on hover or color.
- Stage colors are an ordinal ramp of one hue (first stage full, later stages lighter), so order reads in the color too.

## Motion

- On first view bars scale open from the center (or the start side) over duration (0.8 s, ease [0.16, 1, 0.3, 1]), each stage 80 ms after the previous; the values fade in at 40% and the drop-off chips pop in on a spring (stiffness 420, damping 22) at 55%.
- Hovering a row tints it with the muted surface and dims the other bars to 55%.
- Reduced motion: everything appears at once.

## Performance

- Plain DOM rows; the only animated properties are transform and opacity.

## Notes for AI

- stages are in order; the first stage is the 100% reference and bar widths are relative to it.
- Drop-off chips compare each stage with the previous one; conversion compares with the first.
- Labels truncate in a fixed labelWidth column; raise it for long stage names.
- Colors come from the ordinal ramp unless stage.color is set; do not color stages by arbitrary hues.

## FAQ

**Can a later stage be larger than an earlier one?**

Yes; its bar is clipped to the width of the first stage and the drop-off chip shows −0%.

**Does it support horizontal funnels?**

No; rows read better with long labels and on phones. Use bar-chart for a horizontal layout.

## Related

- bar-chart: https://goodui.dev/components/charts/bar-chart
- kpi-trend: https://goodui.dev/components/charts/kpi-trend
- waterfall-chart: https://goodui.dev/components/charts/waterfall-chart

Last updated: 2026-11-03
