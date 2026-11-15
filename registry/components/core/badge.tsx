"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens } from "@/lib/goodui-motion"

/*
 * One badge, independent layers: every axis combines with every other.
 *   variant   how it is painted          tone      which color
 *   shadow    how it sits on the page    animation how it moves
 *   shape     corners                    size      scale
 * plus icon, removable (× with exit animation), clickable (renders a real <button>) and max ("99+").
 */

export type BadgeVariant = "solid" | "soft" | "outline" | "dot" | "gradient" | "glass" | "neo"
export type BadgeTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type BadgeShadow = "none" | "sm" | "md" | "glow"
export type BadgeAnimation = "none" | "pulse" | "shine" | "bounce-in" | "count"
export type BadgeShape = "square" | "rounded" | "pill"
export type BadgeSize = "xs" | "sm" | "md"

export type BadgeLabels = { remove: string }
const DEFAULT_LABELS: BadgeLabels = { remove: "Remove" }

export type BadgeProps = Omit<React.HTMLAttributes<HTMLElement>, "color"> & {
  /** How it is painted: solid fill, soft tint (default), outline, neutral with a colored dot, gradient, frosted glass or neo-brutalist. */
  variant?: BadgeVariant
  /** Color by meaning; drives every variant through CSS variables. */
  tone?: BadgeTone
  /** Drop shadow; glow uses the tone color. Ignored by neo, which has its own offset shadow. */
  shadow?: BadgeShadow
  /** pulse pings a status dot, shine sweeps a light, bounce-in plays on mount, count pops when the content changes. */
  animation?: BadgeAnimation
  shape?: BadgeShape
  size?: BadgeSize
  /** Leading icon. On the dot variant it replaces the dot. */
  icon?: React.ReactNode
  /** Shows a × button; the badge animates out, then calls onRemove. */
  removable?: boolean
  /** Called after the exit animation (instantly with reduced motion). Remove the item from your state here. */
  onRemove?: () => void
  /** Renders a real <button> with hover and focus states. */
  clickable?: boolean
  /** Numbers above max render as "max+". */
  max?: number
  /** Dims the badge and disables its button (clickable) or × button. */
  disabled?: boolean
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<BadgeLabels>
}

const CSS = `
.pc-badge{--pc-c:var(--primary);--pc-fg:var(--primary-foreground);isolation:isolate;-webkit-tap-highlight-color:transparent}
.pc-badge[data-tone=neutral]{--pc-c:var(--foreground);--pc-fg:var(--background)}
.pc-badge[data-tone=success]{--pc-c:oklch(0.53 0.13 155);--pc-fg:#fff}
.pc-badge[data-tone=warning]{--pc-c:oklch(0.75 0.16 70);--pc-fg:oklch(0.25 0.05 70)}
.pc-badge[data-tone=danger]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff}
.pc-badge[data-tone=info]{--pc-c:oklch(0.55 0.17 250);--pc-fg:#fff}
.dark .pc-badge[data-tone=success]{--pc-c:oklch(0.7 0.16 155);--pc-fg:oklch(0.2 0.05 155)}
.dark .pc-badge[data-tone=danger]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25)}
.dark .pc-badge[data-tone=info]{--pc-c:oklch(0.7 0.15 245);--pc-fg:oklch(0.2 0.05 245)}
.pc-badge{--pc-tint:color-mix(in oklab,var(--pc-c) 14%,transparent);--pc-ink:color-mix(in oklab,var(--pc-c) 82%,var(--foreground))}
.pc-badge[data-tone=warning]{--pc-ink:color-mix(in oklab,var(--pc-c) 62%,var(--foreground))}
/* White text on the gradient needs darker fuchsia/amber stops in light mode. */
.pc-badge:is([data-tone=success],[data-tone=info],[data-tone=danger]){--pc-g1:#a21caf;--pc-g2:#b45309}
.dark .pc-badge:is([data-tone=success],[data-tone=info],[data-tone=danger]){--pc-g1:#d946ef;--pc-g2:#f59e0b}

.pc-badge{border:1px solid transparent;box-shadow:var(--pc-hl,0 0 #0000),var(--pc-v,0 0 #0000),var(--pc-sh,0 0 #0000)}
.pc-badge[data-variant=solid]{background:var(--pc-c);color:var(--pc-fg)}
.pc-badge[data-variant=soft]{background:var(--pc-tint);color:var(--pc-ink)}
.pc-badge[data-variant=outline]{border-color:color-mix(in oklab,var(--pc-c) 45%,var(--border));color:var(--pc-ink)}
.pc-badge[data-variant=dot]{border-color:var(--border);background:var(--background);color:var(--foreground)}
.pc-badge[data-variant=gradient]{color:var(--pc-fg);background:linear-gradient(135deg,var(--pc-c),color-mix(in oklab,var(--pc-c) 55%,var(--pc-g1,#d946ef)) 55%,color-mix(in oklab,var(--pc-c) 50%,var(--pc-g2,#f59e0b)))}
.pc-badge[data-variant=glass]{color:var(--foreground);background:color-mix(in oklab,var(--background) 45%,transparent);border-color:color-mix(in oklab,var(--foreground) 14%,transparent);-webkit-backdrop-filter:blur(12px) saturate(1.6);backdrop-filter:blur(12px) saturate(1.6);--pc-v:inset 0 1px 0 color-mix(in oklab,white 40%,transparent)}
.pc-badge[data-variant=neo]{background:var(--pc-c);color:var(--pc-fg);border:1.5px solid var(--foreground);--pc-v:2px 2px 0 var(--foreground)}

.pc-badge-dot{position:relative;display:inline-block;flex:none;width:.5em;height:.5em;border-radius:9999px;background:var(--pc-c)}
.pc-badge:not([data-variant=dot]) .pc-badge-dot{background:currentColor}

.pc-badge[data-shadow=sm]{--pc-sh:0 1px 2px rgb(0 0 0/.14)}
.pc-badge[data-shadow=md]{--pc-sh:0 4px 10px -3px rgb(0 0 0/.22)}
.pc-badge[data-shadow=glow]{--pc-sh:0 4px 16px -3px color-mix(in oklab,var(--pc-c) 70%,transparent)}

.pc-badge[data-clickable]{cursor:pointer;transition:box-shadow .15s,transform .15s}
.pc-badge[data-clickable]:hover{--pc-hl:inset 0 0 0 100vmax color-mix(in oklab,currentColor 9%,transparent)}
.pc-badge[data-clickable]:active{transform:scale(.96)}
.pc-badge[data-clickable][data-variant=neo]:active{transform:translate(2px,2px);--pc-v:0 0 0 var(--foreground)}
.pc-badge-x{display:inline-flex;align-items:center;justify-content:center;border-radius:9999px;opacity:.7;cursor:pointer;transition:opacity .15s,background-color .15s}
.pc-badge-x:hover{opacity:1;background:color-mix(in oklab,currentColor 16%,transparent)}

.pc-badge[data-anim=pulse] .pc-badge-dot::after{content:"";position:absolute;inset:0;border-radius:inherit;background:inherit;animation:pc-badge-ping 1.6s var(--pc-ease-out) infinite}
@keyframes pc-badge-ping{75%,100%{transform:scale(2.6);opacity:0}}
.pc-badge[data-anim=shine]{overflow:hidden}
.pc-badge[data-anim=shine]::after{content:"";position:absolute;inset:0;z-index:-1;width:50%;background:linear-gradient(100deg,transparent,rgb(255 255 255/.5),transparent);transform:translateX(-160%) skewX(-18deg);animation:pc-badge-sweep 3s ease-in-out infinite;pointer-events:none}
.pc-badge[data-anim=shine][data-variant=soft]::after,.pc-badge[data-anim=shine][data-variant=outline]::after,.pc-badge[data-anim=shine][data-variant=dot]::after{background:linear-gradient(100deg,transparent,color-mix(in oklab,var(--pc-c) 22%,transparent),transparent)}
@keyframes pc-badge-sweep{0%{transform:translateX(-160%) skewX(-18deg)}55%,100%{transform:translateX(320%) skewX(-18deg)}}
.pc-badge[data-anim=bounce-in]{animation:pc-badge-in .5s var(--pc-ease-spring) both}
@keyframes pc-badge-in{0%{transform:scale(.3);opacity:0}100%{transform:scale(1);opacity:1}}
.pc-badge-tick{display:inline-block;animation:pc-badge-tick .38s var(--pc-ease-spring) both}
@keyframes pc-badge-tick{0%{transform:translateY(55%) scale(.8);opacity:0}100%{transform:none;opacity:1}}
.pc-badge[data-pop=a]{animation:pc-badge-pop-a .38s var(--pc-ease-spring)}
.pc-badge[data-pop=b]{animation:pc-badge-pop-b .38s var(--pc-ease-spring)}
@keyframes pc-badge-pop-a{0%{transform:scale(1.18)}100%{transform:scale(1)}}
@keyframes pc-badge-pop-b{0%{transform:scale(1.18)}100%{transform:scale(1)}}
.pc-badge[data-leaving]{animation:pc-badge-out .18s ease-in forwards;pointer-events:none}
@keyframes pc-badge-out{to{transform:scale(.6);opacity:0}}
@media (prefers-reduced-motion:reduce){
  .pc-badge,.pc-badge *{transition:none!important;animation:none!important}
  .pc-badge::after,.pc-badge-dot::after{display:none}
}
`

const SIZES: Record<BadgeSize, string> = {
  xs: "h-5 gap-1 px-1.5 text-[10.5px] [&_svg]:size-3",
  sm: "h-6 gap-1 px-2 text-xs [&_svg]:size-3.5",
  md: "h-7 gap-1.5 px-2.5 text-[13px] [&_svg]:size-3.5",
}
const X_SIZES: Record<BadgeSize, string> = { xs: "-me-0.5 size-3.5 [&_svg]:size-2.5", sm: "-me-1 size-4 [&_svg]:size-3", md: "-me-1 size-[18px] [&_svg]:size-3" }
const SHAPES: Record<BadgeShape, string> = { square: "rounded-none", rounded: "rounded-md", pill: "rounded-full" }

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

export function Badge({
  variant = "soft",
  tone = "primary",
  shadow = "none",
  animation = "none",
  shape = "pill",
  size = "sm",
  icon,
  removable,
  onRemove,
  clickable,
  max,
  disabled,
  className,
  children,
  labels,
  ...props
}: BadgeProps) {
  const l = useLabels("badge", DEFAULT_LABELS, labels)
  const [leaving, setLeaving] = React.useState(false)
  const [gone, setGone] = React.useState(false)
  const content = typeof children === "number" && max !== undefined && children > max ? `${max}+` : children
  const key = typeof content === "string" || typeof content === "number" ? String(content) : null

  // "count": pop when the content changes (never on first render).
  const [tick, setTick] = React.useState(0)
  const first = React.useRef(true)
  React.useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (animation === "count" && key !== null) setTick((t) => t + 1)
  }, [key, animation])

  // A new label or toggling removable brings a removed (uncontrolled) badge back.
  React.useEffect(() => {
    setGone(false)
    setLeaving(false)
  }, [key, removable])

  if (gone) return null

  const finish = () => {
    setLeaving(false)
    setGone(true)
    onRemove?.()
  }
  const remove = (e: React.SyntheticEvent) => {
    e.stopPropagation()
    if (reduced()) finish()
    else setLeaving(true)
  }

  const dot = variant === "dot" && !icon ? <span className="pc-badge-dot" aria-hidden="true" /> : null
  const iconEl = icon ? <span data-slot="icon" className="inline-flex" aria-hidden="true">{icon}</span> : null
  const pulseDot = animation === "pulse" && variant !== "dot" && !icon ? <span className="pc-badge-dot" aria-hidden="true" /> : null
  const label =
    animation === "count" && tick > 0 ? (
      <span key={tick} className="pc-badge-tick tabular-nums">
        {content}
      </span>
    ) : (
      content
    )

  const xProps = {
    "aria-label": l.remove,
    className: cn("pc-press pc-badge-x outline-none focus-visible:ring-2 focus-visible:ring-current/40", X_SIZES[size]),
  }
  const x = removable ? (
    clickable ? (
      <span
        role="button"
        // Out of the tab order (and inert) when the badge is disabled.
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        {...xProps}
        onClick={(e) => {
          if (disabled) e.stopPropagation()
          else remove(e)
        }}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            remove(e)
          }
        }}
      >
        <X />
      </span>
    ) : (
      <button type="button" {...xProps} onClick={remove} disabled={disabled}>
        <X />
      </button>
    )
  ) : null

  const shared = {
    "data-slot": "badge",
    "data-variant": variant,
    "data-tone": tone,
    "data-shadow": variant === "neo" ? "none" : shadow,
    "data-anim": animation,
    "data-clickable": clickable ? "" : undefined,
    "data-leaving": leaving ? "" : undefined,
    "data-pop": animation === "count" && tick > 0 ? (tick % 2 ? "a" : "b") : undefined,
    onAnimationEnd: (e: React.AnimationEvent<HTMLElement>) => {
      if (leaving && e.animationName === "pc-badge-out") finish()
      props.onAnimationEnd?.(e)
    },
    className: cn(
      "pc-badge relative inline-flex w-fit shrink-0 items-center justify-center font-medium whitespace-nowrap select-none align-middle leading-none",
      "[&_svg]:shrink-0 [&_svg]:pointer-events-none",
      clickable && "outline-none focus-visible:ring-3 focus-visible:ring-[color-mix(in_oklab,var(--pc-c)_45%,transparent)] disabled:pointer-events-none disabled:opacity-55",
      !clickable && disabled && "opacity-55",
      SIZES[size],
      SHAPES[shape],
      removable && "pe-1",
      className,
    ),
  }
  const inner = (
    <>
      {dot}
      {pulseDot}
      {iconEl}
      {label}
      {x}
    </>
  )

  return (
    <>
      <GooduiTokens />
      <style href="pc-badge" precedence="default">
        {CSS}
      </style>
      {clickable ? (
        <button type="button" disabled={disabled} {...props} {...shared}>
          {inner}
        </button>
      ) : (
        <span {...props} {...shared}>
          {inner}
        </span>
      )}
    </>
  )
}
