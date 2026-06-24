import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type {
  Database, Camp, Attendee, Bus, Cabin, CabinRoom, Role, Shift, Duty,
  RsvpStatus, AttendeeKind, CabinKind,
} from './types';
import { buildSeed, SEED_VERSION } from './seed';
import { loadDB, saveDB, clearDB } from './persistence';

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
  // attendees / rsvp
  invite: (campId: string, who: Partial<Attendee> & { name: string; kind: AttendeeKind }) => Attendee;
  respond: (attendeeId: string, status: RsvpStatus) => void;
  removeAttendee: (id: string) => void;
  // buses
  addBus: (campId: string, bus: Omit<Bus, 'id' | 'campId'>) => void;
  removeBus: (id: string) => void;
  assignBus: (attendeeId: string, busId: string | undefined) => void;
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
  const [db, setDb] = useState<Database | null>(null);

  useEffect(() => {
    loadDB().then((saved) => {
      const fresh = !saved || saved.seedVersion !== SEED_VERSION;
      const next = fresh ? buildSeed() : saved!;
      setDb(next);
      if (fresh) void saveDB(next);
    });
  }, []);

  function commit(fn: (prev: Database) => Database) {
    setDb((prev) => {
      const next = fn(prev as Database);
      void saveDB(next);
      return next;
    });
  }

  if (!db) return <div className="boot">Loading…</div>;

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
    removeCamp(id) {
      commit((d) => ({
        ...d,
        camps: d.camps.filter((c) => c.id !== id),
        attendees: d.attendees.filter((a) => a.campId !== id),
        buses: d.buses.filter((b) => b.campId !== id),
        cabins: d.cabins.filter((c) => c.campId !== id),
        roles: d.roles.filter((r) => r.campId !== id),
        duties: d.duties.filter((du) => du.campId !== id),
      }));
    },
    invite(campId, who) {
      const a: Attendee = {
        id: uid('att'), campId, name: who.name, kind: who.kind,
        personId: who.personId, email: who.email, role: who.role,
        busId: who.busId, cabinId: who.cabinId, cabinRoomId: who.cabinRoomId, cabinLeader: who.cabinLeader,
        status: 'invited', invitedAt: now(),
      };
      commit((d) => ({ ...d, attendees: [...d.attendees, a] }));
      return a;
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
    assignBus(attendeeId, busId) {
      commit((d) => ({ ...d, attendees: d.attendees.map((a) => (a.id === attendeeId ? { ...a, busId } : a)) }));
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
    reset() {
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
