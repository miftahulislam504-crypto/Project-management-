import { Activity } from '@/lib/types'

// Frappe Gantt task format
export interface GanttTask {
  id: string
  name: string
  start: string        // 'YYYY-MM-DD'
  end: string          // 'YYYY-MM-DD'
  progress: number     // 0-100
  dependencies: string // comma-separated ids
  custom_class?: string
}

// Activity → GanttTask
export function toGanttTasks(activities: Activity[]): GanttTask[] {
  return activities
    .filter(a => a.level === 2) // only leaf activities for Gantt
    .map(a => ({
      id:           a.id,
      name:         `${a.code} ${a.name}`,
      start:        a.startDate,
      end:          a.endDate,
      progress:     a.progress,
      dependencies: a.dependencies.join(','),
      custom_class: a.isCritical
        ? 'critical-task'
        : a.status === 'delayed'
        ? 'delayed-task'
        : a.status === 'completed'
        ? 'completed-task'
        : '',
    }))
}

// Calculate end date from start + duration
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// Format date for display
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-BD', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  })
}

// Calculate project duration in days
export function projectDuration(startDate: string, endDate: string): number {
  const s = new Date(startDate)
  const e = new Date(endDate)
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
}

// View modes for Frappe Gantt
export type GanttViewMode = 'Day' | 'Week' | 'Month' | 'Quarter Day' | 'Half Day'

export const viewModes: GanttViewMode[] = ['Day', 'Week', 'Month']

// Schedule summary stats
export interface ScheduleStats {
  totalActivities:   number
  completedCount:    number
  inProgressCount:   number
  delayedCount:      number
  criticalCount:     number
  overallProgress:   number
  projectStartDate:  string
  projectEndDate:    string
  totalDays:         number
}

export function calcScheduleStats(activities: Activity[]): ScheduleStats {
  const leaves = activities.filter(a => a.level === 2)
  const total  = leaves.length

  const overallProgress = total > 0
    ? Math.round(leaves.reduce((s, a) => s + a.progress, 0) / total)
    : 0

  const dates     = leaves.flatMap(a => [a.startDate, a.endDate]).filter(Boolean).sort()
  const startDate = dates[0] ?? ''
  const endDate   = dates[dates.length - 1] ?? ''

  return {
    totalActivities:  total,
    completedCount:   leaves.filter(a => a.status === 'completed').length,
    inProgressCount:  leaves.filter(a => a.status === 'in-progress').length,
    delayedCount:     leaves.filter(a => a.status === 'delayed').length,
    criticalCount:    leaves.filter(a => a.isCritical).length,
    overallProgress,
    projectStartDate: startDate,
    projectEndDate:   endDate,
    totalDays:        startDate && endDate ? projectDuration(startDate, endDate) : 0,
  }
}
