import { useEffect, useState } from 'react'
import './App.css'
import LeafletMap from './components/Map'
import VehicleForm from './components/VehicleForm'
import StatsMenu from './components/StatsMenu'
import axios from 'axios'

import { Vehicle } from './types';

function App() {
  const [selectedCell, setSelectedCell] = useState<string | null>(null)
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([])
  const [visibleVehicles, setVisibleVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showVehicleList, setShowVehicleList] = useState(false)
  // debug/test controls hidden for normal users

  const fetchAllVehicles = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/vehicles`)
      setAllVehicles(response.data.data || [])
    } catch (error) {
      console.error('Failed to load vehicles', error)
      setAllVehicles([])
    }
  }

  // clear DB/debug endpoints are not exposed to normal users

  // Privacy mode enabled; only vehicle data is fetched

  useEffect(() => {
    fetchAllVehicles()
  }, [])

  useEffect(() => {
    if (selectedCell) {
      setSelectedVehicle(null)
    }
  }, [selectedCell])

  const handleVehicleSelect = (vehicle: Vehicle | null) => {
    setSelectedVehicle(vehicle)
  }

  const handleVisibleVehiclesChange = (vehicles: Vehicle[]) => {
    setVisibleVehicles(vehicles)
  }

  return (
    <div className="app-container h-screen flex flex-col md:flex-row bg-white text-gray-900">
      {/* Header */}
      <header
        className="bg-gray-900 text-gray-100 px-3 pb-1.5 md:hidden border-b border-gray-700"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)' }}
      >
        <h1 className="text-4xl leading-tight font-extrabold tracking-tight">Ram Map</h1>
        <p className="text-[11px] text-gray-300 mt-0.5">Find RAM vehicles across the UK</p>
        <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Tap + to add. Tap Stats for charts.</p>
      </header>

      {/* Map - Full width on mobile, left side on desktop */}
      <div className="flex-1 md:w-2/3 order-2 md:order-1 max-h-screen overflow-hidden">
        <LeafletMap
          selectedCell={selectedCell}
          vehicles={allVehicles}
          onCellSelected={setSelectedCell}
          onVehicleSelected={handleVehicleSelect}
          onVisibleVehiclesChange={handleVisibleVehiclesChange}
        />
        <div className="p-2 text-sm text-gray-600 bg-white border-t border-gray-200">
          Tip: use the map to browse vehicles. Click a marker to see details, or press '+' to report a new one.
        </div>
      </div>

      {/* Sidebar - Mobile bottom sheet or desktop side panel (dark mode) */}
      <div className="md:w-1/3 md:border-l md:border-gray-700 bg-gray-900 text-gray-100 order-1 md:order-2 h-auto md:h-full md:max-h-screen md:flex md:flex-col overflow-y-auto">
        {/* Mobile controls */}
        <div className="md:hidden sticky top-0 bg-gray-900 border-b border-gray-700 px-3 py-1.5 z-10">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => {
                setShowForm(!showForm)
                if (!showForm) setShowStats(false)
              }}
              className="flex-1 bg-blue-600 text-white py-1 px-2.5 rounded font-semibold text-sm"
            >
              {showForm ? 'Hide Form' : 'Add Vehicle'}
            </button>
            <button
              onClick={() => {
                setShowStats(!showStats)
                if (!showStats) setShowForm(false)
              }}
              className="flex-1 bg-gray-800 text-white py-1 px-2.5 rounded border border-gray-700 text-sm"
            >
              {showStats ? 'Close Stats' : 'Stats'}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{visibleVehicles.length} vehicle{visibleVehicles.length === 1 ? '' : 's'} in view</p>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block sticky top-0 bg-gray-900 border-b border-gray-700 p-4 z-10 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-100 mb-2">Ram Map</h2>
          <div className="text-sm text-gray-300 mb-3">
            <p className="mb-1">Quick tips</p>
            <ul className="list-disc list-inside text-xs text-gray-400">
              <li>Use the map to find vehicles nearby.</li>
              <li>Use '+' to add or edit your vehicle.</li>
              <li>Plates are private and never shown publicly.</li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded font-semibold hover:from-indigo-500 hover:to-purple-500 transition"
            >
              {showForm ? 'Hide Form' : 'Add/Edit RAM'}
            </button>

              <button
                onClick={() => {
                  setShowStats(!showStats)
                  // ensure form is hidden when stats open
                  if (!showStats) setShowForm(false)
                }}
                className="w-full bg-gray-800 text-white py-2 px-4 rounded font-medium border border-gray-700 hover:bg-gray-700 transition"
              >
                {showStats ? 'Close Stats' : 'View Stats'}
              </button>

            {/* Debug and Clear DB controls removed for normal users */}
          </div>

          <p className="text-xs text-gray-400 mt-2">
            Showing {visibleVehicles.length} vehicle{visibleVehicles.length === 1 ? '' : 's'} in view.
          </p>
        </div>

        {/* Form Container */}
        <div className={`${showForm ? 'block' : 'hidden'} p-4 md:border-b md:border-gray-700 flex-shrink-0 bg-gray-900`}>
          <VehicleForm
            gridCell={selectedCell}
            vehicle={selectedVehicle}
            onSubmit={() => {
              setShowForm(false)
              fetchAllVehicles()
            }}
          />
        </div>

        {showStats && (
          <div className="p-4 md:border-b md:border-gray-700 flex-shrink-0 bg-gray-900">
            <StatsMenu onClose={() => setShowStats(false)} />
          </div>
        )}

        {/* Debug panel hidden from normal users */}

        {/* Vehicle List + Details */}
        <div className="px-3 pt-2 pb-1 md:p-4 flex-1 overflow-y-auto">
          <button
            onClick={() => setShowVehicleList((s) => !s)}
            className="w-full md:hidden text-left flex items-center justify-between bg-gray-800 border border-gray-700 rounded px-3 py-1.5 mb-1"
          >
            <span className="text-sm font-semibold text-gray-100">Vehicles visible ({visibleVehicles.length})</span>
            <span className="text-gray-400">{showVehicleList ? 'Hide' : 'Show'}</span>
          </button>
          <h3 className="hidden md:block text-lg font-semibold text-gray-100 mb-4">Vehicles visible on the map</h3>
          <p className="text-[10px] text-gray-400 mb-0 md:mb-2">Tap a vehicle to view details.</p>

          <div className={`${showVehicleList ? 'block' : 'hidden md:block'}`}>
            {visibleVehicles.length === 0 ? (
              <p className="text-gray-400">No vehicles in view. Pan/zoom the map or add one.</p>
            ) : (
              <div className="space-y-3">
                {visibleVehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => handleVehicleSelect(vehicle)}
                    className="w-full text-left border border-gray-700 rounded p-3 hover:shadow-md transition bg-gray-900"
                  >
                    <p className="font-semibold text-gray-100">{vehicle.model}</p>
                    <p className="text-sm text-gray-400">
                      {vehicle.year}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedVehicle && (
            <div className="hidden md:block mt-6 p-4 border border-gray-700 rounded bg-gray-900 text-gray-100">
              <h4 className="text-lg font-semibold text-gray-100 mb-2">Selected vehicle</h4>
              <p className="text-sm text-gray-100 mb-1">
                <strong>Model:</strong> {selectedVehicle.year} {selectedVehicle.model}
              </p>
              {/* Grid cell hidden from normal users */}
              {selectedVehicle.description && (
                <p className="text-sm text-gray-300 mb-2">{selectedVehicle.description}</p>
              )}

              {selectedVehicle.uses && selectedVehicle.uses.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedVehicle.uses.map((u) => (
                    <span key={u} className="text-xs bg-gray-800 text-gray-200 px-2 py-1 rounded">{u}</span>
                  ))}
                </div>
              )}

              {/* Detailed meta removed for users (privacy/minimal UI) */}
            </div>
          )}
        </div>
      </div>

      {/* Mobile floating action button */}
      <button
        onClick={() => {
          setShowStats(!showStats)
          if (!showStats) setShowForm(false)
        }}
        className="md:hidden fixed left-4 bg-gray-900 text-white rounded-full min-w-14 h-14 px-4 flex items-center justify-center shadow-lg border border-gray-700 hover:bg-gray-800 transition font-semibold text-sm z-50"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
      >
        {showStats ? 'Close' : 'Stats'}
      </button>

      <button
        onClick={() => {
          setShowForm(!showForm)
          if (!showForm) setShowStats(false)
        }}
        className="md:hidden fixed right-4 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-700 transition font-bold text-xl z-50"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
      >
        {showForm ? '✕' : '+'}
      </button>
    </div>
  )
}

export default App
