import { useState } from 'react'
import { Pencil, Trash2, Plus, Tags } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Field, Input } from '../components/ui/Field'
import { ColorPicker } from '../components/ui/ColorPicker'
import { IconPicker, TYPE_ICONS } from '../components/ui/IconPicker'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ManagementLayout } from '../layouts/ManagementLayout'
import { EmptyState } from '../components/ui/EmptyState'
import { PALETTE, withAlpha } from '../utils/colors'
import { useBoard } from '../context/BoardContext'
import { useToast } from '../context/ToastContext'

export function TypesPage() {
  const { types, addType, updateType, deleteType, countTasksByType } = useBoard()
  const toast = useToast()

  const [modal, setModal] = useState({ open: false, type: null })
  const [form, setForm] = useState({ name: '', icon: TYPE_ICONS[0], color: PALETTE[0] })
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState({ open: false, type: null })

  const openNew = () => {
    setForm({ name: '', icon: TYPE_ICONS[0], color: PALETTE[0] })
    setError('')
    setModal({ open: true, type: null })
  }
  const openEdit = (type) => {
    setForm({ name: type.name, icon: type.icon, color: type.color })
    setError('')
    setModal({ open: true, type })
  }

  const save = () => {
    if (!form.name.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    if (modal.type) {
      updateType(modal.type.id, { name: form.name.trim(), icon: form.icon, color: form.color })
      toast.success('Tipo actualizado.')
    } else {
      addType({ name: form.name.trim(), icon: form.icon, color: form.color })
      toast.success('Tipo creado.')
    }
    setModal({ open: false, type: null })
  }

  const requestDelete = (type) => {
    const count = countTasksByType(type.id)
    if (count > 0) {
      toast.error(`No puedes eliminar “${type.name}”: lo usan ${count} tarea(s).`)
      return
    }
    setConfirm({ open: true, type })
  }

  return (
    <ManagementLayout
      icon={Tags}
      title="Gestión de Tipos de Tarea"
      subtitle="Define los tipos y su color, usado para identificar las tarjetas."
      action={
        <Button onClick={openNew}>
          <Plus size={16} /> Nuevo tipo
        </Button>
      }
    >
      {types.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Sin tipos de tarea"
          description="Crea el primer tipo para empezar a clasificar tus tareas."
          action={
            <Button onClick={openNew}>
              <Plus size={16} /> Nuevo tipo
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {types.map((type) => (
            <div
              key={type.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-card"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
                style={{ backgroundColor: withAlpha(type.color, 0.15) }}
              >
                {type.icon}
              </span>
              <div className="flex-1">
                <p className="font-medium text-slate-800">{type.name}</p>
                <span
                  className="text-xs font-medium"
                  style={{ color: type.color }}
                >
                  {countTasksByType(type.id)} tarea(s)
                </span>
              </div>
              <button
                onClick={() => openEdit(type)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
                title="Editar"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => requestDelete(type)}
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
        onClose={() => setModal({ open: false, type: null })}
        title={modal.type ? 'Editar tipo' : 'Nuevo tipo'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal({ open: false, type: null })}>
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
              placeholder="Ej. Hotfix"
            />
          </Field>
          <Field label="Icono">
            <IconPicker
              value={form.icon}
              onChange={(icon) => setForm((f) => ({ ...f, icon }))}
            />
          </Field>
          <Field label="Color">
            <ColorPicker
              value={form.color}
              onChange={(color) => setForm((f) => ({ ...f, color }))}
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false, type: null })}
        onConfirm={() => {
          deleteType(confirm.type.id)
          toast.success('Tipo eliminado.')
        }}
        title="Eliminar tipo"
        message={confirm.type ? `¿Eliminar el tipo “${confirm.type.name}”?` : ''}
      />
    </ManagementLayout>
  )
}
