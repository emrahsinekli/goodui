# Button

> One button with ten variants, six tones, seven shadows, ten animations, three shapes and five sizes that all combine, plus loading and icon slots.

Animated button for React and shadcn: 10 variants, 6 tones, 10 hover effects

Page: https://goodui.dev/components/core/button

## Install

```bash
npx shadcn@latest add @goodui/button
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/button.json`. The file lands in `components/goodui/button.tsx`.

## When to use

- Any action on a page: submit a form, open a dialog, start a checkout.
- When one product needs several button styles that still match: solid for the primary action, soft or outline for secondary, ghost in toolbars.
- Marketing pages that want motion (shine, shimmer, arrow) without a second library.

## When not to use

- Navigating to another page: use link (or render an <a> with the same classes), so the browser treats it as a link.
- Turning a setting on and off: use switch.
- Choosing one option from a few: use tabs or a segmented control.

## Pick by what matters

| Need | Use |
| --- | --- |
| The one main action on the screen | variant="solid" (add shadow="glow" for a hero CTA) |
| Secondary actions next to a primary one | variant="soft" or "outline" |
| Toolbars and dense tables | variant="ghost" size="sm", iconOnly for single icons |
| Destructive actions | tone="danger" with variant="soft"; solid only inside a confirm dialog |
| Playful or retro brands | variant="neo" or "pushable" |
| On photos or colorful backgrounds | variant="glass" |

## Usage

```tsx
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/goodui/button"

export function Hero() {
  return (
    <div className="flex gap-3">
      <Button size="lg" shadow="glow" animation="arrow" iconRight={<ArrowRight />}>
        Start free trial
      </Button>
      <Button size="lg" variant="outline" tone="neutral">
        Book a demo
      </Button>
    </div>
  )
}
```

### Async action with loading

```tsx
const [saving, setSaving] = React.useState(false)

<Button loading={saving} onClick={async () => { setSaving(true); await save(); setSaving(false) }}>
  Save changes
</Button>
```

### Icon-only toolbar button

```tsx
<Button variant="ghost" tone="neutral" size="sm" iconOnly aria-label="Notifications">
  <Bell />
</Button>
```

## API

### Button

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| variant | `"solid" \| "soft" \| "outline" \| "ghost" \| "link" \| "gradient" \| "glass" \| "neo" \| "pushable" \| "dashed"` | `"solid"` |  |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"primary"` |  |
| shadow | `"none" \| "sm" \| "md" \| "lg" \| "glow" \| "hard" \| "inner"` | `"none"` |  |
| animation | `"none" \| "lift" \| "press" \| "shine" \| "shimmer" \| "ripple" \| "pulse" \| "arrow" \| "glow" \| "bounce"` | `"none"` |  |
| shape | `"square" \| "rounded" \| "pill"` | `"rounded"` |  |
| size | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` |  |
| iconOnly | `boolean` | — | Square button for a single icon. |
| fullWidth | `boolean` | — |  |
| loading | `boolean` | — | Blurs the label out, narrows around a spinner and disables the button. |
| iconLeft | `React.ReactNode` | — |  |
| iconRight | `React.ReactNode` | — |  |
| sound | `boolean \| SoundName` | — | Plays "tap" on click when the visitor has sounds on (lib/goodui-sounds); pass a sound name to pick another. Off by default. |

Also accepts every <button> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | Activates the button (native <button>). |
| Tab | Moves focus; a focus ring shows on keyboard focus only. |

## Accessibility

- Renders a native <button>, so roles, focus and form submission work without extra code.
- loading sets disabled and aria-busy and keeps the width, so the layout does not jump.
- iconOnly buttons need an aria-label; the icon itself is decorative.

## Motion

- Hover: lift rises 2px in 180 ms, glow blooms a tone-colored shadow, shine sweeps a highlight once, arrow nudges the icons.
- Press: press scales to 0.95, bounce springs back from 0.92, ripple grows from the pointer.
- Looping: shimmer sweeps every 2.6 s and pulse sends a ring every 2 s; keep looping buttons to one per screen.
- Reduced motion: transitions, sweeps, rings and ripples are off; the loading spinner slows down instead of stopping.

## Performance

- All effects are CSS (transform, opacity, background-position) on the compositor; no JavaScript runs on hover. ripple adds one short-lived span per click.

## Notes for AI

- Layers are independent props: variant, tone, shadow, animation, shape, size. Combine them; do not write custom classes for colors.
- Use tone for meaning (danger, success) instead of hard-coded colors like bg-red-500.
- Pass icons through iconLeft and iconRight, not as children, so spacing and the arrow animation work.
- For links use <a> or the link component; do not wrap Button in <a>.
- Keep looping animations (shimmer, pulse) to one button per screen.

## FAQ

**Does it work with my shadcn theme?**

Yes. Colors come from your theme tokens (--primary, --foreground…) through the tone variables, so it follows your theme and dark mode.

**Can I use it as a link?**

Use the link component for navigation. If you need the button look on a link, copy the classes onto an <a>.

## Related

- link: https://goodui.dev/components/core/link
- badge: https://goodui.dev/components/core/badge
- shimmer-button: https://goodui.dev/components/buttons/shimmer-button
- magnetic-button: https://goodui.dev/components/buttons/magnetic-button
- rainbow-button: https://goodui.dev/components/buttons/rainbow-button

Last updated: 2026-11-02
