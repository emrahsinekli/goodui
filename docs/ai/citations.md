# Citations

> Inline numbered source chips that open a spring hover card with title, domain, snippet and date, a CitedText helper that turns [1] markers into chips, and a sources list whose row lights up when its chip is hovered.

Inline citations for AI answers in React: numbered source chips with hover cards and a sources list

Page: https://goodui.dev/components/ai/citations

## Install

```bash
npx shadcn@latest add @goodui/citations
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/citations.json`. The file lands in `components/goodui/citations.tsx`.

## When to use

- RAG or search-grounded answers where each claim points at a document, page or record.
- Answers that quote internal docs, policies or reports: the card shows the snippet without leaving the chat.
- A sources list under the answer, with the matching row lighting up when a chip is hovered.

## When not to use

- Academic footnotes in long documents: a footnote list at the end of the page reads better.
- A single link: a plain anchor.

## Pick by what matters

| Need | Use |
| --- | --- |
| Model output with [1] markers | <CitedText text={answer} /> |
| Hand-placed chips in JSX | <Cite n={2} /> anywhere inside <Citations> |
| Card below the chip | side="bottom" (it flips automatically near the top of the viewport) |
| Short list with Show all | <SourceList limit={3} /> |

## Usage

```tsx
import { Citations, CitedText, SourceList } from "@/components/goodui/citations"

<Citations sources={[
  { n: 1, title: "Deposits and no-show fees", url: "https://help.example.com/deposits", snippet: "New clients pay a 20% deposit…", date: "Oct 2026" },
  { n: 2, title: "No-show report, September–October", url: "https://reports.example.com/no-shows", date: "Nov 1, 2026" },
]}>
  <p><CitedText text="No-shows fell from 9 to 3 [2] after the deposit rule [1]." /></p>
  <SourceList limit={3} />
</Citations>
```

### Chips in your own markup

```tsx
<p>Deposits are refundable for 24 hours<Cite n={1} />, and reminders go out twice<Cite n={3} />.</p>
```

### Favicon per source

```tsx
{ n: 1, title: "Stripe docs", url: "https://docs.stripe.com/payments", icon: <img src="/favicons/stripe.png" alt="" /> }
```

## API

### Citations

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| sources (required) | `CitationSource[]` | — |  |
| labels | `Partial<CitationsLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

### Cite

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| n (required) | `number` | — | Source number, matching a source's `n`. |
| side | `"top" \| "bottom"` | `"top"` | Where the hover card opens. |

Also accepts every <element> attribute.

### CitedText

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| text (required) | `string` | — | Text with "[1]" style markers. |

Also accepts every <span> attribute.

### SourceList

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| limit | `number` | `3` | Rows shown before a "Show all" button. |
| hideTitle | `boolean` | `false` | Hide the "Sources" heading. |

Also accepts every <section> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Moves between chips; focusing a chip opens its card. |
| Enter | Opens the source URL in a new tab (chips with a URL are links); on a chip without a URL, Enter or Space opens the card. |
| Escape | Closes the card. |

## Accessibility

- Each chip is a link (new tab, rel="noreferrer") when the source has a URL, otherwise a <button>; both are labelled "Source n: title" and described by the open card (role="tooltip") through aria-describedby.
- The card opens on hover (mouse only) and focus, and closes on blur, Escape, scroll or resize.
- The sources list is an ordered list; rows with a URL are links named by their title, domain and date, with an "Open source" tooltip.
- Built-in strings go through the labels prop for translation.

## Motion

- The card scales from 0.94 at the chip's edge on a spring (stiffness 560, damping 32) and fades out in 120 ms; it is positioned fixed and clamped to the viewport.
- Source rows spring into place when the list expands; the hovered chip's row and number tile change color.
- Reduced motion: the card and rows fade only.

## Notes for AI

- Wrap the answer and the list in <Citations sources>. Source numbers (n) are what CitedText matches: [2] renders source n=2.
- CitedText only understands [n] markers. Convert other formats (【1】, ^1) before passing the text.
- A chip whose number has no matching source renders nothing.
- domain is derived from url when omitted; snippet, date and icon are optional.

## FAQ

**Why is the card positioned fixed?**

So it can escape chat containers with overflow hidden or scrolling. It closes on scroll instead of following the chip.

**Why is a chip sometimes a link and sometimes a button?**

With a URL it is a real link, so middle-click, copy link and screen readers' link lists work. Without one it is a button that only opens the card.

## Related

- chat-message: https://goodui.dev/components/ai/chat-message
- tooltip: https://goodui.dev/components/core/tooltip
- popover: https://goodui.dev/components/core/popover
- link: https://goodui.dev/components/core/link

Last updated: 2026-11-03
