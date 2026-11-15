# Dropdown Menu

> Menu button and right-click context menu with default, glass, neo, inverted and flat surfaces, soft, solid, bar or outline highlights, tones, sizes, shapes and shadows; icons, descriptions, badges and live keyboard shortcuts, checkbox items, radio groups, labelled groups, destructive items and nested sub-menus with hover intent and a safe triangle; scale, fade, slide or stagger entrances, type-ahead and full APG keyboard, portaled and flipped to stay on screen.

Dropdown menu and context menu for React and shadcn: sub-menus, checkbox and radio items, shortcuts, full keyboard

Page: https://goodui.dev/components/core/dropdown-menu

## Install

```bash
npx shadcn@latest add @goodui/dropdown-menu
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/dropdown-menu.json`. The file lands in `components/goodui/dropdown-menu.tsx`.

## When to use

- A list of actions behind one button: row actions in a table (Edit, Duplicate, Cancel booking), an Export button, a user menu.
- Right-click menus on a canvas, calendar or file list (mode="context"), with long-press on touch.
- Toggles and one-of-many settings that belong with the actions: visible columns (checkbox items), sort order or status (radio group).
- Deep action trees that need sub-menus, with keyboard shortcuts shown next to each action and optionally bound as hotkeys.

## When not to use

- Picking a form value from a list: use select; a menu runs actions and does not hold a form value.
- Typing to search thousands of options: use combobox.
- Two or three actions that fit on screen: show them as buttons, so nothing is hidden.
- Site navigation with many links: use a navigation menu or sidebar; menus are for actions on the current thing.

## Pick by what matters

| Need | Use |
| --- | --- |
| Row actions in tables and lists | an iconOnly Button as trigger, align="end", size="sm" |
| Calm app menus | variant="default", highlight="soft", animation="scale" (default) |
| Dense pro tools (editors, calendars) | highlight="bar" or "outline", size="sm", animation="fade" |
| macOS-like menus over content | variant="inverted" or "glass" |
| Playful or retro brands | variant="neo" with highlight="solid" |
| Right-click on a surface | mode="context" and wrap the surface as children |
| Shortcuts that actually work | shortcut on items plus bindShortcuts |

## Usage

```tsx
import { MoreHorizontal, Pencil, Copy, CalendarClock, Trash2 } from "lucide-react"
import { Button } from "@/components/goodui/button"
import { DropdownMenu } from "@/components/goodui/dropdown-menu"

export function BookingActions({ booking }: { booking: { id: string; client: string } }) {
  const [remind, setRemind] = React.useState(true)
  const [status, setStatus] = React.useState("confirmed")
  return (
    <DropdownMenu
      align="end"
      trigger={
        <Button variant="ghost" tone="neutral" size="sm" iconOnly aria-label={`Actions for ${booking.client}`}>
          <MoreHorizontal />
        </Button>
      }
      items={[
        { label: "Edit booking", icon: <Pencil />, shortcut: "Mod+E", onSelect: () => edit(booking.id) },
        { label: "Duplicate", icon: <Copy />, shortcut: "Mod+D", onSelect: () => duplicate(booking.id) },
        {
          type: "sub",
          label: "Reschedule",
          icon: <CalendarClock />,
          items: [
            { label: "Tomorrow, same time", onSelect: () => moveBy(booking.id, 1) },
            { label: "Next week", onSelect: () => moveBy(booking.id, 7) },
          ],
        },
        { type: "separator" },
        { type: "checkbox", id: "remind", label: "Send reminder", checked: remind, onCheckedChange: setRemind },
        {
          type: "radio",
          id: "status",
          label: "Status",
          value: status,
          onValueChange: setStatus,
          options: [
            { value: "confirmed", label: "Confirmed" },
            { value: "pending", label: "Pending deposit" },
          ],
        },
        { type: "separator" },
        { label: "Cancel booking", icon: <Trash2 />, destructive: true, onSelect: () => cancel(booking.id) },
      ]}
    />
  )
}
```

### Context menu on a calendar

```tsx
<DropdownMenu
  mode="context"
  items={[
    { label: "New booking here", icon: <CalendarPlus />, onSelect: create },
    { label: "Block this time", onSelect: block },
  ]}
>
  <WeekGrid />
</DropdownMenu>
```

### Live hotkeys

```tsx
<DropdownMenu
  bindShortcuts
  label="Export"
  items={[
    { label: "Download PDF", shortcut: "Mod+Shift+F", onSelect: downloadPdf },
    { label: "Email to client", shortcut: "Mod+Shift+E", onSelect: email },
  ]}
/>
```

### Translated

```tsx
<DropdownMenu
  items={items}
  labels={{ trigger: "Aktionen", contextMenu: "Kontextmenü", keyName: (k) => ({ Ctrl: "Strg", Shift: "Umschalt", Del: "Entf" })[k] ?? k }}
/>
```

## API

### DropdownMenu

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| items (required) | `DropdownMenuItem[]` | — |  |
| aria-label | `string` | — | Defines a string value that labels the current element. Names the menu. Defaults to the trigger's text (menu) or labels.contextMenu (context). |
| mode | `"menu" \| "context"` | `"menu"` | menu opens from the trigger; context opens at the pointer on right-click (or long-press) inside children. |
| trigger | `React.ReactElement` | — | Your trigger element (usually a button). It gets the ARIA and handlers. Without it a built-in button is shown. |
| label | `React.ReactNode` | — | Text of the built-in trigger. |
| children | `React.ReactNode` | — | Context mode: the area that opens the menu on right-click. |
| variant | `"default" \| "glass" \| "neo" \| "inverted" \| "flat"` | `"default"` | Menu surface: default (popover), glass, neo, inverted or flat. |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"primary"` | Accent for the highlight, check marks and bars. |
| highlight | `"soft" \| "solid" \| "bar" \| "outline"` | `"soft"` | How the active item is painted: soft tint, solid tone fill, a bar at the start edge, or an outline. |
| size | `"sm" \| "md" \| "lg"` | `"md"` |  |
| shadow | `"none" \| "sm" \| "md" \| "lg"` | `"md"` |  |
| shape | `"square" \| "rounded" \| "pill"` | `"rounded"` |  |
| animation | `"none" \| "fade" \| "scale" \| "slide" \| "stagger"` | `"scale"` | How menus open. stagger cascades the items in. Reduced motion turns it into a short fade. |
| side | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Preferred side; flips when there is no room. |
| align | `"start" \| "center" \| "end"` | `"start"` | Alignment along the side; start follows the reading direction. |
| sideOffset | `number` | `6` | Gap between trigger and menu in px. |
| open | `boolean` | — |  |
| defaultOpen | `boolean` | `false` |  |
| onOpenChange | `(open: boolean) => void` | — |  |
| bindShortcuts | `boolean` | — | Also run items' shortcuts as global hotkeys while the page is focused. |
| loop | `boolean` | `true` | Arrow keys wrap from the last item to the first. |
| disabled | `boolean` | — |  |
| menuClassName | `string` | — | Class for every menu panel (root and sub-menus). |
| labels | `Partial<DropdownMenuLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | On the trigger: opens the menu and focuses the first item. |
| Arrow Down / Arrow Up | On the trigger: opens the menu on the first or last item. In the menu: moves between items, skipping disabled ones and wrapping (loop). |
| Home / End (also Page Up / Page Down) | First or last item. |
| Arrow Right (Arrow Left in RTL) | On a sub-menu item: opens the sub-menu and focuses its first item. |
| Arrow Left (Arrow Right in RTL) | In a sub-menu: closes it and returns focus to its parent item. |
| Enter / Space | Activates the item: runs onSelect, toggles a checkbox, picks a radio, opens a sub-menu. Links follow their href. |
| Letters | Type-ahead: focuses the next item whose label starts with the typed text. |
| Escape | Closes the current level; on the root menu returns focus to the trigger (or the element that was focused before a context menu). |
| Tab | Closes every level, returns focus to the trigger and lets Tab continue from there. |
| Shift + F10 / Menu key | In context mode, on a focused element inside the area: opens the menu at that element with the first item focused. |
| Item shortcuts | With bindShortcuts, each item's shortcut runs it from anywhere on the page (plain-letter combos are ignored while typing in a field). |

## Accessibility

- Follows the WAI-ARIA menu button pattern: the trigger gets aria-haspopup="menu", aria-expanded and aria-controls; the panel is role="menu" labelled by the trigger (or aria-label).
- Items are role="menuitem", "menuitemcheckbox" or "menuitemradio" with aria-checked; sub-menu items carry aria-haspopup and aria-expanded; groups are role="group" labelled by their visible label; separators are role="separator".
- Focus really moves to items (roving focus), so screen readers announce each item. Disabled items stay visible with aria-disabled and are skipped by the arrow keys.
- Shortcuts are visible keycaps and are exposed as aria-keyshortcuts (Mod becomes Meta on Mac and Control elsewhere).
- Your trigger element keeps its own name; icon-only triggers need an aria-label. Context menus are named by labels.contextMenu.
- Menus are portaled to document.body, so overflow: hidden parents never clip them, and they flip and shift to stay in the viewport.

## Motion

- scale (default): the menu fades in from 0.96 scale at the edge facing the trigger in 150 ms and closes in 100 ms. fade: opacity only. slide: moves 8px in from the trigger's side. stagger: items cascade in, for rare menus only. One highlight glides between rows. Menus opened from the keyboard appear at once.
- Menus close with a 100 ms fade. Check marks and radio dots pop in with a short overshoot; the bar highlight grows in 160 ms; the built-in trigger's chevron turns 180°.
- Reduced motion: menus only fade (100 ms), items do not cascade and CSS transitions are off. Nothing depends on the animation to work.

## Performance

- Menus mount only while open. Placement is measured once per open and updated on scroll, resize and size changes, throttled to one animation frame.
- Item lists are not virtualized; for hundreds of options use combobox.

## Notes for AI

- items is data: actions { label, icon?, description?, shortcut?, badge?, destructive?, href?, onSelect?, disabled?, keepOpen? }, { type: "checkbox", id, … }, { type: "radio", id, options }, { type: "sub", label, items }, { type: "group", label?, items }, { type: "label" }, { type: "separator" }.
- Pass your own trigger element (e.g. <Button iconOnly aria-label=…>); it is cloned with ref, ARIA and click/key handlers. Without trigger a built-in button shows label.
- Checkbox items stay open after a toggle and radio items close; flip that with keepOpen.
- Checkbox and radio state is uncontrolled via defaultChecked/defaultValue, or controlled via checked/value with onCheckedChange/onValueChange.
- Shortcuts use Mod for ⌘ on Mac and Ctrl elsewhere: "Mod+Shift+E". They are display-only unless bindShortcuts is set.
- Use mode="context" with children for right-click menus; do not attach onContextMenu yourself.
- Do not use it as a form select; use select or combobox for values.

## FAQ

**Does the menu get clipped inside a scrolling table?**

No. It renders in a portal on document.body with fixed positioning, flips to the other side when there is no room and shifts to stay inside the viewport.

**How do sub-menus behave with the mouse?**

They open after about 110 ms of hover. While you move the pointer diagonally toward an open sub-menu, a safe triangle keeps it open even if you cross other items.

**Can items be links?**

Yes, give an item href (and target). It renders an <a role="menuitem">, so middle-click and open-in-new-tab work.

## Related

- select: https://goodui.dev/components/core/select
- combobox: https://goodui.dev/components/core/combobox
- button: https://goodui.dev/components/core/button
- kbd: https://goodui.dev/components/core/kbd

Last updated: 2026-11-03
