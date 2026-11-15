# Treemap

> Squarified treemap whose tinted tiles fade in largest first and spring to a new layout when values change, with labels only where they fit, a tooltip and arrow-key tiles.

Animated squarified treemap for React and shadcn: tiles re-pack on a spring when values change

Page: https://goodui.dev/components/charts/treemap

## Install

```bash
npx shadcn@latest add @goodui/treemap
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/treemap.json`. The file lands in `components/goodui/treemap.tsx`.

## When to use

- A breakdown with more parts than a donut can hold (6–15): revenue by category, traffic by source, storage by folder.
- Comparing one period with another: switch the data and the tiles re-pack in place.
- Space-efficient part-to-whole on dashboards and phones.

## When not to use

- Exact comparisons of similar values: areas are hard to compare; use a ranked bar-chart.
- Up to five parts: donut-chart reads faster.
- Hierarchies with several levels: this treemap is one level.

## Pick by what matters

| Need | Use |
| --- | --- |
| Money breakdown | data={[{ label, value }]} format={{ style: "currency", currency: "USD" }} |
| Shares instead of values on the tiles | showShare showValues={false} |
| Compact | height={160} radius={4} gap={2} |

## Usage

```tsx
import { Treemap } from "@/components/goodui/treemap"

export function RevenueByCategory({ period }: { period: "this" | "last" }) {
  const data = period === "this" ? thisMonth : lastMonth // [{ label: "Hair", value: 24800 }, …]
  return <Treemap title="Revenue by category" data={data} height={240} format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} />
}
```

### Traffic sources with shares

```tsx
<Treemap title="Booking page traffic" data={traffic} height={160} showShare showValues={false} radius={4} />
```

## API

### Treemap

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| data (required) | `TreemapItem[]` | — |  |
| title | `React.ReactNode` | — | Chart name for screen readers and the table caption. |
| height | `number` | `240` | Height in px. The width follows the container. |
| gap | `number` | `3` | Surface gap between tiles in px. |
| radius | `number` | `6` |  |
| showValues | `boolean` | `true` | Print each tile's value under its label when there is room. |
| showShare | `boolean` | `false` | Print each tile's share instead of (or next to) the value. |
| format | `Intl.NumberFormatOptions` | — |  |
| locale | `string` | `"en-US"` |  |
| formatValue | `(value: number) => string` | — |  |
| duration | `number` | `0.8` | Seconds the layout takes to settle in; tiles stagger by 40 ms. |
| labels | `Partial<TreemapLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Focuses the treemap and highlights the largest tile. |
| Arrow keys | Cycles tiles in size order. |
| Home / End | Largest or smallest tile. |
| Escape | Clears the highlight. |

## Accessibility

- The chart is role="group" with aria-roledescription="treemap" and a summary ("Revenue by category: 7 items, total $65,100").
- A screen-reader-only table lists label, value and share for every item, including tiles too small for a printed label.
- The highlighted tile is announced as "<label>: <value>, <share>" through a polite live region and shown in a tooltip.
- Tiles are tinted (22% of the hue over the card) with a solid color bar on top, so labels stay in the foreground text color on both themes.
- Labels print only when they fit with padding; values print only when the tile is tall enough. Nothing is clipped.

## Motion

- On first view tiles fade and scale in from 85% (duration 0.8 s, ease [0.16, 1, 0.3, 1]) 40 ms apart, largest first.
- When values change the tiles move and resize on a spring (stiffness 170, damping 26); labels travel with their tiles. A container resize re-packs instantly.
- Hovering or arrowing to a tile deepens its tint to 34% and outlines it.
- Reduced motion: tiles appear in place; re-packs are instant.

## Performance

- Squarify runs once per render in O(n log n); each tile is a translated group with two rects, so re-packs animate eight numbers per tile.

## Notes for AI

- Items with value ≤ 0 are left out. Items are sorted by value, so order in data does not matter.
- Colors default to --chart-1 … --chart-5 by size order, then lighter tints of the same five; set color per item to pin a hue to an entity.
- The width follows the parent; height is a px prop. Labels assume roughly 6.6px per character at 12px text.

## FAQ

**Does it support nested groups?**

No; it lays out one level. Group your data before passing it, or render one treemap per group.

**Why do small tiles have no text?**

A label that does not fit is not drawn (never clipped); the tooltip, live region and table carry the value.

## Related

- donut-chart: https://goodui.dev/components/charts/donut-chart
- bar-chart: https://goodui.dev/components/charts/bar-chart
- heatmap: https://goodui.dev/components/charts/heatmap

Last updated: 2026-11-03
