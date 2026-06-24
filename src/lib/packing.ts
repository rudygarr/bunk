import type { Database, PackingItem } from './types';

export function packingOf(db: Database, campId: string): PackingItem[] {
  return (db.packing ?? []).filter((p) => p.campId === campId);
}

// Grouped by category, preserving first-seen category order.
export function packingByCategory(db: Database, campId: string): { category: string; items: PackingItem[] }[] {
  const out: { category: string; items: PackingItem[] }[] = [];
  for (const it of packingOf(db, campId)) {
    const g = out.find((x) => x.category === it.category);
    if (g) g.items.push(it);
    else out.push({ category: it.category, items: [it] });
  }
  return out;
}
