# Magnetic button

> Button and its label are pulled toward a nearby cursor with a smooth falloff and spring back on leave; off for touch and reduced motion.

Magnetic button for React and shadcn: button that follows the cursor

Page: https://goodui.dev/components/buttons/magnetic-button

## Install

```bash
npx shadcn@latest add @goodui/magnetic-button
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/magnetic-button.json`. The file lands in `components/goodui/magnetic-button.tsx`.

## When to use

- A hero CTA or footer "Get started" on a marketing site where a playful, tactile hover fits the brand.
- Round icon buttons (social links, a floating chat button) that should feel physical under the mouse.
- Portfolio and agency pages where pointer interactions are part of the design.

## When not to use

- Dense app UI (tables, toolbars, forms): a moving target slows precise clicking. Use button.
- Touch-first screens: the effect is off on touch and coarse pointers, so it adds nothing there. Use button or ripple-button.
- A hover lift without pointer tracking: button with animation="lift" is simpler.

## Pick by what matters

| Need | Use |
| --- | --- |
| Subtle pull for an app-like CTA | strength={0.2} labelStrength={0.1} |
| Strong, playful pull | strength={0.5} labelStrength={0.3} radius={120} |
| Round icon button | size="icon" aria-label="…" |
| Only react when the cursor is on the button | radius={0} |

## Usage

```tsx
import { ArrowRight } from "lucide-react"
import { MagneticButton } from "@/components/goodui/magnetic-button"

export function FooterCta({ onStart }: { onStart: () => void }) {
  return (
    <MagneticButton size="lg" onClick={onStart}>
      Get started free
      <ArrowRight className="rtl:rotate-180" />
    </MagneticButton>
  )
}
```

### Round icon button with a stronger pull

```tsx
<MagneticButton size="icon" variant="outline" strength={0.5} radius={100} aria-label="Chat with support">
  <MessageCircle />
</MagneticButton>
```

## API

### MagneticButton

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| variant | `"outline" \| "default" \| "ghost" \| "secondary"` | `"default"` | "default" \| "secondary" \| "outline" \| "ghost", matching shadcn's button variants. |
| size | `"sm" \| "md" \| "lg" \| "icon"` | `"md"` | "sm" \| "md" \| "lg" \| "icon"; "icon" is a round 44px button. |
| strength | `number` | `0.35` | Share of the pointer offset the button follows (0–1). |
| labelStrength | `number` | `0.2` | Extra share for the label, for a parallax feel. |
| radius | `number` | `70` | Distance in px outside the button where the pull starts. |

Also accepts every <button> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | Activates the button (native <button>). |
| Tab | Moves focus; a focus ring shows on keyboard focus only. Keyboard focus does not move the button. |

## Accessibility

- Renders a native <button> (motion.button) inside an inline-flex <span> wrapper that is used to measure the resting position.
- The effect only runs for a fine pointer that can hover (mouse, trackpad); touch input and keyboard users get a normal static button.
- Disabled buttons do not move.

## Motion

- The button moves toward the pointer by `strength` (0.35) of the offset and the label by `labelStrength` (0.2), both on a spring (stiffness 220, damping 15, mass 0.6).
- The pull is full over the button and eases to zero at `radius` px (70) outside it, using a smoothstep curve; leaving springs it back to the center.
- Tap scales to 0.95.
- Listening stops while the button is off-screen, while the tab is hidden and when the pointer is not fine.
- Reduced motion: no pull and no tap scale.

## Performance

- Uses motion values and springs, so pointer moves do not re-render React. The window pointermove listener is only attached while the button is visible.

## Notes for AI

- variant values are default, secondary, outline, ghost; sizes sm, md, lg, icon.
- strength and labelStrength are fractions of the pointer offset (0 to 1), not pixels; radius is in px.
- className goes on the button; the wrapping <span> is internal, so use a parent element for layout spacing.
- Pass icons and text as children; they move together as the label.

## FAQ

**Does it work on phones?**

It renders as a normal button. The pull only runs for a fine pointer that can hover (mouse or trackpad).

**Can I use it on several buttons?**

Yes. Each button only listens while it is visible, but keep it to a few buttons so the page does not feel jumpy.

## Related

- button: https://goodui.dev/components/core/button
- ripple-button: https://goodui.dev/components/buttons/ripple-button
- tilt-card: https://goodui.dev/components/cards/tilt-card
- shimmer-button: https://goodui.dev/components/buttons/shimmer-button

Last updated: 2026-11-02
