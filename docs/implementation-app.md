# Polylogue 4 — App Implementation Plan

## Overview

This plan covers implementation of the Perspectives app: the student-facing web application for Polylogue 4. It is a companion to `implementation-pipeline.md` and references the design specification in `design.md`.

**Prerequisites:**
- The pipeline implementation must be complete before app development begins. The first step of app implementation is to align this plan to any spec or design changes that occurred during pipeline development. Pipeline outputs (generated scenario artifacts and reference libraries) serve as the app's input data. The app reads these from researcher-configured paths, not from any hardcoded project directory.
- Node.js 24 LTS and npm must be installed on all development machines via `nvm install --lts`. All other dependencies (Next.js, TypeScript, Prisma, Tailwind CSS) are project-level and installed by Claude Code via npm during Phase 2 (project scaffolding). No manual dependency installation is required beyond Node.js. See Multi-Machine Development below for version pinning details.

### Multi-Machine Development

The project is developed across multiple machines (home and work), synced via GitHub. To ensure identical environments:

**Known machine versions:**
- Work machine: Node v20.19.2 (needs upgrade)
- Home machine: Node v24.14.1 (current LTS)

**Pinned version: Node 24 LTS (Krypton).** Both machines must use Node 24 for development. Node 24 is the current LTS release. The work machine should be upgraded before app development starts:

```bash
# Work machine one-time setup
nvm install --lts
nvm use --lts    # or: cd into project directory with .nvmrc and run nvm use
```

**Version-locked by git (automatic):**
- `package-lock.json` — locks every npm dependency to an exact version. Committed to git. `npm install` on any machine reproduces the same dependency tree.
- `prisma/schema.prisma` — database schema is version-controlled. `npx prisma generate` regenerates the Prisma client from this file.
- `.nvmrc` — contains `24` (the major version). If using `nvm`, running `nvm use` in the project directory switches to Node 24.

**Enforced by `package.json`:**
```json
{
  "engines": {
    "node": ">=24.0.0 <25.0.0"
  }
}
```
This causes `npm install` to warn if the Node.js version is outside the specified range. Combined with `.nvmrc`, this ensures both machines run Node 24 regardless of what other versions are installed system-wide.

**Setup on a new machine (or after git pull with dependency changes):**
```bash
nvm use               # switch to pinned Node version
npm install           # install exact locked dependencies
npx prisma generate   # regenerate Prisma client from schema
npx prisma db push    # sync database schema (development only)
```

**What to commit to git:**
- `package.json`, `package-lock.json` — always
- `prisma/schema.prisma` — always
- `.nvmrc` — always
- `prisma/migrations/` — always (if using Prisma migrate)
- `.env.local` — never (contains local paths; use `.env.example` as a template)
- `perspectives.db` — never (the SQLite database file; each machine has its own local copy, seeded from pipeline YAML artifacts)

Phase 2 (project scaffolding) creates all of these files. The developing agent should include `.nvmrc`, the `engines` field, and `.env.example` in the initial project setup.

**Structure:** Implementation phases scoped to one Claude Code working session each, with review phases at high-risk points. Each review phase includes a review prompt the operator runs with a separate agent.

**How reviews work:** Same as the pipeline plan. The operator runs the review prompt with a separate agent, analyzes the feedback, and forwards relevant findings to the developing agent.

### Document Relationships

This implementation plan is the **sequencing document** — it tells the developing agent what to build in what order. It does not contain UI/UX specifications. Those live in `uiux-app.md`, which is the **reference document** for all screen layouts, component behaviors, interaction patterns, data contracts, and visual design direction.

**How the developing agent should use these documents:**
1. Read the current phase in `implementation-app.md` for objectives, inputs, outputs, and tasks
2. For each task involving UI work, follow the `uiux-app.md >` references to look up the specific screen or component specification
3. Implement according to the spec in `uiux-app.md`, including data contracts (schema field mappings), interaction patterns, tablet behavior, and design language (student vs. teacher visual direction)
4. Do not invent UI behavior not specified in `uiux-app.md` — if something is ambiguous, flag it for the operator

**Cross-reference syntax.** Each implementation phase references `uiux-app.md` sections using the format: `uiux-app.md > Reference Key`. The reference keys are listed in the Section Index at the top of `uiux-app.md`. For example: `uiux-app.md > Student > Phase 1 > Work Panel` points to the Phase 1 work panel specification including the empty state, guided first annotation, detection act picker, and annotation form.

**Other documents referenced:**
- `design.md` — the source design specification (pedagogical framework, pipeline architecture, flaw taxonomy)
- `implementation-pipeline.md` — pipeline build plan (Phases 1-6.3, schemas, subagent prompts, scripts) whose outputs the app consumes
- `scenario-sequence.md` — operator guide with ready-to-use prompts for the 7-scenario UMS pilot sequence
- `difficulty-calibration.md` — design-time and runtime difficulty tuning levers

---

## Context

### Deployment Environment

The app is hosted on a server inside the University of Memphis. Each session serves 1-3 teachers and up to 60 students, split into groups of 4-5 students, yielding roughly 12-15 groups per session.

This is a research prototype for classroom use at the University Middle School (UMS) in Memphis. The operator (researcher) manages deployment and data access. The app does not need to scale beyond this context for MVP.

### What the App Does

Perspectives presents AI-generated discussions and guides students through a four-phase structured activity:

| Phase | Activity | Mode |
|-------|----------|------|
| Phase 1 | Recognize argument flaws — highlight sentences, select detection act, describe in own words | Individual |
| Phase 2 | Identify thinking behaviors — select from library or describe in own words, explain connection | Individual |
| Phase 3 | Compare and explain — see peer annotations, discuss agreements/disagreements verbally | Small group |
| Phase 4 | Evaluate perspectives — AI annotations revealed, class discussion | Whole class |

The teacher controls phase advancement, monitors student progress, and uses pre-generated facilitation scaffolds. The researcher accesses raw data (annotations, revision history, timestamps) for analysis.

### Roles

| Role | What they see | What they do |
|------|--------------|-------------|
| **Student** | Transcript, their own annotations, peer annotations (visible after the teacher advances the class to Phase 3 — students submit individually during Phase 2, but unsubmitted students are force-submitted at the Phase 2→3 transition), AI annotations (Phase 4) | Annotate, categorize, explain, compare, revise |
| **Teacher** | Everything students see + student activity monitoring + facilitation cheat sheet + phase controls | Create sessions, assign groups, advance phases, monitor progress, facilitate discussion |
| **Researcher** | Everything + raw data access | Access data, compare across scenarios, analyze annotation patterns |

---

## Tech Stack

### Decision Criterion

The primary criterion for stack selection is **LLM-developability**: the stack should maximize the quality and reliability of code generated by Claude Code across multiple working sessions. This means prioritizing frameworks and tools that are heavily represented in training data, have strong conventions, use a single language, and minimize external service dependencies.

### Chosen Stack

| Layer | Choice | Justification |
|-------|--------|---------------|
| **Framework** | Next.js (App Router) | Most heavily represented full-stack React framework in LLM training data. File-based routing provides clear conventions — the LLM knows where to put things. Server Components and Server Actions eliminate the need for a separate API layer, keeping the codebase in one project. |
| **Language** | TypeScript | Single language across frontend and backend. Type safety constrains LLM output and catches errors at build time rather than runtime. LLMs generate better TypeScript than JavaScript because types provide structural guardrails. |
| **Database** | SQLite via Prisma | A single file on the server — no database server to install or manage. Handles the concurrent load of 60 users easily (thousands of writes/second with WAL mode). Prisma provides type-safe queries and is well-known to LLMs. |
| **Real-time updates** | Polling (5-10 second interval) | 60 concurrent users is trivial load. Teacher monitoring (who's active, annotation counts, phase readiness) doesn't need sub-second latency. Polling is far simpler than WebSocket or SSE infrastructure and sufficient for this scale. Can upgrade to SSE later if needed without architectural changes. |
| **Styling** | Tailwind CSS | LLMs generate Tailwind fluently. Co-located with components (no separate CSS files). Utility-first approach means consistent styling without design system overhead. |
| **Deployment** | Single Node.js process on university server | `next start` on a port, reverse-proxied with nginx. No containers, no orchestration, no cloud services. The entire app is self-contained on one machine. |

### Why Not Alternatives

| Alternative | Why not |
|-------------|---------|
| Firebase / Supabase | External service dependency. Cannot deploy on university server without internet dependency. LLM cannot configure cloud consoles. Supabase self-hosting is complex. |
| Separate backend (FastAPI / Express) + React SPA | Two codebases and an API contract between them doubles the surface area for bugs. Next.js Server Actions make a separate backend unnecessary at this scale. |
| SvelteKit | Good framework, but significantly less representation in LLM training data than React/Next.js. The LLM will make more mistakes and know fewer patterns. |
| PostgreSQL | Requires installing and managing a database server. Overkill for 60 users on a single machine. SQLite is a file — zero infrastructure. |
| WebSockets | Infrastructure complexity (connection management, reconnection logic, state synchronization) not justified for 60 users where 5-10 second polling latency is acceptable. |

### SQLite Concurrency Note

SQLite serializes writes but handles concurrent reads freely. With WAL (Write-Ahead Logging) mode enabled, reads and writes can proceed concurrently. The realistic write load is ~8 writes/second sustained (60 student heartbeats every 10 seconds + sporadic annotation saves), with peaks of ~15 writes/second during Phase 2 bulk submission. SQLite with WAL handles thousands of writes/second for small rows — this is well within its capacity.

**Prisma connection configuration.** Prisma must be configured with a single database connection for SQLite. Multiple connections cause `SQLITE_BUSY` errors under concurrent writes. In the Prisma client instantiation, use the standard Next.js singleton pattern to avoid connection leaks during development hot-reload:

```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

WAL mode should be enabled at database initialization:

```sql
PRAGMA journal_mode=WAL;
```

**Migration path.** If the system scales beyond a single classroom server (300+ concurrent students, multiple server processes), Prisma makes the SQLite→PostgreSQL migration straightforward: change the `provider` in `schema.prisma` from `"sqlite"` to `"postgresql"`, adjust the connection string, and re-run migrations. No application code changes required.

### Data Flow

Pipeline artifacts (YAML) are imported into the app in two distinct ways:

**One-time: Reference libraries.** The detection act library and thinking behavior library (`detection_act_library.yaml`, `thinking_behavior_library.yaml`) are seeded into the database once — at initial setup or at build time. These are the same for every scenario and every session. They populate the Phase 1 detection act selector and Phase 2 thinking behavior browser. The app reads them from the researcher-configured `REFERENCE_LIBRARIES_PATH`.

**Per-scenario: Scenario data.** When a teacher sets up a session, the scenario's artifacts are imported from `REGISTRY_PATH`:

| File | What it contains | Where it goes in the app |
|------|-----------------|-------------------------|
| `script.yaml` | Discussion transcript (turns, sentences, persona names) | Transcript display (all phases) |
| `evaluation_student.yaml` | AI annotations — student-visible fields only | Phase 4 AI reveal |
| `evaluation.yaml` | Full evaluation: all annotations (including `planned`, `plausible_alternatives`), quality assessment, facilitation guide | Teacher dashboard + cheat sheet display |
| `scenario.yaml` | Scenario plan (not student-visible, used for teacher context) | Teacher dashboard |
| `pedagogical_review.yaml` | Pedagogical quality assessment (score 1-5, explanation, revision strategy) | Teacher dashboard (optional — shows scenario quality score) |

```
Reference libraries (one-time seed)
    │
    ▼
┌─────────────────────────┐
│   SQLite database       │
│   - reference data      │
│   - scenario data       │  ◄── Per-scenario import (parse YAML, write to SQLite)
│   - session state       │
│   - student annotations │  ◄── App writes at runtime
│   - revision history    │
└─────────────────────────┘
    │
    ▼
```

The app does not read YAML at runtime. YAML is the pipeline-to-app interface; SQLite is the app's internal data store. This separation means:
- The app doesn't depend on the file system layout of the registry
- Student annotations, session state, and revision history are stored in the database alongside the imported scenario data
- The evaluation split (student vs. teacher) is enforced at import time — student-facing routes query only the student-visible annotation data
- Research data access is a database query, not file parsing

**Runtime data in the Prisma schema.** The design document (`design.md`) describes session configuration as a single logical structure with both teacher-authored fields and app-runtime fields (`active_phase`, `phase_transitions`, `student_activity`). In the Prisma schema, `student_activity` should map to a separate database table (`StudentActivity`) with a foreign key to `ClassSession`, not embedded in a JSON column. This gives proper indexing for the teacher dashboard polling queries.

### Project Structure (Preliminary)

```
app/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── student/           # Student-facing routes
│   │   ├── teacher/           # Teacher dashboard routes
│   │   └── api/               # API routes (import, polling endpoints)
│   ├── components/            # Shared React components
│   │   ├── transcript/        # Transcript display + sentence selection
│   │   ├── annotation/        # Annotation creation/editing
│   │   ├── comparison/        # Phase 3 peer comparison views
│   │   └── dashboard/         # Teacher monitoring components
│   ├── lib/                   # Shared utilities
│   │   ├── db.ts              # Prisma client
│   │   ├── import.ts          # YAML-to-SQLite import logic
│   │   └── auth.ts            # Simple role-based auth
│   └── actions/               # Server Actions
├── public/
└── package.json
```

This structure will be refined during implementation. It is included here to show how Next.js conventions map to the app's requirements.

---

## Implementation Phases

### Phase Map

```
Phase 1 → Phase 2 → Phase 3a → Phase 3b → (spot-check) → Phase 4a → Phase 4b → REVIEW A → Phase 5 → Phase 6 → Phase 7 → REVIEW B → Phase 8 → Phase 9
```

All phases are sequential. Each phase is scoped to one Claude Code working session. Phases 3 and 4 are each split into two sub-phases to reduce per-session complexity and isolate risk:
- **3a** (core interaction) and **3b** (scaffolds + responsive) separate the foundational UI from the portrait/tablet layout, so responsive bugs don't infect the core.
- **4a** (Phase 2 core + submission) and **4b** (scaffolds: lifelines, guided detection, prompts) give the lifeline targeting algorithm — the most complex single feature — a dedicated session.

After Phase 3b, the operator does a lightweight **spot-check** (not a formal review) of portrait mode, touch targets, and layout integrity before Phase 4a builds on top. Review A validates the complete annotation flow (Phases 1-2 + all scaffolds) before adding peer/teacher complexity. Review B validates the full app with all phases and roles before session management and deployment.

---

### Phase 1: Spec Alignment + Schema Updates

**Objective:** Reconcile this plan with changes from pipeline implementation. Define app-owned fields for the Prisma schema. Resolve design decisions deferred from the sketch phase.

**Inputs:**
- Generated scenario artifacts (four completed scenarios available for testing) — the actual data the app will consume
- Reference libraries (`detection_act_library.yaml`, `thinking_behavior_library.yaml`)
- `uiux-app.md > Data Contracts` (schema-to-component mapping)
- `uiux-app.md > Scaffolds > Lifelines` (schema additions)
- `uiux-app.md > Scaffolds > Reflection` (storage needs)

**Tasks:**

1. **Verify artifact-to-UI alignment.** Read the actual scenario artifacts and reference libraries and confirm they provide the data the UI needs per `uiux-app.md > Data Contracts`. Check:
   - `script.yaml` — fields consumed by TranscriptView (turns, sentences, persona names, sentence IDs)
   - `evaluation_student.yaml` — fields consumed by Phase 4 AI reveal (annotation locations, argument_flaw, thinking_behavior)
   - `evaluation.yaml` — fields consumed by teacher dashboard, cheat sheet, lifeline data, guided detection data (facilitation_guide with timing, what_to_expect, phase_1, phase_2, phase_4 scaffolds)
   - `scenario.yaml` — fields consumed by topic context scaffold and teacher dashboard (topic, context, personas with weaknesses)
   - `detection_act_library.yaml` and `thinking_behavior_library.yaml` — fields consumed by DetectionActPicker and ThinkingBehaviorBrowser
   - Flag any field the UI spec expects but the artifacts don't provide, or vice versa

2. **Define app-owned annotation field.** The Prisma `Annotation` model (Phase 2) will need a `hints_used` field not present in the pipeline artifacts:
   ```yaml
   hints_used:
     type: integer
     required: true
     description: "How many lifeline hint levels were revealed that led to this annotation. 0 if no lifeline was used."
   ```
   This tracks per-annotation lifeline usage. When a student uses a lifeline targeting flaw A, then creates an annotation at the location the lifeline pointed to, `hints_used` records how many levels were consumed. Annotations created at locations unrelated to any lifeline get `hints_used: 0`.

3. **Define app-owned session fields.** The Prisma `ClassSession` model (Phase 2) will need these fields not present in the pipeline artifacts:
   ```yaml
   lifelines_per_student:
     type: integer
     required: true
     description: "Number of lifelines each student receives per scenario. Teacher-configurable at session creation. Default: 3."
     constraints:
       min: 0
       max: 10

   guided_first_detection:
     type: boolean
     required: true
     description: "Whether to show the guided first detection onboarding mechanic. Teacher sets this at session creation. Recommended for the first 2-3 scenarios a class encounters."

   reflection_active:
     type: boolean
     required: true
     description: "Whether the reflection step is currently showing. Teacher activates after Phase 4 discussion. App initializes to false."
   ```

4. **Define reflection response storage.** Reflection responses are stored per student per session. Rather than adding a new pipeline schema (reflections are app-only data, never consumed by the pipeline), define the Prisma model in this plan:
   ```
   StudentReflection:
     id, student_id, session_id, missed_insight (text, nullable),
     next_strategy (text, nullable), submitted_at (timestamp)
   ```
   Both fields are optional — students are encouraged but not required to reflect. The teacher's "activate reflection" button sets `session_configuration.reflection_active` to true; the student sees the reflection form in their work panel.

5. **Define lifeline state storage.** Lifeline state is per-student-per-session, not per-annotation. Define the Prisma model:
   ```
   StudentLifeline:
     id, student_id, session_id, target_flaw (string — the flaw pattern being hinted),
     levels_revealed (integer — how many of the 4 levels have been shown),
     created_at (timestamp)
   ```
   Each lifeline use creates or updates a `StudentLifeline` record. When the student creates an annotation at a location overlapping with the lifeline's target, the annotation's `hints_used` is set to the lifeline's `levels_revealed`. A student's remaining lifeline count = `lifelines_per_student` minus the number of distinct `StudentLifeline` records for that session.

6. **Define Phase 2→3 snapshot strategy.** At the Phase 2→3 transition, the app copies all submitted annotations into an `AnnotationSnapshot` table:
   ```
   AnnotationSnapshot:
     id, annotation_id (FK), session_id, snapshot_phase (integer — 3 or 4),
     snapshot_data (JSON — full annotation state at snapshot time)
   ```
   The Phase 3 comparison view queries `AnnotationSnapshot` where `snapshot_phase = 3`, not the live `Annotation` table. This keeps comparisons stable while the "My Annotations" tab edits the live records. At the Phase 3→4 transition, a second snapshot is taken with `snapshot_phase = 4` (including Phase 3 revisions). The Phase 4 comparison view uses `snapshot_phase = 4`.

7. **Define teacher authentication model.** Adapted from CrossCheck's pattern, using BetterAuth:
   - A seed YAML file (`app/seed.yaml`) defines teacher and researcher credentials (display name + password).
   - A seed script (`app/scripts/seed-users.ts`) hashes passwords with bcrypt and upserts into a `User` table with `role` field (`teacher`, `researcher`, `student`).
   - Authentication via BetterAuth with email+password plugin for teachers/researchers and a custom session-code plugin for students (session code + name, no password).
   - Database-backed cookie sessions (BetterAuth default). Session includes `id`, `name`, `role`.
   - Middleware protects `/teacher/*` routes — only `teacher` and `researcher` roles can access. Student routes require a valid session membership.
   - Define the Prisma model:
     ```
     User:
       id, displayName, username (auto-derived: lowercase, spaces→dots),
       passwordHash (nullable — null for students), role (teacher/researcher/student),
       createdAt
     ```
   - Students are created as `User` records with `role: "student"` and `passwordHash: null` when the teacher creates a session and assigns student names to groups.

8. **Document resolved design decisions.** Update the Open Decisions section:
   - Teacher authentication: seeded credentials with BetterAuth, database-backed cookie sessions
   - Guided first detection toggle: session-level boolean set by teacher at creation
   - Reflection storage: app-only Prisma model, not a pipeline schema
   - Lifeline tracking: per-student-per-session records, with per-annotation `hints_used` for research data
   - Snapshot strategy: copied rows in a snapshot table, not JSON blobs

**Outputs:**
- App-owned field definitions documented (hints_used, lifelines_per_student, guided_first_detection, reflection_active) — ready for Prisma schema in Phase 2
- This document updated with resolved decisions
- Verified artifact-to-UI alignment — all data contracts confirmed against actual artifacts

**Notes:**
- The app does not modify pipeline artifacts or pipeline schemas. It reads the actual artifacts from `REGISTRY_PATH` and `REFERENCE_LIBRARIES_PATH` as-is.
- App-owned fields (`hints_used`, `lifelines_per_student`, etc.) exist only in the Prisma schema — they are runtime concepts, not pipeline outputs.
- The Prisma schema (Phase 2) will include the `User` table (with auth fields), all four app-only models (`StudentReflection`, `StudentLifeline`, `AnnotationSnapshot`, `PhaseTransition`), and the core tables mapped from the actual artifact structures.

---

### Phase 2: Project Scaffolding + Database Schema

**Objective:** Create the Next.js project, Prisma database schema, YAML import logic, and Tailwind theme foundations.

**Inputs:**
- Updated schemas from Phase 1
- Pipeline artifacts in `REGISTRY_PATH` (test data for import)
- Reference libraries in `REFERENCE_LIBRARIES_PATH`
- `uiux-app.md > Data Contracts` (schema-to-component mapping, import timing)
- `uiux-app.md > Design Language` (student vs. teacher visual direction)

**Tasks:**

1. **Initialize Next.js project.** In the `app/` directory:
   - `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir`
   - Add `.nvmrc` with content `24`
   - Add `"engines": { "node": ">=24.0.0 <25.0.0" }` to `package.json`
   - Add `.env.example` with template for:
     - `DATABASE_URL` — SQLite path (e.g., `file:./perspectives.db`)
     - `REFERENCE_LIBRARIES_PATH` — path to reference libraries directory (researcher-configured)
     - `REGISTRY_PATH` — path to scenario registry directory (researcher-configured)
   - Create `.env.local` with actual local paths (gitignored)

2. **Install dependencies.**
   - `npm install prisma @prisma/client`
   - `npm install js-yaml @types/js-yaml` (for YAML import)
   - `npm install better-auth bcryptjs @types/bcryptjs` (for auth)
   - `npx prisma init --datasource-provider sqlite`

3. **Design Prisma schema.** Map artifact structures + app-only models to database tables:

   **From pipeline (imported from YAML):**

   | Table | Source | Notes |
   |-------|--------|-------|
   | `DetectionAct` | `detection_act_library.yaml` | act_id, name, student_question |
   | `FlawPattern` | `detection_act_library.yaml` | pattern_id, plain_language, description, FK to DetectionAct |
   | `ThinkingBehavior` | `thinking_behavior_library.yaml` | behavior_id, name, description, formal_term |
   | `Scenario` | `scenario.yaml` | scenario_id, topic, context, instructional_goals (JSON), personas (JSON), target_flaws (JSON — teacher-only), turn_outline (JSON — teacher-only), discussion_arc |
   | `Transcript` | `script.yaml` | scenario_id (FK), personas (JSON — name+role only), turns (JSON) |
   | `AIAnnotation` | `evaluation_student.yaml` | annotation_id, scenario_id (FK), location (JSON), argument_flaw (JSON), thinking_behavior (JSON) |
   | `TeacherEvaluation` | `evaluation.yaml` | scenario_id (FK), annotations (JSON — full including planned, plausible_alternatives), summary (JSON), quality_assessment (JSON), facilitation_guide (JSON) |
   | `PedagogicalReview` | `pedagogical_review.yaml` | scenario_id (FK), overall_score (integer 1-5), explanation (text), revision_strategy (text, nullable), flaw_assessments (JSON) |

   **App-owned (runtime):**

   | Table | Notes |
   |-------|-------|
   | `User` | id, displayName, username (auto-derived), passwordHash (nullable — null for students), role (teacher/researcher/student), createdAt. Teachers and researchers seeded from `seed.yaml`; students created when teacher assigns them to a session. |
   | `ClassSession` | session_id, scenario_id (FK), teacher_id (FK to User), lifelines_per_student, guided_first_detection, active_phase, reflection_active, session_code (6-char unique), status (`active`/`archived`, default `active`), created_at. Auto-archives 2 hours after `created_at` (checked on dashboard load and via a periodic server check). Named `ClassSession` to avoid collision with BetterAuth's `session` table (auth sessions). |
   | `Group` | group_id, session_id (FK) |
   | `GroupMember` | user_id (FK to User, role=student), group_id (FK) |
   | `StudentActivity` | user_id (FK), session_id (FK), first_opened, last_active, annotation_count |
   | `PhaseTransition` | session_id (FK), from_phase, to_phase, transitioned_at |
   | `Annotation` | annotation_id, phase_created, location (JSON), detection_act, description, thinking_behavior, behavior_source, behavior_own_words, behavior_explanation, submitted, hints_used, revision_history (JSON array). FK to User (student), ClassSession. |
   | `AnnotationSnapshot` | annotation_id (FK), session_id (FK), snapshot_phase, snapshot_data (JSON) |
   | `StudentLifeline` | user_id (FK), session_id (FK), target_flaw, levels_revealed, created_at |
   | `StudentReflection` | user_id (FK), session_id (FK), missed_insight, next_strategy, submitted_at |

   Enable WAL mode in a Prisma seed script or migration:
   ```sql
   PRAGMA journal_mode=WAL;
   ```

4. **Create Prisma client singleton.** `src/lib/db.ts` using the pattern from the Tech Stack section (globalForPrisma pattern for dev hot-reload).

5. **Set up BetterAuth.** Two-tier authentication using BetterAuth with the Prisma adapter:
   - `src/lib/auth.ts` — BetterAuth server configuration:
     ```typescript
     import { betterAuth } from "better-auth";
     import { prismaAdapter } from "better-auth/adapters/prisma";
     import { prisma } from "./db";

     export const auth = betterAuth({
       database: prismaAdapter(prisma, { provider: "sqlite" }),
       emailAndPassword: { enabled: true },  // teachers/researchers
       // Student auth: custom session-code strategy (see below)
       user: {
         additionalFields: {
           role: { type: "string", required: true },       // teacher, researcher, student
           displayName: { type: "string", required: true },
         },
       },
       session: {
         // Database-backed cookie sessions (BetterAuth default)
         // Session object includes id, name, role
       },
     });
     ```
   - **Teacher/researcher auth:** Email+password (BetterAuth built-in). Teachers authenticate with displayName + password (bcrypt compare against stored hash). The `role` field on the user record gates route access.
   - **Student auth:** Custom credential strategy. Students authenticate with session code + full name (look up `User` with `role: "student"` who is a `GroupMember` in a session matching the code). Implemented as a custom BetterAuth plugin or a thin Server Action that calls `auth.api` after validation.
   - `src/lib/auth-client.ts` — BetterAuth client for React components:
     ```typescript
     import { createAuthClient } from "better-auth/react";
     export const authClient = createAuthClient();
     ```
   - `src/app/api/auth/[...all]/route.ts` — Mount BetterAuth API handler:
     ```typescript
     import { auth } from "@/lib/auth";
     import { toNextJsHandler } from "better-auth/next-js";
     export const { GET, POST } = toNextJsHandler(auth);
     ```
   - `src/middleware.ts` — Route protection:
     - `/teacher/*` requires `role` = `teacher` or `researcher`
     - `/student/session/*` requires `role` = `student` with valid session membership
     - `/student` (join page) and `/auth/login` are public
     - Students with a valid session cookie for an active session are redirected from `/student` (join page) directly to their active session — no re-entry of credentials needed
   - `src/app/auth/login/page.tsx` — Teacher/researcher login form (name + password)
   - Run `npx @better-auth/cli generate` to generate BetterAuth's required database tables (session, account, verification), then merge with the app's Prisma schema. **Naming collision:** BetterAuth creates a `session` table (auth sessions); the app needs a `Session` table (classroom sessions). Rename the app's model to `ClassSession` in the Prisma schema to avoid conflict. BetterAuth's `user` table maps to the app's `User` model — extend it with `role`, `displayName`, and other app-specific fields via BetterAuth's `additionalFields` configuration.

6. **Write seed YAML and seed script.**
   - `app/seed.yaml` — defines teacher and researcher credentials:
     ```yaml
     users:
       - name: "Teacher Name"
         password: "their-password"
         role: teacher
       - name: "Researcher Name"
         password: "their-password"
         role: researcher
     ```
   - `app/scripts/seed-users.ts` — reads `seed.yaml`, hashes passwords with bcrypt (10 rounds), auto-derives usernames (lowercase, spaces→dots), upserts into `User` table. Idempotent.

7. **Write YAML import logic.** `src/lib/import.ts`. All paths are resolved from environment variables (`REFERENCE_LIBRARIES_PATH`, `REGISTRY_PATH`):
   - `importReferenceLibraries()` — one-time seed. Reads `detection_act_library.yaml` and `thinking_behavior_library.yaml` from `REFERENCE_LIBRARIES_PATH`. Parses YAML, upserts `DetectionAct`, `FlawPattern`, `ThinkingBehavior` records.
   - `importScenario(scenarioId)` — per-scenario import. Reads `scenario.yaml`, `script.yaml`, `evaluation.yaml`, `evaluation_student.yaml`, and `pedagogical_review.yaml` from `REGISTRY_PATH/{scenarioId}/`. Creates `Scenario`, `Transcript`, `AIAnnotation`, `TeacherEvaluation`, `PedagogicalReview` records. `pedagogical_review.yaml` is optional — if absent, no `PedagogicalReview` record is created. Validates file existence before import (except optional files). Returns structured validation errors (missing files, malformed YAML, schema violations) rather than throwing, so the UI can display them inline. Returns the scenario_id on success.
   - `listUnimportedScenarios()` — scans `REGISTRY_PATH` for scenario directories not yet imported into the database (comparing directory names against existing `Scenario.scenario_id` values). Returns a list of importable directories.
   - Both import functions are idempotent — re-importing overwrites existing records (upsert by primary key).

8. **Write database seed script.** `prisma/seed.ts`:
   - Seeds reference libraries from `REFERENCE_LIBRARIES_PATH`
   - Auto-discovers and imports all scenario directories found in `REGISTRY_PATH`
   - Runs `seed-users.ts` to seed teacher/researcher credentials
   - Configured as Prisma's seed command in `package.json`

9. **Establish Tailwind theme.** In `tailwind.config.ts`:
   - Student design language: spacious spacing scale, large type (16-18px body, 20-24px headers), rounded corners, soft shadows
   - Teacher design language: compact spacing, smaller type (14px body, 16px headers), clean and professional
   - Persona color palette: 2-3 vibrant, distinct persona accent colors
   - Student group colors: 5 distinct, vibrant colors for group members
   - Semantic colors: agreement (green), disagreement (yellow), unique (blue), AI (gray/purple)
   - Reference: `uiux-app.md > Design Language > Student` and `uiux-app.md > Design Language > Teacher`

10. **Create project directory structure:**
   ```
   app/src/
   ├── app/
   │   ├── auth/              # Login page
   │   ├── student/           # Student routes
   │   ├── teacher/           # Teacher routes
   │   ├── api/               # API routes (import, polling, auth)
   │   └── layout.tsx         # Root layout
   ├── components/
   │   ├── transcript/        # TranscriptView and related
   │   ├── annotation/        # AnnotationPanel, DetectionActPicker, ThinkingBehaviorBrowser
   │   ├── comparison/        # ComparisonView
   │   ├── scaffolds/         # Lifelines, guided detection, topic context, reflection
   │   └── dashboard/         # Teacher monitoring components
   ├── lib/
   │   ├── auth.ts            # BetterAuth server configuration
   │   ├── auth-client.ts     # BetterAuth client
   │   ├── db.ts              # Prisma client singleton
   │   ├── import.ts          # YAML import logic
   │   └── utils.ts           # Display name derivation, sentence ID parsing
   ├── actions/               # Server Actions (annotation CRUD, phase transitions, etc.)
   └── middleware.ts           # Route protection (teacher/student role checks)
   ```

11. **Verify setup.** Run the seed script and confirm:
   - Teacher/researcher credentials seed correctly (login with seeded password works)
   - Reference libraries import correctly (5 acts, 19 patterns, 8 behaviors)
   - Both scenarios import correctly (scenario, transcript, evaluations)
   - Teacher login page works; accessing `/teacher` without login redirects to login
   - Query the database to verify data integrity

**Outputs:**
- Next.js project in `app/` with TypeScript, Tailwind, Prisma, BetterAuth configured
- `prisma/schema.prisma` with all tables (including `User` with auth fields)
- `src/lib/auth.ts`, `src/lib/auth-client.ts`, `src/lib/db.ts`, `src/lib/import.ts`
- `src/middleware.ts` (route protection)
- `src/app/auth/login/page.tsx` (teacher/researcher login)
- `app/seed.yaml` + `app/scripts/seed-users.ts` (credential seeding)
- `prisma/seed.ts` (reference libraries + scenarios + users)
- Tailwind theme with student/teacher design language
- `.nvmrc`, `.env.example` (with `DATABASE_URL`, `REFERENCE_LIBRARIES_PATH`, `REGISTRY_PATH`), `engines` field in `package.json`
- All discovered scenarios, reference libraries, and teacher/researcher credentials seeded in local database

**Notes:**
- The `Transcript` table stores the full turns array as JSON rather than normalizing turns/sentences into separate tables. This avoids complex joins for transcript display — the TranscriptView component receives the entire turns array and renders it. Sentence IDs are parsed client-side for annotation matching.
- The `TeacherEvaluation` table stores the full evaluation as JSON because the teacher dashboard reads it as a single object for the cheat sheet and detail panel. No need to query individual annotations from it.
- `student_activity` maps to a separate `StudentActivity` table (not a JSON column on `ClassSession`) for efficient polling queries from the teacher dashboard.

---

### Phase 3a: Core Interaction (Phase 1 — Landscape)

**Objective:** Build the foundational student interaction — reading a transcript and creating annotations — in landscape/desktop layout only. Portrait/tablet mode is deferred to Phase 3b to keep this phase focused on getting the core interaction model right.

**Inputs:**
- Prisma schema and seeded database from Phase 2
- `uiux-app.md > Student > Phase 1` (full Phase 1 spec)
- `uiux-app.md > Student > Phase 1 > Transcript` (turn display, sentence selection)
- `uiux-app.md > Student > Phase 1 > Work Panel` (empty state, annotation form, annotation list)
- `uiux-app.md > Component > TranscriptView` (props, schema, behavior)
- `uiux-app.md > Component > AnnotationPanel` (modes, fields)
- `uiux-app.md > Component > DetectionActPicker` (schema fields, display, reading strategy hints)
- `uiux-app.md > Interactions > Sentence Selection` (tap mechanics, multi-select, cross-turn)
- `uiux-app.md > Design Language > Student` (spacious layout, copy tone)
- `uiux-app.md > Component > PhaseIndicator` (display)

**Tasks:**

1. **Student activity view layout (landscape).** Build the persistent two-panel structure at `/student/session/[id]`:
   - Phase indicator (top): four numbered circles, current phase highlighted, not clickable
   - Transcript panel (left, ~60%): scrollable, always visible
   - Work panel (right, ~40%): content changes per phase
   - Status bar (bottom): one sentence describing current phase task
   - Landscape only (>=1200px) for now — portrait mode added in Phase 3b

2. **TranscriptView component.** Implement per `uiux-app.md > Component > TranscriptView`:
   - Render turns as distinct blocks with persona header (name + role), left-border accent color per persona
   - Each sentence is an individually tappable element, keyed by `id` field
   - Touch targets: full width, sentence height + 8px padding, minimum 44px
   - Tap to select (highlight with selection color), tap again to deselect
   - Multi-select: multiple sentences, contiguous or non-contiguous, within or across turns
   - Annotation markers in left margin: solid colored dots for own annotations, positioned by matching `location.sentences` to sentence `id` fields
   - When selecting sentences that already have an annotation marker, show a subtle tooltip: "You already marked this — tap the marker to edit, or continue to create a new annotation"
   - Tapping annotation marker opens annotation in work panel
   - Visual gap between turns, generous padding (16px block, 12px gap)
   - Transcript text: 17px, line-height 1.7, max ~65 characters per line

3. **DetectionActPicker component.** Implement per `uiux-app.md > Component > DetectionActPicker`:
   - Radio buttons rendering from `DetectionAct` table (5 acts)
   - Each shows: `name` + `student_question` in smaller text + reading strategy hint below (reference: `uiux-app.md > Scaffolds` reading strategy hints table)
   - On select: expands to show `FlawPattern` records for that act — `plain_language` and `description`. Informational only, not a required sub-selection.
   - Single selection. Output: `act_id` string.

4. **Work panel — Phase 1 states.** Three states:

   a. **Empty state (0 annotations, nothing selected):** Welcoming text + five detection questions as reading lenses. Reference: `uiux-app.md > Student > Phase 1 > Work Panel` empty state wireframe. Each detection question is expandable to show its patterns (the flaw pattern library scaffold — reference: `uiux-app.md > Scaffolds` flaw pattern library).

   b. **Active state (1+ annotations, nothing selected):** Annotation list + compact detection question reference. List shows: location, detection act, description snippet, Edit button. Reference: `uiux-app.md > Student > Phase 1 > Work Panel` active state wireframe.

   c. **Annotation creation (sentences selected):** Form with selected sentences display, DetectionActPicker, description free-text field (min 10 chars, placeholder: "What did you notice? Describe it in your own words."), Save/Cancel buttons. Reference: `uiux-app.md > Student > Phase 1 > Work Panel` annotation creation wireframe.

5. **Server Actions for annotation CRUD.** In `src/actions/`:
   - `createAnnotation(studentId, sessionId, data)` — creates with `phase_created: 1`, `submitted: false`, `hints_used: 0`, empty `revision_history`
   - `updateAnnotation(annotationId, data)` — updates fields, appends to `revision_history`
   - `getAnnotations(studentId, sessionId)` — returns student's annotations
   - Optimistic updates: the UI reflects saves immediately, with a subtle "Saved" indicator. Retry on failure (up to 2 retries with 1-second delay), then show "Couldn't save — check your connection" error.

6. **Student activity tracking.** Server Action `updateActivity(studentId, sessionId)`:
   - Sets `first_opened` on first call (if null)
   - Updates `last_active` on every annotation save and periodically (every 30 seconds via client heartbeat)
   - Updates `annotation_count`

**Outputs:**
- Student activity view at `/student/session/[id]` with two-panel landscape layout
- TranscriptView component with sentence selection and annotation markers
- DetectionActPicker component with reading strategy hints
- Work panel with empty/active/creation states
- Server Actions for annotation CRUD and activity tracking
- Tailwind styling following student design language

**Notes:**
- Built without session join flow or teacher controls — use a hardcoded test student and session for development. Session management is Phase 8.
- The lifeline system and guided first detection scaffold are deferred to Phase 4b (scaffolds phase).
- Test with the `ocean_plastic_campaign` transcript (12 turns, 2 personas) — a good baseline for layout and interaction testing.
- Keep component structure responsive-ready (avoid hardcoded widths, use flex/grid that can be adapted), but do not implement the portrait mode layout or tab switcher yet.

---

### Phase 3b: Scaffolds + Portrait/Tablet Mode

**Objective:** Layer scaffolds and portrait/tablet responsive layout onto the working Phase 1 core from Phase 3a. Scaffolds are lightweight additions; portrait mode is a fundamentally different layout that requires dedicated attention.

**Inputs:**
- Phase 3a output (working landscape Phase 1)
- `uiux-app.md > Tablet` (touch targets, keyboard, portrait mode)
- `uiux-app.md > Scaffolds` (topic context, re-reading nudge)
- `uiux-app.md > Design Language > Student` (micro-animations)
- `uiux-app.md > Student > Phase 1 > Work Panel` (guided first annotation)

**Tasks:**

1. **Topic context scaffold.** Before the transcript, show the scenario context card (reference: `uiux-app.md > Scaffolds` topic context):
   - "About this discussion" header
   - Scenario `topic` and `context` fields (from Scenario table, not sensitive)
   - "Start Reading" button that dismisses the card and shows the transcript

2. **Guided first annotation.** On the first annotation creation (first time form is shown), display inline guide above form: "Nice! You found something. Now: (1) Pick which type of problem it is, (2) Describe what you noticed in your own words." Disappears after first save, does not reappear. Reference: `uiux-app.md > Student > Phase 1 > Work Panel` guided first annotation.

3. **Re-reading nudge.** Client-side timer: if 3+ minutes in Phase 1 with 0 annotations, show a dismissible nudge at the top of the work panel. Disappears on dismiss or on first annotation save. Reference: `uiux-app.md > Scaffolds` re-reading nudge. This uses a client-side timer — no server call needed.

4. **Annotation marker micro-animation.** When an annotation is saved, the corresponding sentences show a brief scale-up + checkmark animation on the annotation marker. Reference: `uiux-app.md > Design Language > Student` micro-animations.

5. **Portrait/narrow mode layout.** Implement per `uiux-app.md > Tablet`:
   - Breakpoint: <1200px switches to single-panel mode
   - Floating tab bar at bottom: "Read" and "Work" tabs
   - Auto-switch from Read to Work when sentences are selected (200ms slide transition animation for spatial continuity)
   - Auto-switch back to Read on save/cancel (if desired — follow uiux-app.md spec)
   - Scroll containment: panels scroll independently, inactive panel preserves scroll position
   - Phase indicator and status bar adapt to narrower layout

6. **Keyboard management (tablet).** Implement per `uiux-app.md > Tablet`:
   - Text input fields scroll into view above iOS keyboard
   - At least 3 lines of the input field remain visible above the keyboard
   - Detection act radio buttons may scroll out of view — this is acceptable if act is already selected

7. **Orientation change handling.** State preservation across orientation changes:
   - Selected sentences persist
   - Work panel form content persists
   - Scroll positions preserved per panel

8. **Pinch-to-zoom disabled.** Add `user-scalable=no` to viewport meta tag.

**Outputs:**
- Topic context card, re-reading nudge, guided first annotation layered onto Phase 1
- Annotation marker micro-animation
- Portrait/tablet mode with tab switcher, auto-switching, scroll containment
- Keyboard management for iOS/tablet
- Orientation change resilience

**Operator spot-check after Phase 3b:** Before proceeding to Phase 4a, the operator should spend ~10 minutes verifying: (1) portrait mode tab switching works, (2) touch targets feel right on a tablet-sized viewport, (3) the two-panel landscape layout holds with real transcript data. If something is off, flag it at the start of Phase 4a. This is not a formal review — no separate agent session or PASS/ISSUE report needed.

**Notes:**
- Test portrait mode with the `ocean_plastic_campaign` transcript at iPad viewport sizes (1024×768 portrait, 1366×1024 landscape).
- The auto-switch behavior is the trickiest interaction — verify that selecting sentences in Read tab → auto-switch to Work tab → saving annotation → returning to Read tab feels natural and doesn't lose selection state.
- All scaffolds added here are Phase 1-only. Phase 2 scaffolds (lifelines, guided first detection, inline prompts) are in Phase 4b.

---

### Phase 4a: Thinking Behaviors (Phase 2 Core) + Submission

**Objective:** Build the Phase 2 student experience — thinking behavior assignment, submission with undo, and force-submission. No scaffolds in this phase; those are isolated in Phase 4b.

**Inputs:**
- Phase 3b output (complete Phase 1 with scaffolds and portrait mode)
- `uiux-app.md > Student > Phase 2` (full Phase 2 spec)
- `uiux-app.md > Student > Phase 2 > Work Panel` (checklist, behavior assignment, progressive disclosure, submit)
- `uiux-app.md > Component > ThinkingBehaviorBrowser` (schema fields, library-first design)
- `uiux-app.md > Interactions > Annotation Lifecycle` (draft → submitted states)
- `uiux-app.md > Interactions > Phase Transitions` (transition UI)
- `uiux-app.md > Engagement` (submission celebration, progress satisfaction)

**Tasks:**

1. **Phase transition detection.** Implement client-side polling for `active_phase`:
   - Poll every 5 seconds: `GET /api/session/[id]/phase`
   - When polled phase differs from local state, trigger transition UI:
     - Brief overlay notification ("Your teacher moved to Phase [N]", 2-3 seconds, auto-dismiss)
     - Phase indicator animation
     - Status bar text update
     - Work panel content change
   - Reference: `uiux-app.md > Interactions > Phase Transitions`

2. **ThinkingBehaviorBrowser component.** Implement per `uiux-app.md > Component > ThinkingBehaviorBrowser`:
   - 8 library behaviors as radio options from `ThinkingBehavior` table
   - Progressive disclosure: initial view shows `name` only (one line each, scannable). On tap: selected behavior expands to show `description`, others collapse. Same expand-on-select pattern as DetectionActPicker.
   - `formal_term` NOT shown to students
   - "None of these fit" at bottom: visually secondary (smaller, muted, separated by divider). When selected, text input appears.
   - Output: `behavior_id` + `behavior_source` (library or own_words) + `behavior_own_words`

3. **Phase 2 work panel.** Implement per `uiux-app.md > Student > Phase 2 > Work Panel`:

   a. **Phase 2 introduction:** Brief explanation at top, collapses to one-line summary after first behavior assignment.

   b. **Annotation checklist:** Each annotation card shows: location, detection act, description snippet, thinking behavior status (⚠ not assigned / ✓ assigned with behavior name). Tapping opens behavior assignment view.

   c. **Behavior assignment view:** Shows the annotation context (location, quoted text, detection act, student's description), then ThinkingBehaviorBrowser, then explanation field (appears only after behavior selection, min 15 chars). Save returns to checklist. Reference: `uiux-app.md > Student > Phase 2 > Work Panel` behavior assignment wireframe.

   d. **Submit button:** "Submit My Work" at bottom. Disabled until all annotations have a thinking behavior. Disabled text: "Assign all thinking behaviors to submit." On tap: confirmation dialog ("Once you submit, you can't change your answers until Phase 3. Ready?"). On confirm: all annotations set to `submitted: true`, work panel transitions to "Submitted!" state with checkmark animation and summary. A prominent "Undo" button appears for 30 seconds — tapping it reverts `submitted` to false and returns to the checklist. After 30 seconds, the undo button disappears and submission is final.

4. **Force-submission and snapshot at Phase 2→3 transition.** When the teacher advances to Phase 3:
   - All unsubmitted annotations are auto-submitted (`submitted: true`) regardless of completion state
   - `thinking_behavior` may be null for incomplete annotations — these display "No thinking behavior assigned" in Phase 3
   - Brief notification: "Your teacher moved to the next phase. Your work has been submitted."
   - Server Action: `forceSubmitAll(sessionId)` — bulk update
   - Server Action: `takeSnapshot(sessionId, snapshotPhase)` — for every submitted annotation in the session, create an `AnnotationSnapshot` record with `snapshot_phase` and `snapshot_data` containing the full annotation state. Called after force-submit.
   - **Late-arriving students** who are still in Phase 1 are also force-submitted and snapshotted. Their annotations may have no thinking behaviors — this is expected and handled the same as any incomplete submission.

5. **New annotations in Phase 2.** Students can still create new annotations after Phase 2 opens (sentence selection still works). New annotations require both detection act and thinking behavior before they can be included in the submission.

6. **Progress satisfaction mechanics.** Reference: `uiux-app.md > Engagement`:
   - Phase indicator animation on phase complete (circle fills, checkmark appears)
   - "Your Annotations (N)" count grows as student works
   - Submission celebration: smooth checkmark + satisfying color change (not confetti)

**Outputs:**
- Phase 2 work panel with annotation checklist, ThinkingBehaviorBrowser, submission flow
- Phase transition detection via polling
- Force-submission and snapshot logic (`forceSubmitAll`, `takeSnapshot`)
- New annotation creation in Phase 2
- Engagement mechanics (progress, submission celebration)

**Notes:**
- Built without lifelines, guided first detection, or inline prompts — those are Phase 4b. The Phase 2 work panel should have a placeholder slot where the lifeline button will be inserted, but no implementation yet.
- Test the full Phase 1→2 transition: create annotations in Phase 1, advance to Phase 2, assign behaviors, submit. Then test force-submission with incomplete annotations.
- The 30-second undo window is time-sensitive UI — verify the timer, button visibility, and revert logic carefully.

---

### Phase 4b: Learning Scaffolds (Lifelines, Guided Detection, Prompts)

**Objective:** Build all learning scaffolds that span Phases 1-2: the lifeline system, guided first detection, and inline perspective prompts. These are isolated here because the lifeline targeting algorithm is the most complex single feature in the app, requiring cross-table data resolution and multi-level fallback logic.

**Inputs:**
- Phase 4a output (working Phase 2 with submission)
- `uiux-app.md > Scaffolds > Lifelines` (full lifeline system spec)
- `uiux-app.md > Scaffolds > Guided First` (guided first detection)
- `uiux-app.md > Scaffolds` (inline perspective prompts)
- Scenario artifacts in `REGISTRY_PATH` — specifically `evaluation.yaml` (facilitation_guide with what_to_expect, phase_1, phase_2 scaffolds) and `scenario.yaml` (persona weaknesses for Level 1 hint fallback). Read the actual artifacts to understand the data shape.

**Tasks:**

1. **Lifeline system.** Implement per `uiux-app.md > Scaffolds > Lifelines`:

   a. **Lifeline button:** Persistent in Phase 1 and Phase 2 work panels. Shows: "Lifelines: N remaining." Disabled when 0 remaining ("No lifelines remaining" + supportive message).

   b. **Targeting logic (student-directed):** When the student taps the lifeline button, a prompt appears: "Which part of the discussion do you want help with?" with options mapping to regions of the transcript (beginning / middle / end, derived by splitting the transcript's turn count into thirds). The system targets the nearest unfound flaw in the selected region. To determine flaw locations, match each `what_to_expect[].flaw` against the evaluation's `annotations[]` by `argument_flaw.pattern`, then use the annotation's `location.turn` and `location.sentences` for region mapping and overlap checking. If no unfound flaw exists in that region, the system suggests trying a different region. Data source: `TeacherEvaluation` (facilitation_guide + annotations, both stored from `evaluation.yaml` at import time).

   c. **Graduated hint levels:** Each tap reveals the next level for the target flaw:
   - Level 1 (Character): Derived from `scenario.yaml` persona weaknesses using a template: "Think about [name]. [weakness rephrased as question]." (e.g., "Think about Mia. She's really passionate about this topic. How might that affect what she says?"). If `facilitation_guide.phase_2[].character_hint` is present in the evaluation, use it instead (pre-written by evaluator, more tailored). If neither source produces a usable hint, skip Level 1 and start at Level 2.
   - Level 2 (Location): Flaw location resolved via evaluation annotations (matched by `what_to_expect[].flaw` → `annotations[].argument_flaw.pattern` → `annotations[].location.turn`) — rendered as "Re-read turns N through M."
   - Level 3 (Question): detection question from `facilitation_guide.phase_1[].prompt`
   - Level 4 (Pattern): `plain_language` + `description` from detection act library

   d. **Phase 2 lifelines:** Same pool. Hints narrow thinking behavior options (from `facilitation_guide.phase_2[].narrowed_options`) or offer perspective prompt (from `facilitation_guide.phase_2[].perspective_prompt`).

   e. **Server Actions:** `useLifeline(studentId, sessionId, region)` — accepts the student's chosen region (beginning/middle/end), creates/updates `StudentLifeline` record, returns the hint text for the targeted flaw. `getLifelineState(studentId, sessionId)` — returns remaining count and current hint states.

   f. **Zero lifelines:** If `lifelines_per_student: 0`, lifeline button is hidden.

2. **Guided first detection.** Implement per `uiux-app.md > Scaffolds > Guided First`:
   - Activates when `session.guided_first_detection` is true AND student has 0 annotations after dismissing the topic context
   - Selects `most_will_catch` flaw from facilitation guide
   - Shows prompt: "Let's start with turn [N]. Read what [persona] says. Does anything stand out to you?"
   - Transcript scrolls to or highlights the target turn
   - Detection act picker may show subtle suggestion
   - After save: "Great catch! Now read the rest of the discussion and see if you notice anything else on your own."
   - Does NOT consume a lifeline (separate from lifeline system)

3. **Inline perspective prompts (Phase 2).** Implement per `uiux-app.md > Scaffolds` inline perspective prompts:
   - When a student hasn't typed in the explanation field for 30+ seconds: show "Need a hint?" link
   - On expand: "Need a starting point? Try this: Imagine you're [persona name]. [perspective_prompt]"
   - Data source: `facilitation_guide.phase_2[]` matched by flaw pattern
   - One per annotation. Does not consume a lifeline.
   - Client-side timer — no server call.

**Outputs:**
- Lifeline system (button, targeting, graduated hints, server actions)
- Guided first detection scaffold
- Inline perspective prompts

**Notes:**
- Lifeline hints require reading from `TeacherEvaluation` (facilitation_guide) and `Scenario` (persona weaknesses). These are teacher-only data accessed server-side — the hints are rendered server-side and sent as text to the client. No sensitive data reaches the student's browser.
- The lifeline targeting logic is the most complex piece. Implement targeting as a server-side function that takes (studentId, sessionId, currentAnnotations) and returns the next hint. Test with all four scenarios to exercise different flaw counts and transcript lengths.
- The "unfound flaw" computation (comparing student annotation sentence IDs against evaluation annotation locations, matched via `what_to_expect[].flaw` → `annotations[].argument_flaw.pattern`) is the same overlap logic that Phase 5 (ComparisonView) and Phase 7 (teacher flaw coverage) will reuse. Factor it into a shared utility in `src/lib/overlap.ts` so it can be imported by those later phases.
- The 30-second timer for inline perspective prompts is client-side (no server call), similar to the re-reading nudge.

---

### REVIEW A: Core Annotation Flow

**Why here:** Phases 1-2 (transcript display, annotation, thinking behaviors, submission) and all learning scaffolds are the foundation. Every subsequent phase builds on this. Catching issues here prevents compounding errors. Phases 3a-4b split the work into four focused sessions; this review validates the integrated result.

**Files to review:**
- All components in `src/components/transcript/`, `src/components/annotation/`, `src/components/scaffolds/`
- All server actions in `src/actions/`
- Prisma schema (`prisma/schema.prisma`)
- Student activity view (`src/app/student/session/[id]/`)
- Overlap utility (`src/lib/overlap.ts`)

**Review prompt:**

```
You are reviewing the core annotation flow of the Perspectives app. The UI/UX
specification is at docs/uiux-app.md. The design specification is at docs/design.md.

PART 1: FUNCTIONAL CORRECTNESS

1. ANNOTATION LIFECYCLE
   Create an annotation in Phase 1 (select sentences, pick detection act, describe).
   In Phase 2, assign a thinking behavior and submit.
   Verify:
   - Annotation persists in database with correct fields
   - Submission locks editing
   - Force-submission at Phase 2→3 transition works for incomplete annotations
   - revision_history is populated correctly on edits

2. SCHEMA FIDELITY
   Verify the Prisma schema captures all data from the artifacts:
   - Import a scenario from REGISTRY_PATH and query all tables — are all fields populated?
   - Import reference libraries from REFERENCE_LIBRARIES_PATH — correct counts? (5 acts, 19 patterns, 8 behaviors)
   - Check that evaluation.yaml's facilitation_guide (timing, what_to_expect, phase_1, phase_2, phase_4) imports into TeacherEvaluation correctly
   - Check that evaluation_student.yaml annotations import into AIAnnotation correctly
   Verify the YAML import correctly populates all tables.

3. SCAFFOLD DATA FLOW
   Verify lifeline hints read the correct fields from the imported artifacts:
   - Flaw locations: resolved via evaluation.yaml annotations[].location (matched by flaw pattern), NOT from a turn_ids field
   - Level 1: scenario.yaml persona weaknesses (rephrased, not raw)
   - Level 2: flaw location from annotations (rendered as "Re-read turns N through M")
   - Level 3: evaluation.yaml facilitation_guide.phase_1[].prompt
   - Level 4: detection_act_library patterns
   - Phase 2: facilitation_guide.phase_2[].narrowed_options and perspective_prompt
   Verify guided first detection reads facilitation_guide.what_to_expect correctly.

PART 2: UI/UX COMPLIANCE

4. STUDENT DESIGN LANGUAGE
   Check against uiux-app.md > Design Language > Student:
   - Typography: 17px transcript, 16-18px body, 20px+ headers
   - Touch targets: minimum 44px
   - Copy tone: conversational, encouraging, no jargon
   - Micro-animations on annotation save and phase transition

5. TABLET BEHAVIOR
   Check against uiux-app.md > Tablet:
   - Portrait mode panel switcher works (Read/Work tabs)
   - Auto-switch to Work on sentence selection in portrait mode
   - Keyboard management: input scrolls into view above iOS keyboard
   - Scroll containment: panels scroll independently
   - Pinch-to-zoom disabled

6. DETECTION ACT PICKER
   Check against uiux-app.md > Component > DetectionActPicker:
   - Shows name + student_question + reading strategy hint
   - Expand on select shows patterns (plain_language + description)
   - Single selection, outputs act_id

7. THINKING BEHAVIOR BROWSER
   Check against uiux-app.md > Component > ThinkingBehaviorBrowser:
   - Progressive disclosure: name-only initial, expand on tap
   - Library-first: own-words is visually secondary
   - formal_term NOT shown to students
   - Explanation field appears only after behavior selection

PART 3: EDGE CASES

8. EMPTY AND ERROR STATES
   - 0 annotations: empty state with welcoming text and detection questions
   - Annotation with no thinking behavior at force-submit: displays correctly in Phase 3
   - Network failure on save: retry logic, error message shown
   - Late-arriving student: enters Phase 1 regardless of class phase, works at own pace, gets force-submitted/snapshotted at next teacher phase advance

9. LIFELINE EDGE CASES
   - All lifelines exhausted: button disabled, supportive message shown
   - Student has found all flaws: lifeline has nothing to hint (graceful handling)
   - Zero lifelines: button hidden when lifelines_per_student is 0
   - Level 1 skipped for emergent flaw: starts at Level 2

Report each criterion as PASS or ISSUE. End with READY TO PROCEED or NEEDS REVISION.
```

---

### Phase 5: Peer Comparison (Phase 3)

**Objective:** Build Phase 3 — peer annotation visibility, three-level comparison, revision during discussion.

**Inputs:**
- Review A output (confirmed core annotation flow)
- `uiux-app.md > Student > Phase 3` (full spec)
- `uiux-app.md > Student > Phase 3 > Comparison` (three-level logic, cards, free-text)
- `uiux-app.md > Student > Phase 3 > My Annotations` (revision, new annotations)
- `uiux-app.md > Student > Phase 3 > Transcript` (three-layer markers, color coding)
- `uiux-app.md > Component > ComparisonView` (algorithm, card rendering, AI normalization)
- `uiux-app.md > Engagement` (discovery moments)
- `uiux-app.md > Interactions > Phase Transitions` (Phase 2→3 transition)

**Tasks:**

1. **Phase 2→3 snapshot.** Uses `forceSubmitAll` + `takeSnapshot` from Phase 4a (already implemented). Called by the teacher's "Advance to Phase 3" action with `snapshotPhase: 3`. Verify end-to-end: force-submit incomplete annotations, then snapshot all, then confirm Phase 3 comparison view reads from snapshots.

2. **Transcript panel — three-layer annotation markers.** Extend TranscriptView:
   - Student's own annotations: solid colored dots (student's assigned color)
   - Peer annotations: outlined dots in each peer's assigned color
   - Where annotations overlap (same sentences): dots stack horizontally
   - Tapping any marker shows details in work panel
   - Group member colors: assigned at session creation (up to 5 distinct colors per group), consistent within session. Stored on `Student` record or computed from group position.

3. **Phase 3 transition moment.** Animated reveal: "Your group marked [N] moments in the discussion. Let's see what everyone noticed!" Count comes from peer annotation snapshots. Peer annotation markers fade in on transcript.

4. **ComparisonView component.** Implement the three-level comparison algorithm per `uiux-app.md > Component > ComparisonView`:

   a. **Group annotations by location:** Two annotations "overlap" if their `location.sentences` arrays share at least one sentence ID.

   b. **For overlapping locations, compare detection acts:** Same `act_id` = agreement on what's wrong. Different = disagreement.

   c. **For same-act matches, compare thinking behaviors:** Same `behavior_id` = full agreement. Different, or library vs. own_words = partial agreement with behavioral sub-disagreement.

   d. **No-overlap annotations** are "unique" — only one person noticed it.

   e. **Card rendering:**
   - Agreement (green): who agrees, what they agree on, any behavioral sub-disagreement with prompt "Talk about it!"
   - Disagreement (yellow): different detection acts, prompt "You marked the same spot but see different problems. Why?"
   - Unique — yours (blue): "Nobody else in your group marked this. Tell them what you noticed."
   - Unique — peer's (blue): "[Name] noticed something here that you didn't. Ask them about it!"

   f. **Free-text handling:** Peer `behavior_own_words` displayed as quoted text with prompt: "[Name] wrote: '[text].' Does that match any of the thinking behaviors?" No automatic matching attempted.

5. **Work panel — Phase 3 tabs.** Two tabs:

   a. **Tab 1: Comparison (default):** ComparisonView showing group findings. Data source: `AnnotationSnapshot` records for `snapshot_phase: 3` + this student's group. The comparison view reads snapshots, not live annotations.

   b. **Tab 2: My Annotations:** Student's own annotations, now editable again (client-side phase check: the Edit button is enabled when `activePhase >= 3`; the server validates the session's phase before accepting updates). "You can update your work based on your discussion. It's okay to change your mind!" Edit opens same form as Phase 1/2, pre-filled. Save appends to `revision_history` with `phase: 3, change_type: "revision"`. "+ Add new annotation" button creates with `phase_created: 3`, appends `revision_history` with `change_type: "new"`. Revised annotations show "Updated in Phase 3" badge.

6. **Discovery moments.** Reference: `uiux-app.md > Engagement` discovery moments:
   - "Only you caught this!" — unique annotation card uses distinct visual treatment (subtle glow or badge) + encouraging language
   - Group annotation count reveal — brief animated reveal at Phase 3 open

**Outputs:**
- Phase 2→3 snapshot logic (force-submit + snapshot)
- TranscriptView updated with three-layer annotation markers and group colors
- ComparisonView component with three-level comparison algorithm
- Phase 3 work panel with Comparison and My Annotations tabs
- Revision tracking and new annotation creation in Phase 3
- Discovery moment engagement mechanics

**Notes:**
- The ComparisonView component must also work in Phase 4 (with AI annotations added). Design it to accept an optional `aiAnnotations` prop that is null in Phase 3 and populated in Phase 4. The comparison algorithm uses the same logic for all annotation types.
- Test the comparison algorithm with the `deforestation_reforestation` scenario — it has 2 target flaws with cross-turn sentence references (`turn_05.s01` through `turn_08.s03` for ann_01), which exercises the sentence ID overlap logic.
- Revisions during Phase 3 update the live `Annotation` table but NOT the `AnnotationSnapshot` table. Other students' comparison views remain stable.

---

### Phase 6: AI Reveal (Phase 4) + Reflection

**Objective:** Build Phase 4 (AI annotation reveal, overlap framing, "AI missed this" discovery) and the post-Phase 4 reflection step.

**Inputs:**
- Phase 5 output (Phase 3 comparison)
- `uiux-app.md > Student > Phase 4` (full spec)
- `uiux-app.md > Student > Phase 4 > AI Tab` (AI cards, field mapping, overlap framing)
- `uiux-app.md > Scaffolds > Reflection` (reflection step)
- `uiux-app.md > Scaffolds` (Phase 4 overlap framing)
- `uiux-app.md > Component > ComparisonView` (AI annotation normalization)

**Tasks:**

1. **Phase 3→4 snapshot.** Same `takeSnapshot` logic as Phase 2→3, with `snapshot_phase: 4`. Includes any Phase 3 revisions and new annotations.

2. **Transcript panel — AI annotation layer.** Third marker type: diamond markers in neutral color (gray/purple). Staggered fade-in animation (one at a time, 200ms stagger) for the AI "showing its work." Reference: `uiux-app.md > Student > Phase 4`.

3. **AI annotation normalization.** Before passing AI annotations to ComparisonView, normalize from `evaluation_student.yaml` shape to student annotation shape per `uiux-app.md > Component > ComparisonView` normalization table:
   - `annotation.location.sentences` → `location.sentences`
   - `annotation.argument_flaw.detection_act` → `detection_act`
   - `annotation.thinking_behavior.pattern` → `thinking_behavior`
   - `behavior_source` set to `"library"` (AI always uses library)
   - Normalization computed at component boundary (parent of ComparisonView), not stored

4. **Work panel — Phase 4 tabs.** Three tabs: Comparison, AI Perspective (default), My Annotations.

   a. **AI Perspective tab:** Header: "Here's what the AI noticed. It's one perspective — you might agree, disagree, or see something it missed." Each AI annotation rendered as a card:
   - Location (turn + sentences)
   - Argument flaw: detection act name (resolved via library) + pattern plain-language name (resolved via library) + explanation
   - Thinking behavior: behavior name (resolved via library) + explanation
   - Discussion prompt: "Do you agree?" / "Did you notice this too?"
   - Reference: `uiux-app.md > Student > Phase 4 > AI Tab` wireframe

   b. **Phase 4 overlap framing.** For each AI annotation, check sentence ID overlap with student's annotations. Reference: `uiux-app.md > Scaffolds` Phase 4 overlap framing:
   - Overlap found: "You found this too!" card showing student's take vs. AI's take, with "Do you agree with how the AI explained it?"
   - No overlap: "The AI noticed something in turns [N] that you didn't mark. Read it — do you agree?"

   c. **"AI missed this" discovery.** Check student annotations for locations with no AI annotation overlap. Show highlighted card: "You found something the AI missed!" Reference: `uiux-app.md > Engagement` "The AI missed this" discovery moment.

   d. **Comparison tab:** Updated ComparisonView now includes normalized AI annotations. AI treated like a peer for comparison purposes (same three-level logic).

   e. **My Annotations tab:** Still editable. Revisions tracked with `phase: 4`. Prompt: "Now that you've seen the AI's perspective, is there anything you'd change or add?"

5. **Phase 4 transition moment.** "One more perspective to consider — here's what the AI noticed." AI markers fade in with stagger animation.

6. **Reflection step.** Implement per `uiux-app.md > Scaffolds > Reflection`:
   - Teacher activates by setting `reflection_active: true` (button on teacher dashboard — built in Phase 7)
   - Student polls for `reflection_active` alongside `active_phase` (same 5-second interval)
   - When active: reflection form appears in work panel. Two text fields:
     - "What's one thing you noticed on re-reading that you missed the first time?"
     - "What will you look for in the next discussion?"
   - Both optional. "Done" button saves to `StudentReflection` table.
   - Server Action: `submitReflection(studentId, sessionId, missedInsight, nextStrategy)`

7. **Name resolution utility.** Create `src/lib/resolve.ts`:
   - `resolveFlawPattern(patternId)` → plain-language name from `FlawPattern` table
   - `resolveDetectionAct(actId)` → act name from `DetectionAct` table
   - `resolveBehavior(behaviorId)` → behavior name from `ThinkingBehavior` table
   - Used by AI annotation cards and comparison cards to display human-readable names

**Outputs:**
- Phase 4 student UI with AI Perspective tab, overlap framing, discovery moments
- AI annotation normalization for ComparisonView
- Phase 3→4 snapshot logic
- Reflection step (teacher-triggered, optional responses, stored per student)
- Name resolution utility

**Notes:**
- The overlap framing comparison is simpler than the full ComparisonView three-level algorithm. It only checks sentence ID overlap — any shared sentence ID between student and AI annotation counts as a match. It does not compare detection acts or thinking behaviors.
- Test with `deforestation_reforestation` evaluation: ann_01 has 10 sentence IDs spanning turns 5-8, ann_02 has 9 sentence IDs spanning turns 9-13. Student annotations targeting those sentence ranges should produce "You found this too!" cards.

---

### Phase 7: Teacher Dashboard

**Objective:** Build the teacher-facing dashboard — session monitoring, phase controls, cheat sheet, and scenario import.

**Inputs:**
- Phase 6 output (all student phases complete)
- `uiux-app.md > Teacher > Dashboard` (dashboard home)
- `uiux-app.md > Teacher > Monitor` (active session view)
- `uiux-app.md > Teacher > Monitor > Student Monitor` (per-student status)
- `uiux-app.md > Teacher > Monitor > Phase Controls` (advance confirmation)
- `uiux-app.md > Teacher > Cheat Sheet` (facilitation guide rendering)
- `uiux-app.md > Component > StudentActivityTable` (polling, status indicators)
- `uiux-app.md > Design Language > Teacher` (compact, data-dense, professional)
- `uiux-app.md > Interactions > Polling` (intervals)

**Tasks:**

1. **Dashboard home** (`/teacher`). Reference: `uiux-app.md > Teacher > Dashboard`:
   - Active sessions list: sessions with `status: "active"`. Each shows scenario topic, current phase, student count, submission count.
   - Past sessions: collapsed "Past Sessions" section showing sessions with `status: "archived"`. Sessions auto-archive 2 hours after `created_at`. Auto-archive is checked on dashboard load and via a periodic server-side check (e.g., a Next.js API route called by a cron or on each dashboard poll).
   - Available scenarios list: each shows scenario_id, flaw count, persona count, pedagogical review score (if available), and `discussion_arc` as a one-line summary beneath each scenario
   - "Create New Session" button (routes to session creation — Phase 8)
   - "Import Scenario" dropdown: lists unimported scenario directories from `REGISTRY_PATH` (via `listUnimportedScenarios()`). Selecting a directory imports it using `importScenario()`. A "Upload Files" fallback allows file upload for scenarios not in the registry. Validation errors (missing required files, malformed YAML) are shown inline with specific messages per file.
   - Teacher design language: compact layout, smaller type, professional aesthetic

2. **Active session view** (`/teacher/session/[id]`). Two-panel layout:
   - Header: scenario topic, current phase, session code, "Advance to Phase [N]" button
   - Below header: `discussion_arc` from `Scenario` table — a one-line narrative summary of how the discussion unfolds, orienting the teacher to the scenario's shape
   - Left panel (~50%): Student Monitor
   - Right panel (~50%): Detail Panel (context-dependent)

3. **StudentActivityTable component.** Implement per `uiux-app.md > Component > StudentActivityTable`:
   - Grouped by group
   - Per group: flaw coverage indicator — how many target flaws have been found by at least one student in the group. A flaw is "found" if any student's annotation sentence IDs overlap with the AI annotation sentence IDs for that flaw (from `TeacherEvaluation`). Displayed as compact diamonds (e.g., "◆◆○ (2/3)"). Computed server-side.
   - Per student: status indicator + annotation count + submission status
   - Status indicators (derived from `StudentActivity` + `Annotation` tables):
     - Not started (○): `first_opened` is null
     - Active (●): `first_opened` is non-null
     - Submitted (✓): all annotations have `submitted: true`
     - May need help (⚠): active for >80% of `facilitation_guide.timing.phase_1_minutes` with 0 annotations, or >100% of phase time with fewer annotations than group average (thresholds are derived from the scenario's facilitation guide timing, not hardcoded)
     - Lifelines exhausted (flag): student has used all lifelines AND has 0-1 annotations
   - Class-level summary: total active, submitted count, and how many target flaws have been found by at least one group
   - Tapping student name opens their annotations in detail panel (read-only)
   - Tapping group name opens group comparison in detail panel (Phase 3+)
   - Polling: `GET /api/session/[id]/activity` every 10 seconds (includes flaw coverage data in the same response)

4. **Phase controls.** "Advance to Phase [N]" button opens confirmation dialog per `uiux-app.md > Teacher > Monitor > Phase Controls`:
   - Shows: submitted count, unsubmitted count
   - **Low-submission warning:** When fewer than 50% of students have submitted, the dialog shows a prominent color-coded warning (orange/red): "Only [N] of [M] have submitted. Most students' work will be auto-submitted incomplete."
   - Shows: what will happen (auto-submit, peer visibility, lock editing, etc.)
   - "Advance Now" / "Wait" buttons
   - Server Action: `advancePhase(sessionId, toPhase)`:
     - If advancing to Phase 3: call `forceSubmitAll`, then `takeSnapshot(sessionId, 3)`
     - If advancing to Phase 4: call `takeSnapshot(sessionId, 4)`
     - Update `active_phase`, record `PhaseTransition`
   - Reflection activation: after Phase 4 discussion, a separate "Start Reflection" button sets `reflection_active: true`

5. **Detail panel.** Context-dependent right panel:
   - Default: cheat sheet summary (what-to-expect section from facilitation guide)
   - Student selected: read-only view of that student's annotations (AnnotationPanel in `view` mode)
   - Group selected (Phase 3+): group comparison view (ComparisonView with all group members' snapshots)

6. **Cheat sheet page** (`/teacher/session/[id]/cheatsheet`). Implement per `uiux-app.md > Teacher > Cheat Sheet`:
   - Full-page rendering of `facilitation_guide` from `TeacherEvaluation` table
   - Sections: TIMING, WHAT TO EXPECT, WHY THIS FLAW WORKS (from `PedagogicalReview`), PHASE 1, PHASE 2 (with VALID ALTERNATIVES), PHASE 3 (hardcoded), PHASE 4
   - **WHY THIS FLAW WORKS**: For each target flaw, render the `expression_quality` text from `PedagogicalReview.flaw_assessments[]` (matched by `flaw_pattern`). Collapsible — collapsed by default for quick scanning, expandable for deeper prep. Only shown if `PedagogicalReview` data exists for this scenario.
   - **VALID ALTERNATIVES**: Beneath each Phase 2 scaffold entry, show the full `plausible_alternatives` list from the matching annotation in `TeacherEvaluation.annotations[]` (matched by `flaw` field). Resolved to plain-language behavior names. Formatted as "Also defensible: [name 1], [name 2]." Helps the teacher distinguish productive disagreements from confused ones during Phase 3.
   - Schema field mapping per the table in `uiux-app.md > Teacher > Cheat Sheet`
   - Print-friendly: no navigation chrome, clean margins, "Print" button. Collapsible sections print as collapsed.
   - "Back to Session" link
   - Resolve flaw pattern IDs to plain-language names using reference libraries

7. **API routes for polling.**
   - `GET /api/session/[id]/phase` — returns `active_phase` and `reflection_active` (student polls this)
   - `GET /api/session/[id]/activity` — returns `StudentActivity` records for all students in session (teacher polls this)

**Outputs:**
- Teacher dashboard at `/teacher` with session list (including discussion arc summaries), scenario import
- Active session view at `/teacher/session/[id]` with discussion arc, student monitor, flaw coverage, and phase controls
- StudentActivityTable component with polling and per-group flaw coverage indicators
- Phase advance logic (force-submit, snapshot, transition)
- Detail panel (cheat sheet summary, student annotations, group comparison)
- Cheat sheet page at `/teacher/session/[id]/cheatsheet` with flaw assessment deep dives and plausible alternatives
- Reflection activation button
- API routes for polling (activity endpoint includes flaw coverage data)

**Notes:**
- The teacher dashboard and student UI share the same Prisma database but serve different data through different routes. The teacher sees `TeacherEvaluation` (full evaluation including planned, plausible_alternatives, facilitation_guide), `PedagogicalReview` (flaw assessments), and flaw coverage computations. Students see only `AIAnnotation` (student-facing subset). This enforcement happens at the route/action level — teacher routes query different tables than student routes.
- Flaw coverage computation: for each AI annotation in the evaluation, check if any student in the group has an annotation whose `location.sentences` shares at least one sentence ID. This reuses the same overlap logic as the ComparisonView. The computation runs server-side and is included in the activity polling response — no separate endpoint needed.
- Test phase advancement end-to-end: create a session, join as a test student, advance through all 4 phases, verify force-submission, snapshots, and reflection activation all work.

---

### REVIEW B: Full App Flow

**Why here:** All phases and both roles are implemented. This review tests the complete experience before adding session management overhead.

**Files to review:**
- All student routes and components
- All teacher routes and components
- All server actions and API routes
- Prisma schema and seed script

**Review prompt:**

```
You are reviewing the complete Perspectives app. Test the full flow for both roles.
The UI/UX spec is at docs/uiux-app.md. The design spec is at docs/design.md.

PART 1: STUDENT FLOW (end-to-end with test data)

1. PHASE 1: Read transcript, create 2+ annotations. Verify:
   - Sentence selection works (tap, multi-select, cross-turn)
   - Detection act picker shows reading strategy hints
   - Annotation saves correctly, markers appear on transcript
   - Topic context shows before transcript
   - Re-reading nudge appears at 3 min with 0 annotations

2. PHASE 2: Assign thinking behaviors, submit. Verify:
   - Checklist shows all annotations with status
   - ThinkingBehaviorBrowser progressive disclosure works
   - Explanation field appears only after behavior selection
   - Submit locks annotations (30-second undo window works correctly)
   - Force-submission handles incomplete annotations (including late-arriving students)

3. PHASE 3: Compare with peers. Verify:
   - Snapshot taken at transition (comparison is stable)
   - Three-layer annotation markers on transcript
   - ComparisonView three-level algorithm produces correct cards
   - Free-text annotations display as quoted text with discussion prompt
   - Revision works (tracked in revision_history)
   - New annotations can be created (phase_created: 3)
   - Discovery moments appear ("Only you caught this!")

4. PHASE 4: AI reveal. Verify:
   - AI annotations appear with stagger animation
   - Overlap framing: "You found this too!" for matching locations
   - "AI missed this" for student-unique locations
   - AI annotation cards resolve pattern IDs to plain-language names
   - My Annotations tab still editable (phase: 4 in revision_history)

5. REFLECTION: Verify:
   - Teacher activates, student sees reflection form
   - Optional fields save correctly
   - "Done" button stores StudentReflection

PART 2: TEACHER FLOW

6. DASHBOARD: Verify:
   - Active sessions show correct status
   - Available scenarios list imported scenarios
   - Import scenario works (upload YAML artifacts)

7. MONITORING: Verify:
   - StudentActivityTable updates via polling
   - Status indicators correct (not started, active, submitted, may need help)
   - Lifeline exhaustion flagged for stuck students
   - Tapping student shows their annotations
   - Tapping group shows group comparison

8. PHASE CONTROLS: Verify:
   - Confirmation dialog shows correct counts
   - Low-submission warning (<50%) shows color-coded alert
   - Advance triggers force-submit + snapshot + phase update
   - All students detect phase change via polling (including late-arriving students in earlier phases)
   - Reflection activation button works after Phase 4

9. CHEAT SHEET: Verify:
   - All facilitation_guide sections render correctly
   - Flaw names resolved to plain-language
   - Print-friendly layout
   - Matches format from design.md lines 867-902

PART 3: SCAFFOLDS

10. LIFELINE SYSTEM: Verify:
    - Targeting logic selects correct flaw
    - Graduated hints reveal correct content at each level
    - Level 1 skipped for emergent flaws
    - Remaining count decrements correctly
    - Exhaustion state shows supportive message
    - Phase 2 lifelines narrow options correctly

11. GUIDED FIRST DETECTION: Verify:
    - Activates when guided_first_detection is true and 0 annotations
    - Scrolls to correct turn, shows correct prompt
    - Does not consume a lifeline
    - Celebration after first save

PART 4: CROSS-CUTTING

12. TABLET: Verify on iPad-sized viewport:
    - Portrait mode panel switcher
    - 44px touch targets
    - Keyboard management
    - Scroll containment

13. DATA INTEGRITY: Verify:
    - Evaluation split enforced: students never see planned, plausible_alternatives
    - Persona weaknesses never shown to students
    - Annotation snapshots are immutable (Phase 3 edits don't change snapshot)
    - Revision history accumulates correctly across phases

14. DESIGN LANGUAGE: Verify:
    - Student interface: spacious, inviting, conversational copy
    - Teacher interface: compact, data-dense, professional copy
    - Persona colors consistent across all views

Report each criterion as PASS or ISSUE. End with READY TO PROCEED or NEEDS REVISION.
```

---

### Phase 8: Session Management + Onboarding

**Objective:** Build session creation, student join flow, and group assignment.

**Inputs:**
- Review B output (confirmed full app flow)
- `uiux-app.md > Teacher > Create Session` (scenario selection, groups, session code)
- `uiux-app.md > Student > Join` (session code entry, authentication)

**Tasks:**

1. **Session creation** (`/teacher/session/new`). Reference: `uiux-app.md > Teacher > Create Session`:
   - Requires teacher/researcher login (enforced by middleware from Phase 2)
   - Scenario dropdown: lists imported scenarios from `Scenario` table
   - "Show guided first detection" checkbox (default checked) → sets `guided_first_detection`
   - Lifeline count input (default 3) → sets `lifelines_per_student`
   - Group assignment: teacher types full student names into groups. Groups of 4-5. Add/remove groups and students. **Duplicate name validation:** no two students in the same session can have the same full name — inline error if a duplicate is entered (if two students genuinely share a name, the teacher adds a middle initial to distinguish them). Optional "Auto-assign" button to randomly distribute unassigned students across groups (borrowed from CrossCheck's pattern — useful when the teacher has many students to assign quickly).
   - "Create Session" button:
     - Auto-generates 6-character alphanumeric session code (uppercase, no ambiguous characters like O/0, I/1)
     - Creates `User` records for each student (role=student, no password) if they don't already exist (upsert by displayName — same student can appear in multiple sessions)
     - Creates `ClassSession` (with teacher_id FK), `Group`, `GroupMember`, `StudentActivity` records
     - `active_phase` initialized to 1, `reflection_active` to false
     - Redirects to active session view, displays session code prominently

2. **Student join** (`/student`). Reference: `uiux-app.md > Student > Join`:
   - Centered card: session code input (6-char, large font) + full name input + "Join" button
   - Validation:
     - Session code exists and session is active
     - Student name matches a `User` record that is a `GroupMember` in this session (case-insensitive, whitespace-trimmed)
     - Error: "We don't see that name in this session. Check with your teacher."
   - On success: authenticate as student via BetterAuth (session code + name credentials), redirect to `/student/session/[id]`
   - **Late-arriving students** always enter Phase 1 regardless of the session's current `active_phase`. They work through Phase 1 at their own pace. At the next teacher phase advance, they are force-submitted and snapshotted like everyone else — their annotations may be incomplete (no thinking behaviors) and this is handled gracefully.
   - **Reconnection:** Re-entering the same session code + name re-authenticates into the existing session state (all annotations preserved). If the student's browser has a valid session cookie, navigating to `/student` redirects directly to their active session without re-entering credentials.
   - Display names: full name stored, first name + last initial displayed everywhere (derived by `src/lib/utils.ts`)

3. **Session code display.** After creation, the session code is shown prominently on the active session page header. The teacher reads it aloud or writes it on the board.

4. **Multiple sessions.** A teacher can have multiple active sessions. Sessions auto-archive 2 hours after creation — archived sessions move to the collapsed "Past Sessions" section on the dashboard. The teacher does not need to manually end sessions.

**Outputs:**
- Session creation page at `/teacher/session/new` (auth-protected)
- Student join page at `/student`
- Session code generation and validation
- Student `User` record creation during session setup
- Student authentication via session code + name
- Auto-assign button for group formation
- Display name derivation (first name + last initial)

**Notes:**
- Session creation is the final integration point — it connects teacher setup, student authentication, group assignment, scaffold configuration, and scenario selection into one flow.
- Test the full loop: teacher logs in → creates session → shares code → student joins → student works through Phases 1-4 → teacher monitors and advances → session completes.
- Verify that navigating to `/teacher` without login redirects to `/auth/login`. Verify that a student cannot access `/teacher` routes even with a valid session.

---

### Phase 9: Polish + Deployment

**Objective:** Final testing on target devices, university server deployment, and polish.

**Inputs:**
- Complete app from Phases 1-8
- `uiux-app.md > Tablet` (verify all tablet interactions)
- `uiux-app.md > Engagement` (verify all engagement mechanics)
- University server access details

**Tasks:**

1. **Tablet testing.** Test on actual iPad (or iPad-sized simulator) and Chromebook:
   - Portrait mode panel switcher transitions smoothly
   - All touch targets are at least 44px
   - Keyboard slides up without breaking layout; input scrolls into view
   - Scroll containment: transcript and work panels scroll independently
   - Pinch-to-zoom disabled (`<meta name="viewport" content="..., user-scalable=no">`)
   - No swipe gesture conflicts with iOS system gestures
   - Orientation change preserves state (selected sentences, work panel view, scroll position)

2. **Error handling and resilience.**
   - Annotation saves: optimistic UI + retry (2 retries, 1-second delay) + error message on failure
   - Polling failure: silent retry, no error shown to student (transient network issues)
   - Session join with invalid code/name: clear error messages
   - Page reload mid-session: student returns to correct phase, annotations preserved
   - Visible save state indicator: subtle "Saved" / "Saving..." in annotation form

3. **Performance check.**
   - Transcript rendering with 13-16 turns: smooth scroll, no jank
   - 60 concurrent students (simulated): polling load test on SQLite
   - Phase 3 comparison with 5 students × 3-4 annotations each: renders correctly
   - Phase transition: all students detect change within polling interval (5 seconds)

4. **University server deployment.**
   - Build: `npm run build` → `next start` on a port
   - Reverse proxy: nginx configuration (HTTPS if cert available, HTTP on private network otherwise)
   - Database: SQLite file on server filesystem, backed up daily
   - Environment: `.env` with production `DATABASE_URL`, `REFERENCE_LIBRARIES_PATH`, `REGISTRY_PATH`
   - Process manager: pm2 or systemd to keep the Node.js process running
   - Verify: access from campus network on iPad and Chromebook browsers

5. **Seed production database.**
   - Seed teacher/researcher credentials from `seed.yaml`
   - Import reference libraries
   - Import all scenarios from `REGISTRY_PATH` that will be used in the pilot
   - Verify import integrity and login

6. **Final walkthrough.** Run through the complete flow as both teacher and student:
   - Teacher: log in → create session → share code → monitor → advance phases → activate reflection → view cheat sheet
   - Student: join with code + name → Phase 1 (annotate with lifeline) → Phase 2 (assign, submit) → Phase 3 (compare, revise) → Phase 4 (AI reveal) → reflection
   - Verify: student cannot access `/teacher` routes; unauthenticated users redirected to login
   - Verify all engagement mechanics fire (discovery moments, submission celebration, progress indicators, overlap framing)

7. **Documentation for operator.**
   - How to seed teacher/researcher credentials
   - How to import new scenarios from `REGISTRY_PATH`
   - How to create sessions and share codes
   - How to back up the SQLite database
   - Troubleshooting: server restart, database reset, re-import

**Outputs:**
- Verified tablet experience
- App deployed on university server
- Production database seeded with credentials and pilot scenarios
- Operator documentation

---

## Summary

| Phase | What | Depends on | Key risk mitigated |
|-------|------|------------|-------------------|
| 1 | Spec alignment + schema updates | Pipeline complete | Schema gaps, unresolved design decisions |
| 2 | Project scaffolding + database | Phase 1 | Prisma schema correctness, import pipeline, BetterAuth setup |
| 3a | Core interaction (Phase 1 — landscape) | Phase 2 | Foundational UI: transcript, sentence selection, annotation CRUD |
| 3b | Scaffolds + portrait/tablet mode | Phase 3a | Responsive layout isolated from core; tablet interactions verified |
| *(spot-check)* | *Operator verifies portrait mode, touch targets* | *Phase 3b* | *Layout issues caught before Phase 2 builds on top* |
| 4a | Thinking behaviors (Phase 2) + submission | Phase 3b | Submission flow, force-submission, undo window |
| 4b | Learning scaffolds (lifelines, guided detection, prompts) | Phase 4a | Lifeline targeting algorithm gets dedicated focus; overlap utility shared |
| **REVIEW A** | **Core annotation flow** | **Phase 4b** | **Annotation lifecycle, scaffold data flow, tablet behavior** |
| 5 | Peer comparison (Phase 3) | Review A | Snapshot strategy, three-level comparison algorithm |
| 6 | AI reveal (Phase 4) + reflection | Phase 5 | Overlap framing, AI normalization, reflection storage |
| 7 | Teacher dashboard | Phase 6 | Phase controls, monitoring, cheat sheet rendering |
| **REVIEW B** | **Full app flow** | **Phase 7** | **End-to-end student + teacher flow, data integrity** |
| 8 | Session management + auth + onboarding | Review B | Session creation, student join flow |
| 9 | Polish + deployment | Phase 8 | Tablet testing, server deployment, performance |

---

## Open Decisions

Decisions resolved during Phase 1 (spec alignment) and pipeline implementation:

1. ~~**Authentication approach.**~~ **Decided.** Two-tier authentication using BetterAuth:
   - **Teachers:** Seeded credentials (name + password) loaded by the researcher via a seed YAML file, hashed with bcrypt, authenticated via BetterAuth's email+password plugin (database-backed cookie sessions). This prevents students from accessing the teacher dashboard. Adapted from CrossCheck's `seed.yaml` → `seed-users.ts` pattern.
   - **Students:** Session code + full student name (no password). Teacher pre-assigns student names to groups during session creation. Students enter the code + their full name to join (case-insensitive, whitespace-trimmed match). The app displays first name + last initial everywhere. Simple enough for 6th graders. Implemented as a custom BetterAuth plugin or Server Action.
   - **Researcher:** Same credentials mechanism as teacher, with `role: "researcher"`. The researcher seeds their own credentials alongside teacher credentials. For MVP, the researcher uses the teacher dashboard — no separate researcher routes.

2. ~~**YAML import workflow.**~~ **Decided.** Teacher imports scenarios through the dashboard UI, as specified in `uiux-app.md > Teacher > Dashboard`. Primary mechanism: a dropdown listing unimported scenario directories from `REGISTRY_PATH` on the server. Fallback: file upload for scenarios not in the registry. Validation errors are shown inline. This keeps the workflow self-contained in the app. The `REGISTRY_PATH` and `REFERENCE_LIBRARIES_PATH` environment variables are configured in `.env.local`.

3. ~~**Phase 3 real-time needs.**~~ **Decided.** Snapshot at Phase 2→3 transition. The comparison view operates on a frozen snapshot of submitted annotations; revisions during Phase 3 update only the student's own "My Annotations" tab. A fresh snapshot is taken at the Phase 3→4 transition to include Phase 3 revisions. See `design.md` Phase 3 comparison logic. **Implementation:** `AnnotationSnapshot` table with `snapshot_phase` (3 or 4) and `snapshot_data` (JSON). See Phase 1 task 6.

4. ~~**Guided first detection toggle.**~~ **Decided.** Session-level boolean (`guided_first_detection`) set by teacher at session creation. No persistent per-student tracking (no user accounts). Teacher knows if this is the class's first or third scenario. See Phase 1 task 3.

5. ~~**Lifeline tracking model.**~~ **Decided.** Per-student-per-session `StudentLifeline` records track which flaws have been hinted and how many levels revealed. Per-annotation `hints_used` field tracks whether a lifeline contributed to each annotation. See Phase 1 task 5.

6. ~~**Reflection storage.**~~ **Decided.** App-only `StudentReflection` Prisma model (not a pipeline schema). Two optional text fields per student per session. Teacher activates via `reflection_active` boolean on session. See Phase 1 task 4.

7. ~~**Snapshot implementation.**~~ **Decided.** `AnnotationSnapshot` table with copied annotation state at each phase transition. Comparison views read snapshots; live edits don't affect other students' comparison views. See Phase 1 task 6.

8. **Phase 3 reaction text field (post-MVP).** For each peer annotation that differs from theirs, students could write a short reaction: "Do you agree or disagree? Why?" This captures reasoning that currently evaporates after verbal discussion and produces valuable research data. See `uiux-app.md > Scaffolds` for context.

9. **Cross-session memory (post-MVP).** Track what detection acts and thinking behaviors each student has encountered across sessions. Surface growth and recommend what to practice next. Requires user accounts and persistent storage beyond the current session-scoped model.
