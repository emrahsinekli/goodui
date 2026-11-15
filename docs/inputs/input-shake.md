# Input shake

> Validation wrapper for any input that shakes and slides in an error with an icon when invalid, and draws a check circle when valid.

Input validation with shake animation and error message for React and shadcn

Page: https://goodui.dev/components/inputs/input-shake

## Install

```bash
npx shadcn@latest add @goodui/input-shake
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/input-shake.json`. The file lands in `components/goodui/input-shake.tsx`.

## When to use

- Sign-up and login forms where a failed submit should be impossible to miss.
- Wrapping inputs you already have (shadcn Input, a native <select>) to add an error, a success check and a label without rebuilding them.
- Server-side errors ("This email already has a workspace") that should shake the field again on each failed submit.

## When not to use

- Errors while the user is still typing: show them on blur or submit; a shake on every keystroke is noise.
- Building a field from scratch: floating-label-input already has its own error slot.
- One-time codes: otp-input has its own error shake and success bounce.

## Usage

```tsx
import * as React from "react"
import { Input } from "@/components/ui/input"
import { InputShake, type InputShakeStatus } from "@/components/goodui/input-shake"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function WorkEmailField() {
  const [email, setEmail] = React.useState("")
  const [touched, setTouched] = React.useState(false)
  const [attempt, setAttempt] = React.useState(0)
  const error = !email ? "Enter your work email" : !EMAIL.test(email) ? "That email looks incomplete" : null
  const status: InputShakeStatus = !touched ? "idle" : error ? "invalid" : "valid"

  return (
    <form
      noValidate
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        setTouched(true)
        setAttempt((a) => a + 1)
      }}
    >
      <InputShake label="Work email" status={status} message={error} successMessage="Looks good" shakeKey={attempt}>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(true)} />
      </InputShake>
      <button type="submit">Create workspace</button>
    </form>
  )
}
```

### Native select with a hint

```tsx
<InputShake label="Plan" status={plan ? "valid" : touched ? "invalid" : "idle"} message="Pick a plan" hint="You can change it later.">
  <select className="h-9 w-full rounded-md border px-3" value={plan} onChange={(e) => setPlan(e.target.value)}>
    <option value="">Choose…</option>
    <option value="starter">Starter, $19/mo</option>
    <option value="pro">Pro, $49/mo</option>
  </select>
</InputShake>
```

## API

### InputShake

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| children (required) | `React.ReactElement<ChildProps>` | — | A single input-like element (native input, shadcn Input, select…). |
| status | `"idle" \| "invalid" \| "valid"` | `"idle"` | "invalid" shakes the field (on entry) and shows `message`; "valid" draws a check and shows `successMessage`. |
| message | `React.ReactNode` | — | Error text shown while invalid. |
| successMessage | `React.ReactNode` | — | Optional text shown while valid. |
| shakeKey | `number \| string` | — | Change this (e.g. a submit counter) to shake again while the field is still invalid. |
| label | `React.ReactNode` | — | Visible label rendered as a <label> linked to the child's id. |
| hint | `React.ReactNode` | — | Helper text shown when there is no message. |

Also accepts every <div> attribute.

## Accessibility

- label renders a <label> tied to the child's id (the child's own id is kept, or one is generated).
- The message (or hint) is linked to the child with aria-describedby, appended to any aria-describedby the child already has.
- While invalid the child gets aria-invalid and the error has role="alert", so it is read out when it appears. The success message has role="status", so it is announced politely.
- The error and check icons are decorative (aria-hidden); the text carries the meaning.

## Motion

- Becoming invalid shakes the field sideways for 0.42 s; changing shakeKey while still invalid shakes it again.
- The error icon spins in from -45° and scale 0.4 on a spring (stiffness 600, damping 22); the valid check draws its circle in 0.35 s and its tick in 0.25 s after a 0.18 s delay.
- The message slides down and grows to its height in 0.2 s; the hint only fades.
- Reduced motion: no shake, the icons and message only fade, and the check appears already drawn.

## Notes for AI

- Pass exactly one input-like element as children; it must accept id, className, aria-invalid and aria-describedby.
- The component does not validate. Compute status ("idle" | "invalid" | "valid") and message yourself.
- To shake on every failed submit, pass a counter as shakeKey and increment it in onSubmit.
- It adds pr-9 to the child for the icon; do not add your own icon on the right side.
- Keep status "idle" until the field is touched or submitted, so new forms do not open full of errors.

## FAQ

**Does it work with react-hook-form?**

Yes. Map fieldState.error to status="invalid" and message, and pass formState.submitCount as shakeKey.

**Why does it not shake on every keystroke?**

It shakes when status changes to invalid, or when shakeKey changes while invalid. Staying invalid while typing does not shake again.

## Related

- input: https://goodui.dev/components/core/input
- floating-label-input: https://goodui.dev/components/inputs/floating-label-input
- otp-input: https://goodui.dev/components/inputs/otp-input
- success-check: https://goodui.dev/components/feedback/success-check

Last updated: 2026-11-02
