"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion, useReducedMotion, type TargetAndTransition, type Transition } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { Kbd } from "@/registry/components/core/kbd"
import { spring, ease as easing } from "@/lib/goodui-motion"

/*
 * One tooltip, independent layers: every axis combines with every other.
 *   variant    dark, light, tone, glass, neo            tone       color for tone and neo
 *   size       sm, md, lg                               shape      square, rounded, pill
 *   shadow     none → lg                                animation  none, fade, scale, slide, spring
 *   placement  side (top, bottom, left, right, start, end) × align (start, center, end), flips and shifts to stay on screen
 *   content    text, or title + body + keyboard shortcut; arrow on or off; follows the cursor if asked
 * Opens on hover (after delay), keyboard focus (at once) and touch long-press. Esc closes it. Wrap neighbours in
 * <TooltipGroup> so the first tooltip waits and the next ones open instantly.
 */

export type TooltipVariant = "dark" | "light" | "tone" | "glass" | "neo"
export type TooltipTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type TooltipSize = "sm" | "md" | "lg"
export type TooltipShape = "square" | "rounded" | "pill"
export type TooltipShadow = "none" | "sm" | "md" | "lg"
export type TooltipAnimation = "none" | "fade" | "scale" | "slide" | "spring"
/** start and end follow the reading direction (left/right in LTR, right/left in RTL). */
export type TooltipSide = "top" | "bottom" | "left" | "right" | "start" | "end"
export type TooltipAlign = "start" | "center" | "end"

export type TooltipLabels = {
  /** Read before the keyboard shortcut: "Shortcut: Ctrl K". */
  shortcut: string
}
const DEFAULT_LABELS: TooltipLabels = { shortcut: "Shortcut" }

type TriggerProps = React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }
type MotionSafe = "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration" | "onDrag" | "onDragStart" | "onDragEnd" | "onDragEnter" | "onDragLeave" | "onDragOver" | "onDrop" | "onDragExit"

export type TooltipProps = Omit<React.ComponentProps<"div">, "title" | "content" | "children" | MotionSafe> & {
  /** The trigger: one element (a button, an icon, a link). Text is wrapped in a focusable span. */
  children: React.ReactNode
  /** Tooltip body (with a title, the muted second line). */
  content?: React.ReactNode
  /** Bold first line for rich tooltips; content becomes the muted second line. */
  title?: React.ReactNode
  /** Keyboard shortcut shown as keycaps: "Mod+K" or ["Shift", "D"]. Mod is ⌘ on Mac and Ctrl elsewhere. */
  shortcut?: string | string[]
  /** Paint: dark (default, dark in both themes), light (light in both themes), tone (filled with the tone), glass, neo. */
  variant?: TooltipVariant
  /** Color for the tone and neo variants. */
  tone?: TooltipTone
  size?: TooltipSize
  shape?: TooltipShape
  /** Drop shadow. Ignored by neo, which has its own offset shadow. */
  shadow?: TooltipShadow
  /** How it appears: scale (default), fade, slide, spring or none. Reduced motion uses a short fade. */
  animation?: TooltipAnimation
  /** Preferred side; flips to the opposite side when there is no room. */
  side?: TooltipSide
  /** Alignment along the side. start/end follow the reading direction. */
  align?: TooltipAlign
  /** Gap between trigger and tooltip, in px. */
  offset?: number
  arrow?: boolean
  /** Hover delay before opening, in ms. Inside a TooltipGroup the group's delay is used. Focus opens at once. */
  delay?: number
  /** Grace period before closing after the pointer leaves, so the pointer can move onto the tooltip, in ms. */
  closeDelay?: number
  /** Touch: how long to press before the tooltip shows, in ms. It hides 1.5 s after release or on the next tap. */
  longPressDelay?: number
  /** Position at the pointer and follow it while it moves over the trigger (charts, heatmaps). */
  followCursor?: boolean
  /** Open state (controlled). */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Never open. */
  disabled?: boolean
  /** Render into document.body so overflow and z-index of parents can't clip it. */
  portal?: boolean
  /** Text for screen readers; pass translations here. */
  labels?: Partial<TooltipLabels>
}

/* ---------- group: instant after the first ---------- */

type GroupValue = { delay: number; isWarm: () => boolean; opened: (close: () => void) => void; closed: (close: () => void) => void }
const GroupContext = React.createContext<GroupValue | null>(null)

export type TooltipGroupProps = {
  /** Delay before the first tooltip in the group opens, in ms. */
  delay?: number
  /** After a tooltip closes, how long the next one still opens instantly, in ms. */
  skipDelay?: number
  children: React.ReactNode
}

/** Shares one open delay across tooltips (a toolbar): once one is open, moving to a neighbour shows its tooltip at once. Only one is open at a time. */
export function TooltipGroup({ delay = 500, skipDelay = 400, children }: TooltipGroupProps) {
  const current = React.useRef<(() => void) | null>(null)
  const warmUntil = React.useRef(0)
  const value = React.useMemo<GroupValue>(
    () => ({
      delay,
      isWarm: () => current.current !== null || performance.now() < warmUntil.current,
      opened: (close) => {
        if (current.current && current.current !== close) current.current()
        current.current = close
      },
      closed: (close) => {
        if (current.current === close) current.current = null
        warmUntil.current = performance.now() + skipDelay
      },
    }),
    [delay, skipDelay],
  )
  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
}

/* ---------- positioning: flip + shift, written for this component ---------- */

type Side = "top" | "bottom" | "left" | "right"
type Box = { x: number; y: number; width: number; height: number }
type Placed = { x: number; y: number; side: Side; arrow: number; rtl: boolean }
const OPPOSITE: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" }
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi))

function place(a: Box, w: number, h: number, want: Side, align: TooltipAlign, offset: number, rtl: boolean, arrowPad: number): Placed {
  const pad = 8
  const vw = document.documentElement.clientWidth
  const vh = window.innerHeight
  const at = (s: Side) => {
    if (s === "top" || s === "bottom") {
      const y = s === "top" ? a.y - h - offset : a.y + a.height + offset
      const start = rtl ? a.x + a.width - w : a.x
      const end = rtl ? a.x : a.x + a.width - w
      return { x: align === "center" ? a.x + a.width / 2 - w / 2 : align === "start" ? start : end, y }
    }
    const x = s === "left" ? a.x - w - offset : a.x + a.width + offset
    return { x, y: align === "center" ? a.y + a.height / 2 - h / 2 : align === "start" ? a.y : a.y + a.height - h }
  }
  const over = (s: Side, p: { x: number; y: number }) =>
    s === "top" ? pad - p.y : s === "bottom" ? p.y + h - (vh - pad) : s === "left" ? pad - p.x : p.x + w - (vw - pad)
  let side = want
  let p = at(want)
  if (over(want, p) > 0) {
    const q = at(OPPOSITE[want])
    if (over(OPPOSITE[want], q) < over(want, p)) {
      side = OPPOSITE[want]
      p = q
    }
  }
  const vertical = side === "top" || side === "bottom"
  if (vertical) p.x = clamp(p.x, pad, vw - pad - w)
  else p.y = clamp(p.y, pad, vh - pad - h)
  const arrow = vertical ? clamp(a.x + a.width / 2 - p.x, arrowPad, w - arrowPad) : clamp(a.y + a.height / 2 - p.y, arrowPad, h - arrowPad)
  return { x: p.x, y: p.y, side, arrow, rtl }
}

/* ---------- look ---------- */

const CSS = `
.pc-tooltip{--pc-c:var(--primary);--pc-fg:var(--primary-foreground)}
.pc-tooltip[data-tone=neutral]{--pc-c:var(--foreground);--pc-fg:var(--background)}
.pc-tooltip[data-tone=success]{--pc-c:oklch(0.53 0.13 155);--pc-fg:#fff}
.pc-tooltip[data-tone=warning]{--pc-c:oklch(0.75 0.16 70);--pc-fg:oklch(0.25 0.05 70)}
.pc-tooltip[data-tone=danger]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff}
.pc-tooltip[data-tone=info]{--pc-c:oklch(0.55 0.17 250);--pc-fg:#fff}
.dark .pc-tooltip[data-tone=success]{--pc-c:oklch(0.7 0.16 155);--pc-fg:oklch(0.2 0.05 155)}
.dark .pc-tooltip[data-tone=danger]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25)}
.dark .pc-tooltip[data-tone=info]{--pc-c:oklch(0.7 0.15 245);--pc-fg:oklch(0.2 0.05 245)}
.pc-tooltip{--pc-tint:color-mix(in oklab,var(--pc-c) 14%,transparent);--pc-ink:color-mix(in oklab,var(--pc-c) 82%,var(--foreground))}
.pc-tooltip[data-tone=warning]{--pc-ink:color-mix(in oklab,var(--pc-c) 62%,var(--foreground))}

.pc-tooltip{--pc-bg:oklch(0.22 0.006 286);--pc-tx:oklch(0.985 0 0);--pc-bd:oklch(0.22 0.006 286);--pc-bw:1px;--pc-as:9px;position:relative;background:var(--pc-bg);color:var(--pc-tx);border:var(--pc-bw) solid var(--pc-bd);overflow-wrap:break-word}
.dark .pc-tooltip[data-variant=dark]{--pc-bg:oklch(0.3 0.008 286);--pc-bd:oklch(0.38 0.008 286)}
.pc-tooltip[data-variant=light]{--pc-bg:#fff;--pc-tx:oklch(0.21 0.006 286);--pc-bd:oklch(0.9 0.004 286)}
.pc-tooltip[data-variant=tone]{--pc-bg:var(--pc-c);--pc-tx:var(--pc-fg);--pc-bd:var(--pc-c)}
.pc-tooltip[data-variant=glass]{--pc-bg:color-mix(in oklab,var(--background) 62%,transparent);--pc-tx:var(--foreground);--pc-bd:color-mix(in oklab,var(--foreground) 14%,transparent);-webkit-backdrop-filter:blur(14px) saturate(1.7);backdrop-filter:blur(14px) saturate(1.7)}
.pc-tooltip[data-variant=neo]{--pc-bg:color-mix(in oklab,var(--pc-c) 16%,var(--background));--pc-tx:var(--foreground);--pc-bd:var(--foreground);--pc-bw:2px;--pc-as:10px}
.pc-tooltip[data-variant=neo][data-tone=neutral]{--pc-bg:var(--background)}
.pc-tooltip-motion[data-variant=neo]{filter:drop-shadow(3px 3px 0 var(--foreground))}
.pc-tooltip[data-shadow=sm]{box-shadow:0 1px 3px rgb(0 0 0/.14)}
.pc-tooltip[data-shadow=md]{box-shadow:0 6px 18px -6px rgb(0 0 0/.3),0 2px 4px -2px rgb(0 0 0/.12)}
.pc-tooltip[data-shadow=lg]{box-shadow:0 14px 34px -10px rgb(0 0 0/.38),0 4px 8px -4px rgb(0 0 0/.14)}
.pc-tooltip[data-variant=neo]{box-shadow:none}
.pc-tooltip-sub{opacity:.78}
.pc-tooltip[data-variant=light] .pc-tooltip-sub,.pc-tooltip[data-variant=glass] .pc-tooltip-sub,.pc-tooltip[data-variant=neo] .pc-tooltip-sub{opacity:.72}

/* The arrow is a rotated square clipped to its outer half, centered on the edge so it covers the border there. */
.pc-tooltip-arrow{position:absolute;width:var(--pc-as);height:var(--pc-as);background:var(--pc-bg);border:var(--pc-bw) solid var(--pc-bd);transform:rotate(45deg);pointer-events:none}
.pc-tooltip[data-variant=glass] .pc-tooltip-arrow{background:color-mix(in oklab,var(--background) 86%,transparent)}
.pc-tooltip-arrow[data-side=top]{top:calc(100% - var(--pc-as) / 2);clip-path:polygon(100% 0,100% 100%,0 100%)}
.pc-tooltip-arrow[data-side=bottom]{top:calc(var(--pc-as) / -2);clip-path:polygon(0 0,100% 0,0 100%)}
.pc-tooltip-arrow[data-side=left]{left:calc(100% - var(--pc-as) / 2);clip-path:polygon(0 0,100% 0,100% 100%)}
.pc-tooltip-arrow[data-side=right]{left:calc(var(--pc-as) / -2);clip-path:polygon(0 0,100% 100%,0 100%)}

/* Keycaps take the tooltip's colors instead of the page's. */
.pc-tooltip .pc-tooltip-kbd .pc-kbd[data-variant][data-tone] .pc-kbd-key{color:inherit;background:color-mix(in oklab,currentColor 13%,transparent);border:1px solid color-mix(in oklab,currentColor 22%,transparent);box-shadow:none;transform:none}
.pc-tooltip .pc-tooltip-kbd .pc-kbd .pc-kbd-sep{color:inherit;opacity:.6}
`

const SIZES: Record<TooltipSize, string> = {
  sm: "px-2 py-1 text-xs max-w-56",
  md: "px-2.5 py-1.5 text-[13px] leading-snug max-w-64",
  lg: "px-3 py-2 text-sm max-w-80",
}
const RICH: Record<TooltipSize, string> = { sm: "px-2.5 py-2", md: "px-3 py-2.5", lg: "px-3.5 py-3" }
const SHAPES: Record<TooltipShape, string> = { square: "rounded-none", rounded: "rounded-md", pill: "rounded-full" }

function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (el: T | null) => {
    for (const r of refs) {
      if (typeof r === "function") r(el)
      else if (r) (r as React.RefObject<T | null>).current = el
    }
  }
}

const focusVisible = (el: Element) => {
  try {
    return el.matches(":focus-visible")
  } catch {
    return true
  }
}

export function Tooltip({
  children,
  content,
  title,
  shortcut,
  variant = "dark",
  tone = "primary",
  size = "md",
  shape = "rounded",
  shadow = "md",
  animation = "scale",
  side = "top",
  align = "center",
  offset = 8,
  arrow = true,
  delay = 500,
  closeDelay = 100,
  longPressDelay = 500,
  followCursor = false,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  portal = true,
  labels,
  className,
  ...props
}: TooltipProps) {
  const l = useLabels("tooltip", DEFAULT_LABELS, labels)
  const group = React.useContext(GroupContext)
  const prefersReduced = useReducedMotion()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const reduce = mounted && !!prefersReduced

  const id = React.useId()
  const tipId = id + "-tip"
  const descId = id + "-desc"

  const [inner, setInner] = React.useState(defaultOpen)
  const open = !disabled && (openProp ?? inner)
  const [instant, setInstant] = React.useState(false)

  const trigger = React.useRef<HTMLElement | null>(null)
  const floating = React.useRef<HTMLDivElement>(null)
  const cursor = React.useRef<{ x: number; y: number } | null>(null)
  const timers = React.useRef({ open: 0, close: 0, press: 0, touchHide: 0 })
  const press = React.useRef({ x: 0, y: 0, fired: false })

  // Latest values for timers and listeners.
  const live = React.useRef({ open, openProp, onOpenChange, delay, group })
  React.useLayoutEffect(() => {
    live.current = { open, openProp, onOpenChange, delay, group }
  })

  const setOpen = React.useCallback((o: boolean) => {
    const c = live.current
    if (c.open === o) return
    if (c.openProp === undefined) setInner(o)
    c.onOpenChange?.(o)
  }, [])
  const show = React.useCallback(
    (immediate = false) => {
      const t = timers.current
      window.clearTimeout(t.close)
      window.clearTimeout(t.touchHide)
      if (live.current.open) return
      const g = live.current.group
      const warm = g?.isWarm() ?? false
      const wait = immediate || warm ? 0 : (g?.delay ?? live.current.delay)
      const go = () => {
        setInstant(warm)
        setOpen(true)
      }
      window.clearTimeout(t.open)
      if (wait <= 0) go()
      else t.open = window.setTimeout(go, wait)
    },
    [setOpen],
  )
  const hide = React.useCallback(
    (wait = 0) => {
      const t = timers.current
      window.clearTimeout(t.open)
      window.clearTimeout(t.close)
      if (wait > 0) t.close = window.setTimeout(() => setOpen(false), wait)
      else setOpen(false)
    },
    [setOpen],
  )

  React.useEffect(() => {
    const t = timers.current
    return () => {
      window.clearTimeout(t.open)
      window.clearTimeout(t.close)
      window.clearTimeout(t.press)
      window.clearTimeout(t.touchHide)
    }
  }, [])

  // One open tooltip per group; Esc closes (capture phase, so a dialog behind it stays open); a tap elsewhere closes.
  React.useEffect(() => {
    if (!open) return
    const close = () => hide()
    group?.opened(close)
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      e.stopPropagation()
      hide()
    }
    const onDown = (e: PointerEvent) => {
      if (!trigger.current?.contains(e.target as Node) && !floating.current?.contains(e.target as Node)) hide()
    }
    window.addEventListener("keydown", onKey, true)
    document.addEventListener("pointerdown", onDown)
    return () => {
      group?.closed(close)
      window.removeEventListener("keydown", onKey, true)
      document.removeEventListener("pointerdown", onDown)
    }
  }, [open, group, hide])

  /* positioning */
  const [pos, setPos] = React.useState<Placed | null>(null)
  const arrowPad = shape === "pill" ? 16 : 10
  const update = React.useCallback(() => {
    const el = floating.current
    const t = trigger.current
    if (!el || !t) return
    const c = cursor.current
    const r = t.getBoundingClientRect()
    const a: Box = followCursor && c ? { x: c.x, y: c.y, width: 0, height: 0 } : { x: r.left, y: r.top, width: r.width, height: r.height }
    const rtl = getComputedStyle(t).direction === "rtl"
    const s: Side = side === "start" ? (rtl ? "right" : "left") : side === "end" ? (rtl ? "left" : "right") : side
    const next = place(a, el.offsetWidth, el.offsetHeight, s, align, followCursor ? offset + 6 : offset, rtl, arrowPad)
    setPos((p) =>
      p && Math.abs(p.x - next.x) < 0.5 && Math.abs(p.y - next.y) < 0.5 && p.side === next.side && Math.abs(p.arrow - next.arrow) < 0.5 && p.rtl === next.rtl ? p : next,
    )
  }, [followCursor, side, align, offset, arrowPad])

  React.useLayoutEffect(() => {
    if (!open || !mounted) return
    update()
    const on = () => update()
    window.addEventListener("scroll", on, { capture: true, passive: true })
    window.addEventListener("resize", on)
    const ro = new ResizeObserver(on)
    if (floating.current) ro.observe(floating.current)
    if (trigger.current) ro.observe(trigger.current)
    return () => {
      window.removeEventListener("scroll", on, { capture: true })
      window.removeEventListener("resize", on)
      ro.disconnect()
    }
  }, [open, mounted, update])

  /* trigger wiring */
  const child: React.ReactElement<TriggerProps> = React.isValidElement<TriggerProps>(children) ? children : <span tabIndex={0}>{children}</span>
  const cp = child.props
  const describedBy = mounted ? [cp["aria-describedby"], open ? tipId : descId].filter(Boolean).join(" ") : cp["aria-describedby"]

  const triggerEl = React.cloneElement(child, {
    ref: mergeRefs(cp.ref, (el: HTMLElement | null) => {
      trigger.current = el
    }),
    "aria-describedby": describedBy || undefined,
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) => {
      cp.onPointerEnter?.(e)
      if (e.pointerType === "touch") return
      cursor.current = { x: e.clientX, y: e.clientY }
      show()
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      cp.onPointerMove?.(e)
      if (e.pointerType === "touch") {
        if (Math.hypot(e.clientX - press.current.x, e.clientY - press.current.y) > 10) window.clearTimeout(timers.current.press)
        return
      }
      if (followCursor) {
        cursor.current = { x: e.clientX, y: e.clientY }
        if (live.current.open) update()
      }
    },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
      cp.onPointerLeave?.(e)
      if (e.pointerType === "touch") return
      hide(followCursor ? 0 : closeDelay)
    },
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      cp.onPointerDown?.(e)
      if (e.pointerType !== "touch") {
        hide()
        return
      }
      press.current = { x: e.clientX, y: e.clientY, fired: false }
      cursor.current = { x: e.clientX, y: e.clientY }
      window.clearTimeout(timers.current.press)
      timers.current.press = window.setTimeout(() => {
        press.current.fired = true
        show(true)
      }, longPressDelay)
    },
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
      cp.onPointerUp?.(e)
      if (e.pointerType !== "touch") return
      window.clearTimeout(timers.current.press)
      if (press.current.fired) timers.current.touchHide = window.setTimeout(() => hide(), 1500)
    },
    onPointerCancel: (e: React.PointerEvent<HTMLElement>) => {
      cp.onPointerCancel?.(e)
      window.clearTimeout(timers.current.press)
    },
    onContextMenu: (e: React.MouseEvent<HTMLElement>) => {
      // A long-press shows the tooltip instead of the system menu.
      if (press.current.fired) e.preventDefault()
      cp.onContextMenu?.(e)
    },
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      // The release after a long-press is not a tap on the button.
      if (press.current.fired) {
        press.current.fired = false
        e.preventDefault()
        return
      }
      cp.onClick?.(e)
    },
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      cp.onFocus?.(e)
      if (focusVisible(e.currentTarget)) show(true)
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      cp.onBlur?.(e)
      hide()
    },
  })

  /* motion */
  const s: Side = pos?.side ?? (side === "start" ? "left" : side === "end" ? "right" : side)
  const away = { top: { y: 5 }, bottom: { y: -5 }, left: { x: 5 }, right: { x: -5 } }[s]
  const still = reduce || animation === "none" || instant
  let enter: TargetAndTransition = {}
  let leave: TargetAndTransition = {}
  let from: TargetAndTransition = {}
  let move: Transition = { duration: 0 }
  if (!still) {
    if (animation === "scale") {
      from = { scale: 0.9 }
      enter = { scale: 1 }
      leave = { scale: 0.95 }
      move = { duration: 0.16, ease: easing.out }
    } else if (animation === "slide") {
      from = { ...away }
      enter = { x: 0, y: 0 }
      leave = { x: (away.x ?? 0) / 2, y: (away.y ?? 0) / 2 }
      move = { duration: 0.2, ease: easing.out }
    } else if (animation === "spring") {
      from = { scale: 0.55, x: (away.x ?? 0) * 1.6, y: (away.y ?? 0) * 1.6 }
      enter = { scale: 1, x: 0, y: 0 }
      leave = { scale: 0.9 }
      move = spring.play
    }
  }
  const fade: Transition = animation === "none" && !reduce ? { duration: 0 } : { duration: instant ? 0.06 : reduce ? 0.1 : 0.14 }
  const origin = pos
    ? s === "top"
      ? `${pos.arrow}px 100%`
      : s === "bottom"
        ? `${pos.arrow}px 0`
        : s === "left"
          ? `100% ${pos.arrow}px`
          : `0 ${pos.arrow}px`
    : "50% 50%"

  const rich = title !== undefined && title !== null
  const keys = shortcut ? (
    <span className="pc-tooltip-kbd inline-flex shrink-0 items-center">
      <span className="sr-only">{l.shortcut}: </span>
      <Kbd keys={shortcut} variant="flat" size={size === "lg" ? "sm" : "xs"} animation="none" />
    </span>
  ) : null
  const body = rich ? (
    <span className="flex min-w-0 flex-col gap-0.5 text-start">
      <span className="flex items-center justify-between gap-3 font-semibold">
        <span className="min-w-0">{title}</span>
        {keys}
      </span>
      {content !== undefined && content !== null && <span className="pc-tooltip-sub">{content}</span>}
    </span>
  ) : (
    <span className="flex items-center gap-2 text-start">
      <span className="min-w-0">{content}</span>
      {keys}
    </span>
  )

  const layer = (
    <>
      {mounted && !open && (
        <span id={descId} hidden>
          {body}
        </span>
      )}
      <AnimatePresence>
        {open && mounted && (
          <div
            key="tip"
            ref={floating}
            data-slot="tooltip-positioner"
            dir={pos ? (pos.rtl ? "rtl" : "ltr") : undefined}
            className={cn("fixed top-0 left-0 z-50 w-max", followCursor && "pointer-events-none")}
            style={{ transform: pos ? `translate3d(${Math.round(pos.x)}px,${Math.round(pos.y)}px,0)` : undefined, visibility: pos ? undefined : "hidden" }}
            onPointerEnter={() => window.clearTimeout(timers.current.close)}
            onPointerLeave={(e) => e.pointerType !== "touch" && hide(closeDelay)}
          >
            <motion.div
              className="pc-tooltip-motion"
              data-variant={variant}
              initial={from}
              animate={enter}
              exit={{ ...leave, transition: still ? { duration: 0 } : { duration: 0.1 } }}
              transition={move}
              style={{ transformOrigin: origin }}
            >
              <motion.div
                {...props}
                id={tipId}
                role="tooltip"
                data-slot="tooltip"
                data-variant={variant}
                data-tone={tone}
                data-shadow={shadow}
                data-side={s}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: animation === "none" && !reduce ? { duration: 0 } : { duration: 0.1 } }}
                transition={fade}
                className={cn("pc-tooltip w-max font-medium", SIZES[size], rich && RICH[size], shape === "pill" && rich ? "rounded-2xl" : SHAPES[shape], size === "lg" && shape === "rounded" && "rounded-lg", className)}
              >
                {body}
                {arrow && pos && (
                  <span
                    aria-hidden="true"
                    data-slot="tooltip-arrow"
                    data-side={s}
                    className="pc-tooltip-arrow"
                    style={
                      s === "top" || s === "bottom"
                        ? { left: `calc(${pos.arrow}px - var(--pc-bw) - var(--pc-as) / 2)` }
                        : { top: `calc(${pos.arrow}px - var(--pc-bw) - var(--pc-as) / 2)` }
                    }
                  />
                )}
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )

  return (
    <>
      <style href="pc-tooltip" precedence="default">
        {CSS}
      </style>
      {triggerEl}
      {mounted && portal ? createPortal(layer, document.body) : layer}
    </>
  )
}
