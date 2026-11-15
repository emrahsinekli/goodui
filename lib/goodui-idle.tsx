"use client"

import * as React from "react"

// Some endless CSS animations (a text shimmer, a pulsing shadow, a travelling beam) make the browser restyle the page every frame, even
// while the element is scrolled far out of view. One such element is cheap; a long page with a dozen of them keeps a
// phone's processor busy for nothing and makes scrolling stutter. This pauses those endless goodui animations while their
// element is off screen and resumes them just before it comes back. One listener and one observer for the whole page,
// installed once, however many components render it.

const AWAY = "data-pc-away"
// Properties that move or resize the element's own box. A keyframe also has an `offset` key (its position in time), which
// is not the CSS `offset` property: that one is spelled `cssOffset` here.
const MOVES = /^(transform|translate|rotate|scale|cssOffset|offsetDistance|offsetPath|inset|top|right|bottom|left|margin|width|height)/
// What the browser can animate without the main thread.
const FREE = /^(transform|translate|rotate|scale|opacity)$/
// Keys every keyframe has that are not CSS properties.
const META = /^(offset|easing|composite|computedOffset)$/
let installed = false

type Kind = "none" | "still" | "moving"

/** Does the element carry an endless goodui animation, and does that animation move the element's own box? */
function kind(el: Element): Kind {
  let found: Kind = "none"
  for (const a of el.getAnimations({ subtree: true })) {
    const fx = a.effect as KeyframeEffect | null
    const name = (a as CSSAnimation).animationName
    if (!fx || fx.target !== el || typeof name !== "string" || !name.startsWith("pc-") || fx.getTiming().iterations !== Infinity) continue
    const props = fx.getKeyframes().flatMap((k) => Object.keys(k)).filter((p) => !META.test(p))
    // An animation that only moves or fades its element already runs off the main thread and costs the page nothing, so
    // there is nothing to win by pausing it; measured on real pages, a paused one next to a running one can even make
    // the browser restyle every frame. Only the costly kinds are paused. An animated custom property (@property) lists
    // no properties at all here, and it is one of the costly kinds.
    if (props.length && props.every((p) => FREE.test(p))) continue
    if (!fx.pseudoElement && props.some((p) => MOVES.test(p))) return "moving"
    found = "still"
  }
  return found
}

function install() {
  if (installed || typeof IntersectionObserver === "undefined" || typeof Element.prototype.getAnimations !== "function") return
  installed = true
  const watched = new WeakSet<Element>()
  // The observed box, and the animated elements that follow it.
  const followers = new WeakMap<Element, Set<Element>>()
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const set = followers.get(e.target)
        if (!set) continue
        for (const el of set) {
          if (!el.isConnected) set.delete(el)
          else if (e.isIntersecting) el.removeAttribute(AWAY)
          else if (e.target.isConnected) el.setAttribute(AWAY, "")
        }
        if (!set.size) {
          followers.delete(e.target)
          io.unobserve(e.target)
        }
      }
    },
    { rootMargin: "200px" },
  )
  const watch = (el: Element | null) => {
    if (!el || watched.has(el)) return
    const k = kind(el)
    if (k === "none") return
    // A bar that slides out of its own track would look "off screen" at the wrong moment and stay paused there, so an
    // element that moves itself is judged by the box it lives in, which holds still.
    const box = k === "moving" ? el.parentElement : el
    // No box (display: contents) never intersects; leave it alone rather than pause it for good.
    if (!box || box.getClientRects().length === 0) return
    watched.add(el)
    const set = followers.get(box)
    if (set) {
      // The box is already known: join it in whatever state its other followers are in.
      for (const other of set) {
        if (other.hasAttribute(AWAY)) el.setAttribute(AWAY, "")
        break
      }
      set.add(el)
    } else {
      followers.set(box, new Set([el]))
      io.observe(box)
    }
  }
  // Server-rendered animations are already running by the time this loads.
  for (const a of document.getAnimations()) watch((a.effect as KeyframeEffect | null)?.target ?? null)
  document.addEventListener(
    "animationstart",
    (e) => {
      if (e.animationName.startsWith("pc-") && e.target instanceof Element) watch(e.target)
    },
    true,
  )
}

/** Renders nothing. Mounted by `<GooduiTokens />`, so every goodui component brings it along. */
export function GooduiIdle() {
  React.useEffect(install, [])
  return null
}
