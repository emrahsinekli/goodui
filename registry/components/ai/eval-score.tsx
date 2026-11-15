"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { Check, Minus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { NumberFlow } from "@/registry/components/numbers/number-flow"
import { useLabels } from "@/lib/goodui-locale"
import { spring } from "@/lib/goodui-motion"

/*
 * Evaluation score for AI outputs: a rolling number, a pass/fail/borderline badge against a threshold, a
 * score bar that springs to its value and an optional criteria breakdown (bars with their own pass marks).
 * No radar chart: bars read faster and compare across runs.
 */

const CSS = `
.pc-eval{--pc-eval-pass:oklch(0.53 0.13 155);--pc-eval-fail:oklch(0.56 0.21 27);--pc-eval-near:oklch(0.72 0.16 70)}
.dark .pc-eval{--pc-eval-pass:oklch(0.7 0.16 155);--pc-eval-fail:oklch(0.68 0.2 25);--pc-eval-near:oklch(0.8 0.16 75)}
.pc-eval[data-verdict=pass]{--pc-eval-c:var(--pc-eval-pass)}
.pc-eval[data-verdict=fail]{--pc-eval-c:var(--pc-eval-fail)}
.pc-eval[data-verdict=near]{--pc-eval-c:var(--pc-eval-near)}
.pc-eval[data-verdict=none]{--pc-eval-c:var(--foreground)}
.pc-eval-ink{color:color-mix(in oklab,var(--pc-eval-c) 75%,var(--foreground))}
.pc-eval[data-verdict=near] .pc-eval-ink{color:color-mix(in oklab,var(--pc-eval-c) 58%,var(--foreground))}
.pc-eval-tint{background:color-mix(in oklab,var(--pc-eval-c) 14%,transparent)}
.pc-eval-fill{background:var(--pc-eval-c)}
`

export type EvalCriterion = {
  label: string
  /** Same scale as the score (0..max). */
  score: number
  /** Overrides the main threshold for this criterion. */
  threshold?: number
  /** Short note shown under the label. */
  note?: string
}

export type EvalVerdict = "pass" | "fail" | "near" | "none"

export type EvalScoreLabels = {
  pass: string
  fail: string
  near: string
  score: string
  criteria: string
  outOf: (max: string) => string
}
const DEFAULT_LABELS: EvalScoreLabels = { pass: "Pass", fail: "Fail", near: "Borderline", score: "Score", criteria: "Breakdown", outOf: (max) => `/ ${max}` }

export type EvalScoreProps = Omit<React.ComponentProps<"div">, "children"> & {
  score: number
  /** Top of the scale. */
  max?: number
  /** Minimum passing score. Omit for no verdict. */
  threshold?: number
  /** Scores within this distance under the threshold are "borderline" instead of a hard fail. */
  margin?: number
  label?: React.ReactNode
  /** Per-criterion scores shown as bars under the main score. */
  criteria?: EvalCriterion[]
  /** card: score, badge, bar and breakdown. inline: number, badge and a thin bar on one line. badge: just the badge with the score. */
  variant?: "card" | "inline" | "badge"
  size?: "sm" | "md" | "lg"
  /** Show the score as a percentage of max. */
  percent?: boolean
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<EvalScoreLabels>
}

export function verdictOf(score: number, threshold: number | undefined, margin: number): EvalVerdict {
  if (threshold === undefined) return "none"
  if (score >= threshold) return "pass"
  if (score >= threshold - margin) return "near"
  return "fail"
}

function Badge({ verdict, l, size, reduce, children }: { verdict: EvalVerdict; l: EvalScoreLabels; size: "sm" | "md" | "lg"; reduce: boolean; children?: React.ReactNode }) {
  if (verdict === "none") return null
  const Icon = verdict === "pass" ? Check : verdict === "fail" ? X : Minus
  return (
    <motion.span
      key={verdict}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={reduce ? { duration: 0 } : spring.play}
      className={cn("pc-eval-tint pc-eval-ink inline-flex items-center gap-1 rounded-full font-semibold", size === "sm" ? "h-5 px-1.5 text-[11px]" : size === "lg" ? "h-7 px-2.5 text-sm" : "h-6 px-2 text-xs")}
    >
      <Icon className={size === "lg" ? "size-4" : "size-3"} strokeWidth={3} aria-hidden="true" />
      {children}
      {l[verdict]}
    </motion.span>
  )
}

function Bar({ value, max, verdict, thin, reduce, threshold }: { value: number; max: number; verdict: EvalVerdict; thin?: boolean; reduce: boolean; threshold?: number }) {
  return (
    <span className={cn("pc-eval relative block w-full overflow-hidden rounded-full bg-muted", thin ? "h-1.5" : "h-2")} data-verdict={verdict} aria-hidden="true">
      <motion.span
        className="pc-eval-fill absolute inset-y-0 start-0 w-full origin-left rounded-full rtl:origin-right"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: Math.max(0, Math.min(1, value / max)) }}
        transition={reduce ? { duration: 0 } : spring.morph}
      />
      {threshold !== undefined && <span className="absolute inset-y-0 w-px bg-foreground/50" style={{ insetInlineStart: `${(threshold / max) * 100}%` }} />}
    </span>
  )
}

/** Score with pass/fail badge, spring-filled bar and a criteria breakdown. */
export function EvalScore({ score, max = 100, threshold, margin = 5, label, criteria, variant = "card", size = "md", percent = false, labels, className, ...props }: EvalScoreProps) {
  const l = useLabels("eval-score", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const verdict = verdictOf(score, threshold, margin)
  const shown = percent ? Math.round((score / max) * 100) : score
  const digits = Number.isInteger(shown) ? 0 : 1
  const fmt = React.useMemo<Intl.NumberFormatOptions>(() => ({ maximumFractionDigits: digits }), [digits])
  const srText = `${label ? `${label}: ` : ""}${l.score} ${shown}${percent ? "%" : ` ${l.outOf(String(max))}`}${verdict !== "none" ? `, ${l[verdict]}` : ""}`

  if (variant === "badge") {
    return (
      <span className={cn("pc-eval inline-flex items-center gap-1.5", className)} data-verdict={verdict} {...props}>
        <style href="pc-eval-score" precedence="default">
          {CSS}
        </style>
        <span className="sr-only">{srText}</span>
        <span aria-hidden="true" className="contents">
          <Badge verdict={verdict} l={l} size={size} reduce={reduce}>
            <NumberFlow value={shown} format={fmt} suffix={percent ? "%" : ""} className="tabular-nums" />
            <span className="opacity-60">·</span>
          </Badge>
          {verdict === "none" && (
            <span className={cn("font-semibold tabular-nums", size === "sm" ? "text-xs" : "text-sm")}>
              <NumberFlow value={shown} format={fmt} suffix={percent ? "%" : ""} />
            </span>
          )}
        </span>
      </span>
    )
  }

  if (variant === "inline") {
    return (
      <div className={cn("pc-eval flex items-center gap-3", className)} data-verdict={verdict} {...props}>
        <style href="pc-eval-score" precedence="default">
          {CSS}
        </style>
        <span className="sr-only">{srText}</span>
        <div aria-hidden="true" className="contents">
          {label && <span className={cn("min-w-0 truncate", size === "sm" ? "text-xs" : "text-sm")}>{label}</span>}
          <span className="min-w-16 flex-1">
            <Bar value={score} max={max} verdict={verdict} thin reduce={reduce} threshold={threshold} />
          </span>
          <span className={cn("pc-eval-ink shrink-0 font-semibold tabular-nums", size === "sm" ? "text-xs" : "text-sm")}>
            <NumberFlow value={shown} format={fmt} suffix={percent ? "%" : ""} />
          </span>
          <Badge verdict={verdict} l={l} size={size === "lg" ? "md" : "sm"} reduce={reduce} />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("pc-eval rounded-xl border bg-card p-4 text-card-foreground", className)} data-verdict={verdict} {...props}>
      <style href="pc-eval-score" precedence="default">
        {CSS}
      </style>
      <span className="sr-only">{srText}</span>
      <div aria-hidden="true">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {label && <div className="truncate text-sm font-medium">{label}</div>}
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={cn("pc-eval-ink font-semibold tracking-tight tabular-nums", size === "sm" ? "text-2xl" : size === "lg" ? "text-5xl" : "text-4xl")}>
                <NumberFlow value={shown} format={fmt} suffix={percent ? "%" : ""} />
              </span>
              {!percent && <span className="text-sm text-muted-foreground">{l.outOf(String(max))}</span>}
            </div>
          </div>
          <Badge verdict={verdict} l={l} size={size} reduce={reduce} />
        </div>
        <div className="mt-3">
          <Bar value={score} max={max} verdict={verdict} reduce={reduce} threshold={threshold} />
        </div>
        {criteria && criteria.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{l.criteria}</div>
            <ul className="flex flex-col gap-2.5">
              {criteria.map((c, i) => {
                const t = c.threshold ?? threshold
                const v = verdictOf(c.score, t, margin)
                return (
                  <motion.li
                    key={c.label}
                    initial={reduce ? false : { opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={reduce ? { duration: 0 } : { delay: 0.08 + i * 0.06, ...spring.ui }}
                    className="pc-eval grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1"
                    data-verdict={v}
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm">
                      <span className={cn("grid size-4 shrink-0 place-items-center rounded-full", v === "none" ? "bg-muted" : "pc-eval-tint pc-eval-ink")}>
                        {v === "pass" ? <Check className="size-2.5" strokeWidth={3.5} /> : v === "fail" ? <X className="size-2.5" strokeWidth={3.5} /> : v === "near" ? <Minus className="size-2.5" strokeWidth={3.5} /> : null}
                      </span>
                      <span className="truncate">{c.label}</span>
                    </span>
                    <span className="pc-eval-ink text-sm font-semibold tabular-nums">{Number.isInteger(c.score) ? c.score : c.score.toFixed(1)}</span>
                    <span className="col-span-2">
                      <Bar value={c.score} max={max} verdict={v} thin reduce={reduce} threshold={t} />
                    </span>
                    {c.note && <span className="col-span-2 -mt-0.5 text-xs text-muted-foreground">{c.note}</span>}
                  </motion.li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
