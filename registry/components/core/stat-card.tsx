"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useGooduiLocale, useLabels } from "@/lib/goodui-locale"
import { NumberFlow } from "@/registry/components/numbers/number-flow"
import { GooduiTokens } from "@/lib/goodui-motion"

/*
 * One KPI card, independent layers: every axis combines with every other.
 *   variant    plain, outline, soft, gradient, glass, neo, split (icon block on the left)
 *   tone       accent color                 shadow     none → glow
 *   shape      square, rounded, round       size       sm, md, lg
 *   chart      line, area, bars (from `data`)
 *   animation  none · count (number counts up on view) · draw (chart draws in) · full (both)
 *   numberFlow digits roll on every value change instead of tweening
 * Delta tone is automatic: up is good, unless invertDelta (e.g. no-show rate).
 */

export type StatCardVariant = "plain" | "outline" | "soft" | "gradient" | "glass" | "neo" | "split"
export type StatCardTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type StatCardShadow = "none" | "sm" | "md" | "lg" | "glow"
export type StatCardShape = "square" | "rounded" | "round"
export type StatCardSize = "sm" | "md" | "lg"
export type StatCardChart = "line" | "area" | "bars"
export type StatCardAnimation = "none" | "count" | "draw" | "full"

export type StatCardProps = Omit<React.ComponentProps<"div">, "prefix"> & {
  /** Metric name shown above the value. */
  label: React.ReactNode
  /** A number (animated and formatted) or any preformatted string. Numeric strings like "1,284" count too. */
  value: number | string
  /** Text before the formatted number, e.g. "$". */
  prefix?: string
  /** Text after the formatted number, e.g. "%" or " ms". */
  suffix?: string
  /** Intl.NumberFormat options, e.g. { style: "currency", currency: "USD" }. */
  format?: Intl.NumberFormatOptions
  /** Short notation: 12.4K, 1.2M. */
  compact?: boolean
  /** Locale for number formatting. Defaults to the GooduiLocaleProvider language, else en-US. */
  locale?: string
  /** Change in percent, e.g. 12.5 or -3. */
  delta?: number | string
  /** Muted text beside the value, e.g. "vs last month". */
  deltaLabel?: React.ReactNode
  /** Unit after the delta number; "%" by default. */
  deltaSuffix?: string
  /** A drop is good news (cancellations, no-shows, wait time). */
  invertDelta?: boolean
  /** Sparkline points: [12, 18, 15] or "12,18,15". */
  data?: number[] | string
  /** Sparkline style for data: line, area (default) or bars. */
  chart?: StatCardChart
  /** Icon in a tinted tile beside the label, or in the side block with variant="split". */
  icon?: React.ReactNode
  /** Muted line at the bottom of the card. */
  footer?: React.ReactNode
  /** Surface: plain, outline (default), soft, gradient, glass, neo, or split (icon block on the start side). */
  variant?: StatCardVariant
  /** Accent for the icon, sparkline, soft and gradient surfaces and glow. Delta colors are separate (good/bad). */
  tone?: StatCardTone
  /** Drop shadow; glow uses the tone. Ignored by neo. */
  shadow?: StatCardShadow
  /** Corner radius: square, rounded or round. */
  shape?: StatCardShape
  size?: StatCardSize
  /** count counts the value up on view, draw draws the sparkline in, full does both. */
  animation?: StatCardAnimation
  /** Roll digits with NumberFlow. */
  numberFlow?: boolean
  /** Scrub the sparkline with the pointer: the value and delta roll to each point. data must be in the same unit as value. */
  scrub?: boolean
  /** Skeleton state while the metric loads. */
  loading?: boolean
  /** Hover lift, for cards that link somewhere. */
  interactive?: boolean
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<StatCardLabels>
}

export type StatCardLabels = { increase: string; decrease: string; noChange: string }
const DEFAULT_LABELS: StatCardLabels = { increase: "increase", decrease: "decrease", noChange: "no change" }

const CSS = `
.pc-stat-card{--pc-c:var(--primary);--pc-fg:var(--primary-foreground);position:relative;isolation:isolate}
.pc-stat-card[data-tone=neutral]{--pc-c:var(--foreground);--pc-fg:var(--background)}
.pc-stat-card[data-tone=success]{--pc-c:oklch(0.53 0.13 155);--pc-fg:#fff}
.pc-stat-card[data-tone=warning]{--pc-c:oklch(0.75 0.16 70);--pc-fg:oklch(0.25 0.05 70)}
.pc-stat-card[data-tone=danger]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff}
.pc-stat-card[data-tone=info]{--pc-c:oklch(0.55 0.17 250);--pc-fg:#fff}
.dark .pc-stat-card[data-tone=success]{--pc-c:oklch(0.7 0.16 155);--pc-fg:oklch(0.2 0.05 155)}
.dark .pc-stat-card[data-tone=danger]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25)}
.dark .pc-stat-card[data-tone=info]{--pc-c:oklch(0.7 0.15 245);--pc-fg:oklch(0.2 0.05 245)}
.pc-stat-card{--pc-tint:color-mix(in oklab,var(--pc-c) 14%,transparent);--pc-ink:color-mix(in oklab,var(--pc-c) 82%,var(--foreground))}
.pc-stat-card[data-tone=warning]{--pc-ink:color-mix(in oklab,var(--pc-c) 62%,var(--foreground))}
.pc-stat-card{--pc-text:var(--card-foreground);--pc-sub:var(--muted-foreground);--pc-line:var(--pc-c);color:var(--pc-text)}
/* White text on the gradient needs darker fuchsia/amber stops in light mode. */
.pc-stat-card:is([data-tone=success],[data-tone=info],[data-tone=danger]){--pc-g1:#a21caf;--pc-g2:#b45309}
.dark .pc-stat-card:is([data-tone=success],[data-tone=info],[data-tone=danger]){--pc-g1:#d946ef;--pc-g2:#f59e0b}

.pc-stat-card[data-variant=outline],.pc-stat-card[data-variant=split]{background:var(--card);border:1px solid var(--border)}
.pc-stat-card[data-variant=soft]{--pc-sub:color-mix(in oklab,var(--muted-foreground) 80%,var(--foreground));background:color-mix(in oklab,var(--pc-c) 8%,var(--card));border:1px solid color-mix(in oklab,var(--pc-c) 14%,transparent)}
.pc-stat-card[data-variant=gradient]{--pc-text:var(--pc-fg);--pc-sub:color-mix(in oklab,var(--pc-fg) 95%,transparent);--pc-line:var(--pc-fg);background:linear-gradient(135deg,var(--pc-c),color-mix(in oklch,var(--pc-c) 62%,var(--pc-g1,#d946ef)) 70%,color-mix(in oklch,var(--pc-c) 55%,var(--pc-g2,#f59e0b)));border:1px solid color-mix(in oklab,var(--pc-c) 60%,transparent)}
.pc-stat-card[data-variant=gradient]::before{content:"";position:absolute;inset:0;z-index:-1;border-radius:inherit;background:radial-gradient(120% 80% at 100% 0%,rgb(255 255 255/.22),transparent 55%);pointer-events:none}
.pc-stat-card[data-variant=glass]{--pc-sub:color-mix(in oklab,var(--muted-foreground) 65%,var(--foreground));background:color-mix(in oklab,var(--card) 50%,transparent);border:1px solid color-mix(in oklab,var(--foreground) 12%,transparent);-webkit-backdrop-filter:blur(16px) saturate(1.6);backdrop-filter:blur(16px) saturate(1.6);box-shadow:inset 0 1px 0 color-mix(in oklab,white 40%,transparent)}
.pc-stat-card[data-variant=neo]{background:var(--card);border:2px solid var(--foreground);box-shadow:5px 5px 0 var(--foreground)}

.pc-stat-card[data-shadow=sm]{box-shadow:0 1px 2px hsl(var(--pc-sh)/.08),0 1px 1px hsl(var(--pc-sh)/.04)}
.pc-stat-card[data-shadow=md]{box-shadow:0 1px 1px hsl(var(--pc-sh)/.03),0 4px 8px -4px hsl(var(--pc-sh)/.06),0 12px 20px -8px hsl(var(--pc-sh)/.1)}
.pc-stat-card[data-shadow=lg]{box-shadow:0 1px 1px hsl(var(--pc-sh)/.03),0 8px 16px -4px hsl(var(--pc-sh)/.08),0 24px 40px -12px hsl(var(--pc-sh)/.18)}
.pc-stat-card[data-shadow=glow]{box-shadow:0 10px 36px -10px color-mix(in oklab,var(--pc-c) 60%,transparent)}
.pc-stat-card[data-interactive]{cursor:pointer;transition:transform .2s var(--pc-ease-out),box-shadow .2s,border-color .2s}
.pc-stat-card[data-interactive]:hover{transform:translateY(-2px);border-color:color-mix(in oklab,var(--pc-c) 35%,var(--border))}
.pc-stat-card[data-interactive][data-variant=neo]:hover{transform:translate(-2px,-2px);box-shadow:7px 7px 0 var(--foreground)}

.pc-stat-card-label{color:var(--pc-sub)}
.pc-stat-card-icon{color:var(--pc-ink);background:var(--pc-tint)}
.pc-stat-card[data-variant=gradient] .pc-stat-card-icon{color:var(--pc-fg);background:rgb(255 255 255/.18)}
.pc-stat-card[data-variant=neo] .pc-stat-card-icon{border:1.5px solid var(--foreground);background:color-mix(in oklab,var(--pc-c) 22%,var(--card));color:var(--foreground)}
.pc-stat-card-side{color:var(--pc-ink);background:linear-gradient(160deg,color-mix(in oklab,var(--pc-c) 16%,transparent),color-mix(in oklab,var(--pc-c) 6%,transparent));border-inline-end:1px solid color-mix(in oklab,var(--pc-c) 14%,var(--border))}
.pc-stat-card-foot{color:var(--pc-sub)}

.pc-stat-card-delta{--pc-d:var(--muted-foreground);color:color-mix(in oklab,var(--pc-d) 72%,var(--foreground));background:color-mix(in oklab,var(--pc-d) 13%,transparent);transition:color .25s ease,background-color .25s ease}
.pc-stat-card-arrow{transition:rotate 420ms var(--pc-ease-spring)}
.pc-stat-card-arrow[data-down]{rotate:180deg}
.pc-stat-card-delta[data-trend=good]{--pc-d:oklch(0.53 0.13 155)}
.pc-stat-card-delta[data-trend=bad]{--pc-d:oklch(0.56 0.21 27)}
.dark .pc-stat-card-delta[data-trend=good]{--pc-d:oklch(0.72 0.16 155)}
.dark .pc-stat-card-delta[data-trend=bad]{--pc-d:oklch(0.7 0.19 25)}
.pc-stat-card[data-variant=gradient] .pc-stat-card-delta{color:var(--pc-c);background:var(--pc-fg)}

.pc-stat-card-spark{color:var(--pc-line);overflow:visible}
.pc-stat-card-spark .l{fill:none;stroke:currentColor;stroke-width:2px;stroke-linecap:round;stroke-linejoin:round}
.pc-stat-card-spark .b{fill:currentColor;opacity:.28}
.pc-stat-card-spark .b:last-child{opacity:.95}
.pc-stat-card-spark .b[data-on]{opacity:.95}
.pc-stat-card-cross{position:absolute;top:0;bottom:0;width:1px;background:color-mix(in oklab,var(--pc-line) 45%,transparent);pointer-events:none}
.pc-stat-card-dot{position:absolute;width:7px;height:7px;margin:-3.5px 0 0 -3.5px;border-radius:999px;background:var(--pc-line);box-shadow:0 0 0 3px color-mix(in oklab,var(--pc-line) 22%,transparent)}
.pc-stat-card-skel{background:linear-gradient(90deg,color-mix(in oklab,var(--pc-text) 8%,transparent) 30%,color-mix(in oklab,var(--pc-text) 16%,transparent) 50%,color-mix(in oklab,var(--pc-text) 8%,transparent) 70%);background-size:300% 100%;border-radius:.375rem}

@media (prefers-reduced-motion:no-preference){
  .pc-stat-card-skel{animation:pc-stat-card-skel 1.4s ease-in-out infinite}
  .pc-stat-card[data-draw=true][data-inview=false] .pc-stat-card-spark .l{stroke-dasharray:1;stroke-dashoffset:1}
  .pc-stat-card[data-draw=true][data-inview=false] .pc-stat-card-spark .a,.pc-stat-card[data-draw=true][data-inview=false] .pc-stat-card-dot{opacity:0}
  .pc-stat-card[data-draw=true][data-inview=false] .pc-stat-card-spark .b{transform:scaleY(0)}
  .pc-stat-card[data-draw=true][data-inview=true] .pc-stat-card-spark .l{stroke-dasharray:1;animation:pc-stat-card-draw 1.1s .1s var(--pc-ease-in-out) both}
  .pc-stat-card[data-draw=true][data-inview=true] .pc-stat-card-spark .a{animation:pc-stat-card-fade .8s .6s ease-out both}
  .pc-stat-card[data-draw=true][data-inview=true] .pc-stat-card-dot{animation:pc-stat-card-pop .45s 1.1s var(--pc-ease-spring) both}
  .pc-stat-card[data-draw=true][data-inview=true] .pc-stat-card-spark .b{animation:pc-stat-card-bar .6s calc(var(--i)*40ms) var(--pc-ease-out) both}
}
.pc-stat-card-spark .b{transform-box:fill-box;transform-origin:50% 100%}
@keyframes pc-stat-card-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes pc-stat-card-fade{from{opacity:0}to{opacity:1}}
@keyframes pc-stat-card-pop{from{opacity:0;transform:scale(0)}to{opacity:1;transform:none}}
@keyframes pc-stat-card-bar{from{transform:scaleY(0)}to{transform:none}}
@keyframes pc-stat-card-skel{from{background-position:100% 0}to{background-position:0 0}}
@media (prefers-reduced-motion:reduce){.pc-stat-card[data-interactive],.pc-stat-card-arrow{transition:none}}
`

const SIZE = {
  sm: { pad: "p-3.5", value: "text-xl", label: "text-xs", icon: "size-7 rounded-md [&_svg]:size-3.5", chart: "h-8", side: "w-12 [&_svg]:size-5", gap: "gap-2" },
  md: { pad: "p-5", value: "text-3xl", label: "text-sm", icon: "size-8 rounded-lg [&_svg]:size-4", chart: "h-10", side: "w-16 [&_svg]:size-6", gap: "gap-2.5" },
  lg: { pad: "p-6", value: "text-4xl sm:text-[2.75rem]", label: "text-sm", icon: "size-10 rounded-xl [&_svg]:size-5", chart: "h-14", side: "w-20 [&_svg]:size-7", gap: "gap-3" },
} satisfies Record<StatCardSize, Record<string, string>>
const SHAPES: Record<StatCardShape, string> = { square: "rounded-none", rounded: "rounded-xl", round: "rounded-3xl" }

/* Mono film grain, tiled through an SVG pattern over the sparkline fill. */
const GRAIN = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`)}`
const DELTA_FORMAT: Intl.NumberFormatOptions = { maximumFractionDigits: 1 }

const toNumber = (v: number | string | undefined) => {
  if (typeof v === "number") return v
  if (typeof v !== "string" || !/^\s*[-+]?[\d,]*\.?\d+\s*$/.test(v)) return null
  return Number(v.replace(/[,\s]/g, ""))
}

function toPoints(data: StatCardProps["data"]) {
  if (!data) return []
  const arr = Array.isArray(data) ? data : data.split(/[\s,;]+/).map(Number)
  return arr.filter((n) => Number.isFinite(n))
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
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, enabled, inView])
  return inView
}

/** Tweens from the shown number to the target with an ease-out curve. */
function useCount(target: number, run: boolean, start: boolean) {
  const [shown, setShown] = React.useState(run ? 0 : target)
  const from = React.useRef(run ? 0 : target)
  React.useEffect(() => {
    if (!start) return
    if (!run || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = target
      setShown(target)
      return
    }
    const a = from.current
    const t0 = performance.now()
    const dur = 1200
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur)
      const v = a + (target - a) * (1 - Math.pow(1 - p, 4))
      from.current = v
      setShown(v)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, run, start])
  return shown
}

/** Drawn in real pixels (measured), so strokes stay crisp and the draw-in dash is exact at any width. */
function Sparkline({ points, chart, size, uid, active, onActive }: { points: number[]; chart: StatCardChart; size: StatCardSize; uid: string; active: number | null; onActive?: (i: number | null) => void }) {
  const box = React.useRef<HTMLDivElement>(null)
  const [dim, setDim] = React.useState<{ w: number; h: number } | null>(null)
  React.useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => {
      const w = Math.round(el.clientWidth)
      const h = Math.round(el.clientHeight)
      setDim((d) => (d && d.w === w && d.h === h ? d : { w, h }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  let svg: React.ReactNode = null
  let dot: React.ReactNode = null
  if (dim && dim.w > 0) {
    const { w: W, h: H } = dim
    const min = Math.min(...points)
    const max = Math.max(...points)
    const span = max - min || 1
    const n = points.length
    const pad = 4
    if (chart === "bars") {
      const bw = W / n
      svg = (
        <svg className="pc-stat-card-spark absolute inset-0" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          {points.map((v, i) => {
            const h = Math.max(2, ((v - min) / span) * (H - 4) + 3)
            return <rect key={i} className="b" x={i * bw + bw * 0.16} y={H - h} width={bw * 0.68} height={h} rx={Math.min(3, bw * 0.15)} data-on={active === i ? "" : undefined} style={{ "--i": i } as React.CSSProperties} />
          })}
        </svg>
      )
    } else {
      const xy = points.map((v, i) => [n === 1 ? W - pad : pad / 2 + (i / (n - 1)) * (W - pad * 1.5), pad + (1 - (v - min) / span) * (H - pad * 2)] as const)
      // Only rendered with 2+ points, so first/last always exist.
      const first = xy[0]!
      const last = xy[n - 1]!
      let d = `M${first[0].toFixed(1)},${first[1].toFixed(1)}`
      for (let i = 1; i < n; i++) {
        const [x0, y0] = xy[i - 1]!
        const [x1, y1] = xy[i]!
        const mx = ((x0 + x1) / 2).toFixed(1)
        d += ` C${mx},${y0.toFixed(1)} ${mx},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`
      }
      svg = (
        <svg className="pc-stat-card-spark absolute inset-0" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          {chart === "area" && (
            <>
              <defs>
                <linearGradient id={uid} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="currentColor" stopOpacity=".34" />
                  <stop offset="1" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
                <pattern id={`${uid}-g`} patternUnits="userSpaceOnUse" width={120} height={120}>
                  <image href={GRAIN} width={120} height={120} />
                </pattern>
              </defs>
              <path className="a" d={`${d} L${last[0].toFixed(1)},${H} L${first[0].toFixed(1)},${H} Z`} fill={`url(#${uid})`} />
              <path className="a" d={`${d} L${last[0].toFixed(1)},${H} L${first[0].toFixed(1)},${H} Z`} fill={`url(#${uid}-g)`} style={{ mixBlendMode: "overlay" }} opacity={0.4} />
            </>
          )}
          <path className="l" d={d} pathLength={1} />
        </svg>
      )
      const at = active === null ? last : (xy[active] ?? last)
      dot = (
        <>
          {active !== null && <span className="pc-stat-card-cross" style={{ left: at[0] }} aria-hidden="true" />}
          <span className="pc-stat-card-dot" style={{ left: at[0], top: at[1] }} aria-hidden="true" />
        </>
      )
    }
  }
  return (
    <div
      ref={box}
      className={cn("relative w-full", onActive && "cursor-crosshair touch-pan-y", SIZE[size].chart)}
      onPointerMove={
        onActive &&
        ((e) => {
          const r = e.currentTarget.getBoundingClientRect()
          onActive(Math.min(points.length - 1, Math.max(0, Math.round(((e.clientX - r.left) / r.width) * (points.length - 1)))))
        })
      }
      onPointerLeave={onActive && (() => onActive(null))}
    >
      {svg}
      {dot}
    </div>
  )
}

function Arrow({ up }: { up: boolean }) {
  return (
    <svg viewBox="0 0 12 12" data-down={up ? undefined : ""} className="pc-stat-card-arrow size-3" fill="none" aria-hidden="true">
      <path d="M6 9.5v-7M3 5l3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function StatCard({
  label,
  value,
  prefix = "",
  suffix = "",
  format,
  compact,
  locale: localeProp,
  delta,
  deltaLabel,
  deltaSuffix = "%",
  invertDelta,
  data,
  chart = "area",
  icon,
  footer,
  variant = "outline",
  tone = "primary",
  shadow = "none",
  shape = "rounded",
  size = "md",
  animation = "full",
  numberFlow,
  scrub,
  loading,
  interactive,
  labels,
  className,
  ...props
}: StatCardProps) {
  const l = useLabels("stat-card", DEFAULT_LABELS, labels)
  const { lang } = useGooduiLocale()
  const locale = localeProp ?? lang
  const ref = React.useRef<HTMLDivElement>(null)
  const uid = "pc-sc-" + React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const animated = animation !== "none"
  const inView = useInView(ref, animated)
  const counts = animation === "count" || animation === "full"
  const draws = animation === "draw" || animation === "full"

  const num = toNumber(value)
  const decimals = num == null ? 0 : (String(num).split(".")[1] ?? "").length
  const fmt = React.useMemo<Intl.NumberFormatOptions>(
    () => ({ ...(compact ? { notation: "compact", maximumFractionDigits: 1 } : { minimumFractionDigits: decimals, maximumFractionDigits: decimals }), ...format }),
    [compact, decimals, format],
  )
  const formatter = React.useMemo(() => new Intl.NumberFormat(locale, fmt), [locale, fmt])
  const flow = numberFlow || scrub
  const shown = useCount(num ?? 0, counts && !flow, !counts || inView)
  const finalText = num == null ? String(value) : `${prefix}${formatter.format(num)}${suffix}`

  const points = toPoints(data)
  const [active, setActive] = React.useState<number | null>(null)
  const scrubbed = scrub && active !== null ? points[active] : undefined
  const firstPoint = points[0] ?? 0
  const d = scrubbed !== undefined && firstPoint !== 0 ? ((scrubbed - firstPoint) / Math.abs(firstPoint)) * 100 : toNumber(delta)
  const trend = d == null || d === 0 ? "flat" : d > 0 !== !!invertDelta ? "good" : "bad"
  const s = SIZE[size]
  const split = variant === "split"

  const valueNode =
    num == null ? (
      <span>{value}</span>
    ) : flow ? (
      <NumberFlow value={scrubbed ?? (counts && !inView ? 0 : num)} format={fmt} locale={locale} prefix={prefix} suffix={suffix} speed={scrubbed === undefined ? "smooth" : "fast"} />
    ) : (
      <>
        <span className="sr-only">{finalText}</span>
        <span aria-hidden="true">{`${prefix}${formatter.format(counts ? shown : num)}${suffix}`}</span>
      </>
    )

  const body = (
    <div className={cn("flex min-w-0 flex-1 flex-col", s.gap, s.pad)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {icon && !split && <span className={cn("pc-stat-card-icon grid shrink-0 place-items-center", s.icon)}>{icon}</span>}
          <span className={cn("pc-stat-card-label truncate font-medium", s.label)}>{label}</span>
        </div>
        {d != null && !loading && (
          <span
            data-trend={trend}
            className="pc-stat-card-delta inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums"
          >
            {d !== 0 && <Arrow up={d > 0} />}
            <NumberFlow value={Math.abs(d)} format={DELTA_FORMAT} locale={locale} suffix={scrubbed === undefined ? deltaSuffix : "%"} speed={scrubbed === undefined ? "smooth" : "fast"} />
            <span className="sr-only">{` ${d > 0 ? l.increase : d < 0 ? l.decrease : l.noChange}`}</span>
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        {loading ? (
          <span className={cn("pc-stat-card-skel inline-block h-[1em] w-28", s.value)} />
        ) : (
          <span className={cn("leading-none font-semibold tracking-tight tabular-nums", s.value)}>{valueNode}</span>
        )}
        {deltaLabel && !loading && <span className="pc-stat-card-foot text-xs">{deltaLabel}</span>}
      </div>
      {points.length > 1 &&
        (loading ? <span className={cn("pc-stat-card-skel block w-full", s.chart)} /> : <Sparkline points={points} chart={chart} size={size} uid={uid} active={scrub ? active : null} onActive={scrub ? setActive : undefined} />)}
      {footer && <div className="pc-stat-card-foot text-xs">{footer}</div>}
    </div>
  )

  return (
    <>
      <GooduiTokens />
      <style href="pc-stat-card" precedence="default">
        {CSS}
      </style>
      <div
        ref={ref}
        data-slot="stat-card"
        data-variant={variant}
        data-tone={tone}
        data-shadow={variant === "neo" ? "none" : shadow}
        data-draw={draws}
        data-inview={animated ? inView : undefined}
        data-interactive={interactive ? "" : undefined}
        aria-busy={loading || undefined}
        className={cn("pc-stat-card flex min-w-0 overflow-hidden", variant === "gradient" && "pc-grain", SHAPES[shape], className)}
        {...props}
      >
        {split && icon && <div className={cn("pc-stat-card-side grid shrink-0 place-items-center", s.side)}>{icon}</div>}
        {body}
      </div>
    </>
  )
}
