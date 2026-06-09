// ═══════════════════════════════════════════════════════════
// SPRINT 12 — Issues & Risk
// ═══════════════════════════════════════════════════════════

export type IssueType     = 'site' | 'safety' | 'quality' | 'design'
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical'
export type IssueStatus   = 'open' | 'in-progress' | 'closed'

export interface SiteIssue {
  id:           string
  projectId:    string
  type:         IssueType
  title:        string
  description:  string
  severity:     IssueSeverity
  status:       IssueStatus
  reportedBy:   string
  assignedTo:   string
  reportedDate: string
  resolvedDate: string
  remarks:      string
  createdAt:    string
}

export const issueTypeConfig: Record<IssueType, { label: string; color: string; bg: string; emoji: string }> = {
  site:    { label: 'Site',    color: 'text-orange-400', bg: 'bg-orange-900/20', emoji: '🏗️' },
  safety:  { label: 'Safety', color: 'text-red-400',    bg: 'bg-red-900/20',    emoji: '⛑️' },
  quality: { label: 'Quality',color: 'text-blue-400',   bg: 'bg-blue-900/20',   emoji: '🔍' },
  design:  { label: 'Design', color: 'text-purple-400', bg: 'bg-purple-900/20', emoji: '📐' },
}

export const severityConfig: Record<IssueSeverity, { label: string; color: string; bg: string }> = {
  low:      { label: 'Low',      color: 'text-civil-muted', bg: 'bg-civil-surface' },
  medium:   { label: 'Medium',   color: 'text-yellow-400',  bg: 'bg-yellow-900/20' },
  high:     { label: 'High',     color: 'text-orange-400',  bg: 'bg-orange-900/20' },
  critical: { label: 'Critical', color: 'text-red-400',     bg: 'bg-red-900/20' },
}

export const issueStatusConfig: Record<IssueStatus, { label: string; color: string; bg: string; border: string }> = {
  'open':        { label: 'Open',        color: 'text-red-400',    bg: 'bg-red-900/20',    border: 'border-red-900/40' },
  'in-progress': { label: 'In Progress', color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-900/40' },
  'closed':      { label: 'Closed',      color: 'text-green-400',  bg: 'bg-green-900/20',  border: 'border-green-900/40' },
}

// ─── Risk ─────────────────────────────────────────────────
export type RiskImpact      = 'low' | 'medium' | 'high' | 'critical'
export type RiskProbability = 'rare' | 'unlikely' | 'possible' | 'likely' | 'certain'
export type RiskStatus      = 'open' | 'mitigated' | 'accepted' | 'closed'

export interface Risk {
  id:           string
  projectId:    string
  title:        string
  description:  string
  category:     string
  impact:       RiskImpact
  probability:  RiskProbability
  riskScore:    number    // impact × probability
  mitigation:   string
  owner:        string
  status:       RiskStatus
  createdAt:    string
}

export const impactScore:      Record<RiskImpact, number>      = { low: 1, medium: 2, high: 3, critical: 4 }
export const probabilityScore: Record<RiskProbability, number> = { rare: 1, unlikely: 2, possible: 3, likely: 4, certain: 5 }

export function calcRiskScore(impact: RiskImpact, probability: RiskProbability): number {
  return impactScore[impact] * probabilityScore[probability]
}

export function riskLevel(score: number): { label: string; color: string; bg: string } {
  if (score >= 12) return { label: 'Critical', color: 'text-red-400',    bg: 'bg-red-900/30' }
  if (score >= 8)  return { label: 'High',     color: 'text-orange-400', bg: 'bg-orange-900/30' }
  if (score >= 4)  return { label: 'Medium',   color: 'text-yellow-400', bg: 'bg-yellow-900/30' }
  return                   { label: 'Low',     color: 'text-green-400',  bg: 'bg-green-900/30' }
}

// ═══════════════════════════════════════════════════════════
// SPRINT 13 — QA/QC
// ═══════════════════════════════════════════════════════════

export type QCStatus    = 'pass' | 'fail' | 'observation'
export type QCPhase     = 'foundation' | 'column' | 'beam' | 'slab' | 'finishing' | 'mep'

export interface QCCheckItem {
  id:       string
  label:    string
  status:   QCStatus | null
  remarks:  string
}

export interface QCRecord {
  id:            string
  projectId:     string
  phase:         QCPhase
  activityRef:   string
  checkItems:    QCCheckItem[]
  overallStatus: QCStatus | null
  inspectedBy:   string
  inspectedDate: string
  signedOff:     boolean
  signOffBy:     string
  signOffDate:   string
  remarks:       string
  createdAt:     string
}

export const qcPhaseConfig: Record<QCPhase, { label: string; emoji: string; color: string; bg: string }> = {
  foundation: { label: 'Foundation', emoji: '⬇️', color: 'text-brown-400',  bg: 'bg-yellow-900/20' },
  column:     { label: 'Column',     emoji: '🏛️', color: 'text-blue-400',   bg: 'bg-blue-900/20' },
  beam:       { label: 'Beam',       emoji: '━',  color: 'text-purple-400', bg: 'bg-purple-900/20' },
  slab:       { label: 'Slab',       emoji: '⬜', color: 'text-civil-muted',bg: 'bg-civil-surface' },
  finishing:  { label: 'Finishing',  emoji: '✨', color: 'text-green-400',  bg: 'bg-green-900/20' },
  mep:        { label: 'MEP',        emoji: '⚡', color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
}

export const qcStatusConfig: Record<QCStatus, { label: string; color: string; bg: string; border: string }> = {
  pass:        { label: 'Pass',        color: 'text-green-400',  bg: 'bg-green-900/20',  border: 'border-green-900/40' },
  fail:        { label: 'Fail',        color: 'text-red-400',    bg: 'bg-red-900/20',    border: 'border-red-900/40' },
  observation: { label: 'Observation', color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-900/40' },
}

// Default checklists per phase
export const defaultChecklists: Record<QCPhase, string[]> = {
  foundation: [
    'Excavation depth & dimensions verified',
    'Soil bearing capacity checked',
    'PCC thickness & level verified',
    'Footing reinforcement as per drawing',
    'Cover blocks placed (75mm)',
    'Column starter bars positioned correctly',
    'Formwork tight & level',
    'Concrete mix design approved',
    'Slump test done',
    'Curing arrangement ready',
  ],
  column: [
    'Column reinforcement as per drawing',
    'Bar splicing & lapping correct',
    'Stirrup spacing verified',
    'Cover (40mm) maintained',
    'Formwork plumb & aligned',
    'Concrete mix approved',
    'Vibration done properly',
    'No segregation observed',
    'Curing started within 24 hrs',
  ],
  beam: [
    'Beam reinforcement as per drawing',
    'Top & bottom bars correct',
    'Stirrup spacing verified',
    'Cover (25mm) maintained',
    'Slab reinforcement placed correctly',
    'MEP sleeves & conduits set',
    'Formwork supported properly',
    'Concrete pour sequence planned',
    'Vibrator working',
  ],
  slab: [
    'Slab thickness verified with depth gauge',
    'Two-way/one-way reinforcement correct',
    'Extra bars at openings',
    'Cover (20mm) maintained',
    'Construction joints planned',
    'Concrete level mark set',
    'Surface finishing done',
    'Wet curing for 14 days',
  ],
  finishing: [
    'Plaster surface flat & even',
    'Floor tile alignment correct',
    'Tile grouting done',
    'Door & window frames plumb',
    'Paint finish — no drips/patches',
    'Bathroom waterproofing tested',
    'False ceiling level verified',
    'Skirting tiles aligned',
  ],
  mep: [
    'Electrical conduit continuity checked',
    'DB board labeled correctly',
    'Earth leakage protection installed',
    'Plumbing pipe slope correct (1:40)',
    'Water pressure test done',
    'Drainage flow tested',
    'AC ducting insulated',
    'Fire alarm points installed',
  ],
}

// ═══════════════════════════════════════════════════════════
// SPRINT 14 — Approval Workflow
// ═══════════════════════════════════════════════════════════

export type ApprovalType   = 'material' | 'drawing' | 'work' | 'payment' | 'variation'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'revision'

export interface ApprovalRequest {
  id:            string
  projectId:     string
  type:          ApprovalType
  title:         string
  description:   string
  submittedBy:   string
  submittedDate: string
  currentLevel:  number         // 1=Site Eng, 2=Project Eng, 3=PM, 4=Consultant
  maxLevel:      number
  status:        ApprovalStatus
  workflow:      ApprovalStep[]
  attachmentRef: string
  createdAt:     string
}

export interface ApprovalStep {
  level:       number
  role:        string
  approverName: string
  status:      ApprovalStatus | 'waiting'
  date:        string
  remarks:     string
}

export const approvalTypeConfig: Record<ApprovalType, { label: string; color: string; bg: string; emoji: string }> = {
  material:  { label: 'Material',  color: 'text-green-400',  bg: 'bg-green-900/20',  emoji: '📦' },
  drawing:   { label: 'Drawing',   color: 'text-blue-400',   bg: 'bg-blue-900/20',   emoji: '📐' },
  work:      { label: 'Work',      color: 'text-purple-400', bg: 'bg-purple-900/20', emoji: '🔨' },
  payment:   { label: 'Payment',   color: 'text-yellow-400', bg: 'bg-yellow-900/20', emoji: '💰' },
  variation: { label: 'Variation', color: 'text-orange-400', bg: 'bg-orange-900/20', emoji: '📝' },
}

export const approvalStatusConfig: Record<ApprovalStatus, { label: string; color: string; bg: string; border: string }> = {
  pending:  { label: 'Pending',  color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-900/40' },
  approved: { label: 'Approved', color: 'text-green-400',  bg: 'bg-green-900/20',  border: 'border-green-900/40' },
  rejected: { label: 'Rejected', color: 'text-red-400',    bg: 'bg-red-900/20',    border: 'border-red-900/40' },
  revision: { label: 'Revision', color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-900/40' },
}

export const workflowLevels = [
  { level: 1, role: 'Site Engineer' },
  { level: 2, role: 'Project Engineer' },
  { level: 3, role: 'Project Manager' },
  { level: 4, role: 'Consultant' },
]

export function buildInitialWorkflow(): ApprovalStep[] {
  return workflowLevels.map((l, i) => ({
    level:        l.level,
    role:         l.role,
    approverName: '',
    status:       i === 0 ? 'pending' : 'waiting',
    date:         '',
    remarks:      '',
  }))
}

// ═══════════════════════════════════════════════════════════
// FIRESTORE HELPERS
// ═══════════════════════════════════════════════════════════

import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  query, where, onSnapshot, orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Issues
export const addIssue    = (d: Omit<SiteIssue, 'id'>) => addDoc(collection(db, 'issues'), d)
export const updateIssue = (id: string, d: Partial<SiteIssue>) => updateDoc(doc(db, 'issues', id), d)
export const deleteIssue = (id: string) => deleteDoc(doc(db, 'issues', id))
export const subIssues   = (pid: string, cb: (d: SiteIssue[]) => void) =>
  onSnapshot(query(collection(db, 'issues'), where('projectId', '==', pid), orderBy('createdAt', 'desc')),
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() } as SiteIssue))))

// Risks
export const addRisk    = (d: Omit<Risk, 'id'>) => addDoc(collection(db, 'risks'), d)
export const updateRisk = (id: string, d: Partial<Risk>) => updateDoc(doc(db, 'risks', id), d)
export const deleteRisk = (id: string) => deleteDoc(doc(db, 'risks', id))
export const subRisks   = (pid: string, cb: (d: Risk[]) => void) =>
  onSnapshot(query(collection(db, 'risks'), where('projectId', '==', pid), orderBy('riskScore', 'desc')),
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() } as Risk))))

// QC Records
export const addQCRecord    = (d: Omit<QCRecord, 'id'>) => addDoc(collection(db, 'qc_records'), d)
export const updateQCRecord = (id: string, d: Partial<QCRecord>) => updateDoc(doc(db, 'qc_records', id), d)
export const deleteQCRecord = (id: string) => deleteDoc(doc(db, 'qc_records', id))
export const subQCRecords   = (pid: string, cb: (d: QCRecord[]) => void) =>
  onSnapshot(query(collection(db, 'qc_records'), where('projectId', '==', pid), orderBy('createdAt', 'desc')),
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() } as QCRecord))))

// Approvals
export const addApproval    = (d: Omit<ApprovalRequest, 'id'>) => addDoc(collection(db, 'approvals'), d)
export const updateApproval = (id: string, d: Partial<ApprovalRequest>) => updateDoc(doc(db, 'approvals', id), d)
export const deleteApproval = (id: string) => deleteDoc(doc(db, 'approvals', id))
export const subApprovals   = (pid: string, cb: (d: ApprovalRequest[]) => void) =>
  onSnapshot(query(collection(db, 'approvals'), where('projectId', '==', pid), orderBy('createdAt', 'desc')),
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() } as ApprovalRequest))))
