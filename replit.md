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
3. **Reference Banks**: Reference material organization and management system
4. **Live Proctoring**: Real-time monitoring with WebSocket connections
5. **AI Services**: Question validation and educational content generation
6. **Analytics Dashboard**: Performance tracking and reporting
7. **User Management**: Multi-role user system

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

## Recent Enhancements

### AI Question Generation System Overhaul (July 04, 2025)
- **Research Integration**: Enhanced AI question generation with evidence-based best practices from:
  - CRESST (Center for Research on Evaluation, Standards, and Student Testing) quality criteria
  - Kansas Curriculum Center guidelines for effective test construction
  - UC Riverside School of Medicine question writing standards
  - Assessment Systems item authoring best practices
  - Educational research from GitHub repositories (QuestGen-AI, QuizPro)

- **Quality Standards Implementation**:
  - Question stem quality validation (clear, unambiguous language)
  - Multiple choice standards (plausible distractors, parallel options)
  - Cognitive alignment with Bloom's taxonomy levels
  - Bias prevention and accessibility considerations
  - Difficulty calibration (1-10 scale with research-based criteria)

- **Enhanced Validation System**:
  - Comprehensive question analysis across technical, content, bias, and cognitive dimensions
  - Research-aligned confidence scoring
  - Detailed feedback for educators on question quality
  - Educational value assessment for learning outcomes

- **AI Prompt Engineering**:
  - PhD-level educational assessment specialist persona
  - Psychometric principles and item response theory integration
  - Canvas LMS compatibility and best practices
  - Cognitive load theory application

### Comprehensive AI Enhancement Update (July 04, 2025)
- **API Key Validation System**:
  - Added real-time OpenAI API key availability checking
  - Visual warnings when API key is missing or invalid
  - Prevents generation attempts without proper credentials
  - User-friendly error messages guiding to administrator contact

- **Reference Materials Support**:
  - Added support for reference links (URLs to educational materials)
  - File upload capability for PDF, DOC, TXT, and Markdown references
  - Dynamic reference management with add/remove functionality
  - Reference materials integrated into AI generation context

- **Automatic Prompt Optimization**:
  - Background enhancement of user instructions for better results
  - Integration of Canvas LMS standards and best practices
  - Educational assessment quality guidelines automatically applied
  - Enhanced prompts for evidence-based question generation

- **Enhanced Difficulty Slider**:
  - Fixed dual-handle range slider for minimum and maximum difficulty
  - Proper visual feedback for difficulty range selection
  - Improved user experience with clear min/max indicators

- **Comprehensive Error Handling**:
  - Detailed validation for all form fields before generation
  - Question count limits (1-50) with clear messaging
  - Topic requirement validation with user feedback
  - Enhanced error messages with actionable guidance

- **User Experience Improvements**:
  - Form reset after successful generation for efficiency
  - Loading states with progress indicators
  - Success messages with generation count feedback
  - Comprehensive visual validation feedback

## Mobile Application Strategy

Currently, ProficiencyAI is built as a responsive web application that works well on mobile devices through browser access. The mobile strategy includes:

### Current Mobile Access
- **Responsive Web Design**: All interfaces are mobile-optimized using Tailwind CSS
- **Progressive Web App Features**: Works on mobile browsers with app-like experience
- **Touch-Friendly Interface**: Designed for tablet and phone interaction

### Native Mobile App Development Plan
- **Phase 1**: Complete web platform development (current focus)
- **Phase 2**: Create React Native apps for iOS and Android
- **Student App Features**: 
  - Exam taking with offline capability
  - Proctoring integration with camera/microphone
  - Study materials and progress tracking
  - Push notifications for assignments
- **Instructor App Features**:
  - Live monitoring of exam sessions
  - Quick grading and feedback
  - Analytics dashboard
  - Notification management

### Technical Approach for Native Apps
- **Framework**: React Native for cross-platform development
- **API Integration**: Existing REST API will serve native apps
- **Authentication**: Same Replit Auth system integration
- **Real-time Features**: WebSocket integration for live proctoring
- **Offline Support**: Local storage for downloaded exams and responses

## Navigation and User Experience

### Breadcrumb Navigation System
- All pages now include breadcrumb navigation for better user orientation
- Home icon links to dashboard, with hierarchical path display
- Consistent navigation experience across all platform sections

## Changelog

- July 04, 2025. Added breadcrumb navigation to Reference Banks page and enhanced error handling
- July 04, 2025. Fixed database schema issues with Reference Banks (renamed title to name column)
- July 04, 2025. Added comprehensive Reference Bank feature with API, frontend interface, and database integration
- July 04, 2025. Enhanced AI question generation with research-based best practices
- July 04, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.
Research-based approach: Follow educational assessment standards and evidence-based practices for question generation.