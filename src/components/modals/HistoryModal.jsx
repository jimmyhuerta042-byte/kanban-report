import { useMemo } from 'react'
import dayjs from 'dayjs'
import { Modal } from '../ui/Modal'
import { useBoard } from '../../context/BoardContext'
import { formatDateTime } from '../../utils/dates'
import {
  getStatusHistory,
  historySegments,
  timeByStatus,
  formatDuration,
} from '../../utils/statusHistory'
import { cn } from '../../utils/cn'

/**
 * Historial de estados de una tarea: cuánto tiempo pasó en cada estado y la
 * línea de tiempo completa (incluye las vueltas atrás).
 */
export function HistoryModal({ open, onClose, task }) {
  const { statuses, getStatus } = useBoard()

  const segments = useMemo(() => (task ? historySegments(task) : []), [task])
  const totals = useMemo(() => timeByStatus(segments), [segments])

  if (!task) return null

  const ticketLabel = task.ticket?.trim() || `#${task.code}`
  const statusOf = (id) => getStatus(id) || { name: 'Estado eliminado', color: '#cbd5e1' }
  // Resumen en el orden de las columnas del tablero.
  const summary = [
    ...statuses.filter((s) => totals.has(s.id)).map((s) => [s.id, totals.get(s.id)]),
    ...[...totals].filter(([id]) => !getStatus(id)),
  ]
  const maxMs = Math.max(1, ...summary.map(([, ms]) => ms))

  // Si la tarea es anterior al historial, el primer registro es posterior a su creación.
  const first = getStatusHistory(task)[0]
  const partial =
    task.createdAt && first?.at && dayjs(first.at).diff(dayjs(task.createdAt), 'minute') > 1

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`Historial de ${ticketLabel}`}
      description={task.title}
    >
      <div className="flex flex-col gap-6">
        <section>
          <SectionTitle>Tiempo por estado</SectionTitle>
          <ul className="flex flex-col gap-2">
            {summary.map(([id, ms]) => {
              const status = statusOf(id)
              return (
                <li key={id} className="flex items-center gap-3 text-sm">
                  <span className="w-36 shrink-0 truncate font-medium text-slate-700">
                    {status.name}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(2, (ms / maxMs) * 100)}%`,
                        backgroundColor: status.color,
                      }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs font-semibold text-slate-600">
                    {formatDuration(ms)}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>

        <section>
          <SectionTitle>Línea de tiempo</SectionTitle>
          <ol className="relative flex flex-col">
            {segments.map((seg, i) => {
              const status = statusOf(seg.statusId)
              const current = seg.end === null
              return (
                <li key={`${seg.start}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
                  {/* Línea vertical que une los puntos */}
                  {!current && (
                    <span className="absolute left-[5px] top-4 h-full w-px bg-slate-200" />
                  )}
                  <span
                    className="relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full ring-2 ring-white"
                    style={{ backgroundColor: status.color }}
                  />
                  <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-sm font-medium text-slate-800">
                      {status.name}
                      {current && (
                        <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                          Actual
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        current ? 'text-indigo-600' : 'text-slate-500'
                      )}
                    >
                      {formatDuration(seg.ms)}
                    </span>
                    <span className="w-full text-xs text-slate-400">
                      Desde {formatDateTime(seg.start)}
                      {seg.end && ` hasta ${formatDateTime(seg.end)}`}
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        {partial && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            El historial de esta tarea se registra desde el {formatDateTime(first.at)}; los
            cambios de estado anteriores no se guardaban.
          </p>
        )}
      </div>
    </Modal>
  )
}

function SectionTitle({ children }) {
  return (
    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      {children}
    </h3>
  )
}
