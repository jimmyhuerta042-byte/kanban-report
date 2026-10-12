import { useEffect, useState } from 'react'
import { Board } from '../components/kanban/Board'
import { FilterBar } from '../components/filters/FilterBar'
import { TaskModal } from '../components/modals/TaskModal'
import { NotesModal } from '../components/modals/NotesModal'
import { HistoryModal } from '../components/modals/HistoryModal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useBoard } from '../context/BoardContext'
import { useToast } from '../context/ToastContext'
import { useFilteredTasks, emptyFilters } from '../hooks/useFilteredTasks'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { exportBoardPDF } from '../services/pdf'
import { NO_SPRINT, formatSprintRange } from '../utils/sprints'
import { formatDate, inputDateToISO } from '../utils/dates'

/**
 * Resume en inglés (como el resto del PDF) los filtros activos, para que quien
 * lea el PDF sepa que no está viendo todas las tareas. Vacío si no hay filtros.
 */
function describeFilters(filters, { getAssignees, getProject, getStatus, getType }) {
  const parts = []
  const text = filters.text.trim()
  if (text) parts.push(`Search: "${text}"`)
  const assignee = getAssignees([filters.assigneeId])[0]
  if (assignee) parts.push(`Assignee: ${assignee.name}`)
  const project = getProject(filters.projectId)
  if (project) parts.push(`Project: ${project.name}`)
  const status = getStatus(filters.statusId)
  if (status) parts.push(`Status: ${status.name}`)
  const type = getType(filters.typeId)
  if (type) parts.push(`Type: ${type.name}`)
  const from = formatDate(inputDateToISO(filters.from))
  const to = formatDate(inputDateToISO(filters.to))
  if (from && to) parts.push(`Backlog: ${from} – ${to}`)
  else if (from) parts.push(`Backlog from ${from}`)
  else if (to) parts.push(`Backlog until ${to}`)
  return parts.length ? `Filtered by: ${parts.join('   ·   ')}` : ''
}

export function Dashboard() {
  const {
    tasks,
    statuses,
    deleteTask,
    getType,
    getAssignees,
    getProject,
    getSprint,
    getStatus,
    loading,
  } = useBoard()
  const toast = useToast()

  const [filters, setFilters] = useState(emptyFilters)
  // El sprint elegido se recuerda en este navegador (p. ej. el de la reunión semanal).
  const [sprintId, setSprintId] = useLocalStorageState('dashboard.sprintId', '')
  const sprint = getSprint(sprintId)
  const filtered = useFilteredTasks(tasks, { ...filters, sprintId })

  // Si el sprint guardado se eliminó, vuelve a "Todos".
  useEffect(() => {
    if (!loading && sprintId && sprintId !== NO_SPRINT && !sprint) setSprintId('')
  }, [loading, sprintId, sprint, setSprintId])

  const [taskModal, setTaskModal] = useState({ open: false, task: null, statusId: null })
  const [notesTaskId, setNotesTaskId] = useState(null)
  const [confirm, setConfirm] = useState({ open: false, task: null })

  const openNew = (statusId = null) =>
    setTaskModal({ open: true, task: null, statusId })
  const openEdit = (task) => setTaskModal({ open: true, task, statusId: null })
  const closeModal = () => setTaskModal({ open: false, task: null, statusId: null })

  // Guardamos solo el id: así el modal siempre lee la versión viva de la tarea.
  const openNotes = (task) => setNotesTaskId(task.id)
  const notesTask = notesTaskId ? tasks.find((t) => t.id === notesTaskId) || null : null
  const [historyTaskId, setHistoryTaskId] = useState(null)
  const historyTask = historyTaskId ? tasks.find((t) => t.id === historyTaskId) || null : null

  const handleExport = async () => {
    if (filtered.length === 0) {
      toast.error('No hay tareas para exportar con los filtros actuales.')
      return
    }
    try {
      // El nombre ya dice "Sprint N": se muestra tal cual, con sus fechas (el PDF va
      // en inglés, así que solo el rango numérico, sin "Desde/Hasta").
      const range = sprint?.startDate && sprint?.endDate ? formatSprintRange(sprint) : ''
      const scope = sprint
        ? `${sprint.name}${range ? ` (${range})` : ''}`
        : sprintId === NO_SPRINT
          ? 'Tasks without sprint'
          : ''
      const filtersLine = describeFilters(filters, { getAssignees, getProject, getStatus, getType })
      await exportBoardPDF(filtered, {
        statuses,
        getType,
        getAssignees,
        getProject,
        scope,
        filtersLine,
      })
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
        sprintId={sprintId}
        onSprintChange={setSprintId}
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
            showSprint={!sprintId}
            onAddTask={openNew}
            onEditTask={openEdit}
            onDeleteTask={(task) => setConfirm({ open: true, task })}
            onNotesTask={openNotes}
            onHistoryTask={(task) => setHistoryTaskId(task.id)}
          />
        )}
      </div>

      <TaskModal
        open={taskModal.open}
        task={taskModal.task}
        defaultStatusId={taskModal.statusId}
        defaultSprintId={sprint?.id}
        onClose={closeModal}
      />

      <NotesModal
        open={Boolean(notesTask)}
        task={notesTask}
        onClose={() => setNotesTaskId(null)}
      />

      <HistoryModal
        open={Boolean(historyTask)}
        task={historyTask}
        onClose={() => setHistoryTaskId(null)}
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
