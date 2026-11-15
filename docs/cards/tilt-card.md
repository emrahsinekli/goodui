# Tilt card

> Tilts toward the pointer on a spring with a moving glare, a shifting shadow and layers that float at their own depth.

3D tilt card for React and shadcn: hover tilt with glare and parallax layers

Page: https://goodui.dev/components/cards/tilt-card

## Install

```bash
npx shadcn@latest add @goodui/tilt-card
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/tilt-card.json`. The file lands in `components/goodui/tilt-card.tsx`.

## When to use

- Showcase cards on a landing page: a pricing plan, a product shot, a gift card or membership card.
- Cards with layered content (badge, avatar, price) that should float at different depths with TiltCardLayer.
- Portfolio and template galleries, where a tactile hover invites a click.

## When not to use

- A card that only needs a simple tilt plus variants, tones and header/footer parts: card with animation="tilt" is simpler. Use TiltCard for springs, glare control and depth layers.
- Data-heavy cards (tables, charts, forms): tilting makes text harder to read and click. Use card with animation="lift".
- Large grids of many cards: one tilting card draws the eye, twenty feel restless. Use spotlight-card with SpotlightGroup.

## Pick by what matters

| Need | Use |
| --- | --- |
| Holographic membership card | foil |
| Moves on touch and still pages | autoplay |
| Subtle, app-friendly tilt | maxTilt={6} scale={1.01} |
| Dramatic showcase | maxTilt={15} perspective={600} |
| No glare | glare={false} |
| Floating badge or image | <TiltCardLayer depth={40}>…</TiltCardLayer> |
| Turn it off conditionally | disabled |

## Usage

```tsx
import { TiltCard, TiltCardLayer } from "@/components/goodui/tilt-card"

export function MembershipCard() {
  return (
    <TiltCard className="w-80 bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-white">
      <TiltCardLayer depth={20}>
        <p className="text-xs tracking-widest text-white/70 uppercase">Glow Studio</p>
      </TiltCardLayer>
      <TiltCardLayer depth={50} className="mt-10">
        <p className="text-2xl font-semibold">Gold membership</p>
        <p className="text-sm text-white/80">Unlimited blow-dries · 10% off color</p>
      </TiltCardLayer>
      <TiltCardLayer depth={30} className="mt-8 flex items-end justify-between">
        <span className="text-sm">Maya Chen</span>
        <span className="font-mono text-sm">$89/mo</span>
      </TiltCardLayer>
    </TiltCard>
  )
}
```

### Calm pricing card

```tsx
<TiltCard maxTilt={6} scale={1.01} glareOpacity={0.2} className="p-6" containerClassName="h-full">
  <h3 className="font-semibold">Team</h3>
  <p className="mt-2 text-3xl font-bold">$49<span className="text-base font-normal text-muted-foreground">/mo</span></p>
</TiltCard>
```

## API

### TiltCard

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| maxTilt | `number` | `10` | Maximum tilt in degrees. |
| scale | `number` | `1.02` | Scale while hovered. |
| glare | `boolean` | `true` | Show a light glare that follows the pointer. |
| glareOpacity | `number` | `0.35` | Peak opacity of the glare. |
| foil | `boolean` | `false` | Holographic foil that shifts its colors with the tilt. |
| foilOpacity | `number` | `0.7` | Peak opacity of the foil. |
| specular | `boolean` | — | A bright rim that follows the pointer around the card's edge. Follows `glare` by default. |
| autoplay | `boolean` | `false` | Sways gently on its own until a pointer takes over, so touch screens and still pages see it move. |
| perspective | `number` | `900` | CSS perspective in px; lower is more dramatic. |
| disabled | `boolean` | `false` | Keep the card flat (no tilt, glare or scale). |
| containerClassName | `string` | — | Classes for the outer element that holds the perspective and receives the pointer. |

Also accepts every <div> attribute.

### TiltCardLayer

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| depth | `number` | `30` | How far the layer floats above the card, in px. |

Also accepts every <div> attribute.

## Accessibility

- TiltCard renders two plain <div>s (a perspective container and the card); it adds no roles. Put real links or buttons inside for interaction.
- The glare layer is aria-hidden and ignores the pointer.
- Touch, keyboard and reduced-motion users get a flat card with the same content.

## Motion

- foil shifts a rainbow band and film grain with the tilt, masked around the pointer. A specular rim follows the pointer around the edge. TiltCardLayer children slide against the card by 22% of their depth.
- The card rotates toward the pointer by up to `maxTilt` degrees (10) and scales to `scale` (1.02), on a spring (stiffness 220, damping 22, mass 0.6).
- A radial glare follows the pointer at up to `glareOpacity` (0.35), and the shadow shifts against the tilt and fades in on hover (spring, stiffness 200, damping 26).
- TiltCardLayer children float `depth` px (30) above the card with translateZ, so they move with parallax.
- Leaving the card springs it back flat. Touch input is ignored.
- Reduced motion or disabled: no tilt, scale, glare or shadow shift; the card stays flat.

## Performance

- Pointer moves only set motion values, so React does not re-render. Effects use transform, opacity and box-shadow.

## Notes for AI

- className styles the card (padding, background); containerClassName styles the outer element that holds the perspective and receives the pointer (sizing in grids, e.g. h-full).
- TiltCardLayer only floats when every element between it and the card keeps transform-style: preserve-3d and has no overflow: hidden.
- maxTilt is degrees, perspective and depth are px, scale is a factor (1.02 means 2% larger).
- The card already has rounded-xl, border, bg-card; override with className.

## FAQ

**Why is my layer not floating?**

Some element between the layer and the card flattens 3D: overflow: hidden, or a wrapper without transform-style: preserve-3d. Make TiltCardLayer a direct child of TiltCard, or nest layers inside layers.

**Core card animation="tilt" or TiltCard?**

The Core card's tilt is a CSS transition with a light sheen and works with all card variants. TiltCard adds springs, a glare you can tune, a moving shadow and parallax layers.

## Related

- card: https://goodui.dev/components/core/card
- spotlight-card: https://goodui.dev/components/cards/spotlight-card
- magnetic-button: https://goodui.dev/components/buttons/magnetic-button
- glow-border: https://goodui.dev/components/cards/glow-border

Last updated: 2026-11-04
