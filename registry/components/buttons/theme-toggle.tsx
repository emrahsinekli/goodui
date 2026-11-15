"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens, spring } from "@/lib/goodui-motion"

// While our transition runs, turn off the default cross-fade so the new page is revealed by the clip-path circle.
const CSS = `
html.pc-theme-toggle-vt::view-transition-old(root),
html.pc-theme-toggle-vt::view-transition-new(root) { animation: none; mix-blend-mode: normal }
html.pc-theme-toggle-vt::view-transition-old(root) { z-index: 1 }
html.pc-theme-toggle-vt::view-transition-new(root) { z-index: 2147483646 }
`

type ViewTransitionLike = { ready: Promise<void>; finished: Promise<void> }
type DocWithVT = Document & { startViewTransition?: (cb: () => void) => ViewTransitionLike }

export type Theme = "light" | "dark"

export type ThemeToggleLabels = { toLight: string; toDark: string; darkTheme: string }
const DEFAULT_LABELS: ThemeToggleLabels = { toLight: "Switch to light theme", toDark: "Switch to dark theme", darkTheme: "Dark theme" }

export type ThemeToggleProps = Omit<React.ComponentProps<"button">, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> & {
  /** Called after the `dark` class on <html> changes. */
  onThemeChange?: (theme: Theme) => void
  /** Milliseconds for the circular reveal. */
  duration?: number
  /** "circle" uses the View Transitions API when available; "none" switches instantly. */
  transition?: "circle" | "none"
  /** Save the choice in localStorage under this key and apply the saved choice on mount (off by default). Add a head script to avoid a flash before hydration. */
  storageKey?: string
  /** "icon" is a round icon button; "pill" a two-icon switch. */
  variant?: "icon" | "pill"
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<ThemeToggleLabels>
}

/** Sun ↔ moon: the sun's core grows into a moon as a mask circle slides in, and the rays spin away. */
function SunMoon({ dark, reduce }: { dark: boolean; reduce: boolean }) {
  const raw = React.useId()
  const id = `pc-tt-${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`
  const t = reduce ? { duration: 0 } : spring.morph
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-[1.15rem] overflow-visible">
      <mask id={id}>
        <rect width="24" height="24" fill="white" />
        <motion.circle r="9" fill="black" initial={false} animate={dark ? { cx: 18.5, cy: 5.5 } : { cx: 30, cy: -6 }} transition={t} />
      </mask>
      <motion.circle cx="12" cy="12" fill="currentColor" mask={`url(#${id})`} initial={false} animate={{ r: dark ? 8.5 : 4.6 }} transition={t} />
      <motion.g
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        initial={false}
        animate={dark ? { opacity: 0, scale: 0.4, rotate: -90 } : { opacity: 1, scale: 1, rotate: 0 }}
        transition={t}
        style={{ originX: "12px", originY: "12px" }}
      >
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
          const r = (a * Math.PI) / 180
          return (
            <line
              key={a}
              x1={12 + Math.cos(r) * 7.6}
              y1={12 + Math.sin(r) * 7.6}
              x2={12 + Math.cos(r) * 9.8}
              y2={12 + Math.sin(r) * 9.8}
            />
          )
        })}
      </motion.g>
    </svg>
  )
}

/**
 * Light/dark toggle that flips the `dark` class on <html>. With the View Transitions API the new theme spreads as a
 * circle from the click point; otherwise (or with reduced motion) it switches instantly.
 */
export function ThemeToggle({
  onThemeChange,
  duration = 550,
  transition = "circle",
  storageKey,
  variant = "icon",
  className,
  onClick,
  labels,
  ref,
  ...props
}: ThemeToggleProps) {
  const l = useLabels("theme-toggle", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const [dark, setDark] = React.useState(false)
  const [ready, setReady] = React.useState(false)
  // Snap (no animation) to the theme found on mount, animate only real changes afterwards.
  const [instant, setInstant] = React.useState(true)
  const still = reduce || instant
  // The pill thumb slides toward the inline end, so it moves left under dir="rtl".
  const [rtl, setRtl] = React.useState(false)
  const btnRef = React.useRef<HTMLButtonElement | null>(null)
  const setRefs = (el: HTMLButtonElement | null) => {
    btnRef.current = el
    if (typeof ref === "function") ref(el)
    else if (ref) (ref as React.RefObject<HTMLButtonElement | null>).current = el
  }

  // Mirror the <html> class, so every toggle on the page (and outside changes) stays in sync.
  React.useEffect(() => {
    const root = document.documentElement
    if (btnRef.current) setRtl(getComputedStyle(btnRef.current).direction === "rtl")
    // Apply a saved choice (a head script should do this before paint; this is the fallback).
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey)
        if ((saved === "dark" || saved === "light") && root.classList.contains("dark") !== (saved === "dark")) {
          root.classList.toggle("dark", saved === "dark")
          root.style.colorScheme = saved
        }
      } catch {
        /* private mode */
      }
    }
    const sync = () => setDark(root.classList.contains("dark"))
    sync()
    setReady(true)
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)))
    const mo = new MutationObserver(sync)
    mo.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => {
      cancelAnimationFrame(raf)
      mo.disconnect()
    }
  }, [storageKey])

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const root = document.documentElement
    const next = !root.classList.contains("dark")
    const apply = () => {
      root.classList.toggle("dark", next)
      root.style.colorScheme = next ? "dark" : "light"
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, next ? "dark" : "light")
        } catch {
          /* private mode */
        }
      }
    }
    const doc = document as DocWithVT
    if (transition === "none" || reduce || typeof doc.startViewTransition !== "function") {
      apply()
      onThemeChange?.(next ? "dark" : "light")
      return
    }
    // Keyboard clicks have no coordinates (detail 0): start from the button center.
    const r = e.currentTarget.getBoundingClientRect()
    const x = e.detail === 0 ? r.left + r.width / 2 : e.clientX
    const y = e.detail === 0 ? r.top + r.height / 2 : e.clientY
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    root.classList.add("pc-theme-toggle-vt")
    const vt = doc.startViewTransition(apply)
    vt.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration, easing: "cubic-bezier(.77,0,.175,1)", pseudoElement: "::view-transition-new(root)" },
        )
      })
      .catch(() => {})
    vt.finished.finally(() => {
      root.classList.remove("pc-theme-toggle-vt")
      onThemeChange?.(next ? "dark" : "light")
    })
  }

  const label = dark ? l.toLight : l.toDark
  const common = {
    type: "button" as const,
    "aria-label": label,
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      if (!e.defaultPrevented) toggle(e)
    },
  }

  if (variant === "pill") {
    return (
      <>
        <GooduiTokens />
        <style href="pc-theme-toggle" precedence="default">
          {CSS}
        </style>
        <button
          {...common}
          ref={setRefs}
          role="switch"
          aria-checked={dark}
          aria-label={l.darkTheme}
          className={cn(
            "pc-press relative inline-flex h-9 w-[4.25rem] shrink-0 items-center rounded-full border bg-muted p-1 shadow-inner outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            !ready && "opacity-0",
            className,
          )}
          {...props}
        >
          <motion.span
            aria-hidden="true"
            className="absolute start-1 top-1 size-7 rounded-full bg-background shadow-[var(--pc-e1)] ring-1 ring-black/5 dark:ring-white/10"
            initial={false}
            animate={{ x: dark ? (rtl ? -32 : 32) : 0 }}
            transition={still ? { duration: 0 } : spring.ui}
          />
          <span className={cn("relative grid size-7 place-items-center transition-colors", dark ? "text-muted-foreground" : "text-amber-500")}>
            <SunMoon dark={false} reduce={reduce} />
          </span>
          <span className={cn("relative ms-1 grid size-7 place-items-center transition-colors", dark ? "text-sky-300" : "text-muted-foreground")}>
            <SunMoon dark reduce={reduce} />
          </span>
        </button>
      </>
    )
  }

  return (
    <>
      <style href="pc-theme-toggle" precedence="default">
        {CSS}
      </style>
      <motion.button
        {...common}
        ref={setRefs}
        whileTap={reduce ? undefined : { scale: 0.9 }}
        className={cn(
          "relative inline-grid size-9 shrink-0 place-items-center rounded-full text-foreground transition-[background-color,opacity] outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
          !ready && "opacity-0",
          className,
        )}
        {...props}
      >
        <motion.span
          className="grid place-items-center"
          initial={false}
          animate={{ rotate: dark && !reduce ? 360 : 0 }}
          transition={still ? { duration: 0 } : spring.morph}
        >
          <SunMoon dark={dark} reduce={still} />
        </motion.span>
      </motion.button>
    </>
  )
}
