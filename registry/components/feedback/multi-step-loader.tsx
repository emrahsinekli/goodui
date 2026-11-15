"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { SuccessCheck } from "@/registry/components/feedback/success-check"
import { GooduiTokens, ease, spring as springs } from "@/lib/goodui-motion"

const CSS = `
@keyframes pc-multi-step-loader-spin { to { transform: rotate(360deg) } }
.pc-multi-step-loader-spin { animation: pc-multi-step-loader-spin .8s linear infinite; transform-box: view-box; transform-origin: center; }
@media (prefers-reduced-motion: reduce) { .pc-multi-step-loader-spin { animation-duration: 2.4s } }
`

export type MultiStep = string | { label: React.ReactNode; description?: React.ReactNode }

/** Built-in text: the "Step x of n" line (also read by screen readers) and the fallback "Done" announcement. */
export type MultiStepLoaderLabels = { stepOf: (step: number, count: number) => string; done: string }
const DEFAULT_LABELS: MultiStepLoaderLabels = { stepOf: (step, count) => `Step ${step} of ${count}`, done: "Done" }

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export type MultiStepLoaderProps = Omit<React.ComponentProps<"div">, "children" | "title"> & {
  /** Steps in order: a string, or { label, description } where the description shows under the active step. */
  steps: MultiStep[]
  /** Controlled active step (0-based). steps.length means everything is done. */
  step?: number
  /** Auto-advance while true (uncontrolled only). */
  running?: boolean
  /** Ms per step when auto-advancing. A number per step is allowed. */
  stepDuration?: number | number[]
  /** Called with the new step index when auto-advancing (uncontrolled mode only). */
  onStepChange?: (step: number) => void
  /** Called once every step is done. */
  onComplete?: () => void
  /** Heading while the steps run. */
  title?: React.ReactNode
  /** Heading on the final success state, next to an animated check. */
  successTitle?: React.ReactNode
  /** Line under successTitle. */
  successDescription?: React.ReactNode
  /** Rendered under the success message, e.g. a "View booking" button. */
  successAction?: React.ReactNode
  /** "overlay" covers the page with a blurred backdrop and a centered card. */
  variant?: "card" | "overlay"
  /** "line" (default) is one surface whose text and width morph per step; "list" shows every step as a checklist. */
  display?: "line" | "list"
  /** Overlay only. */
  open?: boolean
  /** Overlay only. Esc and the backdrop close it once all steps are done. */
  onOpenChange?: (open: boolean) => void
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<MultiStepLoaderLabels>
}

function normalize(s: MultiStep) {
  return typeof s === "string" ? { label: s, description: undefined } : s
}

/** One ring for the whole run: the arc grows with progress, closes at the end and the check draws inside it. */
function LineIcon({ progress, done, reduce }: { progress: number; done: boolean; reduce: boolean }) {
  const [spin, setSpin] = React.useState(!done)
  if (!done && !spin) setSpin(true)
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-6 shrink-0 overflow-visible transition-colors duration-300", done ? "text-emerald-600 dark:text-emerald-400" : "text-primary")}
      animate={done && !reduce ? { scale: [1, 1.14, 1] } : { scale: 1 }}
      transition={{ duration: 0.42, delay: done ? 0.22 : 0, ease: ease.out }}
    >
      <motion.circle cx="12" cy="12" r="11" fill="currentColor" initial={false} animate={{ opacity: done ? 0.16 : 0 }} transition={{ duration: reduce ? 0 : 0.3 }} />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".16" strokeWidth="2.5" />
      <g className={spin ? "pc-multi-step-loader-spin" : undefined}>
        <motion.circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          transform="rotate(-90 12 12)"
          initial={false}
          animate={{ pathLength: done ? 1 : Math.max(0.2, progress) }}
          transition={reduce ? { duration: 0 } : { duration: 0.36, ease: ease.out }}
          onAnimationComplete={() => {
            if (done) setSpin(false)
          }}
        />
      </g>
      <motion.path
        d="M7.5 12.5l3 3 6-6.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.26, delay: done ? 0.22 : 0, ease: ease.out, opacity: { duration: 0.01, delay: done ? 0.22 : 0 } }}
      />
    </motion.svg>
  )
}

function StepIcon({ state, index, reduce }: { state: "done" | "active" | "pending"; index: number; reduce: boolean }) {
  return (
    <span className="relative grid size-6 shrink-0 place-items-center">
      <AnimatePresence initial={false} mode="popLayout">
        {state === "done" ? (
          <motion.span
            key="done"
            className="absolute inset-0 grid place-items-center rounded-full bg-emerald-500 text-white dark:bg-emerald-500"
            initial={reduce ? { opacity: 0 } : { scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduce ? { duration: 0 } : springs.play}
          >
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" aria-hidden="true">
              <motion.path
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: reduce ? 1 : 0, opacity: reduce ? 1 : 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={reduce ? { duration: 0 } : { duration: 0.28, delay: 0.08, ease: "easeOut", opacity: { duration: 0.01, delay: 0.08 } }}
              />
            </svg>
          </motion.span>
        ) : state === "active" ? (
          <motion.span key="active" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <svg viewBox="0 0 24 24" className="pc-multi-step-loader-spin size-6 text-primary" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".18" strokeWidth="2.5" />
              <path d="M22 12A10 10 0 0 0 12 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </motion.span>
        ) : (
          <motion.span
            key="pending"
            className="absolute inset-0 grid place-items-center rounded-full border text-[11px] font-medium text-muted-foreground"
            exit={{ opacity: 0 }}
          >
            {index + 1}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

function LoaderCard({
  steps,
  step: stepProp,
  running = true,
  stepDuration = 1100,
  onStepChange,
  onComplete,
  title = "Working on it",
  successTitle = "All done",
  successDescription,
  successAction,
  titleId,
  display = "line",
  labels,
  className,
  ...props
}: Omit<MultiStepLoaderProps, "variant" | "open" | "onOpenChange"> & { titleId?: string }) {
  const l = useLabels("multi-step-loader", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const [internal, setInternal] = React.useState(0)
  const controlled = stepProp !== undefined
  const step = Math.min(controlled ? stepProp : internal, steps.length)
  const done = step >= steps.length
  const items = steps.map(normalize)

  const changeRef = React.useRef(onStepChange)
  const completeRef = React.useRef(onComplete)
  React.useEffect(() => {
    changeRef.current = onStepChange
    completeRef.current = onComplete
  })

  // Depend on the number, not the array, so an inline array does not restart the timer on every render.
  const ms = Array.isArray(stepDuration) ? (stepDuration[internal] ?? 1100) : stepDuration
  React.useEffect(() => {
    if (controlled || !running || internal >= steps.length) return
    const id = window.setTimeout(() => {
      setInternal((s) => s + 1)
      changeRef.current?.(internal + 1)
    }, ms)
    return () => window.clearTimeout(id)
  }, [controlled, running, internal, steps.length, ms])

  React.useEffect(() => {
    if (done) completeRef.current?.()
  }, [done])

  const spring = reduce ? { duration: 0 } : springs.morph
  const current = items[step]

  if (display === "line") {
    const shown = done ? { label: successTitle, description: successDescription } : current
    const swap = {
      initial: reduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: "blur(4px)" },
      animate: { opacity: 1, y: 0, filter: "blur(0px)" },
      exit: reduce ? { opacity: 0 } : { opacity: 0, y: -12, filter: "blur(4px)" },
    }
    return (
      <motion.div
        layout
        transition={spring}
        style={{ borderRadius: 18 }}
        className={cn("relative mx-auto w-fit max-w-[min(24rem,100%)] min-w-60 overflow-hidden bg-card text-card-foreground shadow-[var(--pc-e2)]", className)}
        {...(props as React.ComponentProps<typeof motion.div>)}
      >
        <GooduiTokens />
        <style href="pc-multi-step-loader" precedence="default">
          {CSS}
        </style>
        <span className="sr-only" role="status" aria-live="polite">
          {done ? (typeof successTitle === "string" ? successTitle : l.done) : typeof current?.label === "string" ? current.label : l.stepOf(step + 1, steps.length)}
        </span>
        <span id={titleId} className="sr-only">
          {done ? successTitle : title}
        </span>
        <motion.div layout="position" transition={spring} className="flex items-center gap-3 py-3 ps-3.5 pe-4">
          <LineIcon progress={steps.length ? (step + 1) / steps.length : 0} done={done} reduce={reduce} />
          <div className="relative min-w-0">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div key={done ? "done" : step} {...swap} transition={{ duration: reduce ? 0 : 0.24, ease: ease.out }}>
                <div className="text-sm leading-5 font-medium">{shown?.label}</div>
                {shown?.description && <div className="text-xs leading-4 text-muted-foreground">{shown.description}</div>}
              </motion.div>
            </AnimatePresence>
          </div>
          {!done && <span className="ms-auto shrink-0 ps-2 text-xs text-muted-foreground tabular-nums">{l.stepOf(step + 1, steps.length)}</span>}
        </motion.div>
        {done && successAction && (
          <motion.div
            className="flex justify-end gap-2 border-t border-[var(--pc-hair)] px-3 py-2.5"
            initial={reduce ? { opacity: 0 } : { opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: reduce ? 0 : 0.24, delay: reduce ? 0 : 0.2 }}
          >
            {successAction}
          </motion.div>
        )}
        <motion.div
          aria-hidden="true"
          className={cn("absolute inset-x-0 bottom-0 h-0.5 origin-left rtl:origin-right", done ? "bg-emerald-500" : "bg-primary")}
          initial={false}
          animate={{ scaleX: steps.length ? step / steps.length : 0, opacity: done ? 0 : 1 }}
          transition={reduce ? { duration: 0 } : { scaleX: spring, opacity: { duration: 0.3, delay: 0.3 } }}
        />
      </motion.div>
    )
  }

  return (
    <div className={cn("w-full max-w-sm overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-[var(--pc-e1)]", className)} {...props}>
      <GooduiTokens />
      <style href="pc-multi-step-loader" precedence="default">
        {CSS}
      </style>
      <span className="sr-only" role="status" aria-live="polite">
        {done ? (typeof successTitle === "string" ? successTitle : l.done) : typeof current?.label === "string" ? current.label : l.stepOf(step + 1, steps.length)}
      </span>

      <div className="relative overflow-hidden border-b px-5 pt-5 pb-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {done ? (
            <motion.div
              key="done"
              className="flex items-center gap-3"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={spring}
            >
              <SuccessCheck size={40} />
              <div className="min-w-0">
                <div id={titleId} className="font-semibold">
                  {successTitle}
                </div>
                {successDescription && <div className="text-sm text-muted-foreground">{successDescription}</div>}
              </div>
            </motion.div>
          ) : (
            <motion.div key="progress" initial={false} exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }} transition={spring}>
              <div id={titleId} className="font-semibold">
                {title}
              </div>
              <div className="mt-0.5 text-sm text-muted-foreground tabular-nums">{l.stepOf(Math.min(step + 1, steps.length), steps.length)}</div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-muted">
          <motion.div
            className={cn("h-full origin-left rtl:origin-right", done ? "bg-emerald-500" : "bg-primary")}
            initial={false}
            animate={{ scaleX: steps.length ? step / steps.length : 0 }}
            transition={spring}
          />
        </div>
      </div>

      <ol className="px-5 py-4">
        {items.map((s, i) => {
          const state = i < step ? "done" : i === step ? "active" : "pending"
          return (
            <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
              {i < items.length - 1 && (
                <span aria-hidden="true" className="absolute start-[11px] top-7 bottom-1 w-0.5 overflow-hidden rounded-full bg-muted">
                  <motion.span
                    className="block h-full w-full origin-top bg-emerald-500"
                    initial={false}
                    animate={{ scaleY: i < step ? 1 : 0 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.35, ease: "easeOut", delay: 0.1 }}
                  />
                </span>
              )}
              <StepIcon state={state} index={i} reduce={reduce} />
              <div className="min-w-0 flex-1 pt-0.5">
                <div
                  className={cn(
                    "text-sm transition-colors duration-300",
                    state === "active" ? "font-medium text-foreground" : state === "done" ? "text-foreground/80" : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </div>
                <AnimatePresence initial={false}>
                  {state === "active" && s.description && (
                    <motion.div
                      key="desc"
                      className="overflow-hidden text-xs text-muted-foreground"
                      initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                      exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={reduce ? { duration: 0 } : { duration: 0.22, ease: "easeOut" }}
                    >
                      <div className="pt-0.5">{s.description}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </li>
          )
        })}
      </ol>

      <AnimatePresence initial={false}>
        {done && successAction && (
          <motion.div
            key="action"
            className="overflow-hidden"
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            transition={reduce ? { duration: 0 } : { duration: 0.25, ease: "easeOut", delay: 0.2 }}
          >
            <div className="flex justify-end gap-2 border-t px-5 py-3">{successAction}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * One line that morphs through the steps, its ring closing into a check at the end; display="list" is the checklist form.
 * Inline card or overlay.
 * The overlay is a modal dialog: it takes focus, traps Tab inside and gives focus back when it closes.
 */
export function MultiStepLoader({ variant = "card", open = true, onOpenChange, ...props }: MultiStepLoaderProps) {
  const reduce = useReducedMotion() ?? false
  const titleId = React.useId()
  const dialogRef = React.useRef<HTMLDivElement>(null)
  const [finished, setFinished] = React.useState(false)
  const { onComplete } = props

  React.useEffect(() => {
    if (variant !== "overlay" || !open) return
    setFinished(false)
    const previous = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    return () => previous?.focus?.()
  }, [variant, open])

  if (variant === "card") return <LoaderCard {...props} />

  const close = () => {
    if (finished) onOpenChange?.(false)
  }

  return (
    <AnimatePresence>
      <GooduiTokens />
      {open && (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-50 grid place-items-center bg-background/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) close()
          }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="w-full max-w-sm outline-none"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation()
                close()
                return
              }
              // Keep Tab inside the modal; with nothing focusable yet, focus stays on the dialog itself.
              if (e.key !== "Tab" || !dialogRef.current) return
              const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
              if (!items.length) return e.preventDefault()
              const first = items[0]!
              const last = items[items.length - 1]!
              const active = document.activeElement
              if (e.shiftKey && (active === first || active === dialogRef.current)) {
                e.preventDefault()
                last.focus()
              } else if (!e.shiftKey && active === last) {
                e.preventDefault()
                first.focus()
              }
            }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
            transition={reduce ? { duration: 0 } : springs.ui}
          >
            <LoaderCard
              {...props}
              titleId={titleId}
              className={cn("shadow-[var(--pc-e3)]", props.className)}
              onComplete={() => {
                setFinished(true)
                onComplete?.()
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
