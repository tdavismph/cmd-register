-- CMD Register, build 0.18: referral follow-up.
-- Run once in the Supabase SQL Editor of the cmd-register project. It changes two functions and no table.
-- It can be run again safely. (The same text is part of server/setup.sql from build 0.18.)

-- Internal: a referral record edited on two devices keeps every follow-up entry from both.
-- "Seen at the facility" can be set only by the clinic or the administrator, and a referral can be closed
-- (declined, or seen elsewhere) only by a Trainer, a Promoter or the administrator. Once set, neither is removed.
-- Guard: stop at once if this is the CBIO+ MCH Register's database (project cbio-home-visit-register) and not the CMD Register's (project cmd-register).
do $guard$
declare n bigint := 0;
begin
  if to_regclass('public.cbio_workers') is not null then
    execute 'select count(*) from public.cbio_workers' into n;
    if n > 0 then
      raise exception 'WRONG PROJECT: this database holds the CBIO+ MCH Register (cbio_workers has % rows). This script is for the CMD Register. Nothing was changed. Open the Supabase project "cmd-register" and run it there.', n;
    end if;
  end if;
end $guard$;

create or replace function public.cmd_merge_ref(old_ jsonb, new_ jsonb, new_is_newer boolean, role_ text)
returns jsonb language plpgsql immutable as $$
declare base jsonb; v_seen text; v_closed jsonb;
begin
  base := case when new_is_newer then new_ else old_ end;
  if jsonb_typeof(old_->'fu') = 'array' or jsonb_typeof(new_->'fu') = 'array' then
    base := base || jsonb_build_object('fu', (select coalesce(jsonb_agg(e order by e->>'d', coalesce((e->>'t')::numeric, 0), e::text), '[]'::jsonb)
      from (select distinct e from jsonb_array_elements(
        (case when jsonb_typeof(old_->'fu') = 'array' then old_->'fu' else '[]'::jsonb end) ||
        (case when jsonb_typeof(new_->'fu') = 'array' then new_->'fu' else '[]'::jsonb end)) e) x));
  end if;
  v_seen := coalesce(nullif(old_->>'seen', ''), case when role_ in ('clinic', 'admin') then nullif(new_->>'seen', '') end);
  v_closed := case when jsonb_typeof(old_->'closed') = 'object' then old_->'closed'
                   when role_ in ('lnt', 'prom', 'admin') and jsonb_typeof(new_->'closed') = 'object' then new_->'closed' end;
  base := base - 'seen' - 'closed';
  if v_seen is not null then base := base || jsonb_build_object('seen', v_seen); end if;
  if v_closed is not null then base := base || jsonb_build_object('closed', v_closed); end if;
  return base;
end $$;

-- Send records from a tablet. A record is accepted only inside the caller's own scope,
-- and (except for person and referral records, which are merged) only if it is newer than the server's copy.
create or replace function public.cmd_push(p_token text, p_records jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare me public.cmd_workers; o public.cmd_workers; r jsonb; v_ty text; v_lnt text; v_prom text; v_u bigint; ok boolean;
        old_ public.cmd_records; n int := 0; k int := 0;
begin
  me := public.cmd_me(p_token);
  for r in select * from jsonb_array_elements(p_records) loop
    v_ty := r->>'ty'; v_u := coalesce((r->>'u')::bigint, 0);
    if coalesce(r->>'id', '') = '' or v_ty not in ('hh','p','v','ref','ev','gm','q') or jsonb_typeof(r->'body') <> 'object' then k := k + 1; continue; end if;
    select * into o from public.cmd_workers where id = r->>'ln';
    if not found or o.role not in ('ln', 'lnt') then k := k + 1; continue; end if;
    v_lnt := case when o.role = 'ln' then o.lnt_id else o.id end;
    select prom_id into v_prom from public.cmd_workers where id = v_lnt;
    -- what each role may write
    ok := case me.role
      when 'admin'  then true
      when 'clinic' then v_ty in ('p', 'ref', 'ev')
      when 'prom'   then v_prom = me.id and v_ty in ('p', 'v', 'ref', 'ev', 'q')
      when 'lnt'    then v_lnt = me.id and (v_ty <> 'q' or (o.role = 'ln' and o.id <> me.id))
      when 'ln'     then o.id = me.id and v_ty <> 'q'
      else false end;
    if ok and v_ty = 'q' and o.id = me.id then ok := false; end if;   -- nobody scores herself
    if not ok then k := k + 1; continue; end if;
    select * into old_ from public.cmd_records where ty = v_ty and id = r->>'id';
    if found then
      -- the existing copy must also be inside the caller's scope (a record cannot be moved out of someone else's area)
      if not (me.role in ('admin', 'clinic') or (me.role = 'prom' and old_.prom = me.id) or (me.role = 'lnt' and old_.lnt = me.id) or (me.role = 'ln' and old_.ln = me.id)) then k := k + 1; continue; end if;
      if v_ty = 'p' then
        update public.cmd_records set body = public.cmd_merge_person(old_.body, r->'body', v_u >= old_.u), u = greatest(old_.u, v_u),
               ln = o.id, lnt = v_lnt, prom = v_prom, seq = nextval('public.cmd_seq'), updated_by = me.id, updated_at = now()
         where ty = v_ty and id = r->>'id';
      elsif v_ty = 'ref' then
        update public.cmd_records set body = public.cmd_merge_ref(old_.body, r->'body', v_u >= old_.u, me.role), u = greatest(old_.u, v_u),
               ln = o.id, lnt = v_lnt, prom = v_prom, seq = nextval('public.cmd_seq'), updated_by = me.id, updated_at = now()
         where ty = v_ty and id = r->>'id';
      elsif v_u > old_.u then
        update public.cmd_records set body = r->'body', u = v_u, ln = o.id, lnt = v_lnt, prom = v_prom,
               seq = nextval('public.cmd_seq'), updated_by = me.id, updated_at = now()
         where ty = v_ty and id = r->>'id';
      else k := k + 1; continue;
      end if;
    else
      insert into public.cmd_records(id, ty, ln, lnt, prom, body, u, updated_by)
      values (r->>'id', v_ty, o.id, v_lnt, v_prom, case when v_ty = 'ref' then public.cmd_merge_ref('{}'::jsonb, r->'body', true, me.role) else r->'body' end, v_u, me.id);
    end if;
    n := n + 1;
  end loop;
  return jsonb_build_object('ok', true, 'saved', n, 'skipped', k);
end $$;

revoke execute on function public.cmd_merge_ref(jsonb, jsonb, boolean, text) from public, anon, authenticated;
