import { createContext, useContext, useState, type ReactNode } from 'react';
import { buildSeed } from './seed';
import type { User } from './types';

// Fake auth for the demo — pick the seeded director and you're in. Swap for real
// auth (Apple/Google/email) later without touching the rest of the app.
interface SessionCtx {
  user: User;
  authed: boolean;
  signIn: () => void;
  signOut: () => void;
}

const Ctx = createContext<SessionCtx | null>(null);
const defaultUser = buildSeed().users[0];

export function SessionProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  return (
    <Ctx.Provider value={{ user: defaultUser, authed, signIn: () => setAuthed(true), signOut: () => setAuthed(false) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSession(): SessionCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSession outside provider');
  return c;
}
