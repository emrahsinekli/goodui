# Animated list

> Notification stack where new items spring in from the top, older ones glide down, slightly dimmed in the depth variant, and items beyond the limit blur away.

Animated notification list for React and shadcn: new items spring in at the top

Page: https://goodui.dev/components/lists/animated-list

## Install

```bash
npx shadcn@latest add @goodui/animated-list
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/animated-list.json`. The file lands in `components/goodui/animated-list.tsx`.

## When to use

- Activity feeds and notification panels where new events arrive at the top: new bookings, payments, sign-ups.
- A compact "recent payments" or "latest orders" card that shows the last few items and drops older ones.
- Landing-page demos that simulate live activity by adding an item every few seconds.

## When not to use

- Temporary messages that confirm an action and then disappear: use toast-stack.
- Tabular data with columns, sorting or removal in the middle: use table-row-presence.
- Lists people reorder by hand: use list-reorder.

## Pick by what matters

| Need | Use |
| --- | --- |
| Plain feed inside a card | defaults (no depth, no fadeEdge) |
| Notification-stack look, older items slightly smaller and dimmer | depth |
| List that visually trails off at the bottom | fadeEdge |

## Usage

```tsx
import * as React from "react"
import { CalendarCheck } from "lucide-react"
import { AnimatedList } from "@/components/goodui/animated-list"

type Activity = { id: string; client: string; service: string; time: string }

export function BookingFeed({ activity }: { activity: Activity[] }) {
  // activity is newest first: prepend new events, e.g. setActivity((a) => [event, ...a])
  return (
    <AnimatedList
      items={activity}
      getKey={(a) => a.id}
      maxItems={4}
      depth
      label="New bookings"
      renderItem={(a) => (
        <div className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
          <CalendarCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-medium">{a.client} booked {a.service}</p>
            <p className="text-xs text-muted-foreground">{a.time}</p>
          </div>
        </div>
      )}
    />
  )
}
```

### Recent payments card with a faded edge

```tsx
<AnimatedList
  items={payments}
  getKey={(p) => p.id}
  maxItems={5}
  fadeEdge
  label="Recent payments"
  className="gap-0 rounded-xl border bg-card px-3 py-1"
  renderItem={(p) => (
    <div className="flex justify-between border-b py-2.5 text-sm">
      <span>{p.client}</span>
      <span className="tabular-nums">+${p.amount}</span>
    </div>
  )}
/>
```

## API

### AnimatedList

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| items (required) | `T[]` | — | Newest first. New items enter at the top and push the rest down. |
| getKey (required) | `(item: T) => string` | — | Stable unique key of an item; a new key is what makes an item animate in. |
| renderItem (required) | `(item: T, index: number) => React.ReactNode` | — | Content of one item; `index` is 0 for the newest. |
| maxItems | `number` | `5` | Items beyond this count leave the bottom of the stack. |
| depth | `boolean` | `false` | Dim and shrink older items slightly, like a notification stack. Dimming lowers text contrast, so use text-foreground/75 rather than text-muted-foreground for secondary text. |
| fadeEdge | `boolean` | `false` | Fade the bottom edge out. |
| label | `string` | `"Notifications"` | Accessible name for the live region. |

Also accepts every <ul> attribute.

## Accessibility

- The list is a <ul aria-live="polite" aria-relevant="additions"> (a real list, so its <li> items stay valid), so screen readers read new items without interrupting.
- label names the list (default "Notifications"); set it to what the feed is, e.g. "Recent payments".
- With depth, older items are dimmed; use text-foreground/75 instead of text-muted-foreground for their secondary text so it keeps 4.5:1 contrast.
- Keep each item's text short: the whole new item is what gets announced.

## Motion

- New items enter from 24px above, scaled to 0.92 and blurred 4px, on a spring (stiffness 380, damping 32, mass 0.9); the items below glide down with a layout animation.
- Items pushed past maxItems fade, shrink to 0.9 and blur out over 0.2 s.
- depth: each older item is 6% more transparent and 2% smaller, up to four steps.
- Reduced motion: items appear and disappear without movement, scale or blur, with no transition.

## Notes for AI

- items is newest first: add new entries with [item, ...items], not push, or they appear at the bottom.
- getKey must be stable and unique per item (an event id); index keys make every item re-animate.
- maxItems only limits what is shown (default 5); trim the array yourself if it can grow without bound.
- renderItem returns the whole card; the list adds no styling beyond a vertical gap-2, which className can override.
- Do not wrap it in another aria-live region; it already is one.

## FAQ

**How do I simulate live activity on a landing page?**

Prepend an item to the array on an interval (setInterval in useEffect, cleared on unmount). The list animates the rest.

**Why do new items appear at the bottom?**

The list expects newest first. Prepend new items instead of pushing them.

## Related

- toast-stack: https://goodui.dev/components/feedback/toast-stack
- notification-badge: https://goodui.dev/components/feedback/notification-badge
- table-row-presence: https://goodui.dev/components/lists/table-row-presence
- list-reorder: https://goodui.dev/components/lists/list-reorder

Last updated: 2026-11-02
