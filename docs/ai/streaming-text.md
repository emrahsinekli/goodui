# Streaming text

> Reveals an answer token by token at a steady speed with a cursor that blinks while waiting for more, stop and resume, word or character mode, and smooth catch-up when uneven SSE chunks arrive; reduced motion shows sentence chunks.

Streaming text effect for React: token-by-token reveal with a cursor, stop and resume, smooth catch-up for live streams

Page: https://goodui.dev/components/ai/streaming-text

## Install

```bash
npx shadcn@latest add @goodui/streaming-text
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/streaming-text.json`. The file lands in `components/goodui/streaming-text.tsx`.

## When to use

- Assistant answers that arrive over SSE or websockets: pass the accumulated text and the reveal catches up smoothly instead of jumping with every chunk.
- Pre-written text that should read like it is being generated (demos, onboarding assistants).
- A Stop button: set playing to false and the text freezes where it is; true resumes.

## When not to use

- Marketing typewriter loops that type and delete phrases: use typewriter.
- Markdown-formatted answers: use chat-message's content, which keeps its own caret.
- Text that must be read instantly (errors, form feedback): render it plainly.

## Pick by what matters

| Need | Use |
| --- | --- |
| A caret | cursor="bar" (off by default; tokens settle from a 4px blur instead) |
| Live API stream | text = all chunks so far, streaming until the final event |
| Whole words appearing | by="word" |
| Restore history without replay | initialRevealed="all" |
| Replay | change resetKey |
| Cursor style | cursor="bar" \| "block" \| "dot" \| false |

## Usage

```tsx
import { StreamingText } from "@/components/goodui/streaming-text"

export function Answer({ text, done }: { text: string; done: boolean }) {
  const [playing, setPlaying] = React.useState(true)
  return (
    <div>
      <p className="text-[15px] leading-7">
        <StreamingText text={text} streaming={!done} playing={playing} speed={60} />
      </p>
      <button type="button" onClick={() => setPlaying((p) => !p)}>{playing ? "Stop" : "Resume"}</button>
    </div>
  )
}
```

### Word by word with a block cursor

```tsx
<StreamingText text={summary} by="word" cursor="block" speed={40} />
```

### Restored message, no animation

```tsx
<StreamingText text={message} initialRevealed="all" />
```

### Progress callback for an auto-scrolling list

```tsx
<StreamingText text={text} onProgress={() => listRef.current?.scrollTo({ top: 1e9 })} />
```

## API

### StreamingText

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| text (required) | `string` | — | All the text received so far. Growing it continues the stream; a different string starts over. |
| onProgress | `(revealed: number, total: number) => void` | — | Called as the reveal advances, with visible and total character counts. |
| speed | `number` | `60` | Characters per second at a steady state. When a lot of text is waiting the reveal speeds up so it catches up within about a second. |
| by | `"char" \| "word"` | `"char"` | Reveal unit: single characters or whole words. |
| playing | `boolean` | `true` | false pauses the reveal where it is (a Stop button); true resumes. |
| streaming | `boolean` | `false` | More text may still arrive: the cursor stays and blinks while waiting. Set false once the response is complete. |
| cursor | `"bar" \| "block" \| "dot" \| false` | `false` | Cursor style, or false for none (the default). |
| cursorWhenDone | `boolean` | `false` | Keep the cursor after the text is complete and not streaming. |
| fade | `boolean` | `true` | New tokens fade in from a 4px blur instead of popping. |
| initialRevealed | `number \| "all"` | `0` | Characters already visible at mount, or "all" to show restored history without replaying it. |
| resetKey | `React.Key` | — | Change it to replay from the start. |
| onComplete | `() => void` | — | Called when every character of `text` is visible and `streaming` is false. |
| labels | `Partial<StreamingTextLabels>` | — | Text for screen readers; pass translations here. |

Also accepts every <span> attribute.

## Accessibility

- While text is still being revealed, screen readers get the full text in a visually hidden span and the animated copy is aria-hidden; once complete and not streaming, the visible text is the only copy.
- A visually hidden "Streaming" label (labels.streaming) is present while the reveal is active.
- Reduced motion replaces character-by-character reveal with sentence-sized chunks every 140 ms, and the cursor does not blink.

## Motion

- Characters are revealed on a requestAnimationFrame loop at `speed` characters per second; when the unread backlog grows (a burst of chunks) the rate rises so it never lags more than about a second behind the stream.
- The last 18 characters fade in with a 0.3 s blur-to-sharp CSS animation (fade).
- The cursor is solid while text is arriving and blinks at 1 Hz while waiting for more; the dot cursor pulses instead.
- Reduced motion: chunks appear whole, no fade, static cursor.

## Performance

- Only the last 18 characters are individual spans; the rest is one text node. The loop stops when the text is fully revealed, when playing is false and when the tab is hidden (requestAnimationFrame pauses in background tabs).

## Notes for AI

- Always pass the whole text received so far, not the latest chunk; the component works out what is new.
- Keep streaming true until the final event; it keeps the cursor and the hidden full-text copy in place. onComplete fires only when everything is revealed and streaming is false.
- A text that does not start with what was already shown is treated as a new message and starts from zero.
- Use resetKey to replay the same text; initialRevealed="all" to show restored history instantly.
- The root is a <span> with whitespace-pre-wrap; add className="block" to use it as a block.

## FAQ

**Why not just render the chunks as they come?**

Chunk sizes and intervals are uneven, so plain rendering stutters. The steady rate with catch-up reads as one calm stream.

**Can I render markdown with it?**

Not directly; it reveals plain text. chat-message renders markdown with its own streaming caret.

## Related

- chat-message: https://goodui.dev/components/ai/chat-message
- typewriter: https://goodui.dev/components/text/typewriter
- typing-indicator: https://goodui.dev/components/ai/typing-indicator
- chat-composer: https://goodui.dev/components/ai/chat-composer

Last updated: 2026-11-04
