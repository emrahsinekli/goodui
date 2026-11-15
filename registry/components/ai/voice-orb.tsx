"use client"

import * as React from "react"
import { motion, useReducedMotion, useSpring, useTransform } from "motion/react"
import { cn } from "@/lib/utils"
import { GooduiTokens } from "@/lib/goodui-motion"
import { useLabels } from "@/lib/goodui-locale"

/*
 * A breathing voice orb for assistants: idle breathes slowly, listening sends rings outward and swells with
 * the microphone level, speaking churns its inner light with the output level, thinking spins a thin arc.
 * Pure CSS loops on gradients; the level is smoothed through a spring.
 */

const CSS = `
.pc-orb{--pc-orb-c:var(--chart-1);--pc-orb-c2:var(--chart-4);position:relative;display:grid;place-items:center;isolation:isolate}
.pc-orb-glow{position:absolute;inset:4%;border-radius:9999px;background:radial-gradient(circle,color-mix(in oklab,var(--pc-orb-c) 55%,transparent) 0%,transparent 70%);filter:blur(calc(var(--pc-orb-s) * .08));pointer-events:none}
.pc-orb-breathe{position:absolute;inset:0;display:grid;place-items:center;animation:pc-orb-breathe 4.2s ease-in-out infinite}
.pc-orb[data-state=speaking] .pc-orb-breathe,.pc-orb[data-state=listening] .pc-orb-breathe{animation:none}
@keyframes pc-orb-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}
.pc-orb-core{position:relative;width:62%;height:62%;border-radius:9999px;overflow:hidden;background:radial-gradient(circle at 32% 28%,color-mix(in oklab,white 72%,var(--pc-orb-c)) 0%,var(--pc-orb-c) 42%,color-mix(in oklab,var(--pc-orb-c2) 75%,black) 100%);box-shadow:inset calc(var(--pc-orb-s) * -.04) calc(var(--pc-orb-s) * -.05) calc(var(--pc-orb-s) * .12) rgb(0 0 0/.28),inset calc(var(--pc-orb-s) * .02) calc(var(--pc-orb-s) * .03) calc(var(--pc-orb-s) * .08) rgb(255 255 255/.35),0 calc(var(--pc-orb-s) * .06) calc(var(--pc-orb-s) * .18) calc(var(--pc-orb-s) * -.06) color-mix(in oklab,var(--pc-orb-c) 70%,transparent)}
.pc-orb-blob{position:absolute;inset:-25%;border-radius:42% 58% 55% 45%/55% 42% 58% 45%;background:conic-gradient(from 0deg,transparent 0%,color-mix(in oklab,var(--pc-orb-c2) 70%,white) 30%,transparent 60%);mix-blend-mode:soft-light;opacity:.9;animation:pc-orb-spin 11s linear infinite}
.pc-orb-blob:nth-child(2){border-radius:58% 42% 45% 55%/42% 55% 45% 58%;background:conic-gradient(from 180deg,transparent 0%,color-mix(in oklab,white 60%,var(--pc-orb-c)) 25%,transparent 55%);animation-duration:15s;animation-direction:reverse}
.pc-orb[data-state=speaking] .pc-orb-blob{animation-duration:2.6s}
.pc-orb[data-state=speaking] .pc-orb-blob:nth-child(2){animation-duration:3.4s}
.pc-orb[data-state=thinking] .pc-orb-blob{animation-duration:5s}
@keyframes pc-orb-spin{to{transform:rotate(360deg)}}
.pc-orb-ring{position:absolute;inset:14%;border-radius:9999px;pointer-events:none}
.pc-orb-arc{background:conic-gradient(from 0deg,transparent 0%,var(--pc-orb-c) 20%,transparent 40%);-webkit-mask:radial-gradient(circle,transparent calc(50% - 3px),#000 calc(50% - 2px));mask:radial-gradient(circle,transparent calc(50% - 3px),#000 calc(50% - 2px));animation:pc-orb-spin 1.3s linear infinite}
.pc-orb-wave{border:2px solid color-mix(in oklab,var(--pc-orb-c) 70%,transparent);animation:pc-orb-wave 1.9s ease-out infinite}
.pc-orb-wave:nth-child(2){animation-delay:.65s}
.pc-orb-wave:nth-child(3){animation-delay:1.3s}
@keyframes pc-orb-wave{from{transform:scale(.86);opacity:.75}to{transform:scale(1.55);opacity:0}}
@media (prefers-reduced-motion:reduce){
  .pc-orb-breathe,.pc-orb-blob,.pc-orb-arc,.pc-orb-wave{animation:none}
  .pc-orb-wave{transform:scale(1.12);opacity:.6}
  .pc-orb-wave:nth-child(n+2){display:none}
  .pc-orb-arc{-webkit-mask:none;mask:none;background:none;border:2px dashed color-mix(in oklab,var(--pc-orb-c) 70%,transparent)}
}
`

export type VoiceOrbState = "idle" | "listening" | "speaking" | "thinking"

export type VoiceOrbLabels = Record<VoiceOrbState, string>
const DEFAULT_LABELS: VoiceOrbLabels = { idle: "Assistant idle", listening: "Listening", speaking: "Speaking", thinking: "Thinking" }

export type VoiceOrbProps = Omit<React.ComponentProps<"div">, "children"> & {
  state?: VoiceOrbState
  /** Audio level 0..1 (microphone while listening, output while speaking). */
  level?: number
  /** Diameter in px, or a preset. */
  size?: number | "sm" | "md" | "lg"
  /** Main color (any CSS color); defaults to --chart-1. */
  color?: string
  /** Second color for the inner light; defaults to --chart-4. */
  accent?: string
  /** Text for screen readers per state; pass translations here. */
  labels?: Partial<VoiceOrbLabels>
}

const SIZES = { sm: 96, md: 160, lg: 240 }

/** Breathing orb that reacts to an audio level, with idle, listening, speaking and thinking states. */
export function VoiceOrb({ state = "idle", level = 0, size = "md", color, accent, labels, className, style, ...props }: VoiceOrbProps) {
  const l = useLabels("voice-orb", DEFAULT_LABELS, labels)
  const reduce = useReducedMotion() ?? false
  const px = typeof size === "number" ? size : SIZES[size]
  const clamped = Math.max(0, Math.min(1, level))
  const spring = useSpring(0, { stiffness: 220, damping: 20, mass: 0.6 })
  React.useEffect(() => {
    if (reduce) spring.jump(clamped)
    else spring.set(clamped)
  }, [clamped, reduce, spring])
  const reactive = state === "listening" || state === "speaking"
  const scale = useTransform(spring, [0, 1], [1, reactive ? 1.22 : 1.06])
  const glowScale = useTransform(spring, [0, 1], [1, 1.5])
  const glowOpacity = useTransform(spring, [0, 1], [state === "idle" ? 0.55 : 0.75, 1])

  return (
    <div
      data-state={state}
      className={cn("pc-orb", className)}
      style={{ width: px, height: px, ["--pc-orb-s" as string]: `${px}px`, ...(color ? { ["--pc-orb-c" as string]: color } : {}), ...(accent ? { ["--pc-orb-c2" as string]: accent } : {}), ...style }}
      {...props}
    >
      <GooduiTokens />
      <style href="pc-voice-orb" precedence="default">
        {CSS}
      </style>
      <div role="img" aria-label={l[state]} className="absolute inset-0 grid place-items-center">
        <motion.span className="pc-orb-glow" style={{ scale: glowScale, opacity: glowOpacity }} />
        {state === "listening" && (
          <>
            <span className="pc-orb-ring pc-orb-wave" />
            <span className="pc-orb-ring pc-orb-wave" />
            <span className="pc-orb-ring pc-orb-wave" />
          </>
        )}
        {state === "thinking" && <span className="pc-orb-ring pc-orb-arc" />}
        <span className="pc-orb-breathe">
          <motion.span className="pc-orb-core" style={{ scale }}>
            <span className="pc-orb-blob" />
            <span className="pc-orb-blob" />
          </motion.span>
        </span>
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {l[state]}
      </span>
    </div>
  )
}
