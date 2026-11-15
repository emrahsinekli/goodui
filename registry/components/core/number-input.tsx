"use client"

import * as React from "react"
import { ChevronDown, ChevronUp, Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGooduiLocale, useLabels } from "@/lib/goodui-locale"
import type { SoundName } from "@/lib/goodui-sounds"
import { GooduiTokens } from "@/lib/goodui-motion"

/*
 * A numeric field, independent layers: every axis combines with every other.
 *   variant    how it is painted (same six as input)     tone           focus and stepper color
 *   steppers   split (− value +), end, stacked, none      stepAnimation  how the value reacts to a step
 *   animation  how focus looks                            shape, size, shadow
 * The value is always a raw number (or null). Intl formatting (currency, percent, units) shows while the field is not
 * being edited; while focused the field shows the plain number so it is easy to type.
 * Keyboard: ↑ ↓ step, PageUp / PageDown large step, Home / End jump to min / max, Enter commits, Esc reverts.
 * Press and hold a stepper to repeat, faster the longer you hold. The wheel steps only while the field has focus.
 */

export type NumberInputVariant = "outline" | "filled" | "underline" | "ghost" | "neo" | "glass"
export type NumberInputTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type NumberInputSize = "sm" | "md" | "lg"
export type NumberInputShape = "square" | "rounded" | "pill"
export type NumberInputShadow = "none" | "sm" | "md" | "inner"
export type NumberInputAnimation = "none" | "ring" | "glow" | "lift"
export type NumberInputStepAnimation = "none" | "slide" | "pop"
export type NumberInputSteppers = "split" | "end" | "stacked" | "none"

export type NumberInputLabels = { increment: string; decrement: string }
const DEFAULT_LABELS: NumberInputLabels = { increment: "Increase", decrement: "Decrease" }

type Native = Omit<React.ComponentProps<"input">, "size" | "value" | "defaultValue" | "onChange" | "type" | "min" | "max" | "step" | "prefix">

export type NumberInputProps = Native & {
  /** Raw numeric value (controlled); null when empty. Formatting never changes it. */
  value?: number | null
  /** Initial value when uncontrolled. */
  defaultValue?: number | null
  /** Called with the raw number (or null) while typing, on every step and when the value is clamped on blur. */
  onValueChange?: (value: number | null) => void
  /** Native change event of the text field (fires while typing only). */
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  min?: number
  max?: number
  /** Amount added by a stepper, ↑ / ↓ or the wheel. */
  step?: number
  /** Amount added by PageUp / PageDown and Shift + wheel. Defaults to step × 10. */
  largeStep?: number
  /** Intl.NumberFormat options for the display, e.g. { style: "currency", currency: "EUR" } or { style: "percent" }.
   * Percent values are fractions (0.15 shows as 15%); you type 15 while editing. */
  format?: Intl.NumberFormatOptions
  /** BCP 47 locale for formatting and parsing. Defaults to the GooduiLocaleProvider language, else the browser's language after mount ("en-US" on the server). */
  locale?: string
  /** Snap out-of-range values back to min / max when the field loses focus. false keeps them and marks the field invalid. */
  clampOnBlur?: boolean
  /** Repeat while a stepper is held down, accelerating the longer it is held. */
  holdToRepeat?: boolean
  /** Step with the mouse wheel while the field has focus. */
  wheel?: boolean
  /** Plays a "tick" on every step (a little higher for +, lower for −) when the visitor has sounds on (lib/goodui-sounds); pass a sound name to pick another. Off by default. */
  sound?: boolean | SoundName
  /** Stepper buttons: split puts − and + on either side, end groups them after the value, stacked shows ▲ ▼. */
  steppers?: NumberInputSteppers
  /** Text alignment of the value. Defaults to center for split steppers, start otherwise. */
  align?: "start" | "center" | "end"
  /** Field style: outline (default), filled, underline, ghost, neo-brutalist or frosted glass. */
  variant?: NumberInputVariant
  /** Focus color and stepper hover color. */
  tone?: NumberInputTone
  size?: NumberInputSize
  shape?: NumberInputShape
  /** Field shadow; inner draws an inset shadow. Ignored by neo, which has its own offset shadow. */
  shadow?: NumberInputShadow
  /** How the field reacts to focus. */
  animation?: NumberInputAnimation
  /** How the value reacts to a step: slide (up or down with the direction), pop (scale bump) or none. */
  stepAnimation?: NumberInputStepAnimation
  /** Visible label above the field. */
  label?: React.ReactNode
  /** Helper text under the field (hidden while a message shows). */
  description?: React.ReactNode
  /** Error text under the field; shown when invalid. */
  message?: React.ReactNode
  /** Red field and aria-invalid. Also set automatically for out-of-range values when clampOnBlur is false. */
  invalid?: boolean
  /** Icon or short text before the value. */
  leading?: React.ReactNode
  /** Icon or short text after the value (e.g. "guests"). */
  trailing?: React.ReactNode
  /** Stretch to the container. By default the field is 12rem wide (override with className). */
  fullWidth?: boolean
  /** Class for the field box (the root gets className). */
  fieldClassName?: string
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<NumberInputLabels>
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

const R = ".pc-num"
const F = ".pc-num-field"
const CSS = `${tones("pc-num")}
${R}{--pc-muted:color-mix(in oklab,var(--muted-foreground) 80%,var(--foreground));--pc-sep:var(--input)}
${R}[data-invalid]{--pc-c:oklch(0.56 0.21 27);--pc-s:var(--pc-c);--pc-ink:color-mix(in oklab,var(--pc-c) 82%,var(--foreground))}
.dark ${R}[data-invalid]{--pc-c:oklch(0.68 0.2 25)}

${F}{position:relative;isolation:isolate;border:1px solid transparent;box-shadow:var(--pc-nv,0 0 #0000),var(--pc-nsh,0 0 #0000),var(--pc-nf,0 0 #0000)}
${R}[data-variant=outline] ${F}{background:var(--background);border-color:var(--pc-s,var(--input))}
${R}[data-variant=outline] ${F}:hover{border-color:var(--pc-s,color-mix(in oklab,var(--foreground) 25%,var(--input)))}
${R}[data-variant=filled] ${F}{background:var(--muted);border-color:var(--pc-s,transparent);--pc-sep:color-mix(in oklab,var(--foreground) 8%,transparent)}
${R}[data-variant=filled] ${F}:focus-within{background:var(--background)}
${R}[data-variant=underline] ${F}{border-width:0 0 1px;border-radius:0!important;border-color:var(--pc-s,var(--input));background:transparent;--pc-sep:transparent}
${R}[data-variant=ghost] ${F}{background:transparent;border-color:var(--pc-s,transparent);--pc-sep:transparent}
${R}[data-variant=ghost] ${F}:hover{background:color-mix(in oklab,var(--muted) 60%,transparent)}
${R}[data-variant=ghost] ${F}:focus-within{background:var(--muted)}
${R}[data-variant=neo] ${F}{background:var(--background);border:2px solid var(--foreground);--pc-nv:3px 3px 0 var(--pc-s,var(--foreground));--pc-sep:var(--foreground)}
${R}[data-variant=glass] ${F}{background:color-mix(in oklab,var(--background) 45%,transparent);border-color:var(--pc-s,color-mix(in oklab,var(--foreground) 14%,transparent));-webkit-backdrop-filter:blur(14px) saturate(1.6);backdrop-filter:blur(14px) saturate(1.6);--pc-nv:inset 0 1px 0 color-mix(in oklab,white 40%,transparent);--pc-sep:color-mix(in oklab,var(--foreground) 12%,transparent)}
${R} ${F}:focus-within{border-color:var(--pc-c)}
${R}[data-variant=neo] ${F}:focus-within{border-color:var(--foreground)}

${R}[data-shadow=sm] ${F}{--pc-nsh:0 1px 2px rgb(0 0 0/.08)}
${R}[data-shadow=md] ${F}{--pc-nsh:0 4px 14px -4px rgb(0 0 0/.16)}
${R}[data-shadow=inner] ${F}{--pc-nsh:inset 0 2px 4px rgb(0 0 0/.08)}

${R}[data-anim=ring] ${F}{transition:box-shadow .2s,border-color .2s,background-color .2s}
${R}[data-anim=ring] ${F}:focus-within{--pc-nf:0 0 0 3px color-mix(in oklab,var(--pc-c) 24%,transparent)}
${R}[data-anim=glow] ${F}{transition:box-shadow .3s,border-color .2s,background-color .2s}
${R}[data-anim=glow] ${F}:focus-within{--pc-nf:0 0 0 1px color-mix(in oklab,var(--pc-c) 50%,transparent),0 0 22px -2px color-mix(in oklab,var(--pc-c) 55%,transparent)}
${R}[data-anim=lift] ${F}{transition:transform .2s var(--pc-ease-out),box-shadow .2s,border-color .2s,background-color .2s}
${R}[data-anim=lift] ${F}:focus-within{transform:translateY(-2px);--pc-nf:0 10px 22px -12px color-mix(in oklab,var(--pc-c) 70%,rgb(0 0 0/.4))}
${R}[data-variant=neo][data-anim=lift] ${F}:focus-within{transform:translate(-1px,-1px);--pc-nv:5px 5px 0 var(--pc-s,var(--foreground));--pc-nf:0 0 #0000}

.pc-num-control{background:transparent;outline:none;min-width:0;width:100%;color:inherit;font-variant-numeric:tabular-nums}
.pc-num-control::placeholder{color:color-mix(in oklab,var(--muted-foreground) 88%,var(--foreground));opacity:1}
.pc-num-control:disabled{cursor:not-allowed}
.pc-num-btn{color:color-mix(in oklab,var(--pc-ink) 65%,var(--pc-muted));border-color:var(--pc-sep);transition:background-color .15s,color .15s;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.pc-num-btn:hover:not(:disabled){background:var(--pc-tint);color:var(--pc-ink)}
.pc-num-btn:active:not(:disabled){background:color-mix(in oklab,var(--pc-c) 24%,transparent)}
.pc-num-btn:disabled{opacity:.35;cursor:not-allowed}
.pc-num-desc{color:color-mix(in oklab,var(--muted-foreground) 85%,var(--foreground))}
${R}[data-invalid] .pc-num-msg{color:var(--pc-ink)}
@media (prefers-reduced-motion:reduce){
  ${R} *{transition:none!important;animation:none!important}
  ${R} ${F}:focus-within{transform:none!important}
}
`

const H: Record<NumberInputSize, string> = { sm: "h-8 text-sm", md: "h-10 text-sm", lg: "h-12 text-base" }
const PAD: Record<NumberInputSize, string> = { sm: "px-2.5 gap-1.5", md: "px-3 gap-2", lg: "px-4 gap-2.5" }
const BTN: Record<NumberInputSize, string> = { sm: "w-8 [&_svg]:size-3.5", md: "w-10 [&_svg]:size-4", lg: "w-12 [&_svg]:size-[18px]" }
const STACK: Record<NumberInputSize, string> = { sm: "w-6 [&_svg]:size-3", md: "w-7 [&_svg]:size-3.5", lg: "w-8 [&_svg]:size-4" }
const SVG: Record<NumberInputSize, string> = { sm: "[&_svg]:size-3.5", md: "[&_svg]:size-4", lg: "[&_svg]:size-[18px]" }
const SHAPES: Record<NumberInputShape, string> = { square: "rounded-none", rounded: "rounded-lg", pill: "rounded-full" }
const WIDTH: Record<NumberInputSize, string> = { sm: "w-40", md: "w-48", lg: "w-56" }

const decimals = (n: number) => {
  if (!Number.isFinite(n)) return 0
  const s = String(n)
  const e = s.match(/e-(\d+)$/)
  if (e) return Number(e[1])
  const i = s.indexOf(".")
  return i < 0 ? 0 : s.length - i - 1
}
const addExact = (a: number, b: number) => {
  const d = Math.min(12, Math.max(decimals(a), decimals(b)))
  const f = 10 ** d
  return Math.round(a * f + b * f) / f
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

export function NumberInput({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  onChange,
  min,
  max,
  step = 1,
  largeStep,
  format,
  locale: localeProp,
  clampOnBlur = true,
  holdToRepeat = true,
  wheel = true,
  sound,
  steppers = "end",
  align,
  variant = "outline",
  tone = "primary",
  size = "md",
  shape = "rounded",
  shadow = "none",
  animation = "ring",
  stepAnimation = "slide",
  label,
  description,
  message,
  invalid: invalidProp,
  leading,
  trailing,
  fullWidth,
  className,
  fieldClassName,
  labels,
  id,
  name,
  disabled,
  readOnly,
  placeholder,
  onFocus,
  onBlur,
  onKeyDown,
  ref: refProp,
  "aria-label": ariaLabel,
  ...props
}: NumberInputProps) {
  const l = useLabels("number-input", DEFAULT_LABELS, labels)
  const autoId = React.useId()
  const inputId = id ?? autoId
  const msgId = `${inputId}-msg`
  const ref = React.useRef<HTMLInputElement>(null)
  const setRef = React.useCallback(
    (el: HTMLInputElement | null) => {
      ref.current = el
      if (typeof refProp === "function") refProp(el)
      else if (refProp) refProp.current = el
    },
    [refProp],
  )

  // The browser locale is only known after mount; render "en-US" first so server and client markup match.
  const [browserLocale, setBrowserLocale] = React.useState<string | undefined>(undefined)
  React.useEffect(() => setBrowserLocale(navigator.language), [])
  const provider = useGooduiLocale()
  const locale = localeProp ?? (provider.provided ? provider.lang : browserLocale) ?? "en-US"
  const percent = format?.style === "percent"
  const fmt = React.useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, format)
    } catch {
      return new Intl.NumberFormat("en-US", format)
    }
  }, [locale, format])
  const plain = React.useMemo(() => new Intl.NumberFormat(locale, { useGrouping: false, maximumFractionDigits: 10 }), [locale])
  const decimalSep = React.useMemo(() => plain.formatToParts(1.5).find((p) => p.type === "decimal")?.value ?? ".", [plain])

  const [inner, setInner] = React.useState<number | null>(defaultValue)
  const value = valueProp !== undefined ? valueProp : inner
  const valueRef = React.useRef(value)
  valueRef.current = value
  const [draft, setDraft] = React.useState<string | null>(null)
  const focusValue = React.useRef<number | null>(null)

  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n))
  const toEdit = (n: number | null) => (n == null ? "" : plain.format(percent ? Number((n * 100).toPrecision(12)) : n))
  const parse = (text: string): number | null => {
    let t = text.replace(/[\s  ]/g, "").replace(/−/g, "-")
    if (decimalSep !== "." && !t.includes(decimalSep) && /\.\d{1,2}$/.test(t)) t = t.replace(".", decimalSep)
    t = t.split(decimalSep).map((part) => part.replace(/[^\d-]/g, "")).join(".")
    if (!t || t === "-" || t === ".") return null
    const n = Number.parseFloat(t)
    if (!Number.isFinite(n)) return null
    return percent ? Number((n / 100).toPrecision(12)) : n
  }

  const set = (n: number | null) => {
    valueRef.current = n
    if (valueProp === undefined) setInner(n)
    onValueChange?.(n)
  }

  const cue = useCue(sound)

  const bump = (dir: 1 | -1) => {
    const el = ref.current
    if (stepAnimation === "none" || !el || typeof el.animate !== "function") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const frames =
      stepAnimation === "slide"
        ? [{ transform: `translateY(${dir > 0 ? 7 : -7}px)`, opacity: 0.25 }, { transform: "translateY(0)", opacity: 1 }]
        : [{ transform: "scale(1)" }, { transform: "scale(1.09)" }, { transform: "scale(1)" }]
    el.animate(frames, { duration: stepAnimation === "slide" ? 170 : 220, easing: "cubic-bezier(.23,1,.32,1)" })
  }

  /** Steps from the current (or typed) value; returns false when nothing changed (at a bound). */
  const stepBy = (dir: 1 | -1, amount = step): boolean => {
    if (disabled || readOnly) return false
    const typed = draft != null ? parse(draft) : null
    const cur = typed ?? valueRef.current
    const next = cur == null ? clamp(min != null && min > 0 ? min : 0) : clamp(addExact(cur, dir * amount))
    if (cur != null && next === cur) return false
    set(next)
    if (draft != null) setDraft(toEdit(next))
    bump(dir)
    cue("tick", { rate: dir > 0 ? 1.08 : 0.92 })
    return true
  }
  const stepRef = React.useRef(stepBy)
  stepRef.current = stepBy

  // Press-and-hold: one step at once, then repeat after 400 ms, speeding up from ~7 to ~35 steps per second.
  const hold = React.useRef<{ t?: ReturnType<typeof setTimeout>; n: number; stop?: () => void }>({ n: 0 })
  const stopHold = React.useCallback(() => {
    clearTimeout(hold.current.t)
    hold.current.t = undefined
    hold.current.stop?.()
    hold.current.stop = undefined
  }, [])
  React.useEffect(() => stopHold, [stopHold])
  const startHold = (dir: 1 | -1) => {
    stopHold()
    if (!stepRef.current(dir) || !holdToRepeat) return
    hold.current.n = 0
    const end = () => stopHold()
    window.addEventListener("pointerup", end)
    window.addEventListener("pointercancel", end)
    window.addEventListener("blur", end)
    hold.current.stop = () => {
      window.removeEventListener("pointerup", end)
      window.removeEventListener("pointercancel", end)
      window.removeEventListener("blur", end)
    }
    const tick = () => {
      const n = ++hold.current.n
      if (!stepRef.current(dir)) return stopHold()
      hold.current.t = setTimeout(tick, Math.max(28, 140 * 0.9 ** n))
    }
    hold.current.t = setTimeout(tick, 400)
  }

  // React's onWheel is passive, so preventDefault needs a native listener. Only while focused, so pages still scroll.
  React.useEffect(() => {
    const el = ref.current
    if (!el || !wheel) return
    const onWheel = (e: WheelEvent) => {
      if (document.activeElement !== el || e.deltaY === 0) return
      e.preventDefault()
      stepRef.current(e.deltaY < 0 ? 1 : -1, e.shiftKey ? (largeStep ?? step * 10) : step)
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [wheel, largeStep, step])

  const commit = (keepEditing: boolean) => {
    if (draft == null) return
    let n = parse(draft)
    if (n != null && clampOnBlur) n = clamp(n)
    if (n !== valueRef.current) set(n)
    setDraft(keepEditing ? toEdit(n) : null)
  }

  const outOfRange = value != null && ((min != null && value < min) || (max != null && value > max))
  const invalid = !!invalidProp || outOfRange
  const formatted = value == null ? "" : fmt.format(value)
  const shown = draft ?? formatted
  const atMin = value != null && min != null && value <= min
  const atMax = value != null && max != null && value >= max
  const alignment = align ?? (steppers === "split" ? "center" : "start")
  const hasMsg = invalid && !!message

  const btn = (dir: 1 | -1, extra: string, icon: React.ReactNode) => (
    <button
      type="button"
      tabIndex={-1}
      aria-label={dir > 0 ? l.increment : l.decrement}
      aria-controls={inputId}
      disabled={disabled || readOnly || (dir > 0 ? atMax : atMin)}
      data-slot={dir > 0 ? "increment" : "decrement"}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        e.preventDefault()
        startHold(dir)
      }}
      onPointerLeave={stopHold}
      onClick={(e) => {
        // Keyboard and assistive-tech activation (no pointer) still steps once.
        if (e.detail === 0) stepBy(dir)
      }}
      onContextMenu={(e) => e.preventDefault()}
      className={cn("pc-press pc-num-btn grid shrink-0 cursor-pointer place-items-center outline-none select-none", extra)}
    >
      {icon}
    </button>
  )

  const side = (node: React.ReactNode, slot: string) =>
    node ? (
      <span data-slot={slot} className="inline-flex shrink-0 items-center whitespace-nowrap text-[var(--pc-muted)]">
        {node}
      </span>
    ) : null

  return (
    <>
      <GooduiTokens />
      <style href="pc-number-input" precedence="default">
        {CSS}
      </style>
      <div
        data-slot="number-input"
        data-variant={variant}
        data-tone={tone}
        data-anim={animation}
        data-shadow={variant === "neo" ? "none" : shadow}
        data-steppers={steppers}
        data-invalid={invalid ? "" : undefined}
        className={cn("pc-num flex max-w-full flex-col gap-1.5", fullWidth ? "w-full" : WIDTH[size], disabled && "opacity-60", className)}
      >
        {label && (
          <label htmlFor={inputId} className="text-sm leading-none font-medium">
            {label}
          </label>
        )}
        <div
          data-slot="field"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault()
              ref.current?.focus()
            }
          }}
          className={cn("pc-num-field flex cursor-text items-stretch overflow-hidden", H[size], SHAPES[shape], fieldClassName)}
        >
          {steppers === "split" && btn(-1, cn(BTN[size], "border-e", variant === "neo" && "border-e-2"), <Minus />)}
          <div className={cn("flex min-w-0 flex-1 items-center", PAD[size], SVG[size], "[&_svg]:shrink-0", steppers === "split" && shape === "pill" && "px-1")}>
            {side(leading, "leading")}
            <input
              {...props}
              ref={setRef}
              id={inputId}
              type="text"
              role="spinbutton"
              inputMode={step % 1 === 0 && (min ?? -1) >= 0 && !percent ? "numeric" : "decimal"}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={shown}
              placeholder={placeholder}
              disabled={disabled}
              readOnly={readOnly}
              aria-label={ariaLabel}
              aria-valuenow={value ?? undefined}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuetext={formatted || undefined}
              aria-invalid={invalid || undefined}
              aria-describedby={hasMsg || description ? msgId : undefined}
              onFocus={(e) => {
                focusValue.current = valueRef.current
                if (!readOnly) setDraft(toEdit(valueRef.current))
                onFocus?.(e)
              }}
              onBlur={(e) => {
                commit(false)
                onBlur?.(e)
              }}
              onChange={(e) => {
                const text = e.target.value.replace(/[^\d.,\-−\s]/g, "")
                setDraft(text)
                const n = parse(text)
                if (n !== valueRef.current && (n != null || text.trim() === "")) set(n)
                onChange?.(e)
              }}
              onKeyDown={(e) => {
                onKeyDown?.(e)
                if (e.defaultPrevented) return
                const large = largeStep ?? step * 10
                const run = (fn: () => void) => {
                  e.preventDefault()
                  fn()
                }
                if (e.key === "ArrowUp") run(() => stepBy(1, e.shiftKey ? large : step))
                else if (e.key === "ArrowDown") run(() => stepBy(-1, e.shiftKey ? large : step))
                else if (e.key === "PageUp") run(() => stepBy(1, large))
                else if (e.key === "PageDown") run(() => stepBy(-1, large))
                else if (e.key === "Home" && min != null && !readOnly) {
                  run(() => {
                    set(min)
                    setDraft(toEdit(min))
                  })
                } else if (e.key === "End" && max != null && !readOnly) {
                  run(() => {
                    set(max)
                    setDraft(toEdit(max))
                  })
                } else if (e.key === "Enter") commit(true)
                else if (e.key === "Escape" && draft != null) {
                  run(() => {
                    set(focusValue.current)
                    setDraft(toEdit(focusValue.current))
                  })
                }
              }}
              className={cn("pc-num-control self-stretch", alignment === "center" ? "text-center" : alignment === "end" ? "text-end" : "text-start")}
            />
            {side(trailing, "trailing")}
          </div>
          {steppers === "split" && btn(1, cn(BTN[size], "border-s", variant === "neo" && "border-s-2"), <Plus />)}
          {steppers === "end" && (
            <>
              {btn(-1, cn(BTN[size], "border-s", variant === "neo" && "border-s-2"), <Minus />)}
              {btn(1, cn(BTN[size], "border-s", variant === "neo" && "border-s-2"), <Plus />)}
            </>
          )}
          {steppers === "stacked" && (
            <div className={cn("flex shrink-0 flex-col border-s border-[var(--pc-sep)]", variant === "neo" && "border-s-2")}>
              {btn(1, cn(STACK[size], "flex-1 border-b", variant === "neo" && "border-b-2"), <ChevronUp />)}
              {btn(-1, cn(STACK[size], "flex-1"), <ChevronDown />)}
            </div>
          )}
        </div>
        {(hasMsg || description) && (
          <p id={msgId} aria-live="polite" className={cn("text-xs", hasMsg ? "pc-num-msg font-medium" : "pc-num-desc")}>
            {hasMsg ? message : description}
          </p>
        )}
        {name && <input type="hidden" name={name} value={value ?? ""} />}
      </div>
    </>
  )
}
