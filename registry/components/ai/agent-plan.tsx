"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ChevronRight, ListChecks } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring as springs } from "@/lib/goodui-motion"

/*
 * An agent's plan as a live checklist: each step shows pending, active (spinner with a pulsing halo), done
 * (drawn check), error or skipped, nested substeps fold under their parent, the rail fills as steps complete
 * and a progress bar with "3 of 7" tracks the whole plan.
 */

const CSS = `
@keyframes pc-plan-spin{to{transform:rotate(360deg)}}
.pc-plan-spin{animation:pc-plan-spin .9s linear infinite}
@keyframes pc-plan-halo{0%{transform:scale(1);opacity:.5}100%{transform:scale(2.2);opacity:0}}
.pc-plan-halo{animation:pc-plan-halo 1.6s ease-out infinite}
@media (prefers-reduced-motion:reduce){.pc-plan-spin{animation-duration:2s}.pc-plan-halo{animation:none;display:none}}
`

export type PlanStepStatus = "pending" | "active" | "done" | "error" | "skipped"
export type PlanStep = {
  id: string
  title: React.ReactNode
  /** Muted text under the title, e.g. the file touched or the result. */
  detail?: React.ReactNode
  status?: PlanStepStatus
  steps?: PlanStep[]
}

export type AgentPlanLabels = {
  progress: (done: number, total: number) => string
  pending: string
  active: string
  done: string
  error: string
  skipped: string
  toggle: string
}
const DEFAULT_LABELS: AgentPlanLabels = { progress: (d, t) => `${d} of ${t} steps`, pending: "Pending", active: "In progress", done: "Done", error: "Failed", skipped: "Skipped", toggle: "Toggle substeps" }

export type AgentPlanProps = Omit<React.ComponentProps<"section">, "title"> & {
  steps: PlanStep[]
  title?: React.ReactNode
  /** Progress bar and count in the header. */
  showProgress?: boolean
  /** Substeps fold away once their parent is done (they can be reopened). */
  autoCollapse?: boolean
  /** card: bordered; plain: just the list. */
  variant?: "card" | "plain"
  onStepClick?: (step: PlanStep) => void
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<AgentPlanLabels>
}

function count(steps: PlanStep[]): { done: number; total: number } {
  let done = 0
  let total = 0
  for (const s of steps) {
    if (s.steps?.length) {
      const c = count(s.steps)
      done += c.done
      total += c.total
    } else {
      total++
      if (s.status === "done" || s.status === "skipped") done++
    }
  }
  return { done, total }
}

function StatusIcon({ status, reduce }: { status: PlanStepStatus; reduce: boolean }) {
  const spring = reduce ? { duration: 0 } : springs.play
  return (
    <span className="relative grid size-5 shrink-0 place-items-center">
      <AnimatePresence mode="popLayout" initial={false}>
        {status === "pending" && <motion.span key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={spring} className="size-[14px] rounded-full border-2 border-muted-foreground/40" />}
        {status === "active" && (
          <motion.span key="a" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={spring} className="relative grid size-[14px] place-items-center">
            <span className="pc-plan-halo absolute inset-0 rounded-full bg-foreground" aria-hidden="true" />
            <svg viewBox="0 0 24 24" className="pc-plan-spin relative size-[14px] text-foreground" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".2" strokeWidth="3.5" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
          </motion.span>
        )}
        {status === "done" && (
          <motion.svg key="d" viewBox="0 0 24 24" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={spring} className="size-5 text-emerald-600 dark:text-emerald-400" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="currentColor" />
            <motion.path d="M7.5 12.5l3 3 6-7" stroke="var(--background)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={reduce ? { duration: 0 } : { duration: 0.28, delay: 0.1, ease: "easeOut" }} />
          </motion.svg>
        )}
        {status === "error" && (
          <motion.span key="e" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={spring} className="grid size-5 place-items-center rounded-full bg-rose-600 text-white dark:bg-rose-500">
            <svg viewBox="0 0 24 24" className="size-3" fill="none" aria-hidden="true">
              <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </motion.span>
        )}
        {status === "skipped" && (
          <motion.span key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={spring} className="grid size-[14px] place-items-center rounded-full bg-muted-foreground/25">
            <span className="h-0.5 w-1.5 rounded-full bg-muted-foreground" />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

function Step({ step, reduce, l, autoCollapse, onStepClick }: { step: PlanStep; reduce: boolean; l: AgentPlanLabels; autoCollapse: boolean; onStepClick?: (s: PlanStep) => void }) {
  const uid = React.useId()
  const status = step.status ?? "pending"
  const children = step.steps ?? []
  const [manual, setManual] = React.useState<boolean | null>(null)
  const open = manual ?? !(autoCollapse && status === "done")
  const statusText = l[status]
  const Title = onStepClick ? "button" : "div"

  return (
    <motion.li
      layout="position"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={reduce ? { duration: 0 } : springs.snap}
      data-status={status}
      className="relative"
    >
      <div className="flex items-start gap-2.5 py-1">
        <StatusIcon status={status} reduce={reduce} />
        <span className="sr-only">{statusText}: </span>
        <Title
          {...(onStepClick ? { type: "button" as const, onClick: () => onStepClick(step) } : {})}
          className={cn(
            "min-w-0 flex-1 text-start leading-5",
            onStepClick && "rounded-md outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50",
            status === "done" || status === "skipped" ? "text-muted-foreground" : "text-foreground",
            status === "skipped" && "line-through decoration-muted-foreground/50",
          )}
        >
          <span className={cn("block text-sm", status === "active" && "font-medium")}>{step.title}</span>
          {step.detail && <span className="block text-xs leading-5 text-muted-foreground">{step.detail}</span>}
        </Title>
        {children.length > 0 && (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`${uid}-sub`}
            aria-label={l.toggle}
            onClick={() => setManual(!open)}
            className="pc-press grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ChevronRight className={cn("size-3.5 transition-transform duration-200 rtl:rotate-180", open && "rotate-90 rtl:rotate-90")} aria-hidden="true" />
          </button>
        )}
      </div>
      {children.length > 0 && (
        <AnimatePresence initial={false}>
          {open && (
            <motion.ol
              key="sub"
              id={`${uid}-sub`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={reduce ? { duration: 0 } : springs.ui}
              className="relative ms-[9px] overflow-hidden border-s ps-4"
            >
              {children.map((c) => (
                <Step key={c.id} step={c} reduce={reduce} l={l} autoCollapse={autoCollapse} onStepClick={onStepClick} />
              ))}
            </motion.ol>
          )}
        </AnimatePresence>
      )}
    </motion.li>
  )
}

/** Live checklist of an agent's plan with nested substeps and overall progress. */
export function AgentPlan({ steps, title, showProgress = true, autoCollapse = true, variant = "card", onStepClick, labels, className, ...props }: AgentPlanProps) {
  const l = useLabels("agent-plan", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const { done, total } = count(steps)
  const pct = total ? done / total : 0
  const failed = steps.some((s) => s.status === "error")

  return (
    <section aria-label={typeof title === "string" ? title : undefined} className={cn("pc-plan text-sm", variant === "card" && "rounded-xl border bg-card p-4 text-card-foreground", className)} {...props}>
      <GooduiTokens />
      <style href="pc-agent-plan" precedence="default">
        {CSS}
      </style>
      {(title || showProgress) && (
        <header className="mb-2">
          <div className="flex items-center gap-2">
            {title && (
              <h3 className="flex items-center gap-1.5 text-sm font-medium">
                <ListChecks className="size-4 text-muted-foreground" aria-hidden="true" />
                {title}
              </h3>
            )}
            {showProgress && <span className="ms-auto text-xs text-muted-foreground tabular-nums">{l.progress(done, total)}</span>}
          </div>
          {showProgress && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={typeof title === "string" ? title : l.progress(done, total)} aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-valuetext={l.progress(done, total)}>
              <motion.div
                className={cn("h-full origin-left rounded-full rtl:origin-right", failed ? "bg-rose-500" : pct >= 1 ? "bg-emerald-500" : "bg-foreground")}
                initial={false}
                animate={{ scaleX: pct }}
                transition={reduce ? { duration: 0 } : springs.morph}
              />
            </div>
          )}
        </header>
      )}
      <ol className="flex flex-col">
        <AnimatePresence initial={false}>
          {steps.map((s) => (
            <Step key={s.id} step={s} reduce={reduce} l={l} autoCollapse={autoCollapse} onStepClick={onStepClick} />
          ))}
        </AnimatePresence>
      </ol>
    </section>
  )
}
