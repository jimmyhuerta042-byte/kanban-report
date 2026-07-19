import { useEffect, useMemo, useState } from 'react'
import { StickyNote, Pencil, Eye, Square, CheckSquare, AlertTriangle } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useBoard } from '../../context/BoardContext'
import { useToast } from '../../context/ToastContext'
import { nowISO, formatDateTime } from '../../utils/dates'
import {
  normalizeNotes,
  parseNotes,
  toggleChecklistLine,
} from '../../utils/notes'
import { cn } from '../../utils/cn'

const PLACEHOLDER = `Escribe aquí lo que quieras…

Ejemplos:
# Reunión con Peter
Revisar el bug del módulo X antes del deploy.

- [ ] Actualizar variables de traducción
- [x] Probar en My Courses

!! Falta el paso 3 del deploy — retomar mañana

Comandos:
\`\`\`
npm run build
npm run deploy:staging
\`\`\``

/**
 * Modal de notas por tarea: una hoja de texto libre compartida con Markdown
 * ligero (checkboxes, urgentes, listas, código). Dos modos: Vista y Editar.
 * Es colaborativa: todos ven y editan la misma hoja de la tarea.
 */
export function NotesModal({ open, onClose, task }) {
  const { updateTaskNotes } = useBoard()
  const toast = useToast()
  const [content, setContent] = useState('')
  const [editing, setEditing] = useState(false)

  // Carga las notas de la tarea al abrir.
  useEffect(() => {
    if (!open || !task) return
    const { content } = normalizeNotes(task.notes)
    setContent(content)
    // Si la hoja está vacía, arranca en modo edición para escribir de una.
    setEditing(content.trim() === '')
  }, [open, task])

  const tokens = useMemo(() => parseNotes(content), [content])
  const updatedAt = task ? normalizeNotes(task.notes).updatedAt : null

  if (!task) return null

  const ticketLabel = task.ticket?.trim() || `#${task.code}`

  const save = () => {
    const trimmed = content.replace(/\s+$/, '')
    updateTaskNotes(task.id, { content: trimmed, updatedAt: nowISO() })
    toast.success('Notas guardadas.')
    onClose()
  }

  // Alterna un checkbox directamente en la vista y persiste al instante.
  const toggleLine = (lineIndex) => {
    const next = toggleChecklistLine(content, lineIndex)
    if (next === content) return
    setContent(next)
    updateTaskNotes(task.id, { content: next, updatedAt: nowISO() })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={
        <span className="inline-flex items-center gap-2">
          <StickyNote size={18} className="text-amber-500" />
          Notas · {ticketLabel}
        </span>
      }
      description={task.title}
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-xs text-slate-400">
            {updatedAt ? `Editado ${formatDateTime(updatedAt)}` : 'Sin cambios guardados'}
          </span>
          <div className="flex items-center gap-2">
            {editing ? (
              <Button variant="secondary" size="sm" onClick={() => setEditing(false)} type="button">
                <Eye size={15} /> Vista
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)} type="button">
                <Pencil size={15} /> Editar
              </Button>
            )}
            <Button size="sm" onClick={save} type="button">
              Guardar
            </Button>
          </div>
        </div>
      }
    >
      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={PLACEHOLDER}
            className="min-h-[45vh] w-full resize-y rounded-xl border border-amber-200 bg-amber-50 p-4 font-mono text-sm leading-relaxed text-slate-800 placeholder:text-amber-500/50 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
          <p className="px-1 text-xs text-slate-400">
            Atajos: <code className="text-slate-500">- [ ]</code> pendiente ·{' '}
            <code className="text-slate-500">!! texto</code> urgente ·{' '}
            <code className="text-slate-500"># título</code> ·{' '}
            <code className="text-slate-500">```</code> bloque de comandos
          </p>
        </div>
      ) : (
        <NotesView tokens={tokens} onToggle={toggleLine} />
      )}
    </Modal>
  )
}

/**
 * Renderiza los tokens de la hoja en modo lectura. Los checkboxes son
 * clickeables; las líneas urgentes se resaltan en rojo.
 */
function NotesView({ tokens, onToggle }) {
  const hasAny = tokens.some((t) => t.type !== 'blank')
  if (!hasAny) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-400">
        Esta hoja está vacía. Pulsa <span className="font-medium text-slate-500">Editar</span> para escribir.
      </div>
    )
  }

  return (
    <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-col gap-0.5 text-sm leading-relaxed text-slate-800">
        {tokens.map((tok, i) => {
          switch (tok.type) {
            case 'blank':
              return <div key={i} className="h-2" />
            case 'heading':
              return (
                <h3
                  key={i}
                  className={cn(
                    'font-semibold text-slate-900',
                    tok.level === 1 ? 'mt-1 text-base' : 'mt-0.5 text-sm'
                  )}
                >
                  {tok.text}
                </h3>
              )
            case 'checkbox':
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onToggle(tok.lineIndex)}
                  className="group flex items-start gap-2 rounded px-1 py-0.5 text-left transition hover:bg-amber-100/60"
                >
                  <span className="mt-0.5 shrink-0 text-amber-600">
                    {tok.done ? <CheckSquare size={16} /> : <Square size={16} />}
                  </span>
                  <span className={cn(tok.done && 'text-slate-400 line-through')}>
                    {tok.text || <span className="text-amber-500/60">(pendiente vacío)</span>}
                  </span>
                </button>
              )
            case 'ordered':
              return (
                <div key={i} className="flex gap-2 pl-1">
                  <span className="shrink-0 font-semibold text-amber-600">{tok.num}.</span>
                  <span>{tok.text}</span>
                </div>
              )
            case 'urgent':
              return (
                <div
                  key={i}
                  className="my-0.5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 font-medium text-red-700"
                >
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span>{tok.text}</span>
                </div>
              )
            case 'code':
              return (
                <pre
                  key={i}
                  className="my-1 overflow-x-auto rounded-lg bg-slate-800 px-3 py-2 font-mono text-xs leading-relaxed text-slate-100"
                >
                  {tok.text}
                </pre>
              )
            default:
              return (
                <p key={i} className="whitespace-pre-wrap">
                  {tok.text}
                </p>
              )
          }
        })}
      </div>
    </div>
  )
}
