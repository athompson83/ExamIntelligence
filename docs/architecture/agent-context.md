# Agent Context: Exam Intelligence

**Source baseline:** `main` at `c005c9d06fb7180d6e06ed9c0d3e84fc655d3a92`.

This is a historical full-stack assessment-platform prototype, not the current ProficiencyAI source of truth. The README identifies a React/Vite client, Express/TypeScript server, shared contracts, PostgreSQL access through Drizzle, and an Expo/React Native workspace. Current product, release, security, or deployment claims must be checked in the active ProficiencyAI repository.

## Repository structure

The client mounts a React application with assessment pages, shared providers, and browser query utilities. The Express server applies middleware and registers API routes, which compose authentication, feature services, and storage. `shared/schema.ts` defines the Drizzle-backed data model and validation contracts. The mobile workspace has its own Expo package and runtime entry.

The source contains assessment, AI-provider, analytics, LTI, billing, and proctoring modules. Their presence in this historical codebase does not establish completeness, safety, compliance, or deployment. Before deliberate code extraction, follow the README's license, dependency, authentication, database, and secret-handling review.

The [graph](../../.ua/knowledge-graph.json) covers the tracked source inventory at the baseline SHA. [Provenance](agent-context-provenance.json) records parser coverage and warnings. The diagrams show source composition only.
