"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { spring, ease as easing } from "@/lib/goodui-motion"

export type StepperStep = {
  title: React.ReactNode
  /** Second line under the title; hidden below the sm breakpoint in the horizontal layout. */
  description?: React.ReactNode
  /** Shown in the circle instead of the step number while the step is not complete. */
  icon?: React.ComponentType<{ className?: string }>
  /** Marks the step as failed: red circle, alert mark and a short shake. */
  error?: boolean
  /** Vertical stepper only: content that opens under the current step. */
  content?: React.ReactNode
}

export type StepperProps = Omit<React.ComponentProps<"ol">, "defaultValue" | "onChange"> & {
  /** The steps, in order. */
  steps: StepperStep[]
  /** Index of the current step. Use `steps.length` to show every step as complete. */
  value?: number
  /** Starting step when uncontrolled. */
  defaultValue?: number
  /** Called with the step index when a clickable step is clicked. */
  onValueChange?: (index: number) => void
  /** horizontal: steps in a row with titles under the circles. vertical: a column that can open content under the current step. */
  orientation?: "horizontal" | "vertical"
  /** Which steps can be clicked to jump to them. */
  clickable?: "completed" | "all" | "none"
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<StepperLabels>
}

type Status = "complete" | "current" | "upcoming" | "error"

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void) {
  const [inner, setInner] = React.useState(defaultValue)
  const controlled = value !== undefined
  const current = controlled ? value : inner
  const set = React.useCallback(
    (next: T) => {
      if (!controlled) setInner(next)
      onChange?.(next)
    },
    [controlled, onChange],
  )
  return [current, set] as const
}

/** Screen-reader status read after each step title. */
export type StepperLabels = { complete: string; current: string; upcoming: string; error: string }
const DEFAULT_LABELS: StepperLabels = {
  complete: "completed",
  current: "current step",
  upcoming: "not started",
  error: "needs attention",
}

const CIRCLE: Record<Status, string> = {
  complete: "border-primary bg-primary text-primary-foreground",
  current: "border-primary bg-background text-primary",
  upcoming: "border-border bg-background text-muted-foreground",
  error: "border-destructive bg-destructive text-white dark:text-background",
}

function Indicator({ status, index, icon: Icon, uid, reduce }: { status: Status; index: number; icon?: StepperStep["icon"]; uid: string; reduce: boolean }) {
  const swap: Transition = reduce ? { duration: 0 } : spring.ui
  const pop = reduce
    ? { scale: 1, x: 0 }
    : status === "complete"
      ? { scale: [1, 1.14, 1], x: 0 }
      : status === "error"
        ? { scale: 1, x: [0, -5, 5, -3, 3, 0] }
        : { scale: 1, x: 0 }
  return (
    <motion.span
      aria-hidden="true"
      className={cn(
        "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums transition-colors duration-300",
        CIRCLE[status],
      )}
      initial={false}
      animate={pop}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {status === "current" && (
        <motion.span
          layoutId={`${uid}-ring`}
          className="absolute -inset-[5px] rounded-full border-2 border-primary/25"
          transition={reduce ? { duration: 0 } : spring.morph}
        />
      )}
      <AnimatePresence mode="popLayout" initial={false}>
        {status === "complete" ? (
          <motion.svg
            key="check"
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={swap}
          >
            <motion.path
              d="M5 12.5l4.5 4.5L19 7.5"
              initial={{ pathLength: reduce ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={reduce ? { duration: 0 } : { duration: 0.3, delay: 0.08, ease: "easeOut" }}
            />
          </motion.svg>
        ) : status === "error" ? (
          <motion.span key="error" initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.4 }} transition={swap}>
            !
          </motion.span>
        ) : (
          <motion.span key="num" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={swap}>
            {Icon ? <Icon className="size-4" /> : index + 1}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.span>
  )
}

/**
 * Stepper with a connecting line that fills between steps, numbers that morph into checkmarks, an error state,
 * clickable completed steps, and a horizontal or vertical layout (vertical can open content under the current step).
 */
export function Stepper({
  steps,
  value,
  defaultValue = 0,
  onValueChange,
  orientation = "horizontal",
  clickable = "completed",
  labels,
  className,
  ...props
}: StepperProps) {
  const l = useLabels("stepper", DEFAULT_LABELS, labels)
  const uid = React.useId()
  const reduce = useReducedMotion() ?? false
  const [current, setCurrent] = useControllable(value, defaultValue, onValueChange)
  const vertical = orientation === "vertical"
  const fill: Transition = reduce ? { duration: 0 } : { duration: 0.45, ease: easing.drawer }

  const statusOf = (i: number): Status => (steps[i]?.error ? "error" : i < current ? "complete" : i === current ? "current" : "upcoming")

  return (
    <ol
      data-slot="stepper"
      data-orientation={orientation}
      className={cn(vertical ? "flex flex-col" : "flex w-full items-start", className)}
      {...props}
    >
      {steps.map((step, i) => {
        const status = statusOf(i)
        const canClick = clickable === "all" ? i !== current : clickable === "completed" ? i < current && i !== current : false
        const last = i === steps.length - 1
        const filled = i < current
        const Head = canClick ? "button" : "div"
        const headProps = canClick ? { type: "button" as const, onClick: () => setCurrent(i) } : {}

        const text = (
          <span className={cn("flex min-w-0 flex-col", vertical ? "pt-1 text-start" : "mt-2 items-center px-1 text-center")}>
            <span
              className={cn(
                "text-xs leading-snug font-medium transition-colors sm:text-sm",
                status === "upcoming" ? "text-muted-foreground" : status === "error" ? "text-destructive" : "text-foreground",
              )}
            >
              {step.title}
            </span>
            {step.description && (
              <span className={cn("text-xs text-muted-foreground", !vertical && "hidden sm:block")}>{step.description}</span>
            )}
            <span className="sr-only">, {l[status]}</span>
          </span>
        )

        if (vertical) {
          return (
            <li key={i} aria-current={status === "current" ? "step" : undefined} className={cn("relative flex gap-3", !last && "pb-6")}>
              {!last && (
                <span aria-hidden="true" className="absolute top-10 bottom-1.5 start-4 w-0.5 -translate-x-1/2 overflow-hidden rounded-full bg-border rtl:translate-x-1/2">
                  <motion.span className="absolute inset-0 origin-top bg-primary" initial={false} animate={{ scaleY: filled ? 1 : 0 }} transition={fill} />
                </span>
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <Head
                  {...headProps}
                  className={cn(
                    "-m-1 flex items-start gap-3 rounded-lg p-1 text-start outline-none",
                    canClick && "cursor-pointer transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50",
                  )}
                >
                  <Indicator status={status} index={i} icon={step.icon} uid={uid} reduce={reduce} />
                  {text}
                </Head>
                <AnimatePresence initial={false}>
                  {step.content && i === current && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={reduce ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.4 }}
                      className="-mx-1 overflow-hidden px-1 ps-12"
                    >
                      <div className="pt-2 pb-1">{step.content}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </li>
          )
        }

        return (
          <li key={i} aria-current={status === "current" ? "step" : undefined} className="relative flex min-w-0 flex-1 flex-col items-center">
            {!last && (
              <span
                aria-hidden="true"
                className="absolute top-[15px] start-[calc(50%+1.5rem)] end-[calc(-50%+1.5rem)] h-0.5 overflow-hidden rounded-full bg-border"
              >
                <motion.span className="absolute inset-0 origin-left bg-primary rtl:origin-right" initial={false} animate={{ scaleX: filled ? 1 : 0 }} transition={fill} />
              </span>
            )}
            <Head
              {...headProps}
              className={cn(
                "flex max-w-full flex-col items-center rounded-lg p-1 outline-none -mt-1",
                canClick && "group cursor-pointer focus-visible:ring-3 focus-visible:ring-ring/50",
              )}
            >
              <span className={cn("rounded-full transition-transform", canClick && "group-hover:scale-105")}>
                <Indicator status={status} index={i} icon={step.icon} uid={uid} reduce={reduce} />
              </span>
              {text}
            </Head>
          </li>
        )
      })}
    </ol>
  )
}
