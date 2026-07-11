/**
 * Capa fina sobre LocalStorage con serialización JSON y manejo de errores.
 */
const PREFIX = 'kanban.'

export function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch (err) {
    console.warn(`No se pudo leer "${key}" de LocalStorage`, err)
    return fallback
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch (err) {
    console.error(`No se pudo guardar "${key}" en LocalStorage`, err)
    return false
  }
}

export function removeStorage(key) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch (err) {
    console.warn(`No se pudo eliminar "${key}"`, err)
  }
}

export const STORAGE_KEYS = {
  statuses: 'statuses',
  types: 'types',
  assignees: 'assignees',
  projects: 'projects',
  tasks: 'tasks',
  seq: 'seq',
}
