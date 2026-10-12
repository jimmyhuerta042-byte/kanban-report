-- ============================================================================
-- Migración: Sprints
-- ============================================================================
-- Para bases que YA existen (no borra nada). Pégalo en SQL Editor y ejecútalo
-- una vez. Es idempotente: se puede volver a ejecutar sin errores.
-- ============================================================================

create table if not exists sprints (
  id         text primary key,
  name       text not null,
  goal       text not null default '',
  color      text not null,
  start_date date,
  end_date   date
);

alter table tasks
  add column if not exists sprint_id text references sprints(id) on delete set null;

alter table sprints enable row level security;

drop policy if exists "public all" on sprints;
create policy "public all" on sprints for all using (true) with check (true);

-- Realtime (solo si aún no está en la publicación).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sprints'
  ) then
    alter publication supabase_realtime add table sprints;
  end if;
end $$;
