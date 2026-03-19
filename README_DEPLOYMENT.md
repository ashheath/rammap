Deployment (Docker / unRAID)
=============================

This project can be published on your server using Docker. The repo includes a sample `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, and a `caddy/Caddyfile` for reverse-proxy + automatic HTTPS.

Quick checklist before starting
- Ensure your domain's A record points to your server's public static IP.
- Forward ports 80 and 443 to your server (router). Caddy needs these to obtain TLS certificates.
- Have Docker (and optionally Docker Compose v2) available on your unRAID server.

Steps (recommended)

1. Copy the repository (or pull from git) to a folder on your server.

2. Edit `caddy/Caddyfile` and replace `example.com` with your domain.

3. (Optional) Create an env file for secrets and database connection and reference it in `docker-compose.yml` or set variables in unRAID's container UI.

4. From the project root run:

```powershell
docker compose up -d --build
```

This will build `backend` and `frontend`, and start `caddy` which will obtain TLS certificates and route traffic.

How routing works
- Requests to `https://your-domain/` are served by the `frontend` container.
- Requests to `https://your-domain/api/...` are proxied to the `backend` container on port 3000.

unRAID notes
- You can import the `docker-compose.yml` into unRAID via Community Applications (there are plugins that let you run compose stacks), or create three separate containers using the Docker tab and point Caddy to the correct network and volumes.
- If you prefer Traefik instead of Caddy, I can provide an alternate `docker-compose.yml` with Traefik labels.

Security & privacy
- The Caddy reverse proxy will request Let's Encrypt certificates automatically when domain and ports are correct.
- This repo intentionally stores only grid-cell level location data; no exact coordinates are recorded.

If you want, I can:
- Customize the `Caddyfile` for subdomains (api.example.com + app.example.com).
- Provide a Traefik version for unRAID's preferred stack.
- Create an `env_file` template and example `.env.production` with required variables.
