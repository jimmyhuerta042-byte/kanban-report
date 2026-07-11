import { useState } from 'react'
import { Pencil, Trash2, Plus, Users } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Field, Input } from '../components/ui/Field'
import { ColorPicker } from '../components/ui/ColorPicker'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ManagementLayout } from '../layouts/ManagementLayout'
import { EmptyState } from '../components/ui/EmptyState'
import { PALETTE, contrastText } from '../utils/colors'
import { useBoard } from '../context/BoardContext'
import { useToast } from '../context/ToastContext'

export function AssigneesPage() {
  const { assignees, addAssignee, updateAssignee, deleteAssignee, countTasksByAssignee } =
    useBoard()
  const toast = useToast()

  const [modal, setModal] = useState({ open: false, assignee: null })
  const [form, setForm] = useState({ name: '', color: PALETTE[0] })
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState({ open: false, assignee: null })

  const openNew = () => {
    setForm({ name: '', color: PALETTE[0] })
    setError('')
    setModal({ open: true, assignee: null })
  }
  const openEdit = (assignee) => {
    setForm({ name: assignee.name, color: assignee.color })
    setError('')
    setModal({ open: true, assignee })
  }

  const save = () => {
    if (!form.name.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    if (modal.assignee) {
      updateAssignee(modal.assignee.id, { name: form.name.trim(), color: form.color })
      toast.success('Responsable actualizado.')
    } else {
      addAssignee({ name: form.name.trim(), color: form.color })
      toast.success('Responsable creado.')
    }
    setModal({ open: false, assignee: null })
  }

  return (
    <ManagementLayout
      icon={Users}
      title="Gestión de Responsables"
      subtitle="Administra las personas que pueden asignarse a las tareas."
      action={
        <Button onClick={openNew}>
          <Plus size={16} /> Nuevo responsable
        </Button>
      }
    >
      {assignees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin responsables"
          description="Agrega personas para poder asignarlas a las tareas."
          action={
            <Button onClick={openNew}>
              <Plus size={16} /> Nuevo responsable
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {assignees.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-card"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                style={{ backgroundColor: a.color, color: contrastText(a.color) }}
              >
                {a.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="flex-1">
                <p className="font-medium text-slate-800">{a.name}</p>
                <span className="text-xs text-slate-500">
                  {countTasksByAssignee(a.id)} tarea(s)
                </span>
              </div>
              <button
                onClick={() => openEdit(a)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
                title="Editar"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => setConfirm({ open: true, assignee: a })}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, assignee: null })}
        title={modal.assignee ? 'Editar responsable' : 'Nuevo responsable'}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setModal({ open: false, assignee: null })}
            >
              Cancelar
            </Button>
            <Button onClick={save}>Guardar</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Nombre" required error={error}>
            <Input
              autoFocus
              value={form.name}
              invalid={!!error}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej. María"
            />
          </Field>
          <Field label="Color identificador">
            <ColorPicker
              value={form.color}
              onChange={(color) => setForm((f) => ({ ...f, color }))}
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false, assignee: null })}
        onConfirm={() => {
          deleteAssignee(confirm.assignee.id)
          toast.success('Responsable eliminado.')
        }}
        title="Eliminar responsable"
        message={
          confirm.assignee
            ? `¿Eliminar a “${confirm.assignee.name}”? Se quitará de las tareas asignadas.`
            : ''
        }
      />
    </ManagementLayout>
  )
}
