import { EVMMetrics } from '@/lib/cost-helpers'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { clsx } from 'clsx'
import {
  TrendingUp, TrendingDown, DollarSign,
  Clock, AlertTriangle, CheckCircle2,
} from 'lucide-react'

interface Props {
  metrics: EVMMetrics
}

export default function EVMDashboard({ metrics }: Props) {
  const { PV, EV, AC, SV, CV, SPI, CPI, EAC, ETC, VAC, BAC, TCPI, completionPct } = metrics

  const fmt  = (n: number) => `৳ ${Math.abs(n / 1000).toFixed(0)}k`
  const fmtI = (n: number) => n.toFixed(2)
  const pos  = (n: number) => n >= 0

  // ── Status indicators ──────────────────────────────────
  const scheduleStatus = SPI >= 1
    ? { label: 'Ahead of Schedule', color: 'text-green-400',  bg: 'bg-green-900/20',  icon: CheckCircle2 }
    : { label: 'Behind Schedule',   color: 'text-red-400',    bg: 'bg-red-900/20',    icon: AlertTriangle }

  const costStatus = CPI >= 1
    ? { label: 'Under Budget',   color: 'text-green-400',  bg: 'bg-green-900/20',  icon: DollarSign }
    : { label: 'Over Budget',    color: 'text-red-400',    bg: 'bg-red-900/20',    icon: DollarSign }

  // ── EVM cards ─────────────────────────────────────────
  const cards = [
    {
      label: 'BAC (Budget)', value: fmt(BAC),
      sub: 'Budget at Completion',
      color: 'text-civil-accent', bg: 'bg-blue-900/20', icon: DollarSign,
    },
    {
      label: 'PV (Planned)', value: fmt(PV),
      sub: 'Planned Value',
      color: 'text-blue-400', bg: 'bg-blue-900/20', icon: TrendingUp,
    },
    {
      label: 'EV (Earned)', value: fmt(EV),
      sub: `${completionPct}% complete`,
      color: 'text-purple-400', bg: 'bg-purple-900/20', icon: TrendingUp,
    },
    {
      label: 'AC (Actual)', value: fmt(AC),
      sub: 'Actual Cost spent',
      color: 'text-yellow-400', bg: 'bg-yellow-900/20', icon: DollarSign,
    },
    {
      label: 'SPI', value: fmtI(SPI),
      sub: SPI >= 1 ? '✓ On/Ahead schedule' : '⚠ Behind schedule',
      color: SPI >= 1 ? 'text-green-400' : 'text-red-400',
      bg: SPI >= 1 ? 'bg-green-900/20' : 'bg-red-900/20', icon: Clock,
    },
    {
      label: 'CPI', value: fmtI(CPI),
      sub: CPI >= 1 ? '✓ Under budget' : '⚠ Over budget',
      color: CPI >= 1 ? 'text-green-400' : 'text-red-400',
      bg: CPI >= 1 ? 'bg-green-900/20' : 'bg-red-900/20', icon: DollarSign,
    },
    {
      label: 'EAC (Forecast)', value: fmt(EAC),
      sub: 'Estimate at Completion',
      color: 'text-orange-400', bg: 'bg-orange-900/20', icon: TrendingUp,
    },
    {
      label: 'VAC', value: `${pos(VAC) ? '+' : ''}${fmt(VAC)}`,
      sub: 'Variance at Completion',
      color: pos(VAC) ? 'text-green-400' : 'text-red-400',
      bg: pos(VAC) ? 'bg-green-900/20' : 'bg-red-900/20', icon: AlertTriangle,
    },
  ]

  // ── Trend chart mock data ─────────────────────────────
  const trendData = [
    { week: 'W1',  PV: BAC*0.05, EV: BAC*0.04, AC: BAC*0.045 },
    { week: 'W2',  PV: BAC*0.12, EV: BAC*0.10, AC: BAC*0.11  },
    { week: 'W3',  PV: BAC*0.22, EV: BAC*0.18, AC: BAC*0.20  },
    { week: 'W4',  PV: BAC*0.34, EV: BAC*0.29, AC: BAC*0.32  },
    { week: 'W5',  PV: BAC*0.47, EV: BAC*0.40, AC: BAC*0.44  },
    { week: 'Now', PV: PV,       EV: EV,       AC: AC        },
  ].map(d => ({
    ...d,
    PV: Math.round(d.PV),
    EV: Math.round(d.EV),
    AC: Math.round(d.AC),
  }))

  return (
    <div className="space-y-4">

      {/* Status banners */}
      <div className="grid grid-cols-2 gap-3">
        {[scheduleStatus, costStatus].map(({ label, color, bg, icon: Icon }) => (
          <div key={label} className={clsx('rounded-xl border px-4 py-3 flex items-center gap-3', bg, 'border-current/20')}>
            <Icon className={clsx('w-5 h-5', color)} />
            <span className={clsx('text-sm font-semibold', color)}>{label}</span>
          </div>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map(({ label, value, sub, color, bg, icon: Icon }) => (
          <div key={label} className="card">
            <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center mb-2', bg)}>
              <Icon className={clsx('w-3.5 h-3.5', color)} />
            </div>
            <p className={clsx('text-lg font-bold', color)}>{value}</p>
            <p className="text-[10px] font-semibold text-civil-muted mt-0.5">{label}</p>
            <p className="text-[10px] text-civil-muted">{sub}</p>
          </div>
        ))}
      </div>

      {/* Variance summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className={clsx(
          'card border',
          pos(SV) ? 'border-green-900/40' : 'border-red-900/40'
        )}>
          <p className="text-xs text-civil-muted mb-1">Schedule Variance (SV)</p>
          <p className={clsx('text-xl font-bold', pos(SV) ? 'text-green-400' : 'text-red-400')}>
            {pos(SV) ? '+' : ''}{fmt(SV)}
          </p>
          <p className="text-[10px] text-civil-muted mt-1">
            {pos(SV) ? 'Ahead of plan' : 'Behind plan'}
          </p>
        </div>
        <div className={clsx(
          'card border',
          pos(CV) ? 'border-green-900/40' : 'border-red-900/40'
        )}>
          <p className="text-xs text-civil-muted mb-1">Cost Variance (CV)</p>
          <p className={clsx('text-xl font-bold', pos(CV) ? 'text-green-400' : 'text-red-400')}>
            {pos(CV) ? '+' : ''}{fmt(CV)}
          </p>
          <p className="text-[10px] text-civil-muted mt-1">
            {pos(CV) ? 'Under budget' : 'Over budget'}
          </p>
        </div>
      </div>

      {/* EVM Trend Chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-civil-text mb-1">EVM Trend</h3>
        <p className="text-xs text-civil-muted mb-4">PV vs EV vs AC over time</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
              <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 8, fontSize: 11 }}
                formatter={(v: number) => [`৳ ${v.toLocaleString()}`, '']}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }}
                formatter={v => <span style={{ color: '#94a3b8' }}>{v}</span>} />
              <Line type="monotone" dataKey="PV" name="PV (Planned)" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="EV" name="EV (Earned)"  stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="AC" name="AC (Actual)"  stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TCPI */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-civil-muted">TCPI (To-Complete Performance Index)</p>
            <p className={clsx(
              'text-2xl font-bold mt-1',
              TCPI <= 1 ? 'text-green-400' : 'text-red-400'
            )}>
              {fmtI(TCPI)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-civil-muted">ETC (Remaining Cost)</p>
            <p className="text-lg font-bold text-civil-accent mt-1">{fmt(ETC)}</p>
          </div>
        </div>
        <p className="text-[10px] text-civil-muted mt-2">
          {TCPI <= 1
            ? '✓ Remaining work can be completed within budget'
            : `⚠ Need ${fmtI(TCPI)}x efficiency to complete within budget`}
        </p>
      </div>
    </div>
  )
}
