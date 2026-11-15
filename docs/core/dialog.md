# Dialog & Sheet

> Modal dialog, alert dialog and sheet in one: default, soft, glass and neo surfaces in six tones; center, top, start/end/left/right and draggable bottom sheets, fullscreen, and a phone override to fullscreen or sheet; scale, slide, blur, fade or morph-from-trigger entrances; async confirm with spinner and inline error, type-to-confirm, nested dialogs that step back, focus trap and restore, and scroll lock without layout shift.

Accessible React dialog, alert dialog and sheet in one component: async confirm, nested dialogs, morph animation

Page: https://goodui.dev/components/core/dialog

## Install

```bash
npx shadcn@latest add @goodui/dialog
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/dialog.json`. The file lands in `components/goodui/dialog.tsx`.

## When to use

- A task that needs the user's full attention before going back to the page: edit an appointment, invite a teammate, pay an invoice.
- Confirming a destructive or costly action: role="alertdialog" with onConfirm, and confirmPhrase for things like deleting a workspace.
- Side panels for details and filters (placement="end" or "start") and mobile bottom sheets (placement="bottom", or mobile="sheet" on a center dialog).
- Actions that call a server: return a promise from onConfirm and the dialog shows a spinner, waits, and keeps the error on screen if it throws.

## When not to use

- Small anchored content the user can ignore (a date filter, a share menu): use popover; it doesn't block the page.
- A short hint on hover or focus: use tooltip.
- Feedback that needs no answer ("Saved"): use a toast or alert; a modal interrupts for nothing.
- Long multi-page flows: give them their own route; a dialog is for one focused task.

## Pick by what matters

| Need | Use |
| --- | --- |
| Confirm a destructive action | role="alertdialog" tone="danger" with onConfirm (+ confirmPhrase for irreversible ones) |
| A form | placement="center" (default) with children; mobile="fullscreen" for long forms on phones |
| Details or filters beside the page | placement="end" (or "start"); they follow the reading direction |
| Phones | mobile="sheet" turns a center dialog into a draggable bottom sheet under 640px |
| Command palette or search | placement="top" size="lg" |
| Delight on a marketing page | animation="morph" (grows out of the trigger) or "blur" |
| On photos or colorful backgrounds | variant="glass" with overlay="blur" |
| Playful or retro brands | variant="neo" |

## Usage

```tsx
import { Trash2 } from "lucide-react"
import { Button } from "@/components/goodui/button"
import { Dialog } from "@/components/goodui/dialog"

export function DeleteClient({ onDelete }: { onDelete: () => Promise<void> }) {
  return (
    <Dialog
      role="alertdialog"
      tone="danger"
      icon={<Trash2 />}
      title="Delete client?"
      description="Omar Haddad and his 14 past bookings will be removed. This can't be undone."
      confirmText="Delete client"
      onConfirm={onDelete}
      trigger={
        <Button variant="soft" tone="danger">
          Delete client
        </Button>
      }
    />
  )
}
```

### Form dialog with a custom footer and close()

```tsx
<Dialog
  title="Edit appointment"
  description="Changes are texted to the client."
  mobile="fullscreen"
  trigger={<Button variant="outline">Edit</Button>}
  footer={({ close }) => (
    <>
      <Button variant="ghost" tone="neutral" onClick={close}>Cancel</Button>
      <Button onClick={async () => { await save(); close() }}>Save</Button>
    </>
  )}
>
  <AppointmentForm />
</Dialog>
```

### Side sheet

```tsx
<Dialog placement="end" size="md" title="Invite to your team" trigger={<Button>Invite</Button>}>
  {({ close }) => <InviteForm onSent={close} />}
</Dialog>
```

### Type to confirm, with an error from the server

```tsx
<Dialog
  role="alertdialog"
  tone="danger"
  title="Cancel your subscription?"
  confirmPhrase="CANCEL"
  confirmText="Cancel subscription"
  onConfirm={async () => {
    const res = await fetch("/api/subscription", { method: "DELETE" })
    if (!res.ok) throw new Error("Couldn't reach billing. Nothing was changed.")
  }}
  trigger={<Button variant="ghost" tone="danger">Cancel plan</Button>}
/>
```

### Controlled, opened from code

```tsx
const [open, setOpen] = React.useState(false)

<Dialog open={open} onOpenChange={setOpen} placement="bottom" title="Pick a time">
  {({ close }) => <Slots onPick={(t) => { book(t); close() }} />}
</Dialog>
```

### Nested dialog

```tsx
<Dialog title="Edit appointment" trigger={<Button>Edit</Button>}>
  <Dialog size="sm" title="Choose a stylist" trigger={<Button size="xs" variant="soft">Change</Button>}>
    {({ close }) => <StylistList onPick={close} />}
  </Dialog>
</Dialog>
```

## API

### Dialog

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| trigger | `React.ReactElement<TriggerProps>` | — | Element that opens the dialog (a button). It gets aria-haspopup, aria-expanded and aria-controls, and morph grows out of it. |
| open | `boolean` | — | Open state (controlled). |
| defaultOpen | `boolean` | `false` | Initial open state when uncontrolled. |
| onOpenChange | `(open: boolean) => void` | — |  |
| role | `"dialog" \| "alertdialog"` | `"dialog"` | alertdialog: for confirmations that interrupt. Outside click does not close it, there is no × by default, and focus starts on Cancel. |
| title | `React.ReactNode` | — | Heading; names the dialog for screen readers. Without it, pass aria-label. |
| description | `React.ReactNode` | — | Muted text under the title; describes the dialog for screen readers. |
| icon | `React.ReactNode` | — | Icon in a tone-tinted tile above or beside the title. |
| children | `React.ReactNode \| ((api: DialogApi) => React.ReactNode)` | — | Body. A function receives { close }. |
| footer | `React.ReactNode \| ((api: DialogApi) => React.ReactNode)` | — | Custom footer; replaces the built-in Cancel / Confirm buttons. A function receives { close }. |
| variant | `"default" \| "soft" \| "glass" \| "neo"` | `"default"` | Surface: default, soft (tone tint), glass (frosted) or neo (thick border, hard shadow). |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"primary"` | Accent for the icon tile, confirm button, soft tint and focus ring. |
| placement | `"center" \| "top" \| "start" \| "end" \| "left" \| "right" \| "bottom" \| "fullscreen"` | `"center"` | Where it appears. Sheets slide from their edge with any animation except fade, blur and none. |
| mobile | `"same" \| "fullscreen" \| "sheet"` | `"same"` | Below 640px, a center or top dialog can become fullscreen or a bottom sheet. |
| size | `"sm" \| "md" \| "lg" \| "xl" \| "full"` | `"md"` | Width for dialogs and side sheets, max width for the bottom sheet. full fills the screen. |
| radius | `"none" \| "sm" \| "md" \| "lg" \| "xl"` | `"lg"` |  |
| shadow | `"none" \| "sm" \| "md" \| "lg" \| "xl"` | `"lg"` | Drop shadow. Ignored by neo, which has its own offset shadow. |
| animation | `"none" \| "fade" \| "scale" \| "slide" \| "morph" \| "blur"` | `"scale"` | How it enters and leaves. morph grows out of the trigger (falls back to scale without one). Reduced motion uses a short fade. |
| overlay | `"dim" \| "blur" \| "none"` | `"dim"` | Backdrop: dim (default), blur (frosted page) or none (transparent, still blocks the page). |
| showClose | `boolean` | — | × button in the corner. Default: true for dialog, false for alertdialog. |
| closeOnEsc | `boolean` | `true` | Esc closes. When false (or while confirming), Esc gives a small bump instead. |
| closeOnOutsideClick | `boolean` | — | Click on the backdrop closes. Default: true for dialog, false for alertdialog. |
| dragToClose | `boolean` | `true` | Bottom sheet: drag the handle down to close. |
| scaleBackground | `boolean` | `false` | While open, the page behind steps back: it scales to .98 and rounds its corners. Skipped for nested dialogs and reduced motion. |
| onConfirm | `() => unknown` | — | Shows Cancel and Confirm. May return a promise: the button shows a spinner and the dialog waits; a throw keeps it open and shows the error. |
| confirmText | `React.ReactNode` | — | Confirm button text (default labels.confirm). |
| cancelText | `React.ReactNode` | — | Cancel button text (default labels.cancel). |
| confirmTone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | — | Confirm button tone; defaults to tone. |
| closeOnConfirm | `boolean` | `true` | Close after onConfirm succeeds. |
| confirmPhrase | `string` | — | The user must type this exact text before Confirm is enabled (deleting a workspace). |
| initialFocus | `React.RefObject<HTMLElement \| null>` | — | Element to focus on open. Default: an autoFocus element, Cancel for alertdialog, the first field or button, else the panel. |
| returnFocus | `boolean` | `true` | Return focus to the element that had it before opening. |
| sound | `boolean \| SoundName` | — | Plays "open" and "close" when the visitor has sounds on (lib/goodui-sounds); a sound name replaces the open sound. Off by default. |
| labels | `Partial<DialogLabels>` | — | Text for built-in controls; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | On the trigger: opens the dialog (native button). |
| Tab / Shift+Tab | Moves focus inside the dialog; at the last or first control it wraps around. |
| Esc | Closes the top dialog only. With closeOnEsc={false}, or while onConfirm is running, the panel gives a small bump instead. |
| Enter | In the type-to-confirm field: confirms once the phrase matches. |

## Accessibility

- The panel has role="dialog" (or "alertdialog") and aria-modal="true", is named by the title (aria-labelledby) and described by the description (aria-describedby). Without a title, pass aria-label.
- The trigger gets aria-haspopup="dialog", aria-expanded and aria-controls.
- Focus moves in on open: initialFocus, else an autoFocus or data-autofocus element, else the type-to-confirm field, else Cancel for alertdialog (the least destructive choice), else the first control in the body, else the panel. It returns to the element that had it before opening.
- Tab and Shift+Tab are trapped inside the panel. The page behind is not made inert; aria-modal tells assistive tech to stay in the dialog, and the backdrop blocks pointer input.
- While onConfirm runs, the panel has aria-busy and the confirm button is disabled with a spinner. A thrown error is shown in a role="alert" message.
- The × button is a real button named by labels.close; the drag handle of the bottom sheet is decorative (Esc and the backdrop still close it).
- Every built-in string (Close, Cancel, Confirm, the type-to-confirm label, the generic error) comes from labels, so it can be translated. start/end sheets and the panel follow the reading direction.

## Motion

- Enter (Web Animations, easing cubic-bezier(.23,1,.32,1)): scale from 0.96 in 240 ms, slide up 24px in 300 ms, blur from 14px in 320 ms, fade in 180 ms, morph from the trigger's box in 420 ms. Sheets slide in on the drawer curve in 420 ms. Exit runs at 70% of the enter time. When the content changes size, the panel height eases over 260 ms. scaleBackground scales the page to 0.98 and rounds it.
- Exit plays the entrance backwards in 60% of the time. The backdrop fades in over 220 ms and out with the panel. Morph shrinks back into the trigger.
- Nested: the dialog behind steps back (scale 0.94, up 14px) with a 320 ms transition. A refused close (alertdialog backdrop, Esc while confirming) bumps the panel to 1.025 for 240 ms.
- Bottom sheets follow the finger when dragged by the handle and close when let go past 35% of their height or 140px, whichever is less, or on a quick downward flick.
- Reduced motion: every entrance becomes a 140 ms fade (100 ms out), the dialog behind steps back without a transition, and there is no bump. animation="none" adds no animation at all.

## Performance

- Nothing is rendered until the dialog opens; the portal unmounts after the exit animation.
- Animations run on transform and opacity through the Web Animations API. blur also animates filter, and glass uses backdrop-filter; both cost more on low-end phones.
- Scroll lock is shared: any number of open dialogs set overflow hidden on <html> once and restore it when the last one closes. scrollbar-gutter: stable (or padding where unsupported) keeps the page from shifting.

## Notes for AI

- Pass the opener as trigger={<Button>…</Button>}; do not wrap Dialog in your own click handler. For dialogs opened from code use open + onOpenChange.
- For confirmations pass onConfirm (sync or async) instead of building Cancel/Confirm buttons; throw an Error to keep the dialog open and show its message.
- Use role="alertdialog" for destructive confirmations; it turns off outside-click close and the × button by default.
- children and footer can be functions receiving { close }; use them to close after an action inside the dialog.
- Sheets are placement="start" | "end" | "left" | "right" | "bottom"; prefer start/end so RTL works.
- Always give a title (or aria-label). Do not add role or aria-modal yourself.
- Do not nest a Dialog's trigger inside another interactive element.

## FAQ

**Can I open it without a trigger?**

Yes. Leave out trigger and control it with open and onOpenChange. morph then grows out of whatever had focus when it opened.

**How do I stop it from closing?**

closeOnEsc={false} and closeOnOutsideClick={false}. While an onConfirm promise is pending, Esc and the backdrop are ignored automatically.

**Does it work inside a scrolling container or a transformed parent?**

Yes. It renders into document.body through a portal, so overflow and transforms of parents don't clip it.

**Why does my page not jump when the dialog opens?**

The scroll lock keeps a stable scrollbar gutter (or adds padding equal to the scrollbar width in browsers without scrollbar-gutter).

## Related

- popover: https://goodui.dev/components/core/popover
- tooltip: https://goodui.dev/components/core/tooltip
- button: https://goodui.dev/components/core/button
- alert: https://goodui.dev/components/core/alert
- morphing-dialog: https://goodui.dev/components/overlays/morphing-dialog
- drawer-spring: https://goodui.dev/components/overlays/drawer-spring

Last updated: 2026-11-03
