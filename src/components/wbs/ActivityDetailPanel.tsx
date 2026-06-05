import { useState } from 'react'
import { Activity } from '@/lib/types'
import { updateActivity } from '@/lib/firestore'
import {
  X, Save, Calendar, Clock,
  DollarSign, TrendingUp, AlertTriangle
} from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  activity: Activity
  onClose: () => void
  onUpdated: () => void
}

export default function ActivityDetailPanel({ activity, onClose, onUpdated }: Props) {
  const [progress,  setProgress]  = useState(activity.progress)
  const [status,    setStatus]    = useState(activity.status)
  const [isCritical, setIsCritical] = useState(activity.isCritical)
  const [saving,    setSaving]    = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateActivity(activity.id, { progress, status, isCritical })
      onUpdated()
    } finally {
      setSaving(false)
    }
  }

  const statusOptions: Activity['status'][] = [
    'not-started', 'in-progress', 'completed', 'delayed'
  ]

  return (
    <div className="h-full flex flex-col bg-civil-card border-l border-civil-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-civil-border">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono text-civil-muted">{activity.code}</p>
          <h3 className="text-sm font-semibold text-civil-text truncate">{activity.name}</h3>
        </div>
        <button onClick={onClose} className="text-civil-muted hover:text-civil-text ml-2">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-civil-surface rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="w-3 h-3 text-civil-muted" />
              <span className="text-[10px] text-civil-muted">Start Date</span>
            </div>
            <p className="text-xs font-medium text-civil-text">{activity.startDate}</p>
          </div>
          <div className="bg-civil-surface rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="w-3 h-3 text-civil-muted" />
              <span className="text-[10px] text-civil-muted">End Date</span>
            </div>
            <p className="text-xs font-medium text-civil-text">{activity.endDate}</p>
          </div>
        </div>

        {/* Duration */}
        <div className="bg-civil-surface rounded-lg p-3 flex items-center gap-3">
          <Clock className="w-4 h-4 text-civil-accent" />
          <div>
            <p className="text-[10px] text-civil-muted">Duration</p>
            <p className="text-sm font-semibold text-civil-text">{activity.duration} days</p>
          </div>
        </div>

        {/* Progress Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-civil-text">Progress</label>
            <span className="text-sm font-bold text-civil-accent">{progress}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            onChange={e => setProgress(Number(e.target.value))}
            className="w-full accent-sky-400"
          />
          <div className="flex justify-between text-[10px] text-civil-muted mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="text-xs font-medium text-civil-text mb-2 block">Status</label>
          <div className="grid grid-cols-2 gap-2">
            {statusOptions.map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={clsx(
                  'px-3 py-2 rounded-lg text-xs font-medium capitalize border transition-colors',
                  status === s
                    ? 'bg-civil-accent/20 border-civil-accent/40 text-civil-accent'
                    : 'bg-civil-surface border-civil-border text-civil-muted hover:text-civil-text'
                )}
              >
                {s.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Critical toggle */}
        <div className="flex items-center justify-between bg-civil-surface rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs font-medium text-civil-text">Critical Path</span>
          </div>
          <button
            onClick={() => setIsCritical(v => !v)}
            className={clsx(
              'w-10 h-5 rounded-full transition-colors relative',
              isCritical ? 'bg-red-500' : 'bg-civil-border'
            )}
          >
            <span className={clsx(
              'absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
              isCritical ? 'translate-x-5' : 'translate-x-0.5'
            )} />
          </button>
        </div>

        {/* Cost info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-civil-surface rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3 h-3 text-civil-muted" />
              <span className="text-[10px] text-civil-muted">Planned Cost</span>
            </div>
            <p className="text-xs font-medium text-civil-text">
              ৳ {activity.plannedCost.toLocaleString()}
            </p>
          </div>
          <div className="bg-civil-surface rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3 h-3 text-civil-muted" />
              <span className="text-[10px] text-civil-muted">Actual Cost</span>
            </div>
            <p className="text-xs font-medium text-civil-text">
              ৳ {activity.actualCost.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="px-4 py-3 border-t border-civil-border">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {saving
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Save className="w-4 h-4" />
          }
          Save Changes
        </button>
      </div>
    </div>
  )
}
