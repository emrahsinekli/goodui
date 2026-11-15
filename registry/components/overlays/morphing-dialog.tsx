"use client"

import * as React from "react"
import { AnimatePresence, MotionConfig, motion, useDragControls, useMotionValue, useReducedMotion, useTransform, type DragControls, type MotionValue, type PanInfo, type Transition } from "motion/react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, ease, spring } from "@/lib/goodui-motion"

const SPRING: Transition = spring.morph
/** Drag-to-dismiss thresholds, the same as vaul: px/s and a fraction of the dialog's height. */
const FLICK_VELOCITY = 400
const CLOSE_FRACTION = 0.25
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

type DialogContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  uid: string
  titleId: string
  descriptionId: string
  triggerRef: React.RefObject<HTMLButtonElement | null>
  /** True from opening until the card has flown back into place, so it stays above its neighbours. */
  lifted: boolean
  setLifted: (lifted: boolean) => void
  /** Whether a MorphingDialogDescription is mounted, so aria-describedby never points at a missing element. */
  hasDescription: boolean
  setHasDescription: (has: boolean) => void
  /** Vertical drag offset of the dialog; the backdrop thins out with it. */
  dragY: MotionValue<number>
  dragControls: DragControls
  reduce: boolean
}

const DialogContext = React.createContext<DialogContextValue | null>(null)
const InContentContext = React.createContext(false)

function useDialog() {
  const ctx = React.useContext(DialogContext)
  if (!ctx) throw new Error("MorphingDialog parts must be used inside <MorphingDialog>")
  return ctx
}

export type MorphingDialogProps = {
  /** Controlled open state. Pair with onOpenChange. */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /** Called with the next state when the trigger, Esc, the backdrop or a close control opens or closes it. */
  onOpenChange?: (open: boolean) => void
  /** Transition for the shared-layout morph. Reduced motion always snaps. */
  transition?: Transition
  children: React.ReactNode
}

/**
 * A card that expands into a dialog. Media, title and subtitle placed in both the trigger and the content
 * travel between the two with a shared-layout animation.
 *
 * The dialog is `position: fixed` without a portal, so keep it out of ancestors that set `transform`/`filter`.
 * For the morph to keep rounded corners, set the radius with `style={{ borderRadius }}` instead of a class.
 */
export function MorphingDialog({ open: openProp, defaultOpen = false, onOpenChange, transition, children }: MorphingDialogProps) {
  const reduce = useReducedMotion() ?? false
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange)
  const [lifted, setLifted] = React.useState(open)
  const [hasDescription, setHasDescription] = React.useState(false)
  const uid = React.useId()
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)
  const wasOpen = React.useRef(open)
  const dragY = useMotionValue(0)
  const dragControls = useDragControls()

  React.useEffect(() => {
    if (open) setLifted(true)
    if (!open && wasOpen.current) triggerRef.current?.focus({ preventScroll: true })
    wasOpen.current = open
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        setOpen(false)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener("keydown", onKey)
    }
  }, [open, setOpen])

  const value = React.useMemo(
    () => ({ open, setOpen, uid, titleId: `${uid}-title`, descriptionId: `${uid}-desc`, triggerRef, lifted, setLifted, hasDescription, setHasDescription, dragY, dragControls, reduce }),
    [open, setOpen, uid, lifted, hasDescription, dragY, dragControls, reduce],
  )

  return (
    <DialogContext.Provider value={value}>
      <GooduiTokens />
      <MotionConfig transition={reduce ? { duration: 0 } : (transition ?? SPRING)}>{children}</MotionConfig>
    </DialogContext.Provider>
  )
}

export type MorphingDialogTriggerProps = Omit<React.ComponentProps<typeof motion.button>, "ref">

/** The collapsed card. A real button: Enter or Space opens the dialog. */
export function MorphingDialogTrigger({ className, style, children, onClick, ...props }: MorphingDialogTriggerProps) {
  const { open, setOpen, uid, triggerRef, lifted, setLifted } = useDialog()
  return (
    <motion.button
      ref={triggerRef}
      type="button"
      layoutId={`${uid}-card`}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented) setOpen(true)
      }}
      onLayoutAnimationComplete={() => {
        if (!open) setLifted(false)
      }}
      className={cn(
        "pc-press pc-press-soft relative block w-full cursor-pointer overflow-hidden bg-card text-start text-card-foreground shadow-[var(--pc-e1)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      style={{ borderRadius: 16, zIndex: lifted ? 40 : undefined, ...style }}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export type MorphingDialogContainerProps = {
  /** Classes for the fixed layer that centers the dialog (padding, alignment). */
  className?: string
  /** Classes for the backdrop. */
  backdropClassName?: string
  children: React.ReactNode
}

/** Backdrop and centering layer. Clicking the backdrop closes the dialog. */
export function MorphingDialogContainer({ className, backdropClassName, children }: MorphingDialogContainerProps) {
  const { open, setOpen, dragY } = useDialog()
  const fade = useTransform(dragY, [0, 320], [1, 0.35])
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div key="pc-morphing-dialog" className={cn("fixed inset-0 z-50 grid place-items-center p-4 sm:p-6", className)}>
          <motion.div style={{ opacity: fade }} className="absolute inset-0">
            <motion.div
              aria-hidden="true"
              className={cn("absolute inset-0 bg-black/30 dark:bg-black/55", backdropClassName)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />
          </motion.div>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export type MorphingDialogContentProps = Omit<React.ComponentProps<typeof motion.div>, "ref"> & {
  /** Drag the media or the grip down to close, with a flick or past a quarter of the height. Off with reduced motion. */
  dragToDismiss?: boolean
}

/** The expanded dialog. Focus moves inside and is trapped until it closes. */
export function MorphingDialogContent({ className, style, children, onKeyDown, dragToDismiss = true, ...props }: MorphingDialogContentProps) {
  const { uid, titleId, descriptionId, hasDescription, setOpen, dragY, dragControls, reduce } = useDialog()
  const ref = React.useRef<HTMLDivElement>(null)
  const drag = dragToDismiss && !reduce
  const lean = useTransform(dragY, [0, 400], [1, 0.94])

  // Reset here, not on release: the morph home starts from where the finger left it.
  React.useEffect(() => () => dragY.jump(0), [dragY])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const height = ref.current?.offsetHeight ?? 400
    if (info.velocity.y > FLICK_VELOCITY || info.offset.y > height * CLOSE_FRACTION) setOpen(false)
  }

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const first = el.querySelector<HTMLElement>("[data-autofocus]") ?? el.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? el).focus({ preventScroll: true })
  }, [])

  const trap = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.key !== "Tab" || !ref.current) return
    const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (!items.length) return e.preventDefault()
    const first = items[0]!
    const last = items[items.length - 1]!
    const active = document.activeElement
    if (e.shiftKey && (active === first || active === ref.current)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <InContentContext.Provider value={true}>
      <GooduiTokens />
      <motion.div
        ref={ref}
        layoutId={`${uid}-card`}
        drag={drag ? "y" : false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.04, bottom: 0.65 }}
        dragMomentum={false}
        dragTransition={{ bounceStiffness: 500, bounceDamping: 40 }}
        onDragEnd={onDragEnd}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={hasDescription ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={trap}
        className={cn(
          "relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden bg-card text-card-foreground shadow-[var(--pc-e3)] outline-none",
          className,
        )}
        style={{ borderRadius: 24, y: dragY, scale: lean, ...style }}
        {...props}
      >
        {drag && (
          <span
            aria-hidden="true"
            onPointerDown={(e) => dragControls.start(e)}
            className="absolute inset-x-0 top-0 z-[5] flex h-6 cursor-grab touch-none justify-center pt-2 active:cursor-grabbing"
          >
            <span className="h-1 w-9 rounded-full bg-black/25 dark:bg-white/30" />
          </span>
        )}
        {children as React.ReactNode}
      </motion.div>
    </InContentContext.Provider>
  )
}

export type MorphingDialogPartProps = Omit<React.ComponentProps<typeof motion.div>, "ref" | "layoutId">

/** Image or illustration area. Put the same media in the trigger and the content. */
export function MorphingDialogMedia({ className, onPointerDown, ...props }: MorphingDialogPartProps) {
  const { uid, dragControls, reduce } = useDialog()
  const inContent = React.useContext(InContentContext)
  return (
    <motion.div
      layoutId={`${uid}-media`}
      className={cn("relative block overflow-hidden", inContent && !reduce && "cursor-grab touch-none select-none active:cursor-grabbing", className)}
      onPointerDown={(e) => {
        onPointerDown?.(e)
        if (inContent && !reduce) dragControls.start(e)
      }}
      {...props}
    />
  )
}

/** Title; it becomes the dialog's accessible name inside the content. */
export function MorphingDialogTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  const { uid, titleId } = useDialog()
  const inContent = React.useContext(InContentContext)
  const shared = { layoutId: `${uid}-title`, layout: "position" as const }
  return inContent ? (
    <motion.h2 id={titleId} {...shared} className={cn("text-lg font-semibold tracking-tight", className)}>
      {children}
    </motion.h2>
  ) : (
    <motion.span {...shared} className={cn("block font-semibold tracking-tight", className)}>
      {children}
    </motion.span>
  )
}

export function MorphingDialogSubtitle({ className, children }: { className?: string; children: React.ReactNode }) {
  const { uid } = useDialog()
  return (
    <motion.span layoutId={`${uid}-subtitle`} layout="position" className={cn("block text-sm text-muted-foreground", className)}>
      {children}
    </motion.span>
  )
}

/** Content that only exists in the open dialog. It fades up once the card has started to grow. */
export function MorphingDialogDescription({ className, children, ...props }: MorphingDialogPartProps) {
  const { descriptionId, setHasDescription, reduce } = useDialog()
  React.useEffect(() => {
    setHasDescription(true)
    return () => setHasDescription(false)
  }, [setHasDescription])
  return (
    <motion.div
      id={descriptionId}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: reduce ? { duration: 0 } : { delay: 0.1, duration: 0.28, ease: ease.out } }}
      exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, filter: "blur(4px)", transition: { duration: 0.1 } }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export type MorphingDialogLabels = { close: string }
const DEFAULT_LABELS: MorphingDialogLabels = { close: "Close" }

export type MorphingDialogCloseProps = React.ComponentProps<"button"> & {
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<MorphingDialogLabels>
}

export function MorphingDialogClose({ className, children, onClick, labels, ...props }: MorphingDialogCloseProps) {
  const { setOpen } = useDialog()
  const l = useLabels("morphing-dialog", DEFAULT_LABELS, labels)
  return (
    <button
      type="button"
      aria-label={children ? undefined : l.close}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented) setOpen(false)
      }}
      className={cn(
        "pc-press absolute end-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-full bg-background/80 text-foreground shadow-[var(--pc-e1)] backdrop-blur transition-colors outline-none hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4",
        className,
      )}
      {...props}
    >
      <GooduiTokens />
      {children ?? <X />}
    </button>
  )
}
