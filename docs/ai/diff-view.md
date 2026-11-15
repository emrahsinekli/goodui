# Diff view

> Unified or split diff computed from before and after text, with old/new gutters, syntax colors, changed-character highlights inside replaced lines, and Accept or Reject per hunk that collapses the discarded lines.

Diff viewer for AI code edits in React: unified or split view, syntax colors, changed-character highlights, accept or reject per hunk

Page: https://goodui.dev/components/ai/diff-view

## Install

```bash
npx shadcn@latest add @goodui/diff-view
```

Without the namespace: `npx shadcn@latest add https://goodui.dev/r/diff-view.json`. The file lands in `components/goodui/diff-view.tsx`.

## When to use

- Reviewing edits an agent proposes to a file before applying them, hunk by hunk.
- Showing what changed between two versions of a prompt, config or document.
- Pull-request style views where syntax colors and changed characters matter.

## When not to use

- Diffs of very large files (tens of thousands of lines): compute them server-side and virtualize.
- Word-level prose comparison: a text diff that highlights words inline reads better than line rows.

## Pick by what matters

| Need | Use |
| --- | --- |
| Narrow column, chat sidebar | mode="unified" |
| Review on a wide screen | mode="split" (old and new side by side) |
| Accept/Reject buttons | onDecision (or reviewable) |
| Fewer context lines | context={1} |
| Long lines | wrap |

## Usage

```tsx
import { DiffView } from "@/components/goodui/diff-view"

<DiffView
  before={original}
  after={proposed}
  language="ts"
  fileName="lib/pricing.ts"
  onDecision={(hunk, decision) => decision && apply(hunk, decision)}
/>
```

### Controlled decisions

```tsx
const [decisions, setDecisions] = React.useState<Record<number, "accepted" | "rejected" | undefined>>({})
<DiffView before={a} after={b} decisions={decisions} onDecision={(i, d) => setDecisions((s) => ({ ...s, [i]: d ?? undefined }))} />
```

### Read-only split view

```tsx
<DiffView before={a} after={b} mode="split" modeToggle={false} language="json" />
```

## API

### DiffView

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| before (required) | `string` | — |  |
| after (required) | `string` | — |  |
| language | `"html" \| "text" \| "ts" \| "tsx" \| "js" \| "jsx" \| "json" \| "bash" \| "sh" \| "python" \| "py" \| "css" \| "sql" \| "yaml" \| "yml"` | `"text"` |  |
| fileName | `string` | — |  |
| mode | `"unified" \| "split"` | — | unified (one column) or split (old and new side by side). |
| defaultMode | `"unified" \| "split"` | `"unified"` |  |
| onModeChange | `(mode: "unified" \| "split") => void` | — |  |
| modeToggle | `boolean` | `true` | Show the Unified/Split toggle. |
| context | `number` | `3` | Unchanged lines kept around each change. |
| reviewable | `boolean` | — | Accept/Reject buttons per hunk. On by default when onDecision is passed. |
| decisions | `Record<number, HunkDecision \| undefined>` | — | Hunk decisions by hunk index (controlled). |
| onDecision | `(hunkIndex: number, decision: HunkDecision \| null, hunk: DiffHunk) => void` | — |  |
| wrap | `boolean` | `false` | Wrap long lines instead of scrolling. |
| maxHeight | `number` | — | Scroll inside the view beyond this height (px). |
| labels | `Partial<DiffViewLabels>` | — | Text for built-in controls and screen readers; pass translations here. |

Also accepts every <div> attribute.

## Keyboard

| Keys | Action |
| --- | --- |
| Tab | Moves through the view toggle and each hunk's Accept, Reject and Undo buttons. |
| ArrowLeft / ArrowRight | Switches Unified and Split on the view radio group (native radio behavior). |

## Accessibility

- Each hunk is a <section> labelled "Change n"; added and removed lines carry a visually hidden + or − before the text; line numbers and markers are decorative.
- The +n −n counters in the header are labelled "n additions" and "n deletions". The view toggle is a radiogroup.
- Decisions show as text badges (Accepted, Rejected) with an Undo button.
- Built-in strings go through the labels prop for translation.

## Motion

- Accepting a hunk collapses its removed lines (height to 0 in 180 ms) and settles the added ones; rejecting does the reverse. Undo brings them back.
- The Accept/Reject pair cross-fades with the decision badge; the view toggle's pill glides on a shared-layout spring.
- Reduced motion: rows and controls swap instantly.

## Performance

- The line diff is an LCS over the lines that differ after trimming the common prefix and suffix; pairs larger than 4 million cells fall back to a plain replace. Tokens are computed once per side and reused by both modes.

## Notes for AI

- Pass whole file contents as before and after; the component computes the diff. Hunks are numbered from 0 in onDecision.
- decision is "accepted", "rejected" or null (undo). Applying the decision to your file is up to you; the view only reflects it.
- language uses the code-block tokenizer (ts, tsx, js, json, bash, python, css, html, sql, yaml).
- Split mode needs about 640px; it scrolls horizontally inside the component when narrower (unless wrap is on).

## FAQ

**Why are only some characters highlighted inside a changed line?**

When a block replaces the same number of lines, each pair is compared and only the differing middle part gets the stronger tint.

**Does it produce a patch?**

No. Use diffLines and toHunks (exported) to build one from the same data.

## Related

- code-block: https://goodui.dev/components/ai/code-block
- tool-call: https://goodui.dev/components/ai/tool-call
- agent-plan: https://goodui.dev/components/ai/agent-plan
- chat-message: https://goodui.dev/components/ai/chat-message

Last updated: 2026-11-03
