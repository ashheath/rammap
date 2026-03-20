import { useState, useRef } from 'react'
import axios from 'axios'


interface VehicleFormProps {
  gridCell: string | null
  vehicle?: {
    vrm?: string
    year: number
    model: string
    trim?: string
    generation?: number
    os_grid_cell: string
    description?: string
    uses?: string[]
  } | null
  onSubmit: () => void
}

const VehicleForm: React.FC<VehicleFormProps> = ({ gridCell, vehicle, onSubmit }) => {
  // Start with empty form — only auto-fill when user enters VRM
  const [vrm, setVrm] = useState('')
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [model, setModel] = useState('')
  const [trim, setTrim] = useState('')
  const [generation, setGeneration] = useState<number>(1)
  // photos removed — photo upload disabled for privacy/simplicity
  // Do not prefill description/uses from the `vehicle` prop; start empty
  const [description, setDescription] = useState<string>('')
  const [uses, setUses] = useState<string[]>([])
  const [color, setColor] = useState<string>('Black')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [vehicleExists, setVehicleExists] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isPlausibleVRM = (val: string) => {
    const nv = val.replace(/\s+/g, '').toUpperCase()
    const pattern = /^[A-Z]{2}\d{2}[A-Z]{3}$/
    return pattern.test(nv) || nv.length >= 5
  }

  // Do not auto-fill from `vehicle` prop. Form will only auto-fill when user
  // enters a VRM and blurs the field (see onBlur handler below).

  // photo handling removed

  const effectiveGridCell = gridCell || vehicle?.os_grid_cell

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate inputs
      if (!vrm.trim()) throw new Error('Registration plate is required')
      if (!model.trim()) throw new Error('Model is required')
      if (!effectiveGridCell) throw new Error('Select a grid cell on the map first')

      // Normalize VRM (remove spaces, uppercase)
      const normalizedVRM = vrm.replace(/\s+/g, '').toUpperCase()

      // Create vehicle entry
      await axios.post(
        `${import.meta.env.VITE_API_URL}/vehicles`,
        {
          vrm: normalizedVRM,
          year,
          model,
          trim,
          generation,
          os_grid_cell: effectiveGridCell,
          description,
          uses,
          color
        }
      )

      // photo uploads removed

      setSuccess(true)
      setVrm('')
      setYear(new Date().getFullYear())
      setModel('')
      setTrim('')
      setGeneration(1)
      setDescription('')
      setUses([])
      setColor('Black')
      if (fileInputRef.current) fileInputRef.current.value = ''

      setTimeout(() => {
        onSubmit()
      }, 1500)
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i)

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-900/90 rounded-lg border border-indigo-700 shadow-lg ring-1 ring-indigo-600/30 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-gray-100">Add a vehicle</h3>
      <p className="text-sm text-gray-200">Friendly note: enter the registration plate to auto-fill known details. Plates are kept private and won't be displayed.</p>

      {/* VRM Input */}
      <div>
        <label className="block text-sm font-semibold text-gray-200 mb-1">
          Registration Plate *
        </label>
        <input
          type="text"
          value={vrm}
          onChange={(e) => {
            setVrm(e.target.value)
            setVehicleExists(false)
          }}
            onBlur={async () => {
              // Auto-fill when VRM exists in DB. Use validateStatus so a 404
              // doesn't throw and clog the console — treat 404 as "not found".
              const nv = vrm.replace(/\s+/g, '').toUpperCase()
              if (!nv) return
              // Only query backend when VRM looks plausible to avoid noisy 404s
              if (!isPlausibleVRM(nv)) {
                setVehicleExists(false)
                return
              }
              try {
                const res = await axios.get(
                  `${import.meta.env.VITE_API_URL}/vehicles/${encodeURIComponent(nv)}`,
                  { validateStatus: (status) => status < 500 }
                )

                if (res.status === 200 && res.data && res.data.success && res.data.data) {
                  const v = res.data.data
                  setYear(v.year)
                    setModel(v.model)
                    setTrim(v.trim || '')
                    setGeneration(v.generation || 1)
                  setDescription(v.description || '')
                  setUses(v.uses || [])
                  setColor(v.color || 'Black')
                  setVehicleExists(true)
                } else {
                  // 404 or other non-2xx response — treat as not found
                  setVehicleExists(false)
                }
              } catch (err) {
                // Network or unexpected error — mark as not found but don't log
                setVehicleExists(false)
              }
            }}
          placeholder="e.g., AB23CDE"
          className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-lg shadow-sm"
          disabled={loading}
        />
        <p className="text-xs text-gray-300 mt-1">This uniquely identifies your vehicle for editing</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-200 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          rows={3}
          disabled={loading}
        />
        <p className="text-xs text-gray-400 mt-1">Example: mods, purchased 2020, new tyres</p>
      </div>

      {/* Uses (multi-select checkboxes) */}
      <div>
        <label className="block text-sm font-semibold text-gray-200 mb-1">Uses (select any)</label>
        <div className="flex flex-wrap gap-2">
          {['work', 'towing', 'domestic', 'pleasure', 'commercial', 'farm', 'offroad', 'show'].map((u) => (
            <label key={u} className="inline-flex items-center space-x-2">
              <input
                type="checkbox"
                checked={uses.includes(u)}
                onChange={(e) => {
                  if (e.target.checked) setUses((s) => [...s, u])
                  else setUses((s) => s.filter((x) => x !== u))
                }}
                disabled={loading}
              />
              <span className="text-sm text-gray-200 capitalize">{u}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Colour Select */}
      <div>
        <label className="block text-sm font-semibold text-gray-200 mb-1">Colour</label>
        <select
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          disabled={loading}
        >
          {['Black', 'White', 'Blue', 'Red', 'Green', 'Yellow', 'Grey', 'Other'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">Pick the vehicle colour — used to change the map icon.</p>
      </div>

      {/* Year Input */}
      <div>
        <label className="block text-sm font-semibold text-gray-200 mb-1">
          Year *
        </label>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          disabled={loading}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Model Input */}
      <div>
        <label className="block text-sm font-semibold text-gray-200 mb-1">
          Model *
        </label>
        {/* Model Select + Trim dependent select + Generation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select
            value={model}
            onChange={(e) => {
              setModel(e.target.value)
              // reset trim when model changes
              setTrim('')
            }}
            className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            disabled={loading}
          >
            <option value="">Select model</option>
            {['Ram 1500', 'Ram 2500', 'Ram 3500'].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={trim}
            onChange={(e) => setTrim(e.target.value)}
            className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            disabled={loading || !model}
          >
            <option value="">Select trim</option>
            {(model === 'Ram 1500' ? ['Tradesman', 'Big Horn', 'Laramie', 'Rebel', 'Limited', 'TRX', 'Sport', 'Built to Serve'] :
                model === 'Ram 2500' ? ['Tradesman', 'Laramie', 'Power Wagon', 'Limited', 'Rebel', 'Sport', 'Built to Serve'] :
                model === 'Ram 3500' ? ['Tradesman', 'Laramie', 'Limited', 'Rebel', 'Sport', 'Built to Serve'] :
                []).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={generation}
            onChange={(e) => setGeneration(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            disabled={loading}
          >
            {Array.from({ length: 6 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>{g} {g === 1 ? 'st' : g === 2 ? 'nd' : g === 3 ? 'rd' : 'th'} gen</option>
            ))}
          </select>
        </div>
      </div>

      {/* Photo upload removed */}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-800 border border-red-700 rounded text-white text-sm shadow-inner">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-800 border border-green-700 rounded text-white text-sm shadow-inner">
          Vehicle added/updated successfully!
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !vrm || !model || !trim}
        className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:from-indigo-400 hover:to-purple-400 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
      >
        {loading ? 'Saving...' : 'Save Vehicle'}
      </button>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={async () => {
            // Delete handler
            const nv = vrm.replace(/\s+/g, '').toUpperCase()
              if (!vehicleExists) return
            if (!confirm(`Delete vehicle with registration ${nv}? This cannot be undone.`)) return
            setLoading(true)
            setError(null)
            try {
              await axios.delete(`${import.meta.env.VITE_API_URL}/vehicles/${encodeURIComponent(nv)}`)
              setSuccess(true)
              setVrm('')
              setYear(new Date().getFullYear())
              setModel('')
              setTrim('')
              setGeneration(1)
              setDescription('')
              setUses([])
                setVehicleExists(false)
              setColor('Black')
              setTimeout(() => onSubmit(), 800)
            } catch (err: any) {
              setError(err.response?.data?.error || err.message || 'Delete failed')
            } finally {
              setLoading(false)
            }
          }}
            disabled={!vehicleExists || loading}
            className={`px-4 py-2 rounded border ${!vehicleExists || loading ? 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed' : 'bg-red-600 text-white border-red-700 hover:bg-red-700'}`}
        >
          Delete vehicle
        </button>

        <p className="text-xs text-gray-300">* Required fields.</p>
      </div>
    </form>
  )
}

export default VehicleForm
