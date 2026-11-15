# Typewriter

> Types and deletes a list of phrases with a human rhythm and a caret that only blinks while idle; works as an animated input placeholder.

Typewriter effect for React and shadcn: typing text and animated placeholder

Page: https://goodui.dev/components/text/typewriter

## Install

```bash
npx shadcn@latest add @goodui/typewriter
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/typewriter.json`. The file lands in `components/goodui/typewriter.tsx`.

## When to use

- A hero line that types several use cases in turn ("Book a deep clean…", "Send a quote…").
- An animated placeholder behind a search or AI prompt input, paused while the input is focused.
- Chat or assistant previews where text should appear as if typed.

## When not to use

- Swapping one word inside a sentence: use word-rotate, which keeps the sentence readable at all times.
- Streaming real AI output: render the streamed tokens directly; this component types fixed phrases on a timer.
- Text that must be readable immediately (prices, instructions): use text.

## Pick by what matters

| Need | Use |
| --- | --- |
| A terminal or command demo | prompt="$" caretStyle="block" |
| AI answers | streaming-text, which fades tokens in and has no 2023 caret |
| Loop through several phrases | phrases={[…]} (loop is on by default) |
| Type once and stop | phrases="…" loop={false} |
| Animated input placeholder | paused={focused \|\| value !== ""}, positioned over the input |
| Slower, more deliberate typing | typeSpeed={90} pause={2400} |

## Usage

```tsx
import { Typewriter } from "@/components/goodui/typewriter"

export function Hero() {
  return (
    <h1 className="text-4xl font-semibold tracking-tight">
      Your front desk can now{" "}
      <Typewriter
        className="text-primary"
        phrases={["book deep cleans", "send quotes", "remind no-shows", "collect deposits"]}
      />
    </h1>
  )
}
```

### Animated placeholder for an AI prompt input

```tsx
const [value, setValue] = React.useState("")
const [focused, setFocused] = React.useState(false)

<div className="relative">
  <input
    value={value}
    onChange={(e) => setValue(e.target.value)}
    onFocus={() => setFocused(true)}
    onBlur={() => setFocused(false)}
    aria-label="Ask the assistant"
    className="h-11 w-full rounded-lg border bg-background px-3"
  />
  {!value && (
    <Typewriter
      paused={focused}
      phrases={["Move Maya's 3pm to Friday", "Who hasn't paid this month?", "Draft a quote for a 3-bed move-out"]}
      className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-muted-foreground"
    />
  )}
</div>
```

## API

### Typewriter

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| phrases (required) | `string \| string[]` | — | One phrase or a list of phrases typed one after another. |
| typeSpeed | `number` | `55` | Milliseconds per typed character (lightly randomised so it feels human). |
| deleteSpeed | `number` | `28` | Milliseconds per deleted character. |
| pause | `number` | `1600` | Milliseconds a finished phrase stays on screen. |
| startDelay | `number` | `300` | Milliseconds before the first character. |
| loop | `boolean` | `true` | Start again from the first phrase after the last one. |
| caret | `boolean` | `true` | Show the blinking caret. |
| caretStyle | `"bar" \| "block"` | `"bar"` | bar is a thin line; block is a terminal cell. |
| prompt | `React.ReactNode` | — | Shown before the typed text and never deleted, e.g. "$" in a terminal. |
| caretClassName | `string` | — | Classes for the caret, e.g. a color or width. |
| paused | `boolean` | `false` | Freeze typing where it is, for example while an input is focused. |
| onPhraseComplete | `(index: number) => void` | — | Called with the phrase index each time a phrase is fully typed. |

Also accepts every <span> attribute.

## Accessibility

- Screen readers get every phrase at once in an sr-only span; the typed characters and the caret are aria-hidden.
- When used as a placeholder, give the input its own aria-label; the typed text is decoration.

## Motion

- Types one character every `typeSpeed` ms (55), randomized between 0.6x and 1.4x so it feels human; deletes at `deleteSpeed` ms (28) per character.
- A finished phrase stays for `pause` ms (1600); the first character waits `startDelay` ms (300).
- The caret blinks (1.05 s, step-end) only while idle and stays solid while typing or deleting.
- Reduced motion: whole phrases appear without typing and swap every 1.5 × pause; the caret does not blink.

## Notes for AI

- The prop is phrases (a string or string[]), not text, words or strings.
- All timing props are milliseconds.
- paused freezes typing where it is; use it while an input is focused instead of unmounting.
- loop={false} stops after the last phrase stays on screen; with one phrase and loop on, it deletes and retypes the same phrase.
- It renders a <span>, so put it inside your heading or paragraph rather than wrapping them.

## FAQ

**Does the caret take my text color?**

Yes, it is bg-current. Change it with caretClassName, for example caretClassName="bg-primary".

**Can I know when a phrase finishes?**

onPhraseComplete is called with the phrase index each time a phrase is fully typed.

## Related

- word-rotate: https://goodui.dev/components/text/word-rotate
- text-reveal: https://goodui.dev/components/text/text-reveal
- scramble-text: https://goodui.dev/components/text/scramble-text
- text-morph: https://goodui.dev/components/text/text-morph

Last updated: 2026-11-04
