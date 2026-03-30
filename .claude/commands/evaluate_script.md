# /evaluate_script

Annotate the transcript with flaw identifications, quality assessment, and facilitation guide.

## Input

The operator provides:
- **scenario_id**: Which scenario to evaluate

The command reads:
- `registry/{scenario_id}/script.yaml` — the enumerated transcript
- `registry/{scenario_id}/scenario.yaml` — the scenario plan

## Process

### Step 1: Read inputs

Read the enumerated transcript and scenario plan. Verify both exist and are non-empty.

Also read the reference libraries:
- `configs/reference/detection_act_library.yaml`
- `configs/reference/thinking_behavior_library.yaml`

### Step 2: Evaluate (evaluator agent)

Invoke the **evaluator** agent with:
- The full enumerated transcript (`script.yaml`)
- The full scenario plan (`scenario.yaml`)
- The detection act library
- The thinking behavior library

The evaluator produces everything in a single pass:
- Annotations (location, argument_flaw, thinking_behavior, plausible_alternatives, planned)
- Summary (counts)
- Quality assessment (all_targets_surfaced, issues with recommendations)
- Facilitation guide (timing, what_to_expect, phase 1/2/4 scaffolds)

### Step 3: Save full evaluation

Save the evaluator's output to `registry/{scenario_id}/evaluation.yaml`.

If `configs/shared/scripts/validate_schema.py` exists:

```bash
python configs/shared/scripts/validate_schema.py registry/{scenario_id}/evaluation.yaml configs/evaluation/schemas/evaluation_full.yaml
```

If the script is not available, verify manually:
- All annotation locations reference valid sentence IDs that exist in `script.yaml`
- All `pattern` fields use canonical IDs from the reference libraries
- All `detection_act` fields use act_ids from the reference libraries
- `quality_assessment` is present with `all_targets_surfaced` and `issues`
- `facilitation_guide` has timing, what_to_expect, phase_1, phase_2, phase_4

The schema includes `cross_references` rules that check facilitation_guide consistency (every what_to_expect flaw has matching phase_1 and phase_2 entries). If validation fails, fix the evaluation before proceeding to Step 4.

### Step 4: Export student-facing evaluation and cheat sheet

If `configs/evaluation/scripts/export_for_app.py` exists, run it:

```bash
python configs/evaluation/scripts/export_for_app.py registry/{scenario_id}/evaluation.yaml registry/{scenario_id}/ \
  --detection-act-library configs/reference/detection_act_library.yaml \
  --thinking-behavior-library configs/reference/thinking_behavior_library.yaml
```

This produces:
- `registry/{scenario_id}/evaluation_student.yaml`
- `registry/{scenario_id}/cheat_sheet.md`

If the script is not available, produce these manually:

**evaluation_student.yaml** — Extract from evaluation.yaml:
- Keep: scenario_id, annotations (annotation_id, location, argument_flaw with pattern/detection_act/explanation, thinking_behavior with pattern/explanation)
- Remove: planned, plausible_alternatives, summary, quality_assessment, facilitation_guide

**cheat_sheet.md** — Render from evaluation.yaml's facilitation_guide:

```
FACILITATION CHEAT SHEET — {topic}

TIMING ({total} min period)
  Phase 1: ~{phase_1_minutes} min  |  Phase 2: ~{phase_2_minutes} min  |  Phase 3: ~{phase_3_minutes} min  |  Phase 4: ~{phase_4_minutes} min

WHAT TO EXPECT
  {For each what_to_expect entry:}
  Flaw: "{flaw plain-language name}" — {turns}
    Students should notice: {signal}
    Difficulty: {difficulty}

PHASE 1: Student isn't finding flaws
{For each phase_1 scaffold:}
→ "{prompt}"

PHASE 2: Student found flaw but stuck on thinking behavior
{For each phase_2 scaffold:}
→ Narrow to {count}: {narrowed_options as plain-language names}
→ "{perspective_prompt}"

PHASE 3: Group discussion is stalled [same for every scenario]
→ "Did you all mark the same turns? Look at where you differ."
→ "Someone in your group found something you missed. Take another look."

PHASE 4: Class isn't engaging with AI perspective
{For each phase_4 scaffold:}
→ "{prompt}"
```

### Step 5: Validate student evaluation

If `configs/shared/scripts/validate_schema.py` exists:

```bash
python configs/shared/scripts/validate_schema.py registry/{scenario_id}/evaluation_student.yaml configs/evaluation/schemas/evaluation_student.yaml
```

If the script is not available, verify manually:
- Contains ONLY: scenario_id, annotations with annotation_id, location, argument_flaw (pattern, detection_act, explanation), thinking_behavior (pattern, explanation)
- Does NOT contain: planned, plausible_alternatives, quality_assessment, facilitation_guide, summary

### Step 6: Report quality assessment

Display the quality assessment to the operator:
- Were all target flaws surfaced?
- Any issues? (missing_flaw, too_subtle, too_obvious)
- Recommendations? (usable_as_is, consider_regeneration, needs_new_plan)

The operator decides the next action:
- **usable_as_is**: Scenario is complete
- **consider_regeneration**: Operator may re-run `/create_script` with the same plan
- **needs_new_plan**: Operator should revise via `/create_scenario`

This command does NOT trigger regeneration automatically.

## Output

- `registry/{scenario_id}/evaluation.yaml` — full evaluation (operator + teacher)
- `registry/{scenario_id}/evaluation_student.yaml` — student-facing annotations only
- `registry/{scenario_id}/cheat_sheet.md` — printable facilitation cheat sheet

## What's Next

When the evaluation is saved, display a summary for the operator:

```
Scenario complete: {scenario_id}

Artifacts saved to registry/{scenario_id}/:
  scenario.yaml          — plan
  script.yaml            — transcript
  evaluation.yaml        — full evaluation
  evaluation_student.yaml — student-facing annotations
  cheat_sheet.md         — facilitation reference

Quality: {all_targets_surfaced ? "All target flaws surfaced" : "Issues found — see quality_assessment"}
```

**Review the quality assessment.** If there are issues:
- **usable_as_is**: Minor issues, transcript works as-is
- **consider_regeneration**: Re-run `/create_script {scenario_id}`
- **needs_new_plan**: Revise the plan via `/create_scenario`

**Review the cheat sheet** before class — takes 2 minutes to scan.

**To generate the next scenario**, run `/create_scenario` with the next prompt from `docs/scenario-sequence.md`.

**Full workflow:**
```
/initialize_polylogue  →  one-time setup
/create_scenario       →  design the plan
/create_script         →  generate the transcript
/evaluate_script       →  annotate and produce facilitation materials
```
