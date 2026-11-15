# Pagination

> Outline, soft, ghost, pill, neo, minimal and carousel-dot pagination with a sliding active marker or press feedback, tones, sizes and shapes, plus first/last, range info, page-size select and jump-to-page.

Pagination for React and shadcn: sliding active page, rows per page, jump to page, carousel dots

Page: https://goodui.dev/components/core/pagination

## Install

```bash
npx shadcn@latest add @goodui/pagination
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/pagination.json`. The file lands in `components/goodui/pagination.tsx`.

## When to use

- Paging through a table of bookings, invoices or clients, with "21–30 of 248" and a rows-per-page select.
- Search or list pages where people jump to a page number: showJump.
- Compact "Page 3 of 12" controls in a card footer or a mobile view: variant="minimal".
- Dot indicators under a carousel or onboarding slides: variant="dots".

## When not to use

- Feeds where people just keep reading: load more on scroll or with a button instead of pages.
- A multi-step form: use stepper.
- Switching between a few named views: use tabs.

## Pick by what matters

| Need | Use |
| --- | --- |
| Data tables | variant="outline" (default) with totalItems, showInfo and showPageSize |
| Quiet pagination under a list | variant="ghost" or "soft" |
| Pages sitting in one rounded track | variant="pill" |
| Small spaces and mobile | variant="minimal" ("Page 3 of 12"), showJump makes the number editable |
| Carousels and slides | variant="dots" |
| Very long result sets | showFirstLast and showJump; siblings={2} shows more neighbours |
| Playful or retro brands | variant="neo" animation="press" |

## Usage

```tsx
import * as React from "react"
import { Pagination } from "@/components/goodui/pagination"

export function InvoicesFooter({ total }: { total: number }) {
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(25)

  return (
    <Pagination
      aria-label="Invoices pages"
      page={page}
      onPageChange={setPage}
      totalItems={total}
      pageSize={pageSize}
      onPageSizeChange={setPageSize}
      pageSizeOptions={[25, 50, 100]}
      showInfo
      showPageSize
      showLabels
    />
  )
}
```

### Minimal with editable page number

```tsx
<Pagination variant="minimal" totalPages={12} defaultPage={3} showJump size="sm" />
```

### Carousel dots

```tsx
<Pagination variant="dots" totalPages={slides.length} page={slide} onPageChange={setSlide} aria-label="Testimonials" />
```

### Translated

```tsx
<Pagination
  totalItems={248}
  showInfo
  labels={{
    previousPage: "Vorherige Seite",
    nextPage: "Nächste Seite",
    goToPage: (p) => `Seite ${p}`,
    range: (from, to, total) => `${from}–${to} von ${total}`,
  }}
/>
```

## API

### Pagination

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| page | `number` | — | Current page, 1-based (controlled). Clamped to 1…total. |
| defaultPage | `number` | `1` | Initial page when uncontrolled. |
| onPageChange | `(page: number) => void` | — | Called with the new 1-based page. |
| totalPages | `number` | `1` | Number of pages. Ignored when `totalItems` is set. |
| totalItems | `number` | — | Total rows; with `pageSize` it sets the page count and the "21–30 of 248" info. |
| pageSize | `number` | — | Rows per page (controlled). |
| defaultPageSize | `number` | `10` | Initial rows per page when uncontrolled. |
| onPageSizeChange | `(size: number) => void` | — | Called when the rows select changes; the page is adjusted to keep the first visible row. |
| pageSizeOptions | `number[]` | `[10, 25, 50, 100]` | Choices in the rows-per-page select. |
| siblings | `number` | `1` | Pages shown on each side of the current one. |
| boundaries | `number` | `1` | Pages always shown at the start and end. |
| variant | `"outline" \| "soft" \| "ghost" \| "pill" \| "neo" \| "minimal" \| "dots"` | `"outline"` | outline (default), soft, ghost, pill (pages in a track), neo, minimal ("Page 3 of 12") or dots (carousels). |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"primary"` | Color of the active page marker and focus rings. |
| animation | `"none" \| "slide" \| "press"` | `"slide"` | slide glides the active marker between pages; press shrinks buttons while pressed. |
| size | `"sm" \| "md" \| "lg"` | `"md"` |  |
| shape | `"rounded" \| "circle" \| "square"` | `"rounded"` | Button corners. The pill variant is always round. |
| showFirstLast | `boolean` | `false` | Adds first-page and last-page buttons. |
| showPrevNext | `boolean` | `true` | Shows the previous and next arrows. |
| showLabels | `boolean` | `false` | "Previous"/"Next" text next to the arrows (hidden on phones). |
| showInfo | `boolean` | `false` | "21–30 of 248" (with totalItems) or "Page 3 of 12". |
| showPageSize | `boolean` | `false` | Adds a rows-per-page select. |
| showJump | `boolean` | `false` | A "Go to" input. In the minimal variant the page number itself becomes editable. |
| labels | `Partial<PaginationLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <nav> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | Activates the focused page, arrow or "…" button (native <button>). |
| Enter | In the jump-to field, goes to the typed page (clamped to 1…total). In the minimal variant leaving the field also applies it. |
| Tab | Moves through the controls; focus rings show on keyboard focus only. |

## Accessibility

- A <nav> with aria-label "Pagination" (override with aria-label, recommended when a page has more than one).
- The current page button has aria-current="page" ("true" on dots). Every button has a name: "Page 4", "Next page", "Forward 3 pages", "Slide 2 of 5", all in labels.
- Under dir="rtl" the previous/next, first/last and skip icons are mirrored so they point the way the page list reads.
- Disabled arrows on the first and last page are real disabled buttons.
- The "21–30 of 248" text and the minimal "Page 3 of 12" sit in aria-live="polite" regions, so page changes are announced.
- The rows select is a native <select> inside a <label>; the jump field is a numeric input with aria-label "Go to page".

## Motion

- slide (default): the active marker glides to the new page as a shared layout element on a spring (stiffness 520, damping 40); on dots, the wide active dot travels and the window shifts.
- press: buttons shrink to 0.9 while pressed (neo pushes into its shadow). Colors change in 150 ms.
- The "…" buttons swap to a double arrow on hover or focus, showing they skip several pages.
- Reduced motion: the marker jumps, transitions are off and there is no press effect.

## Notes for AI

- Pages are 1-based. Use page + onPageChange (controlled) or defaultPage; the page is clamped to 1…total.
- Pass totalItems (with pageSize) for tables: it computes the page count and the range info. totalPages is ignored when totalItems is set.
- Changing page size keeps the first visible row on screen, so onPageChange can fire together with onPageSizeChange; handle both.
- "…" buttons are clickable and skip max(3, siblings × 2 + 3) pages. The page list keeps a constant length, so the control does not jump in width.
- Every built-in string is in labels (previous, nextPage, goToPage, range, pageOf, rows, goTo…); functions take numbers. The nav name comes from aria-label.

## FAQ

**Can I use it with server-side paging?**

Yes. Keep page in the URL or state, fetch on onPageChange and pass totalItems from your API's count. The component never slices data itself.

**Is paginationRange exported?**

Yes. paginationRange(page, total, siblings, boundaries) returns the numbers and "start-ellipsis" / "end-ellipsis" markers, if you want the same logic in your own markup.

## Related

- table-row-presence: https://goodui.dev/components/lists/table-row-presence
- segmented-control: https://goodui.dev/components/navigation/segmented-control
- select: https://goodui.dev/components/core/select
- tabs: https://goodui.dev/components/core/tabs

Last updated: 2026-11-02
