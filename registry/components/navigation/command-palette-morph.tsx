"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react"
import { CornerDownLeft, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring as springs } from "@/lib/goodui-motion"

export type CommandPaletteItem = {
  /** Unique key of the item. */
  id: string
  /** Text that is shown, fuzzy-matched and highlighted. */
  label: string
  /** Group heading the item is listed under. */
  group?: string
  /** Icon component (e.g. a lucide icon) shown before the label. */
  icon?: React.ComponentType<{ className?: string }>
  /** Secondary text on the right, e.g. "Client" or "Overdue · $240". */
  hint?: string
  /** Keys shown on the right, e.g. ["G", "C"]. Display only. */
  shortcut?: string[]
  /** Extra words that should match, e.g. an email or invoice number. */
  keywords?: string[]
  /** Runs when this item is chosen (click or Enter); the palette then closes. */
  onSelect?: () => void
  /** Shown in the pane beside the list while this item is active. Giving any item a preview turns the pane on. */
  preview?: React.ReactNode
}

export type CommandPaletteMorphLabels = {
  dialog: string
  results: string
  close: string
  navigate: string
  select: string
  resultCount: (count: number) => string
  /** Heading of the default empty state. */
  noResults: string
  /** Line under it, with the current query. */
  noMatch: (query: string) => string
}
const DEFAULT_LABELS: CommandPaletteMorphLabels = {
  dialog: "Command palette",
  results: "Results",
  close: "Esc",
  navigate: "navigate",
  select: "select",
  resultCount: (count) => `${count} ${count === 1 ? "result" : "results"}`,
  noResults: "No results",
  noMatch: (query) => `Nothing matches “${query}”.`,
}

export type CommandPaletteMorphProps = Omit<React.ComponentProps<"button">, "onSelect" | "children"> & {
  /** Everything the palette can find; items are listed in this order (grouped by group) until the user types. */
  items: CommandPaletteItem[]
  /** Whether the palette is open (controlled). */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /** Called when the palette opens or closes (trigger, hotkey, Esc, backdrop or a selection). */
  onOpenChange?: (open: boolean) => void
  /** Called with the chosen item, after the item's own onSelect. */
  onSelect?: (item: CommandPaletteItem) => void
  /** Placeholder of the search input inside the palette. */
  placeholder?: string
  /** Text on the field trigger. */
  triggerLabel?: string
  /** `field` looks like a search input; `icon` is a round icon button. */
  variant?: "field" | "icon"
  /** Open and close with Ctrl+K / Cmd+K. Enable it on one palette per page. */
  hotkey?: boolean
  /** Shown when nothing matches; defaults to "No results" with the query. */
  emptyMessage?: React.ReactNode
  /**
   * Raycast-style pane beside the list, from 640px up. On by default when an item has a `preview`; items without one
   * show their icon, label and hint.
   */
  showPreview?: boolean
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<CommandPaletteMorphLabels>
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

const BOUNDARY = /[\s\-_/.·#@]/

/** Subsequence match with bonuses for word starts and consecutive letters. Returns null when it does not match. */
function fuzzy(query: string, text: string): { score: number; indices: number[] } | null {
  const q = query.trim().toLowerCase()
  const t = text.toLowerCase()
  if (!q) return { score: 0, indices: [] }
  const sub = t.indexOf(q)
  if (sub >= 0) {
    const atWord = sub === 0 || BOUNDARY.test(t[sub - 1]!)
    return { score: 100 + (atWord ? 40 : 0) - sub - t.length * 0.05, indices: Array.from({ length: q.length }, (_, k) => sub + k) }
  }
  let from = 0
  let prev = -2
  let score = 0
  const indices: number[] = []
  for (const ch of q) {
    if (ch === " ") continue
    const at = t.indexOf(ch, from)
    if (at < 0) return null
    score += at === prev + 1 ? 6 : at === 0 || BOUNDARY.test(t[at - 1]!) ? 4 : 1
    score -= Math.min(at - from, 6) * 0.25
    indices.push(at)
    prev = at
    from = at + 1
  }
  return { score, indices }
}

function Highlight({ text, indices }: { text: string; indices: number[] }) {
  if (!indices.length) return <>{text}</>
  const set = new Set(indices)
  return (
    <>
      {[...text].map((ch, i) =>
        set.has(i) ? (
          <span key={i} className="font-semibold text-foreground underline decoration-primary/40 underline-offset-[3px]">
            {ch}
          </span>
        ) : (
          <span key={i}>{ch}</span>
        ),
      )}
    </>
  )
}

function DefaultPreview({ item }: { item: CommandPaletteItem }) {
  const Icon = item.icon
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
      {Icon && (
        <span className="grid size-12 place-items-center rounded-xl bg-muted shadow-[var(--pc-e1)]">
          <Icon className="size-5 text-muted-foreground" />
        </span>
      )}
      <div className="text-sm font-medium">{item.label}</div>
      {item.hint && <div className="text-xs text-muted-foreground">{item.hint}</div>}
    </div>
  )
}

/**
 * A search field (or icon button) that morphs into a command palette through a shared layout animation.
 * Fuzzy filtering with highlighted matches, grouped results, arrow keys + Enter, Esc closes, Ctrl/Cmd+K opens.
 * A click morphs; the keyboard opens it instantly. The list height follows the results, and items can carry a preview.
 * Uses `position: fixed` without a portal, so keep it out of transformed ancestors.
 */
export function CommandPaletteMorph({
  items,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  onSelect,
  placeholder = "Search or type a command…",
  triggerLabel = "Search…",
  variant = "field",
  hotkey = true,
  emptyMessage,
  showPreview,
  labels,
  className,
  ...props
}: CommandPaletteMorphProps) {
  const l = useLabels("command-palette-morph", DEFAULT_LABELS, labels)
  const uid = React.useId()
  const reduce = useReducedMotion() ?? false
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange)
  const [query, setQuery] = React.useState("")
  const [active, setActive] = React.useState(0)
  const [mod, setMod] = React.useState("⌘")
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const keyboardNav = React.useRef(false)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [listHeight, setListHeight] = React.useState<number | null>(null)
  // Opened from the keyboard: no animation at all, a frequent action stays quiet. A click gets the morph.
  const [instant, setInstant] = React.useState(false)
  const quiet = reduce || instant
  const preview = showPreview ?? items.some((i) => i.preview != null)

  const spring: Transition = quiet ? { duration: 0 } : springs.morph
  const radius = variant === "icon" ? 18 : 8

  // Grouped, scored results.
  const groups = React.useMemo(() => {
    const scored = items
      .map((item, order) => {
        const m = fuzzy(query, item.label)
        if (m) return { item, order, ...m }
        const k = (item.keywords ?? []).map((w) => fuzzy(query, w)).find(Boolean)
        return k ? { item, order, score: k.score - 10, indices: [] as number[] } : null
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
    if (query.trim()) scored.sort((a, b) => b.score - a.score || a.order - b.order)
    const map = new Map<string, typeof scored>()
    for (const s of scored) {
      const g = s.item.group ?? ""
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(s)
    }
    return [...map.entries()].map(([name, list]) => ({ name, list }))
  }, [items, query])
  const flat = React.useMemo(() => groups.flatMap((g) => g.list), [groups])
  const count = flat.length

  const close = React.useCallback(() => setOpen(false), [setOpen])

  // Hotkey, platform label.
  React.useEffect(() => {
    if (!/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) setMod("Ctrl")
    if (!hotkey) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setInstant(true)
        setOpen(!open)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [hotkey, open, setOpen])

  // Reset on open, lock page scroll, return focus on close.
  const wasOpen = React.useRef(open)
  React.useEffect(() => {
    if (open) {
      setQuery("")
      setActive(0)
      const prev = document.body.style.overflow
      document.body.style.overflow = "hidden"
      const t = window.setTimeout(() => inputRef.current?.focus(), 0)
      wasOpen.current = true
      return () => {
        window.clearTimeout(t)
        document.body.style.overflow = prev
      }
    }
    if (wasOpen.current) {
      wasOpen.current = false
      triggerRef.current?.focus()
    }
  }, [open])

  // The list is as tall as its results, up to the cap, and the whole palette follows.
  React.useLayoutEffect(() => {
    const el = contentRef.current
    if (!open || !el) {
      setListHeight(null)
      return
    }
    const measure = () => setListHeight(Math.min(el.offsetHeight + 16, 320))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [open])

  // Keep the active option in view when moving with the keyboard.
  React.useEffect(() => {
    if (!open || !keyboardNav.current) return
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" })
  }, [active, open])

  const choose = (item: CommandPaletteItem | undefined) => {
    if (!item) return
    item.onSelect?.()
    onSelect?.(item)
    close()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      close()
    } else if (e.key === "Tab") {
      // Focus trap: the input is the only tab stop inside the dialog.
      e.preventDefault()
      inputRef.current?.focus()
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      if (!count) return
      keyboardNav.current = true
      setActive((a) => (e.key === "ArrowDown" ? (a + 1) % count : (a - 1 + count) % count))
    } else if (e.key === "Enter") {
      e.preventDefault()
      choose(flat[active]?.item)
    }
  }

  const optionId = (i: number) => `${uid}-opt-${i}`
  let index = -1

  return (
    <>
      <GooduiTokens />
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={variant === "icon" ? triggerLabel : undefined}
        onClick={(e) => {
          setInstant(e.detail === 0)
          setOpen(true)
        }}
        className={cn(
          "pc-press pc-press-soft group relative inline-flex shrink-0 cursor-pointer items-center text-sm text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          variant === "field" ? "h-9 w-full max-w-72 gap-2 rounded-lg px-3" : "size-9 justify-center rounded-full",
          className,
        )}
        {...props}
      >
        {!open && (
          <motion.span
            layoutId={`${uid}-shell`}
            aria-hidden="true"
            className="absolute inset-0 bg-background shadow-[var(--pc-e1)] transition-colors group-hover:bg-muted/60 dark:bg-input/30 dark:group-hover:bg-input/50"
            style={{ borderRadius: radius }}
            transition={spring}
          />
        )}
        {!open ? (
          <motion.span layoutId={`${uid}-icon`} className="relative flex" transition={spring}>
            <Search className="size-4" />
          </motion.span>
        ) : (
          <span className="size-4" />
        )}
        {variant === "field" && (
          <>
            <span className={cn("relative flex-1 truncate text-start transition-opacity", open && "opacity-0")}>{triggerLabel}</span>
            {hotkey && (
              <kbd
                className={cn(
                  "relative hidden h-5 items-center rounded-[5px] bg-background px-1.5 font-sans text-[10px] font-medium text-foreground/70 shadow-[0_0_0_1px_var(--pc-hair),0_1px_0_1px_var(--pc-hair)] transition-opacity sm:inline-flex",
                  open && "opacity-0",
                )}
              >
                {mod === "⌘" ? "⌘K" : "Ctrl K"}
              </kbd>
            )}
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <div key="palette" className="fixed inset-0 z-50 flex items-start justify-center p-3 pt-[10vh] sm:p-6 sm:pt-[12vh]">
            <motion.div
              aria-hidden="true"
              className="absolute inset-0 bg-black/30 dark:bg-black/55"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: quiet ? 0 : 0.2 }}
              onClick={close}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label={l.dialog}
              className={cn("relative w-full max-w-xl text-popover-foreground", preview && "sm:max-w-3xl")}
              onKeyDown={onKeyDown}
            >
              <motion.div
                layoutId={`${uid}-shell`}
                aria-hidden="true"
                className="absolute inset-0 bg-popover shadow-[var(--pc-e3)]"
                style={{ borderRadius: 14 }}
                transition={spring}
              />
              <div className="relative flex h-14 items-center gap-3 border-b border-[var(--pc-hair)] px-4">
                <motion.span layoutId={`${uid}-icon`} className="flex text-muted-foreground" transition={spring}>
                  <Search className="size-4" />
                </motion.span>
                <motion.div
                  className="flex flex-1 items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: quiet ? 0 : 0.08, duration: quiet ? 0 : 0.15 } }}
                  exit={{ opacity: 0, transition: { duration: quiet ? 0 : 0.08 } }}
                >
                  <input
                    ref={inputRef}
                    role="combobox"
                    aria-expanded="true"
                    aria-controls={`${uid}-list`}
                    aria-autocomplete="list"
                    aria-activedescendant={count ? optionId(active) : undefined}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setActive(0)
                    }}
                    placeholder={placeholder}
                    className="h-10 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
                    spellCheck={false}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={close}
                    tabIndex={-1}
                    className="pc-press h-5 cursor-pointer rounded-[5px] bg-background px-1.5 text-[10px] font-medium text-foreground/70 shadow-[0_0_0_1px_var(--pc-hair),0_1px_0_1px_var(--pc-hair)] hover:text-foreground"
                  >
                    {l.close}
                  </button>
                </motion.div>
              </div>

              <motion.div
                className="relative"
                initial={{ opacity: 0, y: quiet ? 0 : -4 }}
                animate={{ opacity: 1, y: 0, transition: { delay: quiet ? 0 : 0.1, duration: quiet ? 0 : 0.18 } }}
                exit={{ opacity: 0, transition: { duration: quiet ? 0 : 0.08 } }}
              >
                <div className="flex">
                <motion.div
                  ref={listRef}
                  id={`${uid}-list`}
                  role="listbox"
                  aria-label={l.results}
                  layoutScroll
                  className={cn("max-h-[46vh] min-w-0 flex-1 overflow-y-auto overscroll-contain", preview && "sm:min-h-[280px]")}
                  initial={false}
                  animate={{ height: listHeight ?? 320 }}
                  transition={reduce ? { duration: 0 } : springs.ui}
                  onPointerMove={() => {
                    keyboardNav.current = false
                  }}
                >
                  <div ref={contentRef} className="p-2">
                  {count === 0 ? (
                    <div className="flex min-h-28 flex-col items-center justify-center gap-1 text-center text-sm text-muted-foreground">
                      {emptyMessage ?? (
                        <>
                          <span className="font-medium text-foreground">{l.noResults}</span>
                          <span>{l.noMatch(query)}</span>
                        </>
                      )}
                    </div>
                  ) : (
                    groups.map((g, gi) => (
                      // Heading ids use the group's position: names can contain spaces, which break aria-labelledby.
                      <div key={g.name || "_"} role="group" aria-labelledby={g.name ? `${uid}-g-${gi}` : undefined} className="mb-1 last:mb-0">
                        {g.name && (
                          <div id={`${uid}-g-${gi}`} className="px-2.5 pt-2 pb-1 text-[11px] font-medium text-muted-foreground">
                            {g.name}
                          </div>
                        )}
                        {g.list.map(({ item, indices }) => {
                          index += 1
                          const i = index
                          const selected = i === active
                          const Icon = item.icon
                          return (
                            <div
                              key={item.id}
                              id={optionId(i)}
                              data-index={i}
                              role="option"
                              aria-selected={selected}
                              onPointerMove={() => !selected && setActive(i)}
                              onClick={() => choose(item)}
                              className={cn(
                                "relative flex h-10 cursor-pointer items-center gap-3 rounded-[8px] px-2.5 text-sm select-none",
                                selected ? "text-foreground" : "text-foreground/80",
                              )}
                            >
                              {selected && (
                                <motion.span
                                  layoutId={`${uid}-active`}
                                  aria-hidden="true"
                                  className="absolute inset-0 rounded-[8px] bg-foreground/[.06] shadow-[inset_0_0_0_1px_var(--pc-hair)]"
                                  transition={reduce ? { duration: 0 } : springs.snap}
                                />
                              )}
                              {Icon && <Icon className="relative size-4 shrink-0 text-muted-foreground" />}
                              <span className="relative flex-1 truncate">
                                <Highlight text={item.label} indices={indices} />
                              </span>
                              {item.hint && <span className="relative hidden truncate text-xs text-foreground/65 sm:block">{item.hint}</span>}
                              {item.shortcut && (
                                <span className="relative hidden gap-1 sm:flex">
                                  {item.shortcut.map((k) => (
                                    <kbd key={k} className="flex h-5 min-w-5 items-center justify-center rounded-[5px] bg-background px-1 font-sans text-[10px] font-medium text-muted-foreground shadow-[0_0_0_1px_var(--pc-hair),0_1px_0_1px_var(--pc-hair)]">
                                      {k}
                                    </kbd>
                                  ))}
                                </span>
                              )}
                              {selected && <CornerDownLeft className="relative size-3.5 shrink-0 text-muted-foreground" />}
                            </div>
                          )
                        })}
                      </div>
                    ))
                  )}
                  </div>
                </motion.div>
                {preview && (
                  <div className="relative hidden w-[42%] shrink-0 overflow-hidden border-s border-[var(--pc-hair)] sm:block">
                    {flat[active] && (
                      <motion.div
                        key={flat[active].item.id}
                        className="absolute inset-0 overflow-y-auto p-4"
                        initial={reduce ? false : { opacity: 0, filter: "blur(4px)" }}
                        animate={{ opacity: 1, filter: "blur(0px)" }}
                        transition={{ duration: 0.15 }}
                      >
                        {flat[active].item.preview ?? <DefaultPreview item={flat[active].item} />}
                      </motion.div>
                    )}
                  </div>
                )}
                </div>
                <div className="flex items-center gap-4 border-t border-[var(--pc-hair)] px-4 py-2.5 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded-[4px] bg-background px-1 font-sans text-foreground/70 shadow-[0_0_0_1px_var(--pc-hair),0_1px_0_1px_var(--pc-hair)]">↑</kbd>
                    <kbd className="rounded-[4px] bg-background px-1 font-sans text-foreground/70 shadow-[0_0_0_1px_var(--pc-hair),0_1px_0_1px_var(--pc-hair)]">↓</kbd> {l.navigate}
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded-[4px] bg-background px-1 font-sans text-foreground/70 shadow-[0_0_0_1px_var(--pc-hair),0_1px_0_1px_var(--pc-hair)]">↵</kbd> {l.select}
                  </span>
                  <span className="ms-auto" aria-live="polite">
                    {l.resultCount(count)}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
