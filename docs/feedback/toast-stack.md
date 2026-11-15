# Toast stack

> Self-contained toaster with toast() API: cards stack and expand on hover, swipe away with a drag, morph from loading to success or error for promises, and pause their timers on hover.

Stacked toast notifications for React and shadcn: toast() API, swipe to dismiss, promise toasts

Page: https://goodui.dev/components/feedback/toast-stack

## Install

```bash
npx shadcn@latest add @goodui/toast-stack
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/toast-stack.json`. The file lands in `components/goodui/toast-stack.tsx`.

## When to use

- Short confirmations after an action: "Booking confirmed", "Invoice sent".
- Async work that should show loading, then success or error, in the same toast (toast.promise).
- Reversible actions with an Undo button ("Appointment cancelled" + Undo).
- Background events the user did not trigger directly, such as going offline.

## When not to use

- Errors the user must fix before going on (form validation): show them inline with input-shake or an alert.
- Persistent page-level state such as a trial ending: use an alert banner.
- A running list of activity the user can scroll back through: use animated-list.

## Pick by what matters

| Need | Use |
| --- | --- |
| Spinner that morphs into the result | toast.promise(...): the ring closes and the check or X draws in |
| Plain message | toast("Saved") |
| Outcome with an icon | toast.success / .error / .warning / .info |
| Async request | toast.promise(fn, { loading, success, error }) |
| Update an existing toast | toast(title, { id }) with the same id |
| Must stay until closed | duration: Infinity (loading toasts never close on their own) |
| Always show the full list | <Toaster expand /> |

## Usage

```tsx
// app/layout.tsx: mount the toaster once
import { Toaster } from "@/components/goodui/toast-stack"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}

// anywhere in a client component
import { toast } from "@/components/goodui/toast-stack"

function cancelAppointment(client: string, time: string) {
  toast("Appointment cancelled", {
    description: `${client} on ${time}`,
    duration: 6000,
    action: { label: "Undo", onClick: () => toast.success("Appointment restored") },
  })
}
```

### Loading, then success or error

```tsx
toast.promise(() => sendInvoice(1042), {
  loading: "Sending invoice #1042…",
  description: "Emailing a PDF to the client",
  success: (id) => `Invoice #${id} sent`,
  error: () => "Invoice #1042 could not be sent. Try again.",
  action: { label: "View", onClick: () => router.push("/invoices/1042") },
})
```

### Manual loading toast updated by id

```tsx
const id = toast.loading("Syncing Google Calendar…")
await sync()
toast.success("Calendar synced", { id })
```

### Translated toaster

```tsx
<Toaster position="top-center" labels={{ notifications: "Benachrichtigungen (Alt+T)", close: "Schließen" }} />
```

## API

### Toaster

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| position | `"top-left" \| "top-center" \| "top-right" \| "bottom-left" \| "bottom-center" \| "bottom-right"` | `"bottom-right"` | Screen corner or edge the stack is pinned to; top positions stack downward, bottom ones upward. |
| visibleToasts | `number` | `3` | Toasts visible in the collapsed stack. |
| duration | `number` | `4000` | Default auto-dismiss time in ms. |
| gap | `number` | `14` | Space between toasts when expanded, in px. |
| expand | `boolean` | `false` | Keep the stack expanded instead of expanding on hover. |
| showTimer | `boolean` | `true` | Thin bar showing the time left. |
| labels | `Partial<ToasterLabels>` | — | Text for built-in controls and screen readers; pass translations here. |
| sound | `boolean \| SoundName` | — | Plays a sound for each new toast by type (success, error, warning, otherwise "notify") when the visitor has sounds on (lib/goodui-sounds); a sound name is used for every type. Off by default. |

Also accepts every <section> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Alt+T | Moves focus to the newest toast (listened for on window while the Toaster is mounted). |
| Tab | Moves between toasts and their action and close buttons; focus inside the stack expands it and pauses timers. |
| Escape | Closes the focused toast, unless dismissible is false. |

## Accessibility

- The toaster is a <section> with aria-live="polite" and aria-relevant="additions text", labelled "Notifications (Alt+T)", so new toasts and text changes (a promise resolving) are announced.
- Each toast is a focusable list item; the close button has an aria-label from labels.close.
- Timers pause while the pointer is over the stack, while focus is inside it and while the tab is hidden, so nothing disappears while someone is reading it.
- Built-in strings (notifications, close) go through the labels prop for translation.

## Motion

- New toasts enter 24px from the edge at 0.96 scale; position, scale and height move on a spring (stiffness 380, damping 34, mass 0.9). Exit is a 180 ms fade to 0.94 scale.
- Collapsed, older toasts scale down 5% per level and peek out 10px each; hover or focus fans them out to their real heights.
- Dragging sideways fades the card; past 80px or a 600 px/s flick it flies off in 200 ms and closes. Otherwise it snaps back.
- When the type changes (loading to success), the icon pops in on a spring from 0.4 scale and -45° rotation. A thin bar at the bottom shrinks over the duration.
- Reduced motion: toasts fade without moving, the timer bar is hidden, the icon swap is a fade and the loading spinner slows to 2.4 s per turn.

## Performance

- The store is a tiny module-level list read with useSyncExternalStore; only the Toaster re-renders when toasts change. Timers are one setTimeout per visible toast, with the remaining time kept across pauses.

## Notes for AI

- Mount <Toaster /> exactly once (root layout); call toast() from anywhere on the client. The store is global, so a second Toaster would show the same toasts twice.
- toast() returns the id; toast.promise() returns the promise, not an id. Pass options.id to toast.promise if you need to dismiss it.
- Pass the promise as a function (() => save()) or a promise; success and error can be functions of the result or error.
- Only one action per toast; clicking it runs onClick and closes the toast. There is no cancel button option.
- Do not use toasts for validation errors or anything that needs a decision; they auto-close after 4 s by default.

## FAQ

**Is it compatible with Sonner?**

The call shapes are similar (toast(), toast.success, toast.promise, toast.dismiss) but it is a separate, self-contained store. Replace the import and keep one Toaster.

**What happens if the user closes a loading toast before the promise settles?**

It stays closed: the success or error update only applies if the toast is still in the list.

**How do I keep a toast open?**

Pass duration: Infinity, or use type loading. Updating a toast by id restarts its timer.

## Related

- alert: https://goodui.dev/components/core/alert
- animated-list: https://goodui.dev/components/lists/animated-list
- notification-badge: https://goodui.dev/components/feedback/notification-badge
- success-check: https://goodui.dev/components/feedback/success-check

Last updated: 2026-11-02
