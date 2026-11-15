"use client"

import * as React from "react"
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from "motion/react"
import { Info, TriangleAlert, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import type { SoundName } from "@/lib/goodui-sounds"
import { GooduiTokens, ease, spring as springs } from "@/lib/goodui-motion"

const CSS = `
@keyframes pc-toast-stack-spin { to { transform: rotate(360deg) } }
@keyframes pc-toast-stack-timer { from { transform: scaleX(1) } to { transform: scaleX(0) } }
.pc-toast-stack-spin { animation: pc-toast-stack-spin .8s linear infinite; transform-box: view-box; transform-origin: center; }
.pc-toast-stack-timer { transform-origin: left; animation: pc-toast-stack-timer var(--pc-toast-duration) linear forwards; }
.pc-toast-stack-timer[data-paused="true"] { animation-play-state: paused; }
[dir="rtl"] .pc-toast-stack-timer { transform-origin: right; }
@media (prefers-reduced-motion: reduce) {
  .pc-toast-stack-spin { animation-duration: 2.4s }
  .pc-toast-stack-timer { display: none }
}
`

/* ---------------------------------------------------------------- store */

export type ToastType = "default" | "success" | "error" | "warning" | "info" | "loading"

export type ToastAction = {
  label: string
  onClick: () => void
}

export type ToastOptions = {
  /** Reuse an id to update a toast in place. */
  id?: string | number
  /** Second line under the title, in muted text. */
  description?: React.ReactNode
  /** Picks the icon: success, error, warning, info, a spinner for loading, none for default. */
  type?: ToastType
  /** Milliseconds before it closes. Infinity keeps it open. Loading toasts never close on their own. */
  duration?: number
  /** One button on the toast; clicking it runs onClick and closes the toast. */
  action?: ToastAction
  /** Replaces the icon picked by type. */
  icon?: React.ReactNode
  /** Show the close button and allow swiping. */
  dismissible?: boolean
  /** Called whenever the toast closes: timeout, swipe, close button, Esc, action or toast.dismiss(). */
  onDismiss?: () => void
}

export type ToastRecord = Omit<ToastOptions, "id"> & {
  id: string | number
  title: React.ReactNode
  type: ToastType
  /** Increments on every update so timers restart. */
  version: number
}

let records: ToastRecord[] = []
let counter = 0
const listeners = new Set<() => void>()
const EMPTY: ToastRecord[] = []

function emit() {
  for (const l of listeners) l()
}
function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

function upsert(title: React.ReactNode, options: ToastOptions = {}) {
  const id = options.id ?? `t${++counter}`
  const existing = records.find((r) => r.id === id)
  if (existing) {
    records = records.map((r) =>
      r.id === id ? { ...r, ...options, id, title, type: options.type ?? r.type, version: r.version + 1 } : r,
    )
  } else {
    records = [{ dismissible: true, ...options, id, title, type: options.type ?? "default", version: 0 }, ...records]
  }
  emit()
  return id
}

function dismiss(id?: string | number) {
  if (id === undefined) {
    records.forEach((r) => r.onDismiss?.())
    records = []
  } else {
    records.find((r) => r.id === id)?.onDismiss?.()
    records = records.filter((r) => r.id !== id)
  }
  emit()
}

function resolve<A>(value: React.ReactNode | ((arg: A) => React.ReactNode), arg: A): React.ReactNode {
  return typeof value === "function" ? value(arg) : value
}

export type ToastPromiseMessages<T> = {
  loading: React.ReactNode
  success: React.ReactNode | ((data: T) => React.ReactNode)
  error: React.ReactNode | ((error: unknown) => React.ReactNode)
  description?: React.ReactNode
  /** Shown on the success toast, e.g. an "Undo" or "View" button. */
  action?: ToastAction
}

/**
 * Show a toast from anywhere. Returns its id.
 * `toast("Saved")`, `toast.success(...)`, `toast.error(...)`, `toast.promise(p, {...})`, `toast.dismiss(id?)`.
 */
export const toast = Object.assign((title: React.ReactNode, options?: ToastOptions) => upsert(title, options), {
  success: (title: React.ReactNode, options?: ToastOptions) => upsert(title, { ...options, type: "success" }),
  error: (title: React.ReactNode, options?: ToastOptions) => upsert(title, { ...options, type: "error" }),
  warning: (title: React.ReactNode, options?: ToastOptions) => upsert(title, { ...options, type: "warning" }),
  info: (title: React.ReactNode, options?: ToastOptions) => upsert(title, { ...options, type: "info" }),
  loading: (title: React.ReactNode, options?: ToastOptions) => upsert(title, { ...options, type: "loading" }),
  dismiss,
  promise<T>(promise: Promise<T> | (() => Promise<T>), messages: ToastPromiseMessages<T>, options?: ToastOptions) {
    const id = upsert(messages.loading, { ...options, type: "loading", description: messages.description })
    const p = typeof promise === "function" ? promise() : promise
    p.then(
      (data) => {
        if (records.some((r) => r.id === id))
          upsert(resolve(messages.success, data), { ...options, id, type: "success", description: undefined, action: messages.action })
      },
      (error: unknown) => {
        if (records.some((r) => r.id === id)) upsert(resolve(messages.error, error), { ...options, id, type: "error", description: undefined })
      },
    )
    return p
  },
})

/** Subscribe to the toast list, e.g. to render a custom toaster. */
export function useToasts() {
  return React.useSyncExternalStore(subscribe, () => records, () => EMPTY)
}

/* ---------------------------------------------------------------- toaster */

export type ToasterPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"

export type ToasterLabels = { notifications: string; close: string }
const DEFAULT_LABELS: ToasterLabels = { notifications: "Notifications (Alt+T)", close: "Close notification" }

export type ToasterProps = Omit<React.ComponentProps<"section">, "children"> & {
  /** Screen corner or edge the stack is pinned to; top positions stack downward, bottom ones upward. */
  position?: ToasterPosition
  /** Toasts visible in the collapsed stack. */
  visibleToasts?: number
  /** Default auto-dismiss time in ms. */
  duration?: number
  /** Space between toasts when expanded, in px. */
  gap?: number
  /** Keep the stack expanded instead of expanding on hover. */
  expand?: boolean
  /** Thin bar showing the time left. */
  showTimer?: boolean
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<ToasterLabels>
  /** Plays a sound for each new toast by type (success, error, warning, otherwise "notify") when the visitor has sounds on (lib/goodui-sounds); a sound name is used for every type. Off by default. */
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

const ICONS: Record<"warning" | "info", React.ReactNode> = {
  warning: <TriangleAlert className="size-[18px] text-amber-600 dark:text-amber-400" />,
  info: <Info className="size-[18px] text-sky-600 dark:text-sky-400" />,
}

/**
 * One icon for loading, success and error, so a promise toast morphs instead of swapping: the spinner's arc closes
 * into a ring, keeps spinning until it is whole (a closed ring hides the rotation stopping), then the mark draws in.
 */
function StatusIcon({ type, reduce }: { type: "loading" | "success" | "error"; reduce: boolean }) {
  const loading = type === "loading"
  const [spin, setSpin] = React.useState(loading)
  if (loading && !spin) setSpin(true)
  const draw = (shown: boolean, delay: number) => ({
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: shown ? 1 : 0, opacity: shown ? 1 : 0 },
    transition: reduce ? { duration: 0 } : { duration: 0.24, delay: shown ? delay : 0, ease: ease.out, opacity: { duration: 0.01, delay: shown ? delay : 0 } },
  })
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn(
        "size-[18px] overflow-visible transition-colors duration-300",
        loading ? "text-muted-foreground" : type === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
      )}
      animate={loading || reduce ? { scale: 1 } : { scale: [1, 1.16, 1] }}
      transition={{ duration: 0.4, delay: loading ? 0 : 0.2, ease: ease.out }}
    >
      <motion.circle cx="12" cy="12" r="11" fill="currentColor" initial={false} animate={{ opacity: loading ? 0 : 0.16 }} transition={{ duration: reduce ? 0 : 0.3 }} />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".2" strokeWidth="2.5" />
      <g className={spin ? "pc-toast-stack-spin" : undefined}>
        <motion.circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          transform="rotate(-90 12 12)"
          initial={{ pathLength: loading ? 0.25 : 0 }}
          animate={{ pathLength: loading ? 0.25 : 1 }}
          transition={reduce ? { duration: 0 } : { duration: 0.34, ease: ease.out }}
          onAnimationComplete={() => {
            if (!loading) setSpin(false)
          }}
        />
      </g>
      <motion.path d="M7.5 12.5l3 3 6-6.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...draw(type === "success", 0.2)} />
      <motion.path d="M8.5 8.5l7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" {...draw(type === "error", 0.2)} />
      <motion.path d="M15.5 8.5l-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" {...draw(type === "error", 0.3)} />
    </motion.svg>
  )
}

/** Sonner's stack: each older toast sits 14px further back and 5% smaller, moving on 400ms. */
const PEEK = 14
const STACK_MOVE = { duration: 0.4, ease: ease.out }

const POSITION: Record<ToasterPosition, string> = {
  "top-left": "top-4 left-4 sm:top-6 sm:left-6",
  "top-center": "top-4 left-1/2 -translate-x-1/2 sm:top-6",
  "top-right": "top-4 right-4 sm:top-6 sm:right-6",
  "bottom-left": "bottom-4 left-4 sm:bottom-6 sm:left-6",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 sm:bottom-6",
  "bottom-right": "bottom-4 right-4 sm:bottom-6 sm:right-6",
}

/** Renders the toasts. Mount once near the root of the app. */
export function Toaster({
  position = "bottom-right",
  visibleToasts = 3,
  duration = 4000,
  gap = 14,
  expand = false,
  showTimer = true,
  labels,
  sound,
  className,
  ...props
}: ToasterProps) {
  const l = useLabels("toast-stack", DEFAULT_LABELS, labels)
  const toasts = useToasts()
  const cue = useCue(sound)
  const reduce = useReducedMotion() ?? false
  const [hovered, setHovered] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const [hidden, setHidden] = React.useState(false)
  const [heights, setHeights] = React.useState<Record<string, number>>({})
  const listRef = React.useRef<HTMLOListElement>(null)

  React.useEffect(() => {
    const onVisibility = () => setHidden(document.hidden)
    onVisibility()
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [])

  // Alt+T jumps to the newest toast, like most toasters.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.code === "KeyT") listRef.current?.querySelector<HTMLElement>("li")?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Collapse once the list empties, or the pointer may never "leave" it.
  React.useEffect(() => {
    if (toasts.length === 0) {
      setHovered(false)
      setFocused(false)
    }
  }, [toasts.length])

  // A sound for every new toast, and again when a loading toast turns into its result.
  const seen = React.useRef(new Map<string | number, ToastType>())
  React.useEffect(() => {
    const map = seen.current
    for (const t of toasts) {
      const prev = map.get(t.id)
      map.set(t.id, t.type)
      if (t.type === "loading" || prev === t.type || (prev !== undefined && prev !== "loading")) continue
      cue(t.type === "success" || t.type === "error" || t.type === "warning" ? t.type : "notify")
    }
    for (const id of map.keys()) if (!toasts.some((t) => t.id === id)) map.delete(id)
  }, [toasts, cue])

  const setHeight = React.useCallback((id: string | number, h: number | null) => {
    setHeights((prev) => {
      const key = String(id)
      if (h === null) {
        if (!(key in prev)) return prev
        const next = { ...prev }
        delete next[key]
        return next
      }
      return prev[key] === h ? prev : { ...prev, [key]: h }
    })
  }, [])

  const expanded = expand || hovered || focused
  const top = position.startsWith("top")
  const front = toasts[0]
  const frontHeight = front ? heights[String(front.id)] : undefined
  const offsets: number[] = []
  let acc = 0
  toasts.forEach((t, i) => {
    offsets[i] = acc
    acc += (heights[String(t.id)] ?? 64) + gap
  })
  const shown = toasts.slice(0, expanded ? toasts.length : visibleToasts + 1)
  const listHeight = expanded ? Math.max(0, acc - gap) : (frontHeight ?? 0) + Math.min(toasts.length - 1, visibleToasts - 1) * PEEK

  return (
    <section
      aria-label={l.notifications}
      aria-live="polite"
      aria-relevant="additions text"
      aria-atomic="false"
      tabIndex={-1}
      className={cn("pointer-events-none fixed z-[100] w-[calc(100vw-2rem)] sm:w-[360px]", POSITION[position], className)}
      {...props}
    >
      <GooduiTokens />
      <style href="pc-toast-stack" precedence="default">
        {CSS}
      </style>
      <ol
        ref={listRef}
        className="pointer-events-auto relative"
        style={{ height: toasts.length ? listHeight : 0 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!listRef.current?.contains(e.relatedTarget as Node | null)) setFocused(false)
        }}
      >
        <AnimatePresence initial={false}>
          {shown.map((t, i) => (
            <ToastItem
              key={t.id}
              toast={t}
              index={i}
              expanded={expanded}
              top={top}
              offset={offsets[i] ?? 0}
              frontHeight={frontHeight}
              height={heights[String(t.id)]}
              hiddenInStack={!expanded && i >= visibleToasts}
              paused={hovered || focused || hidden}
              duration={t.duration ?? duration}
              total={toasts.length}
              reduce={reduce}
              showTimer={showTimer}
              closeLabel={l.close}
              onHeight={setHeight}
            />
          ))}
        </AnimatePresence>
      </ol>
    </section>
  )
}

type ToastItemProps = {
  toast: ToastRecord
  index: number
  expanded: boolean
  top: boolean
  offset: number
  frontHeight?: number
  height?: number
  hiddenInStack: boolean
  paused: boolean
  duration: number
  total: number
  reduce: boolean
  showTimer: boolean
  closeLabel: string
  onHeight: (id: string | number, h: number | null) => void
}

function ToastItem({
  toast: t,
  index,
  expanded,
  top,
  offset,
  frontHeight,
  height,
  hiddenInStack,
  paused,
  duration,
  total,
  reduce,
  showTimer,
  closeLabel,
  onHeight,
}: ToastItemProps) {
  const contentRef = React.useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const dragOpacity = useTransform(x, [-220, -60, 0, 60, 220], [0, 1, 1, 1, 0])
  // +1 stacks downward from the top edge, -1 stacks upward from the bottom edge.
  const dir = top ? 1 : -1
  const isFront = index === 0
  const remaining = React.useRef(duration)
  const timed = t.type !== "loading" && Number.isFinite(duration)
  const close = React.useCallback(() => dismiss(t.id), [t.id])

  React.useLayoutEffect(() => {
    const el = contentRef.current
    if (!el) return
    const measure = () => onHeight(t.id, el.offsetHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [t.id, onHeight])
  React.useEffect(() => () => onHeight(t.id, null), [t.id, onHeight])

  // A new version (e.g. a promise resolving) restarts the timer.
  React.useEffect(() => {
    remaining.current = duration
  }, [t.version, duration])

  React.useEffect(() => {
    if (!timed || paused) return
    const start = performance.now()
    const id = window.setTimeout(close, remaining.current)
    return () => {
      window.clearTimeout(id)
      remaining.current = Math.max(0, remaining.current - (performance.now() - start))
    }
  }, [timed, paused, close, t.version])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    // Sonner: 45px, or any drag quicker than .11px/ms.
    if (Math.abs(info.offset.x) > 45 || (Math.abs(info.velocity.x) > 110 && Math.abs(info.offset.x) > 8)) {
      const side = Math.sign(info.offset.x || info.velocity.x) || 1
      animate(x, side * 420, { duration: reduce ? 0 : 0.2, ease: "easeOut" }).then(close)
    }
  }

  // Collapsed: older toasts shrink behind the front one and only peek out.
  const collapsedScale = 1 - index * 0.05
  const y = dir * (expanded ? offset : index * PEEK)
  const targetHeight = expanded || isFront ? height : frontHeight
  const spring = reduce ? { duration: 0 } : { default: springs.ui, y: STACK_MOVE, scale: STACK_MOVE }
  const status = !t.icon && (t.type === "loading" || t.type === "success" || t.type === "error") ? t.type : null
  const icon = status ? <StatusIcon type={status} reduce={reduce} /> : (t.icon ?? (t.type === "warning" || t.type === "info" ? ICONS[t.type] : null))
  const canSwipe = t.dismissible !== false && (expanded || isFront)

  return (
    <motion.li
      data-type={t.type}
      tabIndex={expanded || isFront ? 0 : -1}
      onKeyDown={(e) => {
        if (e.key === "Escape" && t.dismissible !== false) {
          e.stopPropagation()
          close()
        }
      }}
      className={cn(
        "absolute inset-x-0 rounded-[14px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        top ? "top-0 origin-bottom" : "bottom-0 origin-top",
        hiddenInStack && "pointer-events-none",
      )}
      style={{ zIndex: total - index }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -dir * 40, scale: 0.95 }}
      animate={{
        opacity: hiddenInStack ? 0 : 1,
        y,
        scale: expanded ? 1 : collapsedScale,
        height: targetHeight ?? "auto",
      }}
      exit={reduce ? { opacity: 0, transition: { duration: 0.15 } } : { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: ease.out } }}
      transition={spring}
    >
      <motion.div
        drag={canSwipe ? "x" : false}
        dragSnapToOrigin
        dragElastic={0.6}
        onDragEnd={onDragEnd}
        style={{ x, opacity: dragOpacity }}
        className="h-full cursor-grab touch-pan-y overflow-hidden rounded-[14px] bg-popover text-popover-foreground shadow-[var(--pc-e3)] active:cursor-grabbing"
      >
        <motion.div
          ref={contentRef}
          className="group/toast relative flex items-start gap-3 p-4 pe-10"
          aria-hidden={!(expanded || isFront) || undefined}
          // visibility, not just opacity: a covered toast's buttons must leave the tab order and the accessibility tree.
          animate={expanded || isFront ? { opacity: 1, visibility: "visible" } : { opacity: 0, transitionEnd: { visibility: "hidden" } }}
          transition={reduce ? { duration: 0 } : { duration: 0.2 }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {icon && (
              <motion.span
                key={status ? "status" : t.type}
                className="mt-px flex shrink-0"
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                transition={reduce ? { duration: 0 } : springs.play}
              >
                {icon}
              </motion.span>
            )}
          </AnimatePresence>
          <motion.div
            key={t.version}
            className="min-w-0 flex-1"
            initial={t.version && !reduce ? { opacity: 0, filter: "blur(4px)" } : false}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.2, ease: ease.out }}
          >
            <div className="text-sm leading-5 font-medium">{t.title}</div>
            {t.description && <div className="mt-0.5 text-sm leading-5 text-muted-foreground">{t.description}</div>}
          </motion.div>
          {t.action && (
            <button
              type="button"
              tabIndex={expanded || isFront ? undefined : -1}
              onPointerDownCapture={(e) => e.stopPropagation()}
              onClick={() => {
                t.action?.onClick()
                close()
              }}
              className="pc-press shrink-0 self-center rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-opacity outline-none hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {t.action.label}
            </button>
          )}
          {t.dismissible !== false && (
            <button
              type="button"
              tabIndex={expanded || isFront ? undefined : -1}
              aria-label={closeLabel}
              onPointerDownCapture={(e) => e.stopPropagation()}
              onClick={close}
              className="pc-press absolute end-3 top-3 grid size-6 place-items-center rounded-md text-muted-foreground opacity-60 transition-opacity outline-none group-hover/toast:opacity-100 hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <X className="size-3.5" />
            </button>
          )}
          {showTimer && timed && (
            <span
              key={`timer-${t.version}`}
              aria-hidden="true"
              data-paused={paused}
              className="pc-toast-stack-timer absolute inset-x-0 bottom-0 h-0.5 bg-foreground/10"
              style={{ ["--pc-toast-duration" as string]: `${duration}ms` }}
            />
          )}
        </motion.div>
      </motion.div>
    </motion.li>
  )
}

