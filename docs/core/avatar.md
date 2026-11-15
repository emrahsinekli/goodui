# Avatar

> Six sizes and four shapes including squircle, status dots with pulse, solid, gradient and rotating story rings, image fade-in with name-based gradient initials, and groups that cap with +N and fan out on hover.

Avatar for React and shadcn: initials fallback, status dot, story ring and avatar group

Page: https://goodui.dev/components/core/avatar

## Install

```bash
npx shadcn@latest add @goodui/avatar
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/avatar.json`. The file lands in `components/goodui/avatar.tsx`.

## When to use

- Showing who a record belongs to: the client on a booking, the assignee on a task, the author of a comment.
- Team and attendee lists where some people have no photo: initials on a gradient derived from the name, the same colors every time.
- Presence in chat or team views: online, away, busy or offline dots.
- Stacks of people on a card or table row ("Maya, Leo and 5 more") with AvatarGroup and max.

## When not to use

- An unread count on top of an avatar: wrap it with notification-badge.
- A logo or product image in a list: use a plain <img>; avatars imply a person.
- A text-only status like "Online" without a face: use badge with variant="dot".

## Pick by what matters

| Need | Use |
| --- | --- |
| Lists and tables | size="sm" or "md", shape="circle" (defaults) |
| Workspaces, teams or companies | shape="rounded" or "squircle" to tell them apart from people |
| Presence | status="online" \| "away" \| "busy" \| "offline", statusPulse for live |
| Highlight the current user or a selected person | ring="solid" with a tone |
| Unseen stories or a live host | ring="story" animation="spin" |
| Attendees on a booking card | AvatarGroup max={4} tooltips |

## Usage

```tsx
import { Avatar, AvatarGroup } from "@/components/goodui/avatar"

const team = [
  { name: "Maya Chen", src: "/team/maya.jpg" },
  { name: "Leo Park", src: "/team/leo.jpg" },
  { name: "Ana Ruiz" },
  { name: "Sam Okafor" },
  { name: "Priya Nair" },
  { name: "Tom Becker" },
]

export function StylistRow() {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <Avatar name="Maya Chen" src="/team/maya.jpg" size="lg" status="online" />
        <div className="text-sm">
          <p className="font-medium">Maya Chen</p>
          <p className="text-muted-foreground">Senior stylist · 6 bookings today</p>
        </div>
      </div>
      <AvatarGroup size="sm" max={4} tooltips>
        {team.map((p) => (
          <Avatar key={p.name} name={p.name} src={p.src} />
        ))}
      </AvatarGroup>
    </div>
  )
}
```

### Story ring

```tsx
<Avatar name="Glow Studio" src="/brand/glow.png" size="xl" ring="story" animation="spin" />
```

### Clickable +N chip

```tsx
<AvatarGroup max={3} onMoreClick={() => setShowAttendees(true)}>
  {attendees.map((a) => <Avatar key={a.id} name={a.name} src={a.avatarUrl} />)}
</AvatarGroup>
```

### Initials only

```tsx
<Avatar name="Ana Ruiz" shape="squircle" ring="solid" tone="success" />
```

## API

### Avatar

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| src | `string` | — | Image URL. While it loads, or if it fails, the initials or fallback show. |
| alt | `string` | — | Accessible name; defaults to name. |
| name | `string` | — | Used for the initials, the fallback gradient and the default alt text. |
| size | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| "2xl"` | — | 24, 32, 40, 48, 64 or 80px. Inherits from AvatarGroup, else md. |
| shape | `"circle" \| "rounded" \| "square" \| "squircle"` | — | Inherits from AvatarGroup, else circle. |
| status | `"none" \| "online" \| "away" \| "busy" \| "offline"` | `"none"` | Presence dot in the bottom corner, with screen-reader text. |
| statusPulse | `boolean` | — | Pings the status dot. |
| ring | `"none" \| "solid" \| "gradient" \| "story"` | `"none"` | Ring around the avatar with a gap: solid (tone color), gradient (tone based) or story (Instagram-style). |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"primary"` | Color of the solid ring and the status-free accents. |
| animation | `"none" \| "spin" \| "pulse" \| "pop-in"` | `"none"` | spin rotates a gradient or story ring; pulse breathes the ring; pop-in plays on mount. |
| shadow | `"none" \| "sm" \| "md" \| "lg"` | `"none"` | Drop shadow that follows the shape. |
| fallback | `React.ReactNode` | — | Content shown when there is no image and no name. |
| labels | `Partial<AvatarLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <span> attribute.

### AvatarGroup

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| size | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| "2xl"` | `"md"` | Size for every avatar in the group. |
| shape | `"circle" \| "rounded" \| "square" \| "squircle"` | `"circle"` | Shape for every avatar and the "+N" chip. |
| overlap | `"none" \| "sm" \| "md" \| "lg"` | `"md"` | How much neighbours overlap. |
| max | `number` | — | Show at most this many avatars, then a "+N" chip. |
| spread | `boolean` | `true` | Avatars fan out when the group is hovered. |
| tooltips | `boolean` | — | Shows each avatar's name above it on hover. |
| onMoreClick | `() => void` | — | Makes the "+N" chip a button. |
| labels | `Partial<AvatarGroupLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | Activates the "+N" chip when onMoreClick is set (native <button>). |

## Accessibility

- With an image, the <img> gets alt from alt or name. Without one, the avatar is role="img" with aria-label from alt or name, and the initials are aria-hidden.
- The status dot carries visually hidden text ("online", "away"…), translatable with labels.
- The "+N" chip has an aria-label ("5 more", or "Show 5 more" when it is a button); translate both with AvatarGroup labels.
- Group tooltips are CSS-only and appear on hover, not on focus. Do not put information there that is not also available elsewhere.

## Motion

- The image fades in over 350 ms once loaded; an image already in cache shows immediately.
- spin rotates a gradient or story ring every 3 s. pulse makes the ring breathe (scale 1.07, every 2 s), or sends a halo outward when there is no ring. pop-in scales from 0.4 with overshoot in 500 ms on mount.
- statusPulse pings the status dot to 2.4× every 1.6 s.
- AvatarGroup: hovering the group fans the avatars apart in 300 ms and the hovered one rises 3px; tooltips fade in over 150 ms.
- Reduced motion: every animation and transition is off, the halo and status ping are hidden and the group does not fan out.

## Notes for AI

- Always pass name, even with src: it drives the initials and gradient fallback when the image fails, and the alt text.
- Initials use the first letter of the first and last words ("Maya Chen" → MC); a single word gives one letter.
- Inside AvatarGroup, set size and shape on the group; children inherit them. Avatars need a key and a name for tooltips.
- spin only shows on ring="gradient" or "story"; a solid ring has nothing to rotate.
- The ring gap and status border use the page background. On a card, set the CSS variable on the avatar or group: className="[--pc-av-gap:var(--card)]".

## FAQ

**What happens if the image URL is broken?**

onError switches to the initials on the name-based gradient, or to fallback (a user icon by default) when there is no name. A new src resets it.

**Are the initials colors stable?**

Yes. The gradient hue comes from a deterministic hash of the name, so the same name gets the same colors on the server and the client.

## Related

- notification-badge: https://goodui.dev/components/feedback/notification-badge
- badge: https://goodui.dev/components/core/badge
- card: https://goodui.dev/components/core/card
- animated-list: https://goodui.dev/components/lists/animated-list

Last updated: 2026-11-02
