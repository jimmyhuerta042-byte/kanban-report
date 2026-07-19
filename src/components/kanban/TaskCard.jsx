import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GitBranch, ExternalLink, Calendar, Pencil, Trash2, StickyNote } from 'lucide-react'
import { useBoard } from '../../context/BoardContext'
import { AssigneeChip } from '../ui/Badge'
import { formatDate } from '../../utils/dates'
import { withAlpha } from '../../utils/colors'
import { hasContent, hasUrgent } from '../../utils/notes'
import { cn } from '../../utils/cn'

/**
 * Tarjeta de tarea del tablero. Arrastrable mediante dnd-kit.
 */
export function TaskCard({ task, onEdit, onDelete, onNotes, overlay = false }) {
  const { getType, getAssignees, getProject } = useBoard()
  const type = getType(task.typeId)
  const people = getAssignees(task.assigneeIds)
  const project = getProject(task.projectId)
  const ticketLabel = task.ticket?.trim() || `#${task.code}`
  const notesFilled = hasContent(task.notes)
  const notesUrgent = notesFilled && hasUrgent(task.notes)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'task', task } })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    borderLeftColor: type?.color || '#cbd5e1',
  }

  const stop = (e) => e.stopPropagation()

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group relative cursor-grab rounded-xl border border-slate-200 border-l-4 bg-white p-3 shadow-card transition-shadow active:cursor-grabbing',
        'hover:shadow-card-hover',
        isDragging && !overlay && 'opacity-40',
        overlay && 'rotate-2 shadow-card-hover'
      )}
    >
      {/* Cabecera: tipo + acciones */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {type ? (
            <span
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
              style={{ backgroundColor: withAlpha(type.color, 0.14), color: type.color }}
            >
              <span>{type.icon}</span>
              {type.name}
            </span>
          ) : (
            <span className="text-[11px] font-medium text-slate-400">Sin tipo</span>
          )}
        </div>
        <span className="shrink-0 text-[11px] font-semibold text-slate-400">
          {ticketLabel}
        </span>
      </div>

      {/* Proyecto */}
      {project && (
        <span
          className="mb-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
          style={{ backgroundColor: withAlpha(project.color, 0.14), color: project.color }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: project.color }} />
          {project.name}
        </span>
      )}

      {/* Título */}
      <h4 className="mb-2 text-sm font-semibold leading-snug text-slate-800">
        {task.title}
      </h4>

      {/* Responsables */}
      {people.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1">
          {people.map((a) => (
            <AssigneeChip key={a.id} assignee={a} />
          ))}
        </div>
      )}

      {/* Pie: fecha backlog + enlaces */}
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
          <Calendar size={12} />
          {formatDate(task.backlogAt) || '—'}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              stop(e)
              onNotes?.(task)
            }}
            onPointerDown={stop}
            title={
              notesUrgent
                ? 'Notas · tiene pendientes urgentes'
                : notesFilled
                  ? 'Ver notas'
                  : 'Añadir notas'
            }
            className={cn(
              'relative flex h-6 w-6 items-center justify-center rounded-md transition',
              notesFilled
                ? 'text-amber-500 hover:bg-amber-50 hover:text-amber-600'
                : 'text-slate-400 hover:bg-amber-50 hover:text-amber-600'
            )}
          >
            <StickyNote size={14} />
            {notesUrgent && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>
          {task.gitlabUrl && (
            <a
              href={task.gitlabUrl}
              target="_blank"
              rel="noreferrer"
              onClick={stop}
              onPointerDown={stop}
              title="Abrir GitLab"
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-orange-50 hover:text-orange-600"
            >
              <GitBranch size={14} />
            </a>
          )}
          {task.makahaUrl && (
            <a
              href={task.makahaUrl}
              target="_blank"
              rel="noreferrer"
              onClick={stop}
              onPointerDown={stop}
              title="Abrir Makaha"
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>

      {/* Acciones (aparecen al pasar el mouse) */}
      <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 transition group-hover:opacity-100">
        <button
          onClick={(e) => {
            stop(e)
            onEdit?.(task)
          }}
          onPointerDown={stop}
          className="flex h-6 w-6 items-center justify-center rounded-md bg-white/90 text-slate-400 shadow-sm ring-1 ring-slate-200 transition hover:text-indigo-600"
          title="Editar"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={(e) => {
            stop(e)
            onDelete?.(task)
          }}
          onPointerDown={stop}
          className="flex h-6 w-6 items-center justify-center rounded-md bg-white/90 text-slate-400 shadow-sm ring-1 ring-slate-200 transition hover:text-red-600"
          title="Eliminar"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}
