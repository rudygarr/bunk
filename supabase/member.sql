-- ============================================================================
--  CampHQ — camper (member) access  (run AFTER schema.sql)
-- ============================================================================
--  How campers read a cloud camp WITHOUT raw table access. Campers never get
--  SELECT on the tables; instead these SECURITY DEFINER functions return a
--  curated, privacy-filtered payload. That makes a health/contact leak
--  structurally impossible — the database only ever hands a camper:
--    - their OWN record (minus password),
--    - everyone else's NAME + group assignments only (no health/email/phone),
--    - camp-wide + their-own-group schedule & announcements,
--    - team standings, cabins/buses/groups/tables, packing, contacts, docs.
--  Run this whole file in Supabase -> SQL Editor. Safe to re-run.
-- ============================================================================

-- For future per-camp visibility toggles (not enforced yet; safe defaults apply).
alter table public.camps add column if not exists privacy jsonb;
alter table public.contacts add column if not exists share text;

-- ---------- the camper's curated view of their camp ----------
create or replace function public.member_camp()
returns jsonb language plpgsql security definer stable
set search_path = public as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_att public.attendees;
  v_camp public.camps;
begin
  if v_email = '' then return null; end if;
  select a.* into v_att from public.attendees a
    join public.camps c on c.id = a.camp_id
    where lower(a.email) = v_email and c.published = true
    order by c.published_at desc nulls last limit 1;
  if not found then return null; end if;
  select * into v_camp from public.camps where id = v_att.camp_id;

  return jsonb_build_object(
    'camp', to_jsonb(v_camp),
    'me', to_jsonb(v_att) - 'password',
    -- everyone else: names + assignments ONLY (never health/email/phone/password)
    'attendees', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', a.id, 'name', a.name, 'kind', a.kind, 'role', a.role, 'status', a.status,
        'cabin_id', a.cabin_id, 'cabin_room_id', a.cabin_room_id, 'cabin_leader', a.cabin_leader,
        'bus_id', a.bus_id, 'team_id', a.team_id, 'small_group_id', a.small_group_id,
        'table_id', a.table_id, 'table_leader', a.table_leader
      )), '[]'::jsonb)
      from public.attendees a where a.camp_id = v_camp.id and a.id <> v_att.id
    ),
    'schedule', (
      select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb) from public.schedule_items s
      where s.camp_id = v_camp.id and (
        s.audience_kind = 'everyone'
        or (s.audience_kind = 'cabin' and s.audience_id = v_att.cabin_id)
        or (s.audience_kind = 'team' and s.audience_id = v_att.team_id)
        or (s.audience_kind = 'bus' and s.audience_id = v_att.bus_id)
        or (s.audience_kind = 'smallGroup' and s.audience_id = v_att.small_group_id)
        or (s.audience_kind = 'table' and s.audience_id = v_att.table_id)
        or (s.audience_kind = 'person' and s.audience_id = v_att.id))
    ),
    'announcements', (
      select coalesce(jsonb_agg(to_jsonb(an)), '[]'::jsonb) from public.announcements an
      where an.camp_id = v_camp.id and (
        an.audience_kind = 'everyone'
        or (an.audience_kind = 'cabin' and an.audience_id = v_att.cabin_id)
        or (an.audience_kind = 'team' and an.audience_id = v_att.team_id)
        or (an.audience_kind = 'bus' and an.audience_id = v_att.bus_id)
        or (an.audience_kind = 'smallGroup' and an.audience_id = v_att.small_group_id)
        or (an.audience_kind = 'table' and an.audience_id = v_att.table_id)
        or (an.audience_kind = 'person' and an.audience_id = v_att.id)
        or (an.audience_ids is not null and v_att.id = any(an.audience_ids)))
    ),
    'teams', (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from public.teams t where t.camp_id = v_camp.id),
    'small_groups', (select coalesce(jsonb_agg(to_jsonb(g)), '[]') from public.small_groups g where g.camp_id = v_camp.id),
    'tables', (select coalesce(jsonb_agg(to_jsonb(tb)), '[]') from public.tables tb where tb.camp_id = v_camp.id),
    'cabins', (select coalesce(jsonb_agg(to_jsonb(cb)), '[]') from public.cabins cb where cb.camp_id = v_camp.id),
    'cabin_rooms', (select coalesce(jsonb_agg(to_jsonb(cr)), '[]') from public.cabin_rooms cr
                     join public.cabins cb on cb.id = cr.cabin_id where cb.camp_id = v_camp.id),
    'buses', (select coalesce(jsonb_agg(to_jsonb(b)), '[]') from public.buses b where b.camp_id = v_camp.id),
    'packing', (select coalesce(jsonb_agg(to_jsonb(p)), '[]') from public.packing_items p where p.camp_id = v_camp.id),
    'contacts', (select coalesce(jsonb_agg(to_jsonb(ct)), '[]') from public.contacts ct
        where ct.camp_id = v_camp.id and (ct.share = 'everyone' or (ct.share = 'staff' and v_att.kind = 'staff'))),
    'docs', (select coalesce(jsonb_agg(to_jsonb(d)), '[]') from public.docs d
              where d.camp_id = v_camp.id and d.audience in ('everyone', 'campers'))
  );
end;
$$;

-- ---------- the only writes a camper can make: their own RSVP + packing ----------
create or replace function public.member_rsvp(new_status text)
returns void language plpgsql security definer
set search_path = public as $$
declare v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if new_status not in ('accepted', 'declined', 'tentative', 'invited') then
    raise exception 'invalid status';
  end if;
  update public.attendees set status = new_status, responded_at = now()
  where lower(email) = v_email and camp_id in (select id from public.camps where published = true);
end;
$$;

create or replace function public.member_toggle_packed(item_id text)
returns text[] language plpgsql security definer
set search_path = public as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_packed text[];
begin
  select case when packed @> array[item_id] then array_remove(packed, item_id)
              else array_append(coalesce(packed, '{}'), item_id) end
    into v_packed from public.attendees
    where lower(email) = v_email and camp_id in (select id from public.camps where published = true)
    limit 1;
  update public.attendees set packed = v_packed
    where lower(email) = v_email and camp_id in (select id from public.camps where published = true);
  return v_packed;
end;
$$;

grant execute on function public.member_camp() to authenticated;
grant execute on function public.member_rsvp(text) to authenticated;
grant execute on function public.member_toggle_packed(text) to authenticated;
