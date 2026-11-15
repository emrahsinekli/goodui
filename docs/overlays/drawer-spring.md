# Spring drawer

> A bottom sheet with half and full snap points plus side drawers on a spring; drag the handle and the release speed picks the snap point or closes it, while the backdrop fades with the drag.

Draggable bottom sheet and side drawer for React and shadcn with spring snap points

Page: https://goodui.dev/components/overlays/drawer-spring

## Install

```bash
npx shadcn@latest add @goodui/drawer-spring
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/drawer-spring.json`. The file lands in `components/goodui/drawer-spring.tsx`.

## When to use

- Detail panels on mobile, such as a booking or an order, that open at half height and drag up to full height.
- Side forms that keep the page visible behind them: a new client, an invoice line, filters.
- A left navigation drawer for small screens.

## When not to use

- A short confirmation or a single question: a centered dialog is faster to read; use morphing-dialog when it starts from a card.
- A small form tied to one button: use popover-morph, which is non-modal and stays next to its trigger.
- A list of actions on an item: use dropdown-stagger.

## Pick by what matters

| Need | Use |
| --- | --- |
| Multi-step flow on one sheet | animateHeight, then swap the children per step |
| Page sinks behind the sheet | scaleBackground and data-drawer-wrapper on your page root, with the drawer outside it |
| Mobile detail view that can grow | side="bottom" snapPoints={[0.5, 1]} |
| Sheet that fits its content | side="bottom" with no snapPoints (max 88dvh) |
| Form or editor next to the page | side="right" with footer for the actions |
| App navigation on small screens | side="left" |
| Must not close by accident (unsaved work) | dismissible={false}: no Esc, close button, backdrop close or drag-to-close |

## Usage

```tsx
import * as React from "react"
import { CalendarClock, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DrawerSpring } from "@/components/goodui/drawer-spring"

export function BookingSheet() {
  const [open, setOpen] = React.useState(false)
  const [snap, setSnap] = React.useState(0)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <CalendarClock /> Booking details
      </Button>
      <DrawerSpring
        open={open}
        onOpenChange={setOpen}
        snapPoints={[0.55, 1]}
        onSnapChange={setSnap}
        title="Sofia Martinez"
        description={`Balayage and gloss · Tue 14 Nov, 2:30 PM · ${snap === 1 ? "full" : "half"} height`}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              <XCircle /> Cancel booking
            </Button>
            <Button className="flex-1" onClick={() => setOpen(false)}>
              Check in
            </Button>
          </div>
        }
      >
        <ul className="space-y-3 text-sm">
          <li>2 h 30 min with Maya Chen</li>
          <li>Deposit paid: $40 of $185</li>
          <li>Note: prefers a cooler tone than last time.</li>
        </ul>
      </DrawerSpring>
    </>
  )
}
```

### Side form drawer with a footer submit

```tsx
<DrawerSpring
  side="right"
  open={open}
  onOpenChange={setOpen}
  title="New client"
  description="They get a welcome email with your booking link."
  footer={<Button type="submit" form="new-client" className="w-full">Save client</Button>}
>
  <form id="new-client" onSubmit={saveClient} className="space-y-3">
    <Input data-autofocus name="name" placeholder="Full name" />
    <Input name="email" type="email" placeholder="Email" />
  </form>
</DrawerSpring>
```

### Navigation drawer from the left

```tsx
<DrawerSpring side="left" open={nav} onOpenChange={setNav} title="Glow Studio" description="Hayes Valley">
  <nav className="flex flex-col gap-1">
    {["Calendar", "Clients", "Reports"].map((item) => (
      <button key={item} type="button" onClick={() => setNav(false)} className="rounded-lg px-3 py-2 text-start hover:bg-muted">
        {item}
      </button>
    ))}
  </nav>
</DrawerSpring>
```

## API

### DrawerSpring

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| title (required) | `React.ReactNode` | — | Heading of the drawer; it is also the dialog's accessible name. |
| open | `boolean` | — | Controlled open state. Pair with onOpenChange. |
| defaultOpen | `boolean` | `false` | Initial open state when uncontrolled. |
| onOpenChange | `(open: boolean) => void` | — | Called with false on Esc, the close button, a backdrop click or a drag past the lowest point. |
| side | `"bottom" \| "right" \| "left"` | `"bottom"` | "bottom" is a sheet with optional snap points; "right" and "left" are full-height side drawers. |
| snapPoints | `number[]` | — | Bottom sheet only: visible fractions of the sheet height, e.g. [0.5, 1] for half and full. |
| defaultSnap | `number` | `0` | Snap point index used when the sheet opens. |
| onSnapChange | `(index: number) => void` | — | Called with the index into the sorted snapPoints after a drag or a handle press moves the sheet. |
| description | `React.ReactNode` | — | Line under the title, linked to the dialog with aria-describedby. |
| footer | `React.ReactNode` | — | Sticky area under the scrolling body, for actions. |
| dismissible | `boolean` | `true` | When true (default), Esc, the close button, a backdrop click and dragging past the lowest point close the drawer. When false, none of them do and the close button is hidden: close it from your own controls (e.g. the footer). |
| animateHeight | `boolean` | `false` | Bottom sheet without snapPoints: the sheet morphs to the height of its content, so a multi-step flow keeps one surface. Swap the children and it follows. |
| scaleBackground | `boolean \| string` | `false` | The page behind scales down and rounds while the drawer is open, following the drag. true targets `[data-drawer-wrapper]`, a string is your own selector. Render the drawer outside that element. |
| className | `string` | — | Classes for the panel (width, height, radius). |
| bodyClassName | `string` | — | Classes for the scrolling body that wraps children. |
| children | `React.ReactNode` | — | Content. |
| labels | `Partial<DrawerSpringLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

## Keyboard

| Keys | Action |
| --- | --- |
| Esc | Closes the drawer unless dismissible is false; focus returns to the element that had it before opening. |
| Tab / Shift+Tab | Cycles through focusable elements inside the drawer; focus cannot leave it while open. |
| Enter / Space | On the grab handle of a bottom sheet with two or more snapPoints: moves to the next snap point, wrapping back to the lowest. |

## Accessibility

- The panel has role="dialog" and aria-modal="true", named by title and described by description when you pass one.
- On open, focus goes to the first [data-autofocus] element, else the first focusable element after the grab handle (usually the close button). Add data-autofocus to a field if typing comes first.
- With snap points, the handle is a button labelled labels.expand or labels.collapse ("Expand sheet" / "Collapse sheet"); without them it is hidden from assistive tech and the tab order.
- The close button is labelled labels.close (default "Close") and is hidden when dismissible is false. Page scroll is locked while open.

## Motion

- Open, close and snap use a spring (stiffness 380, damping 38, mass 0.9) that starts with the release velocity of the drag; closing uses a stiffer spring (420 / 42).
- Dragging the header (handle, title, close row) moves the panel 1:1, with a rubber-band resistance past fully open. The body scrolls normally.
- On release the panel goes to the snap point nearest to where the throw would land (position + velocity × 0.2 s); a flick faster than 700 px/s always moves at least one step. With dismissible, closed is one of the targets.
- The backdrop opacity follows the panel between the lowest snap point and closed, so it fades while you drag down.
- Reduced motion: open, close and snap jump instantly (duration 0); dragging still follows the pointer.

## Performance

- Dragging updates a motion value, so the panel and backdrop move without React re-renders until release.

## Notes for AI

- title is required; it is the dialog's accessible name. Use description for one line of context.
- snapPoints only apply to side="bottom"; they are fractions of the sheet height (0 to 1) and are sorted ascending, so onSnapChange indexes refer to the sorted list.
- Put actions in footer, not at the end of children, so they stay visible while the body scrolls.
- It renders position: fixed without a portal: do not place it inside elements with transform or filter.
- dismissible={false} disables Esc, backdrop click and drag-to-close and hides the close button, so always give the user an explicit way out (e.g. Cancel / Save in footer).

## FAQ

**Does onSnapChange fire when the sheet opens?**

No. It fires after a drag release or a handle press moves the sheet. The opening snap point is defaultSnap.

**Can I drag it from the body?**

No. Only the header area drags, so scrolling content inside the body never fights the gesture.

## Related

- morphing-dialog: https://goodui.dev/components/overlays/morphing-dialog
- popover-morph: https://goodui.dev/components/overlays/popover-morph
- dropdown-stagger: https://goodui.dev/components/overlays/dropdown-stagger
- bottom-nav: https://goodui.dev/components/navigation/bottom-nav

Last updated: 2026-11-02
