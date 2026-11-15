# Ripple button

> Material-style ink ripple that grows from the exact press point and fades on release, pure CSS, across five variants and icon buttons.

Material ripple button for React and shadcn: ink ripple from the press point

Page: https://goodui.dev/components/buttons/ripple-button

## Install

```bash
npx shadcn@latest add @goodui/ripple-button
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/ripple-button.json`. The file lands in `components/goodui/ripple-button.tsx`.

## When to use

- Apps with a Material or Android-like feel, where every press should leave a visible ink mark.
- Touch-heavy UIs (booking flows, POS screens) where the ripple confirms the tap landed while the finger is still down.
- Icon buttons in toolbars and FABs, with centerRipple so the ink always starts from the middle.

## When not to use

- You already use the Core button and only want a quick ripple on click: button with animation="ripple" is simpler and also gives tones, loading and icon props.
- Async actions that need loading and success feedback: use stateful-button.
- Destructive actions that need a deliberate gesture: use hold-to-confirm.

## Pick by what matters

| Need | Use |
| --- | --- |
| Primary action | variant="default" |
| Secondary or toolbar actions | variant="outline", "secondary" or "ghost" |
| Delete or cancel | variant="destructive" |
| Round icon button | size="icon" centerRipple aria-label="…" |
| Branded ink | rippleColor="var(--chart-1)" rippleOpacity={0.3} |
| Ripple on click only, with tones and loading | button with animation="ripple" |

## Usage

```tsx
import { CalendarPlus } from "lucide-react"
import { RippleButton } from "@/components/goodui/ripple-button"

export function BookingActions({ onBook, onReschedule }: { onBook: () => void; onReschedule: () => void }) {
  return (
    <div className="flex gap-2">
      <RippleButton onClick={onBook}>
        <CalendarPlus />
        Book appointment
      </RippleButton>
      <RippleButton variant="outline" onClick={onReschedule}>
        Reschedule
      </RippleButton>
    </div>
  )
}
```

### Round icon button with a centered ripple

```tsx
<RippleButton size="icon" variant="ghost" centerRipple aria-label="Add client">
  <Plus />
</RippleButton>
```

### Slower, branded ink

```tsx
<RippleButton variant="secondary" rippleColor="var(--chart-1)" rippleOpacity={0.3} rippleDuration={800}>
  Send invoice
</RippleButton>
```

## API

### RippleButton

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| variant | `"outline" \| "default" \| "destructive" \| "ghost" \| "secondary"` | `"default"` | "default" \| "secondary" \| "outline" \| "ghost" \| "destructive", matching shadcn's button variants. |
| size | `"sm" \| "md" \| "lg" \| "icon"` | `"md"` | "sm" \| "md" \| "lg" \| "icon"; "icon" is a round 40px button. |
| rippleColor | `string` | — | Ripple color; defaults to the text color. |
| rippleOpacity | `number` | — | Ripple opacity at its peak (0–1). |
| rippleDuration | `number` | `550` | Milliseconds for the ripple to cover the button. |
| centerRipple | `boolean` | — | Always start the ripple from the center (good for icon buttons). |

Also accepts every <button> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | Starts a ripple from the center on key down (not on auto-repeat) and fades it on key up; the native button activates as usual. |
| Tab | Moves focus; blurring the button fades any ripple. |

## Accessibility

- Renders a native <button>; every button attribute (type, disabled, aria-*) passes through.
- Ripples live in an aria-hidden layer with pointer-events: none, so they are never announced and never block clicks.
- size="icon" has no visible text: give it an aria-label.

## Motion

- Press: a circle big enough to cover the button grows from the press point in `rippleDuration` ms (550 by default) on cubic-bezier(.2,.6,.35,1).
- Release (pointer up, leave, cancel, key up or blur): the ink fades out over 420 ms and is removed after 520 ms. At most five ripples exist at once.
- Only the primary mouse button starts a ripple.
- Reduced motion: no ripple is created at all; the button keeps its normal hover colors.

## Performance

- The grow is a CSS transform keyframe and the fade an opacity transition; React only adds and removes a span per press.

## Notes for AI

- variant values are default, secondary, outline, ghost, destructive (shadcn names), not solid or primary.
- Sizes are sm, md, lg and icon; there is no xs or xl.
- rippleDuration is in milliseconds; rippleOpacity is 0 to 1.
- Pass icons as children; there are no iconLeft or iconRight props here.
- If you add your own onPointerDown or onKeyDown, it still runs; the ripple handlers call it after spawning.

## FAQ

**How is this different from the Core button's ripple?**

The Core button plays a fixed 0.6 s ripple on pointer down that fades by itself. RippleButton keeps the ink while you hold, fades it on release, ripples on Enter and Space too, and lets you set color, opacity, duration and centering.

**Can the ripple start from the center?**

Yes, pass centerRipple. Keyboard presses always start from the center.

## Related

- button: https://goodui.dev/components/core/button
- stateful-button: https://goodui.dev/components/buttons/stateful-button
- hold-to-confirm: https://goodui.dev/components/buttons/hold-to-confirm
- magnetic-button: https://goodui.dev/components/buttons/magnetic-button

Last updated: 2026-11-02
