import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Activity } from '@/lib/types'
import {
  CostEntry, BudgetSummary,
  calcBudgetSummary, calcEVM, buildSCurveData,
  subscribeToCostEntries, deleteCostEntry,
  costCategoryConfig, CostCategory,
} from '@/lib/cost-helpers'
import { useProjectStore } from '@/store/useProjectStore'
import CostEntryModal  from '@/components/cost/CostEntryModal'
import { BudgetVsActualChart, CostBreakdownChart } from '@/components/cost/BudgetChart'
import EVMDashboard    from '@/components/evm/EVMDashboard'
import SCurveChart     from '@/components/scurve/SCurveChart'
import {
  Plus, DollarSign, TrendingUp,
  BarChart3, Trash2, Activity as ActivityIcon,
} from 'lucide-react'
import { clsx } from 'clsx'

type TabType = 'cost' | 'evm' | 'scurve'

export default function CostPage() {
  const { id: projectId }   = useParams<{ id: string }>()
  const { activeProject }   = useProjectStore()
  const [activities,  setActivities]  = useState<Activity[]>([])
  const [costEntries, setCostEntries] = useState<CostEntry[]>([])
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState<TabType>('cost')
  const [showModal,   setShowModal]   = useState(false)
  const [deletingId,  setDeletingId]  = useState<string | null>(null)

  // Activities
  useEffect(() => {
    if (!projectId) return
    const q = query(collection(db, 'activities'), where('projectId', '==', projectId))
    return onSnapshot(q, snap => {
      setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() } as Activity)))
      setLoading(false)
    })
  }, [projectId])

  // Cost entries
  useEffect(() => {
    if (!projectId) return
    return subscribeToCostEntries(projectId, setCostEntries)
  }, [projectId])

  const summary   = calcBudgetSummary(activities, costEntries)
  const evm       = calcEVM(activities, costEntries.reduce((s, e) => s + e.amount, 0))
  const sCurve    = buildSCurveData(activities)
  const totalActual = costEntries.reduce((s, e) => s + e.amount, 0)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try { await deleteCostEntry(id) }
    finally { setDeletingId(null) }
  }

  const tabs = [
    { key: 'cost',   label: '💰 Cost',    icon: DollarSign },
    { key: 'evm',    label: '📊 EVM',     icon: TrendingUp },
    { key: 'scurve', label: '📈 S-Curve', icon: BarChart3 },
  ] as const

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-civil-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-civil-text">Cost Control</h1>
          <p className="text-sm text-civil-muted mt-0.5">
            {activeProject?.name} · EVM · S-Curve
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Cost
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total Budget', value: `৳ ${(summary.totalBudget/100000).toFixed(1)}L`, color: 'text-civil-accent', bg: 'bg-blue-900/20' },
          { label: 'Actual Spent', value: `৳ ${(totalActual/100000).toFixed(1)}L`,         color: 'text-yellow-400',   bg: 'bg-yellow-900/20' },
          { label: 'Variance',     value: `৳ ${(Math.abs(summary.totalVariance)/100000).toFixed(1)}L`,
            color: summary.totalVariance >= 0 ? 'text-green-400' : 'text-red-400',
            bg:    summary.totalVariance >= 0 ? 'bg-green-900/20' : 'bg-red-900/20' },
          { label: 'Cost Entries', value: costEntries.length, color: 'text-civil-muted', bg: 'bg-civil-surface' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="card">
            <p className="text-xs text-civil-muted mb-1">{label}</p>
            <p className={clsx('text-xl font-bold', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Budget utilization bar */}
      {summary.totalBudget > 0 && (
        <div className="card mb-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-civil-muted">Budget Utilization</span>
            <span className="font-semibold text-civil-accent">
              {Math.round((totalActual / summary.totalBudget) * 100)}%
            </span>
          </div>
          <div className="h-2.5 bg-civil-border rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all',
                totalActual > summary.totalBudget ? 'bg-red-400' : 'bg-civil-accent'
              )}
              style={{ width: `${Math.min((totalActual / summary.totalBudget) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-civil-muted mt-1">
            <span>৳ 0</span>
            <span>৳ {(summary.totalBudget / 100000).toFixed(1)}L (Budget)</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-civil-surface border border-civil-border rounded-lg p-1 gap-1 mb-4 w-fit">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              'px-3 py-1.5 rounded text-xs font-medium transition-colors',
              tab === key
                ? 'bg-civil-accent text-white'
                : 'text-civil-muted hover:text-civil-text'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── COST TAB ── */}
      {tab === 'cost' && (
        <div className="space-y-4">
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="text-sm font-semibold text-civil-text mb-3">Budget vs Actual by Activity</h3>
              <BudgetVsActualChart summary={summary} />
            </div>
            <div className="card">
              <h3 className="text-sm font-semibold text-civil-text mb-3">Cost Breakdown</h3>
              <CostBreakdownChart summary={summary} />
            </div>
          </div>

          {/* Cost entries table */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-civil-border bg-civil-surface flex items-center justify-between">
              <p className="text-sm font-semibold text-civil-text">Cost Entries</p>
              <p className="text-xs text-civil-muted">{costEntries.length} entries</p>
            </div>

            {costEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <DollarSign className="w-10 h-10 text-civil-border mb-3" />
                <p className="text-civil-text font-semibold text-sm">No cost entries yet</p>
                <p className="text-civil-muted text-xs mt-1">
                  Click "Add Cost" to record actual expenditures
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-civil-border bg-civil-surface">
                      {['Date', 'Description', 'Category', 'Activity', 'Vendor', 'Invoice', 'Amount', ''].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-civil-muted font-medium whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {costEntries.map((e, i) => {
                      const cfg = costCategoryConfig[e.category]
                      return (
                        <tr
                          key={e.id}
                          className={clsx(
                            'border-b border-civil-border/40 hover:bg-civil-surface/40 group transition-colors',
                            i % 2 === 0 ? '' : 'bg-civil-surface/10'
                          )}
                        >
                          <td className="px-3 py-2.5 text-civil-muted whitespace-nowrap">{e.date}</td>
                          <td className="px-3 py-2.5 text-civil-text max-w-[160px] truncate">{e.description}</td>
                          <td className="px-3 py-2.5">
                            <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-medium', cfg.bg, cfg.color)}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-civil-muted max-w-[120px] truncate">{e.activityName || '—'}</td>
                          <td className="px-3 py-2.5 text-civil-muted">{e.vendor || '—'}</td>
                          <td className="px-3 py-2.5 text-civil-muted">{e.invoiceNo || '—'}</td>
                          <td className="px-3 py-2.5 text-civil-accent font-semibold whitespace-nowrap">
                            ৳ {e.amount.toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5">
                            <button
                              onClick={() => handleDelete(e.id)}
                              disabled={deletingId === e.id}
                              className="opacity-0 group-hover:opacity-100 text-civil-muted hover:text-red-400 transition-all"
                            >
                              {deletingId === e.id
                                ? <span className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin block" />
                                : <Trash2 className="w-3.5 h-3.5" />
                              }
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-civil-border bg-civil-surface">
                      <td colSpan={6} className="px-3 py-2.5 text-xs font-semibold text-civil-muted">
                        Total ({costEntries.length} entries)
                      </td>
                      <td className="px-3 py-2.5 text-sm font-bold text-civil-accent">
                        ৳ {totalActual.toLocaleString()}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EVM TAB ── */}
      {tab === 'evm' && (
        summary.totalBudget === 0 ? (
          <div className="card flex flex-col items-center py-16 text-center">
            <ActivityIcon className="w-10 h-10 text-civil-border mb-3" />
            <p className="text-civil-text font-semibold">No budget data</p>
            <p className="text-civil-muted text-sm mt-1">
              Assign planned costs to activities in the Resource tab first.
            </p>
          </div>
        ) : (
          <EVMDashboard metrics={evm} />
        )
      )}

      {/* ── S-CURVE TAB ── */}
      {tab === 'scurve' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-civil-text">Progress S-Curve</h3>
              <div className="flex items-center gap-3 text-[11px]">
                {[
                  { color: 'bg-civil-accent', label: 'Planned' },
                  { color: 'bg-green-400',    label: 'Actual' },
                  { color: 'bg-yellow-400',   label: 'Forecast' },
                  { color: 'bg-red-400',      label: 'Today' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1">
                    <div className={clsx('w-3 h-0.5 rounded', color)} />
                    <span className="text-civil-muted">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-civil-muted mb-4">
              Cumulative progress — Planned vs Actual with forecast projection
            </p>
            <SCurveChart data={sCurve} />
          </div>

          {/* S-Curve data table */}
          {sCurve.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-civil-border bg-civil-surface">
                <p className="text-sm font-semibold text-civil-text">S-Curve Data Table</p>
              </div>
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-civil-surface">
                    <tr className="border-b border-civil-border">
                      {['Week', 'Planned %', 'Actual %', 'Variance', 'Forecast %'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-civil-muted font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sCurve.map((row, i) => {
                      const v = row.actual - row.planned
                      return (
                        <tr key={i} className="border-b border-civil-border/40 hover:bg-civil-surface/40">
                          <td className="px-3 py-2 text-civil-muted font-mono">{row.week}</td>
                          <td className="px-3 py-2 text-civil-accent">{row.planned}%</td>
                          <td className="px-3 py-2 text-green-400">{row.actual > 0 ? `${row.actual}%` : '—'}</td>
                          <td className={clsx('px-3 py-2 font-semibold', row.actual > 0 ? (v >= 0 ? 'text-green-400' : 'text-red-400') : 'text-civil-muted')}>
                            {row.actual > 0 ? `${v >= 0 ? '+' : ''}${v}%` : '—'}
                          </td>
                          <td className="px-3 py-2 text-yellow-400">
                            {row.forecast !== undefined ? `${row.forecast}%` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CostEntryModal
          projectId={projectId!}
          activities={activities}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
