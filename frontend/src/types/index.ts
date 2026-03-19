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

export interface GridCell {
  grid_id: string
  cell_code: string
  vehicle_count: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
