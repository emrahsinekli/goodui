# Radial progress

> Activity-style concentric goal rings that fill from 12 o'clock on view, spring to new values, dim the others when one is pointed at, and roll the center percentage.

Activity-style progress rings for React and shadcn: concentric goal rings that fill on view

Page: https://goodui.dev/components/charts/radial-progress

## Install

```bash
npx shadcn@latest add @goodui/radial-progress
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/radial-progress.json`. The file lands in `components/goodui/radial-progress.tsx`.

## When to use

- A few goals at a glance: bookings, revenue and reviews against today's targets.
- One goal ring with a rolling percentage in the middle (monthly target, utilization).
- Values that update live (a new booking lands): rings spring to the new fill.

## When not to use

- Shares of a whole: use donut-chart.
- A value inside bands (healthy / watch / critical): use gauge.
- A long list of goals: rings stop being readable past four; use meter rows.

## Pick by what matters

| Need | Use |
| --- | --- |
| Three goals, activity style | rings={[outer, middle, inner]} with legend="end" |
| Single goal, number in the middle | rings={[one]} legend="none" |
| Money on one ring, counts on another | ring.formatValue per ring |
| Your own center content | center={<Icon />} or center={null} |

## Usage

```tsx
import { RadialProgress } from "@/components/goodui/radial-progress"

export function TodayGoals() {
  return (
    <RadialProgress
      title="Today"
      size={180}
      thickness={14}
      rings={[
        { label: "Bookings", value: 29, max: 40 },
        { label: "Revenue", value: 2140, max: 3000, formatValue: (v, max) => `$${v} / $${max}` },
        { label: "Reviews", value: 6, max: 10 },
      ]}
    />
  )
}
```

### Single goal ring

```tsx
<RadialProgress rings={[{ label: "Monthly target", value: 78, color: "var(--chart-2)" }]} size={112} thickness={10} legend="none" />
```

### Translated

```tsx
<RadialProgress rings={rings} locale="de-DE" labels={{ legend: "Ziele", ring: (label, value, max, pct) => `${label}: ${value} von ${max}, ${pct}` }} />
```

## API

### RadialProgress

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| rings (required) | `RadialRing[]` | — | Rings from the outside in. One ring makes a goal ring; several make activity-style concentric rings. |
| title | `React.ReactNode` | — | Name under the center number, used by screen readers too. |
| size | `number` | `160` | Diameter in px. |
| thickness | `number` | `12` | Ring thickness in px. |
| gap | `number` | `4` | Space between rings in px. |
| center | `React.ReactNode` | — | Replaces the rolling percentage in the middle. Pass null to leave the center empty. |
| legend | `"end" \| "bottom" \| "none"` | `"end"` | Legend placement with each ring's value. |
| format | `Intl.NumberFormatOptions` | — | Intl.NumberFormat options for the values. |
| locale | `string` | `"en-US"` |  |
| formatValue | `(value: number, max: number) => string` | — | Formats "value / max" for the legend and screen readers. |
| duration | `number` | `1.2` | Seconds the first ring takes to fill; inner rings start 0.12 s later each. |
| labels | `Partial<RadialProgressLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Focuses the rings. |
| Arrow keys | Cycles the active ring; the center shows its percentage and label. |
| Escape | Clears the active ring. |

## Accessibility

- The rings are role="group" with aria-roledescription="progress rings" and a summary that reads every ring ("Bookings: 29 of 40, 73%; …").
- The active ring is announced through a polite live region.
- The legend lists label and value / max for each ring in text, so nothing depends on color.
- Built-in strings (ring, summary, legend) go through labels; per-ring money formatting goes through ring.formatValue.

## Motion

- On first view each ring fills from 12 o'clock over duration (1.2 s, ease [0.16, 1, 0.3, 1]), inner rings starting 0.12 s after the one outside them; the center percentage rolls up with NumberFlow.
- Later value changes spring to the new fill (stiffness 120, damping 24).
- Hovering a ring or its legend row dims the others to 35% (track to 50%) over 0.2 s.
- Reduced motion: rings appear filled, changes are instant.

## Performance

- Rings are stroked circles with pathLength normalization; no per-frame geometry.

## Notes for AI

- rings are listed from the outside in; max defaults to 100. Values above max fill the ring completely (no lap-over).
- Colors default to --chart-1 … --chart-5 by ring order.
- size and thickness are px; with many rings keep thickness × rings well under size / 2 or the center disappears.
- center={null} removes the center readout; center={<node>} replaces it.

## FAQ

**Can a ring go past 100%?**

It fills completely; the legend still shows the real value (e.g. 46 / 40). A lap-over effect is not drawn.

**How do I show an icon instead of the percentage?**

Pass center={<Flame className="size-6" />}.

## Related

- circular-progress: https://goodui.dev/components/numbers/circular-progress
- donut-chart: https://goodui.dev/components/charts/donut-chart
- gauge: https://goodui.dev/components/charts/gauge
- meter: https://goodui.dev/components/numbers/meter

Last updated: 2026-11-03
