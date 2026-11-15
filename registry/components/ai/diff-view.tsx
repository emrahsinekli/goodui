"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Check, FileCode2, RotateCcw, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { CODE_CSS, CodeTokens, tokenizeCode, type CodeLanguage, type CodeToken } from "@/registry/components/ai/code-block"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

/*
 * Diff viewer for AI code edits: computes a line diff between `before` and `after`, groups changes into
 * hunks with context, shows them unified or split with old/new gutters, syntax colors and changed-character
 * highlights, and lets the reviewer accept or reject each hunk (rejected additions and accepted deletions
 * collapse away).
 */

const CSS = `
.pc-diff{--pc-diff-add:oklch(0.53 0.13 155);--pc-diff-del:oklch(0.56 0.21 27)}
.dark .pc-diff{--pc-diff-add:oklch(0.7 0.16 155);--pc-diff-del:oklch(0.68 0.2 25)}
.pc-diff-row[data-kind=add]{background:color-mix(in oklab,var(--pc-diff-add) 12%,transparent)}
.pc-diff-row[data-kind=del]{background:color-mix(in oklab,var(--pc-diff-del) 12%,transparent)}
.pc-diff-row[data-kind=add] .pc-diff-gutter{color:color-mix(in oklab,var(--pc-diff-add) 70%,var(--foreground))}
.pc-diff-row[data-kind=del] .pc-diff-gutter{color:color-mix(in oklab,var(--pc-diff-del) 70%,var(--foreground))}
.pc-diff-row[data-kind=add] .pc-diff-mark{background:color-mix(in oklab,var(--pc-diff-add) 28%,transparent);border-radius:2px}
.pc-diff-row[data-kind=del] .pc-diff-mark{background:color-mix(in oklab,var(--pc-diff-del) 28%,transparent);border-radius:2px}
.pc-diff-row[data-settled] .pc-diff-mark{background:none}
.pc-diff-mark,.pc-diff-mark [data-t]{color:var(--foreground)}
.pc-diff-gutter{user-select:none;-webkit-user-select:none}
.pc-diff-text{white-space:pre}
.pc-diff[data-wrap=true] .pc-diff-text{white-space:pre-wrap;overflow-wrap:anywhere}
`

export type DiffOp = { kind: "eq" | "add" | "del"; text: string; a?: number; b?: number }
export type DiffHunk = { ops: DiffOp[]; aStart: number; aLines: number; bStart: number; bLines: number }
export type HunkDecision = "accepted" | "rejected"

/** Line diff (LCS) between two texts. Exported for custom renderers. */
export function diffLines(before: string, after: string): DiffOp[] {
  const a = before.replace(/\r\n?/g, "\n").split("\n")
  const b = after.replace(/\r\n?/g, "\n").split("\n")
  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) start++
  let endA = a.length
  let endB = b.length
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--
    endB--
  }
  const ops: DiffOp[] = []
  for (let i = 0; i < start; i++) ops.push({ kind: "eq", text: a[i] ?? "", a: i + 1, b: i + 1 })
  const n = endA - start
  const m = endB - start
  if (n * m > 4_000_000) {
    for (let i = start; i < endA; i++) ops.push({ kind: "del", text: a[i] ?? "", a: i + 1 })
    for (let j = start; j < endB; j++) ops.push({ kind: "add", text: b[j] ?? "", b: j + 1 })
  } else {
    // LCS table on the middle part only.
    const dp: Uint32Array[] = []
    for (let i = 0; i <= n; i++) dp.push(new Uint32Array(m + 1))
    for (let i = n - 1; i >= 0; i--) {
      const row = dp[i]!
      const next = dp[i + 1]!
      for (let j = m - 1; j >= 0; j--) row[j] = a[start + i] === b[start + j] ? next[j + 1]! + 1 : Math.max(next[j]!, row[j + 1]!)
    }
    let i = 0
    let j = 0
    while (i < n && j < m) {
      if (a[start + i] === b[start + j]) {
        ops.push({ kind: "eq", text: a[start + i] ?? "", a: start + i + 1, b: start + j + 1 })
        i++
        j++
      } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
        ops.push({ kind: "del", text: a[start + i] ?? "", a: start + i + 1 })
        i++
      } else {
        ops.push({ kind: "add", text: b[start + j] ?? "", b: start + j + 1 })
        j++
      }
    }
    while (i < n) ops.push({ kind: "del", text: a[start + i] ?? "", a: start + ++i })
    while (j < m) ops.push({ kind: "add", text: b[start + j] ?? "", b: start + ++j })
  }
  for (let k = endA, kb = endB; k < a.length; k++, kb++) ops.push({ kind: "eq", text: a[k] ?? "", a: k + 1, b: kb + 1 })
  return ops
}

/** Groups ops into hunks with `context` unchanged lines around each change. */
export function toHunks(ops: DiffOp[], context = 3): DiffHunk[] {
  const changed = ops.map((o) => o.kind !== "eq")
  const ranges: [number, number][] = []
  for (let i = 0; i < ops.length; i++) {
    if (!changed[i]) continue
    let j = i
    while (j + 1 < ops.length && (changed[j + 1] || ops.slice(j + 1, j + 1 + context * 2 + 1).some((o) => o.kind !== "eq"))) j++
    ranges.push([Math.max(0, i - context), Math.min(ops.length - 1, j + context)])
    i = j
  }
  return ranges.map(([s, e]) => {
    const slice = ops.slice(s, e + 1)
    const aStart = slice.find((o) => o.a !== undefined)?.a ?? (ops[s]?.a ?? 1)
    const bStart = slice.find((o) => o.b !== undefined)?.b ?? (ops[s]?.b ?? 1)
    return { ops: slice, aStart, aLines: slice.filter((o) => o.kind !== "add").length, bStart, bLines: slice.filter((o) => o.kind !== "del").length }
  })
}

// Common prefix/suffix of a replaced line pair, so only the characters that changed get the stronger tint.
function changedRange(x: string, y: string): [number, number] | null {
  if (x === y) return null
  let p = 0
  while (p < x.length && p < y.length && x[p] === y[p]) p++
  let s = 0
  while (s < x.length - p && s < y.length - p && x[x.length - 1 - s] === y[y.length - 1 - s]) s++
  return [p, s]
}

function splitTokens(tokens: CodeToken[], from: number, to: number): [CodeToken[], CodeToken[], CodeToken[]] {
  const parts: [CodeToken[], CodeToken[], CodeToken[]] = [[], [], []]
  let pos = 0
  for (const t of tokens) {
    const end = pos + t.content.length
    const cut = (lo: number, hi: number, bucket: 0 | 1 | 2) => {
      const s = Math.max(pos, lo)
      const e = Math.min(end, hi)
      if (e > s) parts[bucket].push({ type: t.type, content: t.content.slice(s - pos, e - pos) })
    }
    cut(0, from, 0)
    cut(from, to, 1)
    cut(to, Infinity, 2)
    pos = end
  }
  return parts
}

export type DiffViewLabels = {
  unified: string
  split: string
  accept: string
  reject: string
  accepted: string
  rejected: string
  undo: string
  additions: (n: number) => string
  deletions: (n: number) => string
  hunk: (n: number) => string
  view: string
  wrap: string
}
const DEFAULT_LABELS: DiffViewLabels = {
  unified: "Unified",
  split: "Split",
  accept: "Accept",
  reject: "Reject",
  accepted: "Accepted",
  rejected: "Rejected",
  undo: "Undo",
  additions: (n) => `${n} addition${n === 1 ? "" : "s"}`,
  deletions: (n) => `${n} deletion${n === 1 ? "" : "s"}`,
  hunk: (n) => `Change ${n}`,
  view: "View",
  wrap: "Wrap lines",
}

export type DiffViewProps = Omit<React.ComponentProps<"div">, "children"> & {
  before: string
  after: string
  language?: CodeLanguage
  fileName?: string
  /** unified (one column) or split (old and new side by side). */
  mode?: "unified" | "split"
  defaultMode?: "unified" | "split"
  onModeChange?: (mode: "unified" | "split") => void
  /** Show the Unified/Split toggle. */
  modeToggle?: boolean
  /** Unchanged lines kept around each change. */
  context?: number
  /** Accept/Reject buttons per hunk. On by default when onDecision is passed. */
  reviewable?: boolean
  /** Hunk decisions by hunk index (controlled). */
  decisions?: Record<number, HunkDecision | undefined>
  onDecision?: (hunkIndex: number, decision: HunkDecision | null, hunk: DiffHunk) => void
  /** Wrap long lines instead of scrolling. */
  wrap?: boolean
  /** Scroll inside the view beyond this height (px). */
  maxHeight?: number
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<DiffViewLabels>
}

type Row = { kind: DiffOp["kind"]; a?: number; b?: number; tokens: CodeToken[]; mark?: [number, number] }

/** Unified or split diff with syntax colors, changed-character highlights and accept/reject per hunk. */
export function DiffView({
  before,
  after,
  language = "text",
  fileName,
  mode: modeProp,
  defaultMode = "unified",
  onModeChange,
  modeToggle = true,
  context = 3,
  reviewable,
  decisions: decisionsProp,
  onDecision,
  wrap = false,
  maxHeight,
  labels,
  className,
  ...props
}: DiffViewProps) {
  const l = useLabels("diff-view", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const uid = React.useId()
  const [modeInner, setModeInner] = React.useState(defaultMode)
  const mode = modeProp ?? modeInner
  const [decInner, setDecInner] = React.useState<Record<number, HunkDecision | undefined>>({})
  const decisions = decisionsProp ?? decInner
  const review = reviewable ?? onDecision !== undefined

  const { hunks, adds, dels, tokA, tokB } = React.useMemo(() => {
    const ops = diffLines(before, after)
    return {
      hunks: toHunks(ops, context),
      adds: ops.filter((o) => o.kind === "add").length,
      dels: ops.filter((o) => o.kind === "del").length,
      tokA: tokenizeCode(before, language),
      tokB: tokenizeCode(after, language),
    }
  }, [before, after, context, language])

  // Rows with tokens; replaced line pairs get a changed-character range.
  const rowsOf = React.useCallback(
    (hunk: DiffHunk): Row[] => {
      const rows: Row[] = []
      const ops = hunk.ops
      for (let i = 0; i < ops.length; i++) {
        const op = ops[i]!
        if (op.kind === "del") {
          let j = i
          while (j < ops.length && ops[j]?.kind === "del") j++
          let k = j
          while (k < ops.length && ops[k]?.kind === "add") k++
          const delRun = ops.slice(i, j)
          const addRun = ops.slice(j, k)
          delRun.forEach((d, idx) => {
            const partner = delRun.length === addRun.length ? addRun[idx] : undefined
            const r = partner ? changedRange(d.text, partner.text) : null
            rows.push({ kind: "del", a: d.a, tokens: tokA[(d.a ?? 1) - 1] ?? [], mark: r ? [r[0], d.text.length - r[1]] : undefined })
          })
          addRun.forEach((ad, idx) => {
            const partner = delRun.length === addRun.length ? delRun[idx] : undefined
            const r = partner ? changedRange(partner.text, ad.text) : null
            rows.push({ kind: "add", b: ad.b, tokens: tokB[(ad.b ?? 1) - 1] ?? [], mark: r ? [r[0], ad.text.length - r[1]] : undefined })
          })
          i = k - 1
        } else if (op.kind === "add") rows.push({ kind: "add", b: op.b, tokens: tokB[(op.b ?? 1) - 1] ?? [] })
        else rows.push({ kind: "eq", a: op.a, b: op.b, tokens: tokB[(op.b ?? 1) - 1] ?? [] })
      }
      return rows
    },
    [tokA, tokB],
  )

  const decide = (i: number, d: HunkDecision | null) => {
    if (decisionsProp === undefined) setDecInner((s) => ({ ...s, [i]: d ?? undefined }))
    onDecision?.(i, d, hunks[i]!)
  }
  const setMode = (m: "unified" | "split") => {
    if (modeProp === undefined) setModeInner(m)
    onModeChange?.(m)
  }

  const text = (row: Row) => {
    if (!row.mark) return <CodeTokens tokens={row.tokens} />
    const [pre, mid, post] = splitTokens(row.tokens, row.mark[0], row.mark[1])
    return (
      <>
        <CodeTokens tokens={pre} />
        <span className="pc-diff-mark">
          <CodeTokens tokens={mid} />
        </span>
        <CodeTokens tokens={post} />
      </>
    )
  }
  const gutterW = `${Math.max(2, String(Math.max(before.split("\n").length, after.split("\n").length)).length) + 1}ch`
  const visible = (row: Row, d: HunkDecision | undefined) => !((d === "accepted" && row.kind === "del") || (d === "rejected" && row.kind === "add"))
  const settled = (row: Row, d: HunkDecision | undefined) => (d === "accepted" && row.kind === "add") || (d === "rejected" && row.kind === "del")
  const springRow = reduce ? { duration: 0 } : spring.ui

  const unifiedRow = (row: Row, key: string, d: HunkDecision | undefined) => (
    <motion.div
      key={key}
      layout="position"
      initial={false}
      exit={{ height: 0, opacity: 0, transition: reduce ? { duration: 0 } : { duration: 0.18 } }}
      transition={springRow}
      className="pc-diff-row grid overflow-hidden"
      style={{ gridTemplateColumns: `${gutterW} ${gutterW} 1.5ch minmax(0,1fr)` }}
      data-kind={settled(row, d) ? "eq" : row.kind}
      data-settled={settled(row, d) ? "" : undefined}
    >
      <span className="pc-diff-gutter px-1 text-end text-muted-foreground" aria-hidden="true">
        {row.a ?? ""}
      </span>
      <span className="pc-diff-gutter px-1 text-end text-muted-foreground" aria-hidden="true">
        {row.b ?? ""}
      </span>
      <span className="pc-diff-gutter text-center font-semibold" aria-hidden="true">
        {row.kind === "add" ? "+" : row.kind === "del" ? "−" : ""}
      </span>
      <span className="pc-diff-text pe-3">
        {row.kind !== "eq" && <span className="sr-only">{row.kind === "add" ? "+ " : "− "}</span>}
        {text(row)}
      </span>
    </motion.div>
  )

  const splitRows = (rows: Row[]) => {
    const pairs: [Row | null, Row | null][] = []
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]!
      if (r.kind === "eq") pairs.push([r, r])
      else if (r.kind === "del") {
        let j = i
        while (j < rows.length && rows[j]?.kind === "del") j++
        let k = j
        while (k < rows.length && rows[k]?.kind === "add") k++
        const dels = rows.slice(i, j)
        const adds = rows.slice(j, k)
        for (let x = 0; x < Math.max(dels.length, adds.length); x++) pairs.push([dels[x] ?? null, adds[x] ?? null])
        i = k - 1
      } else pairs.push([null, r])
    }
    return pairs
  }

  const splitCell = (row: Row | null, side: "a" | "b", d: HunkDecision | undefined) => {
    const hidden = row && !visible(row, d)
    const shown = row && !hidden ? row : null
    return (
      <div
        className={cn("pc-diff-row grid min-w-0 border-e last:border-e-0", !shown && "bg-muted/30")}
        style={{ gridTemplateColumns: `${gutterW} 1.5ch minmax(0,1fr)` }}
        data-kind={shown ? (settled(shown, d) ? "eq" : shown.kind) : undefined}
        data-settled={shown && settled(shown, d) ? "" : undefined}
      >
        <span className="pc-diff-gutter px-1 text-end text-muted-foreground" aria-hidden="true">
          {shown ? (side === "a" ? (shown.a ?? "") : (shown.b ?? "")) : ""}
        </span>
        <span className="pc-diff-gutter text-center font-semibold" aria-hidden="true">
          {shown?.kind === "add" ? "+" : shown?.kind === "del" ? "−" : ""}
        </span>
        <span className="pc-diff-text pe-3">{shown ? text(shown) : ""}</span>
      </div>
    )
  }

  return (
    <div className={cn("pc-diff pc-code overflow-hidden rounded-xl border bg-card text-[13px] text-card-foreground", className)} data-wrap={wrap} {...props}>
      <GooduiTokens />
      <style href="pc-code-block" precedence="default">
        {CODE_CSS}
      </style>
      <style href="pc-diff-view" precedence="default">
        {CSS}
      </style>
      <div className="flex h-10 items-center gap-2 border-b bg-muted/40 ps-3 pe-1.5">
        {fileName && (
          <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium">
            <FileCode2 className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate">{fileName}</span>
          </span>
        )}
        <span className="flex shrink-0 items-center gap-2 text-xs tabular-nums">
          <span className="text-[color-mix(in_oklab,var(--pc-diff-add)_70%,var(--foreground))]">
            <span aria-hidden="true">+{adds}</span>
            <span className="sr-only">{l.additions(adds)}</span>
          </span>
          <span className="text-[color-mix(in_oklab,var(--pc-diff-del)_70%,var(--foreground))]">
            <span aria-hidden="true">−{dels}</span>
            <span className="sr-only">{l.deletions(dels)}</span>
          </span>
        </span>
        <span className="flex-1" />
        {modeToggle && (
          <div role="radiogroup" aria-label={l.view} className="flex items-center rounded-lg bg-muted/80 p-0.5">
            {(["unified", "split"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => setMode(m)}
                className={cn("pc-press relative h-6 rounded-md px-2 text-xs font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50", mode === m ? "text-foreground" : "text-foreground/65 hover:text-foreground")}
              >
                {mode === m && <motion.span layoutId={`${uid}-mode`} className="absolute inset-0 rounded-md bg-background shadow-[var(--pc-e1)]" transition={reduce ? { duration: 0 } : spring.snap} />}
                <span className="relative">{l[m]}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="overflow-auto outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset" style={{ maxHeight }} tabIndex={0} dir="ltr">
        <div className={cn("py-1 font-mono leading-6", mode === "split" && !wrap && "min-w-[640px]")}>
          {hunks.map((h, hi) => {
            const d = decisions[hi]
            const rows = rowsOf(h)
            return (
              <section key={hi} aria-label={l.hunk(hi + 1)} className="border-b last:border-b-0">
                <div className="flex items-center gap-2 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
                  <span className="font-mono">
                    spring. -{h.aStart},{h.aLines} +{h.bStart},{h.bLines} spring.
                  </span>
                  <span className="flex-1" />
                  {review && (
                    <AnimatePresence mode="wait" initial={false}>
                      {d ? (
                        <motion.span key="decided" initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={reduce ? { duration: 0 } : { duration: 0.15 }} className="inline-flex items-center gap-1.5">
                          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", d === "accepted" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/15 text-rose-700 dark:text-rose-300")}>
                            {d === "accepted" ? <Check className="size-3" aria-hidden="true" /> : <X className="size-3" aria-hidden="true" />}
                            {d === "accepted" ? l.accepted : l.rejected}
                          </span>
                          <button type="button" onClick={() => decide(hi, null)} className="pc-press inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
                            <RotateCcw className="size-3" aria-hidden="true" />
                            {l.undo}
                          </button>
                        </motion.span>
                      ) : (
                        <motion.span key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={reduce ? { duration: 0 } : { duration: 0.15 }} className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => decide(hi, "accepted")}
                            className="pc-press inline-flex h-6 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-emerald-700 outline-none hover:bg-emerald-500/15 focus-visible:ring-3 focus-visible:ring-ring/50 dark:text-emerald-300"
                          >
                            <Check className="size-3" aria-hidden="true" />
                            {l.accept}
                          </button>
                          <button
                            type="button"
                            onClick={() => decide(hi, "rejected")}
                            className="pc-press inline-flex h-6 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-rose-700 outline-none hover:bg-rose-500/15 focus-visible:ring-3 focus-visible:ring-ring/50 dark:text-rose-300"
                          >
                            <X className="size-3" aria-hidden="true" />
                            {l.reject}
                          </button>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  )}
                </div>
                {mode === "unified" ? (
                  <AnimatePresence initial={false}>{rows.filter((r) => visible(r, d)).map((r) => unifiedRow(r, `${r.kind}-${r.a ?? ""}-${r.b ?? ""}`, d))}</AnimatePresence>
                ) : (
                  <div className="grid grid-cols-2">
                    {splitRows(rows).map(([left, right], i) => (
                      <React.Fragment key={i}>
                        {splitCell(left, "a", d)}
                        {splitCell(right, "b", d)}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </section>
            )
          })}
          {hunks.length === 0 && <div className="px-3 py-6 text-center text-sm text-muted-foreground">No changes</div>}
        </div>
      </div>
    </div>
  )
}
