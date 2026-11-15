# Tabs indicator

> Tabs whose indicator glides between tabs on a shared-layout spring (underline with hover highlight, pill, or segmented with icons), with arrow-key navigation and panels that slide in the direction of travel while the height eases to fit.

Animated tabs with sliding indicator for React and shadcn: underline, pill and segmented

Page: https://goodui.dev/components/navigation/tabs-indicator

## Install

```bash
npx shadcn@latest add @goodui/tabs-indicator
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/tabs-indicator.json`. The file lands in `components/goodui/tabs-indicator.tsx`.

## When to use

- Switching between views of the same data: Upcoming / Pending / Past bookings.
- Short tab sets where a gliding indicator and sliding panels make the change easy to follow.
- Range pickers above a chart (Day / Week / Month / Year) with the pill variant and your own content below.

## When not to use

- Choosing a setting or filter value without panels: use segmented-control (radiogroup semantics).
- Moving between pages of the app: use links in your nav, or bottom-nav on mobile.
- Needing vertical tabs, enclosed folder tabs or more variants: use the tabs core component.

## Pick by what matters

| Need | Use |
| --- | --- |
| Section tabs under a heading | variant="underline" (default, with hover highlight) |
| Chips-like range picker | variant="pill" |
| Compact switcher with icons | variant="segmented" with icon on items |
| Tabs fill the card width | fullWidth |
| Built-in animated panels | content on each item |
| You render the content yourself | no content; read value / onValueChange |

## Usage

```tsx
import { TabsIndicator } from "@/components/goodui/tabs-indicator"

export function BookingTabs({ upcoming, pending, past }: { upcoming: React.ReactNode; pending: React.ReactNode; past: React.ReactNode }) {
  return (
    <TabsIndicator
      listLabel="Booking status"
      defaultValue="upcoming"
      items={[
        { value: "upcoming", label: "Upcoming", badge: 4, content: upcoming },
        { value: "pending", label: "Pending", badge: 2, content: pending },
        { value: "past", label: "Past", content: past },
        { value: "cancelled", label: "Cancelled", disabled: true },
      ]}
    />
  )
}
```

### Controlled pill range picker with your own content

```tsx
const [range, setRange] = React.useState("week")

<TabsIndicator
  variant="pill"
  listLabel="Revenue range"
  value={range}
  onValueChange={setRange}
  items={[
    { value: "day", label: "Day" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
    { value: "year", label: "Year" },
  ]}
/>
<RevenueChart range={range} />
```

### Segmented with icons and panels

```tsx
<TabsIndicator
  variant="segmented"
  fullWidth
  listLabel="Calendar view"
  defaultValue="day"
  items={[
    { value: "day", label: "Day", icon: CalendarDays, content: <DayView /> },
    { value: "week", label: "Week", icon: CalendarRange, content: <WeekView /> },
    { value: "month", label: "Month", icon: Calendar, content: <MonthView /> },
  ]}
/>
```

## API

### TabsIndicator

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| items (required) | `TabsIndicatorItem[]` | — | The tabs, in order. Give items content to get built-in panels. |
| value | `string` | — | Selected tab value (controlled). |
| defaultValue | `string` | — | Initially selected tab when uncontrolled; defaults to the first enabled item. |
| onValueChange | `(value: string) => void` | — | Called with the new value on click or arrow-key selection. |
| variant | `"underline" \| "pill" \| "segmented"` | `"underline"` | underline: line under the active tab plus a hover highlight. pill: filled primary pill. segmented: raised thumb in a muted track. |
| fullWidth | `boolean` | `false` | Stretch the tabs into equal columns. |
| listLabel | `string` | — | Accessible name of the tab list. |
| listClassName | `string` | — | Classes for the tablist element. |
| panelClassName | `string` | — | Classes for the tab panel (only rendered when items have content). |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Focuses the selected tab, then the panel (one tab stop for the list). |
| ArrowRight / ArrowLeft | Selects and focuses the next or previous enabled tab, wrapping around. |
| Home / End | Selects the first or last enabled tab. |
| Enter / Space | Selects the focused tab (native <button>). |

## Accessibility

- Uses role="tablist" (aria-orientation horizontal, named by listLabel) with role="tab" buttons, aria-selected and a roving tabindex.
- With content, a role="tabpanel" is rendered, labelled by its tab and linked from the selected tab through aria-controls; the panel is focusable.
- Without content there is no tabpanel or aria-controls; if you render the panel yourself, add role="tabpanel" to it.
- Disabled items are skipped by the arrow keys.

## Motion

- The indicator (underline, pill or thumb) is one shared-layout element that glides to the selected tab on the kit's snap spring. Numeric badges roll to their new value.
- Underline variant: a muted highlight follows the pointer between tabs on the same spring and fades out in 150 ms when the pointer leaves.
- Panels slide 28px in the direction of travel with a 4px blur and fade (ui spring, opacity 180 ms) while the container height follows on the snap spring.
- Reduced motion: the indicator jumps, panels swap without sliding or blur, and the height changes instantly.

## Notes for AI

- Pass tabs as items={[{ value, label, icon?, badge?, disabled?, content? }]}; there are no Tab or TabPanel child components.
- icon takes the component (icon: CalendarDays), not an element.
- Use content for built-in panels; if any item has content, a panel is rendered for the selected one.
- Always pass listLabel so the tablist has a name.
- The list scrolls horizontally with a hidden scrollbar when tabs overflow; do not wrap it in your own overflow container.

## FAQ

**How is this different from the core tabs component?**

tabs-indicator is a focused, items-based component with three variants and directional panels. The core tabs component has more variants (enclosed, soft, vertical), tones and sizes.

**Can several instances live on one page?**

Yes. The indicator's layoutId is scoped with useId, so indicators never jump between instances.

## Related

- tabs: https://goodui.dev/components/core/tabs
- segmented-control: https://goodui.dev/components/navigation/segmented-control
- bottom-nav: https://goodui.dev/components/navigation/bottom-nav
- stepper: https://goodui.dev/components/navigation/stepper

Last updated: 2026-11-02
