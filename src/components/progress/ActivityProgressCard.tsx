import { useState } from 'react'
import { Activity } from '@/lib/types'
import { updateActivity } from '@/lib/firestore'
import { addProgressUpdate, IssueFlag, issueFlagConfig } from '@/lib/progress-helpers'
import { useAuthStore } from '@/store/useAuthStore'
import {
  ChevronDown, ChevronUp, Save,
  AlertTriangle, CheckCircle2, Clock, Circle
} from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  activity:  Activity
  projectId: string
}

const statusIcon = {
  'not-started': { icon: Circle,       color: 'text-civil-muted' },
  'in-progress': { icon: Clock,        color: 'text-blue-400' },
  'completed':   { icon: CheckCircle2, color: 'text-green-400' },
  'delayed':     { icon: AlertTriangle,color: 'text-red-400' },
}

export default function ActivityProgressCard({ activity, projectId }: Props) {
  const { user }                    = useAuthStore()
  const [expanded,    setExpanded]  = useState(false)
  const [progress,    setProgress]  = useState(activity.progress)
  const [issueFlag,   setIssueFlag] = useState<IssueFlag>('none')
  const [remarks,     setRemarks]   = useState('')
  const [saving,      setSaving]    = useState(false)
  const [saved,       setSaved]     = useState(false)

  const cfg    = statusIcon[activity.status]
  const Icon   = cfg.icon
  const changed = progress !== activity.progress

  const handleSave = async () => {
    setSaving(true)
    try {
      const newStatus: Activity['status'] =
        progress === 100 ? 'completed' :
        progress > 0     ? 'in-progress' :
        issueFlag === 'major' || issueFlag === 'critical' ? 'delayed' :
        'not-started'

      // Update activity
      await updateActivity(activity.id, {
        progress,
        status: newStatus,
      })

      // Log progress update
      await addProgressUpdate({
        projectId,
        activityId:       activity.id,
        activityName:     activity.name,
        activityCode:     activity.code,
        progress,
        previousProgress: activity.progress,
        remarks,
        issues:           issueFlag,
        photoUrls:        [],
        updatedBy:        user?.displayName ?? 'Unknown',
        updatedAt:        new Date().toISOString(),
        date:             new Date().toISOString().split('T')[0],
      })

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      setRemarks('')
      setIssueFlag('none')
      setExpanded(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={clsx(
      'bg-civil-card border rounded-xl overflow-hidden transition-colors',
      activity.status === 'delayed'     && 'border-red-900/40',
      activity.status === 'completed'   && 'border-green-900/40',
      activity.status === 'in-progress' && 'border-blue-900/40',
      activity.status === 'not-started' && 'border-civil-border',
    )}>
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-civil-surface/40"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Status icon */}
        <Icon className={clsx('w-4 h-4 flex-shrink-0', cfg.color)} />

        {/* Code + Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-civil-muted">{activity.code}</span>
            <span className="text-xs font-medium text-civil-text truncate">{activity.name}</span>
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1.5 bg-civil-border rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all',
                  progress === 100 ? 'bg-green-400' :
                  progress > 0     ? 'bg-civil-accent' : 'bg-civil-border'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className={clsx(
              'text-xs font-bold flex-shrink-0',
              progress === 100 ? 'text-green-400' :
              progress > 0     ? 'text-civil-accent' : 'text-civil-muted'
            )}>
              {progress}%
            </span>
          </div>
        </div>

        {/* Duration + expand */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-civil-muted hidden sm:block">
            {activity.duration}d
          </span>
          {expanded
            ? <ChevronUp   className="w-4 h-4 text-civil-muted" />
            : <ChevronDown className="w-4 h-4 text-civil-muted" />
          }
        </div>
      </div>

      {/* Expanded update form */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-civil-border space-y-3">

          {/* Progress slider */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-civil-muted">Update Progress</span>
              <span className={clsx(
                'font-bold',
                progress === 100 ? 'text-green-400' : 'text-civil-accent'
              )}>
                {progress}%
              </span>
            </div>
            <input
              type="range"
              min={0} max={100} step={5}
              value={progress}
              onChange={e => setProgress(Number(e.target.value))}
              className="w-full accent-sky-400"
            />
            {/* Quick set buttons */}
            <div className="flex gap-1.5 mt-2">
              {[0, 25, 50, 75, 100].map(v => (
                <button
                  key={v}
                  onClick={() => setProgress(v)}
                  className={clsx(
                    'flex-1 text-[10px] py-1 rounded border transition-colors',
                    progress === v
                      ? 'bg-civil-accent/20 border-civil-accent/40 text-civil-accent'
                      : 'bg-civil-surface border-civil-border text-civil-muted hover:text-civil-text'
                  )}
                >
                  {v}%
                </button>
              ))}
            </div>
          </div>

          {/* Issue flag */}
          <div>
            <p className="text-xs text-civil-muted mb-1.5">Issue Flag</p>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(issueFlagConfig) as IssueFlag[]).map(flag => {
                const fc = issueFlagConfig[flag]
                return (
                  <button
                    key={flag}
                    onClick={() => setIssueFlag(flag)}
                    className={clsx(
                      'text-[10px] py-1.5 rounded-lg border font-medium transition-colors',
                      issueFlag === flag
                        ? `${fc.bg} ${fc.color} border-current`
                        : 'bg-civil-surface border-civil-border text-civil-muted'
                    )}
                  >
                    {fc.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="text-xs text-civil-muted mb-1 block">Remarks</label>
            <textarea
              className="input resize-none text-xs"
              rows={2}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Progress notes, observations..."
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || !changed}
            className={clsx(
              'w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all',
              saved
                ? 'bg-green-600 text-white'
                : changed
                ? 'btn-primary'
                : 'bg-civil-surface text-civil-muted border border-civil-border cursor-not-allowed'
            )}
          >
            {saving ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {saved ? 'Saved!' : saving ? 'Saving...' : changed ? 'Save Progress' : 'No Changes'}
          </button>
        </div>
      )}
    </div>
  )
}
