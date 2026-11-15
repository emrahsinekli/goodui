# OTP input

> One-time code input from plain inputs with auto-advance, paste and SMS autofill, a blinking caret and popping digits, then a pulsing verify, green success bounce or red shake.

OTP input (one-time code, 2FA, PIN) for React and shadcn

Page: https://goodui.dev/components/inputs/otp-input

## Install

```bash
npx shadcn@latest add @goodui/otp-input
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/otp-input.json`. The file lands in `components/goodui/otp-input.tsx`.

## When to use

- Email or SMS verification codes during sign-up, login or checkout.
- Two-factor codes from an authenticator app.
- Short PINs such as a front-desk or register unlock, with mask on.
- When you want built-in verifying, success and error states driven by one async onComplete.

## When not to use

- Passwords or codes of unknown length: use input with type="password".
- Long license or coupon keys with mixed separators: use input or floating-label-input.
- Showing validation on an ordinary field: use input-shake around an input.

## Pick by what matters

| Need | Use |
| --- | --- |
| 6-digit SMS or email code | defaults (length 6, allow="numeric", groupSize 3) |
| Letters and digits, e.g. backup codes | allow="alphanumeric" (input is upper-cased) |
| PIN that should not be read over a shoulder | mask groupSize={0} length={4} |
| Check the code on your server | onComplete={async (c) => (await verify(c))} returning true or false |
| Status decided outside the component | status="verifying" \| "success" \| "error" \| "idle" |

## Usage

```tsx
import { OtpInput } from "@/components/goodui/otp-input"

export function VerifyEmail({ email }: { email: string }) {
  return (
    <div className="grid justify-items-center gap-3 text-center">
      <p className="text-sm text-muted-foreground">
        We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
      </p>
      <OtpInput
        autoFocus
        name="code"
        onComplete={async (code) => {
          const res = await fetch("/api/verify-email", { method: "POST", body: JSON.stringify({ code }) })
          return res.ok
        }}
      />
    </div>
  )
}
```

### Masked 4-digit PIN with an instant check

```tsx
<OtpInput length={4} groupSize={0} mask aria-label="Front-desk PIN" onComplete={(pin) => pin === storedPin} />
```

### Controlled, with status from your own state

```tsx
const [code, setCode] = React.useState("")
const [status, setStatus] = React.useState<OtpStatus>("idle")

<OtpInput
  value={code}
  onValueChange={setCode}
  status={status}
  onComplete={async (c) => {
    setStatus("verifying")
    const ok = await verifyCode(c)
    setStatus(ok ? "success" : "error")
    return ok
  }}
/>
```

## API

### OtpInput

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| autoFocus | `boolean` | — | Focus the first cell on mount. |
| length | `number` | `6` | Number of cells. |
| value | `string` | — | Controlled code (no gaps, at most `length` characters). Pair with `onValueChange`. |
| defaultValue | `string` | `""` | Initial code when uncontrolled. |
| onValueChange | `(code: string) => void` | — | Called with the current code on every change, including paste, autofill and clear-on-error. |
| onComplete | `(code: string) => void \| boolean \| Promise<boolean \| void>` | — | Called once every cell is filled. Return (or resolve) `true` for success, `false` for error. While a returned promise is pending the cells pulse and are read-only. |
| status | `"idle" \| "verifying" \| "success" \| "error"` | — | Force a status from outside (e.g. after your own server check). |
| allow | `"numeric" \| "alphanumeric"` | `"numeric"` | Allowed characters. |
| mask | `boolean` | `false` | Show dots instead of characters (PINs). |
| groupSize | `number` | `3` | Put a separator after every N cells; 0 for none. |
| clearOnError | `boolean` | `true` | Empty the cells and refocus the first one after an error. |
| disabled | `boolean` | — |  |
| name | `string` | — | Form field name for a hidden input with the full code. |
| labels | `Partial<OtpInputLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| 0-9 (or letters with allow="alphanumeric") | Fills the cell and moves focus to the next one. |
| Backspace | Removes the character in the cell; on an empty cell removes the previous one and moves back. Later characters shift left. |
| Delete | Removes the character in the current cell; later characters shift left. |
| ArrowLeft / ArrowRight | Moves to the previous or next cell; ArrowRight only moves from a filled cell. |
| Home / End | Moves to the first cell, or to the first empty cell (the last cell when full). |

## Accessibility

- Cells are native <input> elements in a role="group" named by aria-label (default "Verification code"); each cell is labelled "Character n of length" through labels.character.
- The first cell has autoComplete="one-time-code", so iOS and Android can offer the SMS code; numeric mode sets inputMode="numeric".
- Verifying, success and error are announced in a polite role="status" region (labels.verifying, labels.success, labels.error). Cells get aria-invalid on error.
- Focusing a cell after the first empty one jumps to the first empty cell, so the code never has gaps.
- mask only hides the characters visually (dots); the inputs are not type="password".

## Motion

- Each digit pops in from below with a spring (stiffness 700, damping 26); an empty focused cell shows a caret blinking every 1.05 s.
- While a promise from onComplete is pending, the cells pulse in opacity on a 1 s loop, staggered by 90 ms per cell, and are read-only.
- Success bounces each cell up 6px for 0.4 s, staggered by 45 ms; error shakes the row for 0.45 s, and with clearOnError the cells empty and the first one is focused 650 ms later.
- Reduced motion: digits only fade, the caret stops blinking, and the pulse, bounce and shake are off. Clearing after an error still happens.

## Notes for AI

- Return true or false (or a promise of one) from onComplete; returning nothing leaves the status idle. A rejected promise counts as false.
- onComplete fires whenever the code becomes full, including paste, autofill and a parent setting value, so do not also call your verify from onValueChange.
- Pass status only if you manage it yourself; otherwise let onComplete drive it.
- Success and verifying lock the cells. To start over, set value to "" (controlled) or remount; there is no reset method.
- Do not render your own hidden input; use name to submit the code with a form.

## FAQ

**Does paste work?**

Yes. Pasted text is filtered to the allowed characters; a full-length paste always replaces the whole code, a shorter one fills from the focused cell.

**Does SMS autofill work?**

The first cell has autoComplete="one-time-code". When the browser fills it with the whole code, the code is spread over the cells and onComplete fires.

**How do I keep the wrong code visible after an error?**

Set clearOnError={false}. The row still shakes and the cells turn red.

## Related

- input-shake: https://goodui.dev/components/inputs/input-shake
- success-check: https://goodui.dev/components/feedback/success-check
- input: https://goodui.dev/components/core/input
- stepper: https://goodui.dev/components/navigation/stepper

Last updated: 2026-11-02
