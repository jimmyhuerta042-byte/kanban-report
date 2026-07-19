import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { TaskCard } from './TaskCard'
import { contrastText } from '../../utils/colors'
import { cn } from '../../utils/cn'

/**
 * Columna del tablero que representa un estado.
 * Es zona soltable (droppable) para el Drag & Drop.
 */
export function Column({ status, tasks, onAddTask, onEditTask, onDeleteTask, onNotesTask }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
    data: { type: 'column', statusId: status.id },
  })

  return (
    <div className="flex w-[300px] shrink-0 flex-col self-start">
      {/* Encabezado con color del estado (fijo al hacer scroll vertical) */}
      <div
        className="sticky top-0 z-10 mb-3 flex items-center justify-between rounded-lg px-3 py-2 shadow-sm"
        style={{ backgroundColor: status.color, color: contrastText(status.color) }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-wide">{status.name}</span>
          <span
            className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold"
            style={{
              backgroundColor: 'rgba(255,255,255,0.28)',
            }}
          >
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(status.id)}
          className="flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-white/25"
          style={{ color: contrastText(status.color) }}
          title="Agregar tarea"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Lista de tarjetas / zona soltable (sin scroll propio: scrollea la pizarra) */}
      <div
        ref={setNodeRef}
        className={cn(
          'min-h-[120px] space-y-2.5 rounded-xl p-2 transition-colors',
          isOver ? 'bg-indigo-50/70 ring-2 ring-indigo-200' : 'bg-slate-200/40'
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onNotes={onNotesTask}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <button
            onClick={() => onAddTask(status.id)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-6 text-xs font-medium text-slate-400 transition hover:border-indigo-300 hover:text-indigo-500"
          >
            <Plus size={14} /> Agregar tarea
          </button>
        )}
      </div>
    </div>
  )
}
