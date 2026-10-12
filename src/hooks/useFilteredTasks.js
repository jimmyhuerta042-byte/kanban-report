import { useMemo } from 'react'
import { isWithinRange } from '../utils/dates'
import { NO_SPRINT } from '../utils/sprints'

/**
 * Aplica todos los filtros combinados sobre la lista de tareas.
 */
export function useFilteredTasks(tasks, filters) {
  return useMemo(() => {
    const text = filters.text.trim().toLowerCase()
    return tasks.filter((t) => {
      if (text) {
        const haystack = `${t.title} ${t.ticket || ''} #${t.code} ${t.description}`.toLowerCase()
        if (!haystack.includes(text)) return false
      }
      if (filters.assigneeId && !t.assigneeIds.includes(filters.assigneeId)) return false
      if (filters.statusId && t.statusId !== filters.statusId) return false
      if (filters.typeId && t.typeId !== filters.typeId) return false
      if (filters.projectId && t.projectId !== filters.projectId) return false
      if (filters.sprintId === NO_SPRINT && t.sprintId) return false
      if (filters.sprintId && filters.sprintId !== NO_SPRINT && t.sprintId !== filters.sprintId)
        return false
      if (filters.from || filters.to) {
        if (!isWithinRange(t.backlogAt, filters.from, filters.to)) return false
      }
      return true
    })
  }, [tasks, filters])
}

export const emptyFilters = {
  text: '',
  assigneeId: '',
  statusId: '',
  typeId: '',
  projectId: '',
  from: '',
  to: '',
}
