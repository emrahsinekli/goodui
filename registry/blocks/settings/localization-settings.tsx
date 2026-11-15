"use client"

import * as React from "react"
import { ArrowLeftRight, CalendarDays, Check, Languages, MoreHorizontal, Plus, Sparkles, Star, Trash2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Badge } from "@/registry/components/core/badge"
import { Button } from "@/registry/components/core/button"
import { Dialog } from "@/registry/components/core/dialog"
import { DropdownMenu } from "@/registry/components/core/dropdown-menu"
import { Select } from "@/registry/components/core/select"
import { Switch } from "@/registry/components/core/switch"
import { cn } from "@/lib/utils"

/* ---------- Demo data ---------- */

type Lang = { code: string; name: string; native: string; completion: number; published: boolean; updated: string; rtl?: boolean; translating?: boolean }

const LANGS: Lang[] = [
  { code: "en", name: "English", native: "English", completion: 100, published: true, updated: "Source" },
  { code: "de", name: "German", native: "Deutsch", completion: 100, published: true, updated: "2 days ago" },
  { code: "fr", name: "French", native: "Français", completion: 92, published: true, updated: "1 week ago" },
  { code: "es", name: "Spanish", native: "Español", completion: 64, published: false, updated: "3 weeks ago" },
  { code: "ar", name: "Arabic", native: "العربية", completion: 38, published: false, updated: "Yesterday", rtl: true },
]

const CATALOG = [
  { value: "it", label: "Italian", description: "Italiano" },
  { value: "pt", label: "Portuguese", description: "Português" },
  { value: "nl", label: "Dutch", description: "Nederlands" },
  { value: "tr", label: "Turkish", description: "Türkçe" },
  { value: "pl", label: "Polish", description: "Polski" },
  { value: "he", label: "Hebrew", description: "עברית", keywords: ["rtl"] },
  { value: "ja", label: "Japanese", description: "日本語" },
  { value: "ko", label: "Korean", description: "한국어" },
  { value: "sv", label: "Swedish", description: "Svenska" },
]
const RTL_CODES = new Set(["ar", "he", "fa", "ur"])

const STRINGS: Record<string, { title: string; cta: string; with: string; at: string }> = {
  en: { title: "Book your next visit", cta: "Choose a time", with: "with Mira", at: "Thu 14 Mar · 10:30" },
  de: { title: "Nächsten Termin buchen", cta: "Zeit wählen", with: "bei Mira", at: "Do. 14. März · 10:30" },
  fr: { title: "Réservez votre prochaine visite", cta: "Choisir un créneau", with: "avec Mira", at: "jeu. 14 mars · 10:30" },
  es: { title: "Reserva tu próxima visita", cta: "Elegir hora", with: "con Mira", at: "jue. 14 mar · 10:30" },
  ar: { title: "احجز زيارتك القادمة", cta: "اختر وقتًا", with: "مع ميرا", at: "الخميس ١٤ مارس · ١٠:٣٠" },
}

/* ---------- Pieces ---------- */

function LangDot({ code, rtl }: { code: string; rtl?: boolean }) {
  const hue = (code.charCodeAt(0) * 37 + (code.charCodeAt(1) ?? 0) * 11) % 360
  return (
    <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white uppercase" style={{ background: `oklch(0.48 0.15 ${hue})` }} aria-hidden="true">
      {code}
      {rtl && <span className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full border-2 border-card bg-foreground text-[8px] text-background">R</span>}
    </span>
  )
}

function CompletionBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-28 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label="Translation completion">
        <div className={cn("h-full rounded-full transition-all duration-500", value === 100 ? "bg-emerald-500" : value >= 70 ? "bg-sky-500" : "bg-amber-500")} style={{ width: `${value}%` }} />
      </div>
      <span className="w-9 text-xs tabular-nums text-muted-foreground">{value}%</span>
    </div>
  )
}

/* ---------- Block ---------- */

export default function LocalizationSettings() {
  const [langs, setLangs] = React.useState(LANGS)
  const [defaultCode, setDefaultCode] = React.useState("en")
  const [preview, setPreview] = React.useState("en")
  const [forceRtl, setForceRtl] = React.useState(false)
  const [addOpen, setAddOpen] = React.useState(false)
  const [addCode, setAddCode] = React.useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = React.useState<Lang | null>(null)
  const [toast, setToast] = React.useState<string | null>(null)

  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 2400)
  }

  const current = langs.find((l) => l.code === preview) ?? langs[0]
  const rtl = forceRtl || !!current?.rtl
  const strings = STRINGS[preview] ?? STRINGS.en!
  const available = CATALOG.filter((c) => !langs.some((l) => l.code === c.value))

  const autoTranslate = (code: string) => {
    setLangs((list) => list.map((l) => (l.code === code ? { ...l, translating: true } : l)))
    let step = 0
    const tick = () => {
      step++
      setLangs((list) =>
        list.map((l) => {
          if (l.code !== code) return l
          const next = Math.min(100, l.completion + 12)
          const done = next >= 100 || step > 8
          return { ...l, completion: done ? 100 : next, translating: !done, updated: done ? "Just now" : l.updated }
        }),
      )
      if (step <= 8) setTimeout(tick, 260)
    }
    setTimeout(tick, 260)
  }

  const addLanguage = () => {
    const c = available.find((x) => x.value === addCode)
    if (!c) throw new Error("Pick a language first")
    setLangs((list) => [...list, { code: c.value, name: c.label, native: c.description ?? c.label, completion: 0, published: false, updated: "Just now", rtl: RTL_CODES.has(c.value) }])
    setAddCode(null)
    flash(`${c.label} added. Run auto-translate to get a first draft.`)
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-semibold tracking-tight">Languages</h2>
            <p className="text-sm text-muted-foreground">Your booking page, emails and reminders in each client's language.</p>
          </div>
          <Button iconLeft={<Plus />} onClick={() => setAddOpen(true)} disabled={available.length === 0}>
            Add language
          </Button>
        </div>

        {toast && (
          <p role="status" className="mt-4 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {toast}
          </p>
        )}

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
          {/* Table */}
          <div className="min-w-0 overflow-hidden rounded-2xl border bg-card shadow-sm">
            <ul className="divide-y" aria-label="Languages">
              {langs.map((l) => {
                const isDefault = l.code === defaultCode
                return (
                  <li key={l.code} className={cn("grid items-center gap-3 px-4 py-3 sm:grid-cols-[auto_1fr_auto_auto] sm:gap-4", preview === l.code && "bg-muted/30")}>
                    <div className="flex items-center gap-3 sm:contents">
                      <LangDot code={l.code} rtl={l.rtl} />
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                          <span className="truncate">{l.name}</span>
                          <span className="font-normal text-muted-foreground" lang={l.code}>
                            {l.native}
                          </span>
                          {isDefault && (
                            <Badge tone="primary" size="xs" icon={<Star className="size-3" />}>
                              Default
                            </Badge>
                          )}
                          {l.published ? (
                            <Badge tone="success" variant="dot" size="xs">
                              Published
                            </Badge>
                          ) : (
                            <Badge tone="neutral" variant="dot" size="xs">
                              Draft
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {l.rtl ? "Right to left · " : ""}Updated {l.updated}
                        </p>
                      </div>
                    </div>
                    <CompletionBar value={l.completion} />
                    <div className="flex items-center justify-end gap-1 sm:w-[236px]">
                      <Button size="xs" variant={preview === l.code ? "soft" : "ghost"} tone="neutral" onClick={() => setPreview(l.code)} aria-pressed={preview === l.code}>
                        Preview
                      </Button>
                      {l.completion < 100 ? (
                        <Button size="xs" variant="soft" tone="primary" iconLeft={<Sparkles />} loading={l.translating} onClick={() => autoTranslate(l.code)} className="w-[118px]">
                          Auto-translate
                        </Button>
                      ) : !l.published ? (
                        <Button size="xs" variant="soft" tone="success" iconLeft={<Check />} className="w-[118px]" onClick={() => { setLangs((list) => list.map((x) => (x.code === l.code ? { ...x, published: true } : x))); flash(`${l.name} is now live on your booking page`) }}>
                          Publish
                        </Button>
                      ) : (
                        <span className="inline-flex w-[118px] items-center justify-center gap-1 text-xs text-emerald-700 dark:text-emerald-300">
                          <Check className="size-3.5" /> Complete
                        </span>
                      )}
                      <DropdownMenu
                        trigger={
                          <Button size="xs" variant="ghost" tone="neutral" iconOnly aria-label={`More actions for ${l.name}`}>
                            <MoreHorizontal />
                          </Button>
                        }
                        align="end"
                        items={[
                          { label: "Make default", icon: <Star className="size-4" />, disabled: isDefault || !l.published, onSelect: () => { setDefaultCode(l.code); flash(`${l.name} is the default language`) } },
                          { label: l.published ? "Unpublish" : "Publish", icon: <Check className="size-4" />, disabled: isDefault || l.completion < 100, onSelect: () => setLangs((list) => list.map((x) => (x.code === l.code ? { ...x, published: !x.published } : x))) },
                          { type: "separator" },
                          { label: "Remove language", icon: <Trash2 className="size-4" />, destructive: true, disabled: isDefault, onSelect: () => setRemoveTarget(l) },
                        ]}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="flex flex-wrap items-center gap-3 border-t bg-muted/30 px-4 py-3 text-sm">
              <Languages className="size-4 text-muted-foreground" />
              <Label htmlFor="ls-fallback" className="text-muted-foreground">
                When a string is missing, show it in
              </Label>
              <Select id="ls-fallback" size="sm" options={langs.filter((l) => l.completion === 100).map((l) => ({ value: l.code, label: l.name }))} value={defaultCode} onValueChange={(v) => v && setDefaultCode(v)} className="w-40" />
            </div>
          </div>

          {/* Preview */}
          <div className="grid content-start gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Booking page preview</p>
              <Badge tone="neutral" variant="outline" size="xs">
                {current?.name} · {rtl ? "RTL" : "LTR"}
              </Badge>
            </div>
            <div dir={rtl ? "rtl" : "ltr"} lang={preview} className="rounded-2xl border bg-card p-4 shadow-sm transition-all">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--chart-1)] to-[var(--chart-4)] font-heading text-sm font-bold text-white">N</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">Nova Salon</p>
                  <p className="truncate text-xs text-muted-foreground">{strings.with}</p>
                </div>
                <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              </div>
              <h4 className="mt-4 font-heading text-lg font-semibold">{strings.title}</h4>
              <div className="mt-3 flex items-center gap-2 rounded-xl border bg-muted/40 p-3 text-sm">
                <CalendarDays className="size-4 text-muted-foreground" />
                <span className="flex-1">{strings.at}</span>
                <span className="text-xs text-muted-foreground">45 min</span>
              </div>
              <Button fullWidth className="mt-3" iconRight={<ArrowLeftRight className={cn(rtl && "rotate-180")} />}>
                {strings.cta}
              </Button>
              {(current?.completion ?? 100) < 100 && <p className="mt-2 text-center text-[11px] text-muted-foreground">{100 - (current?.completion ?? 100)}% of strings fall back to {langs.find((l) => l.code === defaultCode)?.name}</p>}
            </div>
            <Switch label="Force right-to-left" description="Check how layouts mirror before adding Arabic or Hebrew." labelPosition="left" size="sm" checked={forceRtl} onCheckedChange={setForceRtl} className="rounded-xl border p-3" />
          </div>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen} title="Add a language" description="We create a draft from your English source. Publish once a native speaker has reviewed it." icon={<Languages />} confirmText="Add language" onConfirm={addLanguage}>
        <div className="grid gap-1.5">
          <Label htmlFor="ls-add">Language</Label>
          <Select id="ls-add" options={available} value={addCode} onValueChange={setAddCode} placeholder="Search languages" searchable searchPlaceholder="Type to search" className="w-full" />
        </div>
      </Dialog>

      <Dialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)} role="alertdialog" tone="danger" icon={<Trash2 />} title={`Remove ${removeTarget?.name ?? ""}?`} description="Clients using it see the default language instead. Translations are deleted after 30 days." confirmText="Remove" onConfirm={() => { setLangs((list) => list.filter((x) => x.code !== removeTarget?.code)); if (preview === removeTarget?.code) setPreview(defaultCode) }} />
    </div>
  )
}
