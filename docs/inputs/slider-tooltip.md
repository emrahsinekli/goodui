# Slider with tooltip

> Single or range slider built from scratch with pointer and keyboard control, step snapping, marks and a value bubble that scales in while dragging.

Range slider with value tooltip for React and shadcn: single or two thumbs, marks, steps

Page: https://goodui.dev/components/inputs/slider-tooltip

## Install

```bash
npx shadcn@latest add @goodui/slider-tooltip
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/slider-tooltip.json`. The file lands in `components/goodui/slider-tooltip.tsx`.

## When to use

- Price or duration filters where a range reads better than two number fields: "$40 to $120", "30 to 90 min".
- Picking a value on a known scale where the exact number matters less than its position: discount %, team size, volume.
- Settings with a few named stops, using marks: Basic, Pro, Team.

## When not to use

- Exact numbers people already know, such as a quantity or an amount: use input.
- Two to four named options with no scale in between: use segmented-control.
- Showing progress that the user does not control: use progress or meter.

## Pick by what matters

| Need | Use |
| --- | --- |
| One value | value={[n]} (a one-item array) |
| A range with two thumbs | value={[from, to]}, plus minStepsBetweenThumbs to keep them apart |
| Bubble only while interacting | tooltip="auto" (default) |
| Value always visible | tooltip="always" (two close bubbles merge into one) |
| No bubble, show the value elsewhere | tooltip="never" |
| Named stops under the track | marks={[{ value, label }]} |

## Usage

```tsx
import * as React from "react"
import { SliderTooltip } from "@/components/goodui/slider-tooltip"

export function PriceFilter() {
  const [price, setPrice] = React.useState([40, 120])

  return (
    <div className="grid gap-4 rounded-xl border bg-card p-5 pt-10">
      <SliderTooltip
        value={price}
        onValueChange={setPrice}
        onValueCommit={(v) => console.log("fetch services between", v)}
        min={0}
        max={200}
        step={5}
        minStepsBetweenThumbs={2}
        formatValue={(v) => "$" + v}
        thumbLabels={["Minimum price", "Maximum price"]}
        marks={[{ value: 0 }, { value: 100 }, { value: 200 }]}
        name="price"
      />
    </div>
  )
}
```

### Single value with steps

```tsx
<SliderTooltip
  aria-label="Session length"
  defaultValue={[60]}
  min={15}
  max={120}
  step={15}
  showSteps
  formatValue={(v) => v + " min"}
/>
```

### Plan picker with named marks

```tsx
<SliderTooltip
  aria-label="Seats"
  defaultValue={[10]}
  min={1}
  max={50}
  tooltip="always"
  formatValue={(v) => v + " seats"}
  marks={[{ value: 1, label: "Solo" }, { value: 10, label: "Team" }, { value: 50, label: "Business" }]}
/>
```

## API

### SliderTooltip

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| value | `number[]` | — | One value for a single thumb, two for a range. |
| defaultValue | `number[]` | — | Initial values when uncontrolled; defaults to [min]. |
| onValueChange | `(value: number[]) => void` | — | Called on every change while dragging or pressing keys, with all thumb values. |
| onValueCommit | `(value: number[]) => void` | — | Fires when a drag ends or a key press changes the value (not when the value stays the same, e.g. at a bound). |
| min | `number` | `0` |  |
| max | `number` | `100` |  |
| step | `number` | `1` |  |
| minStepsBetweenThumbs | `number` | `0` | Minimum gap between range thumbs, in steps. |
| marks | `SliderMark[]` | — | Labelled ticks under the track; a mark without a label shows formatValue(value). |
| showSteps | `boolean` | — | Draw a dot at every step (only when there are 40 steps or fewer). |
| formatValue | `(value: number) => string` | `(v) => String(v)` | Formats the bubble, mark labels and aria-valuetext, e.g. (v) => `$${v}`. |
| tooltip | `"auto" \| "always" \| "never"` | `"auto"` | "auto" shows the bubble while dragging, hovering or keyboard-focused. |
| thumbLabels | `string[]` | — | Accessible names per thumb, e.g. ["Minimum price", "Maximum price"]. |
| disabled | `boolean` | — |  |
| name | `string` | — | Form field name; one hidden input per thumb. |
| labels | `Partial<SliderTooltipLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Arrow Right / Arrow Up | Increases the focused thumb by one step (Arrow Left increases under dir="rtl"). |
| Arrow Left / Arrow Down | Decreases the focused thumb by one step (Arrow Right decreases under dir="rtl"). |
| Page Up / Page Down | Moves by a tenth of the range (or one step, whichever is larger). |
| Home / End | Moves to min / max, or as far as the other thumb allows in a range. |
| Tab | Moves between thumbs; keyboard focus shows the value bubble in auto mode. |

## Accessibility

- Each thumb is a focusable element with role="slider", aria-valuemin, aria-valuemax, aria-valuenow and aria-valuetext from formatValue.
- Range thumbs are named by thumbLabels, or labels.minimum / labels.maximum ("Minimum" and "Maximum") by default; a single thumb takes thumbLabels[0], the root aria-label or aria-labelledby, and falls back to labels.value ("Value").
- The root is role="group" and carries aria-label too.
- The value bubble and marks are aria-hidden; screen readers get the value from aria-valuetext.
- Clicking the track moves the nearest thumb and focuses it, so arrow keys continue from there.

## Motion

- The bubble scales in from 0.95 on the ui spring and leaves in 100 ms; its digits roll as the value changes. Dragged past an end, the bar stretches elastically and springs back on release.
- The dragged thumb grows to 1.18 on a spring; the thumbs themselves follow the pointer directly, with no lag.
- Reduced motion: the bubble only fades (100 ms) and the dragged thumb does not grow.

## Performance

- Dragging uses pointer capture on the track, so moves outside the slider keep working without window listeners.

## Notes for AI

- value and defaultValue are arrays: [n] for one thumb, [from, to] for a range. Passing a plain number is a type error.
- Use onValueChange for live UI and onValueCommit to fetch or save; commit fires when a drag ends or a key press actually changes the value (not at a bound).
- Built-in thumb names come from the labels prop (minimum, maximum, value); pass translations there.
- Thumbs cannot cross; minStepsBetweenThumbs is counted in steps, not in value units.
- With name, a range submits name[] twice (one per thumb); a single thumb submits name.
- Leave padding above the slider unless tooltip is "never": the bubble is positioned above the track and can overlap content there.

## FAQ

**How do I format the value as currency?**

Pass formatValue, e.g. (v) => "$" + v or an Intl.NumberFormat. It is used for the bubble, unlabelled marks and aria-valuetext.

**Does it support vertical sliders?**

No. It is horizontal only (aria-orientation="horizontal").

**Does it work right-to-left?**

Yes. Under dir="rtl" the track fills from the right, marks and bubbles mirror, dragging maps from the right edge, and Arrow Left increases.

## Related

- input: https://goodui.dev/components/core/input
- segmented-control: https://goodui.dev/components/navigation/segmented-control
- meter: https://goodui.dev/components/numbers/meter
- progress: https://goodui.dev/components/numbers/progress

Last updated: 2026-11-02
