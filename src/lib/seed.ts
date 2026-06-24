import type {
  Database, User, Person, Camp, Attendee, Bus, Cabin, CabinRoom, Role, Shift, Duty,
  RsvpStatus, AttendeeKind,
} from './types';

export const SEED_VERSION = 1;

// A small directory you can invite from (demo). Real builds pull this from the
// org's people source.
const people: Person[] = [
  { id: 'p-1', name: 'Rudy Garrido', email: 'rudy@demo.camp', role: 'Director' },
  { id: 'p-2', name: 'Grace Okafor', email: 'grace@demo.camp', role: 'Teacher' },
  { id: 'p-3', name: 'Dan Rivera', email: 'dan@demo.camp', role: 'Coach' },
  { id: 'p-4', name: 'Tara Hill', email: 'tara@demo.camp', role: 'Teacher' },
  { id: 'p-5', name: 'Alan Pierce', email: 'alan@demo.camp', role: 'Coach' },
  { id: 'p-6', name: 'Karen Phillips', email: 'karen@demo.camp', role: 'Nurse' },
  { id: 'p-7', name: 'Mason Reed', email: 'mason@demo.camp', role: 'AV / Production' },
  { id: 'p-8', name: 'Elena Gomez', email: 'elena@demo.camp', role: 'Parent volunteer' },
  { id: 'p-9', name: 'Eli Robinson', email: 'eli@demo.camp', role: 'Student' },
  { id: 'p-10', name: 'Sofia Marin', email: 'sofia@demo.camp', role: 'Student' },
  { id: 'p-11', name: 'Noah Park', email: 'noah@demo.camp', role: 'Student' },
  { id: 'p-12', name: 'Beth Lane', email: 'beth@demo.camp', role: 'Coach' },
];
const pid = (name: string) => people.find((p) => p.name === name)?.id;

const users: User[] = [
  { id: 'u-1', name: 'Rudy Garrido', email: 'rudy@demo.camp', title: 'Camp Director' },
];

const camps: Camp[] = [
  {
    id: 'camp-ww', name: 'Warrior Week', startDate: '2026-09-23', endDate: '2026-09-25',
    location: 'Lake Aurora Retreat', organizer: 'Rudy Garrido', accent: '#1f6f5c',
    blurb: 'Annual high-school overnight retreat — buses, cabins, and a full adult crew.',
  },
  {
    id: 'camp-gr8', name: 'GR8 Escape', startDate: '2026-10-07', endDate: '2026-10-09',
    location: 'Cypress Springs Camp', organizer: 'Middle School Office', accent: '#e08a3c',
    blurb: '8th-grade getaway. Just getting set up — add your buses and cabins.',
  },
];

// ---- builders ----
let bn = 0, cbn = 0, crn = 0, roln = 0, shn = 0, dn = 0, an = 0;
const buses: Bus[] = [];
const cabins: Cabin[] = [];
const cabinRooms: CabinRoom[] = [];
const roles: Role[] = [];
const shifts: Shift[] = [];
const duties: Duty[] = [];
const attendees: Attendee[] = [];

const bus = (campId: string, name: string, label: string, capacity: number, charterOrg: string, departInfo: string) => {
  const id = `bus-${++bn}`;
  buses.push({ id, campId, name, label, capacity, charterOrg, departInfo });
  return id;
};
const cabin = (campId: string, name: string, kind: Cabin['kind'], beds?: number) => {
  const id = `cabin-${++cbn}`;
  cabins.push({ id, campId, name, kind, beds });
  return id;
};
const room = (cabinId: string, name: string, beds: number) => {
  const id = `room-${++crn}`;
  cabinRooms.push({ id, cabinId, name, beds });
  return id;
};
const role = (campId: string, name: string, icon: string, blurb?: string) => {
  const id = `role-${++roln}`;
  roles.push({ id, campId, name, icon, blurb });
  return id;
};
const shift = (roleId: string, name: string, start?: string, end?: string) => {
  const id = `shift-${++shn}`;
  shifts.push({ id, roleId, name, start, end });
  return id;
};
const duty = (campId: string, roleId: string, name: string, o: { email?: string; shiftId?: string } = {}) => {
  duties.push({ id: `duty-${++dn}`, campId, roleId, shiftId: o.shiftId, personId: o.email ? undefined : pid(name), name, email: o.email });
};
type AO = { email?: string; status?: RsvpStatus; role?: string; busId?: string; cabinId?: string; cabinRoomId?: string; cabinLeader?: boolean };
const att = (campId: string, kind: AttendeeKind, name: string, o: AO = {}) => {
  attendees.push({
    id: `att-${++an}`, campId, kind, name,
    personId: o.email ? undefined : pid(name), email: o.email, role: o.role,
    busId: o.busId, cabinId: o.cabinId, cabinRoomId: o.cabinRoomId, cabinLeader: o.cabinLeader,
    status: o.status ?? 'accepted', invitedAt: '2026-09-01T12:00:00Z',
    respondedAt: (o.status ?? 'accepted') === 'invited' ? undefined : '2026-09-02T12:00:00Z',
  });
};

// ===== Warrior Week =====
const wBus1 = bus('camp-ww', 'Bus 1', 'Gold Squad', 30, 'Gold Coast Coach', 'Departs 8:00 AM · Gym Lot');
const wBus2 = bus('camp-ww', 'Bus 2', 'Green Squad', 30, 'Gold Coast Coach', 'Departs 8:00 AM · Gym Lot');

const pine = cabin('camp-ww', 'Pine Lodge', 'student');
const pineA = room(pine, 'Room A', 8);
const pineB = room(pine, 'Room B', 8);
const cedar = cabin('camp-ww', 'Cedar Lodge', 'student', 16);
const maple = cabin('camp-ww', 'Maple Hall', 'staff', 10);
const willow = cabin('camp-ww', 'Willow Cabin', 'parent', 6);
const birch = cabin('camp-ww', 'Birch Cottage', 'guest', 4);

// campers
att('camp-ww', 'camper', 'Eli Robinson', { busId: wBus1, cabinId: pine, cabinRoomId: pineA, role: 'Camper' });
att('camp-ww', 'camper', 'Noah Park', { busId: wBus1, cabinId: pine, cabinRoomId: pineA, role: 'Camper' });
att('camp-ww', 'camper', 'Ava Whitfield', { busId: wBus1, cabinId: pine, cabinRoomId: pineA, role: 'Camper', email: 'ava@demo.camp' });
att('camp-ww', 'camper', 'Sofia Marin', { busId: wBus2, cabinId: cedar, role: 'Camper' });
att('camp-ww', 'camper', 'Maria Soto', { busId: wBus2, cabinId: cedar, role: 'Camper', email: 'maria@demo.camp' });
att('camp-ww', 'camper', 'Caleb Nguyen', { busId: wBus2, cabinId: cedar, role: 'Camper', status: 'invited', email: 'caleb@demo.camp' });
// cabin leaders
att('camp-ww', 'staff', 'Dan Rivera', { busId: wBus1, cabinId: pine, cabinRoomId: pineA, cabinLeader: true, role: 'Cabin Leader' });
att('camp-ww', 'staff', 'Tara Hill', { busId: wBus1, cabinId: pine, cabinRoomId: pineB, cabinLeader: true, role: 'Cabin Leader' });
att('camp-ww', 'staff', 'Alan Pierce', { busId: wBus2, cabinId: cedar, cabinLeader: true, role: 'Cabin Leader' });
// staff, parent, guest
att('camp-ww', 'staff', 'Rudy Garrido', { cabinId: maple, role: 'Director' });
att('camp-ww', 'staff', 'Karen Phillips', { cabinId: maple, role: 'Nurse' });
att('camp-ww', 'parent', 'Elena Gomez', { cabinId: willow, role: 'Parent volunteer', email: 'elena@demo.camp' });
att('camp-ww', 'guest', 'Pastor Mike Allen', { cabinId: birch, role: 'Guest speaker', email: 'mike@demo.camp', status: 'tentative' });

// roles
const prod = role('camp-ww', 'Production', 'ti-broadcast', 'Sound, slides, and stage for evening sessions.');
duty('camp-ww', prod, 'Rudy Garrido');
duty('camp-ww', prod, 'Mason Reed');
const nurse = role('camp-ww', 'Nurse', 'ti-heartbeat', 'On-call for the whole camp.');
duty('camp-ww', nurse, 'Karen Phillips');
const snack = role('camp-ww', 'Snack Station', 'ti-cookie', 'Afternoon and evening snacks.');
duty('camp-ww', snack, 'Elena Gomez', { email: 'elena@demo.camp' });

const monitor = role('camp-ww', 'Bus Monitor', 'ti-bus', 'Ride along and account for every student.');
const mDep = shift(monitor, 'Departure (Wed AM)', '07:30', '10:00');
const mRet = shift(monitor, 'Return (Fri PM)', '14:00', '16:30');
duty('camp-ww', monitor, 'Dan Rivera', { shiftId: mDep });
duty('camp-ww', monitor, 'Tara Hill', { shiftId: mDep });
duty('camp-ww', monitor, 'Dan Rivera', { shiftId: mRet });

const kitchen = role('camp-ww', 'Kitchen Helper', 'ti-tools', 'Serve and clean up at meals.');
const kB = shift(kitchen, 'Breakfast', '06:30', '08:30');
const kL = shift(kitchen, 'Lunch', '11:30', '13:30');
const kD = shift(kitchen, 'Dinner', '17:00', '19:00');
duty('camp-ww', kitchen, 'Alan Pierce', { shiftId: kB });
duty('camp-ww', kitchen, 'Elena Gomez', { email: 'elena@demo.camp', shiftId: kL });
duty('camp-ww', kitchen, 'Alan Pierce', { shiftId: kD });

const guard = role('camp-ww', 'Lifeguard', 'ti-swimming', 'Required whenever the lake is open.');
const gAM = shift(guard, 'Free time — morning', '10:30', '12:00');
shift(guard, 'Free time — afternoon', '15:00', '17:00'); // left unfilled (coverage gap)
duty('camp-ww', guard, 'Dan Rivera', { shiftId: gAM });

export function buildSeed(): Database {
  return {
    users, people, camps,
    attendees: [...attendees], buses: [...buses], cabins: [...cabins], cabinRooms: [...cabinRooms],
    roles: [...roles], shifts: [...shifts], duties: [...duties],
    seedVersion: SEED_VERSION,
  };
}
