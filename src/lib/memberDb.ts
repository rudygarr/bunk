import { supabase } from './supabase';
import { SEED_VERSION } from './seed';
import type { Database } from './types';

// Camper (member) cloud access. Campers never touch the tables directly — these
// call the SECURITY DEFINER functions in supabase/member.sql, which return only
// privacy-safe data and accept only the camper's own RSVP / packing writes.

const toCamel = (s: string) => s.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase());

function fromRow(row: Record<string, unknown>, overrides: Record<string, string> = {}): Record<string, unknown> {
  const inverse: Record<string, string> = {};
  for (const [k, col] of Object.entries(overrides)) inverse[col] = k;
  const obj: Record<string, unknown> = {};
  for (const [col, v] of Object.entries(row)) {
    if (v === null) continue;
    obj[inverse[col] ?? toCamel(col)] = v;
  }
  return obj;
}
const conv = (arr: unknown, ov: Record<string, string> = {}) =>
  ((arr as Record<string, unknown>[]) ?? []).map((r) => fromRow(r, ov));

const SCH = { start_time: 'start', end_time: 'end', block_type: 'type' };
const PACK = { item: 'text' };

// Returns the signed-in camper's curated camp as a Database, plus their own id —
// or null if this account isn't a camper in any published camp (e.g. it's an
// organizer, who is loaded the normal way instead).
export async function loadMemberCamp(): Promise<{ db: Database; meId: string } | null> {
  const { data, error } = await supabase.rpc('member_camp');
  if (error) throw error;
  if (!data) return null;
  const p = data as Record<string, unknown>;
  const me = fromRow(p.me as Record<string, unknown>);
  const db = {
    users: [], seedVersion: SEED_VERSION,
    camps: [fromRow(p.camp as Record<string, unknown>)],
    attendees: [me, ...conv(p.attendees)],
    schedule: conv(p.schedule, SCH),
    announcements: conv(p.announcements),
    teams: conv(p.teams),
    smallGroups: conv(p.small_groups),
    tables: conv(p.tables),
    cabins: conv(p.cabins),
    cabinRooms: conv(p.cabin_rooms),
    buses: conv(p.buses),
    packing: conv(p.packing, PACK),
    contacts: conv(p.contacts),
    docs: conv(p.docs),
    // not camper-facing — empty so the app has the shape it expects
    people: [], roles: [], shifts: [], duties: [], photos: [],
  } as unknown as Database;
  return { db, meId: me.id as string };
}

export async function memberRsvp(status: string): Promise<void> {
  const { error } = await supabase.rpc('member_rsvp', { new_status: status });
  if (error) throw error;
}

export async function memberTogglePacked(itemId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('member_toggle_packed', { item_id: itemId });
  if (error) throw error;
  return (data as string[]) ?? [];
}
