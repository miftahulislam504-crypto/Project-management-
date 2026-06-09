import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Activity } from '@/lib/types'
import { CostEntry, calcEVM, subscribeToCostEntries } from '@/lib/cost-helpers'
import { ProgressUpdate, subscribeToProgressUpdates } from '@/lib/progress-helpers'
import { DiaryEntry, subscribeToDiary } from '@/lib/diary-helpers'
import { useProjectStore } from '@/store/useProjectStore'
import { useAuthStore } from '@/store/useAuthStore'
import {
  ReportType,
  generateProgressReport,
  generateCostReport,
  generateDailyReport,
  generateScheduleExcel,
  generateCostExcel,
} from '@/lib/report-helpers'
import {
  FileText, FileSpreadsheet, Download,
  BarChart3, DollarSign, Calendar,
  Clock, TrendingUp, AlertTriangle,
} from 'lucide-react'
import { clsx } from 'clsx'

interface ReportCard {
  type:     ReportType
  title:    string
  desc:     string
  icon:     any
  color:    string
  bg:       string
  formats:  ('pdf' | 'excel')[]
}

const reportCards: ReportCard[] = [
  {
    type: 'progress', title: 'Progress Report',
    desc: 'Activity status, EVM metrics, completion %',
    icon: TrendingUp, color: 'text-civil-accent', bg: 'bg-blue-900/20',
    formats: ['pdf'],
  },
  {
    type: 'cost', title: 'Cost Report',
    desc: 'Budget vs actual, cost entries, CPI/EAC',
    icon: DollarSign, color: 'text-yellow-400', bg: 'bg-yellow-900/20',
    formats: ['pdf', 'excel'],
  },
  {
    type: 'daily', title: 'Daily Site Report',
    desc: 'Site diary entries, labor, equipment, issues',
    icon: Calendar, color: 'text-green-400', bg: 'bg-green-900/20',
    formats: ['pdf'],
  },
  {
    type: 'weekly', title: 'Weekly Report',
    desc: 'Week-wise site diary summary',
    icon: Clock, color: 'text-purple-400', bg: 'bg-purple-900/20',
    formats: ['pdf'],
  },
  {
    type: 'delay', title: 'Delay Report',
    desc: 'Delayed activities, schedule variance',
    icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-900/20',
    formats: ['pdf', 'excel'],
  },
  {
    type: 'resource', title: 'Schedule Export',
    desc: 'Full activity schedule with dates, progress',
    icon: BarChart3, color: 'text-orange-400', bg: 'bg-orange-900/20',
    formats: ['excel'],
  },
]

export default function ReportPage() {
  const { id: projectId }   = useParams<{ id: string }>()
  const { activeProject }   = useProjectStore()
  const { user }            = useAuthStore()

  const [activities,   setActivities]   = useState<Activity[]>([])
  const [costEntries,  setCostEntries]  = useState<CostEntry[]>([])
  const [updates,      setUpdates]      = useState<ProgressUpdate[]>([])
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([])
  const [loading,      setLoading]      = useState(true)
  const [generating,   setGenerating]   = useState<string | null>(null)

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (!projectId) return
    const q = query(collection(db, 'activities'), where('projectId', '==', projectId))
    const u1 = onSnapshot(q, s => {
      setActivities(s.docs.map(d => ({ id: d.id, ...d.data() } as Activity)))
      setLoading(false)
    })
    const u2 = subscribeToCostEntries(projectId, setCostEntries)
    const u3 = subscribeToProgressUpdates(projectId, setUpdates)
    const u4 = subscribeToDiary(projectId, setDiaryEntries)
    return () => { u1(); u2(); u3(); u4() }
  }, [projectId])

  const config = {
    projectName: activeProject?.name ?? '',
    projectId:   projectId ?? '',
    dateFrom,
    dateTo,
    preparedBy:  user?.displayName ?? '',
  }

  const totalActual = costEntries.reduce((s, e) => s + e.amount, 0)
  const evm = calcEVM(activities, totalActual)

  // Filter entries by date range
  const filteredDiary = diaryEntries.filter(e => e.date >= dateFrom && e.date <= dateTo)

  const handleGenerate = async (type: ReportType, format: 'pdf' | 'excel') => {
    const key = `${type}_${format}`
    setGenerating(key)
    try {
      await new Promise(r => setTimeout(r, 500)) // UI feedback

      if (format === 'pdf') {
        if (type === 'progress') generateProgressReport({ ...config, type }, activities, updates, evm)
        if (type === 'cost')     generateCostReport({ ...config, type }, costEntries, evm)
        if (type === 'daily' || type === 'weekly') generateDailyReport({ ...config, type }, filteredDiary)
        if (type === 'delay') {
          const delayed = activities.filter(a => a.level === 2 && a.status === 'delayed')
          generateProgressReport({ ...config, type }, delayed, updates, evm)
        }
      }

      if (format === 'excel') {
        if (type === 'resource') generateScheduleExcel(config.projectName, activities)
        if (type === 'cost' || type === 'delay') generateCostExcel(config.projectName, costEntries, evm)
      }
    } finally {
      setGenerating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-civil-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-civil-text">Reports</h1>
        <p className="text-sm text-civil-muted mt-0.5">
          {activeProject?.name} · Generate PDF & Excel reports
        </p>
      </div>

      {/* Date range selector */}
      <div className="card mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-civil-accent" />
          <span className="text-sm font-medium text-civil-text">Report Period</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="text-[10px] text-civil-muted mb-0.5 block">From</label>
            <input
              type="date" className="input py-1.5 text-xs w-auto"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
          </div>
          <span className="text-civil-muted text-sm">→</span>
          <div>
            <label className="text-[10px] text-civil-muted mb-0.5 block">To</label>
            <input
              type="date" className="input py-1.5 text-xs w-auto"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>
        </div>

        {/* Quick ranges */}
        <div className="flex gap-2 ml-auto">
          {[
            { label: 'Today',     days: 0 },
            { label: 'This Week', days: 7 },
            { label: 'This Month',days: 30 },
          ].map(({ label, days }) => (
            <button
              key={label}
              onClick={() => {
                const to   = new Date()
                const from = new Date()
                from.setDate(from.getDate() - days)
                setDateTo(to.toISOString().split('T')[0])
                setDateFrom(from.toISOString().split('T')[0])
              }}
              className="text-[10px] px-2.5 py-1 rounded-full border border-civil-border text-civil-muted hover:text-civil-accent hover:border-civil-accent/40 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Data summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Activities', value: activities.filter(a => a.level === 2).length, color: 'text-civil-accent' },
          { label: 'Cost Entries', value: costEntries.length, color: 'text-yellow-400' },
          { label: 'Diary Entries', value: filteredDiary.length, color: 'text-green-400' },
          { label: 'Progress Updates', value: updates.length, color: 'text-purple-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className={clsx('text-xl font-bold', color)}>{value}</p>
            <p className="text-xs text-civil-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Report cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.type} className="card hover:border-civil-accent/30 transition-colors">
              <div className="flex items-start gap-3 mb-3">
                <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', card.bg)}>
                  <Icon className={clsx('w-4.5 h-4.5', card.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-civil-text">{card.title}</p>
                  <p className="text-xs text-civil-muted mt-0.5">{card.desc}</p>
                </div>
              </div>

              {/* Export buttons */}
              <div className="flex gap-2">
                {card.formats.includes('pdf') && (
                  <button
                    onClick={() => handleGenerate(card.type, 'pdf')}
                    disabled={generating !== null}
                    className={clsx(
                      'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all border',
                      generating === `${card.type}_pdf`
                        ? 'bg-civil-accent/20 border-civil-accent/40 text-civil-accent'
                        : 'bg-red-900/20 border-red-900/30 text-red-400 hover:bg-red-900/30'
                    )}
                  >
                    {generating === `${card.type}_pdf` ? (
                      <span className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                    PDF
                  </button>
                )}
                {card.formats.includes('excel') && (
                  <button
                    onClick={() => handleGenerate(card.type, 'excel')}
                    disabled={generating !== null}
                    className={clsx(
                      'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all border',
                      generating === `${card.type}_excel`
                        ? 'bg-civil-accent/20 border-civil-accent/40 text-civil-accent'
                        : 'bg-green-900/20 border-green-900/30 text-green-400 hover:bg-green-900/30'
                    )}
                  >
                    {generating === `${card.type}_excel` ? (
                      <span className="w-3.5 h-3.5 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    )}
                    Excel
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Note */}
      <div className="mt-6 card bg-civil-surface/50 border-civil-border/50">
        <p className="text-xs text-civil-muted flex items-center gap-2">
          <Download className="w-3.5 h-3.5 flex-shrink-0" />
          Reports are generated locally and downloaded to your device. No server upload required.
        </p>
      </div>
    </div>
  )
}
