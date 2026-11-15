"use client"

import * as React from "react"
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react"
import { cn } from "@/lib/utils"
import { GooduiTokens, follow } from "@/lib/goodui-motion"

const CSS = `
.pc-tilt-foil{mix-blend-mode:hard-light;background-image:var(--pc-grain),repeating-linear-gradient(115deg,oklch(.72 .2 20),oklch(.85 .17 95) 6%,oklch(.8 .19 165) 12%,oklch(.68 .19 245) 18%,oklch(.66 .22 310) 24%,oklch(.72 .2 380) 30%);background-size:160px 160px,240% 240%}
.pc-tilt-edge{padding:1px;-webkit-mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}
`

const TiltContext = React.createContext<{ x: MotionValue<number>; y: MotionValue<number> } | null>(null)

export type TiltCardProps = Omit<React.HTMLAttributes<HTMLDivElement>, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"> & {
  /** Maximum tilt in degrees. */
  maxTilt?: number
  /** Scale while hovered. */
  scale?: number
  /** Show a light glare that follows the pointer. */
  glare?: boolean
  /** Peak opacity of the glare. */
  glareOpacity?: number
  /** Holographic foil that shifts its colors with the tilt. */
  foil?: boolean
  /** Peak opacity of the foil. */
  foilOpacity?: number
  /** A bright rim that follows the pointer around the card's edge. Follows `glare` by default. */
  specular?: boolean
  /** Sways gently on its own until a pointer takes over, so touch screens and still pages see it move. */
  autoplay?: boolean
  /** CSS perspective in px; lower is more dramatic. */
  perspective?: number
  /** Keep the card flat (no tilt, glare or scale). */
  disabled?: boolean
  /** Classes for the outer element that holds the perspective and receives the pointer. */
  containerClassName?: string
}

/**
 * Tilts toward the pointer on a spring, with glare, a specular rim, optional holographic foil and a shadow that shifts
 * with the tilt. Children wrapped in TiltCardLayer float and slide at their own depth. Touch and reduced motion get a
 * flat card unless `autoplay` is on (reduced motion stays flat).
 */
export function TiltCard({
  maxTilt = 10,
  scale = 1.02,
  glare = true,
  glareOpacity = 0.35,
  foil = false,
  foilOpacity = 0.7,
  specular: specularProp,
  autoplay = false,
  perspective = 900,
  disabled = false,
  containerClassName,
  className,
  style,
  children,
  ...props
}: TiltCardProps) {
  const reduce = useReducedMotion() ?? false
  const enabled = !reduce && !disabled
  const specular = specularProp ?? glare
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const hover = useMotionValue(0)
  const sx = useSpring(px, follow)
  const sy = useSpring(py, follow)
  const sh = useSpring(hover, follow)

  const rotateX = useTransform(sy, [0, 1], [maxTilt, -maxTilt])
  const rotateY = useTransform(sx, [0, 1], [-maxTilt, maxTilt])
  const s = useTransform(sh, [0, 1], [1, scale])
  const gx = useTransform(sx, (v) => `${v * 100}%`)
  const gy = useTransform(sy, (v) => `${v * 100}%`)
  const glareBg = useMotionTemplate`radial-gradient(circle at ${gx} ${gy}, rgb(255 255 255 / ${glareOpacity}), transparent 60%)`
  const shadowX = useTransform(sx, [0, 1], [14, -14])
  const shadowY = useTransform(sy, [0, 1], [18, 2])
  const shadowA = useTransform(sh, [0, 1], [0, 0.22])
  const shadow = useMotionTemplate`var(--pc-e2), ${shadowX}px ${shadowY}px 40px -12px hsl(var(--pc-sh) / ${shadowA})`
  const edgeBg = useMotionTemplate`radial-gradient(180px circle at ${gx} ${gy}, rgb(255 255 255 / .9), color-mix(in oklab, var(--foreground) 35%, transparent) 45%, transparent 75%)`
  const foilAmount = useTransform(sh, [0, 1], [0, foilOpacity])
  const fx = useTransform(sx, [0, 1], ["100%", "0%"])
  const fy = useTransform(sy, [0, 1], ["100%", "0%"])
  const foilPos = useMotionTemplate`0 0, ${fx} ${fy}`
  const foilMask = useMotionTemplate`radial-gradient(70% 90% at ${gx} ${gy}, #000 15%, rgb(0 0 0 / .25) 70%, transparent)`
  const depth = React.useMemo(() => ({ x: sx, y: sy }), [sx, sy])
  const hovering = React.useRef(false)
  const rootRef = React.useRef<HTMLDivElement>(null)

  const reset = () => {
    hovering.current = false
    px.set(0.5)
    py.set(0.5)
    hover.set(0)
  }

  React.useEffect(() => {
    if (!enabled) reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  // A slow figure-eight while nobody is touching it; paused off-screen.
  React.useEffect(() => {
    const el = rootRef.current
    if (!autoplay || !enabled || !el) return
    let raf = 0
    let visible = false
    const t0 = performance.now()
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick)
      if (hovering.current || document.hidden) return
      const s = (t - t0) / 1000
      px.set(0.5 + 0.38 * Math.sin(s * 0.8))
      py.set(0.5 + 0.3 * Math.sin(s * 1.3))
      hover.set(0.8)
    }
    const io = new IntersectionObserver(([e]) => {
      const on = !!e?.isIntersecting
      if (on === visible) return
      visible = on
      cancelAnimationFrame(raf)
      if (on) raf = requestAnimationFrame(tick)
    })
    io.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [autoplay, enabled, px, py, hover])

  return (
    <div
      ref={rootRef}
      className={cn("group/tilt", containerClassName)}
      style={{ perspective }}
      onPointerMove={(e) => {
        if (!enabled || e.pointerType === "touch") return
        hovering.current = true
        const r = e.currentTarget.getBoundingClientRect()
        px.set((e.clientX - r.left) / r.width)
        py.set((e.clientY - r.top) / r.height)
        hover.set(1)
      }}
      onPointerLeave={reset}
    >
      <GooduiTokens />
      <style href="pc-tilt-card" precedence="default">
        {CSS}
      </style>
      <motion.div
        className={cn("relative rounded-xl border bg-card text-card-foreground", className)}
        style={{ ...style, rotateX, rotateY, scale: s, boxShadow: shadow, transformStyle: "preserve-3d" }}
        {...props}
      >
        {foil && (
          <motion.div
            aria-hidden="true"
            className="pc-tilt-foil pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{ opacity: foilAmount, backgroundPosition: foilPos, maskImage: foilMask, WebkitMaskImage: foilMask }}
          />
        )}
        <TiltContext.Provider value={depth}>{children}</TiltContext.Provider>
        {glare && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{ background: glareBg, opacity: sh, transform: "translateZ(1px)" }}
          />
        )}
        {specular && <motion.div aria-hidden="true" className="pc-tilt-edge pointer-events-none absolute -inset-px rounded-[inherit]" style={{ background: edgeBg, opacity: sh, transform: "translateZ(2px)" }} />}
      </motion.div>
    </div>
  )
}

export type TiltCardLayerProps = Omit<React.HTMLAttributes<HTMLDivElement>, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"> & {
  /** How far the layer floats above the card, in px. */
  depth?: number
}

/** A child that floats above the tilting card and slides against it for parallax. Keep `overflow: hidden` off the elements between it and the card. */
export function TiltCardLayer({ depth = 30, className, style, ...props }: TiltCardLayerProps) {
  const ctx = React.useContext(TiltContext)
  const rest = useMotionValue(0.5)
  const shift = depth * 0.22
  const x = useTransform(ctx?.x ?? rest, [0, 1], [-shift, shift])
  const y = useTransform(ctx?.y ?? rest, [0, 1], [-shift, shift])
  return <motion.div className={cn(className)} style={{ ...style, x, y, z: depth, transformStyle: "preserve-3d" }} {...props} />
}
