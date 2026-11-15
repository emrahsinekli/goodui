# Dock

> macOS-style dock whose tiles magnify on a spring as the pointer nears, with tooltips, running dots, badges and a launch bounce, falling back to a simple press scale on touch.

macOS dock for React and shadcn: magnifying icon bar with tooltips, badges and launch bounce

Page: https://goodui.dev/components/navigation/dock

## Install

```bash
npx shadcn@latest add @goodui/dock
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/dock.json`. The file lands in `components/goodui/dock.tsx`.

## When to use

- A floating app switcher or quick-action bar in a dashboard (Dashboard, Calendar, Clients, Messages…).
- Portfolio or marketing pages that want a playful, recognisable navigation bar.
- Icon-only toolbars where tooltips and an "open" dot help people learn what each tile does.

## When not to use

- Primary navigation on phones: use bottom-nav; magnification needs a mouse and falls back to a press scale on touch.
- Toolbars with many text actions: use a plain button row; the dock only shows icons.
- Switching views inside one card: use tabs-indicator or segmented-control.

## Pick by what matters

| Need | Use |
| --- | --- |
| Classic macOS feel | defaults (size 44, magnification 68, distance 140) |
| Subtle growth | magnification close to size, e.g. size={40} magnification={54} |
| No magnification at all | magnification={size} |
| Group tiles | { id, separator: true } between items |
| Brand-colored tile | tileClassName="bg-gradient-to-br from-sky-400 to-blue-600 text-white" |

## Usage

```tsx
import { CalendarDays, LayoutDashboard, MessageSquare, Receipt, Settings, Users } from "lucide-react"
import { Dock } from "@/components/goodui/dock"

export function AppDock({ open, unread, onOpen }: { open: string; unread: number; onOpen: (id: string) => void }) {
  return (
    <Dock
      aria-label="Apps"
      items={[
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, active: open === "dashboard", onClick: () => onOpen("dashboard") },
        { id: "calendar", label: "Calendar", icon: CalendarDays, active: open === "calendar", onClick: () => onOpen("calendar") },
        { id: "clients", label: "Clients", icon: Users, active: open === "clients", onClick: () => onOpen("clients") },
        { id: "messages", label: "Messages", icon: MessageSquare, badge: unread, onClick: () => onOpen("messages") },
        { id: "sep", separator: true },
        { id: "invoices", label: "Invoices", icon: Receipt, onClick: () => onOpen("invoices") },
        { id: "settings", label: "Settings", icon: Settings, onClick: () => onOpen("settings") },
      ]}
    />
  )
}
```

### Smaller dock without the launch bounce

```tsx
<Dock aria-label="Quick actions" size={36} magnification={52} distance={110} bounce={false} items={items} />
```

## API

### Dock

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| items (required) | `DockItem[]` | — | Tiles from left to right; { id, separator: true } draws a divider between groups. |
| size | `number` | `44` | Resting tile size in px. |
| magnification | `number` | `68` | Tile size in px right under the pointer. |
| distance | `number` | `140` | Pointer distance in px over which neighbours grow. |
| bounce | `boolean` | `true` | Bounce the icon when clicked, like an app launching. |
| labels | `Partial<DockLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Focuses the dock (one tab stop) and shows that tile's tooltip. |
| ArrowRight / ArrowLeft | Moves focus to the next or previous tile, wrapping around; separators are skipped. Mirrored under dir="rtl". |
| Home / End | Moves focus to the first or last tile. |
| Enter / Space | Activates the focused tile (native <button>). |

## Accessibility

- The root is role="toolbar" with a roving tabindex; pass aria-label to name it. Separators are role="separator".
- Each tile is a <button> whose accessible name is label (read from sr-only text, so the visible count is part of it); its tooltip (role="tooltip") is linked through aria-describedby while shown, on hover or focus.
- active sets aria-current="page" and shows the dot under the tile.
- The badge count is part of the accessible name: "Messages, 3 new". Translate the suffix with labels.badge.

## Motion

- Tiles within distance of the mouse grow toward magnification with a cosine falloff, smoothed by a spring (stiffness 170, damping 14, mass 0.1). Only mouse pointers magnify.
- Clicking bounces the icon up 14px, then 5px, over 0.6 s (bounce). Tiles shrink to 0.9 while pressed.
- Tooltips spring up 6px into place (stiffness 500, damping 30); badges pop from scale 0 (stiffness 600, damping 22); the running dot scales in over 300 ms.
- On touch screens (hover: none) there is no magnification; tiles press to 0.9 and still bounce on tap.
- Reduced motion: no magnification, hover lift, press scale or bounce; tooltips and badges appear instantly.

## Performance

- Magnification runs on motion values, so pointer moves do not re-render React; each tile measures itself with getBoundingClientRect on pointer move.

## Notes for AI

- items is one array: { id, label, icon, onClick?, active?, badge?, tileClassName? } or { id, separator: true }. Every id must be unique.
- icon takes the component (icon: Users), not an element.
- active means "running/open" (dot + aria-current), not hovered; set it from your router or state.
- The dock has a fixed height of size + 20px and tiles grow upward; leave room above it for magnified tiles and tooltips.
- badge is a number (99+ above 99); 0 or undefined hides it. Don't repeat the count in label: screen readers already hear "Messages, 3 new".
- labels={{ badge: (n) => `${n} nuevos` }} translates the screen-reader count suffix.

## FAQ

**What happens on phones?**

Magnification is turned off when the device reports hover: none; tiles keep tooltips on focus, the press scale and the launch bounce.

**Can I put it at the bottom of the screen?**

Yes. Wrap it in a fixed container (e.g. fixed inset-x-0 bottom-4) — the dock itself is centered with mx-auto and sized to its content.

## Related

- bottom-nav: https://goodui.dev/components/navigation/bottom-nav
- notification-badge: https://goodui.dev/components/feedback/notification-badge
- tooltip-animated: https://goodui.dev/components/overlays/tooltip-animated
- magnetic-button: https://goodui.dev/components/buttons/magnetic-button

Last updated: 2026-11-02
