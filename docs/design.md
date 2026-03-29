# Polylogue 4 — Design Document

## Overview

Polylogue 4 generates AI group discussions containing critical thinking flaws for middle school students to practice evaluating. It is designed for use at the University Middle School (UMS) in Memphis.

Teachers provide a PBL topic and instructional goals. The system generates 2-3 AI personas, designs a discussion plan targeting specific argument flaws and thinking behaviors, and produces a 12-16 turn discussion where those flaws surface naturally. Students then work through a structured four-phase activity — recognizing flaws, identifying the thinking behind them, explaining their reasoning to peers, and evaluating multiple perspectives including the AI's.

**Key differences from Polylogue 3:**

| Aspect | v3 | v4 |
|--------|----|----|
| Flaw generation | Emergent from knowledge gaps | Designed via plan, executed by personas |
| Flaw taxonomy | 4 abstract types, 20 subtypes | Argument flaws + thinking behaviors (two layers) |
| Target audience | Grades 6-8 with grade-band calibration | 6th grade only (MVP) |
| Activities | Presentations and discussions | Discussions only |
| Agents per scenario | 3-5 | 2-3 |
| Flaws per scenario | 10-15 (emergent) | 1-3 (targeted) |
| Transcript length | 20-30+ turns | 12-16 turns |
| Student app | CrossCheck (added after pipeline) | Perspectives (designed from the start) |
| Student task | Identify flaws against a taxonomy | Recognize flaws, name thinking behaviors, explain to peers, evaluate perspectives |
| Correctness framing | Flaws as errors to find | Perspectives to examine and discuss |

---

## Design Principles

1. **Plan-first flaw generation.** Flaws are designed, not emergent. `create_scenario` produces a detailed plan targeting specific argument flaws and thinking behaviors. Personas execute against the plan, bringing natural language and voice while ensuring pedagogical targets are met.

2. **Two-layer evaluation.** Students perform two distinct cognitive tasks: (a) detecting what's wrong with the argument, and (b) identifying the thinking behavior that caused it. These are scaffolded sequentially — argument flaws first, thinking behaviors second.

3. **Perspectives, not correctness.** The system values reasoned evaluation over right/wrong answers. AI annotations are presented as one perspective among many — students', peers', and AI's. Students are asked to agree, disagree, and explain — not to match a key.

4. **6th-grade language throughout.** All generated content — discussion transcripts, annotations, UI text — uses vocabulary, sentence complexity, and speech patterns appropriate for 6th graders. No grade-band variation in the MVP.

5. **Operational simplicity.** A few main commands. One discussion format. Short transcripts. Small persona count. The system prioritizes a meaningful learning experience over architectural generality.

6. **App-first design.** The student-facing app (Perspectives) is designed alongside the pipeline, not after it. Pipeline output formats serve the app's needs.

7. **Schema-driven communication.** Every handoff between commands, subagents, and the app is governed by a YAML schema that specifies exact inputs, outputs, and format. Schemas are the single source of truth for inter-agent and agent-to-app communication. No command or subagent produces free-form output — all artifacts conform to a defined schema stored in `configs/`. This ensures accurate communication across multiple rounds, multiple agents, and the app itself.

8. **Scripts for deterministic tasks.** Repetitive operations that produce the same output given the same input are performed by Python scripts, not LLM agents. LLM calls are reserved for tasks requiring intellectual judgment — generation, evaluation, validation against pedagogical criteria. Scripts are faster, cheaper, testable, and consistent. Subagents invoke scripts when they need mechanical operations (the v3 pattern), rather than performing those operations via LLM reasoning.

---

## Flaw Framework

### Two Layers

**Layer 1: Argument Flaws (what's wrong with the argument)**

These are problems in the content of what someone says — detectable by examining claims, evidence, and reasoning within the discussion.

**Layer 2: Thinking Behaviors (what's wrong with the thinking)**

These are cognitive habits and biases that produce the argument flaws — detectable by asking "why did they think that way?"

Every targeted flaw in a scenario has both layers: an argument flaw that students can spot in the text, and a thinking behavior that explains why it occurred. Students work through Layer 1 first (Phase 1), then Layer 2 (Phase 2).

### Layer 1: Argument Flaws

A curated library of concrete, nameable patterns organized by five detection acts. Each pattern is described in plain language a 6th grader can understand.

**Canonical naming.** Each pattern has two names: a **canonical ID** (lowercase, used in all schemas and pipeline artifacts, e.g., `"big claim, little evidence"`) and a **plain-language name** (student-facing, e.g., `"They're saying a lot based on very little"`). The canonical ID is the value used in `flaw_pattern` fields throughout the pipeline. The plain-language name appears only in the Perspectives app UI and student-facing annotations.

#### Act 1: Something's Wrong

**Student question:** "That's not right" / "That's not how it works"

The student recognizes that a specific claim is factually incorrect or distorted.

| Pattern | Plain-language name | What it looks like |
|---------|--------------------|--------------------|
| Factual error | "That's not true" | A specific claim that is verifiably wrong |
| Misapplied idea | "That's not what that means" | Using a concept or term incorrectly |
| Wrong cause | "That's not why it happens" | Asserting a cause-effect relationship that doesn't hold |

#### Act 2: Not Enough Support

**Student question:** "How do they know that?" / "That's a big claim from not much proof"

The student notices that a claim is bigger than the evidence behind it.

| Pattern | Plain-language name | What it looks like |
|---------|--------------------|--------------------|
| Big claim, little evidence | "They're saying a lot based on very little" | Sweeping conclusion from one or two data points |
| One example as proof | "That's just one example" | A single anecdote, interview, or source treated as settling the question |
| Correlation as causation | "Just because two things happened together doesn't mean one caused the other" | Two things co-occurring treated as one causing the other |
| Weak source, strong claim | "That's not a strong enough source for that claim" | A weak source (news article, one opinion) treated as definitive evidence |
| Guess treated as fact | "They're acting like they know but they're just guessing" | Stating something with certainty when it's really a guess or assumption |

#### Act 3: Something's Missing

**Student question:** "They didn't think about ___" / "What about ___?"

The student notices that an important consideration is absent.

| Pattern | Plain-language name | What it looks like |
|---------|--------------------|--------------------|
| Missing practical details | "How would that actually work?" | No consideration of cost, time, space, or implementation |
| Missing people | "They didn't ask ___" | Only consulting one person or group when others are clearly affected |
| Missing downsides | "They only talked about the good stuff" | Presenting only positives with no tradeoffs or risks |
| Missing conditions | "That only works if ___" | Not considering what needs to be true for the plan to work |

#### Act 4: Doesn't Fit Together

**Student question:** "That doesn't match" / "The ending doesn't follow from what they showed"

The student compares two parts of the discussion and notices they don't align.

| Pattern | Plain-language name | What it looks like |
|---------|--------------------|--------------------|
| Conclusion exceeds evidence | "They're claiming way more than they showed" | The final claim goes far beyond what the discussion established |
| Parts contradict | "Wait, that's the opposite of what they said before" | Different speakers or moments present conflicting information |
| Solution doesn't match problem | "That doesn't solve what they said the problem was" | The proposed action doesn't address the stated goal |

#### Act 5: Not Really Resolved

**Student question:** "They agreed but didn't actually solve the problem" / "Someone had a good point but the group just dropped it"

The student notices that the group's process of reaching a conclusion was flawed.

| Pattern | Plain-language name | What it looks like |
|---------|--------------------|--------------------|
| Abandoned concern | "Someone raised a good point but gave up on it" | A valid point is dropped after pushback without being addressed |
| Fake agreement | "They said they agreed but they actually didn't" | The group "agrees" but members have unresolved contradictions |
| Steamrolled | "One person just kept talking louder until everyone gave in" | A less confident member yields not because they were wrong but because they couldn't sustain the argument |
| Harmony over accuracy | "They just wanted everyone to feel included, not to get it right" | The group prioritizes everyone feeling good over actually solving the problem |

### Layer 2: Thinking Behaviors

A curated library of cognitive patterns, drawn from cognitive science and bias research, named in plain language with formal terms available for teacher reference.

**Intentional mix of individual and social behaviors.** The library includes both individual cognitive patterns (how a person processes information on their own) and social dynamics (how group interaction distorts thinking). Both are needed: individual biases transfer to students' own reading, researching, and opinion-forming; social biases transfer to their PBL teamwork, group discussions, and consensus-building. In a 2-3 persona discussion, individual biases surface in what a persona *says* (their claims and reasoning), while social biases surface in how personas *interact* (how they respond to challenges and reach agreement).

| Thinking behavior | Plain-language name | What it looks like | Formal term |
|-------------------|--------------------|--------------------|-------------|
| Only seeing what you want to see | "They only paid attention to things that agreed with them" | Seeking, favoring, or remembering only information that confirms existing beliefs; ignoring or dismissing contradictory evidence | Confirmation bias |
| Sticking with the first thing you heard | "They got stuck on the first thing they heard and couldn't let go" | Over-relying on the first piece of information encountered, letting it shape all subsequent thinking | Anchoring bias |
| Feelings instead of evidence | "They believed it because they felt strongly, not because they had proof" | Making conclusions based on emotions, enthusiasm, or personal investment rather than on evidence and logic | Emotional reasoning |
| All-or-nothing thinking | "They acted like it was either totally great or totally terrible" | Seeing things in only two categories — good or bad, right or wrong — without recognizing nuance or middle ground | Black-and-white thinking |
| Going along with the group | "They just went along with everyone else instead of thinking for themselves" | Suppressing independent thinking to maintain group harmony; conforming to the majority without critical evaluation | Groupthink |
| Trusting the speaker, not the evidence | "They believed it because of who said it, not because the evidence was good" | Accepting claims based on the speaker's confidence, role, or authority rather than evaluating the evidence independently | Overreliance on authority |
| Only hearing one side | "They only looked at sources and opinions that agreed with them" | Surrounding oneself with information that reinforces existing views; not seeking out different perspectives | Echo chamber effect |
| Narrow focus | "They only focused on one part and missed the bigger picture" | Concentrating on a single aspect while ignoring other relevant factors; inability to see the full scope of the issue | Tunnel vision |

### Flaw-Behavior Mapping

The relationship between argument flaws and thinking behaviors is **many-to-many** — the same argument flaw can arise from different thinking behaviors, and the same thinking behavior can produce different argument flaws. This is by design: it supports the Perspectives framing, where students may identify different (but defensible) thinking behaviors behind the same flaw.

**How the mapping works at each layer:**

| Layer | Mapping | Why |
|-------|---------|-----|
| **Generation** (create_scenario) | One specific combination per target flaw | The plan needs precision to guide persona generation |
| **Evaluation** (evaluate_script) | Primary behavior + plausible alternatives | The AI perspective suggests one, acknowledges others are defensible |
| **Student-facing** (Perspectives app) | Open — student selects and explains | Supports perspective-taking and reasoned discussion; multiple answers can be valid |

**Example: "Big claim, little evidence" can be caused by different behaviors:**

| Thinking behavior | How it produces this flaw |
|---|---|
| Confirmation bias | They only sought evidence that agreed with them, so they ended up with very little |
| Tunnel vision | They were so focused on one angle they didn't look for more evidence |
| Overreliance on authority | They found one expert who agreed and stopped looking |

**Example: Confirmation bias can produce different argument flaws:**

| Argument flaw | How confirmation bias produces it |
|---|---|
| Big claim, little evidence | Only finding sources that support the view |
| Missing downsides | Ignoring negative information about the preferred solution |
| Abandoned concern | Dismissing a peer's valid objection because it challenges their belief |

### Flaw-Behavior Combination Library

Each scenario targets specific combinations from the two libraries. These predefined pairings ensure pedagogical coherence — the argument flaw is what students detect, and the thinking behavior explains why it occurred.

Example combinations:

| Argument flaw | Thinking behavior | What it looks like in a discussion |
|---------------|------------------|------------------------------------|
| Big claim, little evidence | Confirmation bias | A persona finds one source that supports their view and treats it as conclusive proof, ignoring other information |
| One example as proof | Overreliance on authority | A persona interviews one enthusiastic adult and treats their opinion as settling the question |
| Missing downsides | Tunnel vision | A persona is so focused on one benefit that they never consider any risks or drawbacks |
| Abandoned concern | Groupthink | A persona raises a valid objection but backs down because the rest of the group isn't receptive |
| Correlation as causation | Feelings instead of evidence | A persona is personally invested in the project and assumes their positive experience caused the positive results |
| Fake agreement | Going along with the group | Personas "agree" on a plan that papers over contradictions because no one wants to be the holdout |

The full combination library will be expanded as scenarios are developed. Not every combination is equally productive — some pairings are natural and some are forced. The library should grow from what works in practice.

---

## Signal Moments

**The problem:** Flaws must be detectable by 6th graders without being cartoonish. In the v3 transcripts, flaws were analytically present but practically invisible — they blended too seamlessly into natural speech. The opposite extreme — personas saying obviously wrong things in obviously wrong ways — destroys the realism that makes the activity meaningful. The challenge is finding the middle ground: flaws that sound natural but contain hooks a student's intuition can catch.

**What a signal moment is:** A specific phrasing, word choice, or conversational move that creates a friction point — a moment where a student might think "wait, something's off here" without the flaw being labeled or announced. Signal moments activate the detection questions (the five acts) by making the gap between claim and support, or between what was said and what was left out, *visible at the surface level of language*.

### Principles

1. **Overconfident language is the primary signal.** When a persona says "studies prove," "everyone knows," "there's no reason it wouldn't work," or "the research is clear" — and the evidence behind it is thin — the gap between confidence and support creates a detectable hook. The persona isn't wrong to be confident (they believe what they're saying), but the language overshoots what the evidence can bear.

2. **Concrete absence is more detectable than abstract absence.** A student can notice "they never said how much it costs" (concrete) more easily than "they didn't consider confounding variables" (abstract). For Act 3 (something's missing), the plan should ensure the missing thing is something a 6th grader would naturally think of.

3. **Proximity makes contradictions visible.** For Act 4 (doesn't fit together), contradictions or disconnects are easier to spot when the conflicting statements are close together — within a few turns, not separated by the entire transcript.

4. **Explicit capitulation signals abandonment.** For Act 5 (not really resolved), the moment where a persona yields should use visible language: "Okay fine," "I guess you're right," "Let's just go with it." These phrases signal that the persona is giving in, not being convinced — a hook for students to notice the concern was dropped, not addressed.

5. **Signal moments are designed in the plan, not left to emergence.** The `accomplishes` field in the turn outline should steer personas toward producing signal moments. This is not about scripting exact words — it's about creating conditions where the persona's natural voice, filtered through their strengths and weaknesses, produces language that overshoots, omits, or capitulates in detectable ways.

### Examples by Detection Act

| Act | Signal moment type | Example phrasing | Why it's detectable |
|-----|-------------------|-------------------|---------------------|
| Act 1: Something's wrong | Confident assertion of a misconception | "Marigolds keep all the bugs away, so they're basically protecting the whole garden" | "All the bugs" is visibly too strong — students who know anything about insects can catch it |
| Act 2: Not enough support | Authority language from thin evidence | "The research proves that gardens work — I read two articles about it" | "The research proves" followed immediately by "two articles" — the gap is in the same sentence |
| Act 3: Something's missing | Enthusiastic plan with no practical details | "We'll build the garden and students will take care of it and the food goes to the cafeteria!" | A student naturally asks: how much? where? who does it in summer? The enthusiasm highlights the absence |
| Act 4: Doesn't fit together | Conclusion that visibly exceeds findings | "Our findings showed students ate more vegetables... so the garden will completely transform how our school approaches healthy eating" | "Ate more vegetables" → "completely transform" is a scale jump a student can see |
| Act 5: Not really resolved | Explicit yielding language | "Okay fine, I'll drop it, but I still think the salad bar thing matters" | "Okay fine, I'll drop it" is a neon sign that the concern was abandoned, not resolved |

### What Signal Moments Are NOT

- **Not scripted lines.** The plan doesn't dictate exact words. It creates conditions; the persona produces language.
- **Not exaggerations.** The persona should sound like a real 6th grader who genuinely believes what they're saying, not a caricature making obvious mistakes.
- **Not every turn.** Most turns are normal discussion. Signal moments cluster around the 1-3 targeted flaws. A transcript with signal moments in every turn would feel artificial.

### Remaining Work

Signal moments are the highest-risk design challenge in the system. The principles above provide direction, but the right calibration — how strong the signals should be, how many per transcript, how the `accomplishes` field steers them — will come from iterative testing with actual generated transcripts and, ultimately, with UMS students. Expect this section to evolve significantly during implementation.

**Implementation note:** The examples in this document all use school garden scenarios for coherence. When building the reference libraries and prompt templates, examples should span 2-3 different PBL topics to confirm the patterns generalize beyond a single domain.

---

## Pipeline

**Operator.** The pipeline is run by an **operator** — the person who executes the Claude Code commands, reviews quality assessments, and decides whether to regenerate or revise. For MVP at UMS, the operator is the researcher. Post-MVP, teachers may run the pipeline directly (particularly `create_scenario` for topic selection). The operator sees quality_assessment output, decides when to regenerate, and configures scenario inputs.

### Commands

```
[one-time]   initialize_polylogue
[per topic]  create_scenario → create_script → evaluate_script
[app-side]   Teacher creates and activates session in Perspectives
```

| Command | Scope | Input | Output | What happens |
|---------|-------|-------|--------|-------------|
| `initialize_polylogue` | One-time (or when configs change) | — | `.claude/` populated | Copies commands and subagents from `configs/` to `.claude/`, verifies directory structure and reference libraries |
| `create_scenario` | Per topic | Topic, context, instructional goals | Scenario plan (YAML) | Designs discussion plan targeting specific flaw-behavior combinations |
| `create_script` | Per topic | Scenario plan | Discussion transcript (YAML) | Dialog writer generates transcript; instructional designer polishes |
| `evaluate_script` | Per topic | Discussion transcript + Scenario plan | Annotated evaluation (YAML) | Produces student-facing flaw annotations and facilitation guide (system-internal register deferred to post-MVP) |

### Subagents

Four subagents, each invoked once per scenario:

| Subagent | Used by | Purpose |
|---|---|---|
| **Learning scientist** | `create_scenario` | Validates the plan against pedagogical goals |
| **Dialog writer** | `create_script` | Generates the full transcript from the plan in a single pass |
| **Instructional designer** | `create_script` | Polishes the transcript for 6th-grade readability and signal moment clarity |
| **Evaluator** | `evaluate_script` | Annotates the transcript with argument flaws and thinking behaviors |

No persona subagents. Persona definitions live in the scenario plan and are passed to the dialog writer as context. This keeps the subagent count low and eliminates persona file lifecycle management.

### initialize_polylogue

**Purpose:** One-time system setup. Prepares the Claude Code environment for running the pipeline.

**What it does:**
1. Copies slash commands from `configs/` to `.claude/commands/`
2. Copies subagent definitions from `configs/` to `.claude/agents/`
3. Verifies directory structure exists (`registry/`, `configs/reference/`)
4. Verifies flaw and behavior reference libraries are in place

**When to run:** Once after cloning the repo, or after adding/changing commands or subagents in `configs/`. Since `initialize_polylogue` is itself a command, it must be manually copied first:

```
cp configs/system/commands/initialize_polylogue.md .claude/commands/
```

After that, run `/initialize_polylogue` to sync everything else.

### create_scenario

**Purpose:** Design a discussion plan that targets specific argument flaws and thinking behaviors.

**Process:**

1. **Draft the plan.** Based on the topic, context, and instructional goals, generate:
   - 2-3 persona sketches (name, role, perspective, what they know well, what they'll get wrong)
   - 1-3 target flaw-behavior combinations from the library
   - A turn-by-turn outline specifying: who speaks, what the turn should accomplish, which flaw surfaces where
   - The discussion arc (how it opens, where tension builds, how it resolves or fails to resolve)

2. **Validate the plan.** Invoke a **learning scientist subagent** that checks:
   - Are the target flaws detectable by 6th graders given this topic and these personas?
   - Does the turn outline create conditions for the flaws to surface naturally?
   - Is the language/content complexity appropriate for 6th grade?
   - Are the instructional goals achievable through this plan?

3. **Revise and finalize.** Incorporate validation feedback. Produce the final plan with enumerated turns.

**Output format:**

```yaml
scenario_id: string
topic: string
context: string
instructional_goals:
  - string
personas:
  - persona_id: string
    name: string
    role: string
    perspective: string  # what they believe / advocate for
    strengths: [string]  # what they know well
    weaknesses: [string] # what they'll get wrong and why
discussion_arc: string           # how it opens, where tension builds, how it resolves or fails to resolve
target_flaws:
  - flaw_pattern: string        # canonical ID from argument flaw library, e.g., "big claim, little evidence"
    thinking_behavior: string   # canonical ID from thinking behavior library, e.g., "confirmation bias"
    surfaces_in: [turn numbers] # where in the discussion this appears
    persona: string             # who produces it
turn_outline:
  - turn: integer
    speaker: string
    accomplishes: string  # what this turn does for the discussion
```

### create_script

**Purpose:** Generate the discussion transcript from the plan.

**Process: Single-pass generation with polish.**

The `create_script` command orchestrates three steps:

1. **Generate.** Invoke the **dialog writer subagent** with the full scenario plan. The dialog writer produces the complete transcript in a single pass — all turns, all personas — writing the discussion like a screenwriter writes dialog for all characters.

   The dialog writer sees:
   - All persona definitions (name, role, perspective, strengths, weaknesses)
   - The full turn outline (`speaker` and `accomplishes` fields)
   - The `discussion_arc` field
   - Style guidance: natural 6th-grade language, distinct persona voices
   - **NOT included:** `target_flaws`, flaw pattern names, thinking behavior names, or detection act labels. The `accomplishes` fields steer toward flaws without naming them.

2. **Review.** A **review script** (`review_transcript.py`) performs automated structural checks on the raw transcript — no LLM call:
   - Does the turn count fall within 12-16 turns?
   - Do the speaker names match the plan's persona definitions?
   - Does the turn order follow the plan's speaker sequence?
   - Are all planned turns present?
   - If structural checks fail → **discard and regenerate** (return to step 1). Since generation is a single call, discarding is cheap.

3. **Polish.** Invoke the **instructional designer subagent** with the raw transcript and the plan. The instructional designer takes a single editing pass to:
   - Simplify language that drifted above 6th-grade level
   - Tighten turns that are too long or rambling
   - Sharpen signal moments — adjust phrasing to make hooks more detectable without making them cartoonish
   - Trim redundancy
   - Ensure the discussion reads as a coherent conversation

   **Constraint:** The instructional designer can adjust **how flaws are expressed** (phrasing, signal strength, overconfident language) but not **which flaws are present or where they appear**. It sharpens, it doesn't add or remove. If a flaw didn't surface at all, that's a discard-and-regenerate decision, not an editing task. If a flaw surfaced but the signal moment is too subtle or too obvious, the instructional designer calibrates the phrasing — this is its primary value.

**Total LLM calls:** 2 per successful transcript (dialog writer + instructional designer). The review step is a script, not an LLM call. If discarded and regenerated on the first try, 3 LLM calls (2 dialog writer + 1 instructional designer). Maximum 4 LLM calls for `create_script` if all 3 attempts are used (3 dialog writer + 1 instructional designer on the accepted transcript). A major improvement over per-turn generation approaches.

**Discard-and-regenerate strategy.** If the dialog writer produces a transcript that doesn't pass the review script, the command discards it and tries again. **Maximum 3 attempts.** If all 3 fail, the command halts and flags the scenario plan as problematic — the operator should revise the plan in `create_scenario`. A well-designed plan should produce a usable transcript within 1-2 attempts. Persistent failures indicate a plan quality problem, not a generation problem.

**The `accomplishes` field is the most important prompt engineering challenge in the system.** It must steer the dialog writer toward producing specific flaws without naming the flaws or revealing the pedagogical intent. The field should describe what the persona *does* in natural terms that align with their role and perspective, not what error they should make.

Examples for flaw-surfacing turns:

| Target flaw | BAD accomplishes (reveals intent) | GOOD accomplishes (steers naturally) |
|---|---|---|
| Big claim, little evidence | "Make a sweeping claim supported by insufficient evidence" | "Share what you found from your one article and explain why you think it settles the question" |
| Correlation as causation | "Treat a correlation as proof of causation" | "Point out that the students who participated the most had the biggest change, and explain why you think the garden made the difference" |
| Abandoned concern | "Raise a valid concern and then drop it when pushed back on" | "Bring up the question about the salad bar, but acknowledge the group seems ready to move on" |
| Missing practical details | "Omit feasibility analysis" | "Describe your plan for the garden — focus on what it would look like and what it would grow" |

Examples for non-flaw turns:

| Turn role | accomplishes |
|---|---|
| Opening | "Introduce the topic your group has been working on and share your initial position" |
| Reacting | "Respond to what Mia just said — do you agree, and what would you add from your own research?" |
| Building tension | "Push back on Dante's cost estimate based on what you saw at the university greenhouse" |
| Wrapping up | "Summarize what the group has agreed on and note any remaining open questions" |

**Enumeration.** Turns and sentences within turns are enumerated (turn_01.s01, turn_01.s02, etc.) so that annotations can reference specific locations precisely. Enumeration is applied by `enumerate_turns.py` after the instructional designer's polish pass — the dialog writer and instructional designer work with a **pre-enumeration format** (same structure as the final transcript schema but without `id` fields on sentences; turns are ordered but unnumbered). The enumeration script assigns IDs mechanically and produces the final transcript schema.

**Cross-turn flaws.** Some flaw patterns — especially Act 4 (doesn't fit together) and Act 5 (not really resolved) — span multiple turns. These are constructed by the dialog writer in a single pass, guided by the plan's `accomplishes` fields across turns (e.g., turn 3's field says "Share what you found from your one article and explain why you think it settles the question"; turn 8's field says "Summarize the group's findings and explain why the evidence supports a much bigger conclusion"). The dialog writer handles cross-turn coherence naturally since it writes all turns in sequence. Annotations for cross-turn flaws reference sentence IDs across turns (e.g., `[turn_03.s02, turn_08.s01]`).

**Persona definitions live in the scenario plan, not in separate files.** The dialog writer receives all persona definitions as part of the plan. There are no separate persona subagent files in `.claude/agents/personas/`. This eliminates persona file creation, cleanup, and name uniqueness checks across files — names are unique within the plan.

**Fallback.** If single-pass generation consistently produces transcripts with blurred persona voices or poorly surfaced flaws, the pipeline can fall back to **block generation** (3-5 turns per call, each block seeing prior blocks) or **per-turn generation** (one call per turn). These are progressively more expensive but give more focused control. Start with single-pass; escalate only if quality requires it.

**Output format:**

```yaml
scenario_id: string
personas: [...]
turns:
  - turn_id: turn_01
    speaker: string
    sentences:
      - id: turn_01.s01
        text: string
      - id: turn_01.s02
        text: string
    # ...
  - turn_id: turn_02
    # ...
```

### evaluate_script

**Purpose:** Annotate the transcript with flaw identifications and quality assessment.

**Process:**

1. Analyze the transcript against the scenario plan's target flaws
2. Also identify any additional flaws that emerged beyond the plan
3. For each flaw, produce student-facing annotations in 6th-grade language, framed as a perspective
4. Assess overall quality: did the target flaws surface? Are they detectable?
5. Generate a facilitation guide with pre-generated scaffolds for the teacher (see Facilitation Scaffolds below)

**Output format:**

```yaml
scenario_id: string
annotations:
  - annotation_id: string
    location:
      turn: string       # e.g., turn_03
      sentences: [string] # e.g., [turn_03.s02, turn_03.s03]
    argument_flaw:
      pattern: string    # from library, e.g., "big claim, little evidence"
      detection_act: string  # act_id from library, e.g., "not_enough_support"
      explanation: string    # 6th-grade explanation, framed as a perspective
    thinking_behavior:
      pattern: string    # from library, e.g., "confirmation bias"
      explanation: string    # 6th-grade explanation
      plausible_alternatives: [string]  # other defensible behaviors
    planned: boolean     # was this a target flaw or an emergent one?
    # Post-MVP: add explanation_system fields for teacher dashboard
summary:
  total_annotations: integer
  target_flaws_surfaced: integer
  target_flaws_planned: integer
quality_assessment:
  all_targets_surfaced: boolean
  issues:                          # empty if no issues
    - type: string                 # "missing_flaw", "too_subtle", "too_obvious"
      description: string          # what the issue is
      target_flaw: string          # which planned flaw is affected
      recommendation: string       # "usable as-is", "consider regeneration", "needs new plan"
facilitation_guide:
  timing:
    phase_1_minutes: integer         # recommended, e.g., 10-12
    phase_2_minutes: integer         # recommended, e.g., 8-10
    phase_3_minutes: integer         # recommended, e.g., 10-15
    phase_4_minutes: integer         # recommended, e.g., 10-15
  what_to_expect:                    # teacher's map of the transcript
    - flaw: string                   # e.g., "big claim, little evidence"
      turns: string                  # e.g., "turns 5-8 (Mia)"
      signal: string                 # what students should notice, e.g., "Mia says 'the research proves...'"
      difficulty: string             # "most will catch it", "harder to spot", "easy to miss"
  phase_1:                           # scaffolds for students not finding flaws
    - prompt: string                 # e.g., "Re-read turns 5-8 with just this question: How do they know that?"
      targets: string                # which flaw this helps surface
  phase_2:                           # scaffolds for students stuck on thinking behaviors
    - flaw: string                   # which flaw this relates to
      narrowed_options: [string]     # 2-3 behaviors to choose from (subset of library)
      perspective_prompt: string     # empathy-based prompt, e.g., "Imagine you're Mia..."
  # Phase 3 scaffolds are generic (same for every scenario) — hardcoded in the app UI and cheat sheet template, not generated per scenario.
  phase_4:                           # scaffolds for class discussion
    - type: string                   # "challenge", "student_victory", "missed_flaw"
      prompt: string                 # ready-to-use teacher prompt
```

**MVP simplification:** Annotations are produced in student-facing language only (one `explanation` field per flaw, not two registers). A system-internal analytical register (`explanation_system`) will be added post-MVP when the teacher dashboard is built. The schema reserves space for it.

**No automatic feedback loop.** `evaluate_script` flags quality issues but does not trigger regeneration. The operator (teacher or researcher) reviews the quality assessment and decides whether to re-run `create_script` with the same plan, revise the plan in `create_scenario`, or use the transcript as-is. This keeps the pipeline simple and debuggable for the MVP.

---

## Schemas

Every handoff in the system — between commands, between a command and its subagents, and between the pipeline and the Perspectives app — is governed by a YAML schema. Schemas are stored in `configs/` alongside the commands and subagents that use them. They are the single source of truth for what each artifact contains and how it is structured.

### Schema Inventory

| Schema | Produced by | Consumed by | Location |
|--------|------------|-------------|----------|
| **Detection act library** | Hand-authored | Perspectives app (Phase 1 UI) | `configs/reference/schemas/` |
| **Thinking behavior library** | Hand-authored | Perspectives app (Phase 2 UI) | `configs/reference/schemas/` |
| **Scenario plan** | `create_scenario` | `create_script`, teacher dashboard | `configs/scenario/schemas/` |
| **Learning scientist validation** | Learning scientist subagent | `create_scenario` (revision step) | `configs/scenario/schemas/` |
| **Discussion transcript (pre-enumeration)** | Dialog writer, instructional designer | `enumerate_turns.py` | `configs/script/schemas/` |
| **Discussion transcript** | `enumerate_turns.py` | `evaluate_script`, Perspectives app | `configs/script/schemas/` |
| **Dialog writer input** | `create_script` (orchestrator, scenario plan minus `target_flaws`) | Dialog writer subagent | `configs/script/schemas/` |
| **Evaluation (full)** | `evaluate_script` (evaluator subagent) | `export_for_app.py`, operator, teacher dashboard, cheat sheet | `configs/evaluation/schemas/` |
| **Evaluation (student-facing)** | `export_for_app.py` | Perspectives app (Phase 4) | `configs/evaluation/schemas/` |
| **Session configuration** | Teacher (via Perspectives app) | Perspectives app | `configs/app/schemas/` |
| **Student annotations** | Student (via Perspectives app) | Perspectives app, teacher dashboard | `configs/app/schemas/` |

### Schema Design Rules

1. **YAML throughout.** All pipeline artifacts use YAML. The app may use JSON internally but pipeline↔app handoffs are YAML.
2. **Schemas are reference, not generated.** Schemas live in `configs/` and are read at runtime. They are never generated or modified by the pipeline.
3. **Every subagent call has a schema.** When the orchestrator invokes a subagent (dialog writer, instructional designer, learning scientist, evaluator), the expected output format is defined by a schema. The subagent's prompt includes the schema reference.
4. **Validation at every handoff.** Each command validates its inputs against the relevant schema before processing. Two modes: **strict** (halt on violation — for production use) and **warn** (log violation but continue — for early development while schemas are stabilizing). MVP starts in warn mode; strict mode is enabled once schemas are stable.
5. **App schemas are co-designed.** Schemas consumed by the Perspectives app (discussion transcript, evaluation annotations, session configuration, student annotations) are designed with the app team, not imposed by the pipeline. The app's needs drive the format.

### Where Schemas Appear in the Directory

```
configs/
├── reference/
│   └── schemas/            # detection_act_library.yaml, thinking_behavior_library.yaml
├── system/                 # System-level (initialize_polylogue)
├── scenario/
│   ├── schemas/            # scenario_plan.yaml, learning_scientist_validation.yaml
│   ├── commands/
│   └── agents/             # learning_scientist
├── script/
│   ├── schemas/            # discussion_transcript.yaml, discussion_transcript_pre.yaml, dialog_writer_input.yaml
│   ├── commands/
│   └── agents/             # dialog_writer, instructional_designer
├── evaluation/
│   ├── schemas/            # evaluation_full.yaml, evaluation_student.yaml
│   ├── commands/
│   └── agents/             # evaluator
└── app/
    └── schemas/            # session_configuration.yaml, student_annotations.yaml
```

---

## Scripts

Deterministic tasks are performed by Python scripts, not LLM agents. Scripts are stored in `configs/` alongside the commands and subagents that invoke them.

### Script Inventory

| Script | Invoked by | What it does | Why it's a script |
|--------|-----------|-------------|-------------------|
| `validate_schema.py` | All commands and subagents | Validates a YAML artifact against its schema; halts with clear error on violation | Deterministic: conforms or doesn't |
| `review_transcript.py` | `create_script` | Structural checks on raw transcript: turn count within 12-16, speaker names match plan, turn order follows plan | Deterministic: structural validation |
| `enumerate_turns.py` | `create_script` | Assigns sequential IDs to turns and sentences (turn_01.s01, etc.) after the instructional designer polish pass | Deterministic: sequential numbering |
| `sync_configs.py` | `initialize_polylogue` | Copies commands and subagents from `configs/` to `.claude/`; verifies reference libraries | Deterministic: file copy and verification |
| `export_for_app.py` | `evaluate_script` | Extracts student-facing annotations into `evaluation_student.yaml` (stripped of `planned`, `plausible_alternatives`, `quality_assessment`, `facilitation_guide`); also renders cheat sheet as printable markdown | Deterministic: extract + format |

### Script Design Rules

1. **Pure functions.** Scripts take explicit inputs and produce explicit outputs. No side effects beyond the intended file operations. No LLM calls.
2. **Schema-aware.** Scripts that produce or transform YAML artifacts validate their own output against the relevant schema before writing.
3. **Testable.** Each script has unit tests. Deterministic behavior means deterministic testing.
4. **Extensible.** New scripts will be added as implementation reveals additional deterministic tasks. The inventory above is the known starting set, not a closed list.

### Where Scripts Live

```
configs/
├── system/
│   └── scripts/            # sync_configs.py
├── scenario/
│   └── scripts/            # (none currently — registry directory creation is handled inline by create_scenario)
├── script/
│   └── scripts/            # review_transcript.py, enumerate_turns.py
├── evaluation/
│   └── scripts/            # export_for_app.py
└── shared/
    └── scripts/            # validate_schema.py (used by all stages)
```

---

## Pipeline→App Interface

The pipeline produces artifacts; the app consumes them. This section specifies the interface between them — what the app receives, in what format, and what each role (student, teacher, operator) can see. These decisions must be stable before either pipeline schemas or app UI can be built (Principle 6: app-first design).

### Reference Library Schemas

The app needs the detection act library and thinking behavior library as structured data to render Phase 1 and Phase 2 selection UIs. These are hand-authored once and bundled with the app at build time (not per-scenario).

**Detection act library** (`configs/reference/schemas/detection_act_library.yaml`):

```yaml
detection_acts:
  - act_id: string                    # e.g., "somethings_wrong"
    name: string                      # e.g., "Something's wrong"
    student_question: string          # e.g., "That's not right / That's not how it works"
    patterns:
      - pattern_id: string            # canonical ID, e.g., "factual error"
        plain_language: string        # e.g., "That's not true"
        description: string           # e.g., "A specific claim that is verifiably wrong"
```

**Thinking behavior library** (`configs/reference/schemas/thinking_behavior_library.yaml`):

```yaml
thinking_behaviors:
  - behavior_id: string               # canonical ID, e.g., "confirmation bias"
    name: string                      # plain-language name, e.g., "Only seeing what you want to see"
    description: string               # what it looks like, in 6th-grade language
    formal_term: string               # e.g., "Confirmation bias" — for teacher reference
```

### Transcript Schema: Persona Fields

The discussion transcript carries only the persona fields the app needs to display. Strengths, weaknesses, and perspective stay in the scenario plan — they reveal the flaw design and must not reach students.

```yaml
personas:
  - persona_id: string
    name: string
    role: string
    # NOT included: perspective, strengths, weaknesses
```

### Evaluation Split

`evaluate_script` produces a single full evaluation artifact (`evaluation.yaml`). `export_for_app.py` extracts the student-facing subset into a separate file — **prevention of data leakage by design**, not by app-side filtering.

| File | Contains | Consumed by |
|---|---|---|
| `evaluation.yaml` | Everything: all annotations (including `planned`, `plausible_alternatives`), `quality_assessment`, `facilitation_guide` (timing, what_to_expect, all phase scaffolds). | Operator, teacher dashboard, cheat sheet rendering |
| `evaluation_student.yaml` | Annotations only: location, argument_flaw (pattern, detection_act, explanation), thinking_behavior (pattern, explanation). No `planned`, no `plausible_alternatives`, no `quality_assessment`, no `facilitation_guide`. | Perspectives app (Phase 4 student view) |

**Phase 4 student-visible fields:**

| Field | Student sees? | Rationale |
|---|---|---|
| `argument_flaw.pattern` | Yes | Students see the flaw name (e.g., "big claim, little evidence") |
| `argument_flaw.detection_act` | Yes | Students see which detection question applies |
| `argument_flaw.explanation` | Yes | The AI's perspective in 6th-grade language |
| `thinking_behavior.pattern` | Yes | Students see the behavior name (e.g., "confirmation bias") |
| `thinking_behavior.explanation` | Yes | The AI's perspective on why it happened |
| `thinking_behavior.plausible_alternatives` | No | Teacher uses these from the cheat sheet to prompt discussion verbally |
| `planned` | No | Implementation detail — students don't know which flaws were designed |
| `quality_assessment` | No | Operator/teacher only |
| `facilitation_guide` | No | Teacher only |

### Student Annotation Schema

The primary data artifact the app produces. Foundation for Phase 3 comparison, Phase 4 discussion, teacher monitoring, and researcher data access.

```yaml
annotation_id: string
student_id: string
group_id: string
scenario_id: string
phase_created: integer               # 1, 2, or 3 — which phase this was first created in
location:
  sentences: [string]                 # sentence IDs selected, e.g., ["turn_03.s02", "turn_03.s03"]
detection_act: string                 # act_id from detection act library, e.g., "not_enough_support"
description: string                   # free-text in student's own words: what they noticed
thinking_behavior: string             # behavior_id from library, or null if not yet assigned (Phase 1 only) or if own_words
behavior_source: string               # "library" or "own_words" — did they pick from the library or describe it themselves?
behavior_own_words: string            # free-text behavior description when behavior_source is "own_words", null otherwise
behavior_explanation: string          # how the student connects the behavior to the flaw, or null
submitted: boolean                    # true after Phase 2 submission; triggers Phase 3 visibility
revision_history:
  - revised_at: timestamp
    phase: integer                    # which phase the revision occurred in (2, 3, or 4)
    change_type: string              # "revision" or "new" — editing an existing annotation or creating a new one
```

### Session Configuration Schema

Created by the teacher through the dashboard. Controls grouping, phase advancement, and scenario selection.

```yaml
session_id: string
scenario_id: string
is_warmup: boolean                    # true for the tutorial micro-scenario
created_at: timestamp
groups:
  - group_id: string
    student_ids: [string]
active_phase: integer                 # 1, 2, 3, or 4 — teacher controls advancement
phase_transitions:
  - from_phase: integer
    to_phase: integer
    transitioned_at: timestamp
student_activity:                     # for teacher monitoring — distinguishes "hasn't started" from "stuck"
  - student_id: string
    first_opened: timestamp | null    # when the student first opened the transcript
    last_active: timestamp | null     # last interaction (annotation, scroll, selection)
    annotation_count: integer         # current number of annotations
```

### Phase Transition Rules

| Transition | Trigger | What happens |
|---|---|---|
| Phase 1 → Phase 2 | Teacher advances (whole-class) | Students who haven't annotated yet can still annotate in Phase 2 but are prompted to move to thinking behaviors |
| Phase 2 → Phase 3 | Teacher advances after most students have submitted | **Submission is explicit** (submit button at end of Phase 2). Submission locks Phase 1 and Phase 2 annotations. Peer annotations become visible within the student's group. Students who haven't submitted are force-submitted by the transition. |
| Phase 3 → Phase 4 | Teacher advances when discussion has had sufficient time | AI annotations (from `evaluation_student.yaml`) are revealed. Students can still revise their own annotations. |

**No partial submission.** Phase 1 and Phase 2 are submitted together at the end of Phase 2. A student cannot submit Phase 1 alone. This simplifies the state model — an annotation is either draft (student is working) or submitted (peers can see it).

**Teacher can force-advance** at any time. If a group is lagging, the teacher advances the whole class. Unsubmitted annotations are auto-submitted at the transition.

---

## Perspectives App

### Overview

Perspectives is the student-facing app for Polylogue 4. It presents AI-generated discussions and guides students through a four-phase structured activity for recognizing and evaluating critical thinking flaws.

**Core principle:** The app frames critical thinking evaluation as examining perspectives — not finding right answers. Students identify what they notice, explain their reasoning to peers, and consider the AI's perspective alongside their own. No perspective is treated as ground truth.

### First-Session Onboarding

6th graders encountering Perspectives for the first time will need to learn the workflow before they can focus on critical thinking. Without onboarding, the first 5-10 minutes of the first session will be spent on "what am I supposed to do?" rather than "what's wrong with this argument?"

**Solution: A warm-up micro-scenario.** A short, hand-crafted discussion (5-6 turns, 2 personas, 1 obvious flaw) used solely to teach the four-phase workflow. The flaw is intentionally easy — the point isn't critical thinking practice, it's learning how to annotate, categorize, compare, and discuss. The teacher walks the class through each phase with the micro-scenario before students work independently on a real scenario.

**This is a hand-crafted artifact, not a pipeline product.** It doesn't need `create_scenario` or `create_script` — it's written once by hand, tested, and reused for every new class. It lives in `configs/reference/` alongside the flaw and behavior libraries. **It follows the same schemas as pipeline-produced scenarios** (scenario plan, discussion transcript, evaluation annotations) so the app handles one format, not two. The only difference is that it's hand-written to those schemas rather than generated.

### Four Phases

#### Phase 1: Recognize Argument Flaws (Individual)

Students read the discussion transcript and identify moments where something seems wrong with the argument.

**What students do:**
- Read the transcript at their own pace
- Highlight or select specific sentences where they notice an argument problem
- Choose from the five detection acts which type of problem it is:
  1. Something's wrong ("That's not right")
  2. Not enough support ("How do they know that?")
  3. Something's missing ("They didn't think about ___")
  4. Doesn't fit together ("That doesn't match")
  5. Not really resolved ("They agreed but didn't actually solve it")
- Briefly describe what they noticed in their own words

**Scaffolding:** The five detection questions are always visible as prompts. Students can use them as a checklist or as lenses to re-read the transcript.

#### Phase 2: Recognize Thinking Behaviors (Individual)

For each argument flaw they identified in Phase 1, students consider what thinking behavior might have caused it.

**What students do:**
- Review their Phase 1 annotations
- For each one, consider: "Why do you think they said this? What thinking habit might be behind it?"
- Browse the thinking behavior library and select the best match
- If nothing in the library fits, describe the pattern in their own words (fallback option)
- Explain the connection: how does this thinking behavior lead to this argument flaw?

**Scaffolding: Library-first, own-words as fallback.** The Phase 2 UI presents the thinking behavior library first — students browse plain-language descriptions and attempt to select. "None of these fit — describe in your own words" is available but secondary, not an equal option. This reduces the frequency of free-text entries (which are harder to compare in Phase 3) while preserving the option for students who genuinely see something the library doesn't cover. Articulating a pattern in your own words is a higher-order cognitive task — it should happen when the library genuinely doesn't fit, not as a shortcut to avoid browsing.

#### Phase 3: Explain (Peer Interaction)

Students share their annotations with peers and explain their reasoning.

**What students do:**
- See what their group members annotated (through the app)
- Compare: did they notice the same things? Different things?
- Ask each other for explanations: "Why did you mark this?" "What made you think that?"
- Discuss areas of agreement and disagreement verbally, using the app as a shared reference
- Revise existing annotations or create new ones during discussion as their thinking evolves ("I didn't notice that until my group member pointed it out")

**Mechanics:**

| Question | Decision | Rationale |
|----------|----------|-----------|
| When do students see peers' work? | After submitting their own Phase 1-2 annotations | Prevents anchoring — students must form their own perspective before encountering others (social constructivism requires genuine perspective difference) |
| How are groups managed? | Teacher assigns small groups (4-5 students) through the dashboard | Aligns with existing PBL group structures at UMS (~5 students per group); keeps comparison manageable; teacher can group strategically |
| Whose annotations are visible? | Group members only, not the whole class | Whole-class view is overwhelming; small-group comparison is tractable and mirrors how PBL teams already work |
| Can students revise? | Yes, during Phase 3, not only after | Revision is a feature — changing your mind in response to better reasoning is the learning goal. The app preserves revision history so teachers can see how thinking evolved |
| What does the app show? | Side-by-side view: the transcript with the student's annotations and their group members' annotations overlaid, with areas of agreement and disagreement highlighted (see comparison logic below) | The app surfaces the differences; students discuss the differences verbally |
| What role does verbal discussion play? | Primary. The app scaffolds the conversation (shows what to talk about), but the reasoning happens face-to-face, not through the app | The app is a shared reference, not a chat platform. Verbal discussion is richer, faster, and more natural for 6th graders |

**Phase 3 comparison logic.** The app highlights agreement and disagreement at three levels:

| Level | What it compares | Agreement | Disagreement |
|---|---|---|---|
| Location overlap | Did students mark similar sentences? | Two students annotated overlapping sentence ranges | One student annotated a location no one else marked |
| Detection act match | For overlapping locations, did they pick the same act? | Same location, same detection act | Same location, different detection acts |
| Thinking behavior match | For the same flaw, did they pick the same behavior? | Same behavior_id selected | Different behavior_ids, or one library / one free-text |

**Handling free-text ("own_words") annotations in Phase 3.** Library selections display as labeled tags and can be structurally compared. Free-text descriptions display as quoted text, visually distinct from library tags. The app does not attempt to match free-text against library terms — instead it surfaces free-text as a discussion prompt: *"Your group member wrote: 'she was just being stubborn.' Does that match any of the thinking behaviors?"* Agreement/disagreement highlighting applies only to library selections. Free-text entries naturally become Phase 3 discussion fuel — the verbal conversation bridges the gap that the app can't.

**Teacher monitoring during Phase 1.** The teacher dashboard shows `student_activity` data from the session: who has opened the transcript, how long they've been active, and how many annotations they have. This distinguishes "hasn't started" (first_opened is null) from "reading but stuck" (opened 8 minutes ago, 0 annotations) from "working" (opened, annotations increasing). The teacher uses this to decide when to deploy Phase 1 scaffolds from the cheat sheet.

#### Phase 4: Evaluate Perspectives (Class Discussion)

AI perspectives (from evaluate_script) are revealed. Students compare their own perspective with the AI's and with peers'.

**What students do:**
- See the AI's annotations — framed as "Here's what the AI noticed" (not "Here's the answer")
- Compare: did they find things the AI missed? Did the AI find things they missed?
- Discuss: do they agree or disagree with the AI's perspective? Why?
- The teacher facilitates class discussion around the most interesting points of agreement and disagreement

**Key framing:** The AI's annotations are explicitly presented as one perspective, not the correct answer. The app language reinforces this: "The AI thinks this is an example of [thinking behavior]. Do you agree? Why or why not?"

### Facilitation Scaffolds

The system designs rich scaffolding for students (detection acts, thinking behavior library, phase structure) but also needs to give teachers prepared interventions for when students struggle. A teacher managing 5-7 groups of 4-5 students cannot improvise scaffolds in real-time — they need a prepared menu of specific, scenario-aware prompts.

**Key design constraint:** Scaffolds are **per scenario, not per group.** Every group works on the same transcript with the same target flaws. The teacher reads one short facilitation guide before class and deploys the same interventions to whichever group needs them.

#### Two Types of Scaffolds

**Pre-generated scaffolds** are produced by `evaluate_script` as part of the evaluation output. They are derived from the scenario plan (target flaws, surfaces_in, detection acts, persona definitions) and the annotations (plausible alternatives). The teacher reads them before class. No app infrastructure required.

**Computed scaffolds** are derived from student data in real-time by the app. They require the teacher dashboard to compare annotations across students and groups. These are post-MVP.

#### Pre-Generated Scaffolds by Phase

**Phase 1 — Student isn't finding flaws:**

| Scaffold type | What the teacher says | Derived from |
|---|---|---|
| Narrow the lens | "Re-read turns 5-8 with just this question: *How do they know that?*" | target_flaws → detection_act + surfaces_in |
| Focus on a persona | "Follow just Mia's turns. What do you notice about how she talks about her evidence?" | target_flaws → persona + persona definition |

**Phase 2 — Student found a flaw but can't name the thinking behavior:**

| Scaffold type | What the teacher says | Derived from |
|---|---|---|
| Narrow the library | "For what you noticed about Mia's evidence, think about these three: *Only seeing what you want to see*, *Narrow focus*, or *Trusting the speaker, not the evidence*. Which fits best?" | plausible_alternatives for the relevant annotation |
| Perspective-taking | "Imagine you're Mia. You read one article and you're excited about it. Why would you say it 'proves' the garden works? What's going on in your thinking?" | persona perspective + weaknesses |

**Phase 3 — Peer discussion is stalled (post-MVP, requires app comparison):**

| Scaffold type | What the teacher says | Derived from |
|---|---|---|
| Surface a disagreement | "Jayden marked turn 7 as 'not enough support' and Mia marked it as 'something's missing.' Ask them to explain the difference." | Comparing group members' Phase 1-2 annotations |
| Prompt for revision | "One of your group members noticed something in turns 9-10 that none of you marked. Take another look." | Peer annotation comparison |

**Phase 4 — Class discussion isn't generating insight:**

Pre-generated (available before class):

| Scaffold type | What the teacher says | Derived from |
|---|---|---|
| Highlight what was missed | "Nobody noticed what happens in turn 12 when Jaylen says 'okay fine, let's just go with it.' What's going on there?" | quality_assessment issues flagged as too_subtle |

Prompt templates (teacher fills in from observation during class; computed versions post-MVP):

| Scaffold type | Template | Teacher fills in |
|---|---|---|
| Student victory | "___ students found something in turn ___ that the AI didn't mention. Let's hear what they noticed." | Which students, which turn — from observing student annotations during Phases 1-3 |
| Challenge the AI | "The AI says ___ was showing '___.' Some of you said '___.' Both sides — make your case." | Which persona, which behaviors — from comparing student and AI annotations during Phase 4 reveal |

#### Facilitation Cheat Sheet

The pre-generated scaffolds are formatted as a **one-page scannable reference** the teacher can print or keep on screen. The teacher reads it in 2 minutes before class, keeps it on their clipboard while circulating, and glances at it to select the right intervention.

**Rendering.** The cheat sheet is rendered from the `facilitation_guide` data in the evaluation YAML by `export_for_app.py`, which produces a printable text or markdown file alongside the evaluation output. For MVP, the operator can also format it manually from the YAML. Post-MVP, the teacher dashboard renders it directly in the app.

Example format:

```
FACILITATION CHEAT SHEET — School Garden Discussion

TIMING (50-min period)
  Phase 1: ~12 min  |  Phase 2: ~8 min  |  Phase 3: ~15 min  |  Phase 4: ~15 min

WHAT TO EXPECT
  Flaw 1: "Big claim, little evidence" — turns 5-8 (Mia)
    Students should notice Mia says "the research proves..." based on one article.
    Most will catch this; if not, use Phase 1 scaffolds below.
  Flaw 2: "Abandoned concern" — turns 9-12 (Jaylen)
    Students should notice Jaylen says "okay fine, I'll drop it."
    Easier to spot. If nobody catches it, something is off.

PHASE 1: Student isn't finding flaws
→ "Re-read turns 5-8 with this question: How do they know that?"
→ "Follow just Mia's turns. What words does she use about her evidence?"

PHASE 2: Student found flaw but stuck on thinking behavior
→ Narrow to 3: "Only seeing what you want to see" / "Narrow focus" /
  "Trusting the speaker, not the evidence"
→ "Imagine you're Mia. You read one article and you're excited.
   Why would you say it 'proves' the garden works?"

PHASE 3: Group discussion is stalled [hardcoded — same for every scenario]
→ "Did you all mark the same turns? Look at where you differ."
→ "Someone in your group found something you missed. Take another look."

PHASE 4: Class isn't engaging with AI perspective
→ "Nobody noticed what happens in turn 12 when Jaylen says
   'okay fine, let's just go with it.' What's going on there?"
→ [fill in from observation]: "___ students found something the AI missed.
   Tell us what you noticed."
→ [fill in from observation]: "The AI said '___.' Some of you said '___.'
   Both sides — make your case."
```

**MVP scope:** Pre-generated scaffolds (Phases 1, 2, and 4 prompts, plus timing and what-to-expect) are produced by evaluate_script as part of its single analysis pass — no additional LLM call, just additional text in the evaluator's output. Phase 3 scaffolds are generic (same for every scenario) and hardcoded in the cheat sheet template and the app's Phase 3 UI — they are not generated by the evaluator or stored in the evaluation schema. Scenario-specific Phase 3 scaffolds require the app to compare student annotations across groups, which is post-MVP. Computed scaffolds (Phase 3 disagreement surfacing, Phase 4 student-vs-AI comparison) require app features and are deferred.

### Role-Based Abilities

The Perspectives app serves three roles. Teacher and student abilities are grounded in learning science principles; researcher abilities support studying critical thinking development.

#### Student Abilities

Grounded in: active learning, metacognition (Flavell), social constructivism (Vygotsky), and evaluativist epistemology (Kuhn).

| Ability | What the student does | Learning science principle |
|---------|----------------------|--------------------------|
| **Annotate** | Highlight specific moments in the transcript and identify argument flaws | Active learning — students construct understanding by engaging directly with the text, not by receiving information passively |
| **Categorize** | Classify what they noticed using the detection acts and thinking behavior library | Structured inquiry — categories provide scaffolding for novice evaluators without dictating conclusions |
| **Explain** | Articulate in their own words why something is a flaw and what thinking caused it | Metacognition — explaining forces students to examine and articulate their own reasoning process |
| **Compare** | See peers' annotations alongside their own; identify agreements and disagreements | Social constructivism — knowledge is refined through interaction with others who see things differently |
| **Revise** | Update their annotations after peer discussion or seeing AI perspectives | Intellectual flexibility — changing one's mind in response to better reasoning is a skill, not a weakness |
| **Evaluate perspectives** | Consider the AI's annotations as one perspective; agree, disagree, and explain why | Evaluativist epistemology — developing the understanding that claims can be evaluated on their merits, not accepted or rejected based on authority |

#### Teacher Abilities

Grounded in: formative assessment (Black & Wiliam), scaffolding (Bruner/Wood), facilitation of productive discussion, and backward design (Wiggins & McTighe).

| Ability | What the teacher does | Learning science principle |
|---------|----------------------|--------------------------|
| **Design** | Select or configure scenarios: choose topic, target flaws, number of personas | Backward design — instruction starts from learning goals, not content |
| **Monitor** | See real-time student progress through the four phases; see who's annotating, who's stuck | Formative assessment — ongoing, low-stakes observation that informs instructional decisions in the moment |
| **Analyze patterns** | See aggregate data: which flaws were most/least detected, which thinking behaviors students identified, where agreement/disagreement clusters | Data-informed instruction — aggregate patterns reveal what students understand and where they need support |
| **Scaffold** | Adjust which detection questions are emphasized; provide hints; choose when to advance phases | Scaffolding — temporary support calibrated to what students need, gradually released as competence grows |
| **Facilitate** | Use app data to guide Phase 3-4 discussions; surface the most productive disagreements | Productive discussion — the teacher's role is to facilitate reasoning, not to deliver answers |
| **Assess** | Review student annotations and explanations as evidence of critical thinking development | Authentic assessment — evaluating students' reasoning processes, not just their ability to match a key |

#### Researcher Abilities

Grounded in: studying critical thinking development, measuring argumentation quality, and iterating on instructional design.

| Ability | What the researcher does | Purpose | MVP? |
|---------|-------------------------|---------|------|
| **Access raw data** | Student annotations, timestamps, revision history, peer interactions | Enables analysis of how students engage with the material and how their thinking evolves | Yes — data is stored locally in registry |
| **Compare across scenarios** | Which flaw-behavior combinations are most/least detectable; which topics produce better engagement | Informs the flaw-behavior combination library — what works in practice | Partial — manual comparison via registry files |
| **Track development** | Student performance across multiple sessions over time | Measures whether repeated engagement improves critical thinking skills | Deferred — requires user accounts and persistence |
| **Export** | Structured data export for external analysis tools | Supports research publication and collaboration | Deferred — requires export tooling |
| **Iterate** | Feed findings back into scenario design and taxonomy refinement | The system improves through evidence, not just intuition | Yes — manual process, informed by data |

**MVP scope note:** Track development and Export require user accounts, persistent storage, and data infrastructure that are beyond MVP scope. For MVP, researcher access is through the registry files and teacher dashboard. Formal research tooling is a post-MVP investment.

---

## Directory Structure

```
polylogue-4/
├── docs/                    # Design documents
│   └── design.md            # This document
├── configs/                 # Pipeline configuration
│   ├── reference/           # Flaw and behavior libraries (single source of truth)
│   ├── system/              # System-level artifacts (initialize_polylogue command)
│   ├── scenario/            # Scenario command, subagents, schemas
│   ├── script/              # Script command, subagents, schemas
│   └── evaluation/          # Evaluation command, subagents, schemas
├── .claude/                 # Runtime artifacts
│   ├── commands/            # Slash commands (copied from configs/)
│   └── agents/              # Subagents (copied from configs/)
├── app/                     # Perspectives app
│   └── ...                  # TBD — app architecture
└── registry/                # Generated outputs
    └── {scenario_id}/
        ├── scenario.yaml              # Plan from create_scenario
        ├── script.yaml                # Transcript from create_script
        ├── evaluation.yaml            # Full evaluation from evaluate_script (operator + teacher)
        ├── evaluation_student.yaml    # Student-facing extract (from export_for_app.py)
        └── cheat_sheet.md             # Printable facilitation cheat sheet (from export_for_app.py)
```

**Sync mechanism.** Commands and subagents are manually copied from `configs/` to `.claude/` via the `initialize_polylogue` command. This is a one-time setup step, repeated only when commands or subagents are added or changed. No automated build step for MVP.

---

## Open Questions

1. **Taxonomy completeness.** Are the argument flaw patterns and thinking behaviors listed above the right set? Should some be removed, added, or renamed? The library should grow from practice — initial set should be small and well-tested.

2. **Combination library.** Which flaw-behavior combinations are most productive for 6th graders? This needs testing with actual scenarios.

**Resolved questions (kept for reference):**

3. ~~**Perspectives app architecture.**~~ Resolved — see `implementation-app.md`. Next.js + SQLite + Tailwind, polling for real-time, deployed on university server.

4. ~~**Scope of MVP.**~~ Resolved — implicitly defined by the implementation plans (`implementation-pipeline.md` and `implementation-app.md`). MVP scope decisions are marked throughout this document.

5. ~~**Build order.**~~ Resolved — see `implementation-pipeline.md`. Schemas → subagent prompts → commands → first scenario (manual scripts acceptable) → formalize scripts → iterate.

---

## Next Steps

The design is ready to build. Implementation plans exist for both the pipeline (`implementation-pipeline.md`) and the app (`implementation-app.md`). The remaining open questions (taxonomy completeness, combination library) require building scenarios and testing with students, not more document work.
