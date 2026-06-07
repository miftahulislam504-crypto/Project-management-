// ─── Site Diary Entry ──────────────────────────────────────
export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'foggy'
export type WorkStatus = 'full-day' | 'half-day' | 'suspended' | 'holiday'

export interface LaborEntry {
  trade:    string   // Mason, Helper, Rodman, Carpenter...
  count:    number
  overtime: number   // hours
}

export interface EquipmentEntry {
  name:   string    // Mixer, Vibrator, Crane...
  count:  number
  hours:  number    // working hours
}

export interface MaterialEntry {
  name:     string
  quantity: number
  unit:     string
  supplier: string
}

export interface DiaryEntry {
  id:            string
  projectId:     string
  date:          string       // YYYY-MM-DD
  weather:       WeatherCondition
  temperature:   number       // °C
  workStatus:    WorkStatus
  laborEntries:  LaborEntry[]
  equipEntries:  EquipmentEntry[]
  materialEntries: MaterialEntry[]
  activitiesWorked: string[]  // activity names
  issues:        string
  safetyNotes:   string
  visitorNotes:  string
  generalRemarks: string
  preparedBy:    string
  createdAt:     string
  updatedAt:     string
}

// ─── Config ────────────────────────────────────────────────
export const weatherConfig: Record<WeatherCondition, {
  label: string
  emoji: string
  color: string
}> = {
  sunny:  { label: 'Sunny',  emoji: '☀️',  color: 'text-yellow-400' },
  cloudy: { label: 'Cloudy', emoji: '⛅',  color: 'text-gray-400' },
  rainy:  { label: 'Rainy',  emoji: '🌧️', color: 'text-blue-400' },
  stormy: { label: 'Stormy', emoji: '⛈️', color: 'text-purple-400' },
  foggy:  { label: 'Foggy',  emoji: '🌫️', color: 'text-gray-300' },
}

export const workStatusConfig: Record<WorkStatus, {
  label:  string
  color:  string
  bg:     string
}> = {
  'full-day':  { label: 'Full Day',  color: 'text-green-400',  bg: 'bg-green-900/20' },
  'half-day':  { label: 'Half Day',  color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
  'suspended': { label: 'Suspended', color: 'text-red-400',    bg: 'bg-red-900/20' },
  'holiday':   { label: 'Holiday',   color: 'text-civil-muted',bg: 'bg-civil-surface' },
}

export const commonTrades = [
  'Mason', 'Helper', 'Rodman', 'Carpenter',
  'Plumber', 'Electrician', 'Painter', 'Welder',
  'Tile Fixer', 'Driver', 'Supervisor',
]

export const commonEquipment = [
  'Concrete Mixer', 'Vibrator', 'Excavator',
  'Crane', 'Scaffolding Set', 'Compactor',
  'Water Pump', 'Generator', 'Welding Machine',
]

// ─── Summary helpers ───────────────────────────────────────
export function totalLaborCount(entry: DiaryEntry): number {
  return entry.laborEntries.reduce((s, l) => s + l.count, 0)
}

export function totalEquipmentCount(entry: DiaryEntry): number {
  return entry.equipEntries.reduce((s, e) => s + e.count, 0)
}

// ─── Firestore ─────────────────────────────────────────────
import {
  collection, doc, addDoc, setDoc,
  query, where, onSnapshot, orderBy,
  getDocs, deleteDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function saveDiaryEntry(
  entry: Omit<DiaryEntry, 'id'>
): Promise<void> {
  // Use date as document ID so one entry per day per project
  const docId  = `${entry.projectId}_${entry.date}`
  await setDoc(doc(db, 'site_diary', docId), entry)
}

export async function deleteDiaryEntry(id: string) {
  await deleteDoc(doc(db, 'site_diary', id))
}

export function subscribeToDiary(
  projectId: string,
  cb: (entries: DiaryEntry[]) => void
) {
  const q = query(
    collection(db, 'site_diary'),
    where('projectId', '==', projectId),
    orderBy('date', 'desc')
  )
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as DiaryEntry)))
  })
}

// ─── PDF Export helper ─────────────────────────────────────
export function formatDiaryForPDF(entry: DiaryEntry): string {
  const weather = weatherConfig[entry.weather]
  const status  = workStatusConfig[entry.workStatus]
  const labor   = totalLaborCount(entry)
  const equip   = totalEquipmentCount(entry)

  return `
DAILY SITE DIARY
================
Date: ${entry.date}
Project: ${entry.projectId}
Weather: ${weather.label} | Temp: ${entry.temperature}°C
Work Status: ${status.label}
Prepared By: ${entry.preparedBy}

LABOR (Total: ${labor})
${entry.laborEntries.map(l => `  ${l.trade}: ${l.count} persons, OT: ${l.overtime}h`).join('\n')}

EQUIPMENT (Total: ${equip})
${entry.equipEntries.map(e => `  ${e.name}: ${e.count} nos, ${e.hours}h`).join('\n')}

MATERIALS RECEIVED
${entry.materialEntries.map(m => `  ${m.name}: ${m.quantity} ${m.unit} (${m.supplier})`).join('\n')}

ACTIVITIES WORKED ON
${entry.activitiesWorked.map(a => `  • ${a}`).join('\n')}

ISSUES: ${entry.issues || 'None'}
SAFETY: ${entry.safetyNotes || 'None'}
REMARKS: ${entry.generalRemarks || 'None'}
  `.trim()
}
