# Tabs

> Six variants (underline, pill, segmented, enclosed folder tabs, soft, vertical line), a sliding, fading or static indicator, fade or directional slide panels, tones, sizes, shapes, shadows and orientation, with icons, count badges, arrow keys and a one-line items API.

Animated tabs for React and shadcn: sliding indicator, segmented, pill and vertical tabs

Page: https://goodui.dev/components/core/tabs

## Install

```bash
npx shadcn@latest add @goodui/tabs
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/tabs.json`. The file lands in `components/goodui/tabs.tsx`.

## When to use

- Switching between views of the same thing without leaving the page: a client's Bookings, Invoices and Notes.
- Settings pages with sections in a side list: variant="vertical-line" or orientation="vertical".
- Filtering one list by status with counts: All 24, Upcoming 9, Cancelled 2.
- A compact view switch (Day / Week / Month) above a calendar: variant="segmented".

## When not to use

- Navigating between pages with their own URLs: use links in your nav, or bottom-nav on mobile.
- A stand-alone two or three option toggle that is not tied to panels: use segmented-control.
- Steps that must be done in order: use stepper.

## Pick by what matters

| Need | Use |
| --- | --- |
| Page or card sections | variant="underline" (default) with indicator="slide" |
| View switch above a calendar or chart | variant="segmented" size="sm" |
| Status filters with counts | variant="pill" or "soft" with count on each tab |
| Folder-style tabs attached to a panel | variant="enclosed" (the panel gets the border and card background) |
| Settings sidebar | variant="vertical-line" |
| Equal-width tabs on mobile | fullWidth |
| Calm UI with no motion | indicator="none" transition="none" |

## Usage

```tsx
import { CalendarDays, FileText, StickyNote } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/goodui/tabs"

export function ClientTabs() {
  return (
    <Tabs defaultValue="bookings" transition="slide">
      <TabsList aria-label="Client details">
        <TabsTrigger value="bookings" icon={<CalendarDays />} count={3}>
          Bookings
        </TabsTrigger>
        <TabsTrigger value="invoices" icon={<FileText />}>
          Invoices
        </TabsTrigger>
        <TabsTrigger value="notes" icon={<StickyNote />}>
          Notes
        </TabsTrigger>
      </TabsList>
      <TabsContent value="bookings">3 upcoming appointments, next on Friday at 09:30.</TabsContent>
      <TabsContent value="invoices">2 paid invoices, $340 total this year.</TabsContent>
      <TabsContent value="notes">Prefers Maya. Sensitive scalp, patch test before color.</TabsContent>
    </Tabs>
  )
}
```

### One-liner with items

```tsx
<Tabs
  variant="segmented"
  size="sm"
  listLabel="Calendar view"
  items={[
    { value: "day", label: "Day", content: <DayView /> },
    { value: "week", label: "Week", content: <WeekView /> },
    { value: "month", label: "Month", content: <MonthView /> },
  ]}
/>
```

### Controlled status filter

```tsx
const [status, setStatus] = React.useState("upcoming")

<Tabs value={status} onValueChange={setStatus} variant="pill" tone="neutral" transition="none">
  <TabsList aria-label="Booking status">
    <TabsTrigger value="upcoming" count={9}>Upcoming</TabsTrigger>
    <TabsTrigger value="past" count={124}>Past</TabsTrigger>
    <TabsTrigger value="cancelled" count={2}>Cancelled</TabsTrigger>
  </TabsList>
</Tabs>
```

### Settings sidebar

```tsx
<Tabs variant="vertical-line" defaultValue="profile">
  <TabsList aria-label="Settings">
    <TabsTrigger value="profile">Profile</TabsTrigger>
    <TabsTrigger value="billing">Billing</TabsTrigger>
    <TabsTrigger value="team">Team</TabsTrigger>
  </TabsList>
  <TabsContent value="profile"><ProfileForm /></TabsContent>
  <TabsContent value="billing"><BillingForm /></TabsContent>
  <TabsContent value="team"><TeamForm /></TabsContent>
</Tabs>
```

## API

### Tabs

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| value | `string` | — | Active tab value (controlled). |
| defaultValue | `string` | — | Initially active tab when uncontrolled; defaults to the first enabled tab. |
| onValueChange | `(value: string) => void` | — | Called with the new value when a tab is clicked or picked with the keyboard. |
| variant | `"underline" \| "pill" \| "segmented" \| "enclosed" \| "soft" \| "vertical-line"` | `"underline"` | Look of the list and marker: underline, pill, segmented, enclosed (folder tabs), soft or vertical-line. |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"primary"` | Color of the active marker, text and count. |
| indicator | `"none" \| "slide" \| "fade"` | `"slide"` | How the active marker moves between tabs. |
| transition | `"none" \| "fade" \| "slide"` | `"slide"` | How a panel enters when its tab is selected. |
| size | `"sm" \| "md" \| "lg"` | `"md"` |  |
| shape | `"auto" \| "square" \| "rounded" \| "pill"` | `"auto"` | Corner style of tabs and marker. "auto" picks the natural one for the variant. |
| shadow | `"none" \| "sm" \| "md" \| "glow"` | `"none"` | Shadow under the active marker. |
| orientation | `"horizontal" \| "vertical"` | `"horizontal"` | Lays the list out vertically beside the panel. Ignored by enclosed; vertical-line is always vertical. |
| fullWidth | `boolean` | `false` | Stretch the tabs into equal columns. |
| sound | `boolean \| SoundName` | — | Plays "tick" when a tab is selected and the visitor has sounds on (lib/goodui-sounds); pass a sound name to pick another. Off by default. |
| items | `TabsItem[]` | — | Shortcut: renders the list and the panels for you. |
| listLabel | `string` | — | Accessible name of the tab list when using `items`. |

Also accepts every <div> attribute.

### TabsList

Also accepts every <div> attribute.

### TabsTrigger

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| value (required) | `string` | — | Matches the TabsContent with the same value. |
| icon | `React.ReactNode` | — | Icon before the label. |
| count | `React.ReactNode` | — | Small count after the label. |

Also accepts every <button> attribute.

### TabsContent

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| value (required) | `string` | — | Shown when the TabsTrigger with this value is active. |
| keepMounted | `boolean` | — | Keep the panel in the DOM (hidden) when inactive, e.g. to preserve form state. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Arrow Right / Arrow Down | Focuses and selects the next tab, wrapping to the first; disabled tabs are skipped. |
| Arrow Left / Arrow Up | Focuses and selects the previous tab, wrapping to the last. |
| Home / End | Focuses and selects the first or last enabled tab. |
| Tab | Moves focus from the active tab into its panel (only the active tab is in the tab order). |

## Accessibility

- WAI-ARIA tabs pattern: role="tablist" with aria-orientation, role="tab" with aria-selected and aria-controls, role="tabpanel" with aria-labelledby. Ids come from useId. aria-controls is only set while that panel is in the DOM (the active one, or keepMounted panels), so it never points at a missing element.
- Arrow keys follow reading direction: under dir="rtl" ArrowLeft moves to the next tab. The underline, vertical-line marker and slide transition mirror too.
- Roving tabindex: only the active tab is focusable with Tab; arrows move between tabs and select them (automatic activation).
- Give the list a name: aria-label on TabsList, or listLabel when using items.
- Panels are focusable (tabIndex 0) with a visible focus ring, so keyboard users can reach panels that have no focusable content.

## Motion

- indicator="slide" (default): the active marker moves between tabs as a shared layout element on the kit's snap spring (0.18 s, no bounce).
- indicator="fade": the marker appears in place, fading and scaling from 0.94 in 180 ms. Numeric counts roll to their new value. Panels slide 14px by direction and unblur from 4px in 240 ms.
- transition="fade" (default): the new panel fades and rises 4px in 240 ms. "slide": it slides in 14px from the side you moved toward, in 280 ms.
- Nothing animates on first render; panel and fade animations start after the first tab change.
- Reduced motion: the marker jumps instead of sliding and panels appear without animation.

## Notes for AI

- Use either the parts (Tabs, TabsList, TabsTrigger, TabsContent) or the items prop, not both; children win over items.
- value strings must match between TabsTrigger and TabsContent. Use value + onValueChange for controlled tabs, defaultValue otherwise; without either, the first enabled tab is selected.
- Put icons in icon and counts in count, not inside children, so spacing and the active count color work.
- variant="vertical-line" is always vertical; orientation="vertical" is ignored by enclosed. Vertical tabs stack above the panel below the sm breakpoint.
- Panels unmount when inactive; add keepMounted on TabsContent to keep form state. Tabs has no built-in text, so there is no labels prop.

## FAQ

**Can I use tabs only as a filter, without panels?**

Yes. Render Tabs and TabsList with triggers and no TabsContent, and react to onValueChange.

**Does it scroll when there are too many tabs?**

Horizontal lists scroll sideways with the scrollbar hidden; tabs keep their width and do not wrap.

## Related

- segmented-control: https://goodui.dev/components/navigation/segmented-control
- tabs-indicator: https://goodui.dev/components/navigation/tabs-indicator
- stepper: https://goodui.dev/components/navigation/stepper
- bottom-nav: https://goodui.dev/components/navigation/bottom-nav

Last updated: 2026-11-02
