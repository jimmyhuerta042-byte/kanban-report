import { Check } from 'lucide-react'
import { withAlpha, contrastText } from '../../utils/colors'
import { cn } from '../../utils/cn'

/** Selección múltiple de responsables mediante toggles. */
export function AssigneeSelect({ assignees, value = [], onChange }) {
  const toggle = (id) => {
    if (value.includes(id)) onChange(value.filter((x) => x !== id))
    else onChange([...value, id])
  }

  if (assignees.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        No hay responsables. Crea alguno en “Responsables”.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {assignees.map((a) => {
        const selected = value.includes(a.id)
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => toggle(a.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition',
              selected ? 'border-transparent' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
            style={
              selected
                ? { backgroundColor: withAlpha(a.color, 0.15), color: a.color }
                : undefined
            }
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: a.color }}
            />
            {a.name}
            {selected && <Check size={14} />}
          </button>
        )
      })}
    </div>
  )
}
