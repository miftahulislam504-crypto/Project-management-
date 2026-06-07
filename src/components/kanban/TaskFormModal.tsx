import { useState, useEffect } from 'react'
import { Task } from '@/lib/types'
import {
  KanbanColumn, columns, columnConfig,
  priorityConfig, addTask, updateTask, deleteTask
} from '@/lib/kanban-helpers'
import { X, Save, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  task?:       Partial<Task>
  projectId:   string
  activities:  string[]   // activity names for dropdown
  onClose:     () => void
}

const emptyTask = (projectId: string): Omit<Task, 'id'> => ({
  projectId,
  activityId:  '',
  title:       '',
  assignee:    '',
  dueDate:     '',
  priority:    'medium',
  status:      'planned',
  remarks:     '',
  createdAt:   new Date().toISOString(),
})

export default function TaskFormModal({ task, projectId, activities, onClose }: Props) {
  const [form,    setForm]    = useState<Omit<Task, 'id'>>(emptyTask(projectId))
  const [saving,  setSaving]  = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isEdit = !!task?.id

  useEffect(() => {
    if (task) setForm(f => ({ ...f, ...task }))
  }, [])

  const update = (field: keyof typeof form, value: any) =>
    setForm(f => ({ ...f, [field]: value }))

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      if (isEdit && task?.id) {
        await updateTask(task.id, form)
      } else {
        await addTask(form)
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!task?.id) return
    setDeleting(true)
    try {
      await deleteTask(task.id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-civil-card border border-civil-border rounded-2xl w-full max-w-md flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-civil-border flex-shrink-0">
          <h2 className="font-semibold text-civil-text">
            {isEdit ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="text-civil-muted hover:text-civil-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Title */}
          <div>
            <label className="text-xs text-civil-muted mb-1 block">Task Title *</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder="Describe the task..."
              autoFocus
            />
          </div>

          {/* Activity */}
          <div>
            <label className="text-xs text-civil-muted mb-1 block">Linked Activity</label>
            <select
              className="input"
              value={form.activityId}
              onChange={e => update('activityId', e.target.value)}
            >
              <option value="">— None —</option>
              {activities.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Priority + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-civil-muted mb-1 block">Priority</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(priorityConfig) as Task['priority'][]).map(p => (
                  <button
                    key={p}
                    onClick={() => update('priority', p)}
                    className={clsx(
                      'px-2 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors',
                      form.priority === p
                        ? `${priorityConfig[p].bg} ${priorityConfig[p].color} border-current`
                        : 'bg-civil-surface border-civil-border text-civil-muted'
                    )}
                  >
                    {priorityConfig[p].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-civil-muted mb-1 block">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={e => update('status', e.target.value as KanbanColumn)}
              >
                {columns.map(col => (
                  <option key={col} value={col}>{columnConfig[col].label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignee + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-civil-muted mb-1 block">Assignee</label>
              <input
                className="input"
                value={form.assignee}
                onChange={e => update('assignee', e.target.value)}
                placeholder="Name or initials"
              />
            </div>
            <div>
              <label className="text-xs text-civil-muted mb-1 block">Due Date</label>
              <input
                type="date"
                className="input"
                value={form.dueDate}
                onChange={e => update('dueDate', e.target.value)}
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="text-xs text-civil-muted mb-1 block">Remarks</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={form.remarks}
              onChange={e => update('remarks', e.target.value)}
              placeholder="Any notes..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-civil-border flex gap-3 flex-shrink-0">
          {isEdit && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 rounded-lg text-civil-muted hover:text-red-400 hover:bg-red-900/10 transition-colors"
            >
              {deleting
                ? <span className="w-4 h-4 border border-red-400 border-t-transparent rounded-full animate-spin block" />
                : <Trash2 className="w-4 h-4" />
              }
            </button>
          )}
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {saving
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Save className="w-4 h-4" />
            }
            {isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
