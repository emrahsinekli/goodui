# Breadcrumb

> Slash, chevron, dot, pill, arrow-step and underline trails with four current-page styles, tones, sizes, a staggered fade or sliding hover underline, and long trails that collapse into a keyboard-friendly menu.

Breadcrumb for React and shadcn: collapsible trail, pill and arrow-step styles, next/link support

Page: https://goodui.dev/components/core/breadcrumb

## Install

```bash
npx shadcn@latest add @goodui/breadcrumb
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/breadcrumb.json`. The file lands in `components/goodui/breadcrumb.tsx`.

## When to use

- Showing where a page sits in a hierarchy and linking back up: Clients / Maya Chen / Invoices / INV-0042.
- Deep admin pages where the middle of the trail should collapse into a "…" menu on small screens: maxItems.
- A short, fixed flow shown as connected segments (Cart → Details → Payment): variant="arrow-steps".

## When not to use

- A multi-step form where steps have states (done, current, error): use stepper.
- Top-level navigation between sections of the app: use tabs or bottom-nav.
- Pages that are not in a hierarchy (a flat list of settings): a page heading is enough.

## Pick by what matters

| Need | Use |
| --- | --- |
| Default app header | variant="chevron" current="bold" (defaults) |
| File-path or URL-like trails | variant="slash" |
| Very light trails in dense UIs | variant="dot" size="sm" |
| Chips or filter-like trails | variant="pill" with current="tone" or "badge" |
| Short linear flow | variant="arrow-steps" |
| Long trails on mobile | maxItems={3} (keeps the first item and the last two) |
| Hover feedback on links | animation="underline"; animation="fade" staggers the crumbs in on mount |

## Usage

```tsx
import Link from "next/link"
import { Home } from "lucide-react"
import { Breadcrumb } from "@/components/goodui/breadcrumb"

export function InvoiceBreadcrumb() {
  return (
    <Breadcrumb
      linkAs={Link}
      maxItems={4}
      items={[
        { label: "Dashboard", href: "/", icon: <Home /> },
        { label: "Clients", href: "/clients" },
        { label: "Maya Chen", href: "/clients/maya-chen" },
        { label: "Invoices", href: "/clients/maya-chen/invoices" },
        { label: "INV-0042" },
      ]}
    />
  )
}
```

### Arrow steps

```tsx
<Breadcrumb
  variant="arrow-steps"
  tone="success"
  items={[{ label: "Service", href: "/book" }, { label: "Time", href: "/book/time" }, { label: "Details" }]}
/>
```

### Client-side navigation without hrefs

```tsx
<Breadcrumb
  variant="pill"
  current="badge"
  items={[
    { label: "Reports", onClick: () => setView("reports") },
    { label: "Revenue", onClick: () => setView("revenue") },
    { label: "October" },
  ]}
/>
```

## API

### Breadcrumb

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| items (required) | `BreadcrumbItem[]` | — | The trail, root first. The last item is the current page. |
| variant | `"slash" \| "chevron" \| "dot" \| "pill" \| "arrow-steps" \| "underline"` | `"chevron"` | Separator and crumb style: slash, chevron (default), dot, pill, arrow-steps or underline. |
| tone | `"primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"primary"` | Color of the current item (tone and badge styles), pill and arrow-step highlights, and focus rings. |
| size | `"sm" \| "md" \| "lg"` | `"md"` |  |
| current | `"bold" \| "muted" \| "tone" \| "badge"` | `"bold"` | Style of the current (last) item. |
| animation | `"none" \| "fade" \| "underline"` | `"none"` | fade staggers the crumbs in on mount; underline grows an underline under hovered links. |
| maxItems | `number \| string` | `0` | Collapse the middle into a "…" menu when there are more items than this. 0 never collapses. Numeric strings work too. |
| itemsBeforeCollapse | `number` | `1` | Items kept before the "…" when collapsed. |
| itemsAfterCollapse | `number` | `2` | Items kept after the "…" when collapsed (including the current page). |
| separator | `React.ReactNode` | — | Custom separator, replaces the variant's. |
| linkAs | `React.ElementType` | — | Link component, e.g. next/link. Receives href, className and children. |
| labels | `Partial<BreadcrumbLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <nav> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter / Space | Follows a link or opens the "…" menu. |
| Arrow Down | On the "…" button, opens the menu. Inside the menu, moves to the next hidden page (wraps). |
| Arrow Up | Moves to the previous hidden page in the menu (wraps). |
| Home / End | Moves to the first or last hidden page in the menu. |
| Escape | Closes the menu and returns focus to the "…" button. |
| Tab | Closes the menu and continues to the next focusable element. |

## Accessibility

- A <nav> with aria-label "Breadcrumb" (override with aria-label) around an ordered list.
- The last item is the current page: it renders as text with aria-current="page", even if it has an href.
- Separators are aria-hidden list items with role="presentation", so screen readers only read the pages.
- The "…" button has aria-haspopup="menu", aria-expanded and aria-label "Show 3 more"; the menu is role="menu" named "Hidden pages". Translate both with labels.showMore and labels.hiddenPages.
- RTL-ready: under dir="rtl" chevrons and arrow-step shapes mirror, the menu opens from the start edge and the fade entrance slides the other way.
- Opening the menu focuses its first item; clicking outside closes it.

## Motion

- fade: crumbs slide in 6px and fade over 400 ms on mount, 55 ms apart.
- underline: an underline grows under the hovered link in 280 ms (variant="underline" already shows static underlines and skips it).
- The "…" menu fades, drops 4px and scales from 0.97 in 160 ms.
- Reduced motion: no entrance, no underline growth and no transitions; the menu appears instantly.

## Notes for AI

- Pass the whole trail in items, root first; the last item is always the current page. Do not render separators yourself.
- Use linkAs={Link} for next/link or react-router; it receives href, onClick, className and children. Items without href but with onClick render as <button>.
- maxItems collapses only when items.length is above it and above itemsBeforeCollapse + itemsAfterCollapse (defaults 1 and 2).
- separator replaces the variant's separator for every gap; arrow-steps has no separators.
- labels={{ showMore: (n) => `${n} weitere anzeigen`, hiddenPages: "Ausgeblendete Seiten" }} translates the menu; the nav name comes from aria-label.

## FAQ

**How do I use it with Next.js?**

Import Link from next/link and pass linkAs={Link}. Every crumb with an href renders through it, including the links in the "…" menu.

**Can I show a long trail on mobile?**

Set maxItems. The middle collapses into a "…" button that opens a keyboard-friendly menu, and long labels are truncated at 16rem.

## Related

- stepper: https://goodui.dev/components/navigation/stepper
- tabs: https://goodui.dev/components/core/tabs
- link: https://goodui.dev/components/core/link
- separator: https://goodui.dev/components/core/separator

Last updated: 2026-11-02
