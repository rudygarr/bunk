import { createClient } from '@supabase/supabase-js';

// CampHQ's Supabase connection.
//
// These are the project's PUBLIC values. The "publishable" (anon) key is meant
// to ship in client-side code — your data is protected by Row-Level Security
// policies on the database, NOT by keeping this key secret. The secret /
// service_role key must NEVER appear in this file or anywhere in the repo.
//
// Values can be overridden at build time with VITE_SUPABASE_URL /
// VITE_SUPABASE_ANON_KEY env vars; otherwise these defaults are used.
const url = import.meta.env.VITE_SUPABASE_URL ?? 'https://irzmarbzxvchsjqpkogg.supabase.co';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_ZNNg2b7cIEIKpwzO1fYDWQ_kGnyxnS1';

export const supabase = createClient(url, anonKey);
export const SUPABASE_URL = url;
export const SUPABASE_ANON_KEY = anonKey;
