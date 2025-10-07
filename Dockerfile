# ==========================================
# STAGE 1: Build Frontend (React + Vite)
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

# Copy frontend package files
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./

# Install ALL frontend dependencies (including dev deps for build)
RUN npm ci && \
    npm cache clean --force

# Copy frontend source code
COPY src ./src
COPY public ./public
COPY index.html ./

# Build frontend for production
RUN npm run build

# ==========================================
# STAGE 2: Build Backend (Node.js + Prisma)
# ==========================================
FROM node:20-alpine AS backend-builder

WORKDIR /backend

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy backend package files (explicitly copy both)
COPY ferraco-backend/package.json ferraco-backend/package-lock.json ./
COPY ferraco-backend/tsconfig.json ./
COPY ferraco-backend/prisma ./prisma/

# Install ALL backend dependencies (including dev deps for build)
RUN npm ci && \
    npm cache clean --force

# Copy backend source code
COPY ferraco-backend/src ./src

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ==========================================
# STAGE 3: Production Image (Nginx + Node.js)
# ==========================================
FROM nginx:alpine

# Install Node.js, wget, and sqlite for backend runtime
RUN apk add --no-cache nodejs npm wget sqlite

WORKDIR /app

# Create non-root user for Node.js backend
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy backend from builder
COPY --from=backend-builder --chown=nodejs:nodejs /backend/node_modules ./backend/node_modules
COPY --from=backend-builder --chown=nodejs:nodejs /backend/dist ./backend/dist
COPY --from=backend-builder --chown=nodejs:nodejs /backend/prisma ./backend/prisma
COPY --from=backend-builder --chown=nodejs:nodejs /backend/package*.json ./backend/

# Copy frontend build to nginx html directory
COPY --from=frontend-builder /frontend/dist /usr/share/nginx/html

# Create directories for data and logs
RUN mkdir -p /app/backend/data /app/backend/logs && \
    chown -R nodejs:nodejs /app/backend/data /app/backend/logs

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy startup script
COPY docker/startup.sh /startup.sh
RUN chmod +x /startup.sh

# Expose ports (80 for frontend, 3002 for backend internal)
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD wget --no-verbose --tries=1 --spider http://localhost/api/health || exit 1

# Start both nginx and backend
CMD ["/startup.sh"]
