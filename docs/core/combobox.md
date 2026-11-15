# Combobox

> Autocomplete combobox (ARIA 1.2) with outline, filled, ghost, underline, pill and neo fields, tones, sizes and shadows; local ranked matching or debounced async search with abort, cache, loading, empty and error-with-retry states, every matched word highlighted, groups, avatars, single or multi-select chips, an “Add …” create row and automatic virtualization for 10,000+ rows, in a portaled list that flips above the field.

Autocomplete combobox for React and shadcn: async search, highlight, chips, create option and 10k-row virtualization

Page: https://goodui.dev/components/core/combobox

## Install

```bash
npx shadcn@latest add @goodui/combobox
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/combobox.json`. The file lands in `components/goodui/combobox.tsx`.

## When to use

- Searching a set too big to scroll: clients, products, cities, users, where the user types and the list narrows.
- Server-side search: loadOptions runs after a debounce, cancels stale requests with an AbortSignal, caches per query and shows loading, empty and error states.
- Free-form values with suggestions: creatable adds an “Add …” row, for tags, new clients or invite-by-email.
- Very long local lists (thousands of rows): rows are virtualized automatically above virtualThreshold.

## When not to use

- Picking from a short, known list (under ~15 options): use select, a picker that does not need typing.
- Running actions (Edit, Delete): use dropdown-menu.
- A global command palette (⌘K) that mixes navigation and actions: use a command dialog.
- Typing tags with no suggestions at all: use tag-input.

## Pick by what matters

| Need | Use |
| --- | --- |
| Forms | variant="outline" (default), with a <label htmlFor> pointing at id |
| API search | loadOptions + minChars (2 is typical) + debounce; keep options for labels of already-chosen values |
| Several values | multiple: chips in the field, Backspace removes the last |
| Unknown values allowed | creatable with onCreate returning the saved option |
| Thousands of local rows | plain options; virtualization switches on above virtualThreshold (100 rows) |
| Toolbars | variant="ghost" or "pill", size="sm" |
| Calm list | animation="fade-scale" (default) or "none"; "stagger" only for short lists |

## Usage

```tsx
import * as React from "react"
import { Search } from "lucide-react"
import { Combobox, type ComboboxOption } from "@/components/goodui/combobox"

export function ClientField() {
  const [client, setClient] = React.useState<string | null>(null)
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="client" className="text-sm font-medium">Client</label>
      <Combobox
        id="client"
        className="w-full"
        icon={<Search />}
        placeholder="Search clients…"
        minChars={2}
        loadOptions={async (query, { signal }) => {
          const res = await fetch(`/api/clients?q=${encodeURIComponent(query)}`, { signal })
          const rows: { id: string; name: string; email: string }[] = await res.json()
          return rows.map((r) => ({ value: r.id, label: r.name, description: r.email, avatar: true }))
        }}
        creatable
        onCreate={async (name) => {
          const saved = await createClient(name)
          return { value: saved.id, label: saved.name }
        }}
        value={client}
        onValueChange={setClient}
        clearable
        name="clientId"
      />
    </div>
  )
}
```

### Multiple with groups and invite-by-email

```tsx
<Combobox
  aria-label="Invitees"
  multiple
  creatable
  options={team.map((m) => ({ value: m.email, label: m.name, description: m.email, group: m.role, avatar: true }))}
  value={emails}
  onValueChange={setEmails}
  labels={{ create: (t) => `Invite “${t}” by email` }}
/>
```

### 10,000 local rows

```tsx
<Combobox aria-label="Product" options={catalog} variant="filled" onValueChange={(value, option) => addLine(option)} />
```

### Translated

```tsx
<Combobox
  aria-label="Kunde"
  options={clients}
  placeholder="Kunden suchen…"
  labels={{
    clear: "Leeren",
    toggle: "Vorschläge anzeigen",
    create: (t) => `„${t}“ anlegen`,
    loading: "Suche…",
    empty: (q) => (q ? `Keine Treffer für „${q}“` : "Keine Einträge"),
    error: "Ergebnisse konnten nicht geladen werden.",
    retry: "Erneut versuchen",
    minChars: (n) => `Mindestens ${n} Zeichen eingeben`,
    results: (n) => `${n} Ergebnisse`,
  }}
/>
```

## API

### Combobox

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| id | `string` | — | Goes on the input, so <label htmlFor> works. |
| aria-label | `string` | — | Defines a string value that labels the current element. Names the input and the list. Pass one unless a visible <label htmlFor={id}> points at the input. |
| options | `RawOption[]` | — | Local options (objects or strings). With loadOptions they are shown before typing and used to label values. |
| loadOptions | `(query: string, ctx: { signal: AbortSignal }) => Promise<RawOption[]>` | — | Async search. Called after the debounce with the typed text; aborted when the text changes. |
| debounce | `number` | — | Debounce for loadOptions in ms. |
| minChars | `number` | — | Characters needed before loadOptions runs. |
| cache | `boolean` | — | Cache loadOptions results per query for the life of the component. |
| filter | `((option: ComboboxOption, query: string) => boolean) \| false` | — | Custom local match. false shows options unfiltered (when you filter yourself). |
| creatable | `boolean` | — | Shows an "Add “text”" row when no option matches the typed text exactly. |
| onCreate | `(text: string) => RawOption \| void \| Promise<RawOption \| void>` | — | Called with the typed text when the create row is picked. Return the new option (or nothing to use the text). |
| placeholder | `string` | — |  |
| variant | `"outline" \| "filled" \| "ghost" \| "underline" \| "pill" \| "neo"` | — | Field style: outline (default), filled, ghost, underline, pill or neo. |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | — | Accent for the focus ring, active row, checks and chips. |
| size | `"sm" \| "md" \| "lg"` | — |  |
| shadow | `"none" \| "sm" \| "md" \| "lg"` | — | Field shadow. Ignored by neo. |
| animation | `"none" \| "fade-scale" \| "slide" \| "stagger"` | — | How the list opens: fade-scale (default), slide, stagger (rows one by one; off when virtualized) or none. |
| clearable | `boolean` | — | × button that clears the value and the text. |
| disabled | `boolean` | — |  |
| invalid | `boolean` | — | Red border and aria-invalid on the input. |
| icon | `React.ReactNode` | — | Leading icon in the field. |
| name | `string` | — | Form field name (renders hidden inputs with the value). |
| openOnFocus | `boolean` | — | Open the list when the input gets focus (by default it opens on typing, click or ↓). |
| virtualThreshold | `number` | — | Rows above which the list is virtualized. |
| inputValue | `string` | — | Text in the input (controlled). |
| defaultInputValue | `string` | — |  |
| onInputValueChange | `(text: string) => void` | — |  |
| open | `boolean` | — |  |
| defaultOpen | `boolean` | — |  |
| onOpenChange | `(open: boolean) => void` | — |  |
| menuClassName | `string` | — | Class for the popup. |
| labels | `Partial<ComboboxLabels>` | — | Text for built-in controls and screen readers; pass translations here. |
| multiple | `false` | — | true picks several values shown as chips; value then becomes string[]. |
| value | `string \| null` | — | Selected value (controlled): a string or null, or string[] with multiple. |
| defaultValue | `string \| null` | — |  |
| onValueChange | `(value: string \| null, option: ComboboxOption \| null) => void` | — | Called with the new value and its option (null after clearing). |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Typing | Opens the list and filters it (or starts the async search after the debounce); the first match is highlighted. |
| Arrow Down / Arrow Up | Opens the list (on the first or last row) or moves the highlight, wrapping and skipping disabled rows. |
| Alt + Arrow Down / Alt + Arrow Up | Opens the list without moving the highlight / closes it. |
| Home / End | While the list is open: first or last row. With Shift, or while closed, they move the text caret as usual. |
| Page Up / Page Down | While the list is open: moves the highlight 10 rows. |
| Enter | Picks the highlighted row (or creates from the “Add …” row). Single closes the list; multiple adds a chip, clears the text and stays open. |
| Escape | Closes the list. Pressed again: brings back the selected label (or clears typed text); with clearable and nothing typed, clears the value. |
| Backspace | With multiple and an empty input, removes the last chip. |
| Tab | Closes the list and moves on; typed text that was not picked snaps back to the selection. |

## Accessibility

- The input is role="combobox" with aria-autocomplete="list", aria-expanded, aria-controls and aria-activedescendant (ARIA 1.2); focus stays in the input while the highlight moves.
- The popup is role="listbox" (aria-multiselectable with multiple, aria-busy while loading) with role="option" rows carrying aria-selected, aria-disabled, aria-posinset and aria-setsize, so virtualized lists still announce the full count.
- A polite live region announces the result count, “Searching…”, empty and error messages (all from labels).
- Pass aria-label, or id with a visible <label htmlFor>. Chips are listed in visually hidden text referenced by aria-describedby; each chip's × is a button named by labels.remove.
- The chevron button is out of the tab order (keyboard users have Arrow Down) and is named by labels.toggle. invalid sets aria-invalid.
- Matched text is wrapped in <mark>, ignoring case and accents, and every word of the query is highlighted.

## Motion

- fade-scale (default): the list fades in from 0.97 scale and 4px on a spring (stiffness 520, damping 34, mass 0.7). slide: unrolls from the field with a clip and 10px move. stagger: rows slide in 4px, 25 ms apart (off for virtualized lists).
- The list closes with a 120 ms fade. Chips pop in and out (scale from 0.8) and the others shift into place; the underline variant draws its bar in 250 ms.
- Reduced motion: the list only fades, rows do not stagger, chips appear without layout animation, CSS transitions are off and the loading spinner slows down.

## Performance

- Local matching uses a pre-folded index built once per options change; each keystroke is one pass that checks every word and ranks label prefix, word start, then anywhere.
- Above virtualThreshold (100 rows by default) only the rows in view plus a 200px margin are rendered; rows get a fixed height (taller when options have descriptions), so End, PageDown and scrolling stay smooth on 10k+ rows.
- Async search is debounced (250 ms), aborts the previous request through AbortSignal and caches results per query (cache={false} to turn off).

## Notes for AI

- Single: value is string | null and onValueChange(value, option). Multiple: value is string[] and onValueChange(values, options). Do not mix them.
- options accepts objects { value, label, description?, icon?, avatar?, group?, disabled?, keywords? } or plain strings.
- With loadOptions, return options for the typed query (the component does not filter them again); pass options too so already-chosen values have labels before the first search.
- onCreate may be async and should return the saved option; without onCreate the typed text becomes both value and label.
- The popup is portaled to document.body and flips above the field when there is no room below; no overflow tricks are needed.
- Default width is w-72; use className="w-full" in forms. name renders hidden inputs for native form posts.
- Use select instead for short fixed lists; combobox is for typing to search.

## FAQ

**How is this different from select?**

Select is a button that opens a list to pick from (with optional search inside the menu). Combobox is a text input: the user types first, results can come from a server, unknown values can be created, and lists can be virtualized.

**What happens to typed text that was not picked?**

On blur or Escape it snaps back to the selected option's label (or clears in multiple mode). Emptying the text and leaving clears a single value.

**Can I render 50,000 options?**

Yes, rows are virtualized, but the matching still scans every option per keystroke; for very large or remote data use loadOptions.

## Related

- select: https://goodui.dev/components/core/select
- dropdown-menu: https://goodui.dev/components/core/dropdown-menu
- input: https://goodui.dev/components/core/input
- tag-input: https://goodui.dev/components/inputs/tag-input

Last updated: 2026-11-03
