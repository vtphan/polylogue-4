# Polylogue 4 — Pipeline Implementation Plan

## Overview

This plan covers implementation of the Polylogue 4 pipeline: the system that generates AI group discussions with designed critical thinking flaws. It does not cover the Perspectives app (see `implementation-app.md`, to be written separately).

**Build order:** Schemas first, then subagent prompts and commands, then the first end-to-end scenario run, then formalized scripts. This follows the design document's stated sequence and ensures the most important architectural decisions are validated early.

**Structure:** 6 implementation phases (plus 3 refinement phases: 6.1, 6.2, 6.3) and 2 review phases. Each implementation phase is scoped to one Claude Code working session. Review A catches schema issues before anything is built on them. Review B checks the full pipeline — technical integration, prompt quality, and pedagogical quality — against actual generated output. Phases 6.1-6.3 address findings from Review B and subsequent pedagogical analysis. Scenario generation is a separate operator activity documented in `docs/scenario-sequence.md`.

**How reviews work:** Each review phase includes a review prompt. The operator runs this prompt with a separate agent, analyzes the feedback, and forwards relevant findings to the developing agent. The operator controls the gate — not every piece of feedback needs to become a revision.

---

## Phase Map

```
Phase 1 → Phase 2 → REVIEW A → Phase 3 → Phase 4 → Phase 5 → Phase 6 → REVIEW B → Phase 6.1 → Phase 6.2 → Phase 6.3
```

All phases are sequential. Phase 6.1 follows Review B and addresses findings from both the internal review and an external pedagogical review of the first scenario. Phase 6.2 generates a second scenario under the revised guidance and compares it against the first. Phase 6.3 introduces the pedagogical reviewer subagent, refines Act 5 expression guidance in three existing prompts, and validates by regenerating the second scenario's transcript. After Phase 6.3, the pipeline is complete — scenario generation is an operator activity guided by `docs/scenario-sequence.md`.

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
- Canonical IDs established here propagate into every schema, prompt, and script. All canonical IDs use snake_case (e.g., `big_claim_little_evidence`, `confirmation_bias`, `not_enough_support`).
- Detection act IDs: `somethings_wrong`, `not_enough_support`, `somethings_missing`, `doesnt_fit_together`, `not_really_resolved`.
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
| 10 | Student annotations | `configs/app/schemas/student_annotations.yaml` | Lines 653-675 (includes `behavior_own_words` for free-text thinking behavior descriptions) |
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
   - Act 1 (3): factual_error, misapplied_idea, wrong_cause
   - Act 2 (5): big_claim_little_evidence, one_example_as_proof, correlation_as_causation,
     weak_source_strong_claim, guess_treated_as_fact
   - Act 3 (4): missing_practical_details, missing_people, missing_downsides,
     missing_conditions
   - Act 4 (3): conclusion_exceeds_evidence, parts_contradict, solution_doesnt_match_problem
   - Act 5 (4): abandoned_concern, fake_agreement, steamrolled, harmony_over_accuracy
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
| 3 | Instructional designer | `configs/script/agents/instructional_designer.md` | Receives full scenario plan (including `target_flaws`) and pre-enumeration transcript. No information barrier — needs flaw locations to calibrate signal moments. Must sharpen expression without adding/removing flaws; must enforce 6th-grade language; must flag completely absent target flaws (early signal before evaluate_script) |
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
| 1 | initialize_polylogue | `configs/system/commands/initialize_polylogue.md` | Copy commands to `.claude/commands/`, agents to `.claude/agents/`, verify structure |
| 2 | create_scenario | `configs/scenario/commands/create_scenario.md` | Draft plan → learning scientist validation → revise → output |
| 3 | create_script | `configs/script/commands/create_script.md` | Dialog writer → structural review → instructional designer → enumeration |
| 4 | evaluate_script | `configs/evaluation/commands/evaluate_script.md` | Evaluator → export split |

**Outputs:**
- 4 command files in their respective `configs/*/commands/` directories

**Notes:**
- `create_script` is the most complex command. It must:
  - Strip `target_flaws` from the scenario plan before passing to the dialog writer
  - Run structural checks (review_transcript.py or manual) after dialog writer output
  - Implement discard-and-regenerate (max 3 attempts). Each retry is a clean invocation with identical input — no feedback from the failed attempt is passed to the dialog writer. If the plan consistently produces structural failures across 3 attempts, the plan is the problem.
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
1. Run `initialize_polylogue` to copy commands to `.claude/commands/` and agents to `.claude/agents/`
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
- Produce the cheat sheet manually following the example format in the design doc (lines 866-900). This manual version directly informs the template that `export_for_app.py` will use in Phase 6.
- If the dialog writer produces a transcript where target flaws don't surface, this indicates a prompt quality problem (return to Phase 3 for revision), not a generation problem.
- Save all intermediate artifacts (pre-enumeration transcript, manual cheat sheet, any manual evaluation split) alongside the final outputs. These serve as test fixtures for Phase 6 script unit tests.

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
| 4 | `sync_configs.py` | `configs/system/scripts/` | Copies commands from `configs/*/commands/` to `.claude/commands/`, agents from `configs/*/agents/` to `.claude/agents/`, verifies reference libraries |
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

## Phase 6.1: Review B Fixes and Scenario Plan Guidance

**Objective:** Address findings from the internal Review B and an external pedagogical review of the first scenario (ocean_plastic_campaign). Two technical fixes and four guidance additions to `create_scenario`.

**Inputs:**
- Review B results (`docs/Review_B_results.md`) — 2 technical issues
- External reviewer analysis (`docs/Review_B_response.md`) — 3 observations about flat group dynamics, 3 proposals (A, B, C) plus one extension (C+)
- First scenario outputs in `registry/ocean_plastic_campaign/`

**Why a separate phase:** Review B was designed to catch technical integration and prompt quality issues. It succeeded at that — 12 of 14 criteria passed, and the 2 issues found were straightforward. But an external pedagogical review identified a higher-level problem: the first scenario's discussion dynamics are flat (no persona disagreement, one-directional flaw detection, cartoonish accumulation of omission). These issues originate in the `create_scenario` command's guidance, not in the pipeline's mechanics. Phase 6.1 addresses both the technical fixes and the guidance gap.

**Tasks:**

1. **Fix `evaluate_script.md` Step 4** — Add `--detection-act-library` and `--thinking-behavior-library` flags to the `export_for_app.py` invocation so the cheat sheet uses plain-language flaw names instead of canonical IDs.

2. **Fix `evaluation.yaml` and `evaluation_student.yaml` ann_05** — Add `turn_08.s01` to the sentences list so the `abandoned_concern` annotation captures both the concern being raised (turn 6) and abandoned (turn 8).

3. **Add persona conflict guidance to `create_scenario.md`** (Proposal A) — Persona perspectives must pull in different directions, not just represent different motivations toward the same conclusion. Agreement-only discussions are a quality problem.

4. **Add flaw-type diversity guidance to `create_scenario.md`** (Proposal B) — When targeting 2+ flaws, prefer mixing individual flaws (Acts 1-3) with interaction flaws (Acts 4-5). Two individual flaws produce discussions where students evaluate speakers in isolation; interaction flaws force students to evaluate the group's reasoning process.

5. **Add turn outline anti-pattern guidance to `create_scenario.md`** (Proposals C and C+) — Warn against:
   - 4+ consecutive turns of unchecked agreement or enthusiasm
   - Omission flaws (Act 3) where the missing thing is never briefly acknowledged — at least one persona should surface the concern before being redirected
   - Evidence claims that go completely unchallenged — at least one persona should show brief skepticism before being won over

6. **Update `create_scenario.md` quality checklist** — Add 4 new items reflecting the guidance: persona tension, flaw-type diversity, no unchecked agreement runs, omission/evidence anti-patterns.

7. **Sync updated commands to `.claude/commands/`**.

**Outputs:**
- Updated `configs/evaluation/commands/evaluate_script.md`
- Updated `registry/ocean_plastic_campaign/evaluation.yaml` and `evaluation_student.yaml`
- Updated `configs/scenario/commands/create_scenario.md`
- Updated `.claude/commands/` (synced)

**Notes:**
- The first scenario (ocean_plastic_campaign) is not regenerated. It served its purpose — proving the pipeline's mechanics work. The guidance additions ensure future scenarios avoid the same flatness.
- The guidance additions are prose, not new parameters or branching logic. They keep the command simple while encoding lessons learned.
- The external reviewer's analysis, the response, and the Review B results are preserved as historical records in `docs/`.

---

## Phase 6.2: Second Scenario — Guidance Validation

**Objective:** Generate a second scenario under the revised `create_scenario` guidance and compare it against the first scenario (ocean_plastic_campaign) on the specific dimensions that were identified as weaknesses.

**Inputs:**
- Updated `create_scenario` command (with persona conflict, flaw-type diversity, and anti-pattern guidance from Phase 6.1)
- All pipeline artifacts from Phases 1-6
- PBL reference: `references/PBL/6th Grade STEM (Fall 2025).txt` — same unit, different topic
- First scenario outputs in `registry/ocean_plastic_campaign/` (comparison baseline)

**Constraints on scenario design:**

These constraints exist to isolate whether the guidance changes fix the problems the external reviewer identified. They are specific to this validation phase, not general rules.

1. **Must include an interaction flaw (Act 4 or Act 5).** The first scenario used only Acts 2-3 (individual flaws). The second must mix an individual flaw with an interaction flaw — e.g., `missing_downsides` + `fake_agreement`, or `big_claim_little_evidence` + `abandoned_concern`. This tests Proposal B (flaw-type diversity).

2. **Personas must disagree about something substantive.** Not just different areas of focus — different positions on a decision, tradeoff, or interpretation. The scenario plan should make clear what the personas disagree about. This tests Proposal A (persona conflict).

3. **Same PBL unit, different topic.** Stay within the 6th-grade STEM environmental threats unit for consistency. Choose a different environmental issue so the comparison isolates the guidance changes, not the subject matter.

4. **2 personas, 2 target flaws.** Same complexity as the first scenario so the comparison is apples-to-apples.

**Tasks:**

1. Run `create_scenario` with a topic from the PBL unit, following the updated guidance. Verify the scenario plan satisfies the constraints above and passes all new quality checklist items.
2. Run `create_script` to generate the transcript.
3. Run `evaluate_script` to produce annotations and facilitation guide.
4. Run all validation scripts (`validate_schema.py`, `review_transcript.py`) against the outputs.
5. Produce the comparison analysis (see below).

**Outputs:**
- `registry/{scenario_id}/scenario.yaml`
- `registry/{scenario_id}/script.yaml`
- `registry/{scenario_id}/script_pre.yaml`
- `registry/{scenario_id}/script_raw.yaml`
- `registry/{scenario_id}/evaluation.yaml`
- `registry/{scenario_id}/evaluation_student.yaml`
- `registry/{scenario_id}/cheat_sheet.md`
- Comparison analysis (inline in the session or saved to `docs/`)

**Comparison criteria:**

Evaluate the second scenario against the first on the three dimensions the external reviewer flagged:

| Dimension | ocean_plastic_campaign (baseline) | Second scenario (expected improvement) |
|-----------|----------------------------------|---------------------------------------|
| **Persona disagreement** | Mia and Jaylen agree for 12 turns. Only tension is turn 6's mild question, dropped immediately. | Personas should disagree on at least one substantive point. Multiple turns should show genuine back-and-forth, not just enthusiasm in the same direction. |
| **Flaw detection directionality** | Both flaws are individual (Acts 2-3). Students can find them by reading each persona's turns in isolation. | At least one flaw requires tracking cross-turn dynamics — how the group resolves (or fails to resolve) a disagreement. Students must read the interaction, not just the individuals. |
| **Naturalism of omission/evidence flaws** | missing_practical_details surfaces as 4 consecutive turns of unchecked enthusiasm with zero logistics. big_claim_little_evidence goes essentially unchallenged. | Omission and evidence flaws should use contrast — at least one persona briefly surfaces a concern or shows skepticism before being redirected. The flaw is visible through what the group does with the concern, not through its total absence. |

**Success criteria:**

- All schemas validate, all scripts pass (same as Phase 5)
- The scenario plan passes all new quality checklist items in `create_scenario`
- The comparison analysis shows improvement on all three dimensions
- No regression on the criteria that the first scenario handled well: information barrier, persona voice distinction, signal moment calibration, 6th-grade language level

**Notes:**
- The first scenario is not regenerated. It stands as the baseline.
- If the second scenario still shows flat dynamics despite the updated guidance, the issue is deeper than command prose — it may require structural changes to the scenario plan schema (e.g., a required `conflict` field) or changes to the learning scientist's validation criteria. Document what failed and why.
- Save all intermediate artifacts (raw transcript, pre-enumeration transcript) for the same reasons as Phase 5 — they serve as additional test fixtures and as evidence of the instructional designer's editing boundaries.

---

## Phase 6.3: Pedagogical Reviewer and Subagent Prompt Refinements

**Objective:** Introduce a pedagogical reviewer subagent as a post-generation quality gate, refine three existing subagent prompts for Act 5 flaw expression, and validate everything by regenerating the second scenario's transcript.

**Why this phase exists:** Phases 6.1 and 6.2 addressed *plan-level* problems — flat group dynamics, flaw-type diversity, turn outline anti-patterns. This phase addresses *expression-level* problems identified in the Phase 6.2 transcript: reasonable-sounding compromises that obscure Act 5 flaws, and repeated capitulation signals that flatten into agreement. It also fills a structural gap in the pipeline — no agent currently assesses whether a generated transcript is pedagogically effective for 6th graders.

**Inputs:**
- Phase 6.2 scenario outputs in `registry/deforestation_reforestation/` (comparison baseline)
- All existing subagent prompts in `configs/*/agents/`
- All existing schemas in `configs/*/schemas/`
- Design doc: signal moment principles (lines 196-232), create_script process (lines 333-397)

### Part 1: New Subagent — Pedagogical Reviewer

**The gap:** The learning scientist validates the plan *before* generation ("will this plan produce detectable flaws?"). The evaluator annotates the transcript *after* generation ("what flaws are present?"). No agent asks the question in between: "will this transcript teach 6th graders effectively?" The pipeline can produce a transcript that is technically correct — all schemas validate, all target flaws surface — while being pedagogically flat. Review B and the external reviewer both caught problems that no agent in the pipeline would have flagged.

**The agent:** A dedicated pedagogical reviewer, invoked by `create_script` after the instructional designer's polish pass and before enumeration. It reads the polished pre-enumeration transcript and the full scenario plan (including `target_flaws`), and produces a structured assessment of whether the transcript works as a teaching tool for 6th graders.

**Why a new agent, not a second mode of the learning scientist:** Different inputs (plan vs. transcript + plan), different criteria (plan viability vs. transcript effectiveness), different stage in the pipeline (`create_scenario` vs. `create_script`). Giving a single agent two modes invites confusion about which role is active. Five subagents, each with one clear job, is a cleaner architecture than four subagents where one does double duty.

**New files:**

| File | Purpose |
|------|---------|
| `configs/script/agents/pedagogical_reviewer.md` | Subagent prompt. Assesses transcript-level pedagogical effectiveness. |
| `configs/script/schemas/pedagogical_review.yaml` | Schema for the assessment output. |

The agent and schema live in `configs/script/` because the pedagogical reviewer is invoked by `create_script`, alongside the dialog writer and instructional designer.

**Why this position in the pipeline:** The pedagogical reviewer runs after the instructional designer, not after the dialog writer. This means a `not_ready` result discards work from two LLM calls (dialog writer + instructional designer). The alternative — running before the instructional designer — would be cheaper to discard but would produce false negatives: a pre-polish transcript may look too subtle simply because the instructional designer hasn't sharpened it yet. The reviewer must assess the polished transcript to give an accurate judgment.

**Schema design:**

```yaml
scenario_id: string
overall_score: integer              # 1-5, where:
                                    #   1 = not usable — fundamental problems
                                    #   2 = significant weaknesses — unlikely to teach effectively
                                    #   3 = usable with heavy scaffolding — operator should consider revision
                                    #   4 = effective — minor weaknesses, ready for classroom use
                                    #   5 = strong teaching tool — flaws land naturally, discussion potential is high

explanation: string                 # What the transcript scored and why. References
                                    # specific turns, specific criteria, what works
                                    # well and what doesn't. Covers all assessment
                                    # criteria (flaw detectability, group dynamics,
                                    # naturalism, discussion potential, signal variety,
                                    # compromise quality). Written for an operator who
                                    # may not be an instructional designer.

revision_strategy: string           # If score <= 3: what specific upstream change
                                    # would improve the transcript. Names the level
                                    # of intervention (plan structure, flaw selection,
                                    # prompt wording, accomplishes field steering) and
                                    # the specific change recommended.
                                    # Null if score >= 4.

flaw_assessments:                   # per target flaw
  - flaw_pattern: string
    thinking_behavior: string
    detectable_by_6th_graders: yes | with_scaffolding | too_subtle | too_obvious
    expression_quality: string      # how this flaw reads in the actual transcript
```

The schema uses a scored assessment (1-5) rather than a binary (ready/not_ready). The operator knows their students — a score of 3 might be acceptable for an experienced class but not for a first session. The `explanation` field covers all assessment criteria in a single narrative, making per-criterion numerical scores unnecessary. The `revision_strategy` field is the actionable output: it tells the operator not just what's wrong but what upstream change would fix it and at what level (plan, prompt, or flaw selection).

**Assessment criteria for the pedagogical reviewer prompt:**

| Criterion | What it checks | Why it matters |
|-----------|---------------|----------------|
| Flaw detectability | Can a 6th grader reading naturally notice each flaw? Not "is the flaw analytically present?" but "would a 12-year-old pause here?" | Flaws that are present but invisible don't teach anything |
| Group dynamics | Is there genuine disagreement, or do personas agree throughout? Does the discussion read as a conversation or as parallel monologues? | Flat discussions let students evaluate individuals in isolation — they miss group reasoning skills |
| Compromise quality | For Act 5 flaws, does the resolution sound adequate to a 6th grader? A compromise that sounds fair makes the flaw invisible regardless of its analytical presence. | The external reviewer and Phase 6.2 analysis both identified this as a recurring failure mode |
| Signal variety | Are signal moments differentiated across turns? Do capitulation signals progress (reluctant → uncomfortable → self-interrupting) or repeat? | Repeated identical signals flatten into noise |
| Discussion potential | Are there moments students will genuinely disagree about in Phases 3-4? Is the AI's perspective one a student could reasonably push back on? | Transcripts where every flaw is obvious and unambiguous leave nothing to discuss |
| Naturalism | Does the conversation feel like real 6th graders, or does it feel scripted? | Students won't take the activity seriously if the discussion feels artificial |

**Pipeline flow change (create_script):**

```
Steps 1-6: unchanged
Step 7: Pedagogical reviewer → assessment (saved to registry/{scenario_id}/pedagogical_review.yaml)
         ├─ score >= 4 → proceed to Step 8
         └─ score <= 3 → halt, display explanation and revision_strategy to operator
Step 8: enumerate_turns.py → final transcript     (renumbered from 7)
Step 9: Validate and save                          (renumbered from 8)
```

**Low scores halt — no revision loop.** The operator reads the explanation and revision_strategy, then decides what to do: revise the plan, adjust prompt guidance, accept the transcript despite the score, or try a different flaw selection. Regenerating with the same prompts will produce similar quality — the revision_strategy points to what needs to change upstream. If the pedagogical reviewer consistently flags the same issue, that's evidence the prompts need better guidance, which the operator addresses between sessions.

**LLM call impact:**

| Path | Before | After |
|------|--------|-------|
| Happy path | 3 (dialog writer + instructional designer + evaluator) | 4 (+pedagogical reviewer) |
| One structural failure | 4 | 5 |
| Max failures | 5 | 6 |

One additional call per scenario. Negligible for a per-topic operation.

### Part 2: Subagent Prompt Refinements

Three prose additions to existing subagent prompts, encoding Act 5 expression craft knowledge identified in the Phase 6.2 analysis. No schema changes, no new scripts, no changes to `create_scenario` or the pipeline's orchestration.

**A. Dialog writer (`configs/script/agents/dialog_writer.md`) — Act 5 expression guidance:**

Add to the "Signal Moments" section:

1. *Compromise calibration:* When a persona offers a compromise to end a disagreement, the compromise should be visibly smaller than what the other persona was asking for. The gap between what was requested and what was offered should be concrete — a student should be able to say "they wanted X but only got Y." A compromise that sounds fair makes the discussion feel resolved.

2. *Capitulation variety:* When a persona yields over multiple turns, each moment should feel different. A progression — reluctant agreement → visible discomfort → self-interruption — is more readable than the same giving-in tone repeated. The reader should see someone being gradually worn down, not someone who already decided to agree.

**B. Instructional designer (`configs/script/agents/instructional_designer.md`) — Act 5 expression checks:**

Add to the "Sharpen Signal Moments" section:

1. *Compromise check:* For Act 5 flaws where one persona offers a compromise, verify the compromise is visibly lopsided. If it sounds adequate to a 6th grader, adjust the language to widen the gap between what was asked for and what was offered.

2. *Capitulation variety check:* For Act 5 flaws where capitulation spans multiple turns, verify each capitulation moment uses a different signal type. If two use the same tone, differentiate them.

**C. Evaluator (`configs/evaluation/agents/evaluator.md`) — Act 5 detectability criterion:**

Add to the quality assessment section:

For Act 5 flaws, apply an additional detectability test: does the resolution sound reasonable to a 6th grader? If a compromise sounds adequate *and* no other signal in the surrounding turns makes the abandonment visible, rate as `too_subtle`. The test is not whether the concern was analytically abandoned, but whether a 12-year-old would perceive the discussion as unresolved.

### Part 3: Validation — Regenerate Second Scenario Transcript

Regenerate the `deforestation_reforestation` transcript using the updated dialog writer and instructional designer prompts, then assess with the new pedagogical reviewer. This isolates the prompt changes — same plan, different expression.

**Tasks:**

1. Update all three subagent prompts (dialog writer, instructional designer, evaluator) per Part 2.
2. Write the pedagogical reviewer agent prompt and schema per Part 1.
3. Update `create_script` command to include the pedagogical reviewer step.
4. Sync all updated agents and commands to `.claude/commands/` and `.claude/agents/`.
5. Regenerate the `deforestation_reforestation` transcript using the updated pipeline.
6. Compare the regenerated transcript against the Phase 6.2 version on Act 5 expression quality:

| Dimension | Phase 6.2 version (baseline) | Phase 6.3 version (expected improvement) |
|-----------|-------|--------|
| Compromise quality | Does the compromise sound fair and resolved? | Compromise should be visibly lopsided — student can see the gap |
| Capitulation variety | Do capitulation signals repeat the same tone? | Each capitulation should feel different — progression, not repetition |
| Pedagogical reviewer score | N/A (reviewer didn't exist) | Should score >= 4 |

7. Run the full evaluation pipeline (`evaluate_script`) on the regenerated transcript.
8. **Regression check on first scenario.** Re-run `evaluate_script` on `ocean_plastic_campaign` with the updated evaluator prompt. This is lightweight (one LLM call, no regeneration) and verifies the Act 5 detectability criterion doesn't produce unintended side effects on Act 2-3 flaw assessment. Compare the new evaluation against the existing `evaluation.yaml` — annotations and quality assessment should be substantively the same.
9. Verify no regression on dimensions from Phase 6.2: persona disagreement, cross-turn flaw detection, information barrier, persona voice, language level.

**Outputs:**

- `configs/script/agents/pedagogical_reviewer.md` — new subagent prompt
- `configs/script/schemas/pedagogical_review.yaml` — new schema
- Updated `configs/script/agents/dialog_writer.md`
- Updated `configs/script/agents/instructional_designer.md`
- Updated `configs/evaluation/agents/evaluator.md`
- Updated `configs/script/commands/create_script.md`
- Regenerated `registry/deforestation_reforestation/` artifacts (with `_v2` suffix or replacing originals — operator's choice)
- `registry/deforestation_reforestation/pedagogical_review.yaml` — first use of the new assessment

**Notes:**
- The first scenario (`ocean_plastic_campaign`) is not regenerated. It predates the pedagogical reviewer and stands as the Phase 5 baseline.
- If the regenerated transcript still has Act 5 expression problems despite the prompt changes, the issue may be inherent to single-pass generation for interaction flaws. Document what failed and whether block generation (3-5 turns per call) should be tested.
- The pedagogical reviewer's assessment for this validation run also serves as a test fixture for the assessment schema itself — verify the schema captures what the reviewer produces.

### Summary of All Changes in Phase 6.3

**New files (2):**

| File | Type |
|------|------|
| `configs/script/agents/pedagogical_reviewer.md` | Subagent prompt |
| `configs/script/schemas/pedagogical_review.yaml` | Schema (12th schema) |

**Modified files (7):**

| File | Change |
|------|--------|
| `configs/script/agents/dialog_writer.md` | Add Act 5 compromise calibration + capitulation variety guidance |
| `configs/script/agents/instructional_designer.md` | Add Act 5 compromise check + capitulation variety check |
| `configs/evaluation/agents/evaluator.md` | Add Act 5 detectability criterion |
| `configs/script/commands/create_script.md` | Add pedagogical reviewer step (new Step 7), renumber Steps 7-8 to 8-9, update LLM call summary |
| `docs/design.md` | Update subagent table (4 → 5), schema inventory (11 → 12), create_script process (3 steps → 4), LLM call counts, directory tree |
| `docs/implementation-pipeline.md` | This phase description |
| `.claude/commands/` and `.claude/agents/` | Synced copies |

**Unchanged:**

All existing schemas (11), all Python scripts (5), `create_scenario` command, `evaluate_script` command, `initialize_polylogue` command, reference libraries, learning scientist prompt, all registry artifacts from prior phases.

---

*Phase 7 has been replaced by `docs/scenario-sequence.md` — an operator guide with ready-to-use `create_scenario` prompts for the UMS pilot. The implementation pipeline ends at Phase 6.3. Scenario generation is an operator activity, not an implementation phase.*

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
| 6.1 | Review B fixes + scenario plan guidance | Review B | Flat group dynamics, missing library flags, cross-turn annotation |
| 6.2 | Second scenario — guidance validation | Phase 6.1 | Validates revised guidance produces richer group dynamics |
| 6.3 | Pedagogical reviewer + prompt refinements | Phase 6.2 | Post-generation quality gate, Act 5 expression craft knowledge |

*Scenario generation follows the implementation pipeline. See `docs/scenario-sequence.md` for operator prompts.*
