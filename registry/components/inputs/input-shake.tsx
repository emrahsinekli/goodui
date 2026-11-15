"use client"

import * as React from "react"
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { spring, ease as easing } from "@/lib/goodui-motion"

export type InputShakeStatus = "idle" | "invalid" | "valid"

type ChildProps = {
  id?: string
  className?: string
  "aria-invalid"?: React.AriaAttributes["aria-invalid"]
  "aria-describedby"?: string
}

export type InputShakeProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** "invalid" shakes the field (on entry) and shows `message`; "valid" draws a check and shows `successMessage`. */
  status?: InputShakeStatus
  /** Error text shown while invalid. */
  message?: React.ReactNode
  /** Optional text shown while valid. */
  successMessage?: React.ReactNode
  /** Change this (e.g. a submit counter) to shake again while the field is still invalid. */
  shakeKey?: number | string
  /** Visible label rendered as a <label> linked to the child's id. */
  label?: React.ReactNode
  /** Helper text shown when there is no message. */
  hint?: React.ReactNode
  /** A single input-like element (native input, shadcn Input, select…). */
  children: React.ReactElement<ChildProps>
}

function DrawnCheck({ reduce }: { reduce: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="size-[18px]" fill="none" aria-hidden="true">
      <motion.circle
        cx="10"
        cy="10"
        r="8.25"
        className="fill-emerald-500/12 stroke-emerald-500"
        strokeWidth="1.5"
        initial={reduce ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />
      <motion.path
        d="M6.5 10.4 8.9 12.7 13.6 7.6"
        className="stroke-emerald-600 dark:stroke-emerald-400"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.25, delay: reduce ? 0 : 0.18, ease: "easeOut" }}
      />
    </svg>
  )
}

/** Validation wrapper: shakes the field and slides in an error when invalid, draws a check when valid. */
export function InputShake({ status = "idle", message, successMessage, shakeKey, label, hint, children, className, ...props }: InputShakeProps) {
  const reduce = useReducedMotion() ?? false
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const uid = React.useId()
  const childId = children.props.id ?? `${uid}-field`
  const msgId = `${uid}-msg`
  const prev = React.useRef(status)
  const prevKey = React.useRef(shakeKey)

  React.useEffect(() => {
    const becameInvalid = status === "invalid" && prev.current !== "invalid"
    const reShake = status === "invalid" && shakeKey !== prevKey.current
    prev.current = status
    prevKey.current = shakeKey
    if ((becameInvalid || reShake) && !reduce && scope.current) {
      animate(scope.current, { x: [0, -8, 8, -6, 6, -3, 3, 0] }, { duration: 0.42, ease: "easeInOut" })
    }
  }, [status, shakeKey, reduce, animate, scope])

  const text = status === "invalid" ? message : status === "valid" ? successMessage : undefined
  const describedBy = [children.props["aria-describedby"], (text || hint) && msgId].filter(Boolean).join(" ") || undefined

  const field = React.cloneElement(children, {
    id: childId,
    "aria-invalid": status === "invalid" ? true : children.props["aria-invalid"],
    "aria-describedby": describedBy,
    className: cn(
      children.props.className,
      "pe-9",
      status === "invalid" && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
      status === "valid" && "border-emerald-500/70 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20",
    ),
  })

  return (
    <div className={cn("grid gap-1.5", className)} {...props}>
      {label && (
        <label htmlFor={childId} className="text-sm font-medium">
          {label}
        </label>
      )}
      <div ref={scope} className="relative flex items-center">
        {field}
        <span className="pointer-events-none absolute end-2.5 grid size-5 place-items-center">
          <AnimatePresence mode="wait" initial={false}>
            {status === "invalid" && (
              <motion.span
                key="invalid"
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.4, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: reduce ? 1 : 0.5 }}
                transition={reduce ? { duration: 0.1 } : spring.play}
                className="text-destructive"
              >
                <AlertCircle className="size-[18px]" aria-hidden="true" />
              </motion.span>
            )}
            {status === "valid" && (
              <motion.span key="valid" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }}>
                <DrawnCheck reduce={reduce} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </div>
      <AnimatePresence initial={false} mode="wait">
        {text ? (
          <motion.p
            key={`${status}-msg`}
            id={msgId}
            role={status === "invalid" ? "alert" : "status"}
            initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0, y: -4 }}
            transition={{ duration: reduce ? 0.1 : 0.2, ease: easing.out }}
            className={cn(
              "overflow-hidden text-xs font-medium",
              status === "invalid" ? "text-destructive" : "text-emerald-700 dark:text-emerald-400",
            )}
          >
            {text}
          </motion.p>
        ) : hint ? (
          <motion.p key="hint" id={msgId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.08 } }} className="text-xs text-muted-foreground">
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
