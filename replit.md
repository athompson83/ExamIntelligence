# ProficiencyAI - Replit.md

## Overview
ProficiencyAI is a comprehensive educational assessment platform designed to compete with Canvas LMS testing capabilities. It features AI-powered question validation, live proctoring, advanced analytics, comprehensive testbank management, and seamless LTI (Learning Tools Interoperability) integration for direct LMS connectivity. The platform aims to provide a robust solution for educational institutions requiring advanced assessment tools, supporting a vision for improved educational outcomes through intelligent, adaptable assessment with seamless LMS integration.

## User Preferences
Preferred communication style: Simple, everyday language.
Research-based approach: Follow educational assessment standards and evidence-based practices for question generation.
UI/UX Design: Modern, beautiful interface following current design trends with smooth animations and professional styling.
Landing Page: Comprehensive marketing page with complete feature list, FAQ section, and technical specifications.

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
- **Core Modules**: Testbank Management, Quiz Builder (unified), Reference Banks, Live Proctoring, AI Services, Analytics Dashboard, User Management (multi-role: Super Admin, Admin, Teacher, Student), Assignment System, LTI Integration (comprehensive LMS connectivity with Canvas, Moodle, Blackboard support).

### System Design Choices
- **Role-Based Architecture**: Four-tier role system (Super Admin, Admin, Teacher, Student) with account-based multi-tenancy.
- **Data Flow**: Defined flows for authentication, assessment creation, live proctoring, and AI integration.
- **AI-Powered Analytics**: ML-based performance predictions, anomaly detection, question difficulty clustering, personalized learning paths, and concept mastery analysis.
- **AI Question Generation**: Enhanced generation with research-based quality standards (e.g., CRESST, Kansas Curriculum Center), comprehensive validation, and intelligent prompt engineering.
- **Mobile Strategy**: Current responsive web design with a plan for future React Native apps for iOS and Android, leveraging existing APIs and real-time features.
- **Data Safety**: Archiving system for questions, quizzes, and testbanks instead of permanent deletion, with full audit trails.
- **Core Functionality Protection**: Stable core systems (Item Bank, Question Creation, Quiz Creation, Assignment Creation, Exam Scheduling) with strict change control.
- **Internationalization**: Full i18n support with 8 languages and dynamic switching.
- **LTI Integration**: Comprehensive Learning Tools Interoperability 1.3 support for seamless LMS integration with Canvas, Moodle, Blackboard, and other LTI-compliant platforms. Features include automatic grade passback, content selection, deep linking, and complete setup documentation.

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

## Recent Changes (August 2025)
- **AI Provider Integration**: Integrated environment API keys with super admin LLM settings, prioritizing DeepSeek as first choice provider
- **Multi-Provider AI Enhancement**: Added support for DeepSeek, Groq, Meta/Llama, and xAI Grok providers with proper priority ordering
- **Environment Variable Integration**: Updated multi-provider system to use environment variables as fallback for database-stored API keys
- **Landing Page Enhancement**: Created comprehensive marketing landing page with complete feature list, FAQ section, technical specifications, and professional design
- **CAT Exam Interface**: Fixed redirection issues for Computer Adaptive Testing practice sessions
- **Mobile Optimization**: Implemented 24px button padding and mobile-first responsive design across all components
- **Database Management System**: Built comprehensive super admin database management interface with full backend coverage including item banks, questions, assignments, CAT exams, AI generations, system settings, and more
- **Enhanced Permissions System**: Established complete default roles (super admin, admin, teacher, student) with proper permission boundaries and database access controls

### Development Dependencies
- **typescript**: Static type checking
- **vite**: Build tool and development server
- **tsx**: TypeScript execution engine
- **esbuild**: JavaScript bundler for production