# Polylogue 4 — Pipeline Implementation Plan

## Overview

This plan covers implementation of the Polylogue 4 pipeline: the system that generates AI group discussions with designed critical thinking flaws. It does not cover the Perspectives app (see `implementation-app.md`, to be written separately).

**Build order:** Schemas first, then subagent prompts and commands, then the first end-to-end scenario run, then formalized scripts. This follows the design document's stated sequence and ensures the most important architectural decisions are validated early.

**Structure:** 7 implementation phases and 2 review phases. Each implementation phase is scoped to one Claude Code working session. Review A catches schema issues before anything is built on them. Review B checks the full pipeline — technical integration, prompt quality, and pedagogical quality — against actual generated output.

**How reviews work:** Each review phase includes a review prompt. The operator runs this prompt with a separate agent, analyzes the feedback, and forwards relevant findings to the developing agent. The operator controls the gate — not every piece of feedback needs to become a revision.

---

## Phase Map

```
Phase 1 → Phase 2 → REVIEW A → Phase 3 → Phase 4 → Phase 5 ─┬─→ Phase 6 → REVIEW B
                                                              └─→ Phase 7 (parallel)
```

All phases are sequential except Phases 6 and 7, which can run in parallel after Phase 5.

---

## Phase 1: Foundation

**Objective:** Set up the directory structure, project configuration, and hand-authored reference libraries.

**Inputs:**
- Design doc: "Directory Structure" (line 952), "Reference Library Schemas" (lines 588-611), "Flaw Framework" (lines 46-191)

**Tasks:**
1. Create the full directory tree under `configs/`:
   ```
   configs/
   ├── reference/
   │   └── schemas/
   ├── system/
   │   ├── commands/
   │   └── scripts/
   ├── scenario/
   │   ├── schemas/
   │   ├── commands/
   │   ├── agents/
   │   └── scripts/
   ├── script/
   │   ├── schemas/
   │   ├── commands/
   │   ├── agents/
   │   └── scripts/
   ├── evaluation/
   │   ├── schemas/
   │   ├── commands/
   │   ├── agents/
   │   └── scripts/
   ├── app/
   │   └── schemas/
   └── shared/
       └── scripts/
   ```
   Also under `configs/reference/`:
   ```
   configs/reference/
   └── warmup/              # Hand-crafted onboarding micro-scenario (Phase 7)
   ```
2. Create `registry/` directory
3. Write `CLAUDE.md` at repo root with project conventions
4. Write `configs/reference/detection_act_library.yaml` — all 19 argument flaw patterns organized by 5 detection acts, with canonical IDs, plain-language names, and descriptions
5. Write `configs/reference/thinking_behavior_library.yaml` — all 8 thinking behaviors with canonical IDs, plain-language names, descriptions, and formal terms

**Outputs:**
- Directory tree matching design doc
- `CLAUDE.md`
- `configs/reference/detection_act_library.yaml`
- `configs/reference/thinking_behavior_library.yaml`

**Notes:**
- Canonical IDs established here propagate into every schema, prompt, and script. Use the exact names from the design doc tables (e.g., `"big claim, little evidence"`, `"confirmation bias"`).
- Detection act IDs use snake_case: `somethings_wrong`, `not_enough_support`, `somethings_missing`, `doesnt_fit_together`, `not_really_resolved`.
- Reference libraries are data files (actual content the app renders and subagents reference), not schema definitions.

---

## Phase 2: Schemas

**Objective:** Author all 11 YAML schema definitions governing every pipeline handoff.

**Inputs:**
- Design doc: "Schema Inventory" (line 496), output format blocks for scenario plan (line 308), transcript (line 401), evaluation (line 430), student annotations (line 653), session configuration (line 680)
- Reference libraries from Phase 1 (for canonical IDs)

**Tasks:**

Write 11 schema files:

| # | Schema | Location | Source in design doc |
|---|--------|----------|---------------------|
| 1 | Detection act library (structure) | `configs/reference/schemas/detection_act_library.yaml` | Lines 593-600 |
| 2 | Thinking behavior library (structure) | `configs/reference/schemas/thinking_behavior_library.yaml` | Lines 606-611 |
| 3 | Scenario plan | `configs/scenario/schemas/scenario_plan.yaml` | Lines 308-332 |
| 4 | Learning scientist validation | `configs/scenario/schemas/learning_scientist_validation.yaml` | Implied by lines 298-303 |
| 5 | Discussion transcript (post-enumeration) | `configs/script/schemas/discussion_transcript.yaml` | Lines 401-415 |
| 6 | Discussion transcript (pre-enumeration) | `configs/script/schemas/discussion_transcript_pre.yaml` | Line 391 |
| 7 | Evaluation (full) | `configs/evaluation/schemas/evaluation_full.yaml` | Lines 430-482 |
| 8 | Evaluation (student-facing) | `configs/evaluation/schemas/evaluation_student.yaml` | Lines 631, 634-646 |
| 9 | Session configuration | `configs/app/schemas/session_configuration.yaml` | Lines 681-699 (includes `student_activity` block for teacher monitoring) |
| 10 | Student annotations | `configs/app/schemas/student_annotations.yaml` | Lines 653-675 |
| 11 | Dialog writer input | `configs/script/schemas/dialog_writer_input.yaml` | Lines 344-349 |

**Outputs:**
- 11 schema files in their respective `configs/*/schemas/` directories

**Notes:**
- Schema #6 (pre-enumeration transcript) is implicit in the design doc: "same structure as the final transcript schema but without `id` fields on sentences; turns are ordered but unnumbered" (line 391). Must be made explicit.
- Schema #11 (dialog writer input) captures the scenario plan minus `target_flaws` — the plan the dialog writer actually sees. Persona definitions, turn outline (speaker + accomplishes), discussion_arc. No target_flaws, no flaw pattern names, no thinking behavior names. Making this a schema prevents accidental information leakage.
- Schemas are descriptive YAML (field name, type, required/optional, description, constraints) — human-readable contracts first, machine-validatable second.

---

## REVIEW A: Schema + Reference Library Review

**Why here:** Schemas are the single source of truth for every subsequent artifact. A canonical ID mismatch or missing field propagates into subagent prompts, scripts, and generated content. This is the highest-leverage review point.

**Files to review:**
- `configs/reference/detection_act_library.yaml`
- `configs/reference/thinking_behavior_library.yaml`
- All files in `configs/*/schemas/`

**Review prompt:**

```
You are reviewing the schemas and reference libraries for Polylogue 4, an educational
AI system. The design specification is at docs/design.md. Check the following criteria
and report findings as PASS, ISSUE (with explanation), or SUGGESTION (non-blocking).

FILES TO REVIEW:
- configs/reference/detection_act_library.yaml
- configs/reference/thinking_behavior_library.yaml
- All .yaml files in configs/reference/schemas/, configs/scenario/schemas/,
  configs/script/schemas/, configs/evaluation/schemas/, configs/app/schemas/

CRITERIA:

1. CANONICAL ID CONSISTENCY
   The 19 argument flaw pattern IDs and 8 thinking behavior IDs must match exactly
   between the reference libraries and every schema that references them. Check:
   - scenario_plan.yaml (flaw_pattern, thinking_behavior fields)
   - evaluation_full.yaml (pattern fields in annotations)
   - evaluation_student.yaml
   - student_annotations.yaml (detection_act, thinking_behavior fields)
   List any mismatches.

2. DETECTION ACT ID CONSISTENCY
   The 5 detection act IDs must match between the detection act library and the
   detection_act fields in evaluation and student annotation schemas. List any
   mismatches.

3. FIELD COMPLETENESS
   Every field in the design doc output format blocks must appear in the corresponding
   schema. Check:
   - Scenario plan: design doc lines 308-332
   - Discussion transcript: design doc lines 401-415
   - Evaluation full: design doc lines 430-482
   - Student annotations: design doc lines 653-675
   - Session configuration: design doc lines 680-699
   Flag any fields present in the design doc but missing from schemas, or present
   in schemas but absent from the design doc (and whether the addition is justified).

4. EVALUATION SPLIT CORRECTNESS
   evaluation_student.yaml must contain ONLY the fields listed in the "Phase 4
   student-visible fields" table (design doc line 634). Specifically:
   - MUST include: argument_flaw (pattern, detection_act, explanation),
     thinking_behavior (pattern, explanation), location
   - MUST NOT include: planned, plausible_alternatives, quality_assessment,
     facilitation_guide
5. PRE-ENUMERATION VS POST-ENUMERATION
   discussion_transcript_pre.yaml must match discussion_transcript.yaml except:
   - No id fields on sentences
   - No turn_id fields on turns
   Confirm the difference is clear and correct.

6. DIALOG WRITER INPUT SCHEMA
   dialog_writer_input.yaml must include ONLY: persona definitions (all fields),
   turn outline (speaker + accomplishes only), discussion_arc, style guidance.
   Must NOT include: target_flaws, flaw pattern names, thinking behavior
   names, detection act labels. This is the information barrier.

7. REFERENCE LIBRARY COMPLETENESS
   detection_act_library.yaml must contain all 19 patterns across 5 acts:
   - Act 1 (3): factual error, misapplied idea, wrong cause
   - Act 2 (5): big claim little evidence, one example as proof, correlation as
     causation, weak source strong claim, guess treated as fact
   - Act 3 (4): missing practical details, missing people, missing downsides,
     missing conditions
   - Act 4 (3): conclusion exceeds evidence, parts contradict, solution doesn't
     match problem
   - Act 5 (4): abandoned concern, fake agreement, steamrolled, harmony over accuracy
   thinking_behavior_library.yaml must contain all 8 behaviors.
   All plain-language names and descriptions must be in 6th-grade language.

Report each criterion as PASS or ISSUE. For ISSUEs, quote the specific file and
field causing the problem. End with an overall assessment: READY TO PROCEED or
NEEDS REVISION (with prioritized list of what to fix).
```

---

## Phase 3: Subagent Prompts

**Objective:** Write the 4 subagent prompt definitions.

**Inputs:**
- Design doc: subagent descriptions (line 255), process descriptions for create_scenario (lines 288-332), create_script (lines 336-397), evaluate_script (lines 419-486), signal moments (lines 196-232), `accomplishes` field examples (lines 371-389)
- Schemas from Phase 2 (each subagent's prompt references its output schema)
- Reference libraries from Phase 1

**Tasks:**

| # | Subagent | File | Key challenge |
|---|----------|------|---------------|
| 1 | Learning scientist | `configs/scenario/agents/learning_scientist.md` | Must check flaw detectability for 6th graders, not just pedagogical soundness in the abstract |
| 2 | Dialog writer | `configs/script/agents/dialog_writer.md` | Must steer toward flaws via `accomplishes` fields without seeing flaw names; must produce distinct persona voices; must calibrate signal moments |
| 3 | Instructional designer | `configs/script/agents/instructional_designer.md` | Must sharpen expression without adding/removing flaws; must enforce 6th-grade language |
| 4 | Evaluator | `configs/evaluation/agents/evaluator.md` | Must produce annotations + quality assessment + facilitation guide in a single pass |

**Outputs:**
- 4 subagent prompt files in their respective `configs/*/agents/` directories

**Notes:**
- The dialog writer prompt is the highest-risk artifact. It must include:
  - Signal moment principles (overconfident language, concrete absence, proximity, explicit capitulation)
  - Style guidance for natural 6th-grade language and distinct persona voices
  - Explicit instruction that it receives a scenario plan and must write all turns in sequence
  - The pre-enumeration transcript schema as its output format
  - No reference to flaws, biases, or pedagogical goals
- **Weaknesses field and the information barrier.** The dialog writer sees persona weaknesses ("what they'll get wrong and why"), which is part of the scenario plan schema. Weaknesses inherently reference what goes wrong — this is intentional (the writer needs to know the persona's limitations to write authentically). But weaknesses must be phrased as knowledge gaps or perspectives in natural terms (e.g., "only researched one source, tends to generalize from limited data"), NOT as flaw labels (e.g., "will produce a big-claim-little-evidence flaw"). The information barrier applies to flaw taxonomy names and pedagogical intent, not to the persona's character. The `create_scenario` command is responsible for writing weaknesses in natural language; the dialog writer prompt should treat them as character traits, not flaw instructions.
- Each subagent prompt includes its output schema inline or by reference.
- The evaluator produces everything in one pass: annotations with plausible_alternatives, quality_assessment, and the facilitation_guide (timing, what_to_expect, and scaffolds for phases 1, 2, and 4 — Phase 3 scaffolds are generic and hardcoded in the app/cheat sheet template).

---

## Phase 4: Slash Commands

**Objective:** Write the 4 slash command definitions that orchestrate the pipeline.

**Inputs:**
- Design doc: command table (line 248), process descriptions for each command
- Subagent prompts from Phase 3
- Schemas from Phase 2
- Script inventory from design doc (line 548) — commands reference scripts but handle their absence for early runs

**Tasks:**

| # | Command | File | Orchestration logic |
|---|---------|------|-------------------|
| 1 | initialize_polylogue | `configs/system/commands/initialize_polylogue.md` | Copy configs to .claude/, verify structure |
| 2 | create_scenario | `configs/scenario/commands/create_scenario.md` | Draft plan → learning scientist validation → revise → output |
| 3 | create_script | `configs/script/commands/create_script.md` | Dialog writer → structural review → instructional designer → enumeration |
| 4 | evaluate_script | `configs/evaluation/commands/evaluate_script.md` | Evaluator → export split |

**Outputs:**
- 4 command files in their respective `configs/*/commands/` directories

**Notes:**
- `create_script` is the most complex command. It must:
  - Strip `target_flaws` from the scenario plan before passing to the dialog writer
  - Run structural checks (review_transcript.py or manual) after dialog writer output
  - Implement discard-and-regenerate (max 3 attempts)
  - Pass the raw transcript + full plan to the instructional designer
  - Apply enumeration (enumerate_turns.py or manual) after polish
- Commands should include manual fallback instructions for when scripts are not yet available: "If `review_transcript.py` is not available, verify manually: turn count within 12-16, speaker names match plan, turn order follows plan."
- `create_scenario` should create the registry directory inline (`mkdir -p registry/{scenario_id}`).

---

## Phase 5: First End-to-End Scenario Run

**Objective:** Run the full pipeline for one scenario to validate every architectural decision.

**Inputs:**
- All artifacts from Phases 1-4
- PBL reference: `references/PBL/6th Grade STEM (Fall 2025).txt` — driving question: "What are the major threats affecting our global environment, and what can our communities do to protect our ecosystems?"

**Tasks:**
1. Run `initialize_polylogue` to copy commands and agents to `.claude/`
2. Choose a specific topic derived from the 6th-grade PBL unit (e.g., a group researching ocean pollution and proposing a school awareness campaign)
3. Run `create_scenario` with:
   - The chosen topic and context
   - 1-2 instructional goals
   - Target: 2 personas, 1-2 flaw-behavior combinations (minimal complexity)
4. Run `create_script` to generate the transcript
   - Manual structural verification if `review_transcript.py` is not available
   - Manual enumeration if `enumerate_turns.py` is not available
5. Run `evaluate_script` to produce annotations and facilitation guide
   - Manual evaluation split if `export_for_app.py` is not available
6. Document all issues encountered: schema violations, prompt failures, quality problems, manual interventions needed

**Outputs:**
- `registry/{scenario_id}/scenario.yaml`
- `registry/{scenario_id}/script.yaml`
- `registry/{scenario_id}/evaluation.yaml`
- `registry/{scenario_id}/evaluation_student.yaml`
- `registry/{scenario_id}/cheat_sheet.md`
- Issue log documenting all manual interventions and problems

**Notes:**
- Start with 1-2 target flaws, not 3. This isolates whether the `accomplishes` field approach works before adding complexity.
- Document every manual operation — this directly informs script formalization in Phase 6.
- If the dialog writer produces a transcript where target flaws don't surface, this indicates a prompt quality problem (return to Phase 3 for revision), not a generation problem.

---

## Phase 6: Python Scripts

**Objective:** Formalize all 5 deterministic scripts, informed by the manual operations in Phase 5.

**Inputs:**
- Design doc: script inventory (line 548), script design rules (line 557)
- Schemas from Phase 2
- Issue log from Phase 5 (what manual operations were needed)

**Tasks:**

| # | Script | Location | What it does |
|---|--------|----------|-------------|
| 1 | `validate_schema.py` | `configs/shared/scripts/` | Validates any YAML artifact against its schema. Two modes: strict (halt) and warn (log, continue) |
| 2 | `review_transcript.py` | `configs/script/scripts/` | Structural checks: turn count 12-16, speaker names match plan, turn order follows plan, all turns present |
| 3 | `enumerate_turns.py` | `configs/script/scripts/` | Assigns sequential IDs (turn_01, turn_01.s01, ...) to pre-enumeration transcript |
| 4 | `sync_configs.py` | `configs/system/scripts/` | Copies commands/agents from configs/ to .claude/, verifies reference libraries |
| 5 | `export_for_app.py` | `configs/evaluation/scripts/` | Extracts student-facing annotations into `evaluation_student.yaml` + renders cheat sheet markdown |

**Outputs:**
- 5 Python scripts in their respective `configs/*/scripts/` directories
- Unit tests for each script

**Notes:**
- Pure Python with PyYAML as the only external dependency.
- Scripts accept file paths as arguments — no hardcoded paths.
- `validate_schema.py` is the most complex: it must parse descriptive YAML schemas and check types, required fields, and constraints. Define the schema interpretation format clearly.
- Each script validates its own output against the relevant schema before writing.
- MVP starts in warn mode; strict mode is enabled once schemas stabilize.

---

## REVIEW B: Full Pipeline Integration Review

**Why here:** The entire pipeline is now formalized and has produced real output. This review checks technical integration, prompt/command quality, and pedagogical quality — all against actual generated artifacts rather than prompts in isolation.

**Files to review:**
- All 5 scripts in `configs/*/scripts/`
- All subagent prompts in `configs/*/agents/`
- All commands in `configs/*/commands/`
- The first scenario's outputs in `registry/{scenario_id}/`
- All schemas in `configs/*/schemas/`

**Review prompt:**

```
You are performing a full integration review of the Polylogue 4 pipeline. Review
technical integration, prompt/command quality, and pedagogical quality — all checked
against actual generated output. The design specification is at docs/design.md.

PART 1: TECHNICAL INTEGRATION

Files: All scripts in configs/*/scripts/, all schemas in configs/*/schemas/, and the
first scenario outputs in registry/{scenario_id}/.

1. SCHEMA VALIDATION
   Run validate_schema.py against every artifact in the registry directory.
   Do all artifacts conform to their schemas? List any violations.

2. SCRIPT-COMMAND INTEGRATION
   Read create_script.md and verify it calls review_transcript.py and enumerate_turns.py
   in the correct order: dialog writer → review_transcript.py → instructional designer
   → enumerate_turns.py.
   Read evaluate_script.md and verify it calls export_for_app.py.
   Are the script invocations correct (arguments, file paths, error handling)?

3. ENUMERATION CORRECTNESS
   In the scenario's script.yaml:
   - Are turn IDs sequential (turn_01, turn_02, ...)?
   - Are sentence IDs sequential within each turn (turn_01.s01, turn_01.s02, ...)?
   In evaluation.yaml:
   - Do annotation locations reference valid sentence IDs that exist in script.yaml?

4. EVALUATION SPLIT CORRECTNESS
   Compare evaluation_student.yaml against evaluation.yaml:
   - Does it contain ONLY student-visible fields (location, argument_flaw
     pattern/detection_act/explanation, thinking_behavior pattern/explanation)?
   - Does it exclude planned, plausible_alternatives, quality_assessment,
     facilitation_guide?
   Does cheat_sheet.md render correctly and match the example format in the design doc
   (lines 867-902)?

5. DISCARD-AND-REGENERATE LOGIC
   Review the Phase 5 issue log: did create_script handle any structural failures?
   If so, did it correctly discard and retry (max 3 attempts)?
   If not, verify the logic is present in create_script.md for when it's needed.

PART 2: PROMPT AND COMMAND QUALITY (checked against actual output)

Files: configs/*/agents/*.md, configs/*/commands/*.md, and the first scenario's
outputs in registry/{scenario_id}/.

6. INFORMATION BARRIER
   Read the generated transcript (script.yaml). Does the dialog show signs of the
   writer "knowing" the flaw taxonomy? Look for:
   - Unnaturally precise flaw placement that reads as performed rather than natural
   - Taxonomic or analytical language in persona dialog (e.g., "that's a correlation
     not causation" spoken by a 6th grader)
   - Flaws that feel scripted rather than emerging from the persona's character
   Also verify: does create_script.md strip target_flaws before invoking the dialog
   writer? Does the dialog_writer_input.yaml schema exclude target_flaws?

7. INSTRUCTIONAL DESIGNER BOUNDARIES
   If available, compare the pre-polish and post-polish transcripts. Did the
   instructional designer only sharpen expression (phrasing, signal strength,
   language level), or did it add/remove/relocate flaws? If pre-polish is not
   available, check the instructional designer prompt for explicit boundary language.

8. ACCOMPLISHES FIELD EFFECTIVENESS
   Compare scenario.yaml's accomplishes fields with what the dialog writer produced
   in script.yaml. For each flaw-surfacing turn:
   - Did the accomplishes field steer the dialog writer successfully?
   - Where did steering succeed? Where did it fail?

PART 3: PEDAGOGICAL QUALITY

Files: registry/{scenario_id}/scenario.yaml, script.yaml, evaluation.yaml,
cheat_sheet.md

9. FLAW DETECTABILITY
   Read the transcript (script.yaml) as a 6th grader would. For each target flaw:
   - Can you identify the signal moment?
   - Rate: "most students would catch this" / "attentive students would catch this" /
     "too subtle for 6th graders" / "too cartoonish"
   If any flaw is rated "too subtle" or "too cartoonish," explain why and suggest
   a calibration direction.

10. LANGUAGE LEVEL
    Is the transcript language appropriate for 6th graders? Flag any:
    - Vocabulary above grade level
    - Sentence structures that are too complex
    - Concepts requiring specialized knowledge a 6th grader wouldn't have

11. PERSONA VOICE
    Do the personas sound like different people? Check:
    - Do they have distinct speech patterns?
    - Do their perspectives come through in what they say?
    - Or do they blur into a single generic voice?

12. ANNOTATION QUALITY
    Are the evaluator's annotations (evaluation.yaml) in 6th-grade language?
    Are explanations framed as perspectives, not answers?
    Are plausible_alternatives genuinely defensible, not filler?

13. FACILITATION GUIDE USABILITY
    Read the cheat sheet. Could a teacher:
    - Scan it in 2 minutes before class?
    - Find the right scaffold while circulating among groups?
    - Use the Phase 1 and Phase 2 prompts as written, without modification?
    Are the timing estimates realistic for a 50-minute period?

14. SIGNAL MOMENT CALIBRATION
    For each signal moment in the transcript, check against design doc principles
    (lines 200-227):
    - Is overconfident language used for evidence-based flaws?
    - Are missing elements concrete (not abstract)?
    - Are contradictions proximate (close together, not transcript-spanning)?
    - Does capitulation use visible language?

Report each criterion as PASS or ISSUE. For ISSUEs, provide specific quotes from the
artifacts. End with READY TO PROCEED or NEEDS REVISION (prioritized).
```

---

## Phase 7: Warm-Up Micro-Scenario

**Objective:** Hand-craft the onboarding micro-scenario used to teach the four-phase workflow.

**Inputs:**
- Design doc: "First-Session Onboarding" (lines 723-729)
- All schemas from Phase 2
- Reference libraries from Phase 1
- First scenario outputs from Phase 5 (quality reference)

**Tasks:**
1. Choose a universal topic (e.g., whether the school should switch to a four-day week) — no domain knowledge required
2. Hand-write scenario plan: 2 personas, 1 target flaw (Act 2: "big claim, little evidence" + confirmation bias)
3. Hand-write transcript: 5-6 turns with one obvious signal moment (stronger than a real scenario — the point is teaching the workflow)
4. Hand-write evaluation: annotations, quality assessment, facilitation guide tailored to the walkthrough context
5. Run `export_for_app.py` to produce student-facing extract and cheat sheet
6. Validate all artifacts against schemas with `validate_schema.py`

**Outputs:**
- `configs/reference/warmup/scenario.yaml`
- `configs/reference/warmup/script.yaml`
- `configs/reference/warmup/evaluation.yaml`
- `configs/reference/warmup/evaluation_student.yaml`
- `configs/reference/warmup/cheat_sheet.md`

**Notes:**
- The flaw should be intentionally easy — "big claim, little evidence" with confirmation bias is the most intuitive combination for first exposure.
- The signal moment should be stronger than in real scenarios. Example: a persona says "the research proves it works" immediately after mentioning they read one blog post.
- All artifacts must conform to the same schemas as pipeline-produced scenarios. The app handles one format, not two.
- This is a hand-crafted artifact, not a pipeline product. It is written once and reused for every new class.

---

## Summary

| Phase | What | Depends on | Key risk mitigated |
|-------|------|------------|-------------------|
| 1 | Foundation | — | Canonical ID establishment |
| 2 | Schemas | Phase 1 | Handoff contract definitions |
| **REVIEW A** | **Schema review** | **Phase 2** | **ID mismatches, missing fields, evaluation split errors** |
| 3 | Subagent prompts | Review A | Dialog writer steering, signal moment guidance |
| 4 | Slash commands | Phase 3 | Orchestration logic, information barrier |
| 5 | First scenario | Phase 4 | End-to-end architectural validation |
| 6 | Python scripts | Phase 5 | Script formalization from manual experience |
| **REVIEW B** | **Full integration review** | **Phase 6** | **Technical integration + prompt/command quality + pedagogical quality** |
| 7 | Warm-up scenario | Phase 5 | Onboarding artifact for first classroom use |
