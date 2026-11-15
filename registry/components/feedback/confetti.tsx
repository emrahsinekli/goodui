"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { SoundName } from "@/lib/goodui-sounds"

export type ConfettiShape = "square" | "circle" | "strip"

export type ConfettiOptions = {
  /** Launch point in viewport px (clientX/clientY). Defaults to the element's center, then the canvas center. */
  origin?: { x: number; y: number }
  /** Burst from the center of this element. */
  element?: Element | null
  /** Pieces per burst. */
  particleCount?: number
  /** Launch direction in degrees. 90 is straight up, 0 is right, 180 is left. */
  angle?: number
  /** Cone width in degrees. */
  spread?: number
  /** Launch speed in px per frame. */
  startVelocity?: number
  /** 1 is normal gravity, 0 floats. */
  gravity?: number
  /** Speed kept per frame, 0 to 1. Lower stops sooner. */
  decay?: number
  /** Sideways wind in px per frame. */
  drift?: number
  /** Lifetime in frames at 60fps. */
  ticks?: number
  /** Particle size multiplier. */
  scalar?: number
  /** Any CSS colors; each piece picks one at random. */
  colors?: string[]
  /** Shapes to pick from at random; repeat one to make it more common. */
  shapes?: ConfettiShape[]
  /**
   * Confetti is for rare moments. With a key, the burst fires once per page load and later calls with that key do
   * nothing, e.g. fireConfetti({ once: "first-booking" }).
   */
  once?: string
  /** Plays "celebrate" with the burst when the visitor has sounds on (lib/goodui-sounds); pass a sound name to pick another. Off by default. */
  sound?: boolean | SoundName
}

// Optional UI sound: the sound module is loaded only when `sound` is on, so silent apps pay nothing.
function cue(sound: boolean | SoundName | undefined) {
  if (!sound) return
  void import("@/lib/goodui-sounds").then((m) => m.play(sound === true ? "celebrate" : sound))
}

const fired = new Set<string>()

function firstTime(key: string | undefined) {
  if (key === undefined) return true
  if (fired.has(key)) return false
  fired.add(key)
  return true
}

const DEFAULT_COLORS: [string, ...string[]] = ["#f43f5e", "#f59e0b", "#10b981", "#0ea5e9", "#8b5cf6", "#ec4899", "#facc15"]

type Particle = {
  x: number
  y: number
  angle: number
  velocity: number
  gravity: number
  decay: number
  drift: number
  wobble: number
  wobbleSpeed: number
  rotation: number
  rotationSpeed: number
  flip: number
  flipSpeed: number
  tick: number
  ticks: number
  color: string
  shape: ConfettiShape
  w: number
  h: number
}

function makeParticles(o: ConfettiOptions, origin: { x: number; y: number }): Particle[] {
  const {
    particleCount = 90,
    angle = 90,
    spread = 70,
    startVelocity = 38,
    gravity = 1,
    decay = 0.91,
    drift = 0,
    ticks = 220,
    scalar = 1,
    colors = DEFAULT_COLORS,
    shapes = ["square", "square", "strip", "circle"],
  } = o
  const rad = (angle * Math.PI) / 180
  const cone = (spread * Math.PI) / 180
  return Array.from({ length: Math.max(0, Math.round(particleCount)) }, () => {
    const shape = shapes[Math.floor(Math.random() * shapes.length)] ?? "square"
    const size = (6 + Math.random() * 4) * scalar
    return {
      x: origin.x,
      y: origin.y,
      angle: -rad + (Math.random() - 0.5) * cone,
      velocity: startVelocity * (0.5 + Math.random() * 0.7),
      gravity: gravity * 3 * (0.85 + Math.random() * 0.3),
      decay: decay + (Math.random() - 0.5) * 0.02,
      drift,
      wobble: Math.random() * 10,
      wobbleSpeed: 0.05 + Math.random() * 0.06,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      flip: Math.random() * Math.PI,
      flipSpeed: 0.08 + Math.random() * 0.12,
      tick: 0,
      ticks: ticks * (0.8 + Math.random() * 0.4),
      color: colors[Math.floor(Math.random() * colors.length)] ?? DEFAULT_COLORS[0],
      shape,
      w: shape === "strip" ? size * 0.45 : size,
      h: shape === "strip" ? size * 1.8 : shape === "circle" ? size : size * 0.65,
    }
  })
}

/** Canvas 2D particle loop. It runs only while particles are alive and stops while the tab is hidden or off-screen. */
class ConfettiEngine {
  private particles: Particle[] = []
  private raf = 0
  private last = 0
  private ctx: CanvasRenderingContext2D | null
  private width = 0
  private height = 0
  private hiddenDoc = false
  private offscreen = false

  private canvas: HTMLCanvasElement
  private onIdle?: () => void

  constructor(canvas: HTMLCanvasElement, onIdle?: () => void) {
    this.canvas = canvas
    this.onIdle = onIdle
    this.ctx = canvas.getContext("2d")
    this.hiddenDoc = document.hidden
    document.addEventListener("visibilitychange", this.onVisibility)
    window.addEventListener("resize", this.resize)
  }

  private onVisibility = () => {
    this.hiddenDoc = document.hidden
    this.sync()
  }

  setOffscreen(value: boolean) {
    this.offscreen = value
    this.sync()
  }

  private sync() {
    if (this.hiddenDoc || this.offscreen) this.stop()
    else this.start()
  }

  resize = () => {
    const rect = this.canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.width = rect.width
    this.height = rect.height
    this.canvas.width = Math.max(1, Math.round(rect.width * dpr))
    this.canvas.height = Math.max(1, Math.round(rect.height * dpr))
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  add(particles: Particle[]) {
    if (!this.ctx) return
    if (this.particles.length === 0) this.resize()
    this.particles.push(...particles)
    this.start()
  }

  private start() {
    if (this.raf || this.hiddenDoc || this.offscreen || this.particles.length === 0) return
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  private stop() {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  private frame = (now: number) => {
    this.raf = 0
    const ctx = this.ctx
    if (!ctx) return
    // Frame-rate independent: 1 = one 60fps frame. Capped so a long stall does not teleport particles.
    const dt = Math.min((now - this.last) / (1000 / 60), 3)
    this.last = now
    ctx.clearRect(0, 0, this.width, this.height)

    const alive: Particle[] = []
    for (const p of this.particles) {
      p.x += Math.cos(p.angle) * p.velocity * dt + p.drift * dt
      p.y += Math.sin(p.angle) * p.velocity * dt + p.gravity * dt
      p.velocity *= Math.pow(p.decay, dt)
      p.wobble += p.wobbleSpeed * dt
      p.rotation += p.rotationSpeed * dt
      p.flip += p.flipSpeed * dt
      p.tick += dt
      if (p.tick >= p.ticks || p.y > this.height + 40) continue
      alive.push(p)

      const progress = p.tick / p.ticks
      ctx.globalAlpha = progress < 0.65 ? 1 : Math.max(0, 1 - (progress - 0.65) / 0.35)
      ctx.fillStyle = p.color
      ctx.save()
      ctx.translate(p.x + Math.cos(p.wobble) * 2.5, p.y)
      ctx.rotate(p.rotation)
      // Scaling one axis by cos() makes the paper look like it flips in 3D.
      const face = Math.cos(p.flip)
      ctx.scale(1, face)
      const paint = () => {
        if (p.shape === "circle") {
          ctx.beginPath()
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        }
      }
      paint()
      // Paper catches the light: the back is darker, and the front glints as it turns to face you.
      ctx.fillStyle = face < 0 ? "rgb(0 0 0/.22)" : `rgb(255 255 255/${(face * face * 0.28).toFixed(3)})`
      paint()
      ctx.restore()
    }
    ctx.globalAlpha = 1
    this.particles = alive

    if (alive.length) this.raf = requestAnimationFrame(this.frame)
    else {
      ctx.clearRect(0, 0, this.width, this.height)
      this.onIdle?.()
    }
  }

  clear() {
    this.stop()
    this.particles = []
    this.ctx?.clearRect(0, 0, this.width, this.height)
  }

  destroy() {
    this.clear()
    document.removeEventListener("visibilitychange", this.onVisibility)
    window.removeEventListener("resize", this.resize)
  }
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
}

function centerOf(el: Element) {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

/* ------------------------------------------------------ full-page burst */

let pageEngine: ConfettiEngine | null = null
let pageCanvas: HTMLCanvasElement | null = null

/**
 * Fire confetti over the whole page from an element or a point. Does nothing when the user prefers reduced motion.
 * The canvas is created on demand and removed when the last particle is gone.
 */
export function fireConfetti(options: ConfettiOptions = {}) {
  if (typeof window === "undefined" || !firstTime(options.once)) return
  cue(options.sound)
  if (prefersReducedMotion()) return
  if (!pageEngine || !pageCanvas) {
    const canvas = document.createElement("canvas")
    canvas.setAttribute("aria-hidden", "true")
    canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483000"
    document.body.appendChild(canvas)
    pageCanvas = canvas
    pageEngine = new ConfettiEngine(canvas, () => {
      pageEngine?.destroy()
      pageCanvas?.remove()
      pageEngine = null
      pageCanvas = null
    })
  }
  const origin = options.origin ?? (options.element ? centerOf(options.element) : { x: window.innerWidth / 2, y: window.innerHeight / 2 })
  pageEngine.add(makeParticles(options, origin))
}

/* ------------------------------------------------------ contained canvas */

export type ConfettiHandle = {
  /** Burst inside this canvas. `origin` is still in viewport px. */
  fire: (options?: ConfettiOptions) => void
  clear: () => void
}

export type ConfettiProps = Omit<React.ComponentProps<"canvas">, "ref" | "children"> & {
  /** Receives { fire(options), clear() } to burst inside this canvas. */
  ref?: React.Ref<ConfettiHandle>
  /** Default `sound` for fire(): "celebrate" (true) or a sound name, when the visitor has sounds on. Off by default. */
  sound?: boolean | SoundName
}

/**
 * A canvas that fills its positioned parent. Call `ref.current.fire()` to burst inside it, clipped to the parent.
 * Reduced motion turns `fire` into a no-op.
 */
export function Confetti({ ref, sound, className, ...props }: ConfettiProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const engineRef = React.useRef<ConfettiEngine | null>(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new ConfettiEngine(canvas)
    engineRef.current = engine
    const ro = new ResizeObserver(() => engine.resize())
    ro.observe(canvas)
    const io = new IntersectionObserver(([entry]) => entry && engine.setOffscreen(!entry.isIntersecting))
    io.observe(canvas)
    return () => {
      ro.disconnect()
      io.disconnect()
      engine.destroy()
      engineRef.current = null
    }
  }, [])

  React.useImperativeHandle(
    ref,
    () => ({
      fire(options = {}) {
        if (!firstTime(options.once)) return
        cue(options.sound ?? sound)
        const canvas = canvasRef.current
        const engine = engineRef.current
        if (!canvas || !engine || prefersReducedMotion()) return
        const rect = canvas.getBoundingClientRect()
        const point = options.origin ?? (options.element ? centerOf(options.element) : { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
        engine.add(makeParticles(options, { x: point.x - rect.left, y: point.y - rect.top }))
      },
      clear() {
        engineRef.current?.clear()
      },
    }),
    [sound],
  )

  return <canvas ref={canvasRef} aria-hidden="true" className={cn("pointer-events-none absolute inset-0 size-full", className)} {...props} />
}
