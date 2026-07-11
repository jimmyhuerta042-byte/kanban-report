import { useState } from 'react'
import { Search, X, FileDown, Plus, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input, Select } from '../ui/Field'
import { useBoard } from '../../context/BoardContext'
import { cn } from '../../utils/cn'

/**
 * Barra superior de filtros del tablero.
 * Fila compacta siempre visible + panel de filtros desplegable (colapsado por defecto).
 */
export function FilterBar({ filters, setFilters, onExport, onNewTask, resultCount }) {
  const { statuses, types, assignees, projects } = useBoard()
  const [open, setOpen] = useState(false)

  const set = (key, value) => setFilters((f) => ({ ...f, [key]: value }))

  // Filtros activos que viven en el panel desplegable (la búsqueda va aparte).
  const advancedActive = [
    filters.assigneeId,
    filters.statusId,
    filters.typeId,
    filters.projectId,
    filters.from,
    filters.to,
  ].filter(Boolean).length

  const hasActiveFilters = advancedActive > 0 || filters.text

  const clear = () =>
    setFilters({
      text: '',
      assigneeId: '',
      statusId: '',
      typeId: '',
      projectId: '',
      from: '',
      to: '',
    })

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
      {/* Fila compacta */}
      <div className="flex flex-wrap items-center gap-2.5 p-3">
        {/* Búsqueda por nombre / ticket */}
        <div className="relative min-w-[200px] flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            value={filters.text}
            onChange={(e) => set('text', e.target.value)}
            placeholder="Buscar por nombre o ticket..."
            className="pl-9"
          />
        </div>

        {/* Toggle de filtros avanzados */}
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition',
            open || advancedActive
              ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          )}
        >
          <SlidersHorizontal size={16} />
          Filtros
          {advancedActive > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-bold text-white">
              {advancedActive}
            </span>
          )}
          <ChevronDown
            size={15}
            className={cn('transition-transform', open && 'rotate-180')}
          />
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span
            className={cn(
              'text-xs font-medium',
              hasActiveFilters ? 'text-indigo-600' : 'text-slate-400'
            )}
          >
            {resultCount} tarea(s)
          </span>
          <Button variant="secondary" size="md" onClick={onExport}>
            <FileDown size={16} /> Exportar PDF
          </Button>
          <Button size="md" onClick={() => onNewTask()}>
            <Plus size={16} /> Nueva tarea
          </Button>
        </div>
      </div>

      {/* Panel desplegable de filtros */}
      {open && (
        <div className="animate-fade-in border-t border-slate-100 px-3 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <FilterField label="Responsable">
              <Select
                value={filters.assigneeId}
                onChange={(e) => set('assigneeId', e.target.value)}
                className="min-w-[150px]"
              >
                <option value="">Todos</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </FilterField>

            <FilterField label="Proyecto">
              <Select
                value={filters.projectId}
                onChange={(e) => set('projectId', e.target.value)}
                className="min-w-[150px]"
              >
                <option value="">Todos</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </FilterField>

            <FilterField label="Estado">
              <Select
                value={filters.statusId}
                onChange={(e) => set('statusId', e.target.value)}
                className="min-w-[140px]"
              >
                <option value="">Todos</option>
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </FilterField>

            <FilterField label="Tipo">
              <Select
                value={filters.typeId}
                onChange={(e) => set('typeId', e.target.value)}
                className="min-w-[140px]"
              >
                <option value="">Todos</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.icon} {t.name}
                  </option>
                ))}
              </Select>
            </FilterField>

            <FilterField label="Backlog: desde">
              <Input
                type="date"
                value={filters.from}
                onChange={(e) => set('from', e.target.value)}
              />
            </FilterField>

            <FilterField label="Backlog: hasta">
              <Input
                type="date"
                value={filters.to}
                onChange={(e) => set('to', e.target.value)}
              />
            </FilterField>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clear}
                className="mb-0.5 text-slate-500"
              >
                <X size={14} /> Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function FilterField({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
    </label>
  )
}
