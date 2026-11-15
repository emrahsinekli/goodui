"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { GooduiTokens, spring as springs } from "@/lib/goodui-motion"

export type ExpandableRowListProps<T> = Omit<React.ComponentProps<"ul">, "children" | "defaultValue"> & {
  /** Rows in display order. Adding or removing items animates the row height in or out. */
  items: T[]
  /** Stable unique key of a row. Any characters are fine: it is escaped before it goes into element ids. */
  getKey: (item: T) => string
  /** The always-visible summary of a row. Keep it free of buttons: the whole row is the toggle. */
  renderRow: (item: T, state: { expanded: boolean }) => React.ReactNode
  /** Details shown when the row opens. `collapse` closes it and returns focus to the row. */
  renderDetails: (item: T, state: { collapse: () => void }) => React.ReactNode
  /** "single" opens one row at a time. */
  type?: "single" | "multiple"
  /** Expanded row keys (controlled). */
  value?: string[]
  /** Row keys open on first render (uncontrolled). */
  defaultValue?: string[]
  /** Called with the new list of open row keys when a row opens or closes. */
  onValueChange?: (value: string[]) => void
  /** Space the open row lifts away from its neighbours, in px. */
  gap?: number
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

/** Turns a row key into a safe id fragment (no spaces or selector characters), keeping distinct keys distinct. */
function idPart(key: string) {
  return key.replace(/[^A-Za-z0-9-]/g, (c) => `_${c.charCodeAt(0).toString(36)}`)
}

/** List whose rows open inline into a lifted card with details, while neighbours make room smoothly. */
export function ExpandableRowList<T>({
  items,
  getKey,
  renderRow,
  renderDetails,
  type = "single",
  value: valueProp,
  defaultValue = [],
  onValueChange,
  gap = 10,
  className,
  ...props
}: ExpandableRowListProps<T>) {
  const reduce = useReducedMotion() ?? false
  const baseId = React.useId()
  const [value, setValue] = useControllable(valueProp, defaultValue, onValueChange)
  const triggers = React.useRef(new Map<string, HTMLButtonElement>())

  const toggle = (key: string) => {
    const open = value.includes(key)
    if (type === "multiple") setValue(open ? value.filter((v) => v !== key) : [...value, key])
    else setValue(open ? [] : [key])
  }
  const collapse = (key: string) => {
    setValue(value.filter((v) => v !== key))
    triggers.current.get(key)?.focus()
  }

  const onTriggerKey = (e: React.KeyboardEvent<HTMLButtonElement>, key: string) => {
    const order = items.map(getKey)
    const i = order.indexOf(key)
    let target: string | undefined
    if (e.key === "ArrowDown") target = order[Math.min(i + 1, order.length - 1)]
    else if (e.key === "ArrowUp") target = order[Math.max(i - 1, 0)]
    else if (e.key === "Home") target = order[0]
    else if (e.key === "End") target = order[order.length - 1]
    if (target) {
      e.preventDefault()
      triggers.current.get(target)?.focus()
    }
  }

  const spring = reduce ? { duration: 0 } : { type: "spring" as const, bounce: 0.12, duration: 0.42 }
  const quick = reduce ? { duration: 0 } : { duration: 0.18 }

  return (
    <ul className={cn("flex w-full flex-col", className)} {...props}>
      <GooduiTokens />
      <AnimatePresence initial={false}>
        {items.map((item) => {
          const key = getKey(item)
          const open = value.includes(key)
          const panelId = `${baseId}-${idPart(key)}-panel`
          const triggerId = `${baseId}-${idPart(key)}-trigger`
          return (
            <motion.li
              key={key}
              data-state={open ? "open" : "closed"}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: open ? gap / 2 : 0, marginBottom: open ? gap / 2 : 0 }}
              exit={{ height: 0, opacity: 0, marginTop: 0, marginBottom: 0, transition: { ...spring, opacity: quick } }}
              transition={spring}
              onKeyDown={(e) => {
                if (e.key === "Escape" && open) {
                  e.stopPropagation()
                  collapse(key)
                }
              }}
              className={cn(
                "overflow-hidden rounded-xl border border-transparent transition-[background-color,box-shadow,border-color] duration-300",
                open ? "border-border bg-card shadow-[var(--pc-e2)] shadow-black/5 dark:shadow-black/30" : "hover:bg-muted/50",
              )}
            >
              <button
                ref={(el) => {
                  if (el) triggers.current.set(key, el)
                  else triggers.current.delete(key)
                }}
                id={triggerId}
                type="button"
                aria-expanded={open}
                aria-controls={open ? panelId : undefined}
                onClick={() => toggle(key)}
                onKeyDown={(e) => onTriggerKey(e, key)}
                className="pc-press pc-press-soft flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
              >
                <div className="min-w-0 flex-1">{renderRow(item, { expanded: open })}</div>
                <motion.span
                  aria-hidden="true"
                  initial={false}
                  animate={{ rotate: open ? 180 : 0 }}
                  transition={reduce ? { duration: 0 } : springs.ui}
                  className="flex size-6 shrink-0 items-center justify-center text-muted-foreground"
                >
                  <ChevronDown className="size-4" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    key="details"
                    id={panelId}
                    role="region"
                    aria-labelledby={triggerId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1, transition: { height: spring, opacity: { ...quick, delay: reduce ? 0 : 0.06 } } }}
                    exit={{ height: 0, opacity: 0, transition: { height: spring, opacity: quick } }}
                  >
                    <motion.div
                      initial={reduce ? false : { y: -6 }}
                      animate={{ y: 0 }}
                      transition={spring}
                      className="border-t px-3 py-3"
                    >
                      {renderDetails(item, { collapse: () => collapse(key) })}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          )
        })}
      </AnimatePresence>
    </ul>
  )
}
