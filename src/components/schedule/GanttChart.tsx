import { useEffect, useRef } from 'react'
import Gantt from 'frappe-gantt'
import { GanttTask, GanttViewMode } from '@/lib/gantt-helpers'
import { updateActivity } from '@/lib/firestore'

interface Props {
  tasks:    GanttTask[]
  viewMode: GanttViewMode
}

export default function GanttChart({ tasks, viewMode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const ganttRef     = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current || tasks.length === 0) return

    // Clear previous
    containerRef.current.innerHTML = ''

    ganttRef.current = new Gantt(containerRef.current, tasks, {
      view_mode:      viewMode,
      date_format:    'YYYY-MM-DD',
      bar_height:     28,
      bar_corner_radius: 4,
      arrow_curve:    5,
      padding:        14,
      view_mode_select: false,
      popup_trigger:  'click',

      on_click: (_task: GanttTask) => {
        // Activity detail — handled by parent
      },

      on_date_change: async (task: GanttTask, start: Date, end: Date) => {
        try {
          await updateActivity(task.id, {
            startDate: start.toISOString().split('T')[0],
            endDate:   end.toISOString().split('T')[0],
            duration:  Math.ceil(
              (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
            ),
          })
        } catch (e) {
          console.error('Date update failed', e)
        }
      },

      on_progress_change: async (task: GanttTask, progress: number) => {
        try {
          await updateActivity(task.id, { progress: Math.round(progress) })
        } catch (e) {
          console.error('Progress update failed', e)
        }
      },

      custom_popup_html: (task: GanttTask) => `
        <div style="
          background:#ffffff;border:1px solid #e5e7eb;
          border-radius:8px;padding:12px;min-width:200px;
          box-shadow:0 4px 12px rgba(0,0,0,0.08);
          font-family:Inter,sans-serif;
        ">
          <p style="color:#111827;font-weight:600;font-size:13px;margin:0 0 6px">
            ${task.name}
          </p>
          <p style="color:#6b7280;font-size:11px;margin:0 0 2px">
            Start: ${task.start}
          </p>
          <p style="color:#6b7280;font-size:11px;margin:0 0 8px">
            End:   ${task.end}
          </p>
          <div style="height:4px;background:#f3f4f6;border-radius:4px;overflow:hidden">
            <div style="
              height:100%;width:${task.progress}%;
              background:#1a56db;border-radius:4px;
            "></div>
          </div>
          <p style="color:#1a56db;font-size:11px;margin:4px 0 0;text-align:right">
            ${task.progress}%
          </p>
        </div>
      `,
    })

    // Inject light-mode styles
    injectGanttStyles()

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [tasks])

  // Update view mode without re-rendering
  useEffect(() => {
    if (ganttRef.current) {
      ganttRef.current.change_view_mode(viewMode)
    }
  }, [viewMode])

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-civil-muted text-sm">
        No activities to display. Generate WBS first.
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="gantt-container w-full overflow-x-auto"
      style={{ minHeight: '300px' }}
    />
  )
}

function injectGanttStyles() {
  const id = 'gantt-light-styles'
  if (document.getElementById(id)) return

  const style = document.createElement('style')
  style.id    = id
  style.textContent = `
    .gantt-container svg {
      background: #ffffff;
      font-family: Inter, sans-serif;
    }
    .gantt .grid-background { fill: #ffffff; }
    .gantt .grid-header      { fill: #f9fafb; }
    .gantt .grid-row         { fill: transparent; }
    .gantt .grid-row:nth-child(even) { fill: rgba(0,0,0,0.012); }
    .gantt .row-line         { stroke: #e5e7eb; }
    .gantt .tick             { stroke: #e5e7eb; stroke-width: 1; }
    .gantt .tick.thick       { stroke: #d1d5db; }
    .gantt .today-highlight  { fill: rgba(26,86,219,0.05); }

    .gantt .bar-wrapper .bar        { fill: #3b82f6; stroke: none; }
    .gantt .bar-wrapper .bar-label  { fill: #ffffff; font-size: 11px; }
    .gantt .bar-wrapper .bar-progress { fill: #1a56db; }
    .gantt .bar-wrapper:hover .bar  { fill: #2563eb; }

    .gantt .bar-wrapper.critical-task  .bar          { fill: #fecaca; }
    .gantt .bar-wrapper.critical-task  .bar-progress  { fill: #dc2626; }
    .gantt .bar-wrapper.delayed-task   .bar          { fill: #fde68a; }
    .gantt .bar-wrapper.delayed-task   .bar-progress  { fill: #d97706; }
    .gantt .bar-wrapper.completed-task .bar          { fill: #a7f3d0; }
    .gantt .bar-wrapper.completed-task .bar-progress  { fill: #059669; }

    .gantt .arrow { stroke: #9ca3af; stroke-width: 1.5; }
    .gantt .lower-text, .gantt .upper-text {
      fill: #6b7280; font-size: 11px;
    }
    .gantt .upper-text { fill: #374151; font-weight: 600; }

    .gantt-container .popup-wrapper .pointer {
      display: none;
    }
  `
  document.head.appendChild(style)
}
