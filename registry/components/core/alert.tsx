"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { Bell, CircleAlert, CircleCheck, Info, Sparkles, TriangleAlert, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, ease as easing } from "@/lib/goodui-motion"

/*
 * One alert, independent layers: every axis combines with every other.
 *   variant   soft / solid / outline / left-accent / glass / neo / banner (full-width top bar)
 *   tone      picks the color and the default icon
 *   shadow, shape, size
 *   animation how it enters: none / slide-down / fade / shake / pop
 * plus title, description (children), actions, dismissible (collapses smoothly) and autoDismiss
 * (a countdown bar that pauses on hover or focus).
 */

export type AlertVariant = "soft" | "solid" | "outline" | "left-accent" | "glass" | "neo" | "banner"
export type AlertTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type AlertShadow = "none" | "sm" | "md" | "lg"
export type AlertAnimation = "none" | "slide-down" | "fade" | "shake" | "pop"
export type AlertShape = "square" | "rounded" | "pill"
export type AlertSize = "sm" | "md" | "lg"

export type AlertLabels = { dismiss: string }
const DEFAULT_LABELS: AlertLabels = { dismiss: "Dismiss" }

export type AlertProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** soft (default), solid, outline, left-accent stripe, frosted glass, neo-brutalist, or banner (full-width bar, centered, ignores size and shape). */
  variant?: AlertVariant
  /** Color and default icon. danger and warning use role="alert", the rest role="status". */
  tone?: AlertTone
  /** Drop shadow. Ignored by neo, which has its own offset shadow. */
  shadow?: AlertShadow
  /** Entrance animation, played on mount. */
  animation?: AlertAnimation
  shape?: AlertShape
  size?: AlertSize
  /** Bold first line; children render as the description under it. */
  title?: React.ReactNode
  /** Replaces the tone's icon. */
  icon?: React.ReactNode
  /** Hides the icon entirely. */
  hideIcon?: boolean
  /** Buttons or links, shown under the text (inline on the banner). */
  actions?: React.ReactNode
  /** Shows a × button. */
  dismissible?: boolean
  /** Close automatically after this many ms (true = 5000), with a countdown bar. Pauses on hover and focus. */
  autoDismiss?: boolean | number
  /** Controlled visibility. */
  open?: boolean
  /** Initial visibility when uncontrolled. */
  defaultOpen?: boolean
  /** Called with false when the × button or the auto-dismiss timer closes it. */
  onOpenChange?: (open: boolean) => void
  /** Called after the collapse animation finishes. */
  onDismiss?: () => void
  /** false shrinks the alert to its content. */
  fullWidth?: boolean
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<AlertLabels>
}

const CSS = `
.pc-alert{--pc-c:var(--primary);--pc-fg:var(--primary-foreground);isolation:isolate}
.pc-alert[data-tone=neutral]{--pc-c:var(--foreground);--pc-fg:var(--background)}
.pc-alert[data-tone=success]{--pc-c:oklch(0.53 0.13 155);--pc-fg:#fff}
.pc-alert[data-tone=warning]{--pc-c:oklch(0.75 0.16 70);--pc-fg:oklch(0.25 0.05 70)}
.pc-alert[data-tone=danger]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff}
.pc-alert[data-tone=info]{--pc-c:oklch(0.55 0.17 250);--pc-fg:#fff}
.dark .pc-alert[data-tone=success]{--pc-c:oklch(0.7 0.16 155);--pc-fg:oklch(0.2 0.05 155)}
.dark .pc-alert[data-tone=danger]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25)}
.dark .pc-alert[data-tone=info]{--pc-c:oklch(0.7 0.15 245);--pc-fg:oklch(0.2 0.05 245)}
.pc-alert{--pc-tint:color-mix(in oklab,var(--pc-c) 14%,transparent);--pc-ink:color-mix(in oklab,var(--pc-c) 82%,var(--foreground))}
.pc-alert[data-tone=warning]{--pc-ink:color-mix(in oklab,var(--pc-c) 62%,var(--foreground))}

.pc-alert{border:1px solid transparent;color:var(--foreground);box-shadow:var(--pc-v,0 0 #0000),var(--pc-sh,0 0 #0000)}
.pc-alert-icon{color:var(--pc-ink)}
.pc-alert-desc{color:color-mix(in oklab,var(--foreground) 72%,transparent)}
.pc-alert[data-variant=soft]{background:color-mix(in oklab,var(--pc-c) 9%,var(--background));border-color:color-mix(in oklab,var(--pc-c) 24%,transparent)}
.pc-alert[data-variant=soft] .pc-alert-title{color:var(--pc-ink)}
.pc-alert[data-variant=solid],.pc-alert[data-variant=banner]{background:var(--pc-c);color:var(--pc-fg)}
.pc-alert[data-variant=solid] .pc-alert-icon,.pc-alert[data-variant=banner] .pc-alert-icon{color:color-mix(in oklab,var(--pc-fg) 88%,transparent)}
.pc-alert[data-variant=solid] .pc-alert-desc,.pc-alert[data-variant=banner] .pc-alert-desc{color:var(--pc-fg)}
.pc-alert[data-variant=banner]{border-width:0 0 1px;border-color:color-mix(in oklab,var(--pc-c) 70%,black)}
.pc-alert[data-variant=outline]{background:var(--background);border-color:color-mix(in oklab,var(--pc-c) 50%,var(--border))}
.pc-alert[data-variant=left-accent]{background:var(--card);border-color:var(--border);--pc-v:inset 4px 0 0 var(--pc-c)}
.pc-alert[data-variant=left-accent]:dir(rtl){--pc-v:inset -4px 0 0 var(--pc-c)}
.pc-alert[data-variant=glass]{background:color-mix(in oklab,var(--background) 50%,transparent);border-color:color-mix(in oklab,var(--foreground) 14%,transparent);-webkit-backdrop-filter:blur(16px) saturate(1.6);backdrop-filter:blur(16px) saturate(1.6);--pc-v:inset 0 1px 0 color-mix(in oklab,white 40%,transparent)}
.pc-alert[data-variant=neo]{background:color-mix(in oklab,var(--pc-c) 16%,var(--background));border:2px solid var(--foreground);--pc-v:4px 4px 0 var(--foreground)}
.pc-alert[data-variant=neo] .pc-alert-icon{color:var(--foreground)}

.pc-alert[data-shadow=sm]{--pc-sh:0 1px 3px rgb(0 0 0/.1)}
.pc-alert[data-shadow=md]{--pc-sh:0 8px 20px -8px rgb(0 0 0/.22)}
.pc-alert[data-shadow=lg]{--pc-sh:0 18px 40px -14px rgb(0 0 0/.3)}

.pc-alert-x{display:inline-flex;align-items:center;justify-content:center;border-radius:6px;opacity:.6;cursor:pointer;transition:opacity .15s,background-color .15s}
.pc-alert-x:hover{opacity:1;background:color-mix(in oklab,currentColor 12%,transparent)}
.pc-alert-bar{position:absolute;left:0;right:0;bottom:0;height:3px;background:color-mix(in oklab,var(--pc-c) 70%,transparent);transform-origin:left;animation:pc-alert-count var(--pc-dur) linear forwards;pointer-events:none}
.pc-alert[data-variant=solid] .pc-alert-bar,.pc-alert[data-variant=banner] .pc-alert-bar{background:color-mix(in oklab,var(--pc-fg) 75%,transparent)}
.pc-alert[data-paused] .pc-alert-bar{animation-play-state:paused}
.pc-alert-bar:dir(rtl){transform-origin:right}
@keyframes pc-alert-count{from{transform:scaleX(1)}to{transform:scaleX(0)}}

.pc-alert[data-anim=slide-down]{animation:pc-alert-down .35s var(--pc-ease-out) both}
@keyframes pc-alert-down{from{transform:translateY(-10px);opacity:0}to{transform:none;opacity:1}}
.pc-alert[data-anim=fade]{animation:pc-alert-fade .35s ease both}
@keyframes pc-alert-fade{from{opacity:0}to{opacity:1}}
.pc-alert[data-anim=pop]{animation:pc-alert-pop .4s var(--pc-ease-spring) both}
@keyframes pc-alert-pop{from{transform:scale(.94);opacity:0}to{transform:none;opacity:1}}
.pc-alert[data-anim=shake]{animation:pc-alert-shake .5s cubic-bezier(.36,.07,.19,.97) both}
@keyframes pc-alert-shake{10%,90%{transform:translateX(-1px)}20%,80%{transform:translateX(2px)}30%,50%,70%{transform:translateX(-5px)}40%,60%{transform:translateX(5px)}}
@media (prefers-reduced-motion:reduce){
  .pc-alert,.pc-alert *{transition:none!important}
  .pc-alert[data-anim]{animation:none!important}
  .pc-alert-bar{animation-duration:0s!important;display:none}
}
`

const ICONS: Record<AlertTone, React.ComponentType<{ className?: string }>> = {
  primary: Sparkles,
  neutral: Bell,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
  info: Info,
}

const SIZES: Record<AlertSize, string> = {
  sm: "gap-2.5 px-3 py-2.5 text-[13px] [&_[data-slot=alert-icon]_svg]:size-4",
  md: "gap-3 px-4 py-3.5 text-sm [&_[data-slot=alert-icon]_svg]:size-[18px]",
  lg: "gap-3.5 px-5 py-4.5 text-[15px] [&_[data-slot=alert-icon]_svg]:size-5",
}
const SHAPES: Record<AlertShape, string> = { square: "rounded-none", rounded: "rounded-xl", pill: "rounded-[1.75rem]" }

export function Alert({
  variant = "soft",
  tone = "info",
  shadow = "none",
  animation = "none",
  shape = "rounded",
  size = "md",
  title,
  icon,
  hideIcon,
  actions,
  dismissible,
  autoDismiss,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  onDismiss,
  fullWidth = true,
  className,
  children,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  labels,
  ...props
}: AlertProps) {
  const l = useLabels("alert", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion()
  const [innerOpen, setInnerOpen] = React.useState(defaultOpen)
  const open = openProp ?? innerOpen
  // "closing" keeps it mounted while it collapses.
  const [phase, setPhase] = React.useState<"open" | "closing" | "closed">(open ? "open" : "closed")
  const [hover, setHover] = React.useState(false)
  const [focus, setFocus] = React.useState(false)
  const paused = hover || focus

  React.useEffect(() => {
    setPhase((p) => (open ? "open" : p === "open" ? "closing" : p))
  }, [open])

  // Uncontrolled: a new message brings a dismissed alert back.
  const duration = autoDismiss === true ? 5000 : typeof autoDismiss === "number" ? autoDismiss : 0
  const content = typeof title === "string" || typeof children === "string" ? `${variant}|${tone}|${duration}|${String(title)}|${String(children)}` : null
  const first = React.useRef(true)
  React.useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (openProp === undefined && content !== null) setInnerOpen(true)
  }, [content, openProp])

  const close = React.useCallback(() => {
    if (openProp === undefined) setInnerOpen(false)
    onOpenChange?.(false)
  }, [openProp, onOpenChange])

  // Auto-dismiss timer with pause: tracks the remaining time across hovers.
  const remaining = React.useRef(duration)
  const [run, setRun] = React.useState(0)
  React.useEffect(() => {
    remaining.current = duration
    setRun((r) => r + 1)
  }, [duration, content])
  React.useEffect(() => {
    if (!duration || phase !== "open" || paused) return
    const start = Date.now()
    const t = setTimeout(close, remaining.current)
    return () => {
      clearTimeout(t)
      remaining.current = Math.max(0, remaining.current - (Date.now() - start))
    }
  }, [duration, phase, paused, close, run])

  if (phase === "closed") return null

  const Icon = ICONS[tone]
  const iconEl = hideIcon ? null : (icon ?? <Icon />)
  const banner = variant === "banner"
  const role = tone === "danger" || tone === "warning" ? "alert" : "status"

  const body = (
    <div
      data-slot="alert"
      role={role}
      data-variant={variant}
      data-tone={tone}
      data-shadow={variant === "neo" ? "none" : shadow}
      data-anim={animation}
      data-paused={paused ? "" : undefined}
      onPointerEnter={(e) => {
        setHover(true)
        onPointerEnter?.(e)
      }}
      onPointerLeave={(e) => {
        setHover(false)
        onPointerLeave?.(e)
      }}
      onFocus={(e) => {
        setFocus(true)
        onFocus?.(e)
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(false)
        onBlur?.(e)
      }}
      className={cn(
        "pc-alert relative flex overflow-hidden",
        banner ? "items-center justify-center gap-3 px-4 py-2.5 text-sm" : cn("items-start", SIZES[size], SHAPES[shape]),
        className,
      )}
      {...props}
    >
      {iconEl && (
        <span data-slot="alert-icon" className={cn("pc-alert-icon inline-flex shrink-0 [&_svg]:shrink-0", banner ? "[&_svg]:size-4" : "mt-px")} aria-hidden="true">
          {iconEl}
        </span>
      )}
      <div className={cn("min-w-0", banner ? "flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center" : "flex flex-1 flex-col gap-1")}>
        {title && <div className={cn("pc-alert-title leading-snug font-semibold", banner && "inline")}>{title}</div>}
        {children && <div className={cn("pc-alert-desc leading-relaxed", banner && "inline")}>{children}</div>}
        {actions && <div className={cn("flex flex-wrap items-center gap-2", !banner && "mt-2")}>{actions}</div>}
      </div>
      {dismissible && (
        <button
          type="button"
          aria-label={l.dismiss}
          onClick={close}
          className={cn("pc-press pc-alert-x shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-current/40 [&_svg]:size-4", size === "sm" && !banner ? "size-6 -my-0.5 -me-1" : "size-7 -my-1 -me-1.5")}
        >
          <X />
        </button>
      )}
      {duration > 0 && phase === "open" && <span key={run} className="pc-alert-bar" style={{ "--pc-dur": `${duration}ms` } as React.CSSProperties} aria-hidden="true" />}
    </div>
  )

  return (
    <>
      <GooduiTokens />
      <style href="pc-alert" precedence="default">
        {CSS}
      </style>
      <motion.div
        data-slot="alert-collapse"
        className={cn(fullWidth ? "w-full" : "w-fit max-w-full", "[&>[data-slot=alert]]:w-full", phase === "closing" && "overflow-hidden")}
        initial={false}
        animate={phase === "closing" ? { height: 0, opacity: 0 } : { height: "auto", opacity: 1 }}
        transition={reduce ? { duration: 0 } : { height: { duration: 0.28, ease: easing.inOut, delay: 0.08 }, opacity: { duration: 0.18 } }}
        onAnimationComplete={() => {
          if (phase !== "closing") return
          setPhase("closed")
          onDismiss?.()
        }}
      >
        {body}
      </motion.div>
    </>
  )
}
