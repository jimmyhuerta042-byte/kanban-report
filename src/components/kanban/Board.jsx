import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { Column } from './Column'
import { TaskCard } from './TaskCard'
import { useBoard } from '../../context/BoardContext'

/**
 * Tablero Kanban completo con Drag & Drop entre columnas.
 * `tasks` recibe ya las tareas filtradas.
 */
export function Board({ tasks, onAddTask, onEditTask, onDeleteTask, onNotesTask }) {
  const { statuses, moveTask } = useBoard()
  const [activeTask, setActiveTask] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const tasksByStatus = (statusId) => tasks.filter((t) => t.statusId === statusId)

  const handleDragStart = (event) => {
    const task = event.active.data.current?.task
    if (task) setActiveTask(task)
  }

  const handleDragEnd = (event) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const taskId = active.id
    // El destino puede ser una columna (droppable) o una tarjeta (sortable).
    const overData = over.data.current
    let targetStatusId = null
    if (overData?.type === 'column') {
      targetStatusId = overData.statusId
    } else if (overData?.type === 'task') {
      targetStatusId = overData.task.statusId
    }
    if (!targetStatusId) return

    const activeStatusId = active.data.current?.task?.statusId
    if (targetStatusId !== activeStatusId) {
      moveTask(taskId, targetStatusId)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      {/* Pizarra: contenedor único con scroll vertical y horizontal. */}
      <div
        id="kanban-board"
        className="h-full w-full overflow-auto rounded-2xl border border-slate-200 bg-slate-100/50 p-4"
      >
        <div className="flex min-h-full w-max gap-4">
          {statuses.map((status) => (
            <Column
              key={status.id}
              status={status}
              tasks={tasksByStatus(status.id)}
              onAddTask={onAddTask}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onNotesTask={onNotesTask}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeTask ? (
          <div className="w-[284px]">
            <TaskCard task={activeTask} overlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
