import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { readStorage, writeStorage, STORAGE_KEYS } from '../services/storage'
import {
  seedStatuses,
  seedTypes,
  seedAssignees,
  seedProjects,
  buildSeedTasks,
  seedSeq,
} from '../data/seed'
import { uid } from '../utils/id'
import { nowISO } from '../utils/dates'
import { isSupabaseConfigured } from '../services/supabase'
import * as db from '../services/db'
import { useToast } from './ToastContext'

const BoardContext = createContext(null)

const REMOTE = isSupabaseConfigured

export function BoardProvider({ children }) {
  const toast = useToast()

  // En modo local partimos de LocalStorage (o el seed); en modo remoto
  // arrancamos vacío y llenamos tras el fetch inicial.
  const [statuses, setStatuses] = useState(() =>
    REMOTE ? [] : readStorage(STORAGE_KEYS.statuses, seedStatuses)
  )
  const [types, setTypes] = useState(() =>
    REMOTE ? [] : readStorage(STORAGE_KEYS.types, seedTypes)
  )
  const [assignees, setAssignees] = useState(() =>
    REMOTE ? [] : readStorage(STORAGE_KEYS.assignees, seedAssignees)
  )
  const [projects, setProjects] = useState(() =>
    REMOTE ? [] : readStorage(STORAGE_KEYS.projects, seedProjects)
  )
  const [tasks, setTasks] = useState(() =>
    REMOTE ? [] : readStorage(STORAGE_KEYS.tasks, buildSeedTasks())
  )
  const [seq, setSeq] = useState(() =>
    REMOTE ? seedSeq : readStorage(STORAGE_KEYS.seq, seedSeq)
  )
  const [loading, setLoading] = useState(REMOTE)

  /* --------------------- Carga inicial + realtime --------------------- */

  // Evita que el re-fetch por realtime dispare persistencia local.
  const applyingRemote = useRef(false)

  const reload = useCallback(async () => {
    const data = await db.fetchAll()
    applyingRemote.current = true
    setStatuses(data.statuses)
    setTypes(data.types)
    setAssignees(data.assignees)
    setProjects(data.projects)
    setTasks(data.tasks)
    setSeq(data.seq)
    // Libera el flag tras aplicar (siguiente tick).
    setTimeout(() => (applyingRemote.current = false), 0)
  }, [])

  useEffect(() => {
    if (!REMOTE) return
    let unsub = () => {}
    ;(async () => {
      try {
        await reload()
      } catch (err) {
        console.error(err)
        toast.error('No se pudo cargar el tablero desde la nube.')
      } finally {
        setLoading(false)
      }
      unsub = db.subscribe(() => {
        reload().catch((e) => console.error('Realtime reload falló', e))
      })
    })()
    return () => unsub()
  }, [reload, toast])

  /* ------------------- Persistencia local (modo local) ---------------- */

  useEffect(() => {
    if (REMOTE) return
    writeStorage(STORAGE_KEYS.statuses, statuses)
  }, [statuses])
  useEffect(() => {
    if (REMOTE) return
    writeStorage(STORAGE_KEYS.types, types)
  }, [types])
  useEffect(() => {
    if (REMOTE) return
    writeStorage(STORAGE_KEYS.assignees, assignees)
  }, [assignees])
  useEffect(() => {
    if (REMOTE) return
    writeStorage(STORAGE_KEYS.projects, projects)
  }, [projects])
  useEffect(() => {
    if (REMOTE) return
    writeStorage(STORAGE_KEYS.tasks, tasks)
  }, [tasks])
  useEffect(() => {
    if (REMOTE) return
    writeStorage(STORAGE_KEYS.seq, seq)
  }, [seq])

  /**
   * Ejecuta una escritura remota (modo Supabase). Si falla, recarga desde la
   * nube para dejar el estado consistente y avisa. En modo local no hace nada.
   */
  const remote = useCallback(
    (fn) => {
      if (!REMOTE) return
      Promise.resolve()
        .then(fn)
        .catch((err) => {
          console.error(err)
          toast.error('No se pudo guardar el cambio en la nube.')
          reload().catch(() => {})
        })
    },
    [reload, toast]
  )

  const sortedStatuses = useMemo(
    () => [...statuses].sort((a, b) => a.order - b.order),
    [statuses]
  )

  /* ----------------------------- Estados ----------------------------- */

  const addStatus = useCallback(
    (data) => {
      const maxOrder = statuses.reduce((m, s) => Math.max(m, s.order), -1)
      const item = { id: uid('st-'), order: maxOrder + 1, ...data }
      setStatuses((prev) => [...prev, item])
      remote(() => db.insertStatus(item))
    },
    [statuses, remote]
  )

  const updateStatus = useCallback(
    (id, data) => {
      setStatuses((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)))
      remote(() => db.updateStatusRow(id, data))
    },
    [remote]
  )

  const deleteStatus = useCallback(
    (id) => {
      setStatuses((prev) => prev.filter((s) => s.id !== id))
      remote(() => db.deleteStatusRow(id))
    },
    [remote]
  )

  const reorderStatuses = useCallback(
    (orderedIds) => {
      const next = statuses.map((s) => ({ ...s, order: orderedIds.indexOf(s.id) }))
      setStatuses(next)
      remote(() => db.upsertStatuses(next))
    },
    [statuses, remote]
  )

  const countTasksByStatus = useCallback(
    (statusId) => tasks.filter((t) => t.statusId === statusId).length,
    [tasks]
  )

  /* ------------------------------ Tipos ------------------------------ */

  const addType = useCallback(
    (data) => {
      const item = { id: uid('ty-'), ...data }
      setTypes((prev) => [...prev, item])
      remote(() => db.insertType(item))
    },
    [remote]
  )
  const updateType = useCallback(
    (id, data) => {
      setTypes((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)))
      remote(() => db.updateTypeRow(id, data))
    },
    [remote]
  )
  const deleteType = useCallback(
    (id) => {
      setTypes((prev) => prev.filter((t) => t.id !== id))
      remote(() => db.deleteTypeRow(id))
    },
    [remote]
  )
  const countTasksByType = useCallback(
    (typeId) => tasks.filter((t) => t.typeId === typeId).length,
    [tasks]
  )

  /* --------------------------- Responsables --------------------------- */

  const addAssignee = useCallback(
    (data) => {
      const item = { id: uid('as-'), ...data }
      setAssignees((prev) => [...prev, item])
      remote(() => db.insertAssignee(item))
    },
    [remote]
  )
  const updateAssignee = useCallback(
    (id, data) => {
      setAssignees((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)))
      remote(() => db.updateAssigneeRow(id, data))
    },
    [remote]
  )
  const deleteAssignee = useCallback(
    (id) => {
      // Quitar el responsable de las tareas que lo tuvieran.
      const affected = tasks.filter((t) => t.assigneeIds.includes(id))
      const updated = affected.map((t) => ({
        ...t,
        assigneeIds: t.assigneeIds.filter((x) => x !== id),
      }))
      setAssignees((prev) => prev.filter((a) => a.id !== id))
      setTasks((prev) =>
        prev.map((t) => updated.find((u) => u.id === t.id) || t)
      )
      remote(async () => {
        await db.deleteAssigneeRow(id)
        for (const t of updated) await db.updateTaskRow(t)
      })
    },
    [tasks, remote]
  )
  const countTasksByAssignee = useCallback(
    (assigneeId) => tasks.filter((t) => t.assigneeIds.includes(assigneeId)).length,
    [tasks]
  )

  /* ----------------------------- Proyectos ---------------------------- */

  const addProject = useCallback(
    (data) => {
      const item = { id: uid('pr-'), ...data }
      setProjects((prev) => [...prev, item])
      remote(() => db.insertProject(item))
    },
    [remote]
  )
  const updateProject = useCallback(
    (id, data) => {
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)))
      remote(() => db.updateProjectRow(id, data))
    },
    [remote]
  )
  const deleteProject = useCallback(
    (id) => {
      const affected = tasks.filter((t) => t.projectId === id)
      const updated = affected.map((t) => ({ ...t, projectId: null }))
      setProjects((prev) => prev.filter((p) => p.id !== id))
      setTasks((prev) => prev.map((t) => updated.find((u) => u.id === t.id) || t))
      remote(async () => {
        await db.deleteProjectRow(id)
        for (const t of updated) await db.updateTaskRow(t)
      })
    },
    [tasks, remote]
  )
  const countTasksByProject = useCallback(
    (projectId) => tasks.filter((t) => t.projectId === projectId).length,
    [tasks]
  )

  /* ------------------------------ Tareas ------------------------------ */

  const backlogStatusId = useMemo(() => {
    const byName = sortedStatuses.find((s) => /backlog/i.test(s.name))
    return byName?.id || sortedStatuses[0]?.id || null
  }, [sortedStatuses])

  const createTask = useCallback(
    (data) => {
      const now = nowISO()
      const statusId = data.statusId || backlogStatusId
      const isBacklog = statusId === backlogStatusId
      const base = {
        id: uid('tk-'),
        ticket: data.ticket?.trim() || '',
        projectId: data.projectId || null,
        title: data.title.trim(),
        description: data.description?.trim() || '',
        statusId,
        typeId: data.typeId || null,
        assigneeIds: data.assigneeIds || [],
        createdAt: now,
        backlogAt: data.backlogAt || (isBacklog ? now : null),
        currentStatusStartAt: now,
        currentStatusEndAt: null,
        gitlabUrl: data.gitlabUrl?.trim() || '',
        makahaUrl: data.makahaUrl?.trim() || '',
      }

      if (REMOTE) {
        // El code viene del contador compartido (async).
        remote(async () => {
          const code = await db.nextCode()
          const task = { ...base, code }
          setTasks((prev) => [task, ...prev])
          await db.insertTask(task)
        })
      } else {
        const task = { ...base, code: seq }
        setSeq((s) => s + 1)
        setTasks((prev) => [task, ...prev])
      }
      return base
    },
    [seq, backlogStatusId, remote]
  )

  const updateTask = useCallback(
    (id, data) => {
      let saved = null
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t
          const next = { ...t, ...data }
          if (data.statusId && data.statusId !== t.statusId) {
            const now = nowISO()
            next.prevStatusId = t.statusId
            next.prevStatusEndAt = now
            next.currentStatusStartAt = now
            next.currentStatusEndAt = null
            if (data.statusId === backlogStatusId && !next.backlogAt) {
              next.backlogAt = now
            }
          }
          saved = next
          return next
        })
      )
      if (saved) remote(() => db.updateTaskRow(saved))
    },
    [backlogStatusId, remote]
  )

  const deleteTask = useCallback(
    (id) => {
      setTasks((prev) => prev.filter((t) => t.id !== id))
      remote(() => db.deleteTaskRow(id))
    },
    [remote]
  )

  /**
   * Mueve una tarea a un nuevo estado vía Drag & Drop.
   * Registra el fin del estado anterior y el inicio del nuevo.
   */
  const moveTask = useCallback(
    (taskId, newStatusId) => {
      let saved = null
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId || t.statusId === newStatusId) return t
          const now = nowISO()
          const updated = {
            ...t,
            prevStatusId: t.statusId,
            prevStatusEndAt: now,
            statusId: newStatusId,
            currentStatusStartAt: now,
            currentStatusEndAt: null,
          }
          if (newStatusId === backlogStatusId && !updated.backlogAt) {
            updated.backlogAt = now
          }
          saved = updated
          return updated
        })
      )
      if (saved) remote(() => db.updateTaskRow(saved))
    },
    [backlogStatusId, remote]
  )

  /* ------------------------------ Lookups ----------------------------- */

  const getType = useCallback((id) => types.find((t) => t.id === id) || null, [types])
  const getStatus = useCallback(
    (id) => statuses.find((s) => s.id === id) || null,
    [statuses]
  )
  const getAssignees = useCallback(
    (ids = []) => ids.map((id) => assignees.find((a) => a.id === id)).filter(Boolean),
    [assignees]
  )
  const getProject = useCallback(
    (id) => projects.find((p) => p.id === id) || null,
    [projects]
  )

  /* --------------------- Respaldo / restauración --------------------- */

  const exportState = useCallback(
    () => ({ statuses, types, assignees, projects, tasks, seq }),
    [statuses, types, assignees, projects, tasks, seq]
  )

  const applyState = useCallback((data) => {
    setStatuses(data.statuses)
    setTypes(data.types)
    setAssignees(data.assignees)
    setProjects(data.projects)
    setTasks(data.tasks)
    setSeq(data.seq)
  }, [])

  const importState = useCallback(
    (data) => {
      applyState(data)
      remote(() => db.replaceAll(data))
    },
    [applyState, remote]
  )

  const resetToSeed = useCallback(() => {
    const data = {
      statuses: seedStatuses,
      types: seedTypes,
      assignees: seedAssignees,
      projects: seedProjects,
      tasks: buildSeedTasks(),
      seq: seedSeq,
    }
    applyState(data)
    remote(() => db.replaceAll(data))
  }, [applyState, remote])

  const value = {
    // datos
    statuses: sortedStatuses,
    types,
    assignees,
    projects,
    tasks,
    backlogStatusId,
    loading,
    isRemote: REMOTE,
    // estados
    addStatus,
    updateStatus,
    deleteStatus,
    reorderStatuses,
    countTasksByStatus,
    // tipos
    addType,
    updateType,
    deleteType,
    countTasksByType,
    // responsables
    addAssignee,
    updateAssignee,
    deleteAssignee,
    countTasksByAssignee,
    // proyectos
    addProject,
    updateProject,
    deleteProject,
    countTasksByProject,
    // tareas
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    // lookups
    getType,
    getStatus,
    getAssignees,
    getProject,
    // respaldo / restauración
    exportState,
    importState,
    resetToSeed,
  }

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
}

export function useBoard() {
  const ctx = useContext(BoardContext)
  if (!ctx) throw new Error('useBoard debe usarse dentro de BoardProvider')
  return ctx
}
