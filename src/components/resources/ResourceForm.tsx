import { useState } from 'react'
import { ActivityResource } from '@/lib/types'
import {
  ResourceType,
  resourceTypeConfig,
} from '@/lib/resource-helpers'
import { Plus, X, Save } from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  resources:  ActivityResource[]
  onChange:   (resources: ActivityResource[]) => void
  onSave:     () => void
  saving:     boolean
}

const emptyResource = (): ActivityResource => ({
  type:     'labor',
  name:     '',
  quantity: 1,
  unit:     'person',
  unitRate: 0,
})

export default function ResourceForm({ resources, onChange, onSave, saving }: Props) {
  const [adding, setAdding] = useState(false)
  const [newRes, setNewRes] = useState<ActivityResource>(emptyResource())

  const handleAdd = () => {
    if (!newRes.name.trim()) return
    onChange([...resources, { ...newRes }])
    setNewRes(emptyResource())
    setAdding(false)
  }

  const handleRemove = (idx: number) => {
    onChange(resources.filter((_, i) => i !== idx))
  }

  const handleChange = (idx: number, field: keyof ActivityResource, value: any) => {
    const updated = resources.map((r, i) =>
      i === idx ? { ...r, [field]: value } : r
    )
    onChange(updated)
  }

  const cfg = (type: string) =>
    resourceTypeConfig[type as ResourceType] ?? resourceTypeConfig.labor

  return (
    <div className="space-y-3">

      {/* Existing resources */}
      {resources.length === 0 && !adding && (
        <p className="text-xs text-civil-muted text-center py-4">
          No resources assigned yet
        </p>
      )}

      {resources.map((res, idx) => (
        <div
          key={idx}
          className="bg-civil-surface border border-civil-border rounded-lg p-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className={clsx(
              'text-[10px] font-semibold px-2 py-0.5 rounded-full',
              cfg(res.type).bg,
              cfg(res.type).color
            )}>
              {cfg(res.type).label}
            </span>
            <button
              onClick={() => handleRemove(idx)}
              className="text-civil-muted hover:text-red-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-civil-muted mb-0.5 block">Name</label>
              <input
                className="input text-xs py-1.5"
                value={res.name}
                onChange={e => handleChange(idx, 'name', e.target.value)}
                placeholder="Resource name"
              />
            </div>
            <div>
              <label className="text-[10px] text-civil-muted mb-0.5 block">Unit</label>
              <input
                className="input text-xs py-1.5"
                value={res.unit}
                onChange={e => handleChange(idx, 'unit', e.target.value)}
                placeholder="person / bag / nos"
              />
            </div>
            <div>
              <label className="text-[10px] text-civil-muted mb-0.5 block">Quantity</label>
              <input
                type="number"
                className="input text-xs py-1.5"
                value={res.quantity}
                onChange={e => handleChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-[10px] text-civil-muted mb-0.5 block">Unit Rate (৳)</label>
              <input
                type="number"
                className="input text-xs py-1.5"
                value={res.unitRate}
                onChange={e => handleChange(idx, 'unitRate', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Cost preview */}
          <div className="flex justify-end">
            <span className="text-[10px] text-civil-muted">
              Total: <span className="text-civil-accent font-semibold">
                ৳ {(res.quantity * res.unitRate).toLocaleString()}
              </span>
            </span>
          </div>
        </div>
      ))}

      {/* Add new resource form */}
      {adding && (
        <div className="bg-civil-surface border border-civil-accent/30 rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-civil-muted mb-0.5 block">Type</label>
              <select
                className="input text-xs py-1.5"
                value={newRes.type}
                onChange={e => setNewRes(r => ({
                  ...r,
                  type: e.target.value as ResourceType,
                  unit: resourceTypeConfig[e.target.value as ResourceType].unit[0],
                }))}
              >
                {Object.entries(resourceTypeConfig).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-civil-muted mb-0.5 block">Unit</label>
              <select
                className="input text-xs py-1.5"
                value={newRes.unit}
                onChange={e => setNewRes(r => ({ ...r, unit: e.target.value }))}
              >
                {resourceTypeConfig[newRes.type as ResourceType].unit.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-civil-muted mb-0.5 block">Name</label>
              <input
                className="input text-xs py-1.5"
                value={newRes.name}
                onChange={e => setNewRes(r => ({ ...r, name: e.target.value }))}
                placeholder="e.g. Mason, Concrete Mixer, Cement..."
                autoFocus
              />
            </div>
            <div>
              <label className="text-[10px] text-civil-muted mb-0.5 block">Quantity</label>
              <input
                type="number"
                className="input text-xs py-1.5"
                value={newRes.quantity}
                onChange={e => setNewRes(r => ({ ...r, quantity: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="text-[10px] text-civil-muted mb-0.5 block">Unit Rate (৳)</label>
              <input
                type="number"
                className="input text-xs py-1.5"
                value={newRes.unitRate}
                onChange={e => setNewRes(r => ({ ...r, unitRate: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { setAdding(false); setNewRes(emptyResource()) }}
              className="btn-ghost flex-1 text-xs py-1.5"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newRes.name.trim()}
              className="btn-primary flex-1 text-xs py-1.5"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2 pt-1">
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="btn-ghost flex-1 flex items-center justify-center gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Resource
          </button>
        )}
        <button
          onClick={onSave}
          disabled={saving}
          className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-xs"
        >
          {saving
            ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Save className="w-3.5 h-3.5" />
          }
          Save
        </button>
      </div>
    </div>
  )
}
