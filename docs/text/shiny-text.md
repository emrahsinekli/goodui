# Shiny text

> A soft light band sweeps across muted text on a loop or on hover, made for badges like "New: AI receptionist". Pure CSS.

Shiny text effect for React and shadcn: light sweep across text

Page: https://goodui.dev/components/text/shiny-text

## Install

```bash
npx shadcn@latest add @goodui/shiny-text
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/shiny-text.json`. The file lands in `components/goodui/shiny-text.tsx`.

## When to use

- Announcement pills and eyebrow labels ("New: AI receptionist →") that should glint without being loud.
- Inline text inside a link or button that shines while it is hovered or focused (trigger="hover").
- "Thinking…" or "Generating…" status text in AI features.

## When not to use

- A whole heading with a shimmer: heading with treatment="shimmer" is simpler and keeps size, font and tone in one component.
- A badge that shines: badge with animation="shine" sweeps the whole pill. Use ShinyText when only the text should shine.
- Colorful gradient text without a sweep: use gradient-text.

## Pick by what matters

| Need | Use |
| --- | --- |
| Steel headline | tone="metal" |
| Strong text with a light pass | tone="ink" |
| Shine in the theme color | tone="accent" |
| Always-on glint for a badge or label | trigger="loop" (default) |
| Shine only while a link or button is hovered or focused | trigger="hover" inside the <a> or <button> |
| Shine when a larger card is hovered | trigger="hover" + data-shiny-group on the card |
| Brand-colored band | shineColor="var(--primary)" |
| Wider, softer band | spread={16} |

## Usage

```tsx
import { ArrowRight } from "lucide-react"
import { ShinyText } from "@/components/goodui/shiny-text"

export function Announcement() {
  return (
    <a
      href="/changelog/ai-receptionist"
      className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-sm"
    >
      <ShinyText trigger="hover">New: AI receptionist answers missed calls</ShinyText>
      <ArrowRight className="size-3.5 text-muted-foreground rtl:rotate-180" />
    </a>
  )
}
```

### AI status text

```tsx
<ShinyText duration={2} className="text-sm font-medium">
  Drafting your quote…
</ShinyText>
```

### Shine when a whole card is hovered

```tsx
<div data-shiny-group className="rounded-xl border p-4">
  <ShinyText trigger="hover" shineColor="var(--primary)">Pro plan · 2 months free</ShinyText>
</div>
```

## API

### ShinyText

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| duration | `number` | `2.8` | Seconds per cycle (the sweep takes about two thirds of it). |
| trigger | `"loop" \| "hover"` | `"loop"` | "loop" sweeps forever; "hover" sweeps while the text or its parent link/button is hovered or focused. |
| tone | `"muted" \| "ink" \| "metal" \| "accent"` | `"muted"` | Preset: muted (default) sweeps foreground over muted, ink keeps the text strong, metal is steel, accent shines in the theme color. |
| baseColor | `string` | — | Text color at rest; overrides `tone`. |
| shineColor | `string` | — | Color of the light band; overrides `tone`. |
| spread | `number` | `9` | Half-width of the band, as a percent of the gradient. |

Also accepts every <span> attribute.

## Accessibility

- The text stays real text in a <span>; only its paint changes, so screen readers and copy-paste are unaffected.
- Resting color is muted-foreground by default; for small text on tinted backgrounds pass a stronger baseColor.
- Browsers without background-clip: text show the base color with no sweep.

## Motion

- A light band (half-width `spread` %, 9 by default) sweeps from left to right on ease-in-out, then rests off the text for the last third of each `duration` s cycle (2.8).
- trigger="hover" runs the loop while the text, or a parent <a>, <button> or [data-shiny-group], is hovered or has keyboard focus.
- Reduced motion: no sweep; the text shows in its base color.

## Performance

- Pure CSS (background-position on a clipped gradient); no JavaScript runs.

## Notes for AI

- Children are the text; there is no text prop.
- Do not set a text color class (text-*): the color is painted by the gradient. Use baseColor and shineColor.
- duration is seconds per cycle; spread is a percentage.
- For hover on a larger area, add data-shiny-group to the container instead of handling hover in JavaScript.

## FAQ

**Why does my text-* color class not work?**

The fill is a background clipped to the text, with a transparent text color. Use baseColor for the resting color and shineColor for the band.

**Heading treatment="shimmer" or ShinyText?**

For a heading, the Core heading's shimmer is the simpler choice. ShinyText is for inline text anywhere, with a hover trigger and custom colors and band width.

## Related

- gradient-text: https://goodui.dev/components/text/gradient-text
- heading: https://goodui.dev/components/core/heading
- badge: https://goodui.dev/components/core/badge
- shimmer-button: https://goodui.dev/components/buttons/shimmer-button

Last updated: 2026-11-04
