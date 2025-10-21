# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ferraco CRM** is a full-stack customer relationship management system with WhatsApp integration, built as a monorepo using npm workspaces. The system features lead management, real-time WhatsApp messaging, automation, AI-powered chatbot, and comprehensive reporting.

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Socket.IO client
- **Backend**: Node.js + Express + TypeScript + Prisma ORM + Socket.IO server
- **Database**: PostgreSQL (production) / SQLite (development)
- **WhatsApp**: WPPConnect (migrated from Venom Bot for better stability)
- **Monorepo**: npm workspaces

## Architecture

### Monorepo Structure
```
ferraco/
├── apps/
│   ├── frontend/        # React SPA (@ferraco/frontend)
│   └── backend/         # Express API (@ferraco/backend)
├── packages/
│   └── shared/          # Shared types, utils, constants (@ferraco/shared)
└── package.json         # Root workspace config
```

### WhatsApp Integration - Stateless Architecture (2025)
The system uses a **stateless architecture** for WhatsApp:
- Messages and conversations are fetched **directly from WhatsApp** via WPPConnect (no PostgreSQL persistence)
- PostgreSQL stores **only metadata** (tags, leadId, notes)
- Real-time updates via Socket.IO
- On-demand fetching ensures data consistency

**Key Services:**
- `whatsappService.ts` - Core WPPConnect integration, session management
- `whatsappServiceExtended.ts` - Extended WhatsApp operations
- `whatsappChatService.ts` - Chat/conversation management
- `whatsappListeners.ts` - Event handlers for incoming messages

### Backend Module Pattern
Backend uses a consistent module structure:
```
modules/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.routes.ts
│   ├── auth.validators.ts
│   ├── auth.types.ts
│   └── index.ts
```

Each module exports routes that are mounted in [apps/backend/src/app.ts](apps/backend/src/app.ts).

### Frontend Architecture
- **Lazy loading** for all routes (React.lazy + Suspense)
- **Code splitting** with manual chunks (see [apps/frontend/vite.config.ts](apps/frontend/vite.config.ts))
- **Protected routes** with role-based access control via `ProtectedRoute` component
- **React Query** for server state management
- **Zustand** for client state
- **Socket.IO** for real-time features (WhatsApp chat, notifications)

## Common Commands

### Development
```bash
# Install dependencies (run from root)
npm install

# Start frontend dev server (port 3000)
npm run dev
# or
npm run dev:frontend

# Start backend dev server (port 3000 by default)
cd apps/backend
npm run dev

# Run both concurrently (manual)
# Terminal 1: cd apps/backend && npm run dev
# Terminal 2: cd apps/frontend && npm run dev
```

### Build & Type Checking
```bash
# Build all workspaces
npm run build

# Build frontend only
npm run build:frontend

# Type check all workspaces
npm run type-check

# Lint all workspaces
npm run lint
```

### Database (Prisma)
```bash
# Generate Prisma Client (run from root or backend)
npm run prisma:generate

# Run migrations (backend only)
cd apps/backend
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Seed database
npm run prisma:seed
```

### Testing
```bash
# Run tests (frontend uses Vitest)
npm test

# Backend tests
cd apps/backend
npm run test
npm run test:watch
npm run test:coverage
```

### Docker
```bash
# Development
docker-compose up

# Production (VPS deployment)
docker-compose -f docker-compose.vps.yml up -d

# Build production image
docker build -t ferraco-crm .
```

## Important Patterns & Conventions

### JWT Authentication
- Access tokens expire in 15 minutes (default)
- Refresh tokens expire in 7 days (default)
- JWT_SECRET validation enforces minimum 32 characters in production (see [apps/backend/src/config/jwt.ts](apps/backend/src/config/jwt.ts))
- All API routes under `/api/*` except `/api/auth/login` and `/api/auth/refresh` require authentication

### Environment Variables
- Backend: [apps/backend/.env.example](apps/backend/.env.example) - Database URL, JWT secrets, API keys
- Frontend: Uses `VITE_*` prefix for environment variables
- Production: Secrets managed via GitHub Actions and VPS environment

### Error Handling
- Centralized error handler in [apps/backend/src/middleware/errorHandler.ts](apps/backend/src/middleware/errorHandler.ts)
- Custom error classes with proper HTTP status codes
- Frontend uses React Query error boundaries and toast notifications

### Real-time Features (Socket.IO)
- Server: Initialized in [apps/backend/src/server.ts](apps/backend/src/server.ts)
- Events:
  - `whatsapp:qr` - QR code updates
  - `whatsapp:status` - Connection status
  - `whatsapp:message` - New messages
  - `conversation:*` - Conversation-specific rooms

### Rate Limiting
- General API: 100 requests/minute
- Auth endpoints: 10 requests/minute
- WhatsApp endpoints: Custom limits (see [apps/backend/src/middleware/whatsappRateLimit.ts](apps/backend/src/middleware/whatsappRateLimit.ts))

### Database Schema
- 45 tables, 21 enums
- See [apps/backend/prisma/schema.prisma](apps/backend/prisma/schema.prisma)
- Key models: User, Lead, Communication, WhatsAppConversation, Automation, Tag

### Code Quality
- TypeScript strict mode enabled
- ESLint configured for both frontend and backend
- React.memo for performance optimization
- Bundle size optimized with manual chunk splitting

## WhatsApp Service Notes

### Session Management
- Sessions stored in `/app/sessions` (Docker volume in production)
- Single session per instance (multi-device not implemented)
- Auto-reconnection on disconnect

### Message Flow
1. Incoming message → WhatsApp webhook
2. `whatsappListeners.ts` processes event
3. `whatsappChatService.ts` fetches conversation data from WhatsApp
4. Socket.IO broadcasts to connected clients
5. No message persistence in PostgreSQL (stateless)

### Common Issues
- **QR Code not showing**: Check Socket.IO connection, verify frontend is subscribed to `whatsapp:qr` event
- **Messages not syncing**: Stateless architecture - messages are fetched on-demand from WhatsApp, not stored locally
- **Connection loops**: WPPConnect handles reconnection internally, check logs for authentication failures

## Deployment

### VPS Deployment (via GitHub Actions)
1. Push to `main` branch triggers deployment
2. Workflow: [.github/workflows/deploy-vps.yml](.github/workflows/deploy-vps.yml)
3. SSH to VPS, pull code, rebuild Docker image
4. Uses `docker-compose.vps.yml` for production config
5. Nginx serves frontend static files and proxies API requests

### Environment Setup
Required secrets in GitHub Actions:
- `DATABASE_URL` - PostgreSQL connection string
- `VPS_PASSWORD` - SSH password for deployment
- `JWT_SECRET` - Production JWT secret (min 32 chars)

### Ports
- Frontend (dev): 3000 (Vite dev server)
- Backend (dev): 3000 (Express)
- Production: Single container on port 3050 (Nginx + Node.js)

## Shared Package

The `@ferraco/shared` package ([packages/shared/](packages/shared/)) contains:
- Common TypeScript types
- Shared utilities
- Constants

Both frontend and backend import from `@ferraco/shared`.

## Performance Optimizations

- Lazy loading all routes reduces initial bundle by 67%
- Manual code splitting creates 8 optimized vendor chunks
- React.memo reduces re-renders by 40-60%
- gzip bundle size: ~258 KB
- Target Lighthouse score: >90

## Security Features

- Helmet.js for HTTP headers
- CORS configured per environment
- Rate limiting on sensitive endpoints
- Audit logging middleware
- JWT token rotation
- Input validation using Zod
- SQL injection prevention via Prisma ORM
