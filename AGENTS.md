# Exam Intelligence — legacy reference guidance

## Scope

- Read `README.md` and applicable directory instructions. This is a legacy React/Vite + Express/TypeScript + Drizzle/PostgreSQL prototype with an Expo workspace, not the current ProficiencyAI source of truth.
- Active features/fixes belong in `athompson83/proficiencyai`. Work here only for explicitly scoped historical maintenance or deliberate extraction; do not split current product development between repositories.
- Before reuse, verify licensing, dependency condition, auth/session and tenant boundaries, database assumptions, secrets, and whether the active product already implements the behavior. A dependency/screen is not a verified integration.
- Keep client/server/shared/mobile boundaries intact. Do not import this architecture or its database state into another product by assumption, and never connect it casually to active Production data.
- Preserve any adopted canonical control standard and current owner authority; do not create another constitution or interpret this policy as reactivation/release permission.

## Reproducible, bounded work

- Define one valuable maintenance/extraction outcome with acceptance criteria and explicit non-goals. Fix relevant blockers/invariants; record unrelated cleanup rather than rebuilding the legacy platform.
- Actual root commands: `npm run dev`, `npm run check` (TypeScript), `npm run build`, and `npm start`. The manifest defines no test/smoke script; type checking/building is not behavioral proof.
- Use the actual committed lockfile's frozen install and reconcile compatible runtime/package-manager pins across the selected workspace and CI. Do not invent pins, silently upgrade dependencies, or add placeholder-success scripts.
- `npm run db:push` mutates schema. Review the exact target and recovery plan; use disposable test data for local validation, never an active Production database by default.
- Ordinary checks must avoid Production credentials, paid AI, billing/email/LTI side effects, and real learner records. Isolate or stub external providers; label mocks separately from real integration.
- For an authorized change, prove the real affected UI/API path and unauthorized/invalid cases, including assessment-data isolation where relevant. Demonstrate deliberate-failure detection when adding/changing verification; never suppress failures or silently skip required checks.
- Record variable names, consumers, environments, public/server-only classification, and validation methods—not secret values.

## Economical delivery and evidence

- Run focused local checks before coherent pushes; broaden for auth/data/contracts, dependencies/toolchains/workflows, and agent policy. Diagnose full failing logs before reruns; avoid speculative pushes and duplicate expensive jobs.
- Ordinary prose-only CI routing needs an explicit allowlist; policy/executable Markdown is impact-bearing. Preserve required workflows and a tested final gate rejecting failed/cancelled/missing required work.
- Preserve least privilege, immutable action references, and separation of untrusted/privileged execution. Cancel superseded PR checks where safe, not blindly migrations/deployments.
- Reconcile actual branch rules, project IDs, environment scopes, deployment triggers, release authority, and recovery before merging; merging can deploy. Do not create replacement projects or reactivate hosting as cleanup.
- Distinguish implemented, wired, locally verified, hosted verified, and released, with SHA/commands/results/environment/evidence. Keep existing checklist/progress artifacts concise and evidence-linked, not competing trackers; preserve history when archiving.
- Report actual checks, blockers, genuine owner decisions, and the next smallest authorized task. Load deeper references/skills on demand and confirm fresh Codex/Claude instruction discovery.

Adoption evidence: 2026-09-10, inspected README, manifest scripts, absent root AGENTS/CLAUDE, and main metadata at `c005c9d06fb7180d6e06ed9c0d3e84fc655d3a92`. Runtime/fresh-agent/failure-propagation checks NOT_RUN; local cloning unavailable due to DNS resolution. Guidance only: no code, dependency, database, workflow, platform, or release change.
