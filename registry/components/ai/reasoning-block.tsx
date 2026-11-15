"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Brain, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

/*
 * "Thinking 8.7s" disclosure for a model's reasoning: a live timer and shimmering label while it thinks, the
 * current step shown as a one-line preview, then "Thought for 8.7s" with the full step list and notes inside.
 */

const CSS = `
.pc-reason-shimmer{background:linear-gradient(90deg,var(--muted-foreground) 0%,var(--foreground) 45%,var(--muted-foreground) 100%);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:pc-reason-shimmer 1.6s linear infinite}
@keyframes pc-reason-shimmer{from{background-position:120% 0}to{background-position:-120% 0}}
@keyframes pc-reason-pulse{0%,100%{transform:scale(1);opacity:.55}50%{transform:scale(1.9);opacity:0}}
.pc-reason-dot::after{content:"";position:absolute;inset:0;border-radius:9999px;background:currentColor;animation:pc-reason-pulse 1.4s ease-out infinite}
@media (prefers-reduced-motion:reduce){.pc-reason-shimmer{animation:none;background:none;color:var(--foreground)}.pc-reason-dot::after{animation:none;display:none}}
`

export type ReasoningStep = {
  id?: string
  title: string
  /** Muted text under the title. */
  detail?: string
}

export type ReasoningBlockLabels = {
  thinking: (seconds: string) => string
  thought: (seconds: string) => string
  toggle: string
}
const DEFAULT_LABELS: ReasoningBlockLabels = { thinking: (s) => `Thinking ${s}`, thought: (s) => `Thought for ${s}`, toggle: "Show reasoning" }

export type ReasoningBlockProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** The model is still reasoning: the label shimmers and the timer runs. */
  thinking?: boolean
  /** Final duration in seconds, when you have it from the API. Otherwise the elapsed time is measured here. */
  duration?: number
  /** Step summaries, shown in order; the last one is the current step while thinking. */
  steps?: ReasoningStep[]
  /** Free-form reasoning text shown under the steps. */
  children?: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Show the current step under the header while collapsed and thinking. */
  preview?: boolean
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<ReasoningBlockLabels>
}

const fmt = (s: number) => `${s.toFixed(1)}s`

/** "Thinking 8.7s" disclosure with a live timer and step summaries. */
export function ReasoningBlock({ thinking = false, duration, steps = [], children, open: openProp, defaultOpen = false, onOpenChange, preview = true, labels, className, ...props }: ReasoningBlockProps) {
  const l = useLabels("reasoning-block", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const uid = React.useId()
  const [openInner, setOpenInner] = React.useState(defaultOpen)
  const open = openProp ?? openInner
  const [elapsed, setElapsed] = React.useState(0)
  const started = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (!thinking) return
    started.current = performance.now()
    setElapsed(0)
    const id = window.setInterval(() => setElapsed((performance.now() - (started.current ?? 0)) / 1000), 100)
    return () => {
      window.clearInterval(id)
      if (started.current !== null) setElapsed((performance.now() - started.current) / 1000)
    }
  }, [thinking])

  const seconds = thinking ? elapsed : (duration ?? elapsed)
  const label = thinking ? l.thinking(fmt(seconds)) : l.thought(fmt(seconds))
  const current = steps[steps.length - 1]
  const hasBody = steps.length > 0 || children !== undefined
  const toggle = () => {
    if (openProp === undefined) setOpenInner(!open)
    onOpenChange?.(!open)
  }

  return (
    <div data-thinking={thinking || undefined} className={cn("pc-reason text-sm", className)} {...props}>
      <GooduiTokens />
      <style href="pc-reasoning-block" precedence="default">
        {CSS}
      </style>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${uid}-body`}
        aria-label={`${l.toggle}: ${label}`}
        disabled={!hasBody}
        onClick={toggle}
        className="pc-press pc-press-soft group/reason inline-flex max-w-full items-center gap-1.5 rounded-md py-1 pe-1.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default"
      >
        <Brain className={cn("size-4 shrink-0", thinking ? "text-foreground" : "text-muted-foreground")} aria-hidden="true" />
        <span className={cn("font-medium tabular-nums", thinking ? "pc-reason-shimmer" : "text-muted-foreground group-hover/reason:text-foreground")} aria-hidden="true">
          {label}
        </span>
        {hasBody && <ChevronRight className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 rtl:rotate-180", open && "rotate-90 rtl:rotate-90")} aria-hidden="true" />}
      </button>

      {preview && thinking && !open && current && (
        <span className="sr-only" role="status" aria-live="polite">
          {current.title}
        </span>
      )}
      <AnimatePresence initial={false} mode="popLayout">
        {preview && thinking && !open && current && (
          <motion.div
            key={current.id ?? current.title}
            aria-hidden="true"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0.1 } } : { opacity: 0, y: -4, transition: { duration: 0.15 } }}
            transition={reduce ? { duration: 0 } : { duration: 0.2 }}
            className="ms-6 truncate text-xs text-muted-foreground"
          >
            {current.title}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {open && hasBody && (
          <motion.div
            key="body"
            id={`${uid}-body`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={reduce ? { duration: 0 } : spring.ui}
            className="overflow-hidden"
          >
            <div className="ms-2 mt-1 border-s-2 ps-4 pb-1">
              {steps.length > 0 && (
                <ol className="flex flex-col gap-2.5">
                  {steps.map((s, i) => {
                    const live = thinking && i === steps.length - 1
                    return (
                      <motion.li
                        key={s.id ?? `${i}-${s.title}`}
                        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={reduce ? { duration: 0 } : spring.snap}
                        className="relative flex gap-2.5"
                      >
                        <span className={cn("relative mt-[7px] size-1.5 shrink-0 rounded-full", live ? "pc-reason-dot bg-foreground text-foreground" : "bg-muted-foreground/60")} aria-hidden="true" />
                        <span className="min-w-0">
                          <span className={cn("block leading-5", live ? "text-foreground" : "text-muted-foreground")}>{s.title}</span>
                          {s.detail && <span className="block text-xs leading-5 text-muted-foreground">{s.detail}</span>}
                        </span>
                      </motion.li>
                    )
                  })}
                </ol>
              )}
              {children !== undefined && <div className={cn("text-muted-foreground leading-6", steps.length > 0 && "mt-3")}>{children}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
