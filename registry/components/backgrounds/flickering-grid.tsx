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

export type FlickeringGridProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Side of each square, in px. */
  squareSize?: number
  /** Space between squares, in px. */
  gap?: number
  /** Share of squares that change per second (0–1). */
  flickerChance?: number
  /** Square color; any CSS color or variable. Re-read when the theme changes. */
  color?: string
  /** Highest square opacity (0–1). */
  maxOpacity?: number
  /** Frames per second; flicker reads fine at 24–30 and costs half of 60. */
  fps?: number
  /** Stop flickering and keep the current frame. */
  paused?: boolean
}

/**
 * A canvas grid of small squares that flicker in opacity. DPR-aware, resizes with its container, follows the
 * theme, pauses off-screen and in hidden tabs, and draws one still frame for reduced motion.
 */
export function FlickeringGrid({
  squareSize = 4,
  gap = 6,
  flickerChance = 0.3,
  color = "var(--foreground)",
  maxOpacity = 0.25,
  fps = 30,
  paused = false,
  className,
  ...props
}: FlickeringGridProps) {
  const reduce = useReducedMotion() ?? false
  const rootRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!root || !canvas || !ctx) return

    let w = 0, h = 0, dpr = 1, cols = 0, rows = 0
    let cells = new Float32Array(0)
    let rgb = "rgb(128 128 128)"
    let alpha = 1
    let raf = 0
    let last = 0
    let inView = false
    const pitch = squareSize + gap

    const readColor = () => {
      const [r, g, b, a] = resolveColor(root, color)
      rgb = `rgb(${r} ${g} ${b})`
      alpha = a
    }

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = rgb
      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
          const o = cells[x * rows + y]!
          if (o <= 0.002) continue
          ctx.globalAlpha = o * alpha
          ctx.fillRect(x * pitch, y * pitch, squareSize, squareSize)
        }
      }
      ctx.globalAlpha = 1
    }

    const resize = () => {
      const r = root.getBoundingClientRect()
      w = r.width
      h = r.height
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      cols = Math.ceil(w / pitch)
      rows = Math.ceil(h / pitch)
      cells = new Float32Array(cols * rows)
      for (let i = 0; i < cells.length; i++) cells[i] = Math.random() * maxOpacity
      draw()
    }

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame)
      if (t - last < 1000 / fps) return
      const dt = Math.min((t - last) / 1000, 0.1)
      last = t
      const chance = flickerChance * dt
      for (let i = 0; i < cells.length; i++) if (Math.random() < chance) cells[i] = Math.random() * maxOpacity
      draw()
    }

    const update = () => {
      const run = inView && !document.hidden && !reduce && !paused
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

    const ro = new ResizeObserver(resize)
    ro.observe(root)
    const io = new IntersectionObserver(([e]) => {
      if (!e) return
      inView = e.isIntersecting
      update()
    })
    io.observe(root)
    const mo = new MutationObserver(() => {
      readColor()
      draw()
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] })
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onScheme = () => {
      readColor()
      draw()
    }
    mq.addEventListener("change", onScheme)
    document.addEventListener("visibilitychange", update)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      mq.removeEventListener("change", onScheme)
      document.removeEventListener("visibilitychange", update)
    }
  }, [squareSize, gap, flickerChance, color, maxOpacity, fps, paused, reduce])

  return (
    <div ref={rootRef} aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} {...props}>
      <canvas ref={canvasRef} className="block size-full" />
    </div>
  )
}
