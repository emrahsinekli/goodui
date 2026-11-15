"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

// Glass = translucent tint + backdrop blur/saturate + inner rim light. ::before is the specular highlight that follows
// the pointer (CSS variables, no re-render); ::after is a gradient rim drawn with a mask.
const CSS = `
.pc-liquid-glass {
  position: relative; isolation: isolate; color: #fff; text-shadow: 0 1px 2px rgb(0 0 0 / .22);
  background: linear-gradient(180deg, rgb(255 255 255 / .26), rgb(255 255 255 / .08));
  -webkit-backdrop-filter: blur(var(--pc-lg-blur, 14px)) saturate(170%);
  backdrop-filter: blur(var(--pc-lg-blur, 14px)) saturate(170%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .5), inset 0 -1px 1px rgb(255 255 255 / .1), 0 10px 30px -10px rgb(0 0 0 / .35), 0 2px 6px -2px rgb(0 0 0 / .18);
}
.pc-liquid-glass[data-tone="dark"] {
  background: linear-gradient(180deg, rgb(24 24 32 / .42), rgb(24 24 32 / .22));
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .2), 0 10px 30px -10px rgb(0 0 0 / .55), 0 2px 6px -2px rgb(0 0 0 / .3);
}
.pc-liquid-glass::before {
  content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; pointer-events: none;
  background: radial-gradient(var(--pc-lg-size, 110px) circle at var(--pc-lg-x, 50%) var(--pc-lg-y, -20%), rgb(255 255 255 / .5), transparent 70%);
  opacity: .35; transition: opacity .35s ease;
}
.pc-liquid-glass:hover::before { opacity: 1 }
.pc-liquid-glass::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none;
  background: linear-gradient(140deg, rgb(255 255 255 / .85), rgb(255 255 255 / .15) 35%, rgb(255 255 255 / .05) 60%, rgb(255 255 255 / .45));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
}
.pc-liquid-glass[data-tone="dark"]::after { opacity: .45 }
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .pc-liquid-glass { background: rgb(255 255 255 / .78); color: #18181b; text-shadow: none }
  .pc-liquid-glass[data-tone="dark"] { background: rgb(24 24 32 / .85); color: #fff }
}
.pc-liquid-glass[data-fallback] {
  -webkit-backdrop-filter: none; backdrop-filter: none;
  background: rgb(255 255 255 / .78); color: #18181b; text-shadow: none;
}
.pc-liquid-glass[data-fallback][data-tone="dark"] { background: rgb(24 24 32 / .85); color: #fff }
@media (prefers-reduced-motion: reduce) { .pc-liquid-glass::before { transition: none } }
`

function Styles() {
  return (
    <style href="pc-liquid-glass-button" precedence="default">
      {CSS}
    </style>
  )
}

/** Moves the specular highlight with the pointer by writing CSS variables (no React re-render). */
function trackSpecular(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  el.style.setProperty("--pc-lg-x", `${e.clientX - r.left}px`)
  el.style.setProperty("--pc-lg-y", `${e.clientY - r.top}px`)
}

const SIZES = {
  sm: "h-8 gap-1.5 px-3.5 text-xs [&_svg]:size-3.5",
  md: "h-10 gap-2 px-5 text-sm [&_svg]:size-4",
  lg: "h-12 gap-2 px-7 text-base [&_svg]:size-5",
  icon: "size-11 [&_svg]:size-5",
} as const

type GlassBase = {
  /** "light" is a white tint for colorful or bright backdrops; "dark" a smoky tint. */
  tone?: "light" | "dark"
  /** Backdrop blur in px. */
  blur?: number
  /** Force the no-backdrop-filter look (to preview the fallback). */
  fallback?: boolean
}

export type LiquidGlassButtonProps = Omit<React.ComponentProps<"button">, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> &
  GlassBase & {
    /** "sm" | "md" | "lg" | "icon"; "icon" is a round 44px button. */
    size?: keyof typeof SIZES
  }

/** Frosted "liquid glass" button: backdrop blur, rim light and a specular highlight that follows the pointer. */
export function LiquidGlassButton({ tone = "light", blur = 14, fallback, size = "md", className, style, onPointerMove, children, ...props }: LiquidGlassButtonProps) {
  const reduce = useReducedMotion() ?? false
  return (
    <>
      <GooduiTokens />
      <Styles />
      <motion.button
        data-slot="button"
        data-tone={tone}
        data-fallback={fallback || undefined}
        whileHover={reduce ? undefined : { scale: 1.03 }}
        whileTap={reduce ? undefined : { scale: 0.95 }}
        transition={spring.play}
        onPointerMove={(e) => {
          trackSpecular(e)
          onPointerMove?.(e)
        }}
        className={cn(
          "pc-liquid-glass inline-flex shrink-0 items-center justify-center rounded-full font-medium whitespace-nowrap outline-none select-none focus-visible:ring-3 focus-visible:ring-white/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 [&_svg]:drop-shadow-[0_1px_1px_rgb(0_0_0/0.2)]",
          SIZES[size],
          className,
        )}
        style={{ ...style, ["--pc-lg-blur" as string]: `${blur}px` }}
        {...props}
      >
        {children}
      </motion.button>
    </>
  )
}

type ToolbarCtx = { value: string | undefined; select: (v: string) => void; id: string; reduce: boolean }
const Ctx = React.createContext<ToolbarCtx | null>(null)

export type LiquidGlassToolbarProps = Omit<React.ComponentProps<"div">, "defaultValue"> &
  GlassBase & {
    /** Controlled selected item (the item's value). */
    value?: string
    /** Initially selected item when uncontrolled. */
    defaultValue?: string
    /** Called with the item's value when an item is clicked. */
    onValueChange?: (value: string) => void
  }

/** Pill toolbar made of glass; the selected item gets a brighter lens that glides between items. Arrow keys move focus. */
export function LiquidGlassToolbar({
  tone = "light",
  blur = 16,
  fallback,
  value: valueProp,
  defaultValue,
  onValueChange,
  className,
  style,
  children,
  onKeyDown,
  onPointerMove,
  ...props
}: LiquidGlassToolbarProps) {
  const reduce = useReducedMotion() ?? false
  const [inner, setInner] = React.useState(defaultValue)
  const value = valueProp ?? inner
  const id = React.useId()
  const select = React.useCallback(
    (v: string) => {
      if (valueProp === undefined) setInner(v)
      onValueChange?.(v)
    },
    [valueProp, onValueChange],
  )

  return (
    <Ctx.Provider value={{ value, select, id, reduce }}>
      <Styles />
      <div
        role="toolbar"
        aria-orientation="horizontal"
        data-tone={tone}
        data-fallback={fallback || undefined}
        onPointerMove={(e) => {
          trackSpecular(e)
          onPointerMove?.(e)
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e)
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return
          const items = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("[data-glass-item]:not(:disabled)"))
          const i = items.indexOf(document.activeElement as HTMLButtonElement)
          if (i < 0) return
          e.preventDefault()
          // Under dir="rtl" the next item sits to the left, so the arrows swap.
          const forward = getComputedStyle(e.currentTarget).direction === "rtl" ? "ArrowLeft" : "ArrowRight"
          const next = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : (i + (e.key === forward ? 1 : -1) + items.length) % items.length
          items[next]?.focus()
        }}
        className={cn("pc-liquid-glass inline-flex items-center gap-1 rounded-full p-1 [--pc-lg-size:160px]", className)}
        style={{ ...style, ["--pc-lg-blur" as string]: `${blur}px` }}
        {...props}
      >
        {children}
      </div>
    </Ctx.Provider>
  )
}

export type LiquidGlassToolbarItemProps = Omit<React.ComponentProps<"button">, "value"> & {
  /** Identifies the item; when it matches the toolbar's value the item is selected (aria-pressed). */
  value: string
  /** Hide the text label on small screens and keep only the icon. */
  compact?: boolean
}

export function LiquidGlassToolbarItem({ value, compact, className, children, onClick, ...props }: LiquidGlassToolbarItemProps) {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error("LiquidGlassToolbarItem must be used inside LiquidGlassToolbar")
  const selected = ctx.value === value
  return (
    <button
      type="button"
      data-glass-item=""
      aria-pressed={selected}
      tabIndex={selected || ctx.value === undefined ? 0 : -1}
      onClick={(e) => {
        ctx.select(value)
        onClick?.(e)
      }}
      className={cn(
        "pc-press relative inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium whitespace-nowrap outline-none select-none focus-visible:ring-2 focus-visible:ring-white/70 [&_svg]:size-4 [&_svg]:shrink-0",
        selected ? "opacity-100" : "opacity-75 hover:opacity-100",
        compact && "[&>span>span]:hidden sm:[&>span>span]:inline",
        className,
      )}
      {...props}
    >
      <GooduiTokens />
      {selected && (
        <motion.span
          layoutId={`${ctx.id}-lens`}
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-white/25 shadow-[inset_0_1px_0_rgb(255_255_255/0.6),inset_0_-1px_1px_rgb(0_0_0/0.06),0_2px_8px_-2px_rgb(0_0_0/0.25)] in-data-fallback:bg-black/8 in-data-[tone=dark]:bg-white/15"
          transition={ctx.reduce ? { duration: 0 } : spring.ui}
        />
      )}
      <span className="relative inline-flex items-center gap-1.5">{children}</span>
    </button>
  )
}
