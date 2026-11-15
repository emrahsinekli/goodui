"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// ::before is the soft fill under the content, ::after lights up only the border ring (mask exclude trick).
const CSS = `
.pc-spotlight-card { --pc-x: -1000px; --pc-y: -1000px; position: relative; isolation: isolate }
.pc-spotlight-card::before, .pc-spotlight-card::after {
  content: ""; position: absolute; pointer-events: none; border-radius: inherit;
  opacity: 0; transition: opacity 0.35s ease;
}
.pc-spotlight-card::before {
  inset: 0; z-index: -1;
  background: radial-gradient(var(--pc-spot-size, 360px) circle at var(--pc-x) var(--pc-y), var(--pc-spot-fill, color-mix(in oklch, var(--foreground) 7%, transparent)), transparent 70%);
}
.pc-spotlight-card::after {
  inset: calc(var(--pc-spot-bw, 1px) * -1); padding: var(--pc-spot-bw, 1px); z-index: 1;
  background: radial-gradient(calc(var(--pc-spot-size, 360px) * 0.75) circle at calc(var(--pc-x) + var(--pc-spot-bw, 1px)) calc(var(--pc-y) + var(--pc-spot-bw, 1px)), var(--pc-spot-border, color-mix(in oklch, var(--foreground) 50%, transparent)), transparent 70%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
}
.pc-spotlight-card[data-active]::before, .pc-spotlight-card[data-active]::after { opacity: 1 }
.pc-spotlight-card[data-linked]:not([data-hovered])::before { opacity: 0 }
@media (prefers-reduced-motion: reduce) { .pc-spotlight-card::before, .pc-spotlight-card::after { transition: none } }
`

const GroupContext = React.createContext(false)

function place(card: HTMLElement, clientX: number, clientY: number) {
  const r = card.getBoundingClientRect()
  card.style.setProperty("--pc-x", `${clientX - r.left}px`)
  card.style.setProperty("--pc-y", `${clientY - r.top}px`)
}

export type SpotlightCardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Fill color of the soft spotlight. */
  spotlightColor?: string
  /** Color of the lit border. */
  borderColor?: string
  /** Diameter of the spotlight in px. */
  size?: number
  /** Border width the highlight should cover, in px (match the card's border). */
  borderWidth?: number
}

/** A card with a soft radial spotlight and a lit border that follow the pointer. CSS variables only, no re-renders. */
export function SpotlightCard({
  spotlightColor,
  borderColor,
  size = 360,
  borderWidth = 1,
  className,
  style,
  children,
  onPointerMove,
  onPointerEnter,
  onPointerLeave,
  ...props
}: SpotlightCardProps) {
  const linked = React.useContext(GroupContext)
  return (
    <>
      <style href="pc-spotlight-card" precedence="default">
        {CSS}
      </style>
      <div
        data-pc-spotlight=""
        data-linked={linked ? "" : undefined}
        className={cn("pc-spotlight-card rounded-xl border bg-card text-card-foreground", className)}
        style={{
          ...style,
          ["--pc-spot-size" as string]: `${size}px`,
          ["--pc-spot-bw" as string]: `${borderWidth}px`,
          ...(spotlightColor ? { ["--pc-spot-fill" as string]: spotlightColor } : {}),
          ...(borderColor ? { ["--pc-spot-border" as string]: borderColor } : {}),
        }}
        onPointerEnter={(e) => {
          if (linked) e.currentTarget.setAttribute("data-hovered", "")
          else e.currentTarget.setAttribute("data-active", "")
          onPointerEnter?.(e)
        }}
        onPointerMove={(e) => {
          if (!linked) place(e.currentTarget, e.clientX, e.clientY)
          onPointerMove?.(e)
        }}
        onPointerLeave={(e) => {
          e.currentTarget.removeAttribute(linked ? "data-hovered" : "data-active")
          onPointerLeave?.(e)
        }}
        {...props}
      >
        {children}
      </div>
    </>
  )
}

export type SpotlightGroupProps = React.HTMLAttributes<HTMLDivElement>

/**
 * Links the spotlight of every SpotlightCard inside it: moving over the group lights the borders of nearby cards
 * too, while only the hovered card gets the fill.
 */
export function SpotlightGroup({ className, children, onPointerMove, onPointerLeave, ...props }: SpotlightGroupProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const frame = React.useRef(0)
  React.useEffect(() => () => cancelAnimationFrame(frame.current), [])

  return (
    <GroupContext.Provider value={true}>
      <div
        ref={ref}
        className={cn(className)}
        onPointerMove={(e) => {
          const { clientX, clientY } = e
          cancelAnimationFrame(frame.current)
          frame.current = requestAnimationFrame(() => {
            ref.current?.querySelectorAll<HTMLElement>("[data-pc-spotlight]").forEach((card) => {
              place(card, clientX, clientY)
              card.setAttribute("data-active", "")
            })
          })
          onPointerMove?.(e)
        }}
        onPointerLeave={(e) => {
          cancelAnimationFrame(frame.current)
          ref.current?.querySelectorAll<HTMLElement>("[data-pc-spotlight]").forEach((card) => card.removeAttribute("data-active"))
          onPointerLeave?.(e)
        }}
        {...props}
      >
        {children}
      </div>
    </GroupContext.Provider>
  )
}
