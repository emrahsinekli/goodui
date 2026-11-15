"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

/*
 * Toggle group, independent layers: every axis combines with every other.
 *   type       single (pick one, a radiogroup) or multiple (each button toggles, aria-pressed)
 *   variant    outline, soft, solid, segmented, neo, glass      tone       active color
 *   animation  slide (the active marker glides; single only), fade, pop, none
 *   shape, size, shadow, orientation, attached (outline and neo share borders), fullWidth
 * Keyboard: one tab stop (roving tabindex). Arrows move between enabled items and wrap, flipped under dir="rtl";
 * Home / End jump to the ends. In single mode arrows also select (the radio pattern); in multiple mode Space or
 * Enter toggles the focused item.
 */

export type ToggleGroupVariant = "outline" | "soft" | "solid" | "segmented" | "neo" | "glass"
export type ToggleGroupTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type ToggleGroupSize = "sm" | "md" | "lg"
export type ToggleGroupShape = "square" | "rounded" | "pill"
export type ToggleGroupShadow = "none" | "sm" | "md" | "glow"
export type ToggleGroupAnimation = "none" | "slide" | "fade" | "pop"

export type ToggleGroupOption = {
  value: string
  label?: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
  /** Required when the item has only an icon. */
  "aria-label"?: string
  /** Native tooltip, handy for icon-only items. */
  title?: string
}

type Base = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange" | "dir"> & {
  /** Shortcut: renders a ToggleGroupItem per option. Or pass <ToggleGroupItem> children. */
  items?: ToggleGroupOption[]
  /** How the group is painted. outline and neo draw joined buttons; soft, solid, segmented and glass sit in a track. */
  variant?: ToggleGroupVariant
  /** Color of the active item. */
  tone?: ToggleGroupTone
  size?: ToggleGroupSize
  shape?: ToggleGroupShape
  /** Group shadow; glow puts a tone-colored glow under the active marker instead. */
  shadow?: ToggleGroupShadow
  /** slide glides one marker between items (single only; multiple falls back to fade). Reduced motion snaps. */
  animation?: ToggleGroupAnimation
  orientation?: "horizontal" | "vertical"
  /** outline and neo: buttons share borders in one box. false spaces them apart. */
  attached?: boolean
  /** Items share the full width equally. */
  fullWidth?: boolean
  /** Disables every item. */
  disabled?: boolean
  /** Form field name (renders hidden inputs with the selected values). */
  name?: string
}
export type ToggleGroupSingleProps = Base & {
  /** single: one value (a radiogroup). multiple: any number (each item has aria-pressed). */
  type?: "single"
  /** Selected value (controlled): a string or null; string[] with type="multiple". */
  value?: string | null
  /** Initial value when uncontrolled. */
  defaultValue?: string | null
  /** Called with the new value (string | null, or string[] with type="multiple"). */
  onValueChange?: (value: string | null) => void
  /** single: clicking the active item clears the value. */
  deselectable?: boolean
}
export type ToggleGroupMultipleProps = Base & {
  type: "multiple"
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  deselectable?: never
}
export type ToggleGroupProps = ToggleGroupSingleProps | ToggleGroupMultipleProps

type Ctx = {
  multiple: boolean
  selected: string[]
  toggle: (v: string) => void
  stop: string | null
  onItemFocus: (v: string) => void
  uid: string
  variant: ToggleGroupVariant
  size: ToggleGroupSize
  shape: ToggleGroupShape
  shadow: ToggleGroupShadow
  animation: ToggleGroupAnimation
  attached: boolean
  fullWidth: boolean
  vertical: boolean
  disabled: boolean
  slide: boolean
  touched: boolean
}
const ToggleGroupContext = React.createContext<Ctx | null>(null)

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

const R = ".pc-tg"
const I = ".pc-tg-item"
const ON = "[data-state=on]"
const CSS = `${tones("pc-tg")}
${R}{--pc-muted:color-mix(in oklab,var(--muted-foreground) 82%,var(--foreground))}
${I}{color:var(--pc-muted);-webkit-tap-highlight-color:transparent}
${I}:hover:not(${ON}):not(:disabled){color:var(--foreground);background:color-mix(in oklab,var(--foreground) 5%,transparent)}
${I}${ON}{color:var(--foreground)}
.pc-tg-ind{position:absolute;inset:0;pointer-events:none;border-radius:inherit}

${R}[data-variant=outline][data-attached]{background:var(--background);border:1px solid var(--border)}
${R}[data-variant=outline][data-attached] ${I}+${I}{border-inline-start:1px solid var(--border)}
${R}[data-variant=outline][data-attached][data-vertical] ${I}+${I}{border-inline-start:0;border-top:1px solid var(--border)}
${R}[data-variant=outline]:not([data-attached]) ${I}{background:var(--background);border:1px solid var(--border)}
${R}[data-variant=outline] ${I}${ON}{color:var(--pc-ink)}
${R}[data-variant=outline] .pc-tg-ind{background:var(--pc-tint);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--pc-c) 45%,transparent)}

${R}[data-variant=soft] ${I}${ON}{color:var(--pc-ink)}
${R}[data-variant=soft] .pc-tg-ind{background:var(--pc-tint)}

${R}:is([data-variant=solid],[data-variant=segmented]){background:var(--muted)}
${R}[data-variant=solid] ${I}${ON}{color:var(--pc-fg)}
${R}[data-variant=solid] .pc-tg-ind{background:var(--pc-c)}
${R}[data-variant=segmented] .pc-tg-ind{background:var(--background);box-shadow:0 1px 2px rgb(0 0 0/.08),0 0 0 1px color-mix(in oklab,var(--foreground) 6%,transparent)}
.dark ${R}[data-variant=segmented] .pc-tg-ind{background:color-mix(in oklab,var(--foreground) 12%,var(--background))}
${R}[data-variant=segmented] ${I}${ON}{color:var(--foreground)}

${R}[data-variant=neo][data-attached]{background:var(--background);border:2px solid var(--foreground);box-shadow:3px 3px 0 var(--foreground)}
${R}[data-variant=neo][data-attached] ${I}+${I}{border-inline-start:2px solid var(--foreground)}
${R}[data-variant=neo][data-attached][data-vertical] ${I}+${I}{border-inline-start:0;border-top:2px solid var(--foreground)}
${R}[data-variant=neo]:not([data-attached]) ${I}{background:var(--background);border:2px solid var(--foreground);box-shadow:2px 2px 0 var(--foreground)}
${R}[data-variant=neo]:not([data-attached]) ${I}:active:not(:disabled){transform:translate(2px,2px);box-shadow:0 0 0 var(--foreground)}
${R}[data-variant=neo] ${I}{color:var(--foreground)}
${R}[data-variant=neo] ${I}${ON}{color:var(--pc-fg)}
${R}[data-variant=neo] .pc-tg-ind{background:var(--pc-c)}

${R}[data-variant=glass]{background:color-mix(in oklab,var(--background) 40%,transparent);border:1px solid color-mix(in oklab,var(--foreground) 14%,transparent);-webkit-backdrop-filter:blur(14px) saturate(1.6);backdrop-filter:blur(14px) saturate(1.6)}
${R}[data-variant=glass] ${I}{color:color-mix(in oklab,var(--foreground) 75%,transparent)}
${R}[data-variant=glass] ${I}${ON}{color:var(--foreground)}
${R}[data-variant=glass] .pc-tg-ind{background:color-mix(in oklab,var(--background) 78%,transparent);box-shadow:0 2px 8px -2px rgb(0 0 0/.18),inset 0 1px 0 color-mix(in oklab,white 50%,transparent)}

${R}[data-shadow=sm]{box-shadow:0 1px 3px rgb(0 0 0/.1)}
${R}[data-shadow=md]{box-shadow:0 6px 18px -6px rgb(0 0 0/.22)}
${R}[data-shadow=glow] .pc-tg-ind{box-shadow:0 0 0 1px color-mix(in oklab,var(--pc-c) 30%,transparent),0 6px 20px -4px color-mix(in oklab,var(--pc-c) 65%,transparent)}

${R}:not([data-anim=none]) ${I}{transition:color .2s,background-color .2s,transform .12s,box-shadow .12s}
${R}:not([data-anim=none]):not([data-variant=neo]) ${I}:active:not(:disabled){transform:scale(.96)}
.pc-tg-ind[data-anim=fade]{animation:pc-tg-fade .2s ease-out}
.pc-tg-ind[data-anim=pop]{animation:pc-tg-pop .34s var(--pc-ease-spring)}
@keyframes pc-tg-fade{from{opacity:0;transform:scale(.94)}}
@keyframes pc-tg-pop{0%{opacity:0;transform:scale(.6)}100%{opacity:1;transform:scale(1)}}
@media (prefers-reduced-motion:reduce){
  ${R} ${I},.pc-tg-ind{transition:none!important;animation:none!important}
  ${R} ${I}:active{transform:none!important}
}
`

const SIZES: Record<ToggleGroupSize, string> = {
  sm: "h-8 gap-1.5 px-2.5 text-[13px] [&_svg]:size-3.5",
  md: "h-9 gap-2 px-3 text-sm [&_svg]:size-4",
  lg: "h-11 gap-2 px-4 text-[15px] [&_svg]:size-[18px]",
}
const ICON_ONLY: Record<ToggleGroupSize, string> = { sm: "w-8 px-0", md: "w-9 px-0", lg: "w-11 px-0" }
const TRACK = (v: ToggleGroupVariant) => v === "solid" || v === "segmented" || v === "glass"

function radius(variant: ToggleGroupVariant, shape: ToggleGroupShape, attached: boolean, part: "root" | "item") {
  if (shape === "square") return "rounded-none"
  if (shape === "pill") return "rounded-full"
  const joined = attached && (variant === "outline" || variant === "neo")
  if (part === "root") return TRACK(variant) ? "rounded-xl" : joined ? (variant === "neo" ? "rounded-md" : "rounded-lg") : "rounded-lg"
  return joined ? "rounded-none" : TRACK(variant) ? "rounded-lg" : variant === "neo" ? "rounded-md" : "rounded-lg"
}

function indRadius(ctx: Ctx) {
  if (ctx.shape === "pill") return 9999
  if (ctx.shape === "square" || (ctx.attached && (ctx.variant === "outline" || ctx.variant === "neo"))) return 0
  return ctx.variant === "neo" ? 6 : 8
}

export function ToggleGroup(props: ToggleGroupProps) {
  const {
    type,
    items,
    variant = "outline",
    tone = "primary",
    size = "md",
    shape = "rounded",
    shadow = "none",
    animation = "slide",
    orientation = "horizontal",
    attached = true,
    fullWidth = false,
    disabled = false,
    name,
    value: valueProp,
    defaultValue,
    onValueChange,
    deselectable,
    className,
    children,
    onKeyDown,
    ...rest
  } = props
  const multiple = type === "multiple"
  const uid = React.useId()
  const prefersReduced = useReducedMotion()
  // Gate reduced motion behind mount so server and first client render match.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const reduce = mounted && !!prefersReduced
  const [touched, setTouched] = React.useState(false)

  const [inner, setInner] = React.useState<string | string[] | null | undefined>(defaultValue)
  const current = valueProp !== undefined ? valueProp : inner
  const selected: string[] = Array.isArray(current) ? current : current ? [current] : []
  const commit = (next: string[]) => {
    const v = multiple ? next : (next[0] ?? null)
    setTouched(true)
    if (valueProp === undefined) setInner(v)
    ;(onValueChange as ((v: string | string[] | null) => void) | undefined)?.(v)
  }
  const toggle = (v: string) => {
    if (multiple) commit(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v])
    else if (selected[0] === v) {
      if (deselectable) commit([])
    } else commit([v])
  }

  // Roving tabindex: the selected item (single) or the last focused one (multiple) holds the only tab stop.
  const root = React.useRef<HTMLDivElement>(null)
  const lastFocus = React.useRef<string | null>(null)
  const [stop, setStop] = React.useState<string | null>(null)
  const enabled = () => Array.from(root.current?.querySelectorAll<HTMLButtonElement>("[data-slot=toggle-group-item]:not(:disabled)") ?? [])
  React.useLayoutEffect(() => {
    const els = enabled()
    const pick = multiple
      ? (els.find((b) => b.dataset.value === lastFocus.current) ?? els[0])
      : (els.find((b) => b.dataset.state === "on") ?? els.find((b) => b.dataset.value === lastFocus.current) ?? els[0])
    const v = pick?.dataset.value ?? null
    if (v !== stop) setStop(v)
  })

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented) return
    const els = enabled()
    if (!els.length) return
    const i = els.findIndex((b) => b === document.activeElement)
    if (i < 0) return
    const rtl = !!root.current && getComputedStyle(root.current).direction === "rtl"
    const next = ["ArrowDown", rtl ? "ArrowLeft" : "ArrowRight"]
    const prev = ["ArrowUp", rtl ? "ArrowRight" : "ArrowLeft"]
    let to = -1
    if (next.includes(e.key)) to = (i + 1) % els.length
    else if (prev.includes(e.key)) to = (i - 1 + els.length) % els.length
    else if (e.key === "Home") to = 0
    else if (e.key === "End") to = els.length - 1
    if (to < 0) return
    e.preventDefault()
    const el = els[to]!
    el.focus()
    const v = el.dataset.value
    if (!multiple && v && selected[0] !== v) commit([v])
  }

  const vertical = orientation === "vertical"
  const ctx: Ctx = {
    multiple,
    selected,
    toggle,
    stop,
    onItemFocus: (v) => {
      lastFocus.current = v
    },
    uid,
    variant,
    size,
    shape,
    shadow,
    animation,
    attached,
    fullWidth,
    vertical,
    disabled,
    slide: animation === "slide" && !multiple && !reduce,
    touched,
  }
  const joined = attached && (variant === "outline" || variant === "neo")

  return (
    <ToggleGroupContext.Provider value={ctx}>
      <GooduiTokens />
      <style href="pc-toggle-group" precedence="default">
        {CSS}
      </style>
      <div
        {...rest}
        ref={root}
        role={multiple ? "group" : "radiogroup"}
        aria-disabled={disabled || undefined}
        data-slot="toggle-group"
        data-variant={variant}
        data-tone={tone}
        data-shadow={variant === "neo" && shadow !== "glow" ? "none" : shadow}
        data-anim={animation}
        data-attached={joined ? "" : undefined}
        data-vertical={vertical ? "" : undefined}
        onKeyDown={onKey}
        className={cn(
          "pc-tg relative max-w-full",
          fullWidth ? "flex w-full" : "inline-flex",
          vertical ? "flex-col items-stretch" : "items-center",
          joined ? "overflow-hidden" : TRACK(variant) ? "gap-1 p-1" : variant === "neo" ? "gap-2" : "gap-1",
          radius(variant, shape, attached, "root"),
          className,
        )}
      >
        {items?.map((o) => (
          <ToggleGroupItem key={o.value} value={o.value} icon={o.icon} disabled={o.disabled} aria-label={o["aria-label"]} title={o.title}>
            {o.label}
          </ToggleGroupItem>
        ))}
        {children}
        {name && selected.map((v) => <input key={v} type="hidden" name={name} value={v} />)}
      </div>
    </ToggleGroupContext.Provider>
  )
}

export type ToggleGroupItemProps = Omit<React.ComponentProps<"button">, "value"> & {
  /** Value reported to the group. */
  value: string
  /** Icon before the label; with no label the item becomes square (pass aria-label). */
  icon?: React.ReactNode
}

export function ToggleGroupItem({ value, icon, className, children, disabled, onClick, onFocus, ...props }: ToggleGroupItemProps) {
  const ctx = React.useContext(ToggleGroupContext)
  if (!ctx) throw new Error("<ToggleGroupItem> must be used inside <ToggleGroup>")
  const on = ctx.selected.includes(value)
  const off = disabled || ctx.disabled
  const iconOnly = !!icon && (children == null || children === false || children === "")
  const indAnim = ctx.touched && ctx.animation !== "none" ? (ctx.animation === "pop" ? "pop" : "fade") : undefined

  return (
    <button
      type="button"
      role={ctx.multiple ? undefined : "radio"}
      aria-checked={ctx.multiple ? undefined : on}
      aria-pressed={ctx.multiple ? on : undefined}
      tabIndex={ctx.stop == null || ctx.stop === value ? 0 : -1}
      data-slot="toggle-group-item"
      data-value={value}
      data-state={on ? "on" : "off"}
      disabled={off}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented) ctx.toggle(value)
      }}
      onFocus={(e) => {
        onFocus?.(e)
        ctx.onItemFocus(value)
      }}
      className={cn(
        "pc-press pc-press-soft pc-tg-item relative inline-flex shrink-0 cursor-pointer items-center justify-center font-medium whitespace-nowrap outline-none select-none",
        "focus-visible:z-[2] focus-visible:ring-3 focus-visible:ring-[color-mix(in_oklab,var(--pc-c)_40%,transparent)] focus-visible:ring-inset disabled:pointer-events-none disabled:opacity-45",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        SIZES[ctx.size],
        iconOnly && !ctx.fullWidth && ICON_ONLY[ctx.size],
        radius(ctx.variant, ctx.shape, ctx.attached, "item"),
        (ctx.fullWidth || ctx.vertical) && "flex-1",
        ctx.vertical && !iconOnly && "justify-start",
        className,
      )}
      {...props}
    >
      <GooduiTokens />
      {on &&
        (ctx.slide ? (
          <motion.span
            layoutId={`${ctx.uid}-ind`}
            aria-hidden="true"
            className="pc-tg-ind"
            // An explicit radius lets motion correct the corners while the marker scales between items of different widths.
            style={{ borderRadius: indRadius(ctx) }}
            transition={spring.snap}
          />
        ) : (
          <span aria-hidden="true" className="pc-tg-ind" data-anim={indAnim} />
        ))}
      <span className="relative z-[1] inline-flex min-w-0 items-center gap-[inherit]">
        {icon}
        {children}
      </span>
    </button>
  )
}
