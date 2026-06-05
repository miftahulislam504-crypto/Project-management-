// ─── Project ──────────────────────────────────────────────
export interface Project {
  id: string
  name: string
  location: string
  clientName: string
  contractValue: number
  startDate: string
  targetDate: string
  status: 'planning' | 'active' | 'on-hold' | 'completed'
  plannedProgress: number
  actualProgress: number
  budgetUsed: number
  createdAt: string
  updatedAt: string
  createdBy: string
}

// ─── WBS Activity ─────────────────────────────────────────
export interface Activity {
  id: string
  projectId: string
  parentId: string | null
  code: string
  name: string
  level: number
  startDate: string
  endDate: string
  duration: number
  progress: number
  plannedCost: number
  actualCost: number
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed'
  isCritical: boolean
  dependencies: string[]
  resources: ActivityResource[]
  createdAt: string
}

export interface ActivityResource {
  type: 'labor' | 'equipment' | 'material' | 'subcontractor'
  name: string
  quantity: number
  unit: string
  unitRate: number
}

// ─── KPI ──────────────────────────────────────────────────
export interface ProjectKPI {
  plannedProgress: number
  actualProgress: number
  budgetTotal: number
  budgetUsed: number
  budgetRemaining: number
  delayedActivities: number
  criticalActivities: number
  totalActivities: number
  completedActivities: number
  spi: number  // Schedule Performance Index
  cpi: number  // Cost Performance Index
}

// ─── User ─────────────────────────────────────────────────
export interface AppUser {
  uid: string
  email: string
  displayName: string
  role: 'admin' | 'pm' | 'engineer' | 'viewer'
  photoURL?: string
}

// ─── Task (Kanban) ────────────────────────────────────────
export interface Task {
  id: string
  projectId: string
  activityId: string
  title: string
  assignee: string
  dueDate: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'planned' | 'ready' | 'in-progress' | 'review' | 'completed'
  remarks: string
  createdAt: string
}

// ─── Issue ────────────────────────────────────────────────
export interface Issue {
  id: string
  projectId: string
  type: 'site' | 'safety' | 'quality' | 'design'
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in-progress' | 'closed'
  reportedBy: string
  assignedTo: string
  reportedDate: string
  resolvedDate?: string
}
