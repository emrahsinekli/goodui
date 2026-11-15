# Expanding search

> Search icon that springs open into a field with a recent-searches dropdown and a / shortcut; Esc or blur folds it back when empty.

Expanding search bar for React and shadcn: icon opens into a field with recent searches

Page: https://goodui.dev/components/inputs/search-expand

## Install

```bash
npx shadcn@latest add @goodui/search-expand
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/search-expand.json`. The file lands in `components/goodui/search-expand.tsx`.

## When to use

- App headers and toolbars with little room, where search is used often but should not take space when idle.
- Searching one list or table (clients, invoices, bookings) where recent queries are worth repeating.
- When users expect a / shortcut to jump to search, as on GitHub or YouTube.

## When not to use

- Searching across pages and running commands: use command-palette-morph.
- A search field that should always be visible, such as on a search results page: use input.
- Picking tags or several values from suggestions: use tag-input.

## Usage

```tsx
import * as React from "react"
import { useRouter } from "next/navigation"
import { SearchExpand } from "@/components/goodui/search-expand"

export function ClientSearch() {
  const router = useRouter()
  const [recent, setRecent] = React.useState(["Maya Chen", "Invoice 1042", "Friday deep clean"])

  return (
    <header className="flex items-center justify-between border-b px-4 py-2">
      <span className="font-semibold">Clients</span>
      <SearchExpand
        align="end"
        placeholder="Search clients…"
        recent={recent}
        onSubmit={(q) => {
          setRecent((r) => [q, ...r.filter((x) => x !== q)].slice(0, 6))
          router.push("/clients?q=" + encodeURIComponent(q))
        }}
        onClearRecent={() => setRecent([])}
      />
    </header>
  )
}
```

### Live filtering, no submit

```tsx
const [query, setQuery] = React.useState("")
const rows = invoices.filter((i) => i.client.toLowerCase().includes(query.toLowerCase()))

<SearchExpand value={query} onValueChange={setQuery} placeholder="Filter invoices…" shortcut={null} />
```

### Translated labels

```tsx
<SearchExpand
  placeholder="Kunden suchen…"
  labels={{ search: "Suche", open: "Suche öffnen", clear: "Suche löschen", recent: "Letzte Suchen", matching: "Passende Suchen", clearRecent: "Löschen" }}
/>
```

## API

### SearchExpand

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| value | `string` | — | Controlled query text; pair with onValueChange. |
| defaultValue | `string` | `""` | Initial query when uncontrolled. |
| onValueChange | `(value: string) => void` | — | Called on every keystroke, on clear and when a recent search fills the field. |
| onSubmit | `(query: string) => void` | — | Called with the trimmed query on Enter (never with an empty string). |
| open | `boolean` | — | Controlled open state; pair with onOpenChange. |
| defaultOpen | `boolean` | `false` | Start expanded when uncontrolled. |
| onOpenChange | `(open: boolean) => void` | — | Called when the field expands or folds back. |
| recent | `string[]` | `[]` | Shown in a dropdown while the field is focused; filtered by what is typed. |
| onRecentSelect | `(query: string) => void` | — | Defaults to filling the field and submitting. |
| onClearRecent | `() => void` | — | Shows a "Clear" button in the dropdown header when set. |
| placeholder | `string` | `"Search…"` | Placeholder text; also used as the input's aria-label. |
| expandedWidth | `number` | `280` | Width in px when open (it never exceeds the parent). |
| shortcut | `string \| null` | `"/"` | Global key that opens the search; `null` to disable. |
| align | `"start" \| "end"` | `"start"` | Which edge the dropdown aligns to; use "end" when the search sits on the right. |
| labels | `Partial<SearchExpandLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| / | Opens the search and focuses the field from anywhere on the page, unless focus is in an input, textarea, select or editable element. Change it with shortcut, or pass null to turn it off. |
| Enter / Space (on the icon) | Opens the search and focuses the field (native <button>). |
| Arrow Down / Arrow Up | Moves the highlight through recent searches, wrapping at both ends. |
| Enter | Runs the highlighted recent search, or submits the typed query. |
| Esc | First removes the highlight, then clears the text, then folds the search and returns focus to the icon. |

## Accessibility

- The wrapper has role="search". The icon is a <button> with aria-expanded and an aria-label ("Open search" / "Search").
- The field is an <input type="search" role="combobox"> with aria-expanded, aria-controls and aria-activedescendant pointing at the highlighted recent search, so focus stays in the field.
- Recent searches are a role="listbox" of role="option" items with aria-selected.
- While folded, the field is aria-hidden and out of the tab order; only the icon is focusable.
- The field's accessible name is the placeholder, so write a placeholder that describes the search. All built-in strings can be translated through labels.

## Motion

- The bar springs from 36px to expandedWidth (stiffness 420, damping 34) and the icon scales to 0.9.
- The recent-searches dropdown drops in from 6px above at 0.97 scale on a spring (stiffness 600, damping 38) and leaves in 120 ms.
- A highlight slides between recent searches with a shared layout animation; the clear button and / hint fade in.
- Reduced motion: the width changes without a spring, the dropdown and the clear button only fade, and the highlight jumps.

## Notes for AI

- onSubmit gets the trimmed query and never fires for an empty field; it does not close the search.
- recent is only data: the component never stores searches. Add the query to your own list in onSubmit.
- Picking a recent search fills the field and calls onSubmit; pass onRecentSelect to do something else instead.
- Use align="end" when the search sits at the end edge (right in LTR), so the dropdown does not overflow the screen. Alignment follows dir="rtl".
- Blur folds it back only when the field is empty; a typed query stays open.

## FAQ

**How many recent searches does it show?**

Up to six, filtered by what is typed. A recent search that exactly matches the typed text is hidden.

**Can I control whether it is open?**

Yes. Pass open and onOpenChange; otherwise it manages its own state, starting from defaultOpen.

## Related

- command-palette-morph: https://goodui.dev/components/navigation/command-palette-morph
- input: https://goodui.dev/components/core/input
- tag-input: https://goodui.dev/components/inputs/tag-input
- vanish-input: https://goodui.dev/components/inputs/vanish-input

Last updated: 2026-11-02
