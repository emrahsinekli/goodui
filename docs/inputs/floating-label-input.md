# Floating label input

> Input and textarea whose label springs up on focus or value, with prefix/suffix slots that fade in, an animated clear button, character counter and a slide-in error.

Floating label input and textarea for React and shadcn

Page: https://goodui.dev/components/inputs/floating-label-input

## Install

```bash
npx shadcn@latest add @goodui/floating-label-input
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/floating-label-input.json`. The file lands in `components/goodui/floating-label-input.tsx`.

## When to use

- Compact forms (checkout, billing, profile) where a label above every field takes too much room.
- Fields with a unit or fixed part: a currency prefix, "/hr", a domain suffix.
- Notes and messages with a length limit: FloatingLabelTextarea shows a counter that turns amber above 90%.
- Fields that need a clear button and an error that slides in under them.

## When not to use

- Dense settings pages and tables: a plain input with a label above scans faster.
- Several values in one field: use tag-input.
- Validation feedback around an input you already have (shadcn Input, select): use input-shake.

## Pick by what matters

| Need | Use |
| --- | --- |
| Single-line text, email, numbers | FloatingLabelInput |
| Multi-line notes with a limit | FloatingLabelTextarea with maxLength (counter appears) |
| Money or units | prefix="$" and/or suffix="/hr" (shown once the label floats) |
| Search-like fields people often reset | clearable (add onClear to react) |

## Usage

```tsx
import * as React from "react"
import { FloatingLabelInput } from "@/components/goodui/floating-label-input"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function BillingEmail() {
  const [email, setEmail] = React.useState("")
  const [touched, setTouched] = React.useState(false)
  const error = touched && !EMAIL.test(email) ? "Enter a valid email, like maya@brightclean.co" : undefined

  return (
    <FloatingLabelInput
      label="Billing email"
      type="email"
      autoComplete="email"
      value={email}
      onValueChange={setEmail}
      onBlur={() => setTouched(true)}
      error={error}
      description="Invoices and payout receipts go here."
      clearable
    />
  )
}
```

### Rate with prefix and suffix

```tsx
<FloatingLabelInput label="Hourly rate" inputMode="decimal" prefix="$" suffix="/hr" defaultValue="65" />
```

### Notes with a character counter

```tsx
import { FloatingLabelTextarea } from "@/components/goodui/floating-label-input"

<FloatingLabelTextarea
  label="Notes for your cleaner"
  placeholder="Gate code, parking, pets, rooms to skip…"
  maxLength={160}
  clearable
/>
```

## API

### FloatingLabelInput

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| label (required) | `React.ReactNode` | — | Text that sits inside the field and floats up on focus or when there is a value. |
| error | `React.ReactNode` | — | Error message; slides in under the field and turns it red. |
| description | `React.ReactNode` | — | Helper text shown when there is no error. |
| clearable | `boolean` | — | Show a clear (×) button when the field has a value. |
| onValueChange | `(value: string) => void` | — | Called with the new string on typing and on clear. The clear button also fires `onChange` with a real change event. |
| onClear | `() => void` | — | Called after the clear button empties the field. |
| inputClassName | `string` | — | Classes for the native input/textarea; `className` styles the root. |
| labels | `Partial<FloatingLabelInputLabels>` | — | Text for built-in controls and screen readers; pass translations here. |
| prefix | `React.ReactNode` | — | Shown before the value once the label floats, e.g. "$" or "https://". |
| suffix | `React.ReactNode` | — | Shown after the value once the label floats, e.g. "/hr" or ".com". |

Also accepts every <input> attribute.

### FloatingLabelTextarea

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| label (required) | `React.ReactNode` | — | Text that sits inside the field and floats up on focus or when there is a value. |
| error | `React.ReactNode` | — | Error message; slides in under the field and turns it red. |
| description | `React.ReactNode` | — | Helper text shown when there is no error. |
| clearable | `boolean` | — | Show a clear (×) button when the field has a value. |
| onValueChange | `(value: string) => void` | — | Called with the new string on typing and on clear. The clear button also fires `onChange` with a real change event. |
| onClear | `() => void` | — | Called after the clear button empties the field. |
| inputClassName | `string` | — | Classes for the native input/textarea; `className` styles the root. |
| labels | `Partial<FloatingLabelInputLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <textarea> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Moves from the field to the clear button when it is shown (a native <button>; Enter or Space clears and refocuses the field). |

## Accessibility

- The label is a real <label htmlFor> tied to the native input or textarea, so clicking it focuses the field.
- error and description are linked with aria-describedby; the error has role="alert" and sets aria-invalid.
- The textarea counter becomes a polite live region once the value passes 90% of maxLength.
- prefix and suffix are aria-hidden; put the unit in the label too if it matters ("Hourly rate (USD)").
- The clear button's aria-label is labels.clear(label) ("Clear <label>", or "Clear field" via labels.field when label is not a string); pass labels to translate it.

## Motion

- The label moves up and scales to 0.78 on a spring (stiffness 520, damping 36) when the field is focused, has a value, or is filled by browser autofill.
- prefix and suffix fade in over 0.15 s once the label floats; the placeholder fades in only while focused.
- The clear button spins in from -90° and scale 0.5 on the same spring; the error slides down and grows to its height in 0.2 s.
- Reduced motion: the label jumps without a spring, the clear button and error only fade.

## Notes for AI

- Prefer onValueChange(value: string). onChange also works: the clear button fires a real input event, so onChange, onValueChange and onClear all run on clear (react-hook-form register works).
- Built-in text comes from the labels prop: clear(label) and field; pass translations there.
- className styles the outer wrapper; use inputClassName for the native input or textarea.
- label is required. placeholder is hidden until the field is focused, so do not rely on it as the label.
- FloatingLabelTextarea has no prefix or suffix; maxLength turns on the counter.
- Pass error only when there is one (undefined otherwise); any truthy error turns the field red and replaces description.

## FAQ

**Does it work with browser autofill?**

Yes for the input. A no-op CSS animation on :-webkit-autofill tells the component the field was filled, so the label floats even before a change event.

**Does the textarea grow with its content?**

It uses field-sizing: content, so it grows up to max-h-48 in browsers that support it and stays at its minimum height elsewhere.

## Related

- input: https://goodui.dev/components/core/input
- input-shake: https://goodui.dev/components/inputs/input-shake
- tag-input: https://goodui.dev/components/inputs/tag-input
- search-expand: https://goodui.dev/components/inputs/search-expand

Last updated: 2026-11-02
