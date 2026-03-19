# Ram Map - Copilot Instructions

## Project Overview
UK RAM Pickup Location Tracker - Full-stack web application with mobile-responsive design, OS Grid mapping, vehicle database, and AWS S3 photo storage.

**Tech Stack:**
- Frontend: React 18 + Vite + Tailwind CSS + Leaflet (maps)
- Backend: Node.js + Express + PostgreSQL + PostGIS
- Storage: AWS S3 for photos
- Deployment: Vercel (frontend), Heroku/Railway (backend)

---

## Core Principles

1. **Mobile-First Responsive**: All components must work on 320px+ widths
2. **Privacy First**: Store only grid cell (1km²), never exact coordinates
3. **User Deduplication**: Use registration plate (VRM) as unique identifier
4. **Rate Limiting**: Prevent spam (10 vehicles, 30 photos per 15min per IP)
5. **Error Handling**: Graceful fallbacks for network/storage failures

---

## Development Standards

### Code Organization
- **Frontend**: Components in `src/components/`, types in `src/types/`, utilities in `src/utils/`
- **Backend**: Routes in `src/routes/`, middleware in `src/middleware/`, services in `src/services/`
- **Database**: Migrations in `src/db/`

### File Naming
- Components: PascalCase (e.g., `VehicleForm.tsx`)
- Utilities: camelCase (e.g., `geolocation.ts`)
- Routes: snake_case as URLs (e.g., `/api/vehicles`)

### API Response Format
```json
{
  "success": true,
  "data": { },
  "error": null
}
```

All API errors should return `success: false` with descriptive `error` message.

---

## Important Files

### Frontend
- `src/components/Map.tsx` - Leaflet map with OS Grid overlay and click handling
- `src/components/VehicleForm.tsx` - Form for adding/editing vehicles with photo upload
- `src/App.tsx` - Main layout (responsive: bottom sheet mobile, sidebar desktop)
- `tailwind.config.js` - Responsive breakpoints and touch-friendly sizing

### Backend
- `src/server.ts` - Express server with CORS and error handling
- `src/routes/vehicles.ts` - API endpoints (TODO: database implementation)
- `src/middleware/validation.ts` - VRM, year, model validation functions
- `src/services/s3.ts` - AWS S3 upload/delete/signed URLs
- `src/db/schema.sql` - PostgreSQL schema with PostGIS tables

### Environment
- `.env` - Local development (DO NOT commit)
- `.env.example` - Template with placeholders

---

## Common Tasks

### Add New Vehicle Endpoint
1. Update `backend/src/routes/vehicles.ts` with new route
2. Add database query using PostgreSQL client
3. Update `backend/src/middleware/validation.ts` if new input validation needed
4. Add rate limiter if needed
5. Test with Postman or Insomnia

### Update Frontend Component
1. Edit component in `src/components/`
2. Update TypeScript types in `src/types/index.ts` if needed
3. Use Tailwind CSS for responsive styling (mobile-first)
4. Test on multiple screen sizes (DevTools: 320px, 768px, 1024px)

### Database Changes
1. Update `backend/src/db/schema.sql` with new tables/indexes
2. Run schema migration: `psql -U postgres -d ram_tracker -f schema.sql`
3. Test queries locally before deploying
4. Update backend queries to use new schema

---

## Testing Checklist

Before committing code:

- [ ] **Mobile**: Test on physical device or DevTools (320px)
- [ ] **Desktop**: Test at 1024px+ width
- [ ] **API**: Verify 201 created, 200 success, 400 validation errors, 429 rate limit
- [ ] **Database**: Check for SQL errors in server logs
- [ ] **Photos**: Verify uploads to S3 (or mock in dev)
- [ ] **Input**: Try edge cases (empty strings, special chars, very long strings)
- [ ] **Rate Limit**: Submit 11+ items, verify 429 on 11th
- [ ] **Privacy**: Inspect DevTools Network/DOM, verify no exact lat/lon visible

---

## Debugging Tips

### Frontend Issues
- Open browser DevTools: Inspect Network tab for API calls, Console for errors
- Check VITE_API_URL in `.env` - should match backend port (3000)
- Tailwind classes not applying? Rebuild with `npm run dev`
- Map not showing? Verify Leaflet CSS imported and container has height

### Backend Issues
- Check server logs for errors when running `npm run dev`
- Verify DATABASE_URL connects to PostGIS database
- Use `curl` to test endpoints: `curl http://localhost:3000/api/vehicles`
- PostgreSQL not running? Start with `psql` or `brew services start postgresql`

### Database Issues
- Verify PostGIS installed: `psql -c "CREATE EXTENSION postgis;"`
- Check schema: `psql -d ram_tracker -c "\dt"` (list tables)
- Test queries: `SELECT * FROM vehicles;`

---

## Future Enhancements (v2+)

- [ ] PWA (service workers for offline queuing)
- [ ] Image compression using Sharp library
- [ ] User accounts with authentication
- [ ] Photo moderation queue
- [ ] Advanced filters (year range, model type)
- [ ] Export/analytics dashboard
- [ ] Real OS Grid integration (all UK cells, not sample)

---

## Deployment Checklist

### Before Pushing to Production

- [ ] Update version in `package.json`
- [ ] Test build: `npm run build` (both frontend and backend)
- [ ] Verify all env vars set (don't commit .env)
- [ ] Run full test checklist (see above)
- [ ] Performance check: Lighthouse >90 score
- [ ] Database backups configured
- [ ] SSL/HTTPS enabled
- [ ] CORS_ORIGIN set to production domain
- [ ] AWS S3 bucket configured with proper permissions
- [ ] Rate limits configured for production traffic

### Deployment Process

1. **Frontend** (Vercel/Netlify):
   ```bash
   npm run build
   # Deploy dist/ folder
   ```

2. **Backend** (Heroku/Railway):
   ```bash
   npm run build
   npm start
   # Set env vars in hosting platform dashboard
   ```

3. **Database** (Managed PostgreSQL):
   ```bash
   psql -h production-host -U admin -d ram_tracker -f schema.sql
   ```

---

## Contact & Support

For issues or questions:
1. Check README.md troubleshooting section
2. Review server logs: `npm run dev` output
3. Inspect browser DevTools for client-side errors
4. Test locally before deploying

---

**Last Updated**: March 18, 2026  
**Maintained By**: Development Team
