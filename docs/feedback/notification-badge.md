# Notification badge

> Count badge for icon buttons that springs in, bumps when the count rises, rolls its digits, caps at 99+ and offers a pulse ring or dot variant.

Animated notification badge for React and shadcn: unread count on an icon button

Page: https://goodui.dev/components/feedback/notification-badge

## Install

```bash
npx shadcn@latest add @goodui/notification-badge
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/notification-badge.json`. The file lands in `components/goodui/notification-badge.tsx`.

## When to use

- An unread or pending count on an icon button: booking requests on a bell, emails on an inbox icon.
- A simple "something new" dot on a messages icon (dot).
- Counts that rise while the user watches, where the bump draws the eye without a toast.

## When not to use

- A standalone status or count label in text: use badge.
- Telling the user what happened, not just how many: use toast-stack.
- Counts on mobile tab bar items: bottom-nav and dock have their own badges.

## Pick by what matters

| Need | Use |
| --- | --- |
| Exact count | count={n} (caps at 99+ by default) |
| Just "there is something" | dot |
| Urgent, keep pinging | pulse |
| Calm, on-brand count | tone="primary" |
| Show 0 instead of hiding | showZero |

## Usage

```tsx
import { Bell } from "lucide-react"
import { NotificationBadge } from "@/components/goodui/notification-badge"

export function BookingRequestsButton({ count, onOpen }: { count: number; onOpen: () => void }) {
  return (
    <NotificationBadge count={count} pulse label="booking requests">
      <button
        type="button"
        aria-label="Booking requests"
        onClick={onOpen}
        className="grid size-10 place-items-center rounded-full hover:bg-muted"
      >
        <Bell className="size-5" />
      </button>
    </NotificationBadge>
  )
}
```

### Dot for new messages

```tsx
<NotificationBadge count={hasNew ? 1 : 0} dot tone="emerald" label="new messages">
  <button type="button" aria-label="Messages"><MessageSquare /></button>
</NotificationBadge>
```

### Large inbox with a custom cap

```tsx
<NotificationBadge count={1240} max={999} tone="primary" label="emails">
  <button type="button" aria-label="Inbox"><Inbox /></button>
</NotificationBadge>
```

## API

### NotificationBadge

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| children (required) | `React.ReactNode` | — | The element the badge sits on, usually an icon button. |
| count (required) | `number` | — | Number shown in the badge. At 0 the badge hides (unless showZero); a higher count bumps it. |
| max | `number` | `99` | Above this the badge reads "99+". |
| dot | `boolean` | `false` | A plain dot instead of a number. |
| pulse | `boolean` | `false` | A ring that keeps pinging outward while the count is above zero. |
| showZero | `boolean` | `false` | Keep the badge visible at 0. |
| tone | `"red" \| "primary" \| "emerald" \| "amber"` | `"red"` | Badge color: red (rose) for alerts, primary for your theme color, emerald or amber. |
| placement | `"top-right" \| "top-left" \| "bottom-right"` | `"top-right"` | Badge corner. Left and right are mirrored under RTL (right means the inline end). |
| label | `string` | `"unread"` | Words for screen readers after the count. |
| labels | `Partial<NotificationBadgeLabels>` | — | Text for built-in controls and screen readers; pass translations here. |
| badgeClassName | `string` | — | Classes for the badge itself; className goes on the wrapper around children. |

Also accepts every <span> attribute.

## Accessibility

- The visible badge is aria-hidden; an sr-only polite live region reads "3 booking requests", or "More than 99 …" above max, and is empty at 0.
- label is the word after the count (default "unread"); pass a translated phrase. Translate the capped wording with labels.moreThan.
- Give the wrapped button its own aria-label; the badge does not label it.

## Motion

- The badge springs in from scale 0 when the count leaves 0 and springs out when it returns (stiffness 520, damping 22).
- When the count goes up from a non-zero value, it swells to 1.3x in 100 ms and settles back on a bouncy spring (stiffness 520, damping 13). Digits roll through number-flow.
- pulse adds a ring that pings outward every 1.6 s while the count is above 0.
- Reduced motion: the badge fades in and out, there is no bump or ping, and the digits snap.

## Notes for AI

- Wrap the icon button as children; the badge positions itself on its corner. Do not position it yourself.
- count is a number; the component formats "99+" from max. Do not pass "99+" strings.
- label is the screen reader noun ("booking requests"), not the button's name.
- dot still announces the count to screen readers, so pass a real count (1) rather than true.
- placement is mirrored under RTL: top-right sits on the inline end (the left corner in RTL).
- labels={{ moreThan: (max) => `Mehr als ${max}` }} translates the screen-reader text for capped counts.

## FAQ

**Why doesn't it bump when the count goes from 0 to 1?**

Going from 0 the badge springs in instead; the bump only plays when an already visible count rises.

**Does it animate on first render?**

No. AnimatePresence has initial={false}, so a badge that is there on mount just appears.

## Related

- badge: https://goodui.dev/components/core/badge
- toast-stack: https://goodui.dev/components/feedback/toast-stack
- bottom-nav: https://goodui.dev/components/navigation/bottom-nav
- dock: https://goodui.dev/components/navigation/dock

Last updated: 2026-11-02
