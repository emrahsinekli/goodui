"use client"

import * as React from "react"
import { ArrowRight, Pause, Play } from "lucide-react"
import { Button } from "@/registry/components/core/button"
import { Marquee } from "@/registry/components/backgrounds/marquee"
import { CounterUp } from "@/registry/components/numbers/counter-up"
import { cn } from "@/lib/utils"

/* ---------- Demo data: made-up businesses with hand-drawn marks, no real brands ---------- */

type Logo = { name: string; mark: React.ReactNode; city: string }

const LOGOS: Logo[] = [
  { name: "Lumen Spa", city: "Austin", mark: <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="2.5" /> },
  { name: "Northside Dental", city: "Chicago", mark: <path d="M12 3 21 20H3Z" fill="currentColor" /> },
  { name: "Pawsome", city: "Denver", mark: <><circle cx="7" cy="8" r="2.5" fill="currentColor" /><circle cx="17" cy="8" r="2.5" fill="currentColor" /><ellipse cx="12" cy="15" rx="5" ry="4" fill="currentColor" /></> },
  { name: "Kinetic Physio", city: "Seattle", mark: <path d="M4 18 10 6l4 8 2-4 4 8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" /> },
  { name: "Bloom Studio", city: "Portland", mark: <path d="M12 21c-5-3-8-7-8-11a8 8 0 0 1 16 0c0 4-3 8-8 11Z" fill="currentColor" /> },
  { name: "Harbor Clinic", city: "Boston", mark: <rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="2.5" /> },
  { name: "Ferro Barbers", city: "Brooklyn", mark: <path d="M6 4h12v4H6zM6 10h12v4H6zM6 16h12v4H6z" fill="currentColor" /> },
  { name: "Atlas Tutors", city: "London", mark: <path d="M12 3 21 8 12 13 3 8Z M6 11v5c3 2 9 2 12 0v-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /> },
  { name: "Pulse Pilates", city: "Sydney", mark: <path d="M3 12h4l2-6 4 12 2-6h6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /> },
  { name: "Reed & Sons", city: "Dublin", mark: <><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" /><circle cx="12" cy="12" r="3" fill="currentColor" /></> },
  { name: "Ironworks Gym", city: "Toronto", mark: <path d="M4 9h3v6H4zM17 9h3v6h-3zM7 11h10v2H7z" fill="currentColor" /> },
  { name: "Studio Bernard", city: "Paris", mark: <path d="M5 19 12 5l7 14H5Zm3.5-3h7L12 9.5 8.5 16Z" fill="currentColor" /> },
]

/* ---------- Pieces ---------- */

function LogoTile({ l, onSelect, active }: { l: Logo; onSelect: () => void; active: boolean }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "flex h-14 shrink-0 items-center gap-2.5 rounded-xl border px-4 text-sm font-semibold tracking-tight whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        active ? "border-foreground bg-foreground text-background" : "bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">{l.mark}</svg>
      {l.name}
    </button>
  )
}

/* ---------- Block ---------- */

export default function LogoCloudMarquee() {
  const [paused, setPaused] = React.useState(false)
  const [selected, setSelected] = React.useState<Logo | null>(null)
  const half = Math.ceil(LOGOS.length / 2)

  return (
    <div className="p-4 md:p-6">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Trusted by <CounterUp value={2400} className="font-semibold text-foreground" format={{ maximumFractionDigits: 0 }} />+ studios, clinics and gyms in 14 countries
          </p>
        </div>
        <div className="relative mt-6">
          <div className={cn(paused && "[&_.pc-marquee-track]:[animation-play-state:paused]")}>
            <Marquee duration={38} gap="0.75rem" pauseOnHover className="py-2">
              {LOGOS.slice(0, half).map((l) => (
                <LogoTile key={l.name} l={l} active={selected?.name === l.name} onSelect={() => setSelected((s) => (s?.name === l.name ? null : l))} />
              ))}
            </Marquee>
            <Marquee duration={46} gap="0.75rem" reverse pauseOnHover className="py-2">
              {LOGOS.slice(half).map((l) => (
                <LogoTile key={l.name} l={l} active={selected?.name === l.name} onSelect={() => setSelected((s) => (s?.name === l.name ? null : l))} />
              ))}
            </Marquee>
          </div>
        </div>
        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div aria-live="polite" className="min-h-6 text-sm text-muted-foreground">
            {selected ? (
              <span>
                <strong className="font-medium text-foreground">{selected.name}</strong> · {selected.city} · booking online since 2024
              </span>
            ) : (
              <span>Hover to pause, tap a logo to see who they are.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" tone="neutral" iconLeft={paused ? <Play /> : <Pause />} aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
              {paused ? "Play" : "Pause"}
            </Button>
            <Button size="sm" variant="link" iconRight={<ArrowRight />} onClick={() => setSelected(LOGOS[0] ?? null)}>
              Read their stories
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
