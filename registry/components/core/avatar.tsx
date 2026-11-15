"use client"

import * as React from "react"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens } from "@/lib/goodui-motion"

/*
 * One avatar, independent layers: every axis combines with every other.
 *   size      xs–2xl                     shape     circle / rounded / square / squircle
 *   status    online / away / busy / offline dot (optional pulse)
 *   ring      none / solid (tone) / gradient / story, with a gap that follows the shape
 *   animation none / spin (rotating ring) / pulse / pop-in        shadow
 * Without an image (or when it fails) it shows initials on a gradient derived from the name, so the same
 * person always gets the same colors. AvatarGroup overlaps, caps with "+N" and spreads on hover.
 */

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
export type AvatarShape = "circle" | "rounded" | "square" | "squircle"
export type AvatarStatus = "none" | "online" | "away" | "busy" | "offline"
export type AvatarRing = "none" | "solid" | "gradient" | "story"
export type AvatarTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info"
export type AvatarAnimation = "none" | "spin" | "pulse" | "pop-in"
export type AvatarShadow = "none" | "sm" | "md" | "lg"

export type AvatarLabels = { online: string; away: string; busy: string; offline: string }
const DEFAULT_LABELS: AvatarLabels = { online: "online", away: "away", busy: "busy", offline: "offline" }

export type AvatarGroupLabels = { showMore: (count: number) => string; more: (count: number) => string }
const DEFAULT_GROUP_LABELS: AvatarGroupLabels = { showMore: (count) => `Show ${count} more`, more: (count) => `${count} more` }

export type AvatarProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** Image URL. While it loads, or if it fails, the initials or fallback show. */
  src?: string
  /** Accessible name; defaults to name. */
  alt?: string
  /** Used for the initials, the fallback gradient and the default alt text. */
  name?: string
  /** 24, 32, 40, 48, 64 or 80px. Inherits from AvatarGroup, else md. */
  size?: AvatarSize
  /** Inherits from AvatarGroup, else circle. */
  shape?: AvatarShape
  /** Presence dot in the bottom corner, with screen-reader text. */
  status?: AvatarStatus
  /** Pings the status dot. */
  statusPulse?: boolean
  /** Ring around the avatar with a gap: solid (tone color), gradient (tone based) or story (Instagram-style). */
  ring?: AvatarRing
  /** Color of the solid ring and the status-free accents. */
  tone?: AvatarTone
  /** spin rotates a gradient or story ring; pulse breathes the ring; pop-in plays on mount. */
  animation?: AvatarAnimation
  /** Drop shadow that follows the shape. */
  shadow?: AvatarShadow
  /** Content shown when there is no image and no name. */
  fallback?: React.ReactNode
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<AvatarLabels>
}

const PX: Record<AvatarSize, number> = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64, "2xl": 80 }

const SQUIRCLE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 0C12 0 0 12 0 50s12 50 50 50 50-12 50-50S88 0 50 0Z'/%3E%3C/svg%3E") center/100% 100% no-repeat`

const CSS = `
.pc-avatar{--pc-c:var(--primary);--pc-fg:var(--primary-foreground);--pc-rw:max(1.5px,calc(var(--pc-av-s) * .045));--pc-rg:max(1.5px,calc(var(--pc-av-s) * .04))}
.pc-avatar[data-tone=neutral]{--pc-c:var(--foreground);--pc-fg:var(--background)}
.pc-avatar[data-tone=success]{--pc-c:oklch(0.53 0.13 155);--pc-fg:#fff}
.pc-avatar[data-tone=warning]{--pc-c:oklch(0.75 0.16 70);--pc-fg:oklch(0.25 0.05 70)}
.pc-avatar[data-tone=danger]{--pc-c:oklch(0.56 0.21 27);--pc-fg:#fff}
.pc-avatar[data-tone=info]{--pc-c:oklch(0.55 0.17 250);--pc-fg:#fff}
.dark .pc-avatar[data-tone=success]{--pc-c:oklch(0.7 0.16 155);--pc-fg:oklch(0.2 0.05 155)}
.dark .pc-avatar[data-tone=danger]{--pc-c:oklch(0.68 0.2 25);--pc-fg:oklch(0.2 0.05 25)}
.dark .pc-avatar[data-tone=info]{--pc-c:oklch(0.7 0.15 245);--pc-fg:oklch(0.2 0.05 245)}
.pc-avatar{--pc-tint:color-mix(in oklab,var(--pc-c) 14%,transparent);--pc-ink:color-mix(in oklab,var(--pc-c) 82%,var(--foreground))}
.pc-avatar[data-tone=warning]{--pc-ink:color-mix(in oklab,var(--pc-c) 62%,var(--foreground))}

.pc-avatar-face,.pc-avatar-ring,.pc-avatar-gap{border-radius:9999px}
.pc-avatar[data-shape=rounded] :is(.pc-avatar-face,.pc-avatar-ring,.pc-avatar-gap){border-radius:24%}
.pc-avatar[data-shape=square] :is(.pc-avatar-face,.pc-avatar-ring,.pc-avatar-gap){border-radius:9%}
.pc-avatar[data-shape=squircle] :is(.pc-avatar-face,.pc-avatar-ring,.pc-avatar-gap){border-radius:0;-webkit-mask:${SQUIRCLE};mask:${SQUIRCLE}}

.pc-avatar-face{position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:100%;overflow:hidden;background:var(--muted);color:var(--muted-foreground);font-weight:600;font-size:calc(var(--pc-av-s) * .38);line-height:1;letter-spacing:-.01em;user-select:none}
.pc-avatar-face[data-initials]{color:#fff;text-shadow:0 1px 1px rgb(0 0 0/.12)}
.pc-avatar-face svg{width:55%;height:55%}
.pc-avatar-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .35s ease}
.pc-avatar-img[data-loaded]{opacity:1}

.pc-avatar-ring{position:absolute;inset:calc(-1 * (var(--pc-rw) + var(--pc-rg)));background:var(--pc-c)}
.pc-avatar-gap{position:absolute;inset:calc(-1 * var(--pc-rg));background:var(--pc-av-gap,var(--background))}
.pc-avatar[data-ring=gradient] .pc-avatar-ring{background:conic-gradient(from var(--pc-avatar-a,0deg),var(--pc-c),color-mix(in oklab,var(--pc-c) 40%,#d946ef),color-mix(in oklab,var(--pc-c) 30%,#f59e0b),var(--pc-c))}
.pc-avatar[data-ring=story] .pc-avatar-ring{background:conic-gradient(from var(--pc-avatar-a,0deg),#f59e0b,#ef4444,#d946ef,#8b5cf6,#f59e0b)}
@property --pc-avatar-a{syntax:"<angle>";inherits:false;initial-value:0deg}
.pc-avatar[data-anim=spin] .pc-avatar-ring{animation:pc-avatar-spin 3s linear infinite}
@keyframes pc-avatar-spin{to{--pc-avatar-a:360deg}}
/* A round ring looks the same whether its gradient turns or the ring itself does, and turning the ring costs the page nothing per frame. */
.pc-avatar[data-shape=circle][data-anim=spin] .pc-avatar-ring{animation-name:pc-avatar-turn}
@keyframes pc-avatar-turn{to{transform:rotate(360deg)}}
.pc-avatar[data-anim=pulse] .pc-avatar-ring{animation:pc-avatar-breathe 2s ease-in-out infinite}
.pc-avatar[data-anim=pulse][data-ring=none]::before{content:"";position:absolute;inset:0;border-radius:9999px;animation:pc-avatar-halo 2s var(--pc-ease-out) infinite;pointer-events:none}
.pc-avatar[data-anim=pulse][data-ring=none][data-shape=rounded]::before{border-radius:24%}
.pc-avatar[data-anim=pulse][data-ring=none][data-shape=square]::before{border-radius:9%}
.pc-avatar[data-anim=pulse][data-ring=none][data-shape=squircle]::before{border-radius:32%}
@keyframes pc-avatar-breathe{50%{transform:scale(1.07);opacity:.75}}
@keyframes pc-avatar-halo{0%{box-shadow:0 0 0 0 color-mix(in oklab,var(--pc-c) 50%,transparent)}100%{box-shadow:0 0 0 calc(var(--pc-av-s) * .22) transparent}}
.pc-avatar[data-anim=pop-in]{animation:pc-avatar-in .5s var(--pc-ease-spring) both}
@keyframes pc-avatar-in{0%{transform:scale(.4);opacity:0}100%{transform:scale(1);opacity:1}}

.pc-avatar[data-shadow=sm]{filter:drop-shadow(0 1px 2px rgb(0 0 0/.18))}
.pc-avatar[data-shadow=md]{filter:drop-shadow(0 4px 8px rgb(0 0 0/.2))}
.pc-avatar[data-shadow=lg]{filter:drop-shadow(0 10px 18px rgb(0 0 0/.28))}

.pc-avatar-status{position:absolute;inset-inline-end:0;bottom:0;z-index:2;width:max(8px,calc(var(--pc-av-s) * .27));height:max(8px,calc(var(--pc-av-s) * .27));border-radius:9999px;background:var(--pc-st);box-shadow:0 0 0 max(1.5px,calc(var(--pc-av-s) * .05)) var(--pc-av-gap,var(--background))}
.pc-avatar:not([data-shape=circle]) .pc-avatar-status{transform:translate(28%,28%)}
.pc-avatar:not([data-shape=circle]) .pc-avatar-status:dir(rtl){transform:translate(-28%,28%)}
.pc-avatar-status[data-status=online]{--pc-st:oklch(0.68 0.17 152)}
.pc-avatar-status[data-status=away]{--pc-st:oklch(0.78 0.16 75)}
.pc-avatar-status[data-status=busy]{--pc-st:oklch(0.62 0.22 25)}
.pc-avatar-status[data-status=offline]{--pc-st:oklch(0.7 0 0)}
.pc-avatar-status[data-pulse]::after{content:"";position:absolute;inset:0;border-radius:inherit;background:var(--pc-st);animation:pc-avatar-ping 1.6s var(--pc-ease-out) infinite}
@keyframes pc-avatar-ping{75%,100%{transform:scale(2.4);opacity:0}}

.pc-avatar-group{display:inline-flex;align-items:center;isolation:isolate;--pc-dir:1}
.pc-avatar-group:dir(rtl){--pc-dir:-1}
.pc-avatar-item{position:relative;display:inline-flex;transition:transform .3s var(--pc-ease-out)}
.pc-avatar-item .pc-avatar{--pc-rg:max(2px,calc(var(--pc-av-s) * .06))}
.pc-avatar-item+.pc-avatar-item{margin-inline-start:calc(var(--pc-av-s) * var(--pc-ov) * -1)}
.pc-avatar-group[data-spread]:hover .pc-avatar-item{transform:translateX(calc(var(--i) * var(--pc-av-s) * var(--pc-ov) * .85 * var(--pc-dir)))}
.pc-avatar-group[data-spread] .pc-avatar-item:hover{z-index:50;transform:translateX(calc(var(--i) * var(--pc-av-s) * var(--pc-ov) * .85 * var(--pc-dir))) translateY(-3px)}
.pc-avatar-group[data-tooltips] .pc-avatar-item[data-name]::after{content:attr(data-name);position:absolute;left:50%;bottom:calc(100% + 8px);padding:3px 8px;border-radius:6px;font-size:12px;font-weight:500;white-space:nowrap;background:var(--foreground);color:var(--background);opacity:0;transform:translate(-50%,4px) scale(.96);transition:opacity .15s,transform .15s;pointer-events:none}
.pc-avatar-group[data-tooltips] .pc-avatar-item[data-name]:hover{z-index:50}
.pc-avatar-group[data-tooltips] .pc-avatar-item[data-name]:hover::after{opacity:1;transform:translate(-50%,0) scale(1)}
.pc-avatar-more{display:inline-flex;align-items:center;justify-content:center;width:var(--pc-av-s);height:var(--pc-av-s);flex:none;background:var(--muted);color:var(--foreground);font-size:calc(var(--pc-av-s) * .34);font-weight:600;box-shadow:0 0 0 var(--pc-rg) var(--pc-av-gap,var(--background))}
button.pc-avatar-more{cursor:pointer}
button.pc-avatar-more:hover{background:color-mix(in oklab,var(--muted) 80%,var(--foreground))}
@media (prefers-reduced-motion:reduce){
  .pc-avatar,.pc-avatar *,.pc-avatar-item{animation:none!important;transition:none!important}
  .pc-avatar::before,.pc-avatar-status::after{display:none}
  .pc-avatar-group[data-spread] .pc-avatar-item{transform:none!important}
}
`

/** Deterministic hash, so a name always maps to the same gradient (SSR-safe). */
function hue(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return h % 360
}

/** "Maya Chen" → "MC", "Maya Lin Chen" → "MC" (first + last word), "Maya" → "M". Emoji-safe. */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return ""
  const first = Array.from(parts[0] ?? "")[0] ?? ""
  const last = parts.length > 1 ? (Array.from(parts[parts.length - 1] ?? "")[0] ?? "") : ""
  return (first + last).toUpperCase()
}

export function avatarGradient(name: string) {
  const h = hue(name)
  // Dark enough for the white initials to reach 4.5:1 across the middle of the tile on every hue.
  return `linear-gradient(135deg, oklch(0.56 0.14 ${h}), oklch(0.44 0.17 ${(h + 45) % 360}))`
}

type GroupCtx = { size?: AvatarSize; shape?: AvatarShape; inGroup: boolean }
const AvatarGroupContext = React.createContext<GroupCtx>({ inGroup: false })

export function Avatar({
  src,
  alt,
  name,
  size,
  shape,
  status = "none",
  statusPulse,
  ring = "none",
  tone = "primary",
  animation = "none",
  shadow = "none",
  fallback,
  labels,
  className,
  style,
  ...props
}: AvatarProps) {
  const l = useLabels("avatar", DEFAULT_LABELS, labels)
  const group = React.useContext(AvatarGroupContext)
  const s = size ?? group.size ?? "md"
  const sh = shape ?? group.shape ?? "circle"
  const [loaded, setLoaded] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  const imgRef = React.useRef<HTMLImageElement>(null)

  React.useEffect(() => {
    setFailed(false)
    setLoaded(false)
    const img = imgRef.current
    // Already in cache before hydration: onLoad will not fire again.
    if (img?.complete && img.naturalWidth > 0) setLoaded(true)
  }, [src])

  const showImg = !!src && !failed
  const text = name ? initials(name) : ""
  const label = alt ?? name

  return (
    <>
      <style href="pc-avatar" precedence="default">
        {CSS}
      </style>
      <span
        data-slot="avatar"
        data-shape={sh}
        data-ring={ring}
        data-tone={tone}
        data-anim={animation}
        data-shadow={shadow}
        role={showImg ? undefined : "img"}
        aria-label={showImg ? undefined : label}
        className={cn("pc-avatar relative inline-flex size-[var(--pc-av-s)] shrink-0 align-middle", className)}
        style={{ "--pc-av-s": `${PX[s]}px`, ...style } as React.CSSProperties}
        {...props}
      >
        {ring !== "none" && <span className="pc-avatar-ring" aria-hidden="true" />}
        {(ring !== "none" || group.inGroup) && <span className="pc-avatar-gap" aria-hidden="true" />}
        <span
          className="pc-avatar-face"
          data-initials={!showImg && text ? "" : undefined}
          style={!showImg && text && name ? { background: avatarGradient(name) } : undefined}
        >
          {showImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={src}
              alt={label ?? ""}
              className="pc-avatar-img"
              data-loaded={loaded ? "" : undefined}
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
              draggable={false}
            />
          ) : text ? (
            <span aria-hidden="true">{text}</span>
          ) : (
            (fallback ?? <User aria-hidden="true" />)
          )}
        </span>
        {status !== "none" && (
          <span className="pc-avatar-status" data-status={status} data-pulse={statusPulse ? "" : undefined}>
            <span className="sr-only">{l[status]}</span>
          </span>
        )}
      </span>
    </>
  )
}

export type AvatarGroupProps = React.ComponentProps<"div"> & {
  /** Size for every avatar in the group. */
  size?: AvatarSize
  /** Shape for every avatar and the "+N" chip. */
  shape?: AvatarShape
  /** How much neighbours overlap. */
  overlap?: "none" | "sm" | "md" | "lg"
  /** Show at most this many avatars, then a "+N" chip. */
  max?: number
  /** Avatars fan out when the group is hovered. */
  spread?: boolean
  /** Shows each avatar's name above it on hover. */
  tooltips?: boolean
  /** Makes the "+N" chip a button. */
  onMoreClick?: () => void
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<AvatarGroupLabels>
}

const OVERLAP = { none: 0, sm: 0.18, md: 0.3, lg: 0.45 }
const SHAPE_RADIUS: Record<AvatarShape, string> = { circle: "9999px", rounded: "24%", square: "9%", squircle: "30%" }

export function AvatarGroup({
  size = "md",
  shape = "circle",
  overlap = "md",
  max,
  spread = true,
  tooltips,
  onMoreClick,
  labels,
  className,
  style,
  children,
  ...props
}: AvatarGroupProps) {
  const gl = useLabels("avatar-group", DEFAULT_GROUP_LABELS, labels)
  const all = React.Children.toArray(children).filter(React.isValidElement)
  const shown = max !== undefined && all.length > max ? all.slice(0, max) : all
  const extra = all.length - shown.length
  const ctx = React.useMemo(() => ({ size, shape, inGroup: true }), [size, shape])
  const moreStyle = { borderRadius: SHAPE_RADIUS[shape] }

  return (
    <AvatarGroupContext.Provider value={ctx}>
      <GooduiTokens />
      <style href="pc-avatar" precedence="default">
        {CSS}
      </style>
      <div
        data-slot="avatar-group"
        data-spread={spread ? "" : undefined}
        data-tooltips={tooltips ? "" : undefined}
        className={cn("pc-avatar-group", className)}
        style={{ "--pc-av-s": `${PX[size]}px`, "--pc-ov": OVERLAP[overlap], "--pc-rg": `${Math.max(1.5, PX[size] * 0.06)}px`, ...style } as React.CSSProperties}
        {...props}
      >
        {shown.map((child, i) => {
          const n = (child.props as { name?: string }).name
          return (
            <span key={child.key ?? i} className="pc-avatar-item" data-name={tooltips ? n : undefined} style={{ "--i": i } as React.CSSProperties}>
              {child}
            </span>
          )
        })}
        {extra > 0 && (
          <span className="pc-avatar-item" style={{ "--i": shown.length } as React.CSSProperties}>
            {onMoreClick ? (
              <button type="button" className="pc-press pc-avatar-more outline-none focus-visible:ring-3 focus-visible:ring-ring/50" style={moreStyle} onClick={onMoreClick} aria-label={gl.showMore(extra)}>
                +{extra}
              </button>
            ) : (
              <span className="pc-avatar-more" style={moreStyle} aria-label={gl.more(extra)} role="img">
                +{extra}
              </span>
            )}
          </span>
        )}
      </div>
    </AvatarGroupContext.Provider>
  )
}
