# ProficiencyAI - Replit.md

## Overview

ProficiencyAI is a comprehensive educational assessment platform designed to compete with Canvas LMS testing capabilities. The application features AI-powered question validation, live proctoring, advanced analytics, and comprehensive testbank management. Built with modern web technologies, it provides a robust solution for educational institutions requiring advanced assessment tools.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: PostgreSQL-based session store
- **Real-time Communication**: WebSocket server for live proctoring

### Key Technologies
- **AI Integration**: OpenAI GPT-4o for question validation and content generation
- **Email Service**: SendGrid for notifications
- **File Processing**: Built-in Node.js capabilities
- **Development Tools**: tsx for TypeScript execution, esbuild for production builds

## Key Components

### Authentication System
- Replit Auth integration with OpenID Connect
- Session-based authentication with PostgreSQL storage
- Role-based access control (teacher, student, admin)
- Secure cookie management with HTTP-only flags

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Schema**: Comprehensive schema supporting educational assessment features
- **Migrations**: Drizzle Kit for database schema management

### Core Modules
1. **Testbank Management**: Question organization and categorization
2. **Quiz Builder**: Dynamic quiz creation with multiple question types
3. **Live Proctoring**: Real-time monitoring with WebSocket connections
4. **AI Services**: Question validation and educational content generation
5. **Analytics Dashboard**: Performance tracking and reporting
6. **User Management**: Multi-role user system

## Data Flow

### Authentication Flow
1. User initiates login through Replit Auth
2. OpenID Connect handles authentication
3. Session established in PostgreSQL
4. JWT tokens managed server-side
5. Client receives authentication status

### Assessment Creation Flow
1. Teacher creates testbank with metadata
2. Questions added with AI validation
3. Quiz builder assembles questions
4. Configuration settings applied
5. Assessment published for student access

### Live Proctoring Flow
1. Student starts exam, WebSocket connection established
2. Proctoring service monitors activity
3. Violations detected and logged
4. Real-time alerts sent to instructors
5. Session data stored for review

### AI Integration Flow
1. Question submitted for validation
2. OpenAI API processes content
3. Results stored in validation logs
4. Feedback provided to educators
5. Recommendations generated for improvement

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: TypeScript ORM for database operations
- **openai**: AI-powered content validation and generation
- **@sendgrid/mail**: Email notification service
- **express**: Web application framework
- **@tanstack/react-query**: Server state management

### UI Dependencies
- **@radix-ui/react-***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **@hello-pangea/dnd**: Drag and drop functionality
- **react-hook-form**: Form state management
- **zod**: Schema validation

### Development Dependencies
- **typescript**: Static type checking
- **vite**: Build tool and development server
- **tsx**: TypeScript execution engine
- **esbuild**: JavaScript bundler for production

## Deployment Strategy

### Development Environment
- **Server**: `npm run dev` starts development server with tsx
- **Client**: Vite dev server with HMR and React Fast Refresh
- **Database**: Neon serverless PostgreSQL with development database
- **Environment**: Replit-specific optimizations and error overlays

### Production Build
- **Client Build**: Vite builds React app to `dist/public`
- **Server Build**: esbuild bundles Node.js server to `dist/index.js`
- **Database**: Production Neon database with connection pooling
- **Process**: `npm start` runs production server

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API authentication
- `SENDGRID_API_KEY`: Email service authentication
- `SESSION_SECRET`: Session encryption key
- `REPLIT_DOMAINS`: Allowed domains for Replit Auth

## Changelog

- July 04, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.