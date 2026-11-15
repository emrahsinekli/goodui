"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { GooduiTokens, ease as easing } from "@/lib/goodui-motion"

// Every block's highlight is offset by its own x position, so one band sweeps across the whole layout.
const CSS = `
@keyframes pc-skeleton-auto-sweep { from { transform: translateX(-70%) } to { transform: translateX(70%) } }
/* :where() keeps specificity at zero so Tailwind classes (absolute, bg-*) always win. */
:where(.pc-skeleton-auto) {
  overflow: hidden;
  background-color: color-mix(in oklab, var(--foreground) 8%, transparent);
}
.pc-skeleton-auto::after {
  content: ""; position: absolute; top: 0; bottom: 0;
  left: calc(-1 * var(--pc-sk-x, 0px)); width: var(--pc-sk-w, 100%); min-width: 100%;
  background: linear-gradient(90deg, transparent 30%, color-mix(in oklab, var(--background) 65%, transparent) 50%, transparent 70%);
  transform: translateX(-70%);
  animation: pc-skeleton-auto-sweep 1.7s var(--pc-ease-in-out) infinite;
}
.dark .pc-skeleton-auto::after { background: linear-gradient(90deg, transparent 30%, color-mix(in oklab, var(--foreground) 7%, transparent) 50%, transparent 70%); }
@media (prefers-reduced-motion: reduce) { .pc-skeleton-auto::after { animation: none; opacity: 0 } }
`

function SkeletonStyle() {
  return (
    <style href="pc-skeleton-auto" precedence="default">
      {CSS}
    </style>
  )
}

/* -------------------------------------------------------------- primitives */

export type SkeletonProps = React.ComponentProps<"div">

/** A shimmering block. Size it with classes, e.g. "h-24 w-full rounded-xl". */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <>
      <GooduiTokens />
      <SkeletonStyle />
      <div aria-hidden="true" data-slot="skeleton" className={cn("pc-skeleton-auto relative rounded-md", className)} {...props} />
    </>
  )
}

export type SkeletonLineProps = SkeletonProps & {
  /** CSS width, e.g. "60%" or 120. */
  width?: number | string
}

/** One line of text. */
export function SkeletonLine({ width = "100%", className, style, ...props }: SkeletonLineProps) {
  return <Skeleton className={cn("h-3 rounded-full", className)} style={{ width, ...style }} {...props} />
}

export type SkeletonCircleProps = SkeletonProps & {
  /** Diameter in px. */
  size?: number
}

/** An avatar or icon placeholder. */
export function SkeletonCircle({ size = 40, className, style, ...props }: SkeletonCircleProps) {
  return <Skeleton className={cn("shrink-0 rounded-full", className)} style={{ width: size, height: size, ...style }} {...props} />
}

/* ------------------------------------------------------------ auto layout */

type Bone = { x: number; y: number; w: number; h: number; r: string; text?: boolean }

const LEAF_TAGS = new Set(["img", "svg", "video", "canvas", "input", "textarea", "select", "button", "picture", "iframe", "progress", "meter"])

/** Reads the rendered children and returns a block for every text line, image, icon and control. */
function measureBones(root: HTMLElement, content: HTMLElement): Bone[] {
  // Bones are absolutely positioned against the padding box, so measure from inside the border.
  const box = root.getBoundingClientRect()
  const base = { left: box.left + root.clientLeft, top: box.top + root.clientTop }
  const bones: Bone[] = []
  const range = document.createRange()

  const walk = (el: Element) => {
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (!node.textContent?.trim()) continue
        const clip = el.getBoundingClientRect()
        range.selectNodeContents(node)
        // One rect per wrapped line, so paragraphs become several bars of the right lengths.
        for (const r of Array.from(range.getClientRects())) {
          const left = Math.max(r.left, clip.left)
          const right = Math.min(r.right, clip.right)
          if (right - left < 2 || r.height < 2) continue
          const h = Math.max(6, Math.round(r.height * 0.62))
          const bone = { x: left - base.left, y: r.top - base.top + (r.height - h) / 2, w: right - left, h, r: `${Math.min(h / 2, 6)}px`, text: true }
          // React splits "{a} · {b}" into several text nodes; join pieces that sit on the same line.
          const prev = bones[bones.length - 1]
          if (prev?.text && Math.abs(prev.y - bone.y) < 2 && prev.h === bone.h && bone.x - (prev.x + prev.w) < 8 && bone.x >= prev.x) {
            prev.w = bone.x + bone.w - prev.x
          } else bones.push(bone)
        }
      } else if (node instanceof Element) {
        if (node.hasAttribute("data-skeleton-ignore")) continue
        const style = getComputedStyle(node)
        if (style.display === "none" || style.visibility === "hidden") continue
        const tag = node.tagName.toLowerCase()
        if (LEAF_TAGS.has(tag) || node.hasAttribute("data-skeleton")) {
          const r = node.getBoundingClientRect()
          if (r.width < 2 || r.height < 2) continue
          const radius = tag === "svg" ? "4px" : style.borderRadius && style.borderRadius !== "0px" ? style.borderRadius : "6px"
          bones.push({ x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height, r: radius })
          continue
        }
        walk(node)
      }
    }
  }
  walk(content)
  range.detach?.()
  return bones
}

export type SkeletonSwapProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** While true, the children are hidden and the skeleton shows; set it to false to cross-fade to the content. */
  loading: boolean
  /**
   * The real content. While loading, render it with placeholder data: it stays invisible and its layout is traced
   * into skeleton blocks. Mark parts with data-skeleton (one solid block) or data-skeleton-ignore (skip).
   */
  children: React.ReactNode
  /** Hand-made skeleton instead of the traced one. */
  fallback?: React.ReactNode
  /** Announced to screen readers while loading. */
  loadingLabel?: string
}

/** Shows a shimmer skeleton shaped like its children while loading, then cross-fades to the real content. */
export function SkeletonSwap({ loading, children, fallback, loadingLabel = "Loading…", className, ...props }: SkeletonSwapProps) {
  const reduce = useReducedMotion() ?? false
  const rootRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [bones, setBones] = React.useState<Bone[]>([])
  const [width, setWidth] = React.useState(0)
  const auto = fallback === undefined

  React.useLayoutEffect(() => {
    const root = rootRef.current
    const content = contentRef.current
    if (!loading || !auto || !root || !content) return
    let frame = 0
    const run = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        setBones(measureBones(root, content))
        setWidth(root.offsetWidth)
      })
    }
    setBones(measureBones(root, content))
    setWidth(root.offsetWidth)
    const ro = new ResizeObserver(run)
    ro.observe(root)
    const mo = new MutationObserver(run)
    mo.observe(content, { childList: true, subtree: true, characterData: true })
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      mo.disconnect()
    }
  }, [loading, auto])

  const fade = reduce ? { duration: 0.15 } : { duration: 0.35, ease: easing.inOut }

  return (
    <div ref={rootRef} aria-busy={loading} className={cn("relative grid", className)} {...props}>
      <SkeletonStyle />
      {loading && (
        <span role="status" className="sr-only">
          {loadingLabel}
        </span>
      )}
      <motion.div
        ref={contentRef}
        className="col-start-1 row-start-1 min-w-0"
        inert={loading}
        aria-hidden={loading || undefined}
        initial={false}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={fade}
      >
        {children}
      </motion.div>
      <AnimatePresence initial={false}>
        {loading && (
          <motion.div
            key="skeleton"
            aria-hidden="true"
            // An absolute child placed in a grid cell would be positioned against that cell, so the traced layer is not placed.
            className={cn("pointer-events-none min-w-0", auto ? "absolute inset-0" : "col-start-1 row-start-1")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fade}
          >
            {auto
              ? bones.map((b, i) => (
                  <div
                    key={i}
                    className="pc-skeleton-auto absolute"
                    style={{
                      left: b.x,
                      top: b.y,
                      width: b.w,
                      height: b.h,
                      borderRadius: b.r,
                      ["--pc-sk-x" as string]: `${b.x}px`,
                      ["--pc-sk-w" as string]: `${width}px`,
                    }}
                  />
                ))
              : fallback}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
