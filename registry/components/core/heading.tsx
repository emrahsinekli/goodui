"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { GooduiTokens } from "@/lib/goodui-motion"

/*
 * One heading, independent layers: every axis combines with every other.
 *   as / size   semantics and scale (decoupled)     font        sans, serif, mono, display (map your own fonts)
 *   weight      auto picks a weight per font         tracking    tighter → wide
 *   treatment   how the ink is painted               emphasis    how _italic_ words look
 *   tone        accent color for every treatment     animation   entrance on view (once)
 *
 * Inline markup in string children: *words* become <mark> (highlight, squiggle, outline fill),
 * _words_ become <em> (emphasis layer). Real <mark>/<em> elements work too. Turn off with markup={false}.
 *
 * Fonts: set --font-heading-sans, --font-heading-serif, --font-heading-mono, --font-heading-display on :root
 * (e.g. from next/font) and every heading follows. Fallbacks are system stacks.
 */

export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
export type HeadingSize = "display" | "2xl" | "xl" | "lg" | "md" | "sm"
export type HeadingWeight = "auto" | "light" | "normal" | "medium" | "semibold" | "bold" | "black"
export type HeadingTracking = "tighter" | "tight" | "normal" | "wide"
export type HeadingFont = "sans" | "serif" | "mono" | "display"
export type HeadingTreatment = "plain" | "tinted" | "gradient" | "muted-tail" | "outline" | "highlight" | "underline-squiggle" | "shimmer"
export type HeadingEmphasis = "italic" | "serif" | "tone" | "gradient"
export type HeadingTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type HeadingAnimation = "none" | "fade-up" | "blur-in" | "words" | "letters" | "mask"
export type HeadingAlign = "start" | "center" | "end"

export type HeadingProps = Omit<React.ComponentProps<"h2">, "children"> & {
  /** Semantic level. Size is independent, so an h3 can look like a display heading. */
  as?: HeadingLevel
  /** Visual scale; display, 2xl and xl scale fluidly with the viewport. */
  size?: HeadingSize
  /** "auto" picks per font: sans semibold, serif medium, mono semibold, display extrabold. */
  weight?: HeadingWeight
  /** Letter spacing. */
  tracking?: HeadingTracking
  /** Font slot, mapped with --font-heading-sans / -serif / -mono / -display. */
  font?: HeadingFont
  /** How the ink is painted: plain, tinted, gradient, muted-tail, outline, highlight (*marks*), underline-squiggle or shimmer. */
  treatment?: HeadingTreatment
  /** Style of <em> / _underscored_ words. */
  emphasis?: HeadingEmphasis
  /** Accent color used by every treatment and emphasis. */
  tone?: HeadingTone
  /** Entrance animation, played once when the heading scrolls into view. */
  animation?: HeadingAnimation
  /** Text alignment (logical, so start follows the writing direction). */
  align?: HeadingAlign
  /** Balanced line breaks (text-wrap: balance). */
  balance?: boolean
  /** Parse *mark* and _em_ in string children. */
  markup?: boolean
  children?: React.ReactNode
}

const CSS = `
.pc-heading{--pc-c:var(--primary);--pc-fg:var(--primary-foreground);margin:0}
.pc-heading[data-tone=neutral]{--pc-c:var(--foreground);--pc-fg:var(--background)}
.pc-heading[data-tone=success]{--pc-c:oklch(0.53 0.13 155);--pc-fg:#fff}
.pc-heading[data-tone=warning]{--pc-c:oklch(0.75 0.16 70);--pc-fg:oklch(0.25 0.05 70)}
.pc-heading[data-tone=danger]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff}
.pc-heading[data-tone=info]{--pc-c:oklch(0.55 0.17 250);--pc-fg:#fff}
.dark .pc-heading[data-tone=success]{--pc-c:oklch(0.7 0.16 155);--pc-fg:oklch(0.2 0.05 155)}
.dark .pc-heading[data-tone=danger]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25)}
.dark .pc-heading[data-tone=info]{--pc-c:oklch(0.7 0.15 245);--pc-fg:oklch(0.2 0.05 245)}
.pc-heading{--pc-tint:color-mix(in oklab,var(--pc-c) 14%,transparent);--pc-ink:color-mix(in oklab,var(--pc-c) 82%,var(--foreground))}
.pc-heading[data-tone=warning]{--pc-ink:color-mix(in oklab,var(--pc-c) 62%,var(--foreground))}

.pc-heading{font-family:var(--font-heading-sans,var(--font-heading,var(--font-sans,ui-sans-serif,system-ui,sans-serif)))}
.pc-heading[data-font=serif]{font-family:var(--font-heading-serif,var(--font-serif,ui-serif,"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif))}
.pc-heading[data-font=mono]{font-family:var(--font-heading-mono,var(--font-mono,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace))}
.pc-heading[data-font=display]{font-family:var(--font-heading-display,ui-sans-serif,system-ui,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif);font-stretch:condensed}
.pc-heading[data-balance=true]{text-wrap:balance}
.pc-heading mark{background:none;color:inherit;padding:0}
.pc-heading-w,.pc-heading-l{display:inline-block}
.pc-heading-w{white-space:nowrap}
.pc-heading-m{display:inline-block;overflow:hidden;vertical-align:top;padding:0 .04em .14em;margin:0 -.04em -.14em}

.pc-heading-em{font-style:italic}
.pc-heading[data-emphasis=serif] .pc-heading-em{font-family:var(--font-heading-serif,var(--font-serif,ui-serif,"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif));font-weight:400;letter-spacing:-.01em;padding-inline-end:.04em}
.pc-heading[data-emphasis=tone] .pc-heading-em{font-style:normal;color:var(--pc-ink)}
.pc-heading[data-emphasis=gradient] .pc-heading-em{background-image:var(--pc-grad);-webkit-background-clip:text;background-clip:text;color:transparent;padding-inline-end:.05em}
.pc-heading[data-split=true][data-emphasis=gradient] .pc-heading-em{background:none;color:inherit}
.pc-heading[data-split=true][data-emphasis=gradient] .pc-heading-em .pc-heading-u{background-image:var(--pc-grad);background-size:var(--pc-bw,100%) 100%;background-position:calc(-1*var(--pc-bx,0px)) 0;background-repeat:no-repeat;-webkit-background-clip:text;background-clip:text;color:transparent}

.pc-heading[data-treatment=tinted]{color:var(--pc-ink)}
/* Gradient text sits on the page background: darker fuchsia/amber stops in light mode keep it readable. */
.pc-heading{--pc-g1:#a21caf;--pc-g2:#b45309}
.dark .pc-heading{--pc-g1:#d946ef;--pc-g2:#f59e0b}
.pc-heading{--pc-grad:linear-gradient(100deg,var(--pc-ink) 8%,color-mix(in oklch,var(--pc-ink) 50%,var(--pc-g1)) 55%,color-mix(in oklch,var(--pc-ink) 35%,var(--pc-g2)) 95%)}
.pc-heading[data-treatment=gradient] .pc-heading-ink{background-image:var(--pc-grad);-webkit-background-clip:text;background-clip:text;color:transparent}
.pc-heading[data-split=true][data-treatment=gradient] .pc-heading-ink,.pc-heading[data-split=true][data-treatment=shimmer] .pc-heading-ink{background:none;color:inherit;animation:none}
.pc-heading[data-split=true][data-treatment=gradient] .pc-heading-u{background-image:var(--pc-grad);background-size:var(--pc-bw,100%) 100%;background-position:calc(-1*var(--pc-bx,0px)) 0;background-repeat:no-repeat;-webkit-background-clip:text;background-clip:text;color:transparent}
.pc-heading[data-treatment=muted-tail] [data-slot=tail]{color:var(--muted-foreground)}
.pc-heading[data-treatment=outline]{color:var(--pc-surface,var(--background));-webkit-text-stroke:max(1.5px,.045em) var(--pc-ink);paint-order:stroke fill}
.pc-heading[data-treatment=outline] mark{color:var(--pc-ink);-webkit-text-stroke:0}
.pc-heading[data-treatment=highlight] mark{--pc-hl:color-mix(in oklab,var(--pc-c) 30%,transparent);background:linear-gradient(var(--pc-hl),var(--pc-hl)) no-repeat 0 92%/100% .52em;-webkit-box-decoration-break:clone;box-decoration-break:clone;padding-inline:.08em;margin-inline:-.08em;border-radius:.12em}
.dark .pc-heading[data-treatment=highlight] mark{--pc-hl:color-mix(in oklab,var(--pc-c) 50%,transparent)}
.pc-heading[data-treatment=underline-squiggle] mark{position:relative;white-space:nowrap}
.pc-heading-sq{position:absolute;left:-.04em;bottom:-.24em;width:calc(100% + .08em);height:.32em;overflow:visible;pointer-events:none;color:var(--pc-c)}
.pc-heading-sq path{fill:none;stroke:currentColor;stroke-width:max(2px,.075em);stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.pc-heading[data-treatment=shimmer] .pc-heading-ink{--pc-base:color-mix(in oklab,var(--foreground) 60%,transparent);background-image:linear-gradient(100deg,var(--pc-base) 38%,var(--pc-ink) 50%,var(--pc-base) 62%);background-size:250% 100%;background-position:0 0;-webkit-background-clip:text;background-clip:text;color:transparent}
.pc-heading[data-split=true][data-treatment=shimmer] .pc-heading-u{--pc-base:color-mix(in oklab,var(--foreground) 60%,transparent);background-image:linear-gradient(100deg,var(--pc-base) 38%,var(--pc-ink) 50%,var(--pc-base) 62%);background-size:calc(var(--pc-bw,100px)*2.5) 100%;background-position:calc(-1*var(--pc-bx,0px)) 0;background-repeat:no-repeat;-webkit-background-clip:text;background-clip:text;color:transparent}

@media (prefers-reduced-motion:no-preference){
  .pc-heading[data-treatment=shimmer] .pc-heading-ink{animation:pc-heading-shimmer 3.4s linear infinite}
  .pc-heading[data-inview=false][data-anim=fade-up],.pc-heading[data-inview=false][data-anim=blur-in],.pc-heading[data-inview=false] .pc-heading-w,.pc-heading[data-inview=false] .pc-heading-l{opacity:0}
  .pc-heading[data-inview=true][data-anim=fade-up]{animation:pc-heading-up .7s var(--pc-ease-out) both}
  .pc-heading[data-inview=true][data-anim=blur-in]{animation:pc-heading-blur .9s var(--pc-ease-out) both}
  .pc-heading-u{animation:var(--pc-enter,none),var(--pc-loop,none)}
  .pc-heading[data-inview=true][data-anim=words] .pc-heading-u{--pc-enter:pc-heading-word .65s calc(var(--i)*70ms) var(--pc-ease-out) both}
  .pc-heading[data-inview=true][data-anim=letters] .pc-heading-w{opacity:1}
  .pc-heading[data-inview=true][data-anim=letters] .pc-heading-u{--pc-enter:pc-heading-letter .5s calc(var(--i)*24ms) var(--pc-ease-out) both}
  .pc-heading[data-inview=true][data-anim=mask] .pc-heading-u{--pc-enter:pc-heading-rise .8s calc(var(--i)*65ms) var(--pc-ease-out) both}
  .pc-heading[data-split=true][data-treatment=shimmer] .pc-heading-u{--pc-loop:pc-heading-shimu 3.4s linear infinite}
  .pc-heading[data-inview=false][data-anim]:not([data-anim=none]) mark{background-size:0% .52em}
  .pc-heading[data-inview=true][data-anim]:not([data-anim=none]) mark{transition:background-size .7s var(--pc-after,.35s) var(--pc-ease-in-out)}
  .pc-heading[data-anim]:not([data-anim=none]) .pc-heading-sq path{stroke-dasharray:1;stroke-dashoffset:1}
  .pc-heading[data-inview=true][data-anim]:not([data-anim=none]) .pc-heading-sq path{animation:pc-heading-draw .8s var(--pc-after,.35s) var(--pc-ease-in-out) forwards}
}
@keyframes pc-heading-shimmer{from{background-position:100% 0}to{background-position:0 0}}
@keyframes pc-heading-shimu{from{background-position:calc(-1.5*var(--pc-bw,100px) - var(--pc-bx,0px)) 0}to{background-position:calc(-1*var(--pc-bx,0px)) 0}}
@keyframes pc-heading-up{from{opacity:0;transform:translateY(.35em)}to{opacity:1;transform:none}}
@keyframes pc-heading-blur{from{opacity:0;filter:blur(14px);transform:scale(.985)}to{opacity:1;filter:none;transform:none}}
@keyframes pc-heading-word{from{opacity:0;transform:translateY(.45em);filter:blur(8px)}to{opacity:1;transform:none;filter:none}}
@keyframes pc-heading-letter{from{opacity:0;transform:translateY(.3em) scale(.92);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}
@keyframes pc-heading-rise{from{opacity:1;transform:translateY(108%)}to{opacity:1;transform:none}}
@keyframes pc-heading-draw{to{stroke-dashoffset:0}}
`

const SIZES: Record<HeadingSize, string> = {
  display: "text-[clamp(2.6rem,7vw,4.75rem)] leading-[1]",
  "2xl": "text-[clamp(2.1rem,5vw,3.25rem)] leading-[1.06]",
  xl: "text-[clamp(1.7rem,3.4vw,2.25rem)] leading-[1.12]",
  lg: "text-[1.5rem] leading-[1.2]",
  md: "text-[1.25rem] leading-[1.3]",
  sm: "text-[1.0625rem] leading-[1.35]",
}
const WEIGHTS: Record<Exclude<HeadingWeight, "auto">, string> = {
  light: "font-light",
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
  black: "font-black",
}
const AUTO_WEIGHT: Record<HeadingFont, string> = { sans: "font-semibold", serif: "font-medium", mono: "font-semibold", display: "font-extrabold" }
const TRACKING: Record<HeadingTracking, string> = {
  tighter: "tracking-[-0.045em]",
  tight: "tracking-[-0.025em]",
  normal: "tracking-normal",
  wide: "tracking-[0.02em]",
}
const ALIGN: Record<HeadingAlign, string> = { start: "text-start", center: "text-center", end: "text-end" }

type Seg = { k: "text" | "mark" | "em" | "tail"; t: string } | { k: "node"; n: React.ReactNode }

const MARKUP = /(\*[^*\n]+\*|\b_[^_\n]+_\b)/

function parse(children: React.ReactNode, markup: boolean): Seg[] {
  const out: Seg[] = []
  React.Children.toArray(children).forEach((c) => {
    if (typeof c === "string" || typeof c === "number") {
      const s = String(c)
      if (!markup) return out.push({ k: "text", t: s })
      for (const part of s.split(MARKUP)) {
        if (!part) continue
        const wrapped = part.length > 2 ? part.charAt(0) + part.charAt(part.length - 1) : ""
        if (wrapped === "**") out.push({ k: "mark", t: part.slice(1, -1) })
        else if (wrapped === "__") out.push({ k: "em", t: part.slice(1, -1) })
        else out.push({ k: "text", t: part })
      }
    } else if (React.isValidElement<{ children?: unknown }>(c) && (c.type === "mark" || c.type === "em") && typeof c.props.children === "string") {
      out.push({ k: c.type, t: c.props.children })
    } else out.push({ k: "node", n: c })
  })
  return out
}

function lastTextIndex(segs: Seg[]) {
  for (let i = segs.length - 1; i >= 0; i--) if (segs[i]!.k === "text") return i
  return -1
}

/** Mutes the second sentence, or else the last ~40% of the words. */
function withTail(segs: Seg[]): Seg[] {
  const i = lastTextIndex(segs)
  if (i < 0) return segs
  const t = (segs[i] as { t: string }).t
  let cut = -1
  const sentence = /^(.*?[.!?:;—–])\s+\S/.exec(t)
  if (sentence) cut = sentence[1]!.length
  else {
    const words = [...t.matchAll(/\S+/g)]
    if (words.length >= 2) {
      const n = Math.max(1, Math.round(words.length * 0.4))
      cut = words[words.length - n]?.index ?? -1
    }
  }
  if (cut <= 0) return segs
  return [...segs.slice(0, i), { k: "text", t: t.slice(0, cut) }, { k: "tail", t: t.slice(cut) }, ...segs.slice(i + 1)]
}

/** With no *mark* in the text, marks the last word (keeping its punctuation outside). */
function withAutoMark(segs: Seg[]): Seg[] {
  if (segs.some((s) => s.k === "mark")) return segs
  const i = lastTextIndex(segs)
  if (i < 0) return segs
  const t = (segs[i] as { t: string }).t
  const m = /(\S+?)([.,!?:;]*)(\s*)$/.exec(t)
  if (!m || !m[1]) return segs
  const start = m.index
  return [
    ...segs.slice(0, i),
    { k: "text", t: t.slice(0, start) },
    { k: "mark", t: m[1] },
    { k: "text", t: m[2]! + m[3]! },
    ...segs.slice(i + 1),
  ]
}

type Split = "none" | "words" | "letters" | "mask"
const SQUIGGLE = "M1.5 6.2c9-3.6 17.4-4.4 26.6-1.6 9.6 3 17.6 3.4 27.6.4 10.4-3.1 19.6-3.4 29.4-.4 9.2 2.8 17.2 3 26.4.2 5.6-1.7 10.2-2.4 15.5-2"

function render(segs: Seg[], split: Split, squiggle: boolean) {
  let n = 0
  const vars = (i: number) => ({ "--i": i }) as React.CSSProperties
  const words = (t: string, key: string): React.ReactNode => {
    if (split === "none") return t
    return t.split(/(\s+)/).map((p, j) => {
      if (!p) return null
      if (/^\s+$/.test(p)) return " "
      if (split === "letters")
        return (
          <span key={key + j} className="pc-heading-w">
            {Array.from(p).map((ch, l) => (
              <span key={l} className="pc-heading-l pc-heading-u" style={vars(n++)}>
                {ch}
              </span>
            ))}
          </span>
        )
      const w = (
        <span key={key + j} className="pc-heading-w pc-heading-u" style={vars(n++)}>
          {p}
        </span>
      )
      return split === "mask" ? (
        <span key={key + j} className="pc-heading-m">
          {w}
        </span>
      ) : (
        w
      )
    })
  }
  return segs.map((s, i) => {
    if (s.k === "node")
      return split === "none" ? (
        <React.Fragment key={i}>{s.n}</React.Fragment>
      ) : (
        <span key={i} className="pc-heading-w pc-heading-u" style={vars(n++)}>
          {s.n}
        </span>
      )
    if (s.k === "text") return <React.Fragment key={i}>{words(s.t, i + "-")}</React.Fragment>
    if (s.k === "tail")
      return (
        <span key={i} data-slot="tail">
          {words(s.t, i + "-")}
        </span>
      )
    if (s.k === "em")
      return (
        <em key={i} className="pc-heading-em">
          {words(s.t, i + "-")}
        </em>
      )
    return (
      <mark key={i} className="pc-heading-mark">
        {words(s.t, i + "-")}
        {squiggle && (
          <svg className="pc-heading-sq" viewBox="0 0 120 9" preserveAspectRatio="none" aria-hidden="true">
            <path d={SQUIGGLE} pathLength={1} />
          </svg>
        )}
      </mark>
    )
  })
}

function useInView(ref: React.RefObject<HTMLElement | null>, enabled: boolean) {
  const [inView, setInView] = React.useState(false)
  React.useEffect(() => {
    if (!enabled || inView) return
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") return setInView(true)
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -6% 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, enabled, inView])
  return inView
}

export function Heading({
  as: Tag = "h2",
  size = "xl",
  weight = "auto",
  tracking = "tight",
  font = "sans",
  treatment = "plain",
  emphasis = "serif",
  tone = "primary",
  animation = "none",
  align = "start",
  balance = true,
  markup = true,
  className,
  style,
  children,
  ref: userRef,
  ...props
}: HeadingProps) {
  const ref = React.useRef<HTMLHeadingElement>(null)
  const animated = animation !== "none"
  const inView = useInView(ref, animated)

  const setRef = React.useCallback(
    (el: HTMLHeadingElement | null) => {
      ref.current = el
      if (typeof userRef === "function") userRef(el)
      else if (userRef) userRef.current = el
    },
    [userRef],
  )

  const inkRef = React.useRef<HTMLSpanElement>(null)
  const split: Split = animation === "words" || animation === "letters" || animation === "mask" ? animation : "none"
  let segs = parse(children, markup)
  if (treatment === "muted-tail") segs = withTail(segs)
  if (treatment === "highlight" || treatment === "underline-squiggle") segs = withAutoMark(segs)
  const hasNode = segs.some((s) => s.k === "node")
  const plain = segs.map((s) => (s.k === "node" ? "" : s.t)).join("")
  const content = render(segs, split, treatment === "underline-squiggle")

  // Marker / squiggle start after the text has arrived.
  const words = split === "none" ? 0 : segs.reduce((a, s) => a + (s.k === "node" ? 1 : s.t.split(/\s+/).filter(Boolean).length), 0)
  const after = split === "letters" ? Math.min(plain.length * 24, 1400) + 250 : split === "none" ? 400 : Math.min(words * 70, 1200) + 300

  // Animated units are composited, so a parent background-clip:text can't paint them. Each unit carries the
  // gradient itself, offset by its position inside the text (or inside its <em>), so it reads as one sweep.
  const paintsUnits = split !== "none" && (treatment === "gradient" || treatment === "shimmer" || emphasis === "gradient")
  React.useLayoutEffect(() => {
    const ink = inkRef.current
    if (!paintsUnits || !ink) return
    const measure = () => {
      const groups = new Map<Element, HTMLElement[]>()
      ink.querySelectorAll<HTMLElement>(".pc-heading-u").forEach((u) => {
        const g = u.closest(".pc-heading-em") ?? ink
        groups.set(g, [...(groups.get(g) ?? []), u])
      })
      groups.forEach((units) => {
        const rects = units.map((u) => u.getBoundingClientRect())
        const min = Math.min(...rects.map((r) => r.left))
        const max = Math.max(...rects.map((r) => r.right))
        units.forEach((u, i) => {
          u.style.setProperty("--pc-bx", `${rects[i]!.left - min}px`)
          u.style.setProperty("--pc-bw", `${max - min}px`)
        })
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(ink)
    return () => ro.disconnect()
  }, [paintsUnits, plain, split, size, font, weight, tracking])

  return (
    <>
      <GooduiTokens />
      <style href="pc-heading" precedence="default">
        {CSS}
      </style>
      <Tag
        ref={setRef}
        data-slot="heading"
        data-tone={tone}
        data-font={font}
        data-treatment={treatment}
        data-emphasis={emphasis}
        data-anim={animation}
        data-split={split !== "none"}
        data-balance={balance}
        data-inview={animated ? inView : undefined}
        className={cn(
          "pc-heading",
          SIZES[size],
          weight === "auto" ? AUTO_WEIGHT[font] : WEIGHTS[weight],
          TRACKING[tracking],
          ALIGN[align],
          className,
        )}
        style={animated ? ({ "--pc-after": `${after}ms`, ...style } as React.CSSProperties) : style}
        {...props}
      >
        {split !== "none" && !hasNode ? (
          <>
            <span className="sr-only">{plain}</span>
            <span ref={inkRef} aria-hidden="true" className="pc-heading-ink">
              {content}
            </span>
          </>
        ) : (
          <span ref={inkRef} className="pc-heading-ink">
            {content}
          </span>
        )}
      </Tag>
    </>
  )
}
