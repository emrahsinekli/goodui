# Expandable card

> A card expands in place on a spring to reveal details, such as a staff profile with bookable slots or a plan's full feature list.

Expandable card for React and shadcn: card that expands in place to show details

Page: https://goodui.dev/components/cards/expandable-card

## Install

```bash
npx shadcn@latest add @goodui/expandable-card
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/expandable-card.json`. The file lands in `components/goodui/expandable-card.tsx`.

## When to use

- Staff or service cards that open to show bookable time slots, prices or a bio, without leaving the list.
- Pricing plans whose full feature list opens on demand.
- Settings sections and FAQ-style cards where each card is independent (several can be open).

## When not to use

- A list where only one section should be open at a time: use accordion-height.
- Details that deserve their own focus and backdrop (a full profile, a long form): use morphing-dialog or drawer-spring.
- Expanding table rows: use expandable-row-list.

## Pick by what matters

| Need | Use |
| --- | --- |
| Open by default | defaultOpen |
| Open state in your own state or URL | open={…} onOpenChange={…} |
| Custom indicator instead of the chevron | chevron={false} on ExpandableCardTrigger |

## Usage

```tsx
import { ExpandableCard, ExpandableCardContent, ExpandableCardTrigger } from "@/components/goodui/expandable-card"

const slots = ["09:00", "10:30", "13:00", "15:30"]

export function StylistCard() {
  return (
    <ExpandableCard className="w-full max-w-sm">
      <ExpandableCardTrigger>
        <span className="block font-medium">Maya Chen</span>
        <span className="block text-sm text-muted-foreground">Senior stylist · color specialist</span>
      </ExpandableCardTrigger>
      <ExpandableCardContent>
        <p className="text-sm text-muted-foreground">Next free slots on Friday:</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {slots.map((t) => (
            <button key={t} type="button" className="h-9 rounded-md border text-sm hover:bg-muted">
              {t}
            </button>
          ))}
        </div>
      </ExpandableCardContent>
    </ExpandableCard>
  )
}
```

### Controlled, one card open at a time

```tsx
const [openId, setOpenId] = React.useState<string | null>(null)

{plans.map((p) => (
  <ExpandableCard key={p.id} open={openId === p.id} onOpenChange={(o) => setOpenId(o ? p.id : null)}>
    <ExpandableCardTrigger>{p.name} · {p.price}</ExpandableCardTrigger>
    <ExpandableCardContent>
      <ul className="list-disc ps-5 text-sm">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
    </ExpandableCardContent>
  </ExpandableCard>
))}
```

## API

### ExpandableCard

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| open | `boolean` | — | Controlled open state. |
| defaultOpen | `boolean` | `false` | Initial open state when uncontrolled. |
| onOpenChange | `(open: boolean) => void` | — | Called when the trigger or Esc opens or closes the card. |

Also accepts every <div> attribute.

### ExpandableCardTrigger

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| chevron | `boolean` | `true` | Show the rotating chevron on the right. |

Also accepts every <button> attribute.

### ExpandableCardContent

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | On the trigger: opens or closes the card (native <button>). |
| Escape | Closes the card while focus is anywhere inside it; the event does not bubble further. |
| Tab | Moves through the trigger and then the content's controls when open. |

## Accessibility

- ExpandableCardTrigger is a real <button> with aria-expanded and aria-controls pointing to the content.
- ExpandableCardContent has role="region" named by the trigger (aria-labelledby) and is removed from the DOM when closed, so hidden controls are never tabbable.
- When Escape closes the card from inside the content, focus returns to the trigger.
- The chevron is aria-hidden; the trigger's text is its accessible name, so keep it descriptive.

## Motion

- The content grows to its natural height on a spring (stiffness 260, damping 32, mass 0.8) while fading in over 0.2 s; the inner content then rises 6px and fades in over 0.25 s after 0.05 s.
- The chevron rotates 180° on a spring (stiffness 300, damping 24). The card's shadow deepens over 300 ms when open.
- Closing runs the same animation in reverse.
- Reduced motion: content and chevron change instantly.

## Notes for AI

- Always compose the three parts: ExpandableCard > ExpandableCardTrigger + ExpandableCardContent. The parts throw outside an ExpandableCard.
- Padding is built in (p-4 on the trigger, px-4 pb-4 on the content); do not add padding to the card itself.
- Trigger children go in a flexible span next to the chevron; use block spans for title and subtitle lines.
- Do not put another button inside ExpandableCardTrigger: it is already a <button>.
- For accordion behavior (one open), control open from the parent as in the example.

## FAQ

**Can several cards be open at once?**

Yes, each card has its own state. Control open from a parent to allow only one.

**Does it animate to height: auto?**

Yes. The content's height animates with motion from 0 to auto, so it works with content of any size.

## Related

- accordion-height: https://goodui.dev/components/lists/accordion-height
- expandable-row-list: https://goodui.dev/components/lists/expandable-row-list
- morphing-dialog: https://goodui.dev/components/overlays/morphing-dialog
- card: https://goodui.dev/components/core/card

Last updated: 2026-11-02
