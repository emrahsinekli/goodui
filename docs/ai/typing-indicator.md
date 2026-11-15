# Typing indicator

> Three dots waving in turn with an "Aiko is typing" sentence for one or several names, as a chat bubble, inline or dots only, mounting and leaving on a spring; reduced motion keeps the dots still.

Typing indicator for React chat: three-dot wave with an "Aiko is typing" label, bubble, inline and dots-only variants

Page: https://goodui.dev/components/ai/typing-indicator

## Install

```bash
npx shadcn@latest add @goodui/typing-indicator
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/typing-indicator.json`. The file lands in `components/goodui/typing-indicator.tsx`.

## When to use

- The gap between sending a message and the first token of the answer.
- Human chat where one or more people are typing ("Aiko and Sam are typing").
- Inline status next to a name or in a header (inline or dots variant).

## When not to use

- Once tokens arrive: switch to streaming-text or chat-message with streaming.
- Long waits with known steps: reasoning-block or multi-step-loader say what is happening.

## Pick by what matters

| Need | Use |
| --- | --- |
| In the message list | variant="bubble" with avatar |
| Next to a name | variant="inline" |
| Just the dots | variant="dots" (the sentence stays for screen readers) |
| Several people | names={["Aiko", "Sam"]} |

## Usage

```tsx
import { TypingIndicator } from "@/components/goodui/typing-indicator"

<TypingIndicator names="Aiko" show={waitingForFirstToken} avatar={<Sparkles />} />
```

### Count instead of names

```tsx
<TypingIndicator variant="inline" names={typers} labels={{ typing: (n) => `${n.length} people are typing` }} />
```

### German

```tsx
<TypingIndicator names="Aiko" labels={{ typing: (n) => `${n.join(" und ")} schreibt…` }} />
```

## API

### TypingIndicator

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| names | `string \| string[]` | — | Who is typing. |
| show | `boolean` | `true` | Mount and unmount with an animation. |
| variant | `"bubble" \| "inline" \| "dots"` | `"bubble"` | bubble: a chat bubble with the dots. inline: dots and the sentence on one line. dots: dots only (the sentence stays for screen readers). |
| size | `"sm" \| "md" \| "lg"` | `"md"` |  |
| avatar | `React.ReactNode` | — | Avatar or icon shown before the bubble. |
| labels | `Partial<TypingIndicatorLabels>` | — | Text for screen readers; pass translations here. |

Also accepts every <div> attribute.

## Accessibility

- The root is role="status" with aria-live="polite", so showing it announces "Aiko is typing" once; the dots are aria-hidden.
- The dots variant keeps the sentence visually hidden; bubble and inline show it.
- Built-in strings go through the labels prop for translation (the sentence is a function of the names).

## Motion

- Three dots rise 35% and brighten in turn on a 1.2 s loop, offset by 150 ms each (CSS keyframes).
- show mounts it with a spring from 0.92 scale and 6px below (stiffness 520, damping 30) and unmounts with a 140 ms fade.
- Reduced motion: the dots stay still at 70% opacity and the entrance is a fade.

## Notes for AI

- Toggle show rather than conditionally rendering it, so the exit animation plays.
- names accepts a string or an array; with none, the sentence is "Typing".
- Place the bubble variant where the assistant's next message will appear; it uses the same 28px avatar slot as chat-message.

## FAQ

**Does it announce every time the names change?**

Yes, the live region reads the new sentence; keep name changes infrequent.

## Related

- chat-message: https://goodui.dev/components/ai/chat-message
- streaming-text: https://goodui.dev/components/ai/streaming-text
- spinners: https://goodui.dev/components/feedback/spinners
- reasoning-block: https://goodui.dev/components/ai/reasoning-block

Last updated: 2026-11-03
