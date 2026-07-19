-- ============================================================================
-- Kanban Board — Schema para Supabase (Postgres)
-- ============================================================================
-- Cómo usar:
--   1. Crea un proyecto gratis en https://supabase.com
--   2. Abre  SQL Editor  y pega TODO este archivo. Ejecuta (Run).
--   3. Copia Project URL y anon key (Settings -> API) a tu archivo .env
--      (ver .env.example).
--
-- Tablero ABIERTO (sin login): las políticas RLS permiten todo. Cuando quieras
-- restringir por usuario, reemplaza las políticas por unas basadas en auth.
-- ============================================================================

-- Limpieza (idempotente): permite re-ejecutar el script sin errores.
drop table if exists tasks cascade;
drop table if exists statuses cascade;
drop table if exists types cascade;
drop table if exists assignees cascade;
drop table if exists projects cascade;
drop table if exists meta cascade;

-- ------------------------------- Tablas -------------------------------------

create table statuses (
  id    text primary key,
  name  text not null,
  color text not null,
  "order" int  not null default 0
);

create table types (
  id    text primary key,
  name  text not null,
  icon  text not null default '',
  color text not null
);

create table assignees (
  id    text primary key,
  name  text not null,
  color text not null
);

create table projects (
  id    text primary key,
  name  text not null,
  color text not null
);

create table tasks (
  id                      text primary key,
  code                    int  not null,
  ticket                  text not null default '',
  project_id              text references projects(id) on delete set null,
  title                   text not null,
  description             text not null default '',
  status_id               text references statuses(id) on delete set null,
  type_id                 text references types(id)     on delete set null,
  assignee_ids            text[] not null default '{}',
  created_at              timestamptz,
  backlog_at              timestamptz,
  current_status_start_at timestamptz,
  current_status_end_at   timestamptz,
  prev_status_id          text,
  prev_status_end_at      timestamptz,
  gitlab_url              text not null default '',
  makaha_url              text not null default '',
  notes                   jsonb not null default '{"content":"","updatedAt":null}'::jsonb
);

-- Migración para bases existentes (si ya ejecutaste este schema antes y NO
-- quieres recrearlo desde cero, ejecuta solo esta línea para añadir las notas):
--   alter table tasks add column if not exists notes jsonb not null default '{"content":"","updatedAt":null}'::jsonb;

-- Contador compartido para el 'code' autoincremental de las tareas.
create table meta (
  id        text primary key default 'singleton',
  next_code int  not null
);

-- --------------------------- RLS (tablero abierto) --------------------------
alter table statuses  enable row level security;
alter table types     enable row level security;
alter table assignees enable row level security;
alter table projects  enable row level security;
alter table tasks     enable row level security;
alter table meta      enable row level security;

-- Políticas permisivas: cualquiera (anon) puede leer y escribir.
create policy "public all" on statuses  for all using (true) with check (true);
create policy "public all" on types     for all using (true) with check (true);
create policy "public all" on assignees for all using (true) with check (true);
create policy "public all" on projects  for all using (true) with check (true);
create policy "public all" on tasks     for all using (true) with check (true);
create policy "public all" on meta      for all using (true) with check (true);

-- ------------------------------- Realtime -----------------------------------
alter publication supabase_realtime add table statuses;
alter publication supabase_realtime add table types;
alter publication supabase_realtime add table assignees;
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table tasks;

-- ------------------------------- Seed inicial -------------------------------
insert into statuses (id, name, color, "order") values
  ('st-backlog',   'Backlog',          '#eab308', 0),
  ('st-progress',  'In Progress',      '#22c55e', 1),
  ('st-review',    'Code Review',      '#0ea5e9', 2),
  ('st-testing',   'Internal Testing', '#f97316', 3),
  ('st-feedbackA', 'Feedback A',       '#3b82f6', 4),
  ('st-feedbackB', 'Feedback B',       '#8b5cf6', 5),
  ('st-done',      'Done',             '#10b981', 6);

insert into types (id, name, icon, color) values
  ('ty-bug',         'Bug',           '🐞', '#ef4444'),
  ('ty-feature',     'Feature',       '✨', '#6366f1'),
  ('ty-docs',        'Documentation', '📄', '#0ea5e9'),
  ('ty-improvement', 'Improvement',   '🔧', '#f59e0b'),
  ('ty-deploy',      'Deployment',    '🚀', '#22c55e');

insert into assignees (id, name, color) values
  ('as-1', 'Jimmy',  '#6366f1'),
  ('as-2', 'Ana',    '#ec4899'),
  ('as-3', 'Carlos', '#14b8a6');

insert into projects (id, name, color) values
  ('pr-lms',          'LMS',          '#6366f1'),
  ('pr-lms-manager',  'LMS Manager',  '#0ea5e9'),
  ('pr-course-cloud', 'Course Cloud', '#22c55e');

insert into tasks
  (id, code, ticket, project_id, title, description, status_id, type_id,
   assignee_ids, created_at, backlog_at, current_status_start_at,
   current_status_end_at, gitlab_url, makaha_url, notes)
values
  ('tk-953', 953, '953', 'pr-lms',
   'Unify Search Functionality Across LMS', 'Course List, Catalog, My Courses.',
   'st-progress', 'ty-feature', '{as-1}',
   now(), '2026-01-15T12:00:00Z', '2026-01-30T12:00:00Z', null, '', '',
   '{"content":"# Reunión con el PM\nUnificar el buscador en Catalog primero.\n\n- [x] Actualizar variables de traducción\n- [ ] Probar en My Courses\n\n!! Revisar el endpoint /api/search mañana","updatedAt":null}'::jsonb),

  ('tk-974', 974, '974', 'pr-lms',
   'Global catalog search bar styling issue', '',
   'st-testing', 'ty-bug', '{as-2}',
   now(), '2026-01-20T12:00:00Z', '2026-01-30T12:00:00Z', null, '', '', '{"content":"","updatedAt":null}'::jsonb),

  ('tk-972', 972, '972', 'pr-course-cloud',
   'Old Certificate Generation Issues', '',
   'st-done', 'ty-bug', '{as-3}',
   now(), '2025-12-21T12:00:00Z', '2026-01-28T12:00:00Z', null, '', '', '{"content":"","updatedAt":null}'::jsonb),

  ('tk-917', 917, '917', 'pr-lms-manager',
   'Enable Portal Admin and Supervisor Access to Learner Certificates',
   'Ensure Certificate Visibility.',
   'st-feedbackA', 'ty-feature', '{as-1,as-2}',
   now(), '2025-12-15T12:00:00Z', '2025-12-15T12:00:00Z', null, '', '', '{"content":"","updatedAt":null}'::jsonb),

  ('tk-955', 955, '955', 'pr-lms',
   'Fix LMS Redirection After Session Timeout', '',
   'st-feedbackB', 'ty-bug', '{as-3}',
   now(), '2025-12-15T12:00:00Z', '2025-12-15T12:00:00Z', null, '', '', '{"content":"","updatedAt":null}'::jsonb),

  ('tk-922', 922, '922', 'pr-lms-manager',
   'Sidebar facelift', 'Still in progress; preparing the Figma links.',
   'st-backlog', 'ty-improvement', '{as-1}',
   now(), '2026-01-30T12:00:00Z', '2026-01-30T12:00:00Z', null, '', '', '{"content":"","updatedAt":null}'::jsonb);

insert into meta (id, next_code) values ('singleton', 975);
