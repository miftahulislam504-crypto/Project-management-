// ═══════════════════════════════════════════════════════════
// SPRINT 18 — Construction Closeout
// ═══════════════════════════════════════════════════════════

export type PunchStatus  = 'open' | 'in-progress' | 'resolved'
export type InspType     = 'structural' | 'mep' | 'finishing' | 'safety' | 'final'
export type HandoverStatus = 'not-started' | 'in-progress' | 'completed'

export interface PunchItem {
  id:          string
  projectId:   string
  location:    string
  description: string
  trade:       string
  severity:    'minor' | 'major' | 'critical'
  status:      PunchStatus
  assignedTo:  string
  dueDate:     string
  resolvedDate: string
  remarks:     string
  createdAt:   string
}

export interface FinalInspection {
  id:          string
  projectId:   string
  type:        InspType
  title:       string
  date:        string
  inspector:   string
  status:      'pass' | 'fail' | 'conditional'
  remarks:     string
  createdAt:   string
}

export interface HandoverItem {
  id:          string
  projectId:   string
  category:    string
  item:        string
  description: string
  status:      HandoverStatus
  dueDate:     string
  completedDate: string
  remarks:     string
  createdAt:   string
}

// ─── Config ────────────────────────────────────────────────
export const punchStatusConfig: Record<PunchStatus, {
  label: string; color: string; bg: string
}> = {
  open:        { label: 'Open',        color: 'text-red-400',    bg: 'bg-red-900/20' },
  'in-progress':{ label: 'In Progress',color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
  resolved:    { label: 'Resolved',    color: 'text-green-400',  bg: 'bg-green-900/20' },
}

export const inspTypeConfig: Record<InspType, {
  label: string; emoji: string; color: string
}> = {
  structural: { label: 'Structural', emoji: '🏗️', color: 'text-blue-400' },
  mep:        { label: 'MEP',        emoji: '⚡', color: 'text-yellow-400' },
  finishing:  { label: 'Finishing',  emoji: '✨', color: 'text-green-400' },
  safety:     { label: 'Safety',     emoji: '⛑️', color: 'text-orange-400' },
  final:      { label: 'Final',      emoji: '🎯', color: 'text-civil-accent' },
}

// Default handover checklist
export const defaultHandoverItems: Omit<HandoverItem, 'id' | 'projectId' | 'createdAt'>[] = [
  { category: 'Documents', item: 'As-built Drawings',           description: 'Final as-built architectural & structural drawings', status: 'not-started', dueDate: '', completedDate: '', remarks: '' },
  { category: 'Documents', item: 'Structural Test Reports',     description: 'Concrete cube test, steel test reports',              status: 'not-started', dueDate: '', completedDate: '', remarks: '' },
  { category: 'Documents', item: 'MEP Completion Certificate',  description: 'Electrical & plumbing completion certificates',       status: 'not-started', dueDate: '', completedDate: '', remarks: '' },
  { category: 'Documents', item: 'Occupancy Certificate',       description: 'RAJUK/City Corp occupancy certificate',              status: 'not-started', dueDate: '', completedDate: '', remarks: '' },
  { category: 'Documents', item: 'Fire NOC',                    description: 'Fire service NOC',                                    status: 'not-started', dueDate: '', completedDate: '', remarks: '' },
  { category: 'Manuals',   item: 'Equipment Manuals',           description: 'All equipment O&M manuals',                          status: 'not-started', dueDate: '', completedDate: '', remarks: '' },
  { category: 'Manuals',   item: 'Maintenance Schedule',        description: '5-year maintenance plan',                            status: 'not-started', dueDate: '', completedDate: '', remarks: '' },
  { category: 'Keys',      item: 'Main Gate Keys',              description: 'All spare keys handed over',                         status: 'not-started', dueDate: '', completedDate: '', remarks: '' },
  { category: 'Keys',      item: 'Lift/Elevator Keys',          description: 'Elevator master keys',                               status: 'not-started', dueDate: '', completedDate: '', remarks: '' },
  { category: 'Training',  item: 'Operator Training',           description: 'Generator, pump, fire system training',              status: 'not-started', dueDate: '', completedDate: '', remarks: '' },
  { category: 'Warranty',  item: 'Defect Liability Period',     description: 'DLP commencement letter issued',                     status: 'not-started', dueDate: '', completedDate: '', remarks: '' },
  { category: 'Financial', item: 'Final Account Statement',     description: 'Final bill and retention release',                   status: 'not-started', dueDate: '', completedDate: '', remarks: '' },
]

// ─── Stats ─────────────────────────────────────────────────
export interface CloseoutStats {
  punch: { total: number; open: number; resolved: number }
  inspections: { total: number; pass: number; fail: number }
  handover: { total: number; completed: number; pct: number }
  readyToHandover: boolean
}

export function calcCloseoutStats(
  punchItems:  PunchItem[],
  inspections: FinalInspection[],
  handover:    HandoverItem[]
): CloseoutStats {
  const punch = {
    total:    punchItems.length,
    open:     punchItems.filter(p => p.status !== 'resolved').length,
    resolved: punchItems.filter(p => p.status === 'resolved').length,
  }
  const insp = {
    total: inspections.length,
    pass:  inspections.filter(i => i.status === 'pass').length,
    fail:  inspections.filter(i => i.status === 'fail').length,
  }
  const hand = {
    total:     handover.length,
    completed: handover.filter(h => h.status === 'completed').length,
    pct:       handover.length > 0
      ? Math.round((handover.filter(h => h.status === 'completed').length / handover.length) * 100)
      : 0,
  }

  return {
    punch, inspections: insp, handover: hand,
    readyToHandover: punch.open === 0 && insp.fail === 0 && hand.pct >= 80,
  }
}

// ─── Firestore ─────────────────────────────────────────────
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, where, onSnapshot, orderBy, setDoc, getDocs, writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export const addPunchItem    = (d: Omit<PunchItem, 'id'>)       => addDoc(collection(db, 'punch_list'), d)
export const updatePunchItem = (id: string, d: Partial<PunchItem>) => updateDoc(doc(db, 'punch_list', id), d)
export const deletePunchItem = (id: string)                       => deleteDoc(doc(db, 'punch_list', id))
export const subPunchList    = (pid: string, cb: (d: PunchItem[]) => void) =>
  onSnapshot(query(collection(db, 'punch_list'), where('projectId', '==', pid), orderBy('createdAt', 'desc')),
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() } as PunchItem))))

export const addInspection    = (d: Omit<FinalInspection, 'id'>) => addDoc(collection(db, 'final_inspections'), d)
export const updateInspection = (id: string, d: Partial<FinalInspection>) => updateDoc(doc(db, 'final_inspections', id), d)
export const deleteInspection = (id: string) => deleteDoc(doc(db, 'final_inspections', id))
export const subInspections   = (pid: string, cb: (d: FinalInspection[]) => void) =>
  onSnapshot(query(collection(db, 'final_inspections'), where('projectId', '==', pid), orderBy('date', 'desc')),
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() } as FinalInspection))))

export const updateHandoverItem = (id: string, d: Partial<HandoverItem>) =>
  updateDoc(doc(db, 'handover_items', id), d)
export const subHandoverItems = (pid: string, cb: (d: HandoverItem[]) => void) =>
  onSnapshot(query(collection(db, 'handover_items'), where('projectId', '==', pid)),
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() } as HandoverItem))))

export async function initHandoverChecklist(projectId: string) {
  const existing = await getDocs(
    query(collection(db, 'handover_items'), where('projectId', '==', projectId))
  )
  if (existing.size > 0) return  // Already initialized

  const batch = writeBatch(db)
  for (const item of defaultHandoverItems) {
    const ref = doc(collection(db, 'handover_items'))
    batch.set(ref, {
      ...item,
      projectId,
      createdAt: new Date().toISOString(),
    })
  }
  await batch.commit()
}
