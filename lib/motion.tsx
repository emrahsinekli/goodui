// goodui motion and material tokens: one spring set, one set of curves, one elevation scale, one press.
// Installs as lib/goodui-motion.tsx. Components import from "@/lib/goodui-motion" and render <GooduiTokens />, so a
// single installed component carries everything it needs. React 19 hoists and dedupes the style tag by href.

import { GooduiIdle } from "./goodui-idle"

/** The whole kit moves on these. Spread one to add a delay: `{ ...spring.ui, delay: 0.1 }`. */
export const spring = {
  /** Indicators, tabs, press release. */
  snap: { type: "spring", visualDuration: 0.18, bounce: 0 },
  /** Menus, popovers, layout. */
  ui: { type: "spring", visualDuration: 0.28, bounce: 0.1 },
  /** Shared layout, dialogs. */
  morph: { type: "spring", visualDuration: 0.4, bounce: 0.12 },
  /** Drawers and sheets. */
  sheet: { type: "spring", visualDuration: 0.45, bounce: 0 },
  /** Success moments and drag release only. */
  play: { type: "spring", duration: 0.5, bounce: 0.2 },
} as const

/** Pointer followers, for useSpring. */
export const follow = { stiffness: 170, damping: 26, mass: 0.5 }

/** The same curves as the CSS variables, for motion `ease`. */
export const ease = {
  out: [0.23, 1, 0.32, 1],
  outExpo: [0.16, 1, 0.3, 1],
  inOut: [0.77, 0, 0.175, 1],
  drawer: [0.32, 0.72, 0, 1],
} as const

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

/*
 * :where() keeps specificity at zero, so a style pack or the app's own CSS can set any of these and win.
 * Dark shadows use white top light and black rims. Light shadows are tinted, never pure black.
 */
export const TOKENS_CSS = `
:where(:root){
  --pc-ease-out:cubic-bezier(.23,1,.32,1);
  --pc-ease-out-expo:cubic-bezier(.16,1,.3,1);
  --pc-ease-in-out:cubic-bezier(.77,0,.175,1);
  --pc-ease-drawer:cubic-bezier(.32,.72,0,1);
  --pc-ease-spring:cubic-bezier(.34,1.56,.64,1);
  --pc-spring-css:var(--pc-ease-spring);
  --pc-grain:${GRAIN};
  --pc-hair:color-mix(in oklab,var(--foreground) 8%,transparent);
  --pc-sh:240 20% 15%;
  --pc-e1:0 0 0 1px var(--pc-hair),0 1px 2px hsl(var(--pc-sh)/.05);
  --pc-e2:0 0 0 1px var(--pc-hair),0 1px 1px hsl(var(--pc-sh)/.03),0 4px 8px -4px hsl(var(--pc-sh)/.06),0 12px 20px -8px hsl(var(--pc-sh)/.08);
  --pc-e3:0 0 0 1px var(--pc-hair),0 1px 1px hsl(var(--pc-sh)/.03),0 8px 16px -4px hsl(var(--pc-sh)/.07),0 24px 40px -12px hsl(var(--pc-sh)/.14);
  --pc-well:inset 0 1px 2px hsl(var(--pc-sh)/.06);
  --pc-sheen:linear-gradient(rgb(255 255 255/.1),transparent);
  --pc-edge-t:rgb(255 255 255/.22);
  --pc-edge-b:rgb(0 0 0/.12);
}
@supports (animation-timing-function:linear(0,1)){
  :where(:root){--pc-spring-css:linear(0,.042,.141,.267,.399,.526,.639,.735,.813,.875,.922,.957,.981,.997,1.007,1.012,1.015,1.015,1.014,1.012,1.01,1.008,1.007,1.005,1)}
}
:where(.dark){
  --pc-hair:rgb(255 255 255/.08);
  --pc-e1:inset 0 1px rgb(255 255 255/.06),0 0 0 1px rgb(0 0 0/.5),0 1px 2px rgb(0 0 0/.4);
  --pc-e2:inset 0 1px rgb(255 255 255/.08),inset 0 0 0 1px rgb(255 255 255/.04),0 0 0 1px rgb(0 0 0/.6),0 8px 24px -4px rgb(0 0 0/.5);
  --pc-e3:inset 0 1px rgb(255 255 255/.1),inset 0 0 0 1px rgb(255 255 255/.05),0 0 0 1px rgb(0 0 0/.7),0 30px 50px -8px rgb(0 0 0/.6);
  --pc-well:inset 0 1px 2px rgb(0 0 0/.35);
}
.pc-press{transition:scale 120ms var(--pc-ease-out),transform 200ms var(--pc-ease-out),background-color 150ms ease,border-color 150ms ease,color 150ms ease,box-shadow 150ms ease,opacity 150ms ease}
.pc-press:where(:active:not(:disabled,[aria-disabled=true])){scale:.97}
.pc-press-soft:where(:active:not(:disabled,[aria-disabled=true])){scale:.992}
.pc-grain{position:relative;isolation:isolate}
.pc-grain::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;border-radius:inherit;opacity:.06;mix-blend-mode:overlay;background-image:var(--pc-grain)}
@media (prefers-reduced-motion:reduce){.pc-press,.pc-press-soft{scale:none!important;transition:none}}
[data-pc-away],[data-pc-away]::before,[data-pc-away]::after{animation-play-state:paused!important}
`

/** Renders nothing in place: the style tag is hoisted to <head> and shared by every component on the page. */
export function GooduiTokens() {
  return (
    <>
      <style href="pc-tokens" precedence="default">
        {TOKENS_CSS}
      </style>
      <GooduiIdle />
    </>
  )
}
