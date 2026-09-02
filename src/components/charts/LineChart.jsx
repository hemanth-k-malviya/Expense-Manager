import { useMemo, useState } from 'react'
import { CHART_HEIGHT, CHART_PAD, CHART_WIDTH, ChartLegend, yTicks } from './ChartFrame'

export default function LineChart({ labels, series, formatValue }) {
  const [active, setActive] = useState(null)
  const width = CHART_WIDTH
  const height = CHART_HEIGHT
  const pad = CHART_PAD
  const innerWidth = width - pad.left - pad.right
  const innerHeight = height - pad.top - pad.bottom

  const { min, max, values: ticks } = useMemo(() => {
    const numbers = series.flatMap((item) => item.values)
    return yTicks(Math.min(0, ...numbers), Math.max(0, ...numbers))
  }, [series])

  const xFor = (index) => {
    if (labels.length <= 1) return pad.left + innerWidth / 2
    return pad.left + (index / (labels.length - 1)) * innerWidth
  }

  const yFor = (value) => pad.top + ((max - value) / (max - min || 1)) * innerHeight

  const paths = series.map((item) => {
    const d = item.values
      .map((value, index) => `${index === 0 ? 'M' : 'L'} ${xFor(index).toFixed(1)} ${yFor(value).toFixed(1)}`)
      .join(' ')
    return { ...item, d }
  })

  return (
    <div className="relative overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[200px] w-full min-w-0 sm:h-[240px]" role="img" aria-label="Line chart">
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={pad.left} x2={width - pad.right} y1={yFor(tick)} y2={yFor(tick)} stroke="#edf0eb" />
            <text x={pad.left - 8} y={yFor(tick) + 4} textAnchor="end" fill="#8a948e" fontSize="10">
              {formatValue(tick)}
            </text>
          </g>
        ))}

        {labels.map((label, index) => (
          <text key={`${label}-${index}`} x={xFor(index)} y={height - 10} textAnchor="middle" fill="#7d8782" fontSize="10">
            {label}
          </text>
        ))}

        {paths.map((item) => (
          <path key={item.id} d={item.d} fill="none" stroke={item.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        ))}

        {series.map((item) =>
          item.values.map((value, index) => (
            <circle
              key={`${item.id}-${index}`}
              cx={xFor(index)}
              cy={yFor(value)}
              r={active?.seriesId === item.id && active.index === index ? 5 : 3.5}
              fill="#fff"
              stroke={item.color}
              strokeWidth="2"
              className="cursor-pointer"
              onMouseEnter={() => setActive({ seriesId: item.id, index, label: item.label, value, month: labels[index] })}
              onMouseLeave={() => setActive(null)}
            />
          )),
        )}
      </svg>
      {active ? (
        <div className="pointer-events-none absolute right-3 top-2 rounded-[8px] border border-[#e4e8df] bg-white px-3 py-2 text-[11px] shadow-sm">
          <b className="block text-[#263b39]">{active.month}</b>
          <span className="text-[#5b6b67]">
            {active.label}: {formatValue(active.value)}
          </span>
        </div>
      ) : null}
      <ChartLegend series={series} />
    </div>
  )
}
