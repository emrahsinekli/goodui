"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { GooduiTokens, ease, spring } from "@/lib/goodui-motion"

type Ctx = {
  open: boolean
  setOpen: (open: boolean) => void
  contentId: string
  triggerId: string
  setTriggerId: (id: string) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  reduce: boolean
}
const ExpandableContext = React.createContext<Ctx | null>(null)

function useExpandable(name: string) {
  const ctx = React.useContext(ExpandableContext)
  if (!ctx) throw new Error(`${name} must be used inside <ExpandableCard>`)
  return ctx
}

export type ExpandableCardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Controlled open state. */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /** Called when the trigger or Esc opens or closes the card. */
  onOpenChange?: (open: boolean) => void
}

/**
 * A card that expands in place: the content grows to its natural height on a spring and fades up, and the card
 * lifts slightly. Esc collapses it while focus is inside. Use with ExpandableCardTrigger and ExpandableCardContent.
 */
export function ExpandableCard({ open, defaultOpen = false, onOpenChange, className, onKeyDown, children, ...props }: ExpandableCardProps) {
  const reduce = useReducedMotion() ?? false
  const [inner, setInner] = React.useState(defaultOpen)
  const isOpen = open ?? inner
  const contentId = React.useId()
  const [triggerId, setTriggerId] = React.useState(`${contentId}-trigger`)
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (open === undefined) setInner(next)
      onOpenChange?.(next)
    },
    [open, onOpenChange],
  )

  return (
    <ExpandableContext.Provider value={{ open: isOpen, setOpen, contentId, triggerId, setTriggerId, triggerRef, reduce }}>
      <GooduiTokens />
      <div
        data-state={isOpen ? "open" : "closed"}
        className={cn(
          "rounded-[14px] bg-card text-card-foreground shadow-[var(--pc-e1)] transition-shadow duration-300 data-[state=open]:shadow-[var(--pc-e2)]",
          className,
        )}
        onKeyDown={(e) => {
          if (e.key === "Escape" && isOpen) {
            e.stopPropagation()
            setOpen(false)
            // The content unmounts, so focus inside it would be lost: return it to the trigger.
            if (triggerRef.current && document.activeElement !== triggerRef.current) triggerRef.current.focus()
          }
          onKeyDown?.(e)
        }}
        {...props}
      >
        {children}
      </div>
    </ExpandableContext.Provider>
  )
}

export type ExpandableCardTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Show the rotating chevron on the right. */
  chevron?: boolean
}

/** The always-visible header; a real button that toggles the card. */
export function ExpandableCardTrigger({ chevron = true, className, children, onClick, id, ...props }: ExpandableCardTriggerProps) {
  const { open, setOpen, contentId, triggerId, setTriggerId, triggerRef, reduce } = useExpandable("ExpandableCardTrigger")
  // A custom id still names the content region (aria-labelledby).
  React.useEffect(() => {
    if (id) setTriggerId(id)
  }, [id, setTriggerId])
  return (
    <button
      ref={triggerRef}
      id={id ?? triggerId}
      type="button"
      aria-expanded={open}
      aria-controls={contentId}
      onClick={(e) => {
        setOpen(!open)
        onClick?.(e)
      }}
      className={cn(
        "pc-press pc-press-soft flex w-full items-center gap-3 rounded-[inherit] p-4 text-start outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    >
      <GooduiTokens />
      <span className="min-w-0 flex-1">{children}</span>
      {chevron && (
        <motion.span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground shadow-[var(--pc-e1)]"
          animate={{ rotate: open ? 180 : 0 }}
          transition={reduce ? { duration: 0 } : spring.morph}
        >
          <ChevronDown className="size-4" />
        </motion.span>
      )}
    </button>
  )
}

export type ExpandableCardContentProps = React.HTMLAttributes<HTMLDivElement>

/** The part that expands. Grows to its natural height (motion height: "auto"), then the inner content fades up. */
export function ExpandableCardContent({ className, children, ...props }: ExpandableCardContentProps) {
  const { open, contentId, triggerId, reduce } = useExpandable("ExpandableCardContent")
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="content"
          id={contentId}
          role="region"
          aria-labelledby={triggerId}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={
            reduce
              ? { duration: 0 }
              : { height: spring.morph, opacity: { duration: 0.14 } }
          }
          className="overflow-hidden"
        >
          <motion.div
            initial={reduce ? false : { y: -6, opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={reduce ? undefined : { y: -4, opacity: 0, filter: "blur(4px)", transition: { duration: 0.14 } }}
            transition={reduce ? { duration: 0 } : { duration: 0.26, delay: 0.06, ease: ease.out }}
            className={cn("px-4 pb-4", className)}
            {...(props as React.ComponentProps<typeof motion.div>)}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
