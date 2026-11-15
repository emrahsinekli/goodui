# Token meter

> Context window usage bar whose segments (system, history, tools, response) spring to new widths, with rolling numbers, a legend, and amber then rose tones near and over the limit.

Context window token meter for React: segmented usage bar with rolling numbers and limit warnings

Page: https://goodui.dev/components/ai/token-meter

## Install

```bash
npx shadcn@latest add @goodui/token-meter
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/token-meter.json`. The file lands in `components/goodui/token-meter.tsx`.

## When to use

- Showing how much of the model's context is used, split into system prompt, history, tool results and the response.
- Agent dashboards where the budget matters: it turns amber at 80% and rose at 95% or over.
- Per-conversation cost or quota meters with a single number.

## When not to use

- Plan quotas unrelated to tokens (seats, SMS credits): use meter.
- Live counting while typing: chat-composer has its own small ring.

## Pick by what matters

| Need | Use |
| --- | --- |
| One number | used + max |
| Breakdown with legend | segments (used is their sum) |
| Show what is left | showRemaining |
| Exact numbers | format="full" |
| Other thresholds | warnAt and dangerAt as fractions of max |

## Usage

```tsx
import { TokenMeter } from "@/components/goodui/token-meter"

<TokenMeter
  label="Context window"
  max={200_000}
  segments={[
    { label: "System prompt", value: 1_240 },
    { label: "History", value: 38_400 },
    { label: "Tool results", value: 6_120 },
    { label: "Response", value: 2_310 },
  ]}
/>
```

### Single value near the limit

```tsx
<TokenMeter label="Conversation" used={171_300} max={200_000} size="sm" />
```

### Remaining budget in full numbers

```tsx
<TokenMeter label="Remaining" used={62_500} max={128_000} showRemaining format="full" />
```

## API

### TokenMeter

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| max (required) | `number` | — | The context window. |
| used | `number` | — | Tokens used, when there is one number. |
| segments | `TokenSegment[]` | — | Breakdown by part of the context; used = sum of the values. |
| label | `React.ReactNode` | — |  |
| warnAt | `number` | `0.8` | Fraction of max where the meter turns amber. |
| dangerAt | `number` | `0.95` | Fraction of max where it turns rose. |
| showLegend | `boolean` | `true` | Show the segment legend. |
| showRemaining | `boolean` | `false` | Show the remaining count instead of used / max. |
| format | `"compact" \| "full"` | `"compact"` | Compact (12.4K) or full (12,400) numbers. |
| size | `"sm" \| "md" \| "lg"` | `"md"` |  |
| locale | `string` | `"en-US"` |  |
| labels | `Partial<TokenMeterLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Accessibility

- The bar is role="meter" with aria-valuemin, aria-valuemax, aria-valuenow and an aria-valuetext such as "38,400 of 200K tokens used. Close to the limit".
- The rolling number is aria-hidden; the meter's text carries the value for screen readers. Legend values are plain text.
- Built-in strings go through the labels prop for translation.

## Motion

- Each segment is a flex item sized by its tokens; when values change they spring to their new widths through motion's layout animation (stiffness 260, damping 30).
- The used number rolls digit by digit (number-flow, installed alongside).
- Reduced motion: widths and digits change instantly.

## Notes for AI

- Pass either used or segments; with segments, used is their sum and the legend lists them with --chart-1..5 colors unless color is set.
- max is the context window in tokens. Values above max are shown as over the limit (rose) and the bar is capped.
- format="compact" prints 38.4K / 200K; "full" prints 38,400 / 200,000 in the given locale.

## FAQ

**Can I color a segment?**

Yes, segment.color takes any CSS color, for example var(--chart-3) or an oklch value.

## Related

- meter: https://goodui.dev/components/numbers/meter
- progress: https://goodui.dev/components/numbers/progress
- number-flow: https://goodui.dev/components/numbers/number-flow
- chat-composer: https://goodui.dev/components/ai/chat-composer

Last updated: 2026-11-03
