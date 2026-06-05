import { Activity } from '@/lib/types'
import {
  ChevronRight, ChevronDown,
  Circle, CheckCircle2, AlertTriangle, Clock
} from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  activity: Activity
  isExpanded: boolean
  hasChildren: boolean
  onToggle: () => void
  onSelect: (a: Activity) => void
  isSelected: boolean
}

const statusConfig = {
  'not-started': { label: 'Not Started', color: 'text-civil-muted',  icon: Circle },
  'in-progress': { label: 'In Progress', color: 'text-blue-400',     icon: Clock },
  'completed':   { label: 'Completed',   color: 'text-green-400',    icon: CheckCircle2 },
  'delayed':     { label: 'Delayed',     color: 'text-red-400',      icon: AlertTriangle },
}

export default function WBSRow({
  activity, isExpanded, hasChildren, onToggle, onSelect, isSelected
}: Props) {
  const cfg   = statusConfig[activity.status]
  const Icon  = cfg.icon
  const indent = (activity.level - 1) * 16

  return (
    <div
      onClick={() => onSelect(activity)}
      className={clsx(
        'flex items-center gap-2 px-3 py-2.5 cursor-pointer',
        'border-b border-civil-border/50 transition-colors duration-150',
        'hover:bg-civil-surface/60',
        isSelected && 'bg-civil-accent/10 border-l-2 border-l-civil-accent'
      )}
      style={{ paddingLeft: `${12 + indent}px` }}
    >
      {/* Expand toggle */}
      <button
        onClick={e => { e.stopPropagation(); if (hasChildren) onToggle() }}
        className={clsx(
          'w-4 h-4 flex items-center justify-center flex-shrink-0',
          hasChildren ? 'text-civil-muted hover:text-civil-accent' : 'opacity-0 pointer-events-none'
        )}
      >
        {isExpanded
          ? <ChevronDown  className="w-3.5 h-3.5" />
          : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {/* Code */}
      <span className="text-[10px] font-mono text-civil-muted w-10 flex-shrink-0">
        {activity.code}
      </span>

      {/* Name */}
      <span className={clsx(
        'flex-1 text-sm truncate',
        activity.level === 1 ? 'font-semibold text-civil-text' : 'text-civil-text/80'
      )}>
        {activity.name}
      </span>

      {/* Duration */}
      <span className="text-xs text-civil-muted w-14 text-right flex-shrink-0">
        {activity.duration}d
      </span>

      {/* Progress */}
      <div className="w-16 flex-shrink-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] text-civil-muted">{activity.progress}%</span>
        </div>
        <div className="h-1 bg-civil-border rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all',
              activity.progress === 100 ? 'bg-green-400' :
              activity.progress > 0     ? 'bg-civil-accent' : 'bg-civil-border'
            )}
            style={{ width: `${activity.progress}%` }}
          />
        </div>
      </div>

      {/* Status */}
      <div className={clsx('flex items-center gap-1 w-24 flex-shrink-0', cfg.color)}>
        <Icon className="w-3 h-3" />
        <span className="text-[10px]">{cfg.label}</span>
      </div>

      {/* Critical badge */}
      {activity.isCritical && (
        <span className="text-[9px] bg-red-900/30 text-red-400 border border-red-900/40 px-1.5 py-0.5 rounded flex-shrink-0">
          Critical
        </span>
      )}
    </div>
  )
}
