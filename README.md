# Polylogue 4

Polylogue 4 generates AI group discussions containing designed critical thinking flaws for 6th graders to practice evaluating. Built for the University Middle School (UMS) in Memphis.

## Two Parts

**Pipeline** — Claude Code commands that generate discussion scenarios. A teacher provides a PBL topic and instructional goals; the pipeline produces a focused discussion with 1-3 targeted argument flaws, plus annotations and a facilitation guide.

**Perspectives** — A web app where students work through a four-phase evaluation activity: recognize argument flaws, identify thinking behaviors, compare with peers, and evaluate the AI's perspective.

## Operator Workflow

The pipeline is run by an **operator** — the person who executes the Claude Code commands and reviews generated output. For the UMS pilot, the operator is the researcher.

### First-Time Setup

```bash
# 1. Copy the bootstrap command
cp configs/system/commands/initialize_polylogue.md .claude/commands/

# 2. Run it to sync all commands and agents
/initialize_polylogue
```

This copies all slash commands to `.claude/commands/` and all subagent definitions to `.claude/agents/`. Re-run after adding or changing commands or agents in `configs/`.

### Generating a Scenario

Each scenario goes through three commands in sequence:

```
/create_scenario  →  /create_script  →  /evaluate_script
```

**Step 1: Create the scenario plan**

```
/create_scenario
```

Provide: topic, context, instructional goals, and target flaw-behavior combinations. The command designs a discussion plan with personas, a turn outline, and targeted flaws. A learning scientist subagent validates the plan before it's finalized.

See `docs/scenario-sequence.md` for ready-to-use prompts with a designed progression from easy to hard.

**Step 2: Generate the transcript**

```
/create_script
```

Provide: the scenario_id from Step 1. The command invokes the dialog writer to generate the transcript, runs structural checks, polishes with the instructional designer, and assesses pedagogical quality with the pedagogical reviewer. If the reviewer scores below 4, the command halts with a revision strategy.

**Step 3: Evaluate and produce facilitation materials**

```
/evaluate_script
```

Provide: the scenario_id. The command annotates all flaws (planned and emergent), produces a quality assessment, generates a facilitation guide with per-phase scaffolds, and exports the student-facing evaluation and printable cheat sheet.

### Output

Each scenario produces these artifacts in `registry/{scenario_id}/`:

| File | What it is | Who uses it |
|------|-----------|-------------|
| `scenario.yaml` | The discussion plan | Operator (review and revision) |
| `script.yaml` | The final transcript | Perspectives app, students |
| `evaluation.yaml` | Full evaluation with annotations, quality assessment, facilitation guide | Operator, teacher (via cheat sheet) |
| `evaluation_student.yaml` | Student-facing annotations only (no teacher fields) | Perspectives app (Phase 4) |
| `cheat_sheet.md` | Printable facilitation reference | Teacher (during class) |
| `pedagogical_review.yaml` | Pedagogical quality assessment | Operator (quality gate) |

### Pilot Scenario Sequence

`docs/scenario-sequence.md` contains 7 scenarios in a designed progression for the UMS pilot:

1. **Warm-up** — Hand-crafted tutorial with an obvious flaw
2-3. **Easy** — Single flaws, Acts 1-2 (spot errors, evaluate evidence)
4-5. **Moderate** — Two flaws, Acts 2+3 (evaluate evidence + notice absences)
6. **Moderate-hard** — Acts 3+5 (absences + group dynamics)
7. **Hard** — Acts 3+4 (absences + cross-turn contradictions)

Each entry includes the operator prompt, rationale, and design notes.

## Documentation

| Document | Purpose | When to read |
|----------|---------|-------------|
| `docs/design.md` | Complete design specification | Always — source of truth |
| `docs/implementation-pipeline.md` | Pipeline build plan (Phases 1-6.3 + 2 reviews) | When building or modifying the pipeline |
| `docs/scenario-sequence.md` | Operator prompts for the UMS pilot scenario sequence | When generating scenarios |
| `docs/difficulty-calibration.md` | How to tune flaw detectability and address student differences | When designing scenarios or facilitation |
| `docs/implementation-app.md` | App build plan and tech stack | When building the Perspectives app |
| `docs/uiux-app.md` | App UI/UX reference (lookup, not linear) | When building app screens/components |

## Tech Stack

- **Pipeline:** Claude Code commands, Python scripts (PyYAML), YAML schemas
- **App:** Next.js (App Router) + TypeScript + SQLite (Prisma) + Tailwind CSS

## Directory Structure

```
polylogue-4/
├── docs/                    # Design and implementation documents
├── configs/                 # Pipeline configuration
│   ├── reference/           # Flaw and behavior libraries + warm-up scenario
│   ├── system/              # initialize_polylogue command + sync script
│   ├── scenario/            # create_scenario command, learning scientist agent, schemas
│   ├── script/              # create_script command, dialog writer + instructional designer
│   │                        #   + pedagogical reviewer agents, schemas
│   ├── evaluation/          # evaluate_script command, evaluator agent, schemas
│   ├── app/                 # App-facing schemas
│   └── shared/              # Cross-cutting scripts (validate_schema.py)
├── registry/                # Generated pipeline outputs (one directory per scenario)
├── .claude/                 # Runtime commands and agents (synced from configs/)
└── CLAUDE.md                # Project conventions
```
