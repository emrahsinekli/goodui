# Eval score

> Evaluation score with a rolling number, a pass, borderline or fail badge that pops in against a threshold, a spring-filled bar and a criteria breakdown with per-criterion thresholds, as card, inline row or badge.

Eval score component for React: rolling score, pass/fail badge against a threshold and a criteria breakdown with bars

Page: https://goodui.dev/components/ai/eval-score

## Install

```bash
npx shadcn@latest add @goodui/eval-score
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/eval-score.json`. The file lands in `components/goodui/eval-score.tsx`.

## When to use

- Showing an LLM-as-judge or rubric result for a generated answer, with the criteria that made it up.
- Eval dashboards: inline rows per run, badges in tables, cards for the selected run.
- Any 0–100 (or 0–1, 0–5) quality score with a threshold.

## When not to use

- Many metrics over time: use a chart.
- Star ratings from people: use rating.

## Pick by what matters

| Need | Use |
| --- | --- |
| Detail view | variant="card" with criteria |
| Row in a list | variant="inline" |
| Cell in a table | variant="badge" |
| 0–1 scores | max={1} percent |
| Per-criterion thresholds | criteria[].threshold |

## Usage

```tsx
import { EvalScore } from "@/components/goodui/eval-score"

<EvalScore
  label="Win-back SMS · Maya Chen"
  score={82}
  threshold={70}
  criteria={[
    { label: "Tone", score: 90, note: "Warm, not pushy" },
    { label: "Accuracy", score: 78 },
    { label: "Brevity", score: 66, threshold: 75, note: "Fits one SMS segment" },
    { label: "Compliance", score: 96, threshold: 90 },
  ]}
/>
```

### Inline rows

```tsx
{runs.map((r) => <EvalScore key={r.id} variant="inline" label={r.name} score={r.score} threshold={70} size="sm" />)}
```

### Badges on different scales

```tsx
<EvalScore variant="badge" score={0.93} max={1} threshold={0.8} percent />
<EvalScore variant="badge" score={4.6} max={5} />
```

## API

### EvalScore

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| score (required) | `number` | — |  |
| max | `number` | `100` | Top of the scale. |
| threshold | `number` | — | Minimum passing score. Omit for no verdict. |
| margin | `number` | `5` | Scores within this distance under the threshold are "borderline" instead of a hard fail. |
| label | `React.ReactNode` | — |  |
| criteria | `EvalCriterion[]` | — | Per-criterion scores shown as bars under the main score. |
| variant | `"card" \| "inline" \| "badge"` | `"card"` | card: score, badge, bar and breakdown. inline: number, badge and a thin bar on one line. badge: just the badge with the score. |
| size | `"sm" \| "md" \| "lg"` | `"md"` |  |
| percent | `boolean` | `false` | Show the score as a percentage of max. |
| labels | `Partial<EvalScoreLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Accessibility

- Each variant carries one visually hidden sentence such as "Win-back SMS: Score 82 / 100, Pass"; the animated number, bars and badge are aria-hidden so the value is read once.
- Verdict colors (green pass, amber borderline, rose fail) are paired with an icon and the word, never color alone.
- Built-in strings go through the labels prop for translation.

## Motion

- The score rolls digit by digit (number-flow, installed alongside); bars scale from the start edge on a spring (stiffness 180, damping 26); the verdict badge pops in from 0.6 scale.
- Criteria rows slide in 6px with a 60 ms stagger after the main bar.
- Reduced motion: digits, bars and badges change instantly, rows do not stagger.

## Notes for AI

- verdict: pass when score ≥ threshold, near when within `margin` (5 by default) under it, fail below that; no threshold means no badge.
- score and criteria share the same scale (max). percent shows score / max as a percentage.
- verdictOf(score, threshold, margin) is exported for consistent logic in tables and filters.

## FAQ

**Can I weight criteria?**

Compute the overall score yourself and pass it; criteria are displayed as given.

## Related

- number-flow: https://goodui.dev/components/numbers/number-flow
- meter: https://goodui.dev/components/numbers/meter
- delta-badge: https://goodui.dev/components/numbers/delta-badge
- stat-card: https://goodui.dev/components/core/stat-card

Last updated: 2026-11-03
