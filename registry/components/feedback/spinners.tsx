"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { GooduiTokens } from "@/lib/goodui-motion"

// All six loaders are CSS only. They are sized in em from the root's font-size and painted with currentColor.
const CSS = `
@keyframes pc-spinners-rotate { to { transform: rotate(360deg) } }
@keyframes pc-spinners-dot { 0%, 80%, 100% { transform: scale(.45); opacity: .35 } 40% { transform: scale(1); opacity: 1 } }
@keyframes pc-spinners-bar { 0%, 100% { transform: scaleY(.35); opacity: .45 } 50% { transform: scaleY(1); opacity: 1 } }
@keyframes pc-spinners-pulse { 0% { transform: scale(.1); opacity: .9 } 100% { transform: scale(1); opacity: 0 } }
@keyframes pc-spinners-hop { 0%, 60%, 100% { transform: translateY(0); opacity: .45 } 30% { transform: translateY(-.22em); opacity: 1 } }
@keyframes pc-spinners-fade { 0%, 100% { opacity: .35 } 50% { opacity: 1 } }
:where(.pc-spinners) { display: inline-flex; flex-shrink: 0; position: relative; width: 1em; height: 1em; vertical-align: middle; color: inherit; }
.pc-spinners-ring { animation: pc-spinners-rotate .75s linear infinite; }
.pc-spinners-dots, .pc-spinners-typing { align-items: center; justify-content: space-between; padding: 0 .04em; }
.pc-spinners-dots > i, .pc-spinners-typing > i { display: block; width: .25em; height: .25em; border-radius: 9999px; background: currentColor; }
.pc-spinners-dots > i { animation: pc-spinners-dot 1.1s ease-in-out infinite; }
.pc-spinners-typing > i { animation: pc-spinners-hop 1s ease-in-out infinite; }
.pc-spinners-dots > i:nth-child(2), .pc-spinners-typing > i:nth-child(2) { animation-delay: .15s }
.pc-spinners-dots > i:nth-child(3), .pc-spinners-typing > i:nth-child(3) { animation-delay: .3s }
.pc-spinners-bars { align-items: center; justify-content: space-between; padding: .1em .06em; }
.pc-spinners-bars > i { display: block; width: .14em; height: 100%; border-radius: 9999px; background: currentColor; animation: pc-spinners-bar .9s ease-in-out infinite; }
.pc-spinners-bars > i:nth-child(2) { animation-delay: .12s }
.pc-spinners-bars > i:nth-child(3) { animation-delay: .24s }
.pc-spinners-bars > i:nth-child(4) { animation-delay: .36s }
.pc-spinners-pulse > i { position: absolute; inset: 0; border-radius: 9999px; background: currentColor; animation: pc-spinners-pulse 1.4s var(--pc-ease-out) infinite; }
.pc-spinners-pulse > i:nth-child(2) { animation-delay: .7s }
.pc-spinners-orbit::before { content: ""; position: absolute; inset: 0; border-radius: 9999px; border: max(1px, .06em) solid currentColor; opacity: .18; }
.pc-spinners-orbit > i { position: absolute; border-radius: 9999px; animation: pc-spinners-rotate 1.2s linear infinite; }
.pc-spinners-orbit > i::after { content: ""; position: absolute; left: 50%; top: 0; border-radius: 9999px; background: currentColor; }
.pc-spinners-orbit > i:nth-child(1) { inset: 0; }
.pc-spinners-orbit > i:nth-child(1)::after { width: .2em; height: .2em; margin: -.07em 0 0 -.1em; }
.pc-spinners-orbit > i:nth-child(2) { inset: .26em; animation-duration: .8s; animation-direction: reverse; }
.pc-spinners-orbit > i:nth-child(2)::after { width: .14em; height: .14em; margin: -.07em 0 0 -.07em; opacity: .7; }
@media (prefers-reduced-motion: reduce) {
  .pc-spinners-ring, .pc-spinners-orbit > i { animation: none; }
  .pc-spinners-ring, .pc-spinners-orbit, .pc-spinners-pulse { animation: pc-spinners-fade 1.6s ease-in-out infinite; }
  .pc-spinners-pulse > i { animation: none; transform: scale(.6); opacity: .8; }
  .pc-spinners-dots > i, .pc-spinners-typing > i, .pc-spinners-bars > i { animation-name: pc-spinners-fade; animation-duration: 1.6s; transform: none; }
}
`

export type SpinnerVariant = "ring" | "dots" | "bars" | "pulse" | "orbit" | "typing"

export type SpinnerProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** Loader style: ring, dots, bars, pulse, orbit or typing. */
  variant?: SpinnerVariant
  /** Preset or a size in px. */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number
  /** Read by screen readers. Pass null when a parent already announces the busy state. */
  label?: string | null
}

const SIZES = { xs: 12, sm: 16, md: 24, lg: 32, xl: 48 }

function Parts({ variant }: { variant: SpinnerVariant }) {
  switch (variant) {
    case "ring":
      return (
        <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%" aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity=".18" strokeWidth="3" />
          <path d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )
    case "dots":
    case "typing":
      return (
        <>
          <i />
          <i />
          <i />
        </>
      )
    case "bars":
      return (
        <>
          <i />
          <i />
          <i />
          <i />
        </>
      )
    case "pulse":
    case "orbit":
      return (
        <>
          <i />
          <i />
        </>
      )
  }
}

/** Six CSS-only loaders (ring, dots, bars, pulse, orbit, typing). Sized in px or presets, colored by currentColor. */
export function Spinner({ variant = "ring", size = "md", label = "Loading", className, style, ...props }: SpinnerProps) {
  const px = typeof size === "number" ? size : SIZES[size]
  return (
    <span
      role={label === null ? undefined : "status"}
      aria-hidden={label === null ? true : undefined}
      className={cn("pc-spinners", `pc-spinners-${variant}`, className)}
      style={{ fontSize: px, ...style }}
      {...props}
    >
      <GooduiTokens />
      <style href="pc-spinners" precedence="default">
        {CSS}
      </style>
      <Parts variant={variant} />
      {label !== null && <span className="sr-only">{label}</span>}
    </span>
  )
}

type VariantSpinnerProps = Omit<SpinnerProps, "variant">

export function SpinnerRing(props: VariantSpinnerProps) {
  return <Spinner variant="ring" {...props} />
}
export function SpinnerDots(props: VariantSpinnerProps) {
  return <Spinner variant="dots" {...props} />
}
export function SpinnerBars(props: VariantSpinnerProps) {
  return <Spinner variant="bars" {...props} />
}
export function SpinnerPulse(props: VariantSpinnerProps) {
  return <Spinner variant="pulse" {...props} />
}
export function SpinnerOrbit(props: VariantSpinnerProps) {
  return <Spinner variant="orbit" {...props} />
}
export function SpinnerTyping(props: VariantSpinnerProps) {
  return <Spinner variant="typing" {...props} />
}
