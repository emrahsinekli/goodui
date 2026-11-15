# Rating

> Star, heart, circle, bolt, diamond or custom-icon rating in solid, soft, outline, glow and neo styles: half steps, hover preview, clear, animated clip fill with pop or wave, value, count and word labels, read-only exact averages, RTL fill and arrow flipping, with radiogroup or slider semantics.

Star rating for React and shadcn: half stars, hover preview, keyboard and read-only averages

Page: https://goodui.dev/components/core/rating

## Install

```bash
npx shadcn@latest add @goodui/rating
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/rating.json`. The file lands in `components/goodui/rating.tsx`.

## When to use

- Collecting a review after an appointment, order or support chat.
- Showing an average next to a person, product or place (4.7 with 1,284 reviews), including exact fractions.
- Quick satisfaction scores with words per level (Poor … Excellent).

## When not to use

- Scores above 10 points or continuous values: use slider-tooltip or number-input.
- Yes/no feedback (helpful or not): use toggle-group with two items.
- Picking one of a few labeled options: use RadioGroup from checkbox, so every label is visible.

## Pick by what matters

| Need | Use |
| --- | --- |
| Review form | interactive with itemLabels and showLabel, animation="pop" or "wave" |
| Averages in lists and cards | readOnly size="xs" with showValue and count |
| Finer input | precision={0.5} (half steps, slider semantics) |
| Favorites or mood | icon="heart" with tone="danger" |
| Brand icon | icon={<YourIcon />}; lucide icons are filled with CSS |
| Playful brands | variant="neo" or "glow" |

## Usage

```tsx
import * as React from "react"
import { Rating } from "@/components/goodui/rating"

export function ReviewForm() {
  const [score, setScore] = React.useState(0)
  return (
    <form className="flex flex-col gap-3">
      <Rating
        aria-label="Rate your appointment"
        value={score}
        onValueChange={setScore}
        size="lg"
        itemLabels={["Poor", "Fair", "Good", "Great", "Excellent"]}
        showLabel
        name="score"
      />
      <button disabled={!score}>Send review</button>
    </form>
  )
}
```

### Read-only average with count

```tsx
<Rating value={4.7} readOnly size="xs" showValue count={1284} />
```

### Half steps

```tsx
<Rating defaultValue={3.5} precision={0.5} showValue variant="glow" aria-label="Product quality" />
```

### Translated labels

```tsx
<Rating
  labels={{
    group: "Bewertung",
    item: (n) => `${n} Sterne`,
    readOnly: (v, max) => `Bewertet mit ${v} von ${max}`,
    countSr: (c) => `${c} Bewertungen`,
  }}
/>
```

## API

### Rating

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| value | `number` | — | Current rating (controlled); 0 means no rating. |
| defaultValue | `number` | `0` | Initial rating when uncontrolled. |
| onValueChange | `(value: number) => void` | — | Called with the new rating; 0 after clearing. |
| max | `number` | `5` | Number of icons. |
| precision | `1 \| 0.5` | `1` | 1 for whole icons (radiogroup), 0.5 for half steps (slider). |
| readOnly | `boolean` | — | Display only: no hover or focus, shows exact fractions. |
| disabled | `boolean` | — |  |
| clearable | `boolean` | `true` | Picking the current value again, Backspace, Delete or 0 clears the rating. |
| hoverPreview | `boolean` | `true` | Fill previews under the pointer before you click. |
| sound | `boolean \| SoundName` | — | Plays a "tick" per icon under the pointer (pitched up along the row) and a "pop" on pick, when the visitor has sounds on (lib/goodui-sounds); a sound name replaces the pop. Off by default. |
| icon | `RatingIcon \| React.ReactNode` | `"star"` | Built-in icon name, or your own icon node (a lucide icon works: it gets filled with CSS). |
| emptyIcon | `React.ReactNode` | — | Different icon for the empty state; defaults to `icon`. |
| variant | `"solid" \| "soft" \| "outline" \| "glow" \| "neo"` | `"solid"` | How icons are painted: solid (default), soft (tinted empties), outline (stroked empties), glow, or neo. |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"warning"` | Fill color. Defaults to warning, the classic gold. |
| size | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` |  |
| animation | `"none" \| "fill" \| "pop" \| "wave"` | `"pop"` | What moves when the rating changes. Reduced motion turns all of it off. |
| showValue | `boolean` | — | Shows the number ("4.5") after the icons. |
| count | `number` | — | Review count shown after the value, e.g. 1284 → "(1,284)". |
| itemLabels | `string[]` | — | Word per icon ("Poor" … "Excellent"); read with the radios and shown when showLabel is set. |
| showLabel | `boolean` | — | Shows the word for the current or hovered value after the icons. |
| name | `string` | — | Form field name (renders a hidden input with the number). |
| iconsClassName | `string` | — | Class for the icon row. |
| labels | `Partial<RatingLabels>` | — | Text for screen readers and the count; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| → / ↑ | Raise by one step (← in RTL). |
| ← / ↓ | Lower by one step (→ in RTL); reaches 0 only when clearable. |
| Home / End | Lowest step / max. |
| 1 – 9 | Set that rating directly. |
| 0 / Backspace / Delete | Clear the rating (clearable). |
| Space / Enter | Whole steps: pick the focused icon (again clears it when clearable). |
| Tab | One tab stop for the whole control (roving tabindex). |

## Accessibility

- Whole steps render role="radiogroup" with one role="radio" per icon, aria-checked, roving tabindex and names like "4 stars, Great".
- Half steps render one role="slider" with aria-valuenow and aria-valuetext ("3.5 out of 5"), since a radio per half icon reads badly.
- readOnly renders role="img" named "Rated 4.7 out of 5"; the visible count is hidden from screen readers and replaced by "1,284 reviews".
- Pass aria-label or aria-labelledby to say what is being rated; the default name is "Rating". Every built-in string goes through labels.
- name renders a hidden input with the number for native forms.

## Motion

- fill: the icon fill grows from the inline start with a clip-path transition (280 ms), also while previewing on hover.
- pop: fill plus the picked icon springs to 1.32× with a slight tilt and back (320 ms). wave: every filled icon pops in turn, 55 ms apart.
- The hovered icon scales to 1.14 (180 ms). none is static.
- Reduced motion: transitions, hover scale and pops are off; values still update instantly.

## Performance

- Pops use the Web Animations API on the icon elements, so they cost no React renders. Read-only ratings attach no pointer or keyboard handlers.

## Notes for AI

- value is a number from 0 to max; 0 means no rating. onValueChange receives 0 after clearing.
- Use readOnly for averages; it shows exact fractions (4.3 fills 30% of the fifth star) regardless of precision.
- precision is 1 or 0.5 only.
- Pass icon as a name (star, heart, circle, bolt, diamond) or a node; do not draw your own stars around it.
- Use tone for color (warning is the classic gold default); do not wrap it in a text color class.

## FAQ

**Does the fill follow right-to-left layouts?**

Yes. The fill grows from the inline start, so under dir="rtl" it runs right to left, half clicks use the right half as the lower value, and the arrow keys flip.

**Can I use emoji or my own SVG?**

Any React node works as icon. SVGs are filled through CSS fill and stroke, so single-color icons look right; multi-color emoji only clip, they do not recolor.

## Related

- toggle-group: https://goodui.dev/components/core/toggle-group
- checkbox: https://goodui.dev/components/core/checkbox
- slider-tooltip: https://goodui.dev/components/inputs/slider-tooltip
- number-input: https://goodui.dev/components/core/number-input
- stat-card: https://goodui.dev/components/core/stat-card

Last updated: 2026-11-03
