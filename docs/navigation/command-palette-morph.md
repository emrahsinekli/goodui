# Command palette morph

> A search field morphs into a command palette through a shared layout animation, with fuzzy matching, highlighted letters, grouped results, a sliding selection, arrow keys, Enter, Esc and Ctrl/Cmd+K.

Command palette (Cmd+K) for React and shadcn: search field that morphs into a fuzzy command menu

Page: https://goodui.dev/components/navigation/command-palette-morph

## Install

```bash
npx shadcn@latest add @goodui/command-palette-morph
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/command-palette-morph.json`. The file lands in `components/goodui/command-palette-morph.tsx`.

## When to use

- A global Cmd/Ctrl+K search in a dashboard: jump to pages, find clients, run actions like "New booking".
- A header search field that should open into something bigger without a jarring modal pop.
- Power-user shortcuts, with each command's keys shown next to it.

## When not to use

- Searching one list inline on a page: use search-expand or a plain input with filtering.
- Choosing a value for a form field: use select.
- A short menu of actions on a button: use dropdown-stagger.

## Pick by what matters

| Need | Use |
| --- | --- |
| Details beside the results | give items a preview, or set showPreview |
| Search field in the header | variant="field" (default) with triggerLabel |
| Compact icon in a toolbar or on mobile | variant="icon" (triggerLabel becomes its aria-label) |
| Second palette on the same page | hotkey={false} on all but one |
| Find records by email or number | keywords: ["maya@studio.co"] on the item |
| Open it from elsewhere | open + onOpenChange (controlled) |

## Usage

```tsx
import { CalendarDays, CalendarPlus, Receipt, UserPlus, UserRound, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { CommandPaletteMorph, type CommandPaletteItem } from "@/components/goodui/command-palette-morph"

export function AppSearch() {
  const router = useRouter()
  const items: CommandPaletteItem[] = [
    { id: "new-booking", label: "New booking", group: "Actions", icon: CalendarPlus, shortcut: ["N"], onSelect: () => router.push("/bookings/new") },
    { id: "add-client", label: "Add client", group: "Actions", icon: UserPlus, onSelect: () => router.push("/clients/new") },
    { id: "go-calendar", label: "Calendar", group: "Pages", icon: CalendarDays, shortcut: ["G", "C"], onSelect: () => router.push("/calendar") },
    { id: "go-clients", label: "Clients", group: "Pages", icon: Users, onSelect: () => router.push("/clients") },
    { id: "inv-2041", label: "INV-2041", group: "Invoices", icon: Receipt, hint: "Overdue · $240", onSelect: () => router.push("/invoices/2041") },
    { id: "c-maya", label: "Maya Chen", group: "Clients", icon: UserRound, hint: "12 visits", keywords: ["maya@studio.co"], onSelect: () => router.push("/clients/maya") },
  ]
  return <CommandPaletteMorph items={items} triggerLabel="Search clients, invoices…" />
}
```

### Icon trigger without the hotkey

```tsx
<CommandPaletteMorph items={items} variant="icon" hotkey={false} triggerLabel="Quick search" />
```

### One handler for every item, translated

```tsx
<CommandPaletteMorph
  items={items}
  onSelect={(item) => track("command", item.id)}
  placeholder="Suchen oder Befehl eingeben…"
  triggerLabel="Suchen…"
  emptyMessage="Keine Treffer"
  labels={{ dialog: "Befehlspalette", results: "Ergebnisse", navigate: "navigieren", select: "auswählen", resultCount: (n) => `${n} Ergebnisse` }}
/>
```

## API

### CommandPaletteMorph

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| items (required) | `CommandPaletteItem[]` | — | Everything the palette can find; items are listed in this order (grouped by group) until the user types. |
| open | `boolean` | — | Whether the palette is open (controlled). |
| defaultOpen | `boolean` | `false` | Initial open state when uncontrolled. |
| onOpenChange | `(open: boolean) => void` | — | Called when the palette opens or closes (trigger, hotkey, Esc, backdrop or a selection). |
| onSelect | `(item: CommandPaletteItem) => void` | — | Called with the chosen item, after the item's own onSelect. |
| placeholder | `string` | `"Search or type a command…"` | Placeholder of the search input inside the palette. |
| triggerLabel | `string` | `"Search…"` | Text on the field trigger. |
| variant | `"field" \| "icon"` | `"field"` | `field` looks like a search input; `icon` is a round icon button. |
| hotkey | `boolean` | `true` | Open and close with Ctrl+K / Cmd+K. Enable it on one palette per page. |
| emptyMessage | `React.ReactNode` | — | Shown when nothing matches; defaults to "No results" with the query. |
| showPreview | `boolean` | — | Raycast-style pane beside the list, from 640px up. On by default when an item has a `preview`; items without one show their icon, label and hint. |
| labels | `Partial<CommandPaletteMorphLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <button> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Ctrl+K / Cmd+K | Opens or closes the palette from anywhere on the page (when hotkey is on). |
| ArrowDown / ArrowUp | Moves the highlighted result, wrapping around, and scrolls it into view. |
| Enter | Runs the highlighted result and closes the palette. |
| Escape | Closes the palette and returns focus to the trigger. |
| Tab | Kept inside the palette: focus stays on the search input. |

## Accessibility

- The trigger is a <button> with aria-haspopup="dialog" and aria-expanded; the open palette is role="dialog" with aria-modal and an aria-label from labels.dialog.
- The input is a role="combobox" controlling a role="listbox"; the highlighted option is exposed through aria-activedescendant and aria-selected, and results sit in role="group" sections under their headings.
- A polite live region announces the result count (labels.resultCount) as the user types.
- Opening locks page scroll and focuses the input; closing restores scroll and focus.
- Built-in strings go through labels, including the default empty state (labels.noResults, labels.noMatch(query)); emptyMessage replaces it entirely.

## Motion

- The trigger's border box and search icon are shared-layout elements that morph into the palette panel and its icon on a spring (stiffness 380, damping 34, mass 0.9), and back on close.
- The backdrop fades in 200 ms; the input fades in after 80 ms and the results slide down 4px and fade in after 100 ms. Exits are 80 ms fades.
- The selection highlight glides between results on a stiff spring (stiffness 600, damping 42).
- Reduced motion: the panel, icon, backdrop, contents and highlight change instantly.

## Performance

- Filtering is a small in-memory fuzzy scorer over label and keywords, memoised per query. It is meant for hundreds of items, not a remote search; for server results, update items as the user types.

## Notes for AI

- Put navigation and actions in each item's onSelect; onSelect on the component runs after it for every item (analytics, logging).
- group is a plain string heading; items keep their order within a group until a query sorts them by score.
- Only one palette per page should keep hotkey on; pass hotkey={false} on the others.
- It renders position: fixed without a portal; do not place it inside an element with transform, filter or backdrop-filter, or the overlay will be clipped to it.
- shortcut is display only; wire real hotkeys yourself (for example with the kbd component's onTrigger).

## FAQ

**How does matching work?**

A substring match in the label scores highest (more at a word start); otherwise the letters must appear in order, with bonuses for consecutive letters and word starts. Keyword matches rank slightly lower and are not highlighted.

**Is it a drop-in for cmdk?**

No. It is a single component fed by an items array, not composable Command.* parts. That keeps it to one file, at the cost of custom item layouts.

## Related

- search-expand: https://goodui.dev/components/inputs/search-expand
- dropdown-stagger: https://goodui.dev/components/overlays/dropdown-stagger
- kbd: https://goodui.dev/components/core/kbd
- select: https://goodui.dev/components/core/select

Last updated: 2026-11-02
