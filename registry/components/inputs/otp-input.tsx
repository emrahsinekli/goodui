"use client"

import * as React from "react"
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { spring } from "@/lib/goodui-motion"

const CSS = `
@keyframes pc-otp-input-caret { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
.pc-otp-input-caret { animation: pc-otp-input-caret 1.05s step-end infinite }
@keyframes pc-otp-input-pulse { 0%, 100% { opacity: 1 } 50% { opacity: .45 } }
.pc-otp-input-verifying .pc-otp-input-cell { animation: pc-otp-input-pulse 1s ease-in-out infinite; animation-delay: calc(var(--i) * 90ms) }
@media (prefers-reduced-motion: reduce) {
  .pc-otp-input-caret, .pc-otp-input-verifying .pc-otp-input-cell { animation: none }
}
`

export type OtpStatus = "idle" | "verifying" | "success" | "error"

export type OtpInputProps = Omit<React.ComponentProps<"div">, "onChange" | "defaultValue"> & {
  /** Number of cells. */
  length?: number
  /** Controlled code (no gaps, at most `length` characters). Pair with `onValueChange`. */
  value?: string
  /** Initial code when uncontrolled. */
  defaultValue?: string
  /** Called with the current code on every change, including paste, autofill and clear-on-error. */
  onValueChange?: (code: string) => void
  /**
   * Called once every cell is filled. Return (or resolve) `true` for success, `false` for error.
   * While a returned promise is pending the cells pulse and are read-only.
   */
  onComplete?: (code: string) => void | boolean | Promise<boolean | void>
  /** Force a status from outside (e.g. after your own server check). */
  status?: OtpStatus
  /** Allowed characters. */
  allow?: "numeric" | "alphanumeric"
  /** Show dots instead of characters (PINs). */
  mask?: boolean
  /** Put a separator after every N cells; 0 for none. */
  groupSize?: number
  /** Empty the cells and refocus the first one after an error. */
  clearOnError?: boolean
  /** Focus the first cell on mount. */
  autoFocus?: boolean
  disabled?: boolean
  /** Form field name for a hidden input with the full code. */
  name?: string
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<OtpInputLabels>
}

export type OtpInputLabels = {
  character: (index: number, length: number) => string
  verifying: string
  success: string
  error: string
}
const DEFAULT_LABELS: OtpInputLabels = {
  character: (index, length) => `Character ${index} of ${length}`,
  verifying: "Verifying code…",
  success: "Code verified",
  error: "That code is incorrect",
}

/** One-time code input from plain inputs: auto-advance, paste and autofill, popping digits, success and error states. */
export function OtpInput({
  length = 6,
  value,
  defaultValue = "",
  onValueChange,
  onComplete,
  status: statusProp,
  allow = "numeric",
  mask = false,
  groupSize = 3,
  clearOnError = true,
  autoFocus,
  disabled,
  name,
  labels,
  className,
  "aria-label": ariaLabel = "Verification code",
  ...props
}: OtpInputProps) {
  const l = useLabels("otp-input", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const [inner, setInner] = React.useState(defaultValue.slice(0, length))
  const code = (value ?? inner).slice(0, length)
  const [innerStatus, setInnerStatus] = React.useState<OtpStatus>("idle")
  const status = statusProp ?? innerStatus
  const [focused, setFocused] = React.useState(-1)
  const refs = React.useRef<(HTMLInputElement | null)[]>([])
  const [rowScope, animateRow] = useAnimate<HTMLDivElement>()
  const run = React.useRef(0)
  const onCompleteRef = React.useRef(onComplete)
  React.useLayoutEffect(() => {
    onCompleteRef.current = onComplete
  })
  // Programmatic focus moves skip the "jump to first empty cell" redirect.
  const internalFocus = React.useRef(false)

  const chars = Array.from({ length }, (_, i) => code[i] ?? "")
  const filter = (s: string) => (allow === "numeric" ? s.replace(/\D/g, "") : s.replace(/[^a-z0-9]/gi, "").toUpperCase())
  const locked = disabled || status === "verifying" || status === "success"

  const setCode = (next: string) => {
    const v = next.slice(0, length)
    if (value === undefined) setInner(v)
    onValueChange?.(v)
    if (statusProp === undefined && innerStatus !== "idle") setInnerStatus("idle")
  }

  const focusCell = (i: number) => {
    const el = refs.current[Math.max(0, Math.min(length - 1, i))]
    if (!el || el === document.activeElement) return
    internalFocus.current = true
    el.focus()
    internalFocus.current = false
  }

  // Fire onComplete when the code becomes complete, whatever filled it (typing, paste, SMS autofill or a parent).
  const wasComplete = React.useRef(code.length === length)
  React.useEffect(() => {
    const complete = code.length === length
    if (complete && !wasComplete.current) {
      const id = ++run.current
      const finish = (r: boolean | void) => {
        if (id !== run.current) return
        if (r === true) setInnerStatus("success")
        else if (r === false) setInnerStatus("error")
        else setInnerStatus("idle")
      }
      const r = onCompleteRef.current?.(code)
      if (r && typeof (r as Promise<boolean | void>).then === "function") {
        setInnerStatus("verifying")
        ;(r as Promise<boolean | void>).then(finish, () => finish(false))
      } else finish(r as boolean | void)
    }
    if (!complete) {
      run.current++
      // A parent reset (or deleting a character) leaves the success/verifying state.
      setInnerStatus((s) => (s === "error" ? s : "idle"))
    }
    wasComplete.current = complete
  }, [code, length])

  // Error: shake, then optionally clear and refocus.
  React.useEffect(() => {
    if (status !== "error") return
    if (!reduce && rowScope.current) animateRow(rowScope.current, { x: [0, -10, 10, -7, 7, -3, 0] }, { duration: 0.45 })
    if (!clearOnError) return
    const t = window.setTimeout(() => {
      if (value === undefined) setInner("")
      onValueChange?.("")
      if (statusProp === undefined) setInnerStatus("idle")
      focusCell(0)
    }, 650)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const fillFrom = (start: number, text: string) => {
    const clean = filter(text)
    if (!clean) return
    // A full-length paste always replaces the whole code.
    const from = clean.length >= length ? 0 : start
    const next = chars.slice()
    for (let k = 0; k < clean.length && from + k < length; k++) next[from + k] = clean[k]!
    const joined = next.join("")
    // Keep only the contiguous filled prefix so the code never has holes.
    const firstHole = next.findIndex((c) => !c)
    setCode(firstHole === -1 ? joined : next.slice(0, firstHole).join(""))
    const after = Math.min(from + clean.length, length - 1)
    focusCell(after)
  }

  const onInput = (i: number, raw: string) => {
    const old = chars[i]
    let incoming = raw
    if (old && raw.length === 2) incoming = raw.startsWith(old) ? raw.slice(1) : raw.slice(0, 1)
    const clean = filter(incoming)
    if (!clean) return
    if (clean.length > 1) return fillFrom(i, clean)
    const next = chars.slice()
    next[i] = clean
    const firstHole = next.findIndex((c) => !c)
    setCode(firstHole === -1 ? next.join("") : next.slice(0, firstHole).join(""))
    if (i < length - 1) focusCell(i + 1)
  }

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault()
      if (locked) return
      // Behaves like text: the characters after the removed one shift left.
      if (chars[i]) {
        setCode(code.slice(0, i) + code.slice(i + 1))
      } else if (e.key === "Backspace" && i > 0) {
        setCode(code.slice(0, i - 1) + code.slice(i))
        focusCell(i - 1)
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      focusCell(i - 1)
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      if (chars[i]) focusCell(i + 1)
    } else if (e.key === "Home") {
      e.preventDefault()
      focusCell(0)
    } else if (e.key === "End") {
      e.preventDefault()
      focusCell(Math.min(code.length, length - 1))
    }
  }

  const tone =
    status === "success"
      ? "border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
      : status === "error"
        ? "border-destructive bg-destructive/5 text-destructive"
        : ""

  return (
    <div className={cn("inline-flex flex-col items-center gap-2", className)} {...props}>
      <style href="pc-otp-input" precedence="default">
        {CSS}
      </style>
      <div
        ref={rowScope}
        role="group"
        aria-label={ariaLabel}
        className={cn("flex items-center gap-1.5 sm:gap-2", status === "verifying" && "pc-otp-input-verifying")}
      >
        {chars.map((ch, i) => (
          <React.Fragment key={i}>
            {groupSize > 0 && i > 0 && i % groupSize === 0 && (
              <span aria-hidden="true" className="mx-0.5 h-0.5 w-2.5 rounded-full bg-border sm:mx-1" />
            )}
            <motion.div
              className={cn(
                "pc-otp-input-cell relative grid h-12 w-10 place-items-center rounded-lg border border-input bg-background text-xl font-semibold shadow-xs transition-[border-color,box-shadow,background-color,color] sm:h-14 sm:w-12 sm:text-2xl dark:bg-input/30",
                ch && "border-foreground/25",
                focused === i && "border-ring ring-3 ring-ring/50",
                tone,
                disabled && "opacity-50",
              )}
              style={{ ["--i" as string]: i }}
              animate={status === "success" && !reduce ? { y: [0, -6, 0] } : { y: 0 }}
              transition={status === "success" ? { duration: 0.4, delay: i * 0.045, ease: "easeOut" } : { duration: 0 }}
            >
              <input
                ref={(el) => {
                  refs.current[i] = el
                }}
                type="text"
                inputMode={allow === "numeric" ? "numeric" : "text"}
                autoComplete={i === 0 ? "one-time-code" : "off"}
                pattern={allow === "numeric" ? "[0-9]*" : undefined}
                aria-label={l.character(i + 1, length)}
                aria-invalid={status === "error" || undefined}
                autoFocus={autoFocus && i === 0}
                disabled={disabled}
                readOnly={locked}
                value={ch}
                onChange={(e) => !locked && onInput(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                onPaste={(e) => {
                  e.preventDefault()
                  if (!locked) fillFrom(i, e.clipboardData.getData("text"))
                }}
                onFocus={(e) => {
                  // Jump to the first empty cell so the code never has gaps.
                  if (!internalFocus.current && i > code.length) {
                    focusCell(code.length)
                    return
                  }
                  setFocused(i)
                  const el = e.currentTarget
                  requestAnimationFrame(() => el.select())
                }}
                onBlur={() => setFocused((f) => (f === i ? -1 : f))}
                className="absolute inset-0 size-full rounded-lg bg-transparent text-center text-transparent caret-transparent outline-none selection:bg-transparent disabled:cursor-not-allowed"
              />
              <span aria-hidden="true" className="pointer-events-none relative">
                <AnimatePresence initial={false} mode="popLayout">
                  {ch ? (
                    <motion.span
                      key={ch + i}
                      className="block"
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.5 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, transition: { duration: 0.1 } }}
                      transition={reduce ? { duration: 0.1 } : spring.play}
                    >
                      {mask ? <span className="mx-auto block size-3 rounded-full bg-current" /> : ch}
                    </motion.span>
                  ) : focused === i && !locked ? (
                    <motion.span
                      key="caret"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0 } }}
                      className="block"
                    >
                      <span className="pc-otp-input-caret block h-6 w-0.5 rounded-full bg-foreground sm:h-7" />
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </span>
            </motion.div>
          </React.Fragment>
        ))}
      </div>
      {name && <input type="hidden" name={name} value={code} />}
      <span role="status" aria-live="polite" className="sr-only">
        {status === "idle" ? "" : l[status]}
      </span>
    </div>
  )
}
