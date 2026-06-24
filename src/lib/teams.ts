import type { Database, Team, Attendee } from './types';

export function teamsOf(db: Database, campId: string): Team[] {
  return db.teams.filter((t) => t.campId === campId);
}

// Teams ranked by points (the standings/leaderboard).
export function standings(db: Database, campId: string): Team[] {
  return teamsOf(db, campId).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
}

export function teamRoster(db: Database, teamId: string): Attendee[] {
  return db.attendees.filter((a) => a.teamId === teamId);
}

export function teamOf(db: Database, a: Attendee): Team | undefined {
  return a.teamId ? db.teams.find((t) => t.id === a.teamId) : undefined;
}

// A team's place in the standings (1-based), and the field size.
export function placeOf(db: Database, teamId: string): { place: number; of: number } {
  const ranked = standings(db, db.teams.find((t) => t.id === teamId)?.campId ?? '');
  return { place: ranked.findIndex((t) => t.id === teamId) + 1, of: ranked.length };
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// A pleasant default palette for new teams.
export const TEAM_COLORS = ['#c0392b', '#2563a8', '#1f8a4c', '#e08a3c', '#7b4fb5', '#0e9aa7', '#d23c77', '#5a6b2f'];
