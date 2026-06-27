import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type {
  Database, Camp, Attendee, Bus, Cabin, CabinRoom, Role, Shift, Duty,
  RsvpStatus, AttendeeKind, CabinKind, Health, CheckStage, Announcement, AudienceKind, ScheduleItem, Photo, Team, PackingItem, SmallGroup, CampDoc, Table, Contact,
} from './types';
import { buildSeed, SEED_VERSION } from './seed';
import { loadDB, saveDB, clearDB } from './persistence';
import { loadCloudDB, saveCloudDB } from './cloudDb';
import { useSession } from './session';

// An empty workspace for a brand-new cloud account (or a cloud load failure).
function emptyDatabase(): Database {
  return {
    users: [], people: [], camps: [], attendees: [], buses: [], cabins: [], cabinRooms: [],
    teams: [], smallGroups: [], tables: [], contacts: [], roles: [], shifts: [], duties: [], schedule: [],
    announcements: [], photos: [], packing: [], docs: [], seedVersion: SEED_VERSION,
  };
}

function uid(p: string): string {
  return `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
const now = () => new Date().toISOString();

interface Ctx {
  db: Database;
  // camps
  addCamp: (c: Omit<Camp, 'id'>) => Camp;
  updateCamp: (id: string, patch: Partial<Camp>) => void;
  removeCamp: (id: string) => void;
  addPackingItem: (campId: string, category: string, text: string) => void;
  removePackingItem: (id: string) => void;
  // attendees / rsvp
  invite: (campId: string, who: Partial<Attendee> & { name: string; kind: AttendeeKind }) => Attendee;
  inviteMany: (campId: string, list: (Partial<Attendee> & { name: string; kind: AttendeeKind })[]) => number;
  respond: (attendeeId: string, status: RsvpStatus) => void;
  removeAttendee: (id: string) => void;
  setHealth: (attendeeId: string, health: Health) => void;
  setCheckIn: (attendeeId: string, stage: CheckStage, on: boolean) => void;
  updateAttendee: (id: string, patch: Partial<Attendee>) => void;
  applyCabinPlan: (placements: { attendeeId: string; cabinId: string; roomId?: string }[]) => void;
  applyBusPlan: (placements: { attendeeId: string; busId: string }[]) => void;
  postAnnouncement: (campId: string, a: { title?: string; body: string; audienceKind: AudienceKind; audienceId?: string; audienceIds?: string[]; author: string; pinned?: boolean }) => void;
  removeAnnouncement: (id: string) => void;
  togglePin: (id: string) => void;
  addScheduleItem: (campId: string, s: Omit<ScheduleItem, 'id' | 'campId'>) => void;
  removeScheduleItem: (id: string) => void;
  addPhoto: (campId: string, p: { authorId?: string; authorName: string; dataUrl: string; caption?: string }) => void;
  removePhoto: (id: string) => void;
  addTeam: (campId: string, t: { name: string; color: string }) => void;
  removeTeam: (id: string) => void;
  assignTeam: (attendeeId: string, teamId: string | undefined) => void;
  adjustPoints: (teamId: string, delta: number) => void;
  publishCamp: (id: string, tier: string) => void;
  duplicateCamp: (id: string) => string;
  addDoc: (campId: string, doc: Omit<CampDoc, 'id' | 'campId'>) => void;
  removeDoc: (id: string) => void;
  addMapPin: (campId: string, x: number, y: number, label: string) => void;
  updateMapPin: (campId: string, pinId: string, label: string) => void;
  removeMapPin: (campId: string, pinId: string) => void;
  addSmallGroup: (campId: string, g: { name: string; color: string; leaderName?: string }) => void;
  removeSmallGroup: (id: string) => void;
  updateSmallGroup: (id: string, patch: { name?: string; color?: string; leaderName?: string }) => void;
  assignSmallGroup: (attendeeId: string, groupId: string | undefined) => void;
  autoBalanceSmallGroups: (campId: string) => void;
  addTable: (campId: string, t: { name: string; seats?: number }) => void;
  removeTable: (id: string) => void;
  assignTable: (attendeeId: string, tableId: string | undefined) => void;
  setTableLeader: (attendeeId: string, leader: boolean) => void;
  autoBalanceTables: (campId: string) => void;
  togglePacked: (attendeeId: string, itemId: string) => void;
  addContact: (campId: string, c: { name: string; role?: string; phone?: string; note?: string }) => void;
  removeContact: (id: string) => void;
  autoBalanceTeams: (campId: string) => void;
  // buses
  addBus: (campId: string, bus: Omit<Bus, 'id' | 'campId'>) => void;
  removeBus: (id: string) => void;
  updateBus: (id: string, patch: Partial<Bus>) => void;
  assignBus: (attendeeId: string, busId: string | undefined) => void;
  toggleCaptain: (busId: string, attendeeId: string) => void;
  // Roll call
  emptyBus: (busId: string) => void;
  setOnBoard: (attendeeId: string, on: boolean) => void;
  markAllAboard: (busId: string) => void;
  // cabins
  addCabin: (campId: string, cabin: { name: string; kind: CabinKind; beds?: number }) => void;
  removeCabin: (id: string) => void;
  addRoom: (cabinId: string, room: { name: string; beds: number }) => void;
  removeRoom: (id: string) => void;
  assignCabin: (attendeeId: string, cabinId: string | undefined, roomId?: string) => void;
  setLeader: (attendeeId: string, leader: boolean) => void;
  // roles & shifts
  addRole: (campId: string, role: { name: string; icon?: string; blurb?: string }) => void;
  removeRole: (id: string) => void;
  addShift: (roleId: string, shift: { name: string; start?: string; end?: string }) => void;
  removeShift: (id: string) => void;
  assignDuty: (campId: string, roleId: string, who: { personId?: string; name: string; email?: string; shiftId?: string }) => void;
  removeDuty: (id: string) => void;
  reset: () => void;
}

const C = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { ready, isCloud, user } = useSession();
  const [db, setDb] = useState<Database | null>(null);

  // Load the right workspace: a signed-in organizer's data from Supabase, or the
  // localStorage demo. Re-runs when auth changes (sign in/out) so the store
  // swaps backends cleanly.
  useEffect(() => {
    if (!ready) return;
    let active = true;
    setDb(null);
    if (isCloud) {
      loadCloudDB()
        .then((d) => { if (active) setDb(d); })
        .catch((e) => { console.error('Cloud load failed', e); if (active) setDb(emptyDatabase()); });
    } else {
      loadDB().then((saved) => {
        const fresh = !saved || saved.seedVersion !== SEED_VERSION;
        const next = fresh ? buildSeed() : saved!;
        if (active) setDb(next);
        if (fresh) void saveDB(next);
      });
    }
    return () => { active = false; };
  }, [ready, isCloud, user.id]);

  function commit(fn: (prev: Database) => Database) {
    setDb((prev) => {
      const next = fn(prev as Database);
      void (isCloud ? saveCloudDB(next).catch((e) => console.error('Cloud save failed', e)) : saveDB(next));
      return next;
    });
  }

  if (!ready || !db) return <div className="boot">Loading…</div>;

  const api: Ctx = {
    db,
    addCamp(c) {
      const camp: Camp = { ...c, id: uid('camp') };
      commit((d) => ({ ...d, camps: [...d.camps, camp] }));
      return camp;
    },
    updateCamp(id, patch) {
      commit((d) => ({ ...d, camps: d.camps.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
    },
    addPackingItem(campId, category, text) {
      const item: PackingItem = { id: uid('pk'), campId, category, text };
      commit((d) => ({ ...d, packing: [...(d.packing ?? []), item] }));
    },
    removePackingItem(id) {
      commit((d) => ({ ...d, packing: (d.packing ?? []).filter((p) => p.id !== id) }));
    },
    removeCamp(id) {
      commit((d) => ({
        ...d,
        camps: d.camps.filter((c) => c.id !== id),
        attendees: d.attendees.filter((a) => a.campId !== id),
        buses: d.buses.filter((b) => b.campId !== id),
        cabins: d.cabins.filter((c) => c.campId !== id),
        roles: d.roles.filter((r) => r.campId !== id),
        duties: d.duties.filter((du) => du.campId !== id),
        smallGroups: d.smallGroups.filter((g) => g.campId !== id),
        docs: d.docs.filter((x) => x.campId !== id),
      }));
    },
    invite(campId, who) {
      const a: Attendee = {
        id: uid('att'), campId, name: who.name, kind: who.kind,
        personId: who.personId, email: who.email, role: who.role,
        busId: who.busId, cabinId: who.cabinId, cabinRoomId: who.cabinRoomId, cabinLeader: who.cabinLeader,
        grade: who.grade, gender: who.gender, friends: who.friends,
        status: who.status ?? 'invited', invitedAt: now(),
      };
      commit((d) => ({ ...d, attendees: [...d.attendees, a] }));
      return a;
    },
    inviteMany(campId, list) {
      const batch: Attendee[] = list.map((who) => ({
        id: uid('att'), campId, name: who.name, kind: who.kind,
        personId: who.personId, email: who.email, role: who.role ?? (who.kind === 'camper' ? 'Camper' : undefined),
        grade: who.grade, gender: who.gender, friends: who.friends,
        status: who.status ?? 'invited', invitedAt: now(),
      }));
      commit((d) => ({ ...d, attendees: [...d.attendees, ...batch] }));
      return batch.length;
    },
    respond(attendeeId, status) {
      commit((d) => ({
        ...d,
        attendees: d.attendees.map((a) => (a.id === attendeeId ? { ...a, status, respondedAt: now() } : a)),
      }));
    },
    removeAttendee(id) {
      commit((d) => ({ ...d, attendees: d.attendees.filter((a) => a.id !== id) }));
    },
    setHealth(attendeeId, health) {
      commit((d) => ({ ...d, attendees: d.attendees.map((a) => (a.id === attendeeId ? { ...a, health } : a)) }));
    },
    setCheckIn(attendeeId, stage, on) {
      commit((d) => ({
        ...d,
        attendees: d.attendees.map((a) => (a.id === attendeeId ? { ...a, checkIn: { ...a.checkIn, [stage]: on } } : a)),
      }));
    },
    updateAttendee(id, patch) {
      commit((d) => ({ ...d, attendees: d.attendees.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
    },
    applyCabinPlan(placements) {
      const m = new Map(placements.map((p) => [p.attendeeId, p]));
      commit((d) => ({
        ...d,
        attendees: d.attendees.map((a) => { const p = m.get(a.id); return p ? { ...a, cabinId: p.cabinId, cabinRoomId: p.roomId } : a; }),
      }));
    },
    applyBusPlan(placements) {
      const m = new Map(placements.map((p) => [p.attendeeId, p.busId]));
      commit((d) => ({
        ...d,
        attendees: d.attendees.map((a) => { const b = m.get(a.id); return b ? { ...a, busId: b } : a; }),
      }));
    },
    addBus(campId, bus) {
      const b: Bus = { ...bus, id: uid('bus'), campId };
      commit((d) => ({ ...d, buses: [...d.buses, b] }));
    },
    removeBus(id) {
      commit((d) => ({
        ...d,
        buses: d.buses.filter((b) => b.id !== id),
        attendees: d.attendees.map((a) => (a.busId === id ? { ...a, busId: undefined } : a)),
      }));
    },
    updateBus(id, patch) {
      commit((d) => ({ ...d, buses: d.buses.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
    },
    assignBus(attendeeId, busId) {
      commit((d) => ({ ...d, attendees: d.attendees.map((a) => (a.id === attendeeId ? { ...a, busId } : a)) }));
    },
    toggleCaptain(busId, attendeeId) {
      commit((d) => ({
        ...d,
        buses: d.buses.map((b) => {
          if (b.id !== busId) return b;
          const set = new Set(b.captainIds ?? []);
          set.has(attendeeId) ? set.delete(attendeeId) : set.add(attendeeId);
          return { ...b, captainIds: [...set] };
        }),
      }));
    },
    // Roll call: 'Empty bus' marks every rider off (so a captain re-counts after
    // a stop); tapping a rider toggles them back on.
    emptyBus(busId) {
      commit((d) => ({ ...d, attendees: d.attendees.map((a) => (a.busId === busId ? { ...a, onBoard: false } : a)) }));
    },
    setOnBoard(attendeeId, on) {
      commit((d) => ({ ...d, attendees: d.attendees.map((a) => (a.id === attendeeId ? { ...a, onBoard: on } : a)) }));
    },
    markAllAboard(busId) {
      commit((d) => ({ ...d, attendees: d.attendees.map((a) => (a.busId === busId ? { ...a, onBoard: true } : a)) }));
    },
    addCabin(campId, cabin) {
      const c: Cabin = { id: uid('cabin'), campId, name: cabin.name, kind: cabin.kind, beds: cabin.beds };
      commit((d) => ({ ...d, cabins: [...d.cabins, c] }));
    },
    removeCabin(id) {
      commit((d) => {
        const roomIds = new Set(d.cabinRooms.filter((r) => r.cabinId === id).map((r) => r.id));
        return {
          ...d,
          cabins: d.cabins.filter((c) => c.id !== id),
          cabinRooms: d.cabinRooms.filter((r) => r.cabinId !== id),
          attendees: d.attendees.map((a) =>
            a.cabinId === id || (a.cabinRoomId && roomIds.has(a.cabinRoomId))
              ? { ...a, cabinId: undefined, cabinRoomId: undefined, cabinLeader: undefined }
              : a,
          ),
        };
      });
    },
    addRoom(cabinId, room) {
      const r: CabinRoom = { id: uid('room'), cabinId, name: room.name, beds: room.beds };
      commit((d) => ({ ...d, cabinRooms: [...d.cabinRooms, r] }));
    },
    removeRoom(id) {
      commit((d) => ({
        ...d,
        cabinRooms: d.cabinRooms.filter((r) => r.id !== id),
        attendees: d.attendees.map((a) => (a.cabinRoomId === id ? { ...a, cabinRoomId: undefined } : a)),
      }));
    },
    assignCabin(attendeeId, cabinId, roomId) {
      commit((d) => ({
        ...d,
        attendees: d.attendees.map((a) => (a.id === attendeeId ? { ...a, cabinId, cabinRoomId: cabinId ? roomId : undefined } : a)),
      }));
    },
    setLeader(attendeeId, leader) {
      commit((d) => ({ ...d, attendees: d.attendees.map((a) => (a.id === attendeeId ? { ...a, cabinLeader: leader } : a)) }));
    },
    addRole(campId, role) {
      const r: Role = { id: uid('role'), campId, name: role.name, icon: role.icon, blurb: role.blurb };
      commit((d) => ({ ...d, roles: [...d.roles, r] }));
    },
    removeRole(id) {
      commit((d) => {
        const shiftIds = new Set(d.shifts.filter((s) => s.roleId === id).map((s) => s.id));
        return {
          ...d,
          roles: d.roles.filter((r) => r.id !== id),
          shifts: d.shifts.filter((s) => s.roleId !== id),
          duties: d.duties.filter((du) => du.roleId !== id && !(du.shiftId && shiftIds.has(du.shiftId))),
        };
      });
    },
    addShift(roleId, shift) {
      const s: Shift = { id: uid('shift'), roleId, name: shift.name, start: shift.start, end: shift.end };
      commit((d) => ({ ...d, shifts: [...d.shifts, s] }));
    },
    removeShift(id) {
      commit((d) => ({
        ...d,
        shifts: d.shifts.filter((s) => s.id !== id),
        duties: d.duties.filter((du) => du.shiftId !== id),
      }));
    },
    assignDuty(campId, roleId, who) {
      const du: Duty = { id: uid('duty'), campId, roleId, shiftId: who.shiftId, personId: who.personId, name: who.name, email: who.email };
      commit((d) => ({ ...d, duties: [...d.duties, du] }));
    },
    removeDuty(id) {
      commit((d) => ({ ...d, duties: d.duties.filter((du) => du.id !== id) }));
    },
    postAnnouncement(campId, a) {
      const ann: Announcement = { ...a, id: uid('ann'), campId, createdAt: now() };
      commit((d) => ({ ...d, announcements: [...(d.announcements ?? []), ann] }));
    },
    removeAnnouncement(id) {
      commit((d) => ({ ...d, announcements: (d.announcements ?? []).filter((a) => a.id !== id) }));
    },
    togglePin(id) {
      commit((d) => ({ ...d, announcements: (d.announcements ?? []).map((a) => (a.id === id ? { ...a, pinned: !a.pinned } : a)) }));
    },
    addScheduleItem(campId, s) {
      const item: ScheduleItem = { ...s, id: uid('sch'), campId };
      commit((d) => ({ ...d, schedule: [...(d.schedule ?? []), item] }));
    },
    removeScheduleItem(id) {
      commit((d) => ({ ...d, schedule: (d.schedule ?? []).filter((s) => s.id !== id) }));
    },
    addPhoto(campId, p) {
      const photo: Photo = { ...p, id: uid('ph'), campId, createdAt: now() };
      commit((d) => ({ ...d, photos: [...(d.photos ?? []), photo] }));
    },
    removePhoto(id) {
      commit((d) => ({ ...d, photos: (d.photos ?? []).filter((p) => p.id !== id) }));
    },
    addTeam(campId, t) {
      const team: Team = { id: uid('team'), campId, name: t.name, color: t.color, points: 0 };
      commit((d) => ({ ...d, teams: [...(d.teams ?? []), team] }));
    },
    removeTeam(id) {
      commit((d) => ({
        ...d,
        teams: (d.teams ?? []).filter((t) => t.id !== id),
        attendees: d.attendees.map((a) => (a.teamId === id ? { ...a, teamId: undefined } : a)),
      }));
    },
    assignTeam(attendeeId, teamId) {
      commit((d) => ({ ...d, attendees: d.attendees.map((a) => (a.id === attendeeId ? { ...a, teamId } : a)) }));
    },
    adjustPoints(teamId, delta) {
      commit((d) => ({ ...d, teams: (d.teams ?? []).map((t) => (t.id === teamId ? { ...t, points: Math.max(0, t.points + delta) } : t)) }));
    },
    // Spread campers evenly across the teams (round-robin, grade-interleaved so
    // teams are balanced in size and age). Reassigns everyone for a clean split.
    autoBalanceTeams(campId) {
      commit((d) => {
        const teams = (d.teams ?? []).filter((t) => t.campId === campId);
        if (teams.length === 0) return d;
        const campers = d.attendees
          .filter((a) => a.campId === campId && a.kind === 'camper')
          .sort((a, b) => (a.grade ?? 0) - (b.grade ?? 0) || a.name.localeCompare(b.name));
        const map = new Map<string, string>();
        campers.forEach((c, i) => map.set(c.id, teams[i % teams.length].id));
        return { ...d, attendees: d.attendees.map((a) => (map.has(a.id) ? { ...a, teamId: map.get(a.id) } : a)) };
      });
    },
    // Clone a camp's reusable structure for next year — buses, cabins+rooms,
    // teams (points reset), small groups, roles+shifts, packing, map, links —
    // but NOT the roster, schedule dates, announcements, or publish state.
    duplicateCamp(id) {
      let newId = '';
      commit((d) => {
        const src = d.camps.find((c) => c.id === id);
        if (!src) return d;
        newId = uid('camp');
        const camp: Camp = { ...src, id: newId, name: `${src.name} (copy)`, published: false, publishedAt: undefined, tier: undefined };
        const newBuses = d.buses.filter((b) => b.campId === id).map((b) => ({ ...b, id: uid('bus'), campId: newId }));
        const cabinMap = new Map<string, string>();
        const newCabins = d.cabins.filter((c) => c.campId === id).map((c) => { const nid = uid('cabin'); cabinMap.set(c.id, nid); return { ...c, id: nid, campId: newId }; });
        const newRooms = d.cabinRooms.filter((r) => cabinMap.has(r.cabinId)).map((r) => ({ ...r, id: uid('room'), cabinId: cabinMap.get(r.cabinId)! }));
        const newTeams = d.teams.filter((t) => t.campId === id).map((t) => ({ ...t, id: uid('team'), campId: newId, points: 0 }));
        const newGroups = d.smallGroups.filter((g) => g.campId === id).map((g) => ({ ...g, id: uid('grp'), campId: newId }));
        const roleMap = new Map<string, string>();
        const newRoles = d.roles.filter((r) => r.campId === id).map((r) => { const nid = uid('role'); roleMap.set(r.id, nid); return { ...r, id: nid, campId: newId }; });
        const newShifts = d.shifts.filter((s) => roleMap.has(s.roleId)).map((s) => ({ ...s, id: uid('shift'), roleId: roleMap.get(s.roleId)! }));
        const newPacking = d.packing.filter((p) => p.campId === id).map((p) => ({ ...p, id: uid('pk'), campId: newId }));
        const newDocs = d.docs.filter((x) => x.campId === id).map((x) => ({ ...x, id: uid('doc'), campId: newId }));
        return {
          ...d, camps: [...d.camps, camp],
          buses: [...d.buses, ...newBuses], cabins: [...d.cabins, ...newCabins], cabinRooms: [...d.cabinRooms, ...newRooms],
          teams: [...d.teams, ...newTeams], smallGroups: [...d.smallGroups, ...newGroups],
          roles: [...d.roles, ...newRoles], shifts: [...d.shifts, ...newShifts], packing: [...d.packing, ...newPacking], docs: [...d.docs, ...newDocs],
        };
      });
      return newId;
    },
    addDoc(campId, doc) {
      commit((d) => ({ ...d, docs: [...d.docs, { ...doc, id: uid('doc'), campId }] }));
    },
    removeDoc(id) {
      commit((d) => ({ ...d, docs: d.docs.filter((x) => x.id !== id) }));
    },
    addMapPin(campId, x, y, label) {
      commit((d) => ({ ...d, camps: d.camps.map((c) => (c.id === campId ? { ...c, mapPins: [...(c.mapPins ?? []), { id: uid('pin'), x, y, label }] } : c)) }));
    },
    updateMapPin(campId, pinId, label) {
      commit((d) => ({ ...d, camps: d.camps.map((c) => (c.id === campId ? { ...c, mapPins: (c.mapPins ?? []).map((p) => (p.id === pinId ? { ...p, label } : p)) } : c)) }));
    },
    removeMapPin(campId, pinId) {
      commit((d) => ({ ...d, camps: d.camps.map((c) => (c.id === campId ? { ...c, mapPins: (c.mapPins ?? []).filter((p) => p.id !== pinId) } : c)) }));
    },
    publishCamp(id, tier) {
      commit((d) => ({ ...d, camps: d.camps.map((c) => (c.id === id ? { ...c, published: true, publishedAt: c.publishedAt ?? now(), tier } : c)) }));
    },
    addSmallGroup(campId, g) {
      const group: SmallGroup = { id: uid('grp'), campId, name: g.name, color: g.color, leaderName: g.leaderName };
      commit((d) => ({ ...d, smallGroups: [...d.smallGroups, group] }));
    },
    removeSmallGroup(id) {
      commit((d) => ({
        ...d,
        smallGroups: d.smallGroups.filter((g) => g.id !== id),
        attendees: d.attendees.map((a) => (a.smallGroupId === id ? { ...a, smallGroupId: undefined } : a)),
      }));
    },
    updateSmallGroup(id, patch) {
      commit((d) => ({ ...d, smallGroups: d.smallGroups.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
    },
    assignSmallGroup(attendeeId, groupId) {
      commit((d) => ({ ...d, attendees: d.attendees.map((a) => (a.id === attendeeId ? { ...a, smallGroupId: groupId } : a)) }));
    },
    // Spread campers evenly across small groups (round-robin, grade-interleaved
    // for balanced size and age) — the auto-fill smarts, applied to groups.
    autoBalanceSmallGroups(campId) {
      commit((d) => {
        const groups = d.smallGroups.filter((g) => g.campId === campId);
        if (groups.length === 0) return d;
        const campers = d.attendees
          .filter((a) => a.campId === campId && a.kind === 'camper')
          .sort((a, b) => (a.grade ?? 0) - (b.grade ?? 0) || a.name.localeCompare(b.name));
        const map = new Map<string, string>();
        campers.forEach((c, i) => map.set(c.id, groups[i % groups.length].id));
        return { ...d, attendees: d.attendees.map((a) => (map.has(a.id) ? { ...a, smallGroupId: map.get(a.id) } : a)) };
      });
    },
    addTable(campId, t) {
      const table: Table = { id: uid('tbl'), campId, name: t.name, seats: t.seats };
      commit((d) => ({ ...d, tables: [...(d.tables ?? []), table] }));
    },
    removeTable(id) {
      commit((d) => ({
        ...d,
        tables: (d.tables ?? []).filter((t) => t.id !== id),
        attendees: d.attendees.map((a) => (a.tableId === id ? { ...a, tableId: undefined, tableLeader: undefined } : a)),
      }));
    },
    assignTable(attendeeId, tableId) {
      commit((d) => ({ ...d, attendees: d.attendees.map((a) => (a.id === attendeeId ? { ...a, tableId, tableLeader: tableId ? a.tableLeader : undefined } : a)) }));
    },
    setTableLeader(attendeeId, leader) {
      commit((d) => ({ ...d, attendees: d.attendees.map((a) => (a.id === attendeeId ? { ...a, tableLeader: leader } : a)) }));
    },
    autoBalanceTables(campId) {
      commit((d) => {
        const tables = (d.tables ?? []).filter((t) => t.campId === campId);
        if (tables.length === 0) return d;
        const campers = d.attendees
          .filter((a) => a.campId === campId && a.kind === 'camper')
          .sort((a, b) => (a.grade ?? 0) - (b.grade ?? 0) || a.name.localeCompare(b.name));
        const map = new Map<string, string>();
        campers.forEach((c, i) => map.set(c.id, tables[i % tables.length].id));
        return { ...d, attendees: d.attendees.map((a) => (map.has(a.id) ? { ...a, tableId: map.get(a.id) } : a)) };
      });
    },
    togglePacked(attendeeId, itemId) {
      commit((d) => ({
        ...d,
        attendees: d.attendees.map((a) => {
          if (a.id !== attendeeId) return a;
          const have = a.packed ?? [];
          const packed = have.includes(itemId) ? have.filter((x) => x !== itemId) : [...have, itemId];
          return { ...a, packed };
        }),
      }));
    },
    addContact(campId, c) {
      const contact: Contact = { id: uid('ct'), campId, name: c.name, role: c.role, phone: c.phone, note: c.note };
      commit((d) => ({ ...d, contacts: [...(d.contacts ?? []), contact] }));
    },
    removeContact(id) {
      commit((d) => ({ ...d, contacts: (d.contacts ?? []).filter((c) => c.id !== id) }));
    },
    reset() {
      if (isCloud) return; // demo-only — never touch a real cloud account
      void clearDB();
      setDb(buildSeed());
    },
  };

  return <C.Provider value={api}>{children}</C.Provider>;
}

export function useStore(): Ctx {
  const c = useContext(C);
  if (!c) throw new Error('useStore outside provider');
  return c;
}
