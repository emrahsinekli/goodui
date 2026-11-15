# Drawn checkbox

> Checkbox whose check stroke draws itself in over a popping fill, with an indeterminate dash and an animated strike-through for checklists.

Animated checkbox for React and shadcn: drawn check, indeterminate dash, strike-through

Page: https://goodui.dev/components/inputs/checkbox-draw

## Install

```bash
npx shadcn@latest add @goodui/checkbox-draw
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/checkbox-draw.json`. The file lands in `components/goodui/checkbox-draw.tsx`.

## When to use

- Checklists and to-dos where ticking an item should feel done: onboarding steps, job checklists, launch tasks.
- A "select all" box above a list that shows a dash when only some items are selected.
- Consent and opt-in boxes in forms, with a label and helper text.

## When not to use

- A setting that applies immediately: use switch-spring.
- Picking one option out of several: use segmented-control.
- Plain form checkboxes where you want no motion at all: use checkbox.

## Pick by what matters

| Need | Use |
| --- | --- |
| Dense tables and row selection | size="sm" |
| Forms and settings | size="md" (default) with label and description |
| To-do lists | label plus strikethrough |
| Select all with partial selection | checked="indeterminate" when some, but not all, are selected |

## Usage

```tsx
import * as React from "react"
import { CheckboxDraw } from "@/components/goodui/checkbox-draw"

const TASKS = ["Confirm Friday's bookings", "Send invoice #1042", "Restock cleaning supplies"]

export function TodayChecklist() {
  const [done, setDone] = React.useState<string[]>([])
  const all = done.length === TASKS.length ? true : done.length === 0 ? false : "indeterminate"

  return (
    <div className="grid gap-3 rounded-xl border bg-card p-4">
      <CheckboxDraw
        checked={all}
        onCheckedChange={(v) => setDone(v ? TASKS : [])}
        label="Today's tasks"
        description={`${done.length} of ${TASKS.length} done`}
      />
      {TASKS.map((task) => (
        <CheckboxDraw
          key={task}
          checked={done.includes(task)}
          onCheckedChange={(v) => setDone((d) => (v ? [...d, task] : d.filter((t) => t !== task)))}
          label={task}
          strikethrough
        />
      ))}
    </div>
  )
}
```

### In a form

```tsx
<form action={createAccount}>
  <CheckboxDraw name="marketing" value="yes" label="Send me product updates" description="About one email a month." />
  <button type="submit">Create account</button>
</form>
// Submits marketing=yes when checked, marketing= (empty) when not
```

### Table row selection

```tsx
<CheckboxDraw size="sm" checked={selected.has(invoice.id)} onCheckedChange={(v) => toggle(invoice.id, v)} aria-label={`Select invoice ${invoice.number}`} />
```

## API

### CheckboxDraw

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| name | `string` | — | Form field name; renders a hidden input that submits `value` when checked and "" when not. |
| checked | `boolean \| "indeterminate"` | — | Controlled state: true, false or "indeterminate" (draws a dash, aria-checked="mixed"). |
| defaultChecked | `boolean \| "indeterminate"` | `false` | Initial state when uncontrolled; also accepts "indeterminate". |
| onCheckedChange | `(checked: boolean) => void` | — | Clicking an indeterminate box checks it. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Box size: "sm" 16px, "md" 20px, "lg" 24px. |
| label | `React.ReactNode` | — | Clickable label next to the box; also its accessible name. |
| description | `React.ReactNode` | — | Muted helper text under the label, linked with aria-describedby. |
| strikethrough | `boolean` | — | Draw a line through the label when checked (to-do lists). |
| value | `string` | `"on"` | Value submitted with `name` when checked. |

Also accepts every <button> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Space / Enter | Toggles the checkbox (native <button>). From indeterminate it becomes checked. |
| Tab | Moves focus to the box; a focus ring shows on keyboard focus only. |

## Accessibility

- Renders a native <button role="checkbox"> with aria-checked set to true, false or "mixed" for indeterminate.
- label renders a <label htmlFor> tied to the box, so the text is clickable and names it; description is linked with aria-describedby.
- Without label, pass aria-label so the box has a name.
- The fill, check and dash are aria-hidden, and so is the strike-through line; the label text stays readable.

## Motion

- The fill pops from scale 0.4 on a spring (stiffness 600, damping 28) and fades in.
- The check stroke draws in over 240 ms after a 60 ms delay; the indeterminate dash draws in over 240 ms. Unchecking erases the stroke in 120 ms.
- Pressing scales the box to 0.82 with a short CSS overshoot (no focusable wrapper inside the aria-hidden mark).
- strikethrough: a line grows across the label over 320 ms after a 120 ms delay, and shrinks back in 180 ms when unchecked.
- Reduced motion: fill, check, dash and strike-through snap to their final state and the press scale is off.

## Notes for AI

- Use checked + onCheckedChange; onCheckedChange always receives a boolean, never "indeterminate".
- "indeterminate" is a state you compute (for select all), not something the user can toggle into.
- className goes on the box <button>, not the label wrapper.
- strikethrough only shows when label is set; it has no effect on a bare box.
- With name, the hidden input submits value (default "on") when checked and an empty string when not.

## FAQ

**How do I build a select-all checkbox?**

Compute checked as true when all items are selected, false when none are, and "indeterminate" otherwise. Clicking it calls onCheckedChange(true) from the indeterminate state.

**Why does Enter toggle it?**

It is a <button role="checkbox">, so Enter and Space both click it. A native <input type="checkbox"> only responds to Space.

## Related

- checkbox: https://goodui.dev/components/core/checkbox
- switch-spring: https://goodui.dev/components/inputs/switch-spring
- success-check: https://goodui.dev/components/feedback/success-check
- list-reorder: https://goodui.dev/components/lists/list-reorder

Last updated: 2026-11-02
