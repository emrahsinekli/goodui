# Timeline chart

> Mini Gantt whose bars grow from their start date on view, with progress fills, milestones, group headers, day / week / month ticks, a today marker and arrow-key rows.

Mini Gantt timeline for React and shadcn: bars that grow from their start date, progress, milestones and a today marker

Page: https://goodui.dev/components/charts/timeline-chart

## Install

```bash
npx shadcn@latest add @goodui/timeline-chart
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/timeline-chart.json`. The file lands in `components/goodui/timeline-chart.tsx`.

## When to use

- A plan or roadmap with a handful of tasks: launch plans, sprints, onboarding timelines, campaign calendars.
- Showing progress inside each task bar and where today falls.
- Grouped work (Product / Marketing) with milestones.

## When not to use

- Interactive scheduling (drag to move, dependencies): use a scheduler block.
- Hundreds of rows or many months: a table with dates, or a dedicated Gantt tool.
- Time-of-day bookings: use the scheduler's day view.

## Pick by what matters

| Need | Use |
| --- | --- |
| Launch plan over weeks | rows with group, from/to spanning the plan, today |
| This week's sprint | a 7-day from/to (day ticks) with rowHeight={32} |
| A date with no duration | milestone: true (diamond on start) |
| Progress | progress: 0..1 (prints the percentage when the bar is wide enough) |

## Usage

```tsx
import { TimelineChart } from "@/components/goodui/timeline-chart"

export function LaunchPlan() {
  return (
    <TimelineChart
      title="Launch plan"
      from="2026-10-19"
      to="2026-11-30"
      today="2026-11-03"
      rows={[
        { label: "Booking flow redesign", start: "2026-10-20", end: "2026-11-03", progress: 1, group: "Product" },
        { label: "Deposit payments", start: "2026-10-29", end: "2026-11-12", progress: 0.55, group: "Product" },
        { label: "Launch", start: "2026-11-26", milestone: true, group: "Product" },
        { label: "Landing page", start: "2026-10-26", end: "2026-11-06", progress: 0.8, group: "Marketing" },
      ]}
    />
  )
}
```

### One week, day ticks

```tsx
<TimelineChart title="This week" rows={sprint} from="2026-11-02" to="2026-11-09" today="2026-11-03" rowHeight={32} labelWidth={112} />
```

## API

### TimelineChart

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| rows (required) | `TimelineRow[]` | — |  |
| title | `React.ReactNode` | — | Chart name for screen readers and the table caption. |
| from | `string` | — | First day shown (ISO). Defaults to the earliest start, minus a day. |
| to | `string` | — | Last day shown (ISO). Defaults to the latest end, plus a day. |
| today | `string` | — | ISO date of the today marker. Pass it in (no clock is read during render). |
| rowHeight | `number` | `36` |  |
| labelWidth | `number` | `128` | Width of the label column in px. |
| weekStart | `0 \| 1` | `1` | First weekday for week ticks: 1 Monday (default) or 0 Sunday. |
| locale | `string` | `"en-US"` |  |
| formatDate | `(date: Date) => string` | — | Formats dates for the tooltip and screen readers. |
| duration | `number` | `0.9` | Seconds a bar takes to grow; bars stagger by 60 ms. |
| labels | `Partial<TimelineChartLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Focuses the timeline and highlights the first row. |
| ArrowUp / ArrowDown | Previous or next row (Left/Right work too). |
| Home / End | First or last row. |
| Escape | Clears the highlight. |

## Accessibility

- The timeline is role="group" with aria-roledescription="timeline" and a summary ("Launch plan: 7 rows from Oct 19 to Nov 30").
- A screen-reader-only table lists task, start, end and progress for every row.
- The highlighted row is announced as "<task>: Oct 29 to Nov 12, 15 days, 55%" through a polite live region and shown in a tooltip.
- Labels live in their own column and are never clipped by the bars; progress percentages print inside bars only when they fit.
- The time axis is always left-to-right (dir="ltr" on the track) while labels and headers follow the page direction.

## Motion

- On first view bars scale out from their start date over duration (0.9 s, ease [0.16, 1, 0.3, 1]), 60 ms apart in row order; milestones pop on a spring (stiffness 420, damping 22).
- Hovering or arrowing to a row tints the row with the muted surface.
- Reduced motion: bars and milestones appear at once.

## Performance

- Plain DOM: one positioned div per bar and per tick line; the only animated properties are transform and opacity.

## Notes for AI

- Dates are ISO strings parsed in local time; end is inclusive (a Nov 2 to Nov 4 task spans three days). Pass today explicitly; the component never reads the clock during render.
- from/to default to the data range padded by a day; set them to align several timelines.
- Ticks are days (≤ 3 weeks), week starts (≤ ~4 months) or month starts, thinned until labels have 44px.
- Colors default to --chart-1 … --chart-5 per group; set row.color to override.

## FAQ

**Can bars be dragged?**

No; this is a read-only chart. Use the scheduler block for editing.

**How are the ticks chosen?**

By the span: days up to three weeks, Mondays (or Sundays with weekStart={0}) up to about four months, then the first of each month.

## Related

- heatmap: https://goodui.dev/components/charts/heatmap
- bar-chart: https://goodui.dev/components/charts/bar-chart
- stepper: https://goodui.dev/components/navigation/stepper

Last updated: 2026-11-03
