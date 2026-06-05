import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, where, writeBatch, serverTimestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Activity } from '@/lib/types'
import { flattenWBS, constructionWBSTemplate } from '@/lib/wbs-data'

// ─── Activities ───────────────────────────────────────────

export async function generateWBS(projectId: string, startDate: string) {
  const flat = flattenWBS(constructionWBSTemplate, projectId, startDate)
  const batch = writeBatch(db)
  const colRef = collection(db, 'activities')

  for (const activity of flat) {
    const docRef = doc(colRef)
    batch.set(docRef, activity)
  }
  await batch.commit()
}

export async function getActivities(projectId: string): Promise<Activity[]> {
  const q = query(
    collection(db, 'activities'),
    where('projectId', '==', projectId)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Activity))
}

export async function updateActivity(id: string, data: Partial<Activity>) {
  await updateDoc(doc(db, 'activities', id), {
    ...data,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteActivity(id: string) {
  await deleteDoc(doc(db, 'activities', id))
}

export async function deleteAllActivities(projectId: string) {
  const activities = await getActivities(projectId)
  const batch = writeBatch(db)
  for (const a of activities) {
    batch.delete(doc(db, 'activities', a.id))
  }
  await batch.commit()
}

export async function addActivity(
  activity: Omit<Activity, 'id'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'activities'), activity)
  return docRef.id
}
