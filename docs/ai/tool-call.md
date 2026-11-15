# Tool call

> Collapsible card for an agent's tool call: name and arguments in the header, a status that morphs from spinner to drawn check or error, a live duration while running, and argument and output panes inside.

Tool call card for AI agents in React: name, arguments, running spinner to check or error, duration and output pane

Page: https://goodui.dev/components/ai/tool-call

## Install

```bash
npx shadcn@latest add @goodui/tool-call
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/tool-call.json`. The file lands in `components/goodui/tool-call.tsx`.

## When to use

- Showing what an agent did: each function or MCP tool call with its arguments, a live status and the result.
- Long-running calls where the user wants to see progress (duration ticks while running).
- Failures the user should read, with the error message in a rose pane.

## When not to use

- A whole multi-step plan with nesting and overall progress: use agent-plan.
- Model reasoning rather than external calls: use reasoning-block.
- Logs with hundreds of entries: a virtualized list; this card is for a handful of calls per message.

## Pick by what matters

| Need | Use |
| --- | --- |
| Standalone card | variant="card" (default) |
| Quiet row inside a chat message | variant="inline" |
| Known duration from the API | duration (ms); otherwise it is measured while status is running |
| Start expanded | defaultOpen, or open/onOpenChange to control it |

## Usage

```tsx
import { ToolCall } from "@/components/goodui/tool-call"

<ToolCall
  name="search_bookings"
  args={{ client: "Maya Chen", range: "last 90 days" }}
  status={call.status}            // "pending" | "running" | "success" | "error"
  output={call.result}            // string renders in a monospace pane
  error={call.error}
/>
```

### Inline rows under an answer

```tsx
<ToolCall variant="inline" name="get_client" args={{ id: "cl_2291" }} status="success" duration={312} output={json} />
<ToolCall variant="inline" name="read_policy" title="Reading the cancellation policy" args="deposits.md" status="success" duration={88} />
```

### Custom icon and a React node as output

```tsx
<ToolCall name="find_free_slot" icon={<Calendar />} status="success" output={<SlotCard slot={slot} />} defaultOpen />
```

## API

### ToolCall

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| name (required) | `string` | — | Tool name, shown in monospace. |
| title | `React.ReactNode` | — | Friendlier text shown instead of the name. |
| args | `Record<string, unknown> \| string` | — | Arguments as an object (rendered as a key/value grid) or a preformatted string. |
| status | `"pending" \| "running" \| "success" \| "error"` | `"pending"` |  |
| output | `React.ReactNode` | — | Result; strings render in a scrollable monospace pane, nodes as-is. |
| error | `string` | — | Error message shown in the body when status is "error". |
| duration | `number` | — | Duration in ms. When omitted it is measured from the moment status becomes "running". |
| open | `boolean` | — |  |
| defaultOpen | `boolean` | `false` |  |
| onOpenChange | `(open: boolean) => void` | — |  |
| icon | `React.ReactNode` | — | Replaces the wrench icon. |
| variant | `"card" \| "inline"` | `"card"` | card: bordered; inline: a quiet row for inside a message. |
| labels | `Partial<ToolCallLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | Toggles the body on the header button. |
| Tab | Moves through the header; the body contains no controls unless your output has them. |

## Accessibility

- The header is a <button> with aria-expanded and aria-controls pointing at the body.
- The status is announced as text (Waiting, Running, Done, Failed) through a visually hidden span; the icons are decorative.
- The error pane is prefixed with a hidden "Error:" label. Section titles (Arguments, Output) are headings.
- Built-in strings go through the labels prop for translation.

## Motion

- Status icons swap on a spring (stiffness 520, damping 26): dashed circle, spinner, a check whose stroke draws in over 0.3 s, or a rose X.
- While running, a thin light sweeps along the bottom edge of the header and the duration ticks every 100 ms.
- The body opens to its real height on a spring (stiffness 420, damping 36).
- Reduced motion: the spinner slows to 2 s per turn, the sweep is removed, the check does not draw and the body toggles instantly.

## Notes for AI

- Drive status from your agent events: pending → running → success | error. Pass output only once you have it.
- args accepts an object (rendered as key: value rows and previewed in the header) or a preformatted string.
- duration is in milliseconds; omit it to show the measured time from when status became running.
- title replaces the monospace name with friendlier text; name is still used for the preview semantics.

## FAQ

**Can the output be more than text?**

Yes. Strings render in a scrollable monospace pane; any other React node renders as-is.

**What if a call has no arguments or output?**

The header still works; the chevron and body are omitted when there is nothing to show.

## Related

- agent-plan: https://goodui.dev/components/ai/agent-plan
- reasoning-block: https://goodui.dev/components/ai/reasoning-block
- chat-message: https://goodui.dev/components/ai/chat-message
- code-block: https://goodui.dev/components/ai/code-block

Last updated: 2026-11-03
