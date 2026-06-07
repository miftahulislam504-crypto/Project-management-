import { useState, useEffect } from 'react'
import {
  DiaryEntry, WeatherCondition, WorkStatus,
  LaborEntry, EquipmentEntry, MaterialEntry,
  weatherConfig, workStatusConfig,
  commonTrades, commonEquipment,
  saveDiaryEntry,
} from '@/lib/diary-helpers'
import { useAuthStore } from '@/store/useAuthStore'
import {
  Plus, X, Save, CheckCircle2,
  Cloud, Users, Wrench, Package,
  Activity, AlertTriangle, Shield, MessageSquare
} from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  projectId:  string
  date:       string
  existing?:  DiaryEntry
  activities: string[]    // activity names from WBS
  onSaved:    () => void
}

function emptyEntry(projectId: string, date: string, by: string): Omit<DiaryEntry, 'id'> {
  return {
    projectId,
    date,
    weather:         'sunny',
    temperature:     30,
    workStatus:      'full-day',
    laborEntries:    [],
    equipEntries:    [],
    materialEntries: [],
    activitiesWorked: [],
    issues:          '',
    safetyNotes:     '',
    visitorNotes:    '',
    generalRemarks:  '',
    preparedBy:      by,
    createdAt:       new Date().toISOString(),
    updatedAt:       new Date().toISOString(),
  }
}

export default function DiaryForm({ projectId, date, existing, activities, onSaved }: Props) {
  const { user }              = useAuthStore()
  const [form,   setForm]     = useState<Omit<DiaryEntry, 'id'>>(
    existing ?? emptyEntry(projectId, date, user?.displayName ?? '')
  )
  const [saving, setSaving]   = useState(false)
  const [saved,  setSaved]    = useState(false)
  const [section, setSection] = useState<'weather'|'labor'|'equip'|'material'|'activity'|'notes'>('weather')

  useEffect(() => {
    if (existing) setForm({ ...existing })
  }, [existing?.id])

  const update = (field: keyof typeof form, value: any) =>
    setForm(f => ({ ...f, [field]: value }))

  // ── Labor ──
  const addLabor = () =>
    update('laborEntries', [...form.laborEntries, { trade: '', count: 1, overtime: 0 }])

  const updateLabor = (idx: number, field: keyof LaborEntry, val: any) =>
    update('laborEntries', form.laborEntries.map((l, i) =>
      i === idx ? { ...l, [field]: val } : l
    ))

  const removeLabor = (idx: number) =>
    update('laborEntries', form.laborEntries.filter((_, i) => i !== idx))

  // ── Equipment ──
  const addEquip = () =>
    update('equipEntries', [...form.equipEntries, { name: '', count: 1, hours: 8 }])

  const updateEquip = (idx: number, field: keyof EquipmentEntry, val: any) =>
    update('equipEntries', form.equipEntries.map((e, i) =>
      i === idx ? { ...e, [field]: val } : e
    ))

  const removeEquip = (idx: number) =>
    update('equipEntries', form.equipEntries.filter((_, i) => i !== idx))

  // ── Material ──
  const addMaterial = () =>
    update('materialEntries', [...form.materialEntries, { name: '', quantity: 0, unit: 'bag', supplier: '' }])

  const updateMaterial = (idx: number, field: keyof MaterialEntry, val: any) =>
    update('materialEntries', form.materialEntries.map((m, i) =>
      i === idx ? { ...m, [field]: val } : m
    ))

  const removeMaterial = (idx: number) =>
    update('materialEntries', form.materialEntries.filter((_, i) => i !== idx))

  // ── Activities ──
  const toggleActivity = (name: string) => {
    const list = form.activitiesWorked
    update('activitiesWorked',
      list.includes(name) ? list.filter(a => a !== name) : [...list, name]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveDiaryEntry({ ...form, updatedAt: new Date().toISOString() })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  const sections = [
    { key: 'weather',  label: 'Weather',    icon: Cloud },
    { key: 'labor',    label: 'Labor',      icon: Users },
    { key: 'equip',    label: 'Equipment',  icon: Wrench },
    { key: 'material', label: 'Material',   icon: Package },
    { key: 'activity', label: 'Activities', icon: Activity },
    { key: 'notes',    label: 'Notes',      icon: MessageSquare },
  ] as const

  return (
    <div className="space-y-4">
      {/* Section tabs */}
      <div className="flex gap-1 flex-wrap">
        {sections.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
              section === key
                ? 'bg-civil-accent/20 border-civil-accent/40 text-civil-accent'
                : 'bg-civil-surface border-civil-border text-civil-muted hover:text-civil-text'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {/* Count badge */}
            {key === 'labor'    && form.laborEntries.length    > 0 && (
              <span className="bg-civil-accent text-white text-[9px] px-1 rounded-full">
                {form.laborEntries.length}
              </span>
            )}
            {key === 'equip'    && form.equipEntries.length    > 0 && (
              <span className="bg-civil-accent text-white text-[9px] px-1 rounded-full">
                {form.equipEntries.length}
              </span>
            )}
            {key === 'material' && form.materialEntries.length > 0 && (
              <span className="bg-civil-accent text-white text-[9px] px-1 rounded-full">
                {form.materialEntries.length}
              </span>
            )}
            {key === 'activity' && form.activitiesWorked.length > 0 && (
              <span className="bg-civil-accent text-white text-[9px] px-1 rounded-full">
                {form.activitiesWorked.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── WEATHER SECTION ── */}
      {section === 'weather' && (
        <div className="space-y-4">
          {/* Work status */}
          <div>
            <label className="text-xs text-civil-muted mb-2 block">Work Status</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(Object.keys(workStatusConfig) as WorkStatus[]).map(s => {
                const cfg = workStatusConfig[s]
                return (
                  <button
                    key={s}
                    onClick={() => update('workStatus', s)}
                    className={clsx(
                      'py-2.5 rounded-xl border text-xs font-semibold transition-colors',
                      form.workStatus === s
                        ? `${cfg.bg} ${cfg.color} border-current`
                        : 'bg-civil-surface border-civil-border text-civil-muted hover:text-civil-text'
                    )}
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Weather */}
          <div>
            <label className="text-xs text-civil-muted mb-2 block">Weather Condition</label>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(weatherConfig) as WeatherCondition[]).map(w => {
                const cfg = weatherConfig[w]
                return (
                  <button
                    key={w}
                    onClick={() => update('weather', w)}
                    className={clsx(
                      'flex flex-col items-center gap-1 py-3 rounded-xl border text-xs transition-colors',
                      form.weather === w
                        ? `bg-civil-accent/10 border-civil-accent/40 ${cfg.color}`
                        : 'bg-civil-surface border-civil-border text-civil-muted hover:text-civil-text'
                    )}
                  >
                    <span className="text-xl">{cfg.emoji}</span>
                    <span>{cfg.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Temperature */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-civil-muted mb-1 block">Temperature (°C)</label>
              <input
                type="number"
                className="input"
                value={form.temperature}
                onChange={e => update('temperature', parseFloat(e.target.value) || 0)}
                min={0} max={50}
              />
            </div>
            <div>
              <label className="text-xs text-civil-muted mb-1 block">Prepared By</label>
              <input
                className="input"
                value={form.preparedBy}
                onChange={e => update('preparedBy', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── LABOR SECTION ── */}
      {section === 'labor' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-civil-muted">
              Total: <span className="text-civil-text font-semibold">
                {form.laborEntries.reduce((s, l) => s + l.count, 0)} persons
              </span>
            </p>
            <button onClick={addLabor} className="btn-ghost flex items-center gap-1.5 text-xs py-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Trade
            </button>
          </div>

          {form.laborEntries.length === 0 && (
            <div className="text-center py-8 text-civil-muted text-sm border-2 border-dashed border-civil-border rounded-xl">
              No labor entries yet
            </div>
          )}

          {form.laborEntries.map((l, idx) => (
            <div key={idx} className="bg-civil-surface border border-civil-border rounded-xl p-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-3 md:col-span-1">
                  <label className="text-[10px] text-civil-muted mb-0.5 block">Trade</label>
                  <input
                    className="input text-xs py-1.5"
                    value={l.trade}
                    onChange={e => updateLabor(idx, 'trade', e.target.value)}
                    list="trades-list"
                    placeholder="Mason, Helper..."
                  />
                  <datalist id="trades-list">
                    {commonTrades.map(t => <option key={t} value={t} />)}
                  </datalist>
                </div>
                <div>
                  <label className="text-[10px] text-civil-muted mb-0.5 block">Count</label>
                  <input
                    type="number"
                    className="input text-xs py-1.5"
                    value={l.count}
                    onChange={e => updateLabor(idx, 'count', parseInt(e.target.value) || 0)}
                    min={0}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-civil-muted mb-0.5 block">OT (hrs)</label>
                    <input
                      type="number"
                      className="input text-xs py-1.5"
                      value={l.overtime}
                      onChange={e => updateLabor(idx, 'overtime', parseFloat(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                  <button
                    onClick={() => removeLabor(idx)}
                    className="mt-4 text-civil-muted hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── EQUIPMENT SECTION ── */}
      {section === 'equip' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-civil-muted">
              Total: <span className="text-civil-text font-semibold">
                {form.equipEntries.reduce((s, e) => s + e.count, 0)} equipment
              </span>
            </p>
            <button onClick={addEquip} className="btn-ghost flex items-center gap-1.5 text-xs py-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Equipment
            </button>
          </div>

          {form.equipEntries.length === 0 && (
            <div className="text-center py-8 text-civil-muted text-sm border-2 border-dashed border-civil-border rounded-xl">
              No equipment entries yet
            </div>
          )}

          {form.equipEntries.map((e, idx) => (
            <div key={idx} className="bg-civil-surface border border-civil-border rounded-xl p-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-3 md:col-span-1">
                  <label className="text-[10px] text-civil-muted mb-0.5 block">Equipment</label>
                  <input
                    className="input text-xs py-1.5"
                    value={e.name}
                    onChange={ev => updateEquip(idx, 'name', ev.target.value)}
                    list="equip-list"
                    placeholder="Mixer, Vibrator..."
                  />
                  <datalist id="equip-list">
                    {commonEquipment.map(eq => <option key={eq} value={eq} />)}
                  </datalist>
                </div>
                <div>
                  <label className="text-[10px] text-civil-muted mb-0.5 block">Count</label>
                  <input
                    type="number"
                    className="input text-xs py-1.5"
                    value={e.count}
                    onChange={ev => updateEquip(idx, 'count', parseInt(ev.target.value) || 0)}
                    min={0}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-civil-muted mb-0.5 block">Hours</label>
                    <input
                      type="number"
                      className="input text-xs py-1.5"
                      value={e.hours}
                      onChange={ev => updateEquip(idx, 'hours', parseFloat(ev.target.value) || 0)}
                      min={0}
                    />
                  </div>
                  <button
                    onClick={() => removeEquip(idx)}
                    className="mt-4 text-civil-muted hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MATERIAL SECTION ── */}
      {section === 'material' && (
        <div className="space-y-2">
          <div className="flex justify-end mb-2">
            <button onClick={addMaterial} className="btn-ghost flex items-center gap-1.5 text-xs py-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Material
            </button>
          </div>

          {form.materialEntries.length === 0 && (
            <div className="text-center py-8 text-civil-muted text-sm border-2 border-dashed border-civil-border rounded-xl">
              No materials received today
            </div>
          )}

          {form.materialEntries.map((m, idx) => (
            <div key={idx} className="bg-civil-surface border border-civil-border rounded-xl p-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className="text-[10px] text-civil-muted mb-0.5 block">Material Name</label>
                  <input
                    className="input text-xs py-1.5"
                    value={m.name}
                    onChange={e => updateMaterial(idx, 'name', e.target.value)}
                    placeholder="Cement, Steel Rod..."
                  />
                </div>
                <div>
                  <label className="text-[10px] text-civil-muted mb-0.5 block">Quantity</label>
                  <input
                    type="number"
                    className="input text-xs py-1.5"
                    value={m.quantity}
                    onChange={e => updateMaterial(idx, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-civil-muted mb-0.5 block">Unit</label>
                  <input
                    className="input text-xs py-1.5"
                    value={m.unit}
                    onChange={e => updateMaterial(idx, 'unit', e.target.value)}
                    placeholder="bag / kg / nos"
                  />
                </div>
                <div className="col-span-2 flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-civil-muted mb-0.5 block">Supplier</label>
                    <input
                      className="input text-xs py-1.5"
                      value={m.supplier}
                      onChange={e => updateMaterial(idx, 'supplier', e.target.value)}
                      placeholder="Supplier name"
                    />
                  </div>
                  <button
                    onClick={() => removeMaterial(idx)}
                    className="mt-4 text-civil-muted hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ACTIVITY SECTION ── */}
      {section === 'activity' && (
        <div className="space-y-2">
          <p className="text-xs text-civil-muted mb-3">
            Select activities worked on today:
          </p>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-civil-muted text-sm border-2 border-dashed border-civil-border rounded-xl">
              Generate WBS first to see activities.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto pr-1">
              {activities.map(a => {
                const checked = form.activitiesWorked.includes(a)
                return (
                  <button
                    key={a}
                    onClick={() => toggleActivity(a)}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors text-xs',
                      checked
                        ? 'bg-civil-accent/10 border-civil-accent/40 text-civil-accent'
                        : 'bg-civil-surface border-civil-border text-civil-text hover:border-civil-accent/20'
                    )}
                  >
                    <div className={clsx(
                      'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                      checked ? 'bg-civil-accent border-civil-accent' : 'border-civil-border'
                    )}>
                      {checked && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    {a}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── NOTES SECTION ── */}
      {section === 'notes' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-civil-muted mb-1 flex items-center gap-1.5 block">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
              Issues / Problems
            </label>
            <textarea
              className="input resize-none"
              rows={3}
              value={form.issues}
              onChange={e => update('issues', e.target.value)}
              placeholder="Any site issues, delays, disputes..."
            />
          </div>
          <div>
            <label className="text-xs text-civil-muted mb-1 flex items-center gap-1.5 block">
              <Shield className="w-3.5 h-3.5 text-green-400" />
              Safety Notes
            </label>
            <textarea
              className="input resize-none"
              rows={2}
              value={form.safetyNotes}
              onChange={e => update('safetyNotes', e.target.value)}
              placeholder="Safety incidents, toolbox talk topics..."
            />
          </div>
          <div>
            <label className="text-xs text-civil-muted mb-1 block">Visitor Notes</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={form.visitorNotes}
              onChange={e => update('visitorNotes', e.target.value)}
              placeholder="Client visit, consultant inspection..."
            />
          </div>
          <div>
            <label className="text-xs text-civil-muted mb-1 block">General Remarks</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={form.generalRemarks}
              onChange={e => update('generalRemarks', e.target.value)}
              placeholder="Any other observations..."
            />
          </div>
        </div>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={clsx(
          'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
          saved
            ? 'bg-green-600 text-white'
            : 'btn-primary'
        )}
      >
        {saving ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : saved ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {saved ? 'Diary Saved!' : saving ? 'Saving...' : 'Save Diary Entry'}
      </button>
    </div>
  )
}
