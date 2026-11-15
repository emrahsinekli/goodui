"use client"

import * as React from "react"
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform, type PanInfo, type Transition } from "motion/react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, ease, spring as springs } from "@/lib/goodui-motion"

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
const SPRING: Transition = springs.sheet
/** Button and backdrop moves glide on the vaul curve; a release keeps the finger's velocity on a spring instead. */
const GLIDE: Transition = { duration: 0.5, ease: ease.drawer }
const GLIDE_OUT: Transition = { duration: 0.35, ease: ease.drawer }
/** px/s and fraction of the travel: the same thresholds as vaul. */
const FLICK_VELOCITY = 400
const CLOSE_FRACTION = 0.25
const WRAPPER = "[data-drawer-wrapper]"
/** Off-screen starting offset, so the first paint never shows the panel in place. */
const FAR = 10000

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void) {
  const [inner, setInner] = React.useState(defaultValue)
  const controlled = value !== undefined
  const current = controlled ? value : inner
  const set = React.useCallback(
    (v: T) => {
      if (!controlled) setInner(v)
      onChange?.(v)
    },
    [controlled, onChange],
  )
  return [current, set] as const
}

export type DrawerSide = "bottom" | "right" | "left"

export type DrawerSpringLabels = { close: string; expand: string; collapse: string }
const DEFAULT_LABELS: DrawerSpringLabels = { close: "Close", expand: "Expand sheet", collapse: "Collapse sheet" }

export type DrawerSpringProps = {
  /** Controlled open state. Pair with onOpenChange. */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /** Called with false on Esc, the close button, a backdrop click or a drag past the lowest point. */
  onOpenChange?: (open: boolean) => void
  /** "bottom" is a sheet with optional snap points; "right" and "left" are full-height side drawers. */
  side?: DrawerSide
  /** Bottom sheet only: visible fractions of the sheet height, e.g. [0.5, 1] for half and full. */
  snapPoints?: number[]
  /** Snap point index used when the sheet opens. */
  defaultSnap?: number
  /** Called with the index into the sorted snapPoints after a drag or a handle press moves the sheet. */
  onSnapChange?: (index: number) => void
  /** Heading of the drawer; it is also the dialog's accessible name. */
  title: React.ReactNode
  /** Line under the title, linked to the dialog with aria-describedby. */
  description?: React.ReactNode
  /** Sticky area under the scrolling body, for actions. */
  footer?: React.ReactNode
  /**
   * When true (default), Esc, the close button, a backdrop click and dragging past the lowest point close the drawer.
   * When false, none of them do and the close button is hidden: close it from your own controls (e.g. the footer).
   */
  dismissible?: boolean
  /**
   * Bottom sheet without snapPoints: the sheet morphs to the height of its content, so a multi-step flow keeps one
   * surface. Swap the children and it follows.
   */
  animateHeight?: boolean
  /**
   * The page behind scales down and rounds while the drawer is open, following the drag. true targets
   * `[data-drawer-wrapper]`, a string is your own selector. Render the drawer outside that element.
   */
  scaleBackground?: boolean | string
  /** Classes for the panel (width, height, radius). */
  className?: string
  /** Classes for the scrolling body that wraps children. */
  bodyClassName?: string
  children?: React.ReactNode
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<DrawerSpringLabels>
}

/**
 * Bottom sheet or side drawer on a spring. Drag the header to move it: the release velocity picks the snap point
 * or closes it, and the backdrop fades with the distance. Esc closes and focus is trapped while open.
 *
 * It renders `position: fixed` without a portal, so keep it out of ancestors that set `transform`/`filter`.
 */
export function DrawerSpring({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  side = "bottom",
  snapPoints,
  defaultSnap = 0,
  onSnapChange,
  title,
  description,
  footer,
  dismissible = true,
  animateHeight = false,
  scaleBackground = false,
  className,
  bodyClassName,
  children,
  labels,
}: DrawerSpringProps) {
  const l = useLabels("drawer-spring", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange)
  const [present, setPresent] = React.useState(open)
  if (open && !present) setPresent(true)

  const uid = React.useId()
  const panelRef = React.useRef<HTMLDivElement>(null)
  const restoreRef = React.useRef<HTMLElement | null>(null)
  const size = React.useRef(0)
  const velocity = React.useRef(0)
  const dragged = React.useRef(false)
  const panStart = React.useRef(0)
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const backgroundRef = React.useRef<HTMLElement | null>(null)
  const bodyHeight = useMotionValue<number | string>("auto")

  const points = React.useMemo(
    () => (side === "bottom" && snapPoints?.length ? [...snapPoints].sort((a, b) => a - b) : [1]),
    [side, snapPoints],
  )
  const [snap, setSnapState] = React.useState(Math.min(defaultSnap, points.length - 1))
  const snapRef = React.useRef(snap)
  const setSnap = (i: number) => {
    snapRef.current = i
    setSnapState(i)
    onSnapChange?.(i)
  }

  const sign = side === "left" ? -1 : 1
  // Distance from the fully open position toward closed. Positive = closing.
  const off = useMotionValue(FAR)
  const translate = useTransform(off, (v) => v * sign)
  const snapOffset = React.useCallback((i: number) => (1 - (points[i] ?? 1)) * size.current, [points])
  const closedOffset = () => size.current + 24
  const backdrop = useTransform(off, (v) => {
    if (!size.current) return 0
    const low = snapOffset(0)
    return Math.min(1, Math.max(0, 1 - (v - low) / Math.max(1, size.current + 24 - low)))
  })
  const spring = (v = 0): Transition => (reduce ? { duration: 0 } : v ? { ...SPRING, velocity: v } : GLIDE)
  const morphHeight = animateHeight && side === "bottom" && !snapPoints?.length

  // Body height follows the content. The first measure goes straight to the element, so the panel size read below is right.
  React.useLayoutEffect(() => {
    const body = bodyRef.current
    const content = contentRef.current
    if (!present || !morphHeight || !body || !content) return
    const read = () => {
      const cs = getComputedStyle(body)
      return content.offsetHeight + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
    }
    const first = read()
    bodyHeight.jump(first)
    body.style.height = `${first}px`
    const ro = new ResizeObserver(() => {
      const h = read()
      if (h !== bodyHeight.get()) animate(bodyHeight, h, reduce ? { duration: 0 } : springs.morph)
    })
    ro.observe(content)
    return () => ro.disconnect()
  }, [present, morphHeight, reduce, bodyHeight])

  React.useEffect(() => {
    if (!present || !scaleBackground || reduce) return
    const el = document.querySelector<HTMLElement>(typeof scaleBackground === "string" ? scaleBackground : WRAPPER)
    if (!el) return
    const { transform, transformOrigin, borderRadius, overflow } = el.style
    backgroundRef.current = el
    el.style.transformOrigin = "50% 0"
    el.style.overflow = "hidden"
    return () => {
      backgroundRef.current = null
      Object.assign(el.style, { transform, transformOrigin, borderRadius, overflow })
    }
  }, [present, scaleBackground, reduce])

  useMotionValueEvent(backdrop, "change", (p) => {
    const el = backgroundRef.current
    if (!el) return
    el.style.transform = `translateY(${(p * 8).toFixed(2)}px) scale(${(1 - p * 0.04).toFixed(4)})`
    el.style.borderRadius = `${(p * 14).toFixed(1)}px`
  })

  React.useLayoutEffect(() => {
    if (!present) return
    const el = panelRef.current
    if (!el) return
    size.current = side === "bottom" ? el.offsetHeight : el.offsetWidth
    let cancelled = false
    const v = velocity.current
    velocity.current = 0
    if (open) {
      if (off.get() >= FAR) {
        // Fresh open: start below the edge at the default snap point.
        off.set(size.current + 24)
        snapRef.current = Math.min(defaultSnap, points.length - 1)
        setSnapState(snapRef.current)
      }
      const ctl = animate(off, snapOffset(snapRef.current), spring(v))
      return () => ctl.stop()
    }
    const ctl = animate(off, size.current + 24, reduce ? { duration: 0 } : v ? { ...SPRING, velocity: v } : GLIDE_OUT)
    ctl.then(() => {
      if (cancelled) return
      off.jump(FAR)
      setPresent(false)
    })
    return () => {
      cancelled = true
      ctl.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, present])

  // Focus in on open, back to the opener on close, Esc, scroll lock and re-measure on resize.
  React.useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement as HTMLElement | null
    const el = panelRef.current
    // Skip the snap handle: focus the first real control (close button or content) instead.
    const first =
      el?.querySelector<HTMLElement>("[data-autofocus]") ??
      Array.from(el?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).find((node) => !node.hasAttribute("data-drawer-handle"))
    ;(first ?? el)?.focus({ preventScroll: true })
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) {
        e.preventDefault()
        setOpen(false)
      }
    }
    const onResize = () => {
      const node = panelRef.current
      if (!node) return
      size.current = side === "bottom" ? node.offsetHeight : node.offsetWidth
      off.set(snapOffset(snapRef.current))
    }
    document.addEventListener("keydown", onKey)
    window.addEventListener("resize", onResize)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener("keydown", onKey)
      window.removeEventListener("resize", onResize)
      restoreRef.current?.focus({ preventScroll: true })
    }
  }, [open, setOpen, side, off, snapOffset, dismissible])

  const axis = (info: PanInfo, key: "offset" | "velocity") => (side === "bottom" ? info[key].y : info[key].x) * sign

  const onPan = (_: PointerEvent, info: PanInfo) => {
    let next = panStart.current + axis(info, "offset")
    if (next < 0) next = -Math.pow(-next, 0.7) // rubber band past fully open
    off.set(next)
  }

  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    const v = axis(info, "velocity")
    const cur = off.get()
    const offsets = points.map((_, i) => snapOffset(i))
    const candidates = dismissible ? [...offsets, closedOffset()] : offsets
    const projected = cur + v * 0.2
    let target = candidates.reduce((a, b) => (Math.abs(b - projected) < Math.abs(a - projected) ? b : a))
    if (Math.abs(v) > FLICK_VELOCITY) {
      // A flick always moves at least one step in its direction.
      const ahead = v > 0 ? candidates.filter((c) => c > cur + 4).sort((a, b) => a - b)[0] : candidates.filter((c) => c < cur - 4).sort((a, b) => b - a)[0]
      if (ahead !== undefined) target = ahead
    }
    // Past a quarter of the way down from the lowest point, a release closes it unless it was flicked back up.
    const low = offsets[0] ?? 0
    if (dismissible && v > -FLICK_VELOCITY && cur - low > (closedOffset() - low) * CLOSE_FRACTION) target = closedOffset()
    if (dismissible && target === closedOffset()) {
      velocity.current = v
      setOpen(false)
      return
    }
    const i = offsets.indexOf(target)
    setSnap(i)
    animate(off, target, spring(v))
  }

  const cycleSnap = () => {
    if (dragged.current) return
    const next = snapRef.current >= points.length - 1 ? 0 : snapRef.current + 1
    setSnap(next)
    animate(off, snapOffset(next), spring())
  }

  const trap = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !panelRef.current) return
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (!items.length) return e.preventDefault()
    const first = items[0]!
    const last = items[items.length - 1]!
    const active = document.activeElement
    if (e.shiftKey && (active === first || active === panelRef.current)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }

  if (!present) return null

  const isBottom = side === "bottom"
  const snapping = points.length > 1
  const expanded = snap === points.length - 1

  return (
    <>
      <GooduiTokens />
      <motion.div
        aria-hidden="true"
        className="fixed inset-0 z-50 bg-black/35 dark:bg-black/60"
        style={{ opacity: backdrop }}
        onClick={() => dismissible && setOpen(false)}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        aria-describedby={description ? `${uid}-desc` : undefined}
        tabIndex={-1}
        onKeyDown={trap}
        style={isBottom ? { y: translate } : { x: translate }}
        className={cn(
          "fixed z-50 flex flex-col bg-card text-card-foreground shadow-[var(--pc-e3)] outline-none after:absolute after:bg-card",
          isBottom &&
            "inset-x-0 bottom-0 mx-auto w-full max-w-xl rounded-t-[20px] after:inset-x-0 after:top-full after:h-[50vh]",
          isBottom && (snapping ? "h-[min(88dvh,760px)]" : "max-h-[88dvh]"),
          side === "right" && "inset-y-0 right-0 w-[min(400px,calc(100vw-2.5rem))] rounded-l-[20px] after:inset-y-0 after:left-full after:w-[50vw]",
          side === "left" && "inset-y-0 left-0 w-[min(340px,calc(100vw-2.5rem))] rounded-r-[20px] after:inset-y-0 after:right-full after:w-[50vw]",
          className,
        )}
      >
        <motion.div
          onPointerDown={() => (dragged.current = false)}
          onPanStart={() => {
            dragged.current = true
            off.stop()
            const panel = panelRef.current
            if (panel) size.current = isBottom ? panel.offsetHeight : panel.offsetWidth
            panStart.current = off.get()
          }}
          onPan={onPan}
          onPanEnd={onPanEnd}
          className={cn("shrink-0 cursor-grab touch-none px-5 pb-3 select-none active:cursor-grabbing", isBottom ? "pt-2" : "pt-5")}
        >
          {isBottom && (
            <button
              type="button"
              data-drawer-handle=""
              onClick={snapping ? cycleSnap : undefined}
              tabIndex={snapping ? 0 : -1}
              aria-label={snapping ? (expanded ? l.collapse : l.expand) : undefined}
              aria-hidden={snapping ? undefined : true}
              className="pc-press group/handle mx-auto mb-2 flex h-5 w-16 cursor-grab items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="h-1 w-9 rounded-full bg-foreground/20 transition-colors group-hover/handle:bg-foreground/35" />
            </button>
          )}
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 id={`${uid}-title`} className="text-base font-semibold tracking-tight">
                {title}
              </h2>
              {description && (
                <p id={`${uid}-desc`} className="mt-0.5 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {dismissible && (
              <button
                type="button"
                aria-label={l.close}
                onClick={() => setOpen(false)}
                className="pc-press -me-1.5 -mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </motion.div>
        <motion.div
          ref={bodyRef}
          style={morphHeight ? { height: bodyHeight } : undefined}
          className={cn("min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain px-5 pb-5", morphHeight ? "flex-initial" : "flex-1", bodyClassName)}
        >
          {morphHeight ? <div ref={contentRef}>{children}</div> : children}
        </motion.div>
        {footer && <div className="relative z-10 shrink-0 border-t border-[var(--pc-hair)] bg-card px-5 py-3">{footer}</div>}
      </motion.div>
    </>
  )
}
