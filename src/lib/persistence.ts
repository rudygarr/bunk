import type { Database } from './types';

// The one file to swap for a real backend. The whole app reads/writes the DB
// through these async functions; the demo uses localStorage so edits survive a
// refresh. Replace the bodies with REST/DB calls and nothing else changes.
const KEY = 'camphq-db-v1';

export async function loadDB(): Promise<Database | null> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Database) : null;
  } catch {
    return null;
  }
}

export async function saveDB(db: Database): Promise<void> {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* storage full/unavailable — keep working in memory */
  }
}

export async function clearDB(): Promise<void> {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
