# ProficiencyAI

## Overview
ProficiencyAI is an AI-powered educational assessment platform designed to compete with Canvas LMS. It offers AI-driven question validation, live proctoring, advanced analytics, comprehensive testbank management, and seamless LTI integration for direct LMS connectivity. The platform aims to provide robust assessment solutions to improve educational outcomes through intelligent, adaptable assessments.

## User Preferences
Preferred communication style: Simple, everyday language.
Research-based approach: Follow educational assessment standards and evidence-based practices for question generation.
UI/UX Design: Modern, beautiful interface following current design trends with smooth animations and professional styling.
Landing Page: Comprehensive marketing page with complete feature list, FAQ section, and technical specifications.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Shadcn/ui (on Radix UI primitives)
- **Styling**: Tailwind CSS with CSS variables
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Form Handling**: React Hook Form with Zod validation
- **UI/UX Decisions**: Responsive web design, Material Design 3 theme with light/dark mode, accessible UI, breadcrumb navigation, collapsible sidebar, interactive onboarding, invisible scrollbars, contextual bug reporting, Instagram/Facebook-inspired modern design with gradient palettes, rounded corners, elevated shadows, and smooth animations.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM (Neon serverless)
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: PostgreSQL-based session store
- **Real-time Communication**: WebSocket server
- **AI Integration**: Multi-LLM provider support (OpenAI, Anthropic Claude, Google Gemini, XAI Grok, Deepseek, Meta LLM) with custom prompt management.
- **Core Modules**: Testbank Management, Quiz Builder, Reference Banks, Live Proctoring, AI Services, Analytics Dashboard, Multi-role User Management (Super Admin, Admin, Teacher, Student), Assignment System, LTI Integration.

### System Design Choices
- **Role-Based Architecture**: Four-tier role system with account-based multi-tenancy.
- **AI-Powered Analytics**: ML-based performance predictions, anomaly detection, question difficulty clustering, personalized learning, concept mastery.
- **AI Question Generation**: Enhanced generation with research-based quality standards and intelligent prompt engineering.
- **Mobile Strategy**: Production-ready native iOS and Android apps built with Expo/React Native, complete with App Store and Play Store compliance (privacy policies, terms of service, permissions, metadata). Apps configured for submission with comprehensive build and deployment documentation.
- **Data Safety**: Archiving system for questions/quizzes/testbanks, full audit trails.
- **Core Functionality Protection**: Stable core systems with strict change control.
- **Internationalization**: Full i18n support for 8 languages.
- **LTI Integration**: Comprehensive Learning Tools Interoperability 1.3 support for Canvas, Moodle, Blackboard, including grade passback, content selection, and deep linking.
- **Security Hardening**: Authentication middleware, Helmet security headers, rate limiting, CORS, input validation.
- **Performance Optimization**: WebSockets for real-time updates, caching, optimized React Query.
- **Accessibility**: WCAG 2.1 AA compliance, ARIA labels, semantic HTML, keyboard navigation, touch targets.

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: TypeScript ORM
- **openai**: AI-powered content validation and generation
- **@sendgrid/mail**: Email notification service
- **express**: Web application framework
- **@tanstack/react-query**: Server state management
- **ltijs**: LTI provider library

### UI Dependencies
- **@radix-ui/react-***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **@dnd-kit**: Drag and drop functionality
- **react-hook-form**: Form state management
- **zod**: Schema validation
- **react-joyride**: Interactive onboarding tours
- **react-i18next**: Internationalization framework

### Mobile App Infrastructure
- **Framework**: Expo SDK with React Native
- **Bundle Identifiers**: 
  - iOS: `com.proficiencyai.mobile`
  - Android: `com.proficiencyai.mobile`
- **Build System**: Expo Application Services (EAS)
- **Compliance**: FERPA, GDPR, COPPA compliant with privacy manifests
- **Permissions**: Camera, microphone, photo library, notifications, biometric authentication (Face ID/Touch ID)
- **Target Platforms**: iOS 13.0+, Android API 23+ (Android 6.0+)
- **Documentation**: Complete submission guides, icon specifications, build checklists, privacy policy, terms of service
- **App Store Status**: Ready for submission with complete metadata and compliance documentation