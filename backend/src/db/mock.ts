/**
 * Mock In-Memory Database
 * Stores vehicles in RAM (resets on server restart)
 * Perfect for development and testing
 */

export interface Vehicle {
  id: string
  vrm: string
  year: number
  model: string
  os_grid_cell: string
  trim?: string
  generation?: number
  description?: string
  uses?: string[]
  color?: string
  created_at: string
  updated_at: string
}

// In-memory storage
const vehicles = new Map<string, Vehicle>()

/**
 * Get all vehicles or filter by grid cell
 */
export const getVehicles = (gridCell?: string): Vehicle[] => {
  const allVehicles = Array.from(vehicles.values())
  const mapEnsure = (v: Vehicle) => ({
    ...v,
    description: v.description || '',
    uses: v.uses || [],
    color: v.color || 'Black',
    trim: v.trim || '',
    generation: v.generation || 1
  })
  if (gridCell) {
    return allVehicles.filter((v) => v.os_grid_cell === gridCell).map(mapEnsure)
  }
  return allVehicles.map(mapEnsure)
}

/**
 * Get vehicle by VRM
 */
export const getVehicleByVRM = (vrm: string): Vehicle | undefined => {
  const v = vehicles.get(vrm.toUpperCase())
  if (!v) return undefined
  return {
    ...v,
    description: v.description || '',
    uses: v.uses || [],
    color: v.color || 'Black',
    trim: v.trim || '',
    generation: v.generation || 1
  }
}

/**
 * Create or update vehicle
 */
export const saveVehicle = (vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>): Vehicle => {
  const normalizedVRM = vehicle.vrm.toUpperCase()
  const now = new Date().toISOString()

  console.log('saveVehicle payload:', JSON.stringify(vehicle))

  if (vehicles.has(normalizedVRM)) {
    // Update existing
    const existing = vehicles.get(normalizedVRM)!
    const updated: Vehicle = {
      ...existing,
      ...vehicle,
      vrm: normalizedVRM,
      updated_at: now
    }
    vehicles.set(normalizedVRM, updated)
    console.log(`✓ Updated vehicle: ${normalizedVRM}`)
    return updated
  } else {
    // Create new
    const newVehicle: Vehicle = {
      id: Math.random().toString(36).substring(7),
      vrm: normalizedVRM,
      year: vehicle.year,
      model: vehicle.model,
      os_grid_cell: vehicle.os_grid_cell,
      description: (vehicle as any).description || '',
      uses: (vehicle as any).uses || [],
      color: (vehicle as any).color || 'Black',
      trim: (vehicle as any).trim || '',
      generation: (vehicle as any).generation || 1,
      created_at: now,
      updated_at: now
    }
    vehicles.set(normalizedVRM, newVehicle)
    console.log(`✓ Created vehicle: ${normalizedVRM}`)
    return newVehicle
  }
}

/**
 * Delete vehicle (soft delete)
 */
export const deleteVehicle = (vrm: string): boolean => {
  const normalizedVRM = vrm.toUpperCase()
  if (vehicles.has(normalizedVRM)) {
    vehicles.delete(normalizedVRM)
    console.log(`✓ Deleted vehicle: ${normalizedVRM}`)
    return true
  }
  return false
}

// Photo storage removed for privacy; no photo records are kept in the mock DB

/**
 * Clear all data (for testing)
 */
export const clearAllData = (): void => {
  vehicles.clear()
  // photos cleared implicitly since photo support removed
  console.log('✓ All data cleared')
}

/**
 * Get database stats
 */
export const getStats = () => {
  return {
    vehicleCount: vehicles.size,
    gridCells: Array.from(new Set(Array.from(vehicles.values()).map((v) => v.os_grid_cell))).length
  }
}
