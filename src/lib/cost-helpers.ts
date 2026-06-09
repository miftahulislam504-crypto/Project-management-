import { Activity } from '@/lib/types'

// ─── Cost Entry ────────────────────────────────────────────
export interface CostEntry {
  id:          string
  projectId:   string
  activityId:  string
  activityName: string
  category:    CostCategory
  description: string
  amount:      number
  date:        string
  invoiceNo:   string
  vendor:      string
  createdBy:   string
  createdAt:   string
}

export type CostCategory =
  | 'labor'
  | 'material'
  | 'equipment'
  | 'subcontract'
  | 'overhead'
  | 'other'

export const costCategoryConfig: Record<CostCategory, {
  label: string
  color: string
  bg:    string
}> = {
  labor:       { label: 'Labor',       color: 'text-blue-400',   bg: 'bg-blue-900/20' },
  material:    { label: 'Material',    color: 'text-green-400',  bg: 'bg-green-900/20' },
  equipment:   { label: 'Equipment',  color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
  subcontract: { label: 'Subcontract',color: 'text-purple-400', bg: 'bg-purple-900/20' },
  overhead:    { label: 'Overhead',   color: 'text-orange-400', bg: 'bg-orange-900/20' },
  other:       { label: 'Other',      color: 'text-civil-muted',bg: 'bg-civil-surface' },
}

// ─── Budget Summary ────────────────────────────────────────
export interface BudgetSummary {
  totalBudget:    number
  totalActual:    number
  totalVariance:  number
  variancePct:    number
  byCategory:     { category: CostCategory; budget: number; actual: number; variance: number }[]
  byActivity:     { name: string; budget: number; actual: number; variance: number }[]
}

export function calcBudgetSummary(
  activities: Activity[],
  costEntries: CostEntry[]
): BudgetSummary {
  const totalBudget = activities.reduce((s, a) => s + a.plannedCost, 0)
  const totalActual = costEntries.reduce((s, e) => s + e.amount, 0)
  const totalVariance = totalBudget - totalActual

  // By category
  const byCategory = (Object.keys(costCategoryConfig) as CostCategory[]).map(cat => {
    const actual = costEntries
      .filter(e => e.category === cat)
      .reduce((s, e) => s + e.amount, 0)
    return {
      category: cat,
      budget:   0,  // Future: per-category budget
      actual,
      variance: -actual,
    }
  }).filter(c => c.actual > 0)

  // By activity
  const byActivity = activities
    .filter(a => a.level === 2 && (a.plannedCost > 0 || a.actualCost > 0))
    .map(a => ({
      name:     `${a.code} ${a.name}`.substring(0, 30),
      budget:   a.plannedCost,
      actual:   a.actualCost,
      variance: a.plannedCost - a.actualCost,
    }))
    .slice(0, 12)  // max 12 for chart

  return { totalBudget, totalActual, totalVariance, variancePct: totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0, byCategory, byActivity }
}

// ─── EVM Calculations ──────────────────────────────────────
export interface EVMMetrics {
  PV:   number   // Planned Value
  EV:   number   // Earned Value
  AC:   number   // Actual Cost
  SV:   number   // Schedule Variance = EV - PV
  CV:   number   // Cost Variance = EV - AC
  SPI:  number   // Schedule Performance Index = EV / PV
  CPI:  number   // Cost Performance Index = EV / AC
  EAC:  number   // Estimate at Completion = BAC / CPI
  ETC:  number   // Estimate to Complete = EAC - AC
  VAC:  number   // Variance at Completion = BAC - EAC
  BAC:  number   // Budget at Completion
  TCPI: number   // To-Complete Performance Index
  completionPct: number
}

export function calcEVM(
  activities: Activity[],
  actualCost: number
): EVMMetrics {
  const leaves = activities.filter(a => a.level === 2)
  const BAC    = leaves.reduce((s, a) => s + a.plannedCost, 0)

  // PV = sum of planned cost for planned-complete portion
  const PV = BAC * 0.65  // Mock: 65% time elapsed — Sprint 3 baseline থেকে আসবে

  // EV = BAC × actual progress %
  const avgProgress = leaves.length > 0
    ? leaves.reduce((s, a) => s + a.progress, 0) / leaves.length / 100
    : 0
  const EV = BAC * avgProgress

  const AC  = actualCost || leaves.reduce((s, a) => s + a.actualCost, 0)
  const SV  = EV - PV
  const CV  = EV - AC
  const SPI = PV > 0 ? EV / PV : 1
  const CPI = AC > 0 ? EV / AC : 1
  const EAC = CPI > 0 ? BAC / CPI : BAC
  const ETC = EAC - AC
  const VAC = BAC - EAC
  const TCPI = (BAC - EV) > 0 ? (BAC - EV) / (BAC - AC) : 1

  return {
    PV, EV, AC, SV, CV, SPI, CPI,
    EAC, ETC, VAC, BAC, TCPI,
    completionPct: Math.round(avgProgress * 100),
  }
}

// ─── S-Curve Data ──────────────────────────────────────────
export interface SCurvePoint {
  week:      string
  planned:   number   // cumulative %
  actual:    number   // cumulative %
  forecast?: number   // projected
}

export function buildSCurveData(activities: Activity[]): SCurvePoint[] {
  const leaves = activities.filter(a => a.level === 2)
  if (leaves.length === 0) return []

  // Get date range
  const dates = leaves
    .flatMap(a => [a.startDate, a.endDate])
    .filter(Boolean)
    .sort()
  if (dates.length === 0) return []

  const startDate = new Date(dates[0])
  const endDate   = new Date(dates[dates.length - 1])
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const totalWeeks = Math.ceil(totalDays / 7)

  const points: SCurvePoint[] = []
  let cumulativeActual = 0
  const today = new Date()

  for (let w = 0; w <= Math.min(totalWeeks, 30); w++) {
    const weekDate = new Date(startDate)
    weekDate.setDate(weekDate.getDate() + w * 7)

    // Planned: S-curve shape using sine approximation
    const t = w / totalWeeks
    const planned = Math.round(
      (t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2) * 100
    )

    // Actual: only for past weeks
    let actual = 0
    if (weekDate <= today) {
      const activitiesCompleted = leaves.filter(a => {
        const end = new Date(a.endDate)
        return end <= weekDate
      })
      const inProgress = leaves.filter(a => {
        const start = new Date(a.startDate)
        const end   = new Date(a.endDate)
        return start <= weekDate && end > weekDate
      })

      const completedWeight = activitiesCompleted.length * 100
      const inProgWeight    = inProgress.reduce((s, a) => s + a.progress, 0)
      actual = leaves.length > 0
        ? Math.round((completedWeight + inProgWeight) / leaves.length)
        : 0
      cumulativeActual = actual
    }

    // Forecast: linear projection from current actual
    let forecast: number | undefined
    if (weekDate > today && cumulativeActual > 0) {
      const weeksElapsed = Math.ceil(
        (today.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      )
      const weeklyRate = weeksElapsed > 0 ? cumulativeActual / weeksElapsed : 0
      forecast = Math.min(Math.round(cumulativeActual + weeklyRate * (w - weeksElapsed)), 100)
    }

    points.push({
      week:     `W${w}`,
      planned,
      actual:   weekDate <= today ? actual : 0,
      forecast,
    })
  }

  return points
}

// ─── Firestore ─────────────────────────────────────────────
import {
  collection, addDoc, deleteDoc, doc,
  query, where, onSnapshot, orderBy
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function addCostEntry(entry: Omit<CostEntry, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'cost_entries'), entry)
  return ref.id
}

export async function deleteCostEntry(id: string) {
  await deleteDoc(doc(db, 'cost_entries', id))
}

export function subscribeToCostEntries(
  projectId: string,
  cb: (entries: CostEntry[]) => void
) {
  const q = query(
    collection(db, 'cost_entries'),
    where('projectId', '==', projectId),
    orderBy('date', 'desc')
  )
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as CostEntry)))
  })
}
