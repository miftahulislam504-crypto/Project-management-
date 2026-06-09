import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
} from 'recharts'
import { BudgetSummary, costCategoryConfig, CostCategory } from '@/lib/cost-helpers'

interface Props {
  summary: BudgetSummary
}

const COLORS = ['#38bdf8', '#22c55e', '#f59e0b', '#a855f7', '#f97316', '#64748b']

export function BudgetVsActualChart({ summary }: Props) {
  const data = summary.byActivity.filter(a => a.budget > 0 || a.actual > 0)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-civil-muted text-sm">
        Assign planned costs to activities to see budget chart.
      </div>
    )
  }

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 5, bottom: 20, left: -10 }}
          barCategoryGap="20%"
          barGap={2}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#64748b', fontSize: 8 }}
            axisLine={false}
            tickLine={false}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e2130',
              border: '1px solid #2a2d3e',
              borderRadius: 8,
              fontSize: 11,
            }}
            formatter={(val: number) => [`৳ ${val.toLocaleString()}`, '']}
            labelStyle={{ color: '#e2e8f0' }}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            formatter={v => <span style={{ color: '#94a3b8' }}>{v}</span>}
          />
          <Bar dataKey="budget" name="Budget"  fill="#2a2d3e" radius={[3,3,0,0]} />
          <Bar dataKey="actual" name="Actual"  fill="#38bdf8" radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CostBreakdownChart({ summary }: Props) {
  const data = summary.byCategory.map((c, i) => ({
    name:  costCategoryConfig[c.category].label,
    value: c.actual,
    color: COLORS[i % COLORS.length],
  }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-civil-muted text-sm">
        No cost entries yet.
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-36 h-36 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={60}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e2130',
                border: '1px solid #2a2d3e',
                borderRadius: 8,
                fontSize: 11,
              }}
              formatter={(val: number) => [`৳ ${val.toLocaleString()}`, '']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-civil-muted">{d.name}</span>
            </div>
            <span className="text-civil-text font-medium">৳ {d.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
