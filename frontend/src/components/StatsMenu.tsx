import { useEffect, useState } from 'react'
import axios from 'axios'

interface Vehicle {
  id: string
  year: number
  model: string
  trim?: string
  generation?: number
  os_grid_cell: string
  description?: string
  uses?: string[]
  color?: string
}

const PieChart: React.FC<{ data: Record<string, number>; size?: number; title?: string; palette: string[] }> = ({ data, size = 160, title, palette }) => {
  const total = Object.values(data).reduce((s, v) => s + v, 0)
  let angleStart = 0
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 4

  const entries = Object.entries(data)
  const segments = entries.map(([k, v]) => {
    const portion = total === 0 ? 0 : v / total
    const angle = portion * Math.PI * 2
    const x1 = cx + r * Math.cos(angleStart)
    const y1 = cy + r * Math.sin(angleStart)
    const angleEnd = angleStart + angle
    const x2 = cx + r * Math.cos(angleEnd)
    const y2 = cy + r * Math.sin(angleEnd)
    const large = angle > Math.PI ? 1 : 0
    const path = portion === 0 ? '' : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
    angleStart = angleEnd
    return { key: k, value: v, path }
  })

  return (
    <div className="flex flex-col items-center">
      {title && <div className="text-sm text-gray-200 mb-2">{title}</div>}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((s, i) => (
          s.path ? <path key={s.key} d={s.path} fill={palette[i % palette.length]} stroke="#00000010" strokeWidth={0.5} /> : null
        ))}
      </svg>
      <div className="mt-2 text-xs text-gray-300">
        {total} total
      </div>
    </div>
  )
}

const StatsMenu: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/vehicles`)
        setVehicles(res.data.data || [])
      } catch (err: any) {
        setError('Failed to load stats')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const aggregate = (key: keyof Vehicle) => {
    const out: Record<string, number> = {}
    vehicles.forEach((v) => {
      const val = (v as any)[key]
      if (Array.isArray(val)) {
        val.forEach((x) => out[x] = (out[x] || 0) + 1)
      } else if (val === undefined || val === null || val === '') {
        out['Unspecified'] = (out['Unspecified'] || 0) + 1
      } else {
        out[String(val)] = (out[String(val)] || 0) + 1
      }
    })
    return out
  }

  const colors = aggregate('color')
  const models = aggregate('model')
  const trims = aggregate('trim')
  const generations = aggregate('generation')
  const years = aggregate('year')
  const uses = aggregate('uses')

  const palette = ['#111827', '#ef4444', '#10b981', '#f59e0b', '#64748b', '#a78bfa', '#f97316', '#06b6d4', '#84cc16', '#fb7185', '#60a5fa']
  const colorPaletteByLabel: Record<string, string> = {
    black: '#111827',
    red: '#ef4444',
    green: '#22c55e',
    yellow: '#facc15',
    grey: '#9ca3af',
    gray: '#9ca3af',
    other: '#8b5cf6',
    unspecified: '#475569'
  }
  const colorsPalette = Object.keys(colors).map((label) => colorPaletteByLabel[label.toLowerCase()] || '#60a5fa')

  return (
    <div className="p-4 bg-gray-900 text-gray-100 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold">Community snapshot</h3>
          <p className="text-xs text-gray-400">Overview of reported vehicles (grid-cell level only)</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="px-3 py-1 bg-gray-800 text-gray-200 rounded border border-gray-700">Close</button>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-300">Loading…</div>}
      {error && <div className="text-sm text-red-500">{error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-2 bg-gray-800 rounded border border-gray-700">
            <PieChart data={colors} title={`Colours`} palette={colorsPalette} />
            <div className="mt-2 text-xs text-gray-300">Legend</div>
            <div className="mt-1 text-xs text-gray-300 space-y-1">
              {Object.entries(colors).map(([k, v], i) => (
                <div key={k} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ width: 14, height: 12, background: colorsPalette[i % colorsPalette.length], display: 'inline-block', borderRadius: 3, border: '1px solid rgba(255,255,255,0.2)' }} />
                    <span>{k}</span>
                  </div>
                  <div className="text-gray-400">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-2 bg-gray-800 rounded border border-gray-700">
            <PieChart data={models} title={`Models`} palette={palette} />
            <div className="mt-2 text-xs text-gray-300">Top models</div>
            <div className="mt-1 text-xs text-gray-300 space-y-1">
              {Object.entries(models).slice(0, 8).map(([k, v], i) => (
                <div key={k} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ width: 14, height: 12, background: palette[i % palette.length], display: 'inline-block', borderRadius: 3 }} />
                    <span>{k}</span>
                  </div>
                  <div className="text-gray-400">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-2 bg-gray-800 rounded border border-gray-700">
            <PieChart data={trims} title={`Trims`} palette={palette} />
            <div className="mt-2 text-xs text-gray-300">Trims</div>
            <div className="mt-1 text-xs text-gray-300 space-y-1">
              {Object.entries(trims).slice(0, 12).map(([k, v], i) => (
                <div key={k} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ width: 14, height: 12, background: palette[i % palette.length], display: 'inline-block', borderRadius: 3 }} />
                    <span>{k}</span>
                  </div>
                  <div className="text-gray-400">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-2 bg-gray-800 rounded border border-gray-700">
            <PieChart data={generations} title={`Generations`} palette={palette} />
            <div className="mt-2 text-xs text-gray-300">Generations</div>
            <div className="mt-1 text-xs text-gray-300 space-y-1">
              {Object.entries(generations).map(([k, v], i) => (
                <div key={k} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ width: 14, height: 12, background: palette[i % palette.length], display: 'inline-block', borderRadius: 3 }} />
                    <span>{k}</span>
                  </div>
                  <div className="text-gray-400">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-2 bg-gray-800 rounded border border-gray-700">
            <PieChart data={years} title={`Years`} palette={palette} />
            <div className="mt-2 text-xs text-gray-300">Vehicle Years</div>
            <div className="mt-1 text-xs text-gray-300 space-y-1">
              {Object.entries(years).map(([k, v], i) => (
                <div key={k} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ width: 14, height: 12, background: palette[i % palette.length], display: 'inline-block', borderRadius: 3 }} />
                    <span>{k}</span>
                  </div>
                  <div className="text-gray-400">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-2 bg-gray-800 rounded border border-gray-700">
            <PieChart data={uses} title={`Uses`} palette={palette} />
            <div className="mt-2 text-xs text-gray-300">Uses</div>
            <div className="mt-1 text-xs text-gray-300 space-y-1">
              {Object.entries(uses).map(([k, v], i) => (
                <div key={k} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ width: 14, height: 12, background: palette[i % palette.length], display: 'inline-block', borderRadius: 3 }} />
                    <span>{k}</span>
                  </div>
                  <div className="text-gray-400">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default StatsMenu
