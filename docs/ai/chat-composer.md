# Chat composer

> Prompt input with an auto-growing textarea, attachment chips from picker, paste or drop, a slash-command menu, model and mode selectors, a token ring against the context limit, Enter or Cmd+Enter to send and a Stop button while streaming.

AI prompt composer for React: auto-growing textarea, attachments, slash commands, model and mode pickers, token counter, stop while streaming

Page: https://goodui.dev/components/ai/chat-composer

## Install

```bash
npx shadcn@latest add @goodui/chat-composer
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/chat-composer.json`. The file lands in `components/goodui/chat-composer.tsx`.

## When to use

- The input of any assistant chat: Enter sends, Shift+Enter adds a line, the button turns into Stop while the answer streams.
- Prompts that carry files (paste, drop or pick) and need a model or mode choice right there.
- Products with slash commands such as /summarize or /schedule.

## When not to use

- Plain forms and comments: use input or a textarea.
- A command palette with many actions: use command-palette-morph; the slash menu is for a handful of commands.

## Pick by what matters

| Need | Use |
| --- | --- |
| No colored focus light | halo={false} |
| Only Cmd/Ctrl+Enter should send | submitOnEnter={false} |
| File attachments | accept="image/*,.pdf" (the attach button and paste/drop appear) |
| Model picker in the footer | models (ModelOption[]) with model/onModelChange |
| Chat / Research / Agent switch | modes with mode/onModeChange |
| Context limit | maxTokens (shows the ring and blocks sending above it) |
| Your tokenizer | countTokens={(text) => …} |

## Usage

```tsx
import { ChatComposer } from "@/components/goodui/chat-composer"

<ChatComposer
  placeholder="Ask Aiko…"
  accept="image/*,.pdf"
  commands={[{ name: "summarize", description: "Summarise this chat" }, { name: "schedule", description: "Find a slot" }]}
  models={MODELS}
  modes={[{ id: "chat", label: "Chat" }, { id: "agent", label: "Agent" }]}
  maxTokens={8000}
  streaming={isStreaming}
  onStop={abort}
  onSubmit={(text, { attachments, model, mode }) => send(text, attachments, model, mode)}
/>
```

### Controlled value filled by suggestion chips

```tsx
const [draft, setDraft] = React.useState("")
<SuggestionChips suggestions={ideas} onSelect={setDraft} />
<ChatComposer value={draft} onValueChange={setDraft} onSubmit={send} />
```

### Commands that run instead of inserting

```tsx
<ChatComposer commands={COMMANDS} onCommand={(c) => run(c.name)} />
```

### With a send sound

```tsx
<ChatComposer onSubmit={send} sound />
```

## API

### ChatComposer

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| autoFocus | `boolean` | — |  |
| onKeyDown | `(e: React.KeyboardEvent<HTMLTextAreaElement>) => void` | — | Key handler on the textarea; call preventDefault to override the Enter behavior. |
| onPaste | `(e: React.ClipboardEvent<HTMLTextAreaElement>) => void` | — | Paste handler on the textarea; pasted files become attachments when `accept` is set. |
| value | `string` | — |  |
| defaultValue | `string` | `""` |  |
| onValueChange | `(value: string) => void` | — |  |
| onSubmit | `(text: string, meta: { attachments: ComposerAttachment[]; model?: string; mode?: string }) => void` | — | Called with the trimmed text and the attachments, model and mode in effect. Clears the field when uncontrolled. |
| streaming | `boolean` | `false` | The answer is streaming: the send button becomes Stop and calls onStop. |
| onStop | `() => void` | — |  |
| attachments | `ComposerAttachment[]` | — |  |
| defaultAttachments | `ComposerAttachment[]` | `[]` |  |
| onAttachmentsChange | `(attachments: ComposerAttachment[]) => void` | — |  |
| accept | `string` | — | Accept attribute for the file picker, e.g. "image/*,.pdf". Omit to hide the attach button. |
| maxAttachments | `number` | `10` |  |
| commands | `SlashCommand[]` | — | Typing "/" at the start opens this list. |
| onCommand | `(command: SlashCommand) => void` | — | Runs when a command is picked; by default the command is inserted as "/name ". |
| models | `ModelOption[]` | — | Models for a built-in ModelPicker in the footer. |
| model | `string` | — |  |
| defaultModel | `string` | — |  |
| onModelChange | `(id: string) => void` | — |  |
| modes | `ComposerMode[]` | — | Modes shown as a segmented control, e.g. Chat / Research / Code. |
| mode | `string` | — |  |
| defaultMode | `string` | — |  |
| onModeChange | `(id: string) => void` | — |  |
| maxTokens | `number` | — | Context limit; shows the counter and blocks sending above it. |
| countTokens | `(text: string) => number` | — | Your tokenizer; defaults to about one token per four characters. |
| placeholder | `string` | — | Textarea placeholder; also its accessible name. |
| minRows | `number` | `1` |  |
| maxRows | `number` | `8` |  |
| submitOnEnter | `boolean` | `true` | Enter sends (Shift+Enter adds a line). false: only Cmd/Ctrl+Enter sends. |
| disabled | `boolean` | — |  |
| footer | `React.ReactNode` | — | Extra controls at the start of the footer. |
| labels | `Partial<ChatComposerLabels>` | — | Text for built-in controls and screen readers; pass translations here. |
| halo | `boolean` | `true` | Spinning colored light on the edge while focused, faster while streaming. false keeps a plain focus ring. |
| sound | `boolean \| SoundName` | — | Plays "send" on submit when the visitor has sounds on (lib/goodui-sounds); a sound name picks another. Off by default. |

Also accepts every <form> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter | Sends (unless submitOnEnter is false or an IME composition is in progress). Shift+Enter inserts a new line. |
| Cmd/Ctrl+Enter | Always sends. |
| / at the start | Opens the command menu, filtered by what follows. |
| ArrowUp / ArrowDown | Moves through the command menu. |
| Enter / Tab | Picks the active command; Escape closes the menu. |

## Accessibility

- The textarea has an aria-label (the placeholder) and is described by a hidden hint explaining Enter and Shift+Enter.
- The command menu is a listbox with option rows; the modes are a radiogroup; the send button's label switches between Send and Stop.
- The token counter is read as "1.2K of 8K tokens" or "Over the token limit"; attachment remove buttons are labelled with the file name.
- Built-in strings go through the labels prop for translation.

## Motion

- Focus lights a spinning colored halo on the edge; streaming spins it faster. The send arrow's stem morphs into the stop square, the textarea height springs, and attachments settle in from a 4px blur.
- The textarea grows with its content between minRows and maxRows (height set from scrollHeight, no transition).
- The command menu springs up from the bottom edge (stiffness 520, damping 34) with rows staggered 30 ms; the active row highlight glides on a shared-layout spring.
- Attachment chips spring in at 0.8 scale and the row's height animates to fit; the send arrow and stop square swap with a rotate-and-scale spring; the token ring eases over 0.35 s.
- Reduced motion: menus and chips fade, the icon swap is a fade, the ring jumps.

## Notes for AI

- onSubmit gets the trimmed text and { attachments, model, mode }. When uncontrolled, the field and attachments clear after submit.
- While streaming is true the button calls onStop instead of submitting; sending is also blocked when the text is empty (and no attachments) or over maxTokens.
- The default token estimate is characters / 4; pass countTokens for your tokenizer.
- Attachments created from files get an object URL for image previews; revoke them yourself if you keep attachments around for long.
- The built-in model picker is model-picker (installed alongside); pass models to show it.

## FAQ

**How do I add my own buttons to the footer?**

Pass them as `footer`; they render after the attach button.

**Can I keep sending on Enter but insert newlines on mobile?**

Set submitOnEnter={false} on touch devices; the send button and Cmd/Ctrl+Enter still work.

## Related

- model-picker: https://goodui.dev/components/ai/model-picker
- chat-message: https://goodui.dev/components/ai/chat-message
- suggestion-chips: https://goodui.dev/components/ai/suggestion-chips
- streaming-text: https://goodui.dev/components/ai/streaming-text
- token-meter: https://goodui.dev/components/ai/token-meter

Last updated: 2026-11-04
