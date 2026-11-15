"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { GooduiTokens } from "@/lib/goodui-motion"

/*
 * One separator, independent layers:
 *   variant      line, dashed, dotted, gradient (fades at the edges), double, glow, ornament
 *   ornament     none, diamond, dot, dots, icon: a mark in the middle (works with every variant)
 *   label        text in the middle, at the start or at the end, plain, pill or caps
 *   tone, thickness, orientation, animation (none, draw on view, shimmer)
 */

export type SeparatorVariant = "line" | "dashed" | "dotted" | "gradient" | "double" | "glow" | "ornament"
export type SeparatorTone = "neutral" | "primary" | "success" | "warning" | "danger" | "info"
export type SeparatorOrnament = "none" | "diamond" | "dot" | "dots" | "icon"
export type SeparatorAnimation = "none" | "draw" | "shimmer"
export type SeparatorThickness = "thin" | "medium" | "thick"

export type SeparatorProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Line style: line, dashed, dotted, gradient (fades at the edges), double, glow, or ornament (gradient with a diamond). */
  variant?: SeparatorVariant
  /** neutral (default) uses the theme border color; other tones color the line, marks and labels. */
  tone?: SeparatorTone
  /** Mark in the middle. The ornament variant defaults to a diamond. */
  ornament?: SeparatorOrnament
  /** Custom glyph for ornament="icon". */
  icon?: React.ReactNode
  /** Short text on the line, e.g. "or" or a date. */
  label?: React.ReactNode
  /** Where the label sits along the line. */
  labelPosition?: "center" | "start" | "end"
  /** plain muted text, a bordered pill, or small spaced capitals. */
  labelStyle?: "plain" | "pill" | "caps"
  orientation?: "horizontal" | "vertical"
  /** Line weight: 1, 2 or 4px (dots and dashes scale with it). */
  thickness?: SeparatorThickness
  /** "draw" grows the line the first time it scrolls into view; "shimmer" sends a light along it. */
  animation?: SeparatorAnimation
  /** Purely visual (role="none"), like shadcn. Set false to expose it to assistive tech. */
  decorative?: boolean
}

const tones = (c: string) => `
.${c}{--pc-c:var(--primary);--pc-fg:var(--primary-foreground)}
.${c}[data-tone=neutral]{--pc-c:var(--foreground);--pc-fg:var(--background)}
.${c}[data-tone=success]{--pc-c:oklch(0.53 0.13 155);--pc-fg:#fff}
.${c}[data-tone=warning]{--pc-c:oklch(0.75 0.16 70);--pc-fg:oklch(0.25 0.05 70)}
.${c}[data-tone=danger]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff}
.${c}[data-tone=info]{--pc-c:oklch(0.55 0.17 250);--pc-fg:#fff}
.dark .${c}[data-tone=success]{--pc-c:oklch(0.7 0.16 155);--pc-fg:oklch(0.2 0.05 155)}
.dark .${c}[data-tone=danger]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25)}
.dark .${c}[data-tone=info]{--pc-c:oklch(0.7 0.15 245);--pc-fg:oklch(0.2 0.05 245)}
.${c}{--pc-tint:color-mix(in oklab,var(--pc-c) 14%,transparent);--pc-ink:color-mix(in oklab,var(--pc-c) 82%,var(--foreground))}
.${c}[data-tone=warning]{--pc-ink:color-mix(in oklab,var(--pc-c) 62%,var(--foreground))}
`

const S = ".pc-separator"
const L = ".pc-separator-line"
const H = `${S}[data-orientation=horizontal]`
const V = `${S}[data-orientation=vertical]`
const CSS = `${tones("pc-separator")}
${S}{--t:1px;--d:2px;--dash:6px;--gap:4px;--pc-line:color-mix(in oklab,var(--pc-c) 55%,transparent);--pc-mark:var(--pc-ink);--dirn:90deg}
${S}[data-tone=neutral]{--pc-line:var(--border);--pc-mark:var(--muted-foreground)}
${S}[data-tone=neutral]:is([data-variant=dashed],[data-variant=dotted],[data-variant=gradient],[data-variant=ornament]){--pc-line:color-mix(in oklab,var(--foreground) 22%,transparent)}
${S}[data-thickness=medium]{--t:2px;--d:3px;--dash:8px;--gap:5px}
${S}[data-thickness=thick]{--t:4px;--d:5px;--dash:12px;--gap:7px}
${H}:dir(rtl){--dirn:270deg}
${V}{--dirn:180deg}
${L}{position:relative;flex:1 1 0%;min-width:0;min-height:0;background:var(--pc-line)}
${H} ${L}{height:var(--t)}
${V} ${L}{width:var(--t)}
${S}[data-thickness=thick] ${L}{border-radius:var(--t)}

${S}[data-variant=dashed] ${L}{background:repeating-linear-gradient(var(--dirn),var(--pc-line) 0 var(--dash),transparent var(--dash) calc(var(--dash) + var(--gap)))}
${S}[data-variant=dotted] ${L}{background:radial-gradient(circle closest-side,var(--pc-line) 96%,transparent) 0 0/calc(var(--d) * 2.6) calc(var(--d) * 2.6) repeat;border-radius:0}
${H}[data-variant=dotted] ${L}{height:var(--d);background-size:calc(var(--d) * 2.6) var(--d)}
${V}[data-variant=dotted] ${L}{width:var(--d);background-size:var(--d) calc(var(--d) * 2.6)}
${S}[data-variant=dotted]{--pc-line:color-mix(in oklab,var(--pc-c) 60%,transparent)}
${S}[data-variant=dotted][data-tone=neutral]{--pc-line:color-mix(in oklab,var(--foreground) 26%,transparent)}
${S}[data-variant=double] ${L}{background:transparent;border:0 solid var(--pc-line)}
${H}[data-variant=double] ${L}{height:calc(var(--t) * 3 + 1px);border-block-width:var(--t)}
${V}[data-variant=double] ${L}{width:calc(var(--t) * 3 + 1px);border-inline-width:var(--t)}
${S}:is([data-variant=gradient],[data-variant=ornament],[data-variant=glow]) ${L}{background:linear-gradient(var(--dirn),transparent,var(--pc-line) 50%,transparent)}
${S}:is([data-variant=gradient],[data-variant=ornament],[data-variant=glow]) ${L}[data-part=start]{background:linear-gradient(var(--dirn),transparent,var(--pc-line))}
${S}:is([data-variant=gradient],[data-variant=ornament],[data-variant=glow]) ${L}[data-part=end]{background:linear-gradient(var(--dirn),var(--pc-line),transparent)}
${S}[data-variant=glow]{--pc-line:var(--pc-c)}
${S}[data-variant=glow][data-tone=neutral]{--pc-line:color-mix(in oklab,var(--foreground) 55%,transparent)}
${S}[data-variant=glow] ${L}::before{content:"";position:absolute;inset:calc(var(--t) * -1.5 - 1px);background:inherit;filter:blur(4px);opacity:.65}

.pc-separator-mark{color:var(--pc-mark);display:inline-flex;align-items:center;justify-content:center}
.pc-separator-diamond{width:7px;height:7px;transform:rotate(45deg);border:1.5px solid currentColor;border-radius:1px}
${S}[data-thickness=thick] .pc-separator-diamond{width:10px;height:10px;background:currentColor}
.pc-separator-dot{width:6px;height:6px;border-radius:999px;background:currentColor}
.pc-separator-dots>.pc-separator-dot{width:4px;height:4px}
${S}[data-variant=glow] .pc-separator-mark{filter:drop-shadow(0 0 4px var(--pc-c))}
.pc-separator-label{color:color-mix(in oklab,var(--muted-foreground) 85%,var(--foreground))}
.pc-separator-label[data-style=pill]{border:1px solid var(--border);background:var(--background);color:var(--foreground)}
${S}:not([data-tone=neutral]) .pc-separator-label[data-style=pill]{border-color:color-mix(in oklab,var(--pc-c) 35%,var(--border));background:var(--pc-tint);color:var(--pc-ink)}
${S}:not([data-tone=neutral]) .pc-separator-label[data-style=caps]{color:var(--pc-ink)}

${S}[data-anim=draw] ${L}{transition:transform .8s var(--pc-ease-in-out)}
${H}[data-anim=draw]:not([data-seen]) ${L}{transform:scaleX(0)}
${V}[data-anim=draw]:not([data-seen]) ${L}{transform:scaleY(0)}
${H}[data-anim=draw] ${L}[data-part=start]{transform-origin:right}
${H}[data-anim=draw] ${L}[data-part=end]{transform-origin:left}
${H}[data-anim=draw] ${L}[data-part=start]:dir(rtl){transform-origin:left}
${H}[data-anim=draw] ${L}[data-part=end]:dir(rtl){transform-origin:right}
${V}[data-anim=draw] ${L}[data-part=start]{transform-origin:bottom}
${V}[data-anim=draw] ${L}[data-part=end]{transform-origin:top}
${S}[data-anim=draw] :is(.pc-separator-mark,.pc-separator-label){transition:opacity .4s .25s,transform .5s var(--pc-ease-spring) .2s}
${S}[data-anim=draw]:not([data-seen]) :is(.pc-separator-mark,.pc-separator-label){opacity:0;transform:scale(.6)}
${S}[data-anim=draw]:not([data-seen]) .pc-separator-diamond{transform:rotate(45deg) scale(.4)}
${S}[data-anim=draw] .pc-separator-diamond{transition:transform .5s var(--pc-ease-spring) .2s}

${S}[data-anim=shimmer] ${L}{overflow:hidden}
${S}[data-anim=shimmer] ${L}::after{content:"";position:absolute;inset:-2px auto -2px 0;width:35%;background:linear-gradient(90deg,transparent,color-mix(in oklab,var(--pc-c) 70%,white),transparent);animation:pc-separator-sweep 2.8s var(--pc-ease-in-out) infinite}
${V}[data-anim=shimmer] ${L}::after{inset:0 -2px auto -2px;width:auto;height:35%;background:linear-gradient(180deg,transparent,color-mix(in oklab,var(--pc-c) 70%,white),transparent);animation-name:pc-separator-sweep-y}
${S}[data-anim=shimmer][data-variant=glow] ${L}{overflow:visible}
@keyframes pc-separator-sweep{from{transform:translateX(-100%)}to{transform:translateX(300%)}}
@keyframes pc-separator-sweep-y{from{transform:translateY(-100%)}to{transform:translateY(300%)}}
@media (prefers-reduced-motion:reduce){
  ${S} *{transition:none!important;animation:none!important}
  ${S}[data-anim=draw] ${L},${S}[data-anim=draw] :is(.pc-separator-mark,.pc-separator-label){transform:none!important;opacity:1!important}
  ${S}[data-anim=draw] .pc-separator-diamond{transform:rotate(45deg)!important}
  ${S}[data-anim=shimmer] ${L}::after{display:none}
}
`

function Sparkle() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-3.5">
      <path d="M12 2.5c.4 4.6 2.9 7.1 7.5 7.5v.01c-4.6.4-7.1 2.9-7.5 7.49h-.01c-.4-4.6-2.9-7.1-7.49-7.5V10c4.6-.4 7.1-2.9 7.5-7.5Z" transform="translate(0 2)" />
    </svg>
  )
}

export function Separator({
  variant = "line",
  tone = "neutral",
  ornament = "none",
  icon,
  label,
  labelPosition = "center",
  labelStyle = "plain",
  orientation = "horizontal",
  thickness = "thin",
  animation = "none",
  decorative = true,
  className,
  ...props
}: SeparatorProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [seen, setSeen] = React.useState(false)
  const vertical = orientation === "vertical"

  React.useEffect(() => {
    if (animation !== "draw" || seen) return
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return setSeen(true)
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [animation, seen])

  const mark = ornament !== "none" ? ornament : variant === "ornament" ? "diamond" : "none"
  const markEl =
    mark === "none" ? null : (
      <span className="pc-separator-mark shrink-0" data-slot="separator-ornament" aria-hidden="true">
        {mark === "diamond" && <span className="pc-separator-diamond" />}
        {mark === "dot" && <span className="pc-separator-dot" />}
        {mark === "dots" && (
          <span className={cn("pc-separator-dots flex gap-1", vertical && "flex-col")}>
            <span className="pc-separator-dot" />
            <span className="pc-separator-dot" />
            <span className="pc-separator-dot" />
          </span>
        )}
        {mark === "icon" && <span className="inline-flex [&_svg]:size-3.5">{icon ?? <Sparkle />}</span>}
      </span>
    )
  const labelEl = label ? (
    <span
      data-slot="separator-label"
      data-style={labelStyle}
      className={cn(
        "pc-separator-label shrink-0 text-xs font-medium whitespace-nowrap",
        labelStyle === "pill" && "rounded-full px-2.5 py-0.5",
        labelStyle === "caps" && "text-[11px] font-semibold tracking-[0.14em] uppercase",
        vertical && "py-1",
      )}
    >
      {label}
    </span>
  ) : null
  const parts = labelEl && markEl ? (labelPosition === "center" ? [markEl, labelEl, markEl] : labelPosition === "start" ? [labelEl, markEl] : [markEl, labelEl]) : [labelEl ?? markEl]
  const center = labelEl || markEl ? (
    <span className={cn("inline-flex shrink-0 items-center gap-2", vertical && "flex-col")}>
      {parts.map((p, i) => (
        <React.Fragment key={i}>{p}</React.Fragment>
      ))}
    </span>
  ) : null
  const pos = center ? (labelEl ? labelPosition : "center") : "none"

  return (
    <>
      <GooduiTokens />
      <style href="pc-separator" precedence="default">
        {CSS}
      </style>
      <div
        ref={ref}
        role={decorative ? "none" : "separator"}
        aria-orientation={decorative ? undefined : orientation}
        data-slot="separator"
        data-orientation={orientation}
        data-variant={variant}
        data-tone={tone}
        data-thickness={thickness}
        data-anim={animation}
        data-seen={seen || undefined}
        className={cn("pc-separator flex items-center", vertical ? "h-full min-h-6 shrink-0 flex-col self-stretch gap-2" : "w-full min-w-0 gap-3", className)}
        {...props}
      >
        {pos === "none" && <span className="pc-separator-line" data-part="full" />}
        {(pos === "center" || pos === "end") && <span className="pc-separator-line" data-part="start" />}
        {center}
        {(pos === "center" || pos === "start") && <span className="pc-separator-line" data-part="end" />}
      </div>
    </>
  )
}
