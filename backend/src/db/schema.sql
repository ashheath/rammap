-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vrm VARCHAR(10) UNIQUE NOT NULL,
  year INTEGER NOT NULL,
  model VARCHAR(100) NOT NULL,
  os_grid_cell VARCHAR(20) NOT NULL,
  description TEXT DEFAULT '',
  uses TEXT[] DEFAULT ARRAY[]::TEXT[],
  color VARCHAR(20) DEFAULT 'Black',
  trim VARCHAR(100) DEFAULT '',
  generation INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_os_grid_cell_fkey;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS uses TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT 'Black';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS trim VARCHAR(100) DEFAULT '';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS generation INTEGER DEFAULT 1;

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
CREATE INDEX IF NOT EXISTS idx_vehicles_os_grid_cell ON vehicles(os_grid_cell);
CREATE INDEX IF NOT EXISTS idx_vehicles_created_at ON vehicles(created_at);
CREATE INDEX IF NOT EXISTS idx_vehicles_vrm ON vehicles(vrm);
CREATE INDEX IF NOT EXISTS idx_vehicles_color ON vehicles(color);
CREATE INDEX IF NOT EXISTS idx_vehicles_model ON vehicles(model);

-- Create indexes for submission_logs
CREATE INDEX IF NOT EXISTS idx_ip_created ON submission_logs (ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_vrm_created ON submission_logs (vrm, created_at);

-- Trigger function to update `updated_at` on row updates
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to tables that have `updated_at`
DROP TRIGGER IF EXISTS set_updated_at_vehicles ON vehicles;
CREATE TRIGGER set_updated_at_vehicles
BEFORE UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_submission_logs ON submission_logs;
CREATE TRIGGER set_updated_at_submission_logs
BEFORE UPDATE ON submission_logs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- (Photo storage removed; photos table and triggers omitted)
