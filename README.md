# Ram Map - UK

A mobile-responsive web application for locating RAM vehicles across the UK using privacy-focused grid-based mapping. Users can add, update, and view RAM vehicle locations at square-mile precision without exposing exact coordinates.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+ with PostGIS extension
- AWS S3 bucket (optional, for photo storage)

### Setup

1. **Clone & Install Dependencies**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   cd backend && npm install && cd ..
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database and AWS credentials
   ```

3. **Set Up Database**
   ```bash
   psql -U postgres
   psql> CREATE DATABASE ram_tracker;
   psql> \c ram_tracker
   psql> \i backend/src/db/schema.sql
   ```

4. **Start Development Servers**
   
   In one terminal (frontend):
   ```bash
   cd frontend
   npm run dev
   ```

   In another terminal (backend):
   ```bash
   cd backend
   npm run dev
   ```

5. **Open in Browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api

---

## 📁 Project Structure

```
root/
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── components/         # Map, VehicleForm, etc.
│   │   ├── pages/              # SearchPage, etc.
│   │   ├── utils/              # Helpers
│   │   ├── hooks/              # Custom React hooks
│   │   ├── types/              # TypeScript interfaces
│   │   ├── App.tsx             # Main app component
│   │   └── main.tsx            # Entry point
│   ├── tailwind.config.js      # Tailwind CSS config
│   ├── vite.config.ts          # Vite config
│   └── package.json
│
├── backend/                     # Node.js + Express
│   ├── src/
│   │   ├── routes/             # API endpoints
│   │   ├── middleware/         # Validation, auth, etc.
│   │   ├── services/           # S3, DB, business logic
│   │   ├── db/                 # Database schema & migrations
│   │   └── server.ts           # Express server
│   └── package.json
│
├── .env.example                 # Environment variables template
├── .github/
│   └── copilot-instructions.md  # Copilot AI guidelines
└── README.md                    # This file
```

---

## 🗺️ Features

### Map & Grid System
- **OS Grid Overlay**: Map divided into 1km² square-mile cells
- **Click to Select**: Click any cell to view RAMs in that area
- **Geolocation**: Use device location to find nearby cells
- **Mobile-Friendly**: Fully responsive design for phones, tablets, and desktops

### Vehicle Management
- **Add/Edit RAM**: Enter registration plate (VRM), year, model
- **Photo Upload**: Upload up to 5 photos per vehicle
- **Deduplication**: Same VRM allows editing instead of creating duplicates
- **Privacy**: Grid cell granularity - never exposes exact coordinates

### Search & Discovery
- **Search by VRM**: Find specific vehicles by registration plate
- **Search by Grid**: Jump to specific grid cell code
- **Vehicle Details**: View year, model, photos, and upload date

### Technical Highlights
- **Rate Limiting**: Prevent spam (10 vehicles/15min, 30 photos/15min per IP)
- **Input Validation**: VRM format, year range, model length checked
- **AWS S3 Integration**: Photos stored in cloud, not on server
- **PostgreSQL + PostGIS**: Geographic queries and grid cell management
- **CORS Enabled**: Works across different domains

---

## 🔧 API Endpoints

### Vehicles
- `GET /api/vehicles` - List vehicles (by grid_cell or grid_bounds)
- `GET /api/vehicles/:vrm` - Get vehicle details
- `POST /api/vehicles` - Create new vehicle
- `PATCH /api/vehicles/:vrm` - Update vehicle
- `DELETE /api/vehicles/:vrm` - Delete vehicle (soft delete)

### Photos
- `POST /api/vehicles/:vrm/photos` - Upload photo
- `GET /api/vehicles/:vrm/photos` - List photos
- `DELETE /api/vehicles/:vrm/photos/:photoId` - Delete photo

### Health
- `GET /health` - Server health check

---

## 🛡️ Privacy & Security

✅ **No Exact Coordinates**: Locations stored only at grid cell level (≈1km²)  
✅ **Input Sanitization**: All user inputs validated and escaped  
✅ **Rate Limiting**: Prevents spam and DoS attacks  
✅ **HTTPS Ready**: Deploy with SSL/TLS certificates  
✅ **VRM Deduplication**: Database uniqueness constraint on registration plates  
✅ **Soft Deletes**: Vehicle data preserved for history/audit  

---

## 📱 Mobile Optimization

- **Touch-Friendly**: 44px minimum tap targets
- **Responsive Layout**: Adapts to 320px - 1920px widths
- **Bottom Sheet (Mobile)**: Vehicle list slides up from bottom
- **Side Panel (Desktop)**: Vehicle list shown in sidebar
- **Camera Integration**: Mobile devices can take photos directly
- **Geolocation API**: Detect user location for nearby cells

---

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel or Netlify
```

### Backend (Heroku/Railway/EC2)
```bash
cd backend
npm run build
npm start
# Or deploy as Docker container
```

### Environment Variables Required
- Backend: `DATABASE_URL`, `AWS_*`, `PORT`, `CORS_ORIGIN`
- Frontend: `VITE_API_URL`

---

## 📊 Database Schema

### Tables
- **vehicles**: id, vrm (unique), year, model, os_grid_cell, photos_count, timestamps
- **photos**: id, vehicle_id (FK), s3_url, timestamps
- **os_grid_cells**: grid_id, cell_code, bounds (geometry), vehicle_count
- **submission_logs**: ip_address, vrm, action, success, timestamps (for rate limiting/audit)

### Indexes
- VRM (for O(1) lookups)
- Grid cell (for geographic queries)
- Created/updated timestamps (for sorting/filtering)

---

## 🐛 Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Ensure PostgreSQL is running and DATABASE_URL is correct in .env

### CORS Error in Console
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Check CORS_ORIGIN in backend .env matches your frontend URL

### S3 Upload Fails
```
InvalidAccessKeyId: The AWS Access Key Id you provided is not valid
```
**Solution**: Verify AWS credentials in .env and ensure bucket name is correct

### Map Not Displaying
**Solution**: Check browser console for Leaflet warnings; ensure Leaflet CSS is loaded

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Add vehicle without photos
- [ ] Add vehicle with photos
- [ ] Edit existing vehicle (same VRM)
- [ ] Search by VRM
- [ ] Search by grid cell
- [ ] Test on mobile (iPhone, Android)
- [ ] Test geolocation
- [ ] Verify photos appear in gallery
- [ ] Test rate limiting (add 11+ vehicles)

### Performance Targets
- Lighthouse score: >90 (mobile)
- Page load: <3 seconds
- API response: <200ms average

---

## 📝 Notes

- **OS Grid Cells**: Currently using sample cells. Full UK grid (2.5M cells) requires PostGIS spatial index
- **Photo Compression**: Future enhancement using Sharp library for image optimization
- **PWA Support**: Consider adding service workers for offline queuing (v2)
- **Mobile Camera**: `capture="environment"` enables rear camera on Android

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and test locally
3. Submit pull request with description

---

## 📄 License

MIT License - see LICENSE file for details

---

## 👨‍💻 Support

For issues or questions:
1. Check [troubleshooting section](#-troubleshooting) above
2. Review browser DevTools console for errors
3. Check backend server logs: `npm run dev` output

---

**Last Updated**: March 2026  
**Project Status**: Active Development (MVP Phase)
