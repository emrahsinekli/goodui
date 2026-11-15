"use client"

import * as React from "react"
import { motion, useReducedMotion, type Transition } from "motion/react"
import { Check, Moon, Sun, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SoundName } from "@/lib/goodui-sounds"
import { GooduiTokens, spring, ease as easing } from "@/lib/goodui-motion"

/*
 * One switch, independent layers:
 *   variant    ios, material, square, neo, icon-thumb, label-inside
 *   tone       which color when on         animation  none, smooth, spring, bounce
 *   shadow     how the track sits          size       sm, md, lg
 *   icons      glyphs inside the thumb     label/description on the left or right, loading state
 */

export type SwitchVariant = "ios" | "material" | "square" | "neo" | "icon-thumb" | "label-inside"
export type SwitchTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type SwitchAnimation = "none" | "smooth" | "spring" | "bounce"
export type SwitchShadow = "none" | "sm" | "inner" | "glow"
export type SwitchSize = "sm" | "md" | "lg"
export type SwitchIcons = "auto" | "none" | "check" | "theme"

export type SwitchProps = Omit<React.ComponentProps<"button">, "value" | "onChange" | "children"> & {
  /** On state (controlled). */
  checked?: boolean
  /** Initial state when uncontrolled. */
  defaultChecked?: boolean
  /** Called with the new state on click, Space or Enter (not while loading). */
  onCheckedChange?: (checked: boolean) => void
  /** Track and thumb style: ios (default), material, square, neo, icon-thumb (check/x) or label-inside (ON/OFF). */
  variant?: SwitchVariant
  /** Track color when on. */
  tone?: SwitchTone
  /** How the thumb travels: spring (default), smooth ease, bounce with squash, or none. */
  animation?: SwitchAnimation
  /** Track shadow; glow only shows when on. */
  shadow?: SwitchShadow
  size?: SwitchSize
  /** Glyphs inside the thumb. "auto" shows check/x on icon-thumb and nothing elsewhere. */
  icons?: SwitchIcons
  /** Custom thumb glyphs, override `icons`. */
  checkedIcon?: React.ReactNode
  /** Custom thumb glyph for the off state. */
  uncheckedIcon?: React.ReactNode
  /** Text inside the track for the label-inside variant. */
  onText?: string
  /** Off text for the label-inside variant. */
  offText?: string
  /** Visible label; the row becomes a <label> linked with aria-labelledby. */
  label?: React.ReactNode
  /** Muted helper text under the label, linked with aria-describedby. */
  description?: React.ReactNode
  /** Where the text sits. "left" makes a full-width settings row with the switch at the end. */
  labelPosition?: "left" | "right"
  /** Shows a spinner in the thumb and blocks toggling, e.g. while saving. */
  loading?: boolean
  /** Submits "on" (or `value`) under this name in a form when checked. */
  name?: string
  /** Value submitted with name when checked; defaults to "on". */
  value?: string
  /** Plays "toggle-on" / "toggle-off" when the visitor has sounds on (lib/goodui-sounds); pass a sound name to use one sound for both. Off by default. */
  sound?: boolean | SoundName
}

type Geo = { w: number; h: number; t: number; p: number; b?: number }
const GEO: Record<"base" | "material" | "neo" | "label", Record<SwitchSize, Geo>> = {
  base: { sm: { w: 32, h: 18, t: 14, p: 2 }, md: { w: 44, h: 24, t: 20, p: 2 }, lg: { w: 56, h: 30, t: 26, p: 2 } },
  material: { sm: { w: 40, h: 24, t: 18, p: 3, b: 2 }, md: { w: 52, h: 32, t: 24, p: 4, b: 2 }, lg: { w: 60, h: 36, t: 28, p: 4, b: 2 } },
  neo: { sm: { w: 36, h: 20, t: 12, p: 4, b: 2 }, md: { w: 48, h: 26, t: 16, p: 5, b: 2 }, lg: { w: 58, h: 32, t: 20, p: 6, b: 2 } },
  label: { sm: { w: 48, h: 20, t: 16, p: 2 }, md: { w: 62, h: 26, t: 22, p: 2 }, lg: { w: 76, h: 32, t: 28, p: 2 } },
}
const geoFor = (v: SwitchVariant, s: SwitchSize) => (v === "material" ? GEO.material : v === "neo" ? GEO.neo : v === "label-inside" ? GEO.label : GEO.base)[s]

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

const K = ".pc-switch-track"
const CSS = `${tones("pc-switch")}
.pc-switch{--pc-off:color-mix(in oklab,var(--foreground) 15%,transparent);--pc-thumb:#fff;--pc-thumb-on:#fff}
.dark .pc-switch{--pc-off:color-mix(in oklab,var(--foreground) 22%,transparent);--pc-thumb:oklch(0.96 0 0)}
.pc-switch[data-tone=primary],.pc-switch[data-tone=neutral]{--pc-thumb-on:var(--pc-fg)}
${K}{background:var(--pc-off);box-shadow:inset 0 1px 2px hsl(var(--pc-sh)/.16),inset 0 0 0 .5px hsl(var(--pc-sh)/.06);-webkit-tap-highlight-color:transparent}
${K}[data-state=checked]{background:var(--pc-sheen),var(--pc-c);box-shadow:inset 0 1px 2px rgb(0 0 0/.14),inset 0 0 0 .5px rgb(0 0 0/.08)}
.pc-switch-thumb{background:var(--pc-thumb);color:color-mix(in oklab,var(--foreground) 55%,transparent);box-shadow:0 0 0 .5px rgb(0 0 0/.06),0 1px 2px hsl(var(--pc-sh)/.2),0 3px 6px -1px hsl(var(--pc-sh)/.22)}
[data-state=checked]>.pc-switch-thumb{background:var(--pc-thumb-on);color:var(--pc-c)}
.dark .pc-switch-thumb{color:oklch(0.4 0 0)}
.dark [data-state=checked]>.pc-switch-thumb{color:var(--pc-c)}
.dark .pc-switch[data-tone=primary] [data-state=checked]>.pc-switch-thumb,.dark .pc-switch[data-tone=neutral] [data-state=checked]>.pc-switch-thumb{color:var(--pc-c)}

${K}[data-variant=material]{box-shadow:none;background:color-mix(in oklab,var(--foreground) 6%,transparent);border:2px solid color-mix(in oklab,var(--foreground) 45%,transparent)}
${K}[data-variant=material][data-state=checked]{background:var(--pc-c);border-color:var(--pc-c)}
${K}[data-variant=material]>.pc-switch-thumb{background:color-mix(in oklab,var(--foreground) 55%,transparent);color:var(--background);box-shadow:none}
${K}[data-variant=material][data-state=checked]>.pc-switch-thumb{background:var(--pc-fg);color:var(--pc-c)}

${K}[data-variant=neo]{background:var(--background);border:2px solid var(--foreground);box-shadow:2px 2px 0 var(--foreground)}
${K}[data-variant=neo][data-state=checked]{background:var(--pc-c)}
${K}[data-variant=neo]>.pc-switch-thumb{background:var(--foreground);color:var(--background);box-shadow:none}
${K}[data-variant=neo][data-state=checked]>.pc-switch-thumb{background:var(--background);color:var(--foreground);outline:2px solid var(--foreground)}
${K}[data-variant=neo]:active:not(:disabled){box-shadow:0 0 0 var(--foreground);transform:translate(2px,2px)}

.pc-switch-text{color:color-mix(in oklab,var(--muted-foreground) 60%,var(--foreground))}
[data-state=checked]>.pc-switch-text{color:var(--pc-fg)}

${K}[data-shadow=sm]{box-shadow:inset 0 1px 2px hsl(var(--pc-sh)/.14),var(--pc-e1)}
${K}[data-shadow=inner]{box-shadow:inset 0 1px 3px hsl(var(--pc-sh)/.34)}
${K}[data-shadow=glow][data-state=checked]{box-shadow:0 0 0 3px var(--pc-tint),0 4px 16px -2px color-mix(in oklab,var(--pc-c) 60%,transparent)}

${K}[data-anim]:not([data-anim=none]){transition:scale 120ms var(--pc-ease-out),background-color 200ms ease,border-color 200ms ease,box-shadow 200ms ease,transform 100ms var(--pc-ease-out)}
${K}[data-anim]:not([data-anim=none])>.pc-switch-thumb{transition:background-color .22s,color .22s}
${K}[data-anim]:not([data-anim=none]) .pc-switch-glyph{transition:opacity .2s,transform .3s var(--pc-ease-spring)}
${K}[data-anim]:not([data-anim=none])>.pc-switch-text{transition:opacity .2s,color .2s}
.pc-switch-glyph{position:absolute;inset:0;display:grid;place-items:center}
.pc-switch-glyph[data-show=false]{opacity:0;transform:rotate(-90deg) scale(.4)}
.pc-switch-spin{animation:pc-switch-spin .7s linear infinite}
@keyframes pc-switch-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){
  .pc-switch *{transition:none!important}
  .pc-switch-spin{animation-duration:1.6s}
}
`

const TEXT_SIZE: Record<SwitchSize, string> = { sm: "text-[9px]", md: "text-[10px]", lg: "text-[11px]" }
const LABEL_SIZE: Record<SwitchSize, string> = { sm: "text-[13px]", md: "text-sm", lg: "text-[15px]" }

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

export function Switch({
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  variant = "ios",
  tone = "primary",
  animation = "spring",
  shadow = "none",
  size = "md",
  icons = "auto",
  checkedIcon,
  uncheckedIcon,
  onText = "ON",
  offText = "OFF",
  label,
  description,
  labelPosition = "right",
  loading,
  name,
  value,
  sound,
  disabled,
  className,
  onClick,
  onPointerDown,
  onKeyDown,
  onKeyUp,
  onBlur,
  id: idProp,
  ...props
}: SwitchProps) {
  const prefersReduced = useReducedMotion()
  const cue = useCue(sound)
  // Reduced motion feeds data-anim, so wait for mount to keep the first client render equal to the server's.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const reduce = mounted && !!prefersReduced
  const uid = React.useId()
  const id = idProp ?? uid
  const [inner, setInner] = React.useState(defaultChecked)
  const checked = checkedProp ?? inner
  const g = geoFor(variant, size)
  const travel = g.w - g.t - 2 * g.p
  const anim: SwitchAnimation = reduce ? "none" : animation
  const [pressed, setPressed] = React.useState(false)
  const btn = React.useRef<HTMLButtonElement>(null)
  // Right-to-left: the thumb starts on the right and travels the other way. Read after mount so SSR output is unchanged.
  const [rtl, setRtl] = React.useState(false)
  React.useLayoutEffect(() => {
    if (btn.current) setRtl(getComputedStyle(btn.current).direction === "rtl")
  }, [])
  React.useEffect(() => {
    if (!pressed) return
    const up = () => setPressed(false)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
    return () => {
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
    }
  }, [pressed])

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || loading) return
    if (checkedProp === undefined) setInner(!checked)
    onCheckedChange?.(!checked)
    cue(checked ? "toggle-off" : "toggle-on")
  }

  const set = icons === "auto" ? (variant === "icon-thumb" ? "check" : "none") : icons
  const onGlyph = checkedIcon ?? (set === "check" ? <Check strokeWidth={3} /> : set === "theme" ? <Moon strokeWidth={2.5} /> : null)
  const offGlyph = uncheckedIcon ?? (set === "check" ? <X strokeWidth={3} /> : set === "theme" ? <Sun strokeWidth={2.5} /> : null)

  const material = variant === "material"
  const offScale = material && !offGlyph && !loading ? (g.t - 8) / g.t : 1
  const transition: Transition =
    anim === "none"
      ? { duration: 0 }
      : anim === "smooth"
        ? { duration: 0.2, ease: easing.out }
        : anim === "spring"
          ? spring.snap
          : { x: spring.play, scale: spring.play, scaleX: { duration: 0.34 }, scaleY: { duration: 0.34 } }
  const squash = anim === "bounce" ? { scaleX: [1, 1.28, 1], scaleY: [1, 0.86, 1] } : {}
  const rest = { x: checked ? (rtl ? -travel : travel) : 0, scale: checked ? 1 : offScale }
  // Held down, the thumb stretches toward its travel and flattens a little, as if it had weight.
  const held = !pressed || anim === "none" || variant === "neo" || loading ? squash : material ? { scale: 1.12 } : { scaleX: 1.18, scaleY: 0.93 }

  const radius = variant === "square" ? "rounded-[5px]" : variant === "neo" ? "rounded-[6px]" : "rounded-full"
  const thumbRadius = variant === "square" ? "rounded-[3px]" : variant === "neo" ? "rounded-[3px]" : "rounded-full"
  const glyphSize = Math.round(g.t * 0.6)

  const sw = (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-busy={loading || undefined}
      aria-labelledby={label ? `${id}-label` : undefined}
      aria-describedby={description ? `${id}-desc` : undefined}
      ref={btn}
      disabled={disabled}
      data-slot="switch"
      data-state={checked ? "checked" : "unchecked"}
      data-variant={variant}
      data-shadow={shadow}
      data-anim={anim}
      onClick={toggle}
      onPointerDown={(e) => {
        if (e.button === 0) setPressed(true)
        onPointerDown?.(e)
      }}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") setPressed(true)
        onKeyDown?.(e)
      }}
      onKeyUp={(e) => {
        setPressed(false)
        onKeyUp?.(e)
      }}
      onBlur={(e) => {
        setPressed(false)
        onBlur?.(e)
      }}
      className={cn(
        "pc-press pc-switch-track relative inline-flex shrink-0 items-center outline-none",
        "focus-visible:ring-3 focus-visible:ring-[color-mix(in_oklab,var(--pc-c)_40%,transparent)] focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        loading && "cursor-progress",
        radius,
        !label && !description && className,
      )}
      style={{ width: g.w, height: g.h }}
      {...props}
    >
      {variant === "label-inside" && (
        <span
          aria-hidden="true"
          className={cn("pc-switch-text pointer-events-none absolute inset-y-0 flex items-center font-bold tracking-wide select-none", TEXT_SIZE[size])}
          style={checked ? { insetInlineStart: g.p + 5, insetInlineEnd: g.t + g.p + 2 } : { insetInlineStart: g.t + g.p + 2, insetInlineEnd: g.p + 5, justifyContent: "flex-end" }}
        >
          {checked ? onText : offText}
        </span>
      )}
      <motion.span
        aria-hidden="true"
        data-slot="switch-thumb"
        className={cn("pc-switch-thumb pointer-events-none relative block", thumbRadius)}
        style={{ width: g.t, height: g.t, marginInlineStart: g.p - (g.b ?? 0), originX: checked !== rtl ? 1 : 0 }}
        initial={false}
        animate={{ ...rest, ...held }}
        transition={transition}
      >
        {loading ? (
          <span className="pc-switch-glyph">
            <svg className="pc-switch-spin" width={glyphSize} height={glyphSize} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3.5" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
          </span>
        ) : (
          (onGlyph || offGlyph) && (
            <>
              <span className="pc-switch-glyph [&_svg]:size-[var(--g)]" data-show={checked} style={{ ["--g" as string]: `${glyphSize}px` }}>
                {onGlyph}
              </span>
              <span className="pc-switch-glyph [&_svg]:size-[var(--g)]" data-show={!checked} style={{ ["--g" as string]: `${glyphSize}px` }}>
                {offGlyph}
              </span>
            </>
          )
        )}
      </motion.span>
    </button>
  )

  const hidden = name ? <input type="checkbox" aria-hidden="true" tabIndex={-1} hidden name={name} value={value ?? "on"} checked={checked} readOnly /> : null

  if (!label && !description) {
    return (
      <>
        <GooduiTokens />
        <style href="pc-switch" precedence="default">
          {CSS}
        </style>
        <span className="pc-switch contents" data-tone={tone}>
          {sw}
          {hidden}
        </span>
      </>
    )
  }

  const text = (
    <span className="flex min-w-0 flex-col gap-0.5">
      {label && (
        <span id={`${id}-label`} className={cn("leading-snug font-medium", LABEL_SIZE[size])}>
          {label}
        </span>
      )}
      {description && (
        <span id={`${id}-desc`} className="text-[13px] leading-snug text-muted-foreground">
          {description}
        </span>
      )}
    </span>
  )

  return (
    <>
      <GooduiTokens />
      <style href="pc-switch" precedence="default">
        {CSS}
      </style>
      <label
        htmlFor={id}
        data-tone={tone}
        data-disabled={disabled || undefined}
        className={cn(
          "pc-switch gap-3 select-none",
          description ? "items-start" : "items-center",
          labelPosition === "left" ? "flex w-full justify-between gap-4" : "inline-flex",
          disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer",
          className,
        )}
      >
        {labelPosition === "left" && text}
        {description ? (
          <span className="flex shrink-0 items-center" style={{ height: size === "lg" ? 22 : 20 }}>
            {sw}
          </span>
        ) : (
          sw
        )}
        {labelPosition === "right" && text}
        {hidden}
      </label>
    </>
  )
}
