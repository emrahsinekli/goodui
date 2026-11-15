# Chart legend

> Shared interactive legend: aria-pressed toggle buttons with popping square, dot, line or dashed swatches, hidden-state strike-through, optional values and a hover channel that highlights a series in its chart.

Interactive chart legend for React and shadcn: toggle series with aria-pressed buttons and hover sync

Page: https://goodui.dev/components/charts/chart-legend

## Install

```bash
npx shadcn@latest add @goodui/chart-legend
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/chart-legend.json`. The file lands in `components/goodui/chart-legend.tsx`.

## When to use

- Any chart with two or more series; the goodui line, bar, donut and radial charts render it for you.
- A legend placed away from its chart (in a card header) that still toggles and highlights series.
- A plain key with values ("Card 58%") under a custom visual.

## When not to use

- A single series: the chart title names it; a one-swatch legend only costs space.
- Status meanings (healthy / critical): those need an icon and label, not a series key.

## Pick by what matters

| Need | Use |
| --- | --- |
| Toggle series | hidden + onHiddenChange (or defaultHidden); items become aria-pressed buttons |
| Highlight on hover | active + onActiveChange, mirror it into the chart |
| Static key with numbers | items with value, no handlers |
| Match the mark | shape="line" / "dashed" for lines, "square" for bars and areas, "dot" for points |

## Usage

```tsx
import { ChartLegend } from "@/components/goodui/chart-legend"
import { LineChart } from "@/components/goodui/line-chart"

export function ChannelsCard() {
  const [hidden, setHidden] = React.useState<string[]>([])
  const [active, setActive] = React.useState<string | null>(null)
  const items = series.map((s, i) => ({ key: s.key, label: s.label, color: `var(--chart-${i + 1})`, shape: "line" as const }))
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">Bookings by channel</h3>
        <ChartLegend items={items} hidden={hidden} onHiddenChange={setHidden} active={active} onActiveChange={setActive} size="sm" />
      </div>
      <LineChart categories={weeks} series={series} hidden={hidden} onHiddenChange={setHidden} legend="none" />
    </div>
  )
}
```

### Static key with shares

```tsx
<ChartLegend layout="column" shape="dot" items={[{ key: "card", label: "Card", color: "var(--chart-1)", value: "58%" }, { key: "cash", label: "Cash", color: "var(--chart-3)", value: "13%" }]} />
```

### Translated tooltips

```tsx
<ChartLegend items={items} defaultHidden={[]} labels={{ legend: "Reihen", toggle: (label, hidden) => (hidden ? `${label} einblenden` : `${label} ausblenden`) }} />
```

## API

### ChartLegend

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| items (required) | `ChartLegendItem[]` | — |  |
| hidden | `string[]` | — | Keys of hidden items (controlled). |
| defaultHidden | `string[]` | — | Hidden keys to start with when uncontrolled. |
| onHiddenChange | `(hidden: string[]) => void` | — | Called with the new hidden keys after a toggle. |
| interactive | `boolean` | — | Items toggle on click, Enter and Space. On by default when hidden, defaultHidden or onHiddenChange is set. |
| active | `string \| null` | — | Key of the highlighted item (controlled hover sync). |
| onActiveChange | `(key: string \| null) => void` | — | Called when the pointer or focus enters an item (key) or leaves (null). |
| shape | `"square" \| "dot" \| "line" \| "dashed"` | `"square"` | Swatch shape: square for bars and areas, line or dashed for lines, dot for points. |
| layout | `"row" \| "column"` | `"row"` |  |
| align | `"start" \| "center" \| "end"` | `"start"` |  |
| size | `"sm" \| "md"` | `"md"` |  |
| labels | `Partial<ChartLegendLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Moves between legend buttons (interactive legends only). |
| Enter / Space | Hides or shows that series. |

## Accessibility

- Interactive items are real buttons with aria-pressed (true = shown); their accessible name is the visible label (and value), and labels.toggle supplies the title tooltip ("Hide Revenue" / "Show Revenue"). The group is labelled by labels.legend.
- Static legends are a list (role="list" / "listitem").
- Hidden items keep their text with a strike-through and a hollow swatch; colors are never the only state cue.
- Focus shows the ring token; hovering or focusing an item reports it through onActiveChange so charts can highlight it.

## Motion

- Toggling a swatch scales it to 85% with an overshooting ease (0.3 s, cubic-bezier(.3,1.5,.5,1)); pressing a button squeezes its swatch to 80%. Text and swatch colors transition over 0.2 s. Pure CSS.
- Reduced motion: no scale, no transitions.

## Notes for AI

- The legend does not hide anything by itself: mirror `hidden` into the chart's hidden prop (the goodui charts accept the same string[]).
- Keys must match the chart's series keys. Colors are the series colors (CSS values), not Tailwind classes.
- A legend is interactive when hidden, defaultHidden or onHiddenChange is given, or interactive is true.

## FAQ

**Can I use it with Recharts or another library?**

Yes; it is a plain React component. Keep hidden in state and filter your series with it.

## Related

- line-chart: https://goodui.dev/components/charts/line-chart
- bar-chart: https://goodui.dev/components/charts/bar-chart
- donut-chart: https://goodui.dev/components/charts/donut-chart
- radial-progress: https://goodui.dev/components/charts/radial-progress

Last updated: 2026-11-03
