const MILES_TO_METERS = 1609.344;
const PRIVACY_CELL_AREA_SQ_MI = 20;
const BASE_CELL_SIZE_METERS = MILES_TO_METERS * Math.sqrt(PRIVACY_CELL_AREA_SQ_MI);
const WEB_MERCATOR_RADIUS = 6378137;
const UK_IRELAND_BOUNDS = {
    minLat: 49.5,
    maxLat: 59.5,
    minLng: -10.8,
    maxLng: 2.5,
};
const isWithinUkIreland = (lat, lng) => {
    return lat >= UK_IRELAND_BOUNDS.minLat &&
        lat <= UK_IRELAND_BOUNDS.maxLat &&
        lng >= UK_IRELAND_BOUNDS.minLng &&
        lng <= UK_IRELAND_BOUNDS.maxLng;
};
const parseGridCellCenter = (gridCell) => {
    const parts = gridCell.split('_');
    if (parts.length === 2) {
        const x = Number(parts[0]);
        const y = Number(parts[1]);
        if (Number.isNaN(x) || Number.isNaN(y))
            return null;
        // Legacy lat/lng-style cells.
        if (Math.abs(x) <= 200 && Math.abs(y) <= 200) {
            return { lat: x / 10 + 0.05, lng: y / 10 + 0.05 };
        }
        const projectedX = (x + 0.5) * BASE_CELL_SIZE_METERS;
        const projectedY = (y + 0.5) * BASE_CELL_SIZE_METERS;
        const lng = (projectedX / WEB_MERCATOR_RADIUS) * (180 / Math.PI);
        const lat = (2 * Math.atan(Math.exp(projectedY / WEB_MERCATOR_RADIUS)) - Math.PI / 2) * (180 / Math.PI);
        return { lat, lng };
    }
    return null;
};
/**
 * Validate UK vehicle registration plate (VRM) format
 * UK format: 1-2 letters + 50-99 or 99-19 + 1-3 letters
 * Simplified: at least 5 characters, alphanumeric
 */
export const validateVRM = (vrm) => {
    const cleanVRM = vrm.replace(/\s+/g, '').toUpperCase();
    // Simple UK VRM pattern - adjust as needed
    const vrmPattern = /^[A-Z]{2}\d{2}[A-Z]{3}$/;
    return vrmPattern.test(cleanVRM) || cleanVRM.length >= 5;
};
/**
 * Validate and normalize VRM
 */
export const normalizeVRM = (vrm) => {
    return vrm.replace(/\s+/g, '').toUpperCase();
};
/**
 * Validate year is reasonable (1995 onwards, not future)
 */
export const validateYear = (year) => {
    const currentYear = new Date().getFullYear();
    return year >= 1995 && year <= currentYear;
};
/**
 * Validate model name
 */
export const validateModel = (model) => {
    return model.trim().length >= 2 && model.trim().length <= 50;
};
/**
 * Validate grid cell format (e.g., "TL123456" or simplified)
 */
export const validateGridCell = (gridCell) => {
    if (!gridCell || gridCell.length < 2 || gridCell.length > 20)
        return false;
    const center = parseGridCellCenter(gridCell);
    if (!center)
        return false;
    return isWithinUkIreland(center.lat, center.lng);
};
/**
 * Express middleware for input validation
 */
export const validateVehicleInput = (req, res, next) => {
    const { vrm, year, model, os_grid_cell } = req.body;
    const errors = [];
    if (vrm && !validateVRM(vrm)) {
        errors.push('Invalid registration plate format');
    }
    if (year && !validateYear(year)) {
        errors.push('Year must be between 1995 and current year');
    }
    if (model && !validateModel(model)) {
        errors.push('Model must be 2-50 characters');
    }
    if (os_grid_cell && !validateGridCell(os_grid_cell)) {
        errors.push('Invalid grid cell format');
    }
    // Optional color validation
    const allowedColors = ['Black', 'Blue', 'Red', 'Green', 'Yellow', 'Grey', 'Other'];
    if (req.body.color && !allowedColors.includes(req.body.color)) {
        errors.push('Invalid color option');
    }
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: errors.join('; ')
        });
    }
    // Attach normalized values to request
    req.body.vrm = normalizeVRM(vrm);
    next();
};
/**
 * Sanitize input to prevent SQL injection
 */
export const sanitizeInput = (input) => {
    return input.trim().replace(/[;'\"]/g, '');
};
