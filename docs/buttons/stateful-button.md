# Stateful button

> Async button that morphs idle to spinner to drawn check or shaking error, with a spring width change between labels.

Async loading button for React and shadcn: spinner, success check and error shake

Page: https://goodui.dev/components/buttons/stateful-button

## Install

```bash
npx shadcn@latest add @goodui/stateful-button
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/stateful-button.json`. The file lands in `components/goodui/stateful-button.tsx`.

## When to use

- Any action that calls the server and should report the result in place: save settings, send invoice, charge card.
- Form submits where a toast would be too far from the button ("Saved" right where the user clicked).
- Retry flows: after an error the button shakes, shows "Try again" and is clickable again.

## When not to use

- Only a spinner, no success or error state: button with loading is simpler and keeps all variants and tones.
- Destructive actions that need a deliberate gesture: use hold-to-confirm.
- Results that need more than two words (validation messages, partial failures): show them in alert or toast-stack.

## Pick by what matters

| Need | Use |
| --- | --- |
| The handler returns a promise | onClick={async () => …} (states run by themselves) |
| State comes from your own data layer (React Query, server actions) | state={…} and onStateChange |
| Keep "Done" on screen | resetAfter={0} |
| Text while loading | loadingText="Sending…" |
| Secondary placement | variant="outline" or "secondary" |

## Usage

```tsx
import { Send } from "lucide-react"
import { StatefulButton } from "@/components/goodui/stateful-button"

export function SendInvoiceButton({ invoiceId }: { invoiceId: string }) {
  return (
    <StatefulButton
      loadingText="Sending…"
      successText="Invoice sent"
      errorText="Try again"
      onClick={async () => {
        const res = await fetch("/api/invoices/" + invoiceId + "/send", { method: "POST" })
        if (!res.ok) throw new Error("Send failed")
      }}
    >
      <Send />
      Send invoice
    </StatefulButton>
  )
}
```

### Controlled by your own mutation state

```tsx
const [state, setState] = React.useState<StatefulButtonState>("idle")

<StatefulButton
  state={state}
  onStateChange={setState}
  onClick={() => {
    setState("loading")
    saveSettings().then(() => setState("success"), () => setState("error"))
  }}
>
  Save settings
</StatefulButton>
```

### Keep the success state

```tsx
<StatefulButton variant="outline" resetAfter={0} successText="Connected" onClick={connectCalendar}>
  Connect Google Calendar
</StatefulButton>
```

## API

### StatefulButton

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| onClick | `(event: React.MouseEvent<HTMLButtonElement>) => void \| Promise<unknown>` | — | Return a promise to drive the states: pending → loading, resolved → success, rejected → error. |
| state | `"idle" \| "loading" \| "success" \| "error"` | — | Control the state yourself instead. |
| onStateChange | `(state: StatefulButtonState) => void` | — | Called on every state change, including the automatic return to idle. |
| variant | `"outline" \| "default" \| "secondary"` | `"default"` | "default" \| "outline" \| "secondary": idle look; success turns emerald and error destructive in every variant. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | "sm" \| "md" \| "lg": height, text size and padding. |
| loadingText | `React.ReactNode` | — | Shown next to the spinner while loading; empty by default (spinner only). |
| successText | `React.ReactNode` | — | Shown next to the drawn check after success. |
| errorText | `React.ReactNode` | — | Shown next to the drawn cross after a failure; clicking again retries. |
| resetAfter | `number` | `2200` | Milliseconds before success/error returns to idle; 0 keeps it. |
| labels | `Partial<StatefulButtonLabels>` | — | Text for built-in controls and screen readers; pass translations here. |
| sound | `boolean \| SoundName` | — | Plays "tap" on click, then "success" or "error" with the result, when the visitor has sounds on (lib/goodui-sounds); a sound name replaces the tap. Off by default. |

Also accepts every <button> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | Runs onClick (native <button>). Ignored while loading or showing success. |
| Tab | Moves focus; a focus ring shows on keyboard focus only. |

## Accessibility

- A polite live region announces "Working…", "Done" or "Something went wrong" (labels.loading / success / error) as the state changes.
- The success (emerald-700) and error fills keep white text at 4.5:1 in light and dark.
- While loading it sets aria-busy; while loading or showing success it sets aria-disabled and ignores clicks, but stays focusable.
- The spinner, check and cross are aria-hidden SVGs; the visible text comes from children, loadingText, successText and errorText.

## Motion

- Labels swap with a vertical slide and a 3px blur on a spring (stiffness 500, damping 34); the button width springs to the new label (stiffness 420, damping 34).
- Success draws a check in 0.3 s; error draws a cross stroke by stroke and shakes the button sideways over 0.42 s.
- Success and error return to idle after `resetAfter` ms (2200), unless the state is controlled.
- Reduced motion: labels cross-fade in 0.1 s, the width changes instantly, there is no shake or tap scale, and the check and cross appear already drawn. The spinner keeps turning, slower.

## Notes for AI

- Make onClick return a promise (an async function) to get the automatic states; a handler that returns nothing leaves the button idle.
- Throw or reject to show the error state; returning a value or resolving shows success.
- When you pass state, the button is controlled: it never resets by itself, so set it back to "idle" yourself.
- Built-in text comes from the labels prop: loading, success and error (screen reader messages) plus successText and errorText (default visible texts). The successText and errorText props still override the visible text.
- Import the StatefulButtonState type from the same file when typing controlled state.

## FAQ

**How do I show an error message?**

errorText shows a short label like "Try again". For a full message, catch the error in your handler, show it in an alert or toast, and rethrow so the button shows the error state.

**Can I translate the screen reader announcements?**

Not through props yet: the live region uses fixed English strings. The visible texts are all props.

## Related

- button: https://goodui.dev/components/core/button
- hold-to-confirm: https://goodui.dev/components/buttons/hold-to-confirm
- success-check: https://goodui.dev/components/feedback/success-check
- toast-stack: https://goodui.dev/components/feedback/toast-stack

Last updated: 2026-11-02
