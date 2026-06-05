import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Activity } from '@/lib/types'
import { useProjectStore } from '@/store/useProjectStore'
import {
  toGanttTasks, calcScheduleStats,
  GanttViewMode, viewModes
} from '@/lib/gantt-helpers'
import GanttChart      from '@/components/schedule/GanttChart'
import ScheduleStatBar from '@/components/schedule/ScheduleStats'
import ScheduleExport  from '@/components/schedule/ScheduleExport'
import {
  CalendarDays, AlertTriangle,
  LayoutList, ChevronDown
} from 'lucide-react'
import { clsx } from 'clsx'

type TabType = 'gantt' | 'list'

export default function SchedulePage() {
  const { id: projectId }   = useParams<{ id: string }>()
  const { activeProject }   = useProjectStore()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading,    setLoading]    = useState(true)
  const [viewMode,   setViewMode]   = useState<GanttViewMode>('Week')
  const [tab,        setTab]        = useState<TabType>('gantt')
  const [showCritical, setShowCritical] = useState(false)

  // Real-time listener
  useEffect(() => {
    if (!projectId) return
    const q = query(
      collection(db, 'activities'),
      where('projectId', '==', projectId)
    )
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Activity))
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
      setActivities(data)
      setLoading(false)
    })
    return () => unsub()
  }, [projectId])

  const ganttTasks   = toGanttTasks(activities)
  const stats        = calcScheduleStats(activities)
  const leaves       = activities.filter(a => a.level === 2)
  const criticalTasks = leaves.filter(a => a.isCritical)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-civil-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-civil-text">Construction Schedule</h1>
          <p className="text-sm text-civil-muted mt-0.5">
            {activeProject?.name} · {leaves.length} activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeProject && (
            <ScheduleExport
              activities={activities}
              projectName={activeProject.name}
            />
          )}
        </div>
      </div>

      {/* Stats */}
      {activities.length > 0 && <ScheduleStatBar stats={stats} />}

      {/* No WBS yet */}
      {activities.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <CalendarDays className="w-12 h-12 text-civil-border mb-4" />
          <p className="text-civil-text font-semibold">No schedule yet</p>
          <p className="text-civil-muted text-sm mt-2 max-w-sm">
            Go to WBS tab and generate activities first.
            Schedule will auto-populate from WBS dates.
          </p>
        </div>
      )}

      {activities.length > 0 && (
        <>
          {/* Tabs + View Mode */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex bg-civil-surface border border-civil-border rounded-lg p-1 gap-1">
              {(['gantt', 'list'] as TabType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={clsx(
                    'px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors',
                    tab === t
                      ? 'bg-civil-accent text-white'
                      : 'text-civil-muted hover:text-civil-text'
                  )}
                >
                  {t === 'gantt' ? '📊 Gantt' : '📋 List'}
                </button>
              ))}
            </div>

            {tab === 'gantt' && (
              <div className="flex bg-civil-surface border border-civil-border rounded-lg p-1 gap-1">
                {viewModes.map(m => (
                  <button
                    key={m}
                    onClick={() => setViewMode(m)}
                    className={clsx(
                      'px-3 py-1.5 rounded text-xs font-medium transition-colors',
                      viewMode === m
                        ? 'bg-civil-card text-civil-accent'
                        : 'text-civil-muted hover:text-civil-text'
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Legend (Gantt mode) */}
          {tab === 'gantt' && (
            <div className="flex items-center gap-4 mb-3 flex-wrap">
              {[
                { color: 'bg-sky-700',    label: 'Normal' },
                { color: 'bg-red-900',    label: 'Critical' },
                { color: 'bg-amber-800',  label: 'Delayed' },
                { color: 'bg-green-900',  label: 'Completed' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-2 rounded-sm ${color}`} />
                  <span className="text-[11px] text-civil-muted">{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 ml-auto">
                <div className="w-3 h-0.5 bg-civil-accent opacity-40" style={{ borderTop: '2px dashed' }} />
                <span className="text-[11px] text-civil-muted">Today</span>
              </div>
            </div>
          )}

          {/* Gantt Chart */}
          {tab === 'gantt' && (
            <div className="card p-0 overflow-hidden mb-4">
              <div className="px-4 py-3 border-b border-civil-border flex items-center justify-between">
                <span className="text-sm font-medium text-civil-text">Gantt Chart</span>
                <span className="text-xs text-civil-muted">
                  Drag bars to adjust dates · Drag right edge to resize
                </span>
              </div>
              <div className="p-2">
                <GanttChart tasks={ganttTasks} viewMode={viewMode} />
              </div>
            </div>
          )}

          {/* List View */}
          {tab === 'list' && (
            <div className="card p-0 overflow-hidden mb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-civil-surface border-b border-civil-border">
                      {['Code', 'Activity', 'Start', 'End', 'Duration', 'Progress', 'Status', 'Critical'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-civil-muted font-medium whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map((a, i) => (
                      <tr
                        key={a.id}
                        className={clsx(
                          'border-b border-civil-border/50 transition-colors hover:bg-civil-surface/50',
                          i % 2 === 0 ? '' : 'bg-civil-surface/20'
                        )}
                      >
                        <td className="px-3 py-2 font-mono text-civil-muted">{a.code}</td>
                        <td className="px-3 py-2 text-civil-text max-w-[200px] truncate">{a.name}</td>
                        <td className="px-3 py-2 text-civil-muted whitespace-nowrap">{a.startDate}</td>
                        <td className="px-3 py-2 text-civil-muted whitespace-nowrap">{a.endDate}</td>
                        <td className="px-3 py-2 text-civil-muted">{a.duration}d</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 bg-civil-border rounded-full overflow-hidden">
                              <div
                                className="h-full bg-civil-accent rounded-full"
                                style={{ width: `${a.progress}%` }}
                              />
                            </div>
                            <span className="text-civil-muted">{a.progress}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className={clsx(
                            'px-2 py-0.5 rounded-full text-[10px] capitalize',
                            a.status === 'completed'   && 'bg-green-900/30 text-green-400',
                            a.status === 'in-progress' && 'bg-blue-900/30 text-blue-400',
                            a.status === 'delayed'     && 'bg-red-900/30 text-red-400',
                            a.status === 'not-started' && 'bg-civil-surface text-civil-muted',
                          )}>
                            {a.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {a.isCritical && (
                            <span className="text-[10px] bg-red-900/30 text-red-400 border border-red-900/40 px-1.5 py-0.5 rounded">
                              Critical
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Critical Path section */}
          {criticalTasks.length > 0 && (
            <div className="card">
              <button
                onClick={() => setShowCritical(v => !v)}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-semibold text-civil-text">
                    Critical Path ({criticalTasks.length} activities)
                  </span>
                </div>
                <ChevronDown className={clsx(
                  'w-4 h-4 text-civil-muted transition-transform',
                  showCritical && 'rotate-180'
                )} />
              </button>

              {showCritical && (
                <div className="mt-3 space-y-2">
                  {criticalTasks.map(a => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 bg-red-900/10 border border-red-900/20 rounded-lg px-3 py-2"
                    >
                      <span className="text-[10px] font-mono text-red-400 w-10">{a.code}</span>
                      <span className="flex-1 text-xs text-civil-text truncate">{a.name}</span>
                      <span className="text-xs text-civil-muted">{a.duration}d</span>
                      <div className="w-12 h-1.5 bg-red-900/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-400 rounded-full"
                          style={{ width: `${a.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-red-400 w-8 text-right">{a.progress}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
