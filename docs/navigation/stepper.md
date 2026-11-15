# Stepper

> Horizontal or vertical stepper where the connecting line fills between steps, numbers morph into drawn checkmarks, a current-step ring glides to the active step, errors shake, and completed steps are clickable.

Animated stepper for React and shadcn: horizontal or vertical steps with progress line and checkmarks

Page: https://goodui.dev/components/navigation/stepper

## Install

```bash
npx shadcn@latest add @goodui/stepper
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/stepper.json`. The file lands in `components/goodui/stepper.tsx`.

## When to use

- Multi-step forms and checkouts: Service → Staff → Time → Confirm.
- Onboarding checklists in a vertical layout, with each step's form or action opening under it.
- Showing where the user is in a process and letting them jump back to finished steps.

## When not to use

- Background work the user only watches: use multi-step-loader.
- Switching between independent views: use tabs-indicator.
- Plain completion percentage without named steps: use progress (variant="steps").

## Pick by what matters

| Need | Use |
| --- | --- |
| Wizard header above a form | orientation="horizontal" (default) |
| Checklist with inline actions | orientation="vertical" with content on steps |
| Allow going back only | clickable="completed" (default) |
| Free navigation between steps | clickable="all" |
| Read-only progress display | clickable="none" |
| Flag a failed step | error: true on that step |

## Usage

```tsx
import { Stepper } from "@/components/goodui/stepper"
import { Button } from "@/components/ui/button"

const steps = [
  { title: "Service", description: "Balayage + gloss" },
  { title: "Stylist", description: "Priya" },
  { title: "Time", description: "Thu 2:30 PM" },
  { title: "Confirm" },
]

export function BookingWizard({ step, setStep }: { step: number; setStep: (n: number) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <Stepper steps={steps} value={step} onValueChange={setStep} aria-label="Booking progress" />
      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
          Back
        </Button>
        <Button onClick={() => setStep(Math.min(steps.length, step + 1))}>
          {step === steps.length - 1 ? "Book" : "Continue"}
        </Button>
      </div>
    </div>
  )
}
```

### Vertical setup checklist with inline actions

```tsx
<Stepper
  orientation="vertical"
  value={step}
  onValueChange={setStep}
  aria-label="Setup checklist"
  steps={[
    { title: "Connect your calendar", description: "Google Calendar", content: <Button size="sm" onClick={next}>Connect</Button> },
    { title: "Add your services", description: "3 services, 30–120 min", content: <Button size="sm" onClick={next}>Save services</Button> },
    { title: "Share your link", description: "book.studio.co/lena", content: <Button size="sm" onClick={next}>Copy link</Button> },
  ]}
/>
```

### Payment step failed

```tsx
<Stepper
  value={2}
  clickable="none"
  aria-label="Checkout"
  steps={[{ title: "Cart" }, { title: "Details" }, { title: "Payment", error: paymentFailed }, { title: "Done" }]}
/>
```

## API

### Stepper

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| steps (required) | `StepperStep[]` | — | The steps, in order. |
| value | `number` | — | Index of the current step. Use `steps.length` to show every step as complete. |
| defaultValue | `number` | `0` | Starting step when uncontrolled. |
| onValueChange | `(index: number) => void` | — | Called with the step index when a clickable step is clicked. |
| orientation | `"horizontal" \| "vertical"` | `"horizontal"` | horizontal: steps in a row with titles under the circles. vertical: a column that can open content under the current step. |
| clickable | `"completed" \| "all" \| "none"` | `"completed"` | Which steps can be clicked to jump to them. |
| labels | `Partial<StepperLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <ol> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Moves between clickable steps (they are native buttons); other steps are not focusable. |
| Enter / Space | Jumps to the focused clickable step. |

## Accessibility

- Renders an <ol> of <li> items; the current one has aria-current="step". Pass aria-label on the stepper to name it.
- Each title is followed by an sr-only status ("completed", "current step", "not started", "needs attention"), translatable through labels.
- Clickable steps are real <button>s with a focus-visible ring; non-clickable steps are plain elements, so they are not in the tab order.
- The error state is shown by a red circle, a "!" mark and red title text, plus the sr-only status.

## Motion

- The line between two steps fills when the earlier one completes (0.45 s, ease [0.32, 0.72, 0, 1]).
- A completed step's number swaps for a check that draws in 300 ms while the circle pops to 1.14x and back in 0.4 s; an error step shakes sideways for 0.4 s.
- A soft ring around the current step glides to the next one through a shared layout animation (spring 300 / 30). Circle colors cross-fade over 300 ms.
- Vertical content under the current step opens to its height (0.4 s, no bounce).
- Reduced motion: no pop or shake, the check and lines appear at once, and the ring and content jump.

## Notes for AI

- value is the 0-based index of the current step; value={steps.length} shows every step complete.
- The stepper does not render Next/Back buttons or validate anything; keep the index in your state and change it from your own buttons.
- onValueChange only fires when a clickable step is clicked, not when you change value yourself.
- content only renders in the vertical orientation, under the current step.
- error overrides the status of that step wherever it is; clear it once the problem is fixed.

## FAQ

**Can users skip ahead?**

Only with clickable="all". The default "completed" lets them go back to finished steps but not forward.

**Does it work on mobile?**

The horizontal layout keeps every step in one row and hides descriptions below the sm breakpoint; for many steps or long titles use orientation="vertical".

## Related

- multi-step-loader: https://goodui.dev/components/feedback/multi-step-loader
- progress: https://goodui.dev/components/numbers/progress
- tabs-indicator: https://goodui.dev/components/navigation/tabs-indicator
- accordion-height: https://goodui.dev/components/lists/accordion-height

Last updated: 2026-11-02
