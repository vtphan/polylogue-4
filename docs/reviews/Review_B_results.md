# REVIEW B: Full Pipeline Integration Review

## PART 1: TECHNICAL INTEGRATION

### 1. SCHEMA VALIDATION
**PASS**

All 4 registry artifacts validate against their schemas:
```
[PASS] scenario.yaml ↔ scenario_plan.yaml
[PASS] script.yaml ↔ discussion_transcript.yaml
[PASS] evaluation.yaml ↔ evaluation_full.yaml
[PASS] evaluation_student.yaml ↔ evaluation_student.yaml
```
Structural review also passes: `script_pre.yaml` passes `review_transcript.py`.

### 2. SCRIPT-COMMAND INTEGRATION
**ISSUE**

`create_script.md` calls scripts in the correct order:
1. Dialog writer → `review_transcript.py` → Instructional designer → `enumerate_turns.py`

`evaluate_script.md` calls `export_for_app.py` — but the invocation at line 58 is:
```bash
python configs/evaluation/scripts/export_for_app.py registry/{scenario_id}/evaluation.yaml registry/{scenario_id}/
```
This is **missing the `--detection-act-library` and `--thinking-behavior-library` flags**. Without them, `export_for_app.py` uses canonical IDs instead of plain-language names in the cheat sheet. The actual `cheat_sheet.md` in the registry uses plain-language names (e.g., "They're saying a lot based on very little"), so it was produced with the flags during Phase 5 — but the command as documented won't reproduce this.

**Fix:** Update `evaluate_script.md` step 4 to pass both library paths:
```bash
python configs/evaluation/scripts/export_for_app.py registry/{scenario_id}/evaluation.yaml registry/{scenario_id}/ \
  --detection-act-library configs/reference/detection_act_library.yaml \
  --thinking-behavior-library configs/reference/thinking_behavior_library.yaml
```

### 3. ENUMERATION CORRECTNESS
**PASS**

In `script.yaml`:
- Turn IDs sequential: turn_01 through turn_12
- Sentence IDs sequential within each turn: turn_01.s01, turn_01.s02, turn_01.s03, etc.

In `evaluation.yaml`, all annotation sentence references are valid:
- ann_01: turn_05.s01, turn_05.s02, turn_05.s03 — exist
- ann_02: turn_07.s01, turn_07.s02, turn_07.s03 — exist
- ann_03: turn_05.s02 — exists
- ann_04: turn_09.s01, turn_09.s02, turn_09.s03 — exist
- ann_05: turn_06.s01, turn_06.s02 — exist
- ann_06: turn_12.s02, turn_12.s03 — exist

### 4. EVALUATION SPLIT CORRECTNESS
**PASS**

`evaluation_student.yaml` contains ONLY: scenario_id, annotations with annotation_id, location, argument_flaw (pattern, detection_act, explanation), thinking_behavior (pattern, explanation).

Confirmed absent: planned, plausible_alternatives, summary, quality_assessment, facilitation_guide.

`cheat_sheet.md` follows the design doc example format (lines 866-900): TIMING, WHAT TO EXPECT, PHASE 1-4 sections, Phase 3 is generic/hardcoded. Renders correctly.

### 5. DISCARD-AND-REGENERATE LOGIC
**PASS**

`create_script.md` Step 5 specifies: discard and return to Step 3, maximum 3 attempts, each retry is clean (no feedback), halt after 3 failures with report to operator. The logic is present and correctly structured. No structural failures occurred during Phase 5 (transcript passed on first attempt).

---

## PART 2: PROMPT AND COMMAND QUALITY

### 6. INFORMATION BARRIER
**PASS**

Reading the transcript — no signs of the writer "knowing" the taxonomy:
- No taxonomic language anywhere. No 6th grader says "that's insufficient evidence" or "you're exhibiting bias."
- Flaws emerge from character, not from instruction. Mia's confidence overshoots her evidence because she's genuinely excited, not because she's performing a flaw. Jaylen skips logistics because he's caught up in creative planning.
- The signal moments feel natural — "the documentary and the article both prove" is how an excited 12-year-old talks.

`create_script.md` Step 2 explicitly strips `target_flaws` and `instructional_goals` before invoking the dialog writer. `dialog_writer_input.yaml` schema enforces the exclusion (lines 99-103).

### 7. INSTRUCTIONAL DESIGNER BOUNDARIES
**PASS**

Comparing `script_raw.yaml` (dialog writer output) to `script_pre.yaml` (instructional designer output):

| Change | Type | Example |
|--------|------|---------|
| Removed "literally" (turn 1) | Language simplification | "literally made me want to cry" → "made me want to cry" |
| Removed "like" filler (turns 3, 9) | Language tightening | "said that like eight million" → "said that eight million" |
| Added "one" before "article" (turn 3) | Signal sharpening | "this article I found" → "this one article I found" |
| Removed "basically" (turn 5) | Signal sharpening | "both basically prove" → "both prove" |
| Restructured turn 5 sentences | Signal sharpening | Made "so that proves awareness campaigns work" explicit in one sentence |
| Added "that's two sources" (turn 7) | Signal sharpening | Makes the thin evidence base more noticeable |

No flaws added. No flaws removed. No turns added/removed. Speaker sequence unchanged. All changes are expression sharpening and language simplification — within the instructional designer's stated boundaries.

### 8. ACCOMPLISHES FIELD EFFECTIVENESS
**PASS**

**Target flaw 1: `big_claim_little_evidence`** (turns 5-7)
- Turn 5 accomplishes: "share what you remember from them as if it settles the question"
- Result: "the documentary and the article both prove..." + "It's not even a question anymore"
- **Steering succeeded.** "As if it settles the question" produced "it's not even a question anymore" — almost a direct echo.

- Turn 6 accomplishes: "Briefly ask if they should look for more evidence, but... agree easily and move on"
- Result: "do you think we should maybe find a few more sources?" → "yeah okay, I guess you're right"
- **Steering succeeded.** Natural questioning followed by easy acquiescence.

**Target flaw 2: `missing_practical_details`** (turns 9-11)
- Turn 9 accomplishes: "focus on what it would look like, what activities there would be... without mentioning cost, timing, or who would help"
- Result: stations, display wall, art project — zero logistics
- **Steering succeeded.** The accomplishes field's explicit "without mentioning" created a clear and natural absence.

No steering failures. Both target flaws surfaced exactly where planned.

---

## PART 3: PEDAGOGICAL QUALITY

### 9. FLAW DETECTABILITY
**PASS** (with one note)

| Flaw | Location | Rating |
|------|----------|--------|
| `big_claim_little_evidence` | turn 5 | **Most students would catch this.** "Proves" + "not even a question" from two sources — gap is wide and in the same breath. |
| `missing_practical_details` | turns 9-11 | **Most students would catch this.** The plan is SO ambitious (stations, art project, sculpture, social media) that the absence of "but how?" is conspicuous. |
| `one_example_as_proof` | turn 5 | **Attentive students would catch this.** "One town" → "proves campaigns work" is a visible jump, but it's embedded in a longer passage. |
| `weak_source_strong_claim` | turn 7 | **Attentive students would catch this.** Requires recognizing that "two sources" + "pretty solid" doesn't add up for a big claim. |
| `abandoned_concern` | turns 6-8 | **Easy to miss.** The concern is mild ("maybe find a few more sources?") and the yielding is quick. Students may read past it. Matches `easy_to_miss` rating in the facilitation guide. |
| `conclusion_exceeds_evidence` | turn 12 | **Attentive students would catch this.** Requires comparing "totally change how people think" against what was actually established. |

No flaws are too cartoonish. No flaws are invisible. Good calibration — the two planned flaws are the most visible, emergent flaws are appropriately harder.

### 10. LANGUAGE LEVEL
**PASS**

- Vocabulary throughout is age-appropriate: "documentary," "statistics," "pledge cards," "sculpture" — all within 6th-grade range.
- Sentence structures are short and informal: "Okay so," "Oh my gosh yes," "Ooh and what if."
- No specialized knowledge required beyond what's established in the discussion.

### 11. PERSONA VOICE
**PASS**

**Mia:** Enthusiastic researcher. Leads with evidence. Uses confidence language: "the research proves," "it's not even a question," "I feel really good about this." Emotional connection to the topic (sea turtles, documentary).

**Jaylen:** Creative planner. Asks questions. Uses brainstorming language: "picture this," "what if we also did," "this is going to be the best project." Focuses on what things would look like, not on evidence.

They sound like different people. You could identify the speaker without names. Mia's turns orbit around evidence and conviction; Jaylen's orbit around ideas and excitement.

### 12. ANNOTATION QUALITY
**ISSUE**

Annotations are in 6th-grade language, framed as perspectives ("The AI thinks..."). Plausible alternatives are genuinely defensible.

**However, ann_05 (`abandoned_concern`) under-captures the cross-turn flaw.** The annotation's location is `turn: turn_06, sentences: [turn_06.s01, turn_06.s02]` — this captures Jaylen *raising* the concern but not Jaylen *abandoning* it. The capitulation happens at turn_08.s01 ("Yeah okay, I guess you're right, we don't want to waste time on that"). The annotation's own explanation even quotes turn 8: "Jaylen said 'yeah okay, I guess you're right' in turn 8."

The `sentences` list supports cross-turn references (schema: "May span multiple turns for cross-turn flaws"). The annotation should include `turn_08.s01` to capture the full flaw.

**Fix:** Update ann_05's location to:
```yaml
location:
  turn: turn_06
  sentences: [turn_06.s01, turn_06.s02, turn_08.s01]
```

### 13. FACILITATION GUIDE USABILITY
**PASS**

- **Scannable in 2 minutes?** Yes — clear sections, short entries, consistent format.
- **Find the right scaffold while circulating?** Yes — organized by phase, specific turn references, prompts are ready-to-read sentences.
- **Phase 1 and Phase 2 prompts usable as written?** Yes — "Re-read turn 5. Mia says something 'proves' that awareness campaigns work. How many examples does she give? Is that enough to prove it?" — that's natural teacher language.
- **Timing realistic?** 10+10+15+15 = 50 minutes. Realistic for a period.

### 14. SIGNAL MOMENT CALIBRATION
**PASS**

Checking against design doc principles (lines 200-227):

| Principle | Evidence | Assessment |
|-----------|----------|------------|
| Overconfident language for evidence-based flaws | "both prove," "it's not even a question," "that's pretty solid" | Present and effective |
| Concrete absence for Act 3 | Missing: cost, time, materials, who helps — all concrete things a 6th grader would think of | Present and effective |
| Proximity for contradictions | conclusion_exceeds_evidence in turn 12 refers back to evidence discussed in turns 5-7 — 5-turn gap in a 12-turn transcript | Acceptable given short transcript length |
| Explicit capitulation for Act 5 | "Yeah okay, I guess you're right, we don't want to waste time on that" | Present — "I guess you're right" is textbook giving-in language |

---

## Summary

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Schema validation | PASS |
| 2 | Script-command integration | **ISSUE** — `evaluate_script.md` missing library flags for `export_for_app.py` |
| 3 | Enumeration correctness | PASS |
| 4 | Evaluation split correctness | PASS |
| 5 | Discard-and-regenerate logic | PASS |
| 6 | Information barrier | PASS |
| 7 | Instructional designer boundaries | PASS |
| 8 | Accomplishes field effectiveness | PASS |
| 9 | Flaw detectability | PASS |
| 10 | Language level | PASS |
| 11 | Persona voice | PASS |
| 12 | Annotation quality | **ISSUE** — ann_05 under-captures cross-turn flaw (missing turn_08 sentences) |
| 13 | Facilitation guide usability | PASS |
| 14 | Signal moment calibration | PASS |

## Overall Assessment: NEEDS REVISION

Two issues, both straightforward:

1. **`evaluate_script.md`** — Add `--detection-act-library` and `--thinking-behavior-library` flags to the `export_for_app.py` invocation so the cheat sheet uses plain-language flaw names.

2. **`evaluation.yaml` ann_05** — Add `turn_08.s01` to the sentences list so the `abandoned_concern` annotation captures both the concern being raised (turn 6) and abandoned (turn 8).

### SUGGESTION (non-blocking)

The `location.turn` field (singular string) is slightly awkward for cross-turn flaws where the flaw spans multiple turns. The `sentences` list handles cross-turn references, but `turn` can only point to one turn. Consider whether `turn` should be a primary-turn indicator or whether the field should be dropped in favor of deriving it from the sentences list. Not blocking — the current design works — but worth noting for schema evolution.
