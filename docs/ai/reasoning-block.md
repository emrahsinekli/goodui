# Reasoning block

> "Thinking 8.7s" disclosure with a live tenths timer, a shimmering label while the model reasons, the current step previewed under the header and the full step list plus notes folded inside.

"Thinking 8.7s" reasoning disclosure for React AI apps: live timer, shimmering label and step summaries

Page: https://goodui.dev/components/ai/reasoning-block

## Install

```bash
npx shadcn@latest add @goodui/reasoning-block
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/reasoning-block.json`. The file lands in `components/goodui/reasoning-block.tsx`.

## When to use

- Models with visible reasoning or thinking summaries: show the time spent and the steps while the user waits, then fold them away under "Thought for 8.7s".
- Agents that report progress as short step titles before the final answer.

## When not to use

- External tool calls with arguments and outputs: use tool-call.
- A plan with statuses and nesting: use agent-plan.
- Plain loading with no steps to show: use spinners or typing-indicator.

## Pick by what matters

| Need | Use |
| --- | --- |
| Live thinking | thinking plus steps that grow as summaries arrive |
| Finished with the API's duration | thinking={false} duration={seconds} |
| Full reasoning text | children (rendered under the steps) |
| No current-step line under the header | preview={false} |

## Usage

```tsx
import { ReasoningBlock } from "@/components/goodui/reasoning-block"

<ReasoningBlock thinking={!done} steps={summaries.map((s) => ({ title: s }))} duration={done ? seconds : undefined}>
  {reasoningText}
</ReasoningBlock>
```

### Expanded by default after it finishes

```tsx
<ReasoningBlock duration={8.7} defaultOpen steps={[{ title: "Checked Saturday's capacity" }, { title: "Balayage needs 150 minutes" }]} />
```

### Translated labels

```tsx
<ReasoningBlock thinking labels={{ thinking: (s) => `Denke nach ${s}`, thought: (s) => `${s} nachgedacht`, toggle: "Begründung anzeigen" }} />
```

## API

### ReasoningBlock

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| thinking | `boolean` | `false` | The model is still reasoning: the label shimmers and the timer runs. |
| duration | `number` | — | Final duration in seconds, when you have it from the API. Otherwise the elapsed time is measured here. |
| steps | `ReasoningStep[]` | `[]` | Step summaries, shown in order; the last one is the current step while thinking. |
| children | `React.ReactNode` | — | Free-form reasoning text shown under the steps. |
| open | `boolean` | — |  |
| defaultOpen | `boolean` | `false` |  |
| onOpenChange | `(open: boolean) => void` | — |  |
| preview | `boolean` | `true` | Show the current step under the header while collapsed and thinking. |
| labels | `Partial<ReasoningBlockLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | Toggles the step list on the header button. |

## Accessibility

- The header is a <button> with aria-expanded, aria-controls and an aria-label that includes the current text ("Show reasoning: Thinking 3.2s").
- The shimmer is a decorative gradient over the label; under reduced motion it is plain text.
- While collapsed and thinking, the current step is announced through a visually hidden polite live region; the animated preview line under the header is decorative, and the step list is ordinary text.
- Built-in strings go through the labels prop for translation.

## Motion

- While thinking, the label shimmers (a 1.6 s gradient sweep clipped to the text) and the timer updates every 100 ms with one decimal.
- The current step below the header cross-fades (4px rise, 0.2 s) each time a new summary arrives; the list items spring in (stiffness 480, damping 32) and the current one has a pulsing dot.
- The body opens to its real height on a spring (stiffness 420, damping 36).
- Reduced motion: no shimmer, no pulse, fades only, instant open and close.

## Notes for AI

- Set thinking while reasoning is in progress; the component measures the elapsed time itself. Pass duration (seconds) when the API reports it, it wins once thinking is false.
- steps is the list so far; append summaries as they arrive. The last one is treated as the current step while thinking.
- Put the raw reasoning text in children; it renders muted under the steps.
- With no steps and no children, the header is static text and not a button.

## FAQ

**Does the timer keep running if the component re-renders?**

Yes, it is anchored to the moment thinking became true and only stops when thinking turns false.

**Can I hide the time?**

Pass labels.thinking and labels.thought that ignore the seconds argument.

## Related

- tool-call: https://goodui.dev/components/ai/tool-call
- agent-plan: https://goodui.dev/components/ai/agent-plan
- streaming-text: https://goodui.dev/components/ai/streaming-text
- chat-message: https://goodui.dev/components/ai/chat-message

Last updated: 2026-11-03
