import type { Database, ScheduleItem, Attendee } from './types';
import { inAudience } from './announce';

export function scheduleOf(db: Database, campId: string): ScheduleItem[] {
  return (db.schedule ?? [])
    .filter((s) => s.campId === campId)
    .sort((a, b) => a.day.localeCompare(b.day) || a.start.localeCompare(b.start));
}

export function scheduleForCamper(db: Database, me: Attendee): ScheduleItem[] {
  return scheduleOf(db, me.campId).filter((s) => inAudience(me, s.audienceKind, s.audienceId));
}

// Group sorted items by day for the grouped view.
export function byDay(items: ScheduleItem[]): { day: string; items: ScheduleItem[] }[] {
  const out: { day: string; items: ScheduleItem[] }[] = [];
  for (const it of items) {
    const last = out[out.length - 1];
    if (last && last.day === it.day) last.items.push(it);
    else out.push({ day: it.day, items: [it] });
  }
  return out;
}

// Distinct days present in a list of schedule items (sorted).
export function daysOf(items: ScheduleItem[]): string[] {
  return [...new Set(items.map((s) => s.day))].sort();
}

// Today as a "YYYY-MM-DD" key (local).
export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// On a given day's items, which one is happening now and which is next — only
// meaningful when that day is actually today. Returns item ids (or null).
export function nowNext(items: ScheduleItem[], day: string): { nowId: string | null; nextId: string | null } {
  if (day !== todayKey()) return { nowId: null, nextId: null };
  const now = new Date().toTimeString().slice(0, 5); // "HH:MM"
  let nowId: string | null = null;
  let nextId: string | null = null;
  for (const s of items) {
    const ends = s.end || s.start;
    if (s.start <= now && now < (ends > s.start ? ends : '23:59')) nowId = s.id;
    if (s.start > now && !nextId) nextId = s.id;
  }
  return { nowId, nextId };
}

// 24h "HH:MM" → "8:30 AM" for display.
export function fmtClock(hhmm?: string): string {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const ap = h < 12 ? 'AM' : 'PM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, '0')} ${ap}`;
}
