# BidFT Auction Search Platform

## Overview

BidFT is a full-stack web application designed to help users search and filter auction items from the Federal Transportation Administration (FTA). The platform provides advanced search capabilities with location-based filtering, condition-based filtering, and price range options. Built with a modern React frontend and Express backend, the application offers both table and card view layouts for browsing auction items.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR (Hot Module Replacement)
- Wouter for lightweight client-side routing (chosen over React Router for smaller bundle size)
- TanStack Query (React Query) for server state management and caching

**UI Component System**
- Shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- CSS variables for theming (supports light/dark mode infrastructure)
- New York style variant for components (cleaner, more modern aesthetic)

**State Management Strategy**
- Server state managed through TanStack Query with infinite stale time (manual invalidation)
- Local UI state managed with React hooks (useState, useEffect)
- No global client state management library (keeps architecture simple)
- Filter state managed locally in SearchPage component and passed down as props

**Key Design Patterns**
- Component composition with clear separation between presentational and container components
- Custom hooks for reusable logic (useIsMobile, useToast)
- Type-safe API requests through shared schema definitions
- Debounced search input to reduce unnecessary API calls

### Backend Architecture

**Server Framework**
- Express.js for HTTP server and routing
- TypeScript for type safety across the stack
- ESM (ECMAScript Modules) for modern module system

**Data Storage**
- In-memory storage implementation (MemStorage class) for development/demo
- Abstracted storage interface (IStorage) allows easy migration to persistent database
- Drizzle ORM configured for PostgreSQL (using Neon serverless driver)
- Database schema defined but currently using seed data in memory

**API Design**
- RESTful endpoints for auction items and locations
- POST endpoint for complex filtering (allows flexible filter combinations)
- JSON request/response format
- Custom request logging middleware for API monitoring

**Development Features**
- Vite middleware integration for seamless dev experience
- Runtime error overlay through Replit plugins
- Request/response logging with duration tracking
- Raw body preservation for webhook compatibility

### Database Schema

**Tables**
- `auction_items`: Core auction data with pricing, location, condition, and metadata
- `locations`: State and facility lookup data stored as JSONB for flexibility

**Key Fields**
- UUID primary keys with automatic generation
- Decimal precision for monetary values (10,2)
- Timestamp support for auction end dates
- JSONB for flexible facility arrays per state

**Schema Validation**
- Zod schemas generated from Drizzle table definitions (drizzle-zod)
- Type inference for insert and select operations
- Shared schema between client and server prevents type mismatches

### External Dependencies

**Database & ORM**
- Neon Serverless PostgreSQL for production database
- Drizzle ORM for type-safe database queries and migrations
- Drizzle Kit for schema management and migration generation
- Connection pooling through Neon's serverless driver

**UI Component Libraries**
- Radix UI for accessible, unstyled component primitives (20+ components)
- Lucide React for consistent iconography
- Embla Carousel for touch-friendly image carousels
- CMDK for command palette/search interfaces

**Form & Validation**
- React Hook Form for performant form state management
- Zod for runtime type validation and schema definition
- @hookform/resolvers for integrating Zod with React Hook Form

**Utility Libraries**
- date-fns for date manipulation and formatting
- clsx & tailwind-merge for conditional className composition
- class-variance-authority for variant-based component styling

**Development Tools**
- Replit-specific plugins for enhanced development experience
- TypeScript for compile-time type checking
- PostCSS with Tailwind and Autoprefixer for CSS processing

**Third-Party Integrations**
- Amazon search URLs for price comparison (generated per item)
- External auction platform links (auction URLs point to source)
- Google Fonts (Inter and Roboto) for typography