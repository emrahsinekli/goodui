# Suggestion chips

> Starter prompts that stagger in on springs, lift on hover and fill the composer on click, as pills, cards with hints or a scrolling row with faded edges; swapping the set replays the entrance.

Prompt suggestion chips for React AI chat: staggered entrance, hover lift, cards or a scrolling row, fills the composer

Page: https://goodui.dev/components/ai/suggestion-chips

## Install

```bash
npx shadcn@latest add @goodui/suggestion-chips
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/suggestion-chips.json`. The file lands in `components/goodui/suggestion-chips.tsx`.

## When to use

- The empty state of a chat: three to six starter prompts that show what the assistant can do.
- Follow-up ideas under an answer ("Draft the SMS", "Show the query").
- Mobile layouts: the scroll variant keeps one row with faded edges.

## When not to use

- Selecting filters or tags: use toggle-group or badge chips.
- Dozens of options: a searchable list is faster than a wall of chips.

## Pick by what matters

| Need | Use |
| --- | --- |
| Compact pills | variant="chip" (default) |
| Icon, title and a hint line | variant="card" |
| One scrolling row | variant="scroll" |
| Keep only the picked chip | clearOnSelect |
| Replay the entrance for a new set | change playKey |

## Usage

```tsx
import { SuggestionChips } from "@/components/goodui/suggestion-chips"
import { ChatComposer } from "@/components/goodui/chat-composer"

const [draft, setDraft] = React.useState("")

<SuggestionChips
  suggestions={[
    { label: "Who hasn't rebooked?", prompt: "Which clients haven't rebooked in the last 60 days?", icon: <Users /> },
    { label: "Weekly revenue recap", prompt: "Summarise this week's revenue against last week.", icon: <ChartNoAxesCombined /> },
  ]}
  onSelect={setDraft}
/>
<ChatComposer value={draft} onValueChange={setDraft} onSubmit={send} />
```

### Plain strings

```tsx
<SuggestionChips suggestions={["Summarise this chat", "Draft a reply", "Translate to Spanish"]} onSelect={send} />
```

### Cards with hints

```tsx
<SuggestionChips variant="card" suggestions={[{ label: "Fill Tuesday afternoon", hint: "Uses your quietest hours", icon: <CalendarClock /> }]} onSelect={setDraft} />
```

## API

### SuggestionChips

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| suggestions (required) | `Suggestion[]` | — |  |
| onSelect | `(prompt: string, suggestion: Exclude<Suggestion, string>) => void` | — |  |
| variant | `"chip" \| "card" \| "scroll"` | `"chip"` | chip: pills in a wrapping row. card: icon, label and hint in a grid. scroll: one horizontal row that scrolls. |
| stagger | `number` | `0.05` | Seconds between each chip's entrance. |
| clearOnSelect | `boolean` | `false` | Hide the other chips once one is picked. |
| playKey | `React.Key` | — | Change it to replay the entrance. |
| labels | `Partial<SuggestionChipsLabels>` | — | Text for screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab / Enter / Space | Chips are buttons: Tab moves between them, Enter or Space picks one. |

## Accessibility

- The container is a group labelled "Suggested prompts" (labels.suggestions); each chip is a real <button> with its label as text.
- The scroll variant uses a mask for the faded edges, so the content stays readable and focusable.
- Built-in strings go through the labels prop for translation.

## Motion

- Chips spring in from 10px below at 0.96 scale (stiffness 480, damping 30), staggered by `stagger` seconds (50 ms by default, capped at 12 items).
- Hover lifts a chip 2px and slides its arrow; press scales it to 0.97; replaced chips fade out while new ones enter.
- Reduced motion: fades only, no lift or press scale.

## Notes for AI

- onSelect receives the prompt (or the label when prompt is missing) and the suggestion object. Pair it with a controlled ChatComposer value.
- Changing the suggestions array animates the swap; pass playKey to force a replay with the same list.
- Suggestions are keyed by label; keep labels unique within a set.

## FAQ

**Can chips wrap on mobile?**

The chip variant wraps by default. Use the scroll variant when a single row matters more.

## Related

- chat-composer: https://goodui.dev/components/ai/chat-composer
- chat-message: https://goodui.dev/components/ai/chat-message
- badge: https://goodui.dev/components/core/badge
- toggle-group: https://goodui.dev/components/core/toggle-group

Last updated: 2026-11-03
