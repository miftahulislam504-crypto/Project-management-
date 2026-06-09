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

// ─── Auto-generate procurement items from activities ───────

export function autoGenerateProcurement(
  activities: import('@/lib/types').Activity[],
  projectId:  string,
  startDate:  string
): Omit<ProcurementItem, 'id'>[] {
  const now    = new Date().toISOString()
  const items: Omit<ProcurementItem, 'id'>[] = []

  // Material mapping: activity name keywords → procurement items
  const materialMap: {
    keywords: string[]
    materials: { name: string; category: ProcurementItem['category']; unit: string; unitRate: number }[]
  }[] = [
    {
      keywords: ['foundation', 'footing', 'pile', 'grade beam'],
      materials: [
        { name: 'Cement (OPC 43 Grade)', category: 'cement',    unit: 'bag',  unitRate: 480 },
        { name: 'Coarse Aggregate 20mm', category: 'stone',     unit: 'cft',  unitRate: 70  },
        { name: 'Fine Aggregate (Sand)', category: 'sand',      unit: 'cft',  unitRate: 55  },
        { name: 'MS Rod (Deformed Bar)', category: 'steel',     unit: 'ton',  unitRate: 95000 },
      ],
    },
    {
      keywords: ['column', 'beam', 'slab', 'rcc', 'rc', 'concrete', 'roof'],
      materials: [
        { name: 'Cement (OPC 43 Grade)', category: 'cement',    unit: 'bag',  unitRate: 480 },
        { name: 'Coarse Aggregate 20mm', category: 'stone',     unit: 'cft',  unitRate: 70  },
        { name: 'Fine Aggregate (Sand)', category: 'sand',      unit: 'cft',  unitRate: 55  },
        { name: 'MS Rod (Deformed Bar)', category: 'steel',     unit: 'ton',  unitRate: 95000 },
      ],
    },
    {
      keywords: ['brick', 'masonry', 'wall', 'partition'],
      materials: [
        { name: 'First Class Brick',     category: 'brick',     unit: 'nos',  unitRate: 12  },
        { name: 'Cement (OPC 43 Grade)', category: 'cement',    unit: 'bag',  unitRate: 480 },
        { name: 'Fine Aggregate (Sand)', category: 'sand',      unit: 'cft',  unitRate: 55  },
      ],
    },
    {
      keywords: ['plaster', 'plastering', 'render'],
      materials: [
        { name: 'Cement (OPC 43 Grade)', category: 'cement',    unit: 'bag',  unitRate: 480 },
        { name: 'Fine Aggregate (Sand)', category: 'sand',      unit: 'cft',  unitRate: 55  },
      ],
    },
    {
      keywords: ['door', 'window', 'frame', 'shutter', 'timber', 'wood'],
      materials: [
        { name: 'Timber (Sal/Teak)',      category: 'timber',    unit: 'cft',  unitRate: 3500 },
      ],
    },
    {
      keywords: ['tile', 'floor', 'flooring', 'ceramic'],
      materials: [
        { name: 'Ceramic Floor Tile',    category: 'tile',      unit: 'sft',  unitRate: 90  },
        { name: 'Cement (OPC 43 Grade)', category: 'cement',    unit: 'bag',  unitRate: 480 },
      ],
    },
    {
      keywords: ['paint', 'painting', 'primer', 'whitewash'],
      materials: [
        { name: 'Emulsion Paint',        category: 'paint',     unit: 'ltr',  unitRate: 380 },
        { name: 'Primer',                category: 'paint',     unit: 'ltr',  unitRate: 220 },
      ],
    },
    {
      keywords: ['electric', 'wiring', 'conduit', 'switchboard', 'panel'],
      materials: [
        { name: 'PVC Conduit Pipe',      category: 'electrical', unit: 'mtr', unitRate: 85  },
        { name: 'Electric Cable (2.5mm)',category: 'electrical', unit: 'mtr', unitRate: 120 },
      ],
    },
    {
      keywords: ['plumb', 'sanitary', 'pipe', 'drainage', 'water supply'],
      materials: [
        { name: 'PVC Pipe (4 inch)',      category: 'plumbing',  unit: 'mtr', unitRate: 320 },
        { name: 'PVC Pipe (1 inch)',      category: 'plumbing',  unit: 'mtr', unitRate: 95  },
      ],
    },
  ]

  const addedNames = new Set<string>()

  for (const activity of activities) {
    const nameLower = activity.name.toLowerCase()

    for (const mapping of materialMap) {
      if (mapping.keywords.some(kw => nameLower.includes(kw))) {
        for (const mat of mapping.materials) {
          if (addedNames.has(mat.name)) continue
          addedNames.add(mat.name)

          const qty = 10 // default placeholder quantity
          items.push({
            projectId,
            name:           mat.name,
            category:       mat.category,
            specification:  '',
            quantity:       qty,
            unit:           mat.unit,
            unitRate:       mat.unitRate,
            totalCost:      qty * mat.unitRate,
            requiredDate:   startDate,
            orderedDate:    '',
            deliveryDate:   '',
            supplier:       '',
            status:         'pending',
            remarks:        `Auto-generated from activity: ${activity.name}`,
            linkedActivity: activity.name,
            createdAt:      now,
            updatedAt:      now,
          })
        }
      }
    }
  }

  return items
}
