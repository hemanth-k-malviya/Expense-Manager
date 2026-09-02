export const CHART_WIDTH = 720
export const CHART_HEIGHT = 280
export const CHART_PAD = { top: 18, right: 16, bottom: 36, left: 52 }

export function niceMax(value) {
  if (!Number.isFinite(value) || value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return nice * magnitude
}

export function yTicks(min, max, count = 4) {
  const top = niceMax(Math.max(Math.abs(min), Math.abs(max), 1))
  const bottom = min < 0 ? -top : 0
  const steps = count
  const values = []
  for (let index = 0; index <= steps; index += 1) {
    values.push(bottom + ((top - bottom) * index) / steps)
  }
  return { min: bottom, max: top, values }
}

export function ChartLegend({ series }) {
  return (
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-[#5b6b67]">
      {series.map((item) => (
        <span key={item.id} className="inline-flex items-center gap-2">
          <i className="h-2 w-3 rounded-sm" style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  )
}
