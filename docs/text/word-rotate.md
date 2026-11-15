# Word rotate

> Swaps words in place with a vertical slide and blur while the box springs to each word's width, so the sentence glides instead of jumping.

Rotating words animation for React and shadcn: word flip in a headline

Page: https://goodui.dev/components/text/word-rotate

## Install

```bash
npx shadcn@latest add @goodui/word-rotate
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/word-rotate.json`. The file lands in `components/goodui/word-rotate.tsx`.

## When to use

- Hero headlines that cycle the audience or use case ("Scheduling for cleaners / salons / tutors").
- Short inline swaps inside a sentence, where the rest of the sentence should glide rather than jump.
- Feature carousels where the highlighted word should follow your own index (controlled mode).

## When not to use

- Showing whole sentences one after another: use typewriter or text-reveal.
- Changing a value people read (status, count): use text-morph for labels or number-flow for numbers.
- Key information such as a price or plan name: put it in static text (text or heading); a rotating word is easy to miss.

## Pick by what matters

| Need | Use |
| --- | --- |
| Auto-rotate in a headline | words={[…]} (interval 2400 ms) |
| Synced to your own carousel or tabs | index={i} onIndexChange={setI} |
| Centered headline | align="center" |
| Stop rotating (e.g. on hover) | paused |

## Usage

```tsx
import { WordRotate } from "@/components/goodui/word-rotate"

export function Hero() {
  return (
    <h1 className="text-4xl font-semibold tracking-tight">
      Online booking for{" "}
      <WordRotate words={["cleaners", "hair salons", "dog groomers", "tutors"]} className="text-primary" />
    </h1>
  )
}
```

### Controlled, synced with a feature list

```tsx
const [i, setI] = React.useState(0)

<h2 className="text-3xl font-semibold">
  <WordRotate words={["Bookings", "Invoices", "Reminders"]} index={i} onIndexChange={setI} align="center" />
  {" "}on autopilot
</h2>
```

## API

### WordRotate

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| words (required) | `string[]` | — | Words or short phrases shown one at a time, in order. |
| interval | `number` | `2400` | Milliseconds each word stays before the next one. |
| index | `number` | — | Controlled index of the visible word. |
| defaultIndex | `number` | `0` | Starting word when uncontrolled. |
| onIndexChange | `(index: number) => void` | — | Called with the next index on every automatic rotation. |
| paused | `boolean` | `false` | Stop auto-rotating (controls and `index` still work). |
| align | `"start" \| "center" \| "end"` | `"start"` | Where the word sits while the box resizes. |

Also accepts every <span> attribute.

## Accessibility

- An sr-only span holds the current word; the animated copies are aria-hidden.
- It is not a live region, so screen readers are not interrupted on every rotation.

## Motion

- The outgoing word slides up 0.7em and blurs while the next slides in from below, on a spring (stiffness 300, damping 30, mass 0.7).
- The box width springs to the incoming word (stiffness 260, damping 30, mass 0.8), so the words around it glide; the very first measurement is applied without animation.
- Rotation waits `interval` ms (2400) per word and pauses while off-screen, while the tab is hidden and when paused is set.
- Reduced motion: words cross-fade in 0.15 s and the width changes instantly.

## Notes for AI

- words is required and needs at least two entries to rotate.
- interval is milliseconds.
- In controlled mode, update index from onIndexChange, or rotation stops at the same word.
- It renders an inline-block <span>; put it inside your heading and style color and weight with className.
- Keep the words similar in length when possible, so the sentence does not reflow heavily.

## FAQ

**Why does the sentence not jump when the word changes?**

The word sits in a box whose width springs to the next word's measured width, so neighbouring words move smoothly. It re-measures when fonts load.

**Can I drive it from buttons?**

Yes, pass index (and onIndexChange); setting paused stops only the automatic rotation.

## Related

- typewriter: https://goodui.dev/components/text/typewriter
- text-morph: https://goodui.dev/components/text/text-morph
- text-reveal: https://goodui.dev/components/text/text-reveal
- heading: https://goodui.dev/components/core/heading

Last updated: 2026-11-02
