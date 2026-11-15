# Sparkline draw

> Smooth monotone sparkline that draws itself in, fades in a gradient area, shows point values on hover or arrow keys, and redraws when the data changes.

Animated sparkline for React and shadcn: self-drawing line chart with hover tooltip

Page: https://goodui.dev/components/numbers/sparkline-draw

## Install

```bash
npx shadcn@latest add @goodui/sparkline-draw
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/sparkline-draw.json`. The file lands in `components/goodui/sparkline-draw.tsx`.

## When to use

- A trend under a KPI: revenue, bookings or no-show rate over the last 14 days.
- Dashboards where each card needs a small chart without pulling in a chart library.
- Compact trends where hovering or arrowing to a point should show its date and value.

## When not to use

- A full chart with axes, gridlines or several series: use a charting library (shadcn chart / Recharts).
- A single current value against a limit: use meter or circular-progress.
- Just the change between two periods: use delta-badge.

## Pick by what matters

| Need | Use |
| --- | --- |
| Default dashboard trend | curve="smooth" area tooltip endDot (all defaults) |
| Exact values matter more than looks | curve="linear" |
| Decorative, non-interactive | tooltip={false} (also removes it from the tab order) |
| Negative metric in red | color="#f43f5e" or any CSS color |
| Plain line only | area={false} endDot={false} |

## Usage

```tsx
import { SparklineDraw } from "@/components/goodui/sparkline-draw"

const days = ["Oct 26", "Oct 27", "Oct 28", "Oct 29", "Oct 30", "Oct 31", "Nov 1"]
const revenue = [2240, 2610, 2380, 2950, 3080, 3460, 3720]
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

export function RevenueCard() {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs text-muted-foreground">Revenue</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{usd.format(3720)}</div>
      <SparklineDraw
        data={revenue}
        pointLabels={days}
        formatValue={(v) => usd.format(v)}
        height={56}
        className="mt-3"
        aria-label="Revenue, last 7 days"
      />
    </div>
  )
}
```

### No-show rate in rose, straight segments

```tsx
<SparklineDraw
  data={[6.2, 5.8, 6.4, 5.1, 4.9, 4.4, 3.9, 3.1]}
  color="#f43f5e"
  curve="linear"
  formatValue={(v) => `${v}%`}
/>
```

### Translated screen reader text

```tsx
<SparklineDraw
  data={bookings}
  labels={{
    point: (n) => `Punkt ${n}`,
    summary: (first, last, low, high) => `Verlauf von ${first} bis ${last}, Minimum ${low}, Maximum ${high}`,
    noData: "Keine Daten",
  }}
/>
```

## API

### SparklineDraw

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| data (required) | `number[]` | — | Values in order, oldest first. The line scales between their min and max; changed values redraw the line. |
| color | `string` | `"var(--chart-1)"` | Any CSS color. Defaults to the theme's first chart color. |
| pointLabels | `string[]` | — | One label per point, shown in the tooltip (e.g. dates). |
| height | `number` | `48` | Height in px. The width follows the container. |
| strokeWidth | `number` | `2` | Line thickness in px; the end dot and padding grow with it. |
| area | `boolean` | `true` | Gradient fill under the line. |
| curve | `"smooth" \| "linear"` | `"smooth"` | smooth: monotone curve that never overshoots the data. linear: straight segments. |
| tooltip | `boolean` | `true` | Show the hovered point's value. Arrow keys move it when focused. |
| endDot | `boolean` | `true` | Pulsing dot on the latest point. |
| duration | `number` | `0.9` | Seconds the line takes to draw. |
| formatValue | `(value: number, index: number) => string` | — | Formats values for the tooltip and screen readers. index is -1 for the low and high in the summary. |
| labels | `Partial<SparklineDrawLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Focuses the sparkline (only when tooltip is on) and shows the latest point. |
| ArrowLeft / ArrowRight | Moves the highlighted point one step. |
| Home / End | Jumps to the first or last point. |
| Escape | Hides the highlight and tooltip. |

## Accessibility

- The root is role="group" with aria-roledescription="sparkline" and an aria-label summary built from the data ("Trend from $2,240 to $3,720, low …, high …"); your aria-label replaces it.
- The highlighted point is announced through a polite live region as "<point label>: <value>", falling back to "Point n".
- All built-in text goes through labels (point, summary, noData) for translation; per-point names come from pointLabels.
- The SVG is aria-hidden; the focus ring is the focus-visible ring token.

## Motion

- The line draws in with pathLength over duration (default 0.9 s) on ease [0.65, 0, 0.35, 1]. The gradient area fades in over 0.6 s starting at 45% of that, and the end dot appears at 90%.
- The end dot sends out a ring every 2 s (scale to 2.6 while fading).
- The hover crosshair and point follow the pointer on a stiff spring (stiffness 600, damping 40).
- New values remount the paths so the line draws again; a container resize only reshapes it.
- Reduced motion: the line, area and dot appear at once, the ring is hidden and the crosshair snaps.

## Performance

- One ResizeObserver per sparkline keeps the SVG at the container width; there are no timers, and the ring is a CSS animation.

## Notes for AI

- Per-point names (dates) go in pointLabels, not labels; labels is only for translating built-in screen reader text.
- pointLabels must be the same length and order as data.
- Pass an aria-label that names the metric and period ("Revenue, last 14 days"); the auto summary does not know what the numbers are.
- Width follows the parent; set height in px through the height prop, not a Tailwind h-* class.
- color takes any CSS color or variable (default var(--chart-1)); do not pass a Tailwind class.

## FAQ

**Does the smooth curve invent peaks?**

No. It uses monotone cubic interpolation (Fritsch–Carlson), so the curve never goes above a peak or below a dip in your data.

**What does it render on the server?**

An SVG at a 240px width that is replaced by the measured container width after mount.

**Does it redraw on every re-render?**

No. It redraws only when the values change, because the paths are keyed by the joined data.

## Related

- delta-badge: https://goodui.dev/components/numbers/delta-badge
- stat-card: https://goodui.dev/components/core/stat-card
- counter-up: https://goodui.dev/components/numbers/counter-up
- number-flow: https://goodui.dev/components/numbers/number-flow

Last updated: 2026-11-02
