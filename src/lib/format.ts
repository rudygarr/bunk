// Date helpers. Dates are stored as plain "YYYY-MM-DD" keys; we render at noon
// to dodge timezone/DST edges.
export function fmtDate(key: string): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(key + 'T12:00:00'));
}
export function fmtDateLong(key: string): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(key + 'T12:00:00'));
}
export function fmtRange(start: string, end: string): string {
  if (start === end) return fmtDateLong(start);
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  const s = new Date(start + 'T12:00:00');
  const e = new Date(end + 'T12:00:00');
  const mo = (d: Date) => new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d);
  if (sameMonth) return `${mo(s)} ${s.getDate()}–${e.getDate()}, ${e.getFullYear()}`;
  return `${mo(s)} ${s.getDate()} – ${mo(e)} ${e.getDate()}, ${e.getFullYear()}`;
}
export function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}
export function daysUntil(key: string, today = new Date()): number {
  const t = new Date(today.toISOString().slice(0, 10) + 'T12:00:00').getTime();
  const d = new Date(key + 'T12:00:00').getTime();
  return Math.round((d - t) / 86400000);
}
