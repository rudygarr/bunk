import type { Database } from './types';
import { attendeesOf } from './camps';

export interface DietGroup { label: string; names: string[] }
export interface AllergyRow { name: string; detail: string }

// Aggregate the roster's dietary needs and allergies for the kitchen: dietary
// restrictions grouped by what they are (with who), and every allergy listed
// with the person so nothing gets missed at meal time.
export function dietarySummary(db: Database, campId: string): { diets: DietGroup[]; allergies: AllergyRow[]; total: number } {
  const att = attendeesOf(db, campId);
  const map = new Map<string, string[]>();
  for (const a of att) {
    const d = a.health?.dietary?.trim();
    if (d) (map.get(d) ?? map.set(d, []).get(d)!).push(a.name);
  }
  const diets = [...map.entries()]
    .map(([label, names]) => ({ label, names: names.sort() }))
    .sort((a, b) => b.names.length - a.names.length || a.label.localeCompare(b.label));
  const allergies = att
    .filter((a) => a.health?.allergies?.trim())
    .map((a) => ({ name: a.name, detail: a.health!.allergies!.trim() }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { diets, allergies, total: att.length };
}
