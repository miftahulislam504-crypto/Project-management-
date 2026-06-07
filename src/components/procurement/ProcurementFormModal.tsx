import { useState, useEffect } from 'react'
import {
  ProcurementItem, ProcurementCategory,
  ProcurementStatus, categoryConfig, statusConfig
} from '@/lib/procurement-helpers'
import { X, Save } from 'lucide-react'

interface Props {
  item?:      Partial<ProcurementItem>
  projectId:  string
  onSave:     (data: Omit<ProcurementItem, 'id'>) => Promise<void>
  onClose:    () => void
}

const emptyForm = (projectId: string): Omit<ProcurementItem, 'id'> => ({
  projectId,
  name:           '',
  category:       'cement',
  specification:  '',
  quantity:       0,
  unit:           'bag',
  unitRate:       0,
  totalCost:      0,
  requiredDate:   '',
  orderedDate:    '',
  deliveryDate:   '',
  supplier:       '',
  status:         'pending',
  remarks:        '',
  linkedActivity: '',
  createdAt:      new Date().toISOString(),
  updatedAt:      new Date().toISOString(),
})

export default function ProcurementFormModal({ item, projectId, onSave, onClose }: Props) {
  const [form,   setForm]   = useState<Omit<ProcurementItem, 'id'>>(emptyForm(projectId))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setForm(f => ({ ...f, ...item }))
    }
  }, [])

  const update = (field: keyof typeof form, value: any) => {
    setForm(f => {
      const updated = { ...f, [field]: value }
      // Auto-calc total
      if (field === 'quantity' || field === 'unitRate') {
        updated.totalCost = (updated.quantity || 0) * (updated.unitRate || 0)
      }
      return updated
    })
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await onSave({ ...form, updatedAt: new Date().toISOString() })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-civil-card border border-civil-border rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-civil-border flex-shrink-0">
          <h2 className="font-semibold text-civil-text">
            {item?.id ? 'Edit Item' : 'Add Procurement Item'}
          </h2>
          <button onClick={onClose} className="text-civil-muted hover:text-civil-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Name + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-civil-muted mb-1 block">Material / Item Name *</label>
              <input
                className="input"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                placeholder="e.g. Cement (OPC 43 Grade)"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-civil-muted mb-1 block">Category</label>
              <select
                className="input"
                value={form.category}
                onChange={e => update('category', e.target.value as ProcurementCategory)}
              >
                {Object.entries(categoryConfig).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-civil-muted mb-1 block">Specification</label>
              <input
                className="input"
                value={form.specification}
                onChange={e => update('specification', e.target.value)}
                placeholder="e.g. 50kg bag"
              />
            </div>
          </div>

          {/* Qty + Unit + Rate */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-civil-muted mb-1 block">Quantity</label>
              <input
                type="number"
                className="input"
                value={form.quantity || ''}
                onChange={e => update('quantity', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-xs text-civil-muted mb-1 block">Unit</label>
              <input
                className="input"
                value={form.unit}
                onChange={e => update('unit', e.target.value)}
                placeholder="bag / kg / nos"
              />
            </div>
            <div>
              <label className="text-xs text-civil-muted mb-1 block">Unit Rate (৳)</label>
              <input
                type="number"
                className="input"
                value={form.unitRate || ''}
                onChange={e => update('unitRate', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Total cost display */}
          <div className="bg-civil-accent/10 border border-civil-accent/20 rounded-lg px-4 py-2.5 flex justify-between items-center">
            <span className="text-xs text-civil-muted">Total Cost</span>
            <span className="text-base font-bold text-civil-accent">
              ৳ {form.totalCost.toLocaleString()}
            </span>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-civil-muted mb-1 block">Required Date *</label>
              <input
                type="date"
                className="input"
                value={form.requiredDate}
                onChange={e => update('requiredDate', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-civil-muted mb-1 block">Delivery Date</label>
              <input
                type="date"
                className="input"
                value={form.deliveryDate}
                onChange={e => update('deliveryDate', e.target.value)}
              />
            </div>
          </div>

          {/* Supplier + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-civil-muted mb-1 block">Supplier</label>
              <input
                className="input"
                value={form.supplier}
                onChange={e => update('supplier', e.target.value)}
                placeholder="Supplier name"
              />
            </div>
            <div>
              <label className="text-xs text-civil-muted mb-1 block">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={e => update('status', e.target.value as ProcurementStatus)}
              >
                {Object.entries(statusConfig).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="text-xs text-civil-muted mb-1 block">Remarks</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={form.remarks}
              onChange={e => update('remarks', e.target.value)}
              placeholder="Any notes..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-civil-border flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
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
