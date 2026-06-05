import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Activity, ActivityResource } from '@/lib/types'
import { updateActivity } from '@/lib/firestore'
import { useProjectStore } from '@/store/useProjectStore'
import {
  summarizeResources,
  buildLoadingChart,
  resourceTypeConfig,
  defaultResources,
  ResourceType,
} from '@/lib/resource-helpers'
import ResourceForm          from '@/components/resources/ResourceForm'
import ResourceSummaryTable  from '@/components/resources/ResourceSummaryTable'
import ResourceLoadingChart  from '@/components/resources/ResourceLoadingChart'
import {
  Users, Wrench, Package, Building2,
  ChevronRight, ChevronDown, Wand2,
  BarChart3, List, TableProperties,
} from 'lucide-react'
import { clsx } from 'clsx'

type TabType = 'assign' | 'summary' | 'loading'

export default function ResourcePage() {
  const { id: projectId }   = useParams<{ id: string }>()
  const { activeProject }   = useProjectStore()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading,    setLoading]    = useState(true)
  const [selected,   setSelected]   = useState<Activity | null>(null)
  const [resources,  setResources]  = useState<ActivityResource[]>([])
  const [saving,     setSaving]     = useState(false)
  const [tab,        setTab]        = useState<TabType>('assign')
  const [expanded,   setExpanded]   = useState<Set<string>>(new Set())

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
      // Auto-expand level 1
      const l1 = data.filter(a => a.level === 1).map(a => a.code)
      setExpanded(new Set(l1))
      setLoading(false)
    })
    return () => unsub()
  }, [projectId])

  // Sync resources when activity selected
  useEffect(() => {
    if (selected) {
      setResources([...(selected.resources ?? [])])
    }
  }, [selected?.id])

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const totalCost = resources.reduce((s, r) => s + r.quantity * r.unitRate, 0)
      await updateActivity(selected.id, {
        resources:   resources,
        plannedCost: totalCost,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAutoAssign = () => {
    if (!selected) return
    const defaults = defaultResources[selected.name]
    if (defaults) {
      setResources([...defaults])
    }
  }

  const toggleExpand = (code: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })
  }

  const leaves  = activities.filter(a => a.level === 2)
  const summary = summarizeResources(leaves)
  const chartData = buildLoadingChart(leaves)

  // Resource type icons
  const typeIcon: Record<ResourceType, any> = {
    labor:         Users,
    equipment:     Wrench,
    material:      Package,
    subcontractor: Building2,
  }

  // Visible activities in tree
  const visible = activities.filter(a => {
    if (a.level === 1) return true
    const parentCode = a.code.split('.').slice(0, -1).join('.')
    return expanded.has(parentCode)
  })

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'assign',  label: 'Assign',   icon: List },
    { key: 'summary', label: 'Summary',  icon: TableProperties },
    { key: 'loading', label: 'Loading',  icon: BarChart3 },
  ]

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
          <h1 className="text-xl font-bold text-civil-text">Resource Planning</h1>
          <p className="text-sm text-civil-muted mt-0.5">
            {activeProject?.name} · {leaves.length} activities
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-civil-surface border border-civil-border rounded-lg p-1 gap-1 mb-4 w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors',
              tab === key
                ? 'bg-civil-accent text-white'
                : 'text-civil-muted hover:text-civil-text'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* No activities */}
      {activities.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <Users className="w-12 h-12 text-civil-border mb-4" />
          <p className="text-civil-text font-semibold">No activities found</p>
          <p className="text-civil-muted text-sm mt-2">
            Generate WBS first from the WBS tab.
          </p>
        </div>
      )}

      {activities.length > 0 && (
        <>
          {/* ── ASSIGN TAB ── */}
          {tab === 'assign' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Activity list */}
              <div className="card p-0 overflow-hidden">
                <div className="px-4 py-3 border-b border-civil-border bg-civil-surface">
                  <p className="text-sm font-semibold text-civil-text">Activities</p>
                  <p className="text-xs text-civil-muted">Select to assign resources</p>
                </div>
                <div className="overflow-y-auto max-h-[500px]">
                  {visible.map(activity => {
                    const isParent   = activity.level === 1
                    const isExpd     = expanded.has(activity.code)
                    const hasChild   = activities.some(a => a.code.startsWith(activity.code + '.'))
                    const resCount   = (activity.resources ?? []).length
                    const isSelected = selected?.id === activity.id

                    return (
                      <div
                        key={activity.id}
                        onClick={() => {
                          if (!isParent) {
                            setSelected(activity)
                            setResources([...(activity.resources ?? [])])
                          } else {
                            toggleExpand(activity.code)
                          }
                        }}
                        style={{ paddingLeft: isParent ? 12 : 28 }}
                        className={clsx(
                          'flex items-center gap-2 px-3 py-2.5 border-b border-civil-border/40',
                          'cursor-pointer transition-colors',
                          isSelected && 'bg-civil-accent/10 border-l-2 border-l-civil-accent',
                          !isSelected && 'hover:bg-civil-surface/60',
                        )}
                      >
                        {/* Toggle */}
                        {isParent && hasChild && (
                          <span className="text-civil-muted w-3.5">
                            {isExpd
                              ? <ChevronDown  className="w-3.5 h-3.5" />
                              : <ChevronRight className="w-3.5 h-3.5" />}
                          </span>
                        )}
                        {!isParent && <span className="w-3.5" />}

                        {/* Code */}
                        <span className="text-[10px] font-mono text-civil-muted w-8 flex-shrink-0">
                          {activity.code}
                        </span>

                        {/* Name */}
                        <span className={clsx(
                          'flex-1 text-xs truncate',
                          isParent ? 'font-semibold text-civil-text' : 'text-civil-text/80'
                        )}>
                          {activity.name}
                        </span>

                        {/* Resource count badges */}
                        {!isParent && resCount > 0 && (
                          <div className="flex gap-1 flex-shrink-0">
                            {(['labor', 'equipment', 'material'] as ResourceType[]).map(type => {
                              const cnt = (activity.resources ?? []).filter(r => r.type === type).length
                              if (cnt === 0) return null
                              const cfg  = resourceTypeConfig[type]
                              const Icon = typeIcon[type]
                              return (
                                <span
                                  key={type}
                                  className={clsx('flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full', cfg.bg, cfg.color)}
                                >
                                  <Icon className="w-2.5 h-2.5" />
                                  {cnt}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Resource form panel */}
              <div className="card p-0 overflow-hidden">
                {selected ? (
                  <>
                    <div className="px-4 py-3 border-b border-civil-border bg-civil-surface flex items-center justify-between">
                      <div>
                        <p className="text-xs font-mono text-civil-muted">{selected.code}</p>
                        <p className="text-sm font-semibold text-civil-text">{selected.name}</p>
                      </div>
                      {/* Auto-assign button */}
                      {defaultResources[selected.name] && (
                        <button
                          onClick={handleAutoAssign}
                          className="flex items-center gap-1.5 text-xs text-civil-accent hover:text-blue-300 transition-colors"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          Auto-fill
                        </button>
                      )}
                    </div>
                    <div className="p-4 overflow-y-auto max-h-[460px]">
                      <ResourceForm
                        resources={resources}
                        onChange={setResources}
                        onSave={handleSave}
                        saving={saving}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
                    <Users className="w-10 h-10 text-civil-border mb-3" />
                    <p className="text-civil-text text-sm font-medium">Select an activity</p>
                    <p className="text-civil-muted text-xs mt-1">
                      Click any sub-activity on the left to assign resources
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SUMMARY TAB ── */}
          {tab === 'summary' && (
            <ResourceSummaryTable summary={summary} />
          )}

          {/* ── LOADING TAB ── */}
          {tab === 'loading' && (
            <div className="space-y-4">
              <div className="card">
                <h2 className="text-sm font-semibold text-civil-text mb-1">
                  Resource Loading Chart
                </h2>
                <p className="text-xs text-civil-muted mb-4">
                  Weekly resource demand across all activities
                </p>
                <ResourceLoadingChart data={chartData} />
              </div>

              {/* Resource type breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['labor', 'equipment', 'material', 'subcontractor'] as ResourceType[]).map(type => {
                  const rows = summary.filter(r => r.type === type)
                  const cost = rows.reduce((s, r) => s + r.totalCost, 0)
                  const cfg  = resourceTypeConfig[type]
                  const Icon = typeIcon[type]
                  return (
                    <div key={type} className="card">
                      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center mb-2', cfg.bg)}>
                        <Icon className={clsx('w-4 h-4', cfg.color)} />
                      </div>
                      <p className={clsx('text-sm font-bold', cfg.color)}>
                        ৳ {cost.toLocaleString()}
                      </p>
                      <p className="text-xs text-civil-muted mt-0.5">{cfg.label}</p>
                      <p className="text-[10px] text-civil-muted">{rows.length} types</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
