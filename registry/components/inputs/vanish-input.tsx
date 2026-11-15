"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { GooduiTokens, spring, ease as easing } from "@/lib/goodui-motion"

type Particle = { x: number; y: number; vx: number; vy: number; r: number; a: number; delay: number; color: string }

export type VanishInputProps = Omit<React.ComponentProps<"form">, "onSubmit" | "defaultValue"> & {
  /** Hints that rotate while the field is empty. */
  placeholders?: string[]
  /** Milliseconds between placeholder changes. */
  interval?: number
  /** Controlled text. It is set to "" when the text is submitted. */
  value?: string
  /** Initial text when uncontrolled. */
  defaultValue?: string
  /** Called on every keystroke, and with "" when the text is submitted. */
  onValueChange?: (value: string) => void
  /** Called with the text when the user presses Enter or the arrow button; the text then dissolves. */
  onSubmit?: (value: string) => void
  /** Accessible name of the input (defaults to the first placeholder). */
  label?: string
  /** aria-label of the arrow submit button. */
  submitLabel?: string
  /** name attribute of the text input, for native form handling. */
  name?: string
  /** Classes for the native input; `className` styles the pill-shaped form. */
  inputClassName?: string
}

/** Input with rotating placeholders whose text dissolves into particles when submitted. */
export function VanishInput({
  placeholders = ["Search…"],
  interval = 3000,
  value,
  defaultValue = "",
  onValueChange,
  onSubmit,
  label,
  submitLabel = "Submit",
  name,
  className,
  inputClassName,
  ...props
}: VanishInputProps) {
  const reduce = useReducedMotion() ?? false
  const [inner, setInner] = React.useState(defaultValue)
  const text = value ?? inner
  const [index, setIndex] = React.useState(0)
  const [vanishing, setVanishing] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const raf = React.useRef(0)

  const setText = (v: string) => {
    if (value === undefined) setInner(v)
    onValueChange?.(v)
  }

  // Rotate placeholders while visible; pause in background tabs.
  React.useEffect(() => {
    if (placeholders.length < 2 || text) return
    let t = 0
    const start = () => {
      window.clearInterval(t)
      if (!document.hidden) t = window.setInterval(() => setIndex((i) => (i + 1) % placeholders.length), interval)
    }
    start()
    document.addEventListener("visibilitychange", start)
    return () => {
      window.clearInterval(t)
      document.removeEventListener("visibilitychange", start)
    }
  }, [placeholders.length, interval, text])

  React.useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const vanish = (submitted: string) => {
    const input = inputRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d", { willReadFrequently: true })
    setText("")
    if (reduce || !input || !canvas || !ctx || document.hidden) {
      setVanishing(true)
      window.setTimeout(() => setVanishing(false), reduce ? 150 : 0)
      return
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = input.clientWidth
    const h = input.clientHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    const cs = getComputedStyle(input)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
    ctx.fillStyle = cs.color
    ctx.textBaseline = "middle"
    ctx.fillText(submitted, parseFloat(cs.paddingLeft) - input.scrollLeft, h / 2 + 0.5)

    // Sample the drawn text into particles.
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    const step = Math.max(1, Math.round(1.5 * dpr))
    const particles: Particle[] = []
    let maxX = 1
    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        const i = (y * canvas.width + x) * 4
        const alpha = data[i + 3]!
        if (alpha > 90) {
          const px = x / dpr
          maxX = Math.max(maxX, px)
          particles.push({
            x: px,
            y: y / dpr,
            vx: 0,
            vy: 0,
            r: step / dpr,
            a: alpha / 255,
            delay: 0,
            color: `${data[i]},${data[i + 1]},${data[i + 2]}`,
          })
        }
      }
    }
    // The end of the text goes first, like a fast backspace turning into dust.
    for (const p of particles) {
      p.delay = ((maxX - p.x) / maxX) * 22 + Math.random() * 6
      p.vx = 0.4 + Math.random() * 1.6
      p.vy = -(0.2 + Math.random() * 1.2)
    }
    setVanishing(true)
    cancelAnimationFrame(raf.current)
    let frame = 0
    const tick = () => {
      frame++
      ctx.clearRect(0, 0, w, h)
      let alive = 0
      for (const p of particles) {
        if (p.a <= 0.02) continue
        alive++
        if (frame > p.delay) {
          p.x += p.vx
          p.y += p.vy
          p.vx *= 0.985
          p.vy -= 0.015
          p.a -= 0.028
          p.r = Math.max(0.3, p.r * 0.985)
        }
        ctx.fillStyle = `rgba(${p.color},${Math.max(0, p.a)})`
        ctx.fillRect(p.x, p.y, p.r, p.r)
      }
      if (alive && frame < 120 && !document.hidden) raf.current = requestAnimationFrame(tick)
      else {
        ctx.clearRect(0, 0, w, h)
        setVanishing(false)
      }
    }
    raf.current = requestAnimationFrame(tick)
  }

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const v = text.trim()
    if (!v || vanishing) return
    onSubmit?.(v)
    vanish(text)
  }

  const showPlaceholder = !text && !vanishing

  return (
    <form
      onSubmit={submit}
      className={cn(
        "relative flex h-12 w-full items-center gap-2 overflow-hidden rounded-full border border-input bg-background ps-4 pe-1.5 shadow-xs transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
        className,
      )}
      {...props}
    >
      <GooduiTokens />
      <div className="relative h-full min-w-0 flex-1">
        <input
          ref={inputRef}
          name={name}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label={label ?? placeholders[0]}
          autoComplete="off"
          className={cn(
            "size-full bg-transparent text-sm text-foreground outline-none sm:text-base",
            vanishing && reduce && "opacity-0 transition-opacity duration-150",
            inputClassName,
          )}
        />
        <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute top-0 left-0 size-0" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {showPlaceholder && (
              <motion.span
                key={index}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, filter: "blur(3px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -14, filter: "blur(3px)" }}
                transition={{ duration: reduce ? 0.15 : 0.3, ease: easing.out }}
                className="truncate text-sm text-muted-foreground sm:text-base"
              >
                {placeholders[index % placeholders.length]}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
      <button
        type="submit"
        aria-label={submitLabel}
        disabled={!text.trim()}
        className="pc-press grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-[background-color,color,transform] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95 disabled:bg-muted disabled:text-muted-foreground"
      >
        <motion.span
          initial={false}
          animate={text.trim() ? { x: 0, rotate: 0 } : { x: 0, rotate: reduce ? 0 : -90 }}
          transition={reduce ? { duration: 0 } : spring.ui}
          className="grid place-items-center"
        >
          <ArrowRight className="size-4 rtl:-scale-x-100" />
        </motion.span>
      </button>
    </form>
  )
}
