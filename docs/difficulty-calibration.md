# Difficulty Calibration and Differentiation

How the system makes flaws easier or harder to detect, and how it addresses differences in student ability.

---

## Expected Flaw Count

Each generated discussion targets 1-3 flaw-behavior combinations. The evaluator may also annotate emergent flaws beyond the plan. A typical discussion has 2-3 annotated flaws total. Early scenarios should start with 1-2 targets to validate the approach before adding complexity.

---

## Design-Time Tuning

These levers are set when the scenario is created. They are baked into the generated artifacts and cannot be changed during a session.

### 1. Flaw Selection (`create_scenario` -- `target_flaws`)

Not all flaws are equally hard to spot:

| Difficulty | Detection acts | Why |
|-----------|---------------|-----|
| Easier | Act 1 (something's wrong), Act 2 (not enough support) | Local to a single claim -- students evaluate one statement |
| Harder | Act 3 (something's missing) | Requires noticing an absence, which is inherently less visible than a present error |
| Hardest | Act 4 (doesn't fit together), Act 5 (not really resolved) | Requires cross-turn reasoning -- comparing statements or tracking group dynamics across the discussion |

Fewer target flaws also means easier. A 1-flaw scenario lets students focus; a 3-flaw scenario demands sustained attention across the transcript.

Some flaw-behavior pairings are more intuitive than others. `big_claim_little_evidence` + `confirmation_bias` is the most accessible combination (chosen for the warm-up scenario). Pairings like `parts_contradict` + `anchoring_bias` require more abstract reasoning.

### 2. Signal Moment Strength (`create_scenario` -- `accomplishes` fields)

The `accomplishes` field in the turn outline controls how overtly a persona overshoots, omits, or capitulates. Stronger wording produces more visible signal moments:

| Strength | Example `accomplishes` | Effect |
|----------|----------------------|--------|
| Strong | "Share what you found from your one article and explain why you think it settles the question" | The gap between evidence and confidence is wide and visible |
| Moderate | "Present your research findings and draw a conclusion" | The gap exists but requires closer reading |
| Subtle | "Mention your research and share your perspective" | The flaw is present but blends into natural speech |

The warm-up scenario should use strong signal moments. Later scenarios can dial back as students develop their evaluation skills.

### 3. Instructional Designer Calibration (`create_script` -- polish pass)

The instructional designer adjusts phrasing to make hooks more or less visible without changing which flaws are present or where they appear. This is fine-tuning:

- Sharpen: "the research suggests" --> "the research totally proves"
- Soften: "the research proves" --> "based on what I read, I think it proves"

The instructional designer can also adjust overconfident language, make concrete absences more noticeable, and tighten proximity for cross-turn contradictions.

### 4. Transcript Density (turn outline structure)

The spacing of flaw-surfacing turns relative to normal discussion turns affects visibility:

- Clustered flaw turns (close together) = easier to spot by contrast with surrounding conversation
- Spread flaw turns (separated by many buffer turns) = harder, because the flaw gets buried in normal discussion
- More total turns (toward the 16-turn maximum) with the same number of flaws = more dilution

---

## Runtime Tuning

These mechanisms are available during the session. The teacher deploys them based on what they observe.

### 5. Facilitation Scaffolds (teacher-mediated)

The facilitation guide provides ready-to-use scaffolds at three levels:

**Phase 1 scaffolds** (for students not finding flaws):
- Direct students to re-read specific turns with a specific detection question (e.g., "Re-read turns 5-8 with just this question: How do they know that?")
- Can be whispered to individual students or offered to the whole class

**Phase 2 scaffolds** (for students stuck on thinking behaviors):
- Narrow the choice from 8 behaviors to 2-3 relevant options
- Provide empathy-based prompts (e.g., "Imagine you're Mia -- why might she have thought that way?")
- Can be offered selectively to struggling students

**Phase 4 scaffolds** (for class discussion):
- Pre-written prompts for challenges, student victories, and missed flaws
- The teacher chooses which to deploy based on how Phase 3 went

The teacher monitoring dashboard (`student_activity` -- who hasn't started, annotation counts, last active timestamps) informs when and where to deploy scaffolds.

### 6. Peer Scaffolding (Phase 3 -- built into the activity structure)

Phase 3 is the system's primary differentiation mechanism. When students compare their annotations with groupmates:

- Students who missed a flaw see that peers found it -- the peer's annotation is itself a scaffold
- Students who found something others missed get validation
- The comparison meets each student where they are without requiring the teacher to diagnose individual gaps

Groups of 4-5 students are likely to contain a range of ability, which is intentional. Group composition is teacher-controlled and can be used strategically.

---

## What the System Does Not Currently Do

The MVP relies on teacher judgment to deploy scaffolds and on peer comparison for organic differentiation. The following are not in scope for MVP but could be considered if classroom testing reveals a need:

**Progressive hint system.** Instead of the teacher verbally delivering scaffolds, the app could offer optional student-initiated hints -- a student taps "I'm stuck" and receives the Phase 1 prompt for the easiest unfound flaw. The facilitation guide data already exists to power this; it would be a UI addition.

**Differentiated group assignment.** If the dashboard exposed prior session performance (annotation count, accuracy against AI annotations from Phase 4), the teacher could form groups intentionally for future sessions -- mixing stronger and weaker evaluators.

**Adaptive difficulty across sessions.** A progression system where early sessions use Act 1-2 flaws with strong signals and later sessions introduce Act 4-5 flaws with subtler signals. This is currently implicit in the teacher's scenario choices but could be made explicit with a recommended sequence.

---

## Design Principle

The four-phase structure with peer comparison is already a differentiation strategy -- it is social rather than algorithmic. The UMS pilot should reveal whether teacher-mediated scaffolding plus Phase 3 peer exposure is sufficient, or whether students need more in-app support. Classroom evidence should drive what gets built beyond MVP.
