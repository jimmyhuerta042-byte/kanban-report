import { useState } from 'react'
import { Pencil, Trash2, Plus, FolderKanban } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Field, Input } from '../components/ui/Field'
import { ColorPicker } from '../components/ui/ColorPicker'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ManagementLayout } from '../layouts/ManagementLayout'
import { EmptyState } from '../components/ui/EmptyState'
import { PALETTE, withAlpha } from '../utils/colors'
import { useBoard } from '../context/BoardContext'
import { useToast } from '../context/ToastContext'

export function ProjectsPage() {
  const { projects, addProject, updateProject, deleteProject, countTasksByProject } =
    useBoard()
  const toast = useToast()

  const [modal, setModal] = useState({ open: false, project: null })
  const [form, setForm] = useState({ name: '', color: PALETTE[0] })
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState({ open: false, project: null })

  const openNew = () => {
    setForm({ name: '', color: PALETTE[0] })
    setError('')
    setModal({ open: true, project: null })
  }
  const openEdit = (project) => {
    setForm({ name: project.name, color: project.color })
    setError('')
    setModal({ open: true, project })
  }

  const save = () => {
    if (!form.name.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    if (modal.project) {
      updateProject(modal.project.id, { name: form.name.trim(), color: form.color })
      toast.success('Proyecto actualizado.')
    } else {
      addProject({ name: form.name.trim(), color: form.color })
      toast.success('Proyecto creado.')
    }
    setModal({ open: false, project: null })
  }

  return (
    <ManagementLayout
      icon={FolderKanban}
      title="Gestión de Proyectos"
      subtitle="Agrupa las tareas por proyecto (LMS, LMS Manager, Course Cloud...)."
      action={
        <Button onClick={openNew}>
          <Plus size={16} /> Nuevo proyecto
        </Button>
      }
    >
      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Sin proyectos"
          description="Crea proyectos para clasificar tus tareas."
          action={
            <Button onClick={openNew}>
              <Plus size={16} /> Nuevo proyecto
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-card"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: withAlpha(p.color, 0.15), color: p.color }}
              >
                <FolderKanban size={18} />
              </span>
              <div className="flex-1">
                <p className="font-medium text-slate-800">{p.name}</p>
                <span className="text-xs font-medium" style={{ color: p.color }}>
                  {countTasksByProject(p.id)} tarea(s)
                </span>
              </div>
              <button
                onClick={() => openEdit(p)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
                title="Editar"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => setConfirm({ open: true, project: p })}
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
        onClose={() => setModal({ open: false, project: null })}
        title={modal.project ? 'Editar proyecto' : 'Nuevo proyecto'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal({ open: false, project: null })}>
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
              placeholder="Ej. Course Cloud"
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
        onClose={() => setConfirm({ open: false, project: null })}
        onConfirm={() => {
          deleteProject(confirm.project.id)
          toast.success('Proyecto eliminado.')
        }}
        title="Eliminar proyecto"
        message={
          confirm.project
            ? `¿Eliminar el proyecto “${confirm.project.name}”? Se quitará de las tareas asignadas.`
            : ''
        }
      />
    </ManagementLayout>
  )
}
