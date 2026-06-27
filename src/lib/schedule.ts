import type { Database, ScheduleItem, Attendee, ScheduleBlockType } from './types';
import { inAudience } from './announce';

// The block typology for "the Day" — icon + label + accent per type.
export const BLOCK_TYPES: { key: ScheduleBlockType; label: string; icon: string; tint: string }[] = [
  { key: 'activity', label: 'Activity', icon: 'ti-ball-football', tint: 'var(--pine)' },
  { key: 'meal', label: 'Meal', icon: 'ti-tools-kitchen-2', tint: 'var(--amber)' },
  { key: 'gathering', label: 'Gathering', icon: 'ti-speakerphone', tint: 'var(--info)' },
  { key: 'travel', label: 'Travel', icon: 'ti-bus', tint: 'var(--warn)' },
  { key: 'free', label: 'Free time', icon: 'ti-sun', tint: 'var(--ok)' },
];
export function blockMeta(t?: ScheduleBlockType) {
  return BLOCK_TYPES.find((b) => b.key === (t ?? 'activity')) ?? BLOCK_TYPES[0];
}
// Best-guess type from a title — used to tag legacy/seed items and to default a
// sensible type as an organizer types a new block.
export function inferBlockType(title: string): ScheduleBlockType {
  const t = title.toLowerCase();
  if (/breakfast|lunch|dinner|brunch|snack|meal|cookout|banquet/.test(t)) return 'meal';
  if (/depart|arrive|arrival|bus|travel|load|return|airport|drive/.test(t)) return 'travel';
  if (/session|worship|chapel|service|keynote|speaker|message|assembly|gathering/.test(t)) return 'gathering';
  if (/free time|free|rest|down ?time|hang|pool time|open /.test(t)) return 'free';
  return 'activity';
}

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
