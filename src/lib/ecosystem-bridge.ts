// ═══════════════════════════════════════════════════════════
// SPRINT 19 — Ecosystem Automation Bridge
// CivilOS Structural → CivilOS Estimate → CivilOS PM
// ═══════════════════════════════════════════════════════════

import {
  collection, addDoc, getDocs, query,
  where, writeBatch, doc, updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Activity } from '@/lib/types'
import { constructionWBSTemplate, flattenWBS } from '@/lib/wbs-data'
import { generateWBS } from '@/lib/firestore'
import { autoGenerateProcurement, bulkAddProcurement } from '@/lib/procurement-firestore'

// ─── Shared Data Formats ───────────────────────────────────

// From CivilOS Structural App
export interface StructuralExport {
  projectName:   string
  buildingHeight: number
  floorCount:    number
  totalArea:     number   // sqft
  columnCount:   number
  beamCount:     number
  slabArea:      number
  steelQty:      number   // kg
  concreteVol:   number   // cft
  generatedAt:   string
}

// From CivilOS Estimate App
export interface EstimateExport {
  projectName:   string
  totalBOQ:      number   // BDT
  items: {
    code:        string
    description: string
    qty:         number
    unit:        string
    rate:        number
    amount:      number
  }[]
  generatedAt:   string
}

// Bridge result
export interface BridgeResult {
  success:      boolean
  message:      string
  wbsCreated:   number
  procCreated:  number
  budgetSet:    number
}

// ─── Full Automation Workflow ──────────────────────────────
// Estimate Complete → WBS → Schedule → Resources → Procurement → Ready

export async function runFullAutomation(
  projectId:   string,
  startDate:   string,
  estimate?:   EstimateExport,
  structural?: StructuralExport
): Promise<BridgeResult> {

  let wbsCreated  = 0
  let procCreated = 0
  let budgetSet   = 0

  try {
    // ── Step 1: Generate WBS ────────────────────────────────
    const existingAct = await getDocs(
      query(collection(db, 'activities'), where('projectId', '==', projectId))
    )
    if (existingAct.size === 0) {
      await generateWBS(projectId, startDate)
      wbsCreated = constructionWBSTemplate.reduce(
        (s, t) => s + 1 + (t.children?.length ?? 0), 0
      )
    }

    // ── Step 2: Set budgets from Estimate ──────────────────
    if (estimate && estimate.items.length > 0) {
      const activities = await getDocs(
        query(collection(db, 'activities'), where('projectId', '==', projectId))
      )

      const batch = writeBatch(db)
      activities.docs.forEach(actDoc => {
        const act = actDoc.data() as Activity
        // Match BOQ items to activities by keyword
        const matchedItems = estimate.items.filter(item =>
          act.name.toLowerCase().includes(item.description.toLowerCase().split(' ')[0]) ||
          item.description.toLowerCase().includes(act.name.toLowerCase().split(' ')[0])
        )
        if (matchedItems.length > 0) {
          const totalCost = matchedItems.reduce((s, i) => s + i.amount, 0)
          batch.update(actDoc.ref, { plannedCost: totalCost })
          budgetSet++
        }
      })
      await batch.commit()
    }

    // ── Step 3: Auto Procurement from Resources ─────────────
    const actSnap = await getDocs(
      query(collection(db, 'activities'), where('projectId', '==', projectId))
    )
    const activities = actSnap.docs.map(d => ({ id: d.id, ...d.data() } as Activity))

    const existingProc = await getDocs(
      query(collection(db, 'procurement'), where('projectId', '==', projectId))
    )
    if (existingProc.size === 0) {
      const procItems = autoGenerateProcurement(activities, projectId, startDate)
      if (procItems.length > 0) {
        await bulkAddProcurement(procItems)
        procCreated = procItems.length
      }
    }

    // ── Step 4: Update project status ──────────────────────
    await updateDoc(doc(db, 'projects', projectId), {
      status:    'active',
      updatedAt: new Date().toISOString(),
    })

    return {
      success:    true,
      message:    `Automation complete! WBS: ${wbsCreated} activities, Procurement: ${procCreated} items, Budget: ${budgetSet} assigned`,
      wbsCreated,
      procCreated,
      budgetSet,
    }

  } catch (error: any) {
    return {
      success:    false,
      message:    `Automation failed: ${error?.message ?? 'Unknown error'}`,
      wbsCreated,
      procCreated,
      budgetSet,
    }
  }
}

// ─── Import from Structural App ────────────────────────────
export function parseStructuralJSON(jsonStr: string): StructuralExport | null {
  try {
    const data = JSON.parse(jsonStr)
    if (!data.projectName || !data.floorCount) return null
    return data as StructuralExport
  } catch {
    return null
  }
}

// ─── Import from Estimate App ──────────────────────────────
export function parseEstimateJSON(jsonStr: string): EstimateExport | null {
  try {
    const data = JSON.parse(jsonStr)
    if (!data.projectName || !Array.isArray(data.items)) return null
    return data as EstimateExport
  } catch {
    return null
  }
}

// ─── Export to Reports App ─────────────────────────────────
export interface PMExport {
  projectId:    string
  projectName:  string
  exportDate:   string
  progress: {
    overall:    number
    byPhase:    { phase: string; progress: number }[]
  }
  cost: {
    budget:     number
    actual:     number
    spi:        number
    cpi:        number
  }
  activities:   number
  completed:    number
  delayed:      number
}

export async function exportToReportsApp(
  projectId:   string,
  projectName: string,
  activities:  Activity[],
  totalActual: number,
  spi:         number,
  cpi:         number
): Promise<string> {
  const leaves = activities.filter(a => a.level === 2)
  const parents = activities.filter(a => a.level === 1)

  const exportData: PMExport = {
    projectId,
    projectName,
    exportDate: new Date().toISOString(),
    progress: {
      overall: leaves.length > 0
        ? Math.round(leaves.reduce((s, a) => s + a.progress, 0) / leaves.length)
        : 0,
      byPhase: parents.map(p => ({
        phase:    p.name,
        progress: p.progress,
      })),
    },
    cost: {
      budget:  leaves.reduce((s, a) => s + a.plannedCost, 0),
      actual:  totalActual,
      spi,
      cpi,
    },
    activities: leaves.length,
    completed:  leaves.filter(a => a.status === 'completed').length,
    delayed:    leaves.filter(a => a.status === 'delayed').length,
  }

  return JSON.stringify(exportData, null, 2)
}

// ─── Sample Estimate Data for Testing ─────────────────────
export const sampleEstimateExport: EstimateExport = {
  projectName: 'Sample Project',
  totalBOQ:    5000000,
  items: [
    { code: '1.1', description: 'Site Clearing',         qty: 1,    unit: 'ls',  rate: 50000,   amount: 50000 },
    { code: '2.1', description: 'Excavation',            qty: 200,  unit: 'cft', rate: 80,      amount: 16000 },
    { code: '2.3', description: 'Footing Reinforcement', qty: 2000, unit: 'kg',  rate: 110,     amount: 220000 },
    { code: '2.5', description: 'Footing Concrete',      qty: 150,  unit: 'cft', rate: 800,     amount: 120000 },
    { code: '3.3', description: 'Column Concrete',       qty: 80,   unit: 'cft', rate: 1200,    amount: 96000 },
    { code: '3.7', description: 'Beam Slab Concrete',    qty: 400,  unit: 'cft', rate: 1000,    amount: 400000 },
    { code: '7.1', description: 'Brickwork Partition',   qty: 3000, unit: 'sft', rate: 120,     amount: 360000 },
    { code: '7.4', description: 'Floor Tiling',          qty: 2000, unit: 'sft', rate: 180,     amount: 360000 },
    { code: '8.1', description: 'Electrical Wiring',     qty: 1,    unit: 'ls',  rate: 300000,  amount: 300000 },
    { code: '8.2', description: 'Plumbing Sanitary',     qty: 1,    unit: 'ls',  rate: 250000,  amount: 250000 },
  ],
  generatedAt: new Date().toISOString(),
}
