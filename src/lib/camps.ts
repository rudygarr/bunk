import type { Database, Camp, Attendee, Bus, Cabin, CabinRoom, Role, Shift, Duty } from './types';

// ---- Attendees / RSVP ----
export function attendeesOf(db: Database, campId: string): Attendee[] {
  return db.attendees.filter((a) => a.campId === campId);
}
export interface Rsvp { total: number; accepted: number; declined: number; tentative: number; noReply: number }
export function rsvp(db: Database, campId: string): Rsvp {
  const list = attendeesOf(db, campId);
  return {
    total: list.length,
    accepted: list.filter((a) => a.status === 'accepted').length,
    declined: list.filter((a) => a.status === 'declined').length,
    tentative: list.filter((a) => a.status === 'tentative').length,
    noReply: list.filter((a) => a.status === 'invited').length,
  };
}

// ---- Buses ----
export function busesOf(db: Database, campId: string): Bus[] {
  return db.buses.filter((b) => b.campId === campId).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}
export function busRoster(db: Database, busId: string): Attendee[] {
  return db.attendees.filter((a) => a.busId === busId);
}
export function busOf(db: Database, a: Attendee): Bus | undefined {
  return a.busId ? db.buses.find((b) => b.id === a.busId) : undefined;
}
export function busLabel(b: Bus): string {
  return b.label ? `${b.name} · ${b.label}` : b.name;
}

// ---- Cabins ----
export const CABIN_KINDS: { key: Cabin['kind']; label: string; icon: string }[] = [
  { key: 'student', label: 'Students', icon: 'ti-school' },
  { key: 'staff', label: 'Staff', icon: 'ti-id-badge' },
  { key: 'parent', label: 'Parent volunteers', icon: 'ti-users' },
  { key: 'guest', label: 'Guests', icon: 'ti-star' },
];
export function cabinsOf(db: Database, campId: string): Cabin[] {
  return db.cabins.filter((c) => c.campId === campId).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}
export function roomsOf(db: Database, cabinId: string): CabinRoom[] {
  return db.cabinRooms.filter((r) => r.cabinId === cabinId);
}
export function cabinBeds(db: Database, cabin: Cabin): number {
  const rooms = roomsOf(db, cabin.id);
  if (rooms.length) return rooms.reduce((n, r) => n + r.beds, 0);
  return cabin.beds ?? 0;
}
export function cabinRoster(db: Database, cabinId: string): Attendee[] {
  return db.attendees.filter((a) => a.cabinId === cabinId);
}
export function roomRoster(db: Database, roomId: string): Attendee[] {
  return db.attendees.filter((a) => a.cabinRoomId === roomId);
}
export function cabinLeaders(db: Database, cabinId: string): Attendee[] {
  return cabinRoster(db, cabinId).filter((a) => a.cabinLeader);
}
export function cabinOf(db: Database, a: Attendee): Cabin | undefined {
  return a.cabinId ? db.cabins.find((c) => c.id === a.cabinId) : undefined;
}
export function roomOf(db: Database, a: Attendee): CabinRoom | undefined {
  return a.cabinRoomId ? db.cabinRooms.find((r) => r.id === a.cabinRoomId) : undefined;
}
export function unhoused(db: Database, campId: string): Attendee[] {
  return attendeesOf(db, campId).filter((a) => !a.cabinId);
}

// ---- Roles & shifts ----
export function rolesOf(db: Database, campId: string): Role[] {
  return db.roles.filter((r) => r.campId === campId);
}
export function shiftsOf(db: Database, roleId: string): Shift[] {
  return db.shifts.filter((s) => s.roleId === roleId);
}
export function dutiesOfRole(db: Database, roleId: string): Duty[] {
  return db.duties.filter((d) => d.roleId === roleId);
}
export function dutiesOfShift(db: Database, shiftId: string): Duty[] {
  return db.duties.filter((d) => d.shiftId === shiftId);
}
export function looseDuties(db: Database, roleId: string): Duty[] {
  return db.duties.filter((d) => d.roleId === roleId && !d.shiftId);
}
export function shiftWindow(s: Shift): string {
  if (s.start && s.end) return `${s.start}–${s.end}`;
  return s.start || '';
}

// Open coverage gaps across a camp's shifted roles (shifts with no one on them).
export function coverageGaps(db: Database, campId: string): number {
  let gaps = 0;
  for (const role of rolesOf(db, campId)) {
    for (const s of shiftsOf(db, role.id)) {
      if (dutiesOfShift(db, s.id).length === 0) gaps++;
    }
  }
  return gaps;
}

export function campById(db: Database, id: string): Camp | undefined {
  return db.camps.find((c) => c.id === id);
}
