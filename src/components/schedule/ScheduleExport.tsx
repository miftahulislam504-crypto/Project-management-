import * as XLSX from 'xlsx'
import { Activity } from '@/lib/types'
import { FileSpreadsheet } from 'lucide-react'

interface Props {
  activities: Activity[]
  projectName: string
}

export default function ScheduleExport({ activities, projectName }: Props) {
  const handleExport = () => {
    const leaves = activities.filter(a => a.level === 2)

    const rows = leaves.map((a, i) => ({
      'No.':          i + 1,
      'Code':         a.code,
      'Activity':     a.name,
      'Start Date':   a.startDate,
      'End Date':     a.endDate,
      'Duration (d)': a.duration,
      'Progress (%)': a.progress,
      'Status':       a.status,
      'Critical':     a.isCritical ? 'Yes' : 'No',
      'Planned Cost': a.plannedCost,
      'Actual Cost':  a.actualCost,
    }))

    const ws = XLSX.utils.json_to_sheet(rows)

    // Column widths
    ws['!cols'] = [
      { wch: 5 },  // No.
      { wch: 8 },  // Code
      { wch: 35 }, // Activity
      { wch: 12 }, // Start
      { wch: 12 }, // End
      { wch: 12 }, // Duration
      { wch: 12 }, // Progress
      { wch: 14 }, // Status
      { wch: 8 },  // Critical
      { wch: 14 }, // Planned Cost
      { wch: 14 }, // Actual Cost
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Construction Schedule')

    const fileName = `${projectName.replace(/\s+/g, '_')}_Schedule.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  return (
    <button
      onClick={handleExport}
      className="btn-ghost flex items-center gap-2 text-green-400 border-green-900/30 hover:bg-green-900/10"
    >
      <FileSpreadsheet className="w-4 h-4" />
      <span className="hidden sm:inline">Export Excel</span>
    </button>
  )
}
