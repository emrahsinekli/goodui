# Stagger dropdown

> A dropdown menu springs open while its items stagger in, with a highlight that glides between items, submenus, checkbox and radio items, and full keyboard navigation.

Animated dropdown menu for React and shadcn with staggered items, submenus and keyboard navigation

Page: https://goodui.dev/components/overlays/dropdown-stagger

## Install

```bash
npx shadcn@latest add @goodui/dropdown-stagger
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/dropdown-stagger.json`. The file lands in `components/goodui/dropdown-stagger.tsx`.

## When to use

- Row actions in a table or list: edit, reschedule, send a reminder, cancel.
- An account menu behind an avatar: profile, billing, team, sign out.
- View options for a list: checkbox items for what to show, radio items for the sort order.

## When not to use

- Picking a value for a form field: use select, which behaves like a form control and shows the chosen value.
- Searching across many commands: use command-palette-morph.
- A small form behind a button (a note, a code): use popover-morph.

## Pick by what matters

| Need | Use |
| --- | --- |
| Run an action | DropdownStaggerItem with onSelect (closes the menu) |
| Delete, cancel or remove | DropdownStaggerItem variant="destructive", after a separator |
| Toggle several options without closing | DropdownStaggerCheckboxItem (closeOnSelect defaults to false) |
| Choose one option such as a sort order | DropdownStaggerRadioGroup with DropdownStaggerRadioItem |
| A second level, such as time slots | DropdownStaggerSub |
| Icon-only trigger | triggerLabel plus a compact triggerClassName |

## Usage

```tsx
import { Bell, CalendarClock, Ellipsis, Pencil, XCircle } from "lucide-react"
import {
  DropdownStagger,
  DropdownStaggerItem,
  DropdownStaggerSeparator,
  DropdownStaggerSub,
} from "@/components/goodui/dropdown-stagger"

export function BookingActions({ client, cancelled, onAction }: { client: string; cancelled: boolean; onAction: (action: string) => void }) {
  return (
    <DropdownStagger
      align="end"
      triggerLabel={`Actions for ${client}`}
      triggerClassName="size-8 border-transparent bg-transparent px-0 shadow-none"
      trigger={<Ellipsis />}
    >
      <DropdownStaggerItem icon={<Pencil />} onSelect={() => onAction("edit")}>
        Edit booking
      </DropdownStaggerItem>
      <DropdownStaggerSub icon={<CalendarClock />} label="Reschedule">
        {["Today 5:45 PM", "Tomorrow 10:00 AM", "Fri 9:15 AM"].map((slot) => (
          <DropdownStaggerItem key={slot} onSelect={() => onAction(`move:${slot}`)}>
            {slot}
          </DropdownStaggerItem>
        ))}
      </DropdownStaggerSub>
      <DropdownStaggerItem icon={<Bell />} shortcut="⌘R" onSelect={() => onAction("remind")}>
        Send reminder
      </DropdownStaggerItem>
      <DropdownStaggerSeparator />
      <DropdownStaggerItem icon={<XCircle />} variant="destructive" disabled={cancelled} onSelect={() => onAction("cancel")}>
        Cancel booking
      </DropdownStaggerItem>
    </DropdownStagger>
  )
}
```

### View options with checkbox and radio items

```tsx
<DropdownStagger trigger={<><SlidersHorizontal /> View</>}>
  <DropdownStaggerLabel>Show</DropdownStaggerLabel>
  <DropdownStaggerCheckboxItem checked={showCancelled} onCheckedChange={setShowCancelled}>
    Cancelled bookings
  </DropdownStaggerCheckboxItem>
  <DropdownStaggerCheckboxItem checked={showPrices} onCheckedChange={setShowPrices}>
    Prices
  </DropdownStaggerCheckboxItem>
  <DropdownStaggerSeparator />
  <DropdownStaggerLabel>Sort by</DropdownStaggerLabel>
  <DropdownStaggerRadioGroup value={sort} onValueChange={setSort}>
    <DropdownStaggerRadioItem value="time">Start time</DropdownStaggerRadioItem>
    <DropdownStaggerRadioItem value="client">Client name</DropdownStaggerRadioItem>
    <DropdownStaggerRadioItem value="price">Highest value</DropdownStaggerRadioItem>
  </DropdownStaggerRadioGroup>
</DropdownStagger>
```

### Keep the menu open after an action

```tsx
<DropdownStaggerItem icon={<Copy />} onSelect={(e) => { e.preventDefault(); copyLink() }}>
  Copy link
</DropdownStaggerItem>
```

## API

### DropdownStagger

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| trigger (required) | `React.ReactNode` | — | Content of the trigger button. |
| children (required) | `React.ReactNode` | — | Items, labels, separators, radio groups and submenus. |
| triggerLabel | `string` | — | Accessible name when the trigger is icon-only. Rendered as sr-only text after the trigger content, so any visible text stays the start of the name. |
| triggerClassName | `string` | — | Classes for the trigger button. |
| contentClassName | `string` | — | Classes for the menu panel. |
| align | `"start" \| "end"` | `"start"` | Which edge of the trigger the menu lines up with (logical: start is the left edge in LTR, the right edge in RTL). It does not flip near the viewport edge. |
| open | `boolean` | — | Controlled open state. Pair with onOpenChange. |
| defaultOpen | `boolean` | `false` | Initial open state when uncontrolled. |
| onOpenChange | `(open: boolean) => void` | — | Called with the next state on trigger use, item selection, Esc, Tab or an outside click. |
| stagger | `boolean` | `false` | Cascade the items in. Off by default: menus are frequent, so they stay quiet. Keep it for rare, showcase menus. |

Also accepts every <div> attribute.

### DropdownStaggerItem

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| children (required) | `React.ReactNode` | — | Content. |
| icon | `React.ReactNode` | — | Leading icon, tinted muted unless the item is destructive. |
| shortcut | `string` | — | Hint shown on the right, e.g. "⌘E". It is display text only; it does not bind the shortcut. |
| variant | `"default" \| "destructive"` | `"default"` | "destructive" colors the text and highlight with the destructive token. |
| disabled | `boolean` | — | Grays the item out; arrow keys and typeahead skip it and clicks do nothing. |
| onSelect | `(event: React.MouseEvent<HTMLButtonElement>) => void` | — | Call event.preventDefault() to keep the menu open. |
| closeOnSelect | `boolean` | `true` | Close the menu and return focus to the trigger after selecting. Defaults to true for items, false for checkbox and radio items. |
| className | `string` | — | Classes merged onto the root element. |

### DropdownStaggerCheckboxItem

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| children (required) | `React.ReactNode` | — | Content. |
| checked (required) | `boolean` | — | Whether the check is drawn. The item is always controlled. |
| onCheckedChange (required) | `(checked: boolean) => void` | — | Called with the toggled value on click, Enter or Space. |
| className | `string` | — | Classes merged onto the root element. |
| onSelect | `(event: React.MouseEvent<HTMLButtonElement>) => void` | — | Call event.preventDefault() to keep the menu open. |
| disabled | `boolean` | — | Grays the item out; arrow keys and typeahead skip it and clicks do nothing. |
| shortcut | `string` | — | Hint shown on the right, e.g. "⌘E". It is display text only; it does not bind the shortcut. |
| closeOnSelect | `boolean` | `false` | Close the menu and return focus to the trigger after selecting. Defaults to true for items, false for checkbox and radio items. |

### DropdownStaggerRadioGroup

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| value (required) | `string` | — | Value of the selected radio item. |
| onValueChange (required) | `(value: string) => void` | — | Called with the chosen item's value. |
| children (required) | `React.ReactNode` | — | Content. |
| label | `string` | — | Accessible name of the group. Without it, a DropdownStaggerLabel right before (or inside) the group names it. |
| aria-labelledby | `string` | — | Id of an element that names the group; overrides the automatic DropdownStaggerLabel link. |

### DropdownStaggerRadioItem

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| children (required) | `React.ReactNode` | — | Content. |
| value (required) | `string` | — | Value reported to the surrounding DropdownStaggerRadioGroup; checked when it equals the group's value. |
| className | `string` | — | Classes merged onto the root element. |
| onSelect | `(event: React.MouseEvent<HTMLButtonElement>) => void` | — | Call event.preventDefault() to keep the menu open. |
| disabled | `boolean` | — | Grays the item out; arrow keys and typeahead skip it and clicks do nothing. |
| shortcut | `string` | — | Hint shown on the right, e.g. "⌘E". It is display text only; it does not bind the shortcut. |
| closeOnSelect | `boolean` | `false` | Close the menu and return focus to the trigger after selecting. Defaults to true for items, false for checkbox and radio items. |

### DropdownStaggerSub

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| label (required) | `React.ReactNode` | — | Text of the item that opens the submenu; it also names the submenu. |
| children (required) | `React.ReactNode` | — | Content. |
| icon | `React.ReactNode` | — | Leading icon for the submenu item. |
| disabled | `boolean` | — | Grays the item out; the submenu cannot open. |
| className | `string` | — | Classes merged onto the root element. |

### DropdownStaggerLabel

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| children (required) | `React.ReactNode` | — | Content. |
| id | `string` | — |  |
| className | `string` | — | Classes merged onto the root element. |

### DropdownStaggerSeparator

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| className | `string` | — | Classes merged onto the root element. |

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space / ArrowDown | On the trigger: opens the menu and focuses the first item. |
| ArrowUp | On the trigger: opens the menu and focuses the last item. |
| ArrowDown / ArrowUp | Moves to the next or previous enabled item, wrapping at the ends. |
| Home / End | Moves to the first or last enabled item. |
| Enter / Space | Activates the focused item, toggles a checkbox item or picks a radio item. |
| ArrowRight / Enter / Space | On a submenu item: opens the submenu and focuses its first item. |
| ArrowLeft | Inside a submenu: closes it and returns to its parent item. |
| Esc | Closes the submenu you are in, or the menu, returning focus to its trigger. |
| Tab | Closes the whole menu and returns focus to the trigger. |
| Letters | Typeahead: jumps to the next item whose text starts with the typed letters (600 ms window). |

## Accessibility

- The trigger is a <button> with aria-haspopup="menu", aria-expanded and aria-controls; triggerLabel adds sr-only text after the trigger content, so icon-only triggers get a name and visible text stays the start of it.
- The panel is role="menu" (aria-orientation vertical) labelled by its trigger. Items use menuitem, menuitemcheckbox and menuitemradio with aria-checked; submenu items have aria-haspopup and aria-expanded.
- A radio group is named by the DropdownStaggerLabel right before (or inside) it through aria-labelledby; pass label or aria-labelledby to name it yourself.
- Under dir="rtl" ArrowLeft opens a submenu and ArrowRight closes it; submenus open to the left first and items slide in from the other side.
- Disabled items get aria-disabled, are skipped by arrow keys and typeahead, and ignore clicks.
- Selecting an item, Esc and Tab return focus to the trigger; an outside click closes the menu without moving focus.
- Hovering an item moves focus to it, so the pointer and the keyboard share one highlight.

## Motion

- The panel fades in from scale 0.96 and 4px above in 150 ms and closes in 100 ms; submenus come from 4px to the side. Opened from the keyboard it appears at once. With stagger, items cascade 28 ms apart after 30 ms, each sliding 8px on the ui spring.
- Close: the panel fades and shrinks to 0.97 in 120 ms.
- A highlight glides between items with a shared layoutId on the snap spring. Checkbox checks draw their stroke and radio dots pop in.
- Submenus open after 90 ms of hover and close 160 ms after the pointer leaves, so diagonal moves do not drop them.
- Reduced motion: panels and items only change opacity, instantly; the highlight, check and dot jump without animating.

## Notes for AI

- Use onSelect, not onClick, on items. Call event.preventDefault() inside onSelect to keep the menu open.
- Checkbox items are controlled: always pass checked and onCheckedChange. Radio items only work inside DropdownStaggerRadioGroup with value and onValueChange.
- shortcut is display text only; bind the actual key yourself (for example with the kbd component's onTrigger).
- The menu is absolutely positioned inside an inline-block wrapper, with no portal and no vertical flip. Leave room below the trigger and avoid overflow: hidden on ancestors; use align="end" near the inline end (align is logical, so it mirrors under RTL).
- Keep item children as plain text where possible; typeahead matches on the item's text content.

## FAQ

**Where does a submenu open?**

Toward the inline end (right in LTR, left in RTL) when there is room, else the other side, else below the item, measured each time it opens.

**Can I control the open state?**

Yes: pass open and onOpenChange. defaultOpen works for the uncontrolled case.

## Related

- select: https://goodui.dev/components/core/select
- command-palette-morph: https://goodui.dev/components/navigation/command-palette-morph
- popover-morph: https://goodui.dev/components/overlays/popover-morph
- kbd: https://goodui.dev/components/core/kbd

Last updated: 2026-11-02
