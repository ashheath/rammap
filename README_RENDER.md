Quick Render deployment

1) Push this repository to GitHub.

2) On Render dashboard:
   - Create a new service from the repository using the `render.yaml` manifest (choose "Create services from a render.yaml").
   - If Render prompts, accept provisioning for the two services defined: `ram-locator-backend` and `ram-locator-frontend`.

3) Environment variables (set in Render dashboard for the backend service):
   - `DATABASE_URL` = Postgres connection string (render-managed Postgres or external DB).
   - `NODE_ENV` = `production`
   - `PORT` = `3000`

   For the frontend (static site), set:
   - `VITE_API_URL` = `https://YOUR_BACKEND_SERVICE.onrender.com` (or the Render service URL once deployed).

4) Database schema:
   - If you use Render's managed Postgres, create the DB and run `backend/src/db/schema.sql` using `psql` or Render's SQL UI.

5) Notes & troubleshooting:
   - The backend is built from `backend/Dockerfile` (Docker environment on Render). The frontend is built using `npm ci && npm run build` inside `frontend/` and served as a static site from `frontend/dist`.
   - If you require PostGIS, Render's managed Postgres may not provide PostGIS by default — consider using a provider that exposes PostGIS or a managed DB that supports extensions.

6) After services are created, update `VITE_API_URL` to point to the backend service URL and redeploy the frontend.

If you want, I can also create a Git commit for these files and guide you through pushing them to GitHub next.