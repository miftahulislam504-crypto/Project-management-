import { Activity, ActivityResource } from '@/lib/types'

// ─── Resource Types ────────────────────────────────────────
export type ResourceType = 'labor' | 'equipment' | 'material' | 'subcontractor'

export const resourceTypeConfig: Record<ResourceType, {
  label: string
  color: string
  bg:    string
  unit:  string[]
}> = {
  labor: {
    label: 'Labor',
    color: 'text-blue-400',
    bg:    'bg-blue-900/20',
    unit:  ['person', 'gang', 'team'],
  },
  equipment: {
    label: 'Equipment',
    color: 'text-yellow-400',
    bg:    'bg-yellow-900/20',
    unit:  ['nos', 'set', 'trip'],
  },
  material: {
    label: 'Material',
    color: 'text-green-400',
    bg:    'bg-green-900/20',
    unit:  ['bag', 'kg', 'ton', 'cft', 'sft', 'rft', 'nos', 'brass'],
  },
  subcontractor: {
    label: 'Subcontractor',
    color: 'text-purple-400',
    bg:    'bg-purple-900/20',
    unit:  ['lump sum', 'per sft', 'per rft'],
  },
}

// ─── Default Resources per Activity ───────────────────────
// Construction standard resource templates
export const defaultResources: Record<string, ActivityResource[]> = {
  'Excavation': [
    { type: 'labor',     name: 'Earth Cutting Labor',  quantity: 8,  unit: 'person',  unitRate: 700 },
    { type: 'equipment', name: 'Excavator',             quantity: 1,  unit: 'nos',     unitRate: 15000 },
  ],
  'PCC (Plain Cement Concrete)': [
    { type: 'labor',    name: 'Mason',              quantity: 2,  unit: 'person', unitRate: 900 },
    { type: 'labor',    name: 'Helper',             quantity: 6,  unit: 'person', unitRate: 600 },
    { type: 'material', name: 'Cement (PCC 1:3:6)', quantity: 4,  unit: 'bag',    unitRate: 550 },
    { type: 'material', name: 'Sand',               quantity: 10, unit: 'cft',    unitRate: 80 },
    { type: 'material', name: 'Stone Chips',        quantity: 20, unit: 'cft',    unitRate: 120 },
  ],
  'Footing Reinforcement': [
    { type: 'labor',    name: 'Rodman',         quantity: 6,  unit: 'person', unitRate: 850 },
    { type: 'material', name: 'MS Rod (60 grd)', quantity: 500, unit: 'kg',   unitRate: 110 },
    { type: 'material', name: 'Binding Wire',   quantity: 5,  unit: 'kg',    unitRate: 130 },
  ],
  'Footing Concrete': [
    { type: 'labor',     name: 'Mason',          quantity: 3,  unit: 'person', unitRate: 900 },
    { type: 'labor',     name: 'Helper',         quantity: 10, unit: 'person', unitRate: 600 },
    { type: 'equipment', name: 'Concrete Mixer', quantity: 1,  unit: 'nos',    unitRate: 3000 },
    { type: 'equipment', name: 'Vibrator',       quantity: 1,  unit: 'nos',    unitRate: 1500 },
    { type: 'material',  name: 'Cement',         quantity: 20, unit: 'bag',    unitRate: 550 },
    { type: 'material',  name: 'Sand',           quantity: 30, unit: 'cft',    unitRate: 80 },
    { type: 'material',  name: 'Stone Chips',    quantity: 60, unit: 'cft',    unitRate: 120 },
  ],
  'Column Reinforcement (GF)': [
    { type: 'labor',    name: 'Rodman',         quantity: 4,  unit: 'person', unitRate: 850 },
    { type: 'material', name: 'MS Rod (60 grd)', quantity: 300, unit: 'kg',  unitRate: 110 },
  ],
  'Column Concrete (GF)': [
    { type: 'labor',     name: 'Mason',          quantity: 2, unit: 'person', unitRate: 900 },
    { type: 'labor',     name: 'Helper',         quantity: 6, unit: 'person', unitRate: 600 },
    { type: 'equipment', name: 'Concrete Mixer', quantity: 1, unit: 'nos',    unitRate: 3000 },
    { type: 'equipment', name: 'Vibrator',       quantity: 1, unit: 'nos',    unitRate: 1500 },
  ],
  'Beam & Slab Concrete (GF)': [
    { type: 'labor',     name: 'Mason',          quantity: 4,  unit: 'person', unitRate: 900 },
    { type: 'labor',     name: 'Helper',         quantity: 15, unit: 'person', unitRate: 600 },
    { type: 'equipment', name: 'Concrete Mixer', quantity: 2,  unit: 'nos',    unitRate: 3000 },
    { type: 'equipment', name: 'Vibrator',       quantity: 2,  unit: 'nos',    unitRate: 1500 },
    { type: 'material',  name: 'Cement',         quantity: 80, unit: 'bag',    unitRate: 550 },
  ],
  'Brickwork / Partition': [
    { type: 'labor',    name: 'Mason',       quantity: 6,    unit: 'person', unitRate: 900 },
    { type: 'labor',    name: 'Helper',      quantity: 12,   unit: 'person', unitRate: 600 },
    { type: 'material', name: 'Brick',       quantity: 5000, unit: 'nos',    unitRate: 12 },
    { type: 'material', name: 'Cement',      quantity: 30,   unit: 'bag',    unitRate: 550 },
    { type: 'material', name: 'Sand',        quantity: 50,   unit: 'cft',    unitRate: 80 },
  ],
  'Floor Tiling': [
    { type: 'labor',    name: 'Tile Mason',  quantity: 4,   unit: 'person', unitRate: 1000 },
    { type: 'labor',    name: 'Helper',      quantity: 4,   unit: 'person', unitRate: 600 },
    { type: 'material', name: 'Floor Tile',  quantity: 200, unit: 'sft',    unitRate: 80 },
    { type: 'material', name: 'Tile Adhesive', quantity: 20, unit: 'bag',  unitRate: 400 },
  ],
}

// ─── Resource Summary ──────────────────────────────────────
export interface ResourceSummary {
  type:        ResourceType
  name:        string
  totalQty:    number
  unit:        string
  totalCost:   number
  activities:  string[]
}

export function summarizeResources(activities: Activity[]): ResourceSummary[] {
  const map = new Map<string, ResourceSummary>()

  for (const activity of activities) {
    for (const res of activity.resources) {
      const key = `${res.type}__${res.name}__${res.unit}`
      if (!map.has(key)) {
        map.set(key, {
          type:       res.type as ResourceType,
          name:       res.name,
          totalQty:   0,
          unit:       res.unit,
          totalCost:  0,
          activities: [],
        })
      }
      const existing = map.get(key)!
      existing.totalQty  += res.quantity
      existing.totalCost += res.quantity * res.unitRate
      existing.activities.push(activity.name)
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.type.localeCompare(b.type) || a.name.localeCompare(b.name)
  )
}

// ─── Resource Loading Chart Data ──────────────────────────
export interface LoadingDataPoint {
  week:    string
  labor:   number
  equipment: number
  material: number
}

export function buildLoadingChart(activities: Activity[]): LoadingDataPoint[] {
  // Group by week index (simplified)
  const weeks: Record<number, LoadingDataPoint> = {}

  for (const activity of activities.filter(a => a.level === 2)) {
    const start    = new Date(activity.startDate)
    const weekIdx  = Math.floor(
      (start.getTime() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)
    )

    if (!weeks[weekIdx]) {
      weeks[weekIdx] = {
        week:      `W${weekIdx}`,
        labor:     0,
        equipment: 0,
        material:  0,
      }
    }

    for (const res of activity.resources) {
      if (res.type === 'labor')     weeks[weekIdx].labor     += res.quantity
      if (res.type === 'equipment') weeks[weekIdx].equipment += res.quantity
      if (res.type === 'material')  weeks[weekIdx].material  += res.quantity * res.unitRate / 10000
    }
  }

  return Object.values(weeks).slice(0, 20) // max 20 weeks
}
