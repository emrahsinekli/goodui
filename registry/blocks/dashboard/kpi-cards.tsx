"use client"

import { ArrowDownRight, ArrowUpRight, CalendarCheck, DollarSign, Repeat, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const KPIS = [
  { label: "Revenue", value: "$48,295", change: 12.4, hint: "vs. last month", icon: DollarSign, spark: [12, 18, 14, 22, 19, 27, 31, 29, 36, 41] },
  { label: "Bookings", value: "1,284", change: 8.1, hint: "vs. last month", icon: CalendarCheck, spark: [30, 28, 35, 33, 40, 38, 44, 47, 45, 52] },
  { label: "New clients", value: "312", change: -3.2, hint: "vs. last month", icon: Users, spark: [22, 25, 24, 28, 26, 23, 24, 21, 22, 20] },
  { label: "Rebooking rate", value: "68.4%", change: 4.7, hint: "within 60 days", icon: Repeat, spark: [55, 57, 56, 60, 61, 63, 62, 65, 66, 68] },
]

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${30 - ((v - min) / (max - min || 1)) * 26 - 2}`).join(" ")
  const color = up ? "var(--color-emerald-500, #10b981)" : "var(--color-rose-500, #f43f5e)"
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-10 w-full" aria-hidden="true">
      <defs>
        <linearGradient id={`fill-${up}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,30 ${pts} 100,30`} fill={`url(#fill-${up})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}

export default function KpiCards() {
  return (
    <div className="grid gap-4 p-4 sm:grid-cols-2 md:p-6 xl:grid-cols-4">
      {KPIS.map((k) => {
        const up = k.change >= 0
        return (
          <Card key={k.label} className="gap-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
              <span className="flex size-8 items-center justify-center rounded-md bg-muted">
                <k.icon className="size-4 text-muted-foreground" />
              </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="text-2xl font-semibold tracking-tight tabular-nums">{k.value}</div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className={cn("inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium", up ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-rose-500/10 text-rose-700 dark:text-rose-400")}>
                  {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                  {Math.abs(k.change)}%
                </span>
                <span className="text-muted-foreground">{k.hint}</span>
              </div>
              <Sparkline data={k.spark} up={up} />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
