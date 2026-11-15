# Segmented control

> iOS-style segmented control whose thumb springs to the chosen segment and squeezes while pressed, with sizes, icons, full-width mode, dividers that hide next to the thumb, and radio-group arrow keys.

iOS-style segmented control for React and shadcn with a sliding spring thumb

Page: https://goodui.dev/components/navigation/segmented-control

## Install

```bash
npx shadcn@latest add @goodui/segmented-control
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/segmented-control.json`. The file lands in `components/goodui/segmented-control.tsx`.

## When to use

- Choosing one of 2–5 short options that apply right away: Monthly / Yearly pricing, In person / Video / Phone.
- View switchers in a toolbar: list, grid, map (icon-only with ariaLabel).
- Filters that change the content below without navigating, where every option should stay visible.

## When not to use

- Switching between panels of content: use tabs-indicator (role tablist with panels).
- An on/off setting: use switch.
- More than about five options or long labels: use select.

## Pick by what matters

| Need | Use |
| --- | --- |
| Pricing period toggle | size="lg" with two options |
| Form field that fills its row | fullWidth |
| Compact toolbar view switcher | size="sm" with icon-only options and ariaLabel |
| Options with icons and text | icon={MapPin} label="In person" |

## Usage

```tsx
import { MapPin, Phone, Video } from "lucide-react"
import { SegmentedControl } from "@/components/goodui/segmented-control"

type AppointmentType = "in-person" | "video" | "phone"

export function AppointmentTypePicker({ value, onChange }: { value: AppointmentType; onChange: (v: AppointmentType) => void }) {
  return (
    <SegmentedControl
      aria-label="Appointment type"
      fullWidth
      value={value}
      onValueChange={(v) => onChange(v as AppointmentType)}
      options={[
        { value: "in-person", label: "In person", icon: MapPin },
        { value: "video", label: "Video", icon: Video },
        { value: "phone", label: "Phone", icon: Phone },
      ]}
    />
  )
}
```

### Billing period with a rolling price

```tsx
const [period, setPeriod] = React.useState("monthly")

<SegmentedControl
  aria-label="Billing period"
  size="lg"
  value={period}
  onValueChange={setPeriod}
  options={[
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly (−20%)" },
  ]}
/>
<NumberFlow value={period === "yearly" ? 23 : 29} prefix="$" className="text-4xl font-semibold" />
```

### Icon-only view switcher

```tsx
<SegmentedControl
  aria-label="Layout"
  size="sm"
  defaultValue="list"
  options={[
    { value: "list", icon: List, ariaLabel: "List view" },
    { value: "grid", icon: LayoutGrid, ariaLabel: "Grid view" },
    { value: "map", icon: MapIcon, ariaLabel: "Map view" },
  ]}
/>
```

## API

### SegmentedControl

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| options (required) | `SegmentedControlOption[]` | — |  |
| value | `string` | — | Selected option value (controlled). |
| defaultValue | `string` | — | Initially selected option when uncontrolled; defaults to the first enabled option. |
| onValueChange | `(value: string) => void` | — | Called with the new value on click or arrow-key selection. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Height: sm 32px, md 36px, lg 44px. |
| fullWidth | `boolean` | `false` | Stretch to the container width with equal segments. |
| disabled | `boolean` | `false` | Disables the whole control. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Focuses the selected segment (one tab stop for the whole control). |
| ArrowRight / ArrowDown | Selects and focuses the next enabled segment, wrapping around. |
| ArrowLeft / ArrowUp | Selects and focuses the previous enabled segment, wrapping around. |
| Home / End | Selects the first or last enabled segment. |
| Enter / Space | Selects the focused segment (native <button>). |

## Accessibility

- The root is role="radiogroup" and each segment is a <button role="radio"> with aria-checked, using a roving tabindex.
- Give the group a name with aria-label (it is passed to the root). Icon-only options need ariaLabel.
- disabled on the root sets aria-disabled and disables every segment; disabled on an option skips it in keyboard navigation.

## Motion

- The thumb is one shared-layout element that slides to the selected segment on the kit's snap spring.
- While pressed, the thumb squeezes to 0.95 scale, and an unselected segment's label to 0.96.
- Hairline dividers between unselected neighbours fade out in 200 ms next to the thumb, like iOS.
- Reduced motion: no squeeze, and the thumb jumps to the new segment.

## Notes for AI

- options is an array of { value, label?, icon?, ariaLabel?, disabled? }; icon takes the component (icon: MapPin), not an element (<MapPin />).
- onValueChange gives a string; cast it to your union type if you need to.
- Always pass aria-label on the control; there is no visible group label built in.
- Use it for options that apply immediately; for panels of content use tabs-indicator.
- Arrow keys select immediately (they do not just move focus), like native radio buttons.

## FAQ

**Segmented control or tabs?**

A segmented control changes a setting or filter in place (radiogroup). Tabs switch between panels of content (tablist + tabpanel). Screen readers announce them differently.

**Can it be uncontrolled?**

Yes. Pass defaultValue (or nothing, then the first enabled option is selected) and read changes in onValueChange.

## Related

- tabs-indicator: https://goodui.dev/components/navigation/tabs-indicator
- tabs: https://goodui.dev/components/core/tabs
- switch: https://goodui.dev/components/core/switch
- select: https://goodui.dev/components/core/select

Last updated: 2026-11-02
