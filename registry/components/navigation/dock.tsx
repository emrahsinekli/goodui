"use client"

import * as React from "react"
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useMotionValue,
  useReducedMotion,
  useMotionValueEvent,
  useSpring,
  type MotionValue,
} from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, follow, spring } from "@/lib/goodui-motion"

const CSS = `
.pc-dock{position:relative;isolation:isolate;background:color-mix(in oklab,var(--card) 58%,transparent);-webkit-backdrop-filter:blur(20px) saturate(1.7);backdrop-filter:blur(20px) saturate(1.7);box-shadow:inset 0 1px rgb(255 255 255/.6),inset 0 0 0 1px rgb(255 255 255/.14),var(--pc-e3)}
.dark .pc-dock{box-shadow:inset 0 1px rgb(255 255 255/.16),inset 0 0 0 1px rgb(255 255 255/.05),var(--pc-e3)}
.pc-dock::before{content:"";position:absolute;inset:0;z-index:-1;border-radius:inherit;pointer-events:none;background:linear-gradient(rgb(255 255 255/.2),transparent 62%)}
.dark .pc-dock::before{background:linear-gradient(rgb(255 255 255/.07),transparent 62%)}
.pc-dock-tile{box-shadow:inset 0 1px rgb(255 255 255/.7),inset 0 -1px rgb(0 0 0/.08),0 0 0 .5px rgb(0 0 0/.1),0 1px 2px rgb(0 0 0/.14),0 6px 12px -6px rgb(0 0 0/.3)}
.dark .pc-dock-tile{box-shadow:inset 0 1px rgb(255 255 255/.2),inset 0 -1px rgb(0 0 0/.25),0 0 0 .5px rgb(0 0 0/.6),0 1px 2px rgb(0 0 0/.4),0 6px 12px -6px rgb(0 0 0/.6)}
.pc-dock-tile::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(rgb(255 255 255/.24),transparent 55%)}
`

export type DockItem =
  | {
      /** Unique key of the tile. */
      id: string
      /** Tooltip text and the button's accessible name. */
      label: string
      /** Icon component (e.g. a lucide icon), sized to 45% of the tile. */
      icon: React.ComponentType<{ className?: string }>
      onClick?: () => void
      /** Shows the running dot under the icon. */
      active?: boolean
      /** Count bubble on the icon, e.g. unread messages. */
      badge?: number
      /** Tailwind classes for the icon tile, e.g. a brand gradient. */
      tileClassName?: string
    }
  | { id: string; separator: true }

export type DockProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Tiles from left to right; { id, separator: true } draws a divider between groups. */
  items: DockItem[]
  /** Resting tile size in px. */
  size?: number
  /** Tile size in px right under the pointer. */
  magnification?: number
  /** Pointer distance in px over which neighbours grow. */
  distance?: number
  /** Bounce the icon when clicked, like an app launching. */
  bounce?: boolean
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<DockLabels>
}

/** Screen-reader text for the count bubble, read after the tile label. */
export type DockLabels = { badge: (count: number) => string }
const DEFAULT_LABELS: DockLabels = { badge: (count) => `${count} new` }

type DockButtonItem = Exclude<DockItem, { separator: true }>

function DockIcon({
  item,
  mouseX,
  size,
  magnification,
  distance,
  magnify,
  bounce,
  reduce,
  index,
  focusable,
  onFocusItem,
  onKeyDown,
  refCb,
  tipId,
  l,
}: {
  item: DockButtonItem
  mouseX: MotionValue<number>
  size: number
  magnification: number
  distance: number
  magnify: boolean
  bounce: boolean
  reduce: boolean
  index: number
  focusable: boolean
  onFocusItem: (index: number) => void
  onKeyDown: (e: React.KeyboardEvent, index: number) => void
  refCb: (el: HTMLButtonElement | null) => void
  tipId: string
  l: DockLabels
}) {
  const ref = React.useRef<HTMLButtonElement>(null)
  const [tip, setTip] = React.useState(false)
  const controls = useAnimationControls()

  // Size from the pointer's distance to this tile's centre, smoothed by a spring.
  const sizeFor = (x: number) => {
    const r = ref.current?.getBoundingClientRect()
    if (!magnify || !r || !Number.isFinite(x)) return size
    const t = Math.max(0, 1 - Math.abs(x - (r.left + r.width / 2)) / distance)
    // Cosine falloff reads smoother than a linear ramp.
    return size + (magnification - size) * (0.5 - 0.5 * Math.cos(Math.PI * t))
  }
  const width = useSpring(size, follow)
  useMotionValueEvent(mouseX, "change", (x) => width.set(sizeFor(x)))
  React.useEffect(() => {
    width.set(sizeFor(mouseX.get()))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, magnification, distance, magnify])

  const Icon = item.icon
  const click = () => {
    if (bounce && !reduce) controls.start({
        y: [0, -18, 0, -6, 0],
        scaleX: [1, 0.96, 1.07, 0.99, 1],
        scaleY: [1, 1.05, 0.91, 1.02, 1],
        transition: { duration: 0.66, times: [0, 0.32, 0.6, 0.8, 1], ease: ["easeOut", "easeIn", "easeOut", "easeIn"] },
      })
    item.onClick?.()
  }

  return (
    <motion.div style={{ width, height: width }} className="relative flex shrink-0 items-end justify-center">
      <AnimatePresence>
        {tip && (
          <motion.span
            role="tooltip"
            id={tipId}
            initial={{ opacity: 0, y: 6, scale: 0.95, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: 4, scale: 0.95, x: "-50%" }}
            transition={reduce ? { duration: 0 } : spring.ui}
            className="pointer-events-none absolute -top-9 left-1/2 z-20 rounded-md border bg-popover px-2 py-1 text-xs font-medium whitespace-nowrap text-popover-foreground shadow-[var(--pc-e2)]"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      <motion.div animate={controls} className="size-full origin-bottom">
      <motion.button
        ref={(el) => {
          ref.current = el
          refCb(el)
        }}
        type="button"
        aria-describedby={tip ? tipId : undefined}
        aria-current={item.active ? "page" : undefined}
        tabIndex={focusable ? 0 : -1}
        whileTap={reduce ? undefined : { scale: 0.9 }}
        whileHover={!magnify && !reduce ? { scale: 1.08, y: -2 } : undefined}
        onClick={click}
        onKeyDown={(e) => onKeyDown(e, index)}
        onPointerEnter={() => setTip(true)}
        onPointerLeave={() => setTip(false)}
        onFocus={() => {
          setTip(true)
          onFocusItem(index)
        }}
        onBlur={() => setTip(false)}
        className={cn(
          "pc-dock-tile relative flex size-full cursor-pointer items-center justify-center rounded-[28%] bg-linear-to-b from-background to-muted text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:from-muted dark:to-card [&_svg]:relative [&_svg]:size-[45%]",
          item.tileClassName,
        )}
      >
        {/* The name comes from content (label + count), so the visible count is always part of it. */}
        <span className="sr-only">{item.label}</span>
        <Icon aria-hidden="true" />
        <AnimatePresence>
          {!!item.badge && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={reduce ? { duration: 0 } : spring.play}
              className="absolute -end-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] leading-none font-semibold text-white tabular-nums shadow-[var(--pc-e1)] ring-2 ring-card"
            >
              <span aria-hidden="true">{item.badge > 99 ? "99+" : item.badge}</span>
              <span className="sr-only">, {l.badge(item.badge)}</span>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
      </motion.div>
      <motion.span
        aria-hidden="true"
        className="absolute -bottom-[7px] left-1/2 size-1 -translate-x-1/2 rounded-full bg-foreground/80 shadow-[0_0_6px_var(--foreground)]"
        initial={false}
        animate={{ opacity: item.active ? 1 : 0, scale: item.active ? 1 : 0.4 }}
        transition={reduce ? { duration: 0 } : { ...spring.play, delay: item.active ? 0.3 : 0 }}
      />
    </motion.div>
  )
}

/**
 * macOS-style dock: tiles near the pointer magnify on a spring, with tooltips, running dots, badges and a launch
 * bounce. On touch screens and with reduced motion it falls back to a simple press/hover scale.
 * Arrow keys move focus between tiles (role="toolbar").
 */
export function Dock({ items, size = 44, magnification = 68, distance = 140, bounce = true, labels, className, ...props }: DockProps) {
  const l = useLabels("dock", DEFAULT_LABELS, labels)
  const uid = React.useId()
  const reduce = useReducedMotion() ?? false
  const mouseX = useMotionValue(Number.POSITIVE_INFINITY)
  const [touch, setTouch] = React.useState(false)
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])
  const [focusIndex, setFocusIndex] = React.useState(0)

  React.useEffect(() => {
    const mq = window.matchMedia("(hover: none)")
    const update = () => setTouch(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const magnify = !touch && !reduce
  const buttons = items.filter((i): i is DockButtonItem => !("separator" in i))

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    let next = -1
    // Mirror the arrows in right-to-left layouts so they follow the visual order.
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
    if (e.key === (rtl ? "ArrowLeft" : "ArrowRight")) next = (i + 1) % buttons.length
    else if (e.key === (rtl ? "ArrowRight" : "ArrowLeft")) next = (i - 1 + buttons.length) % buttons.length
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = buttons.length - 1
    if (next < 0) return
    e.preventDefault()
    setFocusIndex(next)
    refs.current[next]?.focus()
  }

  let index = -1
  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      data-slot="dock"
      onPointerMove={(e) => magnify && e.pointerType === "mouse" && mouseX.set(e.clientX)}
      onPointerLeave={() => mouseX.set(Number.POSITIVE_INFINITY)}
      className={cn(
        "pc-dock mx-auto flex w-max max-w-full items-end gap-2 rounded-[22px] px-2 pt-2 pb-3",
        className,
      )}
      style={{ height: size + 20 }}
      {...props}
    >
      <GooduiTokens />
      <style href="pc-dock" precedence="default">
        {CSS}
      </style>
      {items.map((item) => {
        if ("separator" in item) {
          return <span key={item.id} role="separator" aria-orientation="vertical" className="mx-1 w-px self-stretch bg-linear-to-b from-transparent via-foreground/15 to-transparent" />
        }
        index += 1
        const i = index
        return (
          <DockIcon
            key={item.id}
            item={item}
            index={i}
            focusable={i === focusIndex}
            onFocusItem={setFocusIndex}
            mouseX={mouseX}
            size={size}
            magnification={magnification}
            distance={distance}
            magnify={magnify}
            bounce={bounce}
            reduce={reduce}
            tipId={`${uid}-tip-${i}`}
            l={l}
            onKeyDown={onKeyDown}
            refCb={(el) => {
              refs.current[i] = el
            }}
          />
        )
      })}
    </div>
  )
}
