import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Activity } from '@/lib/types'
import {
  ProcurementItem, ProcurementCategory,
  ProcurementStatus, categoryConfig, statusConfig,
  autoGenerateProcurement, calcProcurementStats,
} from '@/lib/procurement-helpers'
import {
  bulkAddProcurement, addProcurementItem,
  updateProcurementItem, deleteAllProcurement,
} from '@/lib/procurement-firestore'
import { useProjectStore } from '@/store/useProjectStore'
import ProcurementTable     from '@/components/procurement/ProcurementTable'
import ProcurementFormModal from '@/components/procurement/ProcurementFormModal'
import {
  Plus, Wand2, Trash2, RefreshCw,
  PackageSearch, CheckCircle2, Clock,
  ShoppingCart, Truck, XCircle, DollarSign,
} from 'lucide-react'
import { clsx } from 'clsx'

export default function ProcurementPage() {
  const { id: projectId }   = useParams<{ id: string }>()
  const { activeProject }   = useProjectStore()
  const [items,       setItems]       = useState<ProcurementItem[]>([])
  const [activities,  setActivities]  = useState<Activity[]>([])
  const [loading,     setLoading]     = useState(true)
  const [generating,  setGenerating]  = useState(false)
  const [showModal,   setShowModal]   = useState(false)
  const [editItem,    setEditItem]    = useState<ProcurementItem | undefined>()
  const [filterCat,   setFilterCat]   = useState<ProcurementCategory | 'all'>('all')
  const [filterStat,  setFilterStat]  = useState<ProcurementStatus   | 'all'>('all')
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting,    setDeleting]    = useState(false)

  // Procurement real-time listener
  useEffect(() => {
    if (!projectId) return
    const q = query(
      collection(db, 'procurement'),
      where('projectId', '==', projectId)
    )
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as ProcurementItem))
      setItems(data.sort((a, b) => a.category.localeCompare(b.category)))
      setLoading(false)
    })
    return () => unsub()
  }, [projectId])

  // Activities listener (for auto-generate)
  useEffect(() => {
    if (!projectId) return
    const q = query(
      collection(db, 'activities'),
      where('projectId', '==', projectId)
    )
    const unsub = onSnapshot(q, snap => {
      setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() } as Activity)))
    })
    return () => unsub()
  }, [projectId])

  const handleAutoGenerate = async () => {
    if (!projectId) return
    setGenerating(true)
    try {
      const generated = autoGenerateProcurement(
        activities,
        projectId,
        activeProject?.startDate ?? new Date().toISOString().split('T')[0]
      )
      if (generated.length > 0) {
        await bulkAddProcurement(generated)
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async (data: Omit<ProcurementItem, 'id'>) => {
    if (editItem?.id) {
      await updateProcurementItem(editItem.id, data)
    } else {
      await addProcurementItem(data)
    }
    setEditItem(undefined)
  }

  const handleDeleteAll = async () => {
    if (!projectId) return
    setDeleting(true)
    try {
      await deleteAllProcurement(projectId)
      setShowConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  const stats = calcProcurementStats(items)

  const statCards = [
    { label: 'Total Items',  value: stats.total,     icon: PackageSearch, color: 'text-civil-muted',  bg: 'bg-civil-surface' },
    { label: 'Pending',      value: stats.pending,   icon: Clock,         color: 'text-yellow-400',   bg: 'bg-yellow-900/20' },
    { label: 'Approved',     value: stats.approved,  icon: CheckCircle2,  color: 'text-blue-400',     bg: 'bg-blue-900/20' },
    { label: 'Ordered',      value: stats.ordered,   icon: ShoppingCart,  color: 'text-purple-400',   bg: 'bg-purple-900/20' },
    { label: 'Delivered',    value: stats.delivered, icon: Truck,         color: 'text-green-400',    bg: 'bg-green-900/20' },
    { label: 'Total Budget', value: `৳ ${(stats.totalBudget / 100000).toFixed(1)}L`, icon: DollarSign, color: 'text-civil-accent', bg: 'bg-blue-900/20' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-civil-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-civil-text">Procurement Planning</h1>
          <p className="text-sm text-civil-muted mt-0.5">
            {activeProject?.name} · {items.length} items
          </p>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={() => setShowConfirm(true)}
              className="btn-ghost flex items-center gap-1.5 text-red-400 border-red-900/30 hover:bg-red-900/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
          <button
            onClick={handleAutoGenerate}
            disabled={generating || activities.length === 0}
            className="btn-ghost flex items-center gap-2 text-civil-accent border-civil-accent/30 hover:bg-civil-accent/10"
          >
            {generating
              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              : <Wand2 className="w-3.5 h-3.5" />
            }
            <span className="hidden sm:inline">Auto Generate</span>
          </button>
          <button
            onClick={() => { setEditItem(undefined); setShowModal(true) }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card">
            <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center mb-2', bg)}>
              <Icon className={clsx('w-3.5 h-3.5', color)} />
            </div>
            <p className={clsx('text-sm font-bold', color)}>{value}</p>
            <p className="text-[10px] text-civil-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Budget progress bar */}
      {stats.totalBudget > 0 && (
        <div className="card mb-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-civil-muted">Budget Utilization</span>
            <span className="text-civil-accent font-semibold">
              ৳ {stats.spent.toLocaleString()} / ৳ {stats.totalBudget.toLocaleString()}
            </span>
          </div>
          <div className="h-2 bg-civil-border rounded-full overflow-hidden">
            <div
              className="h-full bg-civil-accent rounded-full transition-all"
              style={{ width: `${Math.min((stats.spent / stats.totalBudget) * 100, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-civil-muted mt-1">
            {Math.round((stats.spent / stats.totalBudget) * 100)}% committed (Ordered + Delivered)
          </p>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <PackageSearch className="w-12 h-12 text-civil-border mb-4" />
          <p className="text-civil-text font-semibold">No procurement items yet</p>
          <p className="text-civil-muted text-sm mt-2 max-w-sm">
            Click "Auto Generate" to create procurement list from assigned resources,
            or add items manually.
          </p>
          <div className="flex gap-3 mt-5">
            <button
              onClick={handleAutoGenerate}
              disabled={generating || activities.length === 0}
              className="btn-ghost flex items-center gap-2 text-civil-accent border-civil-accent/30"
            >
              <Wand2 className="w-4 h-4" />
              Auto Generate
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Manually
            </button>
          </div>
        </div>
      )}

      {/* Filters + Table */}
      {items.length > 0 && (
        <div className="card p-0 overflow-hidden">
          {/* Filter bar */}
          <div className="px-4 py-3 border-b border-civil-border bg-civil-surface flex flex-wrap items-center gap-3">
            {/* Category filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-civil-muted font-medium">Category:</span>
              {(['all', ...Object.keys(categoryConfig)] as (ProcurementCategory | 'all')[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  className={clsx(
                    'text-[10px] px-2 py-0.5 rounded-full border transition-colors',
                    filterCat === cat
                      ? 'bg-civil-accent/20 border-civil-accent/40 text-civil-accent'
                      : 'border-civil-border text-civil-muted hover:text-civil-text'
                  )}
                >
                  {cat === 'all' ? 'All' : categoryConfig[cat].label}
                </button>
              ))}
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1.5 flex-wrap ml-auto">
              <span className="text-[10px] text-civil-muted font-medium">Status:</span>
              {(['all', ...Object.keys(statusConfig)] as (ProcurementStatus | 'all')[]).map(stat => (
                <button
                  key={stat}
                  onClick={() => setFilterStat(stat)}
                  className={clsx(
                    'text-[10px] px-2 py-0.5 rounded-full border transition-colors',
                    filterStat === stat
                      ? 'bg-civil-accent/20 border-civil-accent/40 text-civil-accent'
                      : 'border-civil-border text-civil-muted hover:text-civil-text'
                  )}
                >
                  {stat === 'all' ? 'All' : statusConfig[stat as ProcurementStatus].label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <ProcurementTable
            items={items}
            filterCat={filterCat}
            filterStat={filterStat}
            onEdit={(item) => { setEditItem(item); setShowModal(true) }}
            onDeleted={() => {}}
          />
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <ProcurementFormModal
          item={editItem}
          projectId={projectId!}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditItem(undefined) }}
        />
      )}

      {/* Confirm reset */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-civil-card border border-civil-border rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-civil-text mb-2">Reset Procurement?</h3>
            <p className="text-sm text-civil-muted mb-5">
              All procurement items will be deleted. This cannot be undone.
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
