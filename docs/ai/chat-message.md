# Chat message

> User, assistant and system messages with avatars, grouping, a hover actions row (copy, good/bad, retry, edit), markdown-ish rendering of lists, quotes and fenced code into CodeBlocks, and a blinking caret while the answer streams.

AI chat message component for React: user and assistant bubbles with markdown, streaming caret and actions

Page: https://goodui.dev/components/ai/chat-message

## Install

```bash
npx shadcn@latest add @goodui/chat-message
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/chat-message.json`. The file lands in `components/goodui/chat-message.tsx`.

## When to use

- Any assistant conversation: the user's prompt in a bubble, the assistant's answer as formatted text with copy, feedback and retry.
- Answers that arrive progressively: pass the text so far and streaming, and the caret blinks at the end until it is complete.
- Rich replies with lists, inline code and fenced code blocks, which become copyable CodeBlocks automatically.
- Follow-up messages from the same author (grouped) and system notes centred between messages.

## When not to use

- Human-to-human messaging with read receipts and reactions: build on a plain list; this is tuned for assistant answers.
- Full markdown (tables, nested lists, HTML): render with a markdown library and pass the result as children instead of content.
- The input itself: use chat-composer.

## Pick by what matters

| Need | Use |
| --- | --- |
| Assistant text on the page, user in a bubble (ChatGPT style) | variant="flat" (default) |
| Both sides in bubbles | variant="bubble" |
| Brand-colored user bubble | tone="primary" |
| Answer still arriving | streaming (caret, actions hidden) |
| Custom body, e.g. StreamingText or cards | children instead of content |
| Only the markdown renderer | <MessageMarkdown text=… /> |

## Usage

```tsx
import { ChatMessage } from "@/components/goodui/chat-message"

export function Thread({ messages }: { messages: { id: string; role: "user" | "assistant"; text: string; done: boolean }[] }) {
  return (
    <div className="flex flex-col">
      {messages.map((m, i) => (
        <ChatMessage
          key={m.id}
          role={m.role}
          name={m.role === "assistant" ? "Aiko" : "Lena"}
          content={m.text}
          streaming={!m.done}
          grouped={messages[i - 1]?.role === m.role}
          onFeedback={(v) => rate(m.id, v)}
          onRetry={() => regenerate(m.id)}
        />
      ))}
    </div>
  )
}
```

### Streaming with StreamingText as the body

```tsx
<ChatMessage role="assistant" name="Aiko" streaming={!done} copyText={answer}>
  <StreamingText text={answer} streaming={!done} onComplete={() => setDone(true)} className="block text-[15px] leading-7" />
</ChatMessage>
```

### Tool calls under the answer

```tsx
<ChatMessage role="assistant" content="I found a slot and held it for ten minutes.">
  <div className="mt-3 flex flex-col gap-2">
    <ToolCall name="find_free_slot" args={{ stylist: "Lena" }} status="success" duration={640} />
  </div>
</ChatMessage>
```

### Failed user message with retry

```tsx
<ChatMessage role="user" content="Book Maya for Saturday" status="error" onRetry={resend} />
```

## API

### ChatMessage

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| role (required) | `"user" \| "assistant" \| "system"` | — |  |
| onCopy | `(text: string) => void` | — |  |
| content | `string` | — | Message text, rendered markdown-ish. Children render under it (tool calls, cards, custom content). |
| name | `string` | — | Author shown above assistant messages; also the fallback for the avatar initials. |
| avatar | `React.ReactNode` | — | Image URL or any node (icon, initials). Defaults to a sparkle for assistants and the user's initial. |
| time | `string` | — | Short time or date text, e.g. "14:32". |
| status | `"sending" \| "sent" \| "error"` | — | Delivery state for user messages. |
| streaming | `boolean` | `false` | The answer is still arriving: shows a caret and hides the actions row. |
| grouped | `boolean` | `false` | A follow-up message from the same author: no avatar or name, tighter spacing. |
| variant | `"flat" \| "bubble"` | `"flat"` | flat: assistant text sits on the page, user text in a bubble. bubble: both in bubbles. |
| tone | `"neutral" \| "primary"` | `"neutral"` | User bubble color. |
| actions | `boolean` | `true` | Show the actions row (copy and the handlers you pass). |
| copyText | `string` | — | Text copied by the copy action; defaults to content. |
| onFeedback | `(value: ChatFeedback) => void` | — | Thumbs up/down; clicking the active one clears it. |
| feedback | `"up" \| "down" \| null` | — | Controlled feedback state. |
| onRetry | `() => void` | — | Shown as a retry button on assistant messages and on failed user messages. |
| onEdit | `() => void` | — | Shown as an edit button on user messages. |
| animate | `boolean` | `true` | Fade and rise in on mount. |
| labels | `Partial<ChatMessageLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

### MessageMarkdown

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| text (required) | `string` | — | Markdown-ish text. |
| streaming | `boolean` | `false` | Appends a blinking caret to the last block. |

Also accepts every <div> attribute.

## Accessibility

- The author name is visible for assistant messages and screen-reader only for user messages.
- Action buttons are real buttons with aria-labels (Copy, Good response, Bad response, Retry, Edit) and aria-pressed on the feedback pair; they appear on hover or keyboard focus and are always visible on touch screens.
- Copy announces "Copied" through a polite live region.
- Links in content open in a new tab with rel="noreferrer". System messages use role="note".
- Built-in strings (labels for actions, statuses, default author names) go through the labels prop for translation.

## Motion

- A message fades and rises 8px on mount on a spring (stiffness 420, damping 32); animate={false} turns it off for restored history.
- The streaming caret is a 1 s step blink in CSS; feedback icons pop on a spring when toggled; the copy icon cross-fades into a check for 1.6 s.
- Reduced motion: the entrance has zero duration, the caret stops blinking and icon pops become plain swaps.

## Performance

- The markdown-ish parser is a single pass over lines, memoised on content, so a streaming message re-parses once per received chunk and never on unrelated re-renders.

## Notes for AI

- Pass content as a string for markdown-ish rendering (paragraphs, #-headings, -/1. lists, > quotes, **bold**, *italic*, `code`, [links](url) and ``` fences). Anything else goes in children.
- Set streaming while the answer is incomplete and clear it at the end; the actions row is hidden while streaming.
- grouped hides the avatar and name; compute it from the previous message's role.
- onFeedback receives "up", "down" or null (cleared); pass feedback to control it.
- Fenced code blocks render CodeBlock (installed alongside); the language after the fence picks the tokenizer.

## FAQ

**Does it render tables or nested lists?**

No. The built-in renderer covers what assistants usually emit. For full markdown, render it yourself and pass the nodes as children.

**How do I show an avatar image?**

Pass avatar as a URL string; it renders in the 28px circle. Pass a node for an icon or initials.

## Related

- chat-composer: https://goodui.dev/components/ai/chat-composer
- streaming-text: https://goodui.dev/components/ai/streaming-text
- code-block: https://goodui.dev/components/ai/code-block
- tool-call: https://goodui.dev/components/ai/tool-call
- typing-indicator: https://goodui.dev/components/ai/typing-indicator

Last updated: 2026-11-03
