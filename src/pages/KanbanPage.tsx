import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors, closestCorners,
  DragStartEvent, DragEndEvent, DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Task } from '@/lib/types'
import {
  KanbanColumn, columns, columnConfig,
  groupByColumn, subscribeToTasks, updateTask,
} from '@/lib/kanban-helpers'
import { useProjectStore } from '@/store/useProjectStore'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Activity } from '@/lib/types'
import TaskCard       from '@/components/kanban/TaskCard'
import TaskFormModal  from '@/components/kanban/TaskFormModal'
import { Plus, KanbanSquare } from 'lucide-react'
import { clsx } from 'clsx'

// Droppable column wrapper
function DroppableColumn({
  column, tasks, onAddTask, onEditTask
}: {
  column:     KanbanColumn
  tasks:      Task[]
  onAddTask:  (col: KanbanColumn) => void
  onEditTask: (task: Task) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column })
  const cfg = columnConfig[column]

  return (
    <div className={clsx(
      'flex flex-col rounded-xl border transition-colors duration-200 min-w-[220px] w-[220px] flex-shrink-0',
      isOver ? `${cfg.border} ${cfg.bg}` : 'border-civil-border bg-civil-surface'
    )}>
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-civil-border">
        <div className="flex items-center gap-2">
          <div className={clsx('w-2 h-2 rounded-full', cfg.dot)} />
          <span className={clsx('text-xs font-semibold', cfg.color)}>
            {cfg.label}
          </span>
          <span className="text-[10px] bg-civil-card border border-civil-border text-civil-muted px-1.5 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column)}
          className="text-civil-muted hover:text-civil-accent transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tasks */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-2 min-h-[120px] overflow-y-auto max-h-[calc(100vh-220px)]"
      >
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className={clsx(
            'flex items-center justify-center h-16 rounded-lg border-2 border-dashed',
            'text-[11px] text-civil-border transition-colors',
            isOver && 'border-civil-accent/40 text-civil-accent/60'
          )}>
            Drop here
          </div>
        )}
      </div>
    </div>
  )
}

export default function KanbanPage() {
  const { id: projectId }     = useParams<{ id: string }>()
  const { activeProject }     = useProjectStore()
  const [tasks,       setTasks]       = useState<Task[]>([])
  const [activities,  setActivities]  = useState<Activity[]>([])
  const [grouped,     setGrouped]     = useState<Record<KanbanColumn, Task[]>>(
    groupByColumn([])
  )
  const [activeTask,  setActiveTask]  = useState<Task | null>(null)
  const [showModal,   setShowModal]   = useState(false)
  const [editTask,    setEditTask]    = useState<Partial<Task> | undefined>()
  const [loading,     setLoading]     = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  // Subscribe to tasks
  useEffect(() => {
    if (!projectId) return
    const unsub = subscribeToTasks(projectId, (data) => {
      setTasks(data)
      setGrouped(groupByColumn(data))
      setLoading(false)
    })
    return () => unsub()
  }, [projectId])

  // Subscribe to activities for dropdown
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

  // ─── Drag handlers ───────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId   = over.id   as string

    // Find which columns they belong to
    let activeCol: KanbanColumn | null = null
    let overCol:   KanbanColumn | null = null

    for (const col of columns) {
      if (grouped[col].some(t => t.id === activeId)) activeCol = col
      if (grouped[col].some(t => t.id === overId))   overCol   = col
      if (columns.includes(overId as KanbanColumn))  overCol   = overId as KanbanColumn
    }

    if (!activeCol || !overCol || activeCol === overCol) return

    setGrouped(prev => {
      const activeItems = [...prev[activeCol!]]
      const overItems   = [...prev[overCol!]]
      const activeIdx   = activeItems.findIndex(t => t.id === activeId)
      const [moved]     = activeItems.splice(activeIdx, 1)

      return {
        ...prev,
        [activeCol!]: activeItems,
        [overCol!]:   [...overItems, { ...moved, status: overCol! }],
      }
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId   = over.id   as string

    // Find column for dropped task
    let targetCol: KanbanColumn | null = null
    for (const col of columns) {
      if (grouped[col].some(t => t.id === activeId)) {
        targetCol = col
        break
      }
      if (columns.includes(overId as KanbanColumn)) {
        targetCol = overId as KanbanColumn
        break
      }
    }

    if (!targetCol) return

    // Find original task status
    const originalTask = tasks.find(t => t.id === activeId)
    if (!originalTask) return

    // If status changed → update Firestore
    if (originalTask.status !== targetCol) {
      await updateTask(activeId, { status: targetCol })
    } else {
      // Same column reorder
      setGrouped(prev => {
        const colTasks  = [...prev[targetCol!]]
        const oldIdx    = colTasks.findIndex(t => t.id === activeId)
        const newIdx    = colTasks.findIndex(t => t.id === overId)
        if (oldIdx !== -1 && newIdx !== -1) {
          return { ...prev, [targetCol!]: arrayMove(colTasks, oldIdx, newIdx) }
        }
        return prev
      })
    }
  }

  const activityNames = activities
    .filter(a => a.level === 2)
    .map(a => `${a.code} ${a.name}`)

  const handleAddTask = (col: KanbanColumn) => {
    setEditTask({ status: col, projectId })
    setShowModal(true)
  }

  const handleEditTask = (task: Task) => {
    setEditTask(task)
    setShowModal(true)
  }

  // Stats
  const total     = tasks.length
  const completed = tasks.filter(t => t.status === 'completed').length
  const overdue   = tasks.filter(t =>
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
  ).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-civil-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="px-4 lg:px-6 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-civil-text">Task Board</h1>
            <p className="text-sm text-civil-muted mt-0.5">
              {activeProject?.name} · {total} tasks
            </p>
          </div>
          <button
            onClick={() => { setEditTask({ projectId }); setShowModal(true) }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>

        {/* Mini stats */}
        <div className="flex items-center gap-4 text-xs">
          <span className="text-civil-muted">
            Total: <span className="text-civil-text font-semibold">{total}</span>
          </span>
          <span className="text-civil-muted">
            Completed: <span className="text-green-600 font-semibold">{completed}</span>
          </span>
          {overdue > 0 && (
            <span className="text-civil-muted">
              Overdue: <span className="text-red-600 font-semibold">{overdue}</span>
            </span>
          )}
          {total > 0 && (
            <div className="flex items-center gap-2 ml-2">
              <div className="w-24 h-1.5 bg-civil-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-400 rounded-full transition-all"
                  style={{ width: `${Math.round((completed / total) * 100)}%` }}
                />
              </div>
              <span className="text-civil-muted">
                {Math.round((completed / total) * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <KanbanSquare className="w-12 h-12 text-civil-border mx-auto mb-4" />
            <p className="text-civil-text font-semibold">No tasks yet</p>
            <p className="text-civil-muted text-sm mt-2">
              Create tasks to track execution progress
            </p>
            <button
              onClick={() => { setEditTask({ projectId }); setShowModal(true) }}
              className="btn-primary mt-4 flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create First Task
            </button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {tasks.length >= 0 && (
        <div className="flex-1 overflow-x-auto px-4 lg:px-6 pb-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-3 h-full min-w-max pt-1">
              {columns.map(col => (
                <DroppableColumn
                  key={col}
                  column={col}
                  tasks={grouped[col] ?? []}
                  onAddTask={handleAddTask}
                  onEditTask={handleEditTask}
                />
              ))}
            </div>

            {/* Drag overlay */}
            <DragOverlay>
              {activeTask && (
                <TaskCard
                  task={activeTask}
                  onEdit={() => {}}
                  overlay
                />
              )}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <TaskFormModal
          task={editTask}
          projectId={projectId!}
          activities={activityNames}
          onClose={() => { setShowModal(false); setEditTask(undefined) }}
        />
      )}
    </div>
  )
}
