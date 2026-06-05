import { ResourceSummary, resourceTypeConfig, ResourceType } from '@/lib/resource-helpers'
import { clsx } from 'clsx'

interface Props {
  summary: ResourceSummary[]
}

export default function ResourceSummaryTable({ summary }: Props) {
  const types: ResourceType[] = ['labor', 'equipment', 'material', 'subcontractor']

  const totalCost = summary.reduce((s, r) => s + r.totalCost, 0)

  return (
    <div className="space-y-4">
      {/* Total cost banner */}
      <div className="bg-civil-accent/10 border border-civil-accent/20 rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-civil-text">Total Resource Cost</span>
        <span className="text-lg font-bold text-civil-accent">
          ৳ {totalCost.toLocaleString()}
        </span>
      </div>

      {/* Per-type tables */}
      {types.map(type => {
        const rows = summary.filter(r => r.type === type)
        if (rows.length === 0) return null
        const cfg      = resourceTypeConfig[type]
        const typeCost = rows.reduce((s, r) => s + r.totalCost, 0)

        return (
          <div key={type} className="card p-0 overflow-hidden">
            {/* Type header */}
            <div className={clsx(
              'flex items-center justify-between px-4 py-2.5 border-b border-civil-border',
              cfg.bg
            )}>
              <span className={clsx('text-xs font-semibold', cfg.color)}>
                {cfg.label}
              </span>
              <span className={clsx('text-xs font-bold', cfg.color)}>
                ৳ {typeCost.toLocaleString()}
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-civil-border bg-civil-surface">
                    <th className="px-3 py-2 text-left text-civil-muted font-medium">Resource</th>
                    <th className="px-3 py-2 text-right text-civil-muted font-medium">Qty</th>
                    <th className="px-3 py-2 text-left text-civil-muted font-medium">Unit</th>
                    <th className="px-3 py-2 text-right text-civil-muted font-medium">Total Cost</th>
                    <th className="px-3 py-2 text-right text-civil-muted font-medium">Activities</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={i}
                      className="border-b border-civil-border/40 hover:bg-civil-surface/50 transition-colors"
                    >
                      <td className="px-3 py-2 text-civil-text font-medium">{r.name}</td>
                      <td className="px-3 py-2 text-civil-text text-right">
                        {r.totalQty.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-civil-muted">{r.unit}</td>
                      <td className="px-3 py-2 text-civil-accent text-right font-semibold">
                        ৳ {r.totalCost.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-civil-muted text-right">
                        {r.activities.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {summary.length === 0 && (
        <div className="text-center py-10 text-civil-muted text-sm">
          No resources assigned yet. Select an activity to assign resources.
        </div>
      )}
    </div>
  )
}
