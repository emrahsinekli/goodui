"use client";

// Slotgrid Scheduler for React + Tailwind (shadcn theme tokens). Month, week and day views,
// drag to move, drag the bottom edge to resize, drag on empty time to create.
// Zero dependencies besides React; all date logic lives in ./core.

import * as React from "react";
import {
  addDays,
  expandOccurrences,
  formatHour,
  formatTime,
  formatTitle,
  isSameDay,
  layoutDay,
  minutesIntoDay,
  moveOccurrence,
  navigate,
  occurrencesOnDay,
  resizeOccurrence,
  snap,
  startOfDay,
  visibleDays,
  visibleRange,
  weekdayLabels,
  type Occurrence,
  type SlotgridEvent,
  type View,
  type Weekday,
} from "./core";

export type { Occurrence, Recurrence, SlotgridEvent, View, Weekday } from "./core";

export interface EventChange<E extends SlotgridEvent = SlotgridEvent> {
  event: E;
  occurrence: Occurrence<E>;
  start: Date;
  end: Date;
}

export interface SchedulerProps<E extends SlotgridEvent = SlotgridEvent> {
  events: E[];
  /** Controlled view. Pair with onViewChange. */
  view?: View;
  defaultView?: View;
  onViewChange?: (view: View) => void;
  /** Controlled date. Pair with onDateChange. */
  date?: Date;
  defaultDate?: Date;
  onDateChange?: (date: Date) => void;
  /** Views offered in the switcher. */
  views?: View[];
  weekStartsOn?: Weekday;
  /** BCP 47 tag such as "en-US" or "tr-TR". Defaults to the browser locale. */
  locale?: string;
  /** Snap step and grid line spacing in minutes. */
  slotMinutes?: number;
  hourHeight?: number;
  dayStartHour?: number;
  dayEndHour?: number;
  /** Hour the time grid scrolls to on open. */
  scrollToHour?: number;
  /** Height of the whole scheduler. */
  height?: number | string;
  editable?: boolean;
  onEventChange?: (change: EventChange<E>) => void;
  onEventClick?: (occurrence: Occurrence<E>) => void;
  onSlotSelect?: (range: { start: Date; end: Date; allDay: boolean }) => void;
  renderEvent?: (occurrence: Occurrence<E>) => React.ReactNode;
  /** Labels for the toolbar, for translation. */
  labels?: Partial<Record<"today" | "previous" | "next" | "more" | View, string>>;
  className?: string;
}

const DEFAULT_LABELS = { today: "Today", previous: "Previous", next: "Next", more: "more", month: "Month", week: "Week", day: "Day" };
const DRAG_THRESHOLD = 4;
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

function useControllable<T>(value: T | undefined, initial: T, onChange?: (v: T) => void): [T, (v: T) => void] {
  const [inner, setInner] = React.useState(initial);
  const current = value === undefined ? inner : value;
  const set = React.useCallback(
    (v: T) => {
      if (value === undefined) setInner(v);
      onChange?.(v);
    },
    [value, onChange],
  );
  return [current, set];
}

// The clock is read only in effects: server rendering (and Next.js prerendering) must not
// depend on the current time, or the markup would differ from the browser's.
function useNow(): Date | null {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function eventStyle(color?: string): React.CSSProperties | undefined {
  if (!color) return undefined;
  return { backgroundColor: `color-mix(in oklab, ${color} 16%, var(--background, white))`, borderLeftColor: color };
}

// ─── Root ───────────────────────────────────────────────────────────────────────────────

export function Scheduler<E extends SlotgridEvent = SlotgridEvent>(props: SchedulerProps<E>) {
  const {
    events,
    views = ["month", "week", "day"],
    weekStartsOn = 1,
    locale,
    height = 680,
    className,
  } = props;
  const labels = { ...DEFAULT_LABELS, ...props.labels };
  const [view, setView] = useControllable<View>(props.view, props.defaultView ?? "week", props.onViewChange);
  const [chosenDate, setDate] = useControllable<Date | null>(props.date, props.defaultDate ?? null, props.onDateChange as (d: Date | null) => void);
  // The grid is drawn only after mount (now is null until then): event times and labels depend
  // on the browser's time zone and locale, which a server render cannot know.
  const now = useNow();
  const date = now && (chosenDate ?? now);

  const days = React.useMemo(() => (date ? visibleDays(view, date, weekStartsOn) : []), [view, date, weekStartsOn]);
  const occurrences = React.useMemo(() => {
    if (!date) return [];
    const { start, end } = visibleRange(view, date, weekStartsOn);
    return expandOccurrences(events, start, end);
  }, [events, view, date, weekStartsOn]);

  const openDay = (day: Date) => {
    setDate(day);
    if (views.includes("day")) setView("day");
  };

  return (
    <div
      className={cx("flex flex-col overflow-hidden rounded-xl border border-border bg-background text-foreground text-sm", className)}
      style={{ height }}
      data-slotgrid=""
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <button type="button" className={btn} onClick={() => setDate(new Date())}>
          {labels.today}
        </button>
        <div className="flex">
          <button type="button" aria-label={labels.previous} className={cx(iconBtn, "rounded-r-none")} onClick={() => date && setDate(navigate(view, date, -1))}>
            <Chevron dir="left" />
          </button>
          <button type="button" aria-label={labels.next} className={cx(iconBtn, "-ml-px rounded-l-none")} onClick={() => date && setDate(navigate(view, date, 1))}>
            <Chevron dir="right" />
          </button>
        </div>
        <h2 className="mr-auto px-1 text-base font-semibold tracking-tight">{date && formatTitle(view, date, locale, weekStartsOn)}</h2>
        {views.length > 1 && (
          <div className="inline-flex rounded-md bg-muted p-0.5" role="tablist">
            {views.map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={v === view}
                onClick={() => setView(v)}
                className={cx(
                  "rounded-[5px] px-3 py-1 text-xs font-medium transition-colors",
                  v === view ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {labels[v]}
              </button>
            ))}
          </div>
        )}
      </div>
      {!date ? (
        <div className="flex-1" />
      ) : view === "month" ? (
        <MonthView {...props} days={days} date={date} occurrences={occurrences} weekStartsOn={weekStartsOn} moreLabel={labels.more} onOpenDay={openDay} />
      ) : (
        <TimeGrid {...props} days={days} occurrences={occurrences} weekStartsOn={weekStartsOn} onOpenDay={openDay} showDayHeader={view === "week"} />
      )}
    </div>
  );
}

const btn =
  "inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground";
const iconBtn =
  "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground";

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}

// ─── Time grid (week / day) ─────────────────────────────────────────────────────────────

type GridDrag<E extends SlotgridEvent> =
  | { kind: "move" | "resize"; occ: Occurrence<E>; x0: number; y0: number; day0: number; dDays: number; dMin: number; moved: boolean }
  | { kind: "select"; day: number; from: number; to: number };

interface ViewProps<E extends SlotgridEvent> extends SchedulerProps<E> {
  days: Date[];
  occurrences: Occurrence<E>[];
  weekStartsOn: Weekday;
  onOpenDay: (day: Date) => void;
}

function TimeGrid<E extends SlotgridEvent>(p: ViewProps<E> & { showDayHeader: boolean }) {
  const { days, locale, slotMinutes = 30, hourHeight = 48, dayStartHour = 0, dayEndHour = 24, scrollToHour = 8, editable = true } = p;
  const now = useNow();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const colsRef = React.useRef<HTMLDivElement>(null);
  const [drag, setDrag] = React.useState<GridDrag<E> | null>(null);
  const dragRef = React.useRef(drag);
  dragRef.current = drag;

  const startMin = dayStartHour * 60;
  const totalMin = (dayEndHour - dayStartHour) * 60;
  const pxPerMin = hourHeight / 60;
  const hours = Array.from({ length: dayEndHour - dayStartHour }, (_, i) => dayStartHour + i);

  React.useEffect(() => {
    // A few px above the hour so its label is not clipped.
    scrollRef.current?.scrollTo({ top: Math.max(0, (scrollToHour - dayStartHour) * hourHeight - 8) });
  }, [scrollToHour, dayStartHour, hourHeight, days.length]);

  // While dragging, the dragged occurrence is replaced by its preview so layout reflows live.
  const shown = React.useMemo(() => {
    if (!drag || drag.kind === "select" || !drag.moved) return p.occurrences;
    const next = drag.kind === "move" ? moveOccurrence(drag.occ, drag.dDays, drag.dMin) : resizeOccurrence(drag.occ, drag.dMin, slotMinutes);
    return p.occurrences.map((o) => (o.key === drag.occ.key ? { ...o, ...next } : o));
  }, [drag, p.occurrences, slotMinutes]);

  const pointerToCell = (clientX: number, clientY: number) => {
    const r = colsRef.current!.getBoundingClientRect();
    const day = Math.min(days.length - 1, Math.max(0, Math.floor(((clientX - r.left) / r.width) * days.length)));
    const min = Math.min(totalMin, Math.max(0, (clientY - r.top) / pxPerMin));
    return { day, min };
  };

  const track = (onMove: (e: PointerEvent) => void, onUp: (e: PointerEvent) => void) => {
    const move = (e: PointerEvent) => onMove(e);
    const up = (e: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      onUp(e);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const beginEventDrag = (e: React.PointerEvent, occ: Occurrence<E>, kind: "move" | "resize") => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const canEdit = editable && !!p.onEventChange && !occ.event.recurrence;
    const { day } = pointerToCell(e.clientX, e.clientY);
    setDrag({ kind, occ, x0: e.clientX, y0: e.clientY, day0: day, dDays: 0, dMin: 0, moved: false });
    track(
      (ev) => {
        const d = dragRef.current;
        if (!d || d.kind === "select") return;
        const moved = d.moved || Math.hypot(ev.clientX - d.x0, ev.clientY - d.y0) > DRAG_THRESHOLD;
        if (!moved || !canEdit) return;
        const cell = pointerToCell(ev.clientX, ev.clientY);
        setDrag({ ...d, moved, dMin: snap((ev.clientY - d.y0) / pxPerMin, slotMinutes), dDays: kind === "move" ? cell.day - d.day0 : 0 });
      },
      () => {
        const d = dragRef.current;
        setDrag(null);
        if (!d || d.kind === "select") return;
        if (!d.moved) return p.onEventClick?.(occ);
        if (!d.dMin && !d.dDays) return;
        const next = d.kind === "move" ? moveOccurrence(occ, d.dDays, d.dMin) : resizeOccurrence(occ, d.dMin, slotMinutes);
        p.onEventChange?.({ event: occ.event, occurrence: occ, ...next });
      },
    );
  };

  const beginSelect = (e: React.PointerEvent) => {
    if (e.button !== 0 || !p.onSlotSelect) return;
    const { day, min } = pointerToCell(e.clientX, e.clientY);
    const from = Math.floor(min / slotMinutes) * slotMinutes;
    setDrag({ kind: "select", day, from, to: from + slotMinutes });
    track(
      (ev) => {
        const d = dragRef.current;
        if (!d || d.kind !== "select") return;
        const cur = pointerToCell(ev.clientX, ev.clientY).min;
        setDrag({ ...d, to: Math.max(d.from + slotMinutes, Math.ceil(cur / slotMinutes) * slotMinutes) });
      },
      () => {
        const d = dragRef.current;
        setDrag(null);
        if (!d || d.kind !== "select") return;
        const day = days[d.day];
        if (!day) return;
        const base = startOfDay(day);
        p.onSlotSelect?.({ start: new Date(base.getTime() + (startMin + d.from) * 60_000), end: new Date(base.getTime() + (startMin + d.to) * 60_000), allDay: false });
      },
    );
  };

  const allDay = days.map((day) => shown.filter((o) => o.event.allDay && occurrencesOnDay([o], day).length));
  const hasAllDay = allDay.some((list) => list.length);
  const cols = `repeat(${days.length}, minmax(0, 1fr))`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {p.showDayHeader && (
        <div className="flex border-b border-border">
          <div className="w-14 shrink-0" />
          <div className="grid flex-1" style={{ gridTemplateColumns: cols }}>
            {days.map((day, i) => {
              const today = !!now && isSameDay(day, now);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => p.onOpenDay(day)}
                  className="flex flex-col items-center gap-0.5 border-l border-border py-1.5 first:border-l-0 hover:bg-accent/50"
                >
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{weekdayLabels(day.getDay() as Weekday, locale)[0]}</span>
                  <span className={cx("flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-base font-medium", today && "bg-primary text-primary-foreground")}>
                    {day.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {hasAllDay && (
        <div className="flex border-b border-border">
          <div className="w-14 shrink-0" />
          <div className="grid flex-1" style={{ gridTemplateColumns: cols }}>
            {allDay.map((list, i) => (
              <div key={i} className="flex min-w-0 flex-col gap-0.5 border-l border-border p-1 first:border-l-0">
                {list.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => p.onEventClick?.(o)}
                    className="truncate rounded-sm border-l-[3px] border-primary bg-primary/10 px-1.5 py-0.5 text-left text-xs font-medium"
                    style={eventStyle(o.event.color)}
                  >
                    {p.renderEvent ? p.renderEvent(o) : o.event.title}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="flex" style={{ height: totalMin * pxPerMin }}>
          <div className="relative w-14 shrink-0">
            {hours.map((h, i) =>
              i === 0 ? null : (
                <span key={h} className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground" style={{ top: i * hourHeight }}>
                  {formatHour(h, locale)}
                </span>
              ),
            )}
          </div>
          <div
            ref={colsRef}
            className={cx("relative grid flex-1 touch-none select-none", p.onSlotSelect && "cursor-crosshair")}
            style={{
              gridTemplateColumns: cols,
              backgroundImage: `repeating-linear-gradient(to bottom, var(--border, #e5e7eb) 0 1px, transparent 1px ${hourHeight}px)`,
            }}
            onPointerDown={beginSelect}
          >
            {days.map((day, i) => {
              const segs = layoutDay(shown, day).filter((s) => s.bottom > startMin && s.top < startMin + totalMin);
              const today = !!now && isSameDay(day, now);
              const nowMin = now ? minutesIntoDay(now) - startMin : -1;
              return (
                <div key={i} className={cx("relative border-l border-border first:border-l-0", today && "bg-primary/[0.03]")}>
                  {drag?.kind === "select" && drag.day === i && (
                    <div
                      className="pointer-events-none absolute inset-x-1 z-10 rounded-md border border-primary/50 bg-primary/15 px-1.5 py-0.5 text-[11px] font-medium text-primary"
                      style={{ top: drag.from * pxPerMin, height: (drag.to - drag.from) * pxPerMin }}
                    >
                      {formatTime(new Date(startOfDay(day).getTime() + (startMin + drag.from) * 60_000), locale)}
                    </div>
                  )}
                  {segs.map((s) => {
                    const o = s.occurrence;
                    const top = Math.max(0, s.top - startMin);
                    const bottom = Math.min(totalMin, s.bottom - startMin);
                    const active = drag && drag.kind !== "select" && drag.occ.key === o.key;
                    const short = (bottom - top) * pxPerMin < 36;
                    return (
                      <div
                        key={o.key}
                        role="button"
                        tabIndex={0}
                        onPointerDown={(e) => beginEventDrag(e, o, "move")}
                        onKeyDown={(e) => e.key === "Enter" && p.onEventClick?.(o)}
                        className={cx(
                          "group absolute overflow-hidden rounded-md border-l-[3px] border-primary bg-primary/10 px-1.5 py-0.5 text-xs leading-tight shadow-xs ring-1 ring-background",
                          editable && p.onEventChange && !o.event.recurrence ? "cursor-grab" : "cursor-pointer",
                          active && drag.moved && "z-20 cursor-grabbing opacity-90 shadow-lg",
                        )}
                        style={{
                          top: top * pxPerMin,
                          height: Math.max(18, (bottom - top) * pxPerMin - 1),
                          left: `calc(${(s.col / s.cols) * 100}% + 1px)`,
                          width: `calc(${100 / s.cols}% - 3px)`,
                          ...eventStyle(o.event.color),
                        }}
                      >
                        {p.renderEvent ? (
                          p.renderEvent(o)
                        ) : (
                          <div className={cx(short && "flex gap-1")}>
                            <div className="truncate font-medium">{o.event.title}</div>
                            <div className="truncate text-muted-foreground">
                              {formatTime(o.start, locale)}
                              {!short && ` – ${formatTime(o.end, locale)}`}
                            </div>
                          </div>
                        )}
                        {editable && p.onEventChange && !o.event.recurrence && s.endsToday && (
                          <div
                            className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100"
                            onPointerDown={(e) => beginEventDrag(e, o, "resize")}
                          >
                            <div className="mx-auto mt-0.5 h-1 w-6 rounded-full bg-foreground/30" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {today && nowMin >= 0 && nowMin <= totalMin && (
                    <div className="pointer-events-none absolute inset-x-0 z-30 h-0.5 bg-red-500" style={{ top: nowMin * pxPerMin }}>
                      <div className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full bg-red-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Month ──────────────────────────────────────────────────────────────────────────────

const MAX_CHIPS = 3;

function MonthView<E extends SlotgridEvent>(p: ViewProps<E> & { date: Date; moreLabel: string }) {
  const { days, date, locale, weekStartsOn, editable = true } = p;
  const now = useNow();
  const [drag, setDrag] = React.useState<{ occ: Occurrence<E>; from: number; over: number; moved: boolean } | null>(null);
  const dragRef = React.useRef(drag);
  dragRef.current = drag;

  const cellAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-sg-day]");
    return el ? Number(el.dataset.sgDay) : null;
  };

  const beginDrag = (e: React.PointerEvent, occ: Occurrence<E>, from: number) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const canEdit = editable && !!p.onEventChange && !occ.event.recurrence;
    const x0 = e.clientX;
    const y0 = e.clientY;
    setDrag({ occ, from, over: from, moved: false });
    const move = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d || !canEdit) return;
      const moved = d.moved || Math.hypot(ev.clientX - x0, ev.clientY - y0) > DRAG_THRESHOLD;
      const over = cellAt(ev.clientX, ev.clientY);
      setDrag({ ...d, moved, over: over ?? d.over });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const d = dragRef.current;
      setDrag(null);
      if (!d) return;
      if (!d.moved) return p.onEventClick?.(occ);
      if (d.over !== d.from) p.onEventChange?.({ event: occ.event, occurrence: occ, ...moveOccurrence(occ, d.over - d.from, 0) });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid grid-cols-7 border-b border-border">
        {weekdayLabels(weekStartsOn, locale).map((w) => (
          <div key={w} className="py-1.5 text-center text-[11px] uppercase tracking-wide text-muted-foreground">
            {w}
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 select-none">
        {days.map((day, i) => {
          const list = occurrencesOnDay(p.occurrences, day);
          const outside = day.getMonth() !== date.getMonth();
          const isOver = drag?.moved && drag.over === i;
          return (
            <div
              key={i}
              data-sg-day={i}
              onClick={() => p.onSlotSelect?.({ start: startOfDay(day), end: addDays(startOfDay(day), 1), allDay: true })}
              className={cx(
                "flex min-h-0 min-w-0 flex-col gap-0.5 overflow-hidden border-b border-l border-border p-1 [&:nth-child(7n+1)]:border-l-0",
                outside && "bg-muted/40",
                isOver && "bg-primary/10",
                p.onSlotSelect && "cursor-pointer",
              )}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  p.onOpenDay(day);
                }}
                className={cx(
                  "flex h-6 min-w-6 items-center justify-center self-start rounded-full px-1 text-xs font-medium hover:bg-accent",
                  outside && "text-muted-foreground",
                  !!now && isSameDay(day, now) && "bg-primary text-primary-foreground hover:bg-primary",
                )}
              >
                {day.getDate()}
              </button>
              {list.slice(0, MAX_CHIPS).map((o) => (
                <div
                  key={o.key}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => beginDrag(e, o, i)}
                  onKeyDown={(e) => e.key === "Enter" && p.onEventClick?.(o)}
                  className={cx(
                    "flex min-w-0 items-center gap-1 rounded-sm px-1 py-px text-xs",
                    o.event.allDay ? "border-l-[3px] border-primary bg-primary/10 font-medium" : "hover:bg-accent",
                    drag?.moved && drag.occ.key === o.key && "opacity-40",
                    editable && p.onEventChange && !o.event.recurrence ? "cursor-grab" : "cursor-pointer",
                  )}
                  style={o.event.allDay ? eventStyle(o.event.color) : undefined}
                >
                  {!o.event.allDay && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" style={o.event.color ? { backgroundColor: o.event.color } : undefined} />
                  )}
                  {!o.event.allDay && <span className="shrink-0 text-muted-foreground">{formatTime(o.start, locale)}</span>}
                  <span className="truncate">{p.renderEvent ? p.renderEvent(o) : o.event.title}</span>
                </div>
              ))}
              {list.length > MAX_CHIPS && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    p.onOpenDay(day);
                  }}
                  className="self-start px-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                >
                  +{list.length - MAX_CHIPS} {p.moreLabel}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
