import { useState } from 'react'
import {
  ProcurementItem, ProcurementStatus,
  ProcurementCategory, categoryConfig, statusConfig
} from '@/lib/procurement-helpers'
import { updateProcurementItem, deleteProcurementItem } from '@/lib/procurement-firestore'
import { Pencil, Trash2, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  items:      ProcurementItem[]
  onEdit:     (item: ProcurementItem) => void
  onDeleted:  () => void
  filterCat:  ProcurementCategory | 'all'
  filterStat: ProcurementStatus   | 'all'
}

export default function ProcurementTable({
  items, onEdit, onDeleted, filterCat, filterStat
}: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = items.filter(item => {
    const catOk  = filterCat  === 'all' || item.category === filterCat
    const statOk = filterStat === 'all' || item.status   === filterStat
    return catOk && statOk
  })

  const handleStatusChange = async (item: ProcurementItem, status: ProcurementStatus) => {
    await updateProcurementItem(item.id, { status })
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteProcurementItem(id)
      onDeleted()
    } finally {
      setDeletingId(null)
    }
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-civil-muted text-sm">
        No items found.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-civil-border bg-civil-surface">
            {['#', 'Item', 'Category', 'Qty', 'Unit Rate', 'Total', 'Required', 'Delivery', 'Supplier', 'Status', ''].map(h => (
              <th key={h} className="px-3 py-2.5 text-left text-civil-muted font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((item, idx) => {
            const cat  = categoryConfig[item.category]
            const stat = statusConfig[item.status]

            return (
              <tr
                key={item.id}
                className="border-b border-civil-border/40 hover:bg-civil-surface/40 transition-colors group"
              >
                {/* # */}
                <td className="px-3 py-2.5 text-civil-muted">{idx + 1}</td>

                {/* Item name */}
                <td className="px-3 py-2.5">
                  <p className="text-civil-text font-medium max-w-[160px] truncate">{item.name}</p>
                  {item.specification && (
                    <p className="text-civil-muted text-[10px]">{item.specification}</p>
                  )}
                </td>

                {/* Category */}
                <td className="px-3 py-2.5">
                  <span className={clsx(
                    'text-[10px] px-2 py-0.5 rounded-full font-medium',
                    cat.bg, cat.color
                  )}>
                    {cat.icon} {cat.label}
                  </span>
                </td>

                {/* Qty */}
                <td className="px-3 py-2.5 text-civil-text whitespace-nowrap">
                  {item.quantity.toLocaleString()} {item.unit}
                </td>

                {/* Unit Rate */}
                <td className="px-3 py-2.5 text-civil-muted whitespace-nowrap">
                  ৳ {item.unitRate.toLocaleString()}
                </td>

                {/* Total */}
                <td className="px-3 py-2.5 text-civil-accent font-semibold whitespace-nowrap">
                  ৳ {item.totalCost.toLocaleString()}
                </td>

                {/* Required Date */}
                <td className="px-3 py-2.5 text-civil-muted whitespace-nowrap">
                  {item.requiredDate || '—'}
                </td>

                {/* Delivery Date */}
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {item.deliveryDate ? (
                    <span className="text-green-400">{item.deliveryDate}</span>
                  ) : (
                    <span className="text-civil-muted">—</span>
                  )}
                </td>

                {/* Supplier */}
                <td className="px-3 py-2.5 text-civil-muted max-w-[100px] truncate">
                  {item.supplier || '—'}
                </td>

                {/* Status dropdown */}
                <td className="px-3 py-2.5">
                  <div className="relative">
                    <select
                      value={item.status}
                      onChange={e => handleStatusChange(item, e.target.value as ProcurementStatus)}
                      className={clsx(
                        'text-[10px] font-semibold px-2 py-1 rounded-full border',
                        'bg-transparent cursor-pointer appearance-none pr-5',
                        stat.color, stat.bg, stat.border
                      )}
                    >
                      {Object.entries(statusConfig).map(([k, v]) => (
                        <option key={k} value={k} className="bg-civil-card text-civil-text">
                          {v.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className={clsx(
                      'absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 pointer-events-none',
                      stat.color
                    )} />
                  </div>
                </td>

                {/* Actions */}
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1 rounded text-civil-muted hover:text-civil-accent hover:bg-civil-accent/10 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="p-1 rounded text-civil-muted hover:text-red-400 hover:bg-red-900/10 transition-colors"
                    >
                      {deletingId === item.id
                        ? <span className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin block" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>

        {/* Total row */}
        <tfoot>
          <tr className="border-t-2 border-civil-border bg-civil-surface">
            <td colSpan={5} className="px-3 py-2.5 text-xs font-semibold text-civil-muted">
              Total ({filtered.length} items)
            </td>
            <td className="px-3 py-2.5 text-sm font-bold text-civil-accent whitespace-nowrap">
              ৳ {filtered.reduce((s, i) => s + i.totalCost, 0).toLocaleString()}
            </td>
            <td colSpan={4} />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
