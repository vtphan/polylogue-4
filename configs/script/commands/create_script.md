# /create_script

Generate the discussion transcript from a scenario plan.

## Input

The operator provides:
- **scenario_id**: Which scenario to generate a transcript for

The command reads `registry/{scenario_id}/scenario.yaml`.

## Process

### Step 1: Read the scenario plan

Read `registry/{scenario_id}/scenario.yaml` and verify it exists and contains all required fields.

Also read the reference libraries for context:
- `configs/reference/detection_act_library.yaml`
- `configs/reference/thinking_behavior_library.yaml`

### Step 2: Prepare dialog writer input (INFORMATION BARRIER)

**This step enforces the information barrier.** Create the dialog writer's input by stripping the scenario plan of all flaw taxonomy information:

**Include:**
- `scenario_id`
- `topic`
- `context`
- `personas` (all fields: persona_id, name, role, perspective, strengths, weaknesses)
- `discussion_arc`
- `turn_outline` (turn, speaker, accomplishes only)

**Exclude:**
- `target_flaws` (the entire block)
- `instructional_goals`

The dialog writer sees persona weaknesses (they need them to write authentically) but never sees flaw_pattern, thinking_behavior, detection_act, or surfaces_in. The `accomplishes` fields steer toward flaws without naming them — this is where the information barrier does its work.

### Step 3: Generate transcript (dialog writer)

Invoke the **dialog writer** agent with the prepared input.

The dialog writer produces a pre-enumeration transcript: turns with speaker and sentences (text only), no IDs.

### Step 4: Structural review

If `configs/script/scripts/review_transcript.py` exists, run it:

```bash
python configs/script/scripts/review_transcript.py registry/{scenario_id}/script_pre.yaml registry/{scenario_id}/scenario.yaml
```

If the script is not available, verify manually:
- **Turn count**: Does it match the plan's outline and not exceed 20 turns?
- **Speaker names**: Do all speakers match persona_ids from the plan?
- **Turn order**: Does the speaker sequence follow the plan's turn outline?
- **All turns present**: Are all planned turns accounted for?

**If structural checks fail → discard and regenerate.**

### Step 5: Discard-and-regenerate logic

If Step 4 fails:
1. Discard the transcript entirely
2. Return to Step 3 with identical input (no feedback from the failed attempt)
3. **Maximum 3 attempts.** Each retry is a clean invocation — no feedback from previous failures

If all 3 attempts fail:
- **Halt.** Report the structural failures to the operator
- The plan is likely the problem, not the generation. The operator should revise the plan in `create_scenario`
- Do NOT attempt a 4th generation

Track attempts: "Attempt 1 of 3", "Attempt 2 of 3", etc.

### Step 6: Polish (instructional designer)

Once a transcript passes structural review, invoke the **instructional designer** agent with:
- The raw pre-enumeration transcript (from the dialog writer)
- The **full** scenario plan (including `target_flaws` — no information barrier for the instructional designer)

The instructional designer takes one editing pass to:
- Simplify above-grade-level language
- Tighten rambling turns
- Sharpen signal moments for detectability
- Ensure distinct persona voices

Save the polished pre-enumeration transcript as an intermediate artifact:
`registry/{scenario_id}/script_pre.yaml`

**Check for missing flaw flags.** If the instructional designer flags any target flaws as completely absent (in a comment block at the end), report this to the operator. A missing flaw requires regeneration (return to Step 3), not further editing.

### Step 7: Pedagogical review

Invoke the **pedagogical reviewer** agent with:
- The polished pre-enumeration transcript (`registry/{scenario_id}/script_pre.yaml`)
- The **full** scenario plan (including `target_flaws`)

The pedagogical reviewer assesses whether the transcript works as a teaching tool for 6th graders. It produces a scored assessment (1-5) covering flaw detectability, group dynamics, compromise quality, signal variety, discussion potential, and naturalism.

Save the assessment to `registry/{scenario_id}/pedagogical_review.yaml`.

If `configs/shared/scripts/validate_schema.py` exists:

```bash
python configs/shared/scripts/validate_schema.py registry/{scenario_id}/pedagogical_review.yaml configs/script/schemas/pedagogical_review.yaml
```

**Check the score:**
- **Score >= 4**: Proceed to Step 8 (enumeration).
- **Score <= 3**: **Halt.** Display the `explanation` and `revision_strategy` to the operator. Do not enumerate or save the final transcript. The operator decides what to do:
  - Revise the scenario plan and re-run from `create_scenario`
  - Accept the transcript despite the score (operator override)
  - Adjust prompt guidance and regenerate

Regenerating with the same prompts will produce similar quality. The `revision_strategy` names the upstream change needed.

### Step 8: Enumerate turns

If `configs/script/scripts/enumerate_turns.py` exists, run it:

```bash
python configs/script/scripts/enumerate_turns.py registry/{scenario_id}/script_pre.yaml registry/{scenario_id}/script.yaml
```

If the script is not available, enumerate manually:
- Assign `turn_id` to each turn: `turn_01`, `turn_02`, ...
- Assign `id` to each sentence within each turn: `turn_01.s01`, `turn_01.s02`, ...
- Numbering is sequential, zero-padded to two digits

### Step 9: Validate and save

Save the enumerated transcript to `registry/{scenario_id}/script.yaml`.

If `configs/shared/scripts/validate_schema.py` exists, validate against the transcript schema:

```bash
python configs/shared/scripts/validate_schema.py registry/{scenario_id}/script.yaml configs/script/schemas/discussion_transcript.yaml
```

If the script is not available, verify manually:
- All turns have `turn_id` in format `turn_XX`
- All sentences have `id` in format `turn_XX.sXX`
- IDs are sequential
- Personas list includes only persona_id, name, role (no perspective/strengths/weaknesses)

## Output

- `registry/{scenario_id}/script_pre.yaml` — polished pre-enumeration transcript (intermediate)
- `registry/{scenario_id}/pedagogical_review.yaml` — pedagogical assessment
- `registry/{scenario_id}/script.yaml` — final enumerated transcript

## Summary of LLM Calls

| Call | Agent | What it does |
|------|-------|-------------|
| 1 | Dialog writer | Generates raw transcript (may repeat up to 3x) |
| 2 | Instructional designer | Polishes the accepted transcript |
| 3 | Pedagogical reviewer | Assesses pedagogical effectiveness (score >= 4 to proceed) |

Structural review and enumeration are scripts (or manual), not LLM calls.

## What's Next

When the transcript is saved, display the next command for the operator to copy-paste:

```
Next step — copy and paste this command:

/evaluate_script {scenario_id}
```

Replace `{scenario_id}` with the actual scenario_id from this run (e.g., `/evaluate_script ocean_plastic_campaign`). The evaluator will annotate all flaws, produce a quality assessment, and generate a facilitation guide with per-phase scaffolds.

After evaluation, the scenario is complete. Review the cheat sheet (`registry/{scenario_id}/cheat_sheet.md`) before class.
