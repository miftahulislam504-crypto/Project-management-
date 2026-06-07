import { useSortable } from '@dnd-kit/sortable'
import { CSS }          from '@dnd-kit/utilities'
import { Task }         from '@/lib/types'
import { priorityConfig, columnConfig, KanbanColumn } from '@/lib/kanban-helpers'
import { deleteTask } from '@/lib/kanban-helpers'
import { Calendar, User, Trash2, GripVertical } from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  task:     Task
  onEdit:   (task: Task) => void
  overlay?: boolean
}

export default function TaskCard({ task, onEdit, overlay }: Props) {
  const {
    attributes, listeners,
    setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
  }

  const pri = priorityConfig[task.priority]
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date()
    && task.status !== 'completed'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'bg-civil-card border border-civil-border rounded-xl p-3',
        'cursor-pointer select-none',
        'transition-all duration-150',
        isDragging && 'opacity-40 scale-95',
        overlay && 'shadow-2xl rotate-1 opacity-95 scale-105',
        !isDragging && !overlay && 'hover:border-civil-accent/40',
      )}
      onClick={() => onEdit(task)}
    >
      {/* Drag handle + priority */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={clsx(
          'text-[10px] font-semibold px-2 py-0.5 rounded-full',
          pri.bg, pri.color
        )}>
          {pri.label}
        </span>
        <div
          {...attributes}
          {...listeners}
          onClick={e => e.stopPropagation()}
          className="text-civil-border hover:text-civil-muted cursor-grab active:cursor-grabbing p-0.5 -mt-0.5 -mr-0.5"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Title */}
      <p className="text-xs font-medium text-civil-text leading-snug mb-2 line-clamp-2">
        {task.title}
      </p>

      {/* Activity ref */}
      {task.activityId && (
        <p className="text-[10px] text-civil-muted mb-2 truncate">
          📋 {task.activityId}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        {/* Due date */}
        {task.dueDate ? (
          <div className={clsx(
            'flex items-center gap-1 text-[10px]',
            isOverdue ? 'text-red-400' : 'text-civil-muted'
          )}>
            <Calendar className="w-3 h-3" />
            {task.dueDate}
          </div>
        ) : (
          <span />
        )}

        {/* Assignee avatar */}
        {task.assignee && (
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-civil-accent/20 flex items-center justify-center text-[9px] font-bold text-civil-accent">
              {task.assignee[0]?.toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
