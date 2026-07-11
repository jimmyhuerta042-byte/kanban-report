import { contrastText, withAlpha } from '../../utils/colors'

/** Etiqueta de color para responsables. */
export function AssigneeChip({ assignee, size = 'sm' }) {
  const dims = size === 'sm' ? 'h-5 px-2 text-[11px]' : 'h-6 px-2.5 text-xs'
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${dims}`}
      style={{
        backgroundColor: withAlpha(assignee.color, 0.15),
        color: assignee.color,
      }}
      title={assignee.name}
    >
      {assignee.name}
    </span>
  )
}

/** Punto de color sólido (avatar minimalista). */
export function AssigneeDot({ assignee }) {
  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-white"
      style={{ backgroundColor: assignee.color, color: contrastText(assignee.color) }}
      title={assignee.name}
    >
      {assignee.name.slice(0, 2).toUpperCase()}
    </span>
  )
}
