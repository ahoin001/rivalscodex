-- Service-role writers (HTML import, roster sync) INSERT into tables with
-- bigserial PKs. Table-level INSERT grants do not include nextval() on the
-- linked sequences — without USAGE+SELECT on the sequence, inserts fail with:
--   permission denied for sequence hero_asset_id_seq

do $$
declare
  seq record;
begin
  for seq in
    select format('%I.%I', n.nspname, c.relname) as qualified_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'app_rivalscodex_v1'
      and c.relkind = 'S'
  loop
    execute format(
      'grant usage, select on sequence %s to service_role',
      seq.qualified_name
    );
  end loop;
end $$;
