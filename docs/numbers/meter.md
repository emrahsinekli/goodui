# Usage meter

> Labeled usage meter like "SMS credits 7,420 / 10,000" whose fill springs to the new value and shifts to amber and rose near the limit, with optional per-seat segments.

Usage meter for React and shadcn: plan limits bar that turns amber and red near the limit

Page: https://goodui.dev/components/numbers/meter

## Install

```bash
npx shadcn@latest add @goodui/meter
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/meter.json`. The file lands in `components/goodui/meter.tsx`.

## When to use

- Plan limits on a billing or settings page: "SMS credits 7,420 / 10,000", storage in GB, API calls.
- Seat usage, where segments={seats} shows one block per seat.
- Any measured amount within a known range where getting close to the limit matters.

## When not to use

- Progress of a task that finishes (upload, import, onboarding): use progress, which uses role="progressbar".
- A single percentage in a compact space such as a card corner: use circular-progress.
- A trend over time rather than a current level: use sparkline-draw.

## Pick by what matters

| Need | Use |
| --- | --- |
| Plain quota | label, value, max (defaults warn at 75%, danger at 90%) |
| Units like GB | unit=" GB" and format={{ maximumFractionDigits: 1 }} |
| One block per seat or slot | segments={max} |
| A message that changes with the level | hint={({ tone, percent }) => …} |
| Stricter or looser thresholds | warnAt={0.6} dangerAt={0.85} |

## Usage

```tsx
import { Meter, type MeterTone } from "@/components/goodui/meter"

function smsHint({ tone, percent }: { tone: MeterTone; percent: number }) {
  if (tone === "danger") return `${percent}% used. Reminders pause at 10,000. Top up to keep them sending.`
  if (tone === "warning") return `${percent}% used. At this pace you run out before Dec 1.`
  return `${percent}% used. Renews Dec 1.`
}

export function PlanUsage({ sms, storageGb, seats }: { sms: number; storageGb: number; seats: number }) {
  return (
    <div className="flex flex-col gap-5 rounded-xl border bg-card p-5">
      <Meter label="SMS credits" value={sms} max={10000} hint={smsHint} />
      <Meter
        label="Photo storage"
        value={storageGb}
        max={20}
        unit=" GB"
        format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
      />
      <Meter label="Team seats" value={seats} max={10} segments={10} size="lg" hint={`${10 - seats} seats left`} />
    </div>
  )
}
```

### API quota with custom thresholds

```tsx
<Meter
  label="API requests this month"
  value={84210}
  max={100000}
  warnAt={0.6}
  dangerAt={0.85}
  format={{ notation: "compact" }}
  size="sm"
/>
```

## API

### Meter

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| label (required) | `React.ReactNode` | — | Name shown above the bar and used as the meter's accessible name, e.g. "SMS credits". |
| value (required) | `number` | — | Amount used. It rolls with NumberFlow and the fill springs to it; it is clamped between 0 and max for the bar. |
| max (required) | `number` | — | Limit the value is measured against, e.g. 10000 credits. |
| format | `Intl.NumberFormatOptions` | — | Formats value and max, e.g. { maximumFractionDigits: 1 }. |
| locale | `string` | — | Locale passed to Intl.NumberFormat for value and max. Defaults to the GooduiLocaleProvider language, else en-US. |
| unit | `string` | `""` | Text after the numbers, e.g. " GB". |
| warnAt | `number` | `0.75` | Share of max (0 to 1) where the bar turns amber. |
| dangerAt | `number` | `0.9` | Share of max (0 to 1) where the bar turns rose. |
| segments | `number` | — | Split the bar into this many segments, e.g. one per seat. |
| hint | `React.ReactNode \| ((state: { tone: MeterTone; percent: number }) => React.ReactNode)` | — | Small line under the bar. Receives the current tone and percentage. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Bar height: sm 6px, md 8px, lg 12px. |
| labels | `Partial<MeterLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Accessibility

- The bar is role="meter" with aria-valuemin 0, aria-valuemax max and aria-valuenow, and is named by the label through aria-labelledby.
- aria-valuetext reads "7,420 of 10,000, 74%" (with the unit after max). Translate it with labels.valueText(value, max, percent).
- The visible numbers use number-flow, which keeps one sr-only copy of the value; the " / max" text is aria-hidden because the meter already announces it.
- Tone is never the only signal: the numbers and percent are always shown, and hint can say it in words.

## Motion

- The fill is translated (not resized) on a spring (stiffness 120, damping 20, mass 0.9). With segments, each segment starts 25 ms after the previous one.
- The value digits roll through number-flow; the fill and hint colors cross-fade over 500 ms when the tone changes.
- At 0 the fill fades out (150 ms after a 300 ms delay) so no sliver stays at the track edge.
- Reduced motion: the fill and digits jump to the new value with duration 0.

## Notes for AI

- value and max are raw numbers; pass unit and format instead of building "12.6 GB" yourself.
- Tone is computed from value / max against warnAt and dangerAt (shares from 0 to 1, not percents). There is no tone prop to force a color.
- hint can be a function of { tone, percent }; use it for the message instead of reading the tone outside.
- segments should usually equal max for seats (segments={10} with max={10}); with other values each segment covers max / segments.
- Values above max are clamped to a full bar but the number still shows the real value.
- labels={{ valueText: (v, m, p) => `${v} von ${m}, ${p} %` }} translates aria-valuetext; v and m arrive formatted. Under RTL the bar fills from the right.

## FAQ

**Meter or progress?**

Meter for a level within a range that does not "finish" (quota, storage). Progress for work moving toward done. They also use different ARIA roles.

**Can I change the colors?**

Normal uses bg-primary from your theme; warning is amber and danger is rose, with dark-mode shades. Change the FILL and TEXT maps in the installed file to use other colors.

## Related

- progress: https://goodui.dev/components/numbers/progress
- circular-progress: https://goodui.dev/components/numbers/circular-progress
- number-flow: https://goodui.dev/components/numbers/number-flow
- stat-card: https://goodui.dev/components/core/stat-card

Last updated: 2026-11-02
