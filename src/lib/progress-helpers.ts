// ─── Progress Update ───────────────────────────────────────
export interface ProgressUpdate {
  id:           string
  projectId:    string
  activityId:   string
  activityName: string
  activityCode: string
  progress:     number       // 0-100
  previousProgress: number
  remarks:      string
  issues:       string
  photoUrls:    string[]
  updatedBy:    string
  updatedAt:    string
  date:         string       // YYYY-MM-DD
}

// ─── Issue Flag ────────────────────────────────────────────
export type IssueFlag = 'none' | 'minor' | 'major' | 'critical'

export const issueFlagConfig: Record<IssueFlag, {
  label:  string
  color:  string
  bg:     string
}> = {
  none:     { label: 'No Issue',  color: 'text-green-400',  bg: 'bg-green-900/20' },
  minor:    { label: 'Minor',     color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
  major:    { label: 'Major',     color: 'text-orange-400', bg: 'bg-orange-900/20' },
  critical: { label: 'Critical',  color: 'text-red-400',    bg: 'bg-red-900/20' },
}

// ─── Progress variance ─────────────────────────────────────
export function calcVariance(planned: number, actual: number): {
  value:  number
  label:  string
  color:  string
} {
  const v = actual - planned
  return {
    value: v,
    label: v >= 0 ? `+${v}%` : `${v}%`,
    color: v >= 0 ? 'text-green-400' : 'text-red-400',
  }
}

// ─── Firestore helpers ─────────────────────────────────────
import {
  collection, addDoc, query,
  where, onSnapshot, orderBy, limit
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function addProgressUpdate(
  update: Omit<ProgressUpdate, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'progress_updates'), update)
  return ref.id
}

export function subscribeToProgressUpdates(
  projectId: string,
  cb: (updates: ProgressUpdate[]) => void,
  maxDays = 30
) {
  const since = new Date()
  since.setDate(since.getDate() - maxDays)

  const q = query(
    collection(db, 'progress_updates'),
    where('projectId', '==', projectId),
    orderBy('updatedAt', 'desc'),
    limit(100)
  )
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProgressUpdate)))
  })
}

// ─── Chart data helpers ────────────────────────────────────
import { Activity } from '@/lib/types'

export interface ProgressChartPoint {
  name:    string   // activity code + name (short)
  planned: number
  actual:  number
}

export function buildProgressChartData(
  activities: Activity[]
): ProgressChartPoint[] {
  return activities
    .filter(a => a.level === 1)  // top-level phases
    .map(a => {
      // Calc phase progress from children avg
      return {
        name:    a.code + '. ' + a.name.split(' ')[0],
        planned: 100,   // Sprint 3 baseline এ আসবে
        actual:  a.progress,
      }
    })
}

// Daily progress trend
export interface DailyTrend {
  date:   string
  count:  number
  avgPct: number
}

export function buildDailyTrend(updates: ProgressUpdate[]): DailyTrend[] {
  const map = new Map<string, { sum: number; count: number }>()
  for (const u of updates) {
    const d = u.date
    if (!map.has(d)) map.set(d, { sum: 0, count: 0 })
    const entry = map.get(d)!
    entry.sum   += u.progress
    entry.count += 1
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)  // last 14 days
    .map(([date, { sum, count }]) => ({
      date,
      count,
      avgPct: Math.round(sum / count),
    }))
}
