import {
  DiaryEntry,
  weatherConfig, workStatusConfig,
  totalLaborCount, totalEquipmentCount,
} from '@/lib/diary-helpers'
import { Users, Wrench, Package, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  entry:    DiaryEntry
  onSelect: (entry: DiaryEntry) => void
  selected: boolean
}

export default function DiaryCard({ entry, onSelect, selected }: Props) {
  const weather = weatherConfig[entry.weather]
  const status  = workStatusConfig[entry.workStatus]
  const labor   = totalLaborCount(entry)
  const equip   = totalEquipmentCount(entry)

  return (
    <div
      onClick={() => onSelect(entry)}
      className={clsx(
        'card cursor-pointer transition-all duration-150',
        'hover:border-civil-accent/40',
        selected && 'border-civil-accent/60 bg-civil-accent/5'
      )}
    >
      {/* Date + weather */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-semibold text-civil-text">{entry.date}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-base">{weather.emoji}</span>
            <span className={clsx('text-xs', weather.color)}>{weather.label}</span>
            <span className="text-civil-muted text-xs">· {entry.temperature}°C</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx(
            'text-[10px] font-semibold px-2 py-0.5 rounded-full',
            status.bg, status.color
          )}>
            {status.label}
          </span>
          <ChevronRight className="w-4 h-4 text-civil-muted" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-blue-400" />
          <div>
            <p className="text-xs font-semibold text-civil-text">{labor}</p>
            <p className="text-[10px] text-civil-muted">Labor</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-yellow-400" />
          <div>
            <p className="text-xs font-semibold text-civil-text">{equip}</p>
            <p className="text-[10px] text-civil-muted">Equipment</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-green-400" />
          <div>
            <p className="text-xs font-semibold text-civil-text">{entry.materialEntries.length}</p>
            <p className="text-[10px] text-civil-muted">Materials</p>
          </div>
        </div>
      </div>

      {/* Issues indicator */}
      {entry.issues && (
        <div className="mt-2 pt-2 border-t border-civil-border">
          <p className="text-[10px] text-orange-400 truncate">
            ⚠️ {entry.issues}
          </p>
        </div>
      )}

      {/* Activities */}
      {entry.activitiesWorked.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {entry.activitiesWorked.slice(0, 3).map((a, i) => (
            <span key={i} className="text-[9px] bg-civil-surface border border-civil-border text-civil-muted px-1.5 py-0.5 rounded truncate max-w-[100px]">
              {a}
            </span>
          ))}
          {entry.activitiesWorked.length > 3 && (
            <span className="text-[9px] text-civil-muted">
              +{entry.activitiesWorked.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}
