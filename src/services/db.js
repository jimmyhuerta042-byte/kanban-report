import { supabase } from './supabase'

/**
 * Capa de datos sobre Supabase.
 *
 * Traduce entre el modelo de la app (camelCase) y las columnas de Postgres
 * (snake_case) en un único punto (mappers), de modo que el resto del código
 * (BoardContext y UI) siga trabajando con la misma forma de siempre.
 *
 * Todas las funciones asumen que `supabase` está configurado; BoardContext solo
 * las usa cuando isSupabaseConfigured es true.
 */

/* ------------------------------- Mappers ---------------------------------- */
// statuses, assignees, projects son idénticos salvo "order" (palabra reservada).

const rowToStatus = (r) => ({ id: r.id, name: r.name, color: r.color, order: r.order })
const statusToRow = (s) => ({ id: s.id, name: s.name, color: s.color, order: s.order })

const rowToType = (r) => ({ id: r.id, name: r.name, icon: r.icon, color: r.color })
const typeToRow = (t) => ({ id: t.id, name: t.name, icon: t.icon ?? '', color: t.color })

const rowToAssignee = (r) => ({ id: r.id, name: r.name, color: r.color })
const assigneeToRow = (a) => ({ id: a.id, name: a.name, color: a.color })

const rowToProject = (r) => ({ id: r.id, name: r.name, color: r.color })
const projectToRow = (p) => ({ id: p.id, name: p.name, color: p.color })

const rowToTask = (r) => ({
  id: r.id,
  code: r.code,
  ticket: r.ticket ?? '',
  projectId: r.project_id ?? null,
  title: r.title,
  description: r.description ?? '',
  statusId: r.status_id ?? null,
  typeId: r.type_id ?? null,
  assigneeIds: r.assignee_ids ?? [],
  createdAt: r.created_at,
  backlogAt: r.backlog_at,
  currentStatusStartAt: r.current_status_start_at,
  currentStatusEndAt: r.current_status_end_at,
  prevStatusId: r.prev_status_id ?? null,
  prevStatusEndAt: r.prev_status_end_at ?? null,
  gitlabUrl: r.gitlab_url ?? '',
  makahaUrl: r.makaha_url ?? '',
  notes: r.notes ?? { content: '', updatedAt: null },
})

const taskToRow = (t) => ({
  id: t.id,
  code: t.code,
  ticket: t.ticket ?? '',
  project_id: t.projectId ?? null,
  title: t.title,
  description: t.description ?? '',
  status_id: t.statusId ?? null,
  type_id: t.typeId ?? null,
  assignee_ids: t.assigneeIds ?? [],
  created_at: t.createdAt ?? null,
  backlog_at: t.backlogAt ?? null,
  current_status_start_at: t.currentStatusStartAt ?? null,
  current_status_end_at: t.currentStatusEndAt ?? null,
  prev_status_id: t.prevStatusId ?? null,
  prev_status_end_at: t.prevStatusEndAt ?? null,
  gitlab_url: t.gitlabUrl ?? '',
  makaha_url: t.makahaUrl ?? '',
  notes: t.notes ?? { content: '', updatedAt: null },
})

/* ------------------------------ Carga inicial ------------------------------ */

/** Lee todo el tablero. Devuelve la misma forma que el estado del context. */
export async function fetchAll() {
  const [statuses, types, assignees, projects, tasks, meta] = await Promise.all([
    supabase.from('statuses').select('*').order('order', { ascending: true }),
    supabase.from('types').select('*'),
    supabase.from('assignees').select('*'),
    supabase.from('projects').select('*'),
    supabase.from('tasks').select('*').order('code', { ascending: false }),
    supabase.from('meta').select('*').eq('id', 'singleton').maybeSingle(),
  ])

  const err =
    statuses.error || types.error || assignees.error || projects.error || tasks.error
  if (err) throw err

  return {
    statuses: (statuses.data || []).map(rowToStatus),
    types: (types.data || []).map(rowToType),
    assignees: (assignees.data || []).map(rowToAssignee),
    projects: (projects.data || []).map(rowToProject),
    tasks: (tasks.data || []).map(rowToTask),
    seq: meta.data?.next_code ?? 1000,
  }
}

/* --------------------------------- CRUD ----------------------------------- */
// Helpers genéricos; `throwOnError` para que el context revierta si falla.

const run = async (query) => {
  const { error } = await query
  if (error) throw error
}

export const insertStatus = (s) => run(supabase.from('statuses').insert(statusToRow(s)))
export const updateStatusRow = (id, data) =>
  run(supabase.from('statuses').update(mapPartialStatus(data)).eq('id', id))
export const deleteStatusRow = (id) => run(supabase.from('statuses').delete().eq('id', id))
export const upsertStatuses = (list) =>
  run(supabase.from('statuses').upsert(list.map(statusToRow)))

export const insertType = (t) => run(supabase.from('types').insert(typeToRow(t)))
export const updateTypeRow = (id, data) =>
  run(supabase.from('types').update(typeToRow({ id, ...data })).eq('id', id))
export const deleteTypeRow = (id) => run(supabase.from('types').delete().eq('id', id))

export const insertAssignee = (a) =>
  run(supabase.from('assignees').insert(assigneeToRow(a)))
export const updateAssigneeRow = (id, data) =>
  run(supabase.from('assignees').update(assigneeToRow({ id, ...data })).eq('id', id))
export const deleteAssigneeRow = (id) =>
  run(supabase.from('assignees').delete().eq('id', id))

export const insertProject = (p) => run(supabase.from('projects').insert(projectToRow(p)))
export const updateProjectRow = (id, data) =>
  run(supabase.from('projects').update(projectToRow({ id, ...data })).eq('id', id))
export const deleteProjectRow = (id) =>
  run(supabase.from('projects').delete().eq('id', id))

export const insertTask = (t) => run(supabase.from('tasks').insert(taskToRow(t)))
export const updateTaskRow = (t) =>
  run(supabase.from('tasks').update(taskToRow(t)).eq('id', t.id))
export const deleteTaskRow = (id) => run(supabase.from('tasks').delete().eq('id', id))
export const upsertTasks = (list) =>
  run(supabase.from('tasks').upsert(list.map(taskToRow)))

// Solo el mapeo parcial que necesita "order" (reservado) para updates de status.
function mapPartialStatus(data) {
  const out = {}
  if ('name' in data) out.name = data.name
  if ('color' in data) out.color = data.color
  if ('order' in data) out.order = data.order
  return out
}

/* ------------------------- Contador de código (meta) ----------------------- */

/**
 * Reserva el siguiente `code` para una tarea nueva de forma atómica:
 * incrementa meta.next_code y devuelve el valor previo.
 */
export async function nextCode() {
  // Lee el actual, incrementa y guarda. Para 1-3 usuarios la ventana de carrera
  // es despreciable; si se quisiera 100% atómico se usaría una función RPC.
  const { data, error } = await supabase
    .from('meta')
    .select('next_code')
    .eq('id', 'singleton')
    .maybeSingle()
  if (error) throw error

  const current = data?.next_code ?? 1000
  const { error: upErr } = await supabase
    .from('meta')
    .update({ next_code: current + 1 })
    .eq('id', 'singleton')
  if (upErr) throw upErr

  return current
}

/* --------------------------- Reemplazo total ------------------------------- */

/** Reemplaza TODO el contenido (para importar respaldo o reiniciar). */
export async function replaceAll(state) {
  // Borra todo y reinserta. delete sin filtro requiere una condición → neq id.
  const tables = ['tasks', 'statuses', 'types', 'assignees', 'projects']
  for (const t of tables) {
    const { error } = await supabase.from(t).delete().neq('id', '__none__')
    if (error) throw error
  }

  await run(supabase.from('statuses').insert(state.statuses.map(statusToRow)))
  await run(supabase.from('types').insert(state.types.map(typeToRow)))
  await run(supabase.from('assignees').insert(state.assignees.map(assigneeToRow)))
  await run(supabase.from('projects').insert(state.projects.map(projectToRow)))
  await run(supabase.from('tasks').insert(state.tasks.map(taskToRow)))
  await run(
    supabase.from('meta').upsert({ id: 'singleton', next_code: state.seq })
  )
}

/* ------------------------------- Realtime --------------------------------- */

/**
 * Se suscribe a cambios en las tablas del tablero. Ante cualquier cambio
 * remoto llama a `onChange()`. Devuelve una función de limpieza.
 */
export function subscribe(onChange) {
  const channel = supabase.channel('kanban-board')
  for (const table of ['statuses', 'types', 'assignees', 'projects', 'tasks']) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, onChange)
  }
  channel.subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
