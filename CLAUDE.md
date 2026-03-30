# Polylogue 4

Polylogue 4 generates AI group discussions containing designed critical thinking flaws for 6th graders to practice evaluating. It is built for the University Middle School (UMS) in Memphis. The system has two parts: a **pipeline** (Claude Code commands that generate discussion scenarios) and an **app** (Perspectives, a web app where students work through a four-phase evaluation activity).

## Document Hierarchy

Read these documents in this order depending on what you're working on:

| Document | Purpose | When to read |
|----------|---------|-------------|
| `docs/design.md` | Complete design specification — flaw framework, pipeline architecture, app design, schemas | Always. This is the source of truth for what the system does and why. |
| `docs/implementation-pipeline.md` | Pipeline build plan — Phases 1-6.3 + 2 reviews, each scoped to one Claude Code session | When implementing the pipeline (schemas, subagent prompts, commands, scripts). |
| `docs/scenario-sequence.md` | Operator guide — ready-to-use `create_scenario` prompts for the UMS pilot, with rationale and design notes | When generating scenarios for the pilot. |
| `docs/difficulty-calibration.md` | How to tune flaw detectability and address student differences — design-time and runtime levers | When designing scenarios or reviewing facilitation guides. |
| `docs/implementation-app.md` | App build plan — tech stack, data flow, phase sketches with uiux-app.md cross-references | When implementing the Perspectives app. Only after the pipeline is complete. |
| `docs/uiux-app.md` | App UI/UX reference — screen specs, component specs, interaction patterns, tablet model | When building app screens/components. Look up specific sections by reference key (see Section Index at top of file). Do not read linearly. |

## Implementation Sequence

1. **Pipeline first.** Follow `docs/implementation-pipeline.md` Phases 1-6.3. The pipeline must be complete before the app. Then generate scenarios using `docs/scenario-sequence.md`.
2. **App second.** Follow `docs/implementation-app.md`. The first step is spec alignment — reconcile with any changes from pipeline implementation.

## Key Conventions

- **YAML for all pipeline artifacts.** Schemas, scenario plans, transcripts, evaluations — all YAML. Schemas are stored in `configs/*/schemas/`.
- **Schema-driven communication.** Every handoff between commands, subagents, and the app is governed by a schema. No free-form output.
- **Scripts for deterministic tasks.** Python scripts handle mechanical operations (validation, enumeration, file splitting). LLM calls are reserved for judgment tasks (generation, evaluation).
- **Canonical IDs.** Argument flaw patterns and thinking behaviors have canonical IDs (lowercase strings) used consistently across all schemas and artifacts. The reference libraries in `configs/reference/` are the source of truth for these IDs.

## Directory Structure

```
polylogue-4/
├── docs/                    # Design and implementation documents
├── configs/                 # Pipeline configuration (schemas, commands, agents, scripts)
│   ├── reference/           # Flaw and behavior libraries
│   ├── system/              # initialize_polylogue command + sync script
│   ├── scenario/            # create_scenario command, learning scientist agent, schemas
│   ├── script/              # create_script command, dialog writer + instructional designer agents, schemas
│   ├── evaluation/          # evaluate_script command, evaluator agent, schemas
│   ├── app/                 # App-facing schemas (session config, student annotations)
│   └── shared/              # Cross-cutting scripts (validate_schema.py)
├── app/                     # Perspectives web app (Next.js)
├── registry/                # Generated pipeline outputs (one directory per scenario)
├── references/              # PBL materials and background research
├── .claude/                 # Runtime commands and agents (copied from configs/ by initialize_polylogue)
└── CLAUDE.md                # This file
```

## Notes

- The app uses Next.js + SQLite (Prisma) + TypeScript + Tailwind CSS. See `docs/implementation-app.md` for tech stack details and multi-machine development setup.
