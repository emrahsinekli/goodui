"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import type { SoundName } from "@/lib/goodui-sounds"
import { GooduiTokens, spring } from "@/lib/goodui-motion"
import { NumberFlow } from "@/registry/components/numbers/number-flow"

/*
 * Tabs with independent layers:
 *   variant     underline, pill, segmented, enclosed (folder), soft, vertical-line
 *   indicator   how the active marker moves: none, slide (shared layout), fade
 *   transition  how the panel enters: none, fade, slide (in the direction of travel)
 *   tone, size, shape, shadow, orientation, fullWidth
 * Use the compound parts (Tabs, TabsList, TabsTrigger, TabsContent) or pass `items` for a one-liner.
 */

export type TabsVariant = "underline" | "pill" | "segmented" | "enclosed" | "soft" | "vertical-line"
export type TabsTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type TabsIndicator = "none" | "slide" | "fade"
export type TabsTransition = "none" | "fade" | "slide"
export type TabsSize = "sm" | "md" | "lg"
export type TabsShape = "auto" | "square" | "rounded" | "pill"
export type TabsShadow = "none" | "sm" | "md" | "glow"

export type TabsItem = {
  /** Unique id of the tab, matched against the Tabs value. */
  value: string
  label: React.ReactNode
  icon?: React.ReactNode
  /** Small count shown after the label, e.g. unread items. */
  count?: React.ReactNode
  disabled?: boolean
  /** Panel content; leave it out to render the tab without a panel. */
  content?: React.ReactNode
}

export type TabsProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange" | "dir"> & {
  /** Active tab value (controlled). */
  value?: string
  /** Initially active tab when uncontrolled; defaults to the first enabled tab. */
  defaultValue?: string
  /** Called with the new value when a tab is clicked or picked with the keyboard. */
  onValueChange?: (value: string) => void
  /** Look of the list and marker: underline, pill, segmented, enclosed (folder tabs), soft or vertical-line. */
  variant?: TabsVariant
  /** Color of the active marker, text and count. */
  tone?: TabsTone
  /** How the active marker moves between tabs. */
  indicator?: TabsIndicator
  /** How a panel enters when its tab is selected. */
  transition?: TabsTransition
  size?: TabsSize
  /** Corner style of tabs and marker. "auto" picks the natural one for the variant. */
  shape?: TabsShape
  /** Shadow under the active marker. */
  shadow?: TabsShadow
  /** Lays the list out vertically beside the panel. Ignored by enclosed; vertical-line is always vertical. */
  orientation?: "horizontal" | "vertical"
  /** Stretch the tabs into equal columns. */
  fullWidth?: boolean
  /** Plays "tick" when a tab is selected and the visitor has sounds on (lib/goodui-sounds); pass a sound name to pick another. Off by default. */
  sound?: boolean | SoundName
  /** Shortcut: renders the list and the panels for you. */
  items?: TabsItem[]
  /** Accessible name of the tab list when using `items`. */
  listLabel?: string
}

type Ctx = {
  value: string
  select: (v: string, focus?: boolean) => void
  ensure: (v: string) => void
  uid: string
  variant: TabsVariant
  indicator: TabsIndicator
  transition: TabsTransition
  size: TabsSize
  shape: TabsShape
  shadow: TabsShadow
  vertical: boolean
  fullWidth: boolean
  dir: 1 | -1
  touched: boolean
  reduce: boolean
  listRef: React.RefObject<HTMLDivElement | null>
  /** Values whose panel is currently in the DOM, so triggers only point aria-controls at real elements. */
  panels: Record<string, true>
  registerPanel: (v: string) => () => void
}

const TabsContext = React.createContext<Ctx | null>(null)
function useTabs(part: string) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error(`<${part}> must be used inside <Tabs>`)
  return ctx
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

const T = ".pc-tabs-trigger"
const CSS = `${tones("pc-tabs")}
${T}{color:var(--muted-foreground);-webkit-tap-highlight-color:transparent}
${T}[data-variant=segmented]{color:color-mix(in oklab,var(--muted-foreground) 80%,var(--foreground))}
${T}:hover:not([data-state=active]){color:var(--foreground)}
${T}[data-state=active]{color:var(--foreground)}
${T}[data-variant=pill]:hover:not([data-state=active]),${T}[data-variant=soft]:hover:not([data-state=active]){background:color-mix(in oklab,var(--foreground) 5%,transparent)}
${T}[data-variant=pill][data-state=active]{color:var(--pc-fg)}
${T}[data-variant=soft][data-state=active],${T}[data-variant=vertical-line][data-state=active]{color:var(--pc-ink)}
${T}[data-variant=vertical-line]:hover:not([data-state=active]){background:color-mix(in oklab,var(--foreground) 4%,transparent)}
${T}[data-variant=enclosed]:hover:not([data-state=active]){background:color-mix(in oklab,var(--foreground) 4%,transparent)}

.pc-tabs-ind{position:absolute;pointer-events:none;border-radius:inherit}
.pc-tabs-ind[data-variant=underline]{left:.5rem;right:.5rem;bottom:0;height:2px;border-radius:2px;background:var(--pc-c)}
.pc-tabs-ind[data-variant=underline][data-full]{left:0;right:0}
.pc-tabs-ind[data-variant=pill]{inset:0;background-color:var(--pc-c);background-image:var(--pc-sheen);box-shadow:inset 0 1px var(--pc-edge-t),inset 0 -1px var(--pc-edge-b),0 0 0 1px color-mix(in oklab,var(--pc-c) 80%,black),0 1px 2px rgb(0 0 0/.2)}
.pc-tabs-list[data-variant=segmented]{box-shadow:var(--pc-well)}
.pc-tabs-ind[data-variant=segmented]{inset:0;background:var(--background);box-shadow:var(--pc-e1)}
.dark .pc-tabs-ind[data-variant=segmented]{background:color-mix(in oklab,var(--foreground) 12%,var(--background))}
.pc-tabs-ind[data-variant=enclosed]{inset:0;background:var(--card);border:1px solid var(--border);border-bottom:0;box-shadow:inset 0 2px 0 var(--pc-c)}
.pc-tabs-ind[data-variant=soft]{inset:0;background:var(--pc-tint)}
.pc-tabs-ind[data-variant=vertical-line]{inset-inline-start:0;top:.375rem;bottom:.375rem;width:2px;border-radius:2px;background:var(--pc-c)}
.pc-tabs-ind[data-variant=underline][data-vertical]{left:auto;right:auto;inset-inline-end:0;top:.375rem;bottom:.375rem;width:2px;height:auto}
.pc-tabs-ind[data-shadow=sm]{box-shadow:var(--pc-e1)}
.pc-tabs-ind[data-shadow=md]{box-shadow:var(--pc-e2)}
.pc-tabs-ind[data-shadow=glow]{box-shadow:0 0 0 1px color-mix(in oklab,var(--pc-c) 25%,transparent),0 4px 18px -2px color-mix(in oklab,var(--pc-c) 60%,transparent)}
.pc-tabs-ind[data-variant=enclosed][data-shadow=sm],.pc-tabs-ind[data-variant=enclosed][data-shadow=md]{box-shadow:inset 0 2px 0 var(--pc-c),0 -4px 12px -6px rgb(0 0 0/.25)}
.pc-tabs-ind[data-variant=enclosed][data-shadow=glow]{box-shadow:inset 0 2px 0 var(--pc-c),0 -6px 18px -8px color-mix(in oklab,var(--pc-c) 70%,transparent)}
.pc-tabs-ind[data-anim=fade]{animation:pc-tabs-ind-in .18s var(--pc-ease-out)}
@keyframes pc-tabs-ind-in{from{opacity:0;transform:scale(.94)}}

.pc-tabs-count{background:color-mix(in oklab,var(--foreground) 8%,transparent);color:color-mix(in oklab,var(--muted-foreground) 80%,var(--foreground))}
[data-state=active]>span>.pc-tabs-count{background:var(--pc-tint);color:var(--pc-ink)}
[data-variant=pill][data-state=active]>span>.pc-tabs-count{background:var(--pc-fg);color:var(--pc-c)}

.pc-tabs-content[data-transition=fade]{animation:pc-tabs-fade .2s var(--pc-ease-out)}
.pc-tabs-content[data-transition=slide][data-dir=next]{animation:pc-tabs-next .24s var(--pc-ease-out)}
.pc-tabs-content[data-transition=slide][data-dir=prev]{animation:pc-tabs-prev .24s var(--pc-ease-out)}
@keyframes pc-tabs-fade{from{opacity:0;filter:blur(4px)}}
.pc-tabs-content{--pc-x:1}
.pc-tabs-content:dir(rtl){--pc-x:-1}
@keyframes pc-tabs-next{from{opacity:0;filter:blur(4px);transform:translateX(calc(14px*var(--pc-x)))}}
@keyframes pc-tabs-prev{from{opacity:0;filter:blur(4px);transform:translateX(calc(-14px*var(--pc-x)))}}
@media (prefers-reduced-motion:reduce){
  .pc-tabs-ind,.pc-tabs-content{animation:none!important}
  .pc-tabs-trigger{transition:none!important}
}
`

const SIZES: Record<TabsSize, string> = {
  sm: "h-8 gap-1.5 px-2.5 text-[13px] [&_svg]:size-3.5",
  md: "h-9 gap-2 px-3 text-sm [&_svg]:size-4",
  lg: "h-11 gap-2 px-4 text-[15px] [&_svg]:size-[18px]",
}
const COUNT_SIZES: Record<TabsSize, string> = { sm: "h-4 min-w-4 px-1 text-[10px]", md: "h-5 min-w-5 px-1.5 text-[11px]", lg: "h-5 min-w-5 px-1.5 text-xs" }

function triggerRadius(variant: TabsVariant, shape: TabsShape, vertical: boolean) {
  if (variant === "enclosed") return { auto: "rounded-t-lg", rounded: "rounded-t-lg", square: "rounded-none", pill: "rounded-t-2xl" }[shape]
  if (variant === "vertical-line") return { auto: "rounded-e-md", rounded: "rounded-e-lg", square: "rounded-none", pill: "rounded-e-full" }[shape]
  if (variant === "underline" && !vertical) return { auto: "rounded-md", rounded: "rounded-lg", square: "rounded-none", pill: "rounded-full" }[shape]
  return { auto: variant === "pill" ? "rounded-full" : variant === "segmented" ? "rounded-lg" : "rounded-md", rounded: "rounded-lg", square: "rounded-none", pill: "rounded-full" }[shape]
}

/** Inline radius for the sliding marker, so a shared-layout morph keeps its corners while it stretches. */
function markerRadius(variant: TabsVariant, shape: TabsShape) {
  if (variant === "underline" || variant === "vertical-line" || variant === "enclosed") return undefined
  if (shape === "square") return 0
  if (shape === "pill" || (shape === "auto" && variant === "pill")) return 9999
  return variant === "segmented" || shape === "rounded" ? 8 : 6
}

function listClasses(variant: TabsVariant, shape: TabsShape, vertical: boolean, fullWidth: boolean) {
  const scroll = "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
  if (vertical) {
    return cn(
      "flex shrink-0 flex-col gap-0.5 sm:w-52",
      variant === "vertical-line" && "shadow-[inset_1px_0_0_var(--border)] rtl:shadow-[inset_-1px_0_0_var(--border)]",
      variant === "underline" && "shadow-[inset_-1px_0_0_var(--border)] rtl:shadow-[inset_1px_0_0_var(--border)]",
      variant === "segmented" && cn("bg-muted p-1", shape === "pill" ? "rounded-3xl" : shape === "square" ? "rounded-none" : "rounded-xl"),
    )
  }
  switch (variant) {
    case "segmented":
      return cn(fullWidth ? "flex" : "inline-flex max-w-full self-start", "gap-1 bg-muted p-1", scroll, shape === "pill" ? "rounded-full" : shape === "square" ? "rounded-none" : "rounded-xl")
    case "underline":
      return cn("flex gap-1 shadow-[inset_0_-1px_0_var(--border)]", scroll)
    case "enclosed":
      return cn("flex gap-0.5 px-1 shadow-[inset_0_-1px_0_var(--border)]", scroll)
    default:
      return cn("flex gap-1", scroll)
  }
}

// Optional UI sound: the sound module is loaded only when `sound` is on, so silent apps pay nothing.
function useCue(sound: boolean | SoundName | undefined) {
  React.useEffect(() => {
    if (sound) void import("@/lib/goodui-sounds")
  }, [sound])
  return React.useCallback(
    (fallback: SoundName, o?: { rate?: number; exact?: boolean }) => {
      if (!sound) return
      void import("@/lib/goodui-sounds").then((m) => m.play(sound === true || o?.exact ? fallback : sound, { rate: o?.rate }))
    },
    [sound],
  )
}

export function Tabs({
  value: valueProp,
  defaultValue,
  onValueChange,
  variant = "underline",
  tone = "primary",
  indicator = "slide",
  transition = "slide",
  sound,
  size = "md",
  shape = "auto",
  shadow = "none",
  orientation = "horizontal",
  fullWidth = false,
  items,
  listLabel,
  className,
  children,
  ...props
}: TabsProps) {
  const uid = React.useId()
  const prefersReduced = useReducedMotion()
  const cue = useCue(sound)
  // Gate reduced motion behind mount so the first client render matches the server (it picks motion.span vs span).
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const reduce = mounted && !!prefersReduced
  const listRef = React.useRef<HTMLDivElement>(null)
  const [inner, setInner] = React.useState(defaultValue ?? items?.find((i) => !i.disabled)?.value ?? "")
  const controlled = valueProp !== undefined
  const value = controlled ? valueProp : inner
  const [dir, setDir] = React.useState<1 | -1>(1)
  const [touched, setTouched] = React.useState(false)
  const vertical = variant === "vertical-line" || (orientation === "vertical" && variant !== "enclosed")

  const select = React.useCallback(
    (next: string, focus = false) => {
      const tabs = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]") ?? [])
      const from = tabs.findIndex((t) => t.dataset.value === value)
      const to = tabs.findIndex((t) => t.dataset.value === next)
      if (focus) tabs[to]?.focus()
      if (next === value) return
      setDir(to < from ? -1 : 1)
      setTouched(true)
      if (!controlled) setInner(next)
      onValueChange?.(next)
      cue("tick")
    },
    [value, controlled, onValueChange, cue],
  )
  // Uncontrolled tabs without a default pick the first enabled tab once the list has mounted.
  const ensure = React.useCallback((first: string) => {
    if (!controlled) setInner((v) => v || first)
  }, [controlled])

  const [panels, setPanels] = React.useState<Record<string, true>>({})
  const registerPanel = React.useCallback((v: string) => {
    setPanels((p) => (p[v] ? p : { ...p, [v]: true }))
    return () =>
      setPanels((p) => {
        if (!p[v]) return p
        const next = { ...p }
        delete next[v]
        return next
      })
  }, [])

  const ctx: Ctx = { value, select, ensure, uid, variant, indicator, transition, size, shape, shadow, vertical, fullWidth, dir, touched, reduce, listRef, panels, registerPanel }

  return (
    <TabsContext.Provider value={ctx}>
      <GooduiTokens />
      <style href="pc-tabs" precedence="default">
        {CSS}
      </style>
      <div
        data-slot="tabs"
        data-variant={variant}
        data-tone={tone}
        data-orientation={vertical ? "vertical" : "horizontal"}
        className={cn("pc-tabs flex min-w-0", vertical ? "flex-col gap-4 sm:flex-row sm:gap-6" : cn("flex-col", variant === "enclosed" ? "gap-0" : "gap-3"), className)}
        {...props}
      >
        {children ??
          (items && (
            <>
              <TabsList aria-label={listLabel}>
                {items.map((it) => (
                  <TabsTrigger key={it.value} value={it.value} icon={it.icon} count={it.count} disabled={it.disabled}>
                    {it.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {items.map((it) =>
                it.content !== undefined ? (
                  <TabsContent key={it.value} value={it.value}>
                    {it.content}
                  </TabsContent>
                ) : null,
              )}
            </>
          ))}
      </div>
    </TabsContext.Provider>
  )
}

export type TabsListProps = React.ComponentProps<"div">

export function TabsList({ className, onKeyDown, children, ...props }: TabsListProps) {
  const ctx = useTabs("TabsList")
  const { ensure, listRef } = ctx

  React.useEffect(() => {
    const first = listRef.current?.querySelector<HTMLButtonElement>("[role=tab]:not(:disabled)")
    if (first?.dataset.value) ensure(first.dataset.value)
  }, [ensure, listRef])

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented) return
    const tabs = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]:not(:disabled)") ?? [])
    if (!tabs.length) return
    const i = tabs.findIndex((t) => t === document.activeElement)
    const rtl = !!listRef.current && getComputedStyle(listRef.current).direction === "rtl"
    const back = rtl ? "ArrowRight" : "ArrowLeft"
    const fwd = rtl ? "ArrowLeft" : "ArrowRight"
    const prev = ["ArrowUp", back]
    const next = ["ArrowDown", fwd]
    let to = -1
    if (next.includes(e.key)) to = (i + 1) % tabs.length
    else if (prev.includes(e.key)) to = (i - 1 + tabs.length) % tabs.length
    else if (e.key === "Home") to = 0
    else if (e.key === "End") to = tabs.length - 1
    if (to < 0) return
    e.preventDefault()
    const v = tabs[to]?.dataset.value
    if (v) ctx.select(v, true)
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-orientation={ctx.vertical ? "vertical" : "horizontal"}
      data-slot="tabs-list"
      data-variant={ctx.variant}
      onKeyDown={onKey}
      className={cn("pc-tabs-list relative", listClasses(ctx.variant, ctx.shape, ctx.vertical, ctx.fullWidth), className)}
      {...props}
    >
      {children}
    </div>
  )
}

export type TabsTriggerProps = Omit<React.ComponentProps<"button">, "value"> & {
  /** Matches the TabsContent with the same value. */
  value: string
  /** Icon before the label. */
  icon?: React.ReactNode
  /** Small count after the label. */
  count?: React.ReactNode
}

const safeId = (s: string) => s.replace(/[^\w-]/g, "_")

export function TabsTrigger({ value, icon, count, className, children, disabled, onClick, ...props }: TabsTriggerProps) {
  const ctx = useTabs("TabsTrigger")
  const active = ctx.value === value
  const radius = triggerRadius(ctx.variant, ctx.shape, ctx.vertical)
  const indProps = {
    "data-variant": ctx.variant,
    "data-shadow": ctx.shadow === "none" ? undefined : ctx.shadow,
    "data-full": ctx.fullWidth || undefined,
    "data-vertical": ctx.vertical || undefined,
    "aria-hidden": true,
  }
  const slide = ctx.indicator === "slide" && !ctx.reduce
  const radius_ = markerRadius(ctx.variant, ctx.shape)

  return (
    <button
      type="button"
      role="tab"
      id={`${ctx.uid}-tab-${safeId(value)}`}
      aria-selected={active}
      aria-controls={ctx.panels[value] ? `${ctx.uid}-panel-${safeId(value)}` : undefined}
      tabIndex={active ? 0 : -1}
      data-slot="tabs-trigger"
      data-value={value}
      data-state={active ? "active" : "inactive"}
      data-variant={ctx.variant}
      disabled={disabled}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented) ctx.select(value)
      }}
      className={cn(
        "pc-press pc-press-soft pc-tabs-trigger relative inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap outline-none select-none",
        "focus-visible:ring-3 focus-visible:ring-[color-mix(in_oklab,var(--pc-c)_40%,transparent)] focus-visible:ring-inset disabled:pointer-events-none disabled:opacity-45",
        "[&_svg]:shrink-0 [&_svg]:pointer-events-none",
        ctx.indicator !== "none" && "transition-[color,background-color] duration-200",
        SIZES[ctx.size],
        radius,
        ctx.vertical && "w-full justify-start",
        ctx.vertical && ctx.variant === "vertical-line" && "ps-4",
        ctx.fullWidth && !ctx.vertical && "flex-1",
        className,
      )}
      {...props}
    >
      <GooduiTokens />
      {active &&
        (slide ? (
          <motion.span
            layoutId={`${ctx.uid}-indicator`}
            className="pc-tabs-ind"
            style={radius_ === undefined ? undefined : { borderRadius: radius_ }}
            transition={spring.snap}
            {...indProps}
          />
        ) : (
          <span className="pc-tabs-ind" data-anim={ctx.indicator === "fade" && ctx.touched ? "fade" : undefined} {...indProps} />
        ))}
      <span className="relative z-[1] inline-flex min-w-0 items-center gap-[inherit]">
        {icon}
        {children}
        {count != null && (
          <span data-slot="tabs-count" className={cn("pc-tabs-count inline-flex items-center justify-center rounded-full font-semibold tabular-nums", COUNT_SIZES[ctx.size])}>
            {typeof count === "number" ? <NumberFlow value={count} /> : count}
          </span>
        )}
      </span>
    </button>
  )
}

export type TabsContentProps = React.ComponentProps<"div"> & {
  /** Shown when the TabsTrigger with this value is active. */
  value: string
  /** Keep the panel in the DOM (hidden) when inactive, e.g. to preserve form state. */
  keepMounted?: boolean
}

export function TabsContent({ value, keepMounted, className, children, ...props }: TabsContentProps) {
  const ctx = useTabs("TabsContent")
  const active = ctx.value === value
  const inDom = active || !!keepMounted
  const { registerPanel } = ctx
  React.useEffect(() => (inDom ? registerPanel(value) : undefined), [inDom, value, registerPanel])
  if (!inDom) return null
  const animated = ctx.touched && !ctx.reduce && ctx.transition !== "none"
  return (
    <div
      role="tabpanel"
      id={`${ctx.uid}-panel-${safeId(value)}`}
      aria-labelledby={`${ctx.uid}-tab-${safeId(value)}`}
      hidden={!active}
      tabIndex={0}
      data-slot="tabs-content"
      data-state={active ? "active" : "inactive"}
      data-transition={animated ? ctx.transition : undefined}
      data-dir={ctx.dir > 0 ? "next" : "prev"}
      className={cn(
        "pc-tabs-content min-w-0 flex-1 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        ctx.variant === "enclosed" && "rounded-t-none rounded-b-lg border border-t-0 bg-card p-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
