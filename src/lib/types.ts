// Bunk's data model. The top-level entity is a Camp; everything else hangs off
// it. This is a standalone product, so the camp — not a school "event" — is the
// thing you open.

export type RsvpStatus = 'invited' | 'accepted' | 'declined' | 'tentative';
export type AttendeeKind = 'camper' | 'staff' | 'parent' | 'guest';
export type CabinKind = 'student' | 'staff' | 'parent' | 'guest';
export type Gender = 'male' | 'female' | 'other';

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
  kind: AttendeeKind;
  role?: string; // free label e.g. "Cabin Leader", "Camper"
  status: RsvpStatus;
  busId?: string;
  cabinId?: string;
  cabinRoomId?: string;
  cabinLeader?: boolean;
  // Inputs the auto-fill algorithm sorts on (all optional).
  grade?: number; // school grade / age band
  gender?: Gender; // for gender-specific cabins
  friends?: string; // requested bunkmate name(s), comma-separated
  invitedAt: string;
  respondedAt?: string;
  health?: Health;
  // Day-of accountability — stamped when checked in at each stage (see lib/camps).
  checkIn?: Partial<Record<CheckStage, boolean>>;
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

export interface Bus {
  id: string;
  campId: string;
  name: string; // "Bus 1"
  label?: string; // "Coral Crew"
  capacity?: number;
  charterOrg?: string; // these are rental buses
  departInfo?: string;
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

export interface Database {
  users: User[];
  people: Person[];
  camps: Camp[];
  attendees: Attendee[];
  buses: Bus[];
  cabins: Cabin[];
  cabinRooms: CabinRoom[];
  roles: Role[];
  shifts: Shift[];
  duties: Duty[];
  seedVersion: number;
}
