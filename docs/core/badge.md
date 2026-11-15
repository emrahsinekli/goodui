# Badge

> One badge, every layer: solid, soft, outline, status dot, gradient, glass and neo in six tones, with pulse, shine, bounce-in and count-pop animations, icons, removable chips and clickable filters.

Status badge for React and shadcn: 7 variants, 6 tones, pulse dot, removable chips

Page: https://goodui.dev/components/core/badge

## Install

```bash
npx shadcn@latest add @goodui/badge
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/badge.json`. The file lands in `components/goodui/badge.tsx`.

## When to use

- Showing a status next to a record: Confirmed, Pending, No-show, Overdue.
- Tags and filters on a list, removable (× button) or clickable (real <button>) without extra wrappers.
- Small counts and plan labels: 3 unread, 99+, Pro, Beta.
- A live indicator such as "Online" or "Recording" with a pinging dot.

## When not to use

- An unread count pinned to the corner of an icon or avatar: use notification-badge.
- A trend number like +12% next to a KPI: use delta-badge, or the delta built into stat-card.
- The main action on a screen: use button; a clickable badge reads as a filter or tag, not a call to action.

## Pick by what matters

| Need | Use |
| --- | --- |
| Status column in a table | variant="soft" (default) with tone="success" \| "warning" \| "danger" |
| Neutral status where the color should stay quiet | variant="dot" with the tone coloring only the dot |
| Something live or online right now | animation="pulse" (works best with variant="dot") |
| Unread or cart counts that change | animation="count" with a number child and max={99} |
| Plan or feature labels on marketing pages | variant="gradient" or animation="shine" |
| Tags a user can remove | removable with onRemove |
| Filter chips a user can toggle | clickable, switching variant="solid" / "outline" by state |

## Usage

```tsx
import { Check, Clock } from "lucide-react"
import { Badge } from "@/components/goodui/badge"

const bookings = [
  { client: "Maya Chen", time: "09:30", status: "Confirmed" },
  { client: "Leo Park", time: "11:00", status: "Pending" },
  { client: "Ana Ruiz", time: "13:15", status: "No-show" },
] as const

const tone = { Confirmed: "success", Pending: "warning", "No-show": "danger" } as const

export function TodayBookings() {
  return (
    <ul className="divide-y rounded-lg border">
      {bookings.map((b) => (
        <li key={b.client} className="flex items-center justify-between px-4 py-3 text-sm">
          <span>
            {b.time} · {b.client}
          </span>
          <Badge tone={tone[b.status]} icon={b.status === "Confirmed" ? <Check /> : b.status === "Pending" ? <Clock /> : undefined}>
            {b.status}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
```

### Removable tags

```tsx
const [tags, setTags] = React.useState(["Haircut", "Color", "VIP"])

<div className="flex flex-wrap gap-1.5">
  {tags.map((t) => (
    <Badge key={t} variant="outline" tone="neutral" removable onRemove={() => setTags((all) => all.filter((x) => x !== t))}>
      {t}
    </Badge>
  ))}
</div>
```

### Toggleable filter chips

```tsx
const [active, setActive] = React.useState<string[]>(["Paid"])
const toggle = (f: string) => setActive((a) => (a.includes(f) ? a.filter((x) => x !== f) : [...a, f]))

{["Today", "Paid", "Walk-ins"].map((f) => (
  <Badge key={f} clickable size="md" variant={active.includes(f) ? "solid" : "outline"} aria-pressed={active.includes(f)} onClick={() => toggle(f)}>
    {f}
  </Badge>
))}
```

### Live count with overflow

```tsx
<Badge variant="solid" tone="danger" size="xs" animation="count" max={99}>
  {unread}
</Badge>
```

## API

### Badge

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| variant | `"solid" \| "soft" \| "outline" \| "dot" \| "gradient" \| "glass" \| "neo"` | `"soft"` | How it is painted: solid fill, soft tint (default), outline, neutral with a colored dot, gradient, frosted glass or neo-brutalist. |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"primary"` | Color by meaning; drives every variant through CSS variables. |
| shadow | `"none" \| "sm" \| "md" \| "glow"` | `"none"` | Drop shadow; glow uses the tone color. Ignored by neo, which has its own offset shadow. |
| animation | `"none" \| "pulse" \| "shine" \| "bounce-in" \| "count"` | `"none"` | pulse pings a status dot, shine sweeps a light, bounce-in plays on mount, count pops when the content changes. |
| shape | `"square" \| "rounded" \| "pill"` | `"pill"` |  |
| size | `"xs" \| "sm" \| "md"` | `"sm"` |  |
| icon | `React.ReactNode` | — | Leading icon. On the dot variant it replaces the dot. |
| removable | `boolean` | — | Shows a × button; the badge animates out, then calls onRemove. |
| onRemove | `() => void` | — | Called after the exit animation (instantly with reduced motion). Remove the item from your state here. |
| clickable | `boolean` | — | Renders a real <button> with hover and focus states. |
| max | `number` | — | Numbers above max render as "max+". |
| disabled | `boolean` | — | Dims the badge and disables its button (clickable) or × button. |
| labels | `Partial<BadgeLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <element> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | Activates a clickable badge (native <button>) and the × remove button. |
| Tab | Moves focus to a clickable badge and to its × button; focus rings show on keyboard focus only. |

## Accessibility

- A plain badge is a <span>; clickable renders a real <button type="button">, so add aria-pressed yourself when it toggles a filter.
- The × button has aria-label "Remove" (change it with labels.remove). Inside a clickable badge it becomes a focusable role="button" span, since buttons cannot nest; when the badge is disabled that span leaves the tab order and ignores clicks and keys.
- Icons and the status dot are aria-hidden; the text carries the meaning, so do not rely on the tone color alone.
- disabled dims the badge and disables its <button> (the clickable badge, or the × on a plain badge).

## Motion

- pulse: a copy of the dot scales to 2.6× and fades, every 1.6 s. Without variant="dot" or an icon, a dot is added in front of the text.
- shine: a light sweeps across the badge every 3 s. bounce-in: scales in from 0.3 with overshoot in 500 ms, once on mount.
- count: when the text or number changes, the badge pops from 1.18× and the new value slides up in 380 ms. Never on first render.
- Remove: the badge scales to 0.6 and fades out in 180 ms, then onRemove fires. Clickable badges scale to 0.96 on press (neo badges shift into their shadow).
- Reduced motion: every animation and transition is off, the pulse ring and shine are hidden, and remove happens instantly.

## Performance

- All animations are CSS keyframes on transform and opacity, shipped once through a shared <style> tag. No JavaScript runs per frame.

## Notes for AI

- Layers are independent props: variant, tone, shadow, animation, shape, size. Default is variant="soft" tone="primary" shape="pill" size="sm".
- Map meaning to tone (success, warning, danger, info, neutral); do not add bg-* or text-* color classes.
- removable hides the badge itself after the exit animation; still remove the item from your state in onRemove, or it comes back when its label or removable changes.
- max only applies when children is a number: <Badge max={99}>{count}</Badge> renders "99+". It does nothing for strings.
- Pass icons through icon, not as children. labels={{ remove: "Entfernen" }} translates the × button's aria-label.

## FAQ

**How do I make a status dot without the pulse?**

Use variant="dot". The tone colors only the dot and the badge stays neutral. Add animation="pulse" when it should ping.

**Can a badge be both clickable and removable?**

Yes. The badge renders a <button> and the × becomes a focusable role="button" span that handles Enter and Space and stops the click from reaching the badge.

## Related

- notification-badge: https://goodui.dev/components/feedback/notification-badge
- delta-badge: https://goodui.dev/components/numbers/delta-badge
- button: https://goodui.dev/components/core/button
- avatar: https://goodui.dev/components/core/avatar

Last updated: 2026-11-02
