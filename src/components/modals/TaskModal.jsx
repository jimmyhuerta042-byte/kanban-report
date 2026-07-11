import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Field, Input, Textarea, Select } from '../ui/Field'
import { AssigneeSelect } from '../ui/AssigneeSelect'
import { useBoard } from '../../context/BoardContext'
import { useToast } from '../../context/ToastContext'
import { isoToInputDate, inputDateToISO } from '../../utils/dates'

const emptyForm = {
  title: '',
  ticket: '',
  projectId: '',
  description: '',
  statusId: '',
  typeId: '',
  assigneeIds: [],
  backlogAt: '',
  gitlabUrl: '',
  makahaUrl: '',
}

/**
 * Modal para crear o editar una tarea.
 * Si recibe `task`, funciona en modo edición.
 */
export function TaskModal({ open, onClose, task, defaultStatusId }) {
  const { statuses, types, assignees, projects, createTask, updateTask } = useBoard()
  const toast = useToast()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  const isEdit = Boolean(task)

  useEffect(() => {
    if (!open) return
    if (task) {
      setForm({
        title: task.title,
        ticket: task.ticket || '',
        projectId: task.projectId || '',
        description: task.description || '',
        statusId: task.statusId,
        typeId: task.typeId || '',
        assigneeIds: task.assigneeIds || [],
        backlogAt: isoToInputDate(task.backlogAt),
        gitlabUrl: task.gitlabUrl || '',
        makahaUrl: task.makahaUrl || '',
      })
    } else {
      setForm({
        ...emptyForm,
        statusId: defaultStatusId || statuses[0]?.id || '',
        typeId: types[0]?.id || '',
      })
    }
    setErrors({})
  }, [open, task, defaultStatusId, statuses, types])

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'El nombre es obligatorio.'
    if (!form.statusId) e.statusId = 'Selecciona un estado.'
    const urlOk = (v) => !v || /^https?:\/\//i.test(v.trim())
    if (!urlOk(form.gitlabUrl)) e.gitlabUrl = 'Debe empezar con http:// o https://'
    if (!urlOk(form.makahaUrl)) e.makahaUrl = 'Debe empezar con http:// o https://'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    if (!validate()) return

    const payload = {
      title: form.title,
      ticket: form.ticket,
      projectId: form.projectId || null,
      description: form.description,
      statusId: form.statusId,
      typeId: form.typeId || null,
      assigneeIds: form.assigneeIds,
      backlogAt: form.backlogAt ? inputDateToISO(form.backlogAt) : null,
      gitlabUrl: form.gitlabUrl,
      makahaUrl: form.makahaUrl,
    }

    if (isEdit) {
      updateTask(task.id, payload)
      toast.success('Tarea actualizada correctamente.')
    } else {
      createTask(payload)
      toast.success('Tarea creada correctamente.')
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? `Editar tarea #${task.code}` : 'Nueva tarea'}
      description={isEdit ? undefined : 'Se asignará un ID automático.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" form="task-form">
            {isEdit ? 'Guardar cambios' : 'Crear tarea'}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Nombre de la tarea" required error={errors.title}>
          <Input
            autoFocus
            value={form.title}
            invalid={!!errors.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Ej. Corregir búsqueda global"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="N° de ticket">
            <Input
              value={form.ticket}
              onChange={(e) => set('ticket', e.target.value)}
              placeholder="Ej. 953 o LMS-953"
            />
          </Field>

          <Field label="Proyecto">
            <Select value={form.projectId} onChange={(e) => set('projectId', e.target.value)}>
              <option value="">— Sin proyecto —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Descripción">
          <Textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Detalles adicionales (opcional)"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Estado" required error={errors.statusId}>
            <Select value={form.statusId} onChange={(e) => set('statusId', e.target.value)}>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Tipo de tarea">
            <Select value={form.typeId} onChange={(e) => set('typeId', e.target.value)}>
              <option value="">— Sin tipo —</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Fecha de Backlog">
            <Input
              type="date"
              value={form.backlogAt}
              onChange={(e) => set('backlogAt', e.target.value)}
            />
          </Field>
        </div>

        <Field label="Responsables">
          <AssigneeSelect
            assignees={assignees}
            value={form.assigneeIds}
            onChange={(ids) => set('assigneeIds', ids)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="URL de GitLab" error={errors.gitlabUrl}>
            <Input
              value={form.gitlabUrl}
              invalid={!!errors.gitlabUrl}
              onChange={(e) => set('gitlabUrl', e.target.value)}
              placeholder="https://gitlab.com/..."
            />
          </Field>
          <Field label="URL de Makaha" error={errors.makahaUrl}>
            <Input
              value={form.makahaUrl}
              invalid={!!errors.makahaUrl}
              onChange={(e) => set('makahaUrl', e.target.value)}
              placeholder="https://..."
            />
          </Field>
        </div>
      </form>
    </Modal>
  )
}
