# Text reveal

> Reveals a heading word by word or letter by letter with a staggered blur, fade and rise when it scrolls into view or on demand.

Text reveal animation for React and shadcn: word by word blur-in on scroll

Page: https://goodui.dev/components/text/text-reveal

## Install

```bash
npx shadcn@latest add @goodui/text-reveal
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/text-reveal.json`. The file lands in `components/goodui/text-reveal.tsx`.

## When to use

- A section heading or tagline that should reveal word by word when it scrolls into view.
- Step-by-step flows where text must hide and show again on demand (play={true/false}), such as onboarding slides.
- Sequencing: start the next animation when the text finishes, with onComplete.

## When not to use

- A normal heading that just needs an entrance: heading with animation="words", "letters" or "blur-in" is simpler and also gives size, font and treatment. Use TextReveal only when you need play control, replays, onComplete or custom timing.
- Paragraphs and body copy: staggering long text slows reading. Use text with animation="fade-up" or no animation.
- Rotating one word inside a sentence: use word-rotate.

## Pick by what matters

| Need | Use |
| --- | --- |
| Hero headline | effect="mask" (default) |
| A color band over dim text | effect="sweep" |
| The older soft blur | effect="blur" |
| Headline that reveals once on scroll | defaults (by="word", trigger="view", once) |
| Short, punchy word (logo, number) | by="char" |
| Replay every time it enters the viewport | once={false} |
| Above the fold, right away | trigger="mount" |
| Driven by your own state (slides, tabs) | play={isActive} |
| Entrance on a Core heading with no extra control | heading with animation="words" |

## Usage

```tsx
import { TextReveal } from "@/components/goodui/text-reveal"

export function FeaturesIntro() {
  return (
    <section className="py-24 text-center">
      <TextReveal
        as="h2"
        text="Every booking, invoice and reminder in one calm place"
        className="mx-auto max-w-2xl text-4xl font-semibold tracking-tight text-balance"
      />
    </section>
  )
}
```

### Controlled by a slide index

```tsx
<TextReveal
  as="h3"
  text={slides[index].title}
  key={index}
  play={active}
  onComplete={() => setShowCta(true)}
/>
```

### Letter by letter, faster

```tsx
<TextReveal as="h1" by="char" text="Brightside" trigger="mount" stagger={0.03} blur={4} className="text-6xl font-black" />
```

## API

### TextReveal

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| text (required) | `string` | — | The text to reveal; a plain string so it can be split (screen readers get it whole). |
| effect | `"mask" \| "sweep" \| "blur"` | — | mask: lines rise out of a clip. sweep: a color band passes across dim text. blur: the older blur, fade and rise. |
| by | `"word" \| "char"` | `"word"` | Animate word by word or character by character. |
| as | `"h1" \| "h2" \| "h3" \| "h4" \| "p" \| "span" \| "div"` | `"p"` | Element to render, e.g. "h1" for a page title. |
| trigger | `"view" \| "mount"` | `"view"` | "view" plays when the text scrolls into view, "mount" plays right away. Ignored when `play` is set. |
| play | `boolean` | — | Controlled mode: true reveals, false hides. Leave undefined to use `trigger`. |
| once | `boolean` | `true` | With trigger="view": play only the first time it enters the viewport. |
| delay | `number` | `0` | Seconds before the first word or character. |
| stagger | `number` | — | Seconds between two words or characters. Defaults depend on `effect`. |
| duration | `number` | — | Seconds per unit. |
| blur | `number` | — | Starting blur in px for effect="blur". Passing it without `effect` selects blur. |
| onComplete | `() => void` | — | Called when the last word or character has finished revealing. |

Also accepts every <element> attribute.

## Accessibility

- The full text is rendered once in an sr-only span; the animated pieces are aria-hidden, so screen readers read it as one sentence.
- Use as="h1"…"h4" so the heading keeps its place in the document outline.
- Words are kept whole (each word is a no-wrap inline-block), so lines never break inside a word.

## Motion

- mask (default): whole visual lines rise out of a clip on the expo ease-out, about 1s, with 0.1s between lines. sweep: a color band from the theme chart colors passes across the words in reading order, reversed in RTL. Both are CSS transitions, so replays interrupt cleanly.
- Each word (or character) rises 0.35em, fades in and unblurs from `blur` px (8) over `duration` s (0.5) on ease [0.22, 1, 0.36, 1].
- Units are staggered by `stagger` s: 0.06 for words, 0.018 for characters by default, after `delay`.
- trigger="view" plays when 35% of the element is visible; play={false} hides it again in 0.2 s.
- Reduced motion: no rise, blur or stagger; the whole text fades in over 0.2 s.

## Notes for AI

- text must be a plain string; markup and links inside it are not supported. Style the whole element with className.
- Set as for semantics (default is <p>); styling does not come from as.
- play overrides trigger. Leave play undefined to use trigger.
- Durations, delay and stagger are seconds, not milliseconds.
- To replay a new string, change text or key; with once (the default), a scroll-triggered reveal only plays the first time.
- by="char" splits into grapheme clusters (emoji and combining marks stay whole). Arabic-script text animates by word instead, because splitting joined letters breaks their shapes; RTL text otherwise works as is.

## FAQ

**Should I use this or the Core heading's animation?**

For a heading that animates once on view, the Core heading with animation="words" or "letters" is simpler. TextReveal adds controlled play, replays, onComplete and custom stagger, duration and blur.

**Is the text in the HTML before it animates?**

Yes. The full string is rendered in an sr-only span and as split words; only their opacity, position and blur animate.

## Related

- heading: https://goodui.dev/components/core/heading
- text: https://goodui.dev/components/core/text
- word-rotate: https://goodui.dev/components/text/word-rotate
- typewriter: https://goodui.dev/components/text/typewriter

Last updated: 2026-11-04
