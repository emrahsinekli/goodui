# Popover morph

> A small button such as "Add note" morphs into a floating form panel, its label sliding into the header, and shrinks back into the button on save, Esc or an outside click.

Popover that morphs from a button into a floating form, for React and shadcn

Page: https://goodui.dev/components/overlays/popover-morph

## Install

```bash
npx shadcn@latest add @goodui/popover-morph
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/popover-morph.json`. The file lands in `components/goodui/popover-morph.tsx`.

## When to use

- Quick input tied to one button: add a note to a booking, set a reminder, apply a discount code.
- Toolbars and record headers where a full dialog would interrupt the page.
- Small settings that should close as soon as the user clicks elsewhere.

## When not to use

- A list of actions or options: use dropdown-stagger, which has menu roles and arrow-key navigation.
- Read-only hints on hover: use tooltip-animated.
- Larger forms or anything that must not be lost on an outside click: use drawer-spring or morphing-dialog, which are modal.

## Pick by what matters

| Need | Use |
| --- | --- |
| Trigger near the top of the page | side="bottom" (default): the panel grows down from the trigger |
| Trigger near the bottom (composer, footer bar) | side="top": the panel grows up |
| Trigger at the right end of a toolbar | align="end" |
| Narrow panel for one field | width={280} |

## Usage

```tsx
import * as React from "react"
import { StickyNote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { PopoverMorph } from "@/components/goodui/popover-morph"

export function AddNote({ onAdd }: { onAdd: (text: string) => void }) {
  const [draft, setDraft] = React.useState("")

  return (
    <PopoverMorph label={<><StickyNote /> Add note</>} title={<><StickyNote /> Note for Sofia</>}>
      {({ close }) => (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!draft.trim()) return
            onAdd(draft.trim())
            setDraft("")
            close()
          }}
          className="space-y-2.5"
        >
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Prefers a cooler tone than last time." rows={3} />
          <Button type="submit" size="sm" className="w-full">
            Save note
          </Button>
        </form>
      )}
    </PopoverMorph>
  )
}
```

### Discount code at the end of a toolbar

```tsx
<PopoverMorph
  label={<><TicketPercent /> {discount ?? "Discount"}</>}
  title={<><TicketPercent /> Apply a code</>}
  align="end"
  width={280}
>
  {({ close }) => (
    <form onSubmit={(e) => { e.preventDefault(); apply(code); close() }} className="flex gap-2">
      <Input data-autofocus value={code} onChange={(e) => setCode(e.target.value)} placeholder="WELCOME10" />
      <Button type="submit">Apply</Button>
    </form>
  )}
</PopoverMorph>
```

### Controlled, opening upward from a footer bar

```tsx
<PopoverMorph side="top" open={open} onOpenChange={setOpen} label={<><BellRing /> Remind</>}>
  <p className="text-sm text-muted-foreground">We will text the client 1 hour before.</p>
</PopoverMorph>
```

## API

### PopoverMorph

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| label (required) | `React.ReactNode` | — | Trigger content; it slides into the panel header when the popover opens. |
| children (required) | `React.ReactNode \| ((api: { close: () => void }) => React.ReactNode)` | — | Panel body. Pass a function to get close(), e.g. to close after a form submits. |
| title | `React.ReactNode` | — | Header text inside the panel. Defaults to the label. |
| open | `boolean` | — | Controlled open state. Pair with onOpenChange. |
| defaultOpen | `boolean` | `false` | Initial open state when uncontrolled. |
| onOpenChange | `(open: boolean) => void` | — | Called with the next state on trigger click, close(), Esc, an outside click or tabbing out. |
| side | `"bottom" \| "top"` | `"bottom"` | The panel grows down from the trigger, or up for "top". |
| align | `"start" \| "end"` | `"start"` | Preferred edge (logical: start is the left edge in LTR, the right edge in RTL); it flips when the panel would leave the viewport. |
| width | `number` | `320` | Panel width in px (capped to the viewport). |
| triggerClassName | `string` | — | Classes for the trigger button. |
| panelClassName | `string` | — | Classes for the floating panel. |
| labels | `Partial<PopoverMorphLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | On the trigger (a native <button>): opens the panel and focuses the first [data-autofocus] or focusable element in the body. |
| Esc | Closes the panel and returns focus to the trigger. |
| Tab | Moves through the panel; tabbing out of it closes the panel. |

## Accessibility

- The trigger has aria-haspopup="dialog", aria-expanded, and aria-controls pointing at the panel while it is open.
- The panel has role="dialog" and is named by its header (title, or label when no title is given). It is non-modal: no focus trap and no scroll lock.
- The close button is labelled labels.close (default "Close").
- An outside click closes the panel without moving focus; Esc and the close button return focus to the trigger.

## Motion

- The trigger and the panel share one surface (layoutId), so the button grows into the panel on a spring (bounce 0.1, 0.38 s) and shrinks back on close. The label slides into the panel header.
- The close button pops in from scale 0.6; the body fades up 4px after a 60 ms delay (200 ms) and fades out in 60 ms.
- Reduced motion: the morph and the body appear without movement (duration 0).

## Notes for AI

- Pass the trigger content through label (icon + text), not as children; children is the panel body.
- Use the function child ({ close }) => … when a form should close after submitting; close() returns focus to the trigger.
- The panel is absolutely positioned inside an inline-block wrapper and covers the trigger while open. Give the parent room and do not clip it with overflow: hidden.
- align is logical (start = left in LTR, right in RTL) and only flips between start and end when the panel would leave the viewport; there is no vertical flip, so choose side yourself.
- The body unmounts whenever the panel closes (outside click, focus leaving), so keep draft state in the parent, as in the example, and keep long forms in a drawer or dialog.

## FAQ

**Why does the panel cover the button?**

It grows out of the button: the panel starts at the trigger's edge, so the label can slide straight into the header.

**Do I have to use the render function?**

No. Plain children work too; the panel then closes through its close button, Esc, an outside click, or your own open state.

## Related

- dropdown-stagger: https://goodui.dev/components/overlays/dropdown-stagger
- tooltip-animated: https://goodui.dev/components/overlays/tooltip-animated
- morphing-dialog: https://goodui.dev/components/overlays/morphing-dialog
- drawer-spring: https://goodui.dev/components/overlays/drawer-spring

Last updated: 2026-11-02
