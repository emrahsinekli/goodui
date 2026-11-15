# Alert

> Soft, solid, outline, left-accent, glass, neo and full-width banner alerts with tone-picked icons, actions, slide, fade, shake or pop entrances, smooth collapse on dismiss and a pausable auto-dismiss countdown.

Alert and banner for React and shadcn: dismissible, auto-dismiss countdown, 7 variants

Page: https://goodui.dev/components/core/alert

## Install

```bash
npx shadcn@latest add @goodui/alert
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/alert.json`. The file lands in `components/goodui/alert.tsx`.

## When to use

- A message tied to one page or section: a failed payment, an expiring trial, a sync that needs attention.
- Form-level errors above a form ("We could not save your changes") with a Retry action.
- A full-width announcement bar at the top of an app: variant="banner".
- Short confirmations that go away on their own: autoDismiss with a countdown bar that pauses on hover.

## When not to use

- Feedback that floats above the page after an action ("Booking saved"): use toast-stack.
- An error on one field: use the state and message props of input.
- A question that needs an answer before continuing: use a dialog such as morphing-dialog.

## Pick by what matters

| Need | Use |
| --- | --- |
| Inline message in a page or card | variant="soft" (default) with a tone |
| Critical problem the user must notice | variant="solid" tone="danger", animation="shake" when it appears after an action |
| Quiet note inside a dense settings page | variant="left-accent" or "outline", size="sm" |
| Site-wide announcement or trial notice | variant="banner" with actions and dismissible |
| Confirmation that clears itself | autoDismiss (5 s) or autoDismiss={8000}, tone="success" |
| Over a photo or gradient hero | variant="glass" |

## Usage

```tsx
import { Alert } from "@/components/goodui/alert"
import { Button } from "@/components/goodui/button"

export function PaymentFailed() {
  return (
    <Alert
      tone="danger"
      title="Your last payment failed"
      animation="slide-down"
      dismissible
      actions={
        <>
          <Button size="sm" tone="danger">
            Update card
          </Button>
          <Button size="sm" variant="ghost" tone="neutral">
            View invoice
          </Button>
        </>
      }
    >
      We could not charge the Visa ending in 4242 for $29.00. Online bookings pause in 3 days.
    </Alert>
  )
}
```

### Announcement banner

```tsx
<Alert variant="banner" tone="primary" dismissible actions={<a href="/billing" className="font-semibold underline">Upgrade</a>}>
  Your trial ends in 3 days. Keep online booking and SMS reminders.
</Alert>
```

### Auto-dismissing confirmation

```tsx
<Alert tone="success" autoDismiss={6000} animation="pop" title="Reminder sent" onDismiss={() => setSent(false)}>
  Maya gets an SMS 24 hours before her 09:30 appointment.
</Alert>
```

### Controlled

```tsx
const [open, setOpen] = React.useState(true)

<Alert open={open} onOpenChange={setOpen} dismissible tone="warning" title="Calendar sync paused">
  Reconnect Google Calendar to keep availability up to date.
</Alert>
```

## API

### Alert

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| variant | `"soft" \| "solid" \| "outline" \| "left-accent" \| "glass" \| "neo" \| "banner"` | `"soft"` | soft (default), solid, outline, left-accent stripe, frosted glass, neo-brutalist, or banner (full-width bar, centered, ignores size and shape). |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"info"` | Color and default icon. danger and warning use role="alert", the rest role="status". |
| shadow | `"none" \| "sm" \| "md" \| "lg"` | `"none"` | Drop shadow. Ignored by neo, which has its own offset shadow. |
| animation | `"none" \| "slide-down" \| "fade" \| "shake" \| "pop"` | `"none"` | Entrance animation, played on mount. |
| shape | `"square" \| "rounded" \| "pill"` | `"rounded"` |  |
| size | `"sm" \| "md" \| "lg"` | `"md"` |  |
| title | `React.ReactNode` | — | Bold first line; children render as the description under it. |
| icon | `React.ReactNode` | — | Replaces the tone's icon. |
| hideIcon | `boolean` | — | Hides the icon entirely. |
| actions | `React.ReactNode` | — | Buttons or links, shown under the text (inline on the banner). |
| dismissible | `boolean` | — | Shows a × button. |
| autoDismiss | `boolean \| number` | — | Close automatically after this many ms (true = 5000), with a countdown bar. Pauses on hover and focus. |
| open | `boolean` | — | Controlled visibility. |
| defaultOpen | `boolean` | `true` | Initial visibility when uncontrolled. |
| onOpenChange | `(open: boolean) => void` | — | Called with false when the × button or the auto-dismiss timer closes it. |
| onDismiss | `() => void` | — | Called after the collapse animation finishes. |
| fullWidth | `boolean` | `true` | false shrinks the alert to its content. |
| labels | `Partial<AlertLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Focusing anything inside the alert (an action or the × button) pauses autoDismiss until focus leaves. |
| Enter / Space | Activates the × button (native <button>). |

## Accessibility

- tone="danger" and "warning" render role="alert" (announced immediately); other tones render role="status".
- The tone icon is aria-hidden; the title and text carry the meaning.
- The × button has aria-label "Dismiss" (labels.dismiss). The countdown bar is aria-hidden.
- autoDismiss pauses while the pointer is over the alert or focus is inside it, so people can read it and reach its actions.

## Motion

- Entrance on mount: slide-down drops in 10px and fades in 350 ms, fade fades in 350 ms, pop scales from 0.94 with overshoot in 400 ms, shake shakes sideways for 500 ms.
- Dismiss: fades out in 180 ms while the height collapses over 280 ms (after an 80 ms delay), so content below slides up; onDismiss fires when it finishes.
- autoDismiss: a 3px bar shrinks linearly over the duration and freezes while paused.
- Reduced motion: no entrance animation and no transitions, the collapse is instant and the countdown bar is hidden (the timer still runs).

## Notes for AI

- Default is variant="soft" tone="info". tone picks the icon too (primary Sparkles, neutral Bell, success CircleCheck, warning TriangleAlert, danger CircleAlert, info Info); override with icon or hideIcon.
- children is the description; title is the bold line. Put buttons in actions, not in children.
- Uncontrolled alerts hide themselves on dismiss and come back when the string title or text changes. Use open and onOpenChange when the parent decides.
- autoDismiss={true} means 5000 ms; a number is milliseconds. It needs no dismissible to work.
- variant="banner" centers its content, shows actions inline and ignores size and shape. labels={{ dismiss: "Schließen" }} translates the × button.

## FAQ

**What is the difference between onOpenChange and onDismiss?**

onOpenChange(false) fires the moment the alert is closed (× or timer). onDismiss fires after the collapse animation, when the alert has left the layout.

**Can the banner stick to the top of the page?**

Yes. Wrap it in your own sticky container (for example <div className="sticky top-0 z-50">); the alert itself is not positioned.

## Related

- toast-stack: https://goodui.dev/components/feedback/toast-stack
- badge: https://goodui.dev/components/core/badge
- button: https://goodui.dev/components/core/button
- input: https://goodui.dev/components/core/input

Last updated: 2026-11-02
