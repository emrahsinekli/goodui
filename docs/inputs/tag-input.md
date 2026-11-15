# Tag input

> Chips input where Enter, comma or paste adds tags that spring in, Backspace arms then removes, duplicates shake, with a filtered suggestions dropdown, validation and a max count.

Tag input (chips input) with suggestions for React and shadcn

Page: https://goodui.dev/components/inputs/tag-input

## Install

```bash
npx shadcn@latest add @goodui/tag-input
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/tag-input.json`. The file lands in `components/goodui/tag-input.tsx`.

## When to use

- Free-form lists of short values: skills, service names, labels, email invites.
- When users paste lists: comma, semicolon, tab or newline separated text becomes separate tags in one go.
- When you want to suggest known values but still accept new ones (suggestions plus free typing).
- Capped lists such as "invite up to 4 teammates", with a visible n/max counter.

## When not to use

- Choosing from a fixed list only, with no free text: use select or a group of checkbox items.
- A single value: use input or floating-label-input.
- Searching or running commands: use search-expand or command-palette-morph.

## Pick by what matters

| Need | Use |
| --- | --- |
| Known vocabulary, new values allowed | suggestions={[...]} (up to 6 matches show, already-added ones are hidden) |
| Strict format such as emails | validate={(t) => ok ? true : "error message"} |
| A hard limit | maxTags={n}; the input becomes read-only when full |
| "Design" and "design" are different | caseSensitive |
| Submitting with a plain <form> | name="tags" (posts one comma-joined hidden input) |

## Usage

```tsx
import * as React from "react"
import { TagInput } from "@/components/goodui/tag-input"

const SERVICES = ["Deep clean", "Move-out clean", "Window washing", "Carpet shampoo", "Oven interior"]

export function ServicesField() {
  const [services, setServices] = React.useState<string[]>(["Deep clean"])

  return (
    <div className="grid gap-2">
      <label htmlFor="services" className="text-sm font-medium">
        Services offered
      </label>
      <TagInput
        inputId="services"
        value={services}
        onValueChange={setServices}
        suggestions={SERVICES}
        placeholder="Type or pick a service…"
      />
    </div>
  )
}
```

### Email invites with validation and a limit

```tsx
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

<TagInput
  aria-label="Invite teammates"
  value={invites}
  onValueChange={setInvites}
  maxTags={4}
  placeholder="name@company.com"
  validate={(t) => (EMAIL.test(t) ? true : `"${t}" is not a valid email`)}
/>
```

### Colored dot per tag and native form submit

```tsx
<TagInput
  name="labels"
  defaultValue={["Urgent", "VIP"]}
  renderTag={(t) => <span aria-hidden="true" className={`size-1.5 rounded-full ${t === "Urgent" ? "bg-rose-500" : "bg-emerald-500"}`} />}
/>
```

## API

### TagInput

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| value | `string[]` | — | Controlled list of tags. Pair with `onValueChange`. |
| defaultValue | `string[]` | — | Initial tags when uncontrolled. |
| onValueChange | `(tags: string[]) => void` | — | Called with the full new list whenever a tag is added or removed. |
| suggestions | `string[]` | `[]` | Offered in a dropdown while typing. Already-added tags are hidden. |
| maxTags | `number` | — | Maximum number of tags; shows an "n/max" counter and makes the input read-only when full. |
| placeholder | `string` | `"Add a tag…"` | Shown only while there are no tags. |
| validate | `(tag: string) => true \| string` | — | Return `true` to accept, or an error message to reject the tag. |
| caseSensitive | `boolean` | `false` | Treat "Design" and "design" as different tags. |
| name | `string` | — | Form field name; tags are submitted comma-separated in a hidden input. |
| disabled | `boolean` | — |  |
| inputId | `string` | — | id of the text input, for an external `<label htmlFor>`. |
| renderTag | `(tag: string) => React.ReactNode` | — | Optional visual for each chip (an icon, an avatar…). |
| labels | `Partial<TagInputLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / , | Adds the typed text as a tag, or the highlighted suggestion when one is highlighted. |
| Backspace | In an empty input: the first press highlights the last tag, the second removes it. |
| ArrowDown / ArrowUp | Opens the suggestions and moves the highlight, wrapping at the ends. |
| Escape | Closes the suggestions list when it is open. |

## Accessibility

- The text input is a combobox (aria-expanded, aria-controls, aria-autocomplete="list", aria-activedescendant) and the suggestions are a listbox of options.
- Added, removed, duplicate and limit messages are announced through a polite role="status" region; the texts come from the labels prop.
- Rejected tags set aria-invalid and link the visible error with aria-describedby.
- Each chip's remove button is a real button in the Tab order with an aria-label (labels.remove); Backspace in the empty input also removes the last tag. Focus returns to the input after a removal.
- Without inputId and an external <label htmlFor>, pass aria-label; the default name is labels.input ("Add tags").

## Motion

- Chips spring in from scale 0.6 with a blur (stiffness 500, damping 32) and leave in 0.15 s; neighbours glide with layout animation.
- A duplicate makes the existing chip shake for 0.4 s; an invalid tag or a full list shakes the whole field.
- The suggestions list springs open (stiffness 600, damping 38) and the highlight glides between options on a shared layout spring.
- Reduced motion: chips and the list only fade, shakes are skipped, layout animation and the highlight glide are off.

## Notes for AI

- Use value + onValueChange (string[]); there is no onChange for the tag list. The root's other props go to the outer <div>.
- All built-in text (remove, duplicate, limit, added, addedMany, removed, input) comes from the labels prop; pass translations there.
- validate returns true or an error string, not a boolean false.
- Link an external label with inputId + <label htmlFor>, or pass aria-label; do not put the label inside the component.
- Matching is case-insensitive by default, so "deep clean" counts as a duplicate of "Deep clean".
- Do not add a separate remove keyboard shortcut or an add button; Enter, comma, paste and Backspace already cover it.

## FAQ

**How do I submit the tags with a normal form?**

Pass name. A hidden input with that name holds the tags joined by commas.

**What happens when someone pastes a list?**

If the pasted text contains commas, semicolons, tabs or newlines it is split and every part goes through the same duplicate, limit and validate checks. Plain text without separators is pasted normally.

**Can I translate the messages?**

Yes. Pass labels with your own remove, duplicate, limit, added, addedMany and removed functions, and the input name string.

## Related

- input: https://goodui.dev/components/core/input
- floating-label-input: https://goodui.dev/components/inputs/floating-label-input
- select: https://goodui.dev/components/core/select
- badge: https://goodui.dev/components/core/badge

Last updated: 2026-11-02
