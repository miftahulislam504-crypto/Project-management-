import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useProjectStore } from '@/store/useProjectStore'
import { useAuthStore } from '@/store/useAuthStore'
import {
  ApprovalRequest, ApprovalType, ApprovalStatus, ApprovalStep,
  approvalTypeConfig, approvalStatusConfig, workflowLevels,
  buildInitialWorkflow, addApproval, updateApproval,
  deleteApproval, subApprovals,
} from '@/lib/issue-helpers'
import {
  Plus, X, Save, Trash2, CheckCircle2,
  XCircle, ChevronRight, Clock, ClipboardList,
} from 'lucide-react'
import { clsx } from 'clsx'

export default function ApprovalPage() {
  const { id: projectId }  = useParams<{ id: string }>()
  const { activeProject }  = useProjectStore()
  const { user }           = useAuthStore()
  const [approvals,   setApprovals]   = useState<ApprovalRequest[]>([])
  const [showModal,   setShowModal]   = useState(false)
  const [editApproval, setEditApproval] = useState<ApprovalRequest | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [filterType,  setFilterType]  = useState<ApprovalType | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | 'all'>('all')

  // Form
  const [aForm, setAForm] = useState({
    type:          'material' as ApprovalType,
    title:         '',
    description:   '',
    attachmentRef: '',
    maxLevel:      4,
  })

  useEffect(() => {
    if (!projectId) return
    return subApprovals(projectId, setApprovals)
  }, [projectId])

  const openModal = (approval?: ApprovalRequest) => {
    if (approval) {
      setEditApproval(approval)
      setAForm({
        type:          approval.type,
        title:         approval.title,
        description:   approval.description,
        attachmentRef: approval.attachmentRef,
        maxLevel:      approval.maxLevel,
      })
    } else {
      setEditApproval(null)
      setAForm({ type: 'material', title: '', description: '', attachmentRef: '', maxLevel: 4 })
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!aForm.title.trim()) return
    setSaving(true)
    try {
      if (editApproval) {
        await updateApproval(editApproval.id, {
          type: aForm.type, title: aForm.title,
          description: aForm.description, attachmentRef: aForm.attachmentRef,
        })
      } else {
        await addApproval({
          projectId:     projectId!,
          type:          aForm.type,
          title:         aForm.title,
          description:   aForm.description,
          submittedBy:   user?.displayName ?? '',
          submittedDate: new Date().toISOString().split('T')[0],
          currentLevel:  1,
          maxLevel:      aForm.maxLevel,
          status:        'pending',
          workflow:      buildInitialWorkflow().slice(0, aForm.maxLevel),
          attachmentRef: aForm.attachmentRef,
          createdAt:     new Date().toISOString(),
        })
      }
      setShowModal(false)
    } finally { setSaving(false) }
  }

  // Approve / Reject a step
  const handleAction = async (
    approval: ApprovalRequest,
    level: number,
    action: 'approved' | 'rejected' | 'revision',
    remarks = ''
  ) => {
    const updatedWorkflow = approval.workflow.map(step => {
      if (step.level === level) {
        return {
          ...step,
          status:       action,
          approverName: user?.displayName ?? '',
          date:         new Date().toISOString().split('T')[0],
          remarks,
        }
      }
      // Unlock next level if approved
      if (step.level === level + 1 && action === 'approved') {
        return { ...step, status: 'pending' as ApprovalStatus }
      }
      return step
    })

    const allApproved = updatedWorkflow
      .filter(s => s.level <= approval.maxLevel)
      .every(s => s.status === 'approved')
    const anyRejected = updatedWorkflow.some(s => s.status === 'rejected')
    const anyRevision = updatedWorkflow.some(s => s.status === 'revision')

    const newStatus: ApprovalStatus =
      allApproved ? 'approved' :
      anyRejected ? 'rejected' :
      anyRevision ? 'revision' : 'pending'

    await updateApproval(approval.id, {
      workflow:     updatedWorkflow,
      status:       newStatus,
      currentLevel: action === 'approved' ? Math.min(level + 1, approval.maxLevel) : level,
    })
  }

  const filtered = approvals.filter(a => {
    const t = filterType   === 'all' || a.type   === filterType
    const s = filterStatus === 'all' || a.status === filterStatus
    return t && s
  })

  const stats = {
    total:    approvals.length,
    pending:  approvals.filter(a => a.status === 'pending').length,
    approved: approvals.filter(a => a.status === 'approved').length,
    rejected: approvals.filter(a => a.status === 'rejected').length,
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-civil-text">Approval Workflow</h1>
          <p className="text-sm text-civil-muted mt-0.5">{activeProject?.name} · {approvals.length} requests</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total',    value: stats.total,    color: 'text-civil-muted',  bg: 'bg-civil-surface' },
          { label: 'Pending',  value: stats.pending,  color: 'text-yellow-400',   bg: 'bg-yellow-900/20' },
          { label: 'Approved', value: stats.approved, color: 'text-green-400',    bg: 'bg-green-900/20' },
          { label: 'Rejected', value: stats.rejected, color: 'text-red-400',      bg: 'bg-red-900/20' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="card text-center">
            <p className={clsx('text-2xl font-bold', color)}>{value}</p>
            <p className="text-xs text-civil-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex gap-1 flex-wrap">
          {(['all', ...Object.keys(approvalTypeConfig)] as (ApprovalType | 'all')[]).map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={clsx('text-[10px] px-2.5 py-1 rounded-full border transition-colors capitalize',
                filterType === t
                  ? 'bg-civil-accent/20 border-civil-accent/40 text-civil-accent'
                  : 'border-civil-border text-civil-muted hover:text-civil-text'
              )}>
              {t === 'all' ? 'All Types' : approvalTypeConfig[t].emoji + ' ' + approvalTypeConfig[t].label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap ml-auto">
          {(['all', 'pending', 'approved', 'rejected', 'revision'] as (ApprovalStatus | 'all')[]).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={clsx('text-[10px] px-2.5 py-1 rounded-full border transition-colors capitalize',
                filterStatus === s
                  ? 'bg-civil-accent/20 border-civil-accent/40 text-civil-accent'
                  : 'border-civil-border text-civil-muted hover:text-civil-text'
              )}>
              {s === 'all' ? 'All Status' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Approval cards */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <ClipboardList className="w-10 h-10 text-civil-border mb-3" />
          <p className="text-civil-text font-semibold">No approval requests</p>
          <p className="text-civil-muted text-xs mt-1">Submit material, drawing, or work approvals here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(approval => {
            const typeCfg   = approvalTypeConfig[approval.type]
            const statusCfg = approvalStatusConfig[approval.status]
            return (
              <div key={approval.id} className={clsx(
                'card border transition-colors',
                approval.status === 'approved' && 'border-green-900/40',
                approval.status === 'rejected' && 'border-red-900/40',
                approval.status === 'pending'  && 'border-yellow-900/30',
              )}>
                {/* Card header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base">{typeCfg.emoji}</span>
                      <p className="text-sm font-semibold text-civil-text truncate">{approval.title}</p>
                      <span className={clsx(
                        'text-[10px] px-2 py-0.5 rounded-full border font-semibold flex-shrink-0',
                        statusCfg.bg, statusCfg.color, statusCfg.border
                      )}>
                        {statusCfg.label}
                      </span>
                    </div>
                    {approval.description && (
                      <p className="text-xs text-civil-muted mt-1 line-clamp-1">{approval.description}</p>
                    )}
                    <p className="text-[10px] text-civil-muted mt-1">
                      Submitted by {approval.submittedBy} · {approval.submittedDate}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openModal(approval)}
                      className="p-1.5 text-civil-muted hover:text-civil-accent hover:bg-civil-accent/10 rounded transition-colors">
                      <Save className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteApproval(approval.id)}
                      className="p-1.5 text-civil-muted hover:text-red-400 hover:bg-red-900/10 rounded transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Workflow steps */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {approval.workflow.map((step, idx) => {
                    const isActive  = step.status === 'pending'
                    const isDone    = step.status === 'approved'
                    const isRejected = step.status === 'rejected' || step.status === 'revision'
                    const isWaiting  = step.status === 'waiting'
                    return (
                      <div key={step.level} className="flex items-center gap-1 flex-shrink-0">
                        <div className={clsx(
                          'rounded-lg px-2.5 py-2 border text-center min-w-[90px]',
                          isDone     && 'bg-green-900/20 border-green-900/40',
                          isActive   && 'bg-yellow-900/20 border-yellow-900/40',
                          isRejected && 'bg-red-900/20 border-red-900/40',
                          isWaiting  && 'bg-civil-surface border-civil-border opacity-50',
                        )}>
                          <p className={clsx('text-[9px] font-semibold',
                            isDone ? 'text-green-400' : isActive ? 'text-yellow-400' :
                            isRejected ? 'text-red-400' : 'text-civil-muted'
                          )}>
                            L{step.level}: {step.role}
                          </p>
                          <div className="flex justify-center mt-1">
                            {isDone     && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                            {isActive   && <Clock        className="w-4 h-4 text-yellow-400" />}
                            {isRejected && <XCircle      className="w-4 h-4 text-red-400" />}
                            {isWaiting  && <Clock        className="w-4 h-4 text-civil-muted" />}
                          </div>
                          {/* Action buttons for active step */}
                          {isActive && (
                            <div className="flex gap-1 mt-1.5 justify-center">
                              <button
                                onClick={() => handleAction(approval, step.level, 'approved')}
                                className="text-[9px] bg-green-700 hover:bg-green-600 text-white px-1.5 py-0.5 rounded transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleAction(approval, step.level, 'rejected')}
                                className="text-[9px] bg-red-800 hover:bg-red-700 text-white px-1.5 py-0.5 rounded transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {step.date && (
                            <p className="text-[8px] text-civil-muted mt-0.5">{step.date}</p>
                          )}
                        </div>
                        {idx < approval.workflow.length - 1 && (
                          <ChevronRight className="w-3 h-3 text-civil-border flex-shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-civil-card border border-civil-border rounded-2xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-civil-border flex-shrink-0">
              <h2 className="font-semibold text-civil-text">{editApproval ? 'Edit Request' : 'New Approval Request'}</h2>
              <button onClick={() => setShowModal(false)} className="text-civil-muted hover:text-civil-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Type */}
              <div>
                <label className="text-xs text-civil-muted mb-2 block">Approval Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(approvalTypeConfig) as ApprovalType[]).map(t => {
                    const cfg = approvalTypeConfig[t]
                    return (
                      <button key={t} onClick={() => setAForm(f => ({ ...f, type: t }))}
                        className={clsx(
                          'py-2 rounded-lg border text-xs font-medium transition-colors text-center',
                          aForm.type === t
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
              <div>
                <label className="text-xs text-civil-muted mb-1 block">Title *</label>
                <input className="input" value={aForm.title}
                  onChange={e => setAForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Approval for OPC 43 Cement — Brand XYZ" autoFocus />
              </div>
              <div>
                <label className="text-xs text-civil-muted mb-1 block">Description</label>
                <textarea className="input resize-none" rows={3}
                  value={aForm.description}
                  onChange={e => setAForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Details, specifications, references..." />
              </div>
              <div>
                <label className="text-xs text-civil-muted mb-1 block">Attachment Reference</label>
                <input className="input" value={aForm.attachmentRef}
                  onChange={e => setAForm(f => ({ ...f, attachmentRef: e.target.value }))}
                  placeholder="Drawing no. / document ref" />
              </div>
              {!editApproval && (
                <div>
                  <label className="text-xs text-civil-muted mb-2 block">Approval Levels Required</label>
                  <div className="space-y-1.5">
                    {workflowLevels.map(l => (
                      <div key={l.level} className={clsx(
                        'flex items-center gap-3 px-3 py-2 rounded-lg border text-xs transition-colors',
                        l.level <= aForm.maxLevel
                          ? 'bg-civil-accent/10 border-civil-accent/30 text-civil-accent'
                          : 'bg-civil-surface border-civil-border text-civil-muted'
                      )}>
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-current">
                          {l.level}
                        </span>
                        <span>{l.role}</span>
                        <button
                          className="ml-auto text-[9px] underline"
                          onClick={() => setAForm(f => ({ ...f, maxLevel: l.level }))}
                        >
                          {l.level === aForm.maxLevel ? '✓ Stop here' : 'Set as last'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-civil-border flex gap-3 flex-shrink-0">
              <button onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving || !aForm.title.trim()}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
