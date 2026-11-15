# Circular progress

> SVG ring or 270° gauge whose arc springs to the value via stroke-dashoffset, with a rolling percentage or custom label in the center.

Circular progress ring and gauge for React and shadcn with an animated percentage

Page: https://goodui.dev/components/numbers/circular-progress

## Install

```bash
npx shadcn@latest add @goodui/circular-progress
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/circular-progress.json`. The file lands in `components/goodui/circular-progress.tsx`.

## When to use

- A single percentage that deserves a visual: goal reached, utilization, profile completion.
- Revenue or target gauges on a dashboard (variant="gauge") with your own center label.
- Small per-row indicators, such as each staff member's schedule load at 44px.

## When not to use

- Quota with a used / limit readout and warnings: use meter.
- Long task progress in a form or dialog: use progress, a linear bar reads more precisely.
- Comparing several values against each other: use a bar chart; rings are hard to compare.

## Pick by what matters

| Need | Use |
| --- | --- |
| Plain percentage | variant="ring" (default) with value |
| Speedometer-style goal | variant="gauge" with max={goal} |
| Money or other units in the center | label={<NumberFlow … />} plus your own aria-valuetext |
| Tiny inline ring | size={44} strokeWidth={4} label={null} |
| Color by status | indicatorClassName="text-emerald-500" (the arc uses currentColor) |

## Usage

```tsx
import { CircularProgress } from "@/components/goodui/circular-progress"
import { NumberFlow } from "@/components/goodui/number-flow"

export function RevenueGoal({ revenue, goal }: { revenue: number; goal: number }) {
  return (
    <CircularProgress
      variant="gauge"
      value={revenue}
      max={goal}
      size={152}
      strokeWidth={12}
      indicatorClassName="text-[var(--chart-2)]"
      aria-label="November revenue goal"
      aria-valuetext={`${revenue} of ${goal} dollars`}
      label={
        <NumberFlow
          value={revenue}
          format={{ style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }}
          className="font-semibold tracking-tight"
        />
      }
      sublabel="of $25k goal"
    />
  )
}
```

### Utilization ring with rolling percentage

```tsx
<CircularProgress value={72} size={136} sublabel="booked" aria-label="Chair utilization this week" />
```

### Per-row load indicator

```tsx
<CircularProgress
  value={member.load}
  size={44}
  strokeWidth={4}
  indicatorClassName={member.load >= 90 ? "text-rose-500" : member.load >= 75 ? "text-amber-500" : "text-emerald-500"}
  aria-label={`${member.name} schedule load`}
/>
```

## API

### CircularProgress

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| value (required) | `number` | — | Current value on the 0 to max scale; the arc springs to it. |
| aria-label | `string` | `"Progress"` | Defines a string value that labels the current element. Accessible name for the progress bar. |
| max | `number` | `100` | Value that fills the whole ring or gauge. |
| size | `number` | `120` | Diameter in px. |
| strokeWidth | `number` | — | Ring thickness in px. Defaults to 9% of the size. |
| variant | `"ring" \| "gauge"` | `"ring"` | "ring" is a full circle, "gauge" is a 270° arc open at the bottom. |
| label | `React.ReactNode` | — | Center content. Defaults to the rolling percentage. Pass null to hide it. |
| sublabel | `React.ReactNode` | — | Small line under the center label. |
| indicatorClassName | `string` | — | Classes for the arc; it is drawn with currentColor, e.g. "text-emerald-500". |
| trackClassName | `string` | — | Classes for the track; drawn with currentColor. |

Also accepts every <div> attribute.

## Accessibility

- The root is role="progressbar" with aria-valuemin 0, aria-valuemax max, aria-valuenow and aria-valuetext as a rounded percent.
- aria-label defaults to "Progress"; pass a specific one ("Chair utilization this week").
- The SVG and the center label are aria-hidden. When the label shows something other than a percent, pass your own aria-valuetext; it overrides the default.

## Motion

- On mount the arc springs from empty to the value via stroke-dashoffset (stiffness 70, damping 18, mass 1), and again on every change.
- The default center label is number-flow, so the percentage digits roll with the arc.
- At 0 the arc fades out in 150 ms, because a round cap would still paint a dot.
- Reduced motion: the arc and digits jump to the value with duration 0.

## Notes for AI

- value is on the 0 to max scale (default max 100); for a goal pass max={goal} instead of computing a percent.
- Color the arc with a text-* class in indicatorClassName and the track with trackClassName; the stroke uses currentColor, so bg-* does nothing.
- label={null} hides the center; leaving label undefined shows the rolling percentage.
- size is a number in px, not a Tailwind class; strokeWidth defaults to 9% of size (at least 3).
- With a custom label, also pass aria-valuetext so screen readers hear the same thing.

## FAQ

**Where does the gauge's gap go?**

The gauge is a 270° arc that starts at 7:30 and ends at 4:30, so the open part is at the bottom. The center label is nudged down slightly to sit in the middle of the arc.

**How big is the center text?**

It scales with size: 20% of the diameter for the label (at least 11px) and 9% for the sublabel (at least 10px).

## Related

- progress: https://goodui.dev/components/numbers/progress
- meter: https://goodui.dev/components/numbers/meter
- number-flow: https://goodui.dev/components/numbers/number-flow
- stat-card: https://goodui.dev/components/core/stat-card

Last updated: 2026-11-02
