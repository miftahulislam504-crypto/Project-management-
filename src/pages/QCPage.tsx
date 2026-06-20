import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useProjectStore } from '@/store/useProjectStore'
import { useAuthStore } from '@/store/useAuthStore'
import {
  QCRecord, QCPhase, QCStatus, QCCheckItem,
  qcPhaseConfig, qcStatusConfig, defaultChecklists,
  addQCRecord, updateQCRecord, deleteQCRecord, subQCRecords,
} from '@/lib/issue-helpers'
import {
  Plus, X, Save, Trash2, CheckCircle2,
  XCircle, Eye, ClipboardCheck, PenLine,
} from 'lucide-react'
import { clsx } from 'clsx'

export default function QCPage() {
  const { id: projectId }  = useParams<{ id: string }>()
  const { activeProject }  = useProjectStore()
  const { user }           = useAuthStore()
  const [records,    setRecords]    = useState<QCRecord[]>([])
  const [showModal,  setShowModal]  = useState(false)
  const [editRecord, setEditRecord] = useState<QCRecord | null>(null)
  const [saving,     setSaving]     = useState(false)
  const [activePhase, setActivePhase] = useState<QCPhase>('foundation')

  // Form state
  const [phase,      setPhase]      = useState<QCPhase>('foundation')
  const [actRef,     setActRef]     = useState('')
  const [checkItems, setCheckItems] = useState<QCCheckItem[]>([])
  const [inspector,  setInspector]  = useState('')
  const [inspDate,   setInspDate]   = useState(new Date().toISOString().split('T')[0])
  const [remarks,    setRemarks]    = useState('')

  useEffect(() => {
    if (!projectId) return
    return subQCRecords(projectId, setRecords)
  }, [projectId])

  // Init checklist from template
  const initChecklist = (p: QCPhase) => {
    setPhase(p)
    setCheckItems(
      defaultChecklists[p].map((label, i) => ({
        id:      `item_${i}`,
        label,
        status:  null,
        remarks: '',
      }))
    )
  }

  const openModal = (record?: QCRecord) => {
    if (record) {
      setEditRecord(record)
      setPhase(record.phase)
      setActRef(record.activityRef)
      setCheckItems([...record.checkItems])
      setInspector(record.inspectedBy)
      setInspDate(record.inspectedDate)
      setRemarks(record.remarks)
    } else {
      setEditRecord(null)
      setActRef('')
      setInspector(user?.displayName ?? '')
      setInspDate(new Date().toISOString().split('T')[0])
      setRemarks('')
      initChecklist(activePhase)
    }
    setShowModal(true)
  }

  const setItemStatus = (idx: number, status: QCStatus) => {
    setCheckItems(prev =>
      prev.map((item, i) => i === idx ? { ...item, status } : item)
    )
  }

  const setItemRemark = (idx: number, remarks: string) => {
    setCheckItems(prev =>
      prev.map((item, i) => i === idx ? { ...item, remarks } : item)
    )
  }

  // Overall status from items
  const calcOverall = (items: QCCheckItem[]): QCStatus | null => {
    if (items.every(i => i.status === null)) return null
    if (items.some(i => i.status === 'fail')) return 'fail'
    if (items.some(i => i.status === 'observation')) return 'observation'
    if (items.every(i => i.status === 'pass')) return 'pass'
    return 'observation'
  }

  const handleSave = async (signOff = false) => {
    setSaving(true)
    try {
      const overall = calcOverall(checkItems)
      const data: Omit<QCRecord, 'id'> = {
        projectId:     projectId!,
        phase,
        activityRef:   actRef,
        checkItems,
        overallStatus: overall,
        inspectedBy:   inspector,
        inspectedDate: inspDate,
        signedOff:     signOff,
        signOffBy:     signOff ? (user?.displayName ?? '') : '',
        signOffDate:   signOff ? new Date().toISOString().split('T')[0] : '',
        remarks,
        createdAt:     editRecord?.createdAt ?? new Date().toISOString(),
      }
      if (editRecord) await updateQCRecord(editRecord.id, data)
      else await addQCRecord(data)
      setShowModal(false)
    } finally {
      setSaving(false) }
  }

  // Stats
  const stats = {
    total:  records.length,
    pass:   records.filter(r => r.overallStatus === 'pass').length,
    fail:   records.filter(r => r.overallStatus === 'fail').length,
    obs:    records.filter(r => r.overallStatus === 'observation').length,
    signed: records.filter(r => r.signedOff).length,
  }

  const filteredRecords = records.filter(r => r.phase === activePhase)

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-civil-text">QA / QC</h1>
          <p className="text-sm text-civil-muted mt-0.5">{activeProject?.name} · {records.length} inspections</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Inspection
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {[
          { label: 'Total',    value: stats.total,  color: 'text-civil-muted',  bg: 'bg-civil-surface' },
          { label: 'Pass',     value: stats.pass,   color: 'text-green-600',   bg: 'bg-green-50' },
          { label: 'Fail',     value: stats.fail,   color: 'text-red-600',     bg: 'bg-red-50' },
          { label: 'Observation', value: stats.obs, color: 'text-amber-600',  bg: 'bg-amber-50' },
          { label: 'Signed Off',  value: stats.signed, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="card text-center">
            <p className={clsx('text-2xl font-bold', color)}>{value}</p>
            <p className="text-xs text-civil-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Phase tabs */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {(Object.keys(qcPhaseConfig) as QCPhase[]).map(p => {
          const cfg   = qcPhaseConfig[p]
          const count = records.filter(r => r.phase === p).length
          return (
            <button
              key={p}
              onClick={() => { setActivePhase(p); initChecklist(p) }}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                activePhase === p
                  ? `${cfg.bg} ${cfg.color} border-current`
                  : 'bg-civil-surface border-civil-border text-civil-muted hover:text-civil-text'
              )}
            >
              <span>{cfg.emoji}</span>
              <span>{cfg.label}</span>
              {count > 0 && (
                <span className="bg-civil-card text-civil-muted text-[9px] px-1 rounded-full">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Records list */}
      {filteredRecords.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <ClipboardCheck className="w-10 h-10 text-civil-border mb-3" />
          <p className="text-civil-text font-semibold">No {qcPhaseConfig[activePhase].label} inspections</p>
          <p className="text-civil-muted text-xs mt-1">Click "New Inspection" to start</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map(record => {
            const passed = record.checkItems.filter(i => i.status === 'pass').length
            const total  = record.checkItems.length
            const overall = record.overallStatus
            return (
              <div key={record.id} className={clsx(
                'card border transition-colors',
                overall === 'pass'        && 'border-green-200',
                overall === 'fail'        && 'border-red-200',
                overall === 'observation' && 'border-amber-200',
                overall === null          && 'border-civil-border',
              )}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-civil-text">
                        {qcPhaseConfig[record.phase].emoji} {record.activityRef || qcPhaseConfig[record.phase].label + ' Inspection'}
                      </span>
                      {overall && (
                        <span className={clsx(
                          'text-[10px] px-2 py-0.5 rounded-full border font-semibold',
                          qcStatusConfig[overall].bg,
                          qcStatusConfig[overall].color,
                          qcStatusConfig[overall].border,
                        )}>
                          {qcStatusConfig[overall].label}
                        </span>
                      )}
                      {record.signedOff && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">
                          ✓ Signed Off
                        </span>
                      )}
                    </div>
                    {/* Progress */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-civil-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-400 rounded-full"
                          style={{ width: `${total > 0 ? (passed / total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-civil-muted">{passed}/{total} passed</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-[10px] text-civil-muted">
                      <span>Inspector: {record.inspectedBy}</span>
                      <span>Date: {record.inspectedDate}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openModal(record)}
                      className="p-1.5 text-civil-muted hover:text-civil-accent hover:bg-civil-accent/8 rounded transition-colors">
                      <PenLine className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteQCRecord(record.id)}
                      className="p-1.5 text-civil-muted hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── QC MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-civil-card border border-civil-border rounded-2xl w-full max-w-lg flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-civil-border flex-shrink-0">
              <div>
                <h2 className="font-semibold text-civil-text">
                  {editRecord ? 'Edit' : 'New'} Inspection — {qcPhaseConfig[phase].label}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-civil-muted hover:text-civil-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Phase select */}
              {!editRecord && (
                <div>
                  <label className="text-xs text-civil-muted mb-2 block">Phase</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(qcPhaseConfig) as QCPhase[]).map(p => {
                      const cfg = qcPhaseConfig[p]
                      return (
                        <button key={p} onClick={() => initChecklist(p)}
                          className={clsx(
                            'py-2 rounded-lg border text-xs font-medium transition-colors text-center',
                            phase === p
                              ? `${cfg.bg} ${cfg.color} border-current`
                              : 'bg-civil-surface border-civil-border text-civil-muted'
                          )}>
                          <div>{cfg.emoji}</div>
                          <div>{cfg.label}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Activity ref + inspector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-civil-muted mb-1 block">Activity Reference</label>
                  <input className="input" value={actRef} onChange={e => setActRef(e.target.value)} placeholder="e.g. 3.7 Column Casting" />
                </div>
                <div>
                  <label className="text-xs text-civil-muted mb-1 block">Inspector</label>
                  <input className="input" value={inspector} onChange={e => setInspector(e.target.value)} />
                </div>
              </div>

              {/* Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-civil-text">Checklist</label>
                  <div className="flex items-center gap-3 text-[10px]">
                    {[
                      { status: 'pass' as QCStatus, icon: CheckCircle2, color: 'text-green-600' },
                      { status: 'fail' as QCStatus, icon: XCircle, color: 'text-red-600' },
                      { status: 'observation' as QCStatus, icon: Eye, color: 'text-amber-600' },
                    ].map(({ status, icon: Icon, color }) => (
                      <div key={status} className={clsx('flex items-center gap-1', color)}>
                        <Icon className="w-3 h-3" />
                        <span className="capitalize">{status}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {checkItems.map((item, idx) => (
                    <div key={item.id} className="bg-civil-surface border border-civil-border rounded-lg p-2.5">
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-xs text-civil-text">{item.label}</p>
                        <div className="flex gap-1 flex-shrink-0">
                          {(['pass', 'fail', 'observation'] as QCStatus[]).map(s => {
                            const icons = { pass: CheckCircle2, fail: XCircle, observation: Eye }
                            const colors = { pass: 'text-green-600 hover:bg-green-50', fail: 'text-red-600 hover:bg-red-50', observation: 'text-amber-600 hover:bg-amber-50' }
                            const Icon = icons[s]
                            return (
                              <button key={s} onClick={() => setItemStatus(idx, s)}
                                className={clsx(
                                  'p-1 rounded transition-colors',
                                  colors[s],
                                  item.status === s ? 'opacity-100 bg-current/10' : 'opacity-30 hover:opacity-80'
                                )}>
                                <Icon className="w-4 h-4" />
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      {(item.status === 'fail' || item.status === 'observation') && (
                        <input
                          className="input mt-1.5 text-xs py-1"
                          value={item.remarks}
                          onChange={e => setItemRemark(idx, e.target.value)}
                          placeholder="Remarks for this item..."
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall preview */}
              {calcOverall(checkItems) && (
                <div className={clsx(
                  'rounded-lg px-4 py-2.5 flex items-center justify-between border',
                  qcStatusConfig[calcOverall(checkItems)!].bg,
                  qcStatusConfig[calcOverall(checkItems)!].border,
                )}>
                  <span className="text-xs text-civil-muted">Overall Status</span>
                  <span className={clsx('text-sm font-bold', qcStatusConfig[calcOverall(checkItems)!].color)}>
                    {qcStatusConfig[calcOverall(checkItems)!].label}
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs text-civil-muted mb-1 block">General Remarks</label>
                <textarea className="input resize-none" rows={2} value={remarks}
                  onChange={e => setRemarks(e.target.value)} placeholder="Overall inspection notes..." />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-civil-border flex gap-2 flex-shrink-0">
              <button onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={() => handleSave(false)} disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
              <button onClick={() => handleSave(true)} disabled={saving}
                className="bg-green-700 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Sign Off
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
