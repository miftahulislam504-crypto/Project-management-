import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useProjectStore } from '@/store/useProjectStore'
import { useAuthStore }    from '@/store/useAuthStore'
import {
  PunchItem, FinalInspection, HandoverItem,
  PunchStatus, InspType,
  punchStatusConfig, inspTypeConfig,
  calcCloseoutStats,
  addPunchItem, updatePunchItem, deletePunchItem, subPunchList,
  addInspection, updateInspection, deleteInspection, subInspections,
  updateHandoverItem, subHandoverItems, initHandoverChecklist,
} from '@/lib/closeout-helpers'
import {
  Plus, X, Save, Trash2, CheckCircle2,
  ClipboardList, Award, PackageCheck, AlertTriangle,
} from 'lucide-react'
import { clsx } from 'clsx'

type Tab = 'punch' | 'inspections' | 'handover'

export default function CloseoutPage() {
  const { id: projectId }  = useParams<{ id: string }>()
  const { activeProject }  = useProjectStore()
  const { user }           = useAuthStore()

  const [tab,         setTab]         = useState<Tab>('punch')
  const [punchList,   setPunchList]   = useState<PunchItem[]>([])
  const [inspections, setInspections] = useState<FinalInspection[]>([])
  const [handover,    setHandover]    = useState<HandoverItem[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showModal,   setShowModal]   = useState(false)
  const [saving,      setSaving]      = useState(false)

  // Punch form
  const [pForm, setPForm] = useState({
    location: '', description: '', trade: '',
    severity: 'minor' as PunchItem['severity'],
    assignedTo: '', dueDate: '', remarks: '',
  })

  // Inspection form
  const [iForm, setIForm] = useState({
    type: 'structural' as InspType,
    title: '', date: new Date().toISOString().split('T')[0],
    inspector: '', status: 'pass' as FinalInspection['status'],
    remarks: '',
  })

  useEffect(() => {
    if (!projectId) return
    const u1 = subPunchList(projectId,   setPunchList)
    const u2 = subInspections(projectId, setInspections)
    const u3 = subHandoverItems(projectId, d => { setHandover(d); setLoading(false) })
    initHandoverChecklist(projectId)
    return () => { u1(); u2(); u3() }
  }, [projectId])

  const stats = calcCloseoutStats(punchList, inspections, handover)

  // ── Punch handlers ─────────────────────────────────────
  const savePunch = async () => {
    if (!pForm.description.trim()) return
    setSaving(true)
    try {
      await addPunchItem({
        projectId: projectId!,
        ...pForm,
        status: 'open',
        resolvedDate: '',
        createdAt: new Date().toISOString(),
      })
      setPForm({ location: '', description: '', trade: '', severity: 'minor', assignedTo: '', dueDate: '', remarks: '' })
      setShowModal(false)
    } finally { setSaving(false) }
  }

  const saveInspection = async () => {
    if (!iForm.title.trim()) return
    setSaving(true)
    try {
      await addInspection({
        projectId: projectId!,
        ...iForm,
        createdAt: new Date().toISOString(),
      })
      setIForm({ type: 'structural', title: '', date: new Date().toISOString().split('T')[0], inspector: '', status: 'pass', remarks: '' })
      setShowModal(false)
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-civil-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-civil-text">Project Closeout</h1>
          <p className="text-sm text-civil-muted mt-0.5">{activeProject?.name}</p>
        </div>
        {(tab === 'punch' || tab === 'inspections') && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {tab === 'punch' ? 'Add Item' : 'Add Inspection'}
          </button>
        )}
      </div>

      {/* Handover readiness banner */}
      <div className={clsx(
        'card mb-4 flex items-center gap-3 border',
        stats.readyToHandover
          ? 'border-green-200 bg-green-50'
          : 'border-amber-200 bg-amber-50'
      )}>
        {stats.readyToHandover
          ? <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
          : <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
        }
        <div>
          <p className={clsx(
            'text-sm font-semibold',
            stats.readyToHandover ? 'text-green-600' : 'text-amber-600'
          )}>
            {stats.readyToHandover ? '✓ Ready for Handover' : 'Not Ready for Handover'}
          </p>
          <p className="text-xs text-civil-muted">
            {stats.punch.open} punch items open · {stats.inspections.fail} inspections failed · {stats.handover.pct}% handover complete
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Punch List',    open: stats.punch.open,       total: stats.punch.total,       resolved: stats.punch.resolved,       icon: ClipboardList, color: 'text-orange-400' },
          { label: 'Inspections',   open: stats.inspections.fail, total: stats.inspections.total, resolved: stats.inspections.pass,     icon: Award,         color: 'text-blue-600' },
          { label: 'Handover',      open: 0,                      total: stats.handover.total,    resolved: stats.handover.completed,   icon: PackageCheck,  color: 'text-green-600' },
        ].map(({ label, open, total, resolved, icon: Icon, color }) => (
          <div key={label} className="card text-center">
            <Icon className={clsx('w-5 h-5 mx-auto mb-1', color)} />
            <p className={clsx('text-xl font-bold', color)}>{resolved}/{total}</p>
            <p className="text-xs text-civil-muted">{label}</p>
            {open > 0 && <p className="text-[10px] text-red-600">{open} pending</p>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-civil-surface border border-civil-border rounded-lg p-1 gap-1 mb-4 w-fit">
        {[
          { key: 'punch',       label: `📋 Punch List (${stats.punch.open} open)` },
          { key: 'inspections', label: `🔍 Inspections (${stats.inspections.total})` },
          { key: 'handover',    label: `📦 Handover (${stats.handover.pct}%)` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key as Tab)}
            className={clsx('px-3 py-1.5 rounded text-xs font-medium transition-colors',
              tab === key ? 'bg-civil-accent text-white' : 'text-civil-muted hover:text-civil-text'
            )}>{label}</button>
        ))}
      </div>

      {/* ── PUNCH LIST ── */}
      {tab === 'punch' && (
        <div className="space-y-2">
          {punchList.length === 0 ? (
            <div className="card flex flex-col items-center py-16 text-center">
              <ClipboardList className="w-10 h-10 text-civil-border mb-3" />
              <p className="text-civil-text font-semibold">No punch list items</p>
              <p className="text-civil-muted text-xs mt-1">Add defects and snag items to track</p>
            </div>
          ) : (
            punchList.map(item => {
              const stat = punchStatusConfig[item.status]
              return (
                <div key={item.id} className="card">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-medium', stat.bg, stat.color)}>
                          {stat.label}
                        </span>
                        <span className={clsx('text-[10px] px-2 py-0.5 rounded-full capitalize',
                          item.severity === 'critical' ? 'bg-red-50 text-red-600' :
                          item.severity === 'major'    ? 'bg-orange-900/30 text-orange-400' :
                          'bg-civil-surface text-civil-muted'
                        )}>
                          {item.severity}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-civil-text">{item.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-civil-muted flex-wrap">
                        {item.location  && <span>📍 {item.location}</span>}
                        {item.trade     && <span>🔧 {item.trade}</span>}
                        {item.assignedTo && <span>👤 {item.assignedTo}</span>}
                        {item.dueDate   && <span>📅 {item.dueDate}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <select
                        value={item.status}
                        onChange={e => updatePunchItem(item.id, { status: e.target.value as PunchStatus })}
                        className="text-[10px] bg-civil-surface border border-civil-border text-civil-muted rounded px-1.5 py-1 cursor-pointer"
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                      <button onClick={() => deletePunchItem(item.id)}
                        className="p-1.5 text-civil-muted hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── INSPECTIONS ── */}
      {tab === 'inspections' && (
        <div className="space-y-2">
          {inspections.length === 0 ? (
            <div className="card flex flex-col items-center py-16 text-center">
              <Award className="w-10 h-10 text-civil-border mb-3" />
              <p className="text-civil-text font-semibold">No final inspections</p>
              <p className="text-civil-muted text-xs mt-1">Record structural, MEP, and final inspections</p>
            </div>
          ) : (
            inspections.map(insp => {
              const cfg = inspTypeConfig[insp.type]
              return (
                <div key={insp.id} className={clsx('card border',
                  insp.status === 'pass'        && 'border-green-200',
                  insp.status === 'fail'        && 'border-red-200',
                  insp.status === 'conditional' && 'border-amber-200',
                )}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-xl">{cfg.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-civil-text">{insp.title}</p>
                          <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize',
                            insp.status === 'pass'        ? 'bg-green-50 text-green-600' :
                            insp.status === 'fail'        ? 'bg-red-50 text-red-600' :
                            'bg-amber-50 text-amber-600'
                          )}>
                            {insp.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-civil-muted mt-1">
                          {cfg.label} · {insp.inspector} · {insp.date}
                        </p>
                        {insp.remarks && <p className="text-xs text-civil-muted mt-1">{insp.remarks}</p>}
                      </div>
                    </div>
                    <button onClick={() => deleteInspection(insp.id)}
                      className="p-1.5 text-civil-muted hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── HANDOVER CHECKLIST ── */}
      {tab === 'handover' && (
        <div className="space-y-2">
          {/* Progress bar */}
          <div className="card mb-2">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-civil-muted">Handover Progress</span>
              <span className="font-bold text-civil-accent">{stats.handover.pct}%</span>
            </div>
            <div className="h-2 bg-civil-border rounded-full overflow-hidden">
              <div
                className="h-full bg-civil-accent rounded-full transition-all"
                style={{ width: `${stats.handover.pct}%` }}
              />
            </div>
          </div>

          {Object.entries(
            handover.reduce((acc, item) => {
              if (!acc[item.category]) acc[item.category] = []
              acc[item.category].push(item)
              return acc
            }, {} as Record<string, HandoverItem[]>)
          ).map(([category, items]) => (
            <div key={category} className="space-y-1.5">
              <p className="text-xs font-semibold text-civil-muted px-1">{category}</p>
              {items.map(item => (
                <div key={item.id} className={clsx(
                  'card flex items-center gap-3 border transition-colors',
                  item.status === 'completed'   && 'border-green-200 bg-green-900/5',
                  item.status === 'in-progress' && 'border-amber-200',
                  item.status === 'not-started' && 'border-civil-border',
                )}>
                  {/* Status toggle */}
                  <button
                    onClick={() => {
                      const next: HandoverItem['status'] =
                        item.status === 'not-started' ? 'in-progress' :
                        item.status === 'in-progress' ? 'completed' : 'not-started'
                      updateHandoverItem(item.id, {
                        status: next,
                        completedDate: next === 'completed' ? new Date().toISOString().split('T')[0] : '',
                      })
                    }}
                    className={clsx(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                      item.status === 'completed'   && 'bg-green-500 border-green-500',
                      item.status === 'in-progress' && 'border-yellow-400 bg-transparent',
                      item.status === 'not-started' && 'border-civil-border bg-transparent',
                    )}
                  >
                    {item.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-white" />}
                    {item.status === 'in-progress' && <div className="w-2 h-2 rounded-full bg-yellow-400" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={clsx(
                      'text-xs font-medium',
                      item.status === 'completed' ? 'text-civil-muted line-through' : 'text-civil-text'
                    )}>
                      {item.item}
                    </p>
                    <p className="text-[10px] text-civil-muted">{item.description}</p>
                    {item.completedDate && (
                      <p className="text-[10px] text-green-600">✓ {item.completedDate}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-civil-card border border-civil-border rounded-2xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-civil-border flex-shrink-0">
              <h2 className="font-semibold text-civil-text">
                {tab === 'punch' ? 'New Punch Item' : 'New Inspection'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-civil-muted hover:text-civil-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Punch form */}
              {tab === 'punch' && (
                <>
                  <div>
                    <label className="text-xs text-civil-muted mb-1 block">Description *</label>
                    <textarea className="input resize-none" rows={2}
                      value={pForm.description}
                      onChange={e => setPForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Describe the defect or issue..." autoFocus />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-civil-muted mb-1 block">Location</label>
                      <input className="input" value={pForm.location}
                        onChange={e => setPForm(f => ({ ...f, location: e.target.value }))}
                        placeholder="e.g. 2nd Floor, Apt 3" />
                    </div>
                    <div>
                      <label className="text-xs text-civil-muted mb-1 block">Trade</label>
                      <input className="input" value={pForm.trade}
                        onChange={e => setPForm(f => ({ ...f, trade: e.target.value }))}
                        placeholder="Mason, Electrician..." />
                    </div>
                    <div>
                      <label className="text-xs text-civil-muted mb-1 block">Severity</label>
                      <select className="input" value={pForm.severity}
                        onChange={e => setPForm(f => ({ ...f, severity: e.target.value as any }))}>
                        <option value="minor">Minor</option>
                        <option value="major">Major</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-civil-muted mb-1 block">Assigned To</label>
                      <input className="input" value={pForm.assignedTo}
                        onChange={e => setPForm(f => ({ ...f, assignedTo: e.target.value }))}
                        placeholder="Contractor name" />
                    </div>
                    <div>
                      <label className="text-xs text-civil-muted mb-1 block">Due Date</label>
                      <input type="date" className="input" value={pForm.dueDate}
                        onChange={e => setPForm(f => ({ ...f, dueDate: e.target.value }))} />
                    </div>
                  </div>
                </>
              )}

              {/* Inspection form */}
              {tab === 'inspections' && (
                <>
                  <div>
                    <label className="text-xs text-civil-muted mb-2 block">Inspection Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.keys(inspTypeConfig) as InspType[]).map(t => {
                        const cfg = inspTypeConfig[t]
                        return (
                          <button key={t} onClick={() => setIForm(f => ({ ...f, type: t }))}
                            className={clsx(
                              'py-2 rounded-lg border text-xs font-medium transition-colors text-center',
                              iForm.type === t
                                ? `bg-civil-accent/8 ${cfg.color} border-current`
                                : 'bg-civil-surface border-civil-border text-civil-muted'
                            )}>
                            <div>{cfg.emoji}</div>
                            <div className="text-[10px]">{cfg.label}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-civil-muted mb-1 block">Title *</label>
                    <input className="input" value={iForm.title}
                      onChange={e => setIForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Final Structural Inspection" autoFocus />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-civil-muted mb-1 block">Date</label>
                      <input type="date" className="input" value={iForm.date}
                        onChange={e => setIForm(f => ({ ...f, date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-civil-muted mb-1 block">Inspector</label>
                      <input className="input" value={iForm.inspector}
                        onChange={e => setIForm(f => ({ ...f, inspector: e.target.value }))}
                        placeholder="Inspector name" />
                    </div>
                    <div>
                      <label className="text-xs text-civil-muted mb-1 block">Result</label>
                      <select className="input" value={iForm.status}
                        onChange={e => setIForm(f => ({ ...f, status: e.target.value as any }))}>
                        <option value="pass">Pass</option>
                        <option value="conditional">Conditional</option>
                        <option value="fail">Fail</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-civil-muted mb-1 block">Remarks</label>
                    <textarea className="input resize-none" rows={2}
                      value={iForm.remarks}
                      onChange={e => setIForm(f => ({ ...f, remarks: e.target.value }))}
                      placeholder="Inspection notes..." />
                  </div>
                </>
              )}
            </div>

            <div className="px-5 py-4 border-t border-civil-border flex gap-3 flex-shrink-0">
              <button onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
              <button
                onClick={tab === 'punch' ? savePunch : saveInspection}
                disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {saving
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Save className="w-4 h-4" />
                }
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
