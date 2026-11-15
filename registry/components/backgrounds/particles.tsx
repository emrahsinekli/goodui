"use client"

import * as React from "react"
import { useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

/** Resolves any CSS color (oklch, color-mix, var()) to RGBA by painting it once on a 1×1 canvas. */
function resolveColor(host: HTMLElement, color: string): [number, number, number, number] {
  const probe = document.createElement("span")
  probe.style.color = color
  probe.style.display = "none"
  host.appendChild(probe)
  const computed = getComputedStyle(probe).color
  probe.remove()
  const c = document.createElement("canvas")
  c.width = c.height = 1
  const ctx = c.getContext("2d", { willReadFrequently: true })
  if (!ctx) return [128, 128, 128, 1]
  ctx.fillStyle = "#808080"
  ctx.fillStyle = computed
  ctx.fillRect(0, 0, 1, 1)
  const [r = 128, g = 128, b = 128, a = 255] = ctx.getImageData(0, 0, 1, 1).data
  return [r, g, b, a / 255]
}

type Particle = { x: number; y: number; vx: number; vy: number; bx: number; by: number; r: number; a: number }

const SPRING_K = 90
const SPRING_D = 11
/** Alpha steps for the field: dots are batched per step, so 2,000 of them cost a dozen fill calls. */
const STEPS = 8

export type ParticlesProps = React.HTMLAttributes<HTMLDivElement> & {
  /** field: a dot grid that breathes, bends around the pointer and ripples on click. constellation: the drifting linked dots. */
  variant?: "field" | "constellation"
  /** Field only: px between dots. */
  spacing?: number
  /** Field only: color the dots take near the pointer and in a ripple. */
  accent?: string
  /** Field only: fade the dots out toward the edges so the content stays readable. */
  fade?: boolean
  /** Constellation only: particles per 10,000 px² of area. */
  density?: number
  /** Constellation only: hard cap on the particle count. */
  maxParticles?: number
  /** Dot and line color; any CSS color or variable. Re-read when the theme changes. */
  color?: string
  /** Radius range in px. */
  size?: [number, number]
  /** Constellation: drift speed in px per second. Field: 10 is the normal breathing pace. */
  speed?: number
  /** Constellation only: draw lines between nearby particles. Passing this or `density` without `variant` selects the constellation. */
  connect?: boolean
  /** Max distance for a connecting line, in px. */
  linkDistance?: number
  /** React to the pointer (listens on the parent element). */
  repel?: boolean
  /** Distance in px within which the pointer pushes dots away. Defaults to 150 for the field and 110 for the constellation. */
  repelRadius?: number
}

/**
 * A pointer-reactive dot field by default, with the drifting constellation as a variant. Canvas 2D, DPR-aware, pauses
 * off-screen and in hidden tabs, and draws one still frame for reduced motion.
 */
export function Particles({
  variant: variantProp,
  connect,
  spacing = 20,
  accent = "var(--chart-1)",
  fade = true,
  density: densityProp,
  maxParticles = 220,
  color = "var(--foreground)",
  size = [0.6, 1.8],
  speed = 10,
  linkDistance = 110,
  repel = true,
  repelRadius,
  className,
  ...props
}: ParticlesProps) {
  const reduce = useReducedMotion() ?? false
  const rootRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [minSize, maxSize] = size
  const variant = variantProp ?? (connect === undefined && densityProp === undefined ? "field" : "constellation")
  const density = densityProp ?? 1.4
  const radius = repelRadius ?? (variant === "field" ? 150 : 110)
  const linked = connect ?? true

  React.useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!root || !canvas || !ctx) return

    let w = 0, h = 0, dpr = 1
    let raf = 0
    let last = 0
    let inView = false
    let rgb = "rgb(128 128 128)"
    let accentRgb = rgb
    let alpha = 1
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, on: 0, active: false }
    const ripples: { x: number; y: number; t: number }[] = []

    const readColor = () => {
      const [r, g, b, a] = resolveColor(root, color)
      rgb = `rgb(${r} ${g} ${b})`
      alpha = a
      const [ar, ag, ab] = resolveColor(root, accent)
      accentRgb = `rgb(${ar} ${ag} ${ab})`
    }

    /* ---- Constellation ---- */
    let ps: Particle[] = []
    const link2 = linkDistance * linkDistance
    const spawn = (): Particle => {
      const angle = Math.random() * Math.PI * 2
      const v = speed * (0.4 + Math.random() * 0.6)
      const bx = Math.cos(angle) * v
      const by = Math.sin(angle) * v
      return { x: Math.random() * w, y: Math.random() * h, vx: bx, vy: by, bx, by, r: minSize + Math.random() * (maxSize - minSize), a: 0.35 + Math.random() * 0.55 }
    }
    const drawLinked = () => {
      ctx.fillStyle = rgb
      ctx.strokeStyle = rgb
      ctx.lineWidth = 0.6
      if (linked) {
        for (let i = 0; i < ps.length; i++) {
          const p = ps[i]!
          for (let j = i + 1; j < ps.length; j++) {
            const q = ps[j]!
            const dx = p.x - q.x
            const dy = p.y - q.y
            const d2 = dx * dx + dy * dy
            if (d2 > link2) continue
            ctx.globalAlpha = (1 - Math.sqrt(d2) / linkDistance) * 0.35 * alpha
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.stroke()
          }
        }
      }
      for (const p of ps) {
        ctx.globalAlpha = p.a * alpha
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    const stepLinked = (dt: number) => {
      const m = 20
      for (const p of ps) {
        if (repel && pointer.active) {
          const dx = p.x - pointer.tx
          const dy = p.y - pointer.ty
          const d = Math.hypot(dx, dy)
          if (d < radius && d > 0.01) {
            const f = (1 - d / radius) * 900 * dt
            p.vx += (dx / d) * f
            p.vy += (dy / d) * f
          }
        }
        // Ease back toward the particle's own gentle drift.
        const k = Math.min(1, dt * 1.6)
        p.vx += (p.bx - p.vx) * k
        p.vy += (p.by - p.vy) * k
        p.x += p.vx * dt
        p.y += p.vy * dt
        if (p.x < -m) p.x = w + m
        else if (p.x > w + m) p.x = -m
        if (p.y < -m) p.y = h + m
        else if (p.y > h + m) p.y = -m
      }
    }

    /* ---- Field: offsets and velocities live in typed arrays, one spring per dot. ---- */
    let cols = 0, rows = 0, ox = 0, oy = 0
    let off = new Float32Array(0)
    let vel = new Float32Array(0)
    let time = 0
    const layout = () => {
      cols = Math.ceil(w / spacing) + 1
      rows = Math.ceil(h / spacing) + 1
      ox = (w - (cols - 1) * spacing) / 2
      oy = (h - (rows - 1) * spacing) / 2
      off = new Float32Array(cols * rows * 2)
      vel = new Float32Array(cols * rows * 2)
    }
    const stepField = (dt: number) => {
      time += dt * (speed / 10)
      // The pointer itself eases, so a fast flick reads as a wake and not a teleport.
      const chase = 1 - Math.exp(-dt * 14)
      // With no pointer a ghost wanders the field, so it is never a still image (touch screens, galleries).
      const tx = pointer.active ? pointer.tx : w * (0.5 + 0.36 * Math.sin(time * 0.43))
      const ty = pointer.active ? pointer.ty : h * (0.5 + 0.34 * Math.sin(time * 0.71 + 1))
      pointer.x += (tx - pointer.x) * chase
      pointer.y += (ty - pointer.y) * chase
      pointer.on += ((repel ? (pointer.active ? 1 : 0.55) : 0) - pointer.on) * (1 - Math.exp(-dt * 3))
      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i]!.t += dt
        if (ripples[i]!.t > 1.6) ripples.splice(i, 1)
      }
      const r2 = radius * radius
      const damp = Math.exp(-SPRING_D * dt)
      for (let row = 0, n = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++, n += 2) {
          const bx = ox + col * spacing
          const by = oy + row * spacing
          let fx = -off[n]! * SPRING_K
          let fy = -off[n + 1]! * SPRING_K
          if (pointer.on > 0.01) {
            const dx = bx - pointer.x
            const dy = by - pointer.y
            const d2 = dx * dx + dy * dy
            if (d2 < r2 && d2 > 0.01) {
              const d = Math.sqrt(d2)
              const f = (1 - d / radius) ** 2 * 2300 * pointer.on
              fx += (dx / d) * f
              fy += (dy / d) * f
            }
          }
          for (const r of ripples) {
            const dx = bx - r.x
            const dy = by - r.y
            const d = Math.hypot(dx, dy) || 1
            const band = 1 - Math.abs(d - r.t * 520) / 70
            if (band > 0) {
              const f = band * 5200 * (1 - r.t / 1.6)
              fx += (dx / d) * f
              fy += (dy / d) * f
            }
          }
          vel[n] = (vel[n]! + fx * dt) * damp
          vel[n + 1] = (vel[n + 1]! + fy * dt) * damp
          off[n] = off[n]! + vel[n]! * dt
          off[n + 1] = off[n + 1]! + vel[n + 1]! * dt
        }
      }
    }
    const drawField = () => {
      const base: Path2D[] = Array.from({ length: STEPS }, () => new Path2D())
      const lit: Path2D[] = Array.from({ length: STEPS }, () => new Path2D())
      const r2 = radius * radius
      for (let row = 0, n = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++, n += 2) {
          const bx = ox + col * spacing
          const by = oy + row * spacing
          const x = bx + off[n]!
          const y = by + off[n + 1]!
          // Two slow waves crossing: the field breathes in long diagonal swells.
          const swell = 0.5 + 0.5 * Math.sin(bx * 0.011 + by * 0.006 + time * 0.9) * Math.cos(by * 0.013 - bx * 0.004 - time * 0.6)
          let a = 0.14 + swell * swell * 0.4
          let dot = minSize + (maxSize - minSize) * swell * 0.55
          let glow = 0
          if (pointer.on > 0.01) {
            const dx = bx - pointer.x
            const dy = by - pointer.y
            const d2 = dx * dx + dy * dy
            if (d2 < r2) glow = (1 - Math.sqrt(d2) / radius) * pointer.on
          }
          for (const r of ripples) {
            const band = 1 - Math.abs(Math.hypot(bx - r.x, by - r.y) - r.t * 520) / 90
            if (band > 0) glow = Math.max(glow, band * (1 - r.t / 1.6))
          }
          if (glow > 0) {
            a += glow * 0.75
            dot += glow * maxSize * 0.9
          }
          if (fade) {
            const ex = Math.min(1, Math.min(bx, w - bx) / (w * 0.14))
            const ey = Math.min(1, Math.min(by, h - by) / (h * 0.2))
            a *= Math.max(0, ex) * Math.max(0, ey)
          }
          if (a < 0.02) continue
          const step = Math.min(STEPS - 1, Math.floor(Math.min(1, a) * STEPS))
          const path = (glow > 0.18 ? lit : base)[step]!
          path.moveTo(x + dot, y)
          path.arc(x, y, dot, 0, Math.PI * 2)
        }
      }
      for (let i = 0; i < STEPS; i++) {
        ctx.globalAlpha = ((i + 0.6) / STEPS) * alpha
        ctx.fillStyle = rgb
        ctx.fill(base[i]!)
        ctx.fillStyle = accentRgb
        ctx.fill(lit[i]!)
      }
    }

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      if (variant === "field") drawField()
      else drawLinked()
      ctx.globalAlpha = 1
    }

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min((t - last) / 1000, 0.033)
      last = t
      if (variant === "field") stepField(dt)
      else stepLinked(dt)
      draw()
    }

    const resize = () => {
      const r = root.getBoundingClientRect()
      const pw = w, ph = h
      w = r.width
      h = r.height
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      if (variant === "field") layout()
      else {
        const target = Math.min(maxParticles, Math.round(((w * h) / 10000) * density))
        if (pw && ph) for (const p of ps) { p.x = (p.x / pw) * w; p.y = (p.y / ph) * h }
        while (ps.length < target) ps.push(spawn())
        if (ps.length > target) ps = ps.slice(0, target)
      }
      draw()
    }

    const update = () => {
      const run = inView && !document.hidden && !reduce
      if (run && !raf) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      } else if (!run && raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    readColor()
    resize()

    const host = root.parentElement ?? root
    const move = (e: PointerEvent) => {
      const r = root.getBoundingClientRect()
      pointer.tx = e.clientX - r.left
      pointer.ty = e.clientY - r.top
      pointer.active = true
    }
    const leave = () => {
      pointer.active = false
    }
    const press = (e: PointerEvent) => {
      if (!repel || variant !== "field" || ripples.length > 3) return
      const r = root.getBoundingClientRect()
      ripples.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: 0 })
    }
    host.addEventListener("pointermove", move)
    host.addEventListener("pointerleave", leave)
    host.addEventListener("pointerdown", press)

    const ro = new ResizeObserver(resize)
    ro.observe(root)
    const io = new IntersectionObserver(([e]) => {
      if (!e) return
      inView = e.isIntersecting
      update()
    })
    io.observe(root)
    const onTheme = () => {
      readColor()
      draw()
    }
    const mo = new MutationObserver(onTheme)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] })
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    mq.addEventListener("change", onTheme)
    document.addEventListener("visibilitychange", update)

    return () => {
      cancelAnimationFrame(raf)
      host.removeEventListener("pointermove", move)
      host.removeEventListener("pointerleave", leave)
      host.removeEventListener("pointerdown", press)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      mq.removeEventListener("change", onTheme)
      document.removeEventListener("visibilitychange", update)
    }
  }, [variant, spacing, accent, fade, density, maxParticles, color, minSize, maxSize, speed, linked, linkDistance, repel, radius, reduce])

  return (
    <div ref={rootRef} aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} {...props}>
      <canvas ref={canvasRef} className="block size-full" />
    </div>
  )
}
