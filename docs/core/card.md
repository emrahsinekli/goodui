# Card

> Eight surfaces (elevated, glass, gradient border, neo, inset…) with shadow, padding, radius and accent stripes, plus hover layers (lift, 3D tilt, pointer spotlight, glow, scale) and a looping border beam.

Card component for React and shadcn: 8 surfaces, hover tilt, spotlight and border beam

Page: https://goodui.dev/components/core/card

## Install

```bash
npx shadcn@latest add @goodui/card
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/card.json`. The file lands in `components/goodui/card.tsx`.

## When to use

- Grouping one thing on a dashboard or settings page: a plan, a booking, a client, a report.
- Pricing and feature grids where one card should stand out (accent, gradient-border, shadow="glow").
- Clickable tiles that need hover feedback (lift, tilt, spotlight) without another library.
- Empty states and drop zones: variant="dashed".

## When not to use

- A single KPI with a delta and sparkline: use stat-card, which is built on the same look.
- Content that opens into a bigger view: use expandable-card or morphing-dialog.
- Splitting sections of one long form: a separator keeps the page lighter than a stack of cards.

## Pick by what matters

| Need | Use |
| --- | --- |
| Default dashboard surface | variant="elevated" (default) or "outline" for flat UIs |
| Grouped settings inside a page that is already a card | variant="inset" or "soft" |
| The recommended pricing plan | variant="gradient-border" or accent="top" with shadow="glow" |
| Status or category color on a list of cards | accent="left" with a tone |
| Clickable tiles in a grid | animation="lift" (calm) or "spotlight" (pointer-following border light) |
| Hero or showcase card on a marketing page | animation="tilt" or "border-beam" |
| Over photos or gradients | variant="glass" |
| Empty state or upload area | variant="dashed" |

## Usage

```tsx
import { CalendarPlus } from "lucide-react"
import { Card, CardFooter } from "@/components/goodui/card"
import { Badge } from "@/components/goodui/badge"
import { Button } from "@/components/goodui/button"

export function NextBooking() {
  return (
    <Card
      className="max-w-sm"
      accent="left"
      tone="success"
      icon={<CalendarPlus />}
      title="Balayage with Maya"
      description="Tomorrow, 09:30 · Chair 2"
      action={<Badge tone="success">Paid</Badge>}
      footer={
        <>
          <Button size="sm">Check in</Button>
          <Button size="sm" variant="ghost" tone="neutral">
            Reschedule
          </Button>
        </>
      }
    >
      2 hours · $180 deposit received. Client asked for a patch test.
    </Card>
  )
}
```

### Featured pricing plan

```tsx
<Card variant="gradient-border" shadow="glow" animation="lift" title="Studio" description="For teams up to 10 stylists">
  <p className="text-3xl font-semibold">$29<span className="text-sm text-muted-foreground">/month</span></p>
  <CardFooter separated>
    <Button className="w-full">Start free trial</Button>
  </CardFooter>
</Card>
```

### Media card with parts

```tsx
<Card padding="sm" animation="spotlight" tone="info">
  <CardMedia>
    <img src="/reports/october.png" alt="Revenue chart for October" />
  </CardMedia>
  <CardHeader>
    <CardTitle>October revenue</CardTitle>
    <CardDescription>Up 12% on September</CardDescription>
  </CardHeader>
</Card>
```

## API

### Card

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| variant | `"elevated" \| "outline" \| "soft" \| "glass" \| "gradient-border" \| "neo" \| "inset" \| "dashed"` | `"elevated"` | Surface: elevated (default), outline, soft tint, frosted glass, gradient border, neo-brutalist, inset well or dashed. |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"primary"` | Color for the accent stripe, glow, soft tint, gradient border, hover light and icon tile. |
| shadow | `"none" \| "sm" \| "md" \| "lg" \| "xl" \| "glow"` | `"none"` | Drop shadow; glow uses the tone color. Ignored by neo, which has its own offset shadow. |
| animation | `"none" \| "lift" \| "tilt" \| "spotlight" \| "glow" \| "border-beam" \| "scale"` | `"none"` | Motion layer. lift, scale and glow react to hover; tilt and spotlight follow the pointer; border-beam is not a hover effect: it loops a light around the border continuously (off with reduced motion). |
| padding | `"none" \| "sm" \| "md" \| "lg"` | `"md"` | Inner spacing and gap between parts; CardMedia and separated footers bleed by this amount. |
| radius | `"none" \| "sm" \| "md" \| "lg" \| "xl" \| "2xl"` | `"lg"` |  |
| accent | `"none" \| "top" \| "left"` | `"none"` | A tone-colored stripe on the top or left edge. |
| grain | `boolean` | — | Fine film grain over the surface. |
| fullWidth | `boolean` | `true` | false shrinks the card to its content. |
| title | `React.ReactNode` | — | Shorthand: renders a CardHeader with this title. |
| description | `React.ReactNode` | — | Shorthand: muted line under the title. |
| icon | `React.ReactNode` | — | Shorthand: icon in a tinted tile beside the title. |
| action | `React.ReactNode` | — | Shorthand: element on the right of the header (a badge, a menu button). |
| footer | `React.ReactNode` | — | Shorthand: renders a CardFooter. |

Also accepts every <div> attribute.

### CardHeader

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| icon | `React.ReactNode` | — | Icon shown in a tinted tile on the left. |
| action | `React.ReactNode` | — | Element on the right (badge, menu, button). |

Also accepts every <div> attribute.

### CardTitle

Also accepts every <h3> attribute.

### CardDescription

Also accepts every <p> attribute.

### CardContent

Also accepts every <div> attribute.

### CardFooter

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| separated | `boolean` | — | Full-bleed top border above the footer. |

Also accepts every <div> attribute.

### CardMedia

Also accepts every <div> attribute.

## Accessibility

- Renders a plain <div>; the title shorthand and CardTitle render an <h3>. If your heading order needs another level, put your own heading inside CardHeader instead of CardTitle.
- The header icon tile is aria-hidden; put the meaning in the title.
- A focus ring is styled for keyboard focus, but the card is not focusable by default. If the whole card is clickable, put a real <a> or <button> inside rather than adding onClick to the div.

## Motion

- lift: rises 4px with a deeper shadow in 250 ms (neo cards shift up-left into a bigger offset shadow). scale: grows to 1.02 in 250 ms. glow: a tone-colored ring and bloom fade in over 300 ms.
- tilt: rotates up to 4° on X and 5° on Y toward the pointer with a soft glare, and eases back in 500 ms on leave.
- spotlight: a tone-colored light and a brighter border follow the pointer and fade in over 300 ms.
- border-beam: a light runs around the border every 4 s, all the time, not only on hover.
- Touch pointers do not trigger tilt or spotlight.
- Reduced motion: transforms and transitions are off, so lift, scale and tilt do not move and border-beam is hidden. Spotlight and glow still appear, without fading.

## Performance

- tilt and spotlight write CSS variables on pointermove (no React re-render). border-beam animates a registered @property angle, so keep it to one or two cards per screen.

## Notes for AI

- Layers are independent props: variant, tone, shadow, animation, padding, radius, accent. tone colors accent, glow, soft tint, gradient-border, spotlight, beam and the icon tile.
- For the common layout use the shorthand props (title, description, icon, action, footer). Use the parts (CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardMedia) for custom layouts; do not mix the shorthand header with a second CardHeader.
- A string child is wrapped in CardContent only when a header is present; other children render as they are.
- CardMedia and CardFooter separated go full-bleed using the card padding, so they need padding other than "none".
- shadow is ignored on variant="neo", which has its own offset shadow. fullWidth={false} shrinks the card to its content.

## FAQ

**Is it compatible with shadcn's Card?**

The parts have the same names (CardHeader, CardTitle, CardDescription, CardContent, CardFooter) and data-slot attributes, plus CardMedia and the layer props. CardAction is replaced by the action prop on Card or CardHeader.

**Why does my tilt card not move on a phone?**

Tilt and spotlight ignore touch pointers on purpose, so scrolling a list of cards does not wobble them.

## Related

- stat-card: https://goodui.dev/components/core/stat-card
- spotlight-card: https://goodui.dev/components/cards/spotlight-card
- tilt-card: https://goodui.dev/components/cards/tilt-card
- border-beam: https://goodui.dev/components/cards/border-beam

Last updated: 2026-11-02
