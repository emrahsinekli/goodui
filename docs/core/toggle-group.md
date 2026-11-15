# Toggle Group

> Single (radiogroup) or multiple (aria-pressed) toggle buttons in outline, soft, solid, segmented, neo and glass styles with a sliding, fading or popping active marker, text or icon items, tones, sizes, shapes, shadows, attached or spaced, vertical, full width, disabled items and roving arrow-key focus that flips in RTL.

Toggle group and segmented control for React and shadcn: single or multiple, sliding indicator, keyboard

Page: https://goodui.dev/components/core/toggle-group

## Install

```bash
npx shadcn@latest add @goodui/toggle-group
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/toggle-group.json`. The file lands in `components/goodui/toggle-group.tsx`.

## When to use

- Switching a view or mode in place: Day / Week / Month, list / grid, monthly / yearly billing.
- Picking one of two to five short options that should all stay visible (single).
- Turning several independent options on and off in one row: working days, filters, text formatting (multiple).

## When not to use

- Switching between panels of content: use tabs, which wires tabpanels and aria-controls.
- More than about six options or long labels: use select.
- A single on/off setting: use switch.
- Navigation between pages: use links.

## Pick by what matters

| Need | Use |
| --- | --- |
| iOS-style segmented control | variant="segmented" (or "solid" for a filled marker) |
| Toolbar of joined buttons | variant="outline" (attached by default) |
| Light filter chips | variant="soft" shape="pill" |
| Several values | type="multiple" (aria-pressed buttons) |
| Icon-only buttons | items with icon and aria-label (title adds a tooltip) |
| On photos or gradients | variant="glass" |
| Playful or retro brands | variant="neo"; attached={false} spaces the buttons |

## Usage

```tsx
import * as React from "react"
import { CalendarDays, CalendarRange, LayoutList } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/goodui/toggle-group"

export function CalendarToolbar() {
  const [view, setView] = React.useState<string | null>("week")
  const [days, setDays] = React.useState<string[]>(["Mon", "Tue", "Wed"])

  return (
    <div className="flex flex-wrap gap-4">
      <ToggleGroup
        aria-label="Calendar view"
        variant="segmented"
        value={view}
        onValueChange={setView}
        items={[
          { value: "day", label: "Day", icon: <CalendarDays /> },
          { value: "week", label: "Week", icon: <CalendarRange /> },
          { value: "agenda", label: "Agenda", icon: <LayoutList /> },
        ]}
      />
      <ToggleGroup type="multiple" aria-label="Working days" value={days} onValueChange={setDays}>
        {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
          <ToggleGroupItem key={d} value={d}>
            {d}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
```

### Billing period

```tsx
<ToggleGroup variant="segmented" shape="pill" aria-label="Billing period" defaultValue="yearly"
  items={[{ value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly −20%" }]} />
```

### Icon-only layout switch

```tsx
<ToggleGroup variant="outline" tone="neutral" size="sm" aria-label="Layout" defaultValue="list"
  items={[
    { value: "list", icon: <List />, "aria-label": "List", title: "List" },
    { value: "grid", icon: <LayoutGrid />, "aria-label": "Grid", title: "Grid" },
  ]} />
```

### Clearable single choice

```tsx
<ToggleGroup deselectable aria-label="Reminder" items={[{ value: "sms", label: "SMS" }, { value: "email", label: "Email" }]} />
```

## API

### ToggleGroup

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| items | `ToggleGroupOption[]` | — | Shortcut: renders a ToggleGroupItem per option. Or pass <ToggleGroupItem> children. |
| variant | `"outline" \| "soft" \| "solid" \| "segmented" \| "neo" \| "glass"` | — | How the group is painted. outline and neo draw joined buttons; soft, solid, segmented and glass sit in a track. |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | — | Color of the active item. |
| size | `"sm" \| "md" \| "lg"` | — |  |
| shape | `"square" \| "rounded" \| "pill"` | — |  |
| shadow | `"none" \| "sm" \| "md" \| "glow"` | — | Group shadow; glow puts a tone-colored glow under the active marker instead. |
| animation | `"none" \| "slide" \| "fade" \| "pop"` | — | slide glides one marker between items (single only; multiple falls back to fade). Reduced motion snaps. |
| orientation | `"horizontal" \| "vertical"` | — |  |
| attached | `boolean` | — | outline and neo: buttons share borders in one box. false spaces them apart. |
| fullWidth | `boolean` | — | Items share the full width equally. |
| disabled | `boolean` | — | Disables every item. |
| name | `string` | — | Form field name (renders hidden inputs with the selected values). |
| type | `"single"` | — | single: one value (a radiogroup). multiple: any number (each item has aria-pressed). |
| value | `string \| null` | — | Selected value (controlled): a string or null; string[] with type="multiple". |
| defaultValue | `string \| null` | — | Initial value when uncontrolled. |
| onValueChange | `(value: string \| null) => void` | — | Called with the new value (string \| null, or string[] with type="multiple"). |
| deselectable | `boolean` | — | single: clicking the active item clears the value. |

Also accepts every <div> attribute.

### ToggleGroupItem

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| value (required) | `string` | — | Value reported to the group. |
| icon | `React.ReactNode` | — | Icon before the label; with no label the item becomes square (pass aria-label). |

Also accepts every <button> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Enters the group on the selected item (single) or the last focused item (multiple); one tab stop. |
| → / ↓ | Next enabled item, wrapping (← in RTL). In single mode it also selects it. |
| ← / ↑ | Previous enabled item, wrapping (→ in RTL). In single mode it also selects it. |
| Home / End | First / last enabled item. |
| Space / Enter | Toggles the focused item (multiple) or selects it (single; clears it with deselectable). |

## Accessibility

- type="single" renders role="radiogroup" with role="radio" items and aria-checked (the radio pattern: arrows move and select).
- type="multiple" renders role="group" with native buttons and aria-pressed; arrows only move focus.
- Give the group a name with aria-label or aria-labelledby. Icon-only items need an aria-label; the icon is decorative.
- Disabled items are skipped by the arrow keys and keep the native disabled attribute.
- name renders hidden inputs with the selected values for native forms.

## Motion

- slide (single): one marker glides between items with a motion layout spring (stiffness 520, damping 40) and keeps its corner radius while it stretches.
- fade: the marker fades and scales in from 0.94 over 200 ms. pop: it springs in from 0.6 over 340 ms. Both run only after the first interaction.
- Items scale to 0.96 while pressed (neo moves into its shadow instead). none is static.
- Reduced motion: the marker snaps (no layout animation), and press, fade and pop are off.

## Performance

- The roving tab stop is computed from the DOM after each render without extra renders unless it changes. Multiple mode never uses layout animations.

## Notes for AI

- value is a string (or null) for single and string[] for type="multiple"; onValueChange matches.
- Use items for simple lists; use ToggleGroupItem children when you need custom content per item.
- Do not use it to show different content panels; that is tabs.
- Single mode cannot be emptied by clicking unless deselectable is set, like radio buttons.
- variant, tone, size, shape, shadow, animation, orientation and attached are independent layers; combine them instead of adding color classes.

## FAQ

**Radio semantics or aria-pressed?**

Single uses the radio pattern because exactly one value is chosen; multiple uses aria-pressed toggle buttons because each item is independent. Both follow the WAI-ARIA APG patterns.

**Why is my marker not sliding?**

The sliding marker is single-mode only and turns off with reduced motion. Multiple mode fades or pops each active item.

## Related

- tabs: https://goodui.dev/components/core/tabs
- button: https://goodui.dev/components/core/button
- select: https://goodui.dev/components/core/select
- switch: https://goodui.dev/components/core/switch
- checkbox: https://goodui.dev/components/core/checkbox

Last updated: 2026-11-03
