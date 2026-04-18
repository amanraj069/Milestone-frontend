# syntax=docker/dockerfile:1.7

# -----------------------------
# Build stage (Vite production build)
# -----------------------------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Declare build-time arguments passed from docker-compose.
ARG VITE_BACKEND_URL
ARG VITE_API_BASE_URL
ARG VITE_RAZORPAY_KEY_ID

# Export them as environment variables so they are available to 'npm run build'.
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID

# Install dependencies with lockfile for deterministic builds.
COPY package*.json ./
RUN npm ci

# Copy source and create optimized static assets.
COPY . .
RUN npm run build

# -----------------------------
# Runtime stage (Nginx static hosting)
# -----------------------------
FROM nginx:1.27-alpine AS runtime

# Replace default Nginx site config with SPA-friendly config.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy generated Vite output.
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Healthcheck confirms Nginx serves the app entrypoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]