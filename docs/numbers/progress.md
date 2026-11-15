# Progress

> Linear progress in four variants: spring-filled determinate, indeterminate double sweep, moving stripes and segmented steps.

Animated progress bar for React and shadcn: determinate, indeterminate, striped and steps

Page: https://goodui.dev/components/numbers/progress

## Install

```bash
npx shadcn@latest add @goodui/progress
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/progress.json`. The file lands in `components/goodui/progress.tsx`.

## When to use

- Uploads, imports and exports where you know how far along the work is.
- Background work of unknown length ("Syncing Google Calendar…"): the indeterminate variant.
- Onboarding or setup flows where a few equal steps should read as segments.

## When not to use

- Quota or plan usage that never finishes: use meter, which warns near the limit.
- A named, clickable list of steps the user moves through: use stepper.
- Short waits under a second or loading a whole panel: use spinners or skeleton-auto.

## Pick by what matters

| Need | Use |
| --- | --- |
| Known progress (upload, import) | variant="determinate" with value and max |
| Unknown duration | variant="indeterminate" (value is ignored) |
| Long job that should look busy while it moves | variant="striped" |
| A handful of equal steps | variant="steps" steps={n} max={n} value={finished} |
| Thin bar in a header or card | size="sm" |

## Usage

```tsx
import { Progress } from "@/components/goodui/progress"

export function ImportStatus({ imported, total }: { imported: number; total: number }) {
  return (
    <div className="flex flex-col gap-5 rounded-xl border bg-card p-5">
      <Progress label="Uploading client-photos.zip" value={64} showValue />
      <Progress
        variant="striped"
        label={`Importing clients · ${imported.toLocaleString()} of ${total.toLocaleString()}`}
        value={imported}
        max={total}
        showValue
        size="lg"
        indicatorClassName="bg-emerald-500"
      />
    </div>
  )
}
```

### Unknown duration, then done

```tsx
<Progress
  variant={syncing ? "indeterminate" : "determinate"}
  value={100}
  label={syncing ? "Syncing Google Calendar…" : "Calendar synced"}
  size="sm"
  indicatorClassName="bg-sky-500"
/>
```

### Onboarding steps

```tsx
const steps = ["Business details", "Services and prices", "Opening hours", "Invite your team", "Go live"]

<Progress variant="steps" steps={steps.length} max={steps.length} value={finished} label="Studio setup" showValue />
```

## API

### Progress

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| value | `number` | `0` | Current value, 0 to max. Ignored by the indeterminate variant. |
| max | `number` | `100` | Value that counts as complete. For steps, set it to the step count so value is the number of finished steps. |
| variant | `"determinate" \| "indeterminate" \| "striped" \| "steps"` | `"determinate"` | determinate: spring fill. indeterminate: looping sweep for unknown duration. striped: fill with moving stripes. steps: one segment per step. |
| steps | `number` | `4` | Number of segments for the steps variant. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Bar height: sm 4px, md 8px, lg 12px. |
| label | `React.ReactNode` | — | Optional label above the bar. |
| showValue | `boolean` | `false` | Show the percentage (or "step x of n") next to the label. |
| indicatorClassName | `string` | — | Classes for the filled part, e.g. "bg-emerald-500". |
| labels | `Partial<ProgressLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Accessibility

- Renders role="progressbar" with aria-valuemin, aria-valuemax, aria-valuenow and aria-valuetext ("64%" or "Step 3 of 5").
- With a label, the bar is named by it through aria-labelledby; without one it gets aria-label="Progress". Both built-in strings go through labels (progress, stepOf).
- The indeterminate variant drops the value attributes and sets aria-busy="true".

## Motion

- Determinate, striped and each step segment translate the fill on a spring (stiffness 110, damping 22, mass 0.8); at 0 the fill fades out after 300 ms.
- Indeterminate: two bars sweep across on a 1.6 s CSS loop, the second starting 0.8 s later.
- Striped: the stripes slide on a 0.8 s linear loop while the fill springs to the value.
- Reduced motion: fills jump with duration 0, stripes stop moving, and the indeterminate sweep becomes a static full-width bar at 45% opacity.

## Performance

- Only transform and opacity animate. The indeterminate and striped loops are CSS keyframes, so no JavaScript runs per frame.

## Notes for AI

- value is on the 0 to max scale (default max 100), not 0 to 1.
- For steps, pass steps and max as the same number and value as the count of finished steps; value 2 of 5 reads "Step 3 of 5".
- Color the fill with indicatorClassName ("bg-emerald-500"), not className, which goes on the wrapper.
- showValue is ignored by the indeterminate variant; value is ignored too.
- labels={{ progress: "Fortschritt", stepOf: (s, n) => `Schritt ${s} von ${n}` }} translates the fallback name and the steps text. Under RTL the track is mirrored, so bars fill from the right.

## FAQ

**How do I switch from indeterminate to a real value?**

Change variant from "indeterminate" to "determinate" and pass value; the fill springs in from the start of the track.

**Do the step segments fill one after another?**

Each segment springs on its own share of the value at the same time. When value goes up by one step, only that segment fills, so stepping through looks sequential.

## Related

- meter: https://goodui.dev/components/numbers/meter
- circular-progress: https://goodui.dev/components/numbers/circular-progress
- stepper: https://goodui.dev/components/navigation/stepper
- multi-step-loader: https://goodui.dev/components/feedback/multi-step-loader

Last updated: 2026-11-02
