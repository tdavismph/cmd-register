-- CBIO Cardiometabolic Disease Register (CMD Register): server setup for Supabase (PostgreSQL).
-- Paste the whole file into the Supabase SQL Editor and run it. It is safe to run again:
-- it only creates what is missing and replaces the functions.
--
-- Design (the same as the CBIO+ Home Visit Register): the app never reads or writes tables
-- directly. Every table has Row Level Security switched on with no policies, so the public
-- key cannot touch them. The app calls the functions below, which check the worker's
-- session and limit each role to its own records:
--   Leader Neighbor (ln)          her own households
--   Leader Neighbor Trainer (lnt) her Care Group
--   Promoter (prom)               the Care Groups of her Trainers
--   Clinic (clinic), Administrator (admin)   everything

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.cmd_workers (
  id           text primary key,
  role         text not null check (role in ('admin','clinic','prom','lnt','ln','enum')),
  name         text not null,
  lnt_id       text,            -- for a Leader Neighbor: her Trainer
  prom_id      text,            -- for a Trainer: her Promoter
  cg           int,             -- Care Group number (Trainers and Leader Neighbors)
  code         text not null unique,   -- sign-in name
  pin_hash     text not null,
  fails        int  not null default 0,
  locked_until timestamptz,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.cmd_sessions (
  token      uuid primary key default gen_random_uuid(),
  worker_id  text not null references public.cmd_workers(id),
  expires_at timestamptz not null default now() + interval '90 days'
);

create sequence if not exists public.cmd_seq;

create table if not exists public.cmd_records (
  id         text not null,
  ty         text not null,           -- hh household, p person, v visit, ref referral, ev event, gm group meeting, q QIVC
  ln         text,                    -- worker who owns the record: the household's Leader Neighbor (for a QIVC, the worker observed)
  lnt        text,                    -- that Care Group's Trainer
  prom       text,                    -- that Trainer's Promoter
  body       jsonb not null,
  u          bigint not null default 0,   -- time of the last edit on the tablet (ms)
  seq        bigint not null default nextval('public.cmd_seq'),
  updated_by text,
  updated_at timestamptz not null default now(),
  primary key (ty, id)
);
create index if not exists cmd_records_seq  on public.cmd_records(seq);
create index if not exists cmd_records_ln   on public.cmd_records(ln);
create index if not exists cmd_records_lnt  on public.cmd_records(lnt);
create index if not exists cmd_records_prom on public.cmd_records(prom);

create table if not exists public.cmd_settings (
  key        text primary key,
  body       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.cmd_workers  enable row level security;
alter table public.cmd_sessions enable row level security;
alter table public.cmd_records  enable row level security;
alter table public.cmd_settings enable row level security;
revoke all on public.cmd_workers, public.cmd_sessions, public.cmd_records, public.cmd_settings from anon, authenticated;

-- Internal: who is signed in with this token.
create or replace function public.cmd_me(p_token text)
returns public.cmd_workers language plpgsql security definer set search_path = public, extensions as $$
declare w public.cmd_workers;
begin
  select wk.* into w from public.cmd_sessions s join public.cmd_workers wk on wk.id = s.worker_id
   where s.token::text = p_token and s.expires_at > now() and wk.active;
  if not found then raise exception 'not_signed_in'; end if;
  return w;
end $$;

create or replace function public.cmd_worker_json(w public.cmd_workers, with_code boolean)
returns jsonb language sql immutable as $$
  select jsonb_build_object('id', w.id, 'role', w.role, 'name', w.name, 'lnt', w.lnt_id, 'prom', w.prom_id, 'cg', w.cg, 'active', w.active)
         || case when with_code then jsonb_build_object('code', w.code) else '{}'::jsonb end
$$;

-- Sign in. Five wrong PINs lock the account for 15 minutes.
create or replace function public.cmd_login(p_code text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare w public.cmd_workers; t uuid;
begin
  select * into w from public.cmd_workers where code = lower(trim(p_code)) and active;
  if not found then return jsonb_build_object('ok', false, 'error', 'wrong_code_or_pin'); end if;
  if w.locked_until is not null and w.locked_until > now() then return jsonb_build_object('ok', false, 'error', 'locked'); end if;
  if w.pin_hash <> crypt(p_pin, w.pin_hash) then
    update public.cmd_workers
       set fails = case when locked_until is not null then 1 else fails + 1 end,
           locked_until = case when locked_until is null and fails + 1 >= 5 then now() + interval '15 minutes' else null end
     where id = w.id;
    return jsonb_build_object('ok', false, 'error', 'wrong_code_or_pin');
  end if;
  update public.cmd_workers set fails = 0, locked_until = null where id = w.id;
  delete from public.cmd_sessions where expires_at < now();
  insert into public.cmd_sessions(worker_id) values (w.id) returning token into t;
  return jsonb_build_object('ok', true, 'token', t::text, 'worker', public.cmd_worker_json(w, false));
end $$;

-- First use only: creates the administrator. Refuses once an administrator exists.
create or replace function public.cmd_bootstrap(p_name text, p_code text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if exists (select 1 from public.cmd_workers where role = 'admin') then return jsonb_build_object('ok', false, 'error', 'already_set_up'); end if;
  if coalesce(length(p_pin), 0) < 6 or coalesce(length(trim(p_code)), 0) < 3 or coalesce(trim(p_name), '') = '' then return jsonb_build_object('ok', false, 'error', 'bad_input'); end if;
  insert into public.cmd_workers(id, role, name, code, pin_hash)
  values ('w_adm_' || substr(md5(random()::text || clock_timestamp()::text), 1, 8), 'admin', trim(p_name), lower(trim(p_code)), crypt(p_pin, gen_salt('bf')));
  return public.cmd_login(p_code, p_pin);
end $$;

create or replace function public.cmd_logout(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  delete from public.cmd_sessions where token::text = p_token;
  return jsonb_build_object('ok', true);
end $$;

-- Workers the caller needs to see. Everyone sees every worker's name and role (removed workers
-- included, marked inactive), because the app shows who owns each household and who visited,
-- referred and observed; only the administrator sees sign-in names.
create or replace function public.cmd_workers_list(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare me public.cmd_workers;
begin
  me := public.cmd_me(p_token);
  return coalesce((select jsonb_agg(public.cmd_worker_json(w, me.role = 'admin') order by w.cg nulls first, w.role, w.name)
    from public.cmd_workers w), '[]'::jsonb);
end $$;

-- Administrator: add or change a worker. p_pin sets a new PIN; leave it empty to keep the old one.
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
    -- a Leader Neighbor moved to another Trainer's Care Group (build 0.31): her households and records follow her
    if w.role = 'ln' and coalesce(p_worker->>'lnt', '') <> '' and (p_worker->>'lnt') is distinct from w.lnt_id then
      select cg, prom_id into v_cg, v_prom from public.cmd_workers where id = p_worker->>'lnt' and role = 'lnt' and active;
      if not found then return jsonb_build_object('ok', false, 'error', 'no_such_trainer'); end if;
      v_lnt := p_worker->>'lnt';
      update public.cmd_workers set lnt_id = v_lnt, cg = v_cg where id = v_id;
      update public.cmd_records set lnt = v_lnt, prom = v_prom, seq = nextval('public.cmd_seq'), updated_at = now() where ln = v_id;
    end if;
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

-- Internal: a person record edited on two devices keeps every reading from both
-- (blood pressure, blood sugar and habits); other fields come from the newer copy.
create or replace function public.cmd_merge_person(old_ jsonb, new_ jsonb, new_is_newer boolean)
returns jsonb language plpgsql immutable as $$
declare base jsonb; k text;
begin
  base := case when new_is_newer then new_ else old_ end;
  foreach k in array array['bp', 'glu', 'hab'] loop
    if jsonb_typeof(old_->k) = 'array' or jsonb_typeof(new_->k) = 'array' then
      base := base || jsonb_build_object(k, (select coalesce(jsonb_agg(e order by e->>'d', e::text), '[]'::jsonb)
        from (select distinct e from jsonb_array_elements(coalesce(old_->k, '[]'::jsonb) || coalesce(new_->k, '[]'::jsonb)) e) x));
    end if;
  end loop;
  return base;
end $$;

-- Internal: a referral record edited on two devices keeps every follow-up entry from both.
-- "Seen at the facility" can be set only by the clinic or the administrator, and a referral can be closed
-- (declined, or seen elsewhere) only by a Trainer, a Promoter or the administrator. Once set, neither is removed.
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
    if coalesce(r->'body'->>'hidden', '') = 'true' then k := k + 1; continue; end if;   -- a placeholder for a record the sender may not see
    if coalesce(r->>'id', '') = '' or v_ty not in ('hh','p','v','ref','ev','gm','q','hv') or jsonb_typeof(r->'body') <> 'object' then k := k + 1; continue; end if;
    select * into o from public.cmd_workers where id = r->>'ln';
    if not found or o.role not in ('ln', 'lnt', 'enum') then k := k + 1; continue; end if;
    -- a census household belongs to the Enumerator who entered it, and to no Care Group, until the administrator gives it to a Leader Neighbor
    v_lnt := case when o.role = 'ln' then o.lnt_id when o.role = 'lnt' then o.id end;
    select prom_id into v_prom from public.cmd_workers where id = v_lnt;
    -- what each role may write
    ok := case me.role
      when 'admin'  then true
      when 'clinic' then v_ty in ('p', 'ref', 'ev', 'hv')
      when 'prom'   then (v_prom = me.id and v_ty in ('p', 'v', 'ref', 'ev', 'q', 'hv')) or (o.role = 'enum' and v_ty in ('p', 'v', 'ref'))   -- a Promoter re-checks people recorded at the census
      when 'lnt'    then v_lnt = me.id and (v_ty <> 'q' or (o.role = 'ln' and o.id <> me.id))
      when 'ln'     then o.id = me.id and v_ty <> 'q'
      when 'enum'   then o.id = me.id and v_ty in ('hh', 'p', 'ref')
      else false end;
    if ok and v_ty = 'q' and o.id = me.id then ok := false; end if;   -- nobody scores herself
    if ok is not true then k := k + 1; continue; end if;   -- "is not true" also rejects a comparison with an empty Trainer or Promoter
    select * into old_ from public.cmd_records where ty = v_ty and id = r->>'id';
    if found then
      -- the existing copy must also be inside the caller's scope (a record cannot be moved out of someone else's area)
      if (me.role in ('admin', 'clinic') or (me.role = 'prom' and (old_.prom = me.id or exists (select 1 from public.cmd_workers w where w.id = old_.ln and w.role = 'enum'))) or (me.role = 'lnt' and old_.lnt = me.id) or (me.role in ('ln', 'enum') and old_.ln = me.id)) is not true then k := k + 1; continue; end if;
      if v_ty = 'p' then
        update public.cmd_records set body = public.cmd_merge_person(old_.body, r->'body', v_u >= old_.u), u = greatest(old_.u, v_u),
               ln = o.id, lnt = v_lnt, prom = v_prom, seq = nextval('public.cmd_seq'), updated_by = me.id, updated_at = now()
         where ty = v_ty and id = r->>'id';
      elsif v_ty = 'ref' then
        update public.cmd_records set body = public.cmd_merge_ref(old_.body, r->'body', v_u >= old_.u, me.role), u = greatest(old_.u, v_u),
               ln = o.id, lnt = v_lnt, prom = v_prom, seq = nextval('public.cmd_seq'), updated_by = me.id, updated_at = now()
         where ty = v_ty and id = r->>'id';
      elsif v_ty = 'hv' then   -- confidential ART support record: the two copies are joined, the newer on top, so that neither side's fields are lost
        update public.cmd_records set body = case when v_u >= old_.u then old_.body || (r->'body') else (r->'body') || old_.body end, u = greatest(old_.u, v_u),
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

-- Fetch records changed since the caller's last sync, inside her scope, 1,000 at a time.
create or replace function public.cmd_pull(p_token text, p_since bigint)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare me public.cmd_workers; out_ jsonb;
begin
  me := public.cmd_me(p_token);
  select jsonb_build_object('ok', true, 'seq', coalesce(max(q.seq), p_since), 'count', count(*),
           'records', coalesce(jsonb_agg(jsonb_build_object('ty', q.ty, 'u', q.u, 'body',
             -- a Leader Neighbor receives an ART support record only when the person has agreed that she may know; otherwise an empty placeholder
             case when q.ty = 'hv' and me.role = 'ln' and coalesce(q.body->>'lnOk', '') <> 'true'
                  then jsonb_build_object('id', q.body->>'id', 'p', q.body->>'p', 'hidden', true) else q.body end) order by q.seq), '[]'::jsonb))
    into out_
    from (select * from public.cmd_records t
           where t.seq > p_since
             and (me.role in ('admin', 'clinic') or (me.role = 'prom' and (t.prom = me.id or (t.ty in ('hh', 'p', 'v', 'ref') and exists (select 1 from public.cmd_workers w where w.id = t.ln and w.role = 'enum')))) or (me.role = 'lnt' and t.lnt = me.id) or (me.role in ('ln', 'enum') and t.ln = me.id))
           order by t.seq limit 1000) q;
  return out_;
end $$;

create or replace function public.cmd_settings_get(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare me public.cmd_workers;
begin
  me := public.cmd_me(p_token);
  return (select body from public.cmd_settings where key = 'cfg');
end $$;

create or replace function public.cmd_settings_set(p_token text, p_body jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare me public.cmd_workers;
begin
  me := public.cmd_me(p_token);
  if me.role <> 'admin' then return jsonb_build_object('ok', false, 'error', 'admin_only'); end if;
  insert into public.cmd_settings(key, body) values ('cfg', p_body)
  on conflict (key) do update set body = excluded.body, updated_at = now();
  return jsonb_build_object('ok', true);
end $$;

-- Keep-alive: a small read that a scheduled job calls every few days, so that a Free Plan
-- project is not paused for inactivity. Returns no data.
create or replace function public.cmd_ping()
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  perform count(*) from public.cmd_workers;
  return jsonb_build_object('ok', true, 'at', now());
end $$;

-- Only these functions can be called with the public key.
revoke execute on function public.cmd_me(text) from public, anon, authenticated;
revoke execute on function public.cmd_worker_json(public.cmd_workers, boolean) from public, anon, authenticated;
revoke execute on function public.cmd_merge_person(jsonb, jsonb, boolean) from public, anon, authenticated;
revoke execute on function public.cmd_merge_ref(jsonb, jsonb, boolean, text) from public, anon, authenticated;
revoke execute on function public.cmd_login(text, text), public.cmd_bootstrap(text, text, text), public.cmd_logout(text),
  public.cmd_workers_list(text), public.cmd_save_worker(text, jsonb, text), public.cmd_push(text, jsonb),
  public.cmd_pull(text, bigint), public.cmd_settings_get(text), public.cmd_settings_set(text, jsonb), public.cmd_ping() from public;
grant usage on schema public to anon, authenticated;
grant execute on function public.cmd_login(text, text), public.cmd_bootstrap(text, text, text), public.cmd_logout(text),
  public.cmd_workers_list(text), public.cmd_save_worker(text, jsonb, text), public.cmd_push(text, jsonb),
  public.cmd_pull(text, bigint), public.cmd_settings_get(text), public.cmd_settings_set(text, jsonb), public.cmd_ping() to anon, authenticated;

-- The census map chosen by the administrator in place of the built-in one (build 0.27).
-- The trimmed map is kept as text in pieces; the settings row 'map' says which version is in use, and who chose it and when.
create table if not exists public.cmd_map (
  v     text not null,
  part  int  not null,
  body  text not null,
  primary key (v, part)
);
create table if not exists public.cmd_map_log (
  id      bigserial primary key,
  at      timestamptz not null default now(),
  by_id   text,
  by_name text,
  action  text not null,          -- 'set' or 'default'
  meta    jsonb
);
alter table public.cmd_map     enable row level security;
alter table public.cmd_map_log enable row level security;
revoke all on public.cmd_map, public.cmd_map_log from anon, authenticated;

-- Save one piece of a new map. Administrator only. When the last piece arrives, the new map comes into use.
create or replace function public.cmd_map_put(p_token text, p_v text, p_part int, p_total int, p_body text, p_meta jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare me public.cmd_workers; v_meta jsonb;
begin
  me := public.cmd_me(p_token);
  if me.role <> 'admin' then return jsonb_build_object('ok', false, 'error', 'admin_only'); end if;
  if coalesce(p_v, '') = '' or p_v = 'default' or p_part < 0 or p_total < 1 or p_total > 200 or p_part >= p_total or coalesce(length(p_body), 0) = 0 or length(p_body) > 1000000
    then return jsonb_build_object('ok', false, 'error', 'bad_input'); end if;
  insert into public.cmd_map(v, part, body) values (p_v, p_part, p_body)
    on conflict (v, part) do update set body = excluded.body;
  if p_part = p_total - 1 then
    if (select count(*) from public.cmd_map where v = p_v) <> p_total then return jsonb_build_object('ok', false, 'error', 'pieces_missing'); end if;
    v_meta := coalesce(p_meta, '{}'::jsonb) || jsonb_build_object('v', p_v, 'parts', p_total, 'by', me.name, 'byId', me.id, 'at', now());
    insert into public.cmd_settings(key, body) values ('map', v_meta)
      on conflict (key) do update set body = excluded.body, updated_at = now();
    delete from public.cmd_map where v <> p_v;
    insert into public.cmd_map_log(by_id, by_name, action, meta) values (me.id, me.name, 'set', v_meta);
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- Go back to the built-in map. Administrator only.
create or replace function public.cmd_map_reset(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare me public.cmd_workers; v_meta jsonb;
begin
  me := public.cmd_me(p_token);
  if me.role <> 'admin' then return jsonb_build_object('ok', false, 'error', 'admin_only'); end if;
  v_meta := jsonb_build_object('v', 'default', 'by', me.name, 'byId', me.id, 'at', now());
  insert into public.cmd_settings(key, body) values ('map', v_meta)
    on conflict (key) do update set body = excluded.body, updated_at = now();
  delete from public.cmd_map;
  insert into public.cmd_map_log(by_id, by_name, action, meta) values (me.id, me.name, 'default', v_meta);
  return jsonb_build_object('ok', true);
end $$;

-- Which map is in use: any signed-in worker.
create or replace function public.cmd_map_info(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare me public.cmd_workers;
begin
  me := public.cmd_me(p_token);
  return coalesce((select body from public.cmd_settings where key = 'map'), jsonb_build_object('v', 'default'));
end $$;

-- One piece of the map in use: any signed-in worker.
create or replace function public.cmd_map_get(p_token text, p_v text, p_part int)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare me public.cmd_workers;
begin
  me := public.cmd_me(p_token);
  return (select body from public.cmd_map where v = p_v and part = p_part);
end $$;

revoke execute on function public.cmd_map_put(text, text, int, int, text, jsonb), public.cmd_map_reset(text), public.cmd_map_info(text), public.cmd_map_get(text, text, int) from public;
grant execute on function public.cmd_map_put(text, text, int, int, text, jsonb), public.cmd_map_reset(text), public.cmd_map_info(text), public.cmd_map_get(text, text, int) to anon, authenticated;

-- Neighbor Groups and Care Group areas (build 0.31): the plan fixed by the administrator, and a log of who changed it and when.
-- The plan is kept whole in the settings row 'plan'. It holds outlines, group numbers, Leader Neighbor names and Trainers; no health information.
create table if not exists public.cmd_plan_log (
  id      bigserial primary key,
  at      timestamptz not null default now(),
  by_id   text,
  by_name text,
  v       text,
  note    text
);
alter table public.cmd_plan_log enable row level security;
revoke all on public.cmd_plan_log from anon, authenticated;

-- Store the plan. Administrator only.
create or replace function public.cmd_plan_set(p_token text, p_body jsonb, p_note text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare me public.cmd_workers;
begin
  me := public.cmd_me(p_token);
  if me.role <> 'admin' then return jsonb_build_object('ok', false, 'error', 'admin_only'); end if;
  if jsonb_typeof(p_body) is distinct from 'object' or jsonb_typeof(p_body->'g') is distinct from 'array' or coalesce(p_body->>'v', '') = '' or length(p_body::text) > 2000000
    then return jsonb_build_object('ok', false, 'error', 'bad_input'); end if;
  insert into public.cmd_settings(key, body) values ('plan', p_body)
    on conflict (key) do update set body = excluded.body, updated_at = now();
  insert into public.cmd_plan_log(by_id, by_name, v, note) values (me.id, me.name, p_body->>'v', left(coalesce(p_note, ''), 500));
  return jsonb_build_object('ok', true);
end $$;

-- Which plan is in use: any signed-in worker. A tablet fetches the plan itself only when this version differs from its own.
create or replace function public.cmd_plan_info(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare me public.cmd_workers;
begin
  me := public.cmd_me(p_token);
  return coalesce((select jsonb_build_object('v', body->'v', 'at', updated_at) from public.cmd_settings where key = 'plan'), jsonb_build_object('v', null));
end $$;

-- The plan: any signed-in worker.
create or replace function public.cmd_plan_get(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare me public.cmd_workers;
begin
  me := public.cmd_me(p_token);
  return (select body from public.cmd_settings where key = 'plan');
end $$;

revoke execute on function public.cmd_plan_set(text, jsonb, text), public.cmd_plan_info(text), public.cmd_plan_get(text) from public;
grant execute on function public.cmd_plan_set(text, jsonb, text), public.cmd_plan_info(text), public.cmd_plan_get(text) to anon, authenticated;

notify pgrst, 'reload schema';
