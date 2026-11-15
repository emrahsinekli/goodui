"use client"

import * as React from "react"
import { motion, useInView, useReducedMotion, type Variants } from "motion/react"
import { cn } from "@/lib/utils"
import { GooduiTokens, ease } from "@/lib/goodui-motion"

/*
 * mask and sweep are plain CSS transitions keyed off data-shown, so they interrupt cleanly and need no JS per frame.
 * After layout each word gets its line number (--l) and its place on the line (--n): whole lines rise together.
 */
const CSS = `
.pc-reveal-clip{display:inline-block;overflow:clip;padding-block:.16em;margin-block:-.16em;vertical-align:baseline}
.pc-reveal-u{display:inline-block}
.pc-reveal[data-effect=mask] .pc-reveal-u{transform:translateY(118%);transition:transform 180ms ease}
.pc-reveal[data-effect=mask][data-shown] .pc-reveal-u{transform:none;transition:transform var(--pc-r-dur) var(--pc-ease-out-expo) calc(var(--pc-r-delay) + var(--l,0)*.1s + (var(--n,0) + var(--c,0))*var(--pc-r-step))}
.pc-reveal[data-effect=sweep] .pc-reveal-u{--pc-r-dir:90deg;color:transparent;padding-block:.14em;margin-block:-.14em;background:linear-gradient(var(--pc-r-dir),currentcolor 0,var(--pc-r-ink) 0 44%,var(--chart-1) 48%,var(--chart-4) 52%,var(--chart-5) 56%,var(--pc-r-dim) 62% 100%) 100% 0/320% 100% no-repeat;-webkit-background-clip:text;background-clip:text;transition:background-position 180ms ease}
.pc-reveal[data-effect=sweep]{--pc-r-ink:var(--foreground);--pc-r-dim:color-mix(in oklab,var(--foreground) 16%,transparent)}
.pc-reveal[data-effect=sweep][data-shown] .pc-reveal-u{background-position:0 0;transition:background-position var(--pc-r-dur) linear calc(var(--pc-r-delay) + (var(--i,0) + var(--c,0))*var(--pc-r-step))}
.pc-reveal[data-effect=sweep] .pc-reveal-u:dir(rtl){--pc-r-dir:270deg;background-position:0 0}
.pc-reveal[data-effect=sweep][data-shown] .pc-reveal-u:dir(rtl){background-position:100% 0}
@media (prefers-reduced-motion:reduce){
  .pc-reveal .pc-reveal-u,.pc-reveal[data-effect][data-shown] .pc-reveal-u{transform:none!important;background:none!important;color:inherit;opacity:0;transition:opacity 200ms ease}
  .pc-reveal[data-effect][data-shown] .pc-reveal-u{opacity:1}
}
`

type RevealTag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div"

export type TextRevealProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  /** The text to reveal; a plain string so it can be split (screen readers get it whole). */
  text: string
  /** mask: lines rise out of a clip. sweep: a color band passes across dim text. blur: the older blur, fade and rise. */
  effect?: "mask" | "sweep" | "blur"
  /** Animate word by word or character by character. */
  by?: "word" | "char"
  /** Element to render, e.g. "h1" for a page title. */
  as?: RevealTag
  /** "view" plays when the text scrolls into view, "mount" plays right away. Ignored when `play` is set. */
  trigger?: "view" | "mount"
  /** Controlled mode: true reveals, false hides. Leave undefined to use `trigger`. */
  play?: boolean
  /** With trigger="view": play only the first time it enters the viewport. */
  once?: boolean
  /** Seconds before the first word or character. */
  delay?: number
  /** Seconds between two words or characters. Defaults depend on `effect`. */
  stagger?: number
  /** Seconds per unit. */
  duration?: number
  /** Starting blur in px for effect="blur". Passing it without `effect` selects blur. */
  blur?: number
  /** Called when the last word or character has finished revealing. */
  onComplete?: () => void
}

// Arabic-script letters join, so splitting them into separate boxes breaks their shapes: char mode falls back to words.
const JOINING = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿܀-ݏ߀-߿]/

/** Splits into user-perceived characters (keeps emoji and combining marks together). */
function graphemes(s: string) {
  // Typed by hand so it compiles under lib targets older than ES2022 (Vite's default is ES2020).
  const Segmenter = (Intl as unknown as { Segmenter?: new (l: undefined, o: { granularity: "grapheme" }) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter
  if (Segmenter) return Array.from(new Segmenter(undefined, { granularity: "grapheme" }).segment(s), (g) => g.segment)
  return Array.from(s)
}

/** Reveals text with a line-masked rise, a color sweep or a blur. Screen readers get the plain text. */
export function TextReveal({
  text,
  effect: effectProp,
  by = "word",
  as = "p",
  trigger = "view",
  play,
  once = true,
  delay = 0,
  stagger,
  duration: durationProp,
  blur: blurProp,
  onComplete,
  className,
  ...props
}: TextRevealProps) {
  const reduce = useReducedMotion() ?? false
  const ref = React.useRef<HTMLElement>(null)
  const inView = useInView(ref, { once, amount: 0.35 })
  const shown = play ?? (trigger === "mount" ? true : inView)
  // CSS transitions need a hidden frame first, or a mount-triggered reveal would simply appear.
  const [armed, setArmed] = React.useState(false)
  React.useEffect(() => {
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setArmed(true))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [])
  const unitBy = by === "char" && JOINING.test(text) ? "word" : by
  const effect = effectProp ?? (blurProp === undefined ? "mask" : "blur")
  const blur = blurProp ?? 8
  const duration = durationProp ?? (effect === "mask" ? 1 : effect === "sweep" ? 0.7 : 0.5)
  const css = effect !== "blur"
  const step = stagger ?? (effect === "mask" ? (unitBy === "word" ? 0.02 : 0.012) : effect === "sweep" ? (unitBy === "word" ? 0.075 : 0.016) : unitBy === "word" ? 0.06 : 0.018)

  // Group words into visual lines. Runs before paint and again when the width changes the wrapping.
  React.useLayoutEffect(() => {
    const root = ref.current
    if (!css || !root) return
    const measure = () => {
      let top: number | null = null
      let line = -1
      let n = 0
      root.querySelectorAll<HTMLElement>("[data-word]").forEach((w) => {
        if (top === null || Math.abs(w.offsetTop - top) > 4) {
          top = w.offsetTop
          line++
          n = 0
        }
        w.style.setProperty("--l", String(line))
        w.style.setProperty("--n", String(n++))
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    return () => ro.disconnect()
  }, [css, text, unitBy])

  const variants: Variants = {
    hidden: reduce
      ? { opacity: 0, transition: { duration: 0.15 } }
      : { opacity: 0, y: "0.35em", filter: `blur(${blur}px)`, transition: { duration: 0.2 } },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: reduce ? { duration: 0.2, delay } : { delay: delay + i * step, duration, ease: ease.out },
    }),
  }

  // Split into words (kept whole so lines never break inside a word), then optionally into characters.
  const tokens = text.split(/(\s+)/).filter(Boolean)
  const total = unitBy === "word" ? tokens.filter((t) => !/^\s+$/.test(t)).length : tokens.reduce((n, t) => (/^\s+$/.test(t) ? n : n + graphemes(t).length), 0)
  let index = 0

  const unit = (content: string, i: number, charIndex?: number) =>
    css ? (
      <span key={i} className="pc-reveal-u" style={charIndex === undefined ? undefined : ({ "--c": charIndex } as React.CSSProperties)}>
        {content}
      </span>
    ) : (
    <motion.span
      key={i}
      custom={i}
      variants={variants}
      initial="hidden"
      animate={shown ? "visible" : "hidden"}
      onAnimationComplete={i === total - 1 ? (def) => def === "visible" && onComplete?.() : undefined}
      className="inline-block"
    >
      {content}
    </motion.span>
    )

  let wordIndex = 0
  const children = tokens.map((token, ti) => {
    if (/^\s+$/.test(token)) return " "
    return (
      <span
        key={ti}
        data-word=""
        className={cn("inline-block whitespace-nowrap", effect === "mask" && "pc-reveal-clip")}
        style={css ? ({ "--i": wordIndex++ } as React.CSSProperties) : undefined}
      >
        {unitBy === "word" ? unit(token, index++) : graphemes(token).map((ch, c) => unit(ch, index++, c))}
      </span>
    )
  })

  return React.createElement(
    as,
    {
      ref,
      className: cn(css && "pc-reveal", className),
      "data-effect": effect,
      "data-shown": css && shown && armed ? "" : undefined,
      ...props,
      style: { ...props.style, "--pc-r-dur": `${duration}s`, "--pc-r-delay": `${delay}s`, "--pc-r-step": `${step}s` } as React.CSSProperties,
      onTransitionEnd: (e: React.TransitionEvent<HTMLElement>) => {
        props.onTransitionEnd?.(e)
        const units = ref.current?.querySelectorAll(".pc-reveal-u")
        if (css && shown && units && e.target === units[units.length - 1]) onComplete?.()
      },
    },
    <GooduiTokens key="tokens" />,
    <style key="css" href="pc-text-reveal" precedence="default">
      {CSS}
    </style>,
    <span key="sr" className="sr-only">{text}</span>,
    <span key="t" aria-hidden="true">{children}</span>,
  )
}
