# Highlighter

> Draws a marker highlight, hand-drawn underline, circle, box or strike-through behind a phrase when it scrolls into view, in six colors.

Text highlighter animation for React and shadcn: marker, underline and circle

Page: https://goodui.dev/components/text/highlighter

## Install

```bash
npx shadcn@latest add @goodui/highlighter
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/highlighter.json`. The file lands in `components/goodui/highlighter.tsx`.

## When to use

- Drawing attention to the key phrase of a landing-page paragraph as it scrolls into view ("cut no-shows by 40%").
- Pricing and comparison copy: circle the saving, strike the old price.
- Onboarding and docs, to point at the one thing to notice, controlled by your own state.

## When not to use

- A highlighted word inside a heading: heading with treatment="highlight" or "underline-squiggle" and *marked* words is simpler.
- Search-result matches in lists and tables: use a plain <mark>; animation there is distracting.
- Coloring a word without a mark: use gradient-text or text with a tone.

## Pick by what matters

| Need | Use |
| --- | --- |
| Marker behind a phrase (wraps across lines) | action="highlight" (default) |
| Hand-drawn underline | action="underline" |
| Circle a number or price | action="circle" |
| Box a term | action="box" |
| Old price | action="strike" color="rose" |
| Follow the theme color | color="primary" |
| Draw from your own state | show={step === 2} |

## Usage

```tsx
import { Highlighter } from "@/components/goodui/highlighter"

export function Benefit() {
  return (
    <p className="max-w-xl text-lg text-muted-foreground">
      Automatic SMS reminders{" "}
      <Highlighter className="text-foreground">cut no-shows by 40%</Highlighter>
      {" "}for salons in their first month, and clients can{" "}
      <Highlighter action="underline" color="sky" delay={0.4}>reschedule in one tap</Highlighter>.
    </p>
  )
}
```

### Old and new price

```tsx
<p className="text-2xl font-semibold">
  <Highlighter action="strike" color="rose">$49</Highlighter>{" "}
  <Highlighter action="circle" color="emerald" delay={0.5} padding={8}>$29</Highlighter>
  <span className="text-base text-muted-foreground"> / month</span>
</p>
```

### Controlled by an onboarding step

```tsx
<Highlighter action="box" color="primary" show={step === 2}>Connect your calendar</Highlighter>
```

## API

### Highlighter

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| action | `"highlight" \| "underline" \| "circle" \| "box" \| "strike"` | `"highlight"` | Marker highlight (wraps across lines), or a hand-drawn underline, circle, box or strike-through. |
| color | `"amber" \| "emerald" \| "sky" \| "rose" \| "violet" \| "primary"` | `"amber"` | Marker and stroke color, tuned for light and dark; "primary" follows the theme. |
| show | `boolean` | — | Controlled: true draws, false erases. Leave undefined to draw when scrolled into view. |
| once | `boolean` | `true` | With automatic triggering: draw only the first time it enters the viewport. |
| delay | `number` | `0` | Seconds before drawing starts. |
| duration | `number` | `0.8` | Seconds the stroke takes. |
| strokeWidth | `number` | `2` | Stroke width in px for underline, circle, box and strike (not used by highlight). |
| padding | `number` | `6` | Extra space in px between the text and a circle or box. |

Also accepts every <span> attribute.

## Accessibility

- The text stays plain text in a <span>; the drawn shapes are an aria-hidden SVG with pointer-events: none.
- The marker is decoration: if the emphasis carries meaning, also use <strong> or <em> inside it.
- Each color has separate light and dark values; the dark-mode marker is a translucent tint (about 30% opacity) that light text shows through.

## Motion

- highlight: the marker grows from left to right by animating background-size over `duration` s (0.8) on cubic-bezier(0.65, 0, 0.35, 1), after `delay` s. It wraps across lines.
- underline, circle, box, strike: an SVG path built from the measured text size draws itself (pathLength) with the same duration, delay and easing.
- Without show, it draws when 80% of the phrase is visible, once by default (once={false} erases and redraws on each visit).
- Reduced motion: marks appear at once, without drawing.

## Notes for AI

- Wrap only the phrase to mark; children are the text.
- Durations and delay are seconds. strokeWidth and padding (px) only affect the SVG actions, not highlight.
- Colors are amber, emerald, sky, rose, violet and primary; there is no custom color prop.
- underline, circle, box and strike turn the span into an inline-block, so keep those phrases short enough to stay on one line; use highlight for phrases that wrap.
- Stagger several highlights with delay rather than separate timers.

## FAQ

**Does the marker work across line breaks?**

Yes, action="highlight" is a CSS background on the inline text, so it follows every line. The SVG actions make the phrase an inline-block, so they belong on short phrases.

**Does it redraw when the text resizes?**

Yes. The SVG actions re-measure with a ResizeObserver, so shapes keep fitting after font loads and layout changes.

## Related

- heading: https://goodui.dev/components/core/heading
- gradient-text: https://goodui.dev/components/text/gradient-text
- text-reveal: https://goodui.dev/components/text/text-reveal
- text: https://goodui.dev/components/core/text

Last updated: 2026-11-02
