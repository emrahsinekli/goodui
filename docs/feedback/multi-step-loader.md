# Multi-step loader

> Card or overlay that ticks through steps like "Reserving slot…" with spinners, drawn checkmarks and a filling rail, ending on an animated success state.

Multi-step loader for React and shadcn: step-by-step progress with checkmarks and success state

Page: https://goodui.dev/components/feedback/multi-step-loader

## Install

```bash
npx shadcn@latest add @goodui/multi-step-loader
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/multi-step-loader.json`. The file lands in `components/goodui/multi-step-loader.tsx`.

## When to use

- A request that runs several stages the user should see: check availability, reserve, charge deposit, send confirmation.
- Imports and migrations ("Reading clients.csv", "Merging 18 duplicates") shown as a blocking overlay until done.
- Turning a long wait into visible progress, ending on a clear success state with a next action.

## When not to use

- A single short request: use spinners in the button, or a toast-stack promise toast.
- Steps the user fills in and navigates between: use stepper.
- Progress measured in percent or bytes: use progress.

## Pick by what matters

| Need | Use |
| --- | --- |
| Compact progress, one surface | display="line" (default) |
| Every step visible | display="list" |
| Inline in a page or panel | variant="card" (default) |
| Block the page until done | variant="overlay" with open and onOpenChange |
| Driven by real work | step={index} (controlled); steps.length means done |
| Demo or optimistic timing | running with stepDuration={ms} or an array per step |
| Next action at the end | successAction={<Button …/>} |

## Usage

```tsx
import { MultiStepLoader } from "@/components/goodui/multi-step-loader"
import { Button } from "@/components/ui/button"

const steps = [
  { label: "Checking availability…", description: "Thu, Nov 6 · 2:30 PM with Priya" },
  { label: "Reserving your slot…", description: "Held for you for 10 minutes" },
  { label: "Charging the $40 deposit…", description: "Visa ending 4242" },
  { label: "Sending confirmation…", description: "Email and SMS to Maya Chen" },
]

export function BookingProgress({ step, onViewBooking }: { step: number; onViewBooking: () => void }) {
  return (
    <MultiStepLoader
      steps={steps}
      step={step}
      title="Booking Balayage + gloss"
      successTitle="You're booked"
      successDescription="Thu, Nov 6 · 2:30 PM · Glow Studio"
      successAction={
        <Button size="sm" onClick={onViewBooking}>
          View booking
        </Button>
      }
    />
  )
}
```

### Blocking import overlay

```tsx
<MultiStepLoader
  variant="overlay"
  open={open}
  onOpenChange={setOpen}
  steps={["Reading clients.csv", "Matching 1,240 clients", "Merging 18 duplicates", "Importing visit history"]}
  stepDuration={850}
  title="Importing from Square"
  successTitle="1,222 clients imported"
  successAction={<Button size="sm" onClick={() => setOpen(false)}>Done</Button>}
/>
```

### Timed steps with a pause

```tsx
<MultiStepLoader steps={steps} running={!paused} stepDuration={[1100, 900, 1300, 1000]} onComplete={() => track("booking_done")} />
```

## API

### MultiStepLoader

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| steps (required) | `MultiStep[]` | — | Steps in order: a string, or { label, description } where the description shows under the active step. |
| step | `number` | — | Controlled active step (0-based). steps.length means everything is done. |
| running | `boolean` | — | Auto-advance while true (uncontrolled only). |
| stepDuration | `number \| number[]` | — | Ms per step when auto-advancing. A number per step is allowed. |
| onStepChange | `(step: number) => void` | — | Called with the new step index when auto-advancing (uncontrolled mode only). |
| onComplete | `() => void` | — | Called once every step is done. |
| title | `React.ReactNode` | — | Heading while the steps run. |
| successTitle | `React.ReactNode` | — | Heading on the final success state, next to an animated check. |
| successDescription | `React.ReactNode` | — | Line under successTitle. |
| successAction | `React.ReactNode` | — | Rendered under the success message, e.g. a "View booking" button. |
| variant | `"card" \| "overlay"` | `"card"` | "overlay" covers the page with a blurred backdrop and a centered card. |
| display | `"line" \| "list"` | — | "line" (default) is one surface whose text and width morph per step; "list" shows every step as a checklist. |
| open | `boolean` | `true` | Overlay only. |
| onOpenChange | `(open: boolean) => void` | — | Overlay only. Esc and the backdrop close it once all steps are done. |
| labels | `Partial<MultiStepLoaderLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Escape | Overlay only: closes it through onOpenChange(false), but only after every step is done. |
| Tab / Shift+Tab | Overlay only: cycles through focusable elements inside the dialog (e.g. successAction); focus cannot leave it. |

## Accessibility

- An sr-only role="status" polite region announces the current step label (when it is a string) and then successTitle, or "Done" when successTitle is not a string.
- The overlay is role="dialog" with aria-modal, labelled by the title; it takes focus on open, keeps Tab and Shift+Tab inside, and gives focus back to the previously focused element on close.
- The "Step x of n" line and the fallback announcements go through labels (stepOf, done) for translation.

## Motion

- The active step shows a spinner turning every 0.8 s. A finished step pops into a green circle (spring 520 / 24 from 0.4 scale) and its check draws in 280 ms.
- The line to the next step fills top-down in 350 ms after a 100 ms delay; the header rail fills on a spring (stiffness 300, damping 30).
- The active step's description opens to its height in 220 ms. At the end the header slides to a success-check and the successAction row opens after 200 ms.
- Overlay: the backdrop fades in 200 ms and the card springs from 0.95 scale (stiffness 420, damping 32).
- Reduced motion: icons, lines, descriptions and the overlay change with fades or instantly; the spinner keeps turning, slower (2.4 s).

## Notes for AI

- Pick one mode: controlled (step, you advance it as work finishes) or timed (running + stepDuration). onStepChange only fires in timed mode.
- step is 0-based and step === steps.length means done; that is when onComplete fires and the success state shows.
- The overlay cannot be dismissed while running; Esc and backdrop clicks only close it after the last step. Give successAction a close button.
- To restart a timed run, change its key; there is no reset method.
- Keep step labels short and present-tense with an ellipsis ("Reserving your slot…"); put details in description.
- labels={{ stepOf: (s, n) => `Schritt ${s} von ${n}`, done: "Fertig" }} translates the built-in text; title and successTitle are props.

## FAQ

**How do I tie it to a real API call?**

Keep the step index in state, pass it as step, and increment it as each stage of your request resolves. Set it to steps.length when the last one finishes.

**Can a step fail?**

There is no error state. On failure, close the overlay or replace the card and show the error with an alert or a toast.

## Related

- success-check: https://goodui.dev/components/feedback/success-check
- progress: https://goodui.dev/components/numbers/progress
- stepper: https://goodui.dev/components/navigation/stepper
- spinners: https://goodui.dev/components/feedback/spinners

Last updated: 2026-11-02
