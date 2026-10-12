import { useState } from 'react'
import { Pencil, Trash2, Plus, Flag, ListChecks, Inbox } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Field, Input, Textarea } from '../components/ui/Field'
import { ColorPicker } from '../components/ui/ColorPicker'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ManagementLayout } from '../layouts/ManagementLayout'
import { EmptyState } from '../components/ui/EmptyState'
import { SprintTasksModal } from '../components/modals/SprintTasksModal'
import { PALETTE } from '../utils/colors'
import { SPRINT_PHASES, sprintPhase, formatSprintRange } from '../utils/sprints'
import { cn } from '../utils/cn'
import { useBoard } from '../context/BoardContext'
import { useToast } from '../context/ToastContext'

const emptyForm = { name: '', goal: '', startDate: '', endDate: '', color: PALETTE[0] }

export function SprintsPage() {
  const { sprints, tasks, doneStatusId, addSprint, updateSprint, deleteSprint } = useBoard()
  const toast = useToast()

  const [modal, setModal] = useState({ open: false, sprint: null })
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [confirm, setConfirm] = useState({ open: false, sprint: null })
  // Guardamos solo el id: así el modal siempre lee la versión viva del sprint.
  const [planningId, setPlanningId] = useState(null)
  const planning = planningId ? sprints.find((s) => s.id === planningId) || null : null

  const looseCount = tasks.filter((t) => !t.sprintId).length
  const statsOf = (sprintId) => {
    const own = tasks.filter((t) => t.sprintId === sprintId)
    return { total: own.length, done: own.filter((t) => t.statusId === doneStatusId).length }
  }

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const openNew = () => {
    // Sugiere el nombre y el color siguientes para no repetir.
    setForm({
      ...emptyForm,
      name: `Sprint ${sprints.length + 1}`,
      color: PALETTE[sprints.length % PALETTE.length],
    })
    setErrors({})
    setModal({ open: true, sprint: null })
  }
  const openEdit = (sprint) => {
    setForm({
      name: sprint.name,
      goal: sprint.goal || '',
      startDate: sprint.startDate || '',
      endDate: sprint.endDate || '',
      color: sprint.color,
    })
    setErrors({})
    setModal({ open: true, sprint })
  }
  const closeModal = () => setModal({ open: false, sprint: null })

  const save = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'El nombre es obligatorio.'
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      e.endDate = 'La fecha de fin no puede ser anterior al inicio.'
    setErrors(e)
    if (Object.keys(e).length) return

    const data = { ...form, name: form.name.trim(), goal: form.goal.trim() }
    if (modal.sprint) {
      updateSprint(modal.sprint.id, data)
      toast.success('Sprint actualizado.')
    } else {
      addSprint(data)
      toast.success('Sprint creado.')
    }
    closeModal()
  }

  return (
    <ManagementLayout
      icon={Flag}
      title="Sprints"
      subtitle="Agrupa las tareas por sprint y filtra el tablero por el que estés revisando."
      action={
        <Button onClick={openNew}>
          <Plus size={16} /> Nuevo sprint
        </Button>
      }
    >
      {/* Tareas sueltas */}
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <Inbox size={18} />
        </span>
        <div className="flex-1">
          <p className="font-medium text-slate-800">Tareas sueltas</p>
          <span className="text-xs text-slate-500">
            {looseCount} tarea(s) sin sprint. Añádelas desde “Tareas” de cada sprint.
          </span>
        </div>
      </div>

      {sprints.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="Sin sprints"
          description="Crea un sprint para agrupar las tareas que se revisarán juntas."
          action={
            <Button onClick={openNew}>
              <Plus size={16} /> Nuevo sprint
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {sprints.map((s) => {
            const phase = SPRINT_PHASES[sprintPhase(s)]
            const { total, done } = statsOf(s.id)
            const pct = total ? Math.round((done / total) * 100) : 0
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 border-l-4 bg-white p-3 shadow-card"
                style={{ borderLeftColor: s.color }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-800">{s.name}</p>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                        phase.className
                      )}
                    >
                      {phase.label}
                    </span>
                    {formatSprintRange(s) && (
                      <span className="text-xs text-slate-400">{formatSprintRange(s)}</span>
                    )}
                  </div>
                  {s.goal && <p className="mt-0.5 truncate text-sm text-slate-500">{s.goal}</p>}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: s.color }}
                      />
                    </div>
                    <span className="text-xs font-medium" style={{ color: s.color }}>
                      {done}/{total} terminada(s)
                    </span>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPlanningId(s.id)}
                >
                  <ListChecks size={15} /> Tareas
                </Button>
                <button
                  onClick={() => openEdit(s)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
                  title="Editar"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setConfirm({ open: true, sprint: s })}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={modal.open}
        onClose={closeModal}
        title={modal.sprint ? 'Editar sprint' : 'Nuevo sprint'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button onClick={save}>Guardar</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Nombre" required error={errors.name}>
            <Input
              autoFocus
              value={form.name}
              invalid={!!errors.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ej. Sprint 12 · Certificados"
            />
          </Field>
          <Field label="Objetivo">
            <Textarea
              value={form.goal}
              onChange={(e) => set('goal', e.target.value)}
              placeholder="Qué se quiere lograr en este sprint (opcional)"
              className="min-h-[60px]"
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Inicio">
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
              />
            </Field>
            <Field label="Fin" error={errors.endDate}>
              <Input
                type="date"
                value={form.endDate}
                invalid={!!errors.endDate}
                onChange={(e) => set('endDate', e.target.value)}
              />
            </Field>
          </div>
          <Field label="Color identificador">
            <ColorPicker value={form.color} onChange={(color) => set('color', color)} />
          </Field>
        </div>
      </Modal>

      <SprintTasksModal
        open={Boolean(planning)}
        sprint={planning}
        onClose={() => setPlanningId(null)}
      />

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false, sprint: null })}
        onConfirm={() => {
          deleteSprint(confirm.sprint.id)
          toast.success('Sprint eliminado.')
        }}
        title="Eliminar sprint"
        message={
          confirm.sprint
            ? `¿Eliminar el sprint “${confirm.sprint.name}”? Sus tareas no se borran: quedarán sueltas.`
            : ''
        }
      />
    </ManagementLayout>
  )
}
