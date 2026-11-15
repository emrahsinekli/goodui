# Border beam button

> A short light beam rides around the button's rounded border with CSS offset-path, with a conic fallback and a static gradient for reduced motion.

Border beam button for React and shadcn: light beam running around the border

Page: https://goodui.dev/components/buttons/border-beam-button

## Install

```bash
npx shadcn@latest add @goodui/border-beam-button
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/border-beam-button.json`. The file lands in `components/goodui/border-beam-button.tsx`.

## When to use

- A secondary CTA that should feel alive without the loudness of a rainbow edge ("Watch the 2-minute demo").
- Highlighting one new action in an app header or empty state.
- Pairing with a solid primary button: the outline variant with a beam draws the eye to the second option.

## When not to use

- A beam around a card, input or any other element: use border-beam, which wraps any child and measures its radius.
- A full multicolor flowing border: use rainbow-button.
- Ordinary actions in forms and tables: use button; a moving border on every action is noise.

## Pick by what matters

| Need | Use |
| --- | --- |
| Secondary CTA next to a primary one | variant="outline" (default) |
| Primary CTA with a beam | variant="solid" |
| Pill shape | radius={999} |
| Two beams chasing each other | double |
| Brand colors | colorFrom="var(--chart-1)" colorTo="var(--chart-4)" |

## Usage

```tsx
import { PlayCircle } from "lucide-react"
import { BorderBeamButton } from "@/components/goodui/border-beam-button"

export function DemoCta({ onWatch }: { onWatch: () => void }) {
  return (
    <BorderBeamButton size="lg" radius={12} onClick={onWatch}>
      <PlayCircle />
      Watch the 2-minute demo
    </BorderBeamButton>
  )
}
```

### Solid pill with two beams in brand colors

```tsx
<BorderBeamButton
  variant="solid"
  radius={999}
  double
  colorFrom="var(--chart-1)"
  colorTo="var(--chart-4)"
  duration={6}
>
  Start free trial
</BorderBeamButton>
```

## API

### BorderBeamButton

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| variant | `"outline" \| "solid"` | `"outline"` | "outline" is a page-colored face with a hairline border; "solid" fills with the primary color. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | "sm" \| "md" \| "lg": height and padding of the button. |
| radius | `number` | `10` | Corner radius in px (use 999 for a pill). Kept in sync with the beam path. |
| colorFrom | `string` | `"#ffaa40"` | Head color of the beam. |
| colorTo | `string` | `"#9c40ff"` | Tail color of the beam. |
| duration | `number` | `4` | Seconds per lap. |
| beamSize | `number` | `56` | Beam length in px. |
| borderWidth | `number` | `1.5` | Border thickness in px. |
| double | `boolean` | — | Two beams chasing each other half a lap apart. |

Also accepts every <button> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | Activates the button (native <button>). |
| Tab | Moves focus; a focus ring shows on keyboard focus only. |

## Accessibility

- Renders a native <button>; the beam ring is an aria-hidden span with pointer-events: none.
- The label is never covered: the beam is masked to the border band only.

## Motion

- A short gradient beam (`beamSize`, 56 px by default) travels the rounded-rect edge with CSS offset-path in a linear loop, one lap every `duration` seconds (4 by default). double adds a second beam half a lap behind.
- Browsers without offset-path rect() get a rotating conic sweep masked to the same border band instead.
- Press scales to 0.98.
- Reduced motion: the beam is hidden and the border shows a static from-to gradient at 55% opacity.

## Performance

- CSS only; no JavaScript runs while the beam moves.

## Notes for AI

- Set the corner radius with the radius prop (px), not rounded-* classes: the beam path uses the same value.
- duration is seconds per lap; beamSize and borderWidth are px.
- variant is "outline" or "solid" only.
- For anything that is not a button (cards, inputs), use border-beam instead of this component.

## FAQ

**Why does the beam cut the corner on my button?**

The beam path uses the radius prop. If you round the button with a class instead, the two no longer match. Pass radius={…} (999 for a pill).

**What do older browsers show?**

Without offset-path rect() support, a rotating conic gradient sweeps around the same border band instead of the traveling beam.

## Related

- border-beam: https://goodui.dev/components/cards/border-beam
- rainbow-button: https://goodui.dev/components/buttons/rainbow-button
- shimmer-button: https://goodui.dev/components/buttons/shimmer-button
- button: https://goodui.dev/components/core/button

Last updated: 2026-11-02
