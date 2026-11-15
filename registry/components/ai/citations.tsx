"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ChevronDown, ExternalLink, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

/*
 * Inline numbered citations for AI answers. <Citations> holds the sources; <Cite n={1} /> renders a small chip
 * that opens a hover card with title, domain, snippet and date; <CitedText> turns "[1]" markers in a string
 * into chips; <SourceList> lists every source and lights up the one whose chip is hovered.
 */

export type CitationSource = {
  /** Number shown in the chip and the list, 1-based. */
  n: number
  title: string
  url?: string
  /** Shown under the title; derived from the url when omitted. */
  domain?: string
  snippet?: string
  /** Any short text, e.g. "Oct 2026". */
  date?: string
  /** Favicon or logo; a globe otherwise. */
  icon?: React.ReactNode
}

export type CitationsLabels = {
  source: (n: number) => string
  sources: string
  open: string
  showAll: (n: number) => string
  showLess: string
}
const DEFAULT_LABELS: CitationsLabels = { source: (n) => `Source ${n}`, sources: "Sources", open: "Open source", showAll: (n) => `Show all ${n} sources`, showLess: "Show less" }

type Ctx = {
  sources: CitationSource[]
  active: number | null
  setActive: (n: number | null) => void
  labels: CitationsLabels
}
const CitationsContext = React.createContext<Ctx | null>(null)

export type CitationsProps = React.ComponentProps<"div"> & {
  sources: CitationSource[]
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<CitationsLabels>
}

/** Provides the sources to <Cite>, <CitedText> and <SourceList> inside it. */
export function Citations({ sources, labels, className, children, ...props }: CitationsProps) {
  const [active, setActive] = React.useState<number | null>(null)
  const l = useLabels("citations", DEFAULT_LABELS, labels)
  const value = React.useMemo<Ctx>(() => ({ sources, active, setActive, labels: l }), [sources, active, l])
  return (
    <CitationsContext.Provider value={value}>
      <GooduiTokens />
      <div className={cn("pc-citations", className)} {...props}>
        {children}
      </div>
    </CitationsContext.Provider>
  )
}

const domainOf = (s: CitationSource) => {
  if (s.domain) return s.domain
  try {
    return s.url ? new URL(s.url).hostname.replace(/^www\./, "") : ""
  } catch {
    return ""
  }
}

export type CiteProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  /** Source number, matching a source's `n`. */
  n: number
  /** Where the hover card opens. */
  side?: "top" | "bottom"
}

/** Numbered chip with a hover card for the source: a link to the URL in a new tab, or a button that opens the card when there is none. */
export function Cite({ n, side = "top", className, ...props }: CiteProps) {
  const ctx = React.useContext(CitationsContext)
  const reduce = useReducedMotion() ?? false
  const uid = React.useId()
  const ref = React.useRef<HTMLElement | null>(null)
  const [open, setOpen] = React.useState(false)
  const [pos, setPos] = React.useState<{ x: number; y: number; below: boolean } | null>(null)
  const timer = React.useRef<number | undefined>(undefined)
  const source = ctx?.sources.find((s) => s.n === n)
  const l = ctx?.labels ?? DEFAULT_LABELS

  const show = () => {
    window.clearTimeout(timer.current)
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const below = side === "bottom" || r.top < 190
    setPos({ x: r.left + r.width / 2, y: below ? r.bottom : r.top, below })
    setOpen(true)
    ctx?.setActive(n)
  }
  const hide = (delay = 120) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setOpen(false)
      ctx?.setActive(null)
    }, delay)
  }

  React.useEffect(() => () => window.clearTimeout(timer.current), [])
  React.useEffect(() => {
    if (!open) return
    const close = () => hide(0)
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close()
    window.addEventListener("scroll", close, true)
    window.addEventListener("resize", close)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("scroll", close, true)
      window.removeEventListener("resize", close)
      window.removeEventListener("keydown", onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!source) return null
  const domain = domainOf(source)
  const width = 288

  const shared = {
    ref: (el: HTMLElement | null) => {
      ref.current = el
    },
    "aria-label": `${l.source(n)}: ${source.title}`,
    "aria-describedby": open ? `${uid}-card` : undefined,
    onPointerEnter: (e: React.PointerEvent) => e.pointerType === "mouse" && show(),
    onPointerLeave: () => hide(),
    onFocus: show,
    onBlur: () => hide(0),
    className: cn(
      "mx-0.5 inline-flex h-[1.3em] min-w-[1.3em] items-center justify-center rounded-md bg-muted px-1 align-[0.2em] text-[0.68em] font-semibold text-foreground/70 no-underline tabular-nums outline-none transition-colors hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background",
      className,
    ),
    ...props,
  }

  return (
    <>
      <GooduiTokens />
      {source.url ? (
        <a {...shared} href={source.url} target="_blank" rel="noreferrer">
          {n}
        </a>
      ) : (
        <button {...shared} type="button" onClick={() => !open && show()}>
          {n}
        </button>
      )}
      <AnimatePresence>
        {open && pos && (
          <motion.span
            key="card"
            id={`${uid}-card`}
            role="tooltip"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: pos.below ? -4 : 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0.08 } } : { opacity: 0, scale: 0.96, transition: { duration: 0.12 } }}
            transition={reduce ? { duration: 0 } : spring.ui}
            onPointerEnter={() => window.clearTimeout(timer.current)}
            onPointerLeave={() => hide()}
            style={{
              position: "fixed",
              width,
              left: Math.max(8, Math.min(pos.x - width / 2, (typeof window === "undefined" ? 1024 : window.innerWidth) - width - 8)),
              top: pos.below ? pos.y + 8 : undefined,
              bottom: pos.below ? undefined : (typeof window === "undefined" ? 760 : window.innerHeight) - pos.y + 8,
              transformOrigin: pos.below ? "top center" : "bottom center",
            }}
            className="z-50 block rounded-xl border bg-popover p-3 text-start text-[15px] leading-normal font-normal text-popover-foreground shadow-[var(--pc-e3)] shadow-black/10 dark:shadow-black/40"
          >
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="grid size-5 place-items-center overflow-hidden rounded-md border bg-background [&_img]:size-full [&_svg]:size-3">{source.icon ?? <Globe aria-hidden="true" />}</span>
              <span className="truncate">{domain || l.source(n)}</span>
              {source.date && <span className="ms-auto shrink-0">{source.date}</span>}
            </span>
            <span className="mt-1.5 line-clamp-2 block text-sm leading-5 font-medium">{source.title}</span>
            {source.snippet && <span className="mt-1 line-clamp-3 block text-xs leading-5 text-muted-foreground">{source.snippet}</span>}
          </motion.span>
        )}
      </AnimatePresence>
    </>
  )
}

export type CitedTextProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** Text with "[1]" style markers. */
  text: string
}

/** Renders a string, replacing "[n]" markers with <Cite> chips. */
export function CitedText({ text, className, ...props }: CitedTextProps) {
  const parts = text.split(/\[(\d+)\]/g)
  return (
    <span className={className} {...props}>
      {parts.map((p, i) => (i % 2 === 1 ? <Cite key={i} n={Number(p)} /> : <React.Fragment key={i}>{p}</React.Fragment>))}
    </span>
  )
}

export type SourceListProps = React.ComponentProps<"section"> & {
  /** Rows shown before a "Show all" button. */
  limit?: number
  /** Hide the "Sources" heading. */
  hideTitle?: boolean
}

/** The sources as a numbered list; the row of a hovered chip lights up. */
export function SourceList({ limit = 3, hideTitle = false, className, ...props }: SourceListProps) {
  const ctx = React.useContext(CitationsContext)
  const reduce = useReducedMotion() ?? false
  const [all, setAll] = React.useState(false)
  if (!ctx) return null
  const { sources, active, labels: l } = ctx
  const shown = all ? sources : sources.slice(0, limit)
  const more = sources.length - limit

  return (
    <section className={cn("pc-sources", className)} {...props}>
      <GooduiTokens />
      {!hideTitle && <h4 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">{l.sources}</h4>}
      <ol className="flex flex-col gap-1">
        <AnimatePresence initial={false}>
          {shown.map((s) => {
            const domain = domainOf(s)
            const Row = s.url ? "a" : "div"
            return (
              <motion.li
                key={s.n}
                layout
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                transition={reduce ? { duration: 0 } : spring.snap}
                data-active={active === s.n || undefined}
                onPointerEnter={() => ctx.setActive(s.n)}
                onPointerLeave={() => ctx.setActive(null)}
                className="rounded-lg transition-colors data-active:bg-muted"
              >
                <Row
                  {...(s.url ? { href: s.url, target: "_blank", rel: "noreferrer", title: l.open } : {})}
                  className="group/src flex items-start gap-2.5 rounded-lg px-2 py-1.5 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-md text-[11px] font-semibold tabular-nums transition-colors", active === s.n ? "bg-foreground text-background" : "bg-muted text-foreground/70")}>{s.n}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm leading-5 font-medium">{s.title}</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="grid size-3.5 place-items-center [&_img]:size-full [&_svg]:size-3">{s.icon ?? <Globe aria-hidden="true" />}</span>
                      <span className="truncate">{domain}</span>
                      {s.date && <span className="shrink-0">· {s.date}</span>}
                    </span>
                  </span>
                  {s.url && <ExternalLink className="mt-1 size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/src:opacity-100 group-focus-visible/src:opacity-100" aria-hidden="true" />}
                </Row>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ol>
      {more > 0 && (
        <button
          type="button"
          aria-expanded={all}
          onClick={() => setAll(!all)}
          className="pc-press mt-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {all ? l.showLess : l.showAll(sources.length)}
          <ChevronDown className={cn("size-3.5 transition-transform duration-200", all && "rotate-180")} aria-hidden="true" />
        </button>
      )}
    </section>
  )
}
