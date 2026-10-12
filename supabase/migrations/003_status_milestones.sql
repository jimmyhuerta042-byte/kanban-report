-- ============================================================================
-- Migración: Estados que marcan la entrega al cliente y el cierre
-- ============================================================================
-- Para bases que YA existen (no borra nada). Idempotente.
-- Deja marcados "Feedback A" como entrega y "Done" como cierre (por nombre),
-- solo si todavía no hay ningún estado marcado. Luego se cambia desde la app
-- (Estados -> editar).
-- ============================================================================

alter table statuses add column if not exists marks_delivery boolean not null default false;
alter table statuses add column if not exists marks_close    boolean not null default false;

update statuses set marks_delivery = true
where lower(trim(name)) = 'feedback a'
  and not exists (select 1 from statuses where marks_delivery);

update statuses set marks_close = true
where lower(trim(name)) = 'done'
  and not exists (select 1 from statuses where marks_close);
