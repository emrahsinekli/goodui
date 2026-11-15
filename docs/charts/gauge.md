# Gauge

> Semi-circular gauge with Core-tone bands whose needle springs to the value with a small overshoot (or an arc that fills), a rolling readout and a band label pill, exposed as a meter.

Animated gauge for React and shadcn: semi-circular dial with tone bands and a spring needle

Page: https://goodui.dev/components/charts/gauge

## Install

```bash
npx shadcn@latest add @goodui/gauge
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/gauge.json`. The file lands in `components/goodui/gauge.tsx`.

## When to use

- One value that lives inside ranges with meaning: no-show rate (healthy / watch / critical), chair utilization, NPS.
- Dashboards where the reading should be felt as well as read: the needle swings and settles.
- A score between a min and a max that is not 0..100 (rating 1..5).

## When not to use

- Plain progress toward a goal: use radial-progress or meter.
- Several values side by side: a row of bars compares better than a row of dials.
- Values without ranges: a stat tile with a delta is clearer (kpi-trend).

## Pick by what matters

| Need | Use |
| --- | --- |
| Status ranges | bands with tone: success / warning / danger / info / neutral / primary and a label |
| Filled arc instead of a needle | variant="arc" (fills in the current band's color over a thin band ring) |
| Plain progress look | no bands, variant="arc", color |
| Percent values | formatValue={(v) => `${v}%`} |

## Usage

```tsx
import { Gauge } from "@/components/goodui/gauge"

export function NoShowGauge({ rate }: { rate: number }) {
  return (
    <Gauge
      value={rate}
      min={0}
      max={20}
      label="No-show rate"
      bands={[
        { from: 0, to: 5, tone: "success", label: "Healthy" },
        { from: 5, to: 10, tone: "warning", label: "Watch" },
        { from: 10, to: 20, tone: "danger", label: "Critical" },
      ]}
      formatValue={(v) => `${v}%`}
    />
  )
}
```

### Filled arc, utilization

```tsx
<Gauge value={82} variant="arc" label="Chair utilization" bands={utilizationBands} formatValue={(v) => `${v}%`} />
```

### Rating 1..5, no bands

```tsx
<Gauge value={4.6} min={1} max={5} variant="arc" color="var(--chart-2)" label="Average rating" thickness={10} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
```

## API

### Gauge

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| value (required) | `number` | — |  |
| color | `string` | — | Color of the needle (needle) or of the arc when no band covers the value (arc). |
| min | `number` | `0` |  |
| max | `number` | `100` |  |
| bands | `GaugeBand[]` | `[]` | Colored ranges along the arc, e.g. healthy / watch / critical. Drawn with 2px gaps. |
| variant | `"needle" \| "arc"` | `"needle"` | needle: a needle springs to the value over the bands. arc: the arc fills to the value in the band's color. |
| size | `number` | `240` | Width in px; the gauge is half as tall plus the readout. |
| thickness | `number` | `14` | Arc thickness in px. |
| label | `React.ReactNode` | — | Metric name under the value; also the accessible name when it is a string. |
| showRange | `boolean` | `true` | Min and max printed under the arc ends. |
| format | `Intl.NumberFormatOptions` | — | Intl.NumberFormat options for the value, e.g. { style: "percent" } with values 0..1. |
| locale | `string` | `"en-US"` |  |
| formatValue | `(value: number) => string` | — |  |
| labels | `Partial<GaugeLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Accessibility

- The root is role="meter" with aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext ("6.4%, Watch"); the accessible name is the string label or labels.name.
- Value changes are announced through a polite live region with the same text.
- The current band is shown as a pill with its label and a color dot under the value, so the status is never color-only.
- Band tones use the kit's Core tone colors with dark-mode variants; pass color on a band to override.

## Motion

- On first view the needle springs from the minimum to the value (stiffness 70, damping 11, mass 0.9), overshooting slightly before it settles; the arc variant fills on the same spring. The readout rolls with NumberFlow.
- New values re-spring from the current angle.
- Reduced motion: the needle and readout jump to the value.

## Performance

- The spring runs as a motion value; React re-renders with the rounded angle, which is cheap for an SVG of a dozen elements.

## Notes for AI

- Bands are [from, to] in value units and should tile the range from min to max without gaps; gaps between bands are drawn automatically (2px).
- variant="needle" highlights the band the value is in and dims the others; variant="arc" draws the bands as a thin outer ring and fills the inner arc.
- Give a string label so the meter has an accessible name; otherwise set labels.name.
- size is the width in px; the SVG is half as tall plus the min/max line.

## FAQ

**Can the needle go past max?**

The angle is clamped to the dial; the readout and aria-valuenow show the real value.

**Why does the needle wobble before stopping?**

That is the spring (damping 11). It is intentional and off under reduced motion.

## Related

- radial-progress: https://goodui.dev/components/charts/radial-progress
- circular-progress: https://goodui.dev/components/numbers/circular-progress
- meter: https://goodui.dev/components/numbers/meter
- kpi-trend: https://goodui.dev/components/charts/kpi-trend

Last updated: 2026-11-03
