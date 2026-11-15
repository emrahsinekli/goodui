# Animated tooltip

> A tooltip springs out of the trigger's side and can lean toward the pointer over avatars; tooltips in a delay group open instantly once one is already showing.

Animated tooltip for React and shadcn with spring entry, pointer follow and delay groups

Page: https://goodui.dev/components/overlays/tooltip-animated

## Install

```bash
npx shadcn@latest add @goodui/tooltip-animated
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/tooltip-animated.json`. The file lands in `components/goodui/tooltip-animated.tsx`.

## When to use

- Icon-only toolbar buttons that need their name and shortcut on hover or keyboard focus.
- Avatar stacks where hovering a face shows the person's name and role (followPointer adds the lean).
- Rows of controls where moving from one to the next should show the next tooltip at once (wrap them in TooltipGroup).

## When not to use

- Content people need to click or select: tooltips ignore the pointer. Use popover-morph.
- Essential information on touch-first screens: it only shows after a long press there. Put the text on the page or in a badge.
- Long help text: the bubble does not wrap by default. Use a popover or inline helper text.

## Pick by what matters

| Need | Use |
| --- | --- |
| Toolbar of icon buttons | Wrap them in <TooltipGroup> (default delay 500 ms) so neighbours open instantly |
| Avatar stack or people list | followPointer with delay={0} |
| Trigger near the top edge | side="bottom" (there is no automatic flip) |
| Button inside a vertical sidebar | side="right" |

## Usage

```tsx
import { Download, Filter, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TooltipAnimated, TooltipGroup } from "@/components/goodui/tooltip-animated"

export function BookingsToolbar() {
  return (
    <TooltipGroup delay={450}>
      <div className="flex gap-1 rounded-xl border bg-card p-1">
        <TooltipAnimated content="Show confirmed only">
          <Button variant="ghost" size="icon" aria-label="Filter">
            <Filter />
          </Button>
        </TooltipAnimated>
        <TooltipAnimated content="Print day sheet">
          <Button variant="ghost" size="icon" aria-label="Print">
            <Printer />
          </Button>
        </TooltipAnimated>
        <TooltipAnimated content="Export CSV">
          <Button variant="ghost" size="icon" aria-label="Export CSV">
            <Download />
          </Button>
        </TooltipAnimated>
      </div>
    </TooltipGroup>
  )
}
```

### Avatar stack that leans toward the pointer

```tsx
<div className="flex">
  {team.map((m) => (
    <TooltipAnimated
      key={m.name}
      followPointer
      delay={0}
      className="-ms-3 first:ms-0 hover:z-10 focus-within:z-10"
      content={<span className="flex flex-col items-center"><b>{m.name}</b><span className="opacity-70">{m.role}</span></span>}
    >
      <button type="button" className="size-10 rounded-full border-2 border-background bg-muted text-sm font-medium">
        {m.initials}
      </button>
    </TooltipAnimated>
  ))}
</div>
```

### Shortcut hint in the bubble

```tsx
<TooltipAnimated side="bottom" content={<>Next week <kbd className="ms-1 text-[10px]">→</kbd></>}>
  <Button variant="ghost" size="icon" aria-label="Next week"><ChevronRight /></Button>
</TooltipAnimated>
```

## API

### TooltipAnimated

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| children (required) | `React.ReactNode` | — | The trigger: one focusable element such as a button, so it gets aria-describedby and keyboard focus. Plain text (a string or number) is wrapped in a focusable span that carries aria-describedby. |
| content (required) | `React.ReactNode` | — | Tooltip text or node. It is also copied into a visually hidden element linked to the trigger with aria-describedby. |
| side | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | Side of the trigger the tooltip appears on. There is no automatic flip. |
| delay | `number` | `400` | Open delay in ms. Inside a TooltipGroup the group's delay wins. |
| followPointer | `boolean` | `false` | The tooltip leans and slides toward the pointer (top and bottom sides). Turned off on touch screens. |
| disabled | `boolean` | `false` | Never open the tooltip. |
| contentClassName | `string` | — | Classes for the tooltip bubble. |

Also accepts every <span> attribute.

### TooltipGroup

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| children (required) | `React.ReactNode` | — | Content. |
| delay | `number` | `500` | Delay before the first tooltip in the group opens, in ms. |
| skipDelay | `number` | `300` | How long the group stays "warm" after a tooltip closes, in ms. |

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Focusing the trigger with the keyboard (:focus-visible) opens the tooltip at once; moving focus away hides it. |
| Esc | Hides the open tooltip. |

## Accessibility

- The content is copied into a visually hidden element and linked to the child with aria-describedby (merged with any aria-describedby it already has), so screen readers read it as the trigger's description. That hidden element has role="tooltip".
- The visible bubble is aria-hidden and pointer-events: none, so it never blocks the pointer or gets read twice.
- Opens on hover after the delay, at once on keyboard focus, and after a 450 ms long press on touch (then hides after 1.8 s). A mouse press on the trigger hides it.
- Icon-only triggers still need their own aria-label; the tooltip is a description, not a name.

## Motion

- Enter: the bubble springs out of the trigger's side (stiffness 520, damping 28, mass 0.7) from scale 0.6 and a 6px offset, with its transform origin on that side. Exit: fades and shrinks to 0.9 in 100 ms.
- Inside a warm TooltipGroup the next tooltip opens without the delay and with a quick 120 ms fade from scale 0.96 instead of the full spring.
- followPointer (top and bottom sides only) slides the bubble up to 40px toward the pointer and tilts it up to 10° on a spring (stiffness 260, damping 18). It is off on devices without a fine hover pointer.
- Reduced motion: opacity only, shown and hidden instantly; followPointer is off.

## Notes for AI

- Pass exactly one focusable element (a button or link) as the child; it receives aria-describedby. A plain string child is wrapped in a focusable span (tabIndex 0) that carries aria-describedby.
- Inside TooltipGroup the group's delay replaces each tooltip's delay prop.
- There is no collision detection or portal: pick side yourself and avoid ancestors with overflow: hidden that would clip the bubble.
- The bubble uses whitespace-nowrap; for a multi-line tooltip pass contentClassName="whitespace-normal w-56".
- className goes on the wrapping <span> (use it for stacking like -ms-3 hover:z-10); style the bubble with contentClassName.

## FAQ

**Why doesn't it open when I click the trigger?**

A mouse press hides the tooltip on purpose, and a mouse click does not count as keyboard focus. It opens on hover or on keyboard focus.

**How does the delay group work?**

After one tooltip in a TooltipGroup opens, the others open instantly while it is open and for skipDelay ms (default 300) after it closes.

## Related

- popover-morph: https://goodui.dev/components/overlays/popover-morph
- avatar: https://goodui.dev/components/core/avatar
- kbd: https://goodui.dev/components/core/kbd
- dock: https://goodui.dev/components/navigation/dock

Last updated: 2026-11-02
