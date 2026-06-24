import type { Database, Announcement, Attendee, AudienceKind } from './types';

// Shared audience test — does a camper fall inside everyone / a bus / a cabin /
// a person? Used by both announcements and the schedule.
export function inAudience(me: Attendee, kind: AudienceKind, audienceId?: string): boolean {
  switch (kind) {
    case 'everyone': return true;
    case 'bus': return !!me.busId && me.busId === audienceId;
    case 'cabin': return !!me.cabinId && me.cabinId === audienceId;
    case 'person': return audienceId === me.id;
  }
}

// Newest first, pinned on top.
export function announcementsOf(db: Database, campId: string): Announcement[] {
  return (db.announcements ?? [])
    .filter((a) => a.campId === campId)
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt.localeCompare(a.createdAt));
}

// Does this announcement reach a given camper?
export function reaches(ann: Announcement, me: Attendee): boolean {
  return inAudience(me, ann.audienceKind, ann.audienceId);
}

// The announcements one camper sees, newest first (pinned on top).
export function announcementsForCamper(db: Database, me: Attendee): Announcement[] {
  return announcementsOf(db, me.campId).filter((a) => reaches(a, me));
}

// Human label for who an announcement/schedule item targets (organizer view).
export function audienceLabel(db: Database, a: { audienceKind: AudienceKind; audienceId?: string }): string {
  switch (a.audienceKind) {
    case 'everyone': return 'Everyone';
    case 'bus': return db.buses.find((b) => b.id === a.audienceId)?.name ?? 'A bus';
    case 'cabin': return db.cabins.find((c) => c.id === a.audienceId)?.name ?? 'A cabin';
    case 'person': return db.attendees.find((x) => x.id === a.audienceId)?.name ?? 'One person';
  }
}
