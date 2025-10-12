# ProficiencyAI - Complete Source Code Export

## Archive File

**proficiencyai-source-code.tar.gz** (1.0 MB)
- Compressed archive containing all source code
- Excludes: node_modules, .git, build artifacts, cache files
- To extract: `tar -xzf proficiencyai-source-code.tar.gz`

## Project Structure Overview

### Core Directories

**client/** - Frontend React application
- src/components/ - UI components (Layout, TopBar, Sidebar, etc.)
- src/pages/ - Application pages
- src/hooks/ - Custom React hooks
- src/lib/ - Utility libraries and query client
- src/contexts/ - React context providers

**server/** - Backend Node.js/Express application
- routes/ - API route handlers
- services/ - Business logic services
- Database and storage management
- Authentication and session handling
- WebSocket server for real-time features

**shared/** - Shared TypeScript schemas and types
- schema.ts - Database schema definitions
- Shared types between frontend and backend

**mobile/** - React Native mobile app (future)
- iOS and Android app structure
- Shared screens and components

### Configuration Files

- package.json - Project dependencies
- tsconfig.json - TypeScript configuration
- vite.config.ts - Vite build configuration
- tailwind.config.ts - Tailwind CSS configuration
- drizzle.config.ts - Database ORM configuration

## File Statistics

### Source Code Files

- TypeScript files (.ts): 65
- TypeScript React files (.tsx): 246
- JavaScript files (.js): 270
- JSON configuration files: 61
