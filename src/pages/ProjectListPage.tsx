import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection, query, where, onSnapshot,
  addDoc, serverTimestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/store/useAuthStore'
import { useProjectStore } from '@/store/useProjectStore'
import { Project } from '@/lib/types'
import {
  Plus, Building2, MapPin, Calendar,
  TrendingUp, DollarSign, X
} from 'lucide-react'

export default function ProjectListPage() {
  const navigate          = useNavigate()
  const { user }          = useAuthStore()
  const { projects, setProjects } = useProjectStore()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]   = useState({
    name: '', location: '', clientName: '',
    contractValue: '', startDate: '', targetDate: '',
  })
  const [saving, setSaving] = useState(false)

  // Real-time projects listener
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'projects'),
      where('createdBy', '==', user.uid)
    )
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Project))
      setProjects(data)
    })
    return () => unsub()
  }, [user, setProjects])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        ...form,
        contractValue:   parseFloat(form.contractValue) || 0,
        status:          'planning',
        plannedProgress: 0,
        actualProgress:  0,
        budgetUsed:      0,
        createdBy:       user.uid,
        createdAt:       new Date().toISOString(),
        updatedAt:       new Date().toISOString(),
      })
      setShowModal(false)
      navigate(`/projects/${docRef.id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const statusColor: Record<string, string> = {
    planning:  'badge-info',
    active:    'badge-success',
    'on-hold': 'badge-warning',
    completed: 'badge-info',
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
          <p className="text-civil-muted text-sm mt-1">Create your first project to get started</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(project => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="card cursor-pointer hover:border-civil-accent/40 transition-colors duration-200 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-civil-text text-sm truncate group-hover:text-civil-accent transition-colors">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-civil-muted" />
                    <span className="text-xs text-civil-muted truncate">{project.location}</span>
                  </div>
                </div>
                <span className={`${statusColor[project.status]} ml-2 capitalize`}>
                  {project.status}
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
                  <span>৳ {(project.contractValue / 100000).toFixed(1)}L</span>
                </div>
                <div className="flex items-center gap-1 text-civil-muted">
                  <Calendar className="w-3 h-3" />
                  <span>{project.targetDate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
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
                <input className="input" required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
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
