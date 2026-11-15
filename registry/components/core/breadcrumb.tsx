"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, ease as easing } from "@/lib/goodui-motion"

/*
 * Breadcrumb with independent layers:
 *   variant    slash, chevron, dot, pill (every crumb a pill), arrow-steps (chevron segments), underline
 *   current    how the last crumb reads: bold, muted, tone, badge
 *   animation  none, fade (staggered entrance), underline (hover underline that slides in)
 *   tone, size, and maxItems: long trails collapse their middle into an accessible "…" menu.
 * Pass `linkAs={Link}` to render your router's link (next/link, react-router…).
 */

export type BreadcrumbVariant = "slash" | "chevron" | "dot" | "pill" | "arrow-steps" | "underline"
export type BreadcrumbTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type BreadcrumbCurrent = "bold" | "muted" | "tone" | "badge"
export type BreadcrumbAnimation = "none" | "fade" | "underline"
export type BreadcrumbSize = "sm" | "md" | "lg"

export type BreadcrumbItem = {
  label: React.ReactNode
  /** Link target; rendered through linkAs. Ignored on the last (current) item. */
  href?: string
  /** Icon before the label. */
  icon?: React.ReactNode
  /** Click handler; an item with onClick and no href renders as a <button>. */
  onClick?: (e: React.MouseEvent) => void
}

export type BreadcrumbLabels = { showMore: (count: number) => string; hiddenPages: string }
const DEFAULT_LABELS: BreadcrumbLabels = { showMore: (count) => `Show ${count} more`, hiddenPages: "Hidden pages" }

export type BreadcrumbProps = Omit<React.ComponentProps<"nav">, "children"> & {
  /** The trail, root first. The last item is the current page. */
  items: BreadcrumbItem[]
  /** Separator and crumb style: slash, chevron (default), dot, pill, arrow-steps or underline. */
  variant?: BreadcrumbVariant
  /** Color of the current item (tone and badge styles), pill and arrow-step highlights, and focus rings. */
  tone?: BreadcrumbTone
  size?: BreadcrumbSize
  /** Style of the current (last) item. */
  current?: BreadcrumbCurrent
  /** fade staggers the crumbs in on mount; underline grows an underline under hovered links. */
  animation?: BreadcrumbAnimation
  /** Collapse the middle into a "…" menu when there are more items than this. 0 never collapses. Numeric strings work too. */
  maxItems?: number | string
  /** Items kept before the "…" when collapsed. */
  itemsBeforeCollapse?: number
  /** Items kept after the "…" when collapsed (including the current page). */
  itemsAfterCollapse?: number
  /** Custom separator, replaces the variant's. */
  separator?: React.ReactNode
  /** Link component, e.g. next/link. Receives href, className and children. */
  linkAs?: React.ElementType
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<BreadcrumbLabels>
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

const N = ".pc-breadcrumb"
const C = ".pc-breadcrumb-crumb"
const CUR = `${C}[aria-current=page]`
const CSS = `${tones("pc-breadcrumb")}
${C}{color:var(--muted-foreground);text-decoration:none;-webkit-tap-highlight-color:transparent}
a${C}:hover,button${C}:hover{color:var(--foreground)}
.pc-breadcrumb-sep{color:color-mix(in oklab,var(--foreground) 32%,transparent)}
${N}[data-current=bold] ${CUR}{color:var(--foreground);font-weight:600}
${N}[data-current=muted] ${CUR}{color:var(--muted-foreground)}
${N}[data-current=tone] ${CUR}{color:var(--pc-ink);font-weight:500}
${N}[data-current=badge] ${CUR}{color:var(--pc-ink);background:var(--pc-tint);font-weight:500}

${N}:is([data-variant=pill],[data-variant=arrow-steps]) ${C}{color:color-mix(in oklab,var(--muted-foreground) 78%,var(--foreground))}
${N}[data-variant=pill] ${C}{background:color-mix(in oklab,var(--foreground) 6%,transparent)}
${N}[data-variant=pill] a${C}:hover,${N}[data-variant=pill] button${C}:hover{background:var(--pc-tint);color:var(--pc-ink)}
${N}[data-variant=pill]:is([data-current=tone],[data-current=badge]) ${CUR}{background:var(--pc-c);color:var(--pc-fg)}
${N}[data-variant=pill][data-current=bold] ${CUR}{background:color-mix(in oklab,var(--foreground) 12%,transparent)}
${N}[data-variant=pill][data-current=muted] ${CUR}{background:transparent}

${N}[data-variant=arrow-steps] ${C}{--a:10px;background:color-mix(in oklab,var(--foreground) 7%,transparent);clip-path:polygon(0 0,calc(100% - var(--a)) 0,100% 50%,calc(100% - var(--a)) 100%,0 100%,var(--a) 50%)}
${N}[data-variant=arrow-steps] li:first-child>${C}{clip-path:polygon(0 0,calc(100% - var(--a)) 0,100% 50%,calc(100% - var(--a)) 100%,0 100%)}
${N}[data-variant=arrow-steps] ${C}:dir(rtl){clip-path:polygon(var(--a) 0,100% 0,calc(100% - var(--a)) 50%,100% 100%,var(--a) 100%,0 50%)}
${N}[data-variant=arrow-steps] li:first-child>${C}:dir(rtl){clip-path:polygon(var(--a) 0,100% 0,100% 100%,var(--a) 100%,0 50%)}
${N}[data-variant=arrow-steps] a${C}:hover,${N}[data-variant=arrow-steps] button${C}:hover{background:var(--pc-tint);color:var(--pc-ink)}
${N}[data-variant=arrow-steps] ${CUR}{background:var(--pc-c);color:var(--pc-fg)}
${N}[data-variant=arrow-steps][data-current=muted] ${CUR}{background:color-mix(in oklab,var(--foreground) 14%,transparent);color:var(--foreground)}
${N}[data-variant=arrow-steps][data-current=bold] ${CUR}{font-weight:600}

${N}[data-variant=underline] ${C}>[data-slot=label]{padding-bottom:7px;margin-bottom:-5px}
${N}[data-variant=underline] :is(a,button)${C}>[data-slot=label]{text-decoration:underline;text-decoration-color:color-mix(in oklab,var(--foreground) 30%,transparent);text-underline-offset:4px;text-decoration-thickness:1px}
${N}[data-variant=underline] :is(a,button)${C}:hover>[data-slot=label]{text-decoration-color:currentColor}
${N}[data-variant=underline] ${CUR}>[data-slot=label]{text-decoration:underline;text-decoration-color:var(--pc-c);text-underline-offset:4px;text-decoration-thickness:2px}

${N}[data-anim=underline]:not([data-variant=underline]) :is(a,button)${C}>[data-slot=label]{background:linear-gradient(currentColor,currentColor) 0 100%/0 1.5px no-repeat;transition:background-size .28s var(--pc-ease-out)}
${N}[data-anim=underline]:not([data-variant=underline]) :is(a,button)${C}:hover>[data-slot=label]{background-size:100% 1.5px}
${N}[data-anim=underline]:not([data-variant=underline]) :is(a,button)${C}:dir(rtl)>[data-slot=label]{background-position:100% 100%}
${N}[data-anim=fade] .pc-breadcrumb-li{--pc-x:-6px;animation:pc-breadcrumb-in .4s var(--pc-ease-out) both;animation-delay:calc(var(--i) * 55ms)}
${N}[data-anim=fade] .pc-breadcrumb-li:dir(rtl){--pc-x:6px}
@keyframes pc-breadcrumb-in{from{opacity:0;transform:translateX(var(--pc-x))}}
${N}[data-anim]:not([data-anim=none]) ${C}{transition:color .15s,background-color .15s}
.pc-breadcrumb-menu-item{color:var(--foreground)}
.pc-breadcrumb-menu-item:hover,.pc-breadcrumb-menu-item:focus-visible{background:var(--pc-tint);color:var(--pc-ink);outline:none}
@media (prefers-reduced-motion:reduce){
  ${N} *{animation:none!important;transition:none!important}
}
`

const SIZE: Record<BreadcrumbSize, { text: string; gap: string; pad: string; arrow: string; icon: string }> = {
  sm: { text: "text-xs", gap: "gap-1.5", pad: "h-6 px-2", arrow: "h-7 ps-4 pe-5", icon: "[&_svg]:size-3.5" },
  md: { text: "text-sm", gap: "gap-2", pad: "h-7 px-2.5", arrow: "h-8 ps-5 pe-6", icon: "[&_svg]:size-4" },
  lg: { text: "text-base", gap: "gap-2.5", pad: "h-9 px-3", arrow: "h-10 ps-6 pe-7", icon: "[&_svg]:size-[18px]" },
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="rtl:-scale-x-100">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function Sep({ variant, custom }: { variant: BreadcrumbVariant; custom?: React.ReactNode }) {
  if (custom !== undefined) return <>{custom}</>
  if (variant === "slash" || variant === "underline") return <span className="px-0.5 select-none">/</span>
  if (variant === "dot") return <span className="block size-1 rounded-full bg-current" />
  return <Chevron />
}

type Entry = { kind: "item"; item: BreadcrumbItem; index: number } | { kind: "more"; hidden: BreadcrumbItem[] }

export function Breadcrumb({
  items,
  variant = "chevron",
  tone = "primary",
  size = "md",
  current = "bold",
  animation = "none",
  maxItems = 0,
  itemsBeforeCollapse = 1,
  itemsAfterCollapse = 2,
  separator,
  linkAs,
  className,
  "aria-label": ariaLabel = "Breadcrumb",
  labels,
  ...props
}: BreadcrumbProps) {
  const l = useLabels("breadcrumb", DEFAULT_LABELS, labels)
  const s = SIZE[size]
  const max = Number(maxItems) || 0
  const collapse = max > 0 && items.length > max && items.length > itemsBeforeCollapse + itemsAfterCollapse
  const entries: Entry[] = collapse
    ? [
        ...items.slice(0, itemsBeforeCollapse).map((item, index) => ({ kind: "item" as const, item, index })),
        { kind: "more" as const, hidden: items.slice(itemsBeforeCollapse, items.length - itemsAfterCollapse) },
        ...items.slice(items.length - itemsAfterCollapse).map((item, i) => ({ kind: "item" as const, item, index: items.length - itemsAfterCollapse + i })),
      ]
    : items.map((item, index) => ({ kind: "item" as const, item, index }))

  const arrows = variant === "arrow-steps"
  const boxed = variant === "pill" || current === "badge"
  const crumbClass = (isCurrent: boolean) =>
    cn(
      "pc-breadcrumb-crumb inline-flex max-w-[16rem] items-center gap-1.5 whitespace-nowrap outline-none",
      "focus-visible:ring-3 focus-visible:ring-[color-mix(in_oklab,var(--pc-c)_40%,transparent)]",
      "[&_svg]:shrink-0",
      s.icon,
      arrows ? cn(s.arrow, "-me-[7px] rounded-none focus-visible:ring-inset") : variant === "pill" || (isCurrent && boxed) ? cn(s.pad, "rounded-full") : "rounded-sm",
    )

  const Link = linkAs ?? "a"

  return (
    <>
      <GooduiTokens />
      <style href="pc-breadcrumb" precedence="default">
        {CSS}
      </style>
      <nav
        aria-label={ariaLabel}
        data-slot="breadcrumb"
        data-variant={variant}
        data-tone={tone}
        data-current={current}
        data-anim={animation}
        className={cn("pc-breadcrumb min-w-0", className)}
        {...props}
      >
        <ol className={cn("flex flex-wrap items-center", arrows ? "gap-y-1.5" : cn(s.gap, "gap-y-1.5"), s.text)}>
          {entries.map((e, i) => {
            const last = i === entries.length - 1
            const key = e.kind === "more" ? "more" : `${e.index}`
            const style = { "--i": i } as React.CSSProperties
            const sep =
              !last && !arrows ? (
                <li key={`${key}-sep`} role="presentation" aria-hidden="true" className={cn("pc-breadcrumb-sep pc-breadcrumb-li inline-flex items-center", s.icon, "[&_svg]:opacity-90")} style={style}>
                  <Sep variant={variant} custom={separator} />
                </li>
              ) : null
            if (e.kind === "more") {
              return (
                <React.Fragment key={key}>
                  <li className="pc-breadcrumb-li relative inline-flex" style={style}>
                    <More hidden={e.hidden} className={crumbClass(false)} Link={Link} arrows={arrows} labels={l} />
                  </li>
                  {sep}
                </React.Fragment>
              )
            }
            const { item } = e
            const isCurrent = e.index === items.length - 1
            const inner = (
              <>
                {item.icon}
                <span data-slot="label" className="truncate py-0.5">
                  {item.label}
                </span>
              </>
            )
            return (
              <React.Fragment key={key}>
                <li className="pc-breadcrumb-li inline-flex min-w-0 items-center" style={style}>
                  {isCurrent ? (
                    <span aria-current="page" className={crumbClass(true)}>
                      {inner}
                    </span>
                  ) : item.href ? (
                    <Link href={item.href} onClick={item.onClick} className={crumbClass(false)}>
                      {inner}
                    </Link>
                  ) : item.onClick ? (
                    <button type="button" onClick={item.onClick} className={`pc-press ${crumbClass(false)}`}>
                      {inner}
                    </button>
                  ) : (
                    <span className={crumbClass(false)}>{inner}</span>
                  )}
                </li>
                {sep}
              </React.Fragment>
            )
          })}
        </ol>
      </nav>
    </>
  )
}

function More({ hidden, className, Link, arrows, labels }: { hidden: BreadcrumbItem[]; className: string; Link: React.ElementType; arrows: boolean; labels: BreadcrumbLabels }) {
  const [open, setOpen] = React.useState(false)
  const reduce = useReducedMotion() ?? false
  const id = React.useId()
  const btn = React.useRef<HTMLButtonElement>(null)
  const menu = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    menu.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus()
    const onDown = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [open])

  const onMenuKey = (e: React.KeyboardEvent) => {
    const els = Array.from(menu.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])
    const i = els.indexOf(document.activeElement as HTMLElement)
    if (e.key === "Escape") {
      e.preventDefault()
      setOpen(false)
      btn.current?.focus()
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      els[(i + 1) % els.length]?.focus()
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      els[(i - 1 + els.length) % els.length]?.focus()
    } else if (e.key === "Home") {
      e.preventDefault()
      els[0]?.focus()
    } else if (e.key === "End") {
      e.preventDefault()
      els[els.length - 1]?.focus()
    } else if (e.key === "Tab") setOpen(false)
  }

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-label={labels.showMore(hidden.length)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault()
            setOpen(true)
          }
        }}
        className={cn("pc-press", className, !arrows && "px-1", "tracking-widest")}
      >
        <span data-slot="label">…</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menu}
            id={id}
            role="menu"
            aria-label={labels.hiddenPages}
            onKeyDown={onMenuKey}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: reduce ? 0 : 0.16, ease: easing.out }}
            className="absolute start-0 top-full z-50 origin-top-left rtl:origin-top-right mt-1.5 flex min-w-44 flex-col rounded-lg border bg-popover p-1 text-sm text-popover-foreground shadow-[var(--pc-e2)]"
          >
            {hidden.map((item, i) => {
              const cls = "pc-breadcrumb-menu-item flex items-center gap-2 rounded-md px-2 py-1.5 text-start whitespace-nowrap [&_svg]:size-4 [&_svg]:text-muted-foreground"
              const close = (e: React.MouseEvent) => {
                item.onClick?.(e)
                setOpen(false)
              }
              return item.href ? (
                <Link key={i} role="menuitem" tabIndex={-1} href={item.href} onClick={close} className={cls}>
                  {item.icon}
                  {item.label}
                </Link>
              ) : (
                <button key={i} type="button" role="menuitem" tabIndex={-1} onClick={close} className={`pc-press ${cls}`}>
                  {item.icon}
                  {item.label}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
