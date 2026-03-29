# Polylogue 4

Polylogue 4 generates AI group discussions containing designed critical thinking flaws for 6th graders to practice evaluating. Built for the University Middle School (UMS) in Memphis.

## Two Parts

**Pipeline** — Claude Code commands that generate discussion scenarios. A teacher provides a PBL topic and instructional goals; the pipeline produces a 12-16 turn discussion with 1-3 targeted argument flaws, plus annotations and a facilitation guide.

**Perspectives** — A web app where students work through a four-phase evaluation activity: recognize argument flaws, identify thinking behaviors, compare with peers, and evaluate the AI's perspective.

## Documentation

| Document | Purpose |
|----------|---------|
| `docs/design.md` | Complete design specification |
| `docs/implementation-pipeline.md` | Pipeline build plan (7 phases + 2 reviews) |
| `docs/implementation-app.md` | App build plan and tech stack |
| `docs/uiux-app.md` | App UI/UX reference (lookup, not linear) |

## Tech Stack

- **Pipeline:** Claude Code commands, Python scripts, YAML schemas
- **App:** Next.js (App Router) + TypeScript + SQLite (Prisma) + Tailwind CSS
