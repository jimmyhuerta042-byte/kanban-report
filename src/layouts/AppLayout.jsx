import { LayoutDashboard, Columns3, Tags, Users, FolderKanban, Cloud, HardDrive } from 'lucide-react'
import { cn } from '../utils/cn'
import { DataMenu } from '../components/DataMenu'
import { useBoard } from '../context/BoardContext'

const NAV = [
  { id: 'dashboard', label: 'Tablero', icon: LayoutDashboard },
  { id: 'projects', label: 'Proyectos', icon: FolderKanban },
  { id: 'statuses', label: 'Estados', icon: Columns3 },
  { id: 'types', label: 'Tipos de Tarea', icon: Tags },
  { id: 'assignees', label: 'Responsables', icon: Users },
]

export function AppLayout({ current, onNavigate, children }) {
  const { isRemote } = useBoard()
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Barra lateral */}
      <aside className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-slate-200 bg-white py-4 lg:w-60 lg:items-stretch lg:px-3">
        <div className="mb-4 flex items-center gap-2.5 px-2 lg:px-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Columns3 size={18} />
          </div>
          <span className="hidden text-lg font-bold text-slate-900 lg:block">Kanban</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = current === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={item.label}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium transition',
                  'justify-center lg:justify-start',
                  active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                )}
              >
                <Icon size={19} className="shrink-0" />
                <span className="hidden lg:block">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="mt-2 border-t border-slate-100 pt-3">
          <DataMenu compact />
        </div>

        <div
          className={cn(
            'mt-3 flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-medium',
            isRemote ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          )}
          title={
            isRemote
              ? 'Conectado a la nube (Supabase): tablero compartido en vivo'
              : 'Modo local: los datos viven solo en este navegador'
          }
        >
          {isRemote ? <Cloud size={14} className="shrink-0" /> : <HardDrive size={14} className="shrink-0" />}
          <span className="hidden lg:block">
            {isRemote ? 'Conectado (nube)' : 'Local (este navegador)'}
          </span>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-hidden p-4 sm:p-6">{children}</main>
    </div>
  )
}
