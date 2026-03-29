# Polylogue 4 — Design Document

## Overview

Polylogue 4 generates AI group discussions containing critical thinking flaws for middle school students to practice evaluating. It is designed for use at the University Middle School (UMS) in Memphis.

Teachers provide a PBL topic and instructional goals. The system generates 2-3 AI personas, designs a discussion plan targeting specific argument flaws and thinking behaviors, and produces a ~15-turn discussion where those flaws surface naturally. Students then work through a structured four-phase activity — recognizing flaws, identifying the thinking behind them, explaining their reasoning to peers, and evaluating multiple perspectives including the AI's.

**Key differences from Polylogue 3:**

| Aspect | v3 | v4 |
|--------|----|----|
| Flaw generation | Emergent from knowledge gaps | Designed via plan, executed by personas |
| Flaw taxonomy | 4 abstract types, 20 subtypes | Argument flaws + thinking behaviors (two layers) |
| Target audience | Grades 6-8 with grade-band calibration | 6th grade only (MVP) |
| Activities | Presentations and discussions | Discussions only |
| Agents per scenario | 3-5 | 2-3 |
| Flaws per scenario | 10-15 (emergent) | 1-3 (targeted) |
| Transcript length | 20-30+ turns | ~15 turns max |
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

## Pipeline

### Commands

```
create_scenario → create_script → evaluate_script
```

| Command | Input | Output | What happens |
|---------|-------|--------|-------------|
| `create_scenario` | Topic, context, instructional goals | Scenario plan (YAML) | Designs discussion plan targeting specific flaw-behavior combinations |
| `create_script` | Scenario plan | Annotated discussion transcript (YAML) | Personas generate discussion via multi-round one-step process |
| `evaluate_script` | Discussion transcript | Annotated evaluation (YAML) | Produces flaw annotations at two registers: system-internal and student-facing |

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
target_flaws:
  - flaw_pattern: string        # from argument flaw library
    thinking_behavior: string   # from thinking behavior library
    surfaces_in: [turn numbers] # where in the discussion this appears
    persona: string             # who produces it
turn_outline:
  - turn: integer
    speaker: string
    accomplishes: string  # what this turn does for the discussion
    flaw_role: string     # null, "sets up", "surfaces", "responds to"
```

### create_script

**Purpose:** Generate the discussion transcript from the plan.

**Process: Multi-round one-step generation.**

In a single command invocation, the orchestrator loops through the turn outline:

1. Consult the plan → determine who speaks next and what the turn should accomplish
2. Invoke that persona with: their persona context + the plan's guidance for this turn + all dialog generated so far
3. Persona generates their turn as natural 6th-grade dialog
4. Append the turn to the transcript
5. **Instructional designer subagent** checks:
   - Does this turn accomplish what the plan intended?
   - Have the target flaws surfaced as designed?
   - Is the language at 6th-grade level?
   - Should we continue, regenerate this turn, or stop?
6. If continue → back to step 1. If done → finalize.

**Enumeration:** Turns and sentences within turns are enumerated (turn_01.s01, turn_01.s02, etc.) so that annotations can reference specific locations precisely.

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

**Purpose:** Annotate the transcript with flaw identifications at two registers.

**Process:**

1. Analyze the transcript against the scenario plan's target flaws
2. Also identify any additional flaws that emerged beyond the plan
3. For each flaw, produce annotations at two registers:
   - **System-internal** (for teacher dashboard, logging): analytical language, formal terms
   - **Student-facing** (for Phase 4 reveal in Perspectives): 6th-grade language, framed as a perspective

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
      detection_act: string  # e.g., "not enough support"
      explanation_system: string   # analytical explanation
      explanation_student: string  # 6th-grade explanation
    thinking_behavior:
      pattern: string    # from library, e.g., "confirmation bias"
      explanation_system: string   # analytical explanation
      explanation_student: string  # 6th-grade explanation
      plausible_alternatives: [string]  # other defensible behaviors, e.g., ["tunnel vision"]
    planned: boolean     # was this a target flaw or an emergent one?
summary:
  total_annotations: integer
  target_flaws_surfaced: integer
  target_flaws_planned: integer
```

---

## Perspectives App

### Overview

Perspectives is the student-facing app for Polylogue 4. It presents AI-generated discussions and guides students through a four-phase structured activity for recognizing and evaluating critical thinking flaws.

**Core principle:** The app frames critical thinking evaluation as examining perspectives — not finding right answers. Students identify what they notice, explain their reasoning to peers, and consider the AI's perspective alongside their own. No perspective is treated as ground truth.

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
- Choose from the thinking behavior library or describe in their own words
- Explain the connection: how does this thinking behavior lead to this argument flaw?

**Scaffolding:** The thinking behavior library is presented as a reference — plain-language descriptions with examples. Students can browse it but are also encouraged to describe patterns in their own words.

#### Phase 3: Explain (Peer Interaction)

Students share their annotations with peers and explain their reasoning.

**What students do:**
- See what their peers annotated (through the app)
- Compare: did they notice the same things? Different things?
- Ask each other for explanations: "Why did you mark this?" "What made you think that?"
- Discuss areas of agreement and disagreement
- Can revise their own annotations based on peer discussion

**Mode:** Hybrid — the app shows peer annotations and supports text-based exchange, but verbal face-to-face discussion is encouraged alongside.

#### Phase 4: Evaluate Perspectives (Class Discussion)

AI perspectives (from evaluate_script) are revealed. Students compare their own perspective with the AI's and with peers'.

**What students do:**
- See the AI's annotations — framed as "Here's what the AI noticed" (not "Here's the answer")
- Compare: did they find things the AI missed? Did the AI find things they missed?
- Discuss: do they agree or disagree with the AI's perspective? Why?
- The teacher facilitates class discussion around the most interesting points of agreement and disagreement

**Key framing:** The AI's annotations are explicitly presented as one perspective, not the correct answer. The app language reinforces this: "The AI thinks this is an example of [thinking behavior]. Do you agree? Why or why not?"

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

| Ability | What the researcher does | Purpose |
|---------|-------------------------|---------|
| **Access raw data** | Student annotations, timestamps, revision history, peer interactions | Enables analysis of how students engage with the material and how their thinking evolves |
| **Compare across scenarios** | Which flaw-behavior combinations are most/least detectable; which topics produce better engagement | Informs the flaw-behavior combination library — what works in practice |
| **Track development** | Student performance across multiple sessions over time | Measures whether repeated engagement improves critical thinking skills |
| **Export** | Structured data export for external analysis tools | Supports research publication and collaboration |
| **Iterate** | Feed findings back into scenario design and taxonomy refinement | The system improves through evidence, not just intuition |

---

## Directory Structure

```
polylogue-4/
├── docs/                    # Design documents
│   └── design.md            # This document
├── configs/                 # Pipeline configuration
│   ├── reference/           # Flaw and behavior libraries (single source of truth)
│   ├── scenario/            # Scenario command, subagents, schemas
│   ├── script/              # Script command, subagents, schemas
│   └── evaluation/          # Evaluation command, subagents, schemas
├── .claude/                 # Runtime artifacts
│   ├── commands/            # Slash commands (synced from configs/)
│   └── agents/              # Subagents (synced from configs/)
├── app/                     # Perspectives app
│   └── ...                  # TBD — app architecture
└── registry/                # Generated outputs
    └── {scenario_id}/
        ├── scenario.yaml    # Plan from create_scenario
        ├── script.yaml      # Transcript from create_script
        └── evaluation.yaml  # Annotations from evaluate_script
```

---

## Open Questions

1. **Taxonomy completeness.** Are the argument flaw patterns and thinking behaviors listed above the right set? Should some be removed, added, or renamed? The library should grow from practice — initial set should be small and well-tested.

2. **Combination library.** Which flaw-behavior combinations are most productive for 6th graders? This needs testing with actual scenarios.

3. **Perspectives app architecture.** What tech stack? How does it consume the YAML outputs? Real-time collaboration features for Phase 3? How does the teacher dashboard integrate?

4. **Persona instruction.** How much of the plan does each persona see? The full turn outline, or just their own turns and general context? More visibility = more coherent discussion but less natural surprise.

5. **Signal moments.** How do we instruct personas to produce "hooks" — phrasings that activate student detection (e.g., "studies prove," "everyone knows," "there's no reason it wouldn't work") — without making the flaws cartoonish?

6. **Phase 3 mechanics.** How exactly does peer annotation sharing work? Anonymous? Named? Does the app pair students, or is it whole-class? How much structure vs. open discussion?

7. **Scope of MVP.** What is the minimum set of scenarios, flaw-behavior combinations, and app features needed to test with UMS students?
