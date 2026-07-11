import dayjs from 'dayjs'
import 'dayjs/locale/es'

dayjs.locale('es')

/** Devuelve la fecha/hora actual en ISO. */
export function nowISO() {
  return dayjs().toISOString()
}

/** Formatea una fecha ISO a formato legible dd/MM/YYYY. Vacío si no hay fecha. */
export function formatDate(iso) {
  if (!iso) return ''
  return dayjs(iso).format('DD/MM/YYYY')
}

/** Formatea fecha con hora. */
export function formatDateTime(iso) {
  if (!iso) return ''
  return dayjs(iso).format('DD/MM/YYYY HH:mm')
}

/** Convierte un valor de input date (YYYY-MM-DD) a ISO manteniendo la hora local. */
export function inputDateToISO(value) {
  if (!value) return null
  return dayjs(value).toISOString()
}

/** Convierte ISO a valor para input date (YYYY-MM-DD). */
export function isoToInputDate(iso) {
  if (!iso) return ''
  return dayjs(iso).format('YYYY-MM-DD')
}

/** True si `iso` está dentro del rango [from, to] (ambos opcionales, en YYYY-MM-DD). */
export function isWithinRange(iso, from, to) {
  if (!iso) return !from && !to ? true : false
  const d = dayjs(iso).startOf('day')
  if (from && d.isBefore(dayjs(from).startOf('day'))) return false
  if (to && d.isAfter(dayjs(to).startOf('day'))) return false
  return true
}
