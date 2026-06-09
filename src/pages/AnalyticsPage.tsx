import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Activity } from '@/lib/types'
import { Task }      from '@/lib/types'
import { CostEntry, calcEVM }           from '@/lib/cost-helpers'
import { SiteIssue, Risk, QCRecord }    from '@/lib/issue-helpers'
import { AppNotification, subscribeToNotifications, checkAndNotify } from '@/lib/notification-helpers'
import { useProjectStore } from '@/store/useProjectStore'
import { useAuthStore }    from '@/store/useAuthStore'
import NotificationPanel   from '@/components/notifications/NotificationPanel'
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts'
import {
  Bell, RefreshCw, TrendingUp, TrendingDown,
  DollarSign, Users, AlertTriangle, CheckCircle2,
  BarChart3, Activity as ActivityIcon,
} from 'lucide-react'
import { clsx } from 'clsx'

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#38bdf8', '#a855f7']

export default function AnalyticsPage() {
  const { id: projectId }    = useParams<{ id: string }>()
  const { activeProject }    = useProjectStore()
  const { user }             = useAuthStore()

  const [activities,  setActivities]  = useState<Activity[]>([])
  const [tasks,       setTasks]       = useState<Task[]>([])
  const [costEntries, setCostEntries] = useState<CostEntry[]>([])
  const [issues,      setIssues]      = useState<SiteIssue[]>([])
  const [risks,       setRisks]       = useState<Risk[]>([])
  const [qcRecords,   setQCRecords]   = useState<QCRecord[]>([])
  const [notifs,      setNotifs]      = useState<AppNotification[]>([])
  const [showNotifs,  setShowNotifs]  = useState(false)
  const [checking,    setChecking]    = useState(false)
  const [loading,     setLoading]     = useState(true)

  // Subscribe all collections
  useEffect(() => {
    if (!projectId) return
    const q = (col: string) => query(collection(db, col), where('projectId', '==', projectId))

    const unsubs = [
      onSnapshot(q('activities'),   s => { setActivities(s.docs.map(d => ({ id: d.id, ...d.data() } as Activity))); setLoading(false) }),
      onSnapshot(q('tasks'),        s => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() } as Task)))),
      onSnapshot(q('cost_entries'), s => setCostEntries(s.docs.map(d => ({ id: d.id, ...d.data() } as CostEntry)))),
      onSnapshot(q('issues'),       s => setIssues(s.docs.map(d => ({ id: d.id, ...d.data() } as SiteIssue)))),
      onSnapshot(q('risks'),        s => setRisks(s.docs.map(d => ({ id: d.id, ...d.data() } as Risk)))),
      onSnapshot(q('qc_records'),   s => setQCRecords(s.docs.map(d => ({ id: d.id, ...d.data() } as QCRecord)))),
      subscribeToNotifications(projectId, setNotifs),
    ]
    return () => unsubs.forEach(u => u())
  }, [projectId])

  const leaves   = activities.filter(a => a.level === 2)
  const totalActual = costEntries.reduce((s, e) => s + e.amount, 0)
  const evm      = calcEVM(activities, totalActual)

  // Derived stats
  const progress = {
    overall:   leaves.length > 0 ? Math.round(leaves.reduce((s, a) => s + a.progress, 0) / leaves.length) : 0,
    completed: leaves.filter(a => a.status === 'completed').length,
    delayed:   leaves.filter(a => a.status === 'delayed').length,
    total:     leaves.length,
  }

  const taskStats = {
    total:     tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue:   tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
  }

  const issueStats = {
    open:     issues.filter(i => i.status !== 'closed').length,
    critical: issues.filter(i => i.severity === 'critical' && i.status !== 'closed').length,
  }

  const qcStats = {
    pass:  qcRecords.filter(r => r.overallStatus === 'pass').length,
    fail:  qcRecords.filter(r => r.overallStatus === 'fail').length,
    total: qcRecords.length,
  }

  const unreadCount = notifs.filter(n => !n.read).length

  // Charts data
  const progressByPhase = activities
    .filter(a => a.level === 1)
    .map(a => ({
      name:   a.name.split(' ')[0],
      actual: a.progress,
      target: 100,
    }))

  const taskKanbanData = [
    { name: 'Planned',     count: tasks.filter(t => t.status === 'planned').length,     fill: '#64748b' },
    { name: 'Ready',       count: tasks.filter(t => t.status === 'ready').length,        fill: '#38bdf8' },
    { name: 'In Progress', count: tasks.filter(t => t.status === 'in-progress').length,  fill: '#f59e0b' },
    { name: 'Review',      count: tasks.filter(t => t.status === 'review').length,       fill: '#a855f7' },
    { name: 'Completed',   count: tasks.filter(t => t.status === 'completed').length,    fill: '#22c55e' },
  ]

  const issueByType = [
    { name: 'Site',    value: issues.filter(i => i.type === 'site').length },
    { name: 'Safety',  value: issues.filter(i => i.type === 'safety').length },
    { name: 'Quality', value: issues.filter(i => i.type === 'quality').length },
    { name: 'Design',  value: issues.filter(i => i.type === 'design').length },
  ].filter(d => d.value > 0)

  const radarData = [
    { metric: 'Schedule', value: Math.min(Math.round(evm.SPI * 100), 100) },
    { metric: 'Cost',     value: Math.min(Math.round(evm.CPI * 100), 100) },
    { metric: 'Quality',  value: qcStats.total > 0 ? Math.round((qcStats.pass / qcStats.total) * 100) : 0 },
    { metric: 'Progress', value: progress.overall },
    { metric: 'Safety',   value: Math.max(100 - (issues.filter(i => i.type === 'safety' && i.status !== 'closed').length * 20), 0) },
    { metric: 'Risk',     value: Math.max(100 - (risks.filter(r => r.riskScore >= 12).length * 25), 0) },
  ]

  const handleCheckNotifications = async () => {
    if (!projectId || !user) return
    setChecking(true)
    try {
      const approvals: any[] = []  // Could fetch from Firestore
      await checkAndNotify(projectId, activities, tasks, issues, approvals, user.displayName)
    } finally {
      setChecking(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-civil-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-civil-text">Analytics Dashboard</h1>
          <p className="text-sm text-civil-muted mt-0.5">{activeProject?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCheckNotifications}
            disabled={checking}
            className="btn-ghost flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', checking && 'animate-spin')} />
            Check Alerts
          </button>
          <button
            onClick={() => setShowNotifs(true)}
            className="relative btn-ghost flex items-center gap-1.5 text-xs"
          >
            <Bell className="w-3.5 h-3.5" />
            Notifications
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Top KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          {
            label: 'Overall Progress', value: `${progress.overall}%`,
            sub: `${progress.completed}/${progress.total} activities`,
            icon: TrendingUp, color: 'text-civil-accent', bg: 'bg-blue-900/20',
          },
          {
            label: 'SPI',
            value: evm.SPI.toFixed(2),
            sub: evm.SPI >= 1 ? 'On/Ahead schedule' : 'Behind schedule',
            icon: evm.SPI >= 1 ? TrendingUp : TrendingDown,
            color: evm.SPI >= 1 ? 'text-green-400' : 'text-red-400',
            bg:    evm.SPI >= 1 ? 'bg-green-900/20' : 'bg-red-900/20',
          },
          {
            label: 'CPI',
            value: evm.CPI.toFixed(2),
            sub: evm.CPI >= 1 ? 'Under budget' : 'Over budget',
            icon: DollarSign,
            color: evm.CPI >= 1 ? 'text-green-400' : 'text-red-400',
            bg:    evm.CPI >= 1 ? 'bg-green-900/20' : 'bg-red-900/20',
          },
          {
            label: 'Open Issues', value: issueStats.open,
            sub: `${issueStats.critical} critical`,
            icon: AlertTriangle,
            color: issueStats.critical > 0 ? 'text-red-400' : 'text-yellow-400',
            bg:    issueStats.critical > 0 ? 'bg-red-900/20' : 'bg-yellow-900/20',
          },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="card">
            <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center mb-2', bg)}>
              <Icon className={clsx('w-3.5 h-3.5', color)} />
            </div>
            <p className={clsx('text-xl font-bold', color)}>{value}</p>
            <p className="text-[10px] font-semibold text-civil-muted mt-0.5">{label}</p>
            <p className="text-[10px] text-civil-muted">{sub}</p>
          </div>
        ))}
      </div>

      {/* Row 2: Progress + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Phase progress */}
        <div className="card">
          <h3 className="text-sm font-semibold text-civil-text mb-3">Progress by Phase</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressByPhase} margin={{ top: 5, right: 5, bottom: 20, left: -20 }} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 8, fontSize: 11 }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="target" name="Target"  fill="#2a2d3e" radius={[3,3,0,0]} />
                <Bar dataKey="actual" name="Actual"  fill="#38bdf8" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project health radar */}
        <div className="card">
          <h3 className="text-sm font-semibold text-civil-text mb-3">Project Health Radar</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                <PolarGrid stroke="#2a2d3e" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar name="Health" dataKey="value" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.15} strokeWidth={2} />
                <Tooltip contentStyle={{ backgroundColor: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [`${v}%`, 'Score']} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Tasks + Issues + QC */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

        {/* Task board status */}
        <div className="card">
          <h3 className="text-sm font-semibold text-civil-text mb-3">Task Board</h3>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskKanbanData} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 8 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 8, fontSize: 11 }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" name="Tasks" radius={[3,3,0,0]}>
                  {taskKanbanData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-xs mt-2">
            <span className="text-civil-muted">Total: <span className="text-civil-text font-semibold">{taskStats.total}</span></span>
            {taskStats.overdue > 0 && <span className="text-red-400 font-semibold">{taskStats.overdue} overdue</span>}
          </div>
        </div>

        {/* Issue breakdown pie */}
        <div className="card">
          <h3 className="text-sm font-semibold text-civil-text mb-3">Issues by Type</h3>
          {issueByType.length > 0 ? (
            <>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={issueByType} cx="50%" cy="50%" outerRadius={50} dataKey="value" paddingAngle={3}>
                      {issueByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 8, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {issueByType.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1 text-[10px]">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-civil-muted">{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-36 text-civil-muted text-xs">No issues logged</div>
          )}
        </div>

        {/* QC summary */}
        <div className="card">
          <h3 className="text-sm font-semibold text-civil-text mb-3">QA/QC Summary</h3>
          <div className="space-y-3">
            {[
              { label: 'Pass',        value: qcStats.pass,                color: 'text-green-400',  bar: 'bg-green-400' },
              { label: 'Fail',        value: qcStats.fail,                color: 'text-red-400',    bar: 'bg-red-400' },
              { label: 'Observation', value: qcStats.total - qcStats.pass - qcStats.fail, color: 'text-yellow-400', bar: 'bg-yellow-400' },
            ].map(({ label, value, color, bar }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-civil-muted">{label}</span>
                  <span className={clsx('font-semibold', color)}>{value}</span>
                </div>
                <div className="h-1.5 bg-civil-border rounded-full overflow-hidden">
                  <div
                    className={clsx('h-full rounded-full transition-all', bar)}
                    style={{ width: `${qcStats.total > 0 ? (value / qcStats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="text-[10px] text-civil-muted pt-1">
              Total Inspections: <span className="text-civil-text font-semibold">{qcStats.total}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Row 4: Budget summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'BAC',  value: `৳ ${(evm.BAC / 100000).toFixed(1)}L`,  color: 'text-civil-accent' },
          { label: 'EV',   value: `৳ ${(evm.EV / 100000).toFixed(1)}L`,   color: 'text-purple-400' },
          { label: 'AC',   value: `৳ ${(evm.AC / 100000).toFixed(1)}L`,   color: 'text-yellow-400' },
          { label: 'EAC',  value: `৳ ${(evm.EAC / 100000).toFixed(1)}L`,  color: evm.EAC > evm.BAC ? 'text-red-400' : 'text-green-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className={clsx('text-lg font-bold', color)}>{value}</p>
            <p className="text-xs text-civil-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Notification Panel */}
      {showNotifs && (
        <NotificationPanel
          notifications={notifs}
          projectId={projectId!}
          onClose={() => setShowNotifs(false)}
        />
      )}
    </div>
  )
}
