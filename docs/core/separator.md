# Separator

> Line, dashed, dotted, gradient, double, glow and ornament separators with diamond, dot or icon marks, labels at the center, start or end, tones, thickness, vertical orientation, a draw-in-on-view and a shimmer animation.

Separator and divider for React and shadcn: labeled, dashed, gradient, ornament and draw-in

Page: https://goodui.dev/components/core/separator

## Install

```bash
npx shadcn@latest add @goodui/separator
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/separator.json`. The file lands in `components/goodui/separator.tsx`.

## When to use

- Splitting sections of a settings page or a long form without boxing each one in a card.
- An "or" between two sign-in methods, or a date between groups of messages: label.
- Between items in a toolbar or a row of stats: orientation="vertical".
- Section breaks on marketing pages with a little decoration: ornament, gradient or glow, optionally drawing in on scroll.

## When not to use

- Separating rows of a table or list: use border classes on the rows; a component per row is overkill.
- Grouping related content that needs its own background or actions: use card.
- A section title: use heading; a label on a separator is for short markers like "or" or a date.

## Pick by what matters

| Need | Use |
| --- | --- |
| Plain divider in app UI | variant="line" tone="neutral" (defaults) |
| "or" between two options | label="or" (labelStyle="caps" for OR) |
| Date or group marker in a feed | label with labelStyle="pill", labelPosition="start" for left-aligned |
| Soft divider on a landing page | variant="gradient" (fades at the edges) |
| Decorative section break | variant="ornament" (diamond) or ornament="dots" \| "icon" |
| Divider that reveals on scroll | animation="draw" |
| Toolbar or stat row | orientation="vertical" inside a flex row |

## Usage

```tsx
import { Separator } from "@/components/goodui/separator"
import { Button } from "@/components/goodui/button"
import { Input } from "@/components/goodui/input"

export function SignIn() {
  return (
    <div className="flex max-w-sm flex-col gap-4">
      <Button variant="outline" tone="neutral">
        Continue with Google
      </Button>
      <Separator label="or" labelStyle="caps" />
      <Input type="email" label="Work email" placeholder="name@studio.com" />
      <Button>Send magic link</Button>
    </div>
  )
}
```

### Vertical in a stat row

```tsx
<div className="flex h-10 items-center gap-4 text-sm">
  <span>12 bookings</span>
  <Separator orientation="vertical" />
  <span>$1,840 revenue</span>
  <Separator orientation="vertical" />
  <span>2 no-shows</span>
</div>
```

### Date marker in an activity feed

```tsx
<Separator label="Yesterday" labelStyle="pill" labelPosition="start" variant="dashed" />
```

### Decorative break that draws in

```tsx
<Separator variant="ornament" tone="primary" animation="draw" thickness="medium" />
```

## API

### Separator

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| variant | `"line" \| "dashed" \| "dotted" \| "gradient" \| "double" \| "glow" \| "ornament"` | `"line"` | Line style: line, dashed, dotted, gradient (fades at the edges), double, glow, or ornament (gradient with a diamond). |
| tone | `"neutral" \| "primary" \| "success" \| "warning" \| "danger" \| "info"` | `"neutral"` | neutral (default) uses the theme border color; other tones color the line, marks and labels. |
| ornament | `"none" \| "diamond" \| "dot" \| "dots" \| "icon"` | `"none"` | Mark in the middle. The ornament variant defaults to a diamond. |
| icon | `React.ReactNode` | — | Custom glyph for ornament="icon". |
| label | `React.ReactNode` | — | Short text on the line, e.g. "or" or a date. |
| labelPosition | `"center" \| "start" \| "end"` | `"center"` | Where the label sits along the line. |
| labelStyle | `"plain" \| "pill" \| "caps"` | `"plain"` | plain muted text, a bordered pill, or small spaced capitals. |
| orientation | `"horizontal" \| "vertical"` | `"horizontal"` |  |
| thickness | `"thin" \| "medium" \| "thick"` | `"thin"` | Line weight: 1, 2 or 4px (dots and dashes scale with it). |
| animation | `"none" \| "draw" \| "shimmer"` | `"none"` | "draw" grows the line the first time it scrolls into view; "shimmer" sends a light along it. |
| decorative | `boolean` | `true` | Purely visual (role="none"), like shadcn. Set false to expose it to assistive tech. |

Also accepts every <div> attribute.

## Accessibility

- Decorative by default (role="none"), like shadcn's separator. Set decorative={false} to render role="separator" with aria-orientation.
- Ornaments and icons are aria-hidden. A label is plain text, so screen readers still read it.
- Lines and dots are CSS backgrounds, not text characters, so nothing extra is announced.

## Motion

- draw: the first time 60% of the separator is in view, the line grows from the center (or from the label) over 800 ms; the ornament and label pop in with a slight overshoot after 200 ms. It plays once.
- shimmer: a light sweeps along the line every 2.8 s (top to bottom when vertical).
- Reduced motion: no transitions or animations; draw shows the full line at once and shimmer is hidden.

## Performance

- draw uses one IntersectionObserver per separator and disconnects it after the first reveal. shimmer is a CSS transform animation.

## Notes for AI

- Default is a neutral 1px line. tone="neutral" uses the theme border color; other tones color the line, marks and pill or caps labels.
- Pass text through label, not children (children is not accepted). labelPosition only matters when there is a label.
- variant="ornament" adds a diamond by default; ornament adds a mark to any variant; ornament="icon" uses icon or a built-in sparkle.
- Vertical separators stretch to the parent's height (self-stretch, min 24px), so the parent needs a height or align-items: stretch.
- There is no built-in text, so there is no labels prop.

## FAQ

**Is it compatible with shadcn's Separator?**

Yes for the common props: orientation and decorative work the same way. Everything else is an extra layer with a default that renders a plain line.

**Why does my vertical separator not show?**

It takes the parent's height. Put it in a flex row with a height (for example h-6 or h-10) or with items-stretch.

## Related

- card: https://goodui.dev/components/core/card
- heading: https://goodui.dev/components/core/heading
- text: https://goodui.dev/components/core/text
- breadcrumb: https://goodui.dev/components/core/breadcrumb

Last updated: 2026-11-02
