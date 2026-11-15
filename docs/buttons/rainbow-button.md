# Rainbow button

> Button with a seamlessly flowing rainbow border and a soft colored glow underneath, tuned to invert cleanly between light and dark themes.

Rainbow border button for React and shadcn: animated gradient border with glow

Page: https://goodui.dev/components/buttons/rainbow-button

## Install

```bash
npx shadcn@latest add @goodui/rainbow-button
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/rainbow-button.json`. The file lands in `components/goodui/rainbow-button.tsx`.

## When to use

- The single hero call to action on a landing page, especially for AI or creative products.
- Launch or announcement moments ("Try the new AI receptionist") where a colorful edge is on brand.
- Dark marketing sections, where the glow under the button reads well.

## When not to use

- Everyday app actions (save, filter, invite): use button; a rainbow edge in a form looks out of place.
- A subtler moving border that uses two brand colors: use border-beam-button.
- A gradient face without the moving border: button with variant="gradient" is simpler.

## Pick by what matters

| Need | Use |
| --- | --- |
| Maximum contrast, inverts with the theme | variant="solid" (black face in light, white in dark) |
| Quieter, page-colored face | variant="outline" |
| Brand colors instead of the rainbow | colors={[...5 CSS colors]} |
| Calmer flow | speed={6} |
| Pill CTA | pill |

## Usage

```tsx
import { ArrowRight } from "lucide-react"
import { RainbowButton } from "@/components/goodui/rainbow-button"

export function LaunchCta({ onStart }: { onStart: () => void }) {
  return (
    <RainbowButton size="lg" pill onClick={onStart}>
      Try the AI receptionist
      <ArrowRight className="rtl:rotate-180" />
    </RainbowButton>
  )
}
```

### Outline variant with brand colors

```tsx
<RainbowButton
  variant="outline"
  colors={["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]}
  speed={5}
>
  Join the beta
</RainbowButton>
```

## API

### RainbowButton

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| variant | `"solid" \| "outline"` | `"solid"` | "solid" inverts with the theme (black in light, white in dark); "outline" uses the page background. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | "sm" \| "md" \| "lg": height, padding and corner radius (10, 12 or 14 px). |
| pill | `boolean` | — | Fully rounded ends. |
| colors | `string[]` | `DEFAULT_COLORS` | Five CSS colors for the flowing gradient. |
| speed | `number` | `3` | Seconds per loop. |
| borderWidth | `number` | `2` | Border thickness in px. |

Also accepts every <button> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | Activates the button (native <button>). |
| Tab | Moves focus; the focus ring is offset from the border so it stays visible. |

## Accessibility

- Renders a native <button>; the gradient border, glow and face are aria-hidden spans with pointer-events: none.
- variant="solid" uses text-background on a foreground face, so text color follows the theme in light and dark.
- The focus ring has a 2px offset in the page background color, so it does not merge with the colored border.

## Motion

- The border and the glow share one gradient strip, twice the button width, that slides by half its width in a seamless linear loop every `speed` seconds (3 by default). Only transform is animated.
- Hover: the blurred glow under the button brightens and widens slightly over 0.3 s. Press scales to 0.98.
- Reduced motion: the gradient stops moving; the colored border and glow stay.

## Performance

- The loop is a CSS transform on two strips; no JavaScript runs while it animates. The glow uses a 14px blur, so keep it to one or two buttons per screen.

## Notes for AI

- colors takes up to five CSS colors; fewer are repeated to fill five slots.
- speed is seconds per loop (higher is slower); borderWidth is in px.
- Do not add bg-* classes to change the face: the face is an inner span. Choose variant="solid" or "outline" instead.
- Corner radius comes from size (10, 12 or 14 px) or pill; set radius through pill, not rounded-* classes, so border and face stay aligned.
- Use one rainbow button per screen; it is a hero accent, not a default button.

## FAQ

**Does it work in dark mode?**

Yes. The solid face inverts with the theme (black in light, white in dark) and the glow is toned down in dark mode.

**Can I use my brand colors?**

Yes, pass colors with five CSS colors or theme variables such as var(--chart-1).

## Related

- border-beam-button: https://goodui.dev/components/buttons/border-beam-button
- shimmer-button: https://goodui.dev/components/buttons/shimmer-button
- button: https://goodui.dev/components/core/button
- gradient-text: https://goodui.dev/components/text/gradient-text

Last updated: 2026-11-02
