import { useMemo, useState } from 'react'
import { CHART_HEIGHT, CHART_PAD, CHART_WIDTH, ChartLegend, yTicks } from './ChartFrame'

export default function BarChart({ labels, series, formatValue }) {
  const [active, setActive] = useState(null)
  const width = CHART_WIDTH
  const height = CHART_HEIGHT
  const pad = CHART_PAD
  const innerWidth = width - pad.left - pad.right
  const innerHeight = height - pad.top - pad.bottom
  const groupCount = Math.max(labels.length, 1)
  const groupWidth = innerWidth / groupCount
  const barGap = 4
  const barWidth = Math.max(8, (groupWidth - 16 - barGap * (series.length - 1)) / series.length)

  const { min, max, values: ticks } = useMemo(() => {
    const numbers = series.flatMap((item) => item.values)
    return yTicks(Math.min(0, ...numbers), Math.max(0, ...numbers))
  }, [series])

  const yFor = (value) => pad.top + ((max - value) / (max - min || 1)) * innerHeight
  const zeroY = yFor(0)

  return (
    <div className="relative overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[200px] w-full min-w-0 sm:h-[240px]" role="img" aria-label="Bar chart">
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={pad.left} x2={width - pad.right} y1={yFor(tick)} y2={yFor(tick)} stroke="#edf0eb" />
            <text x={pad.left - 8} y={yFor(tick) + 4} textAnchor="end" fill="#8a948e" fontSize="10">
              {formatValue(tick)}
            </text>
          </g>
        ))}

        {labels.map((label, groupIndex) => {
          const groupX = pad.left + groupIndex * groupWidth + 8
          return (
            <g key={`${label}-${groupIndex}`}>
              {series.map((item, seriesIndex) => {
                const value = item.values[groupIndex] || 0
                const x = groupX + seriesIndex * (barWidth + barGap)
                const y = value >= 0 ? yFor(value) : zeroY
                const barHeight = Math.max(Math.abs(yFor(value) - zeroY), value === 0 ? 0 : 1)
                return (
                  <rect
                    key={`${item.id}-${groupIndex}`}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="3"
                    fill={item.color}
                    className="cursor-pointer"
                    onMouseEnter={() => setActive({ label: item.label, value, month: label })}
                    onMouseLeave={() => setActive(null)}
                  />
                )
              })}
              <text x={groupX + ((series.length * barWidth + barGap * (series.length - 1)) / 2)} y={height - 10} textAnchor="middle" fill="#7d8782" fontSize="10">
                {label}
              </text>
            </g>
          )
        })}
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
