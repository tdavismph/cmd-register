-- CMD Register, update for build 0.31: Neighbor Groups and Care Group areas.
-- Run once in the Supabase SQL editor of the cmd-register project. It can be run again without harm.
-- It replaces one function (saving a worker, so that a Leader Neighbor can be moved to another Trainer's Care Group),
-- and adds one table and three functions for the plan of Neighbor Groups and Care Group areas. It changes no data.
-- The earlier updates (0.18, 0.23, 0.24, 0.25, 0.27) should already have been run.

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
