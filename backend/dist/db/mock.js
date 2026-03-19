/**
 * Mock In-Memory Database
 * Stores vehicles in RAM (resets on server restart)
 * Perfect for development and testing
 */
// In-memory storage
const vehicles = new Map();
/**
 * Get all vehicles or filter by grid cell
 */
export const getVehicles = (gridCell) => {
    const allVehicles = Array.from(vehicles.values());
    const mapEnsure = (v) => ({
        ...v,
        description: v.description || '',
        uses: v.uses || [],
        color: v.color || 'Black',
        trim: v.trim || '',
        generation: v.generation || 1
    });
    if (gridCell) {
        return allVehicles.filter((v) => v.os_grid_cell === gridCell).map(mapEnsure);
    }
    return allVehicles.map(mapEnsure);
};
/**
 * Get vehicle by VRM
 */
export const getVehicleByVRM = (vrm) => {
    const v = vehicles.get(vrm.toUpperCase());
    if (!v)
        return undefined;
    return {
        ...v,
        description: v.description || '',
        uses: v.uses || [],
        color: v.color || 'Black',
        trim: v.trim || '',
        generation: v.generation || 1
    };
};
/**
 * Create or update vehicle
 */
export const saveVehicle = (vehicle) => {
    const normalizedVRM = vehicle.vrm.toUpperCase();
    const now = new Date().toISOString();
    console.log('saveVehicle payload:', JSON.stringify(vehicle));
    if (vehicles.has(normalizedVRM)) {
        // Update existing
        const existing = vehicles.get(normalizedVRM);
        const updated = {
            ...existing,
            ...vehicle,
            vrm: normalizedVRM,
            updated_at: now
        };
        vehicles.set(normalizedVRM, updated);
        console.log(`✓ Updated vehicle: ${normalizedVRM}`);
        return updated;
    }
    else {
        // Create new
        const newVehicle = {
            id: Math.random().toString(36).substring(7),
            vrm: normalizedVRM,
            year: vehicle.year,
            model: vehicle.model,
            os_grid_cell: vehicle.os_grid_cell,
            description: vehicle.description || '',
            uses: vehicle.uses || [],
            color: vehicle.color || 'Black',
            trim: vehicle.trim || '',
            generation: vehicle.generation || 1,
            created_at: now,
            updated_at: now
        };
        vehicles.set(normalizedVRM, newVehicle);
        console.log(`✓ Created vehicle: ${normalizedVRM}`);
        return newVehicle;
    }
};
/**
 * Delete vehicle (soft delete)
 */
export const deleteVehicle = (vrm) => {
    const normalizedVRM = vrm.toUpperCase();
    if (vehicles.has(normalizedVRM)) {
        vehicles.delete(normalizedVRM);
        console.log(`✓ Deleted vehicle: ${normalizedVRM}`);
        return true;
    }
    return false;
};
// Photo storage removed for privacy; no photo records are kept in the mock DB
/**
 * Clear all data (for testing)
 */
export const clearAllData = () => {
    vehicles.clear();
    // photos cleared implicitly since photo support removed
    console.log('✓ All data cleared');
};
/**
 * Get database stats
 */
export const getStats = () => {
    return {
        vehicleCount: vehicles.size,
        gridCells: Array.from(new Set(Array.from(vehicles.values()).map((v) => v.os_grid_cell))).length
    };
};
