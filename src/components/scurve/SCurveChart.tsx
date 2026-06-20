import { useEffect, useRef } from 'react'
import type * as PlotlyType from 'plotly.js'
import { SCurvePoint } from '@/lib/cost-helpers'

interface Props {
  data: SCurvePoint[]
}

export default function SCurveChart({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || data.length === 0) return

    // Dynamic import Plotly to avoid SSR issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import('plotly.js-dist').then((Plotly: any) => {
      const weeks    = data.map(d => d.week)
      const planned  = data.map(d => d.planned)
      const actual   = data.map(d => d.actual > 0 ? d.actual : null)
      const forecast = data.map(d => d.forecast ?? null)

      const traces: any[] = [
        // Planned S-curve
        {
          x: weeks,
          y: planned,
          name: 'Planned Progress',
          type: 'scatter',
          mode: 'lines',
          line: { color: '#1a56db', width: 2.5, shape: 'spline' },
          fill: 'tozeroy',
          fillcolor: 'rgba(26,86,219,0.06)',
        },
        // Actual S-curve
        {
          x: weeks,
          y: actual,
          name: 'Actual Progress',
          type: 'scatter',
          mode: 'lines+markers',
          line: { color: '#059669', width: 2.5, shape: 'spline' },
          marker: { size: 5, color: '#059669' },
          connectgaps: false,
        },
        // Forecast line
        {
          x: weeks,
          y: forecast,
          name: 'Forecast',
          type: 'scatter',
          mode: 'lines',
          line: { color: '#f59e0b', width: 2, dash: 'dash', shape: 'spline' },
          connectgaps: false,
        },
      ]

      const layout = {
        paper_bgcolor: 'transparent',
        plot_bgcolor:  '#ffffff',
        font:          { family: 'Inter, sans-serif', color: '#64748b', size: 11 },
        margin:        { t: 10, r: 20, b: 40, l: 50 },
        xaxis: {
          gridcolor:    '#e5e7eb',
          linecolor:    '#e5e7eb',
          tickcolor:    '#e5e7eb',
          title:        { text: 'Week', font: { size: 11 } },
          showgrid:     true,
        },
        yaxis: {
          gridcolor:    '#e5e7eb',
          linecolor:    '#e5e7eb',
          title:        { text: 'Cumulative Progress (%)', font: { size: 11 } },
          range:        [0, 105],
          showgrid:     true,
          ticksuffix:   '%',
        },
        legend: {
          bgcolor:      'rgba(255,255,255,0.95)',
          bordercolor:  '#e5e7eb',
          borderwidth:  1,
          font:         { size: 11 },
          orientation:  'h',
          x:            0,
          y:            1.12,
        },
        shapes: [
          // Today line
          {
            type:      'line',
            x0:        'Now',
            x1:        'Now',
            y0:        0,
            y1:        100,
            line:      { color: '#ef4444', width: 1.5, dash: 'dot' },
          },
        ],
        annotations: [
          {
            x:         'Now',
            y:         105,
            text:      'Today',
            showarrow: false,
            font:      { color: '#ef4444', size: 10 },
          },
        ],
        hoverlabel: {
          bgcolor:     '#ffffff',
          bordercolor: '#e5e7eb',
          font:        { family: 'Inter', size: 11, color: '#111827' },
        },
      }

      const config = {
        displayModeBar:  false,
        responsive:      true,
        scrollZoom:      false,
      }

      Plotly.default.newPlot(ref.current!, traces, layout as any, config)
    })

    return () => {
      if (ref.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        import('plotly.js-dist').then((Plotly: any) => {
          Plotly.default.purge(ref.current!)
        })
      }
    }
  }, [data])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-civil-muted text-sm">
        Generate WBS and assign start/end dates to see S-Curve.
      </div>
    )
  }

  return <div ref={ref} style={{ width: '100%', height: '320px' }} />
}
