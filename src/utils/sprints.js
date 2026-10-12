import dayjs from 'dayjs'

/** Valor del filtro de sprint para ver solo las tareas sin sprint. */
export const NO_SPRINT = '__none__'

export const SPRINT_PHASES = {
  active: { label: 'En curso', className: 'bg-emerald-50 text-emerald-700' },
  upcoming: { label: 'Próximo', className: 'bg-sky-50 text-sky-700' },
  finished: { label: 'Finalizado', className: 'bg-slate-100 text-slate-500' },
  undated: { label: 'Sin fechas', className: 'bg-slate-100 text-slate-500' },
}

/** Fase del sprint según sus fechas (comparadas por día). */
export function sprintPhase(sprint, today = dayjs()) {
  const { startDate, endDate } = sprint
  if (!startDate && !endDate) return 'undated'
  const d = today.format('YYYY-MM-DD')
  if (startDate && d < startDate) return 'upcoming'
  if (endDate && d > endDate) return 'finished'
  return 'active'
}

/** "26/01 – 06/02/2026" o lo que haya de las dos fechas. */
export function formatSprintRange({ startDate, endDate }) {
  const fmt = (v, withYear) => (v ? dayjs(v).format(withYear ? 'DD/MM/YYYY' : 'DD/MM') : '')
  if (startDate && endDate) {
    const sameYear = startDate.slice(0, 4) === endDate.slice(0, 4)
    return `${fmt(startDate, !sameYear)} – ${fmt(endDate, true)}`
  }
  if (startDate) return `Desde ${fmt(startDate, true)}`
  if (endDate) return `Hasta ${fmt(endDate, true)}`
  return ''
}
