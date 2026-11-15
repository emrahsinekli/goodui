# Select

> Fully custom single or multi select: outline, filled, ghost, underline, pill and neo triggers; icons, avatars, descriptions and groups; search with match highlight, chips, clear, type-ahead and full keyboard; animated menu that flips up when space runs out.

Custom select and multi-select for React and shadcn: search, chips, groups, avatars and full keyboard

Page: https://goodui.dev/components/core/select

## Install

```bash
npx shadcn@latest add @goodui/select
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/select.json`. The file lands in `components/goodui/select.tsx`.

## When to use

- Picking one option from a list that is too long for radio buttons: a service, a staff member, a location.
- Picking several options shown as chips: add-on services, tags, team members (multiple).
- Long lists that need search, with matches highlighted: searchable, matching labels, descriptions, groups and keywords.
- Options that need more than text: avatars for people, icons for services, a description line, grouped sections.

## When not to use

- Two to five options that fit on screen: use checkbox (RadioGroup) or segmented-control, so all choices are visible.
- Free-form tags the user types: use tag-input.
- Actions in a menu (Edit, Duplicate, Delete): use dropdown-stagger; a select holds a value.

## Pick by what matters

| Need | Use |
| --- | --- |
| Forms | variant="outline" (default) |
| Filters in a toolbar | variant="ghost" or "pill", size="sm" |
| Dense settings or tables | variant="filled" or "underline" |
| Choose people | options with avatar (URL, or true for initials) and description |
| More than ~10 options | searchable, with group on the options |
| Several values | multiple with maxChips; clearable to reset |
| Calm menu | animation="fade-scale" (default) or "none"; "stagger" for short showcase lists |
| Playful or retro brands | variant="neo" |

## Usage

```tsx
import * as React from "react"
import { Scissors } from "lucide-react"
import { Select, type SelectOption } from "@/components/goodui/select"

const stylists: SelectOption[] = [
  { value: "maya", label: "Maya Chen", description: "Color specialist", avatar: "/team/maya.jpg", group: "Downtown" },
  { value: "leo", label: "Leo Park", description: "Barber", avatar: true, group: "Downtown" },
  { value: "ana", label: "Ana Ruiz", description: "Senior stylist", avatar: true, group: "Riverside" },
  { value: "sam", label: "Sam Okafor", description: "On leave until Dec 1", avatar: true, group: "Riverside", disabled: true },
]

export function BookingForm() {
  const [stylist, setStylist] = React.useState<string | null>("maya")
  const [extras, setExtras] = React.useState<string[]>([])

  return (
    <form className="flex flex-col gap-4">
      <Select aria-label="Stylist" options={stylists} value={stylist} onValueChange={setStylist} searchable clearable name="stylist" />
      <Select
        aria-label="Add-on services"
        multiple
        icon={<Scissors />}
        placeholder="Add services"
        options="Deep conditioning, Scalp massage, Blow-dry, Toner, Brow tint"
        value={extras}
        onValueChange={setExtras}
        name="extras"
      />
    </form>
  )
}
```

### Toolbar filter

```tsx
<Select aria-label="Location" variant="pill" size="sm" className="w-44" options={["All locations", "Downtown", "Riverside"]} defaultValue="All locations" />
```

### Translated

```tsx
<Select
  aria-label="Mitarbeiter"
  options={staff}
  multiple
  clearable
  searchable
  placeholder="Auswählen…"
  searchPlaceholder="Suchen…"
  emptyText="Keine Treffer"
  labels={{ clear: "Auswahl löschen", selectedHint: (s) => `${s} ausgewählt. Rücktaste entfernt den letzten.` }}
/>
```

## API

### Select

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| id | `string` | — | Goes on the combobox trigger, so <label htmlFor> works. |
| aria-label | `string` | — | Defines a string value that labels the current element. Names the trigger and the listbox. Pass one unless a visible <label htmlFor={id}> points at the select. |
| options | `(SelectOption \| string)[] \| string` | — | Option objects, plain strings, or one comma-separated string: "Haircut, Beard trim". |
| placeholder | `string` | — | Trigger text when nothing is selected. |
| variant | `"outline" \| "filled" \| "ghost" \| "underline" \| "pill" \| "neo"` | — | Trigger style: outline (default), filled, ghost, underline, pill or neo. |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | — | Accent for focus ring, selected option, checkboxes and chips. |
| size | `"sm" \| "md" \| "lg"` | — |  |
| shadow | `"none" \| "sm" \| "md" \| "lg"` | — | Trigger shadow. Ignored by neo. |
| animation | `"none" \| "fade-scale" \| "slide" \| "stagger"` | — | How the menu opens: fade-scale (default), slide (unrolls), stagger (options one by one) or none. |
| searchable | `boolean` | — | Search box at the top of the menu. |
| searchPlaceholder | `string` | — | Placeholder and accessible name of the search box. |
| clearable | `boolean` | — | × button that resets the value. |
| disabled | `boolean` | — |  |
| invalid | `boolean` | — | Red border and aria-invalid on the trigger. |
| icon | `React.ReactNode` | — | Leading icon in the trigger. |
| name | `string` | — | Form field name (renders hidden inputs). |
| emptyText | `string` | — | Shown when the search has no matches. |
| maxChips | `number` | — | Multiple: chips shown before "+N". |
| open | `boolean` | — | Menu open state (controlled). |
| defaultOpen | `boolean` | — | Initial open state when uncontrolled. |
| onOpenChange | `(open: boolean) => void` | — | Called when the menu opens or closes. |
| menuClassName | `string` | — | Class for the dropdown menu. |
| labels | `Partial<SelectLabels>` | — | Text for built-in controls and screen readers; pass translations here. |
| multiple | `false` | — | true picks several values, shown as chips; value then becomes string[]. |
| value | `string \| null` | — | Selected value (controlled): a string or null, or string[] with multiple. |
| defaultValue | `string \| null` | — | Initial value when uncontrolled (string[] with multiple). |
| onValueChange | `(value: string \| null) => void` | — | Called with the picked value (null after clearing), or with the full string[] with multiple. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Arrow Down / Arrow Up / Enter / Space | On the closed trigger, opens the menu with the selected (or first enabled) option active. |
| Arrow Down / Arrow Up | Moves the active option, wrapping and skipping disabled ones. |
| Home / End | Jumps to the first or last enabled option (not while typing in the search box). |
| Enter | Picks the active option. Single select closes; multiple toggles and stays open. |
| Space | Same as Enter, except inside the search box where it types a space. |
| Letters | Type-ahead: jumps to the next option starting with the typed text (opens the menu if closed). With searchable, typing on the closed trigger opens the menu and starts the search. |
| Backspace | With multiple and the menu closed, removes the last selected value. |
| Escape | Closes the menu and returns focus to the trigger. |
| Tab | Closes the menu and moves focus on. |

## Accessibility

- The trigger is a <button role="combobox"> with aria-haspopup="listbox", aria-expanded, aria-controls and aria-activedescendant; with searchable, the search input takes the combobox role and the active descendant.
- The menu is role="listbox" (aria-multiselectable with multiple), options are role="option" with aria-selected and aria-disabled, and groups are role="group" named after the group.
- There is no built-in visible label: pass aria-label, which names both the trigger and the listbox.
- With multiple, a visually hidden text lists the selected values and mentions Backspace (labels.selectedHint). Each chip's × is a real button in the tab order named "Remove Haircut" (labels.remove); focus returns to the trigger after removing. The clear button is named "Clear selection" (labels.clear).
- id goes on the combobox button, so <label htmlFor={id}> names it; without aria-label the listbox is labelled by the trigger.
- invalid sets aria-invalid on the trigger and a red border.

## Motion

- fade-scale (default): the menu fades in, scales from 0.96 and moves 4px in 150 ms, closing in 100 ms. slide: it unrolls with a clip from the trigger side and moves 10px. stagger: options slide in one by one, for short showcase lists. One highlight glides between options. Menus opened from the keyboard appear at once.
- The menu closes with a 120 ms fade. It opens upward when there is not enough room below and more room above.
- Chips pop in and out (scale from 0.8) and the others shift into place. The chevron turns 180° in 200 ms; the underline variant draws its bar in 250 ms.
- Reduced motion: the menu, options and chips appear and disappear without animation, and trigger transitions are off.

## Notes for AI

- Single: value is string | null and onValueChange(string | null) (null after clear). With multiple: value is string[] and onValueChange(string[]). Do not mix them.
- options accepts objects { value, label, description?, icon?, avatar?, group?, disabled?, keywords? }, plain strings, or one comma-separated string. Options of the same group should be listed together.
- The menu renders inside the component (no portal). Avoid overflow: hidden on parents, or give the parent room; it flips up when space below runs out.
- Default width is w-72; set className="w-full" in forms. name renders hidden inputs (one per value with multiple) for native form posts.
- Built-in text: placeholder, searchPlaceholder and emptyText are props; labels has clear, selectedHint and remove (chip ×).

## FAQ

**Can I use it with a <label> element?**

Yes. Pass id to Select and point <label htmlFor> at it: the id goes on the combobox button. Without a visible label, pass aria-label.

**How does search match?**

It ignores case and accents and matches anywhere in the label, description, group name and keywords. The matched part of the label is underlined.

## Related

- input: https://goodui.dev/components/core/input
- checkbox: https://goodui.dev/components/core/checkbox
- segmented-control: https://goodui.dev/components/navigation/segmented-control
- tag-input: https://goodui.dev/components/inputs/tag-input

Last updated: 2026-11-02
