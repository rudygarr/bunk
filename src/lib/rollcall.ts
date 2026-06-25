import type { Database, Bus, Attendee } from './types';
import { busRoster } from './camps';

export type RollTone = 'idle' | 'ready' | 'warn' | 'bad';

export interface BusRoll {
  total: number;
  onboard: number;
  missing: number;
  missingList: Attendee[];
  rolled: boolean; // has roll call started this round?
  tone: RollTone;
}

// Roll-call status for one bus. Thresholds per the spec: 0 missing = ready
// (green ✓), 1–10 missing = warn (orange), >10 = bad (red). Before any
// 'Empty bus' the bus is 'idle' (not started).
export function busRoll(db: Database, bus: Bus): BusRoll {
  const riders = busRoster(db, bus.id);
  const total = riders.length;
  const rolled = riders.some((r) => r.onBoard !== undefined);
  const onboardList = riders.filter((r) => r.onBoard === true);
  const onboard = onboardList.length;
  const missing = total - onboard;
  const missingList = riders.filter((r) => r.onBoard !== true);
  let tone: RollTone = 'idle';
  if (rolled && total > 0) tone = missing === 0 ? 'ready' : missing <= 10 ? 'warn' : 'bad';
  return { total, onboard, missing, missingList, rolled, tone };
}

// Captains of a bus, resolved to attendees.
export function busCaptains(db: Database, bus: Bus): Attendee[] {
  const ids = new Set(bus.captainIds ?? []);
  return db.attendees.filter((a) => ids.has(a.id));
}

export function isCaptainOf(bus: Bus, attendeeId: string): boolean {
  return (bus.captainIds ?? []).includes(attendeeId);
}

// The bus an attendee captains (if any) — drives the captain's roll-call screen.
export function busCaptainedBy(db: Database, campId: string, attendeeId: string): Bus | undefined {
  return db.buses.find((b) => b.campId === campId && (b.captainIds ?? []).includes(attendeeId));
}
