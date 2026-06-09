import { Outlet, NavLink, useNavigate, useParams, useMatch } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/store/useAuthStore'
import { useProjectStore } from '@/store/useProjectStore'
import {
  LayoutDashboard, FolderOpen, LogOut,
  HardHat, Menu, Network, CalendarDays,
  KanbanSquare, TrendingUp, BookOpen,
  DollarSign, AlertTriangle, ClipboardCheck,
  BarChart3, FileText
} from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'

// Top-level nav (no project context)
const topNav = [
  { to: '/projects', icon: FolderOpen, label: 'Projects' },
]

// Project-level nav (shown when inside a project)
const projectNav = [
  { path: '',           icon: LayoutDashboard, label: 'Dashboard',  sprint: 1 },
  { path: 'wbs',        icon: Network,         label: 'WBS',        sprint: 2 },
  { path: 'schedule',   icon: CalendarDays,    label: 'Schedule',   sprint: 3 },
  { path: 'resources',  icon: BarChart3,       label: 'Resources',  sprint: 4 },
  { path: 'procurement',icon: DollarSign,      label: 'Procurement',sprint: 5 },
  { path: 'kanban',     icon: KanbanSquare,    label: 'Kanban',     sprint: 6 },
  { path: 'progress',   icon: TrendingUp,      label: 'Progress',   sprint: 7 },
  { path: 'diary',      icon: BookOpen,        label: 'Site Diary', sprint: 8 },
  { path: 'cost',       icon: DollarSign,      label: 'Cost',       sprint: 9 },
  { path: 'issues',     icon: AlertTriangle,   label: 'Issues',     sprint: 12 },
  { path: 'quality',    icon: ClipboardCheck,  label: 'QA/QC',      sprint: 13 },
  { path: 'approvals',  icon: ClipboardCheck,  label: 'Approvals',  sprint: 14 },
  { path: 'analytics',  icon: BarChart3,       label: 'Analytics',  sprint: 16 },
  { path: 'closeout',   icon: PackageCheck,    label: 'Closeout',   sprint: 18 },
  { path: 'reports',    icon: FileText,        label: 'Reports',    sprint: 17 },
  { path: 'ecosystem',  icon: Zap,             label: 'Ecosystem',  sprint: 19 },
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
    <div className="flex h-screen bg-civil-bg overflow-hidden">

      {/* Sidebar */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 w-56 bg-civil-surface border-r border-civil-border',
        'flex flex-col transition-transform duration-300',
        open ? 'translate-x-0' : '-translate-x-full',
        'lg:relative lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-civil-border">
          <div className="w-7 h-7 rounded-lg bg-civil-accent/10 flex items-center justify-center">
            <HardHat className="w-4 h-4 text-civil-accent" />
          </div>
          <div>
            <p className="text-xs font-bold text-civil-text">CivilOS</p>
            <p className="text-[10px] text-civil-muted leading-none">Project Management</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">

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
                  ? 'bg-civil-accent/10 text-civil-accent'
                  : 'text-civil-muted hover:text-civil-text hover:bg-civil-card'
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
                    <span className="ml-auto text-[9px] bg-civil-card border border-civil-border px-1 rounded">
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
                        ? 'bg-civil-accent/10 text-civil-accent'
                        : 'text-civil-muted hover:text-civil-text hover:bg-civil-card'
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

        {/* User */}
        <div className="px-2 py-3 border-t border-civil-border">
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-civil-accent/20 flex items-center justify-center text-[10px] font-bold text-civil-accent flex-shrink-0">
              {user?.displayName?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-civil-text truncate">{user?.displayName}</p>
              <p className="text-[9px] text-civil-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-civil-muted hover:text-red-400 hover:bg-red-900/10 transition-colors w-full"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-civil-border bg-civil-surface lg:hidden">
          <button onClick={() => setOpen(true)} className="text-civil-muted hover:text-civil-text">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <HardHat className="w-4 h-4 text-civil-accent" />
            <span className="text-sm font-bold text-civil-text">CivilOS PM</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
