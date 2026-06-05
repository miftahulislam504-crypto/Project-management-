import { Activity } from '@/lib/types'
import { CheckCircle2, Clock, AlertTriangle, Circle, Layers } from 'lucide-react'

interface Props {
  activities: Activity[]
}

export default function WBSStats({ activities }: Props) {
  const leaves = activities.filter(a => a.level === 2)

  const total     = leaves.length
  const completed = leaves.filter(a => a.status === 'completed').length
  const inProg    = leaves.filter(a => a.status === 'in-progress').length
  const delayed   = leaves.filter(a => a.status === 'delayed').length
  const notStart  = leaves.filter(a => a.status === 'not-started').length
  const critical  = leaves.filter(a => a.isCritical).length

  const avgProgress = total > 0
    ? Math.round(leaves.reduce((s, a) => s + a.progress, 0) / total)
    : 0

  const stats = [
    { label: 'Total Activities', value: total,     icon: Layers,       color: 'text-civil-muted' },
    { label: 'Completed',        value: completed,  icon: CheckCircle2, color: 'text-green-400' },
    { label: 'In Progress',      value: inProg,     icon: Clock,        color: 'text-blue-400' },
    { label: 'Delayed',          value: delayed,    icon: AlertTriangle, color: 'text-red-400' },
    { label: 'Not Started',      value: notStart,   icon: Circle,       color: 'text-civil-muted' },
    { label: 'Critical',         value: critical,   icon: AlertTriangle, color: 'text-orange-400' },
  ]

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-civil-surface border border-civil-border rounded-lg px-3 py-2.5 text-center">
          <Icon className={`w-3.5 h-3.5 ${color} mx-auto mb-1`} />
          <p className={`text-base font-bold ${color}`}>{value}</p>
          <p className="text-[10px] text-civil-muted leading-tight">{label}</p>
        </div>
      ))}
    </div>
  )
}
