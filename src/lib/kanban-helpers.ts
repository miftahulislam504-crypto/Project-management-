import { Task } from '@/lib/types'

// ─── Column Config ─────────────────────────────────────────
export type KanbanColumn = 'planned' | 'ready' | 'in-progress' | 'review' | 'completed'

export const columnConfig: Record<KanbanColumn, {
  label:  string
  color:  string
  bg:     string
  border: string
  dot:    string
}> = {
  'planned':     { label: 'Planned',     color: 'text-civil-muted',  bg: 'bg-civil-surface',  border: 'border-civil-border',    dot: 'bg-civil-muted' },
  'ready':       { label: 'Ready',       color: 'text-blue-400',     bg: 'bg-blue-900/10',    border: 'border-blue-900/30',     dot: 'bg-blue-400' },
  'in-progress': { label: 'In Progress', color: 'text-yellow-400',   bg: 'bg-yellow-900/10',  border: 'border-yellow-900/30',   dot: 'bg-yellow-400' },
  'review':      { label: 'Review',      color: 'text-purple-400',   bg: 'bg-purple-900/10',  border: 'border-purple-900/30',   dot: 'bg-purple-400' },
  'completed':   { label: 'Completed',   color: 'text-green-400',    bg: 'bg-green-900/10',   border: 'border-green-900/30',    dot: 'bg-green-400' },
}

export const columns: KanbanColumn[] = [
  'planned', 'ready', 'in-progress', 'review', 'completed'
]

// ─── Priority Config ───────────────────────────────────────
export const priorityConfig = {
  low:      { label: 'Low',      color: 'text-civil-muted',  bg: 'bg-civil-surface' },
  medium:   { label: 'Medium',   color: 'text-blue-400',     bg: 'bg-blue-900/20' },
  high:     { label: 'High',     color: 'text-yellow-400',   bg: 'bg-yellow-900/20' },
  critical: { label: 'Critical', color: 'text-red-400',      bg: 'bg-red-900/20' },
}

// ─── Group tasks by column ─────────────────────────────────
export function groupByColumn(tasks: Task[]): Record<KanbanColumn, Task[]> {
  const grouped = {} as Record<KanbanColumn, Task[]>
  for (const col of columns) {
    grouped[col] = tasks.filter(t => t.status === col)
      .sort((a, b) => {
        const pOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return pOrder[a.priority] - pOrder[b.priority]
      })
  }
  return grouped
}

// ─── Firestore helpers ─────────────────────────────────────
import {
  collection, addDoc, updateDoc,
  deleteDoc, doc, query, where, onSnapshot
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function addTask(task: Omit<Task, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'tasks'), task)
  return ref.id
}

export async function updateTask(id: string, data: Partial<Task>) {
  await updateDoc(doc(db, 'tasks', id), {
    ...data,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteTask(id: string) {
  await deleteDoc(doc(db, 'tasks', id))
}

export function subscribeToTasks(
  projectId: string,
  cb: (tasks: Task[]) => void
) {
  const q = query(
    collection(db, 'tasks'),
    where('projectId', '==', projectId)
  )
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)))
  })
}
