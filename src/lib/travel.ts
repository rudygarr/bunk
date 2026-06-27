import type { Database, Attendee, Camp, TravelMode } from './types';
import { attendeesOf } from './camps';

// Buses are one way to camp; this models all of them.
export const TRAVEL_MODES: { key: TravelMode; label: string; icon: string }[] = [
  { key: 'bus', label: 'Bus', icon: 'ti-bus' },
  { key: 'car', label: 'Car', icon: 'ti-car' },
  { key: 'plane', label: 'Plane', icon: 'ti-plane' },
  { key: 'onsite', label: 'On site / local', icon: 'ti-map-pin' },
  { key: 'na', label: 'Not applicable', icon: 'ti-minus' },
  { key: 'other', label: 'Other', icon: 'ti-dots' },
];

export function travelMeta(mode: TravelMode) {
  return TRAVEL_MODES.find((m) => m.key === mode) ?? TRAVEL_MODES[0];
}

// The person's effective travel mode — their own, or the camp default, or bus.
export function travelModeOf(a: Attendee, camp: Camp): TravelMode {
  return a.travelMode ?? camp.defaultTravel ?? 'bus';
}

export interface TravelSummary {
  counts: { mode: TravelMode; n: number }[];
  // Anyone whose arrangement needs attention: flights (with #/pickup) and other.
  special: Attendee[];
}

export function travelSummary(db: Database, camp: Camp): TravelSummary {
  const people = attendeesOf(db, camp.id);
  const counts = TRAVEL_MODES.map((m) => ({
    mode: m.key,
    n: people.filter((a) => travelModeOf(a, camp) === m.key).length,
  })).filter((c) => c.n > 0);
  const special = people
    .filter((a) => travelModeOf(a, camp) === 'plane' || (a.travelMode === 'other' && a.travelNote))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { counts, special };
}
