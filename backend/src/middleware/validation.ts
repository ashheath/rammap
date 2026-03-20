import { Request, Response, NextFunction } from 'express'

const MILES_TO_METERS = 1609.344
const PRIVACY_CELL_AREA_SQ_MI = 20
const BASE_CELL_SIZE_METERS = MILES_TO_METERS * Math.sqrt(PRIVACY_CELL_AREA_SQ_MI)
const UK_IRELAND_BOUNDS = {
  minLat: 49.5,
  maxLat: 59.5,
  minLng: -10.8,
  maxLng: 2.5,
}

const isWithinUkIreland = (lat: number, lng: number): boolean => {
  return lat >= UK_IRELAND_BOUNDS.minLat &&
    lat <= UK_IRELAND_BOUNDS.maxLat &&
    lng >= UK_IRELAND_BOUNDS.minLng &&
    lng <= UK_IRELAND_BOUNDS.maxLng
}

const parseGridCellCenter = (gridCell: string): { lat: number; lng: number } | null => {
  const parts = gridCell.split('_')
  if (parts.length === 2) {
    const x = Number(parts[0])
    const y = Number(parts[1])
    if (Number.isNaN(x) || Number.isNaN(y)) return null

    // Legacy lat/lng-style cells.
    if (Math.abs(x) <= 200 && Math.abs(y) <= 200) {
      return { lat: x / 10 + 0.05, lng: y / 10 + 0.05 }
    }

    const lng = ((x + 0.5) * BASE_CELL_SIZE_METERS) / 111320
    const lat = ((y + 0.5) * BASE_CELL_SIZE_METERS) / 110540
    return { lat, lng }
  }

  return null
}

/**
 * Validate UK vehicle registration plate (VRM) format
 * UK format: 1-2 letters + 50-99 or 99-19 + 1-3 letters
 * Simplified: at least 5 characters, alphanumeric
 */
export const validateVRM = (vrm: string): boolean => {
  const cleanVRM = vrm.replace(/\s+/g, '').toUpperCase()
  // Simple UK VRM pattern - adjust as needed
  const vrmPattern = /^[A-Z]{2}\d{2}[A-Z]{3}$/
  return vrmPattern.test(cleanVRM) || cleanVRM.length >= 5
}

/**
 * Validate and normalize VRM
 */
export const normalizeVRM = (vrm: string): string => {
  return vrm.replace(/\s+/g, '').toUpperCase()
}

/**
 * Validate year is reasonable (1995 onwards, not future)
 */
export const validateYear = (year: number): boolean => {
  const currentYear = new Date().getFullYear()
  return year >= 1995 && year <= currentYear
}

/**
 * Validate model name
 */
export const validateModel = (model: string): boolean => {
  return model.trim().length >= 2 && model.trim().length <= 50
}

/**
 * Validate grid cell format (e.g., "TL123456" or simplified)
 */
export const validateGridCell = (gridCell: string): boolean => {
  if (!gridCell || gridCell.length < 2 || gridCell.length > 20) return false

  const center = parseGridCellCenter(gridCell)
  if (!center) return false

  return isWithinUkIreland(center.lat, center.lng)
}

/**
 * Express middleware for input validation
 */
export const validateVehicleInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { vrm, year, model, os_grid_cell } = req.body

  const errors: string[] = []

  if (vrm && !validateVRM(vrm)) {
    errors.push('Invalid registration plate format')
  }

  if (year && !validateYear(year)) {
    errors.push('Year must be between 1995 and current year')
  }

  if (model && !validateModel(model)) {
    errors.push('Model must be 2-50 characters')
  }

  if (os_grid_cell && !validateGridCell(os_grid_cell)) {
    errors.push('Invalid grid cell format')
  }

  // Optional color validation
  const allowedColors = ['Black', 'Red', 'Green', 'Yellow', 'Grey', 'Other']
  if (req.body.color && !allowedColors.includes(req.body.color)) {
    errors.push('Invalid color option')
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: errors.join('; ')
    })
  }

  // Attach normalized values to request
  req.body.vrm = normalizeVRM(vrm)

  next()
}

/**
 * Sanitize input to prevent SQL injection
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[;'\"]/g, '')
}
