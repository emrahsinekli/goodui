# Gradient text

> Text filled with a slowly drifting multi-stop gradient, with Aurora, Sunset, Ocean and theme palettes tuned separately for light and dark.

Animated gradient text for React and shadcn: theme-aware gradient headings

Page: https://goodui.dev/components/text/gradient-text

## Install

```bash
npx shadcn@latest add @goodui/gradient-text
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/gradient-text.json`. The file lands in `components/goodui/gradient-text.tsx`.

## When to use

- One or two key words in a hero headline ("Bookings that run themselves", with only the last two words in gradient).
- A product or plan name that should carry the brand colors.
- When the same gradient must look good in light and dark: the presets have separate, deeper light-mode colors.

## When not to use

- A heading that only needs a gradient: heading with treatment="gradient" (or emphasis="gradient" for the _italic_ words) is simpler and keeps size, font and tone in one component.
- A light sweep on muted text: use shiny-text.
- Body copy, links and small labels: gradients lower legibility at small sizes. Use text with a tone.

## Pick by what matters

| Need | Use |
| --- | --- |
| Quiet emphasis | palette="ink" (default) |
| Brushed steel | palette="metal" |
| Foreground into the theme color | palette="accent" |
| Cool, techy, loud | palette="aurora" |
| Warm, friendly | palette="sunset" |
| Calm blues | palette="ocean" |
| Follow the theme's chart colors | palette="brand" |
| Exact brand colors | colors={["#…", "#…", "#…"]} |
| Static gradient | animate={false} |

## Usage

```tsx
import { GradientText } from "@/components/goodui/gradient-text"

export function Hero() {
  return (
    <h1 className="text-5xl font-bold tracking-tight">
      Bookings that <GradientText>run themselves</GradientText>
    </h1>
  )
}
```

### Brand palette, static

```tsx
<GradientText palette="brand" animate={false} className="font-semibold">
  Brightside Pro
</GradientText>
```

### Custom colors, slower drift

```tsx
<GradientText colors={["#7c3aed", "#db2777", "#f59e0b"]} duration={14}>
  Black Friday: 40% off annual plans
</GradientText>
```

## API

### GradientText

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| palette | `"ink" \| "metal" \| "accent" \| "aurora" \| "sunset" \| "ocean" \| "brand"` | `"ink"` | Theme-aware preset. ink, metal and accent are the restrained ones; aurora, sunset and ocean are loud, so use them sparingly. "brand" follows the chart colors. |
| colors | `string[]` | — | Custom stops; overrides `palette`. The first color is repeated at the end for a seamless loop. |
| animate | `boolean` | `true` | Move the gradient. |
| duration | `number` | `8` | Seconds per loop. |

Also accepts every <span> attribute.

## Accessibility

- The text stays real text; only the paint is a gradient, so screen readers and copy-paste are unaffected.
- Light-mode presets use deeper colors and dark-mode presets brighter ones, chosen to keep the text readable on each background. Check contrast yourself for custom colors.
- Browsers without background-clip: text show the first palette color as a solid text color.

## Motion

- The gradient (200% wide) drifts horizontally in a seamless linear loop, one cycle every `duration` s (8).
- Text that wraps onto several lines gets the gradient per line (box-decoration-break: clone).
- Reduced motion: the gradient stops moving and stays visible.

## Performance

- Pure CSS (background-position animation); no JavaScript runs.

## Notes for AI

- Wrap only the words that need emphasis, not whole paragraphs.
- Do not add text-* color classes; the color comes from the gradient. Pick a palette or pass colors.
- colors needs at least two colors; the first is repeated at the end so the loop is seamless. One color is ignored.
- Custom colors apply in both themes; pick colors that work on light and dark or use a preset.

## FAQ

**Heading treatment="gradient" or GradientText?**

For a whole heading, or emphasized words in it, the Core heading is simpler. GradientText works inline in any element and adds four palettes, custom colors and a drifting animation.

**Does "brand" follow my theme?**

Yes, it uses --chart-1, --chart-2, --chart-4 and --chart-5 from your theme.

## Related

- heading: https://goodui.dev/components/core/heading
- shiny-text: https://goodui.dev/components/text/shiny-text
- highlighter: https://goodui.dev/components/text/highlighter
- aurora: https://goodui.dev/components/backgrounds/aurora

Last updated: 2026-11-04
