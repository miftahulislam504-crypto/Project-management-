declare module 'frappe-gantt' {
  interface GanttOptions {
    view_mode?: string
    date_format?: string
    bar_height?: number
    bar_corner_radius?: number
    arrow_curve?: number
    padding?: number
    view_mode_select?: boolean
    popup_trigger?: string
    on_click?: (task: any) => void
    on_date_change?: (task: any, start: Date, end: Date) => void
    on_progress_change?: (task: any, progress: number) => void
    on_view_change?: (mode: string) => void
    custom_popup_html?: ((task: any) => string) | null
    [key: string]: any
  }

  class Gantt {
    constructor(element: string | HTMLElement, tasks: any[], options?: GanttOptions)
    change_view_mode(mode: string): void
    refresh(tasks: any[]): void
    [key: string]: any
  }

  export default Gantt
}
