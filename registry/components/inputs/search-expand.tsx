"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Clock, CornerDownLeft, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring as springs } from "@/lib/goodui-motion"

export type SearchExpandLabels = { search: string; open: string; clear: string; recent: string; matching: string; clearRecent: string }
const DEFAULT_LABELS: SearchExpandLabels = {
  search: "Search",
  open: "Open search",
  clear: "Clear search",
  recent: "Recent searches",
  matching: "Matching recent",
  clearRecent: "Clear",
}

export type SearchExpandProps = Omit<React.ComponentProps<"div">, "onSubmit" | "defaultValue"> & {
  /** Controlled query text; pair with onValueChange. */
  value?: string
  /** Initial query when uncontrolled. */
  defaultValue?: string
  /** Called on every keystroke, on clear and when a recent search fills the field. */
  onValueChange?: (value: string) => void
  /** Called with the trimmed query on Enter (never with an empty string). */
  onSubmit?: (query: string) => void
  /** Controlled open state; pair with onOpenChange. */
  open?: boolean
  /** Start expanded when uncontrolled. */
  defaultOpen?: boolean
  /** Called when the field expands or folds back. */
  onOpenChange?: (open: boolean) => void
  /** Shown in a dropdown while the field is focused; filtered by what is typed. */
  recent?: string[]
  /** Defaults to filling the field and submitting. */
  onRecentSelect?: (query: string) => void
  /** Shows a "Clear" button in the dropdown header when set. */
  onClearRecent?: () => void
  /** Placeholder text; also used as the input's aria-label. */
  placeholder?: string
  /** Width in px when open (it never exceeds the parent). */
  expandedWidth?: number
  /** Global key that opens the search; `null` to disable. */
  shortcut?: string | null
  /** Which edge the dropdown aligns to; use "end" when the search sits on the right. */
  align?: "start" | "end"
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<SearchExpandLabels>
}

const isEditable = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")

/** Icon button that springs open into a search field with recent searches; Esc or blur closes it when empty. */
export function SearchExpand({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSubmit,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  recent = [],
  onRecentSelect,
  onClearRecent,
  placeholder = "Search…",
  expandedWidth = 280,
  shortcut = "/",
  align = "start",
  labels,
  className,
  ...props
}: SearchExpandProps) {
  const l = useLabels("search-expand", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const [innerValue, setInnerValue] = React.useState(defaultValue)
  const value = valueProp ?? innerValue
  const [innerOpen, setInnerOpen] = React.useState(defaultOpen)
  const open = openProp ?? innerOpen
  const [focused, setFocused] = React.useState(false)
  const [activeIdx, setActiveIdx] = React.useState(-1)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const uid = React.useId()
  const listId = `${uid}-recent`

  const setValue = (v: string) => {
    if (valueProp === undefined) setInnerValue(v)
    onValueChange?.(v)
  }
  const setOpen = (o: boolean) => {
    if (openProp === undefined) setInnerOpen(o)
    onOpenChange?.(o)
  }
  const openAndFocus = () => {
    setOpen(true)
    // The input is always mounted, so it can take focus in the same tick (keeps mobile keyboards happy).
    inputRef.current?.focus()
  }
  const close = (refocus: boolean) => {
    setOpen(false)
    setActiveIdx(-1)
    if (refocus) requestAnimationFrame(() => triggerRef.current?.focus())
  }

  // The global listener reads the latest openAndFocus (and so the latest onOpenChange) through a ref.
  const openRef = React.useRef(openAndFocus)
  React.useLayoutEffect(() => {
    openRef.current = openAndFocus
  })
  React.useEffect(() => {
    if (!shortcut) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== shortcut || e.metaKey || e.ctrlKey || e.altKey || isEditable(e.target)) return
      e.preventDefault()
      openRef.current()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [shortcut])

  const q = value.trim().toLowerCase()
  const items = recent.filter((r) => !q || (r.toLowerCase().includes(q) && r.toLowerCase() !== q)).slice(0, 6)
  const showList = open && focused && items.length > 0

  const submit = (query: string) => {
    const v = query.trim()
    if (!v) return
    onSubmit?.(v)
    setActiveIdx(-1)
  }

  const pick = (r: string) => {
    if (onRecentSelect) onRecentSelect(r)
    else {
      setValue(r)
      submit(r)
    }
    setActiveIdx(-1)
  }

  const spring = reduce ? { duration: 0 } : springs.ui

  return (
    <div
      ref={rootRef}
      className={cn("relative inline-flex max-w-full", className)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (rootRef.current?.contains(e.relatedTarget as Node)) return
        setFocused(false)
        setActiveIdx(-1)
        if (!value.trim()) close(false)
      }}
      {...props}
    >
      <GooduiTokens />
      <motion.div
        role="search"
        className={cn(
          "relative flex h-9 max-w-full items-center overflow-hidden rounded-full border bg-background shadow-xs transition-[border-color,box-shadow,background-color] dark:bg-input/30",
          open ? "border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50" : "border-transparent bg-transparent shadow-none hover:bg-muted dark:bg-transparent",
        )}
        initial={false}
        animate={{ width: open ? expandedWidth : 36 }}
        transition={spring}
      >
        <button
          ref={triggerRef}
          type="button"
          aria-label={open ? l.search : l.open}
          aria-expanded={open}
          tabIndex={open ? -1 : 0}
          onClick={() => (open ? inputRef.current?.focus() : openAndFocus())}
          className="pc-press grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <motion.span className="grid place-items-center" initial={false} animate={{ scale: open ? 0.9 : 1 }} transition={spring}>
            <Search className={cn("size-4 transition-colors", !open && "text-foreground")} />
          </motion.span>
        </button>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-label={placeholder}
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList && activeIdx >= 0 ? `${listId}-${activeIdx}` : undefined}
          aria-hidden={!open || undefined}
          tabIndex={open ? 0 : -1}
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            setValue(e.target.value)
            setActiveIdx(-1)
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault()
              if (showList && activeIdx >= 0) setActiveIdx(-1)
              else if (value) setValue("")
              else close(true)
            } else if (e.key === "ArrowDown" && items.length) {
              e.preventDefault()
              setActiveIdx((i) => (i + 1) % items.length)
            } else if (e.key === "ArrowUp" && items.length) {
              e.preventDefault()
              setActiveIdx((i) => (i <= 0 ? items.length - 1 : i - 1))
            } else if (e.key === "Enter") {
              e.preventDefault()
              const hit = showList ? items[activeIdx] : undefined
              if (hit !== undefined) pick(hit)
              else submit(value)
            }
          }}
          className={cn(
            "h-full min-w-0 flex-1 bg-transparent pe-2 text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden",
            "transition-opacity duration-150",
            open ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        />
        <AnimatePresence initial={false} mode="popLayout">
          {open && (value ? (
            <motion.button
              key="clear"
              type="button"
              aria-label={l.clear}
              onClick={() => {
                setValue("")
                inputRef.current?.focus()
              }}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
              transition={{ duration: reduce ? 0.1 : 0.15 }}
              className="pc-press me-1.5 grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <X className="size-3.5" />
            </motion.button>
          ) : shortcut ? (
            <motion.kbd
              key="kbd"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: reduce ? 0 : 0.12 } }}
              exit={{ opacity: 0 }}
              className="me-2 hidden h-5 shrink-0 items-center rounded border bg-muted px-1.5 font-mono text-[10px] text-foreground/80 sm:inline-flex"
            >
              {shortcut}
            </motion.kbd>
          ) : null)}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showList && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.12 } }}
            transition={springs.snap}
            style={{ width: expandedWidth }}
            className={cn(
              "absolute top-full z-30 mt-2 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-[var(--pc-e2)]",
              align === "end" ? "end-0 origin-top-right rtl:origin-top-left" : "start-0 origin-top-left rtl:origin-top-right",
            )}
          >
            <div className="flex items-center justify-between px-2 pt-1 pb-1.5">
              <span className="text-xs font-medium text-muted-foreground">{q ? l.matching : l.recent}</span>
              {onClearRecent && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={onClearRecent}
                  className="pc-press rounded px-1 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {l.clearRecent}
                </button>
              )}
            </div>
            <ul id={listId} role="listbox" aria-label={l.recent}>
              {items.map((r, i) => (
                <li
                  key={r}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === activeIdx}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => pick(r)}
                  className="relative flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
                >
                  {i === activeIdx && (
                    <motion.span layoutId={`${uid}-hl`} className="absolute inset-0 rounded-lg bg-muted" transition={reduce ? { duration: 0 } : springs.snap} />
                  )}
                  <Clock className="relative size-3.5 shrink-0 text-muted-foreground" />
                  <span className="relative flex-1 truncate">{r}</span>
                  {i === activeIdx && <CornerDownLeft className="relative size-3.5 text-muted-foreground" />}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
