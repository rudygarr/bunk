-- ============================================================================
--  CampHQ database schema  (Option B — normalized tables)
-- ============================================================================
--  HOW TO RUN:
--    Supabase Dashboard -> SQL Editor -> New query -> paste this whole file -> Run.
--  It is safe to re-run (drops/recreates policies, uses "if not exists").
--
--  WHAT THIS DOES:
--    - Creates a table per CampHQ entity, owned by the organizer (auth.users).
--    - Turns on Row-Level Security (RLS) so the database itself enforces who can
--      see what — this is the real security the demo's UI gating only pretended
--      to have.
--    - Lets the public read ONLY the non-sensitive parts of a *published* camp
--      (for the public viewer / departure board / sign-up). Rosters, health,
--      and assignments are never publicly readable.
-- ============================================================================

-- ============================ TABLES ============================

create table if not exists public.camps (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  start_date text,
  end_date text,
  location text,
  organizer text,
  blurb text,
  accent text,
  kickoff text,
  kickoff_label text,
  contact text,
  depart_info text,
  map_url text,
  logo_url text,
  photo_album_url text,
  features text[],
  published boolean not null default false,
  published_at timestamptz,
  tier text,
  created_at timestamptz not null default now()
);

-- Per-organizer directory of people you can invite from.
create table if not exists public.people (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  email text,
  role text
);

create table if not exists public.attendees (
  id text primary key,
  camp_id text not null references public.camps(id) on delete cascade,
  person_id text,
  name text not null,
  email text,
  kind text not null,                 -- camper | staff | parent | guest
  role text,
  status text not null default 'invited',
  grade int,
  gender text,
  friends text,
  bus_id text,
  cabin_id text,
  cabin_room_id text,
  cabin_leader boolean,
  team_id text,
  small_group_id text,
  on_board boolean,
  health jsonb,                       -- allergies/meds/dietary/emergency (sensitive)
  check_in jsonb,
  password text,                      -- demo camper login; replaced by real auth later
  invited_at timestamptz,
  responded_at timestamptz
);

create table if not exists public.buses (
  id text primary key,
  camp_id text not null references public.camps(id) on delete cascade,
  name text not null,
  label text,
  capacity int,
  charter_org text,
  depart_info text,
  group_name text,
  tracking_url text,
  captain_ids text[]
);

create table if not exists public.cabins (
  id text primary key,
  camp_id text not null references public.camps(id) on delete cascade,
  name text not null,
  kind text not null,
  beds int,
  gender text
);

create table if not exists public.cabin_rooms (
  id text primary key,
  cabin_id text not null references public.cabins(id) on delete cascade,
  name text not null,
  beds int not null default 0
);

create table if not exists public.teams (
  id text primary key,
  camp_id text not null references public.camps(id) on delete cascade,
  name text not null,
  color text,
  points int not null default 0
);

create table if not exists public.small_groups (
  id text primary key,
  camp_id text not null references public.camps(id) on delete cascade,
  name text not null,
  color text,
  leader_name text
);

create table if not exists public.roles (
  id text primary key,
  camp_id text not null references public.camps(id) on delete cascade,
  name text not null,
  icon text,
  blurb text
);

create table if not exists public.shifts (
  id text primary key,
  role_id text not null references public.roles(id) on delete cascade,
  name text not null,
  start_time text,
  end_time text
);

create table if not exists public.duties (
  id text primary key,
  camp_id text not null references public.camps(id) on delete cascade,
  role_id text not null references public.roles(id) on delete cascade,
  shift_id text,
  person_id text,
  name text not null,
  email text
);

create table if not exists public.schedule_items (
  id text primary key,
  camp_id text not null references public.camps(id) on delete cascade,
  day text not null,
  start_time text,
  end_time text,
  title text not null,
  location text,
  audience_kind text not null default 'everyone',
  audience_id text
);

create table if not exists public.announcements (
  id text primary key,
  camp_id text not null references public.camps(id) on delete cascade,
  title text,
  body text not null,
  author text,
  audience_kind text not null default 'everyone',
  audience_id text,
  audience_ids text[],
  pinned boolean,
  created_at timestamptz not null default now()
);

create table if not exists public.photos (
  id text primary key,
  camp_id text not null references public.camps(id) on delete cascade,
  author_id text,
  author_name text,
  data_url text not null,
  caption text,
  created_at timestamptz not null default now()
);

create table if not exists public.packing_items (
  id text primary key,
  camp_id text not null references public.camps(id) on delete cascade,
  item text not null,
  category text
);

create table if not exists public.docs (
  id text primary key,
  camp_id text not null references public.camps(id) on delete cascade,
  title text not null,
  url text not null,
  external boolean not null default true,
  file_type text,
  audience text not null default 'everyone',
  category text
);

-- ---------- indexes for the common "by camp" lookups ----------
create index if not exists idx_attendees_camp on public.attendees(camp_id);
create index if not exists idx_buses_camp on public.buses(camp_id);
create index if not exists idx_cabins_camp on public.cabins(camp_id);
create index if not exists idx_teams_camp on public.teams(camp_id);
create index if not exists idx_small_groups_camp on public.small_groups(camp_id);
create index if not exists idx_roles_camp on public.roles(camp_id);
create index if not exists idx_duties_camp on public.duties(camp_id);
create index if not exists idx_schedule_camp on public.schedule_items(camp_id);
create index if not exists idx_announcements_camp on public.announcements(camp_id);
create index if not exists idx_photos_camp on public.photos(camp_id);
create index if not exists idx_packing_camp on public.packing_items(camp_id);
create index if not exists idx_docs_camp on public.docs(camp_id);

-- ---------- helper functions (defined after the tables they reference;
--            security definer lets them bypass RLS safely to avoid recursion) ----------
create or replace function public.owns_camp(cid text)
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.camps c where c.id = cid and c.owner_id = auth.uid());
$$;

create or replace function public.camp_is_published(cid text)
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.camps c where c.id = cid and c.published = true);
$$;

-- ============================ ROW-LEVEL SECURITY ============================
alter table public.camps           enable row level security;
alter table public.people          enable row level security;
alter table public.attendees       enable row level security;
alter table public.buses           enable row level security;
alter table public.cabins          enable row level security;
alter table public.cabin_rooms     enable row level security;
alter table public.teams           enable row level security;
alter table public.small_groups    enable row level security;
alter table public.roles           enable row level security;
alter table public.shifts          enable row level security;
alter table public.duties          enable row level security;
alter table public.schedule_items  enable row level security;
alter table public.announcements   enable row level security;
alter table public.photos          enable row level security;
alter table public.packing_items   enable row level security;
alter table public.docs            enable row level security;

-- ---------- camps: owner does everything; anyone may read a PUBLISHED camp ----------
drop policy if exists camps_owner on public.camps;
create policy camps_owner on public.camps for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists camps_public_read on public.camps;
create policy camps_public_read on public.camps for select
  using (published = true);

-- ---------- people: owner only ----------
drop policy if exists people_owner on public.people;
create policy people_owner on public.people for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------- owner-only camp children (sensitive — never public) ----------
drop policy if exists attendees_owner on public.attendees;
create policy attendees_owner on public.attendees for all
  using (public.owns_camp(camp_id)) with check (public.owns_camp(camp_id));

drop policy if exists cabins_owner on public.cabins;
create policy cabins_owner on public.cabins for all
  using (public.owns_camp(camp_id)) with check (public.owns_camp(camp_id));

drop policy if exists cabin_rooms_owner on public.cabin_rooms;
create policy cabin_rooms_owner on public.cabin_rooms for all
  using (exists (select 1 from public.cabins cb where cb.id = cabin_rooms.cabin_id and public.owns_camp(cb.camp_id)))
  with check (exists (select 1 from public.cabins cb where cb.id = cabin_rooms.cabin_id and public.owns_camp(cb.camp_id)));

drop policy if exists small_groups_owner on public.small_groups;
create policy small_groups_owner on public.small_groups for all
  using (public.owns_camp(camp_id)) with check (public.owns_camp(camp_id));

drop policy if exists roles_owner on public.roles;
create policy roles_owner on public.roles for all
  using (public.owns_camp(camp_id)) with check (public.owns_camp(camp_id));

drop policy if exists shifts_owner on public.shifts;
create policy shifts_owner on public.shifts for all
  using (exists (select 1 from public.roles r where r.id = shifts.role_id and public.owns_camp(r.camp_id)))
  with check (exists (select 1 from public.roles r where r.id = shifts.role_id and public.owns_camp(r.camp_id)));

drop policy if exists duties_owner on public.duties;
create policy duties_owner on public.duties for all
  using (public.owns_camp(camp_id)) with check (public.owns_camp(camp_id));

drop policy if exists photos_owner on public.photos;
create policy photos_owner on public.photos for all
  using (public.owns_camp(camp_id)) with check (public.owns_camp(camp_id));

-- ---------- owner manages; public may READ the viewer-safe parts of a published camp ----------
drop policy if exists buses_owner on public.buses;
create policy buses_owner on public.buses for all
  using (public.owns_camp(camp_id)) with check (public.owns_camp(camp_id));
drop policy if exists buses_public_read on public.buses;
create policy buses_public_read on public.buses for select
  using (public.camp_is_published(camp_id));

drop policy if exists teams_owner on public.teams;
create policy teams_owner on public.teams for all
  using (public.owns_camp(camp_id)) with check (public.owns_camp(camp_id));
drop policy if exists teams_public_read on public.teams;
create policy teams_public_read on public.teams for select
  using (public.camp_is_published(camp_id));

drop policy if exists packing_owner on public.packing_items;
create policy packing_owner on public.packing_items for all
  using (public.owns_camp(camp_id)) with check (public.owns_camp(camp_id));
drop policy if exists packing_public_read on public.packing_items;
create policy packing_public_read on public.packing_items for select
  using (public.camp_is_published(camp_id));

-- schedule & announcements: public can read only the camp-wide ('everyone') rows
drop policy if exists schedule_owner on public.schedule_items;
create policy schedule_owner on public.schedule_items for all
  using (public.owns_camp(camp_id)) with check (public.owns_camp(camp_id));
drop policy if exists schedule_public_read on public.schedule_items;
create policy schedule_public_read on public.schedule_items for select
  using (public.camp_is_published(camp_id) and audience_kind = 'everyone');

drop policy if exists announcements_owner on public.announcements;
create policy announcements_owner on public.announcements for all
  using (public.owns_camp(camp_id)) with check (public.owns_camp(camp_id));
drop policy if exists announcements_public_read on public.announcements;
create policy announcements_public_read on public.announcements for select
  using (public.camp_is_published(camp_id) and audience_kind = 'everyone');

-- docs: public can read only the 'everyone' (parent-facing) files
drop policy if exists docs_owner on public.docs;
create policy docs_owner on public.docs for all
  using (public.owns_camp(camp_id)) with check (public.owns_camp(camp_id));
drop policy if exists docs_public_read on public.docs;
create policy docs_public_read on public.docs for select
  using (public.camp_is_published(camp_id) and audience = 'everyone');

-- ============================================================================
--  DONE. Next: enable Email auth (Authentication -> Providers), then the app's
--  data layer reads/writes these tables. Camper (participant) login links to
--  attendees and is added in a later step.
-- ============================================================================
