# ProficiencyAI - Replit.md

## Overview
ProficiencyAI is a comprehensive educational assessment platform designed to compete with Canvas LMS testing capabilities. It features AI-powered question validation, live proctoring, advanced analytics, and comprehensive testbank management. The platform aims to provide a robust solution for educational institutions requiring advanced assessment tools, supporting a vision for improved educational outcomes through intelligent, adaptable assessment.

## User Preferences
Preferred communication style: Simple, everyday language.
Research-based approach: Follow educational assessment standards and evidence-based practices for question generation.
UI/UX Design: Modern, beautiful interface following current design trends with smooth animations and professional styling.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter
- **Form Handling**: React Hook Form with Zod validation
- **UI/UX Decisions**: Responsive web design, Material Design 3 theme system with light/dark mode, accessible UI components, breadcrumb navigation, collapsible sidebar, interactive onboarding tours, invisible scrollbars, and contextual bug reporting.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: PostgreSQL-based session store
- **Real-time Communication**: WebSocket server for live proctoring and updates
- **AI Integration**: Multi-LLM provider support (OpenAI, Anthropic Claude, Google Gemini, XAI Grok, Deepseek, Meta LLM) with custom prompt management.
- **Core Modules**: Testbank Management, Quiz Builder (unified), Reference Banks, Live Proctoring, AI Services, Analytics Dashboard, User Management (multi-role: Super Admin, Admin, Teacher, Student), Assignment System, LTI integration.

### System Design Choices
- **Role-Based Architecture**: Four-tier role system (Super Admin, Admin, Teacher, Student) with account-based multi-tenancy.
- **Data Flow**: Defined flows for authentication, assessment creation, live proctoring, and AI integration.
- **AI-Powered Analytics**: ML-based performance predictions, anomaly detection, question difficulty clustering, personalized learning paths, and concept mastery analysis.
- **AI Question Generation**: Enhanced generation with research-based quality standards (e.g., CRESST, Kansas Curriculum Center), comprehensive validation, and intelligent prompt engineering.
- **Mobile Strategy**: Current responsive web design with a plan for future React Native apps for iOS and Android, leveraging existing APIs and real-time features.
- **Data Safety**: Archiving system for questions, quizzes, and testbanks instead of permanent deletion, with full audit trails.
- **Core Functionality Protection**: Stable core systems (Item Bank, Question Creation, Quiz Creation, Assignment Creation, Exam Scheduling) with strict change control.
- **Internationalization**: Full i18n support with 8 languages and dynamic switching.

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: TypeScript ORM for database operations
- **openai**: AI-powered content validation and generation (part of multi-provider system)
- **@sendgrid/mail**: Email notification service
- **express**: Web application framework
- **@tanstack/react-query**: Server state management
- **ltijs**: LTI provider library for LMS integration

### UI Dependencies
- **@radix-ui/react-***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **@dnd-kit**: Drag and drop functionality for question editors
- **react-hook-form**: Form state management
- **zod**: Schema validation
- **react-joyride**: Interactive onboarding tours
- **react-i18next**: Internationalization framework

### Development Dependencies
- **typescript**: Static type checking
- **vite**: Build tool and development server
- **tsx**: TypeScript execution engine
- **esbuild**: JavaScript bundler for production