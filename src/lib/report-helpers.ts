import { Activity } from '@/lib/types'
import { CostEntry, EVMMetrics } from '@/lib/cost-helpers'
import { SiteIssue, QCRecord, ApprovalRequest } from '@/lib/issue-helpers'
import { ProgressUpdate } from '@/lib/progress-helpers'
import { DiaryEntry, totalLaborCount, totalEquipmentCount } from '@/lib/diary-helpers'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'

// ─── Report Types ──────────────────────────────────────────
export type ReportType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'progress'
  | 'delay'
  | 'resource'
  | 'cost'

export interface ReportConfig {
  type:        ReportType
  projectName: string
  projectId:   string
  dateFrom:    string
  dateTo:      string
  preparedBy:  string
}

// ─── PDF Helpers ───────────────────────────────────────────
const COLORS = {
  primary:  [14, 165, 233],   // sky-500
  dark:     [15, 17, 23],     // civil-bg
  surface:  [26, 29, 39],     // civil-surface
  text:     [226, 232, 240],  // civil-text
  muted:    [100, 116, 139],  // civil-muted
  success:  [34, 197, 94],    // green-500
  danger:   [239, 68, 68],    // red-500
  warning:  [245, 158, 11],   // amber-500
}

function addHeader(pdf: jsPDF, config: ReportConfig, title: string) {
  const W = pdf.internal.pageSize.getWidth()

  // Background
  pdf.setFillColor(26, 29, 39)
  pdf.rect(0, 0, W, 35, 'F')

  // Title
  pdf.setTextColor(226, 232, 240)
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.text('CivilOS PM', 14, 14)

  pdf.setFontSize(10)
  pdf.setTextColor(100, 116, 139)
  pdf.setFont('helvetica', 'normal')
  pdf.text(title, 14, 22)
  pdf.text(`Project: ${config.projectName}`, 14, 29)

  // Right side
  pdf.setFontSize(9)
  pdf.text(`Period: ${config.dateFrom} to ${config.dateTo}`, W - 14, 22, { align: 'right' })
  pdf.text(`Prepared by: ${config.preparedBy}`, W - 14, 29, { align: 'right' })

  // Accent line
  pdf.setFillColor(14, 165, 233)
  pdf.rect(0, 35, W, 1.5, 'F')

  return 44  // y position after header
}

function addSectionTitle(pdf: jsPDF, y: number, title: string): number {
  const W = pdf.internal.pageSize.getWidth()
  pdf.setFillColor(30, 33, 48)
  pdf.rect(0, y, W, 8, 'F')
  pdf.setTextColor(56, 189, 248)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text(title.toUpperCase(), 14, y + 5.5)
  return y + 12
}

function addKPIRow(
  pdf: jsPDF, y: number,
  items: { label: string; value: string; color?: number[] }[]
): number {
  const W     = pdf.internal.pageSize.getWidth()
  const colW  = (W - 28) / items.length
  items.forEach((item, i) => {
    const x = 14 + i * colW
    pdf.setFillColor(30, 33, 48)
    pdf.roundedRect(x, y, colW - 3, 18, 2, 2, 'F')
    pdf.setFontSize(7)
    pdf.setTextColor(100, 116, 139)
    pdf.setFont('helvetica', 'normal')
    pdf.text(item.label, x + 4, y + 6)
    const col = item.color ?? [226, 232, 240]
    pdf.setTextColor(col[0], col[1], col[2])
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.text(item.value, x + 4, y + 14)
  })
  return y + 24
}

function checkPage(pdf: jsPDF, y: number, needed = 20): number {
  if (y + needed > pdf.internal.pageSize.getHeight() - 15) {
    pdf.addPage()
    pdf.setFillColor(26, 29, 39)
    pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F')
    return 15
  }
  return y
}

// ─── Progress Report ───────────────────────────────────────
export function generateProgressReport(
  config:     ReportConfig,
  activities: Activity[],
  updates:    ProgressUpdate[],
  evm:        EVMMetrics
): void {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  pdf.setFillColor(26, 29, 39)
  pdf.rect(0, 0, 210, 297, 'F')

  let y = addHeader(pdf, config, 'PROGRESS REPORT')

  // EVM KPIs
  y = addSectionTitle(pdf, y, 'Earned Value Metrics')
  y = addKPIRow(pdf, y, [
    { label: 'SPI',      value: evm.SPI.toFixed(2),  color: evm.SPI  >= 1 ? COLORS.success : COLORS.danger },
    { label: 'CPI',      value: evm.CPI.toFixed(2),  color: evm.CPI  >= 1 ? COLORS.success : COLORS.danger },
    { label: 'Progress', value: `${evm.completionPct}%`, color: COLORS.primary },
    { label: 'EAC',      value: `৳${(evm.EAC/100000).toFixed(1)}L`, color: COLORS.warning },
  ])

  // Activity table
  y = addSectionTitle(pdf, y, 'Activity Status')
  const leaves = activities.filter(a => a.level === 2)

  // Table header
  pdf.setFillColor(42, 45, 62)
  pdf.rect(14, y, 182, 7, 'F')
  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(100, 116, 139)
  const cols = [14, 30, 110, 140, 160, 182]
  const headers = ['Code', 'Activity', 'Duration', 'Progress', 'Status']
  headers.forEach((h, i) => pdf.text(h, cols[i], y + 4.5))
  y += 8

  leaves.slice(0, 25).forEach((a, i) => {
    y = checkPage(pdf, y, 7)
    if (i % 2 === 0) {
      pdf.setFillColor(30, 33, 48)
      pdf.rect(14, y, 182, 6.5, 'F')
    }
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 116, 139)
    pdf.text(a.code, cols[0], y + 4.5)
    pdf.setTextColor(226, 232, 240)
    pdf.text(a.name.substring(0, 38), cols[1], y + 4.5)
    pdf.setTextColor(100, 116, 139)
    pdf.text(`${a.duration}d`, cols[2], y + 4.5)
    const pct = `${a.progress}%`
    const col = a.progress === 100 ? COLORS.success : a.progress > 0 ? COLORS.primary : COLORS.muted
    pdf.setTextColor(col[0], col[1], col[2])
    pdf.text(pct, cols[3], y + 4.5)
    const sCol = a.status === 'delayed' ? COLORS.danger : a.status === 'completed' ? COLORS.success : COLORS.muted
    pdf.setTextColor(sCol[0], sCol[1], sCol[2])
    pdf.text(a.status.replace('-', ' '), cols[4], y + 4.5)
    y += 6.5
  })

  // Footer
  const H = pdf.internal.pageSize.getHeight()
  const W = pdf.internal.pageSize.getWidth()
  pdf.setFillColor(26, 29, 39)
  pdf.rect(0, H - 10, W, 10, 'F')
  pdf.setFontSize(7)
  pdf.setTextColor(100, 116, 139)
  pdf.text(`Generated: ${new Date().toLocaleString()}  |  CivilOS PM`, W / 2, H - 4, { align: 'center' })

  pdf.save(`${config.projectName}_Progress_Report.pdf`)
}

// ─── Cost Report PDF ───────────────────────────────────────
export function generateCostReport(
  config:     ReportConfig,
  costEntries: CostEntry[],
  evm:        EVMMetrics
): void {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  pdf.setFillColor(26, 29, 39)
  pdf.rect(0, 0, 210, 297, 'F')

  let y = addHeader(pdf, config, 'COST REPORT')

  // Budget KPIs
  y = addSectionTitle(pdf, y, 'Budget Summary')
  y = addKPIRow(pdf, y, [
    { label: 'BAC',    value: `৳${(evm.BAC/100000).toFixed(1)}L`,  color: COLORS.primary },
    { label: 'AC',     value: `৳${(evm.AC/100000).toFixed(1)}L`,   color: COLORS.warning },
    { label: 'EV',     value: `৳${(evm.EV/100000).toFixed(1)}L`,   color: [167, 139, 250] },
    { label: 'CPI',    value: evm.CPI.toFixed(2),                   color: evm.CPI >= 1 ? COLORS.success : COLORS.danger },
  ])

  // Cost entries table
  y = addSectionTitle(pdf, y, 'Cost Entries')
  pdf.setFillColor(42, 45, 62)
  pdf.rect(14, y, 182, 7, 'F')
  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(100, 116, 139)
  const cCols = [14, 34, 84, 114, 154, 182]
  ['Date', 'Description', 'Category', 'Vendor', 'Amount'].forEach((h, i) =>
    pdf.text(h, cCols[i], y + 4.5)
  )
  y += 8

  let total = 0
  costEntries.slice(0, 30).forEach((e, i) => {
    y = checkPage(pdf, y, 7)
    total += e.amount
    if (i % 2 === 0) {
      pdf.setFillColor(30, 33, 48)
      pdf.rect(14, y, 182, 6.5, 'F')
    }
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 116, 139)
    pdf.text(e.date, cCols[0], y + 4.5)
    pdf.setTextColor(226, 232, 240)
    pdf.text(e.description.substring(0, 28), cCols[1], y + 4.5)
    pdf.setTextColor(100, 116, 139)
    pdf.text(e.category, cCols[2], y + 4.5)
    pdf.text((e.vendor || '—').substring(0, 18), cCols[3], y + 4.5)
    pdf.setTextColor(56, 189, 248)
    pdf.text(`৳${e.amount.toLocaleString()}`, cCols[4], y + 4.5)
    y += 6.5
  })

  // Total row
  y = checkPage(pdf, y, 10)
  pdf.setFillColor(14, 165, 233, 0.15)
  pdf.rect(14, y, 182, 8, 'F')
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(56, 189, 248)
  pdf.text(`TOTAL: ৳${total.toLocaleString()}`, cCols[4], y + 5.5)
  pdf.setTextColor(100, 116, 139)
  pdf.text(`${costEntries.length} entries`, cCols[0], y + 5.5)

  const H = pdf.internal.pageSize.getHeight()
  const W = pdf.internal.pageSize.getWidth()
  pdf.setFillColor(26, 29, 39)
  pdf.rect(0, H - 10, W, 10, 'F')
  pdf.setFontSize(7)
  pdf.setTextColor(100, 116, 139)
  pdf.text(`Generated: ${new Date().toLocaleString()}  |  CivilOS PM`, W / 2, H - 4, { align: 'center' })

  pdf.save(`${config.projectName}_Cost_Report.pdf`)
}

// ─── Daily / Weekly Report PDF ─────────────────────────────
export function generateDailyReport(
  config:  ReportConfig,
  entries: DiaryEntry[]
): void {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  pdf.setFillColor(26, 29, 39)
  pdf.rect(0, 0, 210, 297, 'F')

  let y = addHeader(pdf, config, config.type === 'daily' ? 'DAILY SITE REPORT' : 'WEEKLY SITE REPORT')

  // Summary KPIs
  const totalLabor = entries.reduce((s, e) => s + totalLaborCount(e), 0)
  const totalEquip = entries.reduce((s, e) => s + totalEquipmentCount(e), 0)
  const issueCount = entries.filter(e => e.issues).length

  y = addSectionTitle(pdf, y, 'Summary')
  y = addKPIRow(pdf, y, [
    { label: 'Days Logged',    value: `${entries.length}`,   color: COLORS.primary },
    { label: 'Total Labor',    value: `${totalLabor}`,        color: COLORS.success },
    { label: 'Total Equipment',value: `${totalEquip}`,        color: COLORS.warning },
    { label: 'Days w/ Issues', value: `${issueCount}`,        color: issueCount > 0 ? COLORS.danger : COLORS.muted },
  ])

  // Diary entries
  entries.slice(0, 10).forEach(entry => {
    y = checkPage(pdf, y, 40)
    y = addSectionTitle(pdf, y, `${entry.date} — ${entry.weather.toUpperCase()}`)

    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')

    // Labor
    if (entry.laborEntries.length > 0) {
      pdf.setTextColor(56, 189, 248)
      pdf.text('Labor:', 14, y)
      pdf.setTextColor(226, 232, 240)
      const laborText = entry.laborEntries.map(l => `${l.trade}(${l.count})`).join(', ')
      pdf.text(laborText.substring(0, 90), 35, y)
      y += 6
    }

    // Issues
    if (entry.issues) {
      y = checkPage(pdf, y, 8)
      pdf.setTextColor(239, 68, 68)
      pdf.text('Issues:', 14, y)
      pdf.setTextColor(226, 232, 240)
      pdf.text(entry.issues.substring(0, 80), 35, y)
      y += 6
    }

    // Remarks
    if (entry.generalRemarks) {
      y = checkPage(pdf, y, 8)
      pdf.setTextColor(100, 116, 139)
      pdf.text('Remarks:', 14, y)
      pdf.setTextColor(226, 232, 240)
      pdf.text(entry.generalRemarks.substring(0, 80), 35, y)
      y += 6
    }
    y += 4
  })

  const H = pdf.internal.pageSize.getHeight()
  const W = pdf.internal.pageSize.getWidth()
  pdf.setFillColor(26, 29, 39)
  pdf.rect(0, H - 10, W, 10, 'F')
  pdf.setFontSize(7)
  pdf.setTextColor(100, 116, 139)
  pdf.text(`Generated: ${new Date().toLocaleString()}  |  CivilOS PM`, W / 2, H - 4, { align: 'center' })

  pdf.save(`${config.projectName}_${config.type}_Report.pdf`)
}

// ─── Excel Export ──────────────────────────────────────────
export function generateScheduleExcel(
  projectName: string,
  activities:  Activity[]
): void {
  const leaves = activities.filter(a => a.level === 2)
  const rows = leaves.map((a, i) => ({
    'No.':          i + 1,
    'Code':         a.code,
    'Activity':     a.name,
    'Level':        a.level,
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
  ws['!cols'] = [
    { wch: 5 }, { wch: 8 }, { wch: 35 }, { wch: 7 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 14 }, { wch: 8 }, { wch: 14 }, { wch: 14 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Schedule')
  XLSX.writeFile(wb, `${projectName}_Schedule.xlsx`)
}

export function generateCostExcel(
  projectName: string,
  costEntries: CostEntry[],
  evm:         EVMMetrics
): void {
  // Cost entries sheet
  const rows = costEntries.map((e, i) => ({
    'No.':         i + 1,
    'Date':        e.date,
    'Description': e.description,
    'Category':    e.category,
    'Activity':    e.activityName,
    'Vendor':      e.vendor,
    'Invoice No.': e.invoiceNo,
    'Amount (৳)':  e.amount,
  }))

  // EVM sheet
  const evmRows = [
    { Metric: 'BAC (Budget at Completion)', Value: evm.BAC },
    { Metric: 'PV (Planned Value)',          Value: evm.PV },
    { Metric: 'EV (Earned Value)',           Value: evm.EV },
    { Metric: 'AC (Actual Cost)',            Value: evm.AC },
    { Metric: 'SV (Schedule Variance)',      Value: evm.SV },
    { Metric: 'CV (Cost Variance)',          Value: evm.CV },
    { Metric: 'SPI',                         Value: evm.SPI },
    { Metric: 'CPI',                         Value: evm.CPI },
    { Metric: 'EAC',                         Value: evm.EAC },
    { Metric: 'ETC',                         Value: evm.ETC },
    { Metric: 'VAC',                         Value: evm.VAC },
  ]

  const ws1 = XLSX.utils.json_to_sheet(rows)
  const ws2 = XLSX.utils.json_to_sheet(evmRows)
  ws1['!cols'] = [{ wch: 5 }, { wch: 12 }, { wch: 35 }, { wch: 14 }, { wch: 25 }, { wch: 18 }, { wch: 12 }, { wch: 14 }]
  ws2['!cols'] = [{ wch: 30 }, { wch: 18 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws1, 'Cost Entries')
  XLSX.utils.book_append_sheet(wb, ws2, 'EVM Metrics')
  XLSX.writeFile(wb, `${projectName}_Cost_Report.xlsx`)
}
