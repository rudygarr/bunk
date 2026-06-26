import { supabase } from './supabase';
import { SEED_VERSION } from './seed';
import type { Database } from './types';

// ============================================================================
//  Cloud data layer — maps the app's whole-Database object to the normalized
//  Supabase tables (and back). The store keeps working exactly as it does on
//  localStorage; this just gives loadDB/saveDB a cloud implementation for
//  signed-in organizers.
//
//  Field names are plain camelCase<->snake_case EXCEPT a few overrides below,
//  so the mapping stays tiny and hard to get wrong.
// ============================================================================

const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
const toCamel = (s: string) => s.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase());

// Each app collection -> its table, with overrides for the handful of fields
// whose column name isn't a straight snake_case of the property.
interface TableDef {
  coll: keyof Database;       // property on the Database object
  table: string;              // Postgres table
  overrides?: Record<string, string>; // tsField -> column
}

// Ordered parents-before-children so foreign keys are satisfied on upsert.
const TABLES: TableDef[] = [
  { coll: 'camps', table: 'camps' },
  { coll: 'people', table: 'people' },
  { coll: 'cabins', table: 'cabins' },
  { coll: 'cabinRooms', table: 'cabin_rooms' },
  { coll: 'roles', table: 'roles' },
  { coll: 'shifts', table: 'shifts', overrides: { start: 'start_time', end: 'end_time' } },
  { coll: 'buses', table: 'buses' },
  { coll: 'teams', table: 'teams' },
  { coll: 'smallGroups', table: 'small_groups' },
  { coll: 'attendees', table: 'attendees' },
  { coll: 'duties', table: 'duties' },
  { coll: 'schedule', table: 'schedule_items', overrides: { start: 'start_time', end: 'end_time' } },
  { coll: 'announcements', table: 'announcements' },
  { coll: 'photos', table: 'photos' },
  { coll: 'packing', table: 'packing_items', overrides: { text: 'item' } },
  { coll: 'docs', table: 'docs' },
];

function toRow(obj: Record<string, unknown>, overrides: Record<string, string> = {}): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    row[overrides[k] ?? toSnake(k)] = v;
  }
  return row;
}

function fromRow(row: Record<string, unknown>, overrides: Record<string, string> = {}): Record<string, unknown> {
  const inverse: Record<string, string> = {};
  for (const [k, col] of Object.entries(overrides)) inverse[col] = k;
  const obj: Record<string, unknown> = {};
  for (const [col, v] of Object.entries(row)) {
    if (v === null) continue; // null -> absent, so optional fields read as undefined
    obj[inverse[col] ?? toCamel(col)] = v;
  }
  return obj;
}

// Snapshot of what's currently in the cloud, so saves can write just the delta
// (and delete rows the user removed). Refreshed on every load.
let snapshot: Record<string, Record<string, unknown>[]> = {};

// Load the signed-in organizer's entire workspace from the cloud. RLS scopes
// every query to camps they own, so this returns only their data.
export async function loadCloudDB(): Promise<Database> {
  const out: Record<string, unknown> = { users: [], seedVersion: SEED_VERSION };
  snapshot = {};
  for (const t of TABLES) {
    const { data, error } = await supabase.from(t.table).select('*');
    if (error) throw error;
    snapshot[t.table] = data ?? [];
    out[t.coll] = (data ?? []).map((r) => fromRow(r as Record<string, unknown>, t.overrides));
  }
  return out as unknown as Database;
}

// Persist the whole Database. For each table: upsert the current rows and delete
// any that were removed since the last load/save. owner_id is never sent — the
// column defaults to auth.uid() on insert and is left untouched on update.
export async function saveCloudDB(next: Database): Promise<void> {
  for (const t of TABLES) {
    const rows = ((next[t.coll] as unknown as Record<string, unknown>[]) ?? []).map((o) => toRow(o, t.overrides));
    const prev = snapshot[t.table] ?? [];
    const nextIds = new Set(rows.map((r) => r.id));
    const removed = prev.map((r) => r.id).filter((id) => !nextIds.has(id));

    if (rows.length) {
      const { error } = await supabase.from(t.table).upsert(rows);
      if (error) throw error;
    }
    if (removed.length) {
      const { error } = await supabase.from(t.table).delete().in('id', removed as string[]);
      if (error) throw error;
    }
    snapshot[t.table] = rows;
  }
}

// Wipe the in-memory snapshot (e.g. on sign-out) so the next load is fresh.
export function resetCloudSnapshot() {
  snapshot = {};
}
