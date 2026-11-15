"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens } from "@/lib/goodui-motion"

/*
 * One link, independent layers: every axis combines with every other.
 *   underline   none, always, hover (static) · slide, grow-center, highlight, arrow (animated)
 *   decoration  line style for always / hover      tone     color (inherit follows the text around it)
 *   weight, size, iconLeft                          external auto-detected for http(s) links
 * Works with next/link: <Link as={NextLink} href="/pricing">Pricing</Link>.
 */

export type LinkUnderline = "none" | "always" | "hover" | "slide" | "grow-center" | "highlight" | "arrow"
export type LinkDecoration = "solid" | "dotted" | "dashed" | "wavy"
export type LinkTone = "inherit" | "muted" | "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type LinkWeight = "inherit" | "normal" | "medium" | "semibold" | "bold"
export type LinkSize = "inherit" | "xs" | "sm" | "base" | "lg"

export type LinkLabels = {
  /** Screen-reader note appended to external links. */
  newTab: string
}
const DEFAULT_LABELS: LinkLabels = { newTab: "(opens in a new tab)" }

export type LinkProps = React.ComponentProps<"a"> & {
  /** none, always, hover (static) or an animated effect: slide, grow-center, highlight (marker fill), arrow. */
  underline?: LinkUnderline
  /** Line style for underline="always" and "hover". */
  decoration?: LinkDecoration
  /** Link color; inherit follows the surrounding text, muted brightens on hover. */
  tone?: LinkTone
  /** Font weight; inherit keeps the parent's. */
  weight?: LinkWeight
  /** Font size; inherit keeps the parent's. */
  size?: LinkSize
  /** Opens in a new tab with an icon. Defaults to true for absolute http(s) URLs. */
  external?: boolean
  /** Show the ↗ icon on external links. */
  externalIcon?: boolean
  /** Icon before the text, sized to 1em. */
  iconLeft?: React.ReactNode
  /** Render another element, e.g. next/link. It receives href, className and the rest. */
  as?: React.ElementType
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<LinkLabels>
}

const CSS = `
.pc-link{--pc-c:var(--primary);--pc-fg:var(--primary-foreground);-webkit-tap-highlight-color:transparent}
.pc-link[data-tone=neutral]{--pc-c:var(--foreground);--pc-fg:var(--background)}
.pc-link[data-tone=success]{--pc-c:oklch(0.53 0.13 155);--pc-fg:#fff}
.pc-link[data-tone=warning]{--pc-c:oklch(0.75 0.16 70);--pc-fg:oklch(0.25 0.05 70)}
.pc-link[data-tone=danger]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff}
.pc-link[data-tone=info]{--pc-c:oklch(0.55 0.17 250);--pc-fg:#fff}
.dark .pc-link[data-tone=success]{--pc-c:oklch(0.7 0.16 155);--pc-fg:oklch(0.2 0.05 155)}
.dark .pc-link[data-tone=danger]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25)}
.dark .pc-link[data-tone=info]{--pc-c:oklch(0.7 0.15 245);--pc-fg:oklch(0.2 0.05 245)}
.pc-link{--pc-tint:color-mix(in oklab,var(--pc-c) 14%,transparent);--pc-ink:color-mix(in oklab,var(--pc-c) 82%,var(--foreground))}
.pc-link[data-tone=warning]{--pc-ink:color-mix(in oklab,var(--pc-c) 62%,var(--foreground))}
.pc-link[data-tone=inherit]{--pc-c:currentColor;--pc-ink:currentColor;--pc-tint:color-mix(in oklab,currentColor 14%,transparent)}
.pc-link[data-tone=muted]{--pc-c:var(--muted-foreground);--pc-ink:var(--muted-foreground)}

.pc-link{color:var(--pc-ink);text-decoration:none;cursor:pointer;border-radius:.2em;outline:none;transition:color .2s}
.pc-link[data-tone=muted]:hover{color:var(--foreground)}
.pc-link:focus-visible{outline:2px solid color-mix(in oklab,var(--pc-c) 55%,transparent);outline-offset:2px}
.pc-link{text-decoration-thickness:max(1px,.07em);text-underline-offset:.24em;text-decoration-style:var(--pc-deco,solid)}
.pc-link[data-decoration=dotted]{--pc-deco:dotted}
.pc-link[data-decoration=dashed]{--pc-deco:dashed}
.pc-link[data-decoration=wavy]{--pc-deco:wavy;text-underline-offset:.28em}
.pc-link[data-underline=always]{text-decoration-line:underline;text-decoration-color:color-mix(in oklab,currentColor 40%,transparent);transition:text-decoration-color .2s,color .2s}
.pc-link[data-underline=always]:hover{text-decoration-color:currentColor}
.pc-link[data-underline=hover]:hover{text-decoration-line:underline}

.pc-link[data-underline=slide],.pc-link[data-underline=grow-center]{background-image:linear-gradient(currentColor,currentColor);background-repeat:no-repeat;background-size:0% max(1px,.075em);background-position:100% 100%;padding-bottom:.08em;-webkit-box-decoration-break:clone;box-decoration-break:clone;transition:background-size .38s var(--pc-ease-out),color .2s}
.pc-link[data-underline=slide]:hover,.pc-link[data-underline=slide]:focus-visible{background-size:100% max(1px,.075em);background-position:0 100%}
.pc-link[data-underline=slide]:dir(rtl){background-position:0 100%}
.pc-link[data-underline=slide]:dir(rtl):hover,.pc-link[data-underline=slide]:dir(rtl):focus-visible{background-position:100% 100%}
.pc-link[data-underline=grow-center]{background-position:50% 100%}
.pc-link[data-underline=grow-center]:hover,.pc-link[data-underline=grow-center]:focus-visible{background-size:100% max(1px,.075em)}
.pc-link[data-underline=highlight]{background-image:linear-gradient(color-mix(in oklab,var(--pc-c) 22%,transparent),color-mix(in oklab,var(--pc-c) 22%,transparent));background-repeat:no-repeat;background-size:100% .14em;background-position:0 100%;padding:0 .12em;margin:0 -.12em;-webkit-box-decoration-break:clone;box-decoration-break:clone;transition:background-size .3s var(--pc-ease-out),color .2s}
.pc-link[data-underline=highlight]:hover,.pc-link[data-underline=highlight]:focus-visible{background-size:100% 100%}
.pc-link[data-tone=inherit][data-underline=highlight],.pc-link[data-tone=muted][data-underline=highlight]{background-image:linear-gradient(color-mix(in oklab,currentColor 16%,transparent),color-mix(in oklab,currentColor 16%,transparent))}

.pc-link-icon{display:inline-flex;vertical-align:-.12em;margin-inline-end:.3em}
.pc-link-icon>svg{width:1em;height:1em}
.pc-link-arrow,.pc-link-ext{display:inline-block;width:.85em;height:.85em;margin-inline-start:.22em;vertical-align:-.06em;transition:transform .25s var(--pc-ease-out)}
.pc-link-ext{width:.75em;height:.75em;opacity:.7;vertical-align:.02em}
.pc-link[data-underline=arrow]:hover .pc-link-arrow,.pc-link[data-underline=arrow]:focus-visible .pc-link-arrow{transform:translateX(.22em)}
.pc-link-arrow:dir(rtl){transform:scaleX(-1)}
.pc-link[data-underline=arrow]:hover .pc-link-arrow:dir(rtl),.pc-link[data-underline=arrow]:focus-visible .pc-link-arrow:dir(rtl){transform:translateX(-.22em) scaleX(-1)}
.pc-link:hover .pc-link-ext{transform:translate(.1em,-.1em);opacity:1}
.pc-link-ext:dir(rtl){transform:scaleX(-1)}
.pc-link:hover .pc-link-ext:dir(rtl){transform:translate(-.1em,-.1em) scaleX(-1)}
.pc-link-nowrap{white-space:nowrap}
@media (prefers-reduced-motion:reduce){
  .pc-link,.pc-link *{transition:none!important}
}
`

const WEIGHTS: Record<LinkWeight, string> = { inherit: "", normal: "font-normal", medium: "font-medium", semibold: "font-semibold", bold: "font-bold" }
const SIZES: Record<LinkSize, string> = { inherit: "", xs: "text-xs", sm: "text-sm", base: "text-base", lg: "text-lg" }

const isAbsolute = (href?: string) => !!href && /^(https?:)?\/\//i.test(href)

/** Keeps the trailing icon glued to the last word so it never wraps onto its own line. */
function glue(children: React.ReactNode, icon: React.ReactNode) {
  if (typeof children !== "string")
    return (
      <>
        {children}
        {icon}
      </>
    )
  const i = children.trimEnd().lastIndexOf(" ")
  if (i < 0)
    return (
      <span className="pc-link-nowrap">
        {children}
        {icon}
      </span>
    )
  return [
    children.slice(0, i + 1),
    <span key="last" className="pc-link-nowrap">
      {children.slice(i + 1)}
      {icon}
    </span>,
  ]
}

export function Link({
  underline = "hover",
  decoration = "solid",
  tone = "primary",
  weight = "medium",
  size = "inherit",
  external,
  externalIcon = true,
  iconLeft,
  as,
  href,
  target,
  rel,
  className,
  children,
  labels,
  ...props
}: LinkProps) {
  const l = useLabels("link", DEFAULT_LABELS, labels)
  const Comp = (as ?? "a") as React.ElementType
  const ext = external ?? isAbsolute(href)
  const trailing =
    underline === "arrow" ? (
      <svg key="arrow" className="pc-link-arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 8h9.5M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ) : ext && externalIcon ? (
      <svg key="ext" className="pc-link-ext" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M5 11 11 5M6 5h5v5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ) : null

  return (
    <>
      <GooduiTokens />
      <style href="pc-link" precedence="default">
        {CSS}
      </style>
      <Comp
        data-slot="link"
        data-underline={underline}
        data-decoration={decoration}
        data-tone={tone}
        href={href}
        target={target ?? (ext ? "_blank" : undefined)}
        rel={rel ?? (ext ? "noopener noreferrer" : undefined)}
        className={cn("pc-link w-fit", WEIGHTS[weight], SIZES[size], className)}
        {...props}
      >
        {iconLeft && (
          <span className="pc-link-icon" aria-hidden="true">
            {iconLeft}
          </span>
        )}
        {trailing ? glue(children, trailing) : children}
        {ext && <span className="sr-only">{" " + l.newTab}</span>}
      </Comp>
    </>
  )
}

/** Alias for when `Link` clashes with next/link in the same file. */
export { Link as TextLink }
