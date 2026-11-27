-- CMD Register, update for build 0.24: the optional TB and HIV modules.
-- Run once in the Supabase SQL editor of the cmd-register project, AFTER update-0.18.sql and update-0.23.sql.
-- It can be run again without harm. It changes two functions and no table.
-- What it changes:
--   1. A new kind of record, 'hv': the confidential note that a person is on ART and has asked for the programme's support.
--      The clinic, a Promoter, a Trainer and the household's Leader Neighbor may send one. An Enumerator may not.
--   2. A Leader Neighbor's tablet receives such a record only when the person has agreed that she may know (lnOk).
--      Otherwise it receives an empty placeholder with no information.
-- The TB module and the module switches need no change on the server.

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
      when 'prom'   then v_prom = me.id and v_ty in ('p', 'v', 'ref', 'ev', 'q', 'hv')
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
             and (me.role in ('admin', 'clinic') or (me.role = 'prom' and t.prom = me.id) or (me.role = 'lnt' and t.lnt = me.id) or (me.role in ('ln', 'enum') and t.ln = me.id))
           order by t.seq limit 1000) q;
  return out_;
end $$;

notify pgrst, 'reload schema';
