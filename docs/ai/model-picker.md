# Model picker

> Model dropdown grouped by provider with icon slots, speed and quality meters that grow in, context window and price per million tokens, a gliding highlight and full keyboard support with type-ahead.

AI model picker dropdown for React: provider icons, speed and quality meters, context window, price per 1M tokens, keyboard navigation

Page: https://goodui.dev/components/ai/model-picker

## Install

```bash
npx shadcn@latest add @goodui/model-picker
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/model-picker.json`. The file lands in `components/goodui/model-picker.tsx`.

## When to use

- Letting people pick the model for a chat, an agent or a batch job, with enough information to choose (speed, quality, context, price).
- Toolbars and composers: the ghost, small variant fits next to other controls.
- Multi-provider products where rows should be grouped by provider.

## When not to use

- A generic single-select field without model metadata: use select.
- Thousands of options with search: use combobox.
- Comparing models in depth: a table; the picker shows one line of facts per model.

## Pick by what matters

| Need | Use |
| --- | --- |
| Field in a settings form | variant="outline" size="md" |
| Inside a composer or toolbar | variant="ghost" size="sm" showMeters={false} |
| Flat list, no provider headings | groupByProvider={false} |
| Real logos | providerIcons={{ OpenAI: <Logo /> }} or icon per model |
| Retired model still listed | disabled on the model |

## Usage

```tsx
import { ModelPicker, type ModelOption } from "@/components/goodui/model-picker"

const MODELS: ModelOption[] = [
  { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", provider: "Anthropic", speed: 4, quality: 5, context: 200_000, price: { input: 3, output: 15 }, badge: "Recommended" },
  { id: "gpt-5-mini", name: "GPT-5 mini", provider: "OpenAI", speed: 5, quality: 3, context: 400_000, price: { input: 0.25, output: 2 } },
]

<ModelPicker models={MODELS} value={model} onValueChange={setModel} />
```

### Compact trigger aligned to the end

```tsx
<ModelPicker models={MODELS} variant="ghost" size="sm" align="end" showMeters={false} />
```

### German prices and labels

```tsx
<ModelPicker models={MODELS} locale="de-DE" labels={{ chooseModel: "Modell wählen", speed: "Tempo", quality: "Qualität" }} />
```

## API

### ModelPicker

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| models (required) | `ModelOption[]` | — |  |
| value | `string` | — | Selected model id (controlled). |
| defaultValue | `string` | — |  |
| onValueChange | `(id: string, model: ModelOption) => void` | — |  |
| providerIcons | `Record<string, React.ReactNode>` | — | Icon per provider name, e.g. { OpenAI: <OpenAiLogo />, Anthropic: <AnthropicLogo /> }. Missing ones get a lettered tile. |
| variant | `"outline" \| "ghost"` | `"outline"` | Trigger look: a bordered field or a quiet ghost button for toolbars. |
| size | `"sm" \| "md"` | `"md"` |  |
| groupByProvider | `boolean` | `true` | Group rows under provider headings. |
| showMeters | `boolean` | `true` |  |
| showContext | `boolean` | `true` |  |
| showPrice | `boolean` | `true` |  |
| align | `"start" \| "end"` | `"start"` | Which trigger edge the menu aligns to. |
| locale | `string` | `"en-US"` | Locale for the context window and prices. |
| placeholder | `string` | — |  |
| disabled | `boolean` | — |  |
| labels | `Partial<ModelPickerLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space / ArrowDown / ArrowUp | On the trigger: opens the list and focuses it. |
| ArrowDown / ArrowUp | Moves the active row, skipping disabled models, and wraps. |
| Home / End | First or last enabled model. |
| Letters | Type-ahead: jumps to the first model whose name starts with what you typed (600 ms window). |
| Enter / Space | Selects the active model and returns focus to the trigger. |
| Escape | Closes and returns focus to the trigger. Tab closes too. |

## Accessibility

- The trigger has aria-haspopup="listbox", aria-expanded, aria-controls and an aria-label that includes the current model name.
- The list is role="listbox" with aria-activedescendant; rows are role="option" with aria-selected and aria-disabled.
- Meters are announced as text ("Speed 4 of 5"); the bars themselves are decorative. The selected row has a visually hidden "Selected".
- Built-in strings go through the labels prop for translation.

## Motion

- The list springs open (stiffness 520, damping 34) from the trigger's edge and flips above it when fewer than 380px remain below.
- Rows fade in staggered by 25 ms (up to 8 rows); the highlight glides between rows as a shared-layout spring; meter bars grow from the baseline with a 40 ms stagger when the list opens.
- Reduced motion: the list fades, rows do not stagger, the highlight jumps and the bars appear instantly.

## Notes for AI

- Prices are USD per million tokens; context is in tokens and formatted compactly (200K, 1M).
- onValueChange receives (id, model). Pass value to control it; otherwise it starts from defaultValue or the first model.
- Provider icons: providerIcons keyed by the provider string, or icon on a model. Without either, a lettered tile colored from the provider name is used.
- The list is rendered in place (absolute), not in a portal; a parent with overflow:hidden will clip it.

## FAQ

**Can I show only some facts?**

Yes: showMeters, showContext and showPrice each hide their column.

**How do I add a price unit other than per 1M?**

Set labels.perMillion; it is the tooltip on the price. The numbers themselves are whatever you pass.

## Related

- chat-composer: https://goodui.dev/components/ai/chat-composer
- select: https://goodui.dev/components/core/select
- combobox: https://goodui.dev/components/core/combobox
- dropdown-menu: https://goodui.dev/components/core/dropdown-menu

Last updated: 2026-11-03
