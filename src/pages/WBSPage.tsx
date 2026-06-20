import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Activity } from '@/lib/types'
import {
  generateWBS, deleteAllActivities
} from '@/lib/firestore'
import { useProjectStore } from '@/store/useProjectStore'
import WBSRow              from '@/components/wbs/WBSRow'
import ActivityDetailPanel from '@/components/wbs/ActivityDetailPanel'
import WBSStats            from '@/components/wbs/WBSStats'
import {
  Wand2, Trash2, ChevronDown, ChevronRight,
  LayoutList, RefreshCw
} from 'lucide-react'
import { clsx } from 'clsx'

export default function WBSPage() {
  const { id: projectId }       = useParams<{ id: string }>()
  const { activeProject }       = useProjectStore()
  const [activities, setActivities] = useState<Activity[]>([])
  const [expanded,   setExpanded]   = useState<Set<string>>(new Set())
  const [selected,   setSelected]   = useState<Activity | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [generating, setGenerating] = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Real-time listener
  useEffect(() => {
    if (!projectId) return
    const q = query(
      collection(db, 'activities'),
      where('projectId', '==', projectId)
    )
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Activity))
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
      setActivities(data)
      setLoading(false)
    })
    return () => unsub()
  }, [projectId])

  // Auto-expand level 1 on first load
  useEffect(() => {
    if (activities.length > 0 && expanded.size === 0) {
      const level1Codes = activities.filter(a => a.level === 1).map(a => a.code)
      setExpanded(new Set(level1Codes))
    }
  }, [activities])

  const handleGenerate = async () => {
    if (!projectId || !activeProject?.startDate) return
    setGenerating(true)
    try {
      await generateWBS(projectId, activeProject.startDate || new Date().toISOString().split('T')[0])
    } finally {
      setGenerating(false)
    }
  }

  const handleDeleteAll = async () => {
    if (!projectId) return
    setDeleting(true)
    try {
      await deleteAllActivities(projectId)
      setSelected(null)
      setShowConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  const toggleExpand = useCallback((code: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })
  }, [])

  const expandAll   = () => setExpanded(new Set(activities.map(a => a.code)))
  const collapseAll = () => setExpanded(new Set())

  // Build visible list (tree filter)
  const visibleActivities = activities.filter(a => {
    if (a.level === 1) return true
    // Level 2: parent (level 1) must be expanded
    const parentCode = a.code.split('.').slice(0, -1).join('.')
    return expanded.has(parentCode)
  })

  // Which items have children
  const hasChildren = (code: string) =>
    activities.some(a => a.code.startsWith(code + '.'))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-civil-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main content */}
      <div className={clsx('flex-1 flex flex-col overflow-hidden', selected && 'lg:mr-0')}>
        <div className="p-4 lg:p-6 overflow-y-auto flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-civil-text">Work Breakdown Structure</h1>
              <p className="text-sm text-civil-muted mt-0.5">
                {activeProject?.name} · {activities.length} activities
              </p>
            </div>
            <div className="flex items-center gap-2">
              {activities.length > 0 && (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="btn-ghost flex items-center gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="btn-primary flex items-center gap-2"
              >
                {generating
                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  : <Wand2 className="w-3.5 h-3.5" />
                }
                {activities.length === 0 ? 'Auto Generate WBS' : 'Regenerate'}
              </button>
            </div>
          </div>

          {activities.length === 0 ? (
            /* Empty state */
            <div className="card flex flex-col items-center justify-center py-20 text-center">
              <LayoutList className="w-12 h-12 text-civil-border mb-4" />
              <p className="text-civil-text font-semibold">No WBS generated yet</p>
              <p className="text-civil-muted text-sm mt-2 max-w-sm">
                Click "Auto Generate WBS" to create a complete Construction WBS
                with 9 phases and 50+ activities automatically.
              </p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="btn-primary mt-5 flex items-center gap-2"
              >
                {generating
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : <Wand2 className="w-4 h-4" />
                }
                Auto Generate WBS
              </button>
            </div>
          ) : (
            <>
              {/* Stats */}
              <WBSStats activities={activities} />

              {/* Toolbar */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={expandAll}
                    className="flex items-center gap-1 text-xs text-civil-muted hover:text-civil-accent px-2 py-1 rounded"
                  >
                    <ChevronDown className="w-3.5 h-3.5" /> Expand All
                  </button>
                  <button
                    onClick={collapseAll}
                    className="flex items-center gap-1 text-xs text-civil-muted hover:text-civil-accent px-2 py-1 rounded"
                  >
                    <ChevronRight className="w-3.5 h-3.5" /> Collapse All
                  </button>
                </div>
                <div className="hidden md:flex items-center gap-4 text-[11px] text-civil-muted pr-2">
                  <span className="w-10 text-right">Dur.</span>
                  <span className="w-16">Progress</span>
                  <span className="w-24">Status</span>
                </div>
              </div>

              {/* WBS Table */}
              <div className="bg-civil-card border border-civil-border rounded-xl overflow-hidden">
                {/* Column headers */}
                <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-civil-surface border-b border-civil-border text-[10px] text-civil-muted font-medium">
                  <div className="w-4" />
                  <div className="w-10">Code</div>
                  <div className="flex-1">Activity Name</div>
                  <div className="w-14 text-right">Duration</div>
                  <div className="w-16">Progress</div>
                  <div className="w-24">Status</div>
                </div>

                {visibleActivities.map(activity => (
                  <WBSRow
                    key={activity.id}
                    activity={activity}
                    isExpanded={expanded.has(activity.code)}
                    hasChildren={hasChildren(activity.code)}
                    onToggle={() => toggleExpand(activity.code)}
                    onSelect={setSelected}
                    isSelected={selected?.id === activity.id}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="
          fixed inset-y-0 right-0 z-40 w-full max-w-xs
          lg:relative lg:inset-auto lg:w-80 lg:z-auto
          shadow-2xl lg:shadow-none
        ">
          <ActivityDetailPanel
            activity={selected}
            onClose={() => setSelected(null)}
            onUpdated={() => {/* onSnapshot handles refresh */}}
          />
        </div>
      )}

      {/* Mobile overlay */}
      {selected && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setSelected(null)}
        />
      )}

      {/* Confirm delete modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-civil-card border border-civil-border rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-civil-text mb-2">Reset WBS?</h3>
            <p className="text-sm text-civil-muted mb-5">
              All activities will be deleted. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="btn-ghost flex-1">Cancel</button>
              <button
                onClick={handleDeleteAll}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {deleting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
