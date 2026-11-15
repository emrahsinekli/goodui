"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import type { SoundName } from "@/lib/goodui-sounds"
import { GooduiTokens } from "@/lib/goodui-motion"

/*
 * Rating input and read-only display, independent layers: every axis combines with every other.
 *   variant    solid, soft, outline, glow, neo        tone       fill color (warning = classic gold, the default)
 *   icon       star, heart, circle, bolt, diamond or any icon node                  size  xs … xl
 *   animation  none, fill (smooth clip), pop (picked icon bounces), wave (icons pop one after another)
 * Whole steps render a radiogroup (one radio per icon, roving focus). Half steps render a slider, because a radio per
 * half icon reads badly. Read-only renders role="img" and shows exact fractions (4.3 fills 30% of the fifth star).
 * The fill grows from the inline start, so it runs right-to-left under dir="rtl" and arrow keys flip with it.
 */

export type RatingVariant = "solid" | "soft" | "outline" | "glow" | "neo"
export type RatingTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type RatingSize = "xs" | "sm" | "md" | "lg" | "xl"
export type RatingAnimation = "none" | "fill" | "pop" | "wave"
export type RatingIcon = "star" | "heart" | "circle" | "bolt" | "diamond"

export type RatingLabels = {
  /** Accessible name of the control when no aria-label is passed. */
  group: string
  /** Name of one radio (whole steps). */
  item: (n: number, max: number) => string
  /** Spoken value of the slider (half steps). */
  valueText: (value: number, max: number) => string
  /** Accessible name in read-only mode. */
  readOnly: (value: number, max: number) => string
  /** Visible count next to the icons. */
  count: (count: number) => string
  /** Spoken count. */
  countSr: (count: number) => string
}
const nf = new Intl.NumberFormat("en-US")
const DEFAULT_LABELS: RatingLabels = {
  group: "Rating",
  item: (n) => `${n} ${n === 1 ? "star" : "stars"}`,
  valueText: (v, max) => (v ? `${v} out of ${max}` : "No rating"),
  readOnly: (v, max) => `Rated ${v} out of ${max}`,
  count: (c) => `(${nf.format(c)})`,
  countSr: (c) => `${nf.format(c)} ${c === 1 ? "review" : "reviews"}`,
}

export type RatingProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange" | "children" | "dir"> & {
  /** Current rating (controlled); 0 means no rating. */
  value?: number
  /** Initial rating when uncontrolled. */
  defaultValue?: number
  /** Called with the new rating; 0 after clearing. */
  onValueChange?: (value: number) => void
  /** Number of icons. */
  max?: number
  /** 1 for whole icons (radiogroup), 0.5 for half steps (slider). */
  precision?: 1 | 0.5
  /** Display only: no hover or focus, shows exact fractions. */
  readOnly?: boolean
  disabled?: boolean
  /** Picking the current value again, Backspace, Delete or 0 clears the rating. */
  clearable?: boolean
  /** Fill previews under the pointer before you click. */
  hoverPreview?: boolean
  /** Plays a "tick" per icon under the pointer (pitched up along the row) and a "pop" on pick, when the visitor has sounds on (lib/goodui-sounds); a sound name replaces the pop. Off by default. */
  sound?: boolean | SoundName
  /** Built-in icon name, or your own icon node (a lucide icon works: it gets filled with CSS). */
  icon?: RatingIcon | React.ReactNode
  /** Different icon for the empty state; defaults to `icon`. */
  emptyIcon?: React.ReactNode
  /** How icons are painted: solid (default), soft (tinted empties), outline (stroked empties), glow, or neo. */
  variant?: RatingVariant
  /** Fill color. Defaults to warning, the classic gold. */
  tone?: RatingTone
  size?: RatingSize
  /** What moves when the rating changes. Reduced motion turns all of it off. */
  animation?: RatingAnimation
  /** Shows the number ("4.5") after the icons. */
  showValue?: boolean
  /** Review count shown after the value, e.g. 1284 → "(1,284)". */
  count?: number
  /** Word per icon ("Poor" … "Excellent"); read with the radios and shown when showLabel is set. */
  itemLabels?: string[]
  /** Shows the word for the current or hovered value after the icons. */
  showLabel?: boolean
  /** Form field name (renders a hidden input with the number). */
  name?: string
  /** Class for the icon row. */
  iconsClassName?: string
  /** Text for screen readers and the count; pass translations here. */
  labels?: Partial<RatingLabels>
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

const R = ".pc-rating"
const CSS = `${tones("pc-rating")}
${R}{--pc-e:color-mix(in oklab,var(--foreground) 13%,transparent);--pc-es:var(--pc-e);--pc-esw:1px;--pc-fs:var(--pc-c);--pc-fsw:1px}
${R}[data-variant=soft]{--pc-e:color-mix(in oklab,var(--pc-c) 22%,transparent);--pc-es:var(--pc-e)}
${R}[data-variant=outline]{--pc-e:transparent;--pc-es:color-mix(in oklab,var(--foreground) 32%,transparent);--pc-esw:1.5px}
${R}[data-variant=neo]{--pc-e:var(--background);--pc-es:var(--foreground);--pc-esw:1.75px;--pc-fs:var(--foreground);--pc-fsw:1.75px}
.pc-rating-ico{display:grid;place-items:center;width:100%;height:100%}
.pc-rating-ico svg{width:100%;height:100%;overflow:visible;stroke-linejoin:round;stroke-linecap:round}
.pc-rating-empty svg{fill:var(--pc-e);stroke:var(--pc-es);stroke-width:var(--pc-esw)}
.pc-rating-fill{position:absolute;inset:0;clip-path:inset(-20% calc(100% - var(--pc-f)) -20% -20%)}
.pc-rating-fill:dir(rtl){clip-path:inset(-20% -20% -20% calc(100% - var(--pc-f)))}
.pc-rating-fill svg{fill:var(--pc-c);stroke:var(--pc-fs);stroke-width:var(--pc-fsw)}
${R}[data-variant=glow] .pc-rating-fill svg{filter:drop-shadow(0 0 5px color-mix(in oklab,var(--pc-c) 70%,transparent))}
${R}[data-preview] .pc-rating-fill{opacity:.72}
.pc-rating-item{position:relative;-webkit-tap-highlight-color:transparent;outline:none;border-radius:6px}
.pc-rating-item:focus-visible,.pc-rating-icons:focus-visible{box-shadow:0 0 0 3px color-mix(in oklab,var(--pc-c) 40%,transparent)}
.pc-rating-icons{outline:none;border-radius:8px}
${R}:not([data-anim=none]) .pc-rating-fill{transition:clip-path .28s var(--pc-ease-out),opacity .15s}
${R}:not([data-anim=none]) .pc-rating-item{transition:transform .18s var(--pc-ease-out)}
${R}:not([data-anim=none]) .pc-rating-item[data-hover]{transform:scale(1.14)}
.pc-rating-meta{color:color-mix(in oklab,var(--muted-foreground) 85%,var(--foreground))}
@media (prefers-reduced-motion:reduce){
  ${R} .pc-rating-fill,${R} .pc-rating-item{transition:none!important;animation:none!important}
  ${R} .pc-rating-item[data-hover]{transform:none!important}
}
`

const ICONS: Record<RatingIcon, string> = {
  star: "M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.45l-5.8 3.05 1.1-6.45-4.7-4.6 6.5-.95z",
  heart: "M12 20.4s-7.6-4.7-9.3-9.2C1.6 8.1 3.5 4.4 7.1 4.4c2 0 3.7 1.1 4.9 2.9 1.2-1.8 2.9-2.9 4.9-2.9 3.6 0 5.5 3.7 4.4 6.8-1.7 4.5-9.3 9.2-9.3 9.2z",
  circle: "M12 3.4a8.6 8.6 0 1 0 0 17.2 8.6 8.6 0 1 0 0-17.2z",
  bolt: "M13.6 2.4 4.4 13.6h6.8l-1 8 9.4-11.4h-6.8z",
  diamond: "M12 2.6 20.4 12 12 21.4 3.6 12z",
}

const SIZES: Record<RatingSize, { icon: string; gap: string; text: string }> = {
  xs: { icon: "size-3.5", gap: "gap-0.5", text: "text-xs" },
  sm: { icon: "size-4", gap: "gap-0.5", text: "text-sm" },
  md: { icon: "size-6", gap: "gap-1", text: "text-sm" },
  lg: { icon: "size-8", gap: "gap-1", text: "text-base" },
  xl: { icon: "size-10", gap: "gap-1.5", text: "text-lg" },
}

const isBuiltIn = (i: unknown): i is RatingIcon => typeof i === "string" && i in ICONS

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

export function Rating({
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  max = 5,
  precision = 1,
  readOnly,
  disabled,
  clearable = true,
  hoverPreview = true,
  sound,
  icon = "star",
  emptyIcon,
  variant = "solid",
  tone = "warning",
  size = "md",
  animation = "pop",
  showValue,
  count,
  itemLabels,
  showLabel,
  name,
  className,
  iconsClassName,
  labels,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: RatingProps) {
  const l = useLabels("rating", DEFAULT_LABELS, labels)
  const [inner, setInner] = React.useState(defaultValue)
  const value = valueProp ?? inner
  const [hover, setHover] = React.useState<number | null>(null)
  const cue = useCue(sound)
  // One tick per icon as the pointer moves along the row, each a little higher than the last.
  const preview = (v: number | null) => {
    if (v !== null && v > 0 && v !== hover) cue("tick", { exact: true, rate: 0.9 + 0.06 * Math.ceil(v) })
    setHover(v)
  }
  const root = React.useRef<HTMLDivElement>(null)
  const items = React.useRef<(HTMLSpanElement | null)[]>([])
  const interactive = !readOnly && !disabled
  const half = precision === 0.5
  const shown = interactive && hoverPreview && hover != null ? hover : value
  const s = SIZES[size]
  const snap = (v: number) => Math.min(max, Math.max(0, Math.round(v / precision) * precision))

  const glyph = (node: RatingIcon | React.ReactNode) =>
    isBuiltIn(node) ? (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d={ICONS[node]} />
      </svg>
    ) : (
      node
    )

  const animate = (v: number) => {
    if (animation !== "pop" && animation !== "wave") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const last = Math.ceil(v) - 1
    const pop = (i: number, delay: number) =>
      items.current[i]?.animate?.([{ transform: "scale(1)" }, { transform: "scale(1.32) rotate(-6deg)" }, { transform: "scale(1)" }], {
        duration: 320,
        delay,
        easing: "cubic-bezier(.34,1.56,.64,1)",
      })
    if (animation === "pop") {
      if (last >= 0) pop(last, 0)
    } else for (let i = 0; i <= last; i++) pop(i, i * 55)
  }

  const commit = (v: number, focus = false) => {
    if (!interactive) return
    const next = snap(v)
    if (valueProp === undefined) setInner(next)
    onValueChange?.(next)
    if (next > 0) cue("pop", { rate: 0.9 + 0.06 * Math.ceil(next) })
    else cue("tick", { exact: true, rate: 0.8 })
    if (next > 0 && next !== value) animate(next)
    if (focus && !half) requestAnimationFrame(() => items.current[Math.max(0, Math.ceil(next) - 1)]?.focus())
  }

  const isRtl = () => !!root.current && getComputedStyle(root.current).direction === "rtl"
  const pointValue = (e: React.PointerEvent | React.MouseEvent, i: number) => {
    const r = e.currentTarget.getBoundingClientRect()
    let f = r.width ? (e.clientX - r.left) / r.width : 1
    if (isRtl()) f = 1 - f
    return half && f <= 0.5 ? i + 0.5 : i + 1
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!interactive) return
    const rtl = isRtl()
    const up = ["ArrowUp", rtl ? "ArrowLeft" : "ArrowRight"]
    const down = ["ArrowDown", rtl ? "ArrowRight" : "ArrowLeft"]
    const floor = clearable ? 0 : precision
    let next: number | null = null
    if (up.includes(e.key)) next = Math.min(max, value + precision)
    else if (down.includes(e.key)) next = Math.max(floor, value - precision)
    else if (e.key === "Home") next = precision
    else if (e.key === "End") next = max
    else if ((e.key === "Backspace" || e.key === "Delete" || e.key === "0") && clearable) next = 0
    else if (/^[1-9]$/.test(e.key) && Number(e.key) <= max) next = Number(e.key)
    else if ((e.key === " " || e.key === "Enter") && !half) {
      const i = items.current.indexOf(document.activeElement as HTMLSpanElement)
      if (i >= 0) next = clearable && value === i + 1 ? 0 : i + 1
    }
    if (next == null) return
    e.preventDefault()
    if (next !== value) commit(next, true)
  }

  const fraction = (i: number) => Math.min(1, Math.max(0, shown - i))
  const display = readOnly ? (Math.round(value * 10) / 10).toFixed(1) : value % 1 ? value.toFixed(1) : String(value)
  const word = itemLabels?.[Math.ceil(shown) - 1] ?? ""
  const focusIndex = Math.max(0, Math.ceil(value) - 1)

  const groupProps: React.HTMLAttributes<HTMLSpanElement> = readOnly
    ? { role: "img", "aria-label": ariaLabel ?? l.readOnly(Math.round(value * 10) / 10, max) }
    : half
      ? {
          role: "slider",
          tabIndex: disabled ? -1 : 0,
          "aria-label": ariaLabelledBy ? undefined : (ariaLabel ?? l.group),
          "aria-labelledby": ariaLabelledBy,
          "aria-valuemin": 0,
          "aria-valuemax": max,
          "aria-valuenow": value,
          "aria-valuetext": l.valueText(value, max),
          "aria-disabled": disabled || undefined,
          onKeyDown,
        }
      : {
          role: "radiogroup",
          "aria-label": ariaLabelledBy ? undefined : (ariaLabel ?? l.group),
          "aria-labelledby": ariaLabelledBy,
          "aria-disabled": disabled || undefined,
          onKeyDown,
        }

  return (
    <>
      <GooduiTokens />
      <style href="pc-rating" precedence="default">
        {CSS}
      </style>
      <div
        {...props}
        ref={root}
        data-slot="rating"
        data-variant={variant}
        data-tone={tone}
        data-anim={animation}
        data-readonly={readOnly ? "" : undefined}
        data-preview={interactive && hoverPreview && hover != null && hover !== value ? "" : undefined}
        className={cn("pc-rating inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1", s.text, disabled && "pointer-events-none opacity-50", className)}
      >
        <span
          {...groupProps}
          data-slot="rating-icons"
          className={cn("pc-rating-icons inline-flex items-center", s.gap, iconsClassName)}
          onPointerLeave={interactive ? () => setHover(null) : undefined}
        >
          {Array.from({ length: max }, (_, i) => {
            const radio = interactive && !half
            return (
              <span
                key={i}
                ref={(el) => {
                  items.current[i] = el
                }}
                data-slot="rating-item"
                data-hover={interactive && hoverPreview && hover != null && Math.ceil(hover) - 1 === i ? "" : undefined}
                role={radio ? "radio" : undefined}
                aria-checked={radio ? value === i + 1 : undefined}
                aria-label={radio ? l.item(i + 1, max) + (itemLabels?.[i] ? `, ${itemLabels[i]}` : "") : undefined}
                aria-hidden={radio ? undefined : true}
                tabIndex={radio ? (i === focusIndex ? 0 : -1) : undefined}
                // Empty and full icons clip 20% past the box so strokes and the glow are never cut at the edge.
                style={{ "--pc-f": fraction(i) === 0 ? "-20%" : fraction(i) === 1 ? "120%" : `${fraction(i) * 100}%` } as React.CSSProperties}
                onPointerMove={interactive ? (e) => preview(pointValue(e, i)) : undefined}
                onClick={
                  interactive
                    ? (e) => {
                        const v = pointValue(e, i)
                        commit(clearable && v === value ? 0 : v)
                        setHover(null)
                      }
                    : undefined
                }
                className={cn("pc-rating-item inline-grid shrink-0", s.icon, interactive && "cursor-pointer")}
              >
                <span className="pc-rating-ico pc-rating-empty">{glyph(emptyIcon ?? icon)}</span>
                <span className="pc-rating-ico pc-rating-fill">{glyph(icon)}</span>
              </span>
            )
          })}
        </span>
        {showValue && (
          <span data-slot="rating-value" aria-hidden={readOnly || undefined} className="font-semibold tabular-nums">
            {display}
          </span>
        )}
        {count != null && (
          <span data-slot="rating-count" className="pc-rating-meta tabular-nums">
            <span aria-hidden="true">{l.count(count)}</span>
            <span className="sr-only">{l.countSr(count)}</span>
          </span>
        )}
        {showLabel && word && (
          <span data-slot="rating-label" aria-hidden="true" className="pc-rating-meta font-medium">
            {word}
          </span>
        )}
        {name && <input type="hidden" name={name} value={value} />}
      </div>
    </>
  )
}
