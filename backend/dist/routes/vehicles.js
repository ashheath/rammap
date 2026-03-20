import { Router } from 'express';
// multer removed — photo uploads disabled for privacy
import rateLimit from 'express-rate-limit';
import { validateVehicleInput, normalizeVRM } from '../middleware/validation.js';
import * as db from '../db/mock.js';
const router = Router();
// photo upload support removed for privacy
// Rate limiting
const createVehicleLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: 'Too many vehicles created from this IP, please try again later'
});
// photo upload support removed for privacy
/**
 * GET /api/vehicles - List vehicles by grid cell or bounds
 * Query params:
 *   - grid_cell: specific grid cell code
 *   - grid_bounds: bounding box (minLat,minLng,maxLat,maxLng)
 */
router.get('/', async (req, res) => {
    try {
        const { grid_cell, vrm } = req.query;
        if (vrm) {
            // Search by VRM
            const vehicle = await db.getVehicleByVRM(vrm);
            if (vehicle) {
                return res.json({
                    success: true,
                    data: vehicle
                });
            }
            return res.json({
                success: true,
                data: null
            });
        }
        // Return vehicles in grid cell
        const vehicles = await db.getVehicles(grid_cell || undefined);
        res.json({
            success: true,
            data: vehicles
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/vehicles/:vrm - Get vehicle details
 */
router.get('/:vrm', async (req, res) => {
    try {
        const { vrm } = req.params;
        const normalizedVRM = normalizeVRM(vrm);
        const vehicle = await db.getVehicleByVRM(normalizedVRM);
        // Return 200 with null data when not found to avoid browser-level 404
        // entries in the Network console when the app checks for an existing VRM.
        if (!vehicle) {
            return res.json({
                success: true,
                data: null
            });
        }
        res.json({
            success: true,
            data: vehicle
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/vehicles - Create a new vehicle
 */
router.post('/', createVehicleLimiter, validateVehicleInput, async (req, res) => {
    try {
        const { vrm, year, model, os_grid_cell, description, uses, color, trim, generation } = req.body;
        const vehicle = await db.saveVehicle({
            vrm,
            year,
            model,
            os_grid_cell,
            description: description || '',
            uses: Array.isArray(uses) ? uses : [],
            color: color || 'Black',
            trim: trim || '',
            generation: Number.isFinite(Number(generation)) ? Number(generation) : 1
        });
        res.status(201).json({
            success: true,
            data: vehicle
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * PATCH /api/vehicles/:vrm - Update vehicle
 */
router.patch('/:vrm', validateVehicleInput, async (req, res) => {
    try {
        const { vrm } = req.params;
        const { year, model, os_grid_cell } = req.body;
        const normalizedVRM = normalizeVRM(vrm);
        const existing = await db.getVehicleByVRM(normalizedVRM);
        if (!existing) {
            return res.status(404).json({
                success: false,
                error: `Vehicle ${normalizedVRM} not found`
            });
        }
        const updated = await db.saveVehicle({
            vrm: normalizedVRM,
            year: year || existing.year,
            model: model || existing.model,
            os_grid_cell: os_grid_cell || existing.os_grid_cell,
            description: req.body.description || existing.description || '',
            uses: Array.isArray(req.body.uses) ? req.body.uses : (existing.uses || []),
            color: req.body.color || existing.color || 'Black',
            trim: req.body.trim || existing.trim || '',
            generation: Number.isFinite(Number(req.body.generation)) ? Number(req.body.generation) : (existing.generation || 1)
        });
        res.json({
            success: true,
            data: updated
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * DELETE /api/vehicles/:vrm - Delete vehicle (soft delete)
 */
router.delete('/:vrm', async (req, res) => {
    try {
        const { vrm } = req.params;
        const normalizedVRM = normalizeVRM(vrm);
        const deleted = await db.deleteVehicle(normalizedVRM);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: `Vehicle ${normalizedVRM} not found`
            });
        }
        res.json({
            success: true,
            message: `Vehicle ${normalizedVRM} deleted successfully`
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// photo endpoints removed for privacy
/**
 * GET /api/stats - Get database statistics
 */
router.get('/debug/stats', async (req, res) => {
    try {
        const stats = await db.getStats();
        res.json({
            success: true,
            data: {
                ...stats,
                message: 'Using PostgreSQL database',
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/vehicles/debug/clear - Clear all in-memory test data (development only)
 */
router.post('/debug/clear', async (req, res) => {
    try {
        await db.clearAllData();
        res.json({ success: true, message: 'Database cleared' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
export default router;
