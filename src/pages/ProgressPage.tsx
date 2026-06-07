import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Activity } from '@/lib/types'
import {
  ProgressUpdate,
  subscribeToProgressUpdates,
  buildProgressChartData,
  buildDailyTrend,
  calcVariance,
} from '@/lib/progress-helpers'
import { useProjectStore } from '@/store/useProjectStore'
import ActivityProgressCard from '@/components/progress/ActivityProgressCard'
import {
  ProgressComparisonChart,
  DailyTrendChart,
} from '@/components/progress/ProgressChart'
import {
  TrendingUp, TrendingDown, Activity as ActivityIcon,
  CheckCircle2, Clock, AlertTriangle,
  ChevronDown, ChevronRight, Search,
} from 'lucide-react'
import { clsx } from 'clsx'

type FilterType = 'all' | 'not-started' | 'in-progress' | 'completed' | 'delayed'

export default function ProgressPage() {
  const { id: projectId }   = useParams<{ id: string }>()
  const { activeProject }   = useProjectStore()
  const [activities,  setActivities]  = useState<Activity[]>([])
  const [updates,     setUpdates]     = useState<ProgressUpdate[]>([])
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState<FilterType>('all')
  const [search,      setSearch]      = useState('')
  const [expanded,    setExpanded]    = useState<Set<string>>(new Set())
  const [activeTab,   setActiveTab]   = useState<'update' | 'history' | 'chart'>('update')

  // Activities
  useEffect(() => {
    if (!projectId) return
    const q = query(
      collection(db, 'activities'),
      where('projectId', '==', projectId)
    )
    return onSnapshot(q, snap => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Activity))
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
      setActivities(data)
      // Auto-expand level 1
      const l1 = data.filter(a => a.level === 1).map(a => a.code)
      setExpanded(new Set(l1))
      setLoading(false)
    })
  }, [projectId])

  // Progress updates log
  useEffect(() => {
    if (!projectId) return
    return subscribeToProgressUpdates(projectId, setUpdates)
  }, [projectId])

  const leaves = activities.filter(a => a.level === 2)
  const parents = activities.filter(a => a.level === 1)

  // Overall progress
  const overallActual = leaves.length > 0
    ? Math.round(leaves.reduce((s, a) => s + a.progress, 0) / leaves.length)
    : 0

  const overallPlanned = 65 // Mock — Sprint 3 baseline থেকে আসবে
  const variance = calcVariance(overallPlanned, overallActual)

  // Stats
  const stats = {
    total:     leaves.length,
    completed: leaves.filter(a => a.status === 'completed').length,
    inProg:    leaves.filter(a => a.status === 'in-progress').length,
    delayed:   leaves.filter(a => a.status === 'delayed').length,
    notStart:  leaves.filter(a => a.status === 'not-started').length,
  }

  // Filter + search
  const filteredLeaves = leaves.filter(a => {
    const matchFilter = filter === 'all' || a.status === filter
    const matchSearch = !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.includes(search)
    return matchFilter && matchSearch
  })

  // Group filtered by parent
  const groupedByParent = parents.map(parent => ({
    parent,
    children: filteredLeaves.filter(a =>
      a.code.startsWith(parent.code + '.')
    ),
  })).filter(g => g.children.length > 0)

  const chartData  = buildProgressChartData(parents)
  const trendData  = buildDailyTrend(updates)

  const toggleParent = (code: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })
  }

  const filterButtons: { key: FilterType; label: string; count: number; color: string }[] = [
    { key: 'all',         label: 'All',         count: leaves.length,   color: 'text-civil-muted' },
    { key: 'in-progress', label: 'In Progress', count: stats.inProg,    color: 'text-blue-400' },
    { key: 'delayed',     label: 'Delayed',     count: stats.delayed,   color: 'text-red-400' },
    { key: 'not-started', label: 'Not Started', count: stats.notStart,  color: 'text-civil-muted' },
    { key: 'completed',   label: 'Completed',   count: stats.completed, color: 'text-green-400' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-civil-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-civil-text">Site Progress</h1>
          <p className="text-sm text-civil-muted mt-0.5">
            {activeProject?.name} · {leaves.length} activities
          </p>
        </div>
      </div>

      {/* Overall KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {/* Overall progress */}
        <div className="card col-span-2 md:col-span-1">
          <p className="text-xs text-civil-muted mb-1">Overall Progress</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-civil-accent">{overallActual}%</p>
            <span className={clsx('text-xs font-semibold mb-1', variance.color)}>
              {variance.label}
            </span>
          </div>
          <div className="h-1.5 bg-civil-border rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-civil-accent rounded-full transition-all"
              style={{ width: `${overallActual}%` }}
            />
          </div>
        </div>

        {[
          { label: 'Completed',   value: stats.completed, icon: CheckCircle2,  color: 'text-green-400',  bg: 'bg-green-900/20' },
          { label: 'In Progress', value: stats.inProg,    icon: Clock,          color: 'text-blue-400',   bg: 'bg-blue-900/20' },
          { label: 'Delayed',     value: stats.delayed,   icon: AlertTriangle,  color: 'text-red-400',    bg: 'bg-red-900/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card">
            <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center mb-2', bg)}>
              <Icon className={clsx('w-3.5 h-3.5', color)} />
            </div>
            <p className={clsx('text-xl font-bold', color)}>{value}</p>
            <p className="text-xs text-civil-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-civil-surface border border-civil-border rounded-lg p-1 gap-1 mb-4 w-fit">
        {[
          { key: 'update',  label: '📝 Update' },
          { key: 'chart',   label: '📊 Chart' },
          { key: 'history', label: '🕐 History' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={clsx(
              'px-3 py-1.5 rounded text-xs font-medium transition-colors',
              activeTab === key
                ? 'bg-civil-accent text-white'
                : 'text-civil-muted hover:text-civil-text'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── UPDATE TAB ── */}
      {activeTab === 'update' && (
        <div className="space-y-3">
          {/* Filter + Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-civil-muted" />
              <input
                className="input pl-8 text-xs py-2"
                placeholder="Search activity..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {filterButtons.map(({ key, label, count, color }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={clsx(
                    'text-[10px] px-2.5 py-1 rounded-full border transition-colors',
                    filter === key
                      ? 'bg-civil-accent/20 border-civil-accent/40 text-civil-accent'
                      : 'border-civil-border text-civil-muted hover:text-civil-text'
                  )}
                >
                  {label}
                  <span className="ml-1 opacity-70">({count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Activity groups */}
          {activities.length === 0 ? (
            <div className="card flex flex-col items-center py-16 text-center">
              <ActivityIcon className="w-10 h-10 text-civil-border mb-3" />
              <p className="text-civil-text font-semibold">No activities</p>
              <p className="text-civil-muted text-sm mt-1">Generate WBS first.</p>
            </div>
          ) : groupedByParent.length === 0 ? (
            <div className="text-center py-10 text-civil-muted text-sm">
              No activities match the filter.
            </div>
          ) : (
            groupedByParent.map(({ parent, children }) => (
              <div key={parent.id} className="space-y-2">
                {/* Phase header */}
                <button
                  onClick={() => toggleParent(parent.code)}
                  className="flex items-center gap-2 w-full text-left px-1 py-1"
                >
                  {expanded.has(parent.code)
                    ? <ChevronDown  className="w-4 h-4 text-civil-muted" />
                    : <ChevronRight className="w-4 h-4 text-civil-muted" />
                  }
                  <span className="text-xs font-mono text-civil-muted">{parent.code}</span>
                  <span className="text-sm font-semibold text-civil-text">{parent.name}</span>
                  <span className="text-xs text-civil-muted ml-1">({children.length})</span>
                </button>

                {/* Children */}
                {expanded.has(parent.code) && (
                  <div className="space-y-2 ml-4">
                    {children.map(activity => (
                      <ActivityProgressCard
                        key={activity.id}
                        activity={activity}
                        projectId={projectId!}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── CHART TAB ── */}
      {activeTab === 'chart' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-sm font-semibold text-civil-text mb-1">
              Planned vs Actual by Phase
            </h2>
            <p className="text-xs text-civil-muted mb-4">
              Phase-wise progress comparison
            </p>
            <ProgressComparisonChart data={chartData} />
          </div>
          <div className="card">
            <h2 className="text-sm font-semibold text-civil-text mb-1">
              Daily Update Activity
            </h2>
            <p className="text-xs text-civil-muted mb-3">
              Number of progress updates per day (last 14 days)
            </p>
            <DailyTrendChart data={trendData} />
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === 'history' && (
        <div className="card p-0 overflow-hidden">
          {updates.length === 0 ? (
            <div className="text-center py-12 text-civil-muted text-sm">
              No update history yet. Update activity progress to see logs here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-civil-surface border-b border-civil-border">
                    {['Date', 'Activity', 'Previous', 'Updated', 'Change', 'Issue', 'By', 'Remarks'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-civil-muted font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {updates.map((u, i) => {
                    const change = u.progress - u.previousProgress
                    return (
                      <tr key={u.id} className={clsx(
                        'border-b border-civil-border/40 hover:bg-civil-surface/40',
                        i % 2 === 0 ? '' : 'bg-civil-surface/10'
                      )}>
                        <td className="px-3 py-2 text-civil-muted whitespace-nowrap">{u.date}</td>
                        <td className="px-3 py-2">
                          <span className="font-mono text-civil-muted text-[10px]">{u.activityCode}</span>
                          <span className="ml-1 text-civil-text truncate max-w-[120px] block">{u.activityName}</span>
                        </td>
                        <td className="px-3 py-2 text-civil-muted">{u.previousProgress}%</td>
                        <td className="px-3 py-2 text-civil-accent font-semibold">{u.progress}%</td>
                        <td className="px-3 py-2">
                          <span className={clsx(
                            'font-semibold',
                            change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-civil-muted'
                          )}>
                            {change > 0 ? '+' : ''}{change}%
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {u.issues !== 'none' && (
                            <span className={clsx(
                              'text-[10px] px-1.5 py-0.5 rounded-full capitalize',
                              u.issues === 'critical' ? 'bg-red-900/30 text-red-400' :
                              u.issues === 'major'    ? 'bg-orange-900/30 text-orange-400' :
                              'bg-yellow-900/30 text-yellow-400'
                            )}>
                              {u.issues}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-civil-muted whitespace-nowrap">{u.updatedBy}</td>
                        <td className="px-3 py-2 text-civil-muted max-w-[150px] truncate">{u.remarks || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
