# Heading

> Layered heading: semantic level and size decoupled, sans/serif/mono/display font slots you map to your own fonts, eight ink treatments (gradient, muted tail, outline, marker highlight, hand-drawn squiggle, shimmer…), serif-italic emphasis via _words_, and on-view word, letter and mask reveals.

Animated heading for React and shadcn: gradient, highlight, squiggle underline and word reveal

Page: https://goodui.dev/components/core/heading

## Install

```bash
npx shadcn@latest add @goodui/heading
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/heading.json`. The file lands in `components/goodui/heading.tsx`.

## When to use

- Page and section titles where the visual size should not dictate the semantic level: an h2 that looks like a display title.
- Landing page heroes with one emphasized phrase: *marker highlight*, a hand-drawn squiggle or _serif italic_ words.
- Section titles that reveal once as they scroll into view: words, letters or mask.
- Keeping every heading on one type scale and font set: map your fonts once with CSS variables.

## When not to use

- Body copy, captions, eyebrows and quotes: use text.
- Words that cycle or type themselves: use word-rotate or typewriter.
- A short shiny label in app UI: use shiny-text; Heading is for titles.

## Pick by what matters

| Need | Use |
| --- | --- |
| App page title | as="h1" size="lg" (no treatment, no animation) |
| Landing hero | as="h1" size="display" treatment="gradient" or "highlight", animation="words" |
| Editorial or premium feel | font="serif", or keep sans and use _words_ with emphasis="serif" |
| A two-part title where the second half is quieter | treatment="muted-tail" |
| Hand-made, friendly emphasis | treatment="underline-squiggle" with *one phrase* |
| Big outline type on a dark band | treatment="outline" (marked words stay filled) |
| Section reveals while scrolling | animation="mask" (clean) or "fade-up" (subtle) |

## Usage

```tsx
import { Heading } from "@/components/goodui/heading"

export function Hero() {
  return (
    <section className="mx-auto max-w-3xl py-20 text-center">
      <Heading as="h1" size="display" align="center" treatment="highlight" animation="words">
        Fill every chair, *without the phone tag*
      </Heading>
    </section>
  )
}
```

### Serif emphasis

```tsx
<Heading as="h2" size="2xl">Bookings, payments and reminders, _finally in one place_</Heading>
```

### Muted tail

```tsx
<Heading size="xl" treatment="muted-tail">Get paid faster. Deposits and no-show fees, collected automatically.</Heading>
```

### Map your own fonts (layout.tsx)

```tsx
import { Fraunces, Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"], variable: "--font-heading-sans" })
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-heading-serif" })

<html className={`${inter.variable} ${fraunces.variable}`}>
```

## API

### Heading

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| as | `"h1" \| "h2" \| "h3" \| "h4" \| "h5" \| "h6"` | `"h2"` | Semantic level. Size is independent, so an h3 can look like a display heading. |
| size | `"display" \| "2xl" \| "xl" \| "lg" \| "md" \| "sm"` | `"xl"` | Visual scale; display, 2xl and xl scale fluidly with the viewport. |
| weight | `"auto" \| "light" \| "normal" \| "medium" \| "semibold" \| "bold" \| "black"` | `"auto"` | "auto" picks per font: sans semibold, serif medium, mono semibold, display extrabold. |
| tracking | `"tighter" \| "tight" \| "normal" \| "wide"` | `"tight"` | Letter spacing. |
| font | `"sans" \| "serif" \| "mono" \| "display"` | `"sans"` | Font slot, mapped with --font-heading-sans / -serif / -mono / -display. |
| treatment | `"plain" \| "tinted" \| "gradient" \| "muted-tail" \| "outline" \| "highlight" \| "underline-squiggle" \| "shimmer"` | `"plain"` | How the ink is painted: plain, tinted, gradient, muted-tail, outline, highlight (*marks*), underline-squiggle or shimmer. |
| emphasis | `"italic" \| "serif" \| "tone" \| "gradient"` | `"serif"` | Style of <em> / _underscored_ words. |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"primary"` | Accent color used by every treatment and emphasis. |
| animation | `"none" \| "fade-up" \| "blur-in" \| "words" \| "letters" \| "mask"` | `"none"` | Entrance animation, played once when the heading scrolls into view. |
| align | `"start" \| "center" \| "end"` | `"start"` | Text alignment (logical, so start follows the writing direction). |
| balance | `boolean` | `true` | Balanced line breaks (text-wrap: balance). |
| markup | `boolean` | `true` | Parse *mark* and _em_ in string children. |
| children | `React.ReactNode` | — | Content. |

Also accepts every <h2> attribute.

## Accessibility

- Renders the real heading element from as (h1–h6, default h2); size only changes the look, so keep the outline in order.
- With words, letters or mask, screen readers get the whole sentence once from a visually hidden copy; the split, animated copy is aria-hidden. If children contain React elements, there is no hidden copy and the visible text is read.
- *marks* become <mark> and _words_ become <em>, so emphasis stays in the markup. The squiggle SVG is aria-hidden.
- treatment="outline" keeps marked words filled; outline-only text is harder to read, so keep it for short, large titles.

## Motion

- Entrances play once when 20% of the heading is in view: fade-up rises 0.35em in 700 ms, blur-in sharpens from a 14px blur in 900 ms.
- words: each word rises and unblurs in 650 ms, 70 ms apart. letters: each letter in 500 ms, 24 ms apart. mask: words slide up from behind a clip in 800 ms, 65 ms apart.
- With an entrance, the highlight marker sweeps in (700 ms) and the squiggle draws (800 ms) after the text has arrived.
- shimmer: a light passes across the text every 3.4 s, continuously.
- Reduced motion: no entrances, no shimmer; the text, marker and squiggle are shown in their final state.

## Performance

- One IntersectionObserver per animated heading, disconnected after it plays. Split animations with gradient, shimmer or gradient emphasis measure word positions once and on resize (ResizeObserver) so the gradient stays continuous.

## Notes for AI

- Set as for semantics and size for looks; do not pick a level to get a size. Default is as="h2" size="xl".
- Inline markup only works in string children: *phrase* → highlighted mark, _phrase_ → emphasis. Pass markup={false} for titles that contain literal * or _.
- highlight and underline-squiggle mark the last word automatically when the text has no *mark*; muted-tail mutes the second sentence or the last ~40% of the words.
- Do not add bg-clip-text or gradient classes yourself; use treatment and tone. Fonts come from --font-heading-sans, -serif, -mono and -display.
- Headings with an entrance start invisible until they scroll into view, so avoid animation on titles above the fold in app UI. There is no built-in text, so no labels prop.

## FAQ

**Can I use my own fonts?**

Yes. Set --font-heading-sans, --font-heading-serif, --font-heading-mono and --font-heading-display on :root or <html> (next/font's variable option does this). Without them, sans, serif and mono fall back to --font-sans, --font-serif and --font-mono when set, then to system stacks.

**How do I use the outline treatment on a card?**

The fill uses --pc-surface, falling back to the page background. On a card, set className="[--pc-surface:var(--card)]".

## Related

- text: https://goodui.dev/components/core/text
- highlighter: https://goodui.dev/components/text/highlighter
- gradient-text: https://goodui.dev/components/text/gradient-text
- text-reveal: https://goodui.dev/components/text/text-reveal

Last updated: 2026-11-02
