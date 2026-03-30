# /create_scenario

Design a discussion plan targeting specific argument flaws and thinking behaviors.

## Input

The operator provides:
- **Topic**: What the group is discussing
- **Context**: Background — what PBL unit this connects to, what students have been working on
- **Instructional goals**: What the teacher wants students to practice (1-2 goals)
- **Target complexity** (optional): Number of personas (2-3, default 2) and flaw-behavior combinations (1-3, default 2)

## Process

### Step 1: Read reference libraries

Read both libraries to ground the plan in the actual taxonomy:
- `configs/reference/detection_act_library.yaml`
- `configs/reference/thinking_behavior_library.yaml`

### Step 2: Draft the scenario plan

Based on the operator's input, generate a complete scenario plan:

1. **Choose a scenario_id**: snake_case, descriptive (e.g., `ocean_pollution_awareness`)

2. **Design personas** (2-3):
   - Each persona needs a distinct perspective on the topic
   - Strengths should be genuine — they know real things
   - **Weaknesses must be phrased as natural knowledge gaps or tendencies**, NOT as flaw labels. Write "only researched one source, tends to generalize from limited data" — NOT "will produce a big-claim-little-evidence flaw"
   - **Persona perspectives must pull in different directions**, not just represent different areas of focus pointing at the same conclusion. Two personas who both want the same outcome with different motivations will agree for the entire transcript — that produces flat discussions where students evaluate individuals in isolation rather than group reasoning. For 2-persona scenarios, the personas should disagree about something substantive: a priority, a tradeoff, or an interpretation of evidence. Agreement-only discussions are a quality problem, not a stylistic choice.

3. **Select target flaw-behavior combinations** (1-3):
   - Choose combinations that arise naturally from the personas' weaknesses and the topic
   - Assign each flaw to a specific persona and specific turn(s)
   - Ensure the combination is detectable by 6th graders — not too subtle, not too obvious
   - **Prefer flaw-type diversity across detection acts.** When targeting 2+ flaws, mix an individual flaw (Acts 1-3: something wrong with what one person *says*) with an interaction flaw (Acts 4-5: something wrong with how the group *resolves*). Two individual flaws produce discussions where students evaluate speakers in isolation; adding an interaction flaw forces students to evaluate the group's reasoning process — the skill that transfers to their own PBL teamwork. This is a recommendation, not a hard rule — there are legitimate scenarios where two Act 2 flaws are the right choice — but the default should be to mix.

4. **Write the turn outline:**
   - **Keep the discussion as short as possible while giving each target flaw room to surface naturally.** Every turn must earn its place — advancing the argument, creating tension, surfacing a flaw, or resolving/failing to resolve. Do not pad with filler conversation. Maximum 20 turns.
   - **The discussion is about one thing.** One decision, one question, one problem. The outline ends when that thing is resolved or clearly fails to resolve. Do not add turns that open new threads, introduce tangential topics, or extend the conversation into related-but-separate questions. A discussion about whether to focus on reforestation ends when the group decides (or fails to decide) — it doesn't continue into escape room design or what other groups are doing.
   - Specify speaker and accomplishes for each turn
   - **The `accomplishes` field is the most important element.** For flaw-surfacing turns, it must steer the dialog writer toward producing the flaw WITHOUT naming the flaw or revealing pedagogical intent.
     - BAD: "Make a sweeping claim supported by insufficient evidence"
     - GOOD: "Share what you found from your one article and explain why you think it settles the question"
   - For non-flaw turns, describe the conversational function: opening, reacting, building tension, wrapping up
   - Ensure the speaker sequence creates natural back-and-forth
   - **Avoid these turn outline anti-patterns:**
     - **4+ consecutive turns of unchecked agreement or enthusiasm.** Real group discussions have friction. If no persona pushes back, questions, or hesitates for 4+ turns in a row, the discussion will feel artificially harmonious.
     - **Omission flaws (Act 3) where the missing thing is never acknowledged.** When a plan has a lot of ambitious ideas with no practical details, at least one persona should briefly surface a practical concern ("but how would we pay for that?") before being brushed aside or redirected. The contrast — someone thought of it but the group moved past it — is more naturalistic and more detectable than total silence. This also creates a natural setup for Act 5 flaws like `abandoned_concern`.
     - **Evidence claims that go completely unchallenged.** When a persona makes a big claim from thin evidence, at least one other persona should show brief skepticism or ask a probing question before being won over. This makes the flaw detectable through *contrast* (someone noticed but was convinced) rather than through *absence* (nobody noticed).

5. **Write the discussion arc**: One paragraph describing the flow — how it opens, where tension builds, how it resolves or fails to resolve

### Step 3: Validate with the learning scientist

Invoke the **learning scientist** agent with the draft plan. The agent will assess:
- Flaw detectability for 6th graders
- Natural surfacing from persona character
- Language/content appropriateness
- Instructional goal alignment

Read the validation output and its `overall_assessment`:
- **ready**: Proceed to Step 4
- **revise**: Address `must_fix` and `should_fix` suggestions, then proceed
- **rethink**: Significant revision needed. Rework the plan and re-validate

### Step 4: Create registry directory and save

```bash
mkdir -p registry/{scenario_id}
```

Save the final plan to `registry/{scenario_id}/scenario.yaml`.

### Step 5: Validate output against schema

If `configs/shared/scripts/validate_schema.py` exists, run it:

```bash
python configs/shared/scripts/validate_schema.py registry/{scenario_id}/scenario.yaml configs/scenario/schemas/scenario_plan.yaml
```

If the script is not available, verify manually:
- All required fields from `configs/scenario/schemas/scenario_plan.yaml` are present
- Canonical IDs match the reference libraries exactly
- Turn count does not exceed 20
- Each target flaw references a valid persona_id and valid turn numbers

## Output

- `registry/{scenario_id}/scenario.yaml` — the complete scenario plan

## Quality Checklist

Before saving, verify:
- [ ] Persona weaknesses are natural language, not flaw labels
- [ ] Persona perspectives create genuine tension, not just different motivations toward the same conclusion
- [ ] `accomplishes` fields steer without naming flaws
- [ ] Target flaws use canonical IDs from the reference libraries
- [ ] Thinking behaviors use canonical IDs from the reference libraries
- [ ] If 2+ target flaws, they span different detection acts (individual + interaction preferred)
- [ ] Each flaw-surfacing turn's `accomplishes` field creates conditions for a signal moment
- [ ] No 4+ consecutive turns of unchecked agreement
- [ ] Omission flaws have at least one turn where a persona briefly surfaces the missing concern
- [ ] Evidence claims are briefly challenged before being accepted
- [ ] Turn count is appropriate for the scenario's complexity (no filler turns, maximum 20)
- [ ] The discussion is about one thing — no tangential threads after the main question resolves
- [ ] Each persona speaks multiple times with natural back-and-forth

## What's Next

The scenario plan is saved. Now generate the transcript:

```
/create_script
```

Provide the `scenario_id` from this scenario (e.g., `ocean_plastic_campaign`). The command will invoke the dialog writer, run structural checks, polish with the instructional designer, and assess pedagogical quality. If the pedagogical reviewer scores the transcript 4 or above, it proceeds to enumeration. If 3 or below, the command halts with a revision strategy — review it and decide whether to revise the plan or adjust prompt guidance.
