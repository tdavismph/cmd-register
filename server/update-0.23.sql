-- CMD Register, update for build 0.23: Enumerators and the census.
-- Run once in the Supabase SQL editor of the cmd-register project. It can be run again without harm.
-- What it changes:
--   1. A new kind of worker, 'enum' (an Enumerator pair doing the census).
--   2. An Enumerator may send and receive only the households, people and referrals that the pair itself entered.
--      A census household belongs to no Care Group until the administrator gives it to a Leader Neighbor.
--   3. The scope checks in cmd_push now use "is not true", so that a record with no Trainer or Promoter
--      is never accepted from a Trainer or Promoter by accident.

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

alter table public.cmd_workers drop constraint if exists cmd_workers_role_check;
alter table public.cmd_workers add constraint cmd_workers_role_check check (role in ('admin','clinic','prom','lnt','ln','enum'));

create or replace function public.cmd_save_worker(p_token text, p_worker jsonb, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare me public.cmd_workers; w public.cmd_workers; v_id text; v_role text; v_lnt text; v_prom text; v_cg int;
begin
  me := public.cmd_me(p_token);
  if me.role <> 'admin' then return jsonb_build_object('ok', false, 'error', 'admin_only'); end if;
  v_id := nullif(p_worker->>'id', ''); v_role := p_worker->>'role';
  if v_id is not null then
    select * into w from public.cmd_workers where id = v_id;
    if not found then return jsonb_build_object('ok', false, 'error', 'no_such_worker'); end if;
    update public.cmd_workers set
      name = coalesce(nullif(trim(p_worker->>'name'), ''), name),
      active = coalesce((p_worker->>'active')::boolean, active),
      pin_hash = case when coalesce(p_pin, '') <> '' then crypt(p_pin, gen_salt('bf')) else pin_hash end,
      fails = case when coalesce(p_pin, '') <> '' then 0 else fails end,
      locked_until = case when coalesce(p_pin, '') <> '' then null else locked_until end
    where id = v_id returning * into w;
    if coalesce(p_pin, '') <> '' or not w.active then delete from public.cmd_sessions where worker_id = v_id; end if;
    return jsonb_build_object('ok', true, 'worker', public.cmd_worker_json(w, true));
  end if;
  if v_role not in ('clinic', 'prom', 'lnt', 'ln', 'enum') or coalesce(trim(p_worker->>'name'), '') = '' or coalesce(length(p_pin), 0) < 6
     or coalesce(length(trim(p_worker->>'code')), 0) < 3 then return jsonb_build_object('ok', false, 'error', 'bad_input'); end if;
  if v_role = 'lnt' then   -- a Trainer: belongs to a Promoter and leads a new Care Group
    v_prom := p_worker->>'prom';
    if not exists (select 1 from public.cmd_workers where id = v_prom and role = 'prom' and active) then return jsonb_build_object('ok', false, 'error', 'no_such_promoter'); end if;
    select coalesce(max(cg), 0) + 1 into v_cg from public.cmd_workers where role = 'lnt';
  elsif v_role = 'ln' then   -- a Leader Neighbor: belongs to a Trainer's Care Group
    v_lnt := p_worker->>'lnt';
    select cg into v_cg from public.cmd_workers where id = v_lnt and role = 'lnt' and active;
    if not found then return jsonb_build_object('ok', false, 'error', 'no_such_trainer'); end if;
  end if;
  begin
    insert into public.cmd_workers(id, role, name, lnt_id, prom_id, cg, code, pin_hash)
    values ('w_' || substr(md5(random()::text || clock_timestamp()::text), 1, 10), v_role, trim(p_worker->>'name'), v_lnt, v_prom, v_cg,
            lower(trim(p_worker->>'code')), crypt(p_pin, gen_salt('bf'))) returning * into w;
  exception when unique_violation then return jsonb_build_object('ok', false, 'error', 'code_taken');
  end;
  return jsonb_build_object('ok', true, 'worker', public.cmd_worker_json(w, true));
end $$;

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
    if not found or o.role not in ('ln', 'lnt', 'enum') then k := k + 1; continue; end if;
    -- a census household belongs to the Enumerator who entered it, and to no Care Group, until the administrator gives it to a Leader Neighbor
    v_lnt := case when o.role = 'ln' then o.lnt_id when o.role = 'lnt' then o.id end;
    select prom_id into v_prom from public.cmd_workers where id = v_lnt;
    -- what each role may write
    ok := case me.role
      when 'admin'  then true
      when 'clinic' then v_ty in ('p', 'ref', 'ev')
      when 'prom'   then v_prom = me.id and v_ty in ('p', 'v', 'ref', 'ev', 'q')
      when 'lnt'    then v_lnt = me.id and (v_ty <> 'q' or (o.role = 'ln' and o.id <> me.id))
      when 'ln'     then o.id = me.id and v_ty <> 'q'
      when 'enum'   then o.id = me.id and v_ty in ('hh', 'p', 'ref')
      else false end;
    if ok and v_ty = 'q' and o.id = me.id then ok := false; end if;   -- nobody scores herself
    if ok is not true then k := k + 1; continue; end if;   -- "is not true" also rejects a comparison with an empty Trainer or Promoter
    select * into old_ from public.cmd_records where ty = v_ty and id = r->>'id';
    if found then
      -- the existing copy must also be inside the caller's scope (a record cannot be moved out of someone else's area)
      if (me.role in ('admin', 'clinic') or (me.role = 'prom' and old_.prom = me.id) or (me.role = 'lnt' and old_.lnt = me.id) or (me.role in ('ln', 'enum') and old_.ln = me.id)) is not true then k := k + 1; continue; end if;
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

create or replace function public.cmd_pull(p_token text, p_since bigint)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare me public.cmd_workers; out_ jsonb;
begin
  me := public.cmd_me(p_token);
  select jsonb_build_object('ok', true, 'seq', coalesce(max(q.seq), p_since), 'count', count(*),
           'records', coalesce(jsonb_agg(jsonb_build_object('ty', q.ty, 'u', q.u, 'body', q.body) order by q.seq), '[]'::jsonb))
    into out_
    from (select * from public.cmd_records t
           where t.seq > p_since
             and (me.role in ('admin', 'clinic') or (me.role = 'prom' and t.prom = me.id) or (me.role = 'lnt' and t.lnt = me.id) or (me.role in ('ln', 'enum') and t.ln = me.id))
           order by t.seq limit 1000) q;
  return out_;
end $$;

notify pgrst, 'reload schema';
