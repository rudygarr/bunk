import { createContext, useContext, useState, type ReactNode } from 'react';
import { buildSeed } from './seed';
import type { User } from './types';

// Two ways in: organizers run camps; campers get a lightweight account to follow
// their own camp. Fake auth for the demo — swap for real auth later without
// touching the rest of the app.
type Mode = 'organizer' | 'camper' | null;

interface SessionCtx {
  mode: Mode;
  authed: boolean;
  user: User; // organizer identity (the seeded director)
  camperId: string | null; // attendee id when signed in as a camper
  signInOrganizer: () => void;
  signInCamper: (attendeeId: string) => void;
  signOut: () => void;
}

const Ctx = createContext<SessionCtx | null>(null);
const defaultUser = buildSeed().users[0];

export function SessionProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(null);
  const [camperId, setCamperId] = useState<string | null>(null);
  return (
    <Ctx.Provider
      value={{
        mode,
        authed: mode !== null,
        user: defaultUser,
        camperId,
        signInOrganizer: () => { setCamperId(null); setMode('organizer'); },
        signInCamper: (id) => { setCamperId(id); setMode('camper'); },
        signOut: () => { setCamperId(null); setMode(null); },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSession(): SessionCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSession outside provider');
  return c;
}
