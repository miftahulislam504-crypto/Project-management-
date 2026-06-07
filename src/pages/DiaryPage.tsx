import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Activity } from '@/lib/types'
import {
  DiaryEntry, subscribeToDiary,
  totalLaborCount, totalEquipmentCount,
  formatDiaryForPDF,
} from '@/lib/diary-helpers'
import { useProjectStore } from '@/store/useProjectStore'
import DiaryForm from '@/components/diary/DiaryForm'
import DiaryCard from '@/components/diary/DiaryCard'
import {
  BookOpen, Plus, Calendar,
  Users, Wrench, ChevronLeft,
  FileText,
} from 'lucide-react'
import { clsx } from 'clsx'

export default function DiaryPage() {
  const { id: projectId }   = useParams<{ id: string }>()
  const { activeProject }   = useProjectStore()
  const [entries,     setEntries]     = useState<DiaryEntry[]>([])
  const [activities,  setActivities]  = useState<Activity[]>([])
  const [loading,     setLoading]     = useState(true)
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | undefined>()
  const [view, setView]   = useState<'form' | 'history'>('form')

  // Diary entries real-time
  useEffect(() => {
    if (!projectId) return
    return subscribeToDiary(projectId, data => {
      setEntries(data)
      setLoading(false)
    })
  }, [projectId])

  // Activities for form
  useEffect(() => {
    if (!projectId) return
    const q = query(
      collection(db, 'activities'),
      where('projectId', '==', projectId)
    )
    return onSnapshot(q, snap => {
      setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() } as Activity)))
    })
  }, [projectId])

  // When date changes, check if entry exists
  useEffect(() => {
    const existing = entries.find(e => e.date === selectedDate)
    setSelectedEntry(existing)
  }, [selectedDate, entries])

  const activityNames = activities
    .filter(a => a.level === 2)
    .map(a => `${a.code} ${a.name}`)

  // Stats across all entries
  const totalEntries = entries.length
  const totalLabor   = entries.reduce((s, e) => s + totalLaborCount(e), 0)
  const totalEquip   = entries.reduce((s, e) => s + totalEquipmentCount(e), 0)
  const issueCount   = entries.filter(e => e.issues).length

  // Dates that have entries (for calendar indicator)
  const entryDates = new Set(entries.map(e => e.date))

  const handleExportText = () => {
    if (!selectedEntry) return
    const text = formatDiaryForPDF(selectedEntry)
    const blob = new Blob([text], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `SiteDiary_${selectedEntry.date}.txt`
    a.click()
    URL.revokeObjectURL(url)
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-civil-text">Site Diary</h1>
          <p className="text-sm text-civil-muted mt-0.5">
            {activeProject?.name} · {totalEntries} entries
          </p>
        </div>
        <div className="flex gap-2">
          {selectedEntry && (
            <button
              onClick={handleExportText}
              className="btn-ghost flex items-center gap-1.5 text-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total Entries',   value: totalEntries, icon: BookOpen, color: 'text-civil-accent',  bg: 'bg-blue-900/20' },
          { label: 'Total Labor',     value: totalLabor,   icon: Users,    color: 'text-blue-400',       bg: 'bg-blue-900/20' },
          { label: 'Total Equipment', value: totalEquip,   icon: Wrench,   color: 'text-yellow-400',     bg: 'bg-yellow-900/20' },
          { label: 'Days w/ Issues',  value: issueCount,   icon: BookOpen, color: issueCount > 0 ? 'text-orange-400' : 'text-civil-muted', bg: issueCount > 0 ? 'bg-orange-900/20' : 'bg-civil-surface' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card">
            <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center mb-2', bg)}>
              <Icon className={clsx('w-3.5 h-3.5', color)} />
            </div>
            <p className={clsx('text-xl font-bold', color)}>{value}</p>
            <p className="text-xs text-civil-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-civil-surface border border-civil-border rounded-lg p-1 gap-1 mb-4 w-fit">
        {[
          { key: 'form',    label: '📝 Today\'s Entry' },
          { key: 'history', label: '📋 History' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setView(key as any)}
            className={clsx(
              'px-3 py-1.5 rounded text-xs font-medium transition-colors',
              view === key
                ? 'bg-civil-accent text-white'
                : 'text-civil-muted hover:text-civil-text'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── FORM VIEW ── */}
      {view === 'form' && (
        <div className="space-y-4">
          {/* Date selector */}
          <div className="card flex items-center gap-4">
            <Calendar className="w-5 h-5 text-civil-accent flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-civil-muted mb-1">Select Date</p>
              <input
                type="date"
                className="input py-1.5 text-sm w-auto"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            {entryDates.has(selectedDate) && (
              <span className="text-[10px] bg-green-900/30 text-green-400 border border-green-900/40 px-2 py-1 rounded-full">
                ✓ Entry exists
              </span>
            )}
          </div>

          {/* Form */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-civil-border">
              <BookOpen className="w-4 h-4 text-civil-accent" />
              <p className="text-sm font-semibold text-civil-text">
                {selectedDate} — Site Diary
              </p>
              {selectedEntry && (
                <span className="text-[10px] text-civil-muted ml-auto">
                  Last updated: {new Date(selectedEntry.updatedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
            <DiaryForm
              projectId={projectId!}
              date={selectedDate}
              existing={selectedEntry}
              activities={activityNames}
              onSaved={() => {}}
            />
          </div>
        </div>
      )}

      {/* ── HISTORY VIEW ── */}
      {view === 'history' && (
        <div>
          {entries.length === 0 ? (
            <div className="card flex flex-col items-center py-16 text-center">
              <BookOpen className="w-12 h-12 text-civil-border mb-4" />
              <p className="text-civil-text font-semibold">No diary entries yet</p>
              <p className="text-civil-muted text-sm mt-2">
                Start filling in today's diary from the entry tab.
              </p>
              <button
                onClick={() => setView('form')}
                className="btn-primary mt-4 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Today's Entry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {entries.map(entry => (
                <DiaryCard
                  key={entry.id}
                  entry={entry}
                  selected={selectedEntry?.id === entry.id}
                  onSelect={e => {
                    setSelectedEntry(e)
                    setSelectedDate(e.date)
                    setView('form')
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
