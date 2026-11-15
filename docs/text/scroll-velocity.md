# Scroll velocity

> Rows of large text drift in opposite directions and speed up or flip with your scroll speed and direction.

Scroll velocity text for React and shadcn: marquee that speeds up with scroll

Page: https://goodui.dev/components/text/scroll-velocity

## Install

```bash
npx shadcn@latest add @goodui/scroll-velocity
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/scroll-velocity.json`. The file lands in `components/goodui/scroll-velocity.tsx`.

## When to use

- A bold band of large text between landing-page sections (services, cities, client types) that reacts to scrolling.
- Agency and portfolio sites where scroll-linked motion is part of the brand.
- Rows of custom content (logos, chips) that should drift and respond to scroll speed, using ScrollVelocityRow.

## When not to use

- A steady logo or testimonial ticker that should not react to scrolling: use marquee, which is CSS-only and pauses on hover.
- Inside dense app screens: moving text competes with the data. Use a static heading.
- Text people must read in full: it is constantly moving, so put essential copy in static text.

## Pick by what matters

| Need | Use |
| --- | --- |
| Rows of big words | ScrollVelocity with items={[…]} |
| Custom content per row (logos, chips) | ScrollVelocityRow with children |
| Calmer drift | baseVelocity={20} |
| Constant speed, no scroll reaction | velocityFactor={0} (or use marquee) |
| Inside a scrolling panel | scrollContainer={panelRef} |

## Usage

```tsx
import { ScrollVelocity } from "@/components/goodui/scroll-velocity"

export function ServicesBand() {
  return (
    <section className="overflow-hidden py-16">
      <ScrollVelocity
        items={["Deep cleans · Move-outs · Offices", "Windows · Carpets · Post-construction"]}
        baseVelocity={30}
        rowClassName="text-5xl font-bold tracking-tight sm:text-7xl"
      />
    </section>
  )
}
```

### A row of client logos with ScrollVelocityRow

```tsx
<ScrollVelocityRow baseVelocity={-25}>
  {logos.map((l) => (
    <img key={l.name} src={l.src} alt={l.name} className="mx-8 h-8 w-auto opacity-70" />
  ))}
</ScrollVelocityRow>
```

## API

### ScrollVelocity

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| items (required) | `string[]` | — | One string per row. Rows alternate direction. |
| baseVelocity | `number` | `40` | Pixels per second at rest. |
| scrollContainer | `React.RefObject<HTMLElement \| null>` | — | Scrollable element to track. Defaults to the window. |
| velocityFactor | `number` | `1` | How strongly scroll speed boosts the rows. 0 turns the effect off. |
| separator | `React.ReactNode` | `"·"` | Shown between repeats of a row. |
| rowClassName | `string` | — | Classes for every row, e.g. the font size and weight. |

Also accepts every <div> attribute.

### ScrollVelocityRow

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| children (required) | `React.ReactNode` | — | Content of one repeat; it is copied as many times as needed to fill the row. |
| baseVelocity | `number` | `40` | Pixels per second at rest. Negative moves to the right. |
| scrollContainer | `React.RefObject<HTMLElement \| null>` | — | Scrollable element to track. Defaults to the window. |
| velocityFactor | `number` | `1` | How strongly scroll speed boosts the row. 0 turns the effect off. |

Also accepts every <div> attribute.

## Accessibility

- ScrollVelocity puts all items once in an sr-only paragraph and marks the moving rows aria-hidden.
- ScrollVelocityRow alone marks only the extra copies aria-hidden; the first copy stays readable, so give images alt text.
- Reduced motion keeps rows still, so the text can be read.
- With scrollContainer, make that container keyboard-scrollable: tabIndex={0}, an aria-label (or role="region" with a name) and a visible focus ring.

## Motion

- Each row drifts at `baseVelocity` px per second (40); ScrollVelocity alternates direction per row. Positive values move left.
- Scroll speed is smoothed with a spring (damping 50, stiffness 400) and adds 5x the base speed per 1000 px/s of scroll, times `velocityFactor`; scrolling up flips the direction.
- Content is repeated enough times to cover the row plus one copy, and wraps seamlessly.
- Rows stop while off-screen. Reduced motion: rows do not move at all.

## Performance

- Moves one motion value per row on requestAnimationFrame (frame delta capped at 50 ms), so React does not re-render while it runs. A ResizeObserver recomputes the copy count.

## Notes for AI

- ScrollVelocity takes items (string[]), one row each; ScrollVelocityRow takes children.
- baseVelocity is px per second; negative values move to the right.
- Style the text size with rowClassName (ScrollVelocity) or className (ScrollVelocityRow).
- It tracks the window scroll by default; pass scrollContainer (a ref) when the page scrolls inside a div.

## FAQ

**Marquee or ScrollVelocity?**

Marquee is a steady CSS ticker that pauses on hover. ScrollVelocity is driven by JavaScript and reacts to scroll speed and direction.

**Can it track a scrolling div instead of the window?**

Yes, pass scrollContainer with a ref to that element.

## Related

- marquee: https://goodui.dev/components/backgrounds/marquee
- text-reveal: https://goodui.dev/components/text/text-reveal
- gradient-text: https://goodui.dev/components/text/gradient-text
- word-rotate: https://goodui.dev/components/text/word-rotate

Last updated: 2026-11-02
