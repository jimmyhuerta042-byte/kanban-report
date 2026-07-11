import { useRef, useState } from 'react'
import { Download, Upload, RotateCcw, Database } from 'lucide-react'
import { useBoard } from '../context/BoardContext'
import { useToast } from '../context/ToastContext'
import { downloadBackup, parseBackup, readFileText } from '../services/backup'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { ConfirmDialog } from './ui/ConfirmDialog'

/**
 * Acciones de datos: exportar / importar el tablero completo (JSON) y reiniciar.
 * Es la forma de compartir o respaldar el estado sin backend.
 */
export function DataMenu({ compact = false }) {
  const { exportState, importState, resetToSeed } = useBoard()
  const toast = useToast()
  const fileRef = useRef(null)
  const [pending, setPending] = useState(null) // datos importados esperando confirmación
  const [confirmReset, setConfirmReset] = useState(false)

  const handleExport = () => {
    downloadBackup(exportState())
    toast.success('Respaldo exportado. Compártelo con tu equipo.')
  }

  const handlePickFile = () => fileRef.current?.click()

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permite reimportar el mismo archivo
    if (!file) return
    try {
      const text = await readFileText(file)
      const result = parseBackup(text)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setPending(result.data) // pedir confirmación antes de reemplazar
    } catch (err) {
      console.error(err)
      toast.error('No se pudo leer el archivo.')
    }
  }

  const confirmImport = () => {
    importState(pending)
    setPending(null)
    toast.success('Datos importados correctamente.')
  }

  const btnClass = compact
    ? 'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800'
    : 'flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100'

  return (
    <div className="flex flex-col gap-0.5">
      {!compact && (
        <div className="mb-1 flex items-center gap-2 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          <Database size={13} /> Datos
        </div>
      )}

      <button onClick={handleExport} className={btnClass} title="Exportar respaldo (JSON)">
        <Download size={18} className="shrink-0" />
        <span className={compact ? 'hidden lg:block' : ''}>Exportar</span>
      </button>

      <button onClick={handlePickFile} className={btnClass} title="Importar respaldo (JSON)">
        <Upload size={18} className="shrink-0" />
        <span className={compact ? 'hidden lg:block' : ''}>Importar</span>
      </button>

      <button
        onClick={() => setConfirmReset(true)}
        className={btnClass}
        title="Reiniciar a datos de ejemplo"
      >
        <RotateCcw size={18} className="shrink-0" />
        <span className={compact ? 'hidden lg:block' : ''}>Reiniciar</span>
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFile}
      />

      {/* Confirmar importación (reemplaza todo) */}
      <Modal
        open={!!pending}
        onClose={() => setPending(null)}
        title="Importar datos"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPending(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmImport}>Reemplazar e importar</Button>
          </>
        }
      >
        {pending && (
          <p className="text-sm leading-relaxed text-slate-600">
            Se reemplazará <strong>todo el tablero actual</strong> por el contenido del archivo:
            {' '}
            {pending.tasks.length} tarea(s), {pending.projects.length} proyecto(s),{' '}
            {pending.statuses.length} estado(s). Esta acción no se puede deshacer.
            <br />
            <span className="mt-2 block text-slate-400">
              Sugerencia: exporta un respaldo antes, por si acaso.
            </span>
          </p>
        )}
      </Modal>

      {/* Confirmar reinicio */}
      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetToSeed()
          toast.success('Tablero reiniciado a los datos de ejemplo.')
        }}
        title="Reiniciar tablero"
        message="Se borrará todo tu contenido actual y se cargarán los datos de ejemplo. ¿Continuar?"
        confirmLabel="Sí, reiniciar"
      />
    </div>
  )
}
