"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { GooduiTokens } from "@/lib/goodui-motion"

/*
 * One card, independent layers: every axis combines with every other.
 *   variant   how it is painted          tone      accent, glow and tint color
 *   shadow    how it sits on the page    animation how it reacts to the pointer (border-beam loops on its own)
 *   padding   inner spacing              radius    corners
 *   accent    top or left color stripe
 * Use the parts (CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardMedia) or the shorthand
 * props (title, description, icon, action, footer) for the common header + body + footer layout.
 */

export type CardVariant = "elevated" | "outline" | "soft" | "glass" | "gradient-border" | "neo" | "inset" | "dashed"
export type CardTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type CardShadow = "none" | "sm" | "md" | "lg" | "xl" | "glow"
export type CardAnimation = "none" | "lift" | "tilt" | "spotlight" | "glow" | "border-beam" | "scale"
export type CardPadding = "none" | "sm" | "md" | "lg"
export type CardRadius = "none" | "sm" | "md" | "lg" | "xl" | "2xl"
export type CardAccent = "none" | "top" | "left"

export type CardProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** Surface: elevated (default), outline, soft tint, frosted glass, gradient border, neo-brutalist, inset well or dashed. */
  variant?: CardVariant
  /** Color for the accent stripe, glow, soft tint, gradient border, hover light and icon tile. */
  tone?: CardTone
  /** Drop shadow; glow uses the tone color. Ignored by neo, which has its own offset shadow. */
  shadow?: CardShadow
  /** Motion layer. lift, scale and glow react to hover; tilt and spotlight follow the pointer; border-beam is not a hover
   * effect: it loops a light around the border continuously (off with reduced motion). */
  animation?: CardAnimation
  /** Inner spacing and gap between parts; CardMedia and separated footers bleed by this amount. */
  padding?: CardPadding
  radius?: CardRadius
  /** A tone-colored stripe on the top or left edge. */
  accent?: CardAccent
  /** Fine film grain over the surface. */
  grain?: boolean
  /** false shrinks the card to its content. */
  fullWidth?: boolean
  /** Shorthand: renders a CardHeader with this title. */
  title?: React.ReactNode
  /** Shorthand: muted line under the title. */
  description?: React.ReactNode
  /** Shorthand: icon in a tinted tile beside the title. */
  icon?: React.ReactNode
  /** Shorthand: element on the right of the header (a badge, a menu button). */
  action?: React.ReactNode
  /** Shorthand: renders a CardFooter. */
  footer?: React.ReactNode
}

const CSS = `
.pc-card{--pc-c:var(--primary);--pc-fg:var(--primary-foreground);isolation:isolate}
.pc-card[data-tone=neutral]{--pc-c:var(--foreground);--pc-fg:var(--background)}
.pc-card[data-tone=success]{--pc-c:oklch(0.53 0.13 155);--pc-fg:#fff}
.pc-card[data-tone=warning]{--pc-c:oklch(0.75 0.16 70);--pc-fg:oklch(0.25 0.05 70)}
.pc-card[data-tone=danger]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff}
.pc-card[data-tone=info]{--pc-c:oklch(0.55 0.17 250);--pc-fg:#fff}
.dark .pc-card[data-tone=success]{--pc-c:oklch(0.7 0.16 155);--pc-fg:oklch(0.2 0.05 155)}
.dark .pc-card[data-tone=danger]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25)}
.dark .pc-card[data-tone=info]{--pc-c:oklch(0.7 0.15 245);--pc-fg:oklch(0.2 0.05 245)}
.pc-card{--pc-tint:color-mix(in oklab,var(--pc-c) 14%,transparent);--pc-ink:color-mix(in oklab,var(--pc-c) 82%,var(--foreground))}
.pc-card[data-tone=warning]{--pc-ink:color-mix(in oklab,var(--pc-c) 62%,var(--foreground))}

.pc-card{--pc-card-bw:1px;background:var(--card);color:var(--card-foreground);border:var(--pc-card-bw) solid transparent;box-shadow:var(--pc-card-acc,0 0 #0000),var(--pc-card-v,0 0 #0000),var(--pc-card-sh,0 0 #0000),var(--pc-card-hov,0 0 #0000)}
.pc-card[data-variant=elevated]{--pc-card-v:var(--pc-e2)}
.pc-card[data-variant=outline]{border-color:var(--border);--pc-card-v:0 1px 2px hsl(var(--pc-sh)/.04)}
.pc-card[data-variant=soft]{background:color-mix(in oklab,var(--pc-c) 6%,var(--card));border-color:color-mix(in oklab,var(--pc-c) 16%,transparent)}
.pc-card[data-variant=glass]{background:color-mix(in oklab,var(--card) 50%,transparent);border-color:color-mix(in oklab,var(--foreground) 13%,transparent);-webkit-backdrop-filter:blur(16px) saturate(1.6);backdrop-filter:blur(16px) saturate(1.6);--pc-card-v:inset 0 1px 0 color-mix(in oklab,white 35%,transparent)}
/* Neutral light-edge by default; the tone appears only when a tone is asked for. */
.pc-card[data-variant=gradient-border]{--pc-card-bw:1px;--pc-card-edge:linear-gradient(180deg,color-mix(in oklab,var(--foreground) 22%,transparent),color-mix(in oklab,var(--foreground) 5%,transparent));background:linear-gradient(var(--card),var(--card)) padding-box,var(--pc-card-edge) border-box}
.pc-card[data-variant=gradient-border]:is([data-tone=success],[data-tone=warning],[data-tone=danger],[data-tone=info]){--pc-card-edge:linear-gradient(180deg,var(--pc-c),color-mix(in oklab,var(--pc-c) 18%,transparent))}
.pc-card[data-variant=neo]{--pc-card-bw:2px;border-color:var(--foreground);--pc-card-v:6px 6px 0 var(--foreground)}
.pc-card[data-variant=inset]{background:var(--muted);--pc-card-v:inset 0 2px 6px rgb(0 0 0/.07),inset 0 0 0 1px color-mix(in oklab,var(--foreground) 5%,transparent)}
.pc-card[data-variant=dashed]{--pc-card-bw:1.5px;background:transparent;border-style:dashed;border-color:color-mix(in oklab,var(--foreground) 22%,transparent)}

.pc-card[data-shadow=sm]{--pc-card-sh:var(--pc-e1)}
.pc-card[data-shadow=md]{--pc-card-sh:var(--pc-e2)}
.pc-card[data-shadow=lg]{--pc-card-sh:var(--pc-e3)}
.pc-card[data-shadow=xl]{--pc-card-sh:var(--pc-e3),0 40px 80px -24px hsl(var(--pc-sh)/.2)}
.pc-card[data-shadow=glow]{--pc-card-sh:0 0 0 1px color-mix(in oklab,var(--pc-c) 16%,transparent),0 14px 44px -12px color-mix(in oklab,var(--pc-c) 55%,transparent)}
.pc-card[data-accent=top]{--pc-card-acc:inset 0 3px 0 var(--pc-c)}
.pc-card[data-accent=left]{--pc-card-acc:inset 3px 0 0 var(--pc-c)}
.pc-card[data-accent=left]:dir(rtl){--pc-card-acc:inset -3px 0 0 var(--pc-c)}
.pc-card:is([data-variant=soft],[data-variant=inset],[data-variant=glass]){--pc-card-muted:color-mix(in oklab,var(--muted-foreground) 80%,var(--foreground))}

.pc-card[data-grain]:not([data-variant=gradient-border]){background-image:var(--pc-grain);background-blend-mode:soft-light}

.pc-card-icon{background:var(--pc-tint);color:var(--pc-ink)}

.pc-card[data-anim=lift]{transition:transform .25s var(--pc-ease-out),box-shadow .25s}
.pc-card[data-anim=lift]:hover{transform:translateY(-4px);--pc-card-hov:var(--pc-e3)}
.pc-card[data-anim=lift][data-variant=neo]:hover{transform:translate(-2px,-2px);--pc-card-v:8px 8px 0 var(--foreground);--pc-card-hov:0 0 #0000}
.pc-card[data-anim=scale]{transition:transform .25s var(--pc-ease-out),box-shadow .25s}
.pc-card[data-anim=scale]:hover{transform:scale(1.02)}
.pc-card[data-anim=glow]{transition:box-shadow .3s}
.pc-card[data-anim=glow]:hover{--pc-card-hov:0 0 0 1px color-mix(in oklab,var(--pc-c) 45%,transparent),0 14px 44px -10px color-mix(in oklab,var(--pc-c) 60%,transparent)}

.pc-card[data-anim=tilt]{transform:perspective(1000px) rotateX(var(--pc-card-rx,0deg)) rotateY(var(--pc-card-ry,0deg));transition:transform .5s var(--pc-ease-out),box-shadow .3s;will-change:transform}
.pc-card[data-anim=tilt][data-active]{transition:transform .08s linear,box-shadow .3s;--pc-card-hov:var(--pc-e3)}
.pc-card[data-anim=tilt]::before{content:"";position:absolute;inset:0;z-index:-1;border-radius:inherit;background:radial-gradient(360px circle at var(--pc-card-mx,50%) var(--pc-card-my,50%),rgb(255 255 255/.16),transparent 55%);opacity:0;transition:opacity .3s;pointer-events:none}
.dark .pc-card[data-anim=tilt]::before{background:radial-gradient(360px circle at var(--pc-card-mx,50%) var(--pc-card-my,50%),rgb(255 255 255/.07),transparent 55%)}
.pc-card[data-anim=tilt][data-active]::before{opacity:1}

.pc-card[data-anim=spotlight]::before{content:"";position:absolute;inset:0;z-index:-1;border-radius:inherit;background:radial-gradient(420px circle at var(--pc-card-mx,50%) var(--pc-card-my,50%),color-mix(in oklab,var(--pc-c) 13%,transparent),transparent 60%);opacity:0;transition:opacity .3s;pointer-events:none}
.pc-card[data-anim=spotlight]::after{content:"";position:absolute;inset:calc(-1 * var(--pc-card-bw));z-index:-1;border-radius:inherit;padding:max(var(--pc-card-bw),1px);background:radial-gradient(260px circle at var(--pc-card-mx,50%) var(--pc-card-my,50%),color-mix(in oklab,var(--pc-c) 75%,transparent),transparent 70%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);opacity:0;transition:opacity .3s;pointer-events:none}
.pc-card[data-anim=spotlight][data-active]::before,.pc-card[data-anim=spotlight][data-active]::after{opacity:1}

@property --pc-card-a{syntax:"<angle>";inherits:false;initial-value:0deg}
.pc-card[data-anim=border-beam]::after{content:"";position:absolute;inset:calc(-1 * var(--pc-card-bw));z-index:-1;border-radius:inherit;padding:max(var(--pc-card-bw),1.5px);background:conic-gradient(from var(--pc-card-a),transparent 0 72%,color-mix(in oklab,var(--pc-c) 70%,#d946ef) 84%,var(--pc-c) 92%,transparent);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);animation:pc-card-beam 4s linear infinite;pointer-events:none}
@keyframes pc-card-beam{to{--pc-card-a:360deg}}

@media (prefers-reduced-motion:reduce){
  .pc-card{transition:none!important;transform:none!important}
  .pc-card::before,.pc-card::after{animation:none!important;transition:none!important}
  .pc-card[data-anim=border-beam]::after{display:none}
}
`

const PADDING: Record<CardPadding, string> = {
  none: "gap-0 [--pc-card-p:0px]",
  sm: "gap-3 p-4 [--pc-card-p:1rem]",
  md: "gap-4 p-6 [--pc-card-p:1.5rem]",
  lg: "gap-6 p-8 [--pc-card-p:2rem]",
}
const RADIUS: Record<CardRadius, string> = { none: "rounded-none", sm: "rounded-md", md: "rounded-lg", lg: "rounded-xl", xl: "rounded-2xl", "2xl": "rounded-3xl" }

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

export function Card({
  variant = "elevated",
  tone = "primary",
  shadow = "none",
  animation = "none",
  padding = "md",
  radius = "lg",
  accent = "none",
  grain,
  fullWidth = true,
  title,
  description,
  icon,
  action,
  footer,
  className,
  children,
  onPointerMove,
  onPointerLeave,
  ...props
}: CardProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const follows = animation === "tilt" || animation === "spotlight"

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e)
    const el = ref.current
    if (!follows || !el || e.pointerType === "touch") return
    const r = el.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    el.style.setProperty("--pc-card-mx", `${x}px`)
    el.style.setProperty("--pc-card-my", `${y}px`)
    if (animation === "tilt" && !reduced()) {
      el.style.setProperty("--pc-card-rx", `${((0.5 - y / r.height) * 8).toFixed(2)}deg`)
      el.style.setProperty("--pc-card-ry", `${((x / r.width - 0.5) * 10).toFixed(2)}deg`)
    }
    el.setAttribute("data-active", "")
  }
  const leave = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(e)
    const el = ref.current
    if (!el) return
    el.removeAttribute("data-active")
    el.style.removeProperty("--pc-card-rx")
    el.style.removeProperty("--pc-card-ry")
  }

  const header =
    title || description || icon || action ? (
      <CardHeader icon={icon} action={action}>
        {title && <CardTitle>{title}</CardTitle>}
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
    ) : null

  return (
    <>
      <GooduiTokens />
      <style href="pc-card" precedence="default">
        {CSS}
      </style>
      <div
        ref={ref}
        data-slot="card"
        data-variant={variant}
        data-tone={tone}
        data-shadow={variant === "neo" ? "none" : shadow}
        data-anim={animation}
        data-accent={accent}
        data-grain={grain || undefined}
        onPointerMove={move}
        onPointerLeave={leave}
        className={cn(
          "pc-card relative flex flex-col text-sm outline-none",
          "focus-visible:ring-3 focus-visible:ring-[color-mix(in_oklab,var(--pc-c)_40%,transparent)]",
          PADDING[padding],
          RADIUS[radius],
          fullWidth ? "w-full" : "w-fit",
          className,
        )}
        {...props}
      >
        {header}
        {header && typeof children === "string" ? <CardContent>{children}</CardContent> : children}
        {footer && <CardFooter>{footer}</CardFooter>}
      </div>
    </>
  )
}

export type CardHeaderProps = React.ComponentProps<"div"> & {
  /** Icon shown in a tinted tile on the left. */
  icon?: React.ReactNode
  /** Element on the right (badge, menu, button). */
  action?: React.ReactNode
}

export function CardHeader({ icon, action, className, children, ...props }: CardHeaderProps) {
  return (
    <div data-slot="card-header" className={cn("flex items-start gap-3", className)} {...props}>
      {icon && (
        <span className="pc-card-icon inline-flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-[18px]" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 data-slot="card-title" className={cn("text-base leading-tight font-semibold tracking-tight", className)} {...props} />
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="card-description" className={cn("text-sm text-[var(--pc-card-muted,var(--muted-foreground))]", className)} {...props} />
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("min-w-0", className)} {...props} />
}

export type CardFooterProps = React.ComponentProps<"div"> & {
  /** Full-bleed top border above the footer. */
  separated?: boolean
}

export function CardFooter({ separated, className, ...props }: CardFooterProps) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex flex-wrap items-center gap-2",
        separated && "-mx-[var(--pc-card-p)] border-t px-[var(--pc-card-p)] pt-[var(--pc-card-p)]",
        className,
      )}
      {...props}
    />
  )
}

/** Full-bleed media (image, chart, map) at the top of a card. */
export function CardMedia({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-media"
      className={cn("-mx-[var(--pc-card-p)] -mt-[var(--pc-card-p)] overflow-hidden rounded-t-[inherit] [&>img]:block [&>img]:w-full [&>img]:object-cover", className)}
      {...props}
    />
  )
}
