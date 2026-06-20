import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ReferenceLine,
} from 'recharts'
import { ProgressChartPoint, DailyTrend } from '@/lib/progress-helpers'

interface BarProps {
  data: ProgressChartPoint[]
}

export function ProgressComparisonChart({ data }: BarProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-civil-muted text-sm">
        No progress data yet.
      </div>
    )
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 10, bottom: 0, left: -20 }}
          barCategoryGap="25%"
          barGap={2}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#64748b', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            unit="%"
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: 11,
            }}
            labelStyle={{ color: '#111827' }}
            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            formatter={v => <span style={{ color: '#94a3b8' }}>{v}</span>}
          />
          <Bar dataKey="planned" name="Planned" fill="#dbeafe" radius={[3,3,0,0]} />
          <Bar dataKey="actual"  name="Actual"  fill="#1a56db" radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface TrendProps {
  data: DailyTrend[]
}

export function DailyTrendChart({ data }: TrendProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-civil-muted text-sm">
        No update history yet.
      </div>
    )
  }

  return (
    <div className="h-36">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 10, bottom: 0, left: -20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#64748b', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={d => d.slice(5)}  // MM-DD
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: 11,
            }}
            labelStyle={{ color: '#111827' }}
          />
          <Line
            type="monotone"
            dataKey="count"
            name="Updates/day"
            stroke="#059669"
            strokeWidth={2}
            dot={{ fill: '#22c55e', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
