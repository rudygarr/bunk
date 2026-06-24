import type { Database, Attendee, Gender } from './types';
import { cabinsOf, roomsOf, cabinRoster, roomRoster, busesOf, busRoster, attendeesOf } from './camps';

// Algorithmic auto-fill — the thing manual drag-and-drop tools make you do by
// hand. Produces a *plan* (who goes where) the organizer previews and applies;
// nothing changes until they hit Apply, and manual overrides still work after.

export interface CabinPlacement { attendeeId: string; name: string; cabinId: string; cabinName: string; roomId?: string; roomName?: string }
export interface CabinPlan { placements: CabinPlacement[]; unplaced: Attendee[] }

// A bed bucket the algorithm fills: a cabin, or a room within one.
interface Bin { cabinId: string; cabinName: string; roomId?: string; roomName?: string; gender?: Gender; remaining: number; grades: number[] }

// Union-find to keep requested friends in the same cabin.
function clusters(campers: Attendee[]): Attendee[][] {
  const idx = new Map(campers.map((c, i) => [c.id, i] as const));
  const byName = new Map<string, number>();
  campers.forEach((c, i) => byName.set(c.name.toLowerCase(), i));
  const parent = campers.map((_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const union = (a: number, b: number) => { parent[find(a)] = find(b); };
  campers.forEach((c) => {
    if (!c.friends) return;
    for (const want of c.friends.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)) {
      const j = byName.get(want);
      if (j !== undefined) union(idx.get(c.id)!, j);
    }
  });
  const groups = new Map<number, Attendee[]>();
  campers.forEach((c, i) => { const r = find(i); (groups.get(r) ?? groups.set(r, []).get(r)!).push(c); });
  return [...groups.values()];
}

const avg = (ns: number[]) => (ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : 0);

export function autoAssignCabins(db: Database, campId: string): CabinPlan {
  // Only unhoused campers go into student cabins.
  const campers = attendeesOf(db, campId).filter((a) => a.kind === 'camper' && !a.cabinId);
  const studentCabins = cabinsOf(db, campId).filter((c) => c.kind === 'student');

  // Build the bed buckets with current occupancy + grade mix.
  const bins: Bin[] = [];
  for (const c of studentCabins) {
    const rooms = roomsOf(db, c.id);
    if (rooms.length) {
      for (const rm of rooms) {
        const occ = roomRoster(db, rm.id);
        bins.push({ cabinId: c.id, cabinName: c.name, roomId: rm.id, roomName: rm.name, gender: c.gender, remaining: rm.beds - occ.length, grades: occ.map((o) => o.grade ?? 0).filter(Boolean) });
      }
    } else {
      const occ = cabinRoster(db, c.id);
      bins.push({ cabinId: c.id, cabinName: c.name, gender: c.gender, remaining: (c.beds ?? 0) - occ.length, grades: occ.map((o) => o.grade ?? 0).filter(Boolean) });
    }
  }

  const placements: CabinPlacement[] = [];
  const unplaced: Attendee[] = [];

  // Place friend-clusters first (largest first), then loose campers — both in
  // grade order so each cabin trends toward one grade band.
  const groups = clusters(campers).sort((a, b) => b.length - a.length || avg(a.map((c) => c.grade ?? 0)) - avg(b.map((c) => c.grade ?? 0)));

  for (const group of groups) {
    const g = group[0].gender;
    const grade = avg(group.map((c) => c.grade ?? 0));
    // Candidate bins: gender-compatible with room for the whole group, best
    // grade-match first; fall back to most-remaining so we still place them.
    const eligible = (need: number) => bins
      .filter((b) => b.remaining >= need && (!b.gender || !g || b.gender === g))
      .sort((x, y) => Math.abs(avg(x.grades) - grade) - Math.abs(avg(y.grades) - grade) || y.remaining - x.remaining);

    let bin = eligible(group.length)[0];
    if (bin) {
      for (const c of group) place(c, bin);
    } else {
      // Group can't stay whole — split across bins (still gender-correct).
      for (const c of group) {
        const b = eligible(1)[0];
        if (b) place(c, b); else unplaced.push(c);
      }
    }
  }

  function place(c: Attendee, bin: Bin) {
    placements.push({ attendeeId: c.id, name: c.name, cabinId: bin.cabinId, cabinName: bin.cabinName, roomId: bin.roomId, roomName: bin.roomName });
    bin.remaining -= 1;
    if (c.grade) bin.grades.push(c.grade);
  }

  return { placements, unplaced };
}

export interface BusPlacement { attendeeId: string; name: string; busId: string; busName: string }
export interface BusPlan { placements: BusPlacement[]; unplaced: Attendee[] }

// Fill buses by capacity. keepCabinmates groups riders from the same cabin so a
// cabin travels together (and a monitor's roll-call lines up with the cabin).
export function autoAssignBuses(db: Database, campId: string, keepCabinmates = true): BusPlan {
  const riders = attendeesOf(db, campId).filter((a) => !a.busId && (a.kind === 'camper' || a.kind === 'staff'));
  if (keepCabinmates) riders.sort((a, b) => (a.cabinId ?? 'zzz').localeCompare(b.cabinId ?? 'zzz'));
  const buses = busesOf(db, campId).map((b) => ({ id: b.id, name: b.label ? `${b.name} · ${b.label}` : b.name, remaining: (b.capacity ?? Infinity) - busRoster(db, b.id).length }));

  const placements: BusPlacement[] = [];
  const unplaced: Attendee[] = [];
  for (const r of riders) {
    const bus = buses.find((b) => b.remaining > 0);
    if (bus) { placements.push({ attendeeId: r.id, name: r.name, busId: bus.id, busName: bus.name }); bus.remaining -= 1; }
    else unplaced.push(r);
  }
  return { placements, unplaced };
}
