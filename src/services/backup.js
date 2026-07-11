import dayjs from 'dayjs'

/**
 * Copia de seguridad e intercambio de datos.
 *
 * Como toda la información vive en LocalStorage (sin backend), este módulo permite
 * exportar TODO el tablero a un archivo .json y volver a importarlo en otro
 * navegador o equipo. Es la forma de "compartir" el estado sin nube.
 */

export const BACKUP_VERSION = 1

/** Construye el objeto de respaldo a partir del estado actual. */
export function buildBackup({ statuses, types, assignees, projects, tasks, seq }) {
  return {
    app: 'kanban-board',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: { statuses, types, assignees, projects, tasks, seq },
  }
}

/** Descarga el respaldo como archivo .json. */
export function downloadBackup(state) {
  const backup = buildBackup(state)
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kanban-backup-${dayjs().format('YYYY-MM-DD-HHmm')}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Valida y normaliza un respaldo importado.
 * Devuelve { ok, data } o { ok: false, error }.
 */
export function parseBackup(raw) {
  let parsed
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return { ok: false, error: 'El archivo no es un JSON válido.' }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'El archivo no tiene el formato esperado.' }
  }

  const data = parsed.data || parsed
  const required = ['statuses', 'types', 'assignees', 'projects', 'tasks']
  for (const key of required) {
    if (!Array.isArray(data[key])) {
      return { ok: false, error: `Falta o es inválida la sección "${key}".` }
    }
  }

  const seq =
    Number.isFinite(data.seq) && data.seq > 0
      ? data.seq
      : // Si no viene seq, calcúlalo a partir del mayor code + 1.
        data.tasks.reduce((m, t) => Math.max(m, Number(t.code) || 0), 999) + 1

  return {
    ok: true,
    data: {
      statuses: data.statuses,
      types: data.types,
      assignees: data.assignees,
      projects: data.projects,
      tasks: data.tasks,
      seq,
    },
  }
}

/** Lee un File (input type=file) y devuelve su texto. */
export function readFileText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    reader.readAsText(file)
  })
}
