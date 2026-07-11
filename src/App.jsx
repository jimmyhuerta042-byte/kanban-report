import { useState } from 'react'
import { BoardProvider } from './context/BoardContext'
import { ToastProvider } from './context/ToastContext'
import { AppLayout } from './layouts/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { StatusesPage } from './pages/StatusesPage'
import { TypesPage } from './pages/TypesPage'
import { AssigneesPage } from './pages/AssigneesPage'
import { ProjectsPage } from './pages/ProjectsPage'

const PAGES = {
  dashboard: Dashboard,
  statuses: StatusesPage,
  types: TypesPage,
  assignees: AssigneesPage,
  projects: ProjectsPage,
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const Page = PAGES[page] || Dashboard

  return (
    <ToastProvider>
      <BoardProvider>
        <AppLayout current={page} onNavigate={setPage}>
          {/* El tablero ocupa toda la altura; las páginas de gestión hacen scroll. */}
          {page === 'dashboard' ? (
            <Page />
          ) : (
            <div className="h-full overflow-y-auto pr-1">
              <Page />
            </div>
          )}
        </AppLayout>
      </BoardProvider>
    </ToastProvider>
  )
}
