import type { Database, Attendee } from './types';

// Normalize a typed email/phone for matching: lowercase emails, strip
// non-digits from phones.
function norm(contact: string): { email: string; phone: string } {
  const t = contact.trim().toLowerCase();
  return { email: t, phone: t.replace(/[^0-9]/g, '') };
}

// Find a camper's account by the email or phone they type at login. Returns the
// soonest-upcoming attendee row if they're in more than one camp.
export function findCamperByContact(db: Database, contact: string): Attendee | null {
  const { email, phone } = norm(contact);
  if (!email && !phone) return null;
  const matches = db.attendees.filter((a) => {
    // Directory account email lives on the linked person; ad-hoc invites carry
    // their own email/phone on the attendee row.
    const personEmail = a.personId ? db.people.find((p) => p.id === a.personId)?.email?.toLowerCase() : undefined;
    const byEmail = !!email && ((a.email && a.email.trim().toLowerCase() === email) || personEmail === email);
    const byPhone = phone.length >= 7 && a.phone && a.phone.replace(/[^0-9]/g, '') === phone;
    return byEmail || byPhone;
  });
  if (matches.length === 0) return null;
  const campStart = (a: Attendee) => db.camps.find((c) => c.id === a.campId)?.startDate ?? '9999';
  return matches.sort((x, y) => campStart(x).localeCompare(campStart(y)))[0];
}

export function cabinmates(db: Database, me: Attendee): Attendee[] {
  if (!me.cabinId) return [];
  return db.attendees.filter((a) => a.id !== me.id && a.cabinId === me.cabinId);
}
export function busmates(db: Database, me: Attendee): Attendee[] {
  if (!me.busId) return [];
  return db.attendees.filter((a) => a.id !== me.id && a.busId === me.busId);
}
