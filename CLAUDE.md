# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Development Workflow Rules

### IMPORTANT: When developing new functionality or fixing bugs
1. **Use Sequential Thinking MCP** (mcp__sequential-thinking__sequentialthinking) for:
   - Breaking down complex problems into steps
   - Planning implementation approach
   - Understanding existing code patterns
   - Analyzing problems that require multi-step solutions

2. **Use Context7 MCP** (mcp__context7-server) for:
   - Getting latest documentation for libraries and frameworks
   - Understanding best practices for the tools we use
   - Resolving library-specific issues

3. **Use Supabase MCP Server** for:
   - All database operations and migrations
   - Executing SQL queries
   - Managing edge functions
   - Getting project configuration

4. **Use Puppeteer MCP** for:
   - Taking screenshots of pages for debugging
   - Debugging console.log errors
   - Testing UI interactions
   - Visual verification of implementations

5. **Update Database Types**: After schema changes, run:
bash
   npx supabase gen types typescript --project-id <project-id> > lib/supabase/types.ts
  

## Commands

### Development
bash
npm run dev        # Start development server on port 3001
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint

### Database Migrations
bash
node scripts/run-migration.ts  # Run pending migrations

### Type Generation
bash
npx supabase gen types typescript --project-id <project-id> > lib/supabase/types.ts

## Memories
Development server is always running on 3001 locally
Always use proper CORS and JWT with anon key for Supabase edge functions
Every edge function must implement JWT and CORS for all request types

## 🗺️ Comprehensive Code Map

### Architecture Overview

#### Tech Stack
**Next.js 13.5** with App Router and Server Actions
**TypeScript** with strict mode, path alias @/*
**Supabase** for backend (auth, database, storage)
**Shadcn UI** components with Tailwind CSS
**React Hook Form** with Zod validation
**Three.js** with React Three Fiber for 3D graphics

### Project Structure
Use best project structure
#### Root Level
/
├── app/                    # Next.js App Router
├── components/             # Shared UI components
├── lib/                    # Utilities and configs
├── supabase/              # Migrations and functions
├── public/                # Static assets
├── scripts/               # Build and migration scripts
└── docs/                  # Documentation



### Key Patterns

#### File Organization
**200-line limit** per file - Split large files into focused modules
Components specific to features go in app/feature/components/
Shared components go in components/
Types defined alongside components or in dedicated types.ts files

#### Component Architecture
Server Components for data fetching (default)
Client Components only for interactivity ('use client')
Compose Shadcn UI components rather than raw HTML
TypeScript interfaces for all component props

#### Database Patterns
Normalized relational structure with foreign keys
JSONB columns for flexible array data (e.g., gallery_images, sections)
Join tables for many-to-many relationships
Row Level Security (RLS) policies enforced
Use Supabase MCP for all database operations

#### Supabase Usage
Use lib/supabase/server.ts for Server Components
Use lib/supabase/client.ts for Client Components
Use lib/supabase/admin.ts for admin operations (server-only)
Always handle { data, error } responses
Use generated types from lib/supabase/types.ts

#### Edge Functions
Implement proper CORS headers
Use JWT authentication with anon key
Handle all HTTP methods (GET, POST, PUT, DELETE)
Deploy via Supabase MCP Server

### Development Best Practices

#### Code Quality
No any types - maintain strict type safety
Explicit return types for functions
Comprehensive error handling with try-catch
Use toast notifications for user feedback
Implement loading states for async operations

#### State Management
Server Components for data fetching
Client Components for interactivity
Form state via React Hook Form
No global state management library
Use React Context sparingly for cross-component state

#### Styling Guidelines
Use Tailwind utility classes exclusively
Leverage theme variables (bg-background, text-foreground, etc.)
Ensure dark mode compatibility
Responsive design with Tailwind modifiers
Consistent spacing and typography scale

#### Performance Optimization
Lazy load components with dynamic imports
Optimize images with Next.js Image component
Use React.memo for expensive re-renders
Implement pagination for large data sets
Cache API responses appropriately

### Security Considerations
Environment variables for sensitive keys
Service role key only used server-side
RLS policies on all database tables
Server-side validation before database operations
Middleware protection for admin routes
No client exposure of admin keys
Sanitize user inputs
Implement rate limiting for API routes
Email verification system for user trust
Two-factor authentication support

### Multi-Tenant Architecture

#### Business Custom Domain Route Isolation
Business subdomains and custom domains are completely isolated from the main platform for proper tenant security and white-labeling:

**Main Domain** (yourdomain.com):
- All routes accessible (frontend, admin, vendor, customer, business)
- No restrictions applied

**Business Subdomain/Custom Domain** (acme.yourdomain.com or transfers.acmehotel.com):
- ONLY `/business/*` routes accessible
- Root `/` redirects to `/business/dashboard` (authenticated) or `/business/login` (unauthenticated)
- All other routes (`/admin`, `/vendor`, `/customer`, frontend) redirected to business portal
- Ensures complete tenant isolation and branded experience

**Implementation:**
- Helper utilities: `lib/business/domain-routing.ts`
- Middleware logic: `middleware.ts` (lines 79-107)
- Allowed patterns: `/business/*`, `/_next/*`, `/api/business/*`, `/favicon.ico`

### Testing & Debugging
Use Puppeteer MCP for visual debugging
Console.log debugging with Puppeteer
Screenshot pages to verify implementations
Test responsive designs across viewports
Verify dark mode compatibility

### Module Documentation

#### Desert Adventures Module
Full CRUD for desert safari experiences
Multi-tab form: General, Gallery, Overview, Description, Schedule
Dynamic sections with add/edit/delete
Image/video upload to Supabase Storage
Integration with categories, FAQs, and addons
Normalized database structure with join tables

#### User Management Module
Role-based access control (RBAC)
User CRUD operations
Profile management with role assignment
Separate auth flows for users and admins
Protected routes via middleware
Email verification system with token-based verification
Two-factor authentication management
Bulk user operations (status, password reset, verification)
User activity logging
Avatar upload with Supabase Storage

#### Transfer Services Module
Search functionality with filters
Booking flow with payment integration
Vehicle class selection
Additional services management
Real-time availability checking

### API Structure
RESTful endpoints under /app/api/
Consistent response format: { data?, error? }
Proper HTTP status codes
Request validation with Zod
Error handling with descriptive messages

### Deployment Considerations
Environment-specific configurations
Database migration strategy
Edge function deployment via Supabase
Static asset optimization
SEO metadata configuration

## Quick Reference

### Common Tasks

#### Add a new page
1. Create file in app/[route]/page.tsx
2. Add metadata export
3. Implement Server Component for data fetching
4. Add to navigation if needed

#### Create a new component
1. Determine if shared (components/) or feature-specific
2. Create component file with TypeScript interface
3. Keep under 200 lines
4. Use Shadcn UI primitives
5. Ensure dark mode compatibility

#### Add database table
1. Create migration file
2. Define table structure with proper types
3. Add RLS policies
4. Generate TypeScript types
5. Create necessary API routes

#### Implement CRUD operations
1. Create API route in app/api/
2. Validate requests with Zod
3. Use appropriate Supabase client
4. Handle errors gracefully
5. Return consistent response format

Remember: Always use Sequential Thinking MCP for planning, Context7 for documentation, and maintain code reusability and efficiency throughout the application.