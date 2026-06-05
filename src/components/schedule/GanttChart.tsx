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

      on_click: (task: GanttTask) => {
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
          background:#1e2130;border:1px solid #2a2d3e;
          border-radius:8px;padding:12px;min-width:200px;
          font-family:Inter,sans-serif;
        ">
          <p style="color:#e2e8f0;font-weight:600;font-size:13px;margin:0 0 6px">
            ${task.name}
          </p>
          <p style="color:#64748b;font-size:11px;margin:0 0 2px">
            Start: ${task.start}
          </p>
          <p style="color:#64748b;font-size:11px;margin:0 0 8px">
            End:   ${task.end}
          </p>
          <div style="height:4px;background:#2a2d3e;border-radius:4px;overflow:hidden">
            <div style="
              height:100%;width:${task.progress}%;
              background:#38bdf8;border-radius:4px;
            "></div>
          </div>
          <p style="color:#38bdf8;font-size:11px;margin:4px 0 0;text-align:right">
            ${task.progress}%
          </p>
        </div>
      `,
    })

    // Inject dark-mode styles
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
  const id = 'gantt-dark-styles'
  if (document.getElementById(id)) return

  const style = document.createElement('style')
  style.id    = id
  style.textContent = `
    .gantt-container svg {
      background: #1a1d27;
      font-family: Inter, sans-serif;
    }
    .gantt .grid-background { fill: #1a1d27; }
    .gantt .grid-header      { fill: #1e2130; }
    .gantt .grid-row         { fill: transparent; }
    .gantt .grid-row:nth-child(even) { fill: rgba(255,255,255,0.015); }
    .gantt .row-line         { stroke: #2a2d3e; }
    .gantt .tick             { stroke: #2a2d3e; stroke-width: 1; }
    .gantt .tick.thick       { stroke: #3a3d4e; }
    .gantt .today-highlight  { fill: rgba(56,189,248,0.06); }

    .gantt .bar-wrapper .bar        { fill: #0369a1; stroke: none; }
    .gantt .bar-wrapper .bar-label  { fill: #e2e8f0; font-size: 11px; }
    .gantt .bar-wrapper .bar-progress { fill: #38bdf8; }
    .gantt .bar-wrapper:hover .bar  { fill: #0284c7; }

    .gantt .bar-wrapper.critical-task  .bar          { fill: #7f1d1d; }
    .gantt .bar-wrapper.critical-task  .bar-progress  { fill: #ef4444; }
    .gantt .bar-wrapper.delayed-task   .bar          { fill: #78350f; }
    .gantt .bar-wrapper.delayed-task   .bar-progress  { fill: #f59e0b; }
    .gantt .bar-wrapper.completed-task .bar          { fill: #14532d; }
    .gantt .bar-wrapper.completed-task .bar-progress  { fill: #22c55e; }

    .gantt .arrow { stroke: #64748b; stroke-width: 1.5; }
    .gantt .lower-text, .gantt .upper-text {
      fill: #64748b; font-size: 11px;
    }
    .gantt .upper-text { fill: #94a3b8; font-weight: 600; }

    .gantt-container .popup-wrapper .pointer {
      display: none;
    }
  `
  document.head.appendChild(style)
}
