"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { spring } from "@/lib/goodui-motion"

// Focus ring on the row only, so a focused folder doesn't outline its whole subtree.
const CSS = `
.pc-tree-expand-item { outline: none }
.pc-tree-expand-item:focus-visible > .pc-tree-expand-row {
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--ring) 50%, transparent);
}
`

export type TreeExpandNode = {
  /** Unique id across the whole tree; used by `expanded` and `selected`. */
  id: string
  /** Plain text of the row, also used for type-ahead. */
  label: string
  /** Icon before the label. */
  icon?: React.ReactNode
  /** Icon used instead of `icon` while the node is expanded, e.g. an open folder. */
  openIcon?: React.ReactNode
  /** Right-aligned extra, e.g. a size or a count. */
  meta?: React.ReactNode
  /** Child nodes; a node with children is a folder that can expand. */
  children?: TreeExpandNode[]
  /** Cannot be selected, and clicking it or pressing Enter does not toggle it. Still reachable with the arrow keys. */
  disabled?: boolean
}

export type TreeExpandProps = Omit<React.ComponentProps<"ul">, "onSelect" | "defaultValue"> & {
  /** Top-level nodes. */
  nodes: TreeExpandNode[]
  /** Expanded node ids (controlled). */
  expanded?: string[]
  /** Node ids expanded on first render (uncontrolled). */
  defaultExpanded?: string[]
  /** Called with the new list of expanded ids when a folder opens or closes. */
  onExpandedChange?: (expanded: string[]) => void
  /** Selected node id (controlled). */
  selected?: string | null
  /** Node id selected on first render (uncontrolled). */
  defaultSelected?: string | null
  /** Called with the id and node when a row is clicked or chosen with Enter or Space. */
  onSelectedChange?: (id: string | null, node: TreeExpandNode | null) => void
  /** Draw vertical indentation guides. */
  guides?: boolean
  /** Pixels per nesting level. */
  indent?: number
  /** Clicking a parent row (or pressing Enter on it) also expands or collapses it. */
  toggleOnSelect?: boolean
  /** Accessible name of the tree. */
  label?: string
}

type Visible = { node: TreeExpandNode; level: number; parent: string | null }

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

/** Tree with spring expand/collapse, indentation guides, a gliding selection and full arrow-key support. */
export function TreeExpand({
  nodes,
  expanded: expandedProp,
  defaultExpanded = [],
  onExpandedChange,
  selected: selectedProp,
  defaultSelected = null,
  onSelectedChange,
  guides = true,
  indent = 18,
  toggleOnSelect = true,
  label = "Tree",
  className,
  onKeyDown,
  ...props
}: TreeExpandProps) {
  const reduce = useReducedMotion() ?? false
  const uid = React.useId()
  const [expanded, setExpanded] = useControllable(expandedProp, defaultExpanded, onExpandedChange)
  const [selected, setSelectedRaw] = useControllable<string | null>(selectedProp, defaultSelected, undefined)
  const [focused, setFocused] = React.useState<string | null>(null)
  const items = React.useRef(new Map<string, HTMLLIElement>())
  const typeahead = React.useRef({ text: "", at: 0 })

  const open = React.useMemo(() => new Set(expanded), [expanded])

  // Right-to-left mirrors the arrow keys and the chevron; read after mount so SSR output is unchanged.
  const [rtl, setRtl] = React.useState(false)
  React.useEffect(() => {
    const first = items.current.values().next().value
    if (first) setRtl(getComputedStyle(first).direction === "rtl")
  }, [])

  const visible = React.useMemo(() => {
    const out: Visible[] = []
    const walk = (list: TreeExpandNode[], level: number, parent: string | null) => {
      for (const node of list) {
        out.push({ node, level, parent })
        if (node.children?.length && open.has(node.id)) walk(node.children, level + 1, node.id)
      }
    }
    walk(nodes, 1, null)
    return out
  }, [nodes, open])

  const has = (id: string | null) => !!id && visible.some((v) => v.node.id === id)
  const tabbable = has(focused) ? focused : has(selected) ? selected : (visible[0]?.node.id ?? null)

  const select = (node: TreeExpandNode) => {
    if (node.disabled) return
    setSelectedRaw(node.id)
    onSelectedChange?.(node.id, node)
  }
  const toggle = (id: string, force?: boolean) => {
    const isOpen = open.has(id)
    const next = force ?? !isOpen
    if (next === isOpen) return
    setExpanded(next ? [...expanded, id] : expanded.filter((x) => x !== id))
  }
  const focusId = (id: string) => {
    setFocused(id)
    items.current.get(id)?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || !tabbable) return
    const i = visible.findIndex((v) => v.node.id === tabbable)
    const cur = visible[i]
    if (!cur) return
    const focusAt = (j: number) => {
      const v = visible[j]
      if (v) focusId(v.node.id)
    }
    const parent = !!cur.node.children?.length
    // Disabled folders can be focused but never expanded or collapsed.
    const canToggle = parent && !cur.node.disabled
    const isRtl = getComputedStyle(e.currentTarget).direction === "rtl"
    const key = e.key === "ArrowRight" && isRtl ? "ArrowLeft" : e.key === "ArrowLeft" && isRtl ? "ArrowRight" : e.key
    let handled = true
    switch (key) {
      case "ArrowDown":
        if (i < visible.length - 1) focusAt(i + 1)
        break
      case "ArrowUp":
        if (i > 0) focusAt(i - 1)
        break
      case "Home":
        focusAt(0)
        break
      case "End":
        focusAt(visible.length - 1)
        break
      case "ArrowRight":
        if (canToggle && !open.has(cur.node.id)) toggle(cur.node.id, true)
        else if (parent && open.has(cur.node.id)) focusAt(i + 1)
        break
      case "ArrowLeft":
        if (canToggle && open.has(cur.node.id)) toggle(cur.node.id, false)
        else if (cur.parent) focusId(cur.parent)
        break
      case "Enter":
      case " ":
        select(cur.node)
        if (parent && toggleOnSelect && !cur.node.disabled) toggle(cur.node.id)
        break
      default: {
        if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) {
          handled = false
          break
        }
        // Type-ahead: jump to the next visible item starting with the typed letters.
        const now = e.timeStamp
        const t = typeahead.current
        t.text = now - t.at > 600 ? e.key.toLowerCase() : t.text + e.key.toLowerCase()
        t.at = now
        const order = [...visible.slice(i + (t.text.length === 1 ? 1 : 0)), ...visible.slice(0, i + 1)]
        const hit = order.find((v) => v.node.label.toLowerCase().startsWith(t.text))
        if (hit) focusId(hit.node.id)
      }
    }
    if (handled) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const height = reduce ? { duration: 0 } : { type: "spring" as const, bounce: 0, duration: 0.34 }
  const glide = reduce ? { duration: 0 } : spring.snap

  const renderNodes = (list: TreeExpandNode[], level: number): React.ReactNode =>
    list.map((node) => {
      const isParent = !!node.children?.length
      const isOpen = isParent && open.has(node.id)
      const isSelected = selected === node.id
      const icon = isOpen && node.openIcon ? node.openIcon : node.icon
      return (
        <li
          key={node.id}
          ref={(el) => {
            if (el) items.current.set(node.id, el)
            else items.current.delete(node.id)
          }}
          role="treeitem"
          aria-level={level}
          aria-expanded={isParent ? isOpen : undefined}
          aria-selected={isSelected}
          aria-disabled={node.disabled || undefined}
          tabIndex={tabbable === node.id ? 0 : -1}
          onFocus={(e) => {
            if (e.target === e.currentTarget) setFocused(node.id)
          }}
          className="pc-tree-expand-item"
        >
          <div
            className={cn(
              "pc-tree-expand-row relative flex h-8 cursor-pointer items-center gap-1.5 rounded-md pe-2 text-sm transition-colors select-none",
              !isSelected && "hover:bg-muted/60",
              isSelected ? "font-medium text-foreground" : "text-foreground/80",
              node.disabled && "cursor-not-allowed opacity-50",
            )}
            style={{ paddingInlineStart: (level - 1) * indent + 6 }}
            onClick={(e) => {
              e.stopPropagation()
              focusId(node.id)
              select(node)
              if (isParent && toggleOnSelect && !node.disabled) toggle(node.id)
            }}
          >
            {isSelected && (
              <motion.span
                layoutId={`${uid}-selection`}
                transition={glide}
                className="absolute inset-0 rounded-md bg-primary/10 ring-1 ring-primary/15 ring-inset dark:bg-primary/15"
                aria-hidden="true"
              />
            )}
            <span
              className={cn("relative flex size-4 shrink-0 items-center justify-center text-muted-foreground", !isParent && "invisible")}
              aria-hidden="true"
              onClick={(e) => {
                if (toggleOnSelect || !isParent || node.disabled) return
                e.stopPropagation()
                focusId(node.id)
                toggle(node.id)
              }}
            >
              <motion.span initial={false} animate={{ rotate: isOpen ? (rtl ? -90 : 90) : 0 }} transition={glide} className="flex">
                <ChevronRight className="size-3.5 rtl:-scale-x-100" />
              </motion.span>
            </span>
            {icon && (
              <span className="relative flex shrink-0 text-muted-foreground [&_svg]:size-4" aria-hidden="true">
                {icon}
              </span>
            )}
            <span className="relative min-w-0 flex-1 truncate">{node.label}</span>
            {node.meta != null && <span className="relative shrink-0 text-xs text-foreground/65 tabular-nums">{node.meta}</span>}
          </div>
          {isParent && (
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.ul
                  key="group"
                  role="group"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1, transition: { height, opacity: { duration: reduce ? 0 : 0.2 } } }}
                  exit={{ height: 0, opacity: 0, transition: { height, opacity: { duration: reduce ? 0 : 0.14 } } }}
                  className={cn(
                    "relative overflow-hidden",
                    guides && "before:absolute before:top-0 before:bottom-1 before:start-(--pc-guide) before:w-px before:bg-border",
                  )}
                  style={{ ["--pc-guide" as string]: `${(level - 1) * indent + 13.5}px` }}
                >
                  {renderNodes(node.children!, level + 1)}
                </motion.ul>
              )}
            </AnimatePresence>
          )}
        </li>
      )
    })

  return (
    <>
      <style href="pc-tree-expand" precedence="default">
        {CSS}
      </style>
      <ul role="tree" aria-label={label} className={cn("w-full", className)} onKeyDown={handleKeyDown} {...props}>
        {renderNodes(nodes, 1)}
      </ul>
    </>
  )
}
