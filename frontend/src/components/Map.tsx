import { useEffect, useRef } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { Vehicle } from '../types';

interface MapProps {
  selectedCell: string | null
  vehicles: Vehicle[]
  onCellSelected: (cellCode: string) => void
  onVehicleSelected: (vehicle: Vehicle | null) => void
  onVisibleVehiclesChange: (vehicles: Vehicle[]) => void
}

const MILES_TO_METERS = 1609.344
const PRIVACY_CELL_AREA_SQ_MI = 20 // increased to 4× the previous (5 sq mi) for stronger privacy
const BASE_CELL_SIZE_METERS = MILES_TO_METERS * Math.sqrt(PRIVACY_CELL_AREA_SQ_MI)
const UK_IRELAND_BOUNDS = L.latLngBounds([49.5, -10.8], [59.5, 2.5])

const getRenderFactorForZoom = (zoom: number) => {
  if (zoom < 6) return 16
  if (zoom < 8) return 8
  if (zoom < 10) return 4
  if (zoom < 12) return 2
  return 1
}

const parseCellKey = (cellKey: string) => {
  const parts = cellKey.split('_')
  if (parts.length !== 2) return null
  const x = Number(parts[0])
  const y = Number(parts[1])
  if (Number.isNaN(x) || Number.isNaN(y)) return null
  return { x, y }
}

const ordinalSuffix = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return (s[(v - 20) % 10] || s[v] || s[0])
}

const formatCompactLabel = (v: Vehicle) => {
  const model = (v.model || '').replace(/^Ram\s+/i, '').trim()
  const trim = v.trim ? v.trim.trim() : ''
  const genNum = v.generation ? Number(v.generation) : undefined
  const gen = genNum ? `${genNum}${ordinalSuffix(genNum)} Gen` : ''
  const parts: string[] = []
  if (model) parts.push(model)
  if (trim) parts.push(trim)
  if (gen) parts.push(gen)
  return parts.join(', ')
}

const getCellBounds = (cellKey: string, crs: L.CRS): L.LatLngBounds | null => {
  const coords = parseCellKey(cellKey)
  if (!coords) return null

  // Backward compatibility for legacy lat/lng cells.
  if (Math.abs(coords.x) <= 200 && Math.abs(coords.y) <= 200) {
    const lat = coords.x / 10
    const lng = coords.y / 10
    return L.latLngBounds([lat, lng], [lat + 0.1, lng + 0.1])
  }

  const swPoint = L.point(coords.x * BASE_CELL_SIZE_METERS, coords.y * BASE_CELL_SIZE_METERS)
  const nePoint = L.point((coords.x + 1) * BASE_CELL_SIZE_METERS, (coords.y + 1) * BASE_CELL_SIZE_METERS)
  return L.latLngBounds(crs.unproject(swPoint), crs.unproject(nePoint))
}

const LeafletMap: React.FC<MapProps> = ({
  selectedCell,
  vehicles,
  onCellSelected,
  onVehicleSelected,
  onVisibleVehiclesChange,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)

  const gridLayer = useRef<L.LayerGroup | null>(null)
  const selectedLayer = useRef<L.LayerGroup | null>(null)
  const markersLayer = useRef<L.LayerGroup | null>(null)

  const vehiclesRef = useRef<Vehicle[]>(vehicles)
  const selectedCellRef = useRef<string | null>(selectedCell)
  const onCellSelectedRef = useRef(onCellSelected)
  const onVehicleSelectedRef = useRef(onVehicleSelected)
  const onVisibleVehiclesChangeRef = useRef(onVisibleVehiclesChange)

  useEffect(() => {
    vehiclesRef.current = vehicles
  }, [vehicles])

  useEffect(() => {
    selectedCellRef.current = selectedCell
  }, [selectedCell])

  useEffect(() => {
    onCellSelectedRef.current = onCellSelected
  }, [onCellSelected])

  useEffect(() => {
    onVehicleSelectedRef.current = onVehicleSelected
  }, [onVehicleSelected])

  useEffect(() => {
    onVisibleVehiclesChangeRef.current = onVisibleVehiclesChange
  }, [onVisibleVehiclesChange])

  const getVisibleVehicles = (bounds: L.LatLngBounds, crs: L.CRS, sourceVehicles: Vehicle[]) => {
    return sourceVehicles.filter((vehicle) => {
      const cellBounds = getCellBounds(vehicle.os_grid_cell, crs)
      return cellBounds ? bounds.intersects(cellBounds) : false
    })
  }

  const drawGrid = () => {
    if (!map.current || !gridLayer.current || !selectedLayer.current) return

    gridLayer.current.clearLayers()
    selectedLayer.current.clearLayers()

    const currentMap = map.current
    const bounds = currentMap.getBounds()
    const crs = currentMap.options.crs!
    const zoom = currentMap.getZoom()
    const renderFactor = getRenderFactorForZoom(zoom)
    const renderCellSize = BASE_CELL_SIZE_METERS * renderFactor

    const sw = crs.project(bounds.getSouthWest())
    const ne = crs.project(bounds.getNorthEast())

    const startX = Math.floor(sw.x / renderCellSize)
    const endX = Math.ceil(ne.x / renderCellSize)
    const startY = Math.floor(sw.y / renderCellSize)
    const endY = Math.ceil(ne.y / renderCellSize)

    const totalCells = (endX - startX + 1) * (endY - startY + 1)
    if (totalCells > 900) return

    for (let gx = startX; gx <= endX; gx += 1) {
      for (let gy = startY; gy <= endY; gy += 1) {
        const swPoint = L.point(gx * renderCellSize, gy * renderCellSize)
        const nePoint = L.point((gx + 1) * renderCellSize, (gy + 1) * renderCellSize)
        const swLatLng = crs.unproject(swPoint)
        const neLatLng = crs.unproject(nePoint)

        const rect = L.rectangle(L.latLngBounds(swLatLng, neLatLng), {
          color: '#8b8b8b',
          weight: 1,
          opacity: 0.85,
          fill: true,
          fillColor: 'rgba(0,0,0,0.01)',
          fillOpacity: 0.01,
          interactive: true,
          pane: 'gridPane',
        })

        rect.on('click', (e: L.LeafletMouseEvent) => {
          // Prevent native DOM/Leaflet highlight side-effects and ensure
          // selection callback always fires.
          try {
            e.originalEvent?.stopPropagation()
            e.originalEvent?.preventDefault()
          } catch (err) {
            // ignore if originalEvent not present
          }

          const mapCrs = map.current?.options.crs
          if (!mapCrs) return
          const p = mapCrs.project(e.latlng)
          const baseX = Math.floor(p.x / BASE_CELL_SIZE_METERS)
          const baseY = Math.floor(p.y / BASE_CELL_SIZE_METERS)
          onCellSelectedRef.current(`${baseX}_${baseY}`)
        })

        rect.addTo(gridLayer.current)
      }
    }

    // Draw selected-cell highlight (for users selecting a cell)
    const selKey = selectedCellRef.current
    if (selKey) {
      try {
        const selBounds = getCellBounds(selKey, currentMap.options.crs!)
        if (selBounds && selectedLayer.current) {
          const selRect = L.rectangle(selBounds, {
            color: '#3b82f6',
            weight: 2,
            opacity: 0.95,
            fill: true,
            fillColor: 'rgba(59,130,246,0.5)',
            fillOpacity: 0.5,
            interactive: false,
            pane: 'selectedPane'
          })
          selectedLayer.current.addLayer(selRect)
        }
      } catch (err) {
        // ignore drawing errors
      }
    }
  }

  const renderVehicleMarkers = () => {
    if (!map.current || !markersLayer.current) return
    markersLayer.current.clearLayers()

    const crs = map.current.options.crs!
    const zoom = map.current.getZoom()
    // compute a base icon from zoom (clamped), then apply a zoom-scale factor
    // Base multiplier is 2 (we already doubled). As the user zooms in, increase
    // up to a maximum multiplier of 4 (i.e., up to double the doubled size).
    const baseIcon = Math.max(24, Math.min(38, zoom * 2.8))
    const extraScale = Math.max(0, zoom - 6) // start scaling after zoom 6
    const extraMultiplier = Math.min(2, extraScale * 0.25) // each zoom adds 0.25, capped at 2
    const multiplier = 2 + extraMultiplier // between 2 and 4
    const iconSize = Math.round(baseIcon * multiplier)

    const pickupImgPathFor = (v: Vehicle | null) => {
      const colRaw = (v && v.color) ? v.color.toLowerCase() : 'black'
      // Map logical colour names to actual asset filenames (some assets use different casing/spelling)
      const mapping: Record<string, string> = {
        black: 'pickup-black.png',
        blue: 'pickup-blue.png',
        white: 'pickup-white.png',
        red: 'pickup-red.png',
        green: 'pickup-green.png',
        yellow: 'pickup-yellow.png',
        // file present as 'Pickup-grey.png' in assets — map 'grey' to that filename
        grey: 'Pickup-grey.png',
        other: 'pickup-other.png'
      }
      const fname = mapping[colRaw] || 'pickup-black.png'
      return `/assets/${fname}`
    }
    const pickupImgPath = pickupImgPathFor(null)

    const ramIcon = L.divIcon({
      className: 'ram-pin',
      html: `
        <div style="width:${iconSize}px;height:${iconSize}px;display:flex;align-items:center;justify-content:center;position:relative;">
          <img src="${pickupImgPath}" alt="pickup" style="width:${iconSize}px;height:${iconSize}px;object-fit:contain;display:block;" onerror="this.style.display='none';var s=this.nextElementSibling; if(s) s.style.display='block'" />
          <svg style="display:none" width="${iconSize}px" height="${iconSize}px" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="2" y="20" width="44" height="18" rx="2" fill="#f97316" />
            <rect x="38" y="14" width="18" height="12" rx="2" fill="#f97316" />
            <circle cx="16" cy="44" r="6" fill="#111827" />
            <circle cx="48" cy="44" r="6" fill="#111827" />
            <circle cx="16" cy="44" r="3" fill="#ffffff" />
            <circle cx="48" cy="44" r="3" fill="#ffffff" />
          </svg>
        </div>
      `,
      iconSize: [iconSize, iconSize],
      iconAnchor: [iconSize / 2, iconSize / 2],
      popupAnchor: [0, -iconSize / 2],
    })

    // Group vehicles by base cell key so we can show counts when multiple occupy same cell
    const cellToVehicles = new Map<string, Vehicle[]>()
    for (const vehicle of vehiclesRef.current) {
      const list = cellToVehicles.get(vehicle.os_grid_cell) || []
      list.push(vehicle)
      cellToVehicles.set(vehicle.os_grid_cell, list)
    }

    cellToVehicles.forEach((vehiclesInCell, cellKey) => {
      const cellBounds = getCellBounds(cellKey, crs)
      if (!cellBounds) return

      const marker = L.marker(cellBounds.getCenter(), {
        icon: ramIcon,
        pane: 'markerPane',
        riseOnHover: true,
      })

        if (vehiclesInCell.length === 1) {
        const vehicle = vehiclesInCell[0]
        // rebuild icon to use the vehicle colour
        const imgPath = pickupImgPathFor(vehicle)
        const coloredIcon = L.divIcon({
          className: 'ram-pin',
          html: `
            <div style="width:${iconSize}px;height:${iconSize}px;display:flex;align-items:center;justify-content:center;position:relative;">
              <img src="${imgPath}" alt="pickup" style="width:${iconSize}px;height:${iconSize}px;object-fit:contain;display:block;" onerror="this.style.display='none';var s=this.nextElementSibling; if(s) s.style.display='block'" />
              <svg style="display:none" width="${iconSize}px" height="${iconSize}px" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="2" y="20" width="44" height="18" rx="2" fill="#f97316" />
                <rect x="38" y="14" width="18" height="12" rx="2" fill="#f97316" />
                <circle cx="16" cy="44" r="6" fill="#111827" />
                <circle cx="48" cy="44" r="6" fill="#111827" />
                <circle cx="16" cy="44" r="3" fill="#ffffff" />
                <circle cx="48" cy="44" r="3" fill="#ffffff" />
              </svg>
            </div>
          `,
          iconSize: [iconSize, iconSize],
          iconAnchor: [iconSize / 2, iconSize / 2],
          popupAnchor: [0, -iconSize / 2],
        })
        marker.setIcon(coloredIcon)

        const compact = formatCompactLabel(vehicle) || vehicle.model
        // show a small compact tooltip (trim & generation, model without "Ram")
        try {
          marker.bindTooltip(compact, { direction: 'top', offset: [0, -iconSize / 2], className: 'vehicle-compact-tooltip' })
        } catch (err) {
          // ignore tooltip failures on very old leaflet builds
        }

        const usesText = (vehicle.uses || []).map((u) => u).join(', ')
        const desc = vehicle.description ? `<div style="margin-top:6px;color:#666">${vehicle.description}</div>` : ''
        const colorText = vehicle.color ? vehicle.color : 'N/A'

        // Detailed popup when selected: compact label, year, color, uses, description
        // NOTE: VRM is intentionally NOT shown to users for privacy
        marker.bindPopup(
          `<div style="font-size:13px;max-width:260px;color:#111"><strong>${compact}</strong><div style="margin-top:6px;font-size:12px;color:#444">Year: ${vehicle.year} • Color: ${colorText}</div>${desc}<div style="margin-top:6px;font-size:12px;color:#888">Uses: ${usesText || 'N/A'}</div></div>`
        )
        marker.on('click', () => onVehicleSelectedRef.current(vehicle))
        marker.on('popupclose', () => onVehicleSelectedRef.current(null))
        } else {
          // multi-vehicle marker: use generic black icon
          const imgPath = pickupImgPathFor(null)
          const groupedIcon = L.divIcon({
            className: 'ram-pin',
            html: `
              <div style="width:${iconSize}px;height:${iconSize}px;display:flex;align-items:center;justify-content:center;position:relative;">
                <img src="${imgPath}" alt="pickup" style="width:${iconSize}px;height:${iconSize}px;object-fit:contain;display:block;" onerror="this.style.display='none';var s=this.nextElementSibling; if(s) s.style.display='block'" />
                <svg style="display:none" width="${iconSize}px" height="${iconSize}px" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect x="2" y="20" width="44" height="18" rx="2" fill="#f97316" />
                  <rect x="38" y="14" width="18" height="12" rx="2" fill="#f97316" />
                  <circle cx="16" cy="44" r="6" fill="#111827" />
                  <circle cx="48" cy="44" r="6" fill="#111827" />
                  <circle cx="16" cy="44" r="3" fill="#ffffff" />
                  <circle cx="48" cy="44" r="3" fill="#ffffff" />
                </svg>
              </div>
            `,
            iconSize: [iconSize, iconSize],
            iconAnchor: [iconSize / 2, iconSize / 2],
            popupAnchor: [0, -iconSize / 2],
          })
          marker.setIcon(groupedIcon)
        const count = vehiclesInCell.length
        const listHtml = vehiclesInCell
          .map((v) => {
            const usesText = (v.uses || []).join(', ')
            const desc = v.description ? ` — ${v.description}` : ''
            const compactV = formatCompactLabel(v) || v.model
            return `<div style="margin-bottom:4px;font-size:12px;color:#ddd">${compactV} — ${v.year}${desc}<div style="color:#aaa;font-size:11px">Uses: ${usesText || 'N/A'}</div></div>`
          })
          .join('')

        marker.bindPopup(
          `<div style="font-size:13px;"><strong>${count} vehicles</strong><br/>${listHtml}</div>`
        )
        marker.on('popupclose', () => onVehicleSelectedRef.current(null))
        // clicking a multi-vehicle marker will only open the popup (no cell selection)
      }

      marker.addTo(markersLayer.current!)
    })
  }

  const updateMapState = () => {
    if (!map.current) return
    const bounds = map.current.getBounds()
    const crs = map.current.options.crs!
    const visible = getVisibleVehicles(bounds, crs, vehiclesRef.current)
    onVisibleVehiclesChangeRef.current(visible)

    drawGrid()
    renderVehicleMarkers()
  }

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const isMobileView = window.matchMedia('(max-width: 767px)').matches
    const initialCenter: [number, number] = isMobileView ? [53.8008, -1.5491] : [54.5, -3.5]
    const initialZoom = isMobileView ? 6 : 6

    map.current = L.map(mapContainer.current, {
      maxBounds: UK_IRELAND_BOUNDS,
      maxBoundsViscosity: 1,
      minZoom: 5,
    }).setView(initialCenter, initialZoom)

    map.current.createPane('gridPane')
    map.current.getPane('gridPane')!.style.zIndex = '350'

    map.current.createPane('selectedPane')
    map.current.getPane('selectedPane')!.style.zIndex = '450'

    map.current.createPane('markerPane')
    map.current.getPane('markerPane')!.style.zIndex = '650'

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current)

    // Ensure clicks anywhere on the map select the underlying base privacy cell.
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      try {
        if (!UK_IRELAND_BOUNDS.contains(e.latlng)) return
        const mapCrs = map.current?.options.crs
        if (!mapCrs) return
        const p = mapCrs.project(e.latlng)
        const baseX = Math.floor(p.x / BASE_CELL_SIZE_METERS)
        const baseY = Math.floor(p.y / BASE_CELL_SIZE_METERS)
        onCellSelectedRef.current(`${baseX}_${baseY}`)
      } catch (err) {
        // swallow errors
      }
    }
    map.current.on('click', handleMapClick)

    gridLayer.current = L.layerGroup().addTo(map.current)
    selectedLayer.current = L.layerGroup().addTo(map.current)
    markersLayer.current = L.layerGroup().addTo(map.current)

    let updateScheduled: number | null = null
    const scheduleUpdate = () => {
      if (updateScheduled !== null) return
      updateScheduled = window.setTimeout(() => {
        updateScheduled = null
        updateMapState()
      }, 120)
    }

    map.current.on('moveend', scheduleUpdate)
    map.current.on('zoomend', scheduleUpdate)

    updateMapState()

    return () => {
      if (!map.current) return
      map.current.off('moveend', scheduleUpdate)
      map.current.off('zoomend', scheduleUpdate)
      map.current.off('click', handleMapClick)
      map.current.remove()
      map.current = null
      gridLayer.current = null
      selectedLayer.current = null
      markersLayer.current = null
    }
  }, [])

  useEffect(() => {
    if (!map.current) return
    updateMapState()
  }, [vehicles, selectedCell])

  return <div ref={mapContainer} className="w-full h-full" style={{ minHeight: '500px' }} />
}

export default LeafletMap
