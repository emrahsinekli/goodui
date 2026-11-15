"use client"

import * as React from "react"
import { Check, Copy, LayoutGrid, List, Mail, MapPin, Phone, Plus, Search, Star, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type Contact = {
  id: string
  name: string
  company: string
  role: string
  email: string
  phone: string
  city: string
  visits: number
  spent: number
  favorite: boolean
  tags: string[]
  notes: string
}

const GRADIENTS = [
  "from-sky-400 to-indigo-500",
  "from-rose-400 to-orange-400",
  "from-emerald-400 to-teal-500",
  "from-violet-400 to-fuchsia-500",
  "from-amber-400 to-rose-500",
  "from-cyan-400 to-sky-600",
]
const SUGGESTED = ["VIP", "New client", "Prefers mornings", "Allergy", "Referral", "Corporate"]

const RAW: [string, string, string, string, number, number, boolean, string[], string][] = [
  ["Abigail Foster", "Foster & Lane Law", "Partner", "Austin, TX", 24, 2860, true, ["VIP", "Prefers mornings"], "Always books the 8am slot. Likes oat milk latte while processing."],
  ["Adrian Mendes", "Freelance", "Photographer", "Austin, TX", 6, 410, false, ["Referral"], "Referred by Abigail. Interested in quarterly beard maintenance."],
  ["Bianca Rossi", "Bloom Florals", "Owner", "Round Rock, TX", 15, 1720, false, ["Corporate"], "Books staff pampering day each December."],
  ["Benjamin Hart", "Hart Dental", "Dentist", "Austin, TX", 31, 3410, true, ["VIP"], "Tips generously. Prefers Liam for cuts."],
  ["Caroline Wu", "Lumen Studio", "Creative director", "Austin, TX", 9, 980, false, ["New client"], "Came in for balayage consultation, wants low maintenance color."],
  ["Daniel Okafor", "Okafor Logistics", "COO", "Pflugerville, TX", 12, 1240, false, [], "Hot towel shave every other Friday."],
  ["Daphne Schultz", "St. David's", "Nurse practitioner", "Austin, TX", 20, 1960, true, ["Allergy"], "Allergic to PPD — use ammonia-free color line only."],
  ["Elliot Brandt", "Brandt Coffee Co.", "Founder", "Austin, TX", 4, 260, false, ["New client"], "Asked about partnership for gift cards at the café."],
  ["Fatima Haddad", "UT Austin", "Professor", "Austin, TX", 18, 2105, false, ["Prefers mornings"], "Needs quiet room for facials. Sensitive skin."],
  ["Gabriel Silva", "Silva Architects", "Principal", "Cedar Park, TX", 7, 720, false, ["Referral"], ""],
  ["Hazel Morgan", "Morgan Yoga", "Instructor", "Austin, TX", 27, 2390, true, ["VIP", "Referral"], "Sends many referrals — gave her a loyalty upgrade."],
  ["Ibrahim Yusuf", "Northwind Health", "Pharmacist", "Austin, TX", 3, 195, false, [], "First visit went great, booked follow-up."],
  ["Jade Lin", "Lin & Co. Events", "Event planner", "Austin, TX", 11, 3980, false, ["Corporate"], "Coordinates bridal parties. Prefers invoices by email."],
  ["Julian Becker", "Becker Fitness", "Coach", "Georgetown, TX", 14, 980, false, [], "Sports massage after marathon training blocks."],
  ["Katherine Doyle", "City of Austin", "Planner", "Austin, TX", 22, 2210, false, ["Prefers mornings"], ""],
  ["Leo Martins", "Martins Bakery", "Owner", "Austin, TX", 5, 300, false, ["New client"], "Wants a monthly beard trim plan."],
  ["Mila Novak", "Novak Interiors", "Designer", "Austin, TX", 16, 1880, true, ["VIP"], "Loves the lavender scalp treatment add-on."],
  ["Nathan Brooks", "Brooks Realty", "Broker", "Lakeway, TX", 8, 640, false, ["Corporate"], "Gift cards for closing clients — invoice monthly."],
  ["Olivia Chen", "Chen Pediatrics", "Pediatrician", "Austin, TX", 19, 2310, false, ["Allergy"], "Latex allergy — nitrile gloves only."],
  ["Priya Desai", "Desai Consulting", "Consultant", "Austin, TX", 10, 1150, false, ["Referral"], ""],
  ["Quinn Harper", "Freelance", "Copywriter", "Austin, TX", 2, 120, false, ["New client"], "Booked via Instagram promo."],
  ["Rosa Delgado", "Delgado Family Law", "Attorney", "Austin, TX", 25, 2780, false, ["VIP"], "Prefers Saturday appointments."],
  ["Samuel Kim", "Kim Robotics", "Engineer", "Round Rock, TX", 13, 860, false, [], ""],
  ["Talia Green", "Green Leaf Café", "Manager", "Austin, TX", 9, 790, false, ["Prefers mornings"], "Quick lunch-hour manicures."],
  ["Victor Alvarez", "Alvarez Motors", "Owner", "Austin, TX", 17, 1530, false, ["Corporate"], ""],
  ["Wren Thompson", "Thompson Ceramics", "Artist", "Dripping Springs, TX", 6, 540, false, [], "Curly cut specialist only."],
  ["Yara Nasser", "Nasser Dermatology", "Dermatologist", "Austin, TX", 21, 2650, true, ["VIP", "Corporate"], "Possible clinic partnership — follow up in January."],
  ["Zoe Patel", "Patel Pharmacy", "Pharmacist", "Austin, TX", 12, 1090, false, ["Referral"], ""],
]

const INITIAL: Contact[] = RAW.map(([name, company, role, city, visits, spent, favorite, tags, notes], i) => {
  const [first = "", last = ""] = name.split(" ")
  return {
    id: `c${i + 1}`,
    name,
    company,
    role,
    email: `${first.toLowerCase()}@${company === "Freelance" ? `${last.toLowerCase()}.studio` : company.toLowerCase().replace(/[^a-z]/g, "").slice(0, 14) + ".com"}`,
    phone: `+1 (512) 555-${String(1100 + i * 73).slice(-4)}`,
    city,
    visits,
    spent,
    favorite,
    tags,
    notes,
  }
})

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
const initials = (n: string) => n.split(" ").map((p) => p[0]).join("")
const gradientFor = (n: string) => GRADIENTS[n.split("").reduce((s, ch) => s + ch.charCodeAt(0), 0) % GRADIENTS.length]

function ContactAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-sm", gradientFor(name), className)}>
      {initials(name)}
    </span>
  )
}

export default function ContactsDirectory() {
  const [contacts, setContacts] = React.useState(INITIAL)
  const [query, setQuery] = React.useState("")
  const [view, setView] = React.useState<"grid" | "list">("list")
  const [starredOnly, setStarredOnly] = React.useState(false)
  const [openId, setOpenId] = React.useState<string | null>(null)
  const [currentLetter, setCurrentLetter] = React.useState("A")
  const [tagInput, setTagInput] = React.useState("")
  const [tagError, setTagError] = React.useState<string | null>(null)
  const [noteDraft, setNoteDraft] = React.useState("")
  const [noteSaved, setNoteSaved] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const sectionRefs = React.useRef<Record<string, HTMLElement | null>>({})

  const q = query.trim().toLowerCase()
  const filtered = contacts.filter(
    (c) => (!starredOnly || c.favorite) && (!q || `${c.name} ${c.company} ${c.role} ${c.city} ${c.tags.join(" ")}`.toLowerCase().includes(q)),
  )
  const groups = LETTERS.map((l) => ({ letter: l, items: filtered.filter((c) => c.name.charAt(0).toUpperCase() === l) })).filter((g) => g.items.length)
  const available = new Set(groups.map((g) => g.letter))
  const starred = filtered.filter((c) => c.favorite)
  const detail = contacts.find((c) => c.id === openId) ?? null

  const update = (id: string, patch: Partial<Contact>) => setContacts((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  const toggleStar = (id: string) => setContacts((list) => list.map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c)))

  const jump = (letter: string) => {
    const el = sectionRefs.current[letter]
    const box = scrollRef.current
    if (!el || !box) return
    box.scrollTo({ top: el.offsetTop - 4, behavior: "smooth" })
    setCurrentLetter(letter)
  }
  const onScroll = () => {
    const box = scrollRef.current
    if (!box) return
    let cur = groups[0]?.letter ?? "A"
    for (const g of groups) {
      const el = sectionRefs.current[g.letter]
      if (el && el.offsetTop - 8 <= box.scrollTop) cur = g.letter
    }
    setCurrentLetter(cur)
  }
  const openContact = (c: Contact) => {
    setOpenId(c.id)
    setNoteDraft(c.notes)
    setNoteSaved(false)
    setTagInput("")
    setTagError(null)
    setCopied(false)
  }
  const addTag = (raw: string) => {
    if (!detail) return
    const tag = raw.trim()
    if (!tag) return setTagError("Type a tag first.")
    if (tag.length > 20) return setTagError("Keep tags under 20 characters.")
    if (detail.tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return setTagError(`“${tag}” is already on this contact.`)
    update(detail.id, { tags: [...detail.tags, tag] })
    setTagInput("")
    setTagError(null)
  }

  const starButton = (c: Contact, className?: string) => (
    <button
      type="button"
      aria-label={c.favorite ? `Unstar ${c.name}` : `Star ${c.name}`}
      aria-pressed={c.favorite}
      onClick={(e) => {
        e.stopPropagation()
        toggleStar(c.id)
      }}
      className={cn("inline-flex size-8 items-center justify-center rounded-full transition-colors hover:bg-muted", className)}
    >
      <Star className={cn("size-4", c.favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
    </button>
  )

  const renderItems = (items: Contact[]) =>
    view === "list" ? (
      <div className="divide-y rounded-xl border bg-card">
        {items.map((c) => (
          <div
            key={c.id}
            role="button"
            tabIndex={0}
            onClick={() => openContact(c)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openContact(c))}
            className="flex cursor-pointer items-center gap-3 px-3 py-2.5 outline-none first:rounded-t-xl last:rounded-b-xl hover:bg-muted/50 focus-visible:bg-muted/60"
          >
            <ContactAvatar name={c.name} className="size-9 text-xs" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{c.name}</div>
              <div className="truncate text-xs text-muted-foreground">{c.role} · {c.company}</div>
            </div>
            <div className="hidden gap-1 md:flex">
              {c.tags.slice(0, 2).map((t) => <Badge key={t} variant="outline" className="font-normal">{t}</Badge>)}
            </div>
            <div className="hidden w-24 text-right text-xs text-muted-foreground tabular-nums sm:block">{c.visits} visits</div>
            {starButton(c)}
          </div>
        ))}
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-3">
        {items.map((c) => (
          <div
            key={c.id}
            role="button"
            tabIndex={0}
            onClick={() => openContact(c)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openContact(c))}
            className="group relative cursor-pointer overflow-hidden rounded-xl border bg-card outline-none transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className={cn("h-12 bg-gradient-to-br opacity-25", gradientFor(c.name))} />
            {starButton(c, "absolute top-2 right-2 bg-background/70 backdrop-blur")}
            <div className="-mt-7 flex flex-col items-center px-3 pb-4 text-center">
              <ContactAvatar name={c.name} className="size-14 text-base ring-4 ring-card" />
              <div className="mt-2 text-sm font-semibold">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.role}</div>
              <div className="text-xs text-muted-foreground">{c.company}</div>
              <div className="mt-3 flex w-full justify-center gap-4 border-t pt-3 text-xs">
                <span><span className="font-semibold tabular-nums">{c.visits}</span> <span className="text-muted-foreground">visits</span></span>
                <span><span className="font-semibold tabular-nums">${c.spent.toLocaleString("en-US")}</span> <span className="text-muted-foreground">spent</span></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )

  return (
    <div className="p-4 md:p-6">
      <div className="overflow-hidden rounded-2xl border bg-background">
        <div className="flex flex-col gap-4 border-b bg-gradient-to-b from-muted/60 to-background px-4 pt-5 pb-4 md:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Clients</h2>
              <p className="text-sm text-muted-foreground">{contacts.length} contacts · {contacts.filter((c) => c.favorite).length} starred</p>
            </div>
            <div className="flex items-center gap-2">
              <div role="group" aria-label="View" className="inline-flex rounded-lg border bg-background p-0.5">
                {(["list", "grid"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-label={`${v} view`}
                    aria-pressed={view === v}
                    onClick={() => setView(v)}
                    className={cn("inline-flex size-7 items-center justify-center rounded-md text-muted-foreground", view === v && "bg-muted text-foreground")}
                  >
                    {v === "list" ? <List className="size-4" /> : <LayoutGrid className="size-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label="Search contacts" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, company or tag" className="h-9 rounded-full pl-9" />
              {query && (
                <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <Button variant={starredOnly ? "secondary" : "outline"} size="sm" className="h-9 rounded-full" aria-pressed={starredOnly} onClick={() => setStarredOnly(!starredOnly)}>
              <Star className={cn(starredOnly && "fill-amber-400 text-amber-400")} /> Starred only
            </Button>
          </div>
        </div>

        <div className="relative flex">
          <div ref={scrollRef} onScroll={onScroll} className="relative h-[540px] flex-1 overflow-y-auto px-4 pb-6 md:px-6">
            {starred.length > 0 && !starredOnly && !q && (
              <section className="pt-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" /> Starred
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {starred.map((c) => (
                    <button key={c.id} type="button" onClick={() => openContact(c)} className="flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-xl p-2 text-center hover:bg-muted">
                      <ContactAvatar name={c.name} className="size-12 text-sm" />
                      <span className="w-full truncate text-xs font-medium">{c.name.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
            {groups.map((g) => (
              <section
                key={g.letter}
                ref={(el) => {
                  sectionRefs.current[g.letter] = el
                }}
                className="pt-4"
              >
                <div className="sticky top-0 z-10 -mx-1 mb-2 flex items-center gap-3 bg-background/90 px-1 py-1 backdrop-blur">
                  <span className="text-lg font-semibold tracking-tight">{g.letter}</span>
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground tabular-nums">{g.items.length}</span>
                </div>
                {renderItems(g.items)}
              </section>
            ))}
            {groups.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <div className="inline-flex size-12 items-center justify-center rounded-full bg-muted"><Search className="size-5 text-muted-foreground" /></div>
                <div className="font-medium">No contacts found</div>
                <p className="text-sm text-muted-foreground">Nothing matches “{query}”{starredOnly ? " in starred contacts" : ""}.</p>
                <Button variant="outline" size="sm" onClick={() => { setQuery(""); setStarredOnly(false) }}>Clear filters</Button>
              </div>
            )}
          </div>
          <nav aria-label="Jump to letter" className="flex h-[540px] w-7 shrink-0 flex-col items-center justify-center gap-px border-l py-2 md:w-8">
            {LETTERS.map((l) => {
              const on = available.has(l)
              return (
                <button
                  key={l}
                  type="button"
                  disabled={!on}
                  onClick={() => jump(l)}
                  aria-label={`Jump to ${l}`}
                  className={cn(
                    "flex h-[18px] w-6 items-center justify-center rounded text-[10px] font-semibold transition-colors",
                    on ? "text-foreground hover:bg-muted" : "text-muted-foreground/40",
                    on && currentLetter === l && "bg-primary text-primary-foreground hover:bg-primary",
                  )}
                >
                  {l}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      <Sheet open={!!detail} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
          {detail && (
            <>
              <div className={cn("h-24 shrink-0 bg-gradient-to-br", gradientFor(detail.name))} />
              <SheetHeader className="-mt-12 items-start gap-1 px-5">
                <ContactAvatar name={detail.name} className="size-20 text-xl ring-4 ring-popover" />
                <div className="mt-2 flex w-full items-center gap-2">
                  <SheetTitle className="text-xl">{detail.name}</SheetTitle>
                  {starButton(detail, "ml-auto")}
                </div>
                <SheetDescription>{detail.role} at {detail.company}</SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-6 px-5 pt-2 pb-8">
                <div className="grid grid-cols-3 gap-2">
                  <a href={`mailto:${detail.email}`} className="flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium hover:bg-muted"><Mail className="size-4" /> Email</a>
                  <a href={`tel:${detail.phone.replace(/[^\d+]/g, "")}`} className="flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium hover:bg-muted"><Phone className="size-4" /> Call</a>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(detail.email)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 1500)
                    }}
                    className="flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium hover:bg-muted"
                  >
                    {copied ? <Check className="size-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy email"}
                  </button>
                </div>

                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
                  <dt className="text-muted-foreground">Email</dt><dd className="truncate">{detail.email}</dd>
                  <dt className="text-muted-foreground">Phone</dt><dd>{detail.phone}</dd>
                  <dt className="text-muted-foreground">City</dt><dd className="inline-flex items-center gap-1"><MapPin className="size-3.5 text-muted-foreground" />{detail.city}</dd>
                  <dt className="text-muted-foreground">History</dt><dd>{detail.visits} visits · ${detail.spent.toLocaleString("en-US")} spent</dd>
                </dl>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="contact-tag">Tags</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.tags.map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 rounded-full bg-muted py-0.5 pr-1 pl-2.5 text-xs font-medium">
                        {t}
                        <button type="button" aria-label={`Remove tag ${t}`} onClick={() => update(detail.id, { tags: detail.tags.filter((x) => x !== t) })} className="inline-flex size-4 items-center justify-center rounded-full hover:bg-background">
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                    {detail.tags.length === 0 && <span className="text-xs text-muted-foreground">No tags yet.</span>}
                  </div>
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault()
                      addTag(tagInput)
                    }}
                  >
                    <Input id="contact-tag" value={tagInput} onChange={(e) => { setTagInput(e.target.value); setTagError(null) }} placeholder="Add a tag and press Enter" className="h-8" aria-invalid={!!tagError} />
                    <Button type="submit" size="sm" variant="outline"><Plus /> Add</Button>
                  </form>
                  {tagError && <p className="text-xs text-destructive">{tagError}</p>}
                  <div className="flex flex-wrap gap-1">
                    {SUGGESTED.filter((s) => !detail.tags.includes(s)).slice(0, 4).map((s) => (
                      <button key={s} type="button" onClick={() => addTag(s)} className="rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground hover:border-solid hover:text-foreground">
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="contact-notes">Notes</Label>
                  <Textarea
                    id="contact-notes"
                    rows={4}
                    value={noteDraft}
                    onChange={(e) => {
                      setNoteDraft(e.target.value)
                      setNoteSaved(false)
                    }}
                    placeholder="Preferences, allergies, anything the team should know…"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground tabular-nums">{noteDraft.length}/500</span>
                    <div className="flex items-center gap-2">
                      {noteSaved && <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400"><Check className="size-3.5" /> Saved</span>}
                      {noteDraft !== detail.notes && <Button size="sm" variant="ghost" onClick={() => setNoteDraft(detail.notes)}>Revert</Button>}
                      <Button
                        size="sm"
                        disabled={noteDraft === detail.notes || noteDraft.length > 500}
                        onClick={() => {
                          update(detail.id, { notes: noteDraft.trim() })
                          setNoteDraft(noteDraft.trim())
                          setNoteSaved(true)
                        }}
                      >
                        Save note
                      </Button>
                    </div>
                  </div>
                  {noteDraft.length > 500 && <p className="text-xs text-destructive">Notes are limited to 500 characters.</p>}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
