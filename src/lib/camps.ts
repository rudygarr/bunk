import type { Database, Camp, Attendee, Bus, Cabin, CabinRoom, Role, Shift, Duty, CheckStage, FeatureKey, SmallGroup, Table, Contact } from './types';

// ---- Features ----
// Every toggleable module, in the order they appear in the wizard and dashboard.
// `core` features default on for a new camp; the rest are opt-in.
export const FEATURES: { key: FeatureKey; label: string; icon: string; desc: string; core?: boolean }[] = [
  { key: 'buses', label: 'Buses', icon: 'ti-bus', desc: 'Charter buses with rosters & departure times', core: true },
  { key: 'cabins', label: 'Cabins', icon: 'ti-home', desc: 'Lodging with beds, rooms & cabin leaders', core: true },
  { key: 'smallGroups', label: 'Small groups', icon: 'ti-users-group', desc: 'Discipleship / activity groups with leaders' },
  { key: 'tables', label: 'Meal tables', icon: 'ti-armchair', desc: 'Assigned dining seating with table leaders' },
  { key: 'teams', label: 'Teams', icon: 'ti-flag', desc: 'Competitive teams with a points standings board' },
  { key: 'roles', label: 'Crew roles', icon: 'ti-clipboard-check', desc: 'Assign adults to jobs & shifts (nurse, kitchen…)' },
  { key: 'schedule', label: 'Daily schedule', icon: 'ti-calendar-event', desc: 'The day-by-day calendar everyone follows', core: true },
  { key: 'announce', label: 'Announcements', icon: 'ti-speakerphone', desc: 'Post updates to the whole camp or a group', core: true },
  { key: 'attendance', label: 'Attendance', icon: 'ti-checkbox', desc: 'Day-of roll call & boarding check-in' },
  { key: 'photos', label: 'Photos', icon: 'ti-photo', desc: 'A shared photo feed (or link an external album)' },
  { key: 'info', label: 'Camp info & map', icon: 'ti-map-2', desc: 'Map, packing list & key facts', core: true },
];

// Is a feature on for this camp? Undefined features = legacy camp, all on.
export function hasFeature(camp: Camp, key: FeatureKey): boolean {
  return camp.features ? camp.features.includes(key) : true;
}
export const DEFAULT_FEATURES: FeatureKey[] = FEATURES.filter((f) => f.core).map((f) => f.key);

// ---- Health / safety ----
// "Flagged" = has allergies or meds the team should know about.
export function isFlagged(a: Attendee): boolean {
  return !!(a.health?.allergies?.trim() || a.health?.meds?.trim());
}
export function hasHealthInfo(a: Attendee): boolean {
  const h = a.health;
  return !!(h && (h.allergies || h.meds || h.dietary || h.emergencyName || h.emergencyPhone || h.notes));
}
export function flaggedCount(db: Database, campId: string): number {
  return db.attendees.filter((a) => a.campId === campId && isFlagged(a)).length;
}

// ---- Attendance / roll call ----
export const CHECK_STAGES: { key: CheckStage; label: string; icon: string }[] = [
  { key: 'depart', label: 'Boarded (out)', icon: 'ti-bus' },
  { key: 'onsite', label: 'On site', icon: 'ti-map-pin-check' },
  { key: 'return', label: 'Boarded (back)', icon: 'ti-bus-stop' },
];
export function checkedCount(db: Database, campId: string, stage: CheckStage): number {
  return db.attendees.filter((a) => a.campId === campId && a.checkIn?.[stage]).length;
}

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

// ---- Files & forms ----
export function docsOf(db: Database, campId: string) {
  return db.docs.filter((d) => d.campId === campId);
}

// ---- Setup progress ----
// A data-derived onboarding checklist, gated to the camp's enabled features.
// `publish` steps trigger the publish flow rather than a tab.
export interface SetupStep { key: string; label: string; done: boolean; tab?: string; publish?: boolean }
export function setupSteps(db: Database, camp: Camp): SetupStep[] {
  const att = attendeesOf(db, camp.id);
  const housed = att.some((a) => a.kind === 'camper' && a.cabinId);
  const all: (SetupStep & { feature?: FeatureKey })[] = [
    { key: 'people', label: 'Invite or import people', done: att.length > 0, tab: 'roster' },
    { key: 'buses', label: 'Charter your buses', done: busesOf(db, camp.id).length > 0, tab: 'buses', feature: 'buses' },
    { key: 'cabins', label: 'Set up cabins', done: cabinsOf(db, camp.id).length > 0, tab: 'cabins', feature: 'cabins' },
    { key: 'housed', label: 'Assign campers to cabins', done: housed, tab: 'cabins', feature: 'cabins' },
    { key: 'groups', label: 'Create small groups', done: smallGroupsOf(db, camp.id).length > 0, tab: 'smallGroups', feature: 'smallGroups' },
    { key: 'teams', label: 'Create teams', done: db.teams.some((t) => t.campId === camp.id), tab: 'teams', feature: 'teams' },
    { key: 'roles', label: 'Assign crew roles', done: rolesOf(db, camp.id).length > 0, tab: 'roles', feature: 'roles' },
    { key: 'schedule', label: 'Build the daily schedule', done: (db.schedule ?? []).some((s) => s.campId === camp.id), tab: 'schedule', feature: 'schedule' },
    { key: 'map', label: 'Add the camp map', done: !!camp.mapUrl, tab: 'info', feature: 'info' },
    { key: 'publish', label: 'Publish & go live', done: !!camp.published, publish: true },
  ];
  return all.filter((s) => !s.feature || hasFeature(camp, s.feature));
}

// ---- Small groups ----
export function smallGroupsOf(db: Database, campId: string): SmallGroup[] {
  return db.smallGroups.filter((g) => g.campId === campId);
}
export function smallGroupRoster(db: Database, groupId: string): Attendee[] {
  return db.attendees.filter((a) => a.smallGroupId === groupId);
}
export function smallGroupOf(db: Database, a: Attendee): SmallGroup | undefined {
  return a.smallGroupId ? db.smallGroups.find((g) => g.id === a.smallGroupId) : undefined;
}

// ---- Meal tables (assigned seating) ----
export function tablesOf(db: Database, campId: string): Table[] {
  return (db.tables ?? []).filter((t) => t.campId === campId).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}
export function tableRoster(db: Database, tableId: string): Attendee[] {
  return db.attendees.filter((a) => a.tableId === tableId);
}
export function tableLeaders(db: Database, tableId: string): Attendee[] {
  return tableRoster(db, tableId).filter((a) => a.tableLeader);
}
export function tableOf(db: Database, a: Attendee): Table | undefined {
  return a.tableId ? (db.tables ?? []).find((t) => t.id === a.tableId) : undefined;
}

// ---- Key contacts (who-to-call) ----
export function contactsOf(db: Database, campId: string): Contact[] {
  return (db.contacts ?? []).filter((c) => c.campId === campId);
}
