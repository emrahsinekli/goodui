# Link

> Inline link with seven underline styles (static, slide-in, grow from center, marker sweep, nudging arrow), line decorations, tones, leading icons and automatic external-link handling. Works with next/link via as.

Animated link for React and shadcn: sliding underline, marker highlight, arrow and next/link support

Page: https://goodui.dev/components/core/link

## Install

```bash
npx shadcn@latest add @goodui/link
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/link.json`. The file lands in `components/goodui/link.tsx`.

## When to use

- Inline links in body copy, help text and footers that should match the theme instead of the browser default.
- "Learn more", "View all bookings" and other call-to-action text links: underline="arrow".
- Links to other sites: http(s) URLs open in a new tab with a ↗ icon and screen-reader text automatically.
- Navigation links in a header or footer with a hover effect: slide or grow-center.

## When not to use

- Actions that do not navigate (save, delete, open a dialog): use button, or button with variant="link" for the look.
- A trail of parent pages: use breadcrumb.
- A copy-to-clipboard value: use copy-button.

## Pick by what matters

| Need | Use |
| --- | --- |
| Links inside paragraphs | underline="always" (readable without hover) with tone="inherit" or "primary" |
| Quiet links in footers and meta text | tone="muted" underline="hover" |
| Header navigation | underline="slide" or "grow-center", tone="neutral" |
| "Learn more" call to action | underline="arrow" |
| Playful marketing copy | underline="highlight" (marker fills the text on hover) |
| Glossary terms and definitions | underline="always" decoration="dotted" |

## Usage

```tsx
import NextLink from "next/link"
import { Link } from "@/components/goodui/link"
import { Text } from "@/components/goodui/text"

export function DepositNote() {
  return (
    <div className="flex flex-col gap-2">
      <Text variant="small" tone="muted">
        Deposits are refunded automatically when a client cancels more than 24 hours ahead. Read the{" "}
        <Link as={NextLink} href="/help/deposits" underline="always" tone="inherit">
          deposit policy
        </Link>{" "}
        or check{" "}
        <Link href="https://stripe.com/docs/refunds" underline="always" tone="inherit">
          Stripe's refund guide
        </Link>
        .
      </Text>
      <Link as={NextLink} href="/settings/payments" underline="arrow" size="sm">
        Set up deposits
      </Link>
    </div>
  )
}
```

### Header navigation

```tsx
<nav className="flex gap-6 text-sm">
  <Link as={NextLink} href="/features" tone="neutral" underline="slide">Features</Link>
  <Link as={NextLink} href="/pricing" tone="neutral" underline="slide">Pricing</Link>
  <Link as={NextLink} href="/changelog" tone="neutral" underline="slide">Changelog</Link>
</nav>
```

### With a leading icon

```tsx
<Link href="mailto:support@glowstudio.com" iconLeft={<Mail />} tone="muted">
  support@glowstudio.com
</Link>
```

## API

### Link

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| underline | `"none" \| "always" \| "hover" \| "slide" \| "grow-center" \| "highlight" \| "arrow"` | `"hover"` | none, always, hover (static) or an animated effect: slide, grow-center, highlight (marker fill), arrow. |
| decoration | `"solid" \| "dotted" \| "dashed" \| "wavy"` | `"solid"` | Line style for underline="always" and "hover". |
| tone | `"inherit" \| "muted" \| "primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"primary"` | Link color; inherit follows the surrounding text, muted brightens on hover. |
| weight | `"inherit" \| "normal" \| "medium" \| "semibold" \| "bold"` | `"medium"` | Font weight; inherit keeps the parent's. |
| size | `"inherit" \| "xs" \| "sm" \| "base" \| "lg"` | `"inherit"` | Font size; inherit keeps the parent's. |
| external | `boolean` | — | Opens in a new tab with an icon. Defaults to true for absolute http(s) URLs. |
| externalIcon | `boolean` | `true` | Show the ↗ icon on external links. |
| iconLeft | `React.ReactNode` | — | Icon before the text, sized to 1em. |
| as | `React.ElementType` | — | Render another element, e.g. next/link. It receives href, className and the rest. |
| labels | `Partial<LinkLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <a> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Enter | Follows the link (native <a>, or your router's link through as). |
| Tab | Moves focus; a tone-colored outline shows on keyboard focus, and slide, grow-center, highlight and arrow play their hover effect on focus too. |

## Accessibility

- Renders a real <a> (or the element passed in as), so middle-click, open in new tab and prefetching keep working.
- External links get target="_blank", rel="noopener noreferrer" and a visually hidden " (opens in a new tab)". Translate it with labels={{ newTab: "…" }}.
- The arrow, ↗ icon and iconLeft are aria-hidden; the link text carries the meaning.
- underline="always" is the safest choice inside paragraphs, because the link does not rely on color alone.

## Motion

- slide: an underline grows from the start edge (left, or right under dir="rtl") in 380 ms on hover or focus and retracts toward the end. grow-center grows from the middle.
- highlight: a thin marker under the text fills the whole line height in 300 ms.
- arrow: the arrow nudges forward by 0.22em in 250 ms. External icons move up and outward on hover. Under dir="rtl" the arrow and ↗ icon are mirrored and move the other way.
- Reduced motion: no transitions; hover states switch instantly.

## Notes for AI

- For Next.js pass as={NextLink} (import NextLink from "next/link"); do not wrap Link in another <a> or <Link>. TextLink is the same component, exported for files that already import next/link as Link.
- Default is underline="hover" tone="primary" weight="medium". Use tone="inherit" to take the color of the surrounding text.
- external is detected from absolute http(s) or protocol-relative hrefs; pass external={false} for your own domain or externalIcon={false} to hide only the icon. target and rel you pass win.
- underline="arrow" replaces the external icon. Pass leading icons through iconLeft, not children, so they stay aligned.
- decoration (solid, dotted, dashed, wavy) only affects underline="always" and "hover".
- labels={{ newTab }} translates the screen-reader note on external links (default "(opens in a new tab)").

## FAQ

**Why does my link open in a new tab?**

Its href starts with http://, https:// or //, so it is treated as external. Pass external={false} for links to your own site with full URLs.

**Does the arrow wrap onto its own line?**

No. With string children, the last word and the arrow (or ↗ icon) are kept together with white-space: nowrap.

## Related

- button: https://goodui.dev/components/core/button
- breadcrumb: https://goodui.dev/components/core/breadcrumb
- text: https://goodui.dev/components/core/text
- highlighter: https://goodui.dev/components/text/highlighter

Last updated: 2026-11-02
