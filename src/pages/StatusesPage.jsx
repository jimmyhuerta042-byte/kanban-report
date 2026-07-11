import { useState } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2, Plus, Columns3 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Field, Input } from '../components/ui/Field'
import { ColorPicker } from '../components/ui/ColorPicker'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ManagementLayout } from '../layouts/ManagementLayout'
import { PALETTE, contrastText } from '../utils/colors'
import { useBoard } from '../context/BoardContext'
import { useToast } from '../context/ToastContext'

function SortableRow({ status, count, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: status.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-card ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-slate-300 transition hover:text-slate-500 active:cursor-grabbing"
        title="Reordenar"
      >
        <GripVertical size={18} />
      </button>
      <span
        className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
        style={{ backgroundColor: status.color, color: contrastText(status.color) }}
      >
        {status.order + 1}
      </span>
      <span className="flex-1 font-medium text-slate-800">{status.name}</span>
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
        {count} tarea(s)
      </span>
      <button
        onClick={() => onEdit(status)}
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
        title="Editar"
      >
        <Pencil size={16} />
      </button>
      <button
        onClick={() => onDelete(status)}
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        title="Eliminar"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

export function StatusesPage() {
  const {
    statuses,
    addStatus,
    updateStatus,
    deleteStatus,
    reorderStatuses,
    countTasksByStatus,
  } = useBoard()
  const toast = useToast()

  const [modal, setModal] = useState({ open: false, status: null })
  const [form, setForm] = useState({ name: '', color: PALETTE[0] })
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState({ open: false, status: null })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const openNew = () => {
    setForm({ name: '', color: PALETTE[0] })
    setError('')
    setModal({ open: true, status: null })
  }
  const openEdit = (status) => {
    setForm({ name: status.name, color: status.color })
    setError('')
    setModal({ open: true, status })
  }

  const save = () => {
    if (!form.name.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    if (modal.status) {
      updateStatus(modal.status.id, { name: form.name.trim(), color: form.color })
      toast.success('Estado actualizado.')
    } else {
      addStatus({ name: form.name.trim(), color: form.color })
      toast.success('Estado creado.')
    }
    setModal({ open: false, status: null })
  }

  const requestDelete = (status) => {
    const count = countTasksByStatus(status.id)
    if (count > 0) {
      toast.error(`No puedes eliminar “${status.name}”: tiene ${count} tarea(s).`)
      return
    }
    if (statuses.length <= 1) {
      toast.error('Debe existir al menos un estado.')
      return
    }
    setConfirm({ open: true, status })
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = statuses.map((s) => s.id)
    const oldIndex = ids.indexOf(active.id)
    const newIndex = ids.indexOf(over.id)
    reorderStatuses(arrayMove(ids, oldIndex, newIndex))
  }

  return (
    <ManagementLayout
      icon={Columns3}
      title="Gestión de Estados"
      subtitle="Crea, edita, reordena y elimina las columnas del tablero."
      action={
        <Button onClick={openNew}>
          <Plus size={16} /> Nuevo estado
        </Button>
      }
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={statuses.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {statuses.map((status) => (
              <SortableRow
                key={status.id}
                status={status}
                count={countTasksByStatus(status.id)}
                onEdit={openEdit}
                onDelete={requestDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, status: null })}
        title={modal.status ? 'Editar estado' : 'Nuevo estado'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal({ open: false, status: null })}>
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
              placeholder="Ej. In Review"
            />
          </Field>
          <Field label="Color del encabezado">
            <ColorPicker
              value={form.color}
              onChange={(color) => setForm((f) => ({ ...f, color }))}
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false, status: null })}
        onConfirm={() => {
          deleteStatus(confirm.status.id)
          toast.success('Estado eliminado.')
        }}
        title="Eliminar estado"
        message={confirm.status ? `¿Eliminar el estado “${confirm.status.name}”?` : ''}
      />
    </ManagementLayout>
  )
}
