# Overview

This is a full-stack Express.js web application with a React frontend that provides user authentication and product management functionality. The application uses PostgreSQL with Drizzle ORM for data persistence, session-based authentication with role-based access control, and a modern React UI built with shadcn/ui components and Tailwind CSS.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side application uses React with TypeScript and follows a component-based architecture:

- **Build System**: Vite for fast development and optimized production builds
- **UI Framework**: shadcn/ui component library built on top of Radix UI primitives
- **Styling**: Tailwind CSS with custom design system tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Authentication Context**: Custom React context provider for managing user authentication state

The frontend is organized with clear separation of concerns:
- Components are modular and reusable
- Pages handle route-specific logic and layouts
- Hooks provide shared functionality across components
- API communication is centralized through a query client

## Backend Architecture
The server uses Express.js with a modular structure:

- **Framework**: Express.js with TypeScript for type safety
- **Session Management**: Express sessions with MemoryStore for development (configurable for production)
- **Authentication**: Session-based authentication with bcrypt password hashing
- **Security Features**: Login attempt tracking, account lockdown with cooldown periods, and CORS protection
- **API Design**: RESTful endpoints with consistent error handling and response formats
- **Validation**: Zod schemas shared between frontend and backend for consistent data validation

The backend implements a clean separation between routes, storage logic, and business logic:
- Routes handle HTTP requests and responses
- Storage layer abstracts data persistence operations
- Shared schemas ensure type consistency across the application

## Data Storage Solutions
The application uses a hybrid storage approach:

- **Development**: In-memory storage with Map-based data structures for rapid development
- **Production**: PostgreSQL database with Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for database migrations and schema evolution
- **Connection**: Neon Database serverless PostgreSQL for cloud deployment

Database schema includes:
- Users table with authentication fields, profile information, and role-based access
- Sessions table for secure session management
- Products table for inventory management with timestamp tracking

## Authentication and Authorization
Multi-layered security implementation:

- **Password Security**: bcrypt hashing with salt rounds for secure password storage
- **Session Security**: HTTP-only cookies with configurable security settings
- **Rate Limiting**: Progressive login attempt tracking with automatic cooldown periods
- **Role-Based Access**: User roles (user, staff, admin, supplier) with different permission levels
- **Route Protection**: Middleware-based authentication checks for protected endpoints

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon Database
- **drizzle-orm**: Type-safe SQL query builder and ORM
- **express**: Web application framework for Node.js
- **vite**: Frontend build tool and development server

### UI and Component Libraries
- **@radix-ui/***: Comprehensive set of low-level UI primitives for building accessible components
- **@tanstack/react-query**: Server state management and data fetching library
- **shadcn/ui**: Pre-built component library based on Radix UI
- **tailwindcss**: Utility-first CSS framework

### Authentication and Security
- **bcrypt**: Password hashing library
- **express-session**: Session middleware for Express
- **connect-pg-simple**: PostgreSQL session store (for production)
- **cookie-parser**: Cookie parsing middleware

### Development and Build Tools
- **typescript**: Type checking and compilation
- **tsx**: TypeScript execution environment for development
- **esbuild**: Fast JavaScript bundler for production builds
- **@replit/vite-plugin-***: Replit-specific development tools and error handling

The application is designed to run seamlessly in both development and production environments, with particular optimization for deployment on Replit's cloud platform.