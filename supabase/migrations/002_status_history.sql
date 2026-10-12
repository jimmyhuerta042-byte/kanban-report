-- ============================================================================
-- Migración: Historial de estados de las tareas
-- ============================================================================
-- Para bases que YA existen (no borra nada). Idempotente.
-- ============================================================================

alter table tasks
  add column if not exists status_history jsonb not null default '[]'::jsonb;

-- Las tareas existentes arrancan su historial en el estado actual, desde que
-- entraron en él (los cambios anteriores no se guardaban).
update tasks
set status_history = jsonb_build_array(
  jsonb_build_object('statusId', status_id, 'at', coalesce(current_status_start_at, created_at))
)
where status_history = '[]'::jsonb and status_id is not null;
