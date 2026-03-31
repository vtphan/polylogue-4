# Polylogue v5 — Design Proposal

This document captures the pedagogical redesign discussed for the next version of Polylogue. It covers the motivations for change, the new flaw taxonomy, the revised phase structure, and the redefined role of AI in the system.

## Motivation

Polylogue v4 asks students to simultaneously detect argument flaws (find them in the transcript) and classify them (match to a detection act category). This creates excessive cognitive load for 6th graders. The detection act taxonomy (5 categories, 19 flaw patterns) contains overlapping categories that blur under student cognition — distinctions like "not enough support" vs "something's missing" are epistemologically meaningful but practically indistinguishable for the target age group.

Additionally, v4's Phase 2 asks students to match flaws to a thinking behavior library (8 behaviors), several of which are redundant (confirmation bias ≈ echo chamber ≈ tunnel vision) and all of which require inferring internal psychological states from external text — a task that challenges even adults.

The v5 redesign separates the learning progression into clear cognitive steps, simplifies the taxonomy, and repositions AI from a late-stage reveal to scaffolding infrastructure throughout the experience.

## Flaw Taxonomy (Layer 1)

### Design Principles

The taxonomy must be:

- **Orthogonal** — each category tests a different dimension; a flaw can only belong to one
- **Complete** — every argument flaw in a group discussion fits into one category
- **Formal** — uses precise terminology, appropriate because students encounter the taxonomy *after* articulating flaws in their own words (Phase 1), not before

### The Four Categories

| Category | Dimension | The test | Student question |
|---|---|---|---|
| **Faulty Reasoning** | Logic | Is the reasoning valid? | "Is what they said actually logical?" |
| **Insufficient Evidence** | Evidence | Is the claim supported? | "Did they really prove that?" |
| **Incomplete Consideration** | Scope | Is the analysis thorough? | "What did they leave out?" |
| **Social Pressure** | People | Is the discussion honest? | "Did someone just go along with it?" |

### Orthogonality Argument

The four categories evaluate four fundamentally different aspects of argumentation:

- **Logic** — the inferential structure connecting premises to conclusions
- **Evidence** — the quantity and quality of support for claims
- **Scope** — the breadth of factors, perspectives, and consequences considered
- **People** — the integrity of the social process by which the group reached conclusions

Each requires a different cognitive operation from the student: logic checking, evidence evaluation, scope analysis, and social awareness. No two categories ask the same question about the same thing.

### Coverage

The four categories absorb all 19 flaw patterns from v4:

| Category | v4 patterns absorbed |
|---|---|
| Faulty Reasoning | factual_error, misapplied_idea, wrong_cause, correlation_as_causation, parts_contradict, solution_doesnt_match_problem |
| Insufficient Evidence | big_claim_little_evidence, one_example_as_proof, weak_source_strong_claim, guess_treated_as_fact, conclusion_exceeds_evidence |
| Incomplete Consideration | missing_practical_details, missing_people, missing_downsides, missing_conditions |
| Social Pressure | abandoned_concern, fake_agreement, steamrolled, harmony_over_accuracy |

### Why Not Fewer?

Three categories (Faulty Reasoning, Insufficient Evidence, Incomplete Consideration) cover all *argument quality* flaws completely. Social Pressure was considered for removal since it evaluates people rather than arguments. However, it addresses a real and distinct dimension of group discussions — moments where someone *had* a valid point but yielded to social dynamics. Recognizing this is a critical skill for students' own PBL teamwork and group discussions. The category also naturally absorbs four flaw patterns that resist classification into the other three.

### Why Not More?

Additional candidates were evaluated and rejected:

- **Relevance** (argument doesn't address the question) — rare in the designed transcripts and subsumable under Faulty Reasoning
- **Consistency** (argument contradicts itself) — absorbed by Faulty Reasoning
- **Intellectual honesty** — too abstract; Social Pressure captures the observable manifestation

## Thinking Behaviors (Layer 2)

### Design Decision: No Student-Facing Taxonomy

In v4, students selected from an 8-item thinking behavior library. This had multiple problems:

1. **Redundancy** — confirmation bias, echo chamber, tunnel vision, and anchoring bias all describe the same fundamental error (narrow information intake) at different levels of description
2. **Many-to-many mapping** — any behavior can produce any flaw, making "pick the right one" a poor exercise
3. **Psychological inference** — mapping from observable text to internal cognitive states is genuinely advanced, beyond what a taxonomy picker can scaffold

In v5, **students never interact with a thinking behavior taxonomy**. Instead:

- Students write free-text explanations of why they think the person made the mistake (Phase 3 individual work)
- Students discuss their explanations with peers (Phase 3 peer discussion)
- The AI presents a formal analysis using cognitive science terminology (Phase 3 AI reveal)
- Students evaluate the AI's reasoning against their own

### The Thinking Behavior Library (Pipeline Infrastructure)

The thinking behavior library still exists, but as **authoring infrastructure** — used by the pipeline to generate rich AI explanations, not as a student-facing selection list. Because it's no longer constrained by student usability, it can be as comprehensive and nuanced as needed.

The library should draw from established cognitive science:

- **Cognitive biases** — confirmation bias, anchoring, availability heuristic, etc.
- **Cognitive distortions** (from CBT) — overgeneralization, emotional reasoning, black-and-white thinking, catastrophizing, etc.
- **Social dynamics** — groupthink, conformity pressure, authority deference, diffusion of responsibility, etc.

The AI uses this library to select the most relevant behavior for a given flaw and generate a student-accessible explanation that introduces the formal term in context. For example:

> "This looks like **confirmation bias** — Maya only looked for sources that agreed with her, and ignored the ones that didn't. This is a common pattern where people seek out information that confirms what they already believe."

Students encounter formal vocabulary by reading the AI's analysis, not by selecting from a list. The terms are *learned through context*, not *applied from memory*.

## Phase Structure

### Overview

v5 has **three phases**, each following the same rhythm:

1. **Individual work** — student forms their own thinking without influence
2. **Peer discussion** — student tests their thinking against classmates
3. **AI reveal + reflect** — student encounters the AI's perspective and reflects on differences

This **individual → social → expert** progression is grounded in learning science:

- **Individual before peers** prevents weaker students from simply copying
- **Peers before AI** creates genuine discussion because no one has authority; students argue on merit
- **AI last** creates cognitive conflict *after* students have committed individually and defended socially — they have skin in the game

### Phase 1: Recognize

**Cognitive task:** Noticing — "What's wrong here?"

**Student produces:** Free-text explanation for each flaw

**How it works:**

- Flaws are pre-highlighted in the transcript, one at a time, ordered from easiest to hardest (using difficulty ratings from the evaluation: most_will_catch → harder_to_spot → easy_to_miss)
- The student reads the highlighted passage and writes why they think it's a flaw
- No taxonomy, no categories, no vocabulary — just "tell me what you see"
- Students can navigate back and forward between flaws
- Progress is tracked visually

**Why this design:**

- Captures genuine, unscaffolded understanding
- Follows the "intuition before vocabulary" principle
- Removes all classification cognitive load
- Free response reveals what students actually see, not what they can match
- Produces richer data for teachers than a category pick

**Individual → Peers → AI rhythm:**

1. Student writes explanations for all highlighted flaws
2. Teacher transitions to peer discussion — students see each other's explanations and discuss
3. Teacher reveals AI's explanations — students compare to their own and peers'

### Phase 2: Classify

**Cognitive task:** Categorizing — "What kind of flaw is this?"

**Student produces:** Category selection (one of four) for each flaw

**How it works:**

- Students revisit each flaw with their Phase 1 explanation visible
- They match each flaw to one of the four categories: Faulty Reasoning, Insufficient Evidence, Incomplete Consideration, Social Pressure
- This is a matching exercise, not cold classification — students are matching their own words to a formal category
- The learning moment is: "Oh, what I described is called Insufficient Evidence"

**Why this design:**

- Vocabulary is introduced *after* students have already engaged with the flaw in their own words
- The four categories are orthogonal, so there is a defensible correct answer
- Students build formal vocabulary for concepts they already understand intuitively

**Individual → Peers → AI rhythm:**

1. Student classifies all flaws
2. Teacher transitions to peer discussion — students see each other's classifications, discuss disagreements
3. Teacher reveals AI's classifications — students compare, reflect on any differences

### Phase 3: Explain

**Cognitive task:** Perspective-taking — "Why did they think this way?"

**Student produces:** Free-text explanation of the underlying thinking error

**How it works:**

- Students revisit each flaw with their Phase 1 explanation and Phase 2 classification visible
- They write why they think the person made this mistake — what was going on in their thinking?
- No taxonomy to select from — free response only
- This is the deepest cognitive work: inferring motivation from behavior

**Why this design:**

- Perspective-taking is the unique pedagogical value of Polylogue — understanding *why* people reason badly, not just *that* they do
- Free response avoids the many-to-many mapping problem of the v4 behavior picker
- Students are well-prepared by this point — they've engaged with each flaw twice already

**Individual → Peers → AI rhythm:**

1. Student writes explanations for all flaws
2. Teacher transitions to peer discussion — students compare explanations, discuss where they disagree about *why* someone made a mistake
3. Teacher reveals AI's formal analysis — AI names specific cognitive biases and explains them in context. Students evaluate: "Do I agree with this? Did the AI name something I was trying to say? Do I see it differently?"

## Role of AI

### Shift from v4

In v4, the AI was a **Phase 4 reveal** — students did all their work, then saw the AI's perspective as a final step. The AI was one phase of four.

In v5, the AI is **scaffolding infrastructure** — present throughout, revealed progressively at the end of each phase.

### What the AI provides at each phase

| Phase | AI provides | Format |
|---|---|---|
| 1. Recognize | The highlighted flaws (sentence locations) + its own explanation of why each is a flaw | Highlighted passages; explanation text |
| 2. Classify | Its classification of each flaw into the 4-category taxonomy | Category label |
| 3. Explain | Formal analysis of the underlying thinking error, using cognitive science terminology | Rich explanatory text with named biases/distortions |

### AI as vocabulary teacher

The AI introduces formal terms that students encounter by reading, not selecting:

- Phase 1: AI explains flaws in accessible language (similar to what students wrote)
- Phase 2: AI uses the four formal category names (students have already matched to these)
- Phase 3: AI introduces cognitive science vocabulary — confirmation bias, groupthink, emotional reasoning, etc. — in the context of a specific flaw the student has already analyzed twice

This follows a **predict → observe → explain** model from science education: students commit to their own understanding, then encounter the expert perspective, then reconcile.

## Teacher's Role

The teacher controls transitions between modes within each phase:

| Mode | What happens | Teacher action |
|---|---|---|
| **Work** | Students do individual work | Teacher monitors progress on dashboard |
| **Discuss** | Peer explanations/classifications become visible | Teacher transitions to discussion mode |
| **Reflect** | AI perspective becomes visible | Teacher reveals AI perspective |

The teacher also uses the AI's analysis as facilitation material:

- "The AI called this confirmation bias — Maya, you said she only looked at one side. Is that the same thing?"
- "Three of you classified this as Insufficient Evidence, but one said Faulty Reasoning. Let's talk about why."
- "The AI's explanation mentions groupthink. Does anyone disagree with that?"

The formal vocabulary from the thinking behavior library lives in the **teacher's facilitation guide** and the **AI's explanations** — both reference the same rich library, giving the teacher the terminology and context needed to guide discussion.

## Pipeline Reuse from v4

Most of the v4 pipeline carries over to v5. The pipeline's core job is unchanged: design a scenario → write a discussion script → evaluate it.

### Reusable As-Is

| Component | Why it carries over |
|---|---|
| **Scenario planning** (`create_scenario`) | Topic selection, persona design, flaw targeting, context generation — the process is the same. The 4 flaw categories absorb the 19 patterns, but planning logic is unchanged. |
| **Persona design** | Personas still need strengths, weaknesses, realistic motivations, and designed flaw combinations. No structural change. |
| **Schema-driven pipeline** | YAML artifacts, validation scripts, handoffs between commands — all reusable. Schemas need field updates, not structural changes. |
| **Review/evaluation structure** | The two-pass process (script review, then evaluation) still applies. |

### Needs Modification

| Component | What changes |
|---|---|
| **Flaw pattern library** | Reorganize 19 patterns under 4 categories instead of 5 detection acts. Patterns are retained as sub-types for pipeline authoring. |
| **Thinking behavior library** | Expand from 8 behaviors to a richer inventory drawing from cognitive biases, CBT distortions, and social dynamics. No longer constrained by student usability. |
| **Dialog writer agent** (`create_script`) | Prompt updated to emphasize precise flaw locatability at the sentence level. In v4, flaws could be diffuse since students were searching. In v5, every flaw needs a clear, highlightable passage because the system highlights them for students. |
| **Evaluator agent** (`evaluate_script`) | Major update. Must produce three student-facing AI explanations per flaw (see below). |
| **Facilitation guide** | Restructured for 3 phases with 3 modes each (work → discuss → reflect), instead of 4 phases with different mechanics. |
| **Difficulty ratings** | The existing ratings (most_will_catch, harder_to_spot, easy_to_miss) were calibrated for the detection task. With flaws pre-highlighted, difficulty shifts to classification and explanation. May need recalibration. |

### New: Student-Facing AI Content

The evaluator must produce three distinct AI outputs per flaw, revealed progressively across phases:

| Phase | AI output | Purpose | Tone |
|---|---|---|---|
| 1. Recognize | Flaw explanation | "Why is this a flaw?" | Student-accessible, plain language |
| 2. Classify | Classification with reasoning | "What category and why?" | Uses the 4 formal category names |
| 3. Explain | Thinking behavior analysis | "What cognitive pattern caused this?" | Introduces formal terminology (confirmation bias, groupthink, etc.) in context |

The current evaluation has `argument_flaw.explanation` and `thinking_behavior.explanation`, but these were written for the teacher's facilitation guide. v5 needs student-facing versions calibrated for 6th-grade reading level.

### Removed: Pedagogical Reviewer

The learning scientist agent (pedagogical reviewer) in `create_scenario` is removed from the initial v5 pipeline. With a simpler taxonomy (4 categories instead of 5 × 19), there is less to get wrong in scenario design. The reviewer added a round-trip that slowed iteration without proportionate benefit.

The approach for v5 is: generate scripts, test with real students, and add the reviewer back if a pattern of problematic scenarios emerges. Validate through use, not through AI reviewing AI.

## Summary of Changes from v4

| Aspect | v4 | v5 |
|---|---|---|
| Flaw taxonomy | 5 detection acts, 19 patterns, overlapping | 4 orthogonal categories |
| Thinking behaviors | 8-item student-facing picker | Rich library, AI-facing only |
| Phase count | 4 (different mechanics each) | 3 (same rhythm each) |
| Phase rhythm | Varies per phase | Consistent: individual → peers → AI |
| Student finds flaws? | Yes (sentence selection) | No (pre-highlighted) |
| Student classifies flaws? | Phase 1 (cold, before understanding) | Phase 2 (after articulating in own words) |
| Student names biases? | Phase 2 (picks from list) | Never (reads AI's analysis) |
| AI role | Phase 4 reveal | Scaffolding throughout |
| Cognitive load | High (detect + classify simultaneously) | Progressive (notice → categorize → explain) |
| Pedagogical reviewer | Required in pipeline | Removed; validate through testing |
| Dialog writer focus | Flaws can be diffuse | Flaws must be precisely highlightable |
| Evaluator output | Teacher-facing explanations | Teacher-facing + 3 student-facing explanations per flaw |
| Pipeline reuse | — | ~70% reusable; main changes in evaluator and dialog writer |

## Open Questions

1. **Flaw pattern library** — The 19 patterns from v4 are absorbed into 4 categories. Should the individual patterns be retained as sub-types within each category for pipeline authoring, or should the pipeline work directly with the 4 categories?

2. **Thinking behavior library scope** — How comprehensive should the behind-the-scenes library be? It could range from the current 8 behaviors to a much larger inventory drawn from cognitive science literature. The constraint is quality of AI-generated explanations, not student cognitive load.

3. **Difficulty calibration** — The existing difficulty ratings (most_will_catch, harder_to_spot, easy_to_miss) were calibrated for the v4 detection task. With flaws pre-highlighted, difficulty shifts to the *classification* and *explanation* tasks. The ratings may need recalibration.

4. **Peer discussion mechanics** — How much of the peer discussion happens in-app vs in person? v4 had in-app peer comparison. v5's emphasis on discussion may favor teacher-facilitated in-person discussion with the app providing data visibility.

5. **Assessment** — With Phases 1 and 3 producing free-text responses, assessment shifts from "did they pick the right category" to "does their explanation demonstrate understanding." This is richer but harder to evaluate automatically. What role does the AI play in helping teachers assess free-text responses?

6. **Timeline** — v5 is a ground-up rebuild of the phase structure, flaw model, and AI integration. The pipeline (scenario generation, script writing, evaluation) also needs revision to produce the new AI explanation formats. Implementation sequencing TBD.
