import type {
  Database, User, Person, Camp, Attendee, Bus, Cabin, CabinRoom, Role, Shift, Duty,
  RsvpStatus, AttendeeKind, Health, Gender, Announcement, ScheduleItem, Photo, Team,
} from './types';

export const SEED_VERSION = 7;

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
const cabin = (campId: string, name: string, kind: Cabin['kind'], beds?: number, gender?: Cabin['gender']) => {
  const id = `cabin-${++cbn}`;
  cabins.push({ id, campId, name, kind, beds, gender });
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
type AO = { email?: string; status?: RsvpStatus; role?: string; busId?: string; cabinId?: string; cabinRoomId?: string; cabinLeader?: boolean; health?: Health; grade?: number; gender?: Gender; friends?: string; teamId?: string };
const att = (campId: string, kind: AttendeeKind, name: string, o: AO = {}) => {
  attendees.push({
    id: `att-${++an}`, campId, kind, name,
    personId: o.email ? undefined : pid(name), email: o.email, role: o.role,
    busId: o.busId, cabinId: o.cabinId, cabinRoomId: o.cabinRoomId, cabinLeader: o.cabinLeader, teamId: o.teamId,
    health: o.health, grade: o.grade, gender: o.gender, friends: o.friends,
    status: o.status ?? 'accepted', invitedAt: '2026-09-01T12:00:00Z',
    respondedAt: (o.status ?? 'accepted') === 'invited' ? undefined : '2026-09-02T12:00:00Z',
  });
};

// ===== Warrior Week =====
const wBus1 = bus('camp-ww', 'Bus 1', 'Gold Squad', 30, 'Gold Coast Coach', 'Departs 8:00 AM · Gym Lot');
const wBus2 = bus('camp-ww', 'Bus 2', 'Green Squad', 30, 'Gold Coast Coach', 'Departs 8:00 AM · Gym Lot');

const pine = cabin('camp-ww', 'Pine Lodge', 'student', undefined, 'male');
const pineA = room(pine, 'Room A', 8);
const pineB = room(pine, 'Room B', 8);
const cedar = cabin('camp-ww', 'Cedar Lodge', 'student', 16, 'female');
const maple = cabin('camp-ww', 'Maple Hall', 'staff', 10);
const willow = cabin('camp-ww', 'Willow Cabin', 'parent', 6);
const birch = cabin('camp-ww', 'Birch Cottage', 'guest', 4);

// Competitive teams — students compete in games all week.
const teams: Team[] = [
  { id: 'team-1', campId: 'camp-ww', name: 'Crimson', color: '#c0392b', points: 240 },
  { id: 'team-2', campId: 'camp-ww', name: 'Cobalt', color: '#2563a8', points: 315 },
  { id: 'team-3', campId: 'camp-ww', name: 'Emerald', color: '#1f8a4c', points: 185 },
  { id: 'team-4', campId: 'camp-ww', name: 'Gold', color: '#d99a1c', points: 280 },
];
const [T1, T2, T3, T4] = ['team-1', 'team-2', 'team-3', 'team-4'];

// campers already housed (boys in Pine, girls in Cedar)
att('camp-ww', 'camper', 'Eli Robinson', { busId: wBus1, cabinId: pine, cabinRoomId: pineA, role: 'Camper', grade: 10, gender: 'male', teamId: T1, health: { allergies: 'Peanuts (EpiPen in his bag)', emergencyName: 'Donna Robinson', emergencyPhone: '(305) 555-0142' } });
att('camp-ww', 'camper', 'Noah Park', { busId: wBus1, cabinId: pine, cabinRoomId: pineA, role: 'Camper', grade: 10, gender: 'male', teamId: T2, health: { meds: 'Inhaler — albuterol, as needed', dietary: 'Vegetarian', emergencyName: 'Grace Park', emergencyPhone: '(305) 555-0177' } });
att('camp-ww', 'camper', 'Caleb Nguyen', { busId: wBus1, cabinId: pine, cabinRoomId: pineA, role: 'Camper', grade: 10, gender: 'male', teamId: T3, email: 'caleb@demo.camp' });
att('camp-ww', 'camper', 'Sofia Marin', { busId: wBus2, cabinId: cedar, role: 'Camper', grade: 11, gender: 'female', teamId: T4 });
att('camp-ww', 'camper', 'Maria Soto', { busId: wBus2, cabinId: cedar, role: 'Camper', grade: 11, gender: 'female', teamId: T1, email: 'maria@demo.camp', health: { allergies: 'Bee stings', emergencyName: 'Rosa Soto', emergencyPhone: '(305) 555-0188' } });
att('camp-ww', 'camper', 'Ava Whitfield', { busId: wBus2, cabinId: cedar, role: 'Camper', grade: 11, gender: 'female', teamId: T2, email: 'ava@demo.camp', health: { dietary: 'Gluten-free', emergencyName: 'Mark Whitfield', emergencyPhone: '(786) 555-0119' } });
// cabin leaders
att('camp-ww', 'staff', 'Dan Rivera', { busId: wBus1, cabinId: pine, cabinRoomId: pineA, cabinLeader: true, role: 'Cabin Leader', gender: 'male' });
att('camp-ww', 'staff', 'Alan Pierce', { busId: wBus1, cabinId: pine, cabinRoomId: pineB, cabinLeader: true, role: 'Cabin Leader', gender: 'male' });
att('camp-ww', 'staff', 'Tara Hill', { busId: wBus2, cabinId: cedar, cabinLeader: true, role: 'Cabin Leader', gender: 'female' });
// NOT yet housed — newly registered campers for the smart auto-fill demo.
// Boys (→ Pine), with a friend request pair and mixed grades.
att('camp-ww', 'camper', 'Jake Miller', { busId: wBus1, role: 'Camper', grade: 10, gender: 'male', teamId: T3, friends: 'Tyler Brooks' });
att('camp-ww', 'camper', 'Tyler Brooks', { role: 'Camper', grade: 10, gender: 'male', teamId: T4, friends: 'Jake Miller' });
att('camp-ww', 'camper', 'Sam Cohen', { role: 'Camper', grade: 9, gender: 'male', teamId: T1 });
att('camp-ww', 'camper', 'Marcus Lee', { role: 'Camper', grade: 11, gender: 'male', teamId: T2, email: 'marcus@demo.camp' });
// Girls (→ Cedar), with a friend request pair.
att('camp-ww', 'camper', 'Emma Davis', { busId: wBus2, role: 'Camper', grade: 10, gender: 'female', teamId: T3, friends: 'Lily Chen' });
att('camp-ww', 'camper', 'Lily Chen', { role: 'Camper', grade: 10, gender: 'female', teamId: T4, friends: 'Emma Davis' });
att('camp-ww', 'camper', 'Grace Kim', { role: 'Camper', grade: 9, gender: 'female', teamId: T1 });
att('camp-ww', 'camper', 'Hannah Ruiz', { role: 'Camper', grade: 11, gender: 'female', teamId: T2, email: 'hannah@demo.camp' });
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

// Announcements scoped to everyone / a bus / a cabin / one person. Bus 1 =
// 'bus-1', Cedar = 'cabin-2', Eli's attendee row = 'att-1'.
const announcements: Announcement[] = [
  { id: 'ann-1', campId: 'camp-ww', title: 'Packing list is up!', body: 'Sleeping bag, towel, water bottle, closed-toe shoes, and a light jacket — nights at the lake get cool. No electronics, please.', audienceKind: 'everyone', author: 'Rudy Garrido', pinned: true, createdAt: '2026-09-18T15:00:00Z' },
  { id: 'ann-2', campId: 'camp-ww', body: 'Bus 1 (Gold Squad) loads at 7:45 and pulls out at 8:00 sharp from the gym lot. Don’t be late!', audienceKind: 'bus', audienceId: 'bus-1', author: 'Dan Rivera', createdAt: '2026-09-21T12:00:00Z' },
  { id: 'ann-3', campId: 'camp-ww', body: 'Cedar Lodge crew — the AC runs cold, bring an extra blanket. Lights out is 10:30.', audienceKind: 'cabin', audienceId: 'cabin-2', author: 'Tara Hill', createdAt: '2026-09-21T18:00:00Z' },
  { id: 'ann-4', campId: 'camp-ww', body: 'Eli — your mom dropped your inhaler at the front office. Grab it from Nurse Karen when you arrive.', audienceKind: 'person', audienceId: 'att-1', author: 'Karen Phillips', createdAt: '2026-09-22T09:30:00Z' },
];

// A 3-day Warrior Week schedule (Wed–Fri). Mostly camp-wide, with one
// cabin-scoped activity rotation to show audience-aware scheduling.
const D1 = '2026-09-23', D2 = '2026-09-24', D3 = '2026-09-25';
let scn = 0;
const sch = (day: string, start: string, end: string, title: string, location?: string, audienceKind: ScheduleItem['audienceKind'] = 'everyone', audienceId?: string): ScheduleItem =>
  ({ id: `sch-${++scn}`, campId: 'camp-ww', day, start, end, title, location, audienceKind, audienceId });
const schedule: ScheduleItem[] = [
  sch(D1, '08:00', '09:30', 'Buses depart & travel', 'Gym lot'),
  sch(D1, '10:00', '11:00', 'Arrival & cabin check-in', 'Main lodge'),
  sch(D1, '12:00', '13:00', 'Lunch', 'Dining hall'),
  sch(D1, '13:30', '15:30', 'Cabin activity — high ropes', 'Ropes course', 'cabin', 'cabin-1'),
  sch(D1, '13:30', '15:30', 'Cabin activity — lake canoes', 'Waterfront', 'cabin', 'cabin-2'),
  sch(D1, '18:00', '19:00', 'Dinner', 'Dining hall'),
  sch(D1, '20:00', '21:30', 'Opening session & worship', 'Pavilion'),
  sch(D1, '22:30', '', 'Lights out'),
  sch(D2, '07:30', '08:30', 'Breakfast', 'Dining hall'),
  sch(D2, '09:00', '10:00', 'Morning session', 'Pavilion'),
  sch(D2, '10:30', '12:00', 'Free time — lake & games', 'Waterfront'),
  sch(D2, '12:30', '13:30', 'Lunch', 'Dining hall'),
  sch(D2, '14:00', '17:00', 'Team challenge & field games', 'Field'),
  sch(D2, '18:00', '19:00', 'Dinner', 'Dining hall'),
  sch(D2, '20:00', '22:00', 'Campfire & worship night', 'Fire ring'),
  sch(D2, '22:30', '', 'Lights out'),
  sch(D3, '07:30', '08:30', 'Breakfast & pack up', 'Dining hall'),
  sch(D3, '09:00', '10:30', 'Closing session', 'Pavilion'),
  sch(D3, '11:00', '12:00', 'Clean cabins & load buses', 'Cabins'),
  sch(D3, '14:00', '16:30', 'Buses return home', 'Gym lot'),
];

// Seed feed photos as gradient placeholders (no binary assets in the repo); real
// posts are downscaled camera photos.
const grad = (c1: string, c2: string, emoji: string) =>
  'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><text x="400" y="340" font-size="160" text-anchor="middle">${emoji}</text></svg>`);
const photos: Photo[] = [
  { id: 'ph-1', campId: 'camp-ww', authorId: 'att-1', authorName: 'Eli Robinson', dataUrl: grad('#1f6f5c', '#3a9b81', '🏕️'), caption: 'Cabin Pine, checking in!', createdAt: '2026-09-23T11:30:00Z' },
  { id: 'ph-2', campId: 'camp-ww', authorId: 'att-4', authorName: 'Sofia Marin', dataUrl: grad('#2563a8', '#5aa2e8', '🛶'), caption: 'Canoes on the lake 💦', createdAt: '2026-09-23T15:10:00Z' },
  { id: 'ph-3', campId: 'camp-ww', authorName: 'Rudy Garrido', dataUrl: grad('#e08a3c', '#c0392b', '🔥'), caption: 'Campfire night — what a worship set.', createdAt: '2026-09-24T21:15:00Z' },
];

export function buildSeed(): Database {
  return {
    users, people, camps, teams: [...teams], announcements: [...announcements], schedule: [...schedule], photos: [...photos],
    attendees: [...attendees], buses: [...buses], cabins: [...cabins], cabinRooms: [...cabinRooms],
    roles: [...roles], shifts: [...shifts], duties: [...duties],
    seedVersion: SEED_VERSION,
  };
}
