# Number Input

> Numeric spinbutton with split, end or stacked steppers, press-and-hold acceleration, min/max/step and large steps, Intl currency, percent and unit formatting over a raw value, arrow, PageUp/PageDown, Home/End and focused-wheel stepping, slide or pop step feedback and an invalid state, in the six input variants with tones, sizes, shapes and shadows.

Number input for React and shadcn: steppers, press-and-hold, currency, percent and unit formatting

Page: https://goodui.dev/components/core/number-input

## Install

```bash
npx shadcn@latest add @goodui/number-input
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/number-input.json`. The file lands in `components/goodui/number-input.tsx`.

## When to use

- Quantities with a sensible range: seats, guests, items in a cart, team size.
- Money, percentages and units that should read formatted ($1,250.00, 15%, 45 minutes) but stay a raw number in state.
- Values people nudge more than type: buffers between bookings, session length in 15-minute steps, discounts in 5% steps.

## When not to use

- Picking a value on a wide continuous range where precision does not matter: use slider-tooltip.
- Codes that only look numeric (PINs, ZIP codes, card numbers): use input or otp-input, they are not quantities.
- Two to five fixed choices (1, 2, 4 guests): use toggle-group so every option is visible.

## Pick by what matters

| Need | Use |
| --- | --- |
| Quantity with big tap targets (mobile, POS) | steppers="split" with shape="pill" |
| Compact form field | steppers="stacked" or "end" (default) |
| Plain typed number | steppers="none" |
| Money | format={{ style: "currency", currency: "EUR" }} and a locale |
| Percent | format={{ style: "percent" }}; the value is a fraction (0.15) |
| Durations and units | format={{ style: "unit", unit: "minute", unitDisplay: "long" }} |
| Keep out-of-range values and flag them | clampOnBlur={false} with message |

## Usage

```tsx
import * as React from "react"
import { NumberInput } from "@/components/goodui/number-input"

export function SeatsField() {
  const [seats, setSeats] = React.useState<number | null>(5)
  const [discount, setDiscount] = React.useState<number | null>(0.1)

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <NumberInput label="Seats" value={seats} onValueChange={setSeats} min={1} max={250} steppers="split" name="seats" />
      <NumberInput
        label="Discount"
        value={discount}
        onValueChange={setDiscount}
        min={0}
        max={0.5}
        step={0.05}
        format={{ style: "percent" }}
        description="Applied to every seat."
      />
    </div>
  )
}
```

### Currency in a fixed locale

```tsx
<NumberInput
  label="Deposit"
  locale="de-DE"
  format={{ style: "currency", currency: "EUR" }}
  min={0}
  step={50}
  largeStep={500}
  defaultValue={1250}
/>
```

### Flag instead of clamping

```tsx
<NumberInput label="Guests per table" min={1} max={8} clampOnBlur={false} message="Tables seat up to 8 guests." trailing="guests" />
```

### Duration with stacked steppers

```tsx
<NumberInput label="Session length" min={15} max={240} step={15} defaultValue={45} steppers="stacked"
  format={{ style: "unit", unit: "minute", unitDisplay: "long" }} />
```

## API

### NumberInput

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| value | `number \| null` | — | Raw numeric value (controlled); null when empty. Formatting never changes it. |
| defaultValue | `number \| null` | `null` | Initial value when uncontrolled. |
| onValueChange | `(value: number \| null) => void` | — | Called with the raw number (or null) while typing, on every step and when the value is clamped on blur. |
| onChange | `React.ChangeEventHandler<HTMLInputElement>` | — | Native change event of the text field (fires while typing only). |
| min | `number` | — |  |
| max | `number` | — |  |
| step | `number` | `1` | Amount added by a stepper, ↑ / ↓ or the wheel. |
| largeStep | `number` | — | Amount added by PageUp / PageDown and Shift + wheel. Defaults to step × 10. |
| format | `Intl.NumberFormatOptions` | — | Intl.NumberFormat options for the display, e.g. { style: "currency", currency: "EUR" } or { style: "percent" }. Percent values are fractions (0.15 shows as 15%); you type 15 while editing. |
| locale | `string` | — | BCP 47 locale for formatting and parsing. Defaults to the GooduiLocaleProvider language, else the browser's language after mount ("en-US" on the server). |
| clampOnBlur | `boolean` | `true` | Snap out-of-range values back to min / max when the field loses focus. false keeps them and marks the field invalid. |
| holdToRepeat | `boolean` | `true` | Repeat while a stepper is held down, accelerating the longer it is held. |
| wheel | `boolean` | `true` | Step with the mouse wheel while the field has focus. |
| sound | `boolean \| SoundName` | — | Plays a "tick" on every step (a little higher for +, lower for −) when the visitor has sounds on (lib/goodui-sounds); pass a sound name to pick another. Off by default. |
| steppers | `"split" \| "end" \| "stacked" \| "none"` | `"end"` | Stepper buttons: split puts − and + on either side, end groups them after the value, stacked shows ▲ ▼. |
| align | `"start" \| "center" \| "end"` | — | Text alignment of the value. Defaults to center for split steppers, start otherwise. |
| variant | `"outline" \| "filled" \| "underline" \| "ghost" \| "neo" \| "glass"` | `"outline"` | Field style: outline (default), filled, underline, ghost, neo-brutalist or frosted glass. |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"primary"` | Focus color and stepper hover color. |
| size | `"sm" \| "md" \| "lg"` | `"md"` |  |
| shape | `"square" \| "rounded" \| "pill"` | `"rounded"` |  |
| shadow | `"none" \| "sm" \| "md" \| "inner"` | `"none"` | Field shadow; inner draws an inset shadow. Ignored by neo, which has its own offset shadow. |
| animation | `"none" \| "ring" \| "glow" \| "lift"` | `"ring"` | How the field reacts to focus. |
| stepAnimation | `"none" \| "slide" \| "pop"` | `"slide"` | How the value reacts to a step: slide (up or down with the direction), pop (scale bump) or none. |
| label | `React.ReactNode` | — | Visible label above the field. |
| description | `React.ReactNode` | — | Helper text under the field (hidden while a message shows). |
| message | `React.ReactNode` | — | Error text under the field; shown when invalid. |
| invalid | `boolean` | — | Red field and aria-invalid. Also set automatically for out-of-range values when clampOnBlur is false. |
| leading | `React.ReactNode` | — | Icon or short text before the value. |
| trailing | `React.ReactNode` | — | Icon or short text after the value (e.g. "guests"). |
| fullWidth | `boolean` | — | Stretch to the container. By default the field is 12rem wide (override with className). |
| fieldClassName | `string` | — | Class for the field box (the root gets className). |
| labels | `Partial<NumberInputLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <input> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| ↑ / ↓ | Add or subtract step (Shift: largeStep). |
| PageUp / PageDown | Add or subtract largeStep (default step × 10). |
| Home / End | Jump to min / max, when they are set. |
| Enter | Parses and clamps what you typed (with clampOnBlur); focus stays in the field. |
| Esc | Reverts to the value the field had when it got focus. |
| Mouse wheel | Steps only while the field has focus (Shift + wheel: largeStep), so the page still scrolls. |

## Accessibility

- The field is an <input> with role="spinbutton", aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext set to the formatted value ("$1,250.00").
- The − and + buttons are out of the tab order (keyboard users have the arrow keys), carry translatable aria-labels and aria-controls pointing at the field, and still step once when activated without a pointer.
- label renders a real <label htmlFor>; without one, pass aria-label. description and message are linked with aria-describedby, and the message region is aria-live.
- invalid (or an out-of-range value with clampOnBlur={false}) sets aria-invalid and the danger color.
- name renders a hidden input with the raw number, so native forms submit 1250, not "1.250,00 €".

## Motion

- Focus: ring (3px tone ring, 200 ms), glow (soft tone halo, 300 ms) or lift (rises 2px). none is static.
- Step: slide moves the value 7px in the step direction and fades it in over 170 ms; pop scales it to 1.09 and back over 220 ms. Both use the Web Animations API on the input, so React does not re-render for them.
- Reduced motion: transitions and the step animation are skipped (checked with matchMedia at step time).

## Performance

- Press-and-hold runs one setTimeout chain (first repeat after 400 ms, then from about 126 ms down to 28 ms between steps) and stops on pointerup, pointercancel, window blur, reaching a bound or unmount.
- Intl.NumberFormat instances are memoized on locale and the format object; pass a stable format object (a constant or useMemo) to avoid rebuilding them on every render.

## Notes for AI

- value and onValueChange are numbers (or null for empty), never strings. Do not parse the display text yourself.
- Percent values are fractions: 0.15 shows as 15% and the user types 15 while editing.
- Without locale the first render uses en-US and switches to the browser language after mount; pass locale when the text must not change after hydration.
- Use format for currency, percent and units; do not put "$" in leading. Use trailing for plain words like "guests".
- onValueChange fires while typing with the unclamped number, then again on blur with the clamped one. Validate on blur or submit, not on every keystroke.
- Layers (variant, tone, size, shape, shadow, animation, stepAnimation, steppers) match the input component, so mixed forms look consistent.

## FAQ

**Why does the field show 1250 while I edit and 1.250,00 € after?**

Editing a formatted string is error-prone, so the focused field shows the plain number in your locale and formats again on blur. The value prop never changes format.

**Can I allow empty?**

Yes. Clearing the field reports null; stepping from empty starts at min (or 0).

**Does it work with react-hook-form?**

Use it as a controlled field (Controller) with value and onValueChange, or pass name for native form submission of the raw number.

## Related

- input: https://goodui.dev/components/core/input
- slider-tooltip: https://goodui.dev/components/inputs/slider-tooltip
- select: https://goodui.dev/components/core/select
- toggle-group: https://goodui.dev/components/core/toggle-group
- multi-step-form: https://goodui.dev/components/core/multi-step-form

Last updated: 2026-11-03
