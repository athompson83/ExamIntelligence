<div align="center">

# Exam Intelligence

**Legacy assessment-platform prototype retained for historical reference.**

![Status](https://img.shields.io/badge/status-legacy%20prototype-6B7280?style=flat-square)
![Stack](https://img.shields.io/badge/stack-React%20%7C%20Express%20%7C%20PostgreSQL-7C3AED?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-7C3AED?style=flat-square)

</div>

> [!WARNING]
> This repository is not the authoritative source for the current ProficiencyAI product, release state, security posture, or deployment. Active product work belongs in [`athompson83/proficiencyai`](https://github.com/athompson83/proficiencyai).

## What this repository contains

Exam Intelligence is an earlier full-stack assessment-platform prototype. It combines a React/Vite client, an Express/TypeScript server, shared contracts, PostgreSQL access through Drizzle, and an Expo mobile workspace.

The code explores capabilities such as assessment and test-bank workflows, analytics, role-based experiences, AI-provider integrations, LTI connectivity, billing, email, and native mobile delivery. The presence of a dependency or screen does **not** prove that the corresponding capability is complete, secure, compliant, or deployed.

## Repository layout

```text
client/            React web application
server/            Express API and server runtime
shared/            Shared schemas and contracts
mobile/            Expo/React Native workspace
attached_assets/   Historical design and project assets
```

## Local development

```bash
npm install
npm run dev
```

Build and type-check:

```bash
npm run check
npm run build
```

Database schema synchronization uses:

```bash
npm run db:push
```

Review the target database and environment configuration before running that command. Never point a legacy prototype at an active production database without a reviewed migration and rollback plan.

## Technology snapshot

- React 18, Vite, TypeScript, Tailwind CSS, and Radix UI
- Node.js and Express
- PostgreSQL/Neon with Drizzle ORM
- TanStack Query, Zod, WebSockets, and session-based authentication
- OpenAI, Anthropic, and Google AI SDKs represented in the dependency graph
- Expo/React Native mobile workspace

## Maintenance policy

Use this repository for historical reference or deliberate extraction only. New fixes and features should not be split between this codebase and ProficiencyAI. Before reusing code, verify licensing, dependency age, authentication boundaries, database assumptions, secret handling, and whether a newer implementation already exists in the active product.