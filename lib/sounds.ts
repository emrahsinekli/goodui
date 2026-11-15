"use client"

import * as React from "react"

/*
 * goodui sounds: synthesized UI sounds with no audio files.
 *
 * Every sound is a small recipe (two or three sine partials, a short filtered-noise click, an envelope) rendered
 * with the Web Audio API the moment it is played, so there is nothing to download and nothing to host.
 * Pitches sit on a C major pentatonic (C D E G A), attacks are soft and the master bus sits at about -14 dBFS,
 * so the kit stays polite in an office.
 *
 *   play("success")                     play a named sound (does nothing until the user turned sounds on)
 *   useSound()                          { enabled, toggle, setEnabled, play } for a settings switch
 *   <SoundProvider enabled>             app default; the visitor's own choice (localStorage) wins
 *   <button data-sound="tap">           any element gets a sound without code (data-sound-hover for hover)
 *   defineSound("cha-ching", [...])     your own recipe; renderSound() renders one offline for tests
 *
 * Sounds are off by default and only ever start after a user gesture (browsers require it, people prefer it).
 * They are independent from prefers-reduced-motion: motion and sound are separate preferences.
 */

export type SoundName =
  | "tap"
  | "toggle-on"
  | "toggle-off"
  | "success"
  | "error"
  | "warning"
  | "notify"
  | "send"
  | "receive"
  | "delete"
  | "undo"
  | "pop"
  | "whoosh"
  | "slide"
  | "tick"
  | "confirm"
  | "open"
  | "close"
  | "hover"
  | "drag-start"
  | "drop"
  | "count-tick"
  | "celebrate"
  | "unlock"

/** Every built-in sound, in display order. */
export const SOUND_NAMES: readonly SoundName[] = [
  "tap",
  "toggle-on",
  "toggle-off",
  "success",
  "error",
  "warning",
  "notify",
  "send",
  "receive",
  "delete",
  "undo",
  "pop",
  "whoosh",
  "slide",
  "tick",
  "confirm",
  "open",
  "close",
  "hover",
  "drag-start",
  "drop",
  "count-tick",
  "celebrate",
  "unlock",
]

/** One voice of a recipe: an oscillator partial or a filtered noise burst with its own envelope. */
export type Voice = {
  /** Oscillator shape, or "noise" for filtered white noise. Default "sine". */
  wave?: OscillatorType | "noise"
  /** Start pitch in Hz (oscillators). */
  freq?: number
  /** Pitch to glide to, in Hz. */
  to?: number
  /** Seconds the pitch (or noise filter) glide takes. Defaults to `dur`. */
  glide?: number
  /** Start offset from the beginning of the sound, in seconds. */
  at?: number
  /** Length in seconds; the level decays exponentially to silence by then. */
  dur: number
  /** Peak level 0..1 before the master bus. */
  gain?: number
  /** Attack in seconds. Default 0.004; use 0.01–0.02 for a soft chord. */
  attack?: number
  /** Filter cutoff in Hz: a lowpass on oscillators, the bandpass center for noise. */
  filter?: number
  /** Cutoff to sweep to by the end of `glide`. */
  filterTo?: number
  /** Filter resonance. */
  q?: number
  /** Detune in cents. */
  detune?: number
}

export type Recipe = Voice[]

export type PlayOptions = {
  /** 0..1, relative to the master bus. */
  volume?: number
  /** Pitch and speed multiplier: 1.2 is higher and shorter, 0.8 lower and longer. */
  rate?: number
  /** Play even while sounds are off (previews, a settings screen). */
  force?: boolean
}

/** Master bus level, about -14 dBFS. */
export const MASTER_GAIN = 0.2

/* ------------------------------------------------------------------ recipes */

// C major pentatonic across the octaves the sounds use.
const C4 = 261.63
const E4 = 329.63
const G4 = 392
const A4 = 440
const C5 = 523.25
const D5 = 587.33
const E5 = 659.25
const G5 = 783.99
const A5 = 880
const C6 = 1046.5
const E6 = 1318.51
const A6 = 1760

/**
 * A pitched note with its octave partial: the building block of most recipes.
 * `shine` is the level of the octave relative to the fundamental (0 for a pure sine).
 */
export function tone(
  freq: number,
  dur: number,
  o: { at?: number; gain?: number; to?: number; glide?: number; wave?: OscillatorType; attack?: number; shine?: number } = {},
): Voice[] {
  const { at = 0, gain = 0.5, to, glide, wave = "sine", attack, shine = 0.22 } = o
  const voices: Voice[] = [{ wave, freq, to, glide, at, dur, gain, attack }]
  if (shine > 0) voices.push({ wave: "sine", freq: freq * 2, to: to ? to * 2 : undefined, glide, at, dur: dur * 0.7, gain: gain * shine, attack })
  return voices
}

/** A short burst of filtered noise: clicks, thuds and whooshes. */
export function noise(dur: number, o: { at?: number; gain?: number; filter?: number; filterTo?: number; q?: number; attack?: number } = {}): Voice {
  const { at = 0, gain = 0.2, filter = 2400, filterTo, q = 1, attack = 0.001 } = o
  return { wave: "noise", at, dur, gain, filter, filterTo, q, attack }
}

export const RECIPES: Record<SoundName, Recipe> = {
  tap: [...tone(C6, 0.06, { gain: 0.42, to: A5, glide: 0.05, shine: 0.15 }), noise(0.012, { gain: 0.1, filter: 4000 })],
  "toggle-on": [...tone(E5, 0.09, { gain: 0.38 }), ...tone(A5, 0.14, { at: 0.055, gain: 0.42 })],
  "toggle-off": [...tone(A5, 0.09, { gain: 0.38 }), ...tone(E5, 0.14, { at: 0.055, gain: 0.38 })],
  success: [...tone(C5, 0.16, { gain: 0.34 }), ...tone(E5, 0.16, { at: 0.07, gain: 0.36 }), ...tone(G5, 0.2, { at: 0.14, gain: 0.4 })],
  error: [...tone(E4, 0.14, { gain: 0.4, wave: "triangle", shine: 0.1 }), ...tone(C4, 0.2, { at: 0.12, gain: 0.42, wave: "triangle", shine: 0.1 })],
  warning: [...tone(G5, 0.08, { gain: 0.38, wave: "triangle", shine: 0.12 }), ...tone(G5, 0.12, { at: 0.13, gain: 0.38, wave: "triangle", shine: 0.12 })],
  notify: [...tone(G5, 0.16, { gain: 0.36 }), ...tone(C6, 0.2, { at: 0.11, gain: 0.38 })],
  send: [...tone(A4, 0.16, { gain: 0.34, to: A5, shine: 0.2 }), noise(0.14, { gain: 0.1, filter: 900, filterTo: 2600, attack: 0.02 })],
  receive: [...tone(C6, 0.14, { gain: 0.32, to: G5, shine: 0.2 }), noise(0.018, { gain: 0.08, filter: 2500 })],
  delete: [...tone(220, 0.14, { gain: 0.45, to: 110, shine: 0.1 }), noise(0.05, { gain: 0.12, filter: 500, q: 0.7 })],
  undo: [...tone(220, 0.12, { gain: 0.36, to: 440, shine: 0.15 }), ...tone(E5, 0.1, { at: 0.1, gain: 0.28 })],
  pop: [...tone(300, 0.07, { gain: 0.5, to: 1000, glide: 0.03, shine: 0.1, attack: 0.002 })],
  whoosh: [noise(0.22, { gain: 0.24, filter: 300, filterTo: 2400, q: 0.9, attack: 0.06 })],
  slide: [noise(0.16, { gain: 0.14, filter: 1800, filterTo: 500, q: 0.8, attack: 0.02 }), ...tone(G4, 0.12, { gain: 0.14, to: D5, shine: 0 })],
  tick: [...tone(A6, 0.022, { gain: 0.3, shine: 0, attack: 0.001 }), noise(0.01, { gain: 0.1, filter: 5000 })],
  confirm: [
    ...tone(C5, 0.26, { gain: 0.26, attack: 0.012, shine: 0.15 }),
    ...tone(E5, 0.26, { gain: 0.22, attack: 0.012, shine: 0.15 }),
    ...tone(G5, 0.3, { gain: 0.24, attack: 0.012, shine: 0.15 }),
  ],
  open: [...tone(G4, 0.08, { gain: 0.3, shine: 0.15 }), ...tone(D5, 0.14, { at: 0.06, gain: 0.34, shine: 0.15 }), noise(0.12, { gain: 0.07, filter: 600, filterTo: 2000, q: 0.8, attack: 0.03 })],
  close: [...tone(D5, 0.08, { gain: 0.3, shine: 0.15 }), ...tone(G4, 0.14, { at: 0.06, gain: 0.32, shine: 0.15 }), noise(0.12, { gain: 0.07, filter: 2000, filterTo: 500, q: 0.8, attack: 0.03 })],
  hover: [...tone(1500, 0.012, { gain: 0.07, shine: 0, attack: 0.001 })],
  "drag-start": [...tone(200, 0.09, { gain: 0.4, to: 420, shine: 0.1 }), noise(0.015, { gain: 0.07, filter: 2000 })],
  drop: [...tone(320, 0.11, { gain: 0.42, to: 130, shine: 0.1 }), noise(0.035, { gain: 0.12, filter: 700, q: 0.7 })],
  "count-tick": [...tone(E6, 0.014, { gain: 0.28, shine: 0, attack: 0.001 })],
  celebrate: [
    ...tone(C5, 0.14, { gain: 0.3, shine: 0.3 }),
    ...tone(E5, 0.14, { at: 0.05, gain: 0.32, shine: 0.3 }),
    ...tone(G5, 0.14, { at: 0.1, gain: 0.34, shine: 0.3 }),
    ...tone(A5, 0.14, { at: 0.15, gain: 0.36, shine: 0.3 }),
    ...tone(C6, 0.15, { at: 0.2, gain: 0.4, shine: 0.3 }),
  ],
  unlock: [noise(0.015, { gain: 0.18, filter: 2500 }), noise(0.015, { at: 0.06, gain: 0.18, filter: 3200 }), ...tone(E5, 0.2, { at: 0.11, gain: 0.3, attack: 0.008 }), ...tone(A5, 0.22, { at: 0.11, gain: 0.3, attack: 0.008 })],
}

const custom = new Map<string, Recipe>()

/** Add or replace a sound. Custom names play with `play(name)` and `data-sound={name}`. */
export function defineSound(name: string, recipe: Recipe) {
  custom.set(name, recipe)
}

export function recipeOf(name: string): Recipe | undefined {
  return custom.get(name) ?? RECIPES[name as SoundName]
}

/** Length of a recipe in seconds at the given rate. */
export function durationOf(recipe: Recipe, rate = 1) {
  return recipe.reduce((m, v) => Math.max(m, (v.at ?? 0) + v.dur), 0) / rate
}

/* ------------------------------------------------------------------- engine */

const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>()

// Half a second of white noise from a fixed-seed LCG, so renders are reproducible.
function noiseBuffer(ctx: BaseAudioContext) {
  const cached = noiseCache.get(ctx)
  if (cached) return cached
  const len = Math.floor(ctx.sampleRate * 0.5)
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let s = 0x2f6e2b1
  for (let i = 0; i < len; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    data[i] = (s / 0xffffffff) * 2 - 1
  }
  noiseCache.set(ctx, buffer)
  return buffer
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** Builds the audio graph of a recipe into `out` starting at `at` (context time). Used by play() and renderSound(). */
export function schedule(ctx: BaseAudioContext, out: AudioNode, recipe: Recipe, at: number, o: PlayOptions = {}) {
  const rate = clamp(o.rate ?? 1, 0.25, 4)
  const vol = clamp(o.volume ?? 1, 0, 1)
  for (const v of recipe) {
    const t0 = at + (v.at ?? 0) / rate
    const dur = Math.max(0.005, v.dur / rate)
    const attack = Math.min(dur * 0.5, Math.max(0.0015, (v.attack ?? 0.004) / rate))
    const glide = Math.max(0.002, (v.glide ?? v.dur) / rate)
    const peak = Math.max(0.0001, (v.gain ?? 0.5) * vol)

    const env = ctx.createGain()
    env.gain.setValueAtTime(0, t0)
    env.gain.linearRampToValueAtTime(peak, t0 + attack)
    env.gain.exponentialRampToValueAtTime(0.0004, t0 + dur)
    env.gain.setValueAtTime(0, t0 + dur + 0.001)

    let source: AudioScheduledSourceNode
    let head: AudioNode
    if (v.wave === "noise") {
      const src = ctx.createBufferSource()
      src.buffer = noiseBuffer(ctx)
      src.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = "bandpass"
      filter.Q.value = v.q ?? 1
      filter.frequency.setValueAtTime(v.filter ?? 2400, t0)
      if (v.filterTo) filter.frequency.exponentialRampToValueAtTime(v.filterTo, t0 + glide)
      src.connect(filter)
      source = src
      head = filter
    } else {
      const osc = ctx.createOscillator()
      osc.type = v.wave ?? "sine"
      osc.frequency.setValueAtTime((v.freq ?? A4) * rate, t0)
      if (v.to) osc.frequency.exponentialRampToValueAtTime(v.to * rate, t0 + glide)
      if (v.detune) osc.detune.value = v.detune
      source = osc
      head = osc
      if (v.filter) {
        const filter = ctx.createBiquadFilter()
        filter.type = "lowpass"
        filter.frequency.value = v.filter
        filter.Q.value = v.q ?? 0.7
        osc.connect(filter)
        head = filter
      }
    }
    head.connect(env)
    env.connect(out)
    source.start(t0)
    source.stop(t0 + dur + 0.02)
    source.onended = () => {
      head.disconnect()
      env.disconnect()
    }
  }
}

/**
 * Renders a sound offline and returns the buffer: draw a waveform, or assert in tests that a recipe is neither
 * silent nor clipping. Includes the master bus, so levels match what play() produces at volume 1.
 */
export async function renderSound(name: string, o: PlayOptions = {}, sampleRate = 44100): Promise<AudioBuffer> {
  const recipe = recipeOf(name)
  if (!recipe) throw new Error(`Unknown sound "${name}"`)
  const length = durationOf(recipe, clamp(o.rate ?? 1, 0.25, 4)) + 0.05
  const ctx = new OfflineAudioContext(1, Math.ceil(length * sampleRate), sampleRate)
  const master = ctx.createGain()
  master.gain.value = MASTER_GAIN
  master.connect(ctx.destination)
  schedule(ctx, master, recipe, 0, o)
  return ctx.startRendering()
}

/* -------------------------------------------------------------------- state */

const STORAGE_KEY = "goodui-sound"

let enabled = false
let loaded = false
let persist = true
let appDefault = false
let masterVolume = 1
let gestured = false
let listening = false
let ctx: AudioContext | null = null
let master: GainNode | null = null
const listeners = new Set<() => void>()
const lastPlayed = new Map<string, number>()

function emit() {
  for (const l of listeners) l()
}

function stored(): boolean | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === "1" ? true : v === "0" ? false : null
  } catch {
    return null
  }
}

// Reads the visitor's saved choice once, outside render (never during hydration).
function load() {
  if (loaded || typeof window === "undefined") return
  loaded = true
  const choice = persist ? stored() : null
  const next = choice ?? appDefault
  if (next !== enabled) {
    enabled = next
    emit()
  }
}

function hadGesture() {
  if (gestured) return true
  const nav = typeof navigator === "undefined" ? undefined : (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation
  return nav?.hasBeenActive === true
}

function context(): AudioContext | null {
  if (ctx) return ctx
  if (typeof window === "undefined") return null
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  ctx = new AC({ latencyHint: "interactive" })
  master = ctx.createGain()
  master.gain.value = MASTER_GAIN * masterVolume
  master.connect(ctx.destination)
  return ctx
}

// Creating or resuming the context inside the gesture keeps Safari happy; later plays can then happen any time.
function warm() {
  const c = context()
  if (c && c.state === "suspended") c.resume().catch(() => {})
}

function listen() {
  if (listening || typeof document === "undefined") return
  listening = true
  const onGesture = () => {
    gestured = true
    if (enabled) warm()
  }
  for (const type of ["pointerdown", "keydown", "touchend"]) document.addEventListener(type, onGesture, { capture: true, passive: true })
}

/** Whether the visitor has sounds on. */
export function isSoundEnabled() {
  return enabled
}

/** Turn sounds on or off for this visitor (saved in localStorage unless the provider has persist={false}). */
export function setSoundEnabled(on: boolean) {
  load()
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, on ? "1" : "0")
    } catch {}
  }
  if (on === enabled) return
  enabled = on
  if (on && hadGesture()) warm()
  emit()
}

export function subscribeSound(listener: () => void) {
  listeners.add(listener)
  listen()
  load()
  return () => {
    listeners.delete(listener)
  }
}

/** Master volume 0..1 on top of the -14 dBFS bus. */
export function setSoundVolume(volume: number) {
  masterVolume = clamp(volume, 0, 1)
  if (master) master.gain.value = MASTER_GAIN * masterVolume
}

/**
 * Plays a sound. Returns false when it did not play: sounds are off, the page has not seen a user gesture yet,
 * the name is unknown or the browser has no Web Audio. The same sound is skipped within 25 ms, so a stepper
 * held down or a counter never stacks clicks.
 */
export function play(name: SoundName | (string & {}), o: PlayOptions = {}): boolean {
  listen()
  load()
  if (!enabled && !o.force) return false
  const recipe = recipeOf(name)
  if (!recipe || !hadGesture()) return false
  const c = context()
  if (!c || !master) return false
  const now = performance.now()
  if (now - (lastPlayed.get(name) ?? -1000) < 25) return false
  lastPlayed.set(name, now)
  if (c.state === "suspended") c.resume().catch(() => {})
  schedule(c, master, recipe, c.currentTime + 0.003, o)
  return true
}

/* -------------------------------------------------------------------- react */

/** Sound state for a settings switch or a header toggle. Safe during SSR (reports off). */
export function useSound() {
  const on = React.useSyncExternalStore(subscribeSound, isSoundEnabled, () => false)
  return React.useMemo(
    () => ({
      enabled: on,
      play,
      setEnabled: setSoundEnabled,
      toggle: () => setSoundEnabled(!isSoundEnabled()),
    }),
    [on],
  )
}

export type SoundProviderProps = {
  children?: React.ReactNode
  /** Sounds on for visitors who have not chosen yet. Default false: people opt in. */
  enabled?: boolean
  /** Remember the visitor's choice in localStorage and let it win over `enabled`. Default true. */
  persist?: boolean
  /** Master volume 0..1. */
  volume?: number
  /** Listen for data-sound (click) and data-sound-hover (pointer enters) attributes anywhere on the page. Default true. */
  attributes?: boolean
}

function installAttributes() {
  const onClick = (e: Event) => {
    const target = e.target as Element | null
    const el = target?.closest?.("[data-sound]")
    if (!el || (el as HTMLButtonElement).disabled) return
    const raw = el.getAttribute("data-sound") || "tap"
    if (raw === "toggle") {
      // Read the state after the click: React has committed it by the time the event reaches the document.
      const input = el instanceof HTMLInputElement ? el : el.querySelector("input")
      const checked = input ? input.checked : el.getAttribute("aria-checked") === "true" || el.getAttribute("aria-pressed") === "true"
      play(checked ? "toggle-on" : "toggle-off")
    } else play(raw)
  }
  const onOver = (e: Event) => {
    const pe = e as PointerEvent
    const target = pe.target as Element | null
    const el = target?.closest?.("[data-sound-hover]")
    if (!el) return
    const from = pe.relatedTarget as Node | null
    if (from && el.contains(from)) return
    play(el.getAttribute("data-sound-hover") || "hover")
  }
  document.addEventListener("click", onClick)
  document.addEventListener("pointerover", onOver)
  return () => {
    document.removeEventListener("click", onClick)
    document.removeEventListener("pointerover", onOver)
  }
}

/**
 * Mount once near the root. Sets the app default, the master volume and the data-sound attribute listener.
 * Components with a `sound` prop and play() work without it; the provider only adds defaults and attributes.
 */
export function SoundProvider({ children, enabled: enabledProp = false, persist: persistProp = true, volume = 1, attributes = true }: SoundProviderProps) {
  React.useEffect(() => {
    appDefault = enabledProp
    persist = persistProp
    setSoundVolume(volume)
    listen()
    const choice = persist ? stored() : null
    loaded = true
    const next = choice ?? enabledProp
    if (next !== enabled) {
      enabled = next
      emit()
    }
  }, [enabledProp, persistProp, volume])

  React.useEffect(() => (attributes ? installAttributes() : undefined), [attributes])

  return React.createElement(React.Fragment, null, children)
}
