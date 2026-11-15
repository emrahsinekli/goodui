# Popover

> Anchored popover with an arrow in default, soft, glass, neo and inverted surfaces, tones, sizes, radii and shadows; side and align that flip and shift to stay on screen, match-trigger-width, scale, fade, slide or spring entrances, header, close button and footer slots, and modal (focus trapped) or non-modal (Tab flows back to the page) behavior, shown as a date filter, share menu, switcher and inline note form.

React popover with arrow, collision flipping and modal or non-modal focus: date filters, share menus, mini forms

Page: https://goodui.dev/components/core/popover

## Install

```bash
npx shadcn@latest add @goodui/popover
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/popover.json`. The file lands in `components/goodui/popover.tsx`.

## When to use

- Filters next to the control that opens them: a date range, a status filter, a location switcher.
- Small actions on one item: share a link, add a note to a booking, set a reminder.
- Extra information or settings that need buttons or fields, which a tooltip can't hold.
- Account or workspace switchers that should be exactly as wide as their trigger (matchTriggerWidth).

## When not to use

- Picking one value from a list: use select; it has listbox keyboard behavior and form support.
- A task that must be finished or cancelled before anything else: use dialog.
- A hint on hover: use tooltip.
- A menu of commands: use dropdown-stagger; menus use arrow keys, popovers use Tab.

## Pick by what matters

| Need | Use |
| --- | --- |
| Filters and switchers | variant="default", align="start" |
| Inline forms that shouldn't lose input to a stray click | modal (focus trapped, page blocked until saved or dismissed) |
| Switchers and comboboxes | matchTriggerWidth with arrow={false} |
| Highlighted tips | variant="soft" with a tone |
| Dark callouts | variant="inverted" |
| Over photos or gradients | variant="glass" |
| Playful brands | variant="neo" |

## Usage

```tsx
import * as React from "react"
import { Calendar, ChevronDown } from "lucide-react"
import { Button } from "@/components/goodui/button"
import { Popover } from "@/components/goodui/popover"

export function DateFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = React.useState(value)
  return (
    <Popover
      align="start"
      title="Date range"
      onOpenChange={(open) => open && setDraft(value)}
      trigger={
        <Button variant="outline" iconLeft={<Calendar />} iconRight={<ChevronDown />}>
          {value}
        </Button>
      }
      footer={({ close }) => (
        <Button size="sm" onClick={() => { onChange(draft); close() }}>
          Apply
        </Button>
      )}
    >
      <Presets value={draft} onChange={setDraft} />
    </Popover>
  )
}
```

### Share menu that closes after an action

```tsx
<Popover title="Share booking page" size="sm" align="end" trigger={<Button>Share</Button>}>
  {({ close }) => <ShareTargets onShared={close} />}
</Popover>
```

### Modal mini form

```tsx
<Popover
  modal
  side="start"
  variant="soft"
  tone="warning"
  title="Note for Maya"
  trigger={<Button size="sm" variant="ghost">Note</Button>}
  footer={({ close }) => <Button size="sm" onClick={() => { save(); close() }}>Save note</Button>}
>
  <textarea aria-label="Note" />
</Popover>
```

### Location switcher as wide as its trigger

```tsx
<Popover matchTriggerWidth arrow={false} align="start" aria-label="Switch location" trigger={<Button className="w-56">Downtown</Button>}>
  {({ close }) => <LocationList onPick={close} />}
</Popover>
```

## API

### Popover

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| trigger (required) | `React.ReactElement<TriggerProps>` | — | The element that toggles the popover (a button). It gets aria-expanded, aria-controls and aria-haspopup. |
| children | `React.ReactNode \| ((api: PopoverApi) => React.ReactNode)` | — | Body. A function receives { close } for buttons that should close the popover. |
| title | `React.ReactNode` | — | Header title; also names the popover for screen readers. Without it, pass aria-label. |
| description | `React.ReactNode` | — | Muted line under the title. |
| footer | `React.ReactNode \| ((api: PopoverApi) => React.ReactNode)` | — | Footer row (actions). A function receives { close }. |
| showClose | `boolean` | — | × button in the header. Defaults to true when there is a title. |
| variant | `"default" \| "soft" \| "glass" \| "neo" \| "inverted"` | `"default"` | Surface: default (your popover color), soft (tone tint), glass, neo or inverted (dark on light). |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"primary"` |  |
| size | `"sm" \| "md" \| "lg" \| "auto"` | `"md"` | Width and padding: sm 16rem, md 20rem, lg 26rem, auto fits the content. |
| radius | `"none" \| "sm" \| "md" \| "lg" \| "xl"` | `"lg"` |  |
| shadow | `"none" \| "sm" \| "md" \| "lg" \| "xl"` | `"lg"` | Drop shadow. Ignored by neo, which has its own offset shadow. |
| animation | `"none" \| "fade" \| "scale" \| "slide" \| "spring"` | `"scale"` | How it opens: scale (default), fade, slide, spring or none. Reduced motion uses a short fade. |
| side | `"top" \| "bottom" \| "left" \| "right" \| "start" \| "end"` | `"bottom"` | Preferred side; flips to the opposite side when there is no room. |
| align | `"start" \| "center" \| "end"` | `"center"` | Alignment along the side. start/end follow the reading direction. |
| offset | `number` | `8` | Gap between trigger and popover, in px. |
| arrow | `boolean` | `true` |  |
| avoidCollisions | `boolean` | `true` | false keeps the requested side and alignment even when the popover leaves the screen. |
| matchTriggerWidth | `boolean` | `false` | Same width as the trigger (account switchers, comboboxes). Overrides size width. |
| modal | `boolean` | `false` | true traps focus inside and blocks the page behind with a transparent layer. |
| closeOnOutsideClick | `boolean` | `true` |  |
| closeOnEsc | `boolean` | `true` |  |
| open | `boolean` | — | Open state (controlled). |
| defaultOpen | `boolean` | `false` | Initial open state when uncontrolled. |
| onOpenChange | `(open: boolean) => void` | — |  |
| initialFocus | `React.RefObject<HTMLElement \| null>` | — | Element to focus on open. Default: the first focusable element in the body, else the panel. |
| returnFocus | `boolean` | `true` | Return focus to the trigger after closing with Esc, the close button or close(). |
| portal | `boolean` | `true` | Render into document.body so overflow and z-index of parents can't clip it. |
| labels | `Partial<PopoverLabels>` | — | Text for built-in controls; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | On the trigger: opens or closes the popover (native button). Focus moves to the first control in the body. |
| Tab / Shift+Tab | Non-modal: moves through the popover as if it sat right after the trigger; Tab past the last control closes it and focuses the next control on the page, Shift+Tab before the first closes it and returns to the trigger. Modal: wraps around inside. |
| Esc | Closes the popover (not a dialog behind it) and returns focus to the trigger. |

## Accessibility

- The panel has role="dialog", is named by the title (aria-labelledby) and described by the description; without a title, pass aria-label. modal adds aria-modal="true".
- The trigger gets aria-haspopup="dialog", aria-expanded and aria-controls.
- Focus moves in on open (initialFocus, else the first control in the body, else the panel) and returns to the trigger after Esc, the close button or close(). An outside click doesn't pull focus back, so the clicked control keeps it.
- Outside-click detection follows the React tree, so popovers, selects and menus rendered in portals inside the popover don't close it.
- The × button is named by labels.close for translation. The arrow is decorative.

## Motion

- scale: from 0.94 in 180 ms. slide: 6px from the trigger in 220 ms. spring: from 0.8 on a spring (stiffness 520, damping 26). fade: opacity only, 150 ms. Every variant leaves in 120 ms.
- Scale and spring grow from the arrow tip.
- Reduced motion: a 100 ms fade, no movement. animation="none" opens and closes instantly.

## Performance

- Nothing renders until it opens. Position is recomputed on open, scroll, resize and when the panel or trigger changes size, not on every frame.
- The body scrolls when the space on the chosen side is smaller than the content, instead of the panel leaving the screen.

## Notes for AI

- Pass the opener as trigger={<Button>…</Button>} and the body as children. Use footer for actions.
- children and footer can be functions receiving { close }; call close() after applying or saving.
- Prefer side="start" / "end" over left/right so RTL works. The popover flips and shifts by itself; pass avoidCollisions={false} only when you really need a fixed side.
- Don't put a Popover trigger inside another button. Don't use it for menus or selects.
- Give it a title or an aria-label.

## FAQ

**Can it be controlled?**

Yes: open, defaultOpen and onOpenChange. onOpenChange(true) is a good place to reset a draft to the saved value.

**Does it work inside a dialog?**

Yes. It renders into document.body above the dialog, Esc closes only the popover, and clicks inside it don't count as clicks outside the dialog.

**Why does the body scroll?**

When the space on the chosen side is smaller than the popover, it gets a max height and the body scrolls.

## Related

- dialog: https://goodui.dev/components/core/dialog
- tooltip: https://goodui.dev/components/core/tooltip
- select: https://goodui.dev/components/core/select
- button: https://goodui.dev/components/core/button
- popover-morph: https://goodui.dev/components/overlays/popover-morph
- dropdown-stagger: https://goodui.dev/components/overlays/dropdown-stagger

Last updated: 2026-11-03
