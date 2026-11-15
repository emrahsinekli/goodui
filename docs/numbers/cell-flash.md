# Cell flash

> Wraps a table value and briefly flashes it green when it rises, red when it falls, with a fading ▲/▼, like a trading terminal.

Flash table cell on value change in React: green up, red down, like a trading terminal

Page: https://goodui.dev/components/numbers/cell-flash

## Install

```bash
npx shadcn@latest add @goodui/cell-flash
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/cell-flash.json`. The file lands in `components/goodui/cell-flash.tsx`.

## When to use

- Live tables (revenue per staff member, order counts, prices) where you want the eye drawn to what just changed.
- Totals that update from a websocket or polling, to show the direction of the change at a glance.
- Status columns (strings) that should blink when they change, without implying up or down.

## When not to use

- A big hero number that should animate its digits: use number-flow.
- Showing the size of a change persistently (+12.4%): use delta-badge.
- Values that change many times a second: the flashes overlap into noise; throttle the updates first or show a sparkline-draw.

## Pick by what matters

| Need | Use |
| --- | --- |
| Numbers that rise and fall | value={n} (direction is computed) |
| Formatted display | value={n} with children={usd.format(n)} |
| Text status that changed | value={status} (flashes neutral sky blue) |
| Direction known from the server | direction="up" \| "down" \| "neutral" |
| Calmer table | indicator={false} or a shorter duration |

## Usage

```tsx
import { CellFlash } from "@/components/goodui/cell-flash"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

type Staff = { name: string; bookings: number; revenue: number }

export function StaffToday({ rows }: { rows: Staff[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Staff</TableHead>
          <TableHead className="text-right">Bookings</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.name}>
            <TableCell>{r.name}</TableCell>
            <TableCell className="text-right">
              <CellFlash value={r.bookings} />
            </TableCell>
            <TableCell className="pr-6 text-right font-medium">
              <CellFlash value={r.revenue}>{usd.format(r.revenue)}</CellFlash>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

### Status text and a forced direction

```tsx
<CellFlash value={order.status}>{order.status}</CellFlash>
<CellFlash value={price.updatedAt} direction={price.change > 0 ? "up" : "down"} duration={600}>
  {price.formatted}
</CellFlash>
```

## API

### CellFlash

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| value (required) | `number \| string` | — | The value to watch. Numbers flash green when they rise and red when they fall; other values flash neutral. |
| children | `React.ReactNode` | — | Rendered content. Defaults to the value. |
| direction | `"up" \| "down" \| "neutral"` | — | Force a direction instead of comparing with the previous value. |
| duration | `number` | `900` | Flash length in ms. |
| indicator | `boolean` | `true` | Show a small ▲/▼ that fades out with the flash. |

Also accepts every <span> attribute.

## Accessibility

- The flash background and the ▲/▼ arrow are aria-hidden; screen readers only read the content, and changes are not announced.
- Direction is shown by color and by the arrow; turn indicator off only where the color alone is acceptable.

## Motion

- On each change a tinted background fades from full to zero over duration (default 900 ms) on a cubic-bezier(.3,0,.4,1).
- The ▲ or ▼ slides 3px into place (from below for up, from above for down), holds, then fades out within the same duration.
- Nothing flashes on mount or when a re-render passes the same value.
- Reduced motion: the arrow only fades, without sliding; the background fade stays because it is opacity only.

## Performance

- Pure CSS animations keyed by a change counter; no timers or JavaScript per frame. The flash and arrow are absolutely positioned, so they never shift the table layout.

## Notes for AI

- Pass the raw number to value and the formatted text as children; with only a formatted string as value it cannot tell up from down.
- Strings and mixed types flash neutral (sky); only number-to-number changes get green or red.
- The wrapper has -mx-1.5 px-1.5 so the highlight extends past the text without moving it; do not remove that padding in tight cells.
- Keep the row key stable (an id, not the index) so a re-sort does not make every cell flash.

## FAQ

**Can I change the colors?**

They are emerald, rose and sky with dark-mode shades, in the BG and FG maps at the top of the installed file.

**Where does the arrow go?**

Just after the value, absolutely positioned outside the text box, so it never pushes the layout. Leave a little end padding in the cell for it.

## Related

- delta-badge: https://goodui.dev/components/numbers/delta-badge
- number-flow: https://goodui.dev/components/numbers/number-flow
- table-row-presence: https://goodui.dev/components/lists/table-row-presence
- sparkline-draw: https://goodui.dev/components/numbers/sparkline-draw

Last updated: 2026-11-02
