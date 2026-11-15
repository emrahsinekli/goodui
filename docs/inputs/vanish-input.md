# Vanish input

> Search field with rotating, blurred-in placeholder hints; on submit the typed text dissolves into drifting particles drawn on a canvas.

Vanishing input with rotating placeholders and particle submit for React

Page: https://goodui.dev/components/inputs/vanish-input

## Install

```bash
npx shadcn@latest add @goodui/vanish-input
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/vanish-input.json`. The file lands in `components/goodui/vanish-input.tsx`.

## When to use

- A hero search or "Ask AI" prompt where the rotating hints teach what people can type.
- One-shot submissions (a question, a quick add) where the text clearing itself confirms it was sent.
- Landing pages and empty states that want one memorable input.

## When not to use

- Search that filters results as you type: use search-expand or a plain input; the dissolve only happens on submit.
- Form fields people need to review after submitting: use floating-label-input, the text is cleared on submit.
- Several on one screen: keep the effect to one primary input.

## Usage

```tsx
import { VanishInput } from "@/components/goodui/vanish-input"

const HINTS = ["Search Maya Chen", "Find invoice INV-2041", "Bookings next Tuesday", "Unpaid invoices over $500"]

export function GlobalSearch({ onSearch }: { onSearch: (q: string) => void }) {
  return (
    <VanishInput
      placeholders={HINTS}
      label="Search clients, bookings and invoices"
      submitLabel="Search"
      onSubmit={onSearch}
    />
  )
}
```

### Scheduling assistant prompt

```tsx
<VanishInput
  placeholders={["Move Friday's 9am to Monday", "Who hasn't booked in 60 days?"]}
  interval={3600}
  label="Ask the scheduling assistant"
  submitLabel="Ask"
  className="h-11 rounded-xl"
  onSubmit={(prompt) => sendToAssistant(prompt)}
/>
```

### Controlled, e.g. to refill from recent searches

```tsx
const [query, setQuery] = React.useState("")

<VanishInput value={query} onValueChange={setQuery} onSubmit={addToRecent} label="Search" />
<button type="button" onClick={() => setQuery("INV-2038")}>INV-2038</button>
```

## API

### VanishInput

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| name | `string` | — | name attribute of the text input, for native form handling. |
| placeholders | `string[]` | `["Search…"]` | Hints that rotate while the field is empty. |
| interval | `number` | `3000` | Milliseconds between placeholder changes. |
| value | `string` | — | Controlled text. It is set to "" when the text is submitted. |
| defaultValue | `string` | `""` | Initial text when uncontrolled. |
| onValueChange | `(value: string) => void` | — | Called on every keystroke, and with "" when the text is submitted. |
| onSubmit | `(value: string) => void` | — | Called with the text when the user presses Enter or the arrow button; the text then dissolves. |
| label | `string` | — | Accessible name of the input (defaults to the first placeholder). |
| submitLabel | `string` | `"Submit"` | aria-label of the arrow submit button. |
| inputClassName | `string` | — | Classes for the native input; `className` styles the pill-shaped form. |

Also accepts every <form> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter | Submits the form: calls onSubmit with the trimmed text, then clears the field. Ignored when the text is empty or still dissolving. |

## Accessibility

- Renders a real <form> with a text <input> and a submit <button>, so Enter and the button both submit.
- The input's accessible name is label, or the first placeholder when label is not set; the rotating hints are aria-hidden.
- The arrow button is named by submitLabel (default "Submit") and is disabled while the field is empty.
- The particle canvas is aria-hidden. Nothing is announced on submit; announce the result yourself if it matters.

## Motion

- Placeholders change every interval ms (default 3000) while the field is empty: the old one slides up and blurs out, the new one rises in, 0.3 s each.
- On submit the text is drawn to a canvas and sampled into particles that drift up and to the right and fade, the end of the text first; the effect runs for at most 120 frames.
- The arrow icon sits rotated -90° while empty and springs upright (stiffness 500, damping 28) once there is text.
- Reduced motion: no particles, the field just clears; placeholders cross-fade in 0.15 s instead of sliding, and the arrow does not rotate.

## Performance

- Placeholder rotation stops while the field has text and while the tab is hidden.
- The particle loop runs only after a submit, stops when the tab is hidden, and is cancelled on unmount; the canvas resolution is capped at 2x device pixel ratio.

## Notes for AI

- onSubmit receives the trimmed string; the component clears the field itself, so do not reset value in onSubmit.
- Props other than the listed ones go to the <form>; there is no native onSubmit event passthrough.
- Give label when the placeholders are examples rather than a description of the field.
- className styles the pill-shaped form (height, radius); inputClassName styles the input.
- Keep placeholders short; long ones are truncated.

## FAQ

**What happens with reduced motion?**

The dissolve is skipped and the field simply clears after submit; placeholders still rotate, with a short fade.

**Can I keep the text after submitting?**

No, clearing is part of the effect. Use floating-label-input or input if the text should stay.

## Related

- search-expand: https://goodui.dev/components/inputs/search-expand
- command-palette-morph: https://goodui.dev/components/navigation/command-palette-morph
- floating-label-input: https://goodui.dev/components/inputs/floating-label-input
- typewriter: https://goodui.dev/components/text/typewriter

Last updated: 2026-11-02
