import { ScheduleStats, formatDate } from '@/lib/gantt-helpers'
import {
  Calendar, Clock, CheckCircle2,
  AlertTriangle, TrendingUp, Layers
} from 'lucide-react'

interface Props {
  stats: ScheduleStats
}

export default function ScheduleStatBar({ stats }: Props) {
  const cards = [
    {
      label: 'Project Start',
      value: formatDate(stats.projectStartDate),
      icon:  Calendar,
      color: 'text-blue-400',
      bg:    'bg-blue-900/20',
    },
    {
      label: 'Project End',
      value: formatDate(stats.projectEndDate),
      icon:  Calendar,
      color: 'text-purple-400',
      bg:    'bg-purple-900/20',
    },
    {
      label: 'Total Duration',
      value: `${stats.totalDays} days`,
      icon:  Clock,
      color: 'text-civil-accent',
      bg:    'bg-blue-900/20',
    },
    {
      label: 'Overall Progress',
      value: `${stats.overallProgress}%`,
      icon:  TrendingUp,
      color: 'text-green-400',
      bg:    'bg-green-900/20',
    },
    {
      label: 'Completed',
      value: `${stats.completedCount} / ${stats.totalActivities}`,
      icon:  CheckCircle2,
      color: 'text-green-400',
      bg:    'bg-green-900/20',
    },
    {
      label: 'Delayed',
      value: stats.delayedCount,
      icon:  AlertTriangle,
      color: stats.delayedCount > 0 ? 'text-red-400' : 'text-civil-muted',
      bg:    stats.delayedCount > 0 ? 'bg-red-900/20' : 'bg-civil-surface',
    },
  ]

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="bg-civil-card border border-civil-border rounded-lg px-3 py-2.5">
          <div className={`${bg} w-7 h-7 rounded-lg flex items-center justify-center mb-2`}>
            <Icon className={`w-3.5 h-3.5 ${color}`} />
          </div>
          <p className={`text-sm font-bold ${color}`}>{value}</p>
          <p className="text-[10px] text-civil-muted mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  )
}
