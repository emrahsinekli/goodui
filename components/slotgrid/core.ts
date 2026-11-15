// Slotgrid core: framework-free date math, recurrence and layout shared by every Slotgrid
// shell (React, Web Component, WordPress, Shopify). No dependencies. Times are local Dates.

export type View = "month" | "week" | "day";
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Recurrence {
  freq: "daily" | "weekly" | "monthly";
  /** Every n days/weeks/months. Default 1. */
  interval?: number;
  /** Total occurrences in the series, counted from the first one. */
  count?: number;
  /** Last allowed occurrence start (inclusive). */
  until?: Date;
  /** Weekly only. Defaults to the weekday of `start`. */
  byWeekday?: Weekday[];
  /** Occurrence starts to skip, e.g. one deleted instance. */
  exclude?: Date[];
}

export interface SlotgridEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  /** Any CSS color. */
  color?: string;
  resourceId?: string;
  recurrence?: Recurrence;
}

/** One concrete appearance of an event; recurring events produce many. */
export interface Occurrence<E extends SlotgridEvent = SlotgridEvent> {
  key: string;
  event: E;
  start: Date;
  end: Date;
}

/** An occurrence clipped to one day column, positioned in minutes from midnight. */
export interface PlacedSegment<E extends SlotgridEvent = SlotgridEvent> {
  occurrence: Occurrence<E>;
  top: number;
  bottom: number;
  col: number;
  cols: number;
  startsToday: boolean;
  endsToday: boolean;
}

export const MINUTE = 60_000;
const DAY_MINUTES = 24 * 60;

// ─── Date helpers ───────────────────────────────────────────────────────────────────────

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Calendar-day arithmetic, so a DST change keeps the wall-clock time. */
export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function addMinutes(d: Date, n: number): Date {
  return new Date(d.getTime() + n * MINUTE);
}

export function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/** Clamps the day, so Jan 31 + 1 month is the last day of February. */
export function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  const day = x.getDate();
  x.setDate(1);
  x.setMonth(x.getMonth() + n);
  x.setDate(Math.min(day, daysInMonth(x)));
  return x;
}

export function startOfWeek(d: Date, weekStartsOn: Weekday = 1): Date {
  const x = startOfDay(d);
  return addDays(x, -((x.getDay() - weekStartsOn + 7) % 7));
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function minutesIntoDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function snap(minutes: number, step: number): number {
  return Math.round(minutes / step) * step;
}

// ─── Navigation ─────────────────────────────────────────────────────────────────────────

/** Days drawn by a view: 1 for day, 7 for week, 42 (six full weeks) for month. */
export function visibleDays(view: View, date: Date, weekStartsOn: Weekday = 1): Date[] {
  if (view === "day") return [startOfDay(date)];
  const first =
    view === "week"
      ? startOfWeek(date, weekStartsOn)
      : startOfWeek(new Date(date.getFullYear(), date.getMonth(), 1), weekStartsOn);
  return Array.from({ length: view === "week" ? 7 : 42 }, (_, i) => addDays(first, i));
}

export function visibleRange(view: View, date: Date, weekStartsOn: Weekday = 1): { start: Date; end: Date } {
  const days = visibleDays(view, date, weekStartsOn);
  return { start: days[0]!, end: addDays(days[days.length - 1]!, 1) };
}

export function navigate(view: View, date: Date, direction: -1 | 1): Date {
  if (view === "month") return addMonths(date, direction);
  return addDays(date, direction * (view === "week" ? 7 : 1));
}

// ─── Recurrence ─────────────────────────────────────────────────────────────────────────

const MAX_STEPS = 20_000;

/** Every occurrence overlapping [rangeStart, rangeEnd), sorted by start. */
export function expandOccurrences<E extends SlotgridEvent>(events: E[], rangeStart: Date, rangeEnd: Date): Occurrence<E>[] {
  const out: Occurrence<E>[] = [];
  for (const event of events) {
    if (!event.recurrence) {
      if (overlaps(event.start, event.end, rangeStart, rangeEnd)) {
        out.push({ key: event.id, event, start: event.start, end: event.end });
      }
      continue;
    }
    const duration = event.end.getTime() - event.start.getTime();
    const excluded = new Set((event.recurrence.exclude ?? []).map((d) => d.getTime()));
    for (const start of seriesStarts(event, rangeEnd)) {
      const end = new Date(start.getTime() + duration);
      if (excluded.has(start.getTime()) || !overlaps(start, end, rangeStart, rangeEnd)) continue;
      out.push({ key: `${event.id}@${start.toISOString()}`, event, start, end });
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime() || b.end.getTime() - a.end.getTime());
}

/** Series starts in order, stopping at `until`, `count` or the first start at/after `stopAt`. */
function* seriesStarts(event: SlotgridEvent, stopAt: Date): Generator<Date> {
  const rule = event.recurrence!;
  const interval = Math.max(1, rule.interval ?? 1);
  const first = event.start;
  let emitted = 0;
  const accept = (d: Date) => !(rule.until && d > rule.until) && !(rule.count !== undefined && emitted >= rule.count) && d < stopAt;

  for (let step = 0; step < MAX_STEPS; step++) {
    let batch: Date[];
    if (rule.freq === "daily") {
      batch = [addDays(first, step * interval)];
    } else if (rule.freq === "monthly") {
      const target = new Date(first.getFullYear(), first.getMonth() + step * interval, 1, first.getHours(), first.getMinutes());
      // Months without that day are skipped (RFC 5545), not clamped.
      batch = first.getDate() <= daysInMonth(target) ? [new Date(target.setDate(first.getDate()))] : [];
    } else {
      const days = [...new Set(rule.byWeekday?.length ? rule.byWeekday : [first.getDay() as Weekday])].sort((a, b) => a - b);
      const weekStart = addDays(startOfWeek(first, 0), step * interval * 7);
      batch = days
        .map((wd) => {
          const d = addDays(weekStart, wd);
          d.setHours(first.getHours(), first.getMinutes(), first.getSeconds(), first.getMilliseconds());
          return d;
        })
        .filter((d) => d >= first);
    }
    for (const d of batch) {
      if (!accept(d)) return;
      emitted++;
      yield d;
    }
  }
}

// ─── Layout ─────────────────────────────────────────────────────────────────────────────

/** Timed occurrences clipped to `day` and packed into side-by-side columns where they overlap. */
export function layoutDay<E extends SlotgridEvent>(occurrences: Occurrence<E>[], day: Date): PlacedSegment<E>[] {
  const dayStart = startOfDay(day);
  const dayEnd = addDays(dayStart, 1);
  const segs: PlacedSegment<E>[] = [];
  for (const occurrence of occurrences) {
    if (occurrence.event.allDay || !overlaps(occurrence.start, occurrence.end, dayStart, dayEnd)) continue;
    const startsToday = occurrence.start >= dayStart;
    const endsToday = occurrence.end <= dayEnd;
    const top = startsToday ? minutesIntoDay(occurrence.start) : 0;
    const bottom = endsToday && occurrence.end < dayEnd ? minutesIntoDay(occurrence.end) : DAY_MINUTES;
    segs.push({ occurrence, top, bottom: Math.max(bottom, top + 1), col: 0, cols: 1, startsToday, endsToday });
  }
  segs.sort((a, b) => a.top - b.top || b.bottom - a.bottom);

  // Greedy column packing inside clusters of transitively overlapping segments.
  let cluster: PlacedSegment<E>[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = -1;
  const flush = () => {
    for (const s of cluster) s.cols = columnEnds.length;
    cluster = [];
    columnEnds = [];
  };
  for (const s of segs) {
    if (s.top >= clusterEnd) flush();
    let col = columnEnds.findIndex((end) => end <= s.top);
    if (col === -1) col = columnEnds.push(0) - 1;
    columnEnds[col] = s.bottom;
    s.col = col;
    cluster.push(s);
    clusterEnd = Math.max(clusterEnd, s.bottom);
  }
  flush();
  return segs;
}

/** Occurrences touching `day`, all-day first, then by start, longer first. */
export function occurrencesOnDay<E extends SlotgridEvent>(occurrences: Occurrence<E>[], day: Date): Occurrence<E>[] {
  const dayStart = startOfDay(day);
  const dayEnd = addDays(dayStart, 1);
  return occurrences
    .filter((o) => overlaps(o.start, o.end, dayStart, dayEnd) || (o.event.allDay && isSameDay(o.start, day)))
    .sort(
      (a, b) =>
        Number(!!b.event.allDay) - Number(!!a.event.allDay) ||
        a.start.getTime() - b.start.getTime() ||
        b.end.getTime() - a.end.getTime(),
    );
}

// ─── Editing ────────────────────────────────────────────────────────────────────────────

export function moveOccurrence(o: Occurrence, deltaDays: number, deltaMinutes: number): { start: Date; end: Date } {
  return {
    start: addMinutes(addDays(o.start, deltaDays), deltaMinutes),
    end: addMinutes(addDays(o.end, deltaDays), deltaMinutes),
  };
}

export function resizeOccurrence(o: Occurrence, deltaMinutes: number, minMinutes: number): { start: Date; end: Date } {
  const minEnd = addMinutes(o.start, minMinutes);
  const end = addMinutes(o.end, deltaMinutes);
  return { start: o.start, end: end < minEnd ? minEnd : end };
}

// ─── Formatting ─────────────────────────────────────────────────────────────────────────

export function formatTime(d: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(d);
}

export function formatHour(hour: number, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { hour: "numeric" }).format(new Date(2000, 0, 1, hour));
}

export function formatTitle(view: View, date: Date, locale?: string, weekStartsOn: Weekday = 1): string {
  if (view === "month") return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(date);
  if (view === "day") {
    return new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(date);
  }
  const days = visibleDays("week", date, weekStartsOn);
  // formatRange is ES2021; typed by hand so the file compiles under older lib targets.
  const fmt = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }) as Intl.DateTimeFormat & { formatRange(a: Date, b: Date): string };
  return fmt.formatRange(days[0]!, days[6]!);
}

export function weekdayLabels(weekStartsOn: Weekday = 1, locale?: string, width: "short" | "narrow" = "short"): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: width });
  // 2023-01-01 was a Sunday.
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2023, 0, 1 + ((weekStartsOn + i) % 7))));
}

// ─── Resources ──────────────────────────────────────────────────────────────────────────

export interface Resource {
  id: string;
  title: string;
  /** Any CSS color, used as the default for this resource's events. */
  color?: string;
  [key: string]: unknown;
}

/** A timed occurrence placed on a horizontal timeline row, in minutes from `rangeStart`. */
export interface LanePlacement<E extends SlotgridEvent = SlotgridEvent> {
  occurrence: Occurrence<E>;
  left: number;
  right: number;
  lane: number;
  lanes: number;
}

/**
 * Packs one resource's occurrences into stacked lanes for a horizontal timeline that spans
 * [rangeStart, rangeEnd). Overlapping items go to separate lanes; `lanes` is per cluster.
 */
export function layoutLanes<E extends SlotgridEvent>(occurrences: Occurrence<E>[], rangeStart: Date, rangeEnd: Date): LanePlacement<E>[] {
  const span = (rangeEnd.getTime() - rangeStart.getTime()) / MINUTE;
  const items: LanePlacement<E>[] = occurrences
    .filter((o) => overlaps(o.start, o.end, rangeStart, rangeEnd))
    .map((occurrence) => ({
      occurrence,
      left: Math.max(0, (occurrence.start.getTime() - rangeStart.getTime()) / MINUTE),
      right: Math.min(span, (occurrence.end.getTime() - rangeStart.getTime()) / MINUTE),
      lane: 0,
      lanes: 1,
    }))
    .sort((a, b) => a.left - b.left || b.right - a.right);

  let cluster: LanePlacement<E>[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;
  const flush = () => {
    for (const it of cluster) it.lanes = laneEnds.length;
    cluster = [];
    laneEnds = [];
  };
  for (const it of items) {
    if (it.left >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= it.left);
    if (lane === -1) lane = laneEnds.push(0) - 1;
    laneEnds[lane] = it.right;
    it.lane = lane;
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, it.right);
  }
  flush();
  return items;
}

/** Occurrences grouped by resource id, in resource order. Unassigned ones are dropped. */
export function groupByResource<E extends SlotgridEvent>(occurrences: Occurrence<E>[], resources: Resource[]): Map<string, Occurrence<E>[]> {
  const map = new Map<string, Occurrence<E>[]>(resources.map((r) => [r.id, []]));
  for (const o of occurrences) if (o.event.resourceId) map.get(o.event.resourceId)?.push(o);
  return map;
}

/** Free slots of `minutes` length between `from` and `to` that do not overlap any occurrence. */
export function freeSlots(occurrences: { start: Date; end: Date }[], from: Date, to: Date, minutes: number, step = minutes): Date[] {
  const out: Date[] = [];
  for (let t = from.getTime(); t + minutes * MINUTE <= to.getTime(); t += step * MINUTE) {
    const s = new Date(t);
    const e = new Date(t + minutes * MINUTE);
    if (!occurrences.some((o) => overlaps(s, e, o.start, o.end))) out.push(s);
  }
  return out;
}
