# Hold to confirm

> Press-and-hold button for destructive actions: a fill sweeps across with the label flipping color at its edge, early release rewinds it, works with Space and Enter.

Hold to confirm button for React and shadcn: press and hold to delete

Page: https://goodui.dev/components/buttons/hold-to-confirm

## Install

```bash
npx shadcn@latest add @goodui/hold-to-confirm
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/hold-to-confirm.json`. The file lands in `components/goodui/hold-to-confirm.tsx`.

## When to use

- Destructive actions that should not happen by accident but do not deserve a dialog: delete a booking, remove a team member, cancel a subscription.
- Kiosk and touch screens (check-in, POS) where a confirm dialog is slow and easy to tap through.
- Confirming irreversible bulk actions inside a row or toolbar, where a modal would break the flow.

## When not to use

- Actions that need explanation or a typed confirmation (deleting a whole workspace): use a dialog such as morphing-dialog.
- Ordinary, reversible actions: use button, and offer undo in a toast-stack instead of slowing everyone down.
- Non-destructive async actions that need loading, success and error states: use stateful-button.

## Pick by what matters

| Need | Use |
| --- | --- |
| Delete or cancel | variant="destructive" (default) |
| Non-destructive but deliberate (publish, send to all clients) | variant="default" |
| Neutral surface | variant="outline" |
| Very serious action | duration={2500} |
| Stay in the done state | resetAfter={0} |

## Usage

```tsx
import { Trash2 } from "lucide-react"
import { HoldToConfirm } from "@/components/goodui/hold-to-confirm"

export function CancelBooking({ onCancel }: { onCancel: () => void }) {
  return (
    <HoldToConfirm
      onConfirm={onCancel}
      holdingLabel="Keep holding…"
      confirmedLabel="Booking cancelled"
      tapHint="Hold to cancel"
    >
      <Trash2 />
      Cancel booking
    </HoldToConfirm>
  )
}
```

### Publish to every client, primary color

```tsx
<HoldToConfirm variant="default" duration={1200} confirmedLabel="Published" onConfirm={publishSchedule}>
  Publish schedule to 48 clients
</HoldToConfirm>
```

## API

### HoldToConfirm

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| duration | `number` | `1500` | Milliseconds the button must be held. |
| onConfirm | `() => void` | — | Called once when the hold completes. There is no onClick: a tap only shows the hint. |
| variant | `"outline" \| "default" \| "destructive"` | `"destructive"` | "destructive" \| "default" \| "outline": resting look and fill color (red, primary, foreground). |
| size | `"sm" \| "md" \| "lg"` | `"md"` | "sm" \| "md" \| "lg": height, padding and corner radius. |
| holdingLabel | `React.ReactNode` | — | Label while holding. |
| confirmedLabel | `React.ReactNode` | — | Label after confirming. |
| tapHint | `React.ReactNode` | — | Shown briefly when the button is only tapped. |
| resetAfter | `number` | `2000` | Milliseconds before returning to idle after confirming; 0 stays confirmed. |
| labels | `Partial<HoldToConfirmLabels>` | — | Text for built-in controls and screen readers; pass translations here. |
| sound | `boolean \| SoundName` | — | Plays a "tick" when the hold starts and "confirm" when it completes, when the visitor has sounds on (lib/goodui-sounds); a sound name replaces the confirm. Off by default. |

Also accepts every <button> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Space / Enter (hold) | Starts filling on key down (auto-repeat ignored); releasing early rewinds it. |
| Tab | Moving focus away (blur) cancels a hold in progress. |

## Accessibility

- Renders a native <button type="button"> with aria-describedby pointing to a hidden "Press and hold for N seconds to confirm." hint (labels.instructions).
- An assertive live region announces the confirmed label when it is a string, otherwise "Confirmed" (labels.confirmed).
- The destructive variant's text and fill are darkened just enough to keep 4.5:1 contrast in light and dark.
- Works with mouse, touch and keyboard. The context menu and iOS callout are suppressed so a long touch does not open them.
- A quick tap shows tapHint and shakes gently, teaching the gesture instead of failing silently.

## Motion

- Holding sweeps a fill across the button with a linear clip-path over `duration` ms (1500); the fill carries its own copy of the label, so the text color flips exactly at the fill edge. Under dir="rtl" the fill sweeps from the right.
- Press scales to 0.97 on a spring; releasing early springs the fill back (stiffness 260, damping 30).
- Confirming pops the button (0.97 → 1.04 → 1 over 0.35 s) and vibrates for 25 ms where supported. After `resetAfter` ms (2000) the fill rewinds over 0.4 s.
- Reduced motion: the fill still tracks the hold (it is the progress indicator), but there is no scale, pop or shake, and rewinds are instant.

## Notes for AI

- Use onConfirm, not onClick: onClick is not accepted, and a normal click only shows the hint.
- duration and resetAfter are milliseconds; resetAfter={0} keeps the confirmed state.
- holdingLabel, confirmedLabel and tapHint are visible texts; built-in text comes from the labels prop (instructions(seconds), confirmed, and the confirmedLabel / tapHint defaults), so pass translations there.
- Variants are destructive (default), default, outline; sizes sm, md, lg.

## FAQ

**What happens if the user lets go early?**

The fill springs back to empty and nothing is called. If they let go within the first 20% it also shows tapHint and shakes.

**Is it safe for keyboard users?**

Yes. Holding Space or Enter fills it the same way, and moving focus away cancels.

## Related

- stateful-button: https://goodui.dev/components/buttons/stateful-button
- button: https://goodui.dev/components/core/button
- morphing-dialog: https://goodui.dev/components/overlays/morphing-dialog
- toast-stack: https://goodui.dev/components/feedback/toast-stack

Last updated: 2026-11-02
