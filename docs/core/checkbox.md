# Checkbox & Radio

> Checkbox and RadioGroup on real inputs with default, filled, outline, circle, neo and whole-card variants, draw, pop and bounce animations, tones, sizes, shadows, indeterminate, invalid and descriptions.

Animated checkbox and radio group for React and shadcn: draw-in check, card options, indeterminate

Page: https://goodui.dev/components/core/checkbox

## Install

```bash
npx shadcn@latest add @goodui/checkbox
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/checkbox.json`. The file lands in `components/goodui/checkbox.tsx`.

## When to use

- Choices submitted with a form: accept the terms, pick add-ons, choose notification channels.
- Select-all in a table header with some rows selected: indeterminate.
- Plan, time slot or payment method pickers where each option is a card with a price: variant="card" on RadioGroup.
- One choice from a short visible list (2 to 5 options): RadioGroup with Radio.

## When not to use

- A setting that applies immediately: use switch.
- One choice from a long list: use select.
- Switching views or filters at the top of a list: use tabs or segmented-control.

## Pick by what matters

| Need | Use |
| --- | --- |
| Standard form checkbox | variant="default" animation="draw" (defaults) |
| Options with a price or details | variant="card" with description and children |
| Round checkboxes (to-do lists, image pickers) | variant="circle" |
| Quieter checked state | variant="outline" (tinted box with a colored mark) |
| Playful or retro brands | variant="neo" with animation="bounce" |
| Snappy feedback in dense tables | animation="pop" size="sm" |
| Settings list with the box at the end | labelPosition="left" |

## Usage

```tsx
import * as React from "react"
import { Checkbox, Radio, RadioGroup } from "@/components/goodui/checkbox"

export function BookingOptions() {
  const [plan, setPlan] = React.useState("monthly")
  const [terms, setTerms] = React.useState(false)

  return (
    <form className="flex max-w-md flex-col gap-5">
      <RadioGroup value={plan} onValueChange={setPlan} variant="card" name="plan" aria-label="Billing period">
        <Radio value="monthly" label="Monthly" description="$29 per month, cancel any time" />
        <Radio value="yearly" label="Yearly" description="$290 per year, two months free">
          <span className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">Most popular</span>
        </Radio>
      </RadioGroup>
      <Checkbox name="sms" defaultChecked label="SMS reminders" description="Text clients 24 hours before each booking." />
      <Checkbox checked={terms} onCheckedChange={setTerms} label="I accept the terms of service" required />
    </form>
  )
}
```

### Select all with indeterminate

```tsx
const all = selected.length === rows.length
const some = selected.length > 0 && !all

<Checkbox
  aria-label="Select all bookings"
  checked={all}
  indeterminate={some}
  onCheckedChange={(on) => setSelected(on ? rows.map((r) => r.id) : [])}
  size="sm"
/>
```

### Horizontal radio group

```tsx
<RadioGroup orientation="horizontal" defaultValue="card" aria-label="Payment method" animation="pop">
  <Radio value="card" label="Card" />
  <Radio value="cash" label="Cash" />
  <Radio value="invoice" label="Invoice" />
</RadioGroup>
```

## API

### Checkbox

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| children | `React.ReactNode` | — | Extra content under the description (prices, badges), handy with the card variant. |
| variant | `"default" \| "filled" \| "outline" \| "circle" \| "neo" \| "card"` | `"default"` | Box style: default, filled, outline (tinted when checked), circle, neo, or card (the whole card is the hit area). |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"primary"` | Color when checked. |
| animation | `"none" \| "draw" \| "pop" \| "bounce"` | `"draw"` | How the mark appears: draw (stroke, default), pop, bounce or none. |
| shadow | `"none" \| "sm" \| "glow"` | `"none"` | Box shadow; glow only shows when checked. |
| size | `"sm" \| "md" \| "lg"` | `"md"` |  |
| label | `React.ReactNode` | — | Visible label, linked with aria-labelledby. |
| description | `React.ReactNode` | — | Muted helper text under the label, linked with aria-describedby. |
| labelPosition | `"left" \| "right"` | — | Which side of the box the text sits on. "left" spreads the row (text start, box end). |
| invalid | `boolean` | — | Shows the danger state, e.g. an unaccepted required checkbox. |
| checked | `boolean` | — | Checked state (controlled). |
| defaultChecked | `boolean` | `false` | Initial state when uncontrolled. |
| onCheckedChange | `(checked: boolean) => void` | — | Called with the new checked state. |
| onChange | `React.ChangeEventHandler<HTMLInputElement>` | — | Native change event of the hidden input. |
| indeterminate | `boolean` | `false` | Shows a dash, e.g. a "select all" with some rows selected. Clicking it checks the box. |
| sound | `boolean \| SoundName` | — | Plays "pop" when checked and "tick" when unchecked, when the visitor has sounds on (lib/goodui-sounds); pass a sound name to use one sound for both. Off by default. |

Also accepts every <input> attribute.

### RadioGroup

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| variant | `"default" \| "filled" \| "outline" \| "circle" \| "neo" \| "card"` | `"default"` | Box style: default, filled, outline (tinted when checked), circle, neo, or card (the whole card is the hit area). |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"primary"` | Color when checked. |
| animation | `"none" \| "draw" \| "pop" \| "bounce"` | `"draw"` | How the mark appears: draw (stroke, default), pop, bounce or none. |
| shadow | `"none" \| "sm" \| "glow"` | `"none"` | Box shadow; glow only shows when checked. |
| size | `"sm" \| "md" \| "lg"` | `"md"` |  |
| value | `string` | — | Selected radio value (controlled). |
| defaultValue | `string` | — | Initially selected value when uncontrolled. |
| onValueChange | `(value: string) => void` | — | Called with the value of the newly selected radio. |
| name | `string` | — | Form field name. Generated when omitted. |
| disabled | `boolean` | — | Disables every radio in the group. |
| orientation | `"vertical" \| "horizontal"` | `"vertical"` | horizontal lays the radios out in equal columns. |
| labelPosition | `"left" \| "right"` | — | Default text side for every radio. |

Also accepts every <div> attribute.

### Radio

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| value (required) | `string` | — | Value reported to RadioGroup and submitted with the form. |
| children | `React.ReactNode` | — | Extra content under the description (prices, badges), handy with the card variant. |
| variant | `"default" \| "filled" \| "outline" \| "circle" \| "neo" \| "card"` | — | Box style: default, filled, outline (tinted when checked), circle, neo, or card (the whole card is the hit area). |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | — | Color when checked. |
| animation | `"none" \| "draw" \| "pop" \| "bounce"` | — | How the mark appears: draw (stroke, default), pop, bounce or none. |
| shadow | `"none" \| "sm" \| "glow"` | — | Box shadow; glow only shows when checked. |
| size | `"sm" \| "md" \| "lg"` | — |  |
| label | `React.ReactNode` | — | Visible label, linked with aria-labelledby. |
| description | `React.ReactNode` | — | Muted helper text under the label, linked with aria-describedby. |
| labelPosition | `"left" \| "right"` | — | Which side of the box the text sits on. "left" spreads the row (text start, box end). |
| invalid | `boolean` | — | Shows the danger state, e.g. an unaccepted required checkbox. |

Also accepts every <input> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Space | Toggles the focused checkbox or selects the focused radio (native <input>). |
| Arrow keys | Move and select within a RadioGroup, because its radios share one name (native behavior). |
| Tab | Moves focus; the box (or the whole card) shows a tone-colored focus ring on keyboard focus only. |

## Accessibility

- Real <input type="checkbox"> and <input type="radio"> elements sit invisibly on the box, so forms, required, autofill and screen readers work natively.
- Each option is a <label>, so the text and the whole card are click targets. label and description are linked with aria-labelledby and aria-describedby.
- indeterminate sets the native indeterminate property, which screen readers announce as mixed.
- Checkbox invalid sets aria-invalid; on Radio it only changes the color, so also show an error message.
- RadioGroup renders role="radiogroup"; give it a name with aria-label or aria-labelledby. Without label, give a Checkbox an aria-label.

## Motion

- draw (default): the check stroke draws in over 300 ms after a 50 ms delay and retracts in 260 ms; a radio dot scales in over 200 ms.
- pop: the box pops from 0.72 past 1.14 back to 1 in 340 ms when checked. bounce: the mark springs in with overshoot over 380 ms while the box squishes for 400 ms.
- Press: the box shrinks to 0.9 (neo shifts into its shadow). Colors and borders change in 160 ms.
- pop and bounce only play after the user has interacted, never on first render.
- Reduced motion: no transitions or keyframes; the check and dot appear fully drawn at once.

## Notes for AI

- Callbacks: Checkbox uses onCheckedChange(checked: boolean); RadioGroup uses onValueChange(value: string). onChange still gets the native event.
- Radio must be inside RadioGroup and needs a value. Set variant, tone, animation, shadow and size once on RadioGroup; a Radio can override them.
- Compute indeterminate from your data (some selected, not all); clicking calls onCheckedChange with the new checked value, so clear indeterminate there. If you keep it true, the native indeterminate flag is re-applied after the click, so the box and screen readers stay in sync.
- ref reaches the hidden native <input type="checkbox">, and an uncontrolled Checkbox stays native (defaultChecked), so react-hook-form's register() works.
- children render under the description, inside the label: put prices or badges there, not interactive elements like links or buttons.
- There is no built-in text, so no labels prop. RadioGroup generates name when you omit it; pass name for native form submission.

## FAQ

**Does it work with react-hook-form?**

Yes. Spread register("terms") onto a Checkbox (the ref reaches the native input), or use a Controller: pass field.value to checked (or value on RadioGroup) and field.onChange to onCheckedChange (or onValueChange).

**How do I make the whole card selectable?**

Use variant="card". The card is the <label>, so clicking anywhere on it selects the option, and it gets a tone-colored border when checked.

## Related

- switch: https://goodui.dev/components/core/switch
- checkbox-draw: https://goodui.dev/components/inputs/checkbox-draw
- select: https://goodui.dev/components/core/select
- segmented-control: https://goodui.dev/components/navigation/segmented-control

Last updated: 2026-11-02
