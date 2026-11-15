# Morphing dialog

> A service card expands into a booking dialog, with its image, title and price flying into place through a shared-layout spring, then folds back into the card on Esc or backdrop click.

Morphing dialog for React and shadcn: a card that expands into a modal

Page: https://goodui.dev/components/overlays/morphing-dialog

## Install

```bash
npx shadcn@latest add @goodui/morphing-dialog
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/morphing-dialog.json`. The file lands in `components/goodui/morphing-dialog.tsx`.

## When to use

- A grid of cards (services, plans, products, team members) where opening one should show its details without losing the user's place.
- Detail views that reuse the card's own image, title and price, so the move from card to dialog explains itself.
- Booking or checkout steps that start from a card: pick a time, confirm, close back into the card.

## When not to use

- Confirmations and plain forms opened from a button: a regular shadcn Dialog is clearer; there is no card to morph from.
- Long forms or lists on phones: use drawer-spring, which gives a bottom sheet with snap points.
- A small form tied to one button (add a note, apply a code): use popover-morph, which stays non-modal.

## Pick by what matters

| Need | Use |
| --- | --- |
| No swipe to close | dragToDismiss={false} on MorphingDialogContent |
| A card opens into a full detail dialog | morphing-dialog |
| A card grows in place, inside the page flow | expandable-card |
| A button opens a small floating form | popover-morph |
| Mobile-first sheet with half and full heights | drawer-spring |

## Usage

```tsx
import * as React from "react"
import { CalendarCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  MorphingDialog,
  MorphingDialogClose,
  MorphingDialogContainer,
  MorphingDialogContent,
  MorphingDialogDescription,
  MorphingDialogMedia,
  MorphingDialogSubtitle,
  MorphingDialogTitle,
  MorphingDialogTrigger,
} from "@/components/goodui/morphing-dialog"

export function ServiceCard() {
  const [open, setOpen] = React.useState(false)

  return (
    <MorphingDialog open={open} onOpenChange={setOpen}>
      <MorphingDialogTrigger className="max-w-xs shadow-xs hover:shadow-md">
        <MorphingDialogMedia className="h-24 bg-gradient-to-br from-amber-300 to-rose-400" />
        <span className="block p-4">
          <MorphingDialogTitle>Balayage and gloss</MorphingDialogTitle>
          <MorphingDialogSubtitle>2 h 30 min · $185</MorphingDialogSubtitle>
        </span>
      </MorphingDialogTrigger>

      <MorphingDialogContainer>
        <MorphingDialogContent>
          <MorphingDialogClose />
          <MorphingDialogMedia className="h-40 shrink-0 bg-gradient-to-br from-amber-300 to-rose-400" />
          <div className="overflow-y-auto p-6">
            <MorphingDialogTitle>Balayage and gloss</MorphingDialogTitle>
            <MorphingDialogSubtitle>2 h 30 min · $185</MorphingDialogSubtitle>
            <MorphingDialogDescription className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Hand-painted highlights finished with a toning gloss and blow-dry. Includes a 10 minute consultation.
              </p>
              <Button className="w-full" onClick={() => setOpen(false)}>
                <CalendarCheck /> Book Tue 10:00 AM
              </Button>
            </MorphingDialogDescription>
          </div>
        </MorphingDialogContent>
      </MorphingDialogContainer>
    </MorphingDialog>
  )
}
```

### Focus a specific control when it opens

```tsx
<MorphingDialogDescription>
  <input data-autofocus placeholder="Promo code" className="h-9 w-full rounded-md border px-3" />
</MorphingDialogDescription>
```

### Slower, bouncier morph and a translated close button

```tsx
<MorphingDialog transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}>
  {/* MorphingDialogTrigger as above */}
  <MorphingDialogContainer>
    <MorphingDialogContent>
      <MorphingDialogClose labels={{ close: "Schließen" }} />
      {/* media, title, subtitle, description */}
    </MorphingDialogContent>
  </MorphingDialogContainer>
</MorphingDialog>
```

## API

### MorphingDialog

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| children (required) | `React.ReactNode` | — | Content. |
| open | `boolean` | — | Controlled open state. Pair with onOpenChange. |
| defaultOpen | `boolean` | `false` | Initial open state when uncontrolled. |
| onOpenChange | `(open: boolean) => void` | — | Called with the next state when the trigger, Esc, the backdrop or a close control opens or closes it. |
| transition | `Transition` | — | Transition for the shared-layout morph. Reduced motion always snaps. |

### MorphingDialogTrigger

Also accepts every <motion.button> attribute.

### MorphingDialogContainer

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| children (required) | `React.ReactNode` | — | Content. |
| className | `string` | — | Classes for the fixed layer that centers the dialog (padding, alignment). |
| backdropClassName | `string` | — | Classes for the backdrop. |

### MorphingDialogContent

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| dragToDismiss | `boolean` | `true` | Drag the media or the grip down to close, with a flick or past a quarter of the height. Off with reduced motion. |

Also accepts every <motion.div> attribute.

### MorphingDialogMedia

Also accepts every <motion.div> attribute.

### MorphingDialogTitle

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| children (required) | `React.ReactNode` | — | Content. |
| className | `string` | — | Classes merged onto the root element. |

### MorphingDialogSubtitle

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| children (required) | `React.ReactNode` | — | Content. |
| className | `string` | — | Classes merged onto the root element. |

### MorphingDialogDescription

Also accepts every <motion.div> attribute.

### MorphingDialogClose

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| labels | `Partial<MorphingDialogLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <button> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | On the card (a native <button>): opens the dialog. |
| Esc | Closes the dialog; focus returns to the card. |
| Tab / Shift+Tab | Cycles through the focusable elements inside the dialog; focus cannot leave it while open. |

## Accessibility

- The trigger is a real <button> with aria-haspopup="dialog" and aria-expanded.
- The content has role="dialog" and aria-modal="true"; MorphingDialogTitle becomes its accessible name and MorphingDialogDescription its description.
- On open, focus moves to the first [data-autofocus] element, else the first focusable element, else the dialog itself. On close, focus goes back to the card.
- Page scroll is locked while the dialog is open.
- MorphingDialogClose without children gets aria-label from labels.close (default "Close").

## Motion

- The card's surface, MorphingDialogMedia, MorphingDialogTitle and MorphingDialogSubtitle share layoutIds, so each flies from its place in the card to its place in the dialog on a spring (bounce 0.12, 0.42 s). Override it with the transition prop.
- The backdrop fades in and out over 200 ms. MorphingDialogDescription fades up 10px after an 80 ms delay (250 ms) and fades out in 80 ms on close.
- The card stays above its neighbours until it has flown back into place.
- Reduced motion: the morph snaps (duration 0) and the description appears without moving; only the backdrop still fades.

## Notes for AI

- Put the same MorphingDialogMedia, MorphingDialogTitle and MorphingDialogSubtitle in both the trigger and the content; parts that only exist on one side do not morph.
- The trigger is a <button>: lay out its text with <span> elements (as the dialog parts do) and never nest another button or a link in it.
- Set corner radius with style={{ borderRadius }} on the trigger or content, not a rounded-* class, or the corners distort during the morph.
- The dialog is position: fixed without a portal. Do not render it inside an element with transform or filter.
- Always include MorphingDialogTitle in the content (it names the dialog) and MorphingDialogDescription for the detail body (aria-describedby points to it only while it is rendered).

## FAQ

**Can I have many cards on one page?**

Yes. Wrap each card in its own MorphingDialog; layout ids are scoped per instance with useId.

**How do I close it after an action?**

Control it with open and onOpenChange and set open to false in your handler, or render MorphingDialogClose with your own children.

## Related

- expandable-card: https://goodui.dev/components/cards/expandable-card
- drawer-spring: https://goodui.dev/components/overlays/drawer-spring
- popover-morph: https://goodui.dev/components/overlays/popover-morph
- card: https://goodui.dev/components/core/card

Last updated: 2026-11-02
