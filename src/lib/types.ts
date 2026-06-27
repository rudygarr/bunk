// CampHQ's data model. The top-level entity is a Camp; everything else hangs off
// it. This is a standalone product, so the camp — not a school "event" — is the
// thing you open.

export type RsvpStatus = 'invited' | 'accepted' | 'declined' | 'tentative';
export type AttendeeKind = 'camper' | 'staff' | 'parent' | 'guest';
export type CabinKind = 'student' | 'staff' | 'parent' | 'guest';
export type Gender = 'male' | 'female' | 'other';
// How someone travels to camp — buses are just one option.
export type TravelMode = 'bus' | 'car' | 'plane' | 'onsite' | 'na' | 'other';

// Modular features an organizer turns on per camp (in the setup wizard, and
// editable later). Roster + Overview are always on, so they aren't listed here.
export type FeatureKey =
  | 'buses' | 'cabins' | 'smallGroups' | 'teams' | 'roles'
  | 'schedule' | 'announce' | 'photos' | 'info' | 'attendance' | 'tables';

// A known person in the directory you can invite from (vs. an ad-hoc email).
export interface Person {
  id: string;
  name: string;
  email: string;
  role?: string; // "Teacher", "Coach", "Student", "Volunteer"
}

// A user who can sign in and run camps (fake auth for the demo).
export interface User {
  id: string;
  name: string;
  email: string;
  title: string; // "Camp Director", "Coordinator"
}

export interface Camp {
  id: string;
  name: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;
  location: string;
  organizer: string;
  blurb?: string;
  accent?: string; // a brand color per camp
  logoUrl?: string; // the camp's own logo (shown on camper app, viewer, RSVP/join)
  mapUrl?: string; // camp map image (data URL in the demo)
  mapPins?: MapPin[]; // labeled markers placed on the map
  departInfo?: string; // staggered departure / check-in details
  contact?: string; // who to reach with questions
  kickoff?: string; // ISO datetime of the first departure — drives the countdown
  kickoffLabel?: string; // what happens at kickoff, e.g. "Seniors & Student Leadership depart"
  captainsChatUrl?: string; // link-out to the bus captains' group chat (WhatsApp/iMessage)
  // Enabled modules. Undefined = legacy camp with everything on; an array means
  // only those features show (set in the setup wizard, editable in settings).
  features?: FeatureKey[];
  photoAlbumUrl?: string; // link-out to an external shared album (iCloud/Google)
  // Publish lifecycle (the per-camp pay-to-publish model). A camp is built free
  // as a draft; publishing starts a 60-day live window.
  published?: boolean;
  publishedAt?: string; // ISO — start of the 60-day window
  tier?: string; // billing tier id locked at publish
  defaultTravel?: TravelMode; // most people travel this way; overridden per person
}

// An uploaded or linked document in the camp's files library — designed
// schedule PDF, official map, packing list, consent forms, parent letter, etc.
// Tagged with who it's for, which decides where it shows.
export type DocAudience = 'everyone' | 'campers' | 'staff';
export interface CampDoc {
  id: string;
  campId: string;
  title: string;
  url: string; // data URL (uploaded) or external link
  external: boolean; // true = link out (not hosted)
  fileType: 'pdf' | 'image' | 'doc' | 'link';
  audience: DocAudience;
  category?: string;
}

// A labeled marker on the camp map. x/y are percentages (0–100) of the image,
// so they stay correct at any display size.
export interface MapPin {
  id: string;
  x: number;
  y: number;
  label: string;
}

// A small group (discipleship/activity group) — a grouping alongside bus, cabin,
// and team. Campers belong to one; a leader runs it.
export interface SmallGroup {
  id: string;
  campId: string;
  name: string;
  color: string;
  leaderName?: string;
}

// An assigned meal-seating table. Members + table leaders are attendees
// (attendee.tableId / attendee.tableLeader), like cabins.
export interface Table {
  id: string;
  campId: string;
  name: string; // "Table 5"
  seats?: number;
}

// A who-to-call entry (Logistics). Includes people not on the roster — the
// venue's facilities manager, the camp ranger, the front office.
export interface Contact {
  id: string;
  campId: string;
  name: string;
  role?: string; // "Nurse", "Front office", "Venue facilities"
  phone?: string;
  note?: string;
}

// One line on a camp's packing checklist, grouped by category.
export interface PackingItem {
  id: string;
  campId: string;
  category: string;
  text: string;
}

// One person attending a camp — camper or adult — with their RSVP and the
// logistics layered on (bus, cabin, leader flag). Internal (personId) or
// external (email only, no account → public RSVP link).
export interface Attendee {
  id: string;
  campId: string;
  personId?: string;
  name: string;
  email?: string;
  phone?: string;
  // Camper-app login (demo only — plaintext; a real build hashes server-side).
  // They log in by email/phone and set this on first sign-in.
  password?: string;
  kind: AttendeeKind;
  role?: string; // free label e.g. "Cabin Leader", "Camper"
  status: RsvpStatus;
  busId?: string;
  // How this person gets to camp. Falls back to the camp's default travel mode
  // when unset. 'bus' uses busId; 'plane' can carry a flight number + pickup note.
  travelMode?: TravelMode;
  flightNo?: string;
  travelNote?: string; // arrival details, who's picking them up, etc.
  cabinId?: string;
  cabinRoomId?: string;
  cabinLeader?: boolean;
  teamId?: string; // competitive team (Warrior Week-style games)
  smallGroupId?: string; // discipleship / activity small group
  tableId?: string; // assigned meal-seating table
  tableLeader?: boolean; // a table host/leader (multiple allowed per table)
  // Inputs the auto-fill algorithm sorts on (all optional).
  grade?: number; // school grade / age band
  gender?: Gender; // for gender-specific cabins
  friends?: string; // requested bunkmate name(s), comma-separated
  invitedAt: string;
  respondedAt?: string;
  health?: Health;
  // Day-of accountability — stamped when checked in at each stage (see lib/camps).
  checkIn?: Partial<Record<CheckStage, boolean>>;
  // Roll-call state during the ride: true once a captain has counted them on
  // board. 'Empty bus' clears it for everyone on the bus; undefined = not yet
  // counted this round. (See lib/rollcall.)
  onBoard?: boolean;
  // Packing checklist progress — ids of the camp's packing items this person
  // has checked off ("Are you packed?").
  packed?: string[];
}

// Safety info the nurse and cabin leaders need at a glance. All optional; an
// attendee with allergies or meds is "flagged" on the roster.
export interface Health {
  allergies?: string;
  meds?: string;
  dietary?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  notes?: string;
}

// Stages of the day-of roll call.
export type CheckStage = 'depart' | 'onsite' | 'return';

// A competitive team that earns points across the week (optional per camp).
export interface Team {
  id: string;
  campId: string;
  name: string;
  color: string;
  points: number;
}

export interface Bus {
  id: string;
  campId: string;
  name: string; // "Bus 1"
  label?: string; // "Coral Crew"
  capacity?: number;
  charterOrg?: string; // these are rental buses
  departInfo?: string;
  captainIds?: string[]; // attendees who run roll call for this bus (1–5)
  groupName?: string; // departure wave / band, e.g. "Seniors (Day 1)", "Staff"
  trackingUrl?: string; // link-out to live location (Life360 etc.)
}

export interface Cabin {
  id: string;
  campId: string;
  name: string;
  kind: CabinKind;
  beds?: number; // simple mode; when the cabin has rooms, beds come from them
  gender?: Gender; // gender-specific cabin (auto-fill matches campers to it)
}
export interface CabinRoom {
  id: string;
  cabinId: string;
  name: string;
  beds: number;
}

export interface Role {
  id: string;
  campId: string;
  name: string;
  icon?: string;
  blurb?: string;
}
export interface Shift {
  id: string;
  roleId: string;
  name: string;
  start?: string;
  end?: string;
}
export interface Duty {
  id: string;
  campId: string;
  roleId: string;
  shiftId?: string;
  personId?: string;
  name: string;
  email?: string;
}

// An announcement the organizer posts, scoped to who should see it: the whole
// camp, one bus, one cabin, or a single person.
export type AudienceKind = 'everyone' | 'bus' | 'cabin' | 'team' | 'smallGroup' | 'volunteers' | 'person' | 'custom';
export interface Announcement {
  id: string;
  campId: string;
  title?: string;
  body: string;
  audienceKind: AudienceKind;
  audienceId?: string; // busId | cabinId | teamId | smallGroupId | attendeeId, per kind
  audienceIds?: string[]; // hand-picked recipients when audienceKind === 'custom'
  author: string;
  pinned?: boolean;
  createdAt: string;
}

// One block on the camp schedule. Reuses the announcement audience scoping so a
// session can be camp-wide or aimed at a bus/cabin/person (activity rotations).
// The kind of block — gives "the Day" its typology (icon + grouping). Meals get
// a full planning module behind them; the rest are lightweight typed entries.
export type ScheduleBlockType = 'activity' | 'meal' | 'gathering' | 'travel' | 'free';

export interface ScheduleItem {
  id: string;
  campId: string;
  day: string; // "YYYY-MM-DD"
  start: string; // "HH:MM"
  end?: string;
  title: string;
  location?: string;
  audienceKind: AudienceKind;
  audienceId?: string;
  type?: ScheduleBlockType; // absent = activity
  // Meal blocks: the menu campers always ask about + an optional dress-up theme.
  menu?: string;
  theme?: string;
}

// A photo posted to the camp feed (camper, staff, or organizer). Image is a
// downscaled data URL in the demo; a real build uploads to object storage.
export interface Photo {
  id: string;
  campId: string;
  authorId?: string; // attendee id, or undefined for the organizer
  authorName: string;
  dataUrl: string;
  caption?: string;
  createdAt: string;
}

export interface Database {
  users: User[];
  people: Person[];
  camps: Camp[];
  attendees: Attendee[];
  teams: Team[];
  smallGroups: SmallGroup[];
  tables: Table[];
  contacts: Contact[];
  docs: CampDoc[];
  announcements: Announcement[];
  schedule: ScheduleItem[];
  photos: Photo[];
  packing: PackingItem[];
  buses: Bus[];
  cabins: Cabin[];
  cabinRooms: CabinRoom[];
  roles: Role[];
  shifts: Shift[];
  duties: Duty[];
  seedVersion: number;
}
