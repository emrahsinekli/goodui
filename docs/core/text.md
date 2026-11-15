# Text

> Every body-copy role in one primitive: paragraph, lead, small, caption, overline, eyebrow pill, quote with attribution and inline code, with tones, readable measures, truncate or line clamp, and on-view entrances.

Text and typography component for React and shadcn: lead, caption, eyebrow, quote and line clamp

Page: https://goodui.dev/components/core/text

## Install

```bash
npx shadcn@latest add @goodui/text
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/text.json`. The file lands in `components/goodui/text.tsx`.

## When to use

- Every piece of body copy, so paragraphs, leads, captions and small print share one scale and one set of colors.
- The small labels around a title: an overline ("PRICING") or an eyebrow pill ("New · SMS reminders").
- Testimonials and pull quotes with attribution: variant="quote".
- Previews that must stay short: truncate for one line, lineClamp for a few.

## When not to use

- Titles and section headings: use heading.
- A status or count chip: use badge; an eyebrow is a label, not a status.
- Code blocks with several lines: use a <pre> with your highlighter; variant="code" is for inline snippets.

## Pick by what matters

| Need | Use |
| --- | --- |
| Body copy | variant="paragraph" (default) with measure="normal" for readable lines |
| Intro under a hero heading | variant="lead" |
| Helper text, timestamps, footnotes | variant="caption" or "small" |
| Label above a section title | variant="overline" or "eyebrow" (pill with a dot) |
| Testimonial | variant="quote" with attribution |
| Inline code, keys, IDs | variant="code" (renders <code>) |
| Card previews and table cells | truncate or lineClamp={2} |
| Colored meaning (error, success text) | tone="danger" \| "success" \| "warning" \| "info" |

## Usage

```tsx
import { Heading } from "@/components/goodui/heading"
import { Text } from "@/components/goodui/text"

export function PricingIntro() {
  return (
    <header className="flex flex-col items-center gap-4 text-center">
      <Text variant="eyebrow" tone="success">
        New · Two-way SMS reminders
      </Text>
      <Heading as="h2" size="2xl" align="center">
        Simple pricing for busy studios
      </Heading>
      <Text variant="lead" measure="narrow" align="center" animation="fade-up">
        One plan per location. Unlimited bookings, deposits and <mark>no per-seat fees</mark>.
      </Text>
    </header>
  )
}
```

### Testimonial

```tsx
<Text variant="quote" tone="primary" attribution="Maya Chen, owner of Glow Studio">
  No-shows dropped by half in the first month. The deposit step paid for itself.
</Text>
```

### Clamped note in a card

```tsx
<Text variant="small" tone="muted" lineClamp={2}>
  Client prefers Maya, sensitive scalp, patch test 48 hours before any color service. Parking at the back entrance.
</Text>
```

### Inline code and error text

```tsx
<Text variant="small">
  Your API key starts with <code>pk_live_</code>.
</Text>
<Text variant="caption" tone="danger" role="alert">
  The webhook URL must start with https://
</Text>
```

## API

### Text

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| variant | `"paragraph" \| "lead" \| "small" \| "caption" \| "overline" \| "eyebrow" \| "quote" \| "code"` | `"paragraph"` | Text role; sets the default element, size, weight, font and color. |
| as | `"p" \| "span" \| "div" \| "blockquote" \| "figcaption" \| "label" \| "code" \| "small" \| "li" \| "strong" \| "em"` | — | Element to render. Defaults per variant (p, blockquote for quote, code for code). |
| tone | `"auto" \| "default" \| "muted" \| "primary" \| "neutral" \| "success" \| "warning" \| "danger" \| "info"` | `"auto"` | Color: auto keeps the variant's color; default and muted use theme text colors; the rest are accent tones (also color <mark>). |
| size | `"auto" \| "xs" \| "sm" \| "base" \| "lg" \| "xl" \| "2xl"` | `"auto"` | Font size; auto uses the variant's. |
| weight | `"auto" \| "normal" \| "medium" \| "semibold" \| "bold"` | `"auto"` | Font weight; auto uses the variant's. |
| font | `"auto" \| "sans" \| "serif" \| "mono"` | `"auto"` | Font family; serif and mono use --font-serif and --font-mono. auto uses the variant's. |
| measure | `"none" \| "narrow" \| "normal" \| "wide"` | `"none"` | Max line length: narrow 45ch, normal 65ch, wide 80ch. |
| align | `"start" \| "center" \| "end" \| "justify"` | `"start"` | Text alignment (start and end follow the writing direction). |
| truncate | `boolean` | — | Single line with an ellipsis. |
| lineClamp | `number \| "none" \| "1" \| "2" \| "3" \| "4" \| "5" \| "6"` | `"none"` | Clamp to N lines with an ellipsis. |
| animation | `"none" \| "fade-in" \| "fade-up" \| "blur-in" \| "reveal"` | `"none"` | Entrance animation, played once when the text scrolls into view. |
| attribution | `React.ReactNode` | — | Quote variant: who said it. |
| ref | `React.Ref<HTMLElement>` | — |  |

Also accepts every <element> attribute.

## Accessibility

- Renders a semantic element per variant: <p> by default, <blockquote> for quote with a <cite> for attribution, <code> for code. Override with as (span, div, label, li, figcaption…).
- <mark> inside the text gets a tone-colored marker but stays a real <mark>.
- truncate and lineClamp only hide overflow visually; the full text is still in the DOM, so add a title or a way to read the rest when it matters.
- Tones only change color; for errors also add context (an icon or role="alert" where it should be announced).

## Motion

- Entrances play once when 20% of the text is in view: fade-in (700 ms), fade-up rises 10px (700 ms), blur-in from an 8px blur (800 ms), reveal wipes in from the start edge (left, or right under dir="rtl") (900 ms).
- Reduced motion: no entrance; the text is visible immediately.

## Notes for AI

- Pick the role with variant and leave size, weight and font on "auto"; they follow the variant. Override only when the design needs it.
- tone="auto" keeps the variant's natural color (lead, caption and overline are muted). Use tone="muted" or an accent tone instead of text-muted-foreground or text-red-500 classes.
- attribution only renders with variant="quote"; it is added inside the blockquote with an em dash.
- lineClamp takes a number (or "1"…"6"); truncate wins when both are set. measure caps the width at 45, 65 or 80ch.
- Animated text starts invisible until it scrolls into view, so avoid animation on text above the fold in app UI. There is no built-in text, so no labels prop.

## FAQ

**Can I use my serif and mono fonts?**

Yes. The quote variant and font="serif" use --font-serif, code and font="mono" use --font-mono, with system fallbacks.

**Does it replace shadcn's typography classes?**

It covers the same roles (p, lead, small, muted, blockquote, inline code) as one component with props, plus caption, overline, eyebrow, clamping and entrances.

## Related

- heading: https://goodui.dev/components/core/heading
- badge: https://goodui.dev/components/core/badge
- link: https://goodui.dev/components/core/link
- kbd: https://goodui.dev/components/core/kbd

Last updated: 2026-11-02
