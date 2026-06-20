import { Outlet, NavLink, useNavigate, useParams, useMatch } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/store/useAuthStore'
import { useProjectStore } from '@/store/useProjectStore'
import {
  LayoutDashboard, FolderOpen, LogOut,
  HardHat, Network, CalendarDays,
  KanbanSquare, TrendingUp, BookOpen,
  DollarSign, AlertTriangle, ClipboardCheck,
  BarChart3, FileText, PackageCheck, Zap, X, Menu
} from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'

// Top-level nav (no project context)
const topNav = [
  { to: '/projects', icon: FolderOpen, label: 'Projects' },
]

// Project-level nav (shown when inside a project)
const projectNav: { path: string; icon: React.ElementType; label: string; sprint: number; soon?: boolean }[] = [
  { path: '',            icon: LayoutDashboard, label: 'Dashboard',   sprint: 1  },
  { path: 'wbs',         icon: Network,         label: 'WBS',         sprint: 2  },
  { path: 'schedule',    icon: CalendarDays,    label: 'Schedule',    sprint: 3  },
  { path: 'resources',   icon: BarChart3,       label: 'Resources',   sprint: 4  },
  { path: 'procurement', icon: DollarSign,      label: 'Procurement', sprint: 5  },
  { path: 'kanban',      icon: KanbanSquare,    label: 'Kanban',      sprint: 6  },
  { path: 'progress',    icon: TrendingUp,      label: 'Progress',    sprint: 7  },
  { path: 'diary',       icon: BookOpen,        label: 'Site Diary',  sprint: 8  },
  { path: 'cost',        icon: DollarSign,      label: 'Cost',        sprint: 9  },
  { path: 'issues',      icon: AlertTriangle,   label: 'Issues',      sprint: 12 },
  { path: 'quality',     icon: ClipboardCheck,  label: 'QA/QC',       sprint: 13 },
  { path: 'approvals',   icon: ClipboardCheck,  label: 'Approvals',   sprint: 14 },
  { path: 'analytics',   icon: BarChart3,       label: 'Analytics',   sprint: 16 },
  { path: 'reports',     icon: FileText,        label: 'Reports',     sprint: 17 },
  { path: 'closeout',    icon: PackageCheck,    label: 'Closeout',    sprint: 18 },
  { path: 'ecosystem',   icon: Zap,             label: 'Ecosystem',   sprint: 19 },
]

export default function AppLayout() {
  const { user }          = useAuthStore()
  const { activeProject } = useProjectStore()
  const navigate          = useNavigate()
  const [open, setOpen]   = useState(false)

  // Detect if we're inside a project
  const projectMatch = useMatch('/projects/:id/*')
  const projectId    = projectMatch?.params?.id

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <div className="flex h-dvh bg-civil-bg overflow-hidden">

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 w-56',
        'bg-white border-r border-civil-border',
        'flex flex-col transition-transform duration-300',
        open ? 'translate-x-0' : '-translate-x-full',
        'lg:relative lg:translate-x-0 lg:flex-shrink-0'
      )}>

        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-civil-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-civil-accent flex items-center justify-center shadow-xs">
              <HardHat className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-civil-text leading-none">CivilOS</p>
              <p className="text-[10px] text-civil-muted leading-tight mt-0.5">Project Management</p>
            </div>
          </div>
          {/* Close — mobile only */}
          <button
            className="lg:hidden text-civil-muted hover:text-civil-text p-1 rounded"
            onClick={() => setOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-2.5 overflow-y-auto space-y-0.5">

          {/* Top nav */}
          {topNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={() => setOpen(false)}
              className={({ isActive }) => clsx(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                isActive
                  ? 'bg-civil-accent/8 text-civil-accent'
                  : 'text-civil-muted hover:text-civil-text hover:bg-civil-surface'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </NavLink>
          ))}

          {/* Project nav — only shown inside a project */}
          {projectId && (
            <>
              <div className="px-3 pt-3 pb-1">
                <p className="text-[9px] font-semibold text-civil-muted uppercase tracking-wider truncate">
                  {activeProject?.name ?? 'Current Project'}
                </p>
              </div>

              {projectNav.map(({ path, icon: Icon, label, sprint, soon }) => {
                const to = `/projects/${projectId}${path ? '/' + path : ''}`
                return soon ? (
                  <div
                    key={path}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-civil-border cursor-not-allowed"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                    <span className="ml-auto text-[9px] bg-civil-surface border border-civil-border text-civil-muted px-1 rounded">
                      S{sprint}
                    </span>
                  </div>
                ) : (
                  <NavLink
                    key={path}
                    to={to}
                    end={path === ''}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) => clsx(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-civil-accent/8 text-civil-accent'
                        : 'text-civil-muted hover:text-civil-text hover:bg-civil-surface'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </NavLink>
                )
              })}
            </>
          )}
        </nav>

        {/* User section */}
        <div className="px-2 py-3 border-t border-civil-border">
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-civil-accent flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
              {user?.displayName?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-civil-text truncate">{user?.displayName}</p>
              <p className="text-[9px] text-civil-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-civil-muted hover:text-red-600 hover:bg-red-50 transition-colors w-full"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-civil-border bg-white shadow-xs lg:hidden flex-shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="text-civil-muted hover:text-civil-text p-1 rounded-lg hover:bg-civil-surface transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-civil-accent flex items-center justify-center">
              <HardHat className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-civil-text">CivilOS PM</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto min-h-0 bg-civil-bg">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
