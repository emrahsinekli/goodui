"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

export type AccordionHeightItem = {
  /** Unique id of the item; this is what `value` and `onValueChange` hold. */
  value: string
  /** Header text, rendered inside the trigger button. */
  title: React.ReactNode
  /** Optional second line under the title. */
  description?: React.ReactNode
  /** Icon shown in a tile before the title. */
  icon?: React.ReactNode
  /** Panel body, mounted only while the item is open. */
  content: React.ReactNode
  /** Disables the trigger and skips it in arrow-key navigation. */
  disabled?: boolean
}

export type AccordionHeightProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  /** The sections, in order. */
  items: AccordionHeightItem[]
  /** "single" keeps one item open at a time, "multiple" lets any number stay open. */
  type?: "single" | "multiple"
  /** Open item values (controlled). */
  value?: string[]
  /** Item values open on first render (uncontrolled). */
  defaultValue?: string[]
  /** Called with the new list of open item values whenever an item opens or closes. */
  onValueChange?: (value: string[]) => void
  /** In single mode, clicking the open item closes it. */
  collapsible?: boolean
  /** "bordered": one card with dividers. "separated": a card per item. "ghost": dividers only. */
  variant?: "bordered" | "separated" | "ghost"
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

/** Accordion whose panels open to their natural height with a spring, never a fixed max-height hack. */
export function AccordionHeight({
  items,
  type = "single",
  value: valueProp,
  defaultValue = [],
  onValueChange,
  collapsible = true,
  variant = "bordered",
  className,
  ...props
}: AccordionHeightProps) {
  const reduce = useReducedMotion() ?? false
  const baseId = React.useId()
  const [value, setValue] = useControllable(valueProp, defaultValue, onValueChange)
  const triggers = React.useRef<(HTMLButtonElement | null)[]>([])

  const toggle = (v: string) => {
    const isOpen = value.includes(v)
    if (type === "multiple") setValue(isOpen ? value.filter((x) => x !== v) : [...value, v])
    else setValue(isOpen ? (collapsible ? [] : value) : [v])
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const enabled = triggers.current.filter((el): el is HTMLButtonElement => !!el && !el.disabled)
    const i = enabled.indexOf(e.currentTarget)
    let next: HTMLButtonElement | undefined
    if (e.key === "ArrowDown") next = enabled[(i + 1) % enabled.length]
    else if (e.key === "ArrowUp") next = enabled[(i - 1 + enabled.length) % enabled.length]
    else if (e.key === "Home") next = enabled[0]
    else if (e.key === "End") next = enabled[enabled.length - 1]
    if (next) {
      e.preventDefault()
      next.focus()
    }
  }

  const height = reduce ? { duration: 0 } : { type: "spring" as const, bounce: 0, duration: 0.38 }
  const fade = reduce ? { duration: 0 } : { duration: 0.22 }
  const rotate = reduce ? { duration: 0 } : spring.ui

  return (
    <div
      data-slot="accordion"
      className={cn(
        "w-full text-sm",
        variant === "bordered" && "divide-y rounded-xl border bg-card text-card-foreground",
        variant === "separated" && "flex flex-col gap-2",
        variant === "ghost" && "divide-y",
        className,
      )}
      {...props}
    >
      <GooduiTokens />
      {items.map((item, i) => {
        const open = value.includes(item.value)
        const triggerId = `${baseId}-trigger-${i}`
        const panelId = `${baseId}-panel-${i}`
        const last = i === items.length - 1
        return (
          <div
            key={item.value}
            data-state={open ? "open" : "closed"}
            className={cn(
              variant === "separated" &&
                "rounded-xl border bg-card text-card-foreground transition-shadow duration-300 data-[state=open]:shadow-[var(--pc-e2)] data-[state=open]:shadow-black/5",
            )}
          >
            <h3 className="m-0 flex text-sm">
              <button
                ref={(el) => {
                  triggers.current[i] = el
                }}
                id={triggerId}
                type="button"
                aria-expanded={open}
                // Only point at the panel while it is mounted; a closed panel is removed from the DOM.
                aria-controls={open ? panelId : undefined}
                disabled={item.disabled}
                onClick={() => toggle(item.value)}
                onKeyDown={onKeyDown}
                className={cn(
                  "pc-press pc-press-soft flex w-full items-center gap-3 px-4 py-3.5 text-start font-medium transition-colors outline-none hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
                  variant === "ghost" && "px-1 hover:bg-transparent hover:text-foreground/80",
                  variant === "separated" && "rounded-xl",
                  variant === "bordered" && i === 0 && "rounded-t-xl",
                  variant === "bordered" && last && !open && "rounded-b-xl",
                )}
              >
                {item.icon && (
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors duration-300 [&_svg]:size-4",
                      open && "bg-primary text-primary-foreground",
                    )}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                )}
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate">{item.title}</span>
                  {item.description && (
                    <span className="truncate text-xs font-normal text-muted-foreground">{item.description}</span>
                  )}
                </span>
                <motion.span
                  aria-hidden="true"
                  className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground"
                  initial={false}
                  animate={{ rotate: open ? 180 : 0 }}
                  transition={rotate}
                >
                  <ChevronDown className="size-4" />
                </motion.span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  key="panel"
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  className="overflow-hidden"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1, transition: { height, opacity: fade } }}
                  exit={{ height: 0, opacity: 0, transition: { height, opacity: { ...fade, duration: reduce ? 0 : 0.16 } } }}
                >
                  <motion.div
                    className={cn(
                      "pb-4 text-muted-foreground",
                      variant === "ghost" ? "px-1" : "px-4",
                      item.icon && variant !== "ghost" && "sm:ps-15",
                    )}
                    initial={reduce ? false : { y: -8 }}
                    animate={{ y: 0 }}
                    exit={reduce ? undefined : { y: -6 }}
                    transition={reduce ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.38 }}
                  >
                    {item.content}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
