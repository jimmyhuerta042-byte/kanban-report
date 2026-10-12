import { useEffect, useMemo, useState } from 'react'
import { Search, Plus, X, ArrowRightLeft } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Select } from '../ui/Field'
import { useBoard } from '../../context/BoardContext'
import { useToast } from '../../context/ToastContext'
import { formatSprintRange } from '../../utils/sprints'
import { cn } from '../../utils/cn'

/**
 * Planificación de un sprint: ver sus tareas, sacarlas o moverlas a otro sprint
 * (p. ej. por retrasos) y añadir tareas sueltas.
 */
export function SprintTasksModal({ open, sprint, onClose }) {
  const { tasks, sprints, isTaskDelivered, moveTasksToSprint } = useBoard()
  const toast = useToast()
  const [selected, setSelected] = useState([])
  const [query, setQuery] = useState('')
  const [carryTo, setCarryTo] = useState('')

  useEffect(() => {
    if (!open) return
    setSelected([])
    setQuery('')
    setCarryTo('')
  }, [open, sprint?.id])

  const others = sprints.filter((s) => s.id !== sprint?.id)
  const own = useMemo(
    () => (sprint ? tasks.filter((t) => t.sprintId === sprint.id) : []),
    [tasks, sprint]
  )
  // Pendientes = aún no entregadas. Lo que espera revisión del cliente se queda
  // en el sprint donde se entregó.
  const pending = own.filter((t) => !isTaskDelivered(t))

  const loose = useMemo(() => {
    const text = query.trim().toLowerCase()
    return tasks.filter((t) => {
      if (t.sprintId) return false
      if (!text) return true
      return `${t.title} ${t.ticket || ''} #${t.code}`.toLowerCase().includes(text)
    })
  }, [tasks, query])

  if (!sprint) return null

  const sprintName = (id) => others.find((s) => s.id === id)?.name || 'Sin sprint'

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const addSelected = () => {
    moveTasksToSprint(selected, sprint.id)
    toast.success(`${selected.length} tarea(s) añadida(s) a “${sprint.name}”.`)
    setSelected([])
  }

  const moveOne = (task, targetId) => {
    moveTasksToSprint([task.id], targetId || null)
    toast.success(`#${task.code} movida a “${sprintName(targetId)}”.`)
  }

  const carryOver = () => {
    moveTasksToSprint(
      pending.map((t) => t.id),
      carryTo || null
    )
    toast.success(`${pending.length} tarea(s) pendiente(s) movida(s) a “${sprintName(carryTo)}”.`)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`Tareas de “${sprint.name}”`}
      description={formatSprintRange(sprint) || undefined}
    >
      <div className="flex flex-col gap-6">
        {/* En este sprint */}
        <section>
          <SectionTitle>En este sprint ({own.length})</SectionTitle>
          {own.length === 0 ? (
            <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-400">
              Aún no hay tareas. Añade tareas sueltas desde abajo.
            </p>
          ) : (
            <ul className="flex max-h-64 flex-col divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
              {own.map((t) => (
                <TaskRow key={t.id} task={t}>
                  <Select
                    value=""
                    onChange={(e) => moveOne(t, e.target.value === '-' ? '' : e.target.value)}
                    className="h-8 !w-40 shrink-0 !py-1 text-xs"
                    title="Mover a otro sprint o dejarla suelta"
                  >
                    <option value="" disabled>
                      Mover a…
                    </option>
                    {others.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                    <option value="-">Sin sprint (quitar)</option>
                  </Select>
                </TaskRow>
              ))}
            </ul>
          )}

          {/* Arrastre de pendientes (retrasos) */}
          {pending.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              <ArrowRightLeft size={15} className="shrink-0" />
              <span className="flex-1">
                {pending.length} tarea(s) sin entregar. Moverlas todas a:
              </span>
              <Select
                value={carryTo}
                onChange={(e) => setCarryTo(e.target.value)}
                className="h-8 !w-44 !py-1 text-xs"
              >
                <option value="">Sin sprint</option>
                {others.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
              <Button size="sm" variant="secondary" onClick={carryOver}>
                Mover
              </Button>
            </div>
          )}
        </section>

        {/* Tareas sueltas */}
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <SectionTitle className="mb-0">Tareas sueltas ({loose.length})</SectionTitle>
            <Button size="sm" onClick={addSelected} disabled={selected.length === 0}>
              <Plus size={14} /> Añadir {selected.length > 0 && `(${selected.length})`}
            </Button>
          </div>
          <div className="relative mb-2">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar tarea suelta..."
              className="pl-9"
            />
          </div>
          {loose.length === 0 ? (
            <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-400">
              {query ? 'Ninguna tarea suelta coincide.' : 'No hay tareas sueltas.'}
            </p>
          ) : (
            <ul className="flex max-h-64 flex-col divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
              {loose.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  as="label"
                  className={cn(
                    'cursor-pointer hover:bg-slate-50',
                    selected.includes(t.id) && 'bg-indigo-50/60'
                  )}
                  leading={
                    <input
                      type="checkbox"
                      checked={selected.includes(t.id)}
                      onChange={() => toggle(t.id)}
                      className="h-4 w-4 shrink-0 accent-indigo-600"
                    />
                  }
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          <X size={15} /> Cerrar
        </Button>
      </div>
    </Modal>
  )
}

function SectionTitle({ children, className }) {
  return (
    <h3
      className={cn(
        'mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400',
        className
      )}
    >
      {children}
    </h3>
  )
}

/** Fila compacta de tarea: ticket, título y estado. */
function TaskRow({ task, as: Comp = 'div', leading, className, children }) {
  const { getStatus } = useBoard()
  const status = getStatus(task.statusId)
  return (
    <li>
      <Comp className={cn('flex items-center gap-3 px-3 py-2', className)}>
        {leading}
        <span className="w-14 shrink-0 text-[11px] font-semibold text-slate-400">
          {task.ticket?.trim() || `#${task.code}`}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-slate-700" title={task.title}>
          {task.title}
        </span>
        {status && (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: status.color }} />
            {status.name}
          </span>
        )}
        {children}
      </Comp>
    </li>
  )
}
