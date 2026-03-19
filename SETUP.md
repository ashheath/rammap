# Setup & Prerequisites

## ⚠️ Node.js Version Issue

**Current Version**: v11.13.0 (too old)  
**Required Version**: Node.js 18.x or higher

The project uses modern JavaScript features (nullish coalescing operator `??`, optional chaining, etc.) that require Node 14+. Update Node.js to proceed.

### How to Update Node.js

#### Option 1: Direct Download (Recommended)
1. Visit https://nodejs.org/
2. Download the LTS version (18.x or latest)
3. Install it (ensure it's added to PATH)
4. Verify: `node --version` should show v18+ after restart

#### Option 2: Using NVM (Node Version Manager)

**Windows (nvm-windows):**
```powershell
# Install nvm-windows from: https://github.com/coreybutler/nvm-windows
# Then:
nvm install 18.20.0
nvm use 18.20.0
node --version  # Should show v18.20.0
```

**macOS/Linux:**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18.20.0
nvm use 18.20.0
node --version  # Should show v18.20.0
```

---

## Installation Steps (After Node Update)

1. **Verify Node.js 18+**
   ```bash
   node --version  # Should show v18.x or higher
   npm --version   # Should show 8.x or higher
   ```

2. **Install Root Dependencies** (if any at root level)
   ```bash
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

5. **Set Up Database** (PostgreSQL required)
   ```bash
   # Create database
   psql -U postgres
   psql> CREATE DATABASE ram_tracker;
   psql> CREATE EXTENSION postgis;
   psql> \c ram_tracker
   psql> \i backend/src/db/schema.sql
   psql> \q
   ```

6. **Configure Environment**
   ```bash
   # Edit .env with your local settings
   # Copy from .env.example if .env doesn't exist
   cp .env.example .env  # On Windows: copy .env.example .env
   ```

7. **Start Development Servers**

   **Terminal 1 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

   **Terminal 2 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```

   Frontend will be available at: http://localhost:5173  
   Backend API at: http://localhost:3000/api

---

## Troubleshooting

### "node: command not found" or "Node version too old"
- **Solution**: Update Node.js to 18+ (see instructions above)
- Restart VS Code or terminal after installing Node.js

### "Cannot find module" after npm install
- Clear cache: `npm cache clean --force`
- Delete node_modules: `rm -r node_modules` (or `rmdir /s node_modules` on Windows)
- Reinstall: `npm install`

### PostgreSQL connection error
- Verify PostgreSQL is running
- Check DATABASE_URL in .env matches your setup
- Default: `postgresql://postgres:password@localhost:5432/ram_tracker`

### CORS errors in browser console
- Ensure backend is running on port 3000
- Check CORS_ORIGIN in .env is set to `http://localhost:5173`

---

## System Requirements

- **Node.js**: 18.x or higher (LTS recommended)
- **npm**: 8.x or higher (comes with Node)
- **PostgreSQL**: 12+ with PostGIS extension
- **OS**: Windows, macOS, or Linux
- **RAM**: 2GB minimum (4GB+ recommended)
- **Disk Space**: 500MB+ for node_modules

---

After updating Node.js, run:
```bash
cd frontend
npm install
npm run build  # This should now work
```

If build succeeds, project is ready for development!
