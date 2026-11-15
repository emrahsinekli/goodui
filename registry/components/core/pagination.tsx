"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

/*
 * Pagination with independent layers:
 *   variant    outline, soft, ghost, pill (pages sit in a track), neo, minimal ("Page 3 of 12"), dots (carousels)
 *   animation  none, slide (the active marker glides between pages), press
 *   tone, size, shape (rounded, circle, square)
 *   extras     first/last buttons, prev/next labels, range info, page-size select, jump-to input
 * Controlled (`page` + `onPageChange`) or uncontrolled (`defaultPage`).
 */

export type PaginationVariant = "outline" | "soft" | "ghost" | "pill" | "neo" | "minimal" | "dots"
export type PaginationTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type PaginationAnimation = "none" | "slide" | "press"
export type PaginationSize = "sm" | "md" | "lg"
export type PaginationShape = "rounded" | "circle" | "square"

export type PaginationLabels = {
  previous: string
  next: string
  firstPage: string
  previousPage: string
  nextPage: string
  lastPage: string
  previousSlide: string
  nextSlide: string
  /** Name of a numbered page button. */
  goToPage: (page: number) => string
  goToSlide: (slide: number, total: number) => string
  skipBack: (pages: number) => string
  skipForward: (pages: number) => string
  /** Range info with totalItems: "21–30 of 248". */
  range: (from: number, to: number, total: number) => string
  /** "Page 3 of 12". `page` is a node: the minimal variant puts the styled number or the jump field there. */
  pageOf: (page: React.ReactNode, total: number) => React.ReactNode
  rows: string
  goTo: string
  /** Name of the jump-to input. */
  pageField: string
  pagePlaceholder: string
}

const DEFAULT_LABELS: PaginationLabels = {
  previous: "Previous",
  next: "Next",
  firstPage: "First page",
  previousPage: "Previous page",
  nextPage: "Next page",
  lastPage: "Last page",
  previousSlide: "Previous slide",
  nextSlide: "Next slide",
  goToPage: (page) => `Page ${page}`,
  goToSlide: (slide, total) => `Slide ${slide} of ${total}`,
  skipBack: (pages) => `Back ${pages} pages`,
  skipForward: (pages) => `Forward ${pages} pages`,
  range: (from, to, total) => `${from}–${to} of ${total.toLocaleString()}`,
  pageOf: (page, total) => (
    <>
      Page {page} of {total}
    </>
  ),
  rows: "Rows",
  goTo: "Go to",
  pageField: "Go to page",
  pagePlaceholder: "Page",
}

export type PaginationProps = Omit<React.ComponentProps<"nav">, "onChange"> & {
  /** Current page, 1-based (controlled). Clamped to 1…total. */
  page?: number
  /** Initial page when uncontrolled. */
  defaultPage?: number
  /** Called with the new 1-based page. */
  onPageChange?: (page: number) => void
  /** Number of pages. Ignored when `totalItems` is set. */
  totalPages?: number
  /** Total rows; with `pageSize` it sets the page count and the "21–30 of 248" info. */
  totalItems?: number
  /** Rows per page (controlled). */
  pageSize?: number
  /** Initial rows per page when uncontrolled. */
  defaultPageSize?: number
  /** Called when the rows select changes; the page is adjusted to keep the first visible row. */
  onPageSizeChange?: (size: number) => void
  /** Choices in the rows-per-page select. */
  pageSizeOptions?: number[]
  /** Pages shown on each side of the current one. */
  siblings?: number
  /** Pages always shown at the start and end. */
  boundaries?: number
  /** outline (default), soft, ghost, pill (pages in a track), neo, minimal ("Page 3 of 12") or dots (carousels). */
  variant?: PaginationVariant
  /** Color of the active page marker and focus rings. */
  tone?: PaginationTone
  /** slide glides the active marker between pages; press shrinks buttons while pressed. */
  animation?: PaginationAnimation
  size?: PaginationSize
  /** Button corners. The pill variant is always round. */
  shape?: PaginationShape
  /** Adds first-page and last-page buttons. */
  showFirstLast?: boolean
  /** Shows the previous and next arrows. */
  showPrevNext?: boolean
  /** "Previous"/"Next" text next to the arrows (hidden on phones). */
  showLabels?: boolean
  /** "21–30 of 248" (with totalItems) or "Page 3 of 12". */
  showInfo?: boolean
  /** Adds a rows-per-page select. */
  showPageSize?: boolean
  /** A "Go to" input. In the minimal variant the page number itself becomes editable. */
  showJump?: boolean
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<PaginationLabels>
}

const tones = (c: string) => `
.${c}{--pc-c:var(--primary);--pc-fg:var(--primary-foreground)}
.${c}[data-tone=neutral]{--pc-c:var(--foreground);--pc-fg:var(--background)}
.${c}[data-tone=success]{--pc-c:oklch(0.53 0.13 155);--pc-fg:#fff}
.${c}[data-tone=warning]{--pc-c:oklch(0.75 0.16 70);--pc-fg:oklch(0.25 0.05 70)}
.${c}[data-tone=danger]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff}
.${c}[data-tone=info]{--pc-c:oklch(0.55 0.17 250);--pc-fg:#fff}
.dark .${c}[data-tone=success]{--pc-c:oklch(0.7 0.16 155);--pc-fg:oklch(0.2 0.05 155)}
.dark .${c}[data-tone=danger]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25)}
.dark .${c}[data-tone=info]{--pc-c:oklch(0.7 0.15 245);--pc-fg:oklch(0.2 0.05 245)}
.${c}{--pc-tint:color-mix(in oklab,var(--pc-c) 14%,transparent);--pc-ink:color-mix(in oklab,var(--pc-c) 82%,var(--foreground))}
.${c}[data-tone=warning]{--pc-ink:color-mix(in oklab,var(--pc-c) 62%,var(--foreground))}
`

const P = ".pc-pagination"
const B = ".pc-pagination-btn"
const A = `${B}[aria-current=page]`
const CSS = `${tones("pc-pagination")}
${B}{color:var(--foreground);-webkit-tap-highlight-color:transparent}
${B}:disabled{color:var(--muted-foreground)}
${B}:not(:disabled):not([aria-current=page]):hover{background:color-mix(in oklab,var(--foreground) 6%,transparent)}
${P} .pc-pagination-ind{position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:var(--pc-c)}
${A}{color:var(--pc-fg);font-weight:600}

${P}[data-variant=outline] ${B}{border:1px solid var(--border);background:var(--background)}
${P}[data-variant=outline] ${A}{border-color:var(--pc-c)}
${P}[data-variant=outline] .pc-pagination-ind{inset:-1px}

${P}[data-variant=soft] .pc-pagination-ind{background:var(--pc-tint)}
${P}[data-variant=soft] ${A}{color:var(--pc-ink)}

${P}[data-variant=ghost] .pc-pagination-ind{inset:auto 22% 2px;height:2px;border-radius:2px}
${P}[data-variant=ghost] ${A}{color:var(--pc-ink)}

${P}[data-variant=pill] .pc-pagination-track{background:color-mix(in oklab,var(--foreground) 6%,transparent)}
${P}[data-variant=pill] .pc-pagination-ind{box-shadow:0 1px 3px rgb(0 0 0/.18)}

${P}[data-variant=neo] ${B}{border:2px solid var(--foreground);background:var(--background);box-shadow:2px 2px 0 var(--foreground)}
${P}[data-variant=neo] ${B}:not(:disabled):not([aria-current=page]):hover{background:var(--pc-tint);transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--foreground)}
${P}[data-variant=neo] ${A}{transform:translate(2px,2px);box-shadow:0 0 0 var(--foreground)}
${P}[data-variant=neo] ${B}:disabled{opacity:.45}

${P}[data-variant=minimal] ${B}{border:1px solid var(--border);background:var(--background)}

${P}[data-variant=dots] .pc-pagination-dot{background:color-mix(in oklab,var(--foreground) 22%,transparent)}
${P}[data-variant=dots] .pc-pagination-dotbtn:hover .pc-pagination-dot{background:color-mix(in oklab,var(--foreground) 40%,transparent)}
${P}[data-variant=dots] .pc-pagination-ind{inset:auto;left:0;right:0;top:50%;height:8px;margin-top:-4px;border-radius:99px}

${P}[data-anim]:not([data-anim=none]) ${B}{transition:background-color .15s,color .15s,border-color .15s,transform .12s,box-shadow .12s}
${P}[data-anim=press] ${B}:not(:disabled):active{transform:scale(.9)}
${P}[data-anim=press][data-variant=neo] ${B}:not(:disabled):active{transform:translate(2px,2px);box-shadow:0 0 0 var(--foreground)}
${P}[data-anim]:not([data-anim=none]) .pc-pagination-dot{transition:transform .25s,background-color .2s}
.pc-pagination-more{color:color-mix(in oklab,var(--muted-foreground) 80%,var(--foreground))}
.pc-pagination-more .pc-pagination-more-icon{display:none}
.pc-pagination-more:hover .pc-pagination-more-icon,.pc-pagination-more:focus-visible .pc-pagination-more-icon{display:block}
.pc-pagination-more:hover .pc-pagination-more-dots,.pc-pagination-more:focus-visible .pc-pagination-more-dots{display:none}
.pc-pagination-field{border:1px solid var(--border);background:var(--background);color:var(--foreground)}
.pc-pagination-field:focus-visible{outline:none;border-color:var(--pc-c);box-shadow:0 0 0 3px color-mix(in oklab,var(--pc-c) 30%,transparent)}
.pc-pagination-field::-webkit-inner-spin-button{display:none}
.pc-pagination-field{-moz-appearance:textfield}
@media (prefers-reduced-motion:reduce){
  ${P} *{transition:none!important}
  ${P}[data-anim] ${B}:active{transform:none!important}
}
`

const SIZE: Record<PaginationSize, { btn: string; text: string; icon: string; field: string }> = {
  sm: { btn: "h-8 min-w-8 px-2", text: "text-xs", icon: "[&_svg]:size-3.5", field: "h-8 text-xs" },
  md: { btn: "h-9 min-w-9 px-2.5", text: "text-sm", icon: "[&_svg]:size-4", field: "h-9 text-sm" },
  lg: { btn: "h-10 min-w-10 px-3", text: "text-[15px]", icon: "[&_svg]:size-[18px]", field: "h-10 text-sm" },
}
const SHAPE: Record<PaginationShape, string> = { rounded: "rounded-md", circle: "rounded-full", square: "rounded-none" }

/** Page list with ellipses that keeps a constant length, so the control never jumps around. */
export function paginationRange(page: number, total: number, siblings = 1, boundaries = 1): (number | "start-ellipsis" | "end-ellipsis")[] {
  const range = (a: number, b: number) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i)
  if (total <= 2 * boundaries + 2 * siblings + 3) return range(1, total)
  const startPages = range(1, Math.min(boundaries, total))
  const endPages = range(Math.max(total - boundaries + 1, boundaries + 1), total)
  const sStart = Math.max(Math.min(page - siblings, total - boundaries - siblings * 2 - 1), boundaries + 2)
  const sEnd = Math.min(Math.max(page + siblings, boundaries + siblings * 2 + 2), endPages[0] !== undefined ? endPages[0] - 2 : total - 1)
  return [
    ...startPages,
    ...(sStart > boundaries + 2 ? ["start-ellipsis" as const] : boundaries + 1 < total - boundaries ? [boundaries + 1] : []),
    ...range(sStart, sEnd),
    ...(sEnd < total - boundaries - 1 ? ["end-ellipsis" as const] : total - boundaries > boundaries ? [total - boundaries] : []),
    ...endPages,
  ]
}

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="rtl:-scale-x-100">
    <path d={d} />
  </svg>
)
const PREV = "m15 18-6-6 6-6"
const NEXT = "m9 18 6-6-6-6"
const FIRST = "m11 17-5-5 5-5M18 17l-5-5 5-5"
const LAST = "m6 17 5-5-5-5M13 17l5-5-5-5"

export function Pagination({
  page: pageProp,
  defaultPage = 1,
  onPageChange,
  totalPages: totalPagesProp = 1,
  totalItems,
  pageSize: pageSizeProp,
  defaultPageSize = 10,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  siblings = 1,
  boundaries = 1,
  variant = "outline",
  tone = "primary",
  animation = "slide",
  size = "md",
  shape = "rounded",
  showFirstLast = false,
  showPrevNext = true,
  showLabels = false,
  showInfo = false,
  showPageSize = false,
  showJump = false,
  className,
  "aria-label": ariaLabel = "Pagination",
  labels,
  ...props
}: PaginationProps) {
  const l = useLabels("pagination", DEFAULT_LABELS, labels)
  const uid = React.useId()
  const prefersReduced = useReducedMotion()
  // Reduced motion picks motion.span vs span and data-anim, so wait for mount to match the server render.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const reduce = mounted && !!prefersReduced
  const [innerSize, setInnerSize] = React.useState(defaultPageSize)
  const pageSize = pageSizeProp ?? innerSize
  const total = Math.max(1, totalItems !== undefined ? Math.ceil(totalItems / pageSize) : totalPagesProp)
  const [inner, setInner] = React.useState(defaultPage)
  const page = Math.min(Math.max(1, pageProp ?? inner), total)
  const [draft, setDraft] = React.useState("")

  const go = (p: number) => {
    const next = Math.min(Math.max(1, Math.round(p)), total)
    if (next === page) return
    if (pageProp === undefined) setInner(next)
    onPageChange?.(next)
  }
  const setSize = (n: number) => {
    if (pageSizeProp === undefined) setInnerSize(n)
    onPageSizeChange?.(n)
    // Keep the first visible row on screen when the page size changes.
    const firstRow = (page - 1) * pageSize
    const next = Math.floor(firstRow / n) + 1
    if (pageProp === undefined) setInner(next)
    if (next !== page) onPageChange?.(next)
  }

  const s = SIZE[size]
  const radius = variant === "pill" ? "rounded-full" : SHAPE[shape]
  const slide = animation === "slide" && !reduce
  const btn = cn(
    "pc-pagination-btn relative inline-flex shrink-0 items-center justify-center gap-1 font-medium tabular-nums outline-none select-none",
    "focus-visible:ring-3 focus-visible:ring-[color-mix(in_oklab,var(--pc-c)_40%,transparent)] disabled:pointer-events-none",
    s.btn,
    s.icon,
    radius,
  )

  const indicator = (layoutKey: string) =>
    slide ? (
      <motion.span layoutId={`${uid}-${layoutKey}`} className="pc-pagination-ind" transition={spring.snap} style={radius === "rounded-full" ? { borderRadius: 999 } : undefined} />
    ) : (
      <span className="pc-pagination-ind" />
    )

  const nav = (label: string, d: string, target: number, disabled: boolean, text?: string, textFirst?: boolean) => (
    <button type="button" aria-label={label} disabled={disabled} onClick={() => go(target)} className={cn("pc-press", btn, text && "px-2.5")}>
      {textFirst && text && <span className="hidden sm:inline">{text}</span>}
      <Icon d={d} />
      {!textFirst && text && <span className="hidden sm:inline">{text}</span>}
    </button>
  )

  const info =
    totalItems !== undefined
      ? l.range(totalItems === 0 ? 0 : (page - 1) * pageSize + 1, Math.min(page * pageSize, totalItems), totalItems)
      : l.pageOf(page, total)

  const jumpField = (
    <input
      type="number"
      inputMode="numeric"
      min={1}
      max={total}
      aria-label={l.pageField}
      placeholder={variant === "minimal" ? String(page) : l.pagePlaceholder}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && draft && variant === "minimal") {
          go(Number(draft))
          setDraft("")
        }
      }}
      onBlur={() => {
        if (variant === "minimal" && draft) {
          go(Number(draft))
          setDraft("")
        }
      }}
      className={cn("pc-pagination-field w-14 px-2 text-center tabular-nums", s.field, radius === "rounded-full" ? "rounded-full" : radius === "rounded-none" ? "rounded-none" : "rounded-md")}
    />
  )

  let pages: React.ReactNode
  if (variant === "minimal") {
    pages = (
      <div className="flex items-center gap-2">
        {showFirstLast && nav(l.firstPage, FIRST, 1, page === 1)}
        {showPrevNext && nav(l.previousPage, PREV, page - 1, page === 1, showLabels ? l.previous : undefined, false)}
        <span className={cn("px-1 whitespace-nowrap text-muted-foreground tabular-nums", s.text)} aria-live="polite">
          {showJump ? (
            <span className="inline-flex items-center gap-2">{l.pageOf(jumpField, total)}</span>
          ) : (
            l.pageOf(<span className="font-semibold text-foreground">{page}</span>, total)
          )}
        </span>
        {showPrevNext && nav(l.nextPage, NEXT, page + 1, page === total, showLabels ? l.next : undefined, true)}
        {showFirstLast && nav(l.lastPage, LAST, total, page === total)}
      </div>
    )
  } else if (variant === "dots") {
    const win = Math.min(total, 9)
    const start = Math.min(Math.max(1, page - Math.floor(win / 2)), total - win + 1)
    const dots = Array.from({ length: win }, (_, i) => start + i)
    pages = (
      <div className="flex items-center gap-1">
        {showPrevNext && nav(l.previousSlide, PREV, page - 1, page === 1)}
        <ul className="flex items-center">
          {dots.map((p, i) => {
            const edge = (i === 0 && p > 1) || (i === dots.length - 1 && p < total)
            const active = p === page
            return (
              <motion.li key={p} layout={slide ? "position" : false} transition={spring.snap}>
                <button
                  type="button"
                  aria-label={l.goToSlide(p, total)}
                  aria-current={active ? "true" : undefined}
                  onClick={() => go(p)}
                  className={cn(
                    "pc-press pc-pagination-dotbtn relative flex h-6 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-[color-mix(in_oklab,var(--pc-c)_40%,transparent)]",
                    active ? "w-8 px-1" : "w-4",
                  )}
                >
                  {active ? (
                    <span className="relative block h-2 w-full">{indicator("dot")}</span>
                  ) : (
                    <span className="pc-pagination-dot block size-2 rounded-full" style={edge ? { transform: "scale(.6)" } : undefined} />
                  )}
                </button>
              </motion.li>
            )
          })}
        </ul>
        {showPrevNext && nav(l.nextSlide, NEXT, page + 1, page === total)}
      </div>
    )
  } else {
    const items = paginationRange(page, total, siblings, boundaries)
    const jump = Math.max(3, siblings * 2 + 3)
    pages = (
      <ul className={cn("pc-pagination-track flex items-center", variant === "pill" ? "gap-0.5 rounded-full p-1" : "gap-1", variant === "neo" && "gap-1 sm:gap-2")}>
        {showFirstLast && <li>{nav(l.firstPage, FIRST, 1, page === 1)}</li>}
        {showPrevNext && <li>{nav(l.previousPage, PREV, page - 1, page === 1, showLabels ? l.previous : undefined, false)}</li>}
        {items.map((it) =>
          typeof it === "number" ? (
            <li key={it}>
              <button type="button" aria-label={l.goToPage(it)} aria-current={it === page ? "page" : undefined} onClick={() => go(it)} className={`pc-press ${btn}`}>
                {it === page && indicator("page")}
                <span className="relative">{it}</span>
              </button>
            </li>
          ) : (
            <li key={it}>
              <button
                type="button"
                aria-label={it === "start-ellipsis" ? l.skipBack(jump) : l.skipForward(jump)}
                onClick={() => go(it === "start-ellipsis" ? page - jump : page + jump)}
                className={cn("pc-press", btn, "pc-pagination-more")}
                style={variant === "neo" || variant === "outline" ? { border: 0, background: "transparent", boxShadow: "none" } : undefined}
              >
                <span className="pc-pagination-more-dots">…</span>
                <span className="pc-pagination-more-icon">
                  <Icon d={it === "start-ellipsis" ? FIRST : LAST} />
                </span>
              </button>
            </li>
          ),
        )}
        {showPrevNext && <li>{nav(l.nextPage, NEXT, page + 1, page === total, showLabels ? l.next : undefined, true)}</li>}
        {showFirstLast && <li>{nav(l.lastPage, LAST, total, page === total)}</li>}
      </ul>
    )
  }

  const left = (showInfo && variant !== "minimal") || showPageSize
  return (
    <>
      <GooduiTokens />
      <style href="pc-pagination" precedence="default">
        {CSS}
      </style>
      <nav
        aria-label={ariaLabel}
        data-slot="pagination"
        data-variant={variant}
        data-tone={tone}
        data-anim={reduce ? "none" : animation}
        className={cn("pc-pagination flex flex-wrap items-center gap-x-4 gap-y-3", s.text, left ? "justify-between" : "justify-center", className)}
        {...props}
      >
        {left && (
          <div className="flex items-center gap-3 text-muted-foreground">
            {showInfo && variant !== "minimal" && (
              <span className="whitespace-nowrap tabular-nums" aria-live="polite">
                {info}
              </span>
            )}
            {showPageSize && (
              <label className="flex items-center gap-2 whitespace-nowrap">
                <span>{l.rows}</span>
                <select value={pageSize} onChange={(e) => setSize(Number(e.target.value))} className={cn("pc-pagination-field rounded-md ps-2 pe-1", s.field)}>
                  {pageSizeOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}
        {pages}
        {showJump && variant !== "minimal" && (
          <form
            className="flex items-center gap-2 whitespace-nowrap text-muted-foreground"
            onSubmit={(e) => {
              e.preventDefault()
              if (draft) go(Number(draft))
              setDraft("")
            }}
          >
            <span>{l.goTo}</span>
            {jumpField}
          </form>
        )}
      </nav>
    </>
  )
}
