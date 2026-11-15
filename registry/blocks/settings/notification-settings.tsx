"use client"

import * as React from "react"
import { Bell, Mail, MessageSquare, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const CHANNELS = [
  { id: "email", label: "Email", icon: Mail },
  { id: "push", label: "Push", icon: Smartphone },
  { id: "sms", label: "SMS", icon: MessageSquare },
] as const
type Channel = (typeof CHANNELS)[number]["id"]

const GROUPS: { title: string; items: { id: string; label: string; hint: string; defaults: Channel[] }[] }[] = [
  {
    title: "Bookings",
    items: [
      { id: "new", label: "New booking", hint: "A client books an appointment", defaults: ["email", "push"] },
      { id: "cancel", label: "Cancellations", hint: "A client cancels or reschedules", defaults: ["email", "push", "sms"] },
      { id: "reminder", label: "Daily agenda", hint: "Your schedule every morning at 7:00", defaults: ["email"] },
    ],
  },
  {
    title: "Payments",
    items: [
      { id: "paid", label: "Payment received", hint: "Deposits and full payments", defaults: ["email"] },
      { id: "failed", label: "Failed payment", hint: "A card is declined", defaults: ["email", "push"] },
    ],
  },
  {
    title: "Team",
    items: [
      { id: "mention", label: "Mentions", hint: "Someone @mentions you in a note", defaults: ["push"] },
      { id: "joined", label: "Member joined", hint: "An invitation is accepted", defaults: [] },
    ],
  },
]

const initial = () => Object.fromEntries(GROUPS.flatMap((g) => g.items.map((i) => [i.id, new Set(i.defaults)]))) as Record<string, Set<Channel>>

export default function NotificationSettings() {
  const [prefs, setPrefs] = React.useState(initial)
  const [paused, setPaused] = React.useState(false)
  const [dirty, setDirty] = React.useState(false)

  const toggle = (id: string, ch: Channel, on: boolean) => {
    setPrefs((p) => {
      const next = new Set(p[id])
      if (on) next.add(ch)
      else next.delete(ch)
      return { ...p, [id]: next }
    })
    setDirty(true)
  }

  return (
    <div className="p-4 md:p-6">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose how you hear about what matters. Security alerts are always sent by email.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <Bell className="mt-0.5 size-5 text-muted-foreground" />
              <div>
                <Label htmlFor="pause" className="font-medium">Pause all notifications</Label>
                <p className="text-sm text-muted-foreground">Useful for holidays. You will still get security emails.</p>
              </div>
            </div>
            <Switch id="pause" checked={paused} onCheckedChange={(v) => { setPaused(v); setDirty(true) }} />
          </div>

          <div className={paused ? "pointer-events-none opacity-50" : undefined}>
            <div className="grid grid-cols-[1fr_repeat(3,64px)] items-center gap-y-1 border-b pb-2 text-xs font-medium text-muted-foreground">
              <span />
              {CHANNELS.map((c) => (
                <span key={c.id} className="flex flex-col items-center gap-1">
                  <c.icon className="size-4" /> {c.label}
                </span>
              ))}
            </div>
            {GROUPS.map((g) => (
              <div key={g.title} className="border-b py-3 last:border-b-0">
                <h3 className="pb-2 text-sm font-semibold">{g.title}</h3>
                {g.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_repeat(3,64px)] items-center py-2">
                    <div>
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.hint}</div>
                    </div>
                    {CHANNELS.map((c) => (
                      <div key={c.id} className="flex justify-center">
                        <Checkbox aria-label={`${item.label} by ${c.label}`} checked={!!prefs[item.id]?.has(c.id)} onCheckedChange={(v) => toggle(item.id, c.id, !!v)} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button variant="ghost" disabled={!dirty} onClick={() => { setPrefs(initial()); setPaused(false); setDirty(false) }}>Reset</Button>
          <Button disabled={!dirty} onClick={() => setDirty(false)}>Save preferences</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
