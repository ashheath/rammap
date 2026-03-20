import { Pool } from 'pg';
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : undefined,
});
const mapVehicle = (row) => ({
    id: row.id,
    vrm: row.vrm,
    year: row.year,
    model: row.model,
    os_grid_cell: row.os_grid_cell,
    description: row.description || '',
    uses: Array.isArray(row.uses) ? row.uses : [],
    color: row.color || 'Black',
    trim: row.trim || '',
    generation: row.generation || 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
});
/**
 * Get all vehicles or filter by grid cell
 */
export const getVehicles = async (gridCell) => {
    const query = gridCell
        ? {
            text: `SELECT * FROM vehicles WHERE os_grid_cell = $1 ORDER BY created_at DESC`,
            values: [gridCell],
        }
        : {
            text: `SELECT * FROM vehicles ORDER BY created_at DESC`,
            values: [],
        };
    const result = await pool.query(query);
    return result.rows.map(mapVehicle);
};
/**
 * Get vehicle by VRM
 */
export const getVehicleByVRM = async (vrm) => {
    const result = await pool.query(`SELECT * FROM vehicles WHERE vrm = $1 LIMIT 1`, [vrm.toUpperCase()]);
    if (result.rowCount === 0)
        return undefined;
    return mapVehicle(result.rows[0]);
};
/**
 * Create or update vehicle
 */
export const saveVehicle = async (vehicle) => {
    const normalizedVRM = vehicle.vrm.toUpperCase();
    const result = await pool.query(`
      INSERT INTO vehicles (
        vrm, year, model, os_grid_cell, description, uses, color, trim, generation
      ) VALUES ($1, $2, $3, $4, $5, $6::text[], $7, $8, $9)
      ON CONFLICT (vrm)
      DO UPDATE SET
        year = EXCLUDED.year,
        model = EXCLUDED.model,
        os_grid_cell = EXCLUDED.os_grid_cell,
        description = EXCLUDED.description,
        uses = EXCLUDED.uses,
        color = EXCLUDED.color,
        trim = EXCLUDED.trim,
        generation = EXCLUDED.generation,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
        normalizedVRM,
        vehicle.year,
        vehicle.model,
        vehicle.os_grid_cell,
        vehicle.description || '',
        vehicle.uses || [],
        vehicle.color || 'Black',
        vehicle.trim || '',
        vehicle.generation || 1,
    ]);
    return mapVehicle(result.rows[0]);
};
/**
 * Delete vehicle (soft delete)
 */
export const deleteVehicle = async (vrm) => {
    const result = await pool.query(`DELETE FROM vehicles WHERE vrm = $1`, [vrm.toUpperCase()]);
    return (result.rowCount || 0) > 0;
};
/**
 * Clear all data (for testing)
 */
export const clearAllData = async () => {
    await pool.query(`TRUNCATE TABLE vehicles RESTART IDENTITY CASCADE`);
};
/**
 * Get database stats
 */
export const getStats = async () => {
    const vehicleResult = await pool.query(`SELECT COUNT(*)::int AS count FROM vehicles`);
    const gridResult = await pool.query(`SELECT COUNT(DISTINCT os_grid_cell)::int AS count FROM vehicles`);
    return {
        vehicleCount: vehicleResult.rows[0]?.count || 0,
        gridCells: gridResult.rows[0]?.count || 0,
    };
};
