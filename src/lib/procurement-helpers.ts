// ─── Procurement Types ────────────────────────────────────

export type ProcurementStatus =
  | 'pending'
  | 'approved'
  | 'ordered'
  | 'delivered'
  | 'cancelled'

export type ProcurementCategory =
  | 'cement'
  | 'steel'
  | 'brick'
  | 'sand'
  | 'stone'
  | 'timber'
  | 'paint'
  | 'tile'
  | 'electrical'
  | 'plumbing'
  | 'other'

export interface ProcurementItem {
  id:           string
  projectId:    string
  name:         string
  category:     ProcurementCategory
  specification: string
  quantity:     number
  unit:         string
  unitRate:     number
  totalCost:    number
  requiredDate: string
  orderedDate:  string
  deliveryDate: string
  supplier:     string
  status:       ProcurementStatus
  remarks:      string
  linkedActivity: string  // activity name
  createdAt:    string
  updatedAt:    string
}

// ─── Category Config ──────────────────────────────────────
export const categoryConfig: Record<ProcurementCategory, {
  label: string
  color: string
  bg:    string
  icon:  string
}> = {
  cement:     { label: 'Cement',     color: 'text-gray-300',   bg: 'bg-gray-800/40',   icon: '🏗️' },
  steel:      { label: 'Steel',      color: 'text-blue-400',   bg: 'bg-blue-900/20',   icon: '⚙️' },
  brick:      { label: 'Brick',      color: 'text-orange-400', bg: 'bg-orange-900/20', icon: '🧱' },
  sand:       { label: 'Sand',       color: 'text-yellow-400', bg: 'bg-yellow-900/20', icon: '⛱️' },
  stone:      { label: 'Stone',      color: 'text-slate-400',  bg: 'bg-slate-800/40',  icon: '🪨' },
  timber:     { label: 'Timber',     color: 'text-amber-400',  bg: 'bg-amber-900/20',  icon: '🪵' },
  paint:      { label: 'Paint',      color: 'text-pink-400',   bg: 'bg-pink-900/20',   icon: '🎨' },
  tile:       { label: 'Tile',       color: 'text-cyan-400',   bg: 'bg-cyan-900/20',   icon: '⬜' },
  electrical: { label: 'Electrical', color: 'text-yellow-300', bg: 'bg-yellow-900/20', icon: '⚡' },
  plumbing:   { label: 'Plumbing',   color: 'text-blue-300',   bg: 'bg-blue-900/20',   icon: '🔧' },
  other:      { label: 'Other',      color: 'text-civil-muted',bg: 'bg-civil-surface', icon: '📦' },
}

// ─── Status Config ────────────────────────────────────────
export const statusConfig: Record<ProcurementStatus, {
  label: string
  color: string
  bg:    string
  border: string
}> = {
  pending:   { label: 'Pending',   color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-900/40' },
  approved:  { label: 'Approved',  color: 'text-blue-400',   bg: 'bg-blue-900/20',   border: 'border-blue-900/40' },
  ordered:   { label: 'Ordered',   color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-900/40' },
  delivered: { label: 'Delivered', color: 'text-green-400',  bg: 'bg-green-900/20',  border: 'border-green-900/40' },
  cancelled: { label: 'Cancelled', color: 'text-red-400',    bg: 'bg-red-900/20',    border: 'border-red-900/40' },
}

// ─── Auto-generate from Resources ─────────────────────────
import { Activity } from '@/lib/types'

export function autoGenerateProcurement(
  activities: Activity[],
  projectId:  string,
  startDate:  string
): Omit<ProcurementItem, 'id'>[] {
  const materialMap = new Map<string, {
    name:     string
    qty:      number
    unit:     string
    unitRate: number
    activity: string
  }>()

  // Aggregate materials from all activities
  for (const activity of activities.filter(a => a.level === 2)) {
    for (const res of activity.resources.filter(r => r.type === 'material')) {
      const key = `${res.name}__${res.unit}`
      if (materialMap.has(key)) {
        const existing = materialMap.get(key)!
        existing.qty += res.quantity
      } else {
        materialMap.set(key, {
          name:     res.name,
          qty:      res.quantity,
          unit:     res.unit,
          unitRate: res.unitRate,
          activity: activity.name,
        })
      }
    }
  }

  // Convert to procurement items
  const items: Omit<ProcurementItem, 'id'>[] = []
  const start = new Date(startDate || new Date().toISOString().split('T')[0])

  for (const [, mat] of materialMap) {
    const requiredDate = new Date(start)
    requiredDate.setDate(requiredDate.getDate() + 7)

    items.push({
      projectId,
      name:           mat.name,
      category:       detectCategory(mat.name),
      specification:  '',
      quantity:       Math.ceil(mat.qty * 1.05), // 5% wastage
      unit:           mat.unit,
      unitRate:       mat.unitRate,
      totalCost:      Math.ceil(mat.qty * 1.05) * mat.unitRate,
      requiredDate:   requiredDate.toISOString().split('T')[0],
      orderedDate:    '',
      deliveryDate:   '',
      supplier:       '',
      status:         'pending',
      remarks:        '',
      linkedActivity: mat.activity,
      createdAt:      new Date().toISOString(),
      updatedAt:      new Date().toISOString(),
    })
  }

  return items
}

// Detect category from material name
function detectCategory(name: string): ProcurementCategory {
  const n = name.toLowerCase()
  if (n.includes('cement'))                          return 'cement'
  if (n.includes('rod') || n.includes('steel') || n.includes('rebar')) return 'steel'
  if (n.includes('brick'))                           return 'brick'
  if (n.includes('sand'))                            return 'sand'
  if (n.includes('stone') || n.includes('chips'))   return 'stone'
  if (n.includes('timber') || n.includes('wood'))   return 'timber'
  if (n.includes('paint'))                           return 'paint'
  if (n.includes('tile'))                            return 'tile'
  if (n.includes('wire') || n.includes('electric')) return 'electrical'
  if (n.includes('pipe') || n.includes('plumb'))    return 'plumbing'
  return 'other'
}

// ─── Summary Stats ────────────────────────────────────────
export interface ProcurementStats {
  total:       number
  pending:     number
  approved:    number
  ordered:     number
  delivered:   number
  cancelled:   number
  totalBudget: number
  spent:       number
}

export function calcProcurementStats(items: ProcurementItem[]): ProcurementStats {
  return {
    total:       items.length,
    pending:     items.filter(i => i.status === 'pending').length,
    approved:    items.filter(i => i.status === 'approved').length,
    ordered:     items.filter(i => i.status === 'ordered').length,
    delivered:   items.filter(i => i.status === 'delivered').length,
    cancelled:   items.filter(i => i.status === 'cancelled').length,
    totalBudget: items.reduce((s, i) => s + i.totalCost, 0),
    spent:       items
      .filter(i => i.status === 'delivered' || i.status === 'ordered')
      .reduce((s, i) => s + i.totalCost, 0),
  }
}
