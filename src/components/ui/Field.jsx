import { cn } from '../../utils/cn'

/** Contenedor de campo con label y mensaje de error. */
export function Field({ label, error, required, children, className }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  )
}

const baseInput =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100'

export function Input({ className, invalid, ...props }) {
  return (
    <input
      className={cn(baseInput, invalid && 'border-red-300 focus:ring-red-100', className)}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(baseInput, 'min-h-[80px] resize-y', className)}
      {...props}
    />
  )
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cn(baseInput, 'cursor-pointer', className)} {...props}>
      {children}
    </select>
  )
}
