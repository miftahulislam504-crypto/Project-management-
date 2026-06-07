import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, where, writeBatch
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ProcurementItem } from '@/lib/procurement-helpers'

// ─── CRUD ──────────────────────────────────────────────────

export async function addProcurementItem(
  item: Omit<ProcurementItem, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'procurement'), item)
  return ref.id
}

export async function updateProcurementItem(
  id:   string,
  data: Partial<ProcurementItem>
) {
  await updateDoc(doc(db, 'procurement', id), {
    ...data,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteProcurementItem(id: string) {
  await deleteDoc(doc(db, 'procurement', id))
}

export async function getProcurementItems(
  projectId: string
): Promise<ProcurementItem[]> {
  const q    = query(
    collection(db, 'procurement'),
    where('projectId', '==', projectId)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ProcurementItem))
}

export async function bulkAddProcurement(
  items: Omit<ProcurementItem, 'id'>[]
): Promise<void> {
  const batch  = writeBatch(db)
  const colRef = collection(db, 'procurement')
  for (const item of items) {
    const ref = doc(colRef)
    batch.set(ref, item)
  }
  await batch.commit()
}

export async function deleteAllProcurement(projectId: string) {
  const items = await getProcurementItems(projectId)
  const batch = writeBatch(db)
  for (const item of items) {
    batch.delete(doc(db, 'procurement', item.id))
  }
  await batch.commit()
}
