"use client"

import * as React from "react"

/*
 * goodui locale: set the language once and every goodui component speaks it.
 *
 *   <GooduiLocaleProvider lang="tr" labels={tr}>…</GooduiLocaleProvider>
 *       lang    BCP 47 tag used for every Intl format inside the kit ("tr", "de-AT", "pt-BR"…)
 *       labels  a language pack (lib/goodui-locales/<lang>.ts) or your own { [componentId]: { [key]: … } }
 *       dir     "ltr" | "rtl"; derived from lang when omitted (ar, he, fa, ur are rtl)
 *
 *   useGooduiLocale()                      { lang, dir, labels, provided, formatNumber, formatDate, formatRelative, formatCurrency }
 *   useLabels(id, DEFAULT_LABELS, labels)  what components call: defaults ← pack[id] ← the instance's `labels` prop
 *
 * Without a provider everything is English and "en-US" formats, exactly as before, and the context read costs
 * nothing measurable. The provider never touches <html dir> or <html lang>: set them yourself
 * (`<html lang="ar" dir="rtl">`), because components read the writing direction from the DOM. SSR-safe: no effects.
 */

export type GooduiDir = "ltr" | "rtl"

/** One label: a string, or a function of the component's values that returns text (or a node, e.g. pagination.pageOf). */
export type LabelValue = string | ((...args: never[]) => React.ReactNode)

/** A language pack: component id → its labels. Partial on both levels, so a pack can cover only what an app uses. */
export type LabelPack = { readonly [componentId: string]: { readonly [key: string]: LabelValue } | undefined }

/** Languages goodui ships a pack for, with their native names, for a language switcher. */
export const GOODUI_LANGUAGES: readonly { code: string; name: string; dir: GooduiDir }[] = [
  { code: "en", name: "English", dir: "ltr" },
  { code: "tr", name: "Türkçe", dir: "ltr" },
  { code: "de", name: "Deutsch", dir: "ltr" },
  { code: "fr", name: "Français", dir: "ltr" },
  { code: "es", name: "Español", dir: "ltr" },
  { code: "it", name: "Italiano", dir: "ltr" },
  { code: "pt-BR", name: "Português (Brasil)", dir: "ltr" },
  { code: "nl", name: "Nederlands", dir: "ltr" },
  { code: "pl", name: "Polski", dir: "ltr" },
  { code: "ru", name: "Русский", dir: "ltr" },
  { code: "hi", name: "हिन्दी", dir: "ltr" },
  { code: "id", name: "Bahasa Indonesia", dir: "ltr" },
  { code: "vi", name: "Tiếng Việt", dir: "ltr" },
  { code: "th", name: "ไทย", dir: "ltr" },
  { code: "ja", name: "日本語", dir: "ltr" },
  { code: "ko", name: "한국어", dir: "ltr" },
  { code: "zh-CN", name: "中文（简体）", dir: "ltr" },
  { code: "ar", name: "العربية", dir: "rtl" },
  { code: "he", name: "עברית", dir: "rtl" },
]

const RTL = new Set(["ar", "he", "fa", "ur", "iw", "ps", "sd", "ug", "yi", "dv", "ckb"])

/** Writing direction of a language tag: rtl for Arabic, Hebrew, Persian, Urdu (and the other RTL scripts), else ltr. */
export function dirOf(lang: string): GooduiDir {
  const base = lang.split(/[-_]/)[0]?.toLowerCase() ?? ""
  return RTL.has(base) ? "rtl" : "ltr"
}

type Ctx = { lang: string; dir: GooduiDir; labels: LabelPack; provided: boolean }

const DEFAULT_CTX: Ctx = { lang: "en-US", dir: "ltr", labels: {}, provided: false }
const LocaleContext = React.createContext<Ctx>(DEFAULT_CTX)

export type GooduiLocaleProviderProps = {
  /** BCP 47 language tag: "tr", "de", "pt-BR", "ar"… Drives every Intl format in the kit. */
  lang: string
  /** A language pack from lib/goodui-locales, or your own labels keyed by component id. */
  labels?: LabelPack
  /** Writing direction. Derived from `lang` when omitted. Set <html dir> yourself as well; the provider only tells components. */
  dir?: GooduiDir
  children?: React.ReactNode
}

export function GooduiLocaleProvider({ lang, labels, dir, children }: GooduiLocaleProviderProps) {
  const value = React.useMemo<Ctx>(() => ({ lang, dir: dir ?? dirOf(lang), labels: labels ?? {}, provided: true }), [lang, dir, labels])
  return React.createElement(LocaleContext.Provider, { value }, children)
}

export type RelativeUnit = Intl.RelativeTimeFormatUnit

export type GooduiLocale = {
  /** The provider's language, or "en-US" without one. */
  lang: string
  dir: GooduiDir
  /** The provider's pack ({} without one). */
  labels: LabelPack
  /** true when a GooduiLocaleProvider is mounted above. */
  provided: boolean
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string
  /** Date, timestamp or ISO string. Default style: medium date ("3 Nov 2026"). */
  formatDate: (value: Date | number | string, options?: Intl.DateTimeFormatOptions) => string
  /** "in 3 days", "2 hours ago", "yesterday" (numeric "auto" by default). */
  formatRelative: (value: number, unit: RelativeUnit, options?: Intl.RelativeTimeFormatOptions) => string
  /** ISO 4217 code; defaults to USD. */
  formatCurrency: (value: number, currency?: string, options?: Intl.NumberFormatOptions) => string
}

// Intl constructors are slow; keep one instance per lang + options.
const cache = new Map<string, unknown>()
function cached<T>(kind: string, lang: string, options: object | undefined, make: () => T): T {
  const key = `${kind}|${lang}|${options ? JSON.stringify(options) : ""}`
  let f = cache.get(key) as T | undefined
  if (!f) {
    if (cache.size > 200) cache.clear()
    f = make()
    cache.set(key, f)
  }
  return f
}

function safe<T>(make: (lang: string) => T, lang: string): T {
  try {
    return make(lang)
  } catch {
    return make("en-US")
  }
}

/** Formatters for a language; what useGooduiLocale() returns, for use outside React (loaders, server code). */
export function createFormatters(lang: string): Pick<GooduiLocale, "formatNumber" | "formatDate" | "formatRelative" | "formatCurrency"> {
  return {
    formatNumber: (value, options) => cached("n", lang, options, () => safe((l) => new Intl.NumberFormat(l, options), lang)).format(value),
    formatDate: (value, options = { dateStyle: "medium" }) => {
      const d = value instanceof Date ? value : new Date(value)
      return Number.isNaN(d.getTime()) ? "" : cached("d", lang, options, () => safe((l) => new Intl.DateTimeFormat(l, options), lang)).format(d)
    },
    formatRelative: (value, unit, options = { numeric: "auto" }) => cached("r", lang, options, () => safe((l) => new Intl.RelativeTimeFormat(l, options), lang)).format(value, unit),
    formatCurrency: (value, currency = "USD", options) => {
      const o = { style: "currency", currency, ...options } as Intl.NumberFormatOptions
      return cached("c", lang, o, () => safe((l) => new Intl.NumberFormat(l, o), lang)).format(value)
    },
  }
}

/** The current language, direction, pack and Intl formatters. English + "en-US" without a provider. */
export function useGooduiLocale(): GooduiLocale {
  const ctx = React.useContext(LocaleContext)
  return React.useMemo(() => ({ ...ctx, ...createFormatters(ctx.lang) }), [ctx])
}

/**
 * Resolves a component's labels: its English defaults, then the provider pack's entry for `componentId`, then the
 * instance's own `labels` prop. Undefined overrides are skipped so `labels={{ close: cond ? "X" : undefined }}` is safe.
 */
export function useLabels<T extends object>(componentId: string, defaults: T, overrides?: Partial<T>): T {
  const pack = React.useContext(LocaleContext).labels[componentId]
  if (!pack && !overrides) return defaults
  const out: Record<string, unknown> = { ...defaults, ...pack }
  if (overrides) for (const k in overrides) if (overrides[k] !== undefined) out[k] = overrides[k]
  return out as T
}

/**
 * Plural helper for packs: `plural(lang, n, { one: "1 satır", other: `${n} satır` })`.
 * Categories follow Intl.PluralRules (zero, one, two, few, many, other); `other` is the fallback.
 */
export function plural(lang: string, n: number, forms: Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }): string {
  const rule = cached("p", lang, undefined, () => safe((l) => new Intl.PluralRules(l), lang))
  return forms[rule.select(n)] ?? forms.other
}
