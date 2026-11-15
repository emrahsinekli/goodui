"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { GooduiTokens } from "@/lib/goodui-motion"

/*
 * One text primitive, independent layers: every axis combines with every other.
 *   variant    paragraph, lead, small, caption, overline, eyebrow, quote, code
 *   tone       auto (the variant's natural color), default, muted, or an accent tone
 *   size/weight/font  "auto" keeps the variant's choice
 *   measure    readable line length          clamp      truncate or clamp to N lines
 *   animation  entrance on view (once)
 * <mark> inside any variant gets a tone marker. Fonts follow --font-serif / --font-mono when you set them.
 */

export type TextVariant = "paragraph" | "lead" | "small" | "caption" | "overline" | "eyebrow" | "quote" | "code"
export type TextTone = "auto" | "default" | "muted" | "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type TextSize = "auto" | "xs" | "sm" | "base" | "lg" | "xl" | "2xl"
export type TextWeight = "auto" | "normal" | "medium" | "semibold" | "bold"
export type TextFont = "auto" | "sans" | "serif" | "mono"
export type TextMeasure = "none" | "narrow" | "normal" | "wide"
export type TextAlign = "start" | "center" | "end" | "justify"
export type TextAnimation = "none" | "fade-in" | "fade-up" | "blur-in" | "reveal"
export type TextElement = "p" | "span" | "div" | "blockquote" | "figcaption" | "label" | "code" | "small" | "li" | "strong" | "em"

export type TextProps = React.HTMLAttributes<HTMLElement> & {
  /** Text role; sets the default element, size, weight, font and color. */
  variant?: TextVariant
  /** Element to render. Defaults per variant (p, blockquote for quote, code for code). */
  as?: TextElement
  /** Color: auto keeps the variant's color; default and muted use theme text colors; the rest are accent tones (also color <mark>). */
  tone?: TextTone
  /** Font size; auto uses the variant's. */
  size?: TextSize
  /** Font weight; auto uses the variant's. */
  weight?: TextWeight
  /** Font family; serif and mono use --font-serif and --font-mono. auto uses the variant's. */
  font?: TextFont
  /** Max line length: narrow 45ch, normal 65ch, wide 80ch. */
  measure?: TextMeasure
  /** Text alignment (start and end follow the writing direction). */
  align?: TextAlign
  /** Single line with an ellipsis. */
  truncate?: boolean
  /** Clamp to N lines with an ellipsis. */
  lineClamp?: number | "none" | "1" | "2" | "3" | "4" | "5" | "6"
  /** Entrance animation, played once when the text scrolls into view. */
  animation?: TextAnimation
  /** Quote variant: who said it. */
  attribution?: React.ReactNode
  ref?: React.Ref<HTMLElement>
}

const CSS = `
.pc-text{--pc-c:var(--primary);--pc-fg:var(--primary-foreground);margin:0}
.pc-text[data-tone=neutral]{--pc-c:var(--foreground);--pc-fg:var(--background)}
.pc-text[data-tone=success]{--pc-c:oklch(0.53 0.13 155);--pc-fg:#fff}
.pc-text[data-tone=warning]{--pc-c:oklch(0.75 0.16 70);--pc-fg:oklch(0.25 0.05 70)}
.pc-text[data-tone=danger]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff}
.pc-text[data-tone=info]{--pc-c:oklch(0.55 0.17 250);--pc-fg:#fff}
.dark .pc-text[data-tone=success]{--pc-c:oklch(0.7 0.16 155);--pc-fg:oklch(0.2 0.05 155)}
.dark .pc-text[data-tone=danger]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25)}
.dark .pc-text[data-tone=info]{--pc-c:oklch(0.7 0.15 245);--pc-fg:oklch(0.2 0.05 245)}
.pc-text{--pc-tint:color-mix(in oklab,var(--pc-c) 14%,transparent);--pc-ink:color-mix(in oklab,var(--pc-c) 82%,var(--foreground))}
.pc-text[data-tone=warning]{--pc-ink:color-mix(in oklab,var(--pc-c) 62%,var(--foreground))}

.pc-text[data-ink=default]{color:var(--foreground)}
.pc-text[data-ink=muted]{color:var(--muted-foreground)}
.pc-text[data-ink=tone]{color:var(--pc-ink)}
.pc-text[data-font=serif]{font-family:var(--font-serif,ui-serif,"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif)}
.pc-text[data-font=mono]{font-family:var(--font-mono,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace)}
.pc-text mark{background:color-mix(in oklab,var(--pc-c) 18%,transparent);color:inherit;border-radius:.25em;padding:.05em .2em;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.pc-text[data-tone=default] mark,.pc-text[data-tone=auto] mark,.pc-text[data-tone=muted] mark{background:color-mix(in oklab,oklch(0.8 0.16 85) 45%,transparent)}
.dark .pc-text[data-tone=default] mark,.dark .pc-text[data-tone=auto] mark,.dark .pc-text[data-tone=muted] mark{background:color-mix(in oklab,oklch(0.8 0.16 85) 30%,transparent)}
.pc-text code{font-family:var(--font-mono,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace);font-size:.875em;background:var(--muted);border-radius:.3em;padding:.1em .35em}
/* Muted text on a highlight or code chip drops below 4.5:1, so those runs use a stronger ink. */
.pc-text[data-variant=code][data-ink=muted],.pc-text[data-ink=muted] :is(mark,code){color:color-mix(in oklab,var(--muted-foreground) 55%,var(--foreground))}

.pc-text[data-variant=overline]{display:flex;align-items:center;gap:.75em}
.pc-text[data-variant=overline]::before{content:"";width:1.5em;height:1.5px;border-radius:1px;background:currentColor;opacity:.55;flex:none}
.pc-text[data-variant=overline][data-align=center]{justify-content:center}
.pc-text[data-variant=overline][data-align=end]{justify-content:flex-end}
.pc-text[data-variant=eyebrow]{display:inline-flex;align-items:center;gap:.5em;width:fit-content;max-width:100%;border:1px solid color-mix(in oklab,var(--pc-c) 22%,var(--border));background:color-mix(in oklab,var(--pc-c) 6%,var(--background));border-radius:999px;padding-block:.3em;padding-inline:.65em .8em;box-shadow:0 1px 2px rgb(0 0 0/.04)}
.pc-text[data-variant=eyebrow]::before{content:"";width:.45em;height:.45em;border-radius:999px;background:var(--pc-c);box-shadow:0 0 0 .2em color-mix(in oklab,var(--pc-c) 20%,transparent);flex:none}
.pc-text[data-variant=eyebrow][data-tone=auto]::before,.pc-text[data-variant=eyebrow][data-tone=default]::before,.pc-text[data-variant=eyebrow][data-tone=muted]::before{background:oklch(0.65 0.17 155);box-shadow:0 0 0 .2em color-mix(in oklab,oklch(0.65 0.17 155) 22%,transparent)}
.pc-text[data-variant=quote]{position:relative;border-inline-start:3px solid color-mix(in oklab,var(--pc-c) 70%,transparent);padding-inline-start:1.1em}
.pc-text[data-variant=quote][data-tone=auto],.pc-text[data-variant=quote][data-tone=default],.pc-text[data-variant=quote][data-tone=muted]{border-inline-start-color:var(--border)}
.pc-text-cite{display:block;margin-top:.6em;font-size:.8125rem;font-style:normal;font-family:var(--font-sans,ui-sans-serif,system-ui,sans-serif);color:var(--muted-foreground)}
.pc-text-cite::before{content:"— "}
.pc-text[data-variant=code]{background:color-mix(in oklab,var(--pc-c) 8%,var(--muted));border:1px solid color-mix(in oklab,var(--pc-c) 14%,var(--border));border-radius:.35em;padding:.12em .4em;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.pc-text[data-variant=code][data-tone=auto],.pc-text[data-variant=code][data-tone=default],.pc-text[data-variant=code][data-tone=muted]{background:var(--muted);border-color:var(--border)}

@media (prefers-reduced-motion:no-preference){
  .pc-text[data-inview=false]:not([data-anim=none]){opacity:0}
  .pc-text[data-inview=true][data-anim=fade-in]{animation:pc-text-fade .7s ease-out both}
  .pc-text[data-inview=true][data-anim=fade-up]{animation:pc-text-up .7s var(--pc-ease-out) both}
  .pc-text[data-inview=true][data-anim=blur-in]{animation:pc-text-blur .8s var(--pc-ease-out) both}
  .pc-text[data-inview=true][data-anim=reveal]{animation:pc-text-reveal .9s var(--pc-ease-in-out) both}
  .pc-text[data-inview=true][data-anim=reveal]:dir(rtl){animation-name:pc-text-reveal-rtl}
}
@keyframes pc-text-fade{from{opacity:0}to{opacity:1}}
@keyframes pc-text-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes pc-text-blur{from{opacity:0;filter:blur(8px)}to{opacity:1;filter:none}}
@keyframes pc-text-reveal{from{opacity:.2;clip-path:inset(0 100% 0 0)}to{opacity:1;clip-path:inset(0 0 0 0)}}
@keyframes pc-text-reveal-rtl{from{opacity:.2;clip-path:inset(0 0 0 100%)}to{opacity:1;clip-path:inset(0 0 0 0)}}
`

type VariantDefaults = { as: TextElement; size: Exclude<TextSize, "auto">; weight: Exclude<TextWeight, "auto">; font: Exclude<TextFont, "auto">; ink: "inherit" | "default" | "muted" | "tone"; extra: string }
const VARIANTS: Record<TextVariant, VariantDefaults> = {
  paragraph: { as: "p", size: "base", weight: "normal", font: "sans", ink: "inherit", extra: "leading-7" },
  lead: { as: "p", size: "xl", weight: "normal", font: "sans", ink: "muted", extra: "leading-relaxed tracking-[-0.01em]" },
  small: { as: "p", size: "sm", weight: "normal", font: "sans", ink: "inherit", extra: "leading-6" },
  caption: { as: "p", size: "xs", weight: "normal", font: "sans", ink: "muted", extra: "leading-5" },
  overline: { as: "p", size: "xs", weight: "semibold", font: "sans", ink: "muted", extra: "uppercase tracking-[0.14em] leading-5" },
  eyebrow: { as: "p", size: "xs", weight: "medium", font: "sans", ink: "default", extra: "leading-5" },
  quote: { as: "blockquote", size: "lg", weight: "normal", font: "serif", ink: "default", extra: "leading-relaxed italic" },
  code: { as: "code", size: "sm", weight: "normal", font: "mono", ink: "default", extra: "leading-6" },
}
const SIZES: Record<Exclude<TextSize, "auto">, string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-lg sm:text-xl",
  "2xl": "text-xl sm:text-2xl",
}
const WEIGHTS: Record<Exclude<TextWeight, "auto">, string> = { normal: "font-normal", medium: "font-medium", semibold: "font-semibold", bold: "font-bold" }
const MEASURES: Record<TextMeasure, string> = { none: "", narrow: "max-w-[45ch]", normal: "max-w-[65ch]", wide: "max-w-[80ch]" }
const ALIGNS: Record<TextAlign, string> = { start: "text-start", center: "text-center", end: "text-end", justify: "text-justify hyphens-auto" }

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
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, enabled, inView])
  return inView
}

export function Text({
  variant = "paragraph",
  as,
  tone = "auto",
  size = "auto",
  weight = "auto",
  font = "auto",
  measure = "none",
  align = "start",
  truncate,
  lineClamp = "none",
  animation = "none",
  attribution,
  className,
  style,
  children,
  ref: userRef,
  ...props
}: TextProps) {
  const ref = React.useRef<HTMLElement>(null)
  const animated = animation !== "none"
  const inView = useInView(ref, animated)
  const setRef = React.useCallback(
    (el: HTMLElement | null) => {
      ref.current = el
      if (typeof userRef === "function") userRef(el)
      else if (userRef) (userRef as React.RefObject<HTMLElement | null>).current = el
    },
    [userRef],
  )

  const d = VARIANTS[variant]
  const Tag = (as ?? d.as) as React.ElementType
  const ink = tone === "auto" ? d.ink : tone === "default" || tone === "muted" ? tone : "tone"
  const clamp = lineClamp === "none" ? 0 : Number(lineClamp)

  return (
    <>
      <GooduiTokens />
      <style href="pc-text" precedence="default">
        {CSS}
      </style>
      <Tag
        ref={setRef}
        data-slot="text"
        data-variant={variant}
        data-tone={tone}
        data-ink={ink}
        data-font={font === "auto" ? d.font : font}
        data-align={align}
        data-anim={animation}
        data-inview={animated ? inView : undefined}
        className={cn(
          "pc-text",
          SIZES[size === "auto" ? d.size : size],
          WEIGHTS[weight === "auto" ? d.weight : weight],
          d.extra,
          MEASURES[measure],
          ALIGNS[align],
          truncate && "truncate",
          clamp > 0 && !truncate && "overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical]",
          className,
        )}
        style={clamp > 0 && !truncate ? ({ WebkitLineClamp: clamp, ...style } as React.CSSProperties) : style}
        {...props}
      >
        {children}
        {variant === "quote" && attribution != null && <cite className="pc-text-cite">{attribution}</cite>}
      </Tag>
    </>
  )
}
