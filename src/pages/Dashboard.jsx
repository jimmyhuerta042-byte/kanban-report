import { useState } from 'react'
import { Board } from '../components/kanban/Board'
import { FilterBar } from '../components/filters/FilterBar'
import { TaskModal } from '../components/modals/TaskModal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useBoard } from '../context/BoardContext'
import { useToast } from '../context/ToastContext'
import { useFilteredTasks, emptyFilters } from '../hooks/useFilteredTasks'
import { exportBoardPDF } from '../services/pdf'

export function Dashboard() {
  const { tasks, statuses, deleteTask, getType, getAssignees, getProject, loading } =
    useBoard()
  const toast = useToast()

  const [filters, setFilters] = useState(emptyFilters)
  const filtered = useFilteredTasks(tasks, filters)

  const [taskModal, setTaskModal] = useState({ open: false, task: null, statusId: null })
  const [confirm, setConfirm] = useState({ open: false, task: null })

  const openNew = (statusId = null) =>
    setTaskModal({ open: true, task: null, statusId })
  const openEdit = (task) => setTaskModal({ open: true, task, statusId: null })
  const closeModal = () => setTaskModal({ open: false, task: null, statusId: null })

  const handleExport = async () => {
    if (filtered.length === 0) {
      toast.error('No hay tareas para exportar con los filtros actuales.')
      return
    }
    try {
      await exportBoardPDF(filtered, { statuses, getType, getAssignees, getProject })
      toast.success(`PDF generado con ${filtered.length} tarea(s).`)
    } catch (err) {
      console.error(err)
      toast.error('No se pudo generar el PDF.')
    }
  }

  const handleDelete = () => {
    if (!confirm.task) return
    deleteTask(confirm.task.id)
    toast.success('Tarea eliminada.')
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        onExport={handleExport}
        onNewTask={openNew}
        resultCount={filtered.length}
      />

      <div className="min-h-0 flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-100/50">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
              <span className="text-sm font-medium">Cargando tablero…</span>
            </div>
          </div>
        ) : (
          <Board
            tasks={filtered}
            onAddTask={openNew}
            onEditTask={openEdit}
            onDeleteTask={(task) => setConfirm({ open: true, task })}
          />
        )}
      </div>

      <TaskModal
        open={taskModal.open}
        task={taskModal.task}
        defaultStatusId={taskModal.statusId}
        onClose={closeModal}
      />

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false, task: null })}
        onConfirm={handleDelete}
        title="Eliminar tarea"
        message={
          confirm.task
            ? `¿Eliminar la tarea #${confirm.task.code} “${confirm.task.title}”? Esta acción no se puede deshacer.`
            : ''
        }
      />
    </div>
  )
}
