import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { buildSeed } from './seed';
import { currentSession, onAuthChange, signUpOrganizer, signInOrganizer as authSignIn, signOutOrganizer, signInWithProvider, type OAuthProvider } from './auth';
import { resetCloudSnapshot } from './cloudDb';
import type { User } from './types';
import type { User as SupaUser } from '@supabase/supabase-js';

// Ways in:
//   • Real organizer — a Supabase account (cloud-backed, multi-tenant). This is
//     the product.
//   • Demo organizer — the localStorage "try it" sandbox with sample camps.
//   • Camper — lightweight per-attendee login (demo for now).
// `isCloud` tells the store whether to read/write Supabase or localStorage.

type DemoMode = 'organizer' | 'camper' | null;

interface SessionCtx {
  ready: boolean; // auth state resolved (avoids a demo→cloud flash on load)
  mode: 'organizer' | 'camper' | null;
  authed: boolean;
  isCloud: boolean;
  user: User;
  camperId: string | null;
  enterDemo: () => void;
  signUp: (email: string, password: string, name?: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signInWith: (provider: OAuthProvider) => Promise<string | null>;
  signInCamper: (attendeeId: string) => void;
  signOut: () => Promise<void>;
}

const Ctx = createContext<SessionCtx | null>(null);
const demoUser = buildSeed().users[0];

function userFromSupa(u: SupaUser): User {
  const meta = (u.user_metadata ?? {}) as { full_name?: string };
  const name = meta.full_name || (u.email ? u.email.split('@')[0] : 'Organizer');
  return { id: u.id, name, email: u.email ?? '', title: 'Camp Organizer' };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [demoMode, setDemoMode] = useState<DemoMode>(null);
  const [camperId, setCamperId] = useState<string | null>(null);
  const [supaUser, setSupaUser] = useState<SupaUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    currentSession().then((s) => { if (active) { setSupaUser(s?.user ?? null); setReady(true); } });
    const unsub = onAuthChange((s) => { if (active) setSupaUser(s?.user ?? null); });
    return () => { active = false; unsub(); };
  }, []);

  const isCloud = !!supaUser;
  const mode: 'organizer' | 'camper' | null = supaUser ? 'organizer' : demoMode;
  const authed = isCloud || demoMode !== null;
  const user = supaUser ? userFromSupa(supaUser) : demoUser;

  const value: SessionCtx = {
    ready, mode, authed, isCloud, user, camperId,
    enterDemo: () => { setCamperId(null); setDemoMode('organizer'); },
    signUp: async (email, password, name) => {
      const { error } = await signUpOrganizer(email, password, name);
      return error ? error.message : null;
    },
    signIn: async (email, password) => {
      const { error } = await authSignIn(email, password);
      return error ? error.message : null;
    },
    signInWith: async (provider) => {
      const { error } = await signInWithProvider(provider); // redirects away on success
      return error ? error.message : null;
    },
    signInCamper: (id) => { setCamperId(id); setDemoMode('camper'); },
    signOut: async () => {
      if (supaUser) { await signOutOrganizer(); resetCloudSnapshot(); }
      setCamperId(null); setDemoMode(null);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSession outside provider');
  return c;
}
