"use client"

import * as React from "react"
import { Reorder, useDragControls, useReducedMotion } from "motion/react"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

export type ListReorderRenderState = { index: number; dragging: boolean }

export type ListReorderLabels = {
  handle: (label: string, position: number, count: number) => string
  moved: (label: string, position: number, count: number) => string
  dropped: (label: string, position: number, count: number) => string
}
const DEFAULT_LABELS: ListReorderLabels = {
  handle: (label, position, count) => `Reorder ${label}, position ${position} of ${count}. Use the arrow keys to move.`,
  moved: (label, position, count) => `${label} moved to position ${position} of ${count}.`,
  dropped: (label, position, count) => `${label} dropped at position ${position} of ${count}.`,
}

export type ListReorderProps<T> = Omit<React.ComponentProps<"div">, "children" | "onChange"> & {
  /** Items in their current order (controlled). */
  items: T[]
  /** Called with the whole list in its new order after a drag step or keyboard move; store it back into `items`. */
  onReorder: (items: T[]) => void
  /** Stable unique key of an item. Also the default for `getLabel`. */
  getKey: (item: T) => string
  /** Plain-text name of an item, used for the handle label and screen reader announcements. */
  getLabel?: (item: T) => string
  /** Content of a row. `state.index` is the current position, `state.dragging` is true while that row is held. */
  renderItem: (item: T, state: ListReorderRenderState) => React.ReactNode
  /** Where the grip sits. "none" makes the whole row draggable. */
  handle?: "start" | "end" | "none"
  /** Accessible name of the list. */
  label?: string
  /** Classes added to every row (<li>). */
  itemClassName?: string
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<ListReorderLabels>
}

type ItemProps<T> = {
  item: T
  index: number
  label: string
  handleLabel: string
  handle: "start" | "end" | "none"
  reduce: boolean
  className?: string
  onMove: (from: number, delta: number) => void
  onDropped: (label: string, index: number) => void
  renderItem: ListReorderProps<T>["renderItem"]
}

function ReorderRow<T>({ item, index, label, handleLabel, handle, reduce, className, onMove, onDropped, renderItem }: ItemProps<T>) {
  const controls = useDragControls()
  const [dragging, setDragging] = React.useState(false)
  const hintId = React.useId()
  const rowFocusable = handle === "none"

  const move = (e: React.KeyboardEvent, requireAlt: boolean) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return
    // With handle="none" the row itself is the keyboard handle: plain arrows move it while the row has focus.
    const onRow = rowFocusable && e.target === e.currentTarget
    if (requireAlt && !e.altKey && !onRow) return
    e.preventDefault()
    e.stopPropagation()
    onMove(index, e.key === "ArrowUp" ? -1 : 1)
  }

  const grip = (
    <button
      type="button"
      aria-label={handleLabel}
      onPointerDown={(e) => {
        e.preventDefault()
        controls.start(e)
      }}
      onKeyDown={(e) => move(e, false)}
      className={cn(
        "pc-press flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing",
        dragging && "cursor-grabbing bg-muted text-foreground",
      )}
    >
      <GripVertical className="size-4" />
    </button>
  )

  return (
    <Reorder.Item
      as="li"
      value={item}
      dragListener={handle === "none"}
      dragControls={controls}
      onDragStart={() => setDragging(true)}
      onDragEnd={() => {
        setDragging(false)
        onDropped(label, index)
      }}
      onKeyDown={(e) => move(e, true)}
      tabIndex={rowFocusable ? 0 : undefined}
      aria-describedby={rowFocusable ? hintId : undefined}
      whileDrag={reduce ? undefined : { scale: 1.025 }}
      transition={reduce ? { duration: 0 } : spring.snap}
      data-dragging={dragging || undefined}
      className={cn(
        "relative flex items-center gap-2 rounded-xl border bg-card px-2 py-2 text-card-foreground shadow-xs transition-[box-shadow,border-color] duration-200 select-none",
        "data-dragging:border-primary/40 data-dragging:shadow-[var(--pc-e3)] data-dragging:shadow-black/10 dark:data-dragging:shadow-black/40",
        handle === "none" && "cursor-grab touch-none px-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing",
        className,
      )}
    >
      {handle === "start" && grip}
      <div className="min-w-0 flex-1">{renderItem(item, { index, dragging })}</div>
      {handle === "end" && grip}
      {rowFocusable && (
        <span id={hintId} className="sr-only">
          {handleLabel}
        </span>
      )}
    </Reorder.Item>
  )
}

/**
 * Drag-to-reorder list with a grip handle, a lifted row while dragging and Alt+Arrow keyboard moves.
 * With handle="none" each row is focusable and moves with the arrow keys (Alt+Arrow from inside the row).
 */
export function ListReorder<T>({
  items,
  onReorder,
  getKey,
  getLabel = getKey,
  renderItem,
  handle = "start",
  label = "Reorderable list",
  itemClassName,
  labels,
  className,
  ...props
}: ListReorderProps<T>) {
  const l = useLabels("list-reorder", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const [announcement, setAnnouncement] = React.useState("")

  const onMove = (from: number, delta: number) => {
    const to = from + delta
    if (to < 0 || to >= items.length) return
    const next = [...items]
    const moved = next.splice(from, 1)[0]!
    next.splice(to, 0, moved)
    onReorder(next)
    setAnnouncement(l.moved(getLabel(moved), to + 1, items.length))
  }

  return (
    <div className={cn("w-full", className)} {...props}>
      <GooduiTokens />
      <Reorder.Group as="ul" axis="y" values={items} onReorder={onReorder} aria-label={label} className="flex flex-col gap-2">
        {items.map((item, index) => (
          <ReorderRow
            key={getKey(item)}
            item={item}
            index={index}
            label={getLabel(item)}
            handleLabel={l.handle(getLabel(item), index + 1, items.length)}
            handle={handle}
            reduce={reduce}
            className={itemClassName}
            onMove={onMove}
            onDropped={(name, i) => setAnnouncement(l.dropped(name, i + 1, items.length))}
            renderItem={renderItem}
          />
        ))}
      </Reorder.Group>
      <p aria-live="assertive" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}
