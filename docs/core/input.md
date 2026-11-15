# Input

> Six field styles with top, floating, inline or hidden labels, focus ring, glow, underline-grow or lift, error shake with sliding messages, icon and text addons, clear button, counter and auto-growing textarea.

Input and textarea for React and shadcn: floating label, error shake, addons, clear button

Page: https://goodui.dev/components/core/input

## Install

```bash
npx shadcn@latest add @goodui/input
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/input.json`. The file lands in `components/goodui/input.tsx`.

## When to use

- Any single-line text field in a form: name, email, price, URL, search.
- Validated forms that need an error or success message under the field, with a shake on a failed submit.
- Fields with units or prefixes: https:// before a domain, $ before a price, .com after a subdomain.
- Notes and messages that should grow with the text: multiline with autoResize.

## When not to use

- Picking from a fixed list of options: use select.
- A one-time code: use otp-input. Several values as chips: use tag-input.
- A search box that expands from an icon in a toolbar: use search-expand.

## Pick by what matters

| Need | Use |
| --- | --- |
| Standard form field | variant="outline" labelMode="top" (defaults) |
| Compact forms where labels sit inside | labelMode="floating" (or "inline" for short labels like "To:") |
| Filter or search bar in a toolbar | variant="filled" or "ghost", labelMode="none", leading={<Search />}, clearable |
| Minimal settings or sign-in pages | variant="underline" with animation="underline-grow" |
| Playful or retro brands | variant="neo" with animation="lift" |
| Over photos or gradients | variant="glass" |
| Validation feedback | state="error" \| "success" with message; shakeKey to shake again on each submit |

## Usage

```tsx
import * as React from "react"
import { Mail } from "lucide-react"
import { Input } from "@/components/goodui/input"

export function InviteField() {
  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState("")
  const [attempt, setAttempt] = React.useState(0)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setAttempt((n) => n + 1)
    setError(email.includes("@") ? "" : "Enter a valid work email.")
  }

  return (
    <form onSubmit={submit} className="flex max-w-sm flex-col gap-3">
      <Input
        type="email"
        label="Invite a teammate"
        description="They get an email with a link to join your studio."
        placeholder="name@studio.com"
        leading={<Mail />}
        clearable
        value={email}
        onValueChange={setEmail}
        state={error ? "error" : "default"}
        message={error}
        shakeKey={attempt}
      />
      <button type="submit" className="self-start text-sm font-medium underline">
        Send invite
      </button>
    </form>
  )
}
```

### Floating label

```tsx
<Input labelMode="floating" label="Business name" defaultValue="Glow Studio" />
```

### Addons and prefix

```tsx
<Input label="Booking page" addonBefore="https://" addonAfter=".goodui.app" placeholder="glow-studio" />
<Input label="Deposit" leading="$" trailing="USD" inputMode="decimal" placeholder="50.00" />
```

### Growing textarea with counter

```tsx
<Input multiline autoResize rows={2} label="Note for the client" maxLength={280} showCount placeholder="Please arrive 10 minutes early." />
```

## API

### Input

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| variant | `"outline" \| "filled" \| "underline" \| "ghost" \| "neo" \| "glass"` | `"outline"` | Field style: outline (default), filled, underline, ghost, neo-brutalist or frosted glass. |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"primary"` | Focus color (ring, border, floating label). Overridden by state="error" or "success". |
| size | `"sm" \| "md" \| "lg"` | `"md"` |  |
| shape | `"square" \| "rounded" \| "pill"` | `"rounded"` |  |
| shadow | `"none" \| "sm" \| "md" \| "inner"` | `"none"` | Field shadow; inner draws an inset shadow. Ignored by neo, which has its own offset shadow. |
| animation | `"none" \| "ring" \| "glow" \| "underline-grow" \| "lift"` | `"ring"` | How the field reacts to focus. |
| label | `React.ReactNode` | — | Field label; placement is set by labelMode. |
| labelMode | `"top" \| "floating" \| "inline" \| "none"` | `"top"` | top: above the field. floating: inside, floats up on focus. inline: inside, before the value. none: screen-reader only. |
| description | `React.ReactNode` | — | Helper text under the field (hidden while a message shows). |
| state | `"default" \| "error" \| "success"` | `"default"` | Validation state: colors the field, adds an icon, sets aria-invalid on error and shows message. |
| message | `React.ReactNode` | — | Error or success text; slides in under the field. |
| shake | `boolean` | `true` | Shake the field when it enters the error state. |
| shakeKey | `React.Key` | — | Change it (e.g. a submit counter) to shake again while already in the error state. |
| leading | `React.ReactNode` | — | Icon or short text inside the field, before the value. |
| trailing | `React.ReactNode` | — | Icon or short text inside the field, after the value. |
| addonBefore | `React.ReactNode` | — | Attached segment before the field, e.g. "https://". |
| addonAfter | `React.ReactNode` | — | Attached segment after the field, e.g. ".com". |
| clearable | `boolean` | — | Shows a × button while the field has a value. |
| showCount | `boolean` | — | Shows "12/80" when maxLength is set. |
| multiline | `boolean` | — | Renders a <textarea>. |
| rows | `number` | `3` | Visible rows of the textarea (multiline only). |
| autoResize | `boolean` | — | Textarea grows with its content. |
| value | `string` | — | Controlled value. |
| defaultValue | `string` | — | Initial value when uncontrolled. |
| onValueChange | `(value: string) => void` | — | Called with the new string on typing and when the clear button empties the field. |
| onChange | `(e: React.ChangeEvent<HTMLInputElement \| HTMLTextAreaElement>) => void` | — | Native change event. The clear button fires it too (with an empty value), so form libraries see the reset. |
| borderLight | `boolean` | `true` | A small light on the field border follows the pointer. Ignored by underline and neo, and with animation="none". |
| fullWidth | `boolean` | `true` | false shrinks the field to its content width. |
| fieldClassName | `string` | — | Class for the field box (the root gets className). |
| labels | `Partial<InputLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <input> attribute.

## Accessibility

- Renders a real <input> or <textarea> with a <label htmlFor>; the id is generated with useId unless you pass one.
- labelMode="none" keeps the label for screen readers: a string label becomes aria-label, any other node becomes an sr-only <label>.
- state="error" sets aria-invalid. The description or message is linked with aria-describedby and sits in an aria-live="polite" region, so new errors are announced.
- The clear button has aria-label "Clear" (labels.clear) and returns focus to the field.
- Error and success also show an icon, so the state does not rely on color alone.

## Motion

- Focus: ring adds a 3px tone-colored ring in 200 ms (default), glow adds a soft bloom in 300 ms, lift raises the field 2px, underline-grow draws a bar from the center in 300 ms.
- Floating label: moves up and scales to 0.78 in 180 ms when the field is focused or has a value.
- Message: slides down and expands its height on the snap spring; the description cross-fades in 150 ms. Focus shifts the border to the tone and adds a 3px ring in 150 ms. borderLight adds a small light that follows the pointer along the border.
- Shake: a 420 ms horizontal shake when the field enters the error state, when the error text changes, or when shakeKey changes.
- Reduced motion: no shake, no lift and no CSS transitions; messages appear and disappear instantly.

## Notes for AI

- Use value + onValueChange (string) for controlled fields; onChange still receives the native event. The clear button fires a real input event, so both onChange and onValueChange get "".
- ref reaches the <input> (or <textarea>), and uncontrolled fields stay native (defaultValue), so react-hook-form's register() works directly.
- Validation is yours: set state="error" and message. Increment shakeKey on every failed submit so the field shakes even if the message did not change.
- tone only changes the focus color. state="error" or "success" overrides it, so do not set tone="danger" for errors.
- className goes on the outer wrapper (label, field and message); use fieldClassName to style the field box itself.
- showCount needs maxLength. autoResize and rows only apply with multiline. labels={{ clear: "Löschen" }} translates the clear button.

## FAQ

**How do I use it with react-hook-form?**

Spread register("email") onto it: ref, name, onChange and onBlur reach the native field, and the clear button reports the empty value. Or use a Controller with value and onValueChange. Pass fieldState.error?.message to message with state="error".

**Can I show the error only after submit?**

Yes. The component never validates on its own; it shows exactly the state and message you pass, whenever you pass them.

## Related

- select: https://goodui.dev/components/core/select
- floating-label-input: https://goodui.dev/components/inputs/floating-label-input
- otp-input: https://goodui.dev/components/inputs/otp-input
- tag-input: https://goodui.dev/components/inputs/tag-input

Last updated: 2026-11-02
