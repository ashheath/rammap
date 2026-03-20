-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create OS Grid Cells table
CREATE TABLE IF NOT EXISTS os_grid_cells (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grid_id VARCHAR(10) UNIQUE NOT NULL,
  cell_code VARCHAR(20) NOT NULL UNIQUE,
  bounds GEOMETRY(POLYGON, 4326),
  vehicle_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vrm VARCHAR(10) UNIQUE NOT NULL,
  year INTEGER NOT NULL,
  model VARCHAR(100) NOT NULL,
  os_grid_cell VARCHAR(20) NOT NULL REFERENCES os_grid_cells(cell_code),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Submission Logs (for rate limiting and audit)
CREATE TABLE IF NOT EXISTS submission_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address VARCHAR(45),
  vrm VARCHAR(10),
  action VARCHAR(50),
  success BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_vehicles_os_grid_cell ON vehicles(os_grid_cell);
CREATE INDEX idx_vehicles_created_at ON vehicles(created_at);
CREATE INDEX idx_vehicles_vrm ON vehicles(vrm);
CREATE INDEX idx_os_grid_vehicle_count ON os_grid_cells(vehicle_count);

-- Create indexes for submission_logs
CREATE INDEX idx_ip_created ON submission_logs (ip_address, created_at);
CREATE INDEX idx_vrm_created ON submission_logs (vrm, created_at);

-- Trigger function to update `updated_at` on row updates
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to tables that have `updated_at`
CREATE TRIGGER set_updated_at_os_grid_cells
BEFORE UPDATE ON os_grid_cells
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_vehicles
BEFORE UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_submission_logs
BEFORE UPDATE ON submission_logs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Create function to update vehicle counter
CREATE OR REPLACE FUNCTION update_grid_cell_vehicle_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE os_grid_cells
  SET vehicle_count = (SELECT COUNT(*) FROM vehicles WHERE os_grid_cell = NEW.os_grid_cell)
  WHERE cell_code = NEW.os_grid_cell;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vehicle count
CREATE TRIGGER trigger_vehicle_created
AFTER INSERT ON vehicles
FOR EACH ROW
EXECUTE FUNCTION update_grid_cell_vehicle_count();

-- (Photo storage removed; photos table and triggers omitted)

-- Sample OS Grid cells for UK (1km squares)
-- Note: In production, import full OS grid data from official sources
INSERT INTO os_grid_cells (grid_id, cell_code) VALUES
  ('TL0', 'TL000000'),
  ('TL1', 'TL100000'),
  ('SU0', 'SU000000'),
  ('SU1', 'SU100000'),
  ('SP0', 'SP000000'),
  ('SP1', 'SP100000'),
  ('SD0', 'SD000000'),
  ('SD1', 'SD100000'),
  ('NS0', 'NS000000'),
  ('NS1', 'NS100000')
ON CONFLICT (cell_code) DO NOTHING;
