import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection, query, where, onSnapshot,
  serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/store/useAuthStore'
import { useProjectStore } from '@/store/useProjectStore'
import { Project } from '@/lib/types'
import {
  Plus, Building2, MapPin, Calendar,
  TrendingUp, DollarSign, X, Hash
} from 'lucide-react'

// Helper: Firestore Timestamp → readable date string
function toDateStr(val: any): string {
  if (!val) return '—'
  try {
    const d = val instanceof Timestamp ? val.toDate() : new Date(val)
    return d.toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return '—' }
}

export default function ProjectListPage() {
  const navigate          = useNavigate()
  const { user }          = useAuthStore()
  const { projects, setProjects } = useProjectStore()
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm]   = useState({
    projectName: '', location: '', clientName: '',
    contractValue: '', startDate: '', targetDate: '',
    description: '',
  })

  // Real-time listener — uses Hub's field 'createdBy' (not 'ownerId')
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'projects'),
      where('createdBy', '==', user.uid)
    )
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => {
        const raw = d.data()
        // Normalize Hub fields → Project Management's Project interface
        return {
          id:              d.id,
          // Hub uses projectName, PM uses name — support both
          name:            raw.projectName ?? raw.name ?? '',
          location:        raw.location    ?? '',
          clientName:      raw.clientName  ?? '',
          contractValue:   raw.contractValue ?? 0,
          startDate:       toDateStr(raw.startDate),
          targetDate:      toDateStr(raw.endDate ?? raw.targetDate),
          // Hub status: 'active'|'on_hold'|'completed' → PM: 'active'|'on-hold'|'completed'|'planning'
          status:          raw.status === 'on_hold' ? 'on-hold' : (raw.status ?? 'active'),
          plannedProgress: raw.plannedProgress ?? 0,
          actualProgress:  raw.actualProgress  ?? 0,
          budgetUsed:      raw.budgetUsed      ?? 0,
          createdBy:       raw.createdBy       ?? user.uid,
          createdAt:       toDateStr(raw.createdAt),
          updatedAt:       toDateStr(raw.updatedAt),
          // Extra Hub fields
          projectCode:     raw.projectCode    ?? '',
          description:     raw.description    ?? '',
        } as Project & { projectCode: string; description: string }
      })
      setProjects(data)
    })
    return () => unsub()
  }, [user, setProjects])

  // Create new project — writes Hub-compatible fields so Hub also sees it
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      // Import here to avoid circular dep
      const { addDoc } = await import('firebase/firestore')
      // Generate a simple project code
      const code = `PM-${Date.now().toString().slice(-6)}`
      const docRef = await addDoc(collection(db, 'projects'), {
        // Hub-compatible fields
        projectName:  form.projectName,
        projectCode:  code,
        clientName:   form.clientName,
        location:     form.location,
        description:  form.description,
        status:       'active',
        startDate:    form.startDate ? Timestamp.fromDate(new Date(form.startDate)) : serverTimestamp(),
        endDate:      form.targetDate ? Timestamp.fromDate(new Date(form.targetDate)) : null,
        createdBy:    user.uid,
        createdAt:    serverTimestamp(),
        updatedAt:    serverTimestamp(),
        // PM-specific extras (stored alongside Hub fields)
        contractValue:   parseFloat(form.contractValue) || 0,
        plannedProgress: 0,
        actualProgress:  0,
        budgetUsed:      0,
      })
      setShowModal(false)
      setForm({ projectName: '', location: '', clientName: '', contractValue: '', startDate: '', targetDate: '', description: '' })
      navigate(`/projects/${docRef.id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const statusColor: Record<string, string> = {
    planning:   'badge-info',
    active:     'badge-success',
    'on-hold':  'badge-warning',
    'on_hold':  'badge-warning',
    completed:  'badge-info',
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-civil-text">Projects</h1>
          <p className="text-sm text-civil-muted mt-0.5">{projects.length} projects total</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Grid */}
      {projects.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="w-12 h-12 text-civil-border mb-4" />
          <p className="text-civil-text font-medium">No projects yet</p>
          <p className="text-civil-muted text-sm mt-1">Create a project here or in Hub</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(project => {
            const p = project as any
            return (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="card cursor-pointer hover:border-civil-accent/40 transition-colors duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    {p.projectCode && (
                      <span className="text-xs font-mono text-civil-muted bg-civil-border/40 px-1.5 py-0.5 rounded mb-1 inline-block">
                        {p.projectCode}
                      </span>
                    )}
                    <h3 className="font-semibold text-civil-text text-sm truncate group-hover:text-civil-accent transition-colors">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-civil-muted" />
                      <span className="text-xs text-civil-muted truncate">{project.location}</span>
                    </div>
                  </div>
                  <span className={`${statusColor[project.status] ?? 'badge-info'} ml-2 capitalize text-xs`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-civil-muted mb-1">
                    <span>Progress</span>
                    <span>{project.actualProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-civil-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-civil-accent rounded-full transition-all"
                      style={{ width: `${project.actualProgress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1 text-civil-muted">
                    <DollarSign className="w-3 h-3" />
                    <span>
                      {project.contractValue
                        ? `৳ ${(project.contractValue / 100000).toFixed(1)}L`
                        : '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-civil-muted">
                    <Calendar className="w-3 h-3" />
                    <span>{project.targetDate || '—'}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-civil-card border border-civil-border rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-civil-border">
              <h2 className="font-semibold text-civil-text">New Project</h2>
              <button onClick={() => setShowModal(false)} className="text-civil-muted hover:text-civil-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-civil-muted mb-1 block">Project Name *</label>
                <input className="input" required value={form.projectName}
                  onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))}
                  placeholder="e.g. Dhaka Office Building" />
              </div>
              <div>
                <label className="text-xs text-civil-muted mb-1 block">Location *</label>
                <input className="input" required value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Mirpur, Dhaka" />
              </div>
              <div>
                <label className="text-xs text-civil-muted mb-1 block">Client Name</label>
                <input className="input" value={form.clientName}
                  onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                  placeholder="e.g. ABC Corporation" />
              </div>
              <div>
                <label className="text-xs text-civil-muted mb-1 block">Contract Value (BDT)</label>
                <input className="input" type="number" value={form.contractValue}
                  onChange={e => setForm(f => ({ ...f, contractValue: e.target.value }))}
                  placeholder="e.g. 5000000" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-civil-muted mb-1 block">Start Date</label>
                  <input className="input" type="date" value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-civil-muted mb-1 block">Target Date</label>
                  <input className="input" type="date" value={form.targetDate}
                    onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
