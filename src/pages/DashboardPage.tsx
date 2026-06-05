import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useProjectStore } from '@/store/useProjectStore'
import { Project } from '@/lib/types'
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import {
  ArrowLeft, TrendingUp, TrendingDown,
  DollarSign, AlertTriangle, CheckCircle2,
  Clock, Activity, BarChart2
} from 'lucide-react'

// Mock progress data — Sprint 7 এ real data আসবে
const mockProgressData = [
  { week: 'W1',  planned: 5,  actual: 4  },
  { week: 'W2',  planned: 12, actual: 10 },
  { week: 'W3',  planned: 20, actual: 17 },
  { week: 'W4',  planned: 30, actual: 26 },
  { week: 'W5',  planned: 42, actual: 38 },
  { week: 'W6',  planned: 55, actual: 50 },
  { week: 'Now', planned: 65, actual: 58 },
]

export default function DashboardPage() {
  const { id }          = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const { setActiveProject } = useProjectStore()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const unsub = onSnapshot(doc(db, 'projects', id), (snap) => {
      if (snap.exists()) {
        const p = { id: snap.id, ...snap.data() } as Project
        setProject(p)
        setActiveProject(p)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [id, setActiveProject])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-civil-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-6 text-center text-civil-muted">
        Project not found.
      </div>
    )
  }

  const spi = project.plannedProgress > 0
    ? (project.actualProgress / project.plannedProgress).toFixed(2)
    : '1.00'
  const budgetPct = project.contractValue > 0
    ? Math.round((project.budgetUsed / project.contractValue) * 100)
    : 0

  const kpiCards = [
    {
      label:    'Planned Progress',
      value:    `${project.plannedProgress}%`,
      icon:     TrendingUp,
      color:    'text-blue-400',
      bg:       'bg-blue-900/20',
      sub:      'Schedule Baseline',
    },
    {
      label:    'Actual Progress',
      value:    `${project.actualProgress}%`,
      icon:     Activity,
      color:    'text-green-400',
      bg:       'bg-green-900/20',
      sub:      project.actualProgress >= project.plannedProgress ? '✓ On Schedule' : '⚠ Behind Schedule',
    },
    {
      label:    'Budget Used',
      value:    `${budgetPct}%`,
      icon:     DollarSign,
      color:    'text-yellow-400',
      bg:       'bg-yellow-900/20',
      sub:      `৳ ${(project.budgetUsed / 100000).toFixed(1)}L of ৳ ${(project.contractValue / 100000).toFixed(1)}L`,
    },
    {
      label:    'SPI',
      value:    spi,
      icon:     parseFloat(spi) >= 1 ? CheckCircle2 : AlertTriangle,
      color:    parseFloat(spi) >= 1 ? 'text-green-400' : 'text-red-400',
      bg:       parseFloat(spi) >= 1 ? 'bg-green-900/20' : 'bg-red-900/20',
      sub:      parseFloat(spi) >= 1 ? 'Ahead of Schedule' : 'Behind Schedule',
    },
    {
      label:    'Delayed Activities',
      value:    '0',
      icon:     Clock,
      color:    'text-orange-400',
      bg:       'bg-orange-900/20',
      sub:      'Sprint 2 এ আসবে',
    },
    {
      label:    'Budget Remaining',
      value:    `৳ ${((project.contractValue - project.budgetUsed) / 100000).toFixed(1)}L`,
      icon:     BarChart2,
      color:    'text-purple-400',
      bg:       'bg-purple-900/20',
      sub:      `${100 - budgetPct}% remaining`,
    },
  ]

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Back + Header */}
      <div className="flex items-start gap-3 mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="mt-0.5 text-civil-muted hover:text-civil-text transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-civil-text truncate">{project.name}</h1>
          <p className="text-sm text-civil-muted mt-0.5">
            {project.location} · {project.clientName}
          </p>
        </div>
        <div>
          <span className={`
            text-xs px-3 py-1 rounded-full font-medium capitalize border
            ${project.status === 'active'
              ? 'bg-green-900/20 text-green-400 border-green-900/40'
              : project.status === 'planning'
              ? 'bg-blue-900/20 text-blue-400 border-blue-900/40'
              : 'bg-yellow-900/20 text-yellow-400 border-yellow-900/40'}
          `}>
            {project.status}
          </span>
        </div>
      </div>

      {/* Project Info Bar */}
      <div className="card mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-civil-muted text-xs mb-1">Contract Value</p>
          <p className="font-semibold text-civil-text">৳ {project.contractValue.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-civil-muted text-xs mb-1">Start Date</p>
          <p className="font-semibold text-civil-text">{project.startDate || '—'}</p>
        </div>
        <div>
          <p className="text-civil-muted text-xs mb-1">Target Date</p>
          <p className="font-semibold text-civil-text">{project.targetDate || '—'}</p>
        </div>
        <div>
          <p className="text-civil-muted text-xs mb-1">Client</p>
          <p className="font-semibold text-civil-text truncate">{project.clientName || '—'}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {kpiCards.map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className="card">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs text-civil-muted">{label}</p>
              <div className={`${bg} p-1.5 rounded-lg`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-civil-muted mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Progress Chart */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-civil-text mb-4">Progress Overview</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockProgressData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="plannedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
              <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Area type="monotone" dataKey="planned" stroke="#38bdf8" strokeWidth={2} fill="url(#plannedGrad)" name="Planned" />
              <Area type="monotone" dataKey="actual"  stroke="#22c55e" strokeWidth={2} fill="url(#actualGrad)"  name="Actual" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-2 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-civil-accent rounded" />
            <span className="text-xs text-civil-muted">Planned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-green-400 rounded" />
            <span className="text-xs text-civil-muted">Actual</span>
          </div>
        </div>
      </div>

      {/* Coming Soon Modules */}
      <div className="card">
        <h2 className="text-sm font-semibold text-civil-text mb-3">Modules</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { name: 'WBS',         sprint: 2, ready: false },
            { name: 'Schedule',    sprint: 3, ready: false },
            { name: 'Resources',   sprint: 4, ready: false },
            { name: 'Procurement', sprint: 5, ready: false },
            { name: 'Kanban',      sprint: 6, ready: false },
            { name: 'Progress',    sprint: 7, ready: false },
            { name: 'Site Diary',  sprint: 8, ready: false },
            { name: 'Cost',        sprint: 9, ready: false },
          ].map(m => (
            <div key={m.name} className="bg-civil-surface border border-civil-border rounded-lg px-3 py-2 text-center opacity-50">
              <p className="text-xs font-medium text-civil-text">{m.name}</p>
              <p className="text-[10px] text-civil-muted mt-0.5">Sprint {m.sprint}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
