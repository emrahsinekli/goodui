"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react"
import { cn } from "@/lib/utils"
import { GooduiTokens, spring as springs } from "@/lib/goodui-motion"
import { NumberFlow } from "@/registry/components/numbers/number-flow"

export type TabsIndicatorItem = {
  /** Unique key of the tab; this is what value and onValueChange use. */
  value: string
  label: React.ReactNode
  /** Icon component (e.g. a lucide icon), rendered at 16px before the label. */
  icon?: React.ComponentType<{ className?: string }>
  /** Small count or tag shown after the label. */
  badge?: React.ReactNode
  disabled?: boolean
  /** Panel content. When any item has content, a panel that slides in the direction of travel is rendered. */
  content?: React.ReactNode
}

export type TabsIndicatorProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  /** The tabs, in order. Give items content to get built-in panels. */
  items: TabsIndicatorItem[]
  /** Selected tab value (controlled). */
  value?: string
  /** Initially selected tab when uncontrolled; defaults to the first enabled item. */
  defaultValue?: string
  /** Called with the new value on click or arrow-key selection. */
  onValueChange?: (value: string) => void
  /** underline: line under the active tab plus a hover highlight. pill: filled primary pill. segmented: raised thumb in a muted track. */
  variant?: "underline" | "pill" | "segmented"
  /** Stretch the tabs into equal columns. */
  fullWidth?: boolean
  /** Accessible name of the tab list. */
  listLabel?: string
  /** Classes for the tablist element. */
  listClassName?: string
  /** Classes for the tab panel (only rendered when items have content). */
  panelClassName?: string
}

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

const LIST = {
  underline: "flex gap-1 shadow-[inset_0_-1px_0_var(--border)]",
  pill: "flex gap-1",
  segmented: "inline-flex rounded-xl bg-muted p-1 shadow-[var(--pc-well)]",
}

const TAB = {
  underline: "h-10 rounded-md px-3 focus-visible:ring-inset text-muted-foreground hover:text-foreground aria-selected:text-foreground",
  pill: "h-9 rounded-full px-4 focus-visible:ring-inset text-muted-foreground hover:bg-muted hover:text-foreground aria-selected:text-primary-foreground aria-selected:hover:bg-transparent",
  segmented: "h-8 rounded-lg px-3 text-foreground/65 hover:text-foreground aria-selected:text-foreground",
}

const INDICATOR = {
  underline: "absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary",
  pill: "absolute inset-0 bg-primary bg-[image:var(--pc-sheen)] shadow-[inset_0_1px_var(--pc-edge-t),inset_0_-1px_var(--pc-edge-b),0_1px_2px_rgb(0_0_0/.2)]",
  segmented: "absolute inset-0 bg-background shadow-[var(--pc-e1)] dark:bg-input",
}

const BADGE = {
  underline: "bg-muted text-foreground/75 group-aria-selected:bg-primary/10 group-aria-selected:text-primary",
  pill: "bg-muted text-foreground/75 group-aria-selected:bg-primary-foreground/20 group-aria-selected:text-primary-foreground",
  segmented: "bg-background/70 text-foreground/75 dark:bg-white/10",
}

/** Animates its own height to the measured height of its content. */
function AutoHeight({ children, transition, className }: { children: React.ReactNode; transition: Transition; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [height, setHeight] = React.useState<number | "auto">("auto")
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => entry && setHeight(entry.contentRect.height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <motion.div className={cn("relative overflow-hidden", className)} initial={false} animate={{ height }} transition={transition}>
      <div ref={ref}>{children}</div>
    </motion.div>
  )
}

/**
 * Tabs with a shared-layout indicator that glides between tabs (underline, pill or segmented), arrow-key
 * navigation and a panel that slides in the direction of travel.
 */
export function TabsIndicator({
  items,
  value,
  defaultValue,
  onValueChange,
  variant = "underline",
  fullWidth = false,
  listLabel,
  listClassName,
  panelClassName,
  className,
  ...props
}: TabsIndicatorProps) {
  const uid = React.useId()
  const reduce = useReducedMotion() ?? false
  const [current, setCurrent] = useControllable(value, defaultValue ?? items.find((i) => !i.disabled)?.value ?? "", onValueChange)
  const index = Math.max(0, items.findIndex((i) => i.value === current))
  const active = items[index]
  const hasPanels = items.some((i) => i.content !== undefined)
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([])
  const listRef = React.useRef<HTMLDivElement>(null)
  // Right-to-left layout flips arrow keys and the panel slide; read after mount so SSR output is unchanged.
  const [rtl, setRtl] = React.useState(false)
  React.useEffect(() => {
    if (listRef.current) setRtl(getComputedStyle(listRef.current).direction === "rtl")
  }, [])

  // Direction of travel, derived when the index changes (also for controlled updates).
  const [prevIndex, setPrevIndex] = React.useState(index)
  const [direction, setDirection] = React.useState(1)
  if (prevIndex !== index) {
    setDirection(index > prevIndex ? 1 : -1)
    setPrevIndex(index)
  }

  // Hover highlight for the underline variant: one element that glides under the pointer.
  const [hover, setHover] = React.useState<{ x: number; w: number; visible: boolean; glide: boolean }>({ x: 0, w: 0, visible: false, glide: false })
  const onTabEnter = (i: number) => {
    if (variant !== "underline") return
    const el = tabRefs.current[i]
    if (!el || items[i]?.disabled) return
    setHover((h) => ({ x: el.offsetLeft, w: el.offsetWidth, visible: true, glide: h.visible }))
  }

  const spring: Transition = reduce ? { duration: 0 } : springs.snap

  const enabled = items.map((item, i) => ({ item, i })).filter((x) => !x.item.disabled)
  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const pos = enabled.findIndex((x) => x.i === i)
    let next: (typeof enabled)[number] | undefined
    const isRtl = getComputedStyle(e.currentTarget).direction === "rtl"
    const forward = isRtl ? "ArrowLeft" : "ArrowRight"
    const back = isRtl ? "ArrowRight" : "ArrowLeft"
    if (e.key === forward) next = enabled[(pos + 1) % enabled.length]
    else if (e.key === back) next = enabled[(pos - 1 + enabled.length) % enabled.length]
    else if (e.key === "Home") next = enabled[0]
    else if (e.key === "End") next = enabled[enabled.length - 1]
    if (!next) return
    e.preventDefault()
    setCurrent(next.item.value)
    tabRefs.current[next.i]?.focus()
  }

  const slide = reduce ? 0 : rtl ? -28 : 28
  const panelVariants = {
    enter: (d: number) => ({ x: d * slide, opacity: 0, filter: reduce ? "none" : "blur(4px)" }),
    center: { x: 0, opacity: 1, filter: reduce ? "none" : "blur(0px)" },
    exit: (d: number) => ({ x: -d * slide, opacity: 0, filter: reduce ? "none" : "blur(4px)" }),
  }

  return (
    <div data-slot="tabs-indicator" className={cn("flex flex-col gap-4", className)} {...props}>
      <GooduiTokens />
      <div className={cn("max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", variant !== "segmented" && "w-full", fullWidth && "w-full")}>
        <div
          ref={listRef}
          role="tablist"
          aria-orientation="horizontal"
          aria-label={listLabel}
          className={cn("relative", LIST[variant], fullWidth ? "w-full" : variant === "segmented" ? "" : "w-max min-w-full", listClassName)}
          onPointerLeave={() => setHover((h) => ({ ...h, visible: false }))}
        >
          {variant === "underline" && (
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute top-1 bottom-1.5 left-0 rounded-md bg-muted"
              initial={false}
              animate={{ x: hover.x, width: hover.w, opacity: hover.visible ? 1 : 0 }}
              transition={{
                x: hover.glide ? spring : { duration: 0 },
                width: hover.glide ? spring : { duration: 0 },
                opacity: { duration: reduce ? 0 : 0.15 },
              }}
            />
          )}
          {items.map((item, i) => {
            const selected = i === index
            const Icon = item.icon
            return (
              <button
                key={item.value}
                ref={(el) => {
                  tabRefs.current[i] = el
                }}
                id={`${uid}-tab-${i}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={hasPanels && selected ? `${uid}-panel` : undefined}
                tabIndex={selected ? 0 : -1}
                disabled={item.disabled}
                onClick={() => setCurrent(item.value)}
                onKeyDown={(e) => onKeyDown(e, i)}
                onPointerEnter={() => onTabEnter(i)}
                className={cn(
                  "pc-press pc-press-soft group relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 text-sm font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40",
                  TAB[variant],
                  fullWidth && "flex-1",
                )}
              >
                {selected && (
                  <motion.span
                    layoutId={`${uid}-indicator`}
                    aria-hidden="true"
                    className={INDICATOR[variant]}
                    style={{ borderRadius: variant === "pill" ? 9999 : variant === "segmented" ? 8 : 9999 }}
                    transition={spring}
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-2">
                  {Icon && <Icon className="size-4 shrink-0" />}
                  {item.label}
                  {item.badge !== undefined && (
                    <span className={cn("rounded-full px-1.5 py-px text-[11px] leading-4 font-semibold tabular-nums transition-colors", BADGE[variant])}>
                      {typeof item.badge === "number" ? <NumberFlow value={item.badge} /> : item.badge}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {hasPanels && (
        <AutoHeight transition={reduce ? { duration: 0 } : springs.snap}>
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div
              key={active?.value}
              id={`${uid}-panel`}
              role="tabpanel"
              aria-labelledby={`${uid}-tab-${index}`}
              tabIndex={0}
              custom={direction}
              variants={panelVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={reduce ? { duration: 0 } : { ...springs.ui, opacity: { duration: 0.18 } }}
              className={cn("rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset", panelClassName)}
            >
              {active?.content}
            </motion.div>
          </AnimatePresence>
        </AutoHeight>
      )}
    </div>
  )
}
