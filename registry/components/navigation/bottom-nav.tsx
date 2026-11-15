"use client"

import * as React from "react"
import { AnimatePresence, LayoutGroup, motion, useReducedMotion, type Transition } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring as springs } from "@/lib/goodui-motion"

export type BottomNavItem = {
  /** Unique key of the tab; this is what value and onValueChange use. */
  value: string
  /** Text under the icon (or beside it when expanded) and the button's accessible name. */
  label: string
  /** Icon component (e.g. a lucide icon), rendered at 20px. */
  icon: React.ComponentType<{ className?: string }>
  /** A number shows a count bubble, `true` shows a dot. */
  badge?: number | boolean
}

export type BottomNavProps = Omit<React.ComponentProps<"nav">, "defaultValue" | "onChange"> & {
  /** The tabs, left to right. With centerAction, the first half goes before it. */
  items: BottomNavItem[]
  /** Selected tab value (controlled), e.g. derived from the current route. */
  value?: string
  /** Initially selected tab when uncontrolled; defaults to the first item. */
  defaultValue?: string
  /** Called with the tab's value when it is tapped. */
  onValueChange?: (value: string) => void
  /** `pill`: pill behind the icon with labels always shown. `expand`: the active tab grows to show its label. */
  variant?: "pill" | "expand"
  /** Raised round button in the middle of the bar, e.g. "New booking". */
  centerAction?: { label: string; icon: React.ComponentType<{ className?: string }>; onClick?: () => void }
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<BottomNavLabels>
}

/** Screen-reader text read after a tab's label when it has a badge. */
export type BottomNavLabels = {
  /** Number badge, e.g. ", 3 new". */
  badgeCount: (count: number) => string
  /** Dot badge (badge: true). */
  badgeDot: string
}
const DEFAULT_LABELS: BottomNavLabels = { badgeCount: (count) => `, ${count} new`, badgeDot: ", new" }

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

function Badge({ badge, reduce }: { badge: BottomNavItem["badge"]; reduce: boolean }) {
  const show = badge === true || (typeof badge === "number" && badge > 0)
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.span
          key={typeof badge === "number" ? badge : "dot"}
          aria-hidden="true"
          initial={{ scale: reduce ? 1 : 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: reduce ? 1 : 0.3, opacity: 0 }}
          transition={reduce ? { duration: 0 } : springs.play}
          className={cn(
            "absolute z-10 rounded-full bg-rose-600 text-white ring-2 ring-background",
            badge === true
              ? "-end-0.5 -top-0.5 size-2.5"
              : "-end-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center px-1 text-[10px] leading-none font-semibold tabular-nums",
          )}
        >
          {typeof badge === "number" ? (badge > 99 ? "99+" : badge) : null}
        </motion.span>
      )}
    </AnimatePresence>
  )
}

/**
 * Mobile bottom navigation: a pill glides to the selected tab (shared layout), the icon bounces when chosen,
 * badges pop in, and an optional raised center action. Left and Right arrows move focus between tabs (mirrored in RTL).
 */
export function BottomNav({
  items,
  value,
  defaultValue,
  onValueChange,
  variant = "pill",
  centerAction,
  labels,
  className,
  "aria-label": ariaLabel = "Main",
  ...props
}: BottomNavProps) {
  const l = useLabels("bottom-nav", DEFAULT_LABELS, labels)
  const uid = React.useId()
  const reduce = useReducedMotion() ?? false
  const rowRef = React.useRef<HTMLDivElement>(null)
  // Right-to-left: the expanding label slides in from the other side. Read after mount so SSR output is unchanged.
  const [rtl, setRtl] = React.useState(false)
  React.useEffect(() => {
    if (rowRef.current) setRtl(getComputedStyle(rowRef.current).direction === "rtl")
  }, [])
  const [current, setCurrent] = useControllable(value, defaultValue ?? items[0]?.value ?? "", onValueChange)
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])
  const spring: Transition = reduce ? { duration: 0 } : springs.snap
  const expand = variant === "expand"

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const n = items.length
    let next = -1
    const isRtl = getComputedStyle(e.currentTarget).direction === "rtl"
    if (e.key === (isRtl ? "ArrowLeft" : "ArrowRight")) next = (i + 1) % n
    else if (e.key === (isRtl ? "ArrowRight" : "ArrowLeft")) next = (i - 1 + n) % n
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = n - 1
    if (next < 0) return
    e.preventDefault()
    refs.current[next]?.focus()
  }

  const half = Math.ceil(items.length / 2)
  const CenterIcon = centerAction?.icon

  const renderItem = (item: BottomNavItem, i: number) => {
    const active = item.value === current
    const Icon = item.icon
    const count = typeof item.badge === "number" && item.badge > 0 ? l.badgeCount(item.badge) : item.badge === true ? l.badgeDot : ""
    // The visible label starts the accessible name; the badge text follows as sr-only.
    const srCount = count ? <span className="sr-only">{count}</span> : null
    const bounce = active && !reduce ? { y: [0, -5, 0], scale: [1, 1.18, 1] } : { y: 0, scale: 1 }

    if (expand) {
      return (
        <motion.button
          key={item.value}
          ref={(el) => {
            refs.current[i] = el
          }}
          layout
          type="button"
          aria-current={active ? "page" : undefined}
          onClick={() => setCurrent(item.value)}
          onKeyDown={(e) => onKeyDown(e, i)}
          transition={spring}
          style={{ borderRadius: 9999 }}
          className={cn(
            "pc-press relative flex h-11 min-w-11 cursor-pointer items-center justify-center px-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            active ? "text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {active && (
            <motion.span
              layoutId={`${uid}-pill`}
              aria-hidden="true"
              className="absolute inset-0 bg-primary/10 dark:bg-primary/20"
              style={{ borderRadius: 9999 }}
              transition={spring}
            />
          )}
          <motion.span layout="position" transition={spring} className="relative">
            <motion.span className="block" animate={bounce} transition={{ duration: 0.45, ease: "easeOut" }}>
              <Icon aria-hidden="true" className="size-5" />
            </motion.span>
            <Badge badge={item.badge} reduce={reduce} />
          </motion.span>
          {!active && <span className="sr-only">{item.label}</span>}
          {active && (
            <motion.span
              layout="position"
              initial={{ opacity: 0, x: reduce ? 0 : rtl ? 4 : -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.2, delay: 0.06 }}
              className="relative ms-2 text-sm font-semibold whitespace-nowrap"
            >
              {item.label}
            </motion.span>
          )}
          {srCount}
        </motion.button>
      )
    }

    return (
      <button
        key={item.value}
        ref={(el) => {
          refs.current[i] = el
        }}
        type="button"
        aria-current={active ? "page" : undefined}
        onClick={() => setCurrent(item.value)}
        onKeyDown={(e) => onKeyDown(e, i)}
        className={cn(
          "pc-press pc-press-soft group flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl py-1.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <span className="relative flex h-8 w-14 items-center justify-center">
          {active && (
            <motion.span
              layoutId={`${uid}-pill`}
              aria-hidden="true"
              className="absolute inset-0 bg-primary/10 dark:bg-primary/20"
              style={{ borderRadius: 9999 }}
              transition={spring}
            />
          )}
          <span className="relative">
            <motion.span className={cn("block", active && "text-primary")} animate={bounce} transition={{ duration: 0.45, ease: "easeOut" }}>
              <Icon aria-hidden="true" className="size-5" />
            </motion.span>
            <Badge badge={item.badge} reduce={reduce} />
          </span>
        </span>
        <span className={cn("max-w-full truncate text-[11px] leading-none transition-[font-weight]", active ? "font-semibold" : "font-medium")}>
          {item.label}
          {srCount}
        </span>
      </button>
    )
  }

  const center = centerAction && CenterIcon && (
    <div key="center" className="flex shrink-0 items-start justify-center px-1">
      <motion.button
        type="button"
        aria-label={centerAction.label}
        onClick={centerAction.onClick}
        whileHover={reduce ? undefined : { y: -2 }}
        whileTap={reduce ? undefined : { scale: 0.9 }}
        transition={springs.play}
        className="group -mt-7 flex size-14 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--pc-e2)] ring-4 ring-background outline-none focus-visible:ring-ring/50"
      >
        <CenterIcon className="size-6 transition-transform duration-300 group-hover:rotate-90 motion-reduce:transition-none" />
      </motion.button>
    </div>
  )

  return (
    <nav
      data-slot="bottom-nav"
      aria-label={ariaLabel}
      className={cn("border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md", className)}
      {...props}
    >
      <GooduiTokens />
      <LayoutGroup id={uid}>
        <div ref={rowRef} className={cn("flex h-16 items-center px-2", expand ? "justify-around gap-1" : "gap-0.5")}>
          {items.slice(0, centerAction ? half : items.length).map((item, i) => renderItem(item, i))}
          {center}
          {centerAction && items.slice(half).map((item, i) => renderItem(item, i + half))}
        </div>
      </LayoutGroup>
    </nav>
  )
}
