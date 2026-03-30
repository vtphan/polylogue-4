# Pilot Scenario Sequence — Operator Guide

Ready-to-use `create_scenario` prompts for the UMS pilot. Run these in order — the sequence builds students' critical thinking skills progressively across the full flaw taxonomy.

## How to Use This Document

For each scenario below, you'll find:
- **The operator prompt** — copy this into `create_scenario` as your input
- **Rationale** — why this scenario is here and what students should learn
- **Design notes** — specific guidance for reviewing the generated plan

**Workflow for each scenario:**

1. Run `/create_scenario` with the operator prompt below
2. Review the generated plan — check the design notes for this scenario
3. Run `/create_script` to generate the transcript
4. Review the pedagogical reviewer's score and explanation
5. Run `/evaluate_script` to produce annotations and facilitation guide
6. Review the cheat sheet — does it make sense for where students are in the sequence?

**If a transcript scores below 4:** Read the `revision_strategy` in the pedagogical review. It will point to the level of intervention needed (plan, prompt, or flaw selection). Revise accordingly and regenerate.

---

## Sequence Overview

| # | Difficulty | Detection acts | Topic | Key skill |
|---|-----------|---------------|-------|-----------|
| 1 | Tutorial | Act 2 | Recycling competition | Learn the tool |
| 2 | Easy | Act 1 | Trees on the Wolf River Greenway | Spot factual errors |
| 3 | Easy | Act 2 | Compostable cafeteria trays | Evaluate evidence |
| 4 | Moderate | Acts 2+3 | Community gardens on vacant lots | Notice what's missing |
| 5 | Moderate | Acts 2+3 | Park cleanup day | Different absence types |
| 6 | Moderate-hard | Acts 3+5 | Plastic bag ban | Track group dynamics |
| 7 | Hard | Acts 3+4 | Solar panels vs. insulation | Cross-turn reasoning |

**Skill progression:**

| Sessions 1-3 (Warm-up + Easy) | Sessions 4-5 (Moderate) | Sessions 6-7 (Hard) |
|------|------|------|
| Evaluate individual claims | Notice absences | Evaluate group reasoning |
| Acts 1-2 | Acts 2+3 | Acts 3+4, 3+5 |
| "What's wrong with what they said?" | "What didn't they think about?" | "How did the group handle disagreement?" |
| Foundation skill | Builds on foundation | Transfers to PBL teamwork |

---

## Scenario 1: Warm-Up (Hand-Crafted)

**This scenario is hand-crafted, not pipeline-generated.** It teaches the four-phase workflow with an intentionally obvious flaw.

| | |
|---|---|
| **Topic** | Whether the school should run a recycling competition between homerooms |
| **Target flaws** | 1 flaw: `big_claim_little_evidence` + `confirmation_bias` |
| **Detection acts** | Act 2 |
| **Personas** | 2 |
| **Turns** | 5-6 |

**Purpose:** Students learn the mechanics — how to select text, choose a detection act, describe what they noticed, identify a thinking behavior, and submit. The flaw is intentionally obvious so the tool doesn't get in the way of learning the process.

**Hand-crafting notes:**
- Signal moments should be stronger than real scenarios (e.g., "everyone agrees recycling competitions work" immediately after "I read one poster in the hallway")
- All artifacts must conform to the same schemas as pipeline-produced scenarios
- Save to `configs/reference/warmup/`

**What students learn:** How to use Perspectives. What it feels like to identify a flaw and explain your reasoning.

---

## Scenario 2: Easy — Act 1

### Operator Prompt

```
Topic: Whether Memphis should plant more trees along the Wolf River Greenway
to help with summer heat

Context: A 6th-grade STEM class is working on the PBL driving question: "What
are the major threats affecting our global environment, and what can our
communities do to protect our ecosystems?" This group is researching urban heat
and exploring whether planting trees along the Wolf River Greenway would help
cool their neighborhoods during Memphis's hot summers.

Instructional goals:
- Practice recognizing when someone states something confidently that isn't
  actually correct

Target complexity: 2 personas, 1 flaw-behavior combination

Target flaw: Act 1 — either misapplied_idea + anchoring_bias (a persona
misunderstands how trees cool cities) or wrong_cause + tunnel_vision (a
persona attributes cooling to the wrong mechanism). Choose whichever fits
the personas more naturally.

The personas should disagree about how tree planting works — one has a
misconception, the other questions it but doesn't push hard enough to
correct it. The discussion should be short and focused on this one question.
```

### Rationale

**Why this topic:** Memphis summers regularly exceed 100°F — students feel this personally. The Wolf River Greenway is a real place many have visited. Misconceptions about how trees cool cities (shade vs. evapotranspiration vs. reducing heat islands) surface naturally from 6th-grade-level understanding.

**Why Act 1:** This is the simplest detection act — "that's not right." Students identify one factual or conceptual error. After the warm-up's obvious Act 2 flaw, this introduces a different detection question while keeping the difficulty low.

**What students learn:** Act 1 detection: "That's not right" / "That's not how it works." The difference between a persona being confident and a persona being correct.

### Design Notes

- Only 1 flaw — keep it focused. This is students' first real scenario.
- The factual/conceptual error should be something a 6th grader could catch with general knowledge — not something requiring specialized science knowledge.
- The other persona should briefly question the misconception, creating contrast that makes the error visible. Total silence from the other persona makes the flaw harder to notice.

---

## Scenario 3: Easy — Act 2

### Operator Prompt

```
Topic: Whether the school cafeteria should switch to compostable trays to
reduce plastic waste

Context: A 6th-grade STEM class is working on the PBL driving question: "What
are the major threats affecting our global environment, and what can our
communities do to protect our ecosystems?" This group is investigating plastic
waste at school and found out that some schools have switched to compostable
trays. They're discussing whether their school should do the same.

Instructional goals:
- Practice evaluating whether someone's evidence is strong enough to support
  their claims

Target complexity: 2 personas, 1-2 flaw-behavior combinations

Target flaws: Act 2 — big_claim_little_evidence + confirmation_bias as the
primary flaw. Optionally add one_example_as_proof + echo_chamber if the plan
supports it naturally. Don't force the second flaw.

The personas should have different views on the evidence — one is convinced
by limited research, the other is more skeptical. The skeptical persona
should ask probing questions about the evidence before being won over.
The discussion is about one question: is the evidence strong enough?
Keep it focused and concise.
```

### Rationale

**Why this topic:** Every student eats in the cafeteria. They have direct experience with the trays. Evidence claims about composting impact are easy to overstate from a single source or one school's experience.

**Why Act 2 again:** Students practiced this detection act in the warm-up with training wheels. Now they apply it to natural language with realistic signal moments. The optional second flaw lets students who are ready find more without overwhelming others.

**What students learn:** Act 2 detection with realistic signal moments. The difference between "they found something interesting" and "they proved something." If two flaws are targeted, students start noticing that a discussion can have multiple problems.

### Design Notes

- The optional second flaw (`one_example_as_proof`) should only be included if the plan supports it naturally. Don't force both.
- The skeptical persona should ask at least one probing question about the evidence before accepting it — this creates the contrast that makes the thin evidence visible.
- Signal moments should be present but not as obvious as the warm-up. Mia-from-the-warm-up said "everyone agrees" — here, the overconfidence should be subtler.

---

## Scenario 4: Moderate — Acts 2+3

### Operator Prompt

```
Topic: Whether Memphis neighborhoods should build community gardens on vacant
lots to improve food access

Context: A 6th-grade STEM class is working on the PBL driving question: "What
are the major threats affecting our global environment, and what can our
communities do to protect our ecosystems?" This group is researching food
access in Memphis, where some neighborhoods like South Memphis and Frayser
have limited access to fresh food. They're discussing whether converting
vacant lots into community gardens would help.

Instructional goals:
- Practice evaluating whether evidence supports a claim
- Practice noticing when a plan is missing important practical details

Target complexity: 2 personas, 2 flaw-behavior combinations

Target flaws:
- Act 2: big_claim_little_evidence + emotional_reasoning (one persona
  overstates the impact of community gardens based on limited research,
  driven by genuine excitement about helping their community)
- Act 3: missing_practical_details + tunnel_vision (the plan is enthusiastic
  but doesn't address cost, maintenance, winter growing, or land ownership)

The personas should disagree about something substantive — not just different
focuses, but different positions. One might believe the garden will
transform the neighborhood; the other might want the garden but worry about
whether it's realistic. At least one persona should briefly surface a
practical concern before being redirected — the omission should be visible
through contrast, not total silence.

The discussion is about one question: should they build the garden? It ends
when they decide or fail to decide. Don't extend into what to grow, how to
publicize it, or what other groups are doing.
```

### Rationale

**Why this topic:** Memphis has real food desert issues — age-appropriate for 6th graders without requiring specialized knowledge. Community gardens are concrete and plannable, which makes the missing details noticeable.

**Why Acts 2+3:** This is the first two-flaw scenario and the first time students encounter Act 3 (something's missing). Act 3 is fundamentally different — it requires noticing what *isn't* there, not evaluating what is. Pairing it with a familiar Act 2 flaw gives students one anchor point.

**What students learn:** Act 3 detection: "They didn't think about ___." The skill of noticing absences. Two-flaw scenarios require sustained attention across the transcript.

### Design Notes

- **Critical:** The omission flaw must use contrast — at least one persona surfaces a practical concern before being redirected. Total absence of any practical thought across all turns makes the flaw cartoonish. (Per Phase 6.1 anti-pattern guidance.)
- The `emotional_reasoning` behavior should come through in the persona's character — genuine excitement about helping their community, not performative enthusiasm.
- The evidence claim should be briefly challenged before being accepted — don't let it go completely unchallenged.

---

## Scenario 5: Moderate — Acts 2+3 (Different Pairing)

### Operator Prompt

```
Topic: Whether the school should organize a cleanup day at McKellar Lake or
T.O. Fuller State Park

Context: A 6th-grade STEM class is working on the PBL driving question: "What
are the major threats affecting our global environment, and what can our
communities do to protect our ecosystems?" This group is planning a
community action project and wants to organize a cleanup day at a local
park. They're debating which location and how to organize it.

Instructional goals:
- Practice evaluating the strength of someone's sources
- Practice noticing when important people or perspectives are missing from
  a plan

Target complexity: 2 personas, 2 flaw-behavior combinations

Target flaws:
- Act 2: weak_source_strong_claim + overreliance_on_authority (one persona
  treats a single adult's enthusiastic opinion — maybe a teacher or parent
  — as if it settles the question)
- Act 3: missing_people + tunnel_vision (the group plans the cleanup without
  considering who else uses the park, the park service, or the community
  that lives nearby)

The personas should disagree about how to decide — one wants to go with what
the trusted adult said, the other wants to think it through more carefully.
When the missing_people flaw surfaces, at least one persona should briefly
wonder "should we ask anyone else?" before the group moves past it.

Keep the discussion focused on one decision: which park and how to organize
the cleanup. Don't drift into what to do with the collected trash, future
projects, or school-wide campaigns.
```

### Rationale

**Why this topic:** McKellar Lake and T.O. Fuller State Park are local parks students may have visited. Planning a cleanup is concrete. The "missing people" flaw surfaces naturally — who uses this park? Did they ask?

**Why Acts 2+3 again:** Students need a second exposure to Act 3 before the difficulty jumps. `missing_people` is a different kind of absence than `missing_practical_details` — it's about *who* wasn't consulted, not *what* wasn't planned. A different Act 2 flaw (`weak_source_strong_claim` instead of `big_claim_little_evidence`) broadens their detection act experience.

**What students learn:** Different Act 3 patterns feel different. `missing_people` asks "who didn't they talk to?" while `missing_practical_details` asks "how would that actually work?" A new Act 2 flaw introduces the idea that sources have different strengths.

### Design Notes

- The `overreliance_on_authority` behavior should be realistic — a 6th grader trusting their teacher's opinion isn't unreasonable, but treating one person's enthusiasm as proof is a flaw. The other persona should ask "but did they actually look into it?" or similar before accepting it.
- The missing_people flaw should use contrast — at least one persona should briefly wonder whether they should talk to the park service or nearby residents.

---

## Scenario 6: Moderate-Hard — Acts 3+5

### Operator Prompt

```
Topic: Whether Memphis should ban single-use plastic bags at grocery stores
like other cities have

Context: A 6th-grade STEM class is working on the PBL driving question: "What
are the major threats affecting our global environment, and what can our
communities do to protect our ecosystems?" This group is researching plastic
waste reduction policies. They've learned that some cities have banned
single-use plastic bags and are debating whether Memphis should do the same.

Instructional goals:
- Practice noticing when a plan only considers the positives
- Practice recognizing when someone raises a good point but the group drops
  it without really addressing it

Target complexity: 2 personas, 2 flaw-behavior combinations

Target flaws:
- Act 3: missing_downsides + tunnel_vision (one persona is so focused on the
  environmental benefit that they never consider the cost impact on families
  who rely on cheap bags)
- Act 5: abandoned_concern + groupthink (the other persona raises a valid
  concern about equity but gives in because they don't want to hold things up)

The personas must disagree substantively — one sees the ban as obviously good
for the environment, the other worries about how it would affect families
who depend on free bags. This is a real conflict, not different motivations
toward the same conclusion.

The persona who raises the equity concern should push back multiple times
before capitulating. Each moment of yielding should feel different — a
progression from reluctant agreement, to visible discomfort or social
pressure ("I don't want to be the one holding this up"), to self-interruption
(starting to raise the concern again and stopping mid-sentence).

Any compromise offered should be visibly lopsided — a student should be able
to see the gap between what was asked for and what was accepted.

The discussion is about one question: should Memphis ban plastic bags? It
ends when they reach a decision or one person gives up. Don't extend into
alternative policies, what other cities did, or how to publicize the ban.
```

### Rationale

**Why this topic:** Real policy debate that's age-appropriate. Creates natural persona disagreement — environmental benefit vs. cost impact on families. The equity dimension (plastic bag bans disproportionately affect lower-income households) is real in Memphis and gives the "abandoned concern" genuine weight.

**Why Acts 3+5:** This is the first interaction flaw. Students must track not just what individuals say but how the group handles disagreement. `abandoned_concern` requires following one persona's objection across turns and noticing it gets dropped. This is fundamentally different from Acts 1-3.

**What students learn:** Act 5 detection: "They agreed but didn't actually solve the problem." The skill of tracking group dynamics — noticing when someone gives in rather than being convinced. This transfers directly to students' own PBL teamwork.

### Design Notes

- **Critical:** Personas must disagree substantively — different positions, not just different focuses. (Per Phase 6.1 guidance.)
- **Critical:** Capitulation should use varied signal types across turns — not the same giving-in tone repeated. (Per Phase 6.3 guidance.)
- **Critical:** Any compromise offered should be visibly lopsided — a student should be able to see the gap between what was asked for and what was offered. (Per Phase 6.3 guidance.)
- The Act 5 flaw needs arc space — the concern must be raised, challenged, deflected, and eventually abandoned across multiple turns. Don't rush the capitulation into one or two turns.

---

## Scenario 7: Hard — Acts 3+4

### Operator Prompt

```
Topic: Whether the school district should spend money on solar panels or on
fixing the buildings' insulation first

Context: A 6th-grade STEM class is working on the PBL driving question: "What
are the major threats affecting our global environment, and what can our
communities do to protect our ecosystems?" This group is researching how
schools can reduce their environmental impact. They've learned that their
school district has money for one energy project and are debating between
installing solar panels (visible, exciting, renewable energy) and fixing
the buildings' old insulation (less exciting but might save more energy and
make classrooms more comfortable). The key tension is that both options are
good, but they're competing for the same limited budget.

Instructional goals:
- Practice noticing when a plan only works under certain conditions
- Practice recognizing when a group's conclusion goes beyond what they
  actually showed

Target complexity: 2-3 personas, 2 flaw-behavior combinations

Target flaws:
- Act 3: missing_conditions + black_and_white_thinking (one persona treats
  solar panels as the obvious answer without considering what needs to be true
  for them to work — roof condition, installation timeline, whether the energy
  savings actually exceed insulation savings)
- Act 4: conclusion_exceeds_evidence + emotional_reasoning (the group's final
  conclusion claims much more than their discussion actually established —
  e.g., "solar panels will transform our school's environmental impact" when
  they only compared two options without real data)

The personas should genuinely disagree — this is a real tradeoff where both
options are defensible. The discussion should feel like a debate about
priorities, not one side being obviously right.

For the conclusion_exceeds_evidence flaw, the final claim should sound
satisfying and confident but visibly overshoot what the discussion actually
established. A student should be able to mentally compare "what they said
they proved" against "what they actually discussed" and see the gap.

Keep the discussion focused on one decision: solar panels or insulation?
It ends when they decide or fail to decide. Don't extend into other energy
projects, fundraising, or school policy beyond this one budget decision.
```

### Rationale

**Why this topic:** Forces a real tradeoff — not "should we help the environment?" (easy to agree on) but "which way should we help, given limited money?" Memphis school buildings are old and the climate is extreme (hot summers, cold winters), making both options defensible. Students may have experienced uncomfortable classrooms, making the insulation argument relatable.

**Why Acts 3+4:** This is the most analytically demanding combination. `conclusion_exceeds_evidence` requires students to compare the group's final claim against what they actually established — a scale jump visible only by tracking the discussion's logic from beginning to end. `missing_conditions` adds the skill of asking "what needs to be true for this to work?"

**What students learn:** Act 4 detection: "That doesn't match" / "The ending doesn't follow from what they showed." The skill of comparing conclusions to evidence. This is the most transferable skill for students' own research and argument construction.

### Design Notes

- The tradeoff structure is key — both options must be genuinely defensible, not a clear right answer.
- `conclusion_exceeds_evidence` works best when the final turn makes a sweeping claim that *sounds* satisfying but overshoots what the discussion established. The gap should be visible to a student who mentally replays the evidence.
- The missing_conditions flaw should use contrast — at least one persona should ask "but what if the roof can't hold them?" or similar before the group moves past it.
- Consider 3 personas for this scenario — a third voice can create more dynamic debate around the tradeoff.

---

## Taxonomy Coverage

By the end of the sequence, students have encountered:

**All 5 detection acts:**
- Act 1 (something's wrong): Scenario 2
- Act 2 (not enough support): Scenarios 1, 3, 4, 5
- Act 3 (something's missing): Scenarios 4, 5, 6, 7
- Act 4 (doesn't fit together): Scenario 7
- Act 5 (not really resolved): Scenario 6

**6 of 8 thinking behaviors:**
- `confirmation_bias`: Scenarios 1, 3
- `anchoring_bias` or `tunnel_vision`: Scenario 2
- `emotional_reasoning`: Scenarios 4, 7
- `tunnel_vision`: Scenarios 4, 5, 6
- `overreliance_on_authority`: Scenario 5
- `echo_chamber`: Scenario 3 (if optional second flaw is used)
- `groupthink`: Scenario 6
- `black_and_white_thinking`: Scenario 7

**Not covered:** `echo_chamber` (only if Scenario 3's optional second flaw is skipped). The operator can address this by adding a supplementary scenario or adjusting a pairing.

## Notes

- The two existing scenarios (`ocean_plastic_campaign` and `deforestation_reforestation`) were test scenarios for pipeline validation. They can be used as supplementary material but are not part of this sequence.
- Topics can be swapped for other schools or PBL units. The progression logic (Acts 1-2 → Act 3 → Acts 4-5) and flaw-behavior pairings are reusable.
- If a transcript scores below 4 on the pedagogical reviewer, read the `revision_strategy`. It will tell you what needs to change and at what level (plan, prompt, or flaw selection).
