# Switch

> iOS, Material 3, square, neo-brutalist, icon thumb and ON/OFF label variants with none, smooth, spring and bounce motion, six tones, three sizes, track shadows, sun/moon or check/x glyphs, label and description on either side, and a loading state.

Toggle switch for React and shadcn: iOS, Material 3, neo and ON/OFF variants with spring motion

Page: https://goodui.dev/components/core/switch

## Install

```bash
npx shadcn@latest add @goodui/switch
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/switch.json`. The file lands in `components/goodui/switch.tsx`.

## When to use

- Settings that take effect immediately: SMS reminders on, online booking off, auto-renew.
- A settings list where each row has a title, a description and the toggle at the end: labelPosition="left".
- Toggles that save to a server: loading shows a spinner in the thumb and blocks extra clicks.

## When not to use

- Choices that only apply after the user presses Save, or agreeing to terms: use checkbox.
- Picking one of several options: use tabs, segmented-control or a RadioGroup from checkbox.
- A single light/dark button in a header: use theme-toggle.

## Pick by what matters

| Need | Use |
| --- | --- |
| Default app settings | variant="ios" (default) with animation="spring" |
| Android-like or Material apps | variant="material" (the thumb grows when on) |
| State that must be readable without color | variant="icon-thumb" (check / x) or "label-inside" (ON / OFF) |
| Theme switch in a settings page | icons="theme" (sun / moon in the thumb) |
| Retro or playful brands | variant="neo" or "square" |
| Calm, no-bounce motion | animation="smooth" or "none" |
| Settings row | label, description and labelPosition="left" |

## Usage

```tsx
import * as React from "react"
import { Switch } from "@/components/goodui/switch"

export function ReminderSettings() {
  const [sms, setSms] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const toggleSms = async (next: boolean) => {
    setSaving(true)
    await fetch("/api/settings", { method: "PATCH", body: JSON.stringify({ smsReminders: next }) })
    setSms(next)
    setSaving(false)
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      <Switch
        checked={sms}
        onCheckedChange={toggleSms}
        loading={saving}
        label="SMS reminders"
        description="Clients get a text 24 hours before their appointment."
        labelPosition="left"
      />
      <Switch defaultChecked label="Online booking" labelPosition="left" tone="success" name="onlineBooking" />
    </div>
  )
}
```

### ON / OFF in the track

```tsx
<Switch variant="label-inside" defaultChecked aria-label="Auto-renew" />
```

### Translated track text

```tsx
<Switch variant="label-inside" onText="AN" offText="AUS" label="Erinnerungen" />
```

### Theme switch

```tsx
<Switch icons="theme" variant="material" size="lg" checked={dark} onCheckedChange={setDark} aria-label="Dark mode" />
```

## API

### Switch

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| defaultChecked | `boolean` | `false` | Initial state when uncontrolled. |
| name | `string` | — | Submits "on" (or `value`) under this name in a form when checked. |
| checked | `boolean` | — | On state (controlled). |
| onCheckedChange | `(checked: boolean) => void` | — | Called with the new state on click, Space or Enter (not while loading). |
| variant | `"ios" \| "material" \| "square" \| "neo" \| "icon-thumb" \| "label-inside"` | `"ios"` | Track and thumb style: ios (default), material, square, neo, icon-thumb (check/x) or label-inside (ON/OFF). |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"primary"` | Track color when on. |
| animation | `"none" \| "smooth" \| "spring" \| "bounce"` | `"spring"` | How the thumb travels: spring (default), smooth ease, bounce with squash, or none. |
| shadow | `"none" \| "sm" \| "inner" \| "glow"` | `"none"` | Track shadow; glow only shows when on. |
| size | `"sm" \| "md" \| "lg"` | `"md"` |  |
| icons | `"auto" \| "none" \| "check" \| "theme"` | `"auto"` | Glyphs inside the thumb. "auto" shows check/x on icon-thumb and nothing elsewhere. |
| checkedIcon | `React.ReactNode` | — | Custom thumb glyphs, override `icons`. |
| uncheckedIcon | `React.ReactNode` | — | Custom thumb glyph for the off state. |
| onText | `string` | `"ON"` | Text inside the track for the label-inside variant. |
| offText | `string` | `"OFF"` | Off text for the label-inside variant. |
| label | `React.ReactNode` | — | Visible label; the row becomes a <label> linked with aria-labelledby. |
| description | `React.ReactNode` | — | Muted helper text under the label, linked with aria-describedby. |
| labelPosition | `"left" \| "right"` | `"right"` | Where the text sits. "left" makes a full-width settings row with the switch at the end. |
| loading | `boolean` | — | Shows a spinner in the thumb and blocks toggling, e.g. while saving. |
| value | `string` | — | Value submitted with name when checked; defaults to "on". |
| sound | `boolean \| SoundName` | — | Plays "toggle-on" / "toggle-off" when the visitor has sounds on (lib/goodui-sounds); pass a sound name to use one sound for both. Off by default. |

Also accepts every <button> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Space / Enter | Toggles the switch (native <button>); does nothing while loading or disabled. |
| Tab | Moves focus to the switch; a focus ring shows on keyboard focus only. |

## Accessibility

- A native <button role="switch"> with aria-checked, so screen readers announce on and off.
- label and description are linked with aria-labelledby and aria-describedby, and the whole row is a <label>, so clicking the text toggles it.
- Without label, pass aria-label. The thumb, its glyphs and the ON / OFF text are aria-hidden.
- loading sets aria-busy and ignores clicks; disabled disables the button and dims the row.
- icon-thumb and label-inside show the state with a glyph or text, not only with color.

## Motion

- spring (default): the thumb slides on the kit's snap spring. Held down, it stretches 18% toward its travel. smooth: a 200 ms ease. bounce: the play spring with a squash and stretch over 340 ms. none: it jumps.
- Press: the thumb stretches toward the travel direction (material grows to 1.12; neo pushes the whole track into its shadow).
- material shrinks the thumb when off unless it shows a glyph. Glyphs swap with a rotate and scale (300 ms, slight overshoot) and a 200 ms fade. Track color changes in 220 ms.
- Reduced motion: the thumb jumps with no press stretch and no transitions; the loading spinner slows to 1.6 s per turn instead of stopping.

## Notes for AI

- The callback is onCheckedChange(checked: boolean), not onChange. Use checked for controlled, defaultChecked otherwise.
- Pass label (and description) as props instead of wrapping the switch in your own <label>; without label, set aria-label.
- For native forms pass name (and optionally value): a hidden checkbox submits "on" (or value) when checked.
- onText and offText (default "ON" / "OFF") are only used by variant="label-inside"; translate them there. There is no labels prop.
- className goes on the track when there is no label or description, and on the row otherwise. tone only colors the on state.

## FAQ

**How do I show a save in progress?**

Set loading while your request runs. The thumb shows a spinner, aria-busy is set and clicks are ignored; set checked when the request succeeds.

**Switch or checkbox?**

A switch applies immediately, like a light switch. A checkbox is a choice that is submitted later with a form.

## Related

- checkbox: https://goodui.dev/components/core/checkbox
- switch-spring: https://goodui.dev/components/inputs/switch-spring
- theme-toggle: https://goodui.dev/components/buttons/theme-toggle
- segmented-control: https://goodui.dev/components/navigation/segmented-control

Last updated: 2026-11-02
