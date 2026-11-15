"use client"

import * as React from "react"
import { AnimatePresence, MotionConfig, motion, useReducedMotion, type Transition } from "motion/react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens } from "@/lib/goodui-motion"

const SPRING: Transition = { type: "spring", bounce: 0.1, duration: 0.38 }
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

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

export type PopoverMorphLabels = { close: string }
const DEFAULT_LABELS: PopoverMorphLabels = { close: "Close" }

export type PopoverMorphProps = Omit<React.ComponentProps<"div">, "children" | "title"> & {
  /** Trigger content; it slides into the panel header when the popover opens. */
  label: React.ReactNode
  /** Header text inside the panel. Defaults to the label. */
  title?: React.ReactNode
  /** Controlled open state. Pair with onOpenChange. */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /** Called with the next state on trigger click, close(), Esc, an outside click or tabbing out. */
  onOpenChange?: (open: boolean) => void
  /** The panel grows down from the trigger, or up for "top". */
  side?: "bottom" | "top"
  /** Preferred edge (logical: start is the left edge in LTR, the right edge in RTL); it flips when the panel would leave the viewport. */
  align?: "start" | "end"
  /** Panel width in px (capped to the viewport). */
  width?: number
  /** Classes for the trigger button. */
  triggerClassName?: string
  /** Classes for the floating panel. */
  panelClassName?: string
  /** Panel body. Pass a function to get close(), e.g. to close after a form submits. */
  children: React.ReactNode | ((api: { close: () => void }) => React.ReactNode)
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<PopoverMorphLabels>
}

/**
 * A button that morphs into a small floating panel (a note, a reminder, a code) and back. Non-modal: outside
 * click, Esc and tabbing away close it. The panel is absolutely positioned inside the wrapper, so give the
 * surrounding container room or `overflow: visible`.
 */
export function PopoverMorph({
  label,
  title,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  side = "bottom",
  align = "start",
  width = 320,
  className,
  triggerClassName,
  panelClassName,
  children,
  labels,
  ...props
}: PopoverMorphProps) {
  const l = useLabels("popover-morph", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange)
  const [resolvedAlign, setResolvedAlign] = React.useState(align)
  const [lifted, setLifted] = React.useState(open)
  const uid = React.useId()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const restoreFocus = React.useRef(true)
  const wasOpen = React.useRef(open)

  const close = React.useCallback(
    (returnFocus = true) => {
      restoreFocus.current = returnFocus
      setOpen(false)
    },
    [setOpen],
  )

  const show = () => {
    const trigger = triggerRef.current
    const rect = trigger?.getBoundingClientRect()
    if (trigger && rect) {
      const w = Math.min(width, window.innerWidth - 32)
      // "start" grows toward the inline end: rightward in LTR, leftward in RTL.
      const rtl = getComputedStyle(trigger).direction === "rtl"
      const fitsRight = rect.left + w <= window.innerWidth - 8
      const fitsLeft = rect.right - w >= 8
      const fitsStart = rtl ? fitsLeft : fitsRight
      const fitsEnd = rtl ? fitsRight : fitsLeft
      if (align === "start") setResolvedAlign(fitsStart ? "start" : "end")
      else setResolvedAlign(fitsEnd ? "end" : "start")
    }
    setOpen(true)
  }

  React.useEffect(() => {
    if (open) {
      setLifted(true)
      const el = panelRef.current
      const first = el?.querySelector<HTMLElement>("[data-autofocus]") ?? el?.querySelector<HTMLElement>(`[data-pc-body] :is(${FOCUSABLE})`)
      first?.focus({ preventScroll: true })
    } else if (wasOpen.current && restoreFocus.current) {
      triggerRef.current?.focus({ preventScroll: true })
    }
    wasOpen.current = open
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        close(true)
      }
    }
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open, close])

  return (
    <MotionConfig transition={reduce ? { duration: 0 } : SPRING}>
      <GooduiTokens />
      <div ref={rootRef} className={cn("relative inline-block", className)} {...props}>
        <motion.button
          ref={triggerRef}
          type="button"
          layoutId={`${uid}-surface`}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? `${uid}-panel` : undefined}
          onClick={show}
          onLayoutAnimationComplete={() => {
            if (!open) setLifted(false)
          }}
          className={cn(
            "pc-press relative inline-flex h-9 items-center border bg-background px-3.5 text-sm font-medium shadow-xs transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4 [&_svg]:shrink-0",
            triggerClassName,
          )}
          style={{ borderRadius: 10, zIndex: lifted ? 40 : undefined }}
        >
          <motion.span layoutId={`${uid}-label`} layout="position" className="inline-flex items-center gap-2 whitespace-nowrap">
            {label}
          </motion.span>
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              ref={panelRef}
              id={`${uid}-panel`}
              layoutId={`${uid}-surface`}
              role="dialog"
              aria-labelledby={`${uid}-title`}
              onBlur={(e) => {
                const next = e.relatedTarget as Node | null
                if (next && !rootRef.current?.contains(next)) close(false)
              }}
              className={cn(
                "absolute z-50 overflow-hidden border bg-popover text-popover-foreground shadow-[var(--pc-e3)]",
                side === "bottom" ? "top-0" : "bottom-0",
                resolvedAlign === "start" ? "start-0" : "end-0",
                panelClassName,
              )}
              style={{ borderRadius: 14, width: `min(${width}px, calc(100vw - 2rem))` }}
            >
              <div className="flex items-center gap-2 py-2 ps-3.5 pe-2">
                <motion.span
                  id={`${uid}-title`}
                  layoutId={`${uid}-label`}
                  layout="position"
                  className="inline-flex min-w-0 flex-1 items-center gap-2 text-sm font-medium whitespace-nowrap [&_svg]:size-4 [&_svg]:shrink-0"
                >
                  {title ?? label}
                </motion.span>
                <motion.button
                  type="button"
                  aria-label={l.close}
                  onClick={() => close(true)}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.08 } }}
                  className="pc-press inline-flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <X className="size-4" />
                </motion.button>
              </div>
              <motion.div
                data-pc-body=""
                initial={{ opacity: 0, y: reduce ? 0 : -4 }}
                animate={{ opacity: 1, y: 0, transition: reduce ? { duration: 0 } : { delay: 0.06, duration: 0.2 } }}
                exit={{ opacity: 0, transition: { duration: reduce ? 0 : 0.06 } }}
                className="px-3.5 pb-3.5"
              >
                {typeof children === "function" ? children({ close: () => close(true) }) : children}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}
