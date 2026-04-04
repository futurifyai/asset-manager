# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains TeamFlow — a full-stack task management system with role-based access control.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite (Tailwind CSS, shadcn/ui, Recharts)
- **Auth**: JWT via jsonwebtoken + bcryptjs
- **AI**: OpenAI via Replit AI Integrations (task generation)

## TeamFlow Application

### Features
- JWT-based authentication (login/register)
- Role-based access control: Admin, Manager, Worker
- Dashboard with stats cards and pie chart
- Task management with progress bars, status filtering, CRUD
- AI task generation from project descriptions (OpenAI)
- User management (Admin only)
- Reports with worker performance charts

### Default Users (seeded)
- `admin` / `admin123` — Admin role
- `sarah_manager` / `pass123` — Manager role
- `alex_worker` / `pass123` — Worker role
- `jamie_worker` / `pass123` — Worker role

### Architecture
- Frontend: `artifacts/teamflow/` (React + Vite, port from $PORT)
- Backend: `artifacts/api-server/` (Express 5, port from $PORT)
- DB schema: `lib/db/src/schema/` (users.ts, tasks.ts)
- API contract: `lib/api-spec/openapi.yaml`
- Generated hooks: `lib/api-client-react/src/generated/`
- Middleware: `artifacts/api-server/src/middlewares/auth.ts`
- Routes: `artifacts/api-server/src/routes/` (auth, users, tasks, dashboard, reports, ai)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/teamflow run dev` — run frontend locally
