# Polylogue 4 — App Implementation Plan

## Overview

This plan covers implementation of the Perspectives app: the student-facing web application for Polylogue 4. It is a companion to `implementation-pipeline.md` and references the design specification in `design.md`.

**Prerequisites:**
- The pipeline implementation must be complete before app development begins. The first step of app implementation is to align this plan to any spec or design changes that occurred during pipeline development. Pipeline outputs (schemas, generated scenarios in `registry/`, and the scenario sequence in `docs/scenario-sequence.md`) serve as the app's input contracts and test data.
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
| **Researcher** | Everything + raw data access | Export data, compare across scenarios, analyze annotation patterns |

---

## Tech Stack

### Decision Criterion

The primary criterion for stack selection is **LLM-developability**: the stack should maximize the quality and reliability of code generated by Claude Code across multiple working sessions. This means prioritizing frameworks and tools that are heavily represented in training data, have strong conventions, use a single language, and minimize external service dependencies.

### Chosen Stack

| Layer | Choice | Justification |
|-------|--------|---------------|
| **Framework** | Next.js (App Router) | Most heavily represented full-stack React framework in LLM training data. File-based routing provides clear conventions — the LLM knows where to put things. Server Components and Server Actions eliminate the need for a separate API layer, keeping the codebase in one project. |
| **Language** | TypeScript | Single language across frontend and backend. Type safety constrains LLM output and catches errors at build time rather than runtime. LLMs generate better TypeScript than JavaScript because types provide structural guardrails. |
| **Database** | SQLite via Prisma | A single file on the server — no database server to install or manage. Handles the concurrent load of 60 users easily (thousands of writes/second with WAL mode). Prisma provides type-safe queries and is well-known to LLMs. Research data export is trivial: copy the database file, or query with any SQLite tool. |
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

**One-time: Reference libraries.** The detection act library and thinking behavior library (`configs/reference/detection_act_library.yaml`, `configs/reference/thinking_behavior_library.yaml`) are seeded into the database once — at initial setup or at build time. These are the same for every scenario and every session. They populate the Phase 1 detection act selector and Phase 2 thinking behavior browser.

**Per-scenario: Scenario data.** When a teacher sets up a session, the scenario's artifacts are imported from the registry:

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
Research export: query SQLite directly, or copy the .db file
```

The app does not read YAML at runtime. YAML is the pipeline-to-app interface; SQLite is the app's internal data store. This separation means:
- The app doesn't depend on the file system layout of the registry
- Student annotations, session state, and revision history are stored in the database alongside the imported scenario data
- The evaluation split (student vs. teacher) is enforced at import time — student-facing routes query only the student-visible annotation data
- Research data access is a database query, not file parsing

**Runtime data in the Prisma schema.** The pipeline's session configuration schema (design.md) defines both teacher-authored fields and app-runtime fields (`active_phase`, `phase_transitions`, `student_activity`) in one logical structure. In the Prisma schema, `student_activity` should map to a separate database table (e.g., `StudentActivity`) with a foreign key to `Session`, not embedded in a JSON column. This gives proper indexing for the teacher dashboard polling queries. The pipeline schema describes the logical structure; the Prisma schema describes the physical storage.

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

*Detailed phases to be written after pipeline implementation is complete and specs are re-aligned. The sketches below show the general arc and the `uiux-app.md` sections each phase should reference.*

### Phase sketch with UI/UX references

1. **Spec alignment** — reconcile this plan with any design/schema changes from pipeline implementation. Re-verify `uiux-app.md > Data Contracts` against actual pipeline schemas.

2. **Project scaffolding + database schema** — Next.js project, Prisma schema, YAML import.
   - Reference: `uiux-app.md > Data Contracts` (all schema mappings, sentence ID format, evaluation split, import timing)
   - Reference: `uiux-app.md > Design Language` (establish student vs. teacher visual direction in Tailwind theme)

3. **Transcript display + annotation (Phase 1)** — the core interaction: reading and marking up a transcript.
   - Reference: `uiux-app.md > Student > Phase 1` (full Phase 1 spec)
   - Reference: `uiux-app.md > Student > Phase 1 > Transcript` (turn display, sentence selection, annotation markers, enumeration format)
   - Reference: `uiux-app.md > Student > Phase 1 > Work Panel` (empty state, guided first annotation, reading nudge, detection act picker, annotation form, annotation list)
   - Reference: `uiux-app.md > Scaffolds` (topic context, reading strategy hints, guided first detection, re-reading nudge, flaw pattern library)
   - Reference: `uiux-app.md > Scaffolds > Lifelines` (lifeline system — graduated hints, targeting logic, Phase 1 hint levels)
   - Reference: `uiux-app.md > Scaffolds > Guided First` (onboarding mechanic for first 2-3 scenarios)
   - Reference: `uiux-app.md > Component > TranscriptView` (props, schema, behavior)
   - Reference: `uiux-app.md > Component > AnnotationPanel` (modes, fields, schema mapping)
   - Reference: `uiux-app.md > Component > DetectionActPicker` (schema fields, display, reading strategy hints per act)
   - Reference: `uiux-app.md > Interactions > Sentence Selection` (tap mechanics, multi-select, cross-turn)
   - Reference: `uiux-app.md > Tablet` (touch targets, keyboard management, portrait mode panel switcher)
   - Reference: `uiux-app.md > Design Language > Student` (spacious layout, conversational copy, micro-animations)
   - Schema note: `student_annotations.yaml` needs `hints_used: integer` field for tracking lifeline usage per annotation

4. **Thinking behaviors (Phase 2) + submission flow** — extending annotations, submission gate.
   - Reference: `uiux-app.md > Student > Phase 2` (full Phase 2 spec)
   - Reference: `uiux-app.md > Student > Phase 2 > Work Panel` (annotation checklist, behavior assignment, progressive disclosure, submit button)
   - Reference: `uiux-app.md > Scaffolds > Lifelines` (Phase 2 lifeline hints — narrowed options, perspective prompts)
   - Reference: `uiux-app.md > Scaffolds` (inline perspective prompts for Phase 2)
   - Reference: `uiux-app.md > Component > ThinkingBehaviorBrowser` (schema fields, progressive disclosure, library-first design)
   - Reference: `uiux-app.md > Interactions > Annotation Lifecycle` (draft → submitted states)
   - Reference: `uiux-app.md > Engagement` (submission celebration moment, progress satisfaction)

5. **REVIEW A** — core annotation flow before adding peer/teacher complexity.

6. **Peer comparison (Phase 3)** — group-scoped visibility, comparison UI, revision during discussion.
   - Reference: `uiux-app.md > Student > Phase 3` (full Phase 3 spec)
   - Reference: `uiux-app.md > Student > Phase 3 > Comparison` (three-level comparison logic, agreement/disagreement cards, free-text handling)
   - Reference: `uiux-app.md > Student > Phase 3 > My Annotations` (revision during discussion, new annotations, revision history)
   - Reference: `uiux-app.md > Student > Phase 3 > Transcript` (three-layer annotation markers, color coding)
   - Reference: `uiux-app.md > Component > ComparisonView` (comparison algorithm, card rendering, schema consumption)
   - Reference: `uiux-app.md > Engagement` (discovery moments: "Only you caught this!", group annotation count reveal)
   - Reference: `uiux-app.md > Interactions > Phase Transitions` (Phase 2→3 transition behavior, force-submission)

7. **AI reveal (Phase 4) + teacher dashboard** — final student phase + teacher monitoring and controls.
   - Reference: `uiux-app.md > Student > Phase 4` (full Phase 4 spec)
   - Reference: `uiux-app.md > Student > Phase 4 > AI Tab` (AI annotation cards, evaluation_student.yaml field mapping, "AI missed this" discovery, "You found this too" overlap framing)
   - Reference: `uiux-app.md > Scaffolds > Reflection` (post-Phase 4 reflection step — teacher-triggered, metacognitive prompts)
   - Reference: `uiux-app.md > Teacher > Dashboard` (active sessions, available scenarios, import)
   - Reference: `uiux-app.md > Teacher > Monitor` (student activity table, phase controls, detail panel)
   - Reference: `uiux-app.md > Teacher > Monitor > Student Monitor` (status indicators, schema fields)
   - Reference: `uiux-app.md > Teacher > Monitor > Phase Controls` (advance confirmation, force-advance)
   - Reference: `uiux-app.md > Teacher > Cheat Sheet` (facilitation guide rendering, schema field mapping)
   - Reference: `uiux-app.md > Component > StudentActivityTable` (props, schema, polling)
   - Reference: `uiux-app.md > Component > PhaseIndicator` (display, animation)
   - Reference: `uiux-app.md > Design Language > Teacher` (compact layout, professional tone, keyboard-friendly)
   - Reference: `uiux-app.md > Interactions > Polling` (intervals, what's polled)

8. **REVIEW B** — full app flow with all phases and roles.

9. **Session management + onboarding** — teacher creates sessions, assigns groups, onboarding flow.
   - Reference: `uiux-app.md > Teacher > Create Session` (scenario selection, group assignment, session code)
   - Reference: `uiux-app.md > Student > Join` (session code entry, authentication)
   - Reference: `uiux-app.md > Onboarding` (tutorial status bar messages, warm-up optional)
   - Note: The warm-up scenario (Scenario 1 in `docs/scenario-sequence.md`) is optional. If skipped, the guided first detection (`uiux-app.md > Scaffolds > Guided First`) and reading strategy hints provide onboarding without a separate tutorial session.
   - Schema note: `session_configuration.yaml` needs `lifelines_per_student: integer` field (default 3, configurable by teacher at session creation)

10. **Polish + deployment** — university server setup, final testing.
    - Reference: `uiux-app.md > Tablet` (verify all tablet interactions, orientation handling, keyboard management)
    - Reference: `uiux-app.md > Engagement` (verify all engagement mechanics are implemented)

Review phases will be inserted after the core annotation flow (phase 5) and after the full app flow (phase 8), with specific review prompts following the same format as the pipeline plan.

---

## Open Decisions (Post-Pipeline)

These decisions are deferred until pipeline implementation is complete:

1. ~~**Authentication approach.**~~ **Decided.** Session code + full student name, as specified in `uiux-app.md > Student > Join`. Teacher creates a session (which generates a 6-character code), pre-assigns students by full name to groups. Students enter the code + their full name to join (case-insensitive, whitespace-trimmed match). The app displays first name + last initial everywhere. No accounts, no passwords. Simple enough for 6th graders, sufficient for a research prototype on a private university network.

2. ~~**YAML import workflow.**~~ **Decided.** Teacher imports scenarios through the dashboard UI, as specified in `uiux-app.md > Teacher > Dashboard`. File upload or path input for the scenario's YAML artifacts. This keeps the workflow self-contained in the app — the researcher doesn't need CLI access during class. A CLI import script can be added later if bulk import is needed.

3. **Offline resilience.** Does UMS have reliable campus network? If intermittent, the app may need optimistic updates and local state reconciliation. If reliable, polling is sufficient.

4. ~~**Phase 3 real-time needs.**~~ **Decided.** Snapshot at Phase 2→3 transition. The comparison view operates on a frozen snapshot of submitted annotations; revisions during Phase 3 update only the student's own "My Annotations" tab. A fresh snapshot is taken at the Phase 3→4 transition to include Phase 3 revisions. See `design.md` Phase 3 comparison logic.

5. **Research data export format.** CSV? JSON? Direct SQLite access? Depends on what analysis tools the researcher uses.

6. **Researcher routing.** The project structure shows `student/` and `teacher/` route directories. The researcher role needs either its own routes (`researcher/`) or elevated permissions on the teacher routes. Decision depends on whether researcher needs distinct UI (data export, cross-scenario comparison) or just extended access to the teacher dashboard.

7. **Phase 3 reaction text field (post-MVP).** For each peer annotation that differs from theirs, students could write a short reaction: "Do you agree or disagree? Why?" This captures reasoning that currently evaporates after verbal discussion and produces valuable research data. See `uiux-app.md > Scaffolds` for context.

8. **Cross-session memory (post-MVP).** Track what detection acts and thinking behaviors each student has encountered across sessions. Surface growth and recommend what to practice next. Requires user accounts and persistent storage beyond the current session-scoped model.
