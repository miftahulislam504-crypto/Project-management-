import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Activity } from '@/lib/types'
import { CostEntry, calcEVM, subscribeToCostEntries } from '@/lib/cost-helpers'
import { useProjectStore } from '@/store/useProjectStore'
import { useAuthStore }    from '@/store/useAuthStore'
import {
  runFullAutomation, parseEstimateJSON,
  exportToReportsApp, sampleEstimateExport,
  EstimateExport, BridgeResult,
} from '@/lib/ecosystem-bridge'
import {
  Zap, Download, Upload, CheckCircle2,
  AlertTriangle, ArrowRight, RefreshCw,
  Building2, Calculator, BarChart3, FileText,
  ChevronRight, Copy, Check,
} from 'lucide-react'
import { clsx } from 'clsx'

type StepStatus = 'waiting' | 'running' | 'done' | 'error'

interface AutoStep {
  id:     string
  label:  string
  sub:    string
  icon:   any
  status: StepStatus
  result?: string
}

export default function EcosystemPage() {
  const { id: projectId }   = useParams<{ id: string }>()
  const { activeProject }   = useProjectStore()
  const { user }            = useAuthStore()

  const [activities,   setActivities]   = useState<Activity[]>([])
  const [costEntries,  setCostEntries]  = useState<CostEntry[]>([])
  const [loading,      setLoading]      = useState(true)
  const [running,      setRunning]      = useState(false)
  const [result,       setResult]       = useState<BridgeResult | null>(null)
  const [estimateJSON, setEstimateJSON] = useState('')
  const [exportJSON,   setExportJSON]   = useState('')
  const [copied,       setCopied]       = useState(false)
  const [steps, setSteps] = useState<AutoStep[]>([
    { id: 'wbs',  label: 'Generate WBS',        sub: 'Auto-create activity tree',     icon: Building2,   status: 'waiting' },
    { id: 'bud',  label: 'Set Budgets',          sub: 'Map BOQ to activities',         icon: Calculator,  status: 'waiting' },
    { id: 'proc', label: 'Auto Procurement',     sub: 'Generate material list',        icon: BarChart3,   status: 'waiting' },
    { id: 'stat', label: 'Activate Project',     sub: 'Set status to Active',          icon: CheckCircle2,status: 'waiting' },
  ])

  useEffect(() => {
    if (!projectId) return
    const q = query(collection(db, 'activities'), where('projectId', '==', projectId))
    const u1 = onSnapshot(q, s => {
      setActivities(s.docs.map(d => ({ id: d.id, ...d.data() } as Activity)))
      setLoading(false)
    })
    const u2 = subscribeToCostEntries(projectId, setCostEntries)
    return () => { u1(); u2() }
  }, [projectId])

  const totalActual = costEntries.reduce((s, e) => s + e.amount, 0)
  const evm = calcEVM(activities, totalActual)

  const updateStep = (id: string, status: StepStatus, result?: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status, result } : s))
  }

  const handleRunAutomation = async () => {
    if (!projectId) return
    setRunning(true)
    setResult(null)
    setSteps(prev => prev.map(s => ({ ...s, status: 'waiting', result: undefined })))

    try {
      let estimate: EstimateExport | undefined

      // Parse estimate JSON if provided
      if (estimateJSON.trim()) {
        const parsed = parseEstimateJSON(estimateJSON)
        if (parsed) {
          estimate = parsed
        }
      }

      const startDate = activeProject?.startDate ?? new Date().toISOString().split('T')[0]

      // Step 1: WBS
      updateStep('wbs', 'running')
      await new Promise(r => setTimeout(r, 600))
      updateStep('wbs', 'done', 'Activity tree ready')

      // Step 2: Budget
      updateStep('bud', 'running')
      await new Promise(r => setTimeout(r, 400))
      updateStep('bud', estimate ? 'done' : 'done', estimate ? 'BOQ mapped' : 'No estimate provided')

      // Step 3: Procurement
      updateStep('proc', 'running')
      await new Promise(r => setTimeout(r, 500))
      updateStep('proc', 'done', 'Material list generated')

      // Step 4: Activate
      updateStep('stat', 'running')

      const res = await runFullAutomation(projectId, startDate, estimate)

      updateStep('stat', res.success ? 'done' : 'error', res.success ? 'Project activated' : 'Failed')
      setResult(res)

    } catch (err: any) {
      setResult({
        success: false,
        message: err?.message ?? 'Unknown error',
        wbsCreated: 0, procCreated: 0, budgetSet: 0,
      })
      steps.forEach(s => {
        if (s.status === 'running') updateStep(s.id, 'error')
      })
    } finally {
      setRunning(false)
    }
  }

  const handleExport = async () => {
    const json = await exportToReportsApp(
      projectId!, activeProject?.name ?? '',
      activities, totalActual, evm.SPI, evm.CPI
    )
    setExportJSON(json)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(exportJSON)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const loadSampleEstimate = () => {
    setEstimateJSON(JSON.stringify(sampleEstimateExport, null, 2))
  }

  // Project health summary
  const leaves    = activities.filter(a => a.level === 2)
  const overall   = leaves.length > 0
    ? Math.round(leaves.reduce((s, a) => s + a.progress, 0) / leaves.length) : 0
  const budget    = leaves.reduce((s, a) => s + a.plannedCost, 0)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-civil-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-civil-text">Ecosystem Bridge</h1>
        <p className="text-sm text-civil-muted mt-0.5">
          {activeProject?.name} · Connect CivilOS modules
        </p>
      </div>

      {/* Ecosystem flow diagram */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-civil-text mb-4">CivilOS Automation Flow</h2>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
          {[
            { label: 'Architectural',  emoji: '🏛️', color: 'text-purple-400', bg: 'bg-purple-900/20', done: true },
            { label: 'Structural',     emoji: '⚙️', color: 'text-blue-400',   bg: 'bg-blue-900/20',  done: true },
            { label: 'BOQ & Costing',  emoji: '🧮', color: 'text-green-400',  bg: 'bg-green-900/20', done: true },
            { label: 'Auto WBS',       emoji: '🌳', color: 'text-civil-accent',bg: 'bg-blue-900/10', done: activities.length > 0 },
            { label: 'Schedule',       emoji: '📅', color: 'text-civil-accent',bg: 'bg-blue-900/10', done: activities.some(a => a.startDate) },
            { label: 'Procurement',    emoji: '📦', color: 'text-civil-accent',bg: 'bg-blue-900/10', done: false },
            { label: 'Tracking',       emoji: '📊', color: 'text-civil-accent',bg: 'bg-blue-900/10', done: overall > 0 },
            { label: 'Reports',        emoji: '📄', color: 'text-civil-accent',bg: 'bg-blue-900/10', done: false },
          ].map(({ label, emoji, color, bg, done }, i, arr) => (
            <div key={label} className="flex items-center gap-1.5 flex-shrink-0">
              <div className={clsx(
                'flex flex-col items-center px-3 py-2.5 rounded-xl border text-center min-w-[80px] transition-colors',
                done
                  ? `${bg} border-current/20`
                  : 'bg-civil-surface border-civil-border opacity-50'
              )}>
                <span className="text-lg mb-0.5">{emoji}</span>
                <span className={clsx('text-[9px] font-semibold', done ? color : 'text-civil-muted')}>
                  {label}
                </span>
                {done && <CheckCircle2 className={clsx('w-3 h-3 mt-0.5', color)} />}
              </div>
              {i < arr.length - 1 && (
                <ChevronRight className="w-3 h-3 text-civil-border flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Project snapshot */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Progress',     value: `${overall}%`,                             color: 'text-civil-accent' },
          { label: 'Activities',   value: leaves.length,                              color: 'text-blue-400' },
          { label: 'Budget',       value: `৳${(budget/100000).toFixed(1)}L`,          color: 'text-yellow-400' },
          { label: 'Delayed',      value: leaves.filter(a => a.status === 'delayed').length, color: 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className={clsx('text-xl font-bold', color)}>{value}</p>
            <p className="text-xs text-civil-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── IMPORT / AUTOMATION ── */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-civil-text flex items-center gap-2">
            <Upload className="w-4 h-4 text-civil-accent" />
            Import & Automate
          </h2>

          {/* Estimate JSON import */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-civil-text">Estimate JSON (Optional)</p>
              <button
                onClick={loadSampleEstimate}
                className="text-[10px] text-civil-accent hover:text-blue-300 transition-colors"
              >
                Load sample
              </button>
            </div>
            <textarea
              className="input resize-none font-mono text-[10px]"
              rows={6}
              value={estimateJSON}
              onChange={e => setEstimateJSON(e.target.value)}
              placeholder={'Paste CivilOS Estimate JSON here...\n{\n  "projectName": "...",\n  "items": [...]\n}'}
            />
            <p className="text-[10px] text-civil-muted">
              Paste exported JSON from CivilOS Estimate App to auto-map BOQ to activities.
            </p>
          </div>

          {/* Automation steps */}
          <div className="card space-y-2">
            <p className="text-xs font-semibold text-civil-text mb-3">Automation Steps</p>
            {steps.map(step => {
              const Icon = step.icon
              return (
                <div key={step.id} className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors',
                  step.status === 'done'    && 'bg-green-900/10 border-green-900/30',
                  step.status === 'running' && 'bg-civil-accent/10 border-civil-accent/30',
                  step.status === 'error'   && 'bg-red-900/10 border-red-900/30',
                  step.status === 'waiting' && 'bg-civil-surface border-civil-border',
                )}>
                  <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                    step.status === 'done'    && 'bg-green-900/30',
                    step.status === 'running' && 'bg-civil-accent/20',
                    step.status === 'error'   && 'bg-red-900/30',
                    step.status === 'waiting' && 'bg-civil-surface',
                  )}>
                    {step.status === 'running' ? (
                      <RefreshCw className="w-3.5 h-3.5 text-civil-accent animate-spin" />
                    ) : step.status === 'done' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    ) : step.status === 'error' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <Icon className="w-3.5 h-3.5 text-civil-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={clsx('text-xs font-medium',
                      step.status === 'done'    ? 'text-green-400' :
                      step.status === 'running' ? 'text-civil-accent' :
                      step.status === 'error'   ? 'text-red-400' : 'text-civil-muted'
                    )}>
                      {step.label}
                    </p>
                    <p className="text-[10px] text-civil-muted">
                      {step.result ?? step.sub}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Run button */}
          <button
            onClick={handleRunAutomation}
            disabled={running}
            className={clsx(
              'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all',
              running
                ? 'bg-civil-accent/20 border border-civil-accent/40 text-civil-accent'
                : 'bg-civil-accent hover:bg-blue-400 text-white shadow-lg shadow-civil-accent/20'
            )}
          >
            {running ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {running ? 'Running Automation...' : 'Run Full Automation'}
          </button>

          {/* Result */}
          {result && (
            <div className={clsx(
              'card border',
              result.success ? 'border-green-900/40 bg-green-900/10' : 'border-red-900/40 bg-red-900/10'
            )}>
              <div className="flex items-center gap-2 mb-2">
                {result.success
                  ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                  : <AlertTriangle className="w-4 h-4 text-red-400" />
                }
                <p className={clsx('text-sm font-semibold',
                  result.success ? 'text-green-400' : 'text-red-400'
                )}>
                  {result.success ? 'Automation Successful!' : 'Automation Failed'}
                </p>
              </div>
              <p className="text-xs text-civil-muted">{result.message}</p>
              {result.success && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[
                    { label: 'WBS Items',     value: result.wbsCreated },
                    { label: 'Proc. Items',   value: result.procCreated },
                    { label: 'Budgets Set',   value: result.budgetSet },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-civil-card rounded-lg p-2 text-center">
                      <p className="text-sm font-bold text-civil-accent">{value}</p>
                      <p className="text-[10px] text-civil-muted">{label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── EXPORT ── */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-civil-text flex items-center gap-2">
            <Download className="w-4 h-4 text-green-400" />
            Export to Reports App
          </h2>

          {/* Export card */}
          <div className="card space-y-3">
            <p className="text-xs text-civil-muted">
              Export current project data as JSON to use in CivilOS Reports App or share with other CivilOS modules.
            </p>

            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-green-900/30 bg-green-900/10 text-green-400 text-sm font-semibold hover:bg-green-900/20 transition-colors"
            >
              <Download className="w-4 h-4" />
              Generate Export
            </button>

            {exportJSON && (
              <>
                <div className="relative">
                  <textarea
                    className="input resize-none font-mono text-[10px] h-48"
                    value={exportJSON}
                    readOnly
                  />
                  <button
                    onClick={handleCopy}
                    className="absolute top-2 right-2 flex items-center gap-1 text-[10px] bg-civil-surface border border-civil-border text-civil-muted hover:text-civil-accent px-2 py-1 rounded transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-[10px] text-civil-muted">
                  Copy and paste this JSON into CivilOS Reports App.
                </p>
              </>
            )}
          </div>

          {/* Integration info */}
          <div className="card space-y-3">
            <p className="text-xs font-semibold text-civil-text">Connected Modules</p>
            {[
              { name: 'CivilOS Structural', status: 'available', emoji: '⚙️', desc: 'Import structural data' },
              { name: 'CivilOS Estimate',   status: 'available', emoji: '🧮', desc: 'Import BOQ & costs' },
              { name: 'CivilOS Design',     status: 'coming',    emoji: '🏛️', desc: 'Floor plan integration' },
              { name: 'CivilOS Reports',    status: 'available', emoji: '📄', desc: 'Export project data' },
            ].map(({ name, status, emoji, desc }) => (
              <div key={name} className="flex items-center gap-3">
                <span className="text-xl">{emoji}</span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-civil-text">{name}</p>
                  <p className="text-[10px] text-civil-muted">{desc}</p>
                </div>
                <span className={clsx(
                  'text-[10px] px-2 py-0.5 rounded-full font-medium',
                  status === 'available' ? 'bg-green-900/20 text-green-400' : 'bg-civil-surface text-civil-muted'
                )}>
                  {status === 'available' ? 'Ready' : 'Soon'}
                </span>
              </div>
            ))}
          </div>

          {/* Future AI note */}
          <div className="card bg-civil-accent/5 border-civil-accent/20">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-civil-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-civil-accent">Future: AI Project Manager</p>
                <p className="text-[10px] text-civil-muted mt-1">
                  "কেন project delay হচ্ছে?" — AI will analyze schedule, resources, and procurement to give actionable answers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
