import dayjs from 'dayjs'

/**
 * Historial de estados de una tarea: lista de { statusId, at } en orden, una
 * entrada por cada vez que la tarea entra a un estado. El tiempo en cada estado
 * es la diferencia con la entrada siguiente (o con ahora, si es el actual).
 */

/**
 * Historial de la tarea. Las tareas anteriores a esta función no lo tienen:
 * se parte de su estado actual desde que entró en él.
 */
export function getStatusHistory(task) {
  if (Array.isArray(task.statusHistory) && task.statusHistory.length) return task.statusHistory
  return [{ statusId: task.statusId, at: task.currentStatusStartAt || task.createdAt }]
}

/** Devuelve el historial con una nueva entrada al final. */
export function appendStatus(task, statusId, at) {
  return [...getStatusHistory(task), { statusId, at }]
}

/** Tramos del historial con su duración en ms; el último es el actual (end = null). */
export function historySegments(task, now = dayjs()) {
  const history = getStatusHistory(task)
  return history.map((entry, i) => {
    const next = history[i + 1]
    const start = dayjs(entry.at)
    const end = next ? dayjs(next.at) : null
    return {
      statusId: entry.statusId,
      start: entry.at,
      end: next ? next.at : null,
      ms: Math.max(0, (end || now).diff(start)),
    }
  })
}

/** Tiempo total por estado (un estado puede repetirse si la tarea vuelve atrás). */
export function timeByStatus(segments) {
  const totals = new Map()
  for (const s of segments) totals.set(s.statusId, (totals.get(s.statusId) || 0) + s.ms)
  return totals
}

/** "3 d 4 h", "6 h 20 min", "15 min", "< 1 min". */
export function formatDuration(ms) {
  const min = Math.floor(ms / 60000)
  if (min < 1) return '< 1 min'
  const d = Math.floor(min / 1440)
  const h = Math.floor((min % 1440) / 60)
  const m = min % 60
  if (d) return h ? `${d} d ${h} h` : `${d} d`
  if (h) return m ? `${h} h ${m} min` : `${h} h`
  return `${m} min`
}

/**
 * Hitos de la tarea según los estados "a partir de aquí" (ver milestones en
 * BoardContext):
 * - deliveries: cada vez que cruzó a entregada (más de una si el cliente la devolvió).
 * - deliveredAt / closedAt: cruce vigente, o null si ahora no lo está.
 * - teamMs: tiempo antes de la entrega, sin contar `backlogStatusId` (aún no empezada).
 * - clientMs: tiempo entregada y sin cerrar (revisión del cliente).
 * Los estados eliminados no cuentan para ningún lado.
 */
export function statusMilestones(task, { statusOrder, milestones, backlogStatusId }) {
  const { deliveryOrder, closeOrder } = milestones
  const deliveries = []
  let delivered = false
  let closed = false
  let closedAt = null
  let teamMs = 0
  let clientMs = 0

  for (const seg of historySegments(task)) {
    const order = statusOrder(seg.statusId)
    if (order === null) continue
    const isDelivered = order >= deliveryOrder
    const isClosed = order >= closeOrder
    if (isDelivered && !delivered) deliveries.push(seg.start)
    if (isClosed && !closed) closedAt = seg.start
    delivered = isDelivered
    closed = isClosed

    if (!isDelivered && seg.statusId !== backlogStatusId) teamMs += seg.ms
    else if (isDelivered && !isClosed) clientMs += seg.ms
  }

  return {
    deliveries,
    deliveredAt: delivered ? deliveries[deliveries.length - 1] : null,
    closedAt: closed ? closedAt : null,
    teamMs,
    clientMs,
  }
}
