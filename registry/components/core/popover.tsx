"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion, useReducedMotion, type TargetAndTransition, type Transition } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring, ease as easing } from "@/lib/goodui-motion"

/*
 * One popover, independent layers: every axis combines with every other.
 *   variant    default, soft, glass, neo, inverted        tone       accent (soft tint, neo fill, focus ring)
 *   size       sm, md, lg, auto (width + padding)          radius     none → xl
 *   shadow     none → xl                                   animation  none, fade, scale, slide, spring
 *   placement  side × align, flips and shifts to stay on screen, optional arrow, can match the trigger width
 *   behaviour  modal (focus trapped, page blocked) or non-modal (Tab past the end returns to the page)
 *   slots      title + description header, close button, body, footer; body and footer may be (api) => node
 * Esc and outside click close it (both configurable); focus returns to the trigger.
 */

export type PopoverVariant = "default" | "soft" | "glass" | "neo" | "inverted"
export type PopoverTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type PopoverSize = "sm" | "md" | "lg" | "auto"
export type PopoverRadius = "none" | "sm" | "md" | "lg" | "xl"
export type PopoverShadow = "none" | "sm" | "md" | "lg" | "xl"
export type PopoverAnimation = "none" | "fade" | "scale" | "slide" | "spring"
/** start and end follow the reading direction (left/right in LTR, right/left in RTL). */
export type PopoverSide = "top" | "bottom" | "left" | "right" | "start" | "end"
export type PopoverAlign = "start" | "center" | "end"
export type PopoverApi = { close: () => void }

export type PopoverLabels = { close: string }
const DEFAULT_LABELS: PopoverLabels = { close: "Close" }

type TriggerProps = React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }
type MotionSafe = "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration" | "onDrag" | "onDragStart" | "onDragEnd" | "onDragEnter" | "onDragLeave" | "onDragOver" | "onDrop" | "onDragExit"

export type PopoverProps = Omit<React.ComponentProps<"div">, "title" | "children" | MotionSafe> & {
  /** The element that toggles the popover (a button). It gets aria-expanded, aria-controls and aria-haspopup. */
  trigger: React.ReactElement<TriggerProps>
  /** Body. A function receives { close } for buttons that should close the popover. */
  children?: React.ReactNode | ((api: PopoverApi) => React.ReactNode)
  /** Header title; also names the popover for screen readers. Without it, pass aria-label. */
  title?: React.ReactNode
  /** Muted line under the title. */
  description?: React.ReactNode
  /** Footer row (actions). A function receives { close }. */
  footer?: React.ReactNode | ((api: PopoverApi) => React.ReactNode)
  /** × button in the header. Defaults to true when there is a title. */
  showClose?: boolean
  /** Surface: default (your popover color), soft (tone tint), glass, neo or inverted (dark on light). */
  variant?: PopoverVariant
  tone?: PopoverTone
  /** Width and padding: sm 16rem, md 20rem, lg 26rem, auto fits the content. */
  size?: PopoverSize
  radius?: PopoverRadius
  /** Drop shadow. Ignored by neo, which has its own offset shadow. */
  shadow?: PopoverShadow
  /** How it opens: scale (default), fade, slide, spring or none. Reduced motion uses a short fade. */
  animation?: PopoverAnimation
  /** Preferred side; flips to the opposite side when there is no room. */
  side?: PopoverSide
  /** Alignment along the side. start/end follow the reading direction. */
  align?: PopoverAlign
  /** Gap between trigger and popover, in px. */
  offset?: number
  arrow?: boolean
  /** false keeps the requested side and alignment even when the popover leaves the screen. */
  avoidCollisions?: boolean
  /** Same width as the trigger (account switchers, comboboxes). Overrides size width. */
  matchTriggerWidth?: boolean
  /** true traps focus inside and blocks the page behind with a transparent layer. */
  modal?: boolean
  closeOnOutsideClick?: boolean
  closeOnEsc?: boolean
  /** Open state (controlled). */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Element to focus on open. Default: the first focusable element in the body, else the panel. */
  initialFocus?: React.RefObject<HTMLElement | null>
  /** Return focus to the trigger after closing with Esc, the close button or close(). */
  returnFocus?: boolean
  /** Render into document.body so overflow and z-index of parents can't clip it. */
  portal?: boolean
  /** Text for built-in controls; pass translations here. */
  labels?: Partial<PopoverLabels>
}

/* ---------- positioning: flip + shift, written for this component ---------- */

type Side = "top" | "bottom" | "left" | "right"
type Box = { x: number; y: number; width: number; height: number }
type Placed = { x: number; y: number; side: Side; arrow: number; rtl: boolean; maxHeight: number }
const OPPOSITE: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" }
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi))

function place(a: Box, w: number, h: number, want: Side, align: PopoverAlign, offset: number, rtl: boolean, arrowPad: number, avoid: boolean): Placed {
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
  if (avoid && over(want, p) > 0) {
    const q = at(OPPOSITE[want])
    if (over(OPPOSITE[want], q) < over(want, p)) {
      side = OPPOSITE[want]
      p = q
    }
  }
  const vertical = side === "top" || side === "bottom"
  if (avoid) {
    if (vertical) p.x = clamp(p.x, pad, vw - pad - w)
    else p.y = clamp(p.y, pad, vh - pad - h)
  }
  // Room on the chosen side, so a tall body scrolls instead of leaving the screen.
  const room = side === "bottom" ? vh - pad - (a.y + a.height + offset) : side === "top" ? a.y - offset - pad : vh - pad * 2
  if (side === "top") p.y = Math.max(p.y, a.y - offset - Math.min(h, room))
  const arrow = vertical ? clamp(a.x + a.width / 2 - p.x, arrowPad, w - arrowPad) : clamp(a.y + a.height / 2 - p.y, arrowPad, h - arrowPad)
  return { x: p.x, y: p.y, side, arrow, rtl, maxHeight: Math.max(120, room) }
}

const TABBABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"],summary,audio[controls],video[controls]'
function tabbables(root: ParentNode) {
  return Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter((el) => el.tabIndex >= 0 && !el.closest("[inert]") && el.getClientRects().length > 0)
}

function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (el: T | null) => {
    for (const r of refs) {
      if (typeof r === "function") r(el)
      else if (r) (r as React.RefObject<T | null>).current = el
    }
  }
}

/* ---------- look ---------- */

const CSS = `
.pc-popover{--pc-c:var(--primary);--pc-fg:var(--primary-foreground)}
.pc-popover[data-tone=neutral]{--pc-c:var(--foreground);--pc-fg:var(--background)}
.pc-popover[data-tone=success]{--pc-c:oklch(0.53 0.13 155);--pc-fg:#fff}
.pc-popover[data-tone=warning]{--pc-c:oklch(0.75 0.16 70);--pc-fg:oklch(0.25 0.05 70)}
.pc-popover[data-tone=danger]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff}
.pc-popover[data-tone=info]{--pc-c:oklch(0.55 0.17 250);--pc-fg:#fff}
.dark .pc-popover[data-tone=success]{--pc-c:oklch(0.7 0.16 155);--pc-fg:oklch(0.2 0.05 155)}
.dark .pc-popover[data-tone=danger]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25)}
.dark .pc-popover[data-tone=info]{--pc-c:oklch(0.7 0.15 245);--pc-fg:oklch(0.2 0.05 245)}
.pc-popover{--pc-tint:color-mix(in oklab,var(--pc-c) 14%,transparent);--pc-ink:color-mix(in oklab,var(--pc-c) 82%,var(--foreground))}
.pc-popover[data-tone=warning]{--pc-ink:color-mix(in oklab,var(--pc-c) 62%,var(--foreground))}

.pc-popover{--pc-bg:var(--popover);--pc-tx:var(--popover-foreground);--pc-bd:var(--border);--pc-bw:1px;--pc-as:12px;--pc-muted:var(--muted-foreground);position:relative;background:var(--pc-bg);color:var(--pc-tx);border:var(--pc-bw) solid var(--pc-bd);outline:none}
.pc-popover[data-variant=soft]{--pc-bg:color-mix(in oklab,var(--pc-c) 6%,var(--popover));--pc-bd:color-mix(in oklab,var(--pc-c) 24%,var(--border))}
.pc-popover[data-variant=glass]{--pc-bg:color-mix(in oklab,var(--popover) 62%,transparent);--pc-bd:color-mix(in oklab,var(--foreground) 14%,transparent);-webkit-backdrop-filter:blur(18px) saturate(1.7);backdrop-filter:blur(18px) saturate(1.7)}
.pc-popover[data-variant=neo]{--pc-bg:var(--background);--pc-tx:var(--foreground);--pc-bd:var(--foreground);--pc-bw:2px}
.pc-popover[data-variant=inverted]{--pc-bg:var(--foreground);--pc-tx:var(--background);--pc-bd:var(--foreground);--pc-muted:color-mix(in oklab,var(--background) 68%,var(--foreground))}
.pc-popover-motion[data-variant=neo]{filter:drop-shadow(5px 5px 0 var(--foreground))}
.pc-popover[data-shadow=sm]{box-shadow:0 2px 6px -1px rgb(0 0 0/.12)}
.pc-popover[data-shadow=md]{box-shadow:0 8px 24px -8px rgb(0 0 0/.22),0 2px 6px -2px rgb(0 0 0/.08)}
.pc-popover[data-shadow=lg]{box-shadow:0 18px 44px -14px rgb(0 0 0/.3),0 4px 10px -4px rgb(0 0 0/.1)}
.pc-popover[data-shadow=xl]{box-shadow:0 30px 70px -20px rgb(0 0 0/.42),0 8px 18px -8px rgb(0 0 0/.14)}
.dark .pc-popover:not([data-variant=neo]):is([data-shadow=md],[data-shadow=lg],[data-shadow=xl]){box-shadow:0 18px 44px -12px rgb(0 0 0/.65),0 0 0 1px rgb(255 255 255/.03)}
.pc-popover[data-variant=neo][data-shadow]{box-shadow:none}
.pc-popover-muted{color:var(--pc-muted)}
.pc-popover-x{color:var(--pc-muted)}
.pc-popover-x:hover{background:color-mix(in oklab,currentColor 12%,transparent);color:var(--pc-tx)}
.pc-popover-x:focus-visible{box-shadow:0 0 0 3px color-mix(in oklab,var(--pc-c) 40%,transparent)}
.pc-popover-foot{border-top:1px solid color-mix(in oklab,var(--pc-bd) 70%,transparent)}
.pc-popover[data-variant=neo] .pc-popover-foot{border-top:2px solid var(--foreground)}

.pc-popover-arrow{position:absolute;width:var(--pc-as);height:var(--pc-as);background:var(--pc-bg);border:var(--pc-bw) solid var(--pc-bd);transform:rotate(45deg);pointer-events:none}
.pc-popover[data-variant=glass] .pc-popover-arrow{background:color-mix(in oklab,var(--popover) 88%,transparent)}
.pc-popover-arrow[data-side=top]{top:calc(100% - var(--pc-as) / 2);clip-path:polygon(100% 0,100% 100%,0 100%)}
.pc-popover-arrow[data-side=bottom]{top:calc(var(--pc-as) / -2);clip-path:polygon(0 0,100% 0,0 100%)}
.pc-popover-arrow[data-side=left]{left:calc(100% - var(--pc-as) / 2);clip-path:polygon(0 0,100% 0,100% 100%)}
.pc-popover-arrow[data-side=right]{left:calc(var(--pc-as) / -2);clip-path:polygon(0 0,100% 100%,0 100%)}
`

const SIZES: Record<PopoverSize, { w: string; pad: string; px: string }> = {
  sm: { w: "w-64", pad: "p-3", px: "px-3" },
  md: { w: "w-80", pad: "p-4", px: "px-4" },
  lg: { w: "w-[26rem]", pad: "p-5", px: "px-5" },
  auto: { w: "w-max", pad: "p-3", px: "px-3" },
}
const RADIUS: Record<PopoverRadius, string> = { none: "rounded-none", sm: "rounded-md", md: "rounded-lg", lg: "rounded-xl", xl: "rounded-2xl" }

export function Popover({
  trigger: triggerNode,
  children,
  title,
  description,
  footer,
  showClose,
  variant = "default",
  tone = "primary",
  size = "md",
  radius = "lg",
  shadow = "lg",
  animation = "scale",
  side = "bottom",
  align = "center",
  offset = 8,
  arrow = true,
  avoidCollisions = true,
  matchTriggerWidth = false,
  modal = false,
  closeOnOutsideClick = true,
  closeOnEsc = true,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  initialFocus,
  returnFocus = true,
  portal = true,
  labels,
  className,
  style,
  onKeyDown,
  ...props
}: PopoverProps) {
  const l = useLabels("popover", DEFAULT_LABELS, labels)
  const prefersReduced = useReducedMotion()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const reduce = mounted && !!prefersReduced

  const id = React.useId()
  const panelId = id + "-panel"
  const titleId = id + "-title"
  const descId = id + "-desc"

  const [inner, setInner] = React.useState(defaultOpen)
  const open = openProp ?? inner
  const trigger = React.useRef<HTMLElement | null>(null)
  const floating = React.useRef<HTMLDivElement>(null)
  const panel = React.useRef<HTMLDivElement>(null)
  const insideTree = React.useRef(false)

  const live = React.useRef({ open, openProp, onOpenChange, returnFocus })
  React.useLayoutEffect(() => {
    live.current = { open, openProp, onOpenChange, returnFocus }
  })
  const setOpen = React.useCallback((o: boolean) => {
    const c = live.current
    if (c.open === o) return
    if (c.openProp === undefined) setInner(o)
    c.onOpenChange?.(o)
  }, [])
  /** Closes; focus goes back to the trigger unless the user clicked somewhere else. */
  const close = React.useCallback(
    (refocus = true) => {
      setOpen(false)
      if (refocus && live.current.returnFocus) trigger.current?.focus({ preventScroll: true })
    },
    [setOpen],
  )
  const api = React.useMemo<PopoverApi>(() => ({ close: () => close() }), [close])

  /* positioning */
  const [pos, setPos] = React.useState<Placed | null>(null)
  const arrowPad = radius === "xl" ? 22 : radius === "lg" ? 18 : 14
  const update = React.useCallback(() => {
    const el = floating.current
    const t = trigger.current
    if (!el || !t) return
    const r = t.getBoundingClientRect()
    if (matchTriggerWidth) el.style.width = `${r.width}px`
    const rtl = getComputedStyle(t).direction === "rtl"
    const s: Side = side === "start" ? (rtl ? "right" : "left") : side === "end" ? (rtl ? "left" : "right") : side
    const next = place({ x: r.left, y: r.top, width: r.width, height: r.height }, el.offsetWidth, el.offsetHeight, s, align, offset, rtl, arrowPad, avoidCollisions)
    setPos((p) =>
      p &&
      Math.abs(p.x - next.x) < 0.5 &&
      Math.abs(p.y - next.y) < 0.5 &&
      p.side === next.side &&
      Math.abs(p.arrow - next.arrow) < 0.5 &&
      p.rtl === next.rtl &&
      Math.abs(p.maxHeight - next.maxHeight) < 0.5
        ? p
        : next,
    )
  }, [side, align, offset, arrowPad, avoidCollisions, matchTriggerWidth])

  React.useLayoutEffect(() => {
    if (!open || !mounted) return
    update()
    const on = () => update()
    window.addEventListener("scroll", on, { capture: true, passive: true })
    window.addEventListener("resize", on)
    const ro = new ResizeObserver(on)
    if (panel.current) ro.observe(panel.current)
    if (trigger.current) ro.observe(trigger.current)
    return () => {
      window.removeEventListener("scroll", on, { capture: true })
      window.removeEventListener("resize", on)
      ro.disconnect()
    }
  }, [open, mounted, update])

  /* focus in on open, once positioned (a hidden panel can't take focus) */
  const placed = pos !== null
  React.useEffect(() => {
    if (!open || !mounted || !placed) return
    const p = panel.current
    if (!p) return
    if (p.contains(document.activeElement)) return
    const body = p.querySelector<HTMLElement>("[data-slot=popover-body]")
    const target = initialFocus?.current ?? (body ? tabbables(body)[0] : undefined) ?? tabbables(p).find((el) => !el.hasAttribute("data-close")) ?? p
    target.focus({ preventScroll: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted, placed])

  /* outside click: the React tree counts as inside, so nested popovers and menus in portals don't close it */
  React.useEffect(() => {
    if (!open || modal || !closeOnOutsideClick) return
    const onDown = (e: PointerEvent) => {
      const inside = insideTree.current
      insideTree.current = false
      if (inside || trigger.current?.contains(e.target as Node)) return
      close(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [open, modal, closeOnOutsideClick, close])

  const onPanelKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented) return
    if (e.key === "Escape") {
      if (!closeOnEsc) return
      e.stopPropagation()
      close()
      return
    }
    const p = panel.current
    if (e.key !== "Tab" || !p || !p.contains(e.target as Node)) return
    const items = tabbables(p)
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement
    if (modal) {
      if (!first || !last) {
        e.preventDefault()
        return
      }
      if (e.shiftKey && (active === first || active === p)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
      return
    }
    // Non-modal: the panel behaves as if it sat right after the trigger in the tab order.
    if (e.shiftKey && (active === first || active === p || !first)) {
      e.preventDefault()
      close()
    } else if (!e.shiftKey && (active === last || !last)) {
      e.preventDefault()
      const t = trigger.current
      const scope = t?.closest<HTMLElement>("[aria-modal=true]") ?? document.body
      const list = tabbables(scope).filter((el) => !floating.current?.contains(el))
      const next = t ? list[list.indexOf(t) + 1] : undefined
      setOpen(false)
      ;(next ?? t)?.focus({ preventScroll: true })
    }
  }

  /* trigger wiring */
  const tp = triggerNode.props
  const triggerEl = React.cloneElement(triggerNode, {
    ref: mergeRefs(tp.ref, (el: HTMLElement | null) => {
      trigger.current = el
    }),
    "aria-haspopup": "dialog",
    "aria-expanded": open,
    "aria-controls": open ? panelId : undefined,
    "data-state": open ? "open" : "closed",
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      tp.onClick?.(e)
      if (!e.defaultPrevented) setOpen(!live.current.open)
    },
  } as Partial<TriggerProps>)

  /* motion */
  const s: Side = pos?.side ?? (side === "start" ? "left" : side === "end" ? "right" : side)
  const away = { top: { y: 6 }, bottom: { y: -6 }, left: { x: 6 }, right: { x: -6 } }[s]
  const still = reduce || animation === "none"
  let from: TargetAndTransition = {}
  let enter: TargetAndTransition = {}
  let leave: TargetAndTransition = {}
  let move: Transition = { duration: 0 }
  if (!still) {
    if (animation === "scale") {
      from = { scale: 0.94 }
      enter = { scale: 1 }
      leave = { scale: 0.96 }
      move = { duration: 0.18, ease: easing.out }
    } else if (animation === "slide") {
      from = { ...away }
      enter = { x: 0, y: 0 }
      leave = { x: (away.x ?? 0) / 2, y: (away.y ?? 0) / 2 }
      move = { duration: 0.22, ease: easing.out }
    } else if (animation === "spring") {
      from = { scale: 0.8, x: (away.x ?? 0) * 1.5, y: (away.y ?? 0) * 1.5 }
      enter = { scale: 1, x: 0, y: 0 }
      leave = { scale: 0.94 }
      move = spring.ui
    }
  }
  const fade: Transition = animation === "none" && !reduce ? { duration: 0 } : { duration: reduce ? 0.1 : 0.15 }
  const origin = pos ? (s === "top" ? `${pos.arrow}px 100%` : s === "bottom" ? `${pos.arrow}px 0` : s === "left" ? `100% ${pos.arrow}px` : `0 ${pos.arrow}px`) : "50% 50%"

  const sz = SIZES[size]
  const hasHeader = (title !== undefined && title !== null) || (description !== undefined && description !== null)
  const withClose = showClose ?? (title !== undefined && title !== null)
  const content = typeof children === "function" ? children(api) : children
  const foot = typeof footer === "function" ? footer(api) : footer

  const layer = (
    <AnimatePresence>
      {open && mounted && (
        <React.Fragment key="popover">
          {modal && (
            <div
              aria-hidden="true"
              data-slot="popover-overlay"
              className="fixed inset-0 z-50"
              onPointerDown={(e) => {
                e.preventDefault()
                if (closeOnOutsideClick) close(false)
              }}
            />
          )}
          <div
            ref={floating}
            data-slot="popover-positioner"
            dir={pos ? (pos.rtl ? "rtl" : "ltr") : undefined}
            className={cn("fixed top-0 left-0 z-50", !matchTriggerWidth && "w-max")}
            style={{ transform: pos ? `translate3d(${Math.round(pos.x)}px,${Math.round(pos.y)}px,0)` : undefined, visibility: pos ? undefined : "hidden" }}
            onPointerDownCapture={() => {
              insideTree.current = true
            }}
          >
            <motion.div
              className="pc-popover-motion"
              data-variant={variant}
              initial={from}
              animate={enter}
              exit={{ ...leave, transition: still ? { duration: 0 } : { duration: 0.12 } }}
              transition={move}
              style={{ transformOrigin: origin }}
            >
              <motion.div
                {...props}
                ref={panel}
                id={panelId}
                role="dialog"
                aria-modal={modal || undefined}
                aria-labelledby={title !== undefined && title !== null ? titleId : props["aria-labelledby"]}
                aria-describedby={description !== undefined && description !== null ? descId : props["aria-describedby"]}
                tabIndex={-1}
                data-slot="popover"
                data-variant={variant}
                data-tone={tone}
                data-shadow={shadow}
                data-side={s}
                data-modal={modal ? "" : undefined}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: animation === "none" && !reduce ? { duration: 0 } : { duration: 0.12 } }}
                transition={fade}
                onKeyDown={onPanelKey}
                style={{ ...style, maxHeight: pos ? Math.min(pos.maxHeight, 640) : undefined }}
                className={cn(
                  "pc-popover flex max-w-[calc(100vw-1rem)] flex-col text-sm",
                  matchTriggerWidth ? "w-full" : sz.w,
                  RADIUS[radius],
                  variant === "neo" && radius !== "none" && "rounded-md",
                  className,
                )}
              >
                {hasHeader && (
                  <div data-slot="popover-header" className={cn("flex shrink-0 items-start gap-3", sz.px, size === "lg" ? "pt-5" : size === "md" ? "pt-4" : "pt-3", !content && !foot && "pb-3")}>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      {title !== undefined && title !== null && (
                        <h2 id={titleId} className="text-sm leading-tight font-semibold">
                          {title}
                        </h2>
                      )}
                      {description !== undefined && description !== null && (
                        <p id={descId} className="pc-popover-muted text-[13px] leading-snug">
                          {description}
                        </p>
                      )}
                    </div>
                    {withClose && (
                      <button
                        type="button"
                        data-close=""
                        aria-label={l.close}
                        onClick={() => close()}
                        className="pc-press pc-popover-x -me-1.5 -mt-1 grid size-7 shrink-0 cursor-pointer place-items-center rounded-md outline-none transition-colors"
                      >
                        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-4">
                          <path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                {!hasHeader && withClose && (
                  <button
                    type="button"
                    data-close=""
                    aria-label={l.close}
                    onClick={() => close()}
                    className="pc-press pc-popover-x absolute end-1.5 top-1.5 z-10 grid size-7 cursor-pointer place-items-center rounded-md outline-none transition-colors"
                  >
                    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-4">
                      <path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
                {content !== undefined && content !== null && content !== false && (
                  <div data-slot="popover-body" className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", sz.pad, hasHeader && "pt-3")}>
                    {content}
                  </div>
                )}
                {foot !== undefined && foot !== null && foot !== false && (
                  <div data-slot="popover-footer" className={cn("pc-popover-foot flex shrink-0 items-center justify-end gap-2", sz.px, size === "lg" ? "py-3.5" : "py-2.5")}>
                    {foot}
                  </div>
                )}
                {arrow && pos && (
                  <span
                    aria-hidden="true"
                    data-slot="popover-arrow"
                    data-side={s}
                    className="pc-popover-arrow"
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
        </React.Fragment>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <GooduiTokens />
      <style href="pc-popover" precedence="default">
        {CSS}
      </style>
      {triggerEl}
      {mounted && portal ? createPortal(layer, document.body) : layer}
    </>
  )
}
