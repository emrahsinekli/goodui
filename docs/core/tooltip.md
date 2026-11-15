# Tooltip

> Dark, light, tone, glass and neo tooltips with sizes, shapes, shadows and an optional arrow; twelve placements that flip and shift at the screen edge, scale, fade, slide or spring entrances, rich title + keyboard-shortcut content, delay groups that open instantly after the first, follow-cursor for charts and touch long-press.

React tooltip with keyboard shortcuts, delay groups, follow-cursor and touch long-press

Page: https://goodui.dev/components/core/tooltip

## Install

```bash
npx shadcn@latest add @goodui/tooltip
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/tooltip.json`. The file lands in `components/goodui/tooltip.tsx`.

## When to use

- Naming icon-only buttons in toolbars and tables, with the keyboard shortcut (shortcut="Mod+N").
- A one-line explanation of a status, a badge or a truncated value.
- Charts and heatmaps where the hint should follow the pointer (followCursor).
- Explaining why a control is disabled (wrap the disabled button in a focusable span).

## When not to use

- Anything the user must read or click (links, buttons, forms): use popover; tooltips vanish on blur and can't hold focus.
- Information needed on touch devices to finish a task: show it inline; long-press is a fallback, not a primary path.
- The only name of an icon button: the button still needs aria-label; the tooltip is a description.

## Pick by what matters

| Need | Use |
| --- | --- |
| App chrome, toolbars | variant="dark" (default), wrapped in TooltipGroup |
| Dark UIs or busy screens | variant="light" |
| Status meaning (paid, overdue) | variant="tone" with tone |
| Over photos or gradients | variant="glass" |
| Playful brands | variant="neo" |
| Shortcut hints | title + shortcut (Mod is ⌘ on Mac, Ctrl elsewhere) |
| Charts | followCursor with content that changes as the pointer moves |

## Usage

```tsx
import { Bell, CalendarPlus } from "lucide-react"
import { Button } from "@/components/goodui/button"
import { Tooltip, TooltipGroup } from "@/components/goodui/tooltip"

export function Toolbar() {
  return (
    <TooltipGroup>
      <Tooltip title="New booking" content="For the selected slot" shortcut="Mod+N">
        <Button size="sm" iconLeft={<CalendarPlus />}>New</Button>
      </Tooltip>
      <Tooltip content="3 unread notifications" variant="tone" tone="danger" side="bottom">
        <Button size="sm" variant="ghost" iconOnly aria-label="Notifications">
          <Bell />
        </Button>
      </Tooltip>
    </TooltipGroup>
  )
}
```

### Disabled button

```tsx
// Disabled buttons get no pointer or focus events, so wrap them.
<Tooltip content="Refunds open after the payout clears">
  <span tabIndex={0}>
    <Button disabled>Refund</Button>
  </span>
</Tooltip>
```

### Follow the cursor over a chart

```tsx
const [i, setI] = React.useState(0)

<Tooltip followCursor delay={0} animation="fade" title={hours[i]} content={`${load[i]} of 8 chairs booked`}>
  <div tabIndex={0} onPointerMove={(e) => setI(indexFromX(e))}>{bars}</div>
</Tooltip>
```

### Keep it open to show feedback

```tsx
<Tooltip content={copied ? "Copied!" : "Copy link"} open={copied ? true : undefined}>
  <Button onClick={copy}>Copy link</Button>
</Tooltip>
```

## API

### Tooltip

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| children (required) | `React.ReactNode` | — | The trigger: one element (a button, an icon, a link). Text is wrapped in a focusable span. |
| content | `React.ReactNode` | — | Tooltip body (with a title, the muted second line). |
| title | `React.ReactNode` | — | Bold first line for rich tooltips; content becomes the muted second line. |
| shortcut | `string \| string[]` | — | Keyboard shortcut shown as keycaps: "Mod+K" or ["Shift", "D"]. Mod is ⌘ on Mac and Ctrl elsewhere. |
| variant | `"dark" \| "light" \| "tone" \| "glass" \| "neo"` | `"dark"` | Paint: dark (default, dark in both themes), light (light in both themes), tone (filled with the tone), glass, neo. |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"primary"` | Color for the tone and neo variants. |
| size | `"sm" \| "md" \| "lg"` | `"md"` |  |
| shape | `"square" \| "rounded" \| "pill"` | `"rounded"` |  |
| shadow | `"none" \| "sm" \| "md" \| "lg"` | `"md"` | Drop shadow. Ignored by neo, which has its own offset shadow. |
| animation | `"none" \| "fade" \| "scale" \| "slide" \| "spring"` | `"scale"` | How it appears: scale (default), fade, slide, spring or none. Reduced motion uses a short fade. |
| side | `"top" \| "bottom" \| "left" \| "right" \| "start" \| "end"` | `"top"` | Preferred side; flips to the opposite side when there is no room. |
| align | `"start" \| "center" \| "end"` | `"center"` | Alignment along the side. start/end follow the reading direction. |
| offset | `number` | `8` | Gap between trigger and tooltip, in px. |
| arrow | `boolean` | `true` |  |
| delay | `number` | `500` | Hover delay before opening, in ms. Inside a TooltipGroup the group's delay is used. Focus opens at once. |
| closeDelay | `number` | `100` | Grace period before closing after the pointer leaves, so the pointer can move onto the tooltip, in ms. |
| longPressDelay | `number` | `500` | Touch: how long to press before the tooltip shows, in ms. It hides 1.5 s after release or on the next tap. |
| followCursor | `boolean` | `false` | Position at the pointer and follow it while it moves over the trigger (charts, heatmaps). |
| open | `boolean` | — | Open state (controlled). |
| defaultOpen | `boolean` | `false` | Initial open state when uncontrolled. |
| onOpenChange | `(open: boolean) => void` | — |  |
| disabled | `boolean` | `false` | Never open. |
| portal | `boolean` | `true` | Render into document.body so overflow and z-index of parents can't clip it. |
| labels | `Partial<TooltipLabels>` | — | Text for screen readers; pass translations here. |

Also accepts every <div> attribute.

### TooltipGroup

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| children (required) | `React.ReactNode` | — | Content. |
| delay | `number` | `500` | Delay before the first tooltip in the group opens, in ms. |
| skipDelay | `number` | `400` | After a tooltip closes, how long the next one still opens instantly, in ms. |

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Focusing the trigger with the keyboard shows the tooltip at once; moving focus away hides it. |
| Esc | Hides the open tooltip. It is handled first, so a dialog behind the tooltip stays open. |

## Accessibility

- The bubble has role="tooltip". The trigger's aria-describedby points at it while it is open, and at a hidden copy of the same text while it is closed, so screen readers announce the description on focus either way. Existing aria-describedby values are kept.
- It opens on hover (after delay), on keyboard focus (focus-visible, at once) and on touch long-press; it never opens on mouse click.
- The pointer can move from the trigger onto the tooltip without it closing (closeDelay), and Esc dismisses it.
- The shortcut keycaps come from the kbd component, which gives each special key a spoken name; a translatable "Shortcut:" prefix (labels.shortcut) is read before them.
- The tooltip is a description, not a name: icon-only triggers still need aria-label.

## Motion

- scale: from 0.9 in 160 ms. slide: 5px toward its side in 200 ms. spring: from 0.55 on a spring (stiffness 620, damping 22). fade: opacity only, 140 ms. Every variant fades out in 100 ms.
- Scale and spring grow from the arrow tip, so the tooltip seems to come out of the trigger.
- Inside a TooltipGroup, tooltips that open instantly after the first skip the movement and fade in over 60 ms.
- Reduced motion: a 100 ms fade, no movement. animation="none" shows and hides instantly.

## Performance

- Nothing renders until the tooltip opens (apart from the hidden description). Positioning runs on open, scroll, resize and size changes, not every frame; followCursor repositions on pointer move.

## Notes for AI

- The trigger is the child: one element (Button, a, span with tabIndex=0). Text children are wrapped in a focusable span automatically.
- Use content for the body, title for a bold first line, shortcut for keys ("Mod+K", "Shift+F" or an array). Don't build keycaps by hand.
- Wrap toolbars in TooltipGroup so only the first tooltip waits.
- side accepts start and end for RTL-safe placement; the tooltip flips and shifts to stay on screen by itself.
- Don't put links or buttons inside a tooltip; use popover.

## FAQ

**Does it work on phones?**

Yes: press and hold the trigger (longPressDelay, 500 ms by default). The tooltip hides 1.5 s after release or on the next tap, and the release doesn't click the button.

**Can I control it?**

Yes: open, defaultOpen and onOpenChange. open={undefined} hands control back to hover and focus.

**Why doesn't it show on my disabled button?**

Browsers send no pointer or focus events to disabled buttons. Wrap the button in a <span tabIndex={0}>.

## Related

- popover: https://goodui.dev/components/core/popover
- kbd: https://goodui.dev/components/core/kbd
- button: https://goodui.dev/components/core/button
- dialog: https://goodui.dev/components/core/dialog
- tooltip-animated: https://goodui.dev/components/overlays/tooltip-animated

Last updated: 2026-11-03
