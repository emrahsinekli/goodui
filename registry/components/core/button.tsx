"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { SoundName } from "@/lib/goodui-sounds"
import { GooduiTokens } from "@/lib/goodui-motion"

/*
 * One button, independent layers: every axis combines with every other.
 *   variant   how it is painted          tone      which color
 *   shadow    how it sits on the page    animation how it reacts
 *   shape     corners                    size      scale
 * Colors come from the tone's CSS variables, so every variant works in every tone, in light and dark,
 * and inside every goodui style pack.
 */

export type ButtonVariant = "solid" | "soft" | "outline" | "ghost" | "link" | "gradient" | "glass" | "neo" | "pushable" | "dashed"
export type ButtonTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type ButtonShadow = "none" | "sm" | "md" | "lg" | "glow" | "hard" | "inner"
export type ButtonAnimation = "none" | "lift" | "press" | "shine" | "shimmer" | "ripple" | "pulse" | "arrow" | "glow" | "bounce"
export type ButtonShape = "square" | "rounded" | "pill"
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl"

export type ButtonProps = React.ComponentProps<"button"> & {
  variant?: ButtonVariant
  tone?: ButtonTone
  shadow?: ButtonShadow
  animation?: ButtonAnimation
  shape?: ButtonShape
  size?: ButtonSize
  /** Square button for a single icon. */
  iconOnly?: boolean
  fullWidth?: boolean
  /** Blurs the label out, narrows around a spinner and disables the button. */
  loading?: boolean
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  /** Plays "tap" on click when the visitor has sounds on (lib/goodui-sounds); pass a sound name to pick another. Off by default. */
  sound?: boolean | SoundName
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

const CSS = `
.pc-btn{--pc-c:var(--primary);--pc-fg:var(--primary-foreground);--pc-rim:0 0 #0000;position:relative;isolation:isolate;-webkit-tap-highlight-color:transparent;transition:scale 120ms var(--pc-ease-out),background-color 150ms ease,border-color 150ms ease,color 150ms ease,box-shadow 200ms ease,opacity 150ms ease}
.pc-btn:not([data-variant=neo],[data-variant=pushable],[data-variant=link]):active{scale:.97}
.pc-btn[data-tone=neutral]{--pc-c:var(--foreground);--pc-fg:var(--background)}
.pc-btn[data-tone=success]{--pc-c:oklch(0.53 0.13 155);--pc-fg:#fff}
.pc-btn[data-tone=warning]{--pc-c:oklch(0.75 0.16 70);--pc-fg:oklch(0.25 0.05 70)}
.pc-btn[data-tone=danger]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff}
.pc-btn[data-tone=info]{--pc-c:oklch(0.55 0.17 250);--pc-fg:#fff}
.dark .pc-btn[data-tone=success]{--pc-c:oklch(0.7 0.16 155);--pc-fg:oklch(0.2 0.05 155)}
.dark .pc-btn[data-tone=danger]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25)}
.dark .pc-btn[data-tone=info]{--pc-c:oklch(0.7 0.15 245);--pc-fg:oklch(0.2 0.05 245)}
.pc-btn{--pc-tint:color-mix(in oklab,var(--pc-c) 14%,transparent);--pc-ink:color-mix(in oklab,var(--pc-c) 82%,var(--foreground))}
.pc-btn[data-tone=warning]{--pc-ink:color-mix(in oklab,var(--pc-c) 62%,var(--foreground))}
/* White text on the gradient needs darker fuchsia/amber stops in light mode. */
.pc-btn:is([data-tone=success],[data-tone=info],[data-tone=danger]){--pc-g1:#a21caf;--pc-g2:#b45309}
.dark .pc-btn:is([data-tone=success],[data-tone=info],[data-tone=danger]){--pc-g1:#d946ef;--pc-g2:#f59e0b}

/* Solid: light from above, a rim of the tone's own shade, and a glow that takes the tone on hover. */
.pc-btn[data-variant=solid]{--pc-rim:inset 0 1px var(--pc-edge-t),inset 0 -1px var(--pc-edge-b),0 0 0 1px color-mix(in oklab,var(--pc-c) 80%,black),0 1px 2px rgb(0 0 0/.2);background-color:var(--pc-c);background-image:var(--pc-sheen);color:var(--pc-fg);box-shadow:var(--pc-rim)}
.pc-btn[data-variant=solid]:hover{background-color:color-mix(in oklab,var(--pc-c) 90%,var(--background));box-shadow:var(--pc-rim),0 8px 24px -8px color-mix(in oklab,var(--pc-c) 55%,transparent)}
.pc-btn[data-variant=soft]{background:var(--pc-tint);color:var(--pc-ink)}
.pc-btn[data-variant=soft]:hover{background:color-mix(in oklab,var(--pc-c) 22%,transparent)}
.pc-btn[data-variant=outline]{--pc-rim:0 1px 2px hsl(var(--pc-sh)/.06);border:1px solid color-mix(in oklab,var(--pc-c) 30%,var(--border));color:var(--pc-ink);background:var(--background);box-shadow:var(--pc-rim)}
.pc-btn[data-variant=outline]:hover{background:var(--pc-tint)}
.pc-btn[data-variant=dashed]{border:1.5px dashed color-mix(in oklab,var(--pc-c) 55%,var(--border));color:var(--pc-ink)}
.pc-btn[data-variant=dashed]:hover{background:var(--pc-tint);border-style:solid}
.pc-btn[data-variant=ghost]{color:var(--pc-ink)}
.pc-btn[data-variant=ghost]:hover{background:var(--pc-tint)}
.pc-btn[data-variant=link]{color:var(--pc-ink);padding-inline:0;height:auto;text-underline-offset:4px}
.pc-btn[data-variant=link]:hover{text-decoration:underline}
.pc-btn[data-variant=gradient]{color:var(--pc-fg);background:linear-gradient(135deg,var(--pc-c),color-mix(in oklab,var(--pc-c) 55%,var(--pc-g1,#d946ef)) 55%,color-mix(in oklab,var(--pc-c) 50%,var(--pc-g2,#f59e0b)));background-size:180% 180%;background-position:0% 50%;transition:background-position .5s ease}
.pc-btn[data-variant=gradient]:hover{background-position:100% 50%}
.pc-btn[data-variant=glass]{color:var(--foreground);background:color-mix(in oklab,var(--background) 45%,transparent);border:1px solid color-mix(in oklab,var(--foreground) 14%,transparent);-webkit-backdrop-filter:blur(14px) saturate(1.6);backdrop-filter:blur(14px) saturate(1.6);box-shadow:inset 0 1px 0 color-mix(in oklab,white 45%,transparent)}
.pc-btn[data-variant=glass]:hover{background:color-mix(in oklab,var(--background) 62%,transparent)}
.pc-btn[data-variant=neo]{background:var(--pc-c);color:var(--pc-fg);border:2px solid var(--foreground);box-shadow:4px 4px 0 var(--foreground);transition:transform .12s,box-shadow .12s}
.pc-btn[data-variant=neo]:hover{transform:translate(-1px,-1px);box-shadow:5px 5px 0 var(--foreground)}
.pc-btn[data-variant=neo]:active{transform:translate(4px,4px);box-shadow:0 0 0 var(--foreground)}
.pc-btn[data-variant=pushable]{background:var(--pc-c);color:var(--pc-fg);box-shadow:0 4px 0 color-mix(in oklab,var(--pc-c) 60%,black);transform:translateY(-2px);transition:transform .08s,box-shadow .08s}
.pc-btn[data-variant=pushable]:hover{transform:translateY(-3px);box-shadow:0 5px 0 color-mix(in oklab,var(--pc-c) 60%,black)}
.pc-btn[data-variant=pushable]:active{transform:translateY(2px);box-shadow:0 0 0 color-mix(in oklab,var(--pc-c) 60%,black)}

.pc-btn[data-shadow=sm]{box-shadow:var(--pc-rim),0 1px 2px hsl(var(--pc-sh)/.12)}
.pc-btn[data-shadow=md]{box-shadow:var(--pc-rim),0 4px 12px -2px hsl(var(--pc-sh)/.18)}
.pc-btn[data-shadow=lg]{box-shadow:var(--pc-rim),0 12px 28px -8px hsl(var(--pc-sh)/.3)}
.pc-btn[data-shadow=glow]{box-shadow:var(--pc-rim),0 6px 24px -4px color-mix(in oklab,var(--pc-c) 65%,transparent)}
.pc-btn[data-shadow=hard]{box-shadow:3px 3px 0 color-mix(in oklab,var(--pc-c) 55%,var(--foreground))}
.pc-btn[data-shadow=inner]{box-shadow:inset 0 2px 4px rgb(0 0 0/.22)}

.pc-btn[data-anim=lift]{transition:transform .18s var(--pc-ease-out),box-shadow .18s,scale 120ms var(--pc-ease-out)}
.pc-btn[data-anim=lift]:hover{transform:translateY(-2px);box-shadow:var(--pc-rim),0 10px 24px -10px color-mix(in oklab,var(--pc-c) 70%,transparent)}
.pc-btn[data-anim=lift]:active{transform:translateY(0)}
.pc-btn[data-anim=press]:active{scale:.94}
.pc-btn[data-anim=shine],.pc-btn[data-anim=shimmer]{overflow:hidden}
.pc-btn[data-anim=shine]::after,.pc-btn[data-anim=shimmer]::after{content:"";position:absolute;inset:0;z-index:-1;width:45%;background:linear-gradient(100deg,transparent,rgb(255 255 255/.45),transparent);transform:translateX(-160%) skewX(-18deg);pointer-events:none}
.pc-btn[data-anim=shine]:hover::after{transition:transform .7s ease;transform:translateX(330%) skewX(-18deg)}
.pc-btn[data-anim=shimmer]::after{animation:pc-btn-sweep 2.6s ease-in-out infinite}
@keyframes pc-btn-sweep{0%{transform:translateX(-160%) skewX(-18deg)}60%,100%{transform:translateX(330%) skewX(-18deg)}}
.pc-btn[data-anim=pulse]::before{content:"";position:absolute;inset:0;border-radius:inherit;box-shadow:0 0 0 0 color-mix(in oklab,var(--pc-c) 55%,transparent);animation:pc-btn-pulse 2s var(--pc-ease-out) infinite;pointer-events:none}
@keyframes pc-btn-pulse{to{box-shadow:0 0 0 12px transparent}}
.pc-btn[data-anim=arrow] [data-slot=icon-right]{transition:transform .2s var(--pc-ease-out)}
.pc-btn[data-anim=arrow]:hover [data-slot=icon-right]{transform:translateX(3px)}
.pc-btn[data-anim=arrow] [data-slot=icon-left]{transition:transform .2s var(--pc-ease-out)}
.pc-btn[data-anim=arrow]:hover [data-slot=icon-left]{transform:translateX(-2px)}
.pc-btn[data-anim=arrow]:dir(rtl):hover [data-slot=icon-right]{transform:translateX(-3px)}
.pc-btn[data-anim=arrow]:dir(rtl):hover [data-slot=icon-left]{transform:translateX(2px)}
.pc-btn[data-anim=glow]:hover{box-shadow:var(--pc-rim),0 0 0 1px color-mix(in oklab,var(--pc-c) 40%,transparent),0 8px 32px -4px color-mix(in oklab,var(--pc-c) 70%,transparent)}
.pc-btn[data-anim=bounce]:active{animation:pc-btn-bounce .45s var(--pc-ease-spring)}
@keyframes pc-btn-bounce{0%{transform:scale(.92)}100%{transform:scale(1)}}
.pc-btn[data-anim=ripple]{overflow:hidden}
.pc-btn-ripple{position:absolute;z-index:-1;border-radius:9999px;background:currentColor;opacity:.25;transform:scale(0);animation:pc-btn-ripple .6s ease-out forwards;pointer-events:none}
@keyframes pc-btn-ripple{to{transform:scale(1);opacity:0}}
/* Loading: the label blurs out and its column collapses, so the button narrows around the spinner. */
.pc-btn-label{display:inline-grid;grid-template-columns:1fr;transition:grid-template-columns 240ms var(--pc-ease-out),opacity 150ms ease,filter 150ms ease,margin 240ms var(--pc-ease-out)}
.pc-btn-label>span{min-width:0;overflow:hidden}
.pc-btn[aria-busy=true] .pc-btn-label{grid-template-columns:0fr;opacity:0;filter:blur(4px);margin-inline-start:-.5em}
.pc-btn-spin{animation:pc-btn-spin .7s linear infinite}
@keyframes pc-btn-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){
  .pc-btn,.pc-btn *{transition:none!important}
  .pc-btn:active{scale:none!important}
  .pc-btn[aria-busy=true] .pc-btn-label{filter:none}
  .pc-btn::after,.pc-btn::before,.pc-btn-ripple{animation:none!important;display:none}
  .pc-btn[data-anim=bounce]:active{animation:none}
  /* Loading: the label blurs out and its column collapses, so the button narrows around the spinner. */
.pc-btn-label{display:inline-grid;grid-template-columns:1fr;transition:grid-template-columns 240ms var(--pc-ease-out),opacity 150ms ease,filter 150ms ease,margin 240ms var(--pc-ease-out)}
.pc-btn-label>span{min-width:0;overflow:hidden}
.pc-btn[aria-busy=true] .pc-btn-label{grid-template-columns:0fr;opacity:0;filter:blur(4px);margin-inline-start:-.5em}
.pc-btn-spin{animation-duration:1.6s}
}
`

const SIZES: Record<ButtonSize, string> = {
  xs: "h-7 gap-1 px-2.5 text-xs [&_svg]:size-3.5",
  sm: "h-8 gap-1.5 px-3 text-sm [&_svg]:size-4",
  md: "h-10 gap-2 px-4 text-sm [&_svg]:size-4",
  lg: "h-11 gap-2 px-5 text-base [&_svg]:size-[18px]",
  xl: "h-13 gap-2.5 px-7 text-base [&_svg]:size-5",
}
const ICON_SIZES: Record<ButtonSize, string> = { xs: "size-7", sm: "size-8", md: "size-10", lg: "size-11", xl: "size-13" }
const SHAPES: Record<ButtonShape, string> = { square: "rounded-none", rounded: "rounded-lg", pill: "rounded-full" }

export function Button({
  variant = "solid",
  tone = "primary",
  shadow = "none",
  animation = "none",
  shape = "rounded",
  size = "md",
  iconOnly,
  fullWidth,
  loading,
  iconLeft,
  iconRight,
  sound,
  className,
  children,
  disabled,
  onPointerDown,
  onClick,
  ref: refProp,
  ...props
}: ButtonProps) {
  const ref = React.useRef<HTMLButtonElement>(null)
  const cue = useCue(sound)
  // Merge the caller's ref with the internal one (the ripple needs it).
  const setRef = React.useCallback(
    (el: HTMLButtonElement | null) => {
      ref.current = el
      if (typeof refProp === "function") refProp(el)
      else if (refProp) refProp.current = el
    },
    [refProp],
  )

  const ripple = (e: React.PointerEvent<HTMLButtonElement>) => {
    onPointerDown?.(e)
    if (animation !== "ripple" || !ref.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const r = ref.current.getBoundingClientRect()
    const d = Math.max(r.width, r.height) * 2.2
    const span = document.createElement("span")
    span.className = "pc-btn-ripple"
    span.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`
    ref.current.appendChild(span)
    span.addEventListener("animationend", () => span.remove())
  }

  return (
    <>
      <GooduiTokens />
      <style href="pc-button" precedence="default">
        {CSS}
      </style>
      <button
        ref={setRef}
        data-slot="button"
        data-variant={variant}
        data-tone={tone}
        data-shadow={variant === "neo" || variant === "pushable" ? "none" : shadow}
        data-anim={animation}
        aria-busy={loading || undefined}
        disabled={disabled || loading}
        onPointerDown={ripple}
        onClick={(e) => {
          onClick?.(e)
          cue("tap")
        }}
        className={cn(
          "pc-btn inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap select-none outline-none",
          "focus-visible:ring-3 focus-visible:ring-[color-mix(in_oklab,var(--pc-c)_45%,transparent)] disabled:pointer-events-none disabled:opacity-55",
          "[&_svg]:shrink-0 [&_svg]:pointer-events-none",
          variant !== "neo" && variant !== "pushable" && animation === "none" && "transition-colors",
          SIZES[size],
          iconOnly && cn(ICON_SIZES[size], "px-0"),
          SHAPES[shape],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading ? (
          <svg className="pc-btn-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : (
          iconLeft && <span data-slot="icon-left" className="inline-flex">{iconLeft}</span>
        )}
        {children == null || iconOnly ? children : <span className="pc-btn-label"><span>{children}</span></span>}
        {iconRight && !loading && <span data-slot="icon-right" className="inline-flex">{iconRight}</span>}
      </button>
    </>
  )
}
