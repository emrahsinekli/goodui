# Date Picker

> Date picker and calendar with no date library: single, range (two months side by side) and multiple modes, presets, time inputs, min/max, disabled weekdays, booked days, ISO week numbers, month/year quick switch, typed dates parsed in the locale's order via Intl with the locale's first weekday, popover or inline, six field variants, tones, solid/soft/ring selection, day shapes, sizes and slide, fade or scale month animations with APG grid keyboard.

Date picker and range calendar for React and shadcn without a date library: presets, time, booked days, typed dates

Page: https://goodui.dev/components/core/date-picker

## Install

```bash
npx shadcn@latest add @goodui/date-picker
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/date-picker.json`. The file lands in `components/goodui/date-picker.tsx`.

## When to use

- Booking forms: pick a day and a time, with past days, closed weekdays and fully booked days blocked.
- Report filters: a date range with presets (Last 7 days, This month…) and two months side by side.
- Picking several separate days (staff days off, class dates) with mode="multiple".
- Any app that needs locale-correct names, digits, typed formats and first day of the week without shipping date-fns or dayjs.

## When not to use

- Birth dates and other far-away dates people know by heart: three selects or a plain typed field are faster than paging through years.
- A week or month calendar of events with drag and drop: use the scheduler.
- Only a time of day: use a time input.

## Pick by what matters

| Need | Use |
| --- | --- |
| Forms | variant="outline" (default) with a <label htmlFor> pointing at id |
| Appointments | time, min, disabledWeekdays and booked; minuteStep for the slot length |
| Reports and analytics | mode="range" with presets; max={today} to block the future |
| Always-visible calendar in a page or sidebar | inline |
| Several separate days | mode="multiple" (popover stays open, Done closes) |
| Calm UI | selection="soft" or "ring", animation="fade" |
| Playful or retro brands | variant="neo", shape="square" |

## Usage

```tsx
import * as React from "react"
import { DatePicker, type DateRange } from "@/components/goodui/date-picker"

export function BookingFields({ bookedDays }: { bookedDays: Date[] }) {
  const [when, setWhen] = React.useState<Date | null>(null)
  const [period, setPeriod] = React.useState<DateRange | null>(null)
  const [today, setToday] = React.useState<Date>()
  React.useEffect(() => setToday(new Date()), [])

  return (
    <form className="grid gap-4">
      <label htmlFor="when" className="text-sm font-medium">Appointment</label>
      <DatePicker
        id="when"
        className="w-full"
        time
        minuteStep={30}
        min={today}
        disabledWeekdays={[0]}
        booked={bookedDays}
        presets
        value={when}
        onValueChange={setWhen}
        name="startsAt"
      />
      <DatePicker mode="range" presets max={today} value={period} onValueChange={setPeriod} aria-label="Report period" />
    </form>
  )
}
```

### Inline range for a stay, with week numbers

```tsx
<DatePicker inline mode="range" months={2} weekNumbers booked={booked} value={stay} onValueChange={setStay} aria-label="Stay dates" />
```

### Custom presets

```tsx
<DatePicker
  mode="range"
  aria-label="Billing period"
  presets={[
    { label: "This quarter", value: (t) => ({ from: new Date(t.getFullYear(), Math.floor(t.getMonth() / 3) * 3, 1), to: t }) },
    { label: "Year to date", value: (t) => ({ from: new Date(t.getFullYear(), 0, 1), to: t }) },
  ]}
/>
```

### German locale (Monday first, 24.12.2026)

```tsx
<DatePicker
  locale="de-DE"
  aria-label="Rechnungsdatum"
  labels={{ openCalendar: "Kalender öffnen", dialog: "Datum wählen", prevMonth: "Vorheriger Monat", nextMonth: "Nächster Monat", today: "Heute", formatDay: "TT", formatMonth: "MM", formatYear: "JJJJ" }}
/>
```

## API

### DatePicker

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| id | `string` | — | Goes on the text input, so <label htmlFor> works. |
| aria-label | `string` | — | Defines a string value that labels the current element. Names the field or the inline calendar. |
| locale | `string` | — | BCP 47 locale for names, digits, the typed format and the first day of the week. Defaults to the GooduiLocaleProvider language, else en-US. |
| weekStartsOn | `number` | — | 0 = Sunday … 6 = Saturday. Defaults to the locale's first day (Intl.Locale week info), else Monday (Sunday for en-US). |
| min | `Date` | — | Earliest selectable day. |
| max | `Date` | — | Latest selectable day. |
| disabledDays | `Date[] \| ((date: Date) => boolean)` | — | Days that cannot be picked: a list of dates or a test function. |
| disabledWeekdays | `number[]` | — | Weekdays that cannot be picked (0 = Sunday), e.g. [0, 6] for weekends. |
| booked | `Date[] \| ((date: Date) => boolean)` | — | Days shown as booked (struck through) and not pickable. A range cannot span a booked or disabled day. |
| weekNumbers | `boolean` | — | ISO week numbers in a first column. |
| months | `1 \| 2` | — | Months shown side by side. Default: 2 for range on wide screens, else 1. |
| presets | `boolean \| DatePickerPreset[]` | — | true for the built-in presets of the mode, or your own list. |
| time | `boolean` | — | Adds time inputs (single: one, range: start and end). |
| minuteStep | `number` | — | Minute step of the time inputs. |
| inline | `boolean` | — | Render the calendar on the page instead of a field with a popover. |
| placeholder | `string` | — | Field placeholder. Defaults to the locale's format, e.g. MM/DD/YYYY. |
| variant | `"outline" \| "filled" \| "ghost" \| "underline" \| "pill" \| "neo"` | — | Field style and surface: outline (default), filled, ghost, underline, pill or neo. |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | — | Accent for picked days, range band, today dot and focus. |
| selection | `"solid" \| "soft" \| "ring"` | — | How picked days are painted: solid fill, soft tint or ring. |
| shape | `"circle" \| "rounded" \| "square"` | — | Day cell shape. |
| size | `"sm" \| "md" \| "lg"` | — |  |
| shadow | `"none" \| "sm" \| "md" \| "lg"` | — | Surface shadow (popover and inline calendar). |
| animation | `"none" \| "fade" \| "slide" \| "scale"` | — | Popover open and month change: slide (default), fade, scale or none. Reduced motion: fade only. |
| clearable | `boolean` | — | × button in the field. |
| closeOnSelect | `boolean` | — | Close the popover after a full pick (single day, or range end) when there is no time input. |
| disabled | `boolean` | — |  |
| invalid | `boolean` | — |  |
| month | `Date` | — | Displayed month (controlled), any day in it. |
| defaultMonth | `Date` | — |  |
| onMonthChange | `(month: Date) => void` | — |  |
| open | `boolean` | — |  |
| defaultOpen | `boolean` | — |  |
| onOpenChange | `(open: boolean) => void` | — |  |
| name | `string` | — | Hidden input(s) with ISO dates (yyyy-mm-dd, or with time yyyy-mm-ddThh:mm) for form posts. |
| labels | `Partial<DatePickerLabels>` | — | Text for built-in controls and screen readers; pass translations here. |
| mode | `"single"` | — |  |
| value | `Date \| null` | — | to is null while the end is being picked. |
| defaultValue | `Date \| null` | — |  |
| onValueChange | `(value: Date \| null) => void` | — |  |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Arrow Down (before typing) / Alt + Arrow Down | In the text field: opens the calendar with the selected day (or today) focused. |
| Enter (in the field) | Reads the typed date in the locale's order (also ISO 2026-11-24, month names, and an optional time like 2:30 pm). Invalid or blocked dates mark the field invalid and keep the text. |
| Escape (in the field) | Throws away typed text and shows the current value again. |
| Arrow Left / Arrow Right | Previous / next day (mirrored in RTL). Crossing the edge turns the month. |
| Arrow Up / Arrow Down | Same weekday in the previous / next week. |
| Home / End | First / last day of the week (follows weekStartsOn). |
| Page Up / Page Down | Same day in the previous / next month; with Shift, previous / next year. |
| Enter / Space | Picks the focused day (single closes the popover unless time is on; range picks start then end; multiple toggles). |
| Escape | In the month or year grid: back to days. Otherwise closes the popover and returns focus to what opened it. |
| Tab / Shift + Tab | Moves through presets, navigation, the day grid (one tab stop), time and footer, and stays inside the popover dialog. |
| Arrows / Home / End / Enter (month and year grids) | Move by one (left/right) or a row of three (up/down), jump to the ends, pick. |

## Accessibility

- The popover is role="dialog" with aria-modal and keeps focus inside (WAI-ARIA date picker dialog). The calendar button has aria-haspopup="dialog", aria-expanded and aria-controls; focus returns to it (or the field) on close.
- Each month is a role="grid" table labelled by its caption, with weekday column headers (abbr holds the full weekday name). Days are buttons with a full date label such as “Tuesday, November 24, 2026”, plus “Today”, “Booked” or “Unavailable” when they apply; the cell carries aria-selected.
- Roving tabindex: the grid is a single tab stop and arrow keys move a real focus. Disabled and booked days stay focusable (so keyboard users can pass over them) but have aria-disabled and cannot be picked.
- The visible month is announced in a polite live region when it changes. Week numbers are row headers named “Week 47”.
- The text field has no visible label of its own: use aria-label or id with <label htmlFor>. Invalid typed input sets aria-invalid and an alert with labels.invalid.
- Names, digits, weekday headers and the typed format come from Intl for the locale prop; every built-in string is in labels.

## Motion

- slide (default): the popover moves 8px in; changing the month slides the grid 36px toward the direction of travel (mirrored in RTL) with a fade, on a spring (stiffness 420, damping 36, mass 0.7). fade: the popover fades and months crossfade. scale: the popover grows from 0.95 and the month/year grids from 0.94, months slide as in slide.
- The popover closes with a 120 ms fade. The range band follows the pointer (and keyboard focus) as a lighter preview before the end is picked.
- Reduced motion: popover, months and grids only fade (120 ms), and CSS transitions on the field and days are off.

## Performance

- No dependencies: date math uses the Date constructor in local time, and all Intl formatters are created once per locale.
- Grids always have six rows, so switching months never changes the height. The popover mounts only while open.

## Notes for AI

- mode decides the value shape: single → Date | null, range → { from: Date; to: Date | null } | null (to is null while the end is being picked), multiple → Date[].
- Before hydration there is no today: pass min/max/booked that depend on today from state set in useEffect, never from new Date() during render.
- Without time, values are local midnight. With time, the time inputs set hours and minutes on the picked days.
- A range cannot cross a booked or disabled day; clicking past one starts a new range there.
- locale defaults to en-US (not the browser's language) so server and client render the same text; pass the user's locale explicitly.
- name renders hidden ISO inputs: name for single, nameFrom and nameTo for range, one per day for multiple.
- Do not add a date library for formatting; use the locale prop and labels.

## FAQ

**How does typed parsing work?**

The field reads digits in the order the locale writes dates (MM/DD/YYYY for en-US, DD.MM.YYYY for de-DE, YYYY/MM/DD for ja-JP), ISO dates, month names in the locale, two-digit years and an optional trailing time. A missing year uses the current one.

**How is the first day of the week chosen?**

weekStartsOn wins. Otherwise the browser's Intl.Locale week info for the locale is used, with a fallback of Sunday for en-US and similar regions and Monday elsewhere.

**Can it show two months on phones?**

Range mode shows two months from 640px up and one below; set months to force either.

## Related

- input: https://goodui.dev/components/core/input
- select: https://goodui.dev/components/core/select
- combobox: https://goodui.dev/components/core/combobox
- scheduler: https://goodui.dev/r/scheduler.json

Last updated: 2026-11-03
