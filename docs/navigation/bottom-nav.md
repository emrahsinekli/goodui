# Bottom navigation

> Mobile bottom bar where a pill glides to the selected tab and its icon bounces, in a labelled or expanding variant, with popping badges and an optional raised center action.

Animated mobile bottom navigation bar for React and shadcn with badges and a center action

Page: https://goodui.dev/components/navigation/bottom-nav

## Install

```bash
npx shadcn@latest add @goodui/bottom-nav
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/bottom-nav.json`. The file lands in `components/goodui/bottom-nav.tsx`.

## When to use

- Primary navigation in a mobile web app or PWA with 3–5 top-level sections (Today, Calendar, Clients, Inbox).
- When one action deserves a raised button in the middle of the bar, such as "New booking".
- Showing unread counts or a "new" dot on sections without opening them.

## When not to use

- Desktop layouts: use a sidebar or top navigation; a bottom bar wastes space on wide screens.
- Switching views inside a page or card: use tabs-indicator or segmented-control.
- More than five destinations: move the rest into a "More" screen or a menu.

## Pick by what matters

| Need | Use |
| --- | --- |
| Labels always visible (most apps) | variant="pill" (default) |
| Compact bar, label only on the active tab | variant="expand" |
| One primary create action | centerAction={{ label, icon, onClick }} |
| Unread count | badge: 3 on the item (99+ above 99) |
| Something new, no count | badge: true |

## Usage

```tsx
import { CalendarDays, Home, Inbox, Plus, Users } from "lucide-react"
import { BottomNav } from "@/components/goodui/bottom-nav"

export function AppTabBar({ tab, onTab, unread, onNewBooking }: { tab: string; onTab: (v: string) => void; unread: number; onNewBooking: () => void }) {
  return (
    <BottomNav
      aria-label="Salon app"
      className="fixed inset-x-0 bottom-0 z-40"
      value={tab}
      onValueChange={onTab}
      items={[
        { value: "today", label: "Today", icon: Home },
        { value: "calendar", label: "Calendar", icon: CalendarDays },
        { value: "clients", label: "Clients", icon: Users },
        { value: "inbox", label: "Inbox", icon: Inbox, badge: unread },
      ]}
      centerAction={{ label: "New booking", icon: Plus, onClick: onNewBooking }}
    />
  )
}
```

### Expanding variant driven by the router

```tsx
const pathname = usePathname()
const router = useRouter()

<BottomNav
  variant="expand"
  value={pathname.split("/")[1] || "today"}
  onValueChange={(v) => router.push(`/${v}`)}
  items={items}
/>
```

## API

### BottomNav

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| items (required) | `BottomNavItem[]` | — | The tabs, left to right. With centerAction, the first half goes before it. |
| value | `string` | — | Selected tab value (controlled), e.g. derived from the current route. |
| defaultValue | `string` | — | Initially selected tab when uncontrolled; defaults to the first item. |
| onValueChange | `(value: string) => void` | — | Called with the tab's value when it is tapped. |
| variant | `"pill" \| "expand"` | `"pill"` | `pill`: pill behind the icon with labels always shown. `expand`: the active tab grows to show its label. |
| centerAction | `{ label: string; icon: React.ComponentType<{ className?: string }>; onClick?: () => void }` | — | Raised round button in the middle of the bar, e.g. "New booking". |
| labels | `Partial<BottomNavLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <nav> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Moves through the tabs and the center action (every button is a tab stop). |
| ArrowRight / ArrowLeft | Moves focus to the next or previous tab, wrapping around; it does not select it. Mirrored under dir="rtl". |
| Home / End | Moves focus to the first or last tab. |
| Enter / Space | Selects the focused tab or runs the center action (native <button>). |

## Accessibility

- Renders a <nav> labelled by aria-label (default "Main"); the selected tab has aria-current="page".
- Each tab's accessible name is its visible label followed by sr-only ", 3 new" or ", new" when it has a badge (translate with labels.badgeCount / labels.badgeDot); the badge bubble itself is aria-hidden.
- The center action is a <button> named by centerAction.label.
- The bar adds bottom padding for env(safe-area-inset-bottom), so it clears the iPhone home indicator.

## Motion

- A tinted pill glides to the selected tab through a shared layout animation (spring 480 / 36, mass 0.9), and the chosen icon hops up 5px while scaling to 1.18 and back in 0.45 s.
- Expand variant: tabs resize with layout animation on the same spring and the active label fades in from 4px aside after 60 ms.
- Badges pop in from 0.3 scale on a spring (stiffness 600, damping 20) and pop again when the count changes.
- The center action lifts 2px on hover, presses to 0.9 and its icon turns 90° on hover (300 ms).
- Reduced motion: the pill and tabs move instantly, no hop, no badge pop, no lift, press or icon turn.

## Notes for AI

- The component is not fixed-positioned; add className="fixed inset-x-0 bottom-0 z-40" (and bottom padding on your page) yourself.
- Keep items to 3–5. With centerAction, the first Math.ceil(n / 2) items go left of it, so use an even count for a balanced bar.
- icon takes the component (icon: Home), not an element.
- For route-based navigation, derive value from the pathname and navigate in onValueChange; the tabs are buttons, not links.
- badge accepts a number or true; 0, false or undefined hides it.
- labels={{ badgeCount: (n) => `, ${n} nuevos`, badgeDot: ", nuevo" }} translates the screen-reader badge text.

## FAQ

**Are the tabs links?**

No, they are buttons that call onValueChange. Navigate with your router there, and set value from the current route so the pill follows back/forward navigation.

**Does the pill jump between two bars on the same page?**

No. Each bar has its own LayoutGroup and layoutId from useId.

## Related

- dock: https://goodui.dev/components/navigation/dock
- tabs-indicator: https://goodui.dev/components/navigation/tabs-indicator
- notification-badge: https://goodui.dev/components/feedback/notification-badge
- segmented-control: https://goodui.dev/components/navigation/segmented-control

Last updated: 2026-11-02
