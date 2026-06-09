// ═══════════════════════════════════════════════════════════
// SPRINT 15 — Notification Engine
// ═══════════════════════════════════════════════════════════

export type NotificationType =
  | 'task_due'
  | 'delay'
  | 'approval_needed'
  | 'material_shortage'
  | 'critical_issue'
  | 'progress_update'
  | 'qc_fail'
  | 'risk_alert'
  | 'general'

export interface AppNotification {
  id:          string
  projectId:   string
  type:        NotificationType
  title:       string
  message:     string
  link:        string      // route to navigate
  read:        boolean
  createdAt:   string
  createdBy:   string
}

export const notifConfig: Record<NotificationType, {
  label:  string
  emoji:  string
  color:  string
  bg:     string
}> = {
  task_due:          { label: 'Task Due',          emoji: '⏰', color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
  delay:             { label: 'Delay Alert',        emoji: '🔴', color: 'text-red-400',    bg: 'bg-red-900/20' },
  approval_needed:   { label: 'Approval Needed',    emoji: '✅', color: 'text-blue-400',   bg: 'bg-blue-900/20' },
  material_shortage: { label: 'Material Shortage',  emoji: '📦', color: 'text-orange-400', bg: 'bg-orange-900/20' },
  critical_issue:    { label: 'Critical Issue',     emoji: '🚨', color: 'text-red-400',    bg: 'bg-red-900/20' },
  progress_update:   { label: 'Progress Update',    emoji: '📊', color: 'text-green-400',  bg: 'bg-green-900/20' },
  qc_fail:           { label: 'QC Failed',          emoji: '❌', color: 'text-red-400',    bg: 'bg-red-900/20' },
  risk_alert:        { label: 'Risk Alert',         emoji: '⚠️', color: 'text-orange-400', bg: 'bg-orange-900/20' },
  general:           { label: 'General',            emoji: '🔔', color: 'text-civil-muted',bg: 'bg-civil-surface' },
}

// ─── Firestore ─────────────────────────────────────────────
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, where, onSnapshot, orderBy,
  writeBatch, getDocs
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function addNotification(
  notif: Omit<AppNotification, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'notifications'), notif)
  return ref.id
}

export async function markAsRead(id: string) {
  await updateDoc(doc(db, 'notifications', id), { read: true })
}

export async function markAllAsRead(projectId: string) {
  const q    = query(
    collection(db, 'notifications'),
    where('projectId', '==', projectId),
    where('read', '==', false)
  )
  const snap = await getDocs(q)
  const batch = writeBatch(db)
  snap.docs.forEach(d => batch.update(d.ref, { read: true }))
  await batch.commit()
}

export async function deleteNotification(id: string) {
  await deleteDoc(doc(db, 'notifications', id))
}

export function subscribeToNotifications(
  projectId: string,
  cb: (notifs: AppNotification[]) => void
) {
  const q = query(
    collection(db, 'notifications'),
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification)))
  })
}

// ─── Auto-generate notifications ───────────────────────────
import { Activity } from '@/lib/types'
import { Task }     from '@/lib/types'
import { SiteIssue, ApprovalRequest } from '@/lib/issue-helpers'

export async function checkAndNotify(
  projectId:  string,
  activities: Activity[],
  tasks:      Task[],
  issues:     SiteIssue[],
  approvals:  ApprovalRequest[],
  createdBy:  string
) {
  const today = new Date().toISOString().split('T')[0]
  const notifs: Omit<AppNotification, 'id'>[] = []

  // Delayed activities
  const delayed = activities.filter(a =>
    a.level === 2 && a.status === 'delayed'
  )
  if (delayed.length > 0) {
    notifs.push({
      projectId,
      type:      'delay',
      title:     `${delayed.length} activities delayed`,
      message:   delayed.slice(0, 3).map(a => a.name).join(', '),
      link:      `/projects/${projectId}/progress`,
      read:      false,
      createdAt: new Date().toISOString(),
      createdBy,
    })
  }

  // Tasks due today
  const dueTasks = tasks.filter(t =>
    t.dueDate === today && t.status !== 'completed'
  )
  if (dueTasks.length > 0) {
    notifs.push({
      projectId,
      type:      'task_due',
      title:     `${dueTasks.length} tasks due today`,
      message:   dueTasks.slice(0, 3).map(t => t.title).join(', '),
      link:      `/projects/${projectId}/kanban`,
      read:      false,
      createdAt: new Date().toISOString(),
      createdBy,
    })
  }

  // Pending approvals
  const pending = approvals.filter(a => a.status === 'pending')
  if (pending.length > 0) {
    notifs.push({
      projectId,
      type:      'approval_needed',
      title:     `${pending.length} approvals pending`,
      message:   pending.slice(0, 2).map(a => a.title).join(', '),
      link:      `/projects/${projectId}/approvals`,
      read:      false,
      createdAt: new Date().toISOString(),
      createdBy,
    })
  }

  // Critical issues
  const critical = issues.filter(i =>
    i.severity === 'critical' && i.status !== 'closed'
  )
  if (critical.length > 0) {
    notifs.push({
      projectId,
      type:      'critical_issue',
      title:     `${critical.length} critical issues open`,
      message:   critical.slice(0, 2).map(i => i.title).join(', '),
      link:      `/projects/${projectId}/issues`,
      read:      false,
      createdAt: new Date().toISOString(),
      createdBy,
    })
  }

  // Add all to Firestore
  for (const notif of notifs) {
    await addNotification(notif)
  }

  return notifs.length
}
