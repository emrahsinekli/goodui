"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import type { SoundName } from "@/lib/goodui-sounds"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

const VARIANTS = {
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
  outline: "border bg-background text-foreground shadow-xs hover:bg-muted dark:bg-input/30 dark:hover:bg-input/50",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  default: "bg-primary text-primary-foreground shadow-[var(--pc-e1)] hover:bg-primary/90",
} as const

const SIZES = {
  "icon-sm": "size-7 rounded-md [&_svg]:size-3.5",
  icon: "size-9 rounded-lg [&_svg]:size-4",
  sm: "h-8 gap-1.5 rounded-md px-2.5 text-xs [&_svg]:size-3.5",
  md: "h-9 gap-2 rounded-lg px-3.5 text-sm [&_svg]:size-4",
} as const

type Status = "idle" | "copied" | "failed"

export type CopyButtonLabels = {
  /** Default hint (tooltip and aria-label of icon-only buttons); the hint prop overrides it. */
  hint: string
  /** Default visible text after copying; the copiedLabel prop overrides it. */
  copied: string
  /** Default tooltip when copying is blocked; gets whether the user is on a Mac. The failedLabel prop overrides it. */
  blocked: (mac: boolean) => string
  /** Screen reader announcement after a successful copy. */
  copiedAnnouncement: string
  /** Screen reader announcement when copying failed. */
  failedAnnouncement: string
}
const DEFAULT_LABELS: CopyButtonLabels = {
  hint: "Copy",
  copied: "Copied!",
  blocked: (mac) => (mac ? "Copy blocked · press ⌘C" : "Copy blocked · press Ctrl+C"),
  copiedAnnouncement: "Copied to clipboard",
  failedAnnouncement: "Copy failed. Select the text and press Control C.",
}

/** Clipboard API first; falls back to a hidden textarea + execCommand for insecure contexts and old browsers. */
async function writeClipboard(text: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through */
  }
  const active = document.activeElement as HTMLElement | null
  try {
    const ta = document.createElement("textarea")
    ta.value = text
    ta.setAttribute("readonly", "")
    Object.assign(ta.style, { position: "fixed", top: "0", left: "-9999px", opacity: "0", pointerEvents: "none" })
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand("copy")
    ta.remove()
    return ok
  } catch {
    return false
  } finally {
    active?.focus({ preventScroll: true })
  }
}

export type CopyButtonProps = Omit<React.ComponentProps<"button">, "value" | "onCopy"> & {
  /** Text to copy, or a function that returns it (can be async). */
  value: string | (() => string | Promise<string>)
  /** Milliseconds the "copied" state stays. */
  timeout?: number
  /** Called with the copied text after a successful copy. */
  onCopied?: (text: string) => void
  /** Called with the text when both the Clipboard API and the fallback fail, or with "" when the value function throws or rejects. */
  onCopyError?: (text: string) => void
  /** Visible text beside the icon; leave empty for an icon-only button. */
  label?: React.ReactNode
  /** Text shown in the tooltip (and the label) after copying. */
  copiedLabel?: string
  /** Tooltip text when copying is blocked; defaults to a ⌘C / Ctrl+C hint. */
  failedLabel?: string
  /** Hint shown in the tooltip on hover for icon-only buttons. */
  hint?: string
  /** "ghost" | "outline" | "secondary" | "default". Ghost also turns the icon emerald after copying. */
  variant?: keyof typeof VARIANTS
  /** "icon-sm" | "icon" | "sm" | "md". Defaults to "icon-sm" without a label and "sm" with one. */
  size?: keyof typeof SIZES
  /** Show the floating tooltip. */
  tooltip?: boolean
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<CopyButtonLabels>
  /** Plays "pop" after a copy (and "error" when it fails) when the visitor has sounds on (lib/goodui-sounds); a sound name replaces the pop. Off by default. */
  sound?: boolean | SoundName
}

// Optional UI sound: the sound module is loaded only when `sound` is on, so silent apps pay nothing.
function useCue(sound: boolean | SoundName | undefined) {
  React.useEffect(() => {
    if (sound) void import("@/lib/goodui-sounds")
  }, [sound])
  return React.useCallback(
    (fallback: SoundName, o?: { rate?: number; exact?: boolean }) => {
      if (!sound) return
      void import("@/lib/goodui-sounds").then((m) => m.play(sound === true || o?.exact ? fallback : sound, { rate: o?.rate }))
    },
    [sound],
  )
}

function CheckDraw({ reduce }: { reduce: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <motion.path
        d="M4.5 12.5 9.5 17.5 19.5 6.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.25, delay: 0.05, ease: "easeOut" }}
      />
    </svg>
  )
}

function XDraw() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

/** Copy-to-clipboard button: icon morphs copy → check, a "Copied!" tooltip pops, with a fallback when the Clipboard API is blocked. */
export function CopyButton({
  value,
  timeout = 1600,
  onCopied,
  onCopyError,
  label,
  copiedLabel: copiedLabelProp,
  failedLabel,
  hint: hintProp,
  variant = "ghost",
  size,
  tooltip = true,
  labels,
  sound,
  className,
  onClick,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  "aria-label": ariaLabel,
  ...props
}: CopyButtonProps) {
  const l = useLabels("copy-button", DEFAULT_LABELS, labels)
  const copiedLabel = copiedLabelProp ?? l.copied
  const hint = hintProp ?? l.hint
  const reduce = useReducedMotion() ?? false
  const cue = useCue(sound)
  const [status, setStatus] = React.useState<Status>("idle")
  const [hover, setHover] = React.useState(false)
  const [mac, setMac] = React.useState(false)
  const timer = React.useRef(0)
  const sz = size ?? (label ? "sm" : "icon-sm")

  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    let text = ""
    let ok = false
    try {
      text = typeof value === "function" ? await value() : value
      ok = await writeClipboard(text)
    } catch {
      // The value function threw or rejected: show the failed state instead of an unhandled rejection.
      ok = false
    }
    if (!ok) setMac(/Mac|iPhone|iPad/.test(navigator.userAgent))
    setStatus(ok ? "copied" : "failed")
    if (ok) cue("pop")
    else cue("error", { exact: true })
    if (ok) onCopied?.(text)
    else onCopyError?.(text)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setStatus("idle"), ok ? timeout : timeout + 1200)
  }

  const tip = status === "copied" ? copiedLabel : status === "failed" ? (failedLabel ?? l.blocked(mac)) : hover && !label ? hint : null
  const pop = reduce ? { duration: 0.1 } : spring.play

  return (
    <span className="relative inline-flex">
      <GooduiTokens />
      <button
        type="button"
        data-slot="button"
        data-status={status}
        aria-label={ariaLabel ?? (label ? undefined : hint)}
        onClick={(e) => {
          onClick?.(e)
          if (!e.defaultPrevented) void copy()
        }}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") setHover(true)
          onPointerEnter?.(e)
        }}
        onPointerLeave={(e) => {
          setHover(false)
          onPointerLeave?.(e)
        }}
        onFocus={(e) => {
          if (e.currentTarget.matches(":focus-visible")) setHover(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setHover(false)
          onBlur?.(e)
        }}
        className={cn(
          "pc-press relative inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-[background-color,color,box-shadow,transform] outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
          VARIANTS[variant],
          SIZES[sz],
          status === "copied" && variant === "ghost" && "text-emerald-700 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-400",
          className,
        )}
        {...props}
      >
        <span className="relative grid place-items-center [&>*]:col-start-1 [&>*]:row-start-1">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={status}
              className="grid place-items-center"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.4, filter: "blur(3px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.4, filter: "blur(3px)" }}
              transition={pop}
            >
              {status === "copied" ? <CheckDraw reduce={reduce} /> : status === "failed" ? <XDraw /> : <Copy />}
            </motion.span>
          </AnimatePresence>
        </span>
        {label && <span>{status === "copied" ? copiedLabel : label}</span>}
      </button>
      {tooltip && (
        <AnimatePresence>
          {tip && (
            <motion.span
              key={status === "idle" ? "hint" : status}
              aria-hidden="true"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 2, scale: 0.9, transition: { duration: 0.1 } }}
              transition={pop}
              className={cn(
                "pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap shadow-[var(--pc-e2)]",
                // emerald-700 and a darkened destructive in dark mode keep the white text at 4.5:1.
                status === "copied"
                  ? "bg-emerald-700 text-white"
                  : status === "failed"
                    ? "bg-destructive text-white dark:bg-[color-mix(in_oklab,var(--destructive)_75%,black)]"
                    : "bg-foreground text-background",
              )}
            >
              {tip}
              <span className="absolute top-full left-1/2 -mt-1 size-2 -translate-x-1/2 rotate-45 rounded-[1px] bg-inherit" />
            </motion.span>
          )}
        </AnimatePresence>
      )}
      <span role="status" aria-live="polite" className="sr-only">
        {status === "copied" ? l.copiedAnnouncement : status === "failed" ? l.failedAnnouncement : ""}
      </span>
    </span>
  )
}
