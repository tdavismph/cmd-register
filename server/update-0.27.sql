-- CMD Register, update for build 0.27: the census map area chosen by the administrator.
-- Run once in the Supabase SQL editor of the cmd-register project. It can be run again without harm.
-- It adds two tables and four functions and changes nothing that exists. No earlier update is needed for this one,
-- though the earlier ones (0.18, 0.23, 0.24, 0.25) should already have been run for the rest of the app.

-- The census map chosen by the administrator in place of the built-in one (build 0.27).
-- The trimmed map is kept as text in pieces; the settings row 'map' says which version is in use, and who chose it and when.
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

notify pgrst, 'reload schema';
