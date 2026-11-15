# Scramble text

> Text scrambles through random glyphs and resolves left to right on mount, on view, on hover or on demand; renders the real text on the server.

Scramble text effect for React and shadcn: decrypt and hacker text animation

Page: https://goodui.dev/components/text/scramble-text

## Install

```bash
npx shadcn@latest add @goodui/scramble-text
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/scramble-text.json`. The file lands in `components/goodui/scramble-text.tsx`.

## When to use

- Short technical labels that should feel computed: API key names, status codes, "Deploying…".
- Nav links or buttons that scramble once on hover for a developer-tool vibe (trigger="hover").
- Revealing a generated value (a confirmation code, a booking reference) after an action, with replay.

## When not to use

- Headlines and long sentences: random glyphs make them unreadable for most of the animation. Use text-reveal.
- Switching between two readable labels: use text-morph, which keeps shared letters in place.
- Numbers that change: use number-flow.

## Pick by what matters

| Need | Use |
| --- | --- |
| Play on page load | trigger="mount" (default) |
| Play when it scrolls into view | trigger="view" |
| Play on hover | trigger="hover" |
| Play from your code | trigger="manual" and change replay (e.g. a counter) |
| Numbers-only glyphs | characters="0123456789" |

## Usage

```tsx
import { ScrambleText } from "@/components/goodui/scramble-text"

export function BookingConfirmed({ reference }: { reference: string }) {
  return (
    <div className="rounded-xl border bg-card p-6 text-center">
      <p className="text-sm text-muted-foreground">Booking reference</p>
      <ScrambleText text={reference} trigger="view" className="font-mono text-2xl font-semibold tracking-widest" />
    </div>
  )
}
```

### Replay from a button

```tsx
const [run, setRun] = React.useState(0)

<ScrambleText text="sk_live_••••4f2a" trigger="manual" replay={run} className="font-mono" />
<button onClick={() => setRun((n) => n + 1)}>Regenerate key</button>
```

### Hover scramble on a nav link

```tsx
<a href="/docs" className="font-mono text-sm uppercase">
  <ScrambleText text="Documentation" trigger="hover" duration={600} />
</a>
```

## API

### ScrambleText

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| text (required) | `string` | — | The final text; it is rendered as-is on the server and before the first run. |
| trigger | `"mount" \| "view" \| "hover" \| "manual"` | `"mount"` | When to play: on mount, when scrolled into view, on hover/focus (of the text or its closest link/button), or only via `replay`. |
| replay | `number \| string` | — | Change this value (e.g. a counter) to play again. |
| duration | `number` | `900` | Milliseconds until the last character resolves. |
| speed | `number` | `45` | Milliseconds between glyph changes. |
| characters | `string` | `GLYPHS` | Glyphs used while scrambling. |
| scrambledClassName | `string` | — | Classes for the not-yet-resolved part (default: 60% opacity of the current color). |
| onComplete | `() => void` | — | Called when the last character has resolved. |

Also accepts every <span> attribute.

## Accessibility

- The real text is always in an sr-only span; the scrambling copy is aria-hidden, so screen readers never read random glyphs.
- The real text is rendered on the server and before the first run; randomness only happens after mount, so there is no hydration mismatch.
- trigger="hover" also plays on keyboard focus: the span itself is not focusable, so it listens to its closest link, button or [tabindex] ancestor (focus and pointer enter). Put it inside a link or button for keyboard users to get the same effect.

## Motion

- Characters resolve left to right over `duration` ms (900); the unresolved tail re-rolls random glyphs every `speed` ms (45). Spaces are kept.
- The unresolved part is the current color at 60% opacity, so it keeps contrast on muted or tinted backgrounds (override with scrambledClassName).
- Reduced motion: no scramble; the real text is shown and onComplete is not called.

## Performance

- Uses requestAnimationFrame for at most `duration` ms per run and cancels on unmount; nothing runs between plays.

## Notes for AI

- Use the text prop; children are not accepted.
- duration and speed are milliseconds.
- replay replays on every change of its value, whatever the trigger; the first value does not play.
- Pair it with a monospace font (font-mono) so the width does not jump while glyphs change.

## FAQ

**Why does the width jump while scrambling?**

Random glyphs have different widths in proportional fonts. Use a monospace font, or restrict characters to glyphs of similar width.

**Is the real text in the server HTML?**

Yes. The server and the first client render show the real text; the scramble only starts after mount.

## Related

- text-morph: https://goodui.dev/components/text/text-morph
- typewriter: https://goodui.dev/components/text/typewriter
- text-reveal: https://goodui.dev/components/text/text-reveal
- number-flow: https://goodui.dev/components/numbers/number-flow

Last updated: 2026-11-02
