import { Check } from 'lucide-react'
import { PALETTE, contrastText } from '../../utils/colors'
import { cn } from '../../utils/cn'

/** Selector de color a partir de una paleta predefinida. */
export function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PALETTE.map((color) => {
        const selected = value === color
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            style={{ backgroundColor: color, color: contrastText(color) }}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:scale-110',
              selected ? 'ring-2 ring-slate-900 ring-offset-2' : 'ring-0'
            )}
            aria-label={`Color ${color}`}
          >
            {selected && <Check size={16} />}
          </button>
        )
      })}
    </div>
  )
}
