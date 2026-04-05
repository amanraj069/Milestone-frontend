#Milestine Frontend

React + Vite frontend 

## Container Setup

This frontend is productionized with:

- `Dockerfile`: multi-stage build (Node 20 builder + Nginx runtime)
- `nginx.conf`: SPA-safe routing and static asset caching
- `.dockerignore`: reduced build context for faster, cleaner image builds
- `.env`: local frontend environment file

The final container serves static files from Nginx on port `80`.

## Prerequisites

- Docker Desktop (Windows/macOS) or Docker Engine with Compose plugin (Linux)
- Host port `3000` available

## Environment Variables

The project uses `.env` in this folder for local development values.

Common variables:

- `VITE_BACKEND_URL`: backend base URL compiled into the production frontend build
- `VITE_API_BASE_URL`: optional alias used in parts of the codebase

Example `.env`:

```env
VITE_BACKEND_URL=http://localhost:9000
VITE_API_BASE_URL=http://localhost:9000
```

Note: For Docker production builds, pass backend URL using build args:

```bash
docker build -t milestone-frontend --build-arg VITE_BACKEND_URL=http://localhost:9000 .
```

## Build and Run (Frontend Only)

Build image:

```bash
docker build -t milestone-frontend --build-arg VITE_BACKEND_URL=http://localhost:9000 .
```

Run container:

```bash
docker run --rm -p 3000:80 milestone-frontend
```

Open in browser:

```text
http://localhost:3000
```

## Nginx Behavior

- React Router support: unknown routes fallback to `/index.html`
- Aggressive cache headers for `/assets/*`
- Non-existing assets under `/assets/*` return `404`

## .dockerignore Behavior

The Docker context excludes:

- dependency/build folders (`node_modules`, `dist`, `coverage`)
- VCS/editor files (`.git`, `.vscode`, `.idea`)
- local environment files (`.env`, `.env.*`)
- docs and OS artifacts

This keeps image builds smaller and avoids leaking local environment values into Docker build context.

## Full Stack Run

From the backend workspace:

```bash
cd ../m-backend
docker compose up -d --build
```

Expected services:

- MongoDB: `27017`
- Backend API: `9000`
- Frontend: `3000`

## Troubleshooting

### Frontend loads, API calls fail

Rebuild frontend with the correct backend URL:

```bash
docker build -t milestone-frontend --build-arg VITE_BACKEND_URL=http://localhost:9000 .
```

### Routes return 404 after refresh

Ensure the container uses the included `nginx.conf` with SPA fallback:

`try_files $uri $uri/ /index.html;`
