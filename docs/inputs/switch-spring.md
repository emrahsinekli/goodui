# Spring switch

> Switch with a springy thumb that squashes while pressed, icons that spin inside the thumb, three sizes, label and description.

Animated toggle switch for React and shadcn with a springy thumb and icons

Page: https://goodui.dev/components/inputs/switch-spring

## Install

```bash
npx shadcn@latest add @goodui/switch-spring
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/switch-spring.json`. The file lands in `components/goodui/switch-spring.tsx`.

## When to use

- Settings that take effect immediately: SMS reminders, auto-confirm bookings, email digests.
- Settings rows that need a label and a helper line that can change with the state.
- Mode toggles where an icon inside the thumb explains the state (sun/moon, check/x).

## When not to use

- A choice that is only applied when a form is submitted, or a list of items to tick: use checkbox-draw.
- Switching the whole site theme with a single icon button: use theme-toggle.
- Choosing between more than two options: use segmented-control.

## Pick by what matters

| Need | Use |
| --- | --- |
| Dense settings lists and tables | size="sm" |
| Standard settings rows | size="md" (default) with label and description |
| A prominent mode toggle | size="lg" with icons={{ on: <Moon />, off: <Sun /> }} |
| Label on the left, switch on the right (settings pages) | labelPosition="start" |

## Usage

```tsx
import * as React from "react"
import { SwitchSpring } from "@/components/goodui/switch-spring"

export function ReminderSettings() {
  const [sms, setSms] = React.useState(true)

  return (
    <div className="rounded-xl border bg-card p-4">
      <SwitchSpring
        checked={sms}
        onCheckedChange={setSms}
        label="SMS reminders"
        description={sms ? "Clients get a text 24 hours before each visit." : "Clients won't be reminded."}
        labelPosition="start"
      />
    </div>
  )
}
```

### Icons inside the thumb

```tsx
import { Moon, Sun } from "lucide-react"

<SwitchSpring
  size="lg"
  defaultChecked={false}
  icons={{ on: <Moon />, off: <Sun /> }}
  label="Quiet hours"
  description="Pause notifications from 9 pm to 7 am."
/>
```

### In a form, without a visible label

```tsx
<form action={saveBillingSettings}>
  <SwitchSpring name="autoRenew" defaultChecked aria-label="Auto-renew subscription" />
  <button type="submit">Save</button>
</form>
// Submits autoRenew=on or autoRenew=off
```

## API

### SwitchSpring

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| name | `string` | — | Form field name; a hidden input submits "on" when checked and "off" when not. |
| checked | `boolean` | — | Controlled on/off state; pair with onCheckedChange. |
| defaultChecked | `boolean` | `false` | Initial state when uncontrolled. |
| onCheckedChange | `(checked: boolean) => void` | — | Called with the new state on every toggle (click, Space or Enter). |
| size | `"sm" \| "md" \| "lg"` | `"md"` | "sm" 20×36px, "md" 24×44px, "lg" 32×56px track. |
| icons | `{ on: React.ReactNode; off: React.ReactNode }` | — | Icons drawn inside the thumb, e.g. { on: <Moon />, off: <Sun /> }. |
| label | `React.ReactNode` | — | Clickable label next to the switch; also its accessible name. |
| description | `React.ReactNode` | — | Muted helper text under the label, linked with aria-describedby. |
| labelPosition | `"start" \| "end"` | `"end"` | Put the label before the switch instead of after it. |

Also accepts every <button> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Space / Enter | Toggles the switch (native <button>); the thumb squashes while the key is held. |
| Tab | Moves focus to the switch; a focus ring shows on keyboard focus only. |

## Accessibility

- Renders a native <button role="switch"> with aria-checked, so screen readers announce it as on or off.
- label renders a <label htmlFor> tied to the button, so clicking the text toggles it and it names the switch; description is linked with aria-describedby.
- Without label, pass aria-label so the switch has a name.
- The thumb and its icons are aria-hidden; the state comes from aria-checked only.

## Motion

- The thumb slides on the kit's snap spring and stretches 18% while held.
- Pressing with the pointer or holding Space/Enter stretches the thumb to scaleX 1.22 and scaleY 0.9 on a stiffer spring, anchored to the side it rests on.
- Icons swap with a spin and scale: the old one turns away while the new one rotates in from ±120 degrees.
- The track color fades over 200 ms (CSS).
- Reduced motion: the thumb jumps without a spring, the squash is off, and icons cross-fade in 100 ms.

## Notes for AI

- Use checked + onCheckedChange (not value/onChange); onCheckedChange receives a boolean.
- className goes on the <button> track, not the wrapper; recolor the on state with a class like data-[state=checked]:bg-emerald-500.
- icons needs both on and off; pass lucide icons without size classes, the thumb sizes them.
- With name, the hidden input submits "on" or "off" (unlike a native checkbox, which omits unchecked values). Parse both on the server.
- Only sm, md and lg sizes exist; do not invent xs or xl.

## FAQ

**How do I change the on color?**

Pass a class for the checked state on className, e.g. data-[state=checked]:bg-emerald-500. By default it uses your theme's --primary.

**Does it submit with a form?**

Yes, when you pass name. A hidden input sends "on" when checked and "off" when not.

## Related

- switch: https://goodui.dev/components/core/switch
- checkbox-draw: https://goodui.dev/components/inputs/checkbox-draw
- theme-toggle: https://goodui.dev/components/buttons/theme-toggle
- segmented-control: https://goodui.dev/components/navigation/segmented-control

Last updated: 2026-11-02
