import { useEffect, useRef } from 'react'
import { SCurvePoint } from '@/lib/cost-helpers'

interface Props {
  data: SCurvePoint[]
}

export default function SCurveChart({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || data.length === 0) return

    // Dynamic import Plotly to avoid SSR issues
    import('plotly.js-dist').then(Plotly => {
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
          line: { color: '#38bdf8', width: 2.5, shape: 'spline' },
          fill: 'tozeroy',
          fillcolor: 'rgba(56,189,248,0.06)',
        },
        // Actual S-curve
        {
          x: weeks,
          y: actual,
          name: 'Actual Progress',
          type: 'scatter',
          mode: 'lines+markers',
          line: { color: '#22c55e', width: 2.5, shape: 'spline' },
          marker: { size: 5, color: '#22c55e' },
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
        plot_bgcolor:  '#1a1d27',
        font:          { family: 'Inter, sans-serif', color: '#64748b', size: 11 },
        margin:        { t: 10, r: 20, b: 40, l: 50 },
        xaxis: {
          gridcolor:    '#2a2d3e',
          linecolor:    '#2a2d3e',
          tickcolor:    '#2a2d3e',
          title:        { text: 'Week', font: { size: 11 } },
          showgrid:     true,
        },
        yaxis: {
          gridcolor:    '#2a2d3e',
          linecolor:    '#2a2d3e',
          title:        { text: 'Cumulative Progress (%)', font: { size: 11 } },
          range:        [0, 105],
          showgrid:     true,
          ticksuffix:   '%',
        },
        legend: {
          bgcolor:      'rgba(30,33,48,0.8)',
          bordercolor:  '#2a2d3e',
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
          bgcolor:     '#1e2130',
          bordercolor: '#2a2d3e',
          font:        { family: 'Inter', size: 11, color: '#e2e8f0' },
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
        import('plotly.js-dist').then(Plotly => {
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
