
# Design Studio - Project Overview

## Project Description

Design Studio is a comprehensive web application that combines a design editor for creating graphics/banners with a blog system. Built with React, TypeScript, and modern web technologies, it provides users with tools to create stunning visual designs without requiring design experience.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Tailwind CSS, shadcn/ui components
- **Routing**: React Router DOM v6
- **Backend**: Supabase (authentication, database)
- **State Management**: React Query (@tanstack/react-query)
- **Build Tool**: Vite
- **Deployment**: Configured for Replit deployment

## Project Structure

### Root Level
- `src/` - Main application source code
- `config/` - Configuration files and duplicate package.json
- `public/` - Static assets
- `supabase/` - Database migrations and configuration
- Various config files (package.json, tsconfig, etc.)

### Source Code Structure (`src/`)

#### Core Application
- `App.tsx` - Main application component with router setup
- `main.tsx` - Application entry point
- `routes.tsx` - Route definitions
- `index.css` - Global styles

#### Components (`src/components/`)

**Design Editor Components:**
- `DesignEditor.jsx` - Main design editor interface
- `Canvas.tsx` - Design canvas component
- `DesignElement.tsx` - Individual design elements
- `ElementPanel.tsx` - Panel for adding elements
- `LayerPanel.tsx` - Layer management
- `PropertiesPanel.tsx` - Element properties editor
- `Toolbar.tsx` - Editor toolbar
- `ImageGenerator.tsx` - AI image generation (Hugging Face integration)
- `DesignGallery.tsx` - Gallery of designs
- `DesignsList.tsx` - List view of user designs
- `DesignPreview.tsx` - Design preview component
- `CustomSizeDialog.tsx` - Custom canvas size dialog

**Blog Components:**
- `blog/BlogCard.tsx` - Individual blog post cards
- `blog/CategoryFilter.tsx` - Blog category filtering
- `blog/CommentSection.tsx` - Blog post comments
- `blog/RelatedPosts.tsx` - Related posts display

**Authentication:**
- `auth/AuthProvider.tsx` - Authentication context provider

**Layout:**
- `layout/RootLayout.tsx` - Main layout wrapper

**UI Components:**
- `ui/` - Complete shadcn/ui component library (40+ components)

#### Pages (`src/pages/`)
- `LandingPage.tsx` - Homepage with auth modals
- `blog/Index.tsx` - Blog listing page
- `blog/PostDetail.tsx` - Individual blog post view
- `blog/Auth.tsx` - Blog authentication
- `blog/NotFound.tsx` - 404 page

#### Data & Types
- `data/blog-posts.ts` - Blog post data
- `types/blog.ts` - Blog-related TypeScript types
- `types.ts` - General application types

#### Utilities & Integrations
- `lib/supabase.ts` - Supabase client configuration
- `lib/utils.ts` - Utility functions
- `lib/database.types.ts` - Database type definitions
- `integrations/supabase/` - Supabase integration files
- `hooks/use-toast.ts` - Toast notification hook

## Key Features

### 1. Design Editor
- Canvas-based design interface
- Element manipulation (text, shapes, images)
- Layer management system
- Properties panel for customization
- Custom canvas sizing
- AI-powered image generation via Hugging Face
- Design gallery and templates
- Export functionality (html2canvas integration)

### 2. Blog System
- Blog post listing with category filtering
- Individual post views with comments
- Related posts suggestions
- Authentication integration

### 3. Authentication
- Supabase-based user authentication
- Login/signup modals on landing page
- Protected routes for authenticated features
- User session management

### 4. Navigation Structure
- `/` - Landing page
- `/blog` - Blog index
- `/blog/:id` - Individual blog posts
- `/designs` - User designs list
- `/editor` - Design editor interface

## Configuration Files

### Package Management
- Multiple `package.json` files (root and config folder)
- Dependencies include React, Supabase, Tailwind, shadcn/ui
- Development dependencies for TypeScript, ESLint, Vite

### Build Configuration
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration

### Deployment
- `.replit` - Replit deployment configuration
- Configured to run on port 5173 with `npm run dev`
- Ready for Replit static deployment

## Database Schema
- Supabase integration with migrations in `supabase/migrations/`
- Authentication tables managed by Supabase
- Custom tables for designs and blog posts (inferred from usage)

## Current State
The application appears to be in active development with:
- Complete UI component library
- Functional authentication system
- Basic blog functionality
- Design editor framework in place
- AI image generation capability
- Proper routing and navigation
