"use client"

import * as React from "react"
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, type PanInfo } from "motion/react"
import { MessageSquare, Pencil, Pin, PinOff, Plus, Search, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

/*
 * Conversation sidebar: search with match highlighting, pinned and date groups (Today, Yesterday, Previous
 * 7 days…), rows with hover actions on desktop and swipe-to-reveal actions on touch, inline rename, delete,
 * a selection highlight that glides between rows and arrow-key navigation.
 */

export type Thread = {
  id: string
  title: string
  /** Last message preview under the title. */
  preview?: string
  /** ISO string, timestamp or Date. */
  updatedAt: string | number | Date
  pinned?: boolean
  unread?: boolean
}

export type ThreadListLabels = {
  search: string
  newChat: string
  pinned: string
  today: string
  yesterday: string
  week: string
  month: string
  older: string
  pin: string
  unpin: string
  rename: string
  delete: string
  empty: string
  unread: string
  actions: string
  save: string
}
const DEFAULT_LABELS: ThreadListLabels = {
  search: "Search chats",
  newChat: "New chat",
  pinned: "Pinned",
  today: "Today",
  yesterday: "Yesterday",
  week: "Previous 7 days",
  month: "Previous 30 days",
  older: "Older",
  pin: "Pin",
  unpin: "Unpin",
  rename: "Rename",
  delete: "Delete",
  empty: "No chats found",
  unread: "Unread",
  actions: "Chat actions",
  save: "Save",
}

export type ThreadListProps = Omit<React.ComponentProps<"nav">, "onChange"> & {
  threads: Thread[]
  /** Selected thread id (controlled). */
  value?: string
  defaultValue?: string
  onValueChange?: (id: string) => void
  onNew?: () => void
  onPin?: (id: string, pinned: boolean) => void
  onRename?: (id: string, title: string) => void
  onDelete?: (id: string) => void
  /** Reference time for the date groups and relative times. Pass a fixed value for stable server rendering. */
  now?: number | Date
  search?: boolean
  /** Group under Pinned / Today / Yesterday / … headings. */
  groupByDate?: boolean
  /** Swipe rows to reveal actions: on, off, or only on touch screens (auto). */
  swipe?: boolean | "auto"
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<ThreadListLabels>
}

const DAY = 86_400_000
const toMs = (d: string | number | Date) => (d instanceof Date ? d.getTime() : typeof d === "number" ? d : new Date(d).getTime())

function groupKey(t: number, now: number): keyof Pick<ThreadListLabels, "today" | "yesterday" | "week" | "month" | "older"> {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const s = start.getTime()
  if (t >= s) return "today"
  if (t >= s - DAY) return "yesterday"
  if (t >= s - 7 * DAY) return "week"
  if (t >= s - 30 * DAY) return "month"
  return "older"
}

function relative(t: number, now: number, locale: string) {
  const diff = now - t
  if (diff < 60_000) return "now"
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`
  const d = new Date(t)
  if (diff < DAY && groupKey(t, now) === "today") return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`
  if (diff < 7 * DAY) return d.toLocaleDateString(locale, { weekday: "short" })
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" })
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const i = text.toLowerCase().indexOf(query.toLowerCase())
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-amber-300/50 text-foreground dark:bg-amber-400/30">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  )
}

type RowProps = {
  thread: Thread
  selected: boolean
  query: string
  now: number
  swipe: boolean
  reduce: boolean
  l: ThreadListLabels
  uid: string
  editing: boolean
  onSelect: () => void
  onStartRename: () => void
  onRename: (title: string) => void
  onCancelRename: () => void
  onPin?: () => void
  onDelete?: () => void
}

const ACTIONS_W = 136

function ThreadRow({ thread: t, selected, query, now, swipe, reduce, l, uid, editing, onSelect, onStartRename, onRename, onCancelRename, onPin, onDelete }: RowProps) {
  const x = useMotionValue(0)
  const [revealed, setRevealed] = React.useState(false)
  const [draft, setDraft] = React.useState(t.title)
  const inputRef = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    if (editing) {
      setDraft(t.title)
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing, t.title])

  const settle = (open: boolean) => {
    setRevealed(open)
    animate(x, open ? -ACTIONS_W : 0, reduce ? { duration: 0 } : spring.snap)
  }
  const onDragEnd = (_: unknown, info: PanInfo) => settle(info.offset.x < -ACTIONS_W / 2.5 || info.velocity.x < -400)
  const actionCount = (onPin ? 1 : 0) + 1 + (onDelete ? 1 : 0)

  const actions = (
    <div className={cn("flex items-center gap-0.5", swipe ? "h-full justify-end pe-2" : "")} role="group" aria-label={l.actions}>
      {onPin && (
        <button
          type="button"
          aria-label={t.pinned ? l.unpin : l.pin}
          title={t.pinned ? l.unpin : l.pin}
          onClick={() => {
            onPin()
            if (swipe) settle(false)
          }}
          className="pc-press grid size-7 place-items-center rounded-md text-muted-foreground outline-none hover:bg-background hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {t.pinned ? <PinOff className="size-3.5" aria-hidden="true" /> : <Pin className="size-3.5" aria-hidden="true" />}
        </button>
      )}
      <button
        type="button"
        aria-label={l.rename}
        title={l.rename}
        onClick={() => {
          onStartRename()
          if (swipe) settle(false)
        }}
        className="pc-press grid size-7 place-items-center rounded-md text-muted-foreground outline-none hover:bg-background hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Pencil className="size-3.5" aria-hidden="true" />
      </button>
      {onDelete && (
        <button
          type="button"
          aria-label={l.delete}
          title={l.delete}
          onClick={onDelete}
          className="pc-press grid size-7 place-items-center rounded-md text-muted-foreground outline-none hover:bg-rose-500/15 hover:text-rose-600 focus-visible:ring-3 focus-visible:ring-ring/50 dark:hover:text-rose-400"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  )

  return (
    <motion.li
      layout="position"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0, transition: { duration: 0.1 } } : { opacity: 0, height: 0, transition: { duration: 0.18 } }}
      transition={reduce ? { duration: 0 } : spring.snap}
      className="group/row relative overflow-hidden rounded-lg"
      data-selected={selected || undefined}
    >
      {selected && !editing && <motion.span layoutId={`${uid}-sel`} className="absolute inset-0 rounded-lg bg-muted" transition={reduce ? { duration: 0 } : spring.snap} aria-hidden="true" />}
      {swipe && (
        <div className="absolute inset-y-0 end-0 bg-muted" style={{ width: ACTIONS_W }} inert={!revealed || undefined}>
          {actions}
        </div>
      )}
      <motion.div
        drag={swipe && !editing ? "x" : false}
        dragConstraints={{ left: -ACTIONS_W, right: 0 }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={onDragEnd}
        style={{ x }}
        className={cn("relative flex items-center", swipe && "bg-background touch-pan-y", selected && swipe && "bg-muted")}
      >
        {editing ? (
          <form
            className="flex w-full items-center gap-1 px-2 py-1"
            onSubmit={(e) => {
              e.preventDefault()
              const v = draft.trim()
              if (v) onRename(v)
              else onCancelRename()
            }}
          >
            <input
              ref={inputRef}
              value={draft}
              aria-label={l.rename}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && onCancelRename()}
              onBlur={() => (draft.trim() && draft.trim() !== t.title ? onRename(draft.trim()) : onCancelRename())}
              className="h-7 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <button type="submit" className="pc-press h-7 rounded-md px-2 text-xs font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
              {l.save}
            </button>
          </form>
        ) : (
          <>
            <button
              type="button"
              data-thread-row
              tabIndex={selected ? 0 : -1}
              aria-current={selected ? "true" : undefined}
              onClick={onSelect}
              onDoubleClick={onStartRename}
              onKeyDown={(e) => {
                if (e.key === "F2") {
                  e.preventDefault()
                  onStartRename()
                } else if (e.key === "Delete" && onDelete) {
                  e.preventDefault()
                  onDelete()
                }
              }}
              className={cn("pc-press pc-press-soft relative flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2 text-start outline-none focus-visible:ring-3 focus-visible:ring-ring/50", !selected && "hover:bg-muted/60")}
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  {t.unread && (
                    <span className="size-1.5 shrink-0 rounded-full bg-[var(--chart-1)]" aria-hidden="true" />
                  )}
                  <span className={cn("truncate text-sm leading-5", t.unread ? "font-semibold" : "font-medium")}>
                    <Highlight text={t.title} query={query} />
                  </span>
                  {t.unread && <span className="sr-only">({l.unread})</span>}
                </span>
                {t.preview && (
                  <span className={cn("block truncate text-xs leading-4", selected ? "text-foreground/70" : "text-muted-foreground")}>
                    <Highlight text={t.preview} query={query} />
                  </span>
                )}
              </span>
              <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums" aria-hidden="true">
                {relative(toMs(t.updatedAt), now, "en-US")}
              </span>
            </button>
            {!swipe && (
              <div
                className="pointer-events-none absolute inset-y-0 end-0 flex items-center rounded-e-lg bg-[linear-gradient(90deg,transparent,var(--muted)_30%)] ps-6 pe-1 opacity-0 transition-opacity group-hover/row:pointer-events-auto group-hover/row:opacity-100 group-focus-within/row:pointer-events-auto group-focus-within/row:opacity-100 rtl:bg-[linear-gradient(270deg,transparent,var(--muted)_30%)]"
                style={{ minWidth: actionCount * 30 }}
              >
                {actions}
              </div>
            )}
          </>
        )}
      </motion.div>
    </motion.li>
  )
}

/** Conversation sidebar with search, pinning, rename, delete, date groups, hover and swipe actions. */
export function ThreadList({
  threads,
  value: valueProp,
  defaultValue,
  onValueChange,
  onNew,
  onPin,
  onRename,
  onDelete,
  now: nowProp,
  search = true,
  groupByDate = true,
  swipe = "auto",
  labels,
  className,
  ...props
}: ThreadListProps) {
  const l = useLabels("thread-list", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const uid = React.useId()
  const [inner, setInner] = React.useState(defaultValue ?? threads[0]?.id ?? "")
  const value = valueProp ?? inner
  const [query, setQuery] = React.useState("")
  const [editing, setEditing] = React.useState<string | null>(null)
  const [touch, setTouch] = React.useState(false)
  const [nowState, setNowState] = React.useState<number | null>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (nowProp === undefined) setNowState(Date.now())
    setTouch(window.matchMedia("(hover: none)").matches)
  }, [nowProp])
  const now = nowProp !== undefined ? toMs(nowProp) : (nowState ?? 0)
  const canSwipe = swipe === true || (swipe === "auto" && touch)

  const select = (id: string) => {
    if (valueProp === undefined) setInner(id)
    onValueChange?.(id)
  }

  const q = query.trim().toLowerCase()
  const filtered = React.useMemo(() => {
    const list = q ? threads.filter((t) => t.title.toLowerCase().includes(q) || t.preview?.toLowerCase().includes(q)) : threads
    return [...list].sort((a, b) => toMs(b.updatedAt) - toMs(a.updatedAt))
  }, [threads, q])

  const groups = React.useMemo(() => {
    const out: { key: string; label: string; items: Thread[] }[] = []
    const add = (key: string, label: string, t: Thread) => {
      const g = out.find((x) => x.key === key)
      if (g) g.items.push(t)
      else out.push({ key, label, items: [t] })
    }
    for (const t of filtered) if (t.pinned) add("pinned", l.pinned, t)
    for (const t of filtered) {
      if (t.pinned) continue
      if (groupByDate && now) {
        const k = groupKey(toMs(t.updatedAt), now)
        add(k, l[k], t)
      } else add("all", "", t)
    }
    return out
  }, [filtered, groupByDate, now, l])

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return
    const rows = [...(listRef.current?.querySelectorAll<HTMLButtonElement>("[data-thread-row]") ?? [])]
    if (!rows.length) return
    const i = rows.findIndex((r) => r === document.activeElement)
    e.preventDefault()
    const next = e.key === "Home" ? 0 : e.key === "End" ? rows.length - 1 : i < 0 ? 0 : (i + (e.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length
    rows[next]?.focus()
  }

  return (
    <nav className={cn("pc-threads flex flex-col gap-2", className)} {...props}>
      <GooduiTokens />
      <div className="flex items-center gap-2">
        {search && (
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={l.search}
              aria-label={l.search}
              className="h-9 w-full rounded-lg border bg-background ps-8 pe-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </label>
        )}
        {onNew && (
          <button
            type="button"
            onClick={onNew}
            aria-label={l.newChat}
            title={l.newChat}
            className="pc-press grid size-9 shrink-0 place-items-center rounded-lg border bg-background text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
      <div ref={listRef} onKeyDown={onListKey} className="flex flex-col gap-3">
        {groups.map((g) => (
          <div key={g.key}>
            {g.label && <div className="px-2.5 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{g.label}</div>}
            <ul className="flex flex-col gap-0.5">
              <AnimatePresence initial={false}>
                {g.items.map((t) => (
                  <ThreadRow
                    key={t.id}
                    thread={t}
                    selected={t.id === value}
                    query={q}
                    now={now}
                    swipe={canSwipe}
                    reduce={reduce}
                    l={l}
                    uid={uid}
                    editing={editing === t.id}
                    onSelect={() => select(t.id)}
                    onStartRename={() => setEditing(t.id)}
                    onRename={(title) => {
                      setEditing(null)
                      onRename?.(t.id, title)
                    }}
                    onCancelRename={() => setEditing(null)}
                    onPin={onPin ? () => onPin(t.id, !t.pinned) : undefined}
                    onDelete={onDelete ? () => onDelete(t.id) : undefined}
                  />
                ))}
              </AnimatePresence>
            </ul>
          </div>
        ))}
        {groups.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <MessageSquare className="size-5" aria-hidden="true" />
            {l.empty}
          </div>
        )}
      </div>
    </nav>
  )
}
