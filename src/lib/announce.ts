import type { Database, Announcement, Attendee } from './types';

// Newest first, pinned on top.
export function announcementsOf(db: Database, campId: string): Announcement[] {
  return (db.announcements ?? [])
    .filter((a) => a.campId === campId)
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt.localeCompare(a.createdAt));
}

// Does this announcement reach a given camper?
export function reaches(ann: Announcement, me: Attendee): boolean {
  switch (ann.audienceKind) {
    case 'everyone': return true;
    case 'bus': return !!me.busId && me.busId === ann.audienceId;
    case 'cabin': return !!me.cabinId && me.cabinId === ann.audienceId;
    case 'person': return ann.audienceId === me.id;
  }
}

// The announcements one camper sees, newest first (pinned on top).
export function announcementsForCamper(db: Database, me: Attendee): Announcement[] {
  return announcementsOf(db, me.campId).filter((a) => reaches(a, me));
}

// Human label for who an announcement targets (organizer view).
export function audienceLabel(db: Database, ann: Announcement): string {
  switch (ann.audienceKind) {
    case 'everyone': return 'Everyone';
    case 'bus': return db.buses.find((b) => b.id === ann.audienceId)?.name ?? 'A bus';
    case 'cabin': return db.cabins.find((c) => c.id === ann.audienceId)?.name ?? 'A cabin';
    case 'person': return db.attendees.find((a) => a.id === ann.audienceId)?.name ?? 'One person';
  }
}
