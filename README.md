# Polylogue 4

Polylogue 4 generates AI group discussions containing designed critical thinking flaws for 6th graders to practice evaluating. Built for the University Middle School (UMS) in Memphis as part of a PBL-integrated STEM curriculum.

The system has two parts: a **pipeline** that generates discussion scenarios using multiple AI agents, and **Perspectives**, a web app where students work through a structured evaluation activity.

---

## For Researchers

### What the system does

Polylogue 4 produces realistic AI-generated group discussions where specific argument flaws and thinking behaviors are embedded by design — not emergent. A teacher provides a topic and instructional goals; the pipeline produces a 12-16 turn discussion between 2-3 AI personas, with 1-3 targeted flaw-behavior combinations, plus annotations, quality assessments, and facilitation materials.

The core innovation is **plan-first flaw generation**: flaws are designed at the scenario planning stage, then executed through persona weaknesses and conversational steering — not by telling the AI "make a mistake here." This produces flaws that are analytically present and pedagogically detectable without being cartoonish.

### How a scenario is created: the multi-agent pipeline

The pipeline uses **five specialized AI agents**, each with a single role, arranged in a chain where each agent's output is checked by the next. This mirrors how human experts would collaborate — a curriculum designer, a screenwriter, an editor, a quality reviewer, and an evaluator.

```
create_scenario                          create_script                                    evaluate_script
┌──────────────────┐   ┌──────────────────────────────────────────────────────┐   ┌─────────────────┐
│                  │   │                                                      │   │                 │
│ Learning         │   │ Dialog       Review    Instructional   Pedagogical   │   │   Evaluator     │
│ Scientist        │   │ Writer   →  Script  →  Designer    →   Reviewer     │   │                 │
│                  │   │                                                      │   │                 │
│ Validates the    │   │ Generates    Structural  Polishes       Assesses     │   │ Annotates all   │
│ plan against     │   │ transcript   checks     language &     pedagogical   │   │ flaws, produces │
│ pedagogical      │   │ in a single  (turn      signal         effectiveness │   │ quality report  │
│ goals. Can a     │   │ pass — all   count,     moments for    for 6th      │   │ & facilitation  │
│ 6th grader       │   │ personas,    speakers,  6th-grade      graders.     │   │ guide with      │
│ detect these     │   │ all turns.   order).    readability.   Scores 1-5.  │   │ per-phase       │
│ flaws?           │   │              Script,    Sharpens,      Halts if     │   │ scaffolds.      │
│                  │   │              not LLM.   doesn't add.   score ≤ 3.   │   │                 │
└──────────────────┘   └──────────────────────────────────────────────────────┘   └─────────────────┘
```

**Why five agents, not one?** Each agent has constrained expertise and constrained information:

| Agent | What it knows | What it doesn't know | Why the separation matters |
|---|---|---|---|
| **Learning scientist** | The plan, the flaw taxonomy, 6th-grade capabilities | How the transcript will sound | Validates pedagogical design before any generation happens |
| **Dialog writer** | Persona characters, turn outline, what each turn should accomplish | Which flaws are being targeted, the flaw taxonomy, pedagogical goals | The **information barrier** — the writer steers toward flaws via natural character behavior, not by knowing the taxonomy. This produces natural-sounding flaws, not performed ones. |
| **Instructional designer** | The transcript, the full plan including target flaws | — | Sharpens signal moments for detectability. Can adjust *how* flaws are expressed but not *which* flaws are present. |
| **Pedagogical reviewer** | The polished transcript, the full plan | — | Quality gate: will this transcript actually teach 6th graders? Catches flat dynamics, cartoonish accumulation, invisible compromises. |
| **Evaluator** | The final transcript, the full plan, both reference libraries | — | Produces the artifacts students and teachers use: annotations, facilitation guide, scaffolds. |

The **information barrier** between the scenario plan and the dialog writer is the most important architectural decision. The plan specifies *which* flaws to target and *where*; the dialog writer never sees this. Instead, the plan's `accomplishes` field steers each turn in natural terms: "Share what you found from your one article and explain why you think it settles the question" — not "produce a big-claim-little-evidence flaw." The writer brings the persona to life; the flaw emerges from the persona's character, not from the writer's knowledge of the taxonomy.

### Quality controls

Three quality gates catch problems at different stages:

1. **Learning scientist** (pre-generation) — "Will this plan produce detectable flaws?" Checks flaw detectability, natural surfacing, language level, instructional goal alignment. Can flag plans as needing revision or rethinking.

2. **Pedagogical reviewer** (post-generation) — "Will this transcript teach effectively?" Scores 1-5 on flaw detectability, group dynamics, naturalism, discussion potential, signal variety. If score ≤ 3, halts with a revision strategy pointing to what needs to change upstream.

3. **Evaluator** (post-generation) — "Did the target flaws surface? Are they too subtle or too obvious?" Produces per-flaw quality assessment with recommendations (usable as-is, consider regeneration, needs new plan).

### What data the system produces

Each scenario generates research-valuable artifacts:

| Artifact | What it contains | Research value |
|---|---|---|
| `scenario.yaml` | Plan: personas, target flaws, turn outline | How flaws are designed — the "ground truth" |
| `script.yaml` | Final transcript with enumerated turns and sentences | The stimulus students respond to |
| `pedagogical_review.yaml` | Quality score (1-5), explanation, revision strategy | Pipeline quality metrics |
| `evaluation.yaml` | All flaw annotations, quality assessment, facilitation guide | AI's "answer key" (one perspective, not ground truth) |
| `evaluation_student.yaml` | Student-visible annotations only | What students see in Phase 4 |
| `cheat_sheet.md` | Printable facilitation reference | Teacher's in-class tool |

The app additionally produces per-student data: annotations (with timestamps, revision history, hint usage), reflection responses, and session activity logs. All stored in SQLite — queryable directly or exportable.

### How to operate the pipeline

```bash
# First-time setup
cp configs/system/commands/initialize_polylogue.md .claude/commands/
/initialize_polylogue

# Per scenario
/create_scenario    # Design the plan
/create_script      # Generate and assess the transcript
/evaluate_script    # Annotate and produce facilitation materials
```

See `docs/scenario-sequence.md` for a curated sequence of 7 scenarios with ready-to-use prompts, designed as a progressive curriculum from easy (Acts 1-2) to hard (Acts 4-5).

---

## For Teachers

### What Perspectives does

Perspectives presents AI-generated group discussions — conversations between fictional students working on a project — and guides your students through evaluating them. The discussions contain realistic problems in how the fictional students reason, and your students' job is to find them, explain why they happened, and discuss different perspectives with their peers.

### The four-phase activity

Each session is a single class period (~50 minutes) with four phases. You control when the class moves to each phase.

| Phase | What students do | Mode | Time |
|---|---|---|---|
| **Phase 1: Find problems** | Read the discussion and mark moments where something seems off — maybe someone didn't back up their claim, or the group missed something important | Individual | ~10 min |
| **Phase 2: Explain the thinking** | For each problem they found, think about *why* the person said it that way — what thinking habit led to the mistake | Individual | ~10 min |
| **Phase 3: Compare with peers** | See what their group found, talk about agreements and disagreements, revise their own thinking | Small group | ~15 min |
| **Phase 4: Evaluate the AI** | See what the AI noticed — not as the "right answer" but as one more perspective to agree or disagree with | Whole class | ~15 min |

### What you control

- **Session creation.** Pick a scenario, assign students to groups (4-5 per group), generate a session code.
- **Phase advancement.** You decide when the whole class moves to the next phase. The app shows you who's working, who's stuck, and who's submitted.
- **Scaffolding.** The cheat sheet tells you what flaws are in this discussion, where they are, what students should notice, and what to say if they're stuck. Ready-to-use prompts for each phase — you can read them aloud while circulating.
- **Lifeline count.** Students get a limited number of hints they can request (default 3 per scenario). You can adjust this per session — fewer for experienced students, more for a first session.

### What materials you get

For each scenario, the pipeline produces a **facilitation cheat sheet** — a one-page reference you can print or view on your device. It includes:

- **Timing** — recommended minutes per phase
- **What to expect** — which problems are in the discussion, where they appear, and how hard they are to spot
- **Phase 1 scaffolds** — "Re-read turns 5-8 with this question: How do they know that?"
- **Phase 2 scaffolds** — narrowed behavior options and empathy prompts ("Imagine you're Mia...")
- **Phase 4 scaffolds** — prompts for class discussion, including productive disagreement between student and AI perspectives

### What a class session looks like

1. **Before class:** Review the cheat sheet (2 minutes). Know which flaws are in the discussion and where.
2. **Start of class:** Students enter the session code on their devices and start reading.
3. **During Phase 1-2:** Circulate. The dashboard shows who's active, who hasn't started, annotation counts. Use cheat sheet scaffolds for students who are stuck.
4. **Phase 3 transition:** Advance the class. Students see peer annotations and discuss in groups. Listen for interesting disagreements to surface in Phase 4.
5. **Phase 4 transition:** Advance again. AI perspective revealed. Lead class discussion using the Phase 4 prompts from the cheat sheet.
6. **Wrap-up:** Optionally trigger the reflection step — students write one thing they noticed on re-reading and one thing they'll look for next time.

### The scenario sequence

The pilot uses 7 scenarios in a designed progression (see `docs/scenario-sequence.md`):

- **Sessions 1-3** (easy): Students learn to spot problems in what individuals *say* — factual errors, unsupported claims
- **Sessions 4-5** (moderate): Students learn to notice what's *missing* — practical details, affected people
- **Sessions 6-7** (hard): Students learn to evaluate how the *group* handles disagreement — dropped concerns, conclusions that outrun the evidence

Each session introduces new types of problems and new Memphis-connected topics (Wolf River Greenway, community gardens, park cleanups, plastic bag policy, school energy projects).

### Why this approach works

The discussions are generated by multiple AI agents that each have a specific job — one designs the plan, one writes the dialog, one polishes the language, one checks if it will actually work for 6th graders, and one produces your facilitation materials. No single AI sees everything — the AI that writes the dialog doesn't know which problems are being targeted, so the flaws come from the characters' personalities rather than being artificially placed. This produces discussions that sound like real students talking, with problems that are findable but not obvious.

---

## For Students

### What you'll do

You'll read discussions between AI students who are working on a project — kind of like listening to a group that's planning something for their school or community. Your job is to figure out what they got right and where their thinking went wrong.

**Phase 1:** Read the discussion and find moments where something seems off. Maybe someone made a big claim but didn't really prove it. Maybe they forgot to think about something important. Mark those moments and describe what you noticed.

**Phase 2:** For each problem you found, think about *why* the person said it that way. Were they only looking at things that agreed with them? Were they so excited they forgot to check? Pick the thinking habit that best explains it, and explain the connection.

**Phase 3:** See what your group found. Did they catch the same things you did? Did they find something you missed? Talk about it — you might change your mind, and that's a good thing.

**Phase 4:** See what the AI thinks. The AI found some problems too — but it's not the "right answer." You might agree with it, disagree, or think it missed something you caught. That's the whole point: there's more than one way to look at it.

### Why this matters

The skills you practice here — asking "how do they know that?", noticing what's missing, recognizing when someone just went along with the group — are the same skills you'll use in your own projects. When your PBL group is making a plan, you'll be better at catching problems before they become real mistakes.

### The tool helps you

- **Reading hints** tell you what kind of question to ask for each type of problem
- **Lifelines** give you hints if you're stuck — they narrow down where to look without telling you the answer
- **Your group** is your biggest resource — in Phase 3, you'll see what your peers found, and they'll see what you found

---

## Documentation

| Document | Purpose | When to read |
|----------|---------|-------------|
| `docs/design.md` | Complete design specification | Source of truth for what the system does and why |
| `docs/implementation-pipeline.md` | Pipeline build plan (Phases 1-6.3 + 2 reviews) | When building or modifying the pipeline |
| `docs/scenario-sequence.md` | Operator prompts for the 7-scenario pilot sequence | When generating scenarios |
| `docs/difficulty-calibration.md` | How to tune flaw detectability and address student differences | When designing scenarios or reviewing facilitation |
| `docs/implementation-app.md` | App build plan and tech stack | When building the Perspectives app |
| `docs/uiux-app.md` | App UI/UX reference (lookup, not linear) | When building app screens/components |

## Technical Details

- **Pipeline:** Claude Code slash commands, 5 AI subagents, Python scripts (PyYAML), YAML schemas
- **App:** Next.js (App Router) + TypeScript + SQLite (Prisma) + Tailwind CSS
- **Deployment:** Single Node.js process on university server, reverse-proxied with nginx

```
polylogue-4/
├── docs/                    # Design and implementation documents
├── configs/                 # Pipeline configuration (schemas, commands, agents, scripts)
│   ├── reference/           # Flaw and behavior libraries + warm-up scenario
│   ├── scenario/            # create_scenario command, learning scientist
│   ├── script/              # create_script command, dialog writer, instructional designer,
│   │                        #   pedagogical reviewer
│   ├── evaluation/          # evaluate_script command, evaluator
│   └── shared/              # Cross-cutting scripts (validate_schema.py)
├── registry/                # Generated pipeline outputs (one directory per scenario)
├── app/                     # Perspectives web app (Next.js)
└── .claude/                 # Runtime commands and agents (synced from configs/)
```
