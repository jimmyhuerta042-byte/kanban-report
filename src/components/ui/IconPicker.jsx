import { cn } from '../../utils/cn'

/** Emojis frecuentes para tipos de tarea. */
export const TYPE_ICONS = [
  '🐞', '✨', '📄', '🔧', '🚀', '🎨', '⚡', '🔥', '🧪', '🛡️',
  '📱', '🖥️', '🔍', '⚙️', '📊', '🔐', '💡', '📦', '🧩', '🏗️',
]

/** Selector de icono (emoji) para tipos de tarea. */
export function IconPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TYPE_ICONS.map((icon) => (
        <button
          key={icon}
          type="button"
          onClick={() => onChange(icon)}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg text-lg transition hover:bg-slate-100',
            value === icon
              ? 'bg-indigo-50 ring-2 ring-indigo-400'
              : 'bg-slate-50'
          )}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}
