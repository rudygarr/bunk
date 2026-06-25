import type { Camp } from './types';

// Per-camp, pay-to-publish pricing. Build free as a draft; pay once to go live
// for a 60-day window. Tiers are by camper count (the research said camps hate
// per-camper fees and annual contracts — this is a flat per-camp price).
export interface Tier {
  id: string;
  label: string;
  max: number | null; // max campers, null = unlimited
  price: number;
}

export const TIERS: Tier[] = [
  { id: 'starter', label: 'Starter', max: 50, price: 20 },
  { id: 'small', label: 'Small', max: 150, price: 75 },
  { id: 'medium', label: 'Medium', max: 400, price: 150 },
  { id: 'unlimited', label: 'Unlimited', max: null, price: 250 },
];

export const LIVE_WINDOW_DAYS = 60;

// The cheapest tier that covers a given camper count.
export function recommendedTier(camperCount: number): Tier {
  return TIERS.find((t) => t.max === null || camperCount <= t.max) ?? TIERS[TIERS.length - 1];
}

export function tierById(id?: string): Tier | undefined {
  return TIERS.find((t) => t.id === id);
}

export function tierRange(t: Tier): string {
  if (t.max === null) return 'Unlimited campers';
  const prev = TIERS[TIERS.indexOf(t) - 1];
  const lo = prev ? (prev.max ?? 0) + 1 : 1;
  return `${lo}–${t.max} campers`;
}

// Days left in the 60-day window (negative once expired/archived).
export function daysLeft(publishedAt?: string): number {
  if (!publishedAt) return 0;
  const end = new Date(publishedAt).getTime() + LIVE_WINDOW_DAYS * 86400000;
  return Math.ceil((end - Date.now()) / 86400000);
}

export function isArchived(camp: Camp): boolean {
  return !!camp.published && daysLeft(camp.publishedAt) <= 0;
}
