// Construction WBS Template
// এই structure থেকে Auto-Generate হবে

export interface WBSTemplate {
  code: string
  name: string
  level: number
  duration: number // days
  children?: WBSTemplate[]
}

export const constructionWBSTemplate: WBSTemplate[] = [
  {
    code: '1',
    name: 'Site Preparation',
    level: 1,
    duration: 14,
    children: [
      { code: '1.1', name: 'Site Clearing & Demolition', level: 2, duration: 5 },
      { code: '1.2', name: 'Temporary Site Office',      level: 2, duration: 3 },
      { code: '1.3', name: 'Site Hoarding & Fencing',    level: 2, duration: 4 },
      { code: '1.4', name: 'Temporary Utilities',        level: 2, duration: 5 },
    ],
  },
  {
    code: '2',
    name: 'Foundation Work',
    level: 1,
    duration: 30,
    children: [
      { code: '2.1', name: 'Excavation',            level: 2, duration: 8 },
      { code: '2.2', name: 'PCC (Plain Cement Concrete)', level: 2, duration: 3 },
      { code: '2.3', name: 'Footing Reinforcement',  level: 2, duration: 7 },
      { code: '2.4', name: 'Footing Shuttering',     level: 2, duration: 4 },
      { code: '2.5', name: 'Footing Concrete',       level: 2, duration: 2 },
      { code: '2.6', name: 'Foundation Wall / Grade Beam', level: 2, duration: 8 },
      { code: '2.7', name: 'Backfilling & Compaction', level: 2, duration: 5 },
    ],
  },
  {
    code: '3',
    name: 'Ground Floor (GF)',
    level: 1,
    duration: 35,
    children: [
      { code: '3.1', name: 'Column Reinforcement (GF)', level: 2, duration: 6 },
      { code: '3.2', name: 'Column Shuttering (GF)',    level: 2, duration: 4 },
      { code: '3.3', name: 'Column Concrete (GF)',      level: 2, duration: 1 },
      { code: '3.4', name: 'Beam & Slab Shuttering (GF)', level: 2, duration: 8 },
      { code: '3.5', name: 'Beam Reinforcement (GF)',   level: 2, duration: 7 },
      { code: '3.6', name: 'Slab Reinforcement (GF)',   level: 2, duration: 6 },
      { code: '3.7', name: 'Beam & Slab Concrete (GF)', level: 2, duration: 2 },
      { code: '3.8', name: 'Curing (GF)',               level: 2, duration: 14 },
    ],
  },
  {
    code: '4',
    name: '1st Floor',
    level: 1,
    duration: 35,
    children: [
      { code: '4.1', name: 'Column Reinforcement (1F)', level: 2, duration: 6 },
      { code: '4.2', name: 'Column Shuttering (1F)',    level: 2, duration: 4 },
      { code: '4.3', name: 'Column Concrete (1F)',      level: 2, duration: 1 },
      { code: '4.4', name: 'Beam & Slab Shuttering (1F)', level: 2, duration: 8 },
      { code: '4.5', name: 'Beam Reinforcement (1F)',   level: 2, duration: 7 },
      { code: '4.6', name: 'Slab Reinforcement (1F)',   level: 2, duration: 6 },
      { code: '4.7', name: 'Beam & Slab Concrete (1F)', level: 2, duration: 2 },
      { code: '4.8', name: 'Curing (1F)',               level: 2, duration: 14 },
    ],
  },
  {
    code: '5',
    name: '2nd Floor',
    level: 1,
    duration: 35,
    children: [
      { code: '5.1', name: 'Column Reinforcement (2F)', level: 2, duration: 6 },
      { code: '5.2', name: 'Column Shuttering (2F)',    level: 2, duration: 4 },
      { code: '5.3', name: 'Column Concrete (2F)',      level: 2, duration: 1 },
      { code: '5.4', name: 'Beam & Slab Shuttering (2F)', level: 2, duration: 8 },
      { code: '5.5', name: 'Beam Reinforcement (2F)',   level: 2, duration: 7 },
      { code: '5.6', name: 'Slab Reinforcement (2F)',   level: 2, duration: 6 },
      { code: '5.7', name: 'Beam & Slab Concrete (2F)', level: 2, duration: 2 },
      { code: '5.8', name: 'Curing (2F)',               level: 2, duration: 14 },
    ],
  },
  {
    code: '6',
    name: 'Roof Work',
    level: 1,
    duration: 20,
    children: [
      { code: '6.1', name: 'Roof Slab Reinforcement',  level: 2, duration: 7 },
      { code: '6.2', name: 'Roof Slab Concrete',       level: 2, duration: 2 },
      { code: '6.3', name: 'Waterproofing',            level: 2, duration: 7 },
      { code: '6.4', name: 'Parapet Wall',             level: 2, duration: 5 },
    ],
  },
  {
    code: '7',
    name: 'Finishing Works',
    level: 1,
    duration: 60,
    children: [
      { code: '7.1', name: 'Brickwork / Partition',     level: 2, duration: 20 },
      { code: '7.2', name: 'Plaster (Internal)',        level: 2, duration: 20 },
      { code: '7.3', name: 'Plaster (External)',        level: 2, duration: 15 },
      { code: '7.4', name: 'Floor Tiling',              level: 2, duration: 15 },
      { code: '7.5', name: 'Wall Tiling (Toilet/Kitchen)', level: 2, duration: 10 },
      { code: '7.6', name: 'Doors & Windows',           level: 2, duration: 10 },
      { code: '7.7', name: 'Painting (Internal)',       level: 2, duration: 15 },
      { code: '7.8', name: 'Painting (External)',       level: 2, duration: 10 },
      { code: '7.9', name: 'False Ceiling',             level: 2, duration: 10 },
    ],
  },
  {
    code: '8',
    name: 'MEP Works',
    level: 1,
    duration: 45,
    children: [
      { code: '8.1', name: 'Electrical Conduit & Wiring', level: 2, duration: 20 },
      { code: '8.2', name: 'Plumbing & Sanitary',       level: 2, duration: 20 },
      { code: '8.3', name: 'AC Ducting',                level: 2, duration: 15 },
      { code: '8.4', name: 'Fire Protection System',    level: 2, duration: 10 },
      { code: '8.5', name: 'Electrical Fixtures',       level: 2, duration: 7 },
      { code: '8.6', name: 'Sanitary Fixtures',         level: 2, duration: 7 },
    ],
  },
  {
    code: '9',
    name: 'External Works',
    level: 1,
    duration: 20,
    children: [
      { code: '9.1', name: 'External Paving / Hardscape', level: 2, duration: 10 },
      { code: '9.2', name: 'Boundary Wall',              level: 2, duration: 10 },
      { code: '9.3', name: 'Gate & Fencing',             level: 2, duration: 5 },
      { code: '9.4', name: 'Landscaping',                level: 2, duration: 7 },
    ],
  },
]

// Flatten WBS for Firestore
export function flattenWBS(
  items: WBSTemplate[],
  projectId: string,
  startDate: string,
  parentId: string | null = null
): Omit<import('@/lib/types').Activity, 'id'>[] {
  const result: Omit<import('@/lib/types').Activity, 'id'>[] = []
  const start = new Date(startDate)

  for (const item of items) {
    const end = new Date(start)
    end.setDate(end.getDate() + item.duration)

    const activity: Omit<import('@/lib/types').Activity, 'id'> = {
      projectId,
      parentId,
      code:         item.code,
      name:         item.name,
      level:        item.level,
      startDate:    start.toISOString().split('T')[0],
      endDate:      end.toISOString().split('T')[0],
      duration:     item.duration,
      progress:     0,
      plannedCost:  0,
      actualCost:   0,
      status:       'not-started',
      isCritical:   false,
      dependencies: [],
      resources:    [],
      createdAt:    new Date().toISOString(),
    }
    result.push(activity)

    if (item.children?.length) {
      const children = flattenWBS(item.children, projectId, startDate, item.code)
      result.push(...children)
    }
  }
  return result
}
