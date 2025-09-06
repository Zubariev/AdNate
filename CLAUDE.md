# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
```bash
# Start the development server (frontend + backend)
npm run dev         # Frontend at http://localhost:5173
npm run server      # Backend at http://localhost:5001 (runs in parallel)

# Build for production
npm run build       # TypeScript check + Vite build

# Linting
npm run lint        # ESLint with TypeScript checking

# Database migrations (Drizzle ORM)
npm run db:generate # Generate migration files from schema changes
npm run db:migrate  # Apply migrations to database
```

### Type Checking
```bash
# Run TypeScript compiler without emitting files
npx tsc --noEmit
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **State Management**: Zustand (persisted state in `src/stores/designStore.ts`)
- **Backend**: Express server with TypeScript (`server/index.ts`)
- **Database**: Supabase (PostgreSQL) with Drizzle ORM
- **AI Integration**: 
  - Google Gemini API for concept generation
  - Hugging Face API for image generation
- **Authentication**: Supabase Auth with Row-Level Security (RLS)

### Key Architectural Patterns

#### 1. Route Structure
- Routes defined in `src/routes.tsx`
- Protected routes use `<ProtectedRoute>` wrapper
- Main app structure in `src/App.tsx` with auth context

#### 2. API Architecture
- Frontend API client: `src/lib/apiClient.ts` (centralized API calls)
- Backend routes: `server/routes.ts` and `server/api/`
- Supabase client: `src/api/supabase.ts`
- All API calls automatically include auth tokens from Supabase session

#### 3. Design Editor State Management
- Global design state managed by Zustand store (`src/stores/designStore.ts`)
- Persisted to localStorage for auto-save functionality
- Canvas elements stored as array with layering support

#### 4. Component Organization
- UI components: `src/components/ui/` (shadcn/ui components)
- Design editor: `src/components/DesignEditor.tsx` and related components
- Auth components: `src/components/auth/`
- Blog components: `src/components/blog/`
- Shared layout: `src/components/layout/RootLayout.tsx`

#### 5. Type System
- Shared types: `src/types.ts` and `shared/types/`
- Database types: `src/lib/database.types.ts`
- Zod schemas for validation: `shared/schema.ts`

#### 6. Server Architecture
- Express server with CORS enabled for localhost:5173
- API routes mounted at `/briefs` 
- Gemini API integration in `server/lib/gemini.ts`
- Database connection via Drizzle in `server/db.ts`

## Environment Variables

Required environment variables (see `.env.example`):
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `VITE_HUGGING_FACE_API_KEY`: For AI image generation
- `GEMINI_API_KEY`: For AI concept generation (server-side)
- `VITE_API_URL`: Backend API URL (default: http://localhost:5001)
- `DATABASE_URL`: PostgreSQL connection string (optional, derived from Supabase if not set)

## Path Aliases

TypeScript path aliases configured:
- `@/*` → `./src/*`
- `@shared/*` → `./shared/*`

## Key Features & Their Implementation

### Design Editor
- Main component: `src/components/DesignEditor.tsx`
- Canvas rendering: `src/components/Canvas.tsx`
- Element management: `src/components/DesignElement.tsx`
- Layer control: `src/components/LayerPanel.tsx`
- Properties editing: `src/components/PropertiesPanel.tsx`
- Export functionality: Uses html2canvas library

### AI Features
- Brief-based concept generation: `server/api/briefs.ts` → Gemini API
- Image generation: `src/components/ReferenceImageGenerator.tsx` → Gemini API

### Database Schema
- Drizzle ORM schemas in `shared/schema.ts`
- Migrations in `supabase/migrations/`
- Row-Level Security policies enforced at database level

## Development Notes

- Frontend runs on port 5173, backend on port 5001
- Vite proxy configured to forward `/api` requests to backend
- Authentication state managed by `AuthProvider` context
- All database operations use Supabase client with RLS
- File uploads handled via Supabase Storage
- React Query used for data fetching and caching