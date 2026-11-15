# Accordion height

> Accordion whose panels spring open to their real height (motion height:auto) with a rotating chevron, in single or multiple mode, with arrow-key, Home and End navigation between headers.

Animated accordion for React and shadcn that springs to its real height

Page: https://goodui.dev/components/lists/accordion-height

## Install

```bash
npx shadcn@latest add @goodui/accordion-height
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/accordion-height.json`. The file lands in `components/goodui/accordion-height.tsx`.

## When to use

- FAQ sections on pricing and help pages, where people scan questions and open one or two.
- Settings grouped by location, service or feature, each group opening to its controls.
- Long forms or details split into sections that would otherwise push the page far down.

## When not to use

- A list of records (appointments, invoices) with their own summary layout and actions: use expandable-row-list.
- Nested folders or categories: use tree-expand.
- Switching between a few views of equal weight: use tabs-indicator, so only one view is ever shown.

## Pick by what matters

| Need | Use |
| --- | --- |
| FAQ where one answer at a time keeps the page short | type="single" (default), collapsible stays true |
| Settings people compare side by side | type="multiple" |
| One section must always stay open | type="single" collapsible={false} |
| A self-contained card in a dashboard | variant="bordered" (default) |
| Sections as separate cards with a shadow on the open one | variant="separated" |
| Inline in a page or a sidebar, no card | variant="ghost" |

## Usage

```tsx
import { CalendarClock, CreditCard, Receipt } from "lucide-react"
import { AccordionHeight } from "@/components/goodui/accordion-height"

export function BillingFaq() {
  return (
    <AccordionHeight
      defaultValue={["trial"]}
      items={[
        {
          value: "trial",
          icon: <CalendarClock />,
          title: "What happens when my trial ends?",
          content: "Your workspace moves to the Free plan. Bookings and clients stay; online payments pause until you pick a plan.",
        },
        {
          value: "card",
          icon: <CreditCard />,
          title: "Can I change the card on file?",
          description: "Billing → Payment method",
          content: "Yes. The new card is used from the next invoice; nothing is charged when you switch.",
        },
        {
          value: "invoices",
          icon: <Receipt />,
          title: "Where do I find past invoices?",
          content: "Every invoice is listed under Billing → Invoices as a PDF with your company details.",
        },
      ]}
    />
  )
}
```

### Controlled, several open at once

```tsx
const [open, setOpen] = React.useState<string[]>(["downtown"])

<AccordionHeight
  type="multiple"
  variant="separated"
  value={open}
  onValueChange={setOpen}
  items={locations.map((l) => ({
    value: l.id,
    title: l.name,
    description: l.address,
    content: <OpeningHours location={l} />,
  }))}
/>
<button onClick={() => setOpen(locations.map((l) => l.id))}>Expand all</button>
```

### Ghost variant in a sidebar

```tsx
<AccordionHeight
  variant="ghost"
  items={[
    { value: "filters", title: "Filters", content: <StatusFilters /> },
    { value: "export", title: "Export", content: <ExportOptions />, disabled: !canExport },
  ]}
/>
```

## API

### AccordionHeight

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| items (required) | `AccordionHeightItem[]` | — | The sections, in order. |
| type | `"single" \| "multiple"` | `"single"` | "single" keeps one item open at a time, "multiple" lets any number stay open. |
| value | `string[]` | — | Open item values (controlled). |
| defaultValue | `string[]` | `[]` | Item values open on first render (uncontrolled). |
| onValueChange | `(value: string[]) => void` | — | Called with the new list of open item values whenever an item opens or closes. |
| collapsible | `boolean` | `true` | In single mode, clicking the open item closes it. |
| variant | `"bordered" \| "separated" \| "ghost"` | `"bordered"` | "bordered": one card with dividers. "separated": a card per item. "ghost": dividers only. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | Opens or closes the focused section (native <button>). |
| ArrowDown / ArrowUp | Moves focus to the next or previous header, wrapping at the ends and skipping disabled items. |
| Home / End | Moves focus to the first or last enabled header. |
| Tab | Moves through headers and into the open panels' content. |

## Accessibility

- Each header is a native <button> inside an <h3>, with aria-expanded and aria-controls pointing at its panel while it is open (closed panels are not in the DOM).
- Open panels have role="region" and aria-labelledby set to their header, so screen readers name them.
- Closed panels are unmounted, so their content is out of the tab order and hidden from assistive tech.
- Icons and the chevron are aria-hidden; the title is the accessible name.

## Motion

- Panels animate height from 0 to auto on a spring (bounce 0, 0.38 s), so content of any height opens fully with no max-height hack.
- Opacity fades in over 0.22 s and out over 0.16 s; the content slides down 8px as it opens and up 6px as it closes.
- The chevron turns 180° on a spring (stiffness 420, damping 30); an icon tile switches to the primary color.
- separated: the open card gains a soft shadow (CSS, 300 ms).
- Reduced motion: every transition has duration 0, so panels open and close instantly without the slide.

## Notes for AI

- Pass items as { value, title, content } with unique string values; value and defaultValue are arrays of those strings, even in single mode.
- Panels unmount when closed: keep form or toggle state in a parent, or it resets each time the panel reopens.
- Headers render as <h3>; there is no prop for the heading level.
- Do not put buttons or links in title or description: they render inside the header <button>.
- For an Expand all control, use the controlled value with type="multiple".

## FAQ

**Why does content inside a panel lose its state when I close it?**

Closed panels are removed from the DOM so they leave the tab order. Lift the state into the parent, as the demo does with its switches.

**Can I open a section from outside, e.g. from a link?**

Yes. Pass value and onValueChange, then set the array to include that item's value.

## Related

- expandable-row-list: https://goodui.dev/components/lists/expandable-row-list
- tree-expand: https://goodui.dev/components/lists/tree-expand
- expandable-card: https://goodui.dev/components/cards/expandable-card
- tabs-indicator: https://goodui.dev/components/navigation/tabs-indicator

Last updated: 2026-11-02
