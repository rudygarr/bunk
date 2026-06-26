import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

// Real organizer authentication via Supabase. The demo's fake login stays as the
// public "try it" path; these power real, cloud-backed accounts.

export async function signUpOrganizer(email: string, password: string, name?: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: name ? { full_name: name } : undefined },
  });
}

export async function signInOrganizer(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOutOrganizer() {
  return supabase.auth.signOut();
}

export async function currentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function currentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

// Subscribe to login/logout; returns an unsubscribe function.
export function onAuthChange(cb: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

export type { Session, User };
