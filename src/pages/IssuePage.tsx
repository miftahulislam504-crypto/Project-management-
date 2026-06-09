import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useProjectStore } from '@/store/useProjectStore'
import { useAuthStore } from '@/store/useAuthStore'
import {
  SiteIssue, Risk, IssueType, IssueSeverity, IssueStatus,
  RiskImpact, RiskProbability, RiskStatus,
  issueTypeConfig, severityConfig, issueStatusConfig,
  riskLevel, calcRiskScore, impactScore, probabilityScore,
  addIssue, updateIssue, deleteIssue, subIssues,
  addRisk, updateRisk, deleteRisk, subRisks,
} from '@/lib/issue-helpers'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  Plus, X, Save, Trash2, AlertTriangle,
  Shield, CheckCircle2, Clock, ChevronDown,
} from 'lucide-react'
import { clsx } from 'clsx'

type Tab = 'issues' | 'risks'

export default function IssuePage() {
  const { id: projectId }    = useParams<{ id: string }>()
  const { activeProject }    = useProjectStore()
  const { user }             = useAuthStore()
  const [tab,       setTab]  = useState<Tab>('issues')
  const [issues,    setIssues]  = useState<SiteIssue[]>([])
  const [risks,     setRisks]   = useState<Risk[]>([])
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [showRiskModal,  setShowRiskModal]  = useState(false)
  const [editIssue, setEditIssue] = useState<SiteIssue | null>(null)
  const [editRisk,  setEditRisk]  = useState<Risk | null>(null)
  const [saving,    setSaving]    = useState(false)

  // Issue form state
  const [iForm, setIForm] = useState({
    type: 'site' as IssueType, title: '', description: '',
    severity: 'medium' as IssueSeverity, assignedTo: '',
    reportedDate: new Date().toISOString().split('T')[0],
    resolvedDate: '', remarks: '',
  })

  // Risk form state
  const [rForm, setRForm] = useState({
    title: '', description: '', category: '',
    impact: 'medium' as RiskImpact,
    probability: 'possible' as RiskProbability,
    mitigation: '', owner: '', status: 'open' as RiskStatus,
  })

  useEffect(() => {
    if (!projectId) return
    const u1 = subIssues(projectId, setIssues)
    const u2  = subRisks(projectId,  setRisks)
    return () => { u1(); u2() }
  }, [projectId])

  // ── Issue handlers ─────────────────────────────────────
  const openIssueModal = (issue?: SiteIssue) => {
    if (issue) {
      setEditIssue(issue)
      setIForm({
        type: issue.type, title: issue.title,
        description: issue.description, severity: issue.severity,
        assignedTo: issue.assignedTo,
        reportedDate: issue.reportedDate,
        resolvedDate: issue.resolvedDate, remarks: issue.remarks,
      })
    } else {
      setEditIssue(null)
      setIForm({ type: 'site', title: '', description: '', severity: 'medium', assignedTo: '',
        reportedDate: new Date().toISOString().split('T')[0], resolvedDate: '', remarks: '' })
    }
    setShowIssueModal(true)
  }

  const saveIssue = async () => {
    if (!iForm.title.trim()) return
    setSaving(true)
    try {
      const data = {
        projectId: projectId!,
        ...iForm,
        status: (editIssue?.status ?? 'open') as IssueStatus,
        reportedBy: user?.displayName ?? '',
        createdAt: editIssue?.createdAt ?? new Date().toISOString(),
      }
      if (editIssue) await updateIssue(editIssue.id, data)
      else await addIssue(data as Omit<SiteIssue, 'id'>)
      setShowIssueModal(false)
    } finally { setSaving(false) }
  }

  // ── Risk handlers ──────────────────────────────────────
  const openRiskModal = (risk?: Risk) => {
    if (risk) {
      setEditRisk(risk)
      setRForm({
        title: risk.title, description: risk.description, category: risk.category,
        impact: risk.impact, probability: risk.probability,
        mitigation: risk.mitigation, owner: risk.owner, status: risk.status,
      })
    } else {
      setEditRisk(null)
      setRForm({ title: '', description: '', category: '', impact: 'medium',
        probability: 'possible', mitigation: '', owner: '', status: 'open' })
    }
    setShowRiskModal(true)
  }

  const saveRisk = async () => {
    if (!rForm.title.trim()) return
    setSaving(true)
    try {
      const data = {
        projectId: projectId!,
        ...rForm,
        riskScore: calcRiskScore(rForm.impact, rForm.probability),
        createdAt: editRisk?.createdAt ?? new Date().toISOString(),
      }
      if (editRisk) await updateRisk(editRisk.id, data)
      else await addRisk(data as Omit<Risk, 'id'>)
      setShowRiskModal(false)
    } finally { setSaving(false) }
  }

  // ── Stats ──────────────────────────────────────────────
  const issueStats = {
    open:   issues.filter(i => i.status === 'open').length,
    inProg: issues.filter(i => i.status === 'in-progress').length,
    closed: issues.filter(i => i.status === 'closed').length,
  }

  const riskChartData = [
    { name: 'Critical', count: risks.filter(r => r.riskScore >= 12).length, fill: '#ef4444' },
    { name: 'High',     count: risks.filter(r => r.riskScore >= 8 && r.riskScore < 12).length, fill: '#f97316' },
    { name: 'Medium',   count: risks.filter(r => r.riskScore >= 4 && r.riskScore < 8).length,  fill: '#f59e0b' },
    { name: 'Low',      count: risks.filter(r => r.riskScore < 4).length,  fill: '#22c55e' },
  ]

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-civil-text">Issues & Risk</h1>
          <p className="text-sm text-civil-muted mt-0.5">{activeProject?.name}</p>
        </div>
        <button
          onClick={() => tab === 'issues' ? openIssueModal() : openRiskModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {tab === 'issues' ? 'New Issue' : 'New Risk'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-civil-surface border border-civil-border rounded-lg p-1 gap-1 mb-4 w-fit">
        {[
          { key: 'issues', label: `⚠️ Issues (${issues.length})` },
          { key: 'risks',  label: `🔴 Risks (${risks.length})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key as Tab)}
            className={clsx('px-3 py-1.5 rounded text-xs font-medium transition-colors',
              tab === key ? 'bg-civil-accent text-white' : 'text-civil-muted hover:text-civil-text'
            )}>{label}</button>
        ))}
      </div>

      {/* ── ISSUES TAB ── */}
      {tab === 'issues' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Open',        count: issueStats.open,   color: 'text-red-400',    bg: 'bg-red-900/20',    icon: AlertTriangle },
              { label: 'In Progress', count: issueStats.inProg, color: 'text-yellow-400', bg: 'bg-yellow-900/20', icon: Clock },
              { label: 'Closed',      count: issueStats.closed, color: 'text-green-400',  bg: 'bg-green-900/20',  icon: CheckCircle2 },
            ].map(({ label, count, color, bg, icon: Icon }) => (
              <div key={label} className="card text-center">
                <Icon className={clsx('w-5 h-5 mx-auto mb-1', color)} />
                <p className={clsx('text-2xl font-bold', color)}>{count}</p>
                <p className="text-xs text-civil-muted">{label}</p>
              </div>
            ))}
          </div>

          {/* Issue list */}
          {issues.length === 0 ? (
            <div className="card flex flex-col items-center py-16 text-center">
              <AlertTriangle className="w-10 h-10 text-civil-border mb-3" />
              <p className="text-civil-text font-semibold">No issues logged</p>
              <p className="text-civil-muted text-xs mt-1">Click "New Issue" to log a site issue</p>
            </div>
          ) : (
            <div className="space-y-2">
              {issues.map(issue => {
                const type = issueTypeConfig[issue.type]
                const sev  = severityConfig[issue.severity]
                const stat = issueStatusConfig[issue.status]
                return (
                  <div key={issue.id} className="card hover:border-civil-accent/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0">{type.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-civil-text">{issue.title}</p>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-medium', sev.bg, sev.color)}>{sev.label}</span>
                            <span className={clsx('text-[10px] px-2 py-0.5 rounded-full border font-medium', stat.bg, stat.color, stat.border)}>{stat.label}</span>
                          </div>
                        </div>
                        {issue.description && <p className="text-xs text-civil-muted mt-1 line-clamp-2">{issue.description}</p>}
                        <div className="flex items-center gap-4 mt-2 text-[10px] text-civil-muted">
                          <span>{type.label}</span>
                          <span>Reported: {issue.reportedDate}</span>
                          {issue.assignedTo && <span>→ {issue.assignedTo}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {/* Status quick change */}
                        <select
                          value={issue.status}
                          onChange={e => updateIssue(issue.id, { status: e.target.value as IssueStatus })}
                          className="text-[10px] bg-civil-surface border border-civil-border text-civil-muted rounded px-1.5 py-1 cursor-pointer"
                          onClick={e => e.stopPropagation()}
                        >
                          <option value="open">Open</option>
                          <option value="in-progress">In Progress</option>
                          <option value="closed">Closed</option>
                        </select>
                        <button onClick={() => openIssueModal(issue)}
                          className="p-1.5 text-civil-muted hover:text-civil-accent hover:bg-civil-accent/10 rounded transition-colors">
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteIssue(issue.id)}
                          className="p-1.5 text-civil-muted hover:text-red-400 hover:bg-red-900/10 rounded transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── RISKS TAB ── */}
      {tab === 'risks' && (
        <div className="space-y-4">
          {/* Risk chart */}
          {risks.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-civil-text mb-3">Risk Distribution</h3>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskChartData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 8, fontSize: 11 }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="count" name="Risks" radius={[4,4,0,0]}>
                      {riskChartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Risk register */}
          {risks.length === 0 ? (
            <div className="card flex flex-col items-center py-16 text-center">
              <Shield className="w-10 h-10 text-civil-border mb-3" />
              <p className="text-civil-text font-semibold">No risks registered</p>
              <p className="text-civil-muted text-xs mt-1">Click "New Risk" to add to the risk register</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-civil-surface border-b border-civil-border">
                      {['Risk', 'Category', 'Impact', 'Probability', 'Score', 'Level', 'Mitigation', 'Status', ''].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-civil-muted font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {risks.map((risk, i) => {
                      const level = riskLevel(risk.riskScore)
                      return (
                        <tr key={risk.id} className={clsx('border-b border-civil-border/40 hover:bg-civil-surface/40 group', i % 2 === 0 ? '' : 'bg-civil-surface/10')}>
                          <td className="px-3 py-2.5">
                            <p className="font-medium text-civil-text max-w-[140px] truncate">{risk.title}</p>
                          </td>
                          <td className="px-3 py-2.5 text-civil-muted">{risk.category || '—'}</td>
                          <td className="px-3 py-2.5 capitalize text-civil-text">{risk.impact}</td>
                          <td className="px-3 py-2.5 capitalize text-civil-text">{risk.probability}</td>
                          <td className="px-3 py-2.5 font-bold text-civil-accent">{risk.riskScore}</td>
                          <td className="px-3 py-2.5">
                            <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-medium', level.bg, level.color)}>{level.label}</span>
                          </td>
                          <td className="px-3 py-2.5 text-civil-muted max-w-[160px] truncate">{risk.mitigation || '—'}</td>
                          <td className="px-3 py-2.5">
                            <select value={risk.status}
                              onChange={e => updateRisk(risk.id, { status: e.target.value as RiskStatus })}
                              className="text-[10px] bg-civil-surface border border-civil-border text-civil-muted rounded px-1.5 py-1 cursor-pointer capitalize"
                            >
                              {['open','mitigated','accepted','closed'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openRiskModal(risk)} className="p-1 text-civil-muted hover:text-civil-accent rounded transition-colors">
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => deleteRisk(risk.id)} className="p-1 text-civil-muted hover:text-red-400 rounded transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ISSUE MODAL ── */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-civil-card border border-civil-border rounded-2xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-civil-border flex-shrink-0">
              <h2 className="font-semibold text-civil-text">{editIssue ? 'Edit Issue' : 'New Issue'}</h2>
              <button onClick={() => setShowIssueModal(false)} className="text-civil-muted hover:text-civil-text"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Type */}
              <div>
                <label className="text-xs text-civil-muted mb-2 block">Issue Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(issueTypeConfig) as IssueType[]).map(t => {
                    const cfg = issueTypeConfig[t]
                    return (
                      <button key={t} onClick={() => setIForm(f => ({ ...f, type: t }))}
                        className={clsx('py-2 rounded-lg border text-xs font-medium transition-colors text-center',
                          iForm.type === t ? `${cfg.bg} ${cfg.color} border-current` : 'bg-civil-surface border-civil-border text-civil-muted')}>
                        <div>{cfg.emoji}</div>
                        <div>{cfg.label}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs text-civil-muted mb-1 block">Title *</label>
                <input className="input" value={iForm.title} onChange={e => setIForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief issue description" autoFocus />
              </div>
              <div>
                <label className="text-xs text-civil-muted mb-1 block">Description</label>
                <textarea className="input resize-none" rows={3} value={iForm.description} onChange={e => setIForm(f => ({ ...f, description: e.target.value }))} placeholder="Detailed description..." />
              </div>
              {/* Severity */}
              <div>
                <label className="text-xs text-civil-muted mb-2 block">Severity</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(severityConfig) as IssueSeverity[]).map(s => {
                    const cfg = severityConfig[s]
                    return (
                      <button key={s} onClick={() => setIForm(f => ({ ...f, severity: s }))}
                        className={clsx('py-1.5 rounded-lg border text-xs font-medium capitalize transition-colors',
                          iForm.severity === s ? `${cfg.bg} ${cfg.color} border-current` : 'bg-civil-surface border-civil-border text-civil-muted')}>
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-civil-muted mb-1 block">Assigned To</label>
                  <input className="input" value={iForm.assignedTo} onChange={e => setIForm(f => ({ ...f, assignedTo: e.target.value }))} placeholder="Name" />
                </div>
                <div>
                  <label className="text-xs text-civil-muted mb-1 block">Reported Date</label>
                  <input type="date" className="input" value={iForm.reportedDate} onChange={e => setIForm(f => ({ ...f, reportedDate: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-civil-border flex gap-3 flex-shrink-0">
              <button onClick={() => setShowIssueModal(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={saveIssue} disabled={saving || !iForm.title.trim()}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RISK MODAL ── */}
      {showRiskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-civil-card border border-civil-border rounded-2xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-civil-border flex-shrink-0">
              <h2 className="font-semibold text-civil-text">{editRisk ? 'Edit Risk' : 'New Risk'}</h2>
              <button onClick={() => setShowRiskModal(false)} className="text-civil-muted hover:text-civil-text"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              <div>
                <label className="text-xs text-civil-muted mb-1 block">Risk Title *</label>
                <input className="input" value={rForm.title} onChange={e => setRForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Steel delivery delay" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-civil-muted mb-1 block">Category</label>
                  <input className="input" value={rForm.category} onChange={e => setRForm(f => ({ ...f, category: e.target.value }))} placeholder="Schedule / Cost / Safety" />
                </div>
                <div>
                  <label className="text-xs text-civil-muted mb-1 block">Owner</label>
                  <input className="input" value={rForm.owner} onChange={e => setRForm(f => ({ ...f, owner: e.target.value }))} placeholder="Responsible person" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-civil-muted mb-1 block">Impact</label>
                  <select className="input" value={rForm.impact} onChange={e => setRForm(f => ({ ...f, impact: e.target.value as RiskImpact }))}>
                    {(['low','medium','high','critical'] as RiskImpact[]).map(v => <option key={v} value={v} className="capitalize">{v} ({impactScore[v]})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-civil-muted mb-1 block">Probability</label>
                  <select className="input" value={rForm.probability} onChange={e => setRForm(f => ({ ...f, probability: e.target.value as RiskProbability }))}>
                    {(['rare','unlikely','possible','likely','certain'] as RiskProbability[]).map(v => <option key={v} value={v} className="capitalize">{v} ({probabilityScore[v]})</option>)}
                  </select>
                </div>
              </div>
              {/* Risk score preview */}
              <div className={clsx('rounded-lg px-4 py-2.5 flex items-center justify-between border',
                riskLevel(calcRiskScore(rForm.impact, rForm.probability)).bg,
                'border-current/20'
              )}>
                <span className="text-xs text-civil-muted">Risk Score</span>
                <div className="flex items-center gap-2">
                  <span className={clsx('text-xl font-bold', riskLevel(calcRiskScore(rForm.impact, rForm.probability)).color)}>
                    {calcRiskScore(rForm.impact, rForm.probability)}
                  </span>
                  <span className={clsx('text-xs font-semibold', riskLevel(calcRiskScore(rForm.impact, rForm.probability)).color)}>
                    {riskLevel(calcRiskScore(rForm.impact, rForm.probability)).label}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs text-civil-muted mb-1 block">Mitigation Plan</label>
                <textarea className="input resize-none" rows={3} value={rForm.mitigation}
                  onChange={e => setRForm(f => ({ ...f, mitigation: e.target.value }))}
                  placeholder="How to reduce or eliminate this risk..." />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-civil-border flex gap-3 flex-shrink-0">
              <button onClick={() => setShowRiskModal(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={saveRisk} disabled={saving || !rForm.title.trim()}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
