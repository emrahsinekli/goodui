"use client"

import * as React from "react"
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

export type SliderMark = { value: number; label?: React.ReactNode }

export type SliderTooltipLabels = {
  /** Name of the first thumb in a range. */
  minimum: string
  /** Name of the second thumb in a range. */
  maximum: string
  /** Name of a single thumb when neither thumbLabels nor aria-label is passed. */
  value: string
}
const DEFAULT_LABELS: SliderTooltipLabels = { minimum: "Minimum", maximum: "Maximum", value: "Value" }

export type SliderTooltipProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  /** One value for a single thumb, two for a range. */
  value?: number[]
  /** Initial values when uncontrolled; defaults to [min]. */
  defaultValue?: number[]
  /** Called on every change while dragging or pressing keys, with all thumb values. */
  onValueChange?: (value: number[]) => void
  /** Fires when a drag ends or a key press changes the value (not when the value stays the same, e.g. at a bound). */
  onValueCommit?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  /** Minimum gap between range thumbs, in steps. */
  minStepsBetweenThumbs?: number
  /** Labelled ticks under the track; a mark without a label shows formatValue(value). */
  marks?: SliderMark[]
  /** Draw a dot at every step (only when there are 40 steps or fewer). */
  showSteps?: boolean
  /** Formats the bubble, mark labels and aria-valuetext, e.g. (v) => `$${v}`. */
  formatValue?: (value: number) => string
  /** "auto" shows the bubble while dragging, hovering or keyboard-focused. */
  tooltip?: "auto" | "always" | "never"
  /** Accessible names per thumb, e.g. ["Minimum price", "Maximum price"]. */
  thumbLabels?: string[]
  disabled?: boolean
  /** Form field name; one hidden input per thumb. */
  name?: string
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<SliderTooltipLabels>
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
/** Rolls each digit of an already formatted string, so any formatValue output works. Right-to-left text stays plain. */
function RollingText({ text, reduce }: { text: string; reduce: boolean }) {
  if (/[\u0590-\u08FF]/.test(text)) return <>{text}</>
  const chars = Array.from(text)
  return (
    <span dir="ltr" className="inline-flex whitespace-pre">
      {chars.map((c, i) => {
        const key = chars.length - i
        const d = c >= "0" && c <= "9" ? Number(c) : null
        return d === null ? (
          <span key={key}>{c}</span>
        ) : (
          <span key={key} className="relative inline-block h-[1.2em] w-[1ch] overflow-hidden leading-[1.2em]">
            <motion.span className="absolute inset-x-0 top-0 flex flex-col" initial={false} animate={{ y: `${-d * 1.2}em` }} transition={reduce ? { duration: 0 } : spring.snap}>
              {DIGITS.map((n) => (
                <span key={n} className="h-[1.2em] text-center">
                  {n}
                </span>
              ))}
            </motion.span>
          </span>
        )
      })}
    </span>
  )
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const decimals = (n: number) => (String(n).split(".")[1] ?? "").length
const isRtl = (el: Element | null) => !!el && getComputedStyle(el).direction === "rtl"

/** Range slider built from scratch: one or two thumbs, pointer and keyboard, step snapping, marks and a value bubble. */
export function SliderTooltip({
  value: valueProp,
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  minStepsBetweenThumbs = 0,
  marks,
  showSteps,
  formatValue = (v) => String(v),
  tooltip = "auto",
  thumbLabels,
  disabled,
  name,
  labels,
  className,
  "aria-label": ariaLabel,
  ...props
}: SliderTooltipProps) {
  const l = useLabels("slider-tooltip", DEFAULT_LABELS, labels)
  const prefersReduced = useReducedMotion()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const reduce = mounted && !!prefersReduced
  const [inner, setInner] = React.useState<number[]>(defaultValue ?? [min])
  const values = valueProp ?? inner
  const valuesRef = React.useRef(values)
  React.useLayoutEffect(() => {
    valuesRef.current = values
  })
  const trackRef = React.useRef<HTMLDivElement>(null)
  const thumbRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const [active, setActive] = React.useState<number | null>(null)
  const [hover, setHover] = React.useState<number | null>(null)
  const [kbFocus, setKbFocus] = React.useState<number | null>(null)
  const activeRef = React.useRef<number | null>(null)
  const dragStart = React.useRef<number[] | null>(null)
  const gap = minStepsBetweenThumbs * step
  const pct = (v: number) => ((v - min) / (max - min)) * 100
  // Elastic overdrag, in physical pixels: past an end the bar stretches after the finger and springs back on release.
  const over = useMotionValue(0)
  const trackWidth = React.useRef(1)
  const barX = useTransform(over, (o) => 1 + Math.abs(o) / trackWidth.current)
  const barY = useTransform(over, (o) => 1 - Math.min(0.3, Math.abs(o) / 60))
  const barOrigin = useTransform(over, (o) => (o >= 0 ? 0 : 1))

  const snap = (v: number) => {
    const s = Math.round((v - min) / step) * step + min
    return Number(clamp(s, min, max).toFixed(decimals(step)))
  }
  const bounds = (i: number, vals: number[]) => [i > 0 ? vals[i - 1]! + gap : min, i < vals.length - 1 ? vals[i + 1]! - gap : max] as const

  const setAt = (i: number, raw: number) => {
    const cur = valuesRef.current
    const [lo, hi] = bounds(i, cur)
    const v = clamp(snap(raw), lo, hi)
    if (v === cur[i]) return cur
    const next = cur.slice()
    next[i] = v
    valuesRef.current = next
    if (valueProp === undefined) setInner(next)
    onValueChange?.(next)
    return next
  }

  const fromClientX = (x: number) => {
    const r = trackRef.current!.getBoundingClientRect()
    // Right-to-left tracks start at the right edge.
    const t = isRtl(trackRef.current) ? (r.right - x) / r.width : (x - r.left) / r.width
    return min + clamp(t, 0, 1) * (max - min)
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return
    e.preventDefault()
    const raw = fromClientX(e.clientX)
    const cur = valuesRef.current
    // Pick the closest thumb; on a tie pick by direction so stacked thumbs can separate.
    let idx = 0
    let best = Infinity
    cur.forEach((v, i) => {
      const d = Math.abs(v - raw)
      if (d < best || (d === best && raw > v)) {
        best = d
        idx = i
      }
    })
    activeRef.current = idx
    dragStart.current = cur
    setActive(idx)
    setKbFocus(null)
    setAt(idx, raw)
    e.currentTarget.setPointerCapture(e.pointerId)
    thumbRefs.current[idx]?.focus({ preventScroll: true })
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const i = activeRef.current
    if (i === null) return
    setAt(i, fromClientX(e.clientX))
    if (reduce) return
    const r = trackRef.current!.getBoundingClientRect()
    trackWidth.current = r.width
    const past = e.clientX < r.left ? e.clientX - r.left : e.clientX > r.right ? e.clientX - r.right : 0
    // Only the thumb sitting on that end pulls the bar: a range's other thumb stays put.
    const end = past < 0 !== isRtl(trackRef.current) ? min : max
    over.set(past !== 0 && valuesRef.current[i] === end ? Math.sign(past) * 20 * (1 - Math.exp(-Math.abs(past) / 110)) : 0)
  }

  const end = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeRef.current === null) return
    activeRef.current = null
    setActive(null)
    if (over.get() !== 0) animate(over, 0, spring.play)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    const start = dragStart.current
    dragStart.current = null
    const cur = valuesRef.current
    if (!start || start.length !== cur.length || start.some((v, k) => v !== cur[k])) onValueCommit?.(cur)
  }

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    const big = Math.max(step, (max - min) / 10)
    const v = valuesRef.current[i]
    if (v === undefined) return
    const [lo, hi] = bounds(i, valuesRef.current)
    // In right-to-left the track grows to the left, so Arrow Left increases.
    const dir = isRtl(e.currentTarget) ? -1 : 1
    const map: Record<string, number> = {
      ArrowRight: v + step * dir,
      ArrowUp: v + step,
      ArrowLeft: v - step * dir,
      ArrowDown: v - step,
      PageUp: v + big,
      PageDown: v - big,
      Home: lo,
      End: hi,
    }
    const next = map[e.key]
    if (next === undefined) return
    e.preventDefault()
    setKbFocus(i)
    const prev = valuesRef.current
    const updated = setAt(i, next)
    if (updated !== prev) onValueCommit?.(updated)
  }

  const visible = (i: number) => tooltip === "always" || (tooltip === "auto" && (active === i || hover === i || kbFocus === i))
  const stepCount = (max - min) / step
  const dots = showSteps && stepCount <= 40 ? Array.from({ length: stepCount + 1 }, (_, k) => min + k * step) : []
  const [v0, v1] = values
  const lo = values.length > 1 ? (v0 ?? min) : min
  const hi = values[values.length - 1] ?? max
  // With two always-on bubbles that collide, show one merged bubble instead.
  const merged = tooltip === "always" && values.length === 2 && v0 !== undefined && v1 !== undefined && pct(v1) - pct(v0) < 16
  const inRange = (v: number) => v >= lo && v <= hi

  const bubble = (key: string, left: number, text: string, i?: number) => (
    <motion.div
      key={key}
      aria-hidden="true"
      className="pointer-events-none absolute bottom-full mb-2.5 -translate-x-1/2 rtl:translate-x-1/2"
      style={{ insetInlineStart: `${left}%`, x: i === active ? over : 0 }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 2, transition: { duration: 0.1 } }}
      transition={reduce ? { duration: 0.1 } : spring.ui}
    >
      <div className="rounded-lg bg-popover px-2 py-1 text-xs font-semibold whitespace-nowrap text-popover-foreground tabular-nums shadow-[var(--pc-e2)]">
        <RollingText text={text} reduce={reduce} />
      </div>
    </motion.div>
  )

  return (
    <div className={cn("relative w-full select-none", disabled && "opacity-50", className)} aria-label={ariaLabel} role="group" {...props}>
      <GooduiTokens />
      <div
        ref={trackRef}
        className={cn("relative flex h-6 touch-none items-center", disabled ? "cursor-not-allowed" : "cursor-pointer")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
        onLostPointerCapture={end}
      >
        <motion.div className="relative h-2 w-full rounded-full bg-muted shadow-[var(--pc-well)]" style={{ scaleX: barX, scaleY: barY, originX: barOrigin }}>
          <div
            className="absolute inset-y-0 rounded-full bg-primary bg-[image:var(--pc-sheen)] shadow-[inset_0_1px_var(--pc-edge-t)]"
            style={{ insetInlineStart: `${values.length > 1 ? pct(lo) : 0}%`, insetInlineEnd: `${100 - pct(hi)}%` }}
          />
          {dots.map((d) => (
            <span
              key={d}
              aria-hidden="true"
              className={cn(
                "absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full rtl:translate-x-1/2",
                inRange(d) && (values.length > 1 || d <= hi) ? "bg-primary-foreground/70" : "bg-foreground/25",
              )}
              style={{ insetInlineStart: `${pct(d)}%` }}
            />
          ))}
        </motion.div>

        {values.map((v, i) => (
          <motion.div
            key={i}
            ref={(el) => {
              thumbRefs.current[i] = el
            }}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={thumbLabels?.[i] ?? (values.length > 1 ? (i === 0 ? l.minimum : l.maximum) : (ariaLabel ?? (props["aria-labelledby"] ? undefined : l.value)))}
            aria-labelledby={values.length === 1 && !thumbLabels?.[0] && !ariaLabel ? props["aria-labelledby"] : undefined}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={v}
            aria-valuetext={formatValue(v)}
            aria-orientation="horizontal"
            aria-disabled={disabled || undefined}
            onKeyDown={(e) => onKeyDown(i, e)}
            onFocus={(e) => {
              if (e.currentTarget.matches(":focus-visible")) setKbFocus(i)
            }}
            onBlur={() => setKbFocus((k) => (k === i ? null : k))}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover((h) => (h === i ? null : h))}
            className={cn(
              "absolute top-1/2 h-6 w-3 -translate-x-1/2 -translate-y-1/2 rounded-[6px] bg-white shadow-[0_0_0_.5px_rgb(0_0_0/.1),0_1px_2px_hsl(var(--pc-sh)/.22),0_4px_10px_-2px_hsl(var(--pc-sh)/.26)] outline-none rtl:translate-x-1/2 after:absolute after:-inset-x-2 after:-inset-y-1 focus-visible:ring-4 focus-visible:ring-ring/40",
              active === i ? "z-20 cursor-grabbing" : "z-10 cursor-grab",
            )}
            style={{ insetInlineStart: `${pct(v)}%`, x: active === i ? over : 0 }}
            initial={false}
            animate={{ scaleX: active === i && !reduce ? 1.2 : 1, scaleY: active === i && !reduce ? 0.92 : 1 }}
            transition={reduce ? { duration: 0 } : spring.snap}
          />
        ))}

        <AnimatePresence>
          {merged
            ? visible(0) && bubble("merged", (pct(v0) + pct(v1)) / 2, `${formatValue(v0)} – ${formatValue(v1)}`)
            : values.map((v, i) => visible(i) && bubble(`b${i}`, pct(v), formatValue(v), i))}
        </AnimatePresence>
      </div>

      {marks && marks.length > 0 && (
        <div className="relative mt-1 h-5" aria-hidden="true">
          {marks.map((m) => {
            const p = pct(m.value)
            return (
              <span
                key={m.value}
                className={cn(
                  "absolute top-0 flex flex-col text-xs whitespace-nowrap text-muted-foreground",
                  p <= 0 ? "items-start" : p >= 100 ? "-translate-x-full items-end rtl:translate-x-full" : "-translate-x-1/2 items-center rtl:translate-x-1/2",
                  inRange(m.value) && (values.length > 1 || m.value <= hi) && "text-foreground",
                )}
                style={{ insetInlineStart: `${p}%` }}
              >
                <span className="mb-0.5 h-1.5 w-px bg-border" />
                {m.label ?? formatValue(m.value)}
              </span>
            )
          })}
        </div>
      )}

      {name && values.map((v, i) => <input key={i} type="hidden" name={values.length > 1 ? `${name}[]` : name} value={v} />)}
    </div>
  )
}
