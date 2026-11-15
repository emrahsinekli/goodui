"use client"

import * as React from "react"
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react"
import { cn } from "@/lib/utils"
import { GooduiTokens, spring, follow } from "@/lib/goodui-motion"

export type TooltipSide = "top" | "bottom" | "left" | "right"

type GroupContextValue = {
  delay: number
  /** Opens instantly while another tooltip in the group is open or was closed less than skipDelay ago. */
  isWarm: () => boolean
  onOpen: () => void
  onClose: () => void
}

const GroupContext = React.createContext<GroupContextValue | null>(null)

export type TooltipGroupProps = {
  /** Delay before the first tooltip in the group opens, in ms. */
  delay?: number
  /** How long the group stays "warm" after a tooltip closes, in ms. */
  skipDelay?: number
  children: React.ReactNode
}

/** Shares one open delay across tooltips: after the first opens, moving to a neighbour shows its tooltip at once. */
export function TooltipGroup({ delay = 500, skipDelay = 300, children }: TooltipGroupProps) {
  const openCount = React.useRef(0)
  const warmUntil = React.useRef(0)
  const value = React.useMemo<GroupContextValue>(
    () => ({
      delay,
      isWarm: () => openCount.current > 0 || performance.now() < warmUntil.current,
      onOpen: () => {
        openCount.current += 1
      },
      onClose: () => {
        openCount.current = Math.max(0, openCount.current - 1)
        warmUntil.current = performance.now() + skipDelay
      },
    }),
    [delay, skipDelay],
  )
  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
}

const PLACEMENT: Record<TooltipSide, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 pb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 pt-2",
  left: "right-full top-1/2 -translate-y-1/2 pr-2",
  right: "left-full top-1/2 -translate-y-1/2 pl-2",
}
const ORIGIN: Record<TooltipSide, string> = { top: "50% 100%", bottom: "50% 0%", left: "100% 50%", right: "0% 50%" }
const NUDGE: Record<TooltipSide, { x?: number; y?: number }> = { top: { y: 6 }, bottom: { y: -6 }, left: { x: 6 }, right: { x: -6 } }
const ARROW: Record<TooltipSide, string> = {
  top: "left-1/2 -bottom-1 -translate-x-1/2",
  bottom: "left-1/2 -top-1 -translate-x-1/2",
  left: "top-1/2 -right-1 -translate-y-1/2",
  right: "top-1/2 -left-1 -translate-y-1/2",
}

export type TooltipAnimatedProps = Omit<React.ComponentProps<"span">, "content"> & {
  /** Tooltip text or node. It is also copied into a visually hidden element linked to the trigger with aria-describedby. */
  content: React.ReactNode
  /** Side of the trigger the tooltip appears on. There is no automatic flip. */
  side?: TooltipSide
  /** Open delay in ms. Inside a TooltipGroup the group's delay wins. */
  delay?: number
  /** The tooltip leans and slides toward the pointer (top and bottom sides). Turned off on touch screens. */
  followPointer?: boolean
  /** Never open the tooltip. */
  disabled?: boolean
  /** Classes for the tooltip bubble. */
  contentClassName?: string
  /**
   * The trigger: one focusable element such as a button, so it gets aria-describedby and keyboard focus.
   * Plain text (a string or number) is wrapped in a focusable span that carries aria-describedby.
   */
  children: React.ReactNode
}

/**
 * Tooltip that springs out of the trigger's side. Opens on hover after a delay, at once on keyboard focus,
 * on long-press for touch; Esc or a click hides it. Screen readers get the content through aria-describedby.
 */
export function TooltipAnimated({
  content,
  side = "top",
  delay = 400,
  followPointer = false,
  disabled = false,
  className,
  contentClassName,
  children,
  ...props
}: TooltipAnimatedProps) {
  const reduce = useReducedMotion() ?? false
  const group = React.useContext(GroupContext)
  const id = React.useId()
  const [open, setOpen] = React.useState(false)
  const [instant, setInstant] = React.useState(false)
  const [canHover, setCanHover] = React.useState(true)
  const rootRef = React.useRef<HTMLSpanElement>(null)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const openRef = React.useRef(false)

  const pointerX = useMotionValue(0)
  const x = useSpring(pointerX, follow)
  const rotate = useTransform(x, [-40, 40], [-10, 10])
  const follows = followPointer && canHover && !reduce && (side === "top" || side === "bottom")

  React.useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)")
    const update = () => setCanHover(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const clear = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }

  const show = React.useCallback(
    (now: boolean) => {
      clear()
      if (disabled || openRef.current) return
      const go = (fast: boolean) => {
        openRef.current = true
        setInstant(fast)
        setOpen(true)
        group?.onOpen()
      }
      const warm = group?.isWarm() ?? false
      if (now || warm) go(warm)
      else timer.current = setTimeout(() => go(false), group?.delay ?? delay)
    },
    [disabled, group, delay],
  )

  const hide = React.useCallback(() => {
    clear()
    if (!openRef.current) return
    openRef.current = false
    setOpen(false)
    group?.onClose()
    pointerX.set(0)
  }, [group, pointerX])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && hide()
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, hide])

  React.useEffect(
    () => () => {
      clear()
      if (openRef.current) group?.onClose()
    },
    [group],
  )

  const descId = `${id}-desc`
  const trigger =
    React.isValidElement<{ "aria-describedby"?: string }>(children) && children.type !== React.Fragment ? (
      React.cloneElement(children, {
        "aria-describedby": [children.props["aria-describedby"], descId].filter(Boolean).join(" "),
      })
    ) : (
      // Text or fragments can't take attributes: wrap them so keyboard users can reach the tooltip and it is announced.
      <span tabIndex={0} aria-describedby={descId} className="rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        {children}
      </span>
    )

  const nudge = NUDGE[side]
  const enter = reduce || instant ? { duration: reduce ? 0 : 0.12 } : spring.snap

  return (
    <span
      ref={rootRef}
      className={cn("relative inline-flex", className)}
      onPointerEnter={(e) => e.pointerType !== "touch" && show(false)}
      onPointerLeave={(e) => e.pointerType !== "touch" && hide()}
      onPointerMove={(e) => {
        if (!follows || !rootRef.current) return
        const r = rootRef.current.getBoundingClientRect()
        pointerX.set(Math.max(-40, Math.min(40, (e.clientX - (r.left + r.width / 2)) * 0.5)))
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== "touch") return hide()
        clear()
        timer.current = setTimeout(() => {
          show(true)
          timer.current = setTimeout(hide, 1800)
        }, 450)
      }}
      onPointerUp={(e) => {
        if (e.pointerType === "touch" && !openRef.current) clear()
      }}
      onFocus={(e) => {
        if ((e.target as HTMLElement).matches?.(":focus-visible")) show(true)
      }}
      onBlur={hide}
      {...props}
    >
      <GooduiTokens />
      {trigger}
      <span id={descId} role="tooltip" className="sr-only">
        {content}
      </span>
      <AnimatePresence>
        {open && (
          <span key="tip" aria-hidden="true" className={cn("pointer-events-none absolute z-50", PLACEMENT[side])}>
            <motion.span className="block" style={follows ? { x, rotate } : undefined}>
              <motion.span
                className={cn(
                  "relative block rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-background shadow-[var(--pc-e2)]",
                  contentClassName,
                )}
                style={{ transformOrigin: ORIGIN[side] }}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: instant ? 0.96 : 0.6, ...nudge }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.9, transition: { duration: 0.1 } }}
                transition={enter}
              >
                <span aria-hidden="true" className={cn("absolute size-2 rotate-45 rounded-[2px] bg-inherit", ARROW[side])} />
                <span className="relative">{content}</span>
              </motion.span>
            </motion.span>
          </span>
        )}
      </AnimatePresence>
    </span>
  )
}
