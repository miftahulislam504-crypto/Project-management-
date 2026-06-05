import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { LoadingDataPoint } from '@/lib/resource-helpers'

interface Props {
  data: LoadingDataPoint[]
}

export default function ResourceLoadingChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-civil-muted text-sm">
        Assign resources to activities to see loading chart.
      </div>
    )
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 10, bottom: 0, left: -15 }}
          barCategoryGap="30%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e2130',
              border: '1px solid #2a2d3e',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: '#e2e8f0', marginBottom: 4 }}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            formatter={(value) => (
              <span style={{ color: '#94a3b8' }}>{value}</span>
            )}
          />
          <Bar
            dataKey="labor"
            name="Labor (persons)"
            fill="#38bdf8"
            radius={[3, 3, 0, 0]}
          />
          <Bar
            dataKey="equipment"
            name="Equipment (nos)"
            fill="#f59e0b"
            radius={[3, 3, 0, 0]}
          />
          <Bar
            dataKey="material"
            name="Material Cost (৳ ×10k)"
            fill="#22c55e"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
