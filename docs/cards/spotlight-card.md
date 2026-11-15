# Spotlight card

> A soft spotlight and a lit border follow the pointer across a card; in a group, neighboring cards' borders light up too.

Spotlight card for React and shadcn: cursor-following glow and lit border

Page: https://goodui.dev/components/cards/spotlight-card

## Install

```bash
npx shadcn@latest add @goodui/spotlight-card
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/spotlight-card.json`. The file lands in `components/goodui/spotlight-card.tsx`.

## When to use

- Feature grids and bento layouts on a landing page, where a soft light following the cursor adds depth.
- A grid of plans, integrations or services where neighboring borders should light up together (SpotlightGroup).
- Dark sections, where the lit border reads especially well.

## When not to use

- A single card that also needs variants, tones, padding and header/footer parts: card with animation="spotlight" is simpler and gives the same effect.
- Clickable rows in dense lists and tables: use a plain hover background; a spotlight per row is noisy.
- Touch-first screens: the effect needs a hovering pointer. Use card or tilt-card for a press response.

## Pick by what matters

| Need | Use |
| --- | --- |
| One card with the effect | SpotlightCard |
| A grid where neighboring borders light up together | SpotlightGroup around SpotlightCards |
| Brand-colored light | spotlightColor="color-mix(in oklch, var(--primary) 12%, transparent)" borderColor="var(--primary)" |
| Card with a 2px border | borderWidth={2} plus border-2 |
| Single card with variants and tones | card with animation="spotlight" |

## Usage

```tsx
import { CalendarCheck, CreditCard, MessageSquare } from "lucide-react"
import { SpotlightCard, SpotlightGroup } from "@/components/goodui/spotlight-card"

const features = [
  { icon: CalendarCheck, title: "Online booking", text: "Clients pick a slot from your real availability." },
  { icon: MessageSquare, title: "SMS reminders", text: "Automatic reminders 24 hours and 2 hours before." },
  { icon: CreditCard, title: "Deposits", text: "Take a card deposit when the booking is made." },
]

export function Features() {
  return (
    <SpotlightGroup className="grid gap-4 sm:grid-cols-3">
      {features.map((f) => (
        <SpotlightCard key={f.title} className="p-6">
          <f.icon className="size-5 text-primary" />
          <h3 className="mt-4 font-semibold">{f.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
        </SpotlightCard>
      ))}
    </SpotlightGroup>
  )
}
```

### Single card in the brand color

```tsx
<SpotlightCard
  className="p-6"
  size={420}
  spotlightColor="color-mix(in oklch, var(--primary) 12%, transparent)"
  borderColor="var(--primary)"
>
  <h3 className="font-semibold">Pro plan</h3>
  <p className="text-sm text-muted-foreground">Unlimited staff and locations.</p>
</SpotlightCard>
```

## API

### SpotlightCard

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| spotlightColor | `string` | — | Fill color of the soft spotlight. |
| borderColor | `string` | — | Color of the lit border. |
| size | `number` | `360` | Diameter of the spotlight in px. |
| borderWidth | `number` | `1` | Border width the highlight should cover, in px (match the card's border). |

Also accepts every <div> attribute.

### SpotlightGroup

Also accepts every <div> attribute.

## Accessibility

- SpotlightCard is a plain <div> with card styles; the light is drawn with pseudo-elements that ignore the pointer and are not announced.
- If the whole card is clickable, put a real link or button inside it; the card itself is not focusable.
- The effect follows the pointer only; keyboard users see a normal card.

## Motion

- A soft radial fill (`size` px, 360) and a lit border ring (75% of that size) follow the pointer and fade in and out over 0.35 s.
- Inside a SpotlightGroup, moving anywhere over the group lights the borders of every card near the pointer, while only the hovered card gets the fill.
- The light follows the pointer directly; nothing loops.
- Reduced motion: the fade in and out is instant.

## Performance

- Pointer moves only write two CSS variables; React does not re-render. SpotlightGroup batches updates to one per animation frame.

## Notes for AI

- Put padding and layout on SpotlightCard with className (p-6 …); it already has rounded-xl, border, bg-card.
- SpotlightGroup is a plain div: give it the grid classes. Cards can be nested at any depth inside it.
- Colors are any CSS color; use translucent fills (color-mix with transparent), or the content gets washed out.
- Match borderWidth to the card's border width so the lit ring covers it exactly.

## FAQ

**Core card animation="spotlight" or SpotlightCard?**

For one card, the Core card is simpler and adds variants, tones and parts. SpotlightCard adds SpotlightGroup (linked borders across a grid) and custom colors, size and border width.

**Do the cards have to be direct children of SpotlightGroup?**

No. The group finds every SpotlightCard inside it at any depth, so wrappers and grid cells are fine.

## Related

- card: https://goodui.dev/components/core/card
- tilt-card: https://goodui.dev/components/cards/tilt-card
- glow-border: https://goodui.dev/components/cards/glow-border
- border-beam: https://goodui.dev/components/cards/border-beam

Last updated: 2026-11-02
