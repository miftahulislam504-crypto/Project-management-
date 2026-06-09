import { useState } from 'react'
import { Activity } from '@/lib/types'
import {
  CostEntry, CostCategory,
  costCategoryConfig, addCostEntry,
} from '@/lib/cost-helpers'
import { useAuthStore } from '@/store/useAuthStore'
import { X, Save } from 'lucide-react'

interface Props {
  projectId:  string
  activities: Activity[]
  onClose:    () => void
}

export default function CostEntryModal({ projectId, activities, onClose }: Props) {
  const { user } = useAuthStore()
  const [form, setForm] = useState({
    activityId:   '',
    activityName: '',
    category:     'material' as CostCategory,
    description:  '',
    amount:       '',
    date:         new Date().toISOString().split('T')[0],
    invoiceNo:    '',
    vendor:       '',
  })
  const [saving, setSaving] = useState(false)

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleActivityChange = (id: string) => {
    const act = activities.find(a => a.id === id)
    update('activityId', id)
    update('activityName', act ? `${act.code} ${act.name}` : '')
  }

  const handleSave = async () => {
    if (!form.description.trim() || !form.amount) return
    setSaving(true)
    try {
      await addCostEntry({
        projectId,
        activityId:   form.activityId,
        activityName: form.activityName,
        category:     form.category,
        description:  form.description,
        amount:       parseFloat(form.amount) || 0,
        date:         form.date,
        invoiceNo:    form.invoiceNo,
        vendor:       form.vendor,
        createdBy:    user?.displayName ?? '',
        createdAt:    new Date().toISOString(),
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const leaves = activities.filter(a => a.level === 2)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-civil-card border border-civil-border rounded-2xl w-full max-w-md flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between px-5 py-4 border-b border-civil-border">
          <h2 className="font-semibold text-civil-text">Add Cost Entry</h2>
          <button onClick={onClose} className="text-civil-muted hover:text-civil-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Category */}
          <div>
            <label className="text-xs text-civil-muted mb-2 block">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(costCategoryConfig) as CostCategory[]).map(cat => {
                const cfg = costCategoryConfig[cat]
                return (
                  <button
                    key={cat}
                    onClick={() => update('category', cat)}
                    className={`py-2 rounded-lg border text-xs font-medium transition-colors
                      ${form.category === cat
                        ? `${cfg.bg} ${cfg.color} border-current`
                        : 'bg-civil-surface border-civil-border text-civil-muted hover:text-civil-text'
                      }`}
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-civil-muted mb-1 block">Description *</label>
            <input
              className="input"
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="e.g. Cement purchase — 200 bags"
              autoFocus
            />
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-civil-muted mb-1 block">Amount (৳) *</label>
              <input
                type="number"
                className="input"
                value={form.amount}
                onChange={e => update('amount', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs text-civil-muted mb-1 block">Date</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={e => update('date', e.target.value)}
              />
            </div>
          </div>

          {/* Activity */}
          <div>
            <label className="text-xs text-civil-muted mb-1 block">Linked Activity</label>
            <select
              className="input"
              value={form.activityId}
              onChange={e => handleActivityChange(e.target.value)}
            >
              <option value="">— None —</option>
              {leaves.map(a => (
                <option key={a.id} value={a.id}>
                  {a.code} {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Vendor + Invoice */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-civil-muted mb-1 block">Vendor</label>
              <input
                className="input"
                value={form.vendor}
                onChange={e => update('vendor', e.target.value)}
                placeholder="Supplier name"
              />
            </div>
            <div>
              <label className="text-xs text-civil-muted mb-1 block">Invoice No.</label>
              <input
                className="input"
                value={form.invoiceNo}
                onChange={e => update('invoiceNo', e.target.value)}
                placeholder="INV-001"
              />
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-civil-border flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.description.trim() || !form.amount}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {saving
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Save className="w-4 h-4" />
            }
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
