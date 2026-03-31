# Polylogue v5.2 — Design Proposal

Polylogue generates AI group discussions for middle school students to evaluate, building critical thinking through practice. v5.2 is a pedagogical redesign grounded in a perspectival learning model: students learn by articulating what they see in reasoning and encountering how others see it differently. The framework replaces flaw detection with reasoning evaluation, replaces cognitive conflict with perspectival enrichment, and repositions AI from authority to expert voice.

This document is organized as follows: **Background** (Section 1) explains what changed and why; the **Conceptual Framework** (Section 2) defines the three lenses, the spectrum, the explanatory vocabularies, and the learning model; the **Learning Experience** (Section 3) describes what students, teachers, and AI actually do; **Operationalization Principles** (Section 4) govern how the framework becomes a system; and **Implementation, Open Questions, and Future Work** (Sections 5–7) cover how to build it and where it's headed.

---

## 1. Background

### From v4 to v5 to v5.2

Polylogue v4 presented students with an AI-generated group discussion transcript and asked them to detect flaws, classify them by category, match each to a thinking behavior, compare with peers, and see the AI's analysis. The system used 5 detection act categories containing 19 flaw patterns and a library of 8 thinking behaviors.

v5 (documented in `polylogue-v5.md`) addressed v4's core problems — excessive cognitive load, overlapping taxonomy, unusable behavior picker, late AI reveal — by simplifying the framework to four dimensions (Logic, Evidence, Scope, Emotion), restructuring the experience into three phases with a consistent rhythm, and introducing faded scaffolding. v5 was a significant improvement, but retained two assumptions from v4 that limited its pedagogical reach.

**Assumption 1: Critical thinking is flaw detection.** Both v4 and v5 framed the student's task as finding what's wrong. This teaches criticism but not evaluation. Real critical thinking involves recognizing quality across a spectrum — strong reasoning, weak reasoning, and everything in between.

**Assumption 2: Learning requires cognitive conflict.** Both versions positioned the AI as the authority whose "correct" analysis would create productive dissonance with the student's understanding. This works in controlled settings but in a classroom of 6th graders, "you're wrong" shuts conversation down while "how did you see it?" opens conversation up.

### What v5.2 Changes

v5.2 makes three foundational shifts:

| Aspect | v5 | v5.2 |
|---|---|---|
| Framework | 4 dimensions (Logic, Evidence, Scope, Emotion) with flaw types and patterns | 3 lenses (Logic, Evidence, Scope) with multi-faceted quality spectrum |
| Learning model | Cognitive conflict — student commits, AI reveals correct answer, student revises | Perspectival — student articulates, encounters peer and AI perspectives, understanding enriches |
| Student task | Detect and classify flaws | Evaluate reasoning quality and articulate what they see |

The Emotion dimension is not lost — it is reconceived. Social and emotional dynamics (conformity, conflict avoidance, groupthink) move from being a fourth dimension of critical thinking to being one of two explanatory vocabularies that help students understand *why* people reason the way they do. This is a more honest framing: Logic, Evidence, and Scope evaluate the *argument*; social dynamics explain the *process* that shaped it.

---

## 2. Conceptual Framework

### Three Lenses

Students evaluate reasoning quality through three independent lenses. Each lens asks a different question about a different aspect of argumentation.

| Lens | What it evaluates | The question |
|---|---|---|
| **Logic** | The inferential structure connecting premises to conclusions | Does the reasoning hold? |
| **Evidence** | The quantity and quality of support for claims | Is the claim supported? |
| **Scope** | The breadth of factors, perspectives, and consequences considered | Is the analysis thorough? |

**Why lenses, not dimensions.** The metaphor matters. A "dimension" implies measurement — placing an argument at a point in a space. A "lens" implies perception — looking at reasoning from a particular angle and articulating what you see. Different students looking through the same lens see different things, and that diversity of perception is the engine of learning.

**Independence.** The three lenses are genuinely independent. Logic asks whether the reasoning *structure* holds. Evidence asks whether the *support* is adequate. Scope asks whether the *coverage* is sufficient. A passage can be strong through one lens and weak through another — sound logic built on thin evidence, or thorough scope with faulty inferences.

**Sufficiency.** These three lenses do not exhaust critical thinking. Dimensions like epistemic humility, metacognitive monitoring, and intellectual courage exist but are beyond this framework's scope. For the practical purpose of teaching middle school students to evaluate group discussions, three lenses that are learnable, independent, and together cover the core operations of argument evaluation are sufficient.

This claim is grounded in established critical thinking frameworks:

- **Logic and Evidence** are universally recognized as core evaluative operations — Facione's Delphi Report (analysis, inference, evaluation), Ennis's taxonomy (judging conclusions, assessing reliability), Toulmin's model (warrant, data, backing), and Halpern's categories (argument analysis, hypothesis testing).
- **Scope** consolidates what multiple frameworks distribute across several concepts: Paul & Elder's "implications," "point of view," and "breadth" standards; Toulmin's "rebuttal"; Ennis's "problem identification." The framework's contribution is recognizing that these all ask the same question — "is the analysis thorough?" — and that students can learn this as a single lens.

**Relevance** — whether an argument connects to the question being discussed — was considered as a fourth lens but excluded. In designed transcripts, relevance failures are rare because the pipeline controls topical focus. Most relevance failures are subsumed under the existing three lenses: non-sequiturs are Logic failures; arguments addressing the wrong aspect of a question are Scope failures. Pure relevance failures (correct reasoning about the wrong question) would become relevant in Transfer contexts (Section 7), where students apply the framework to uncontrolled discussions.

**Why three lenses.** Three lenses serve two purposes. First, they make critical thinking *teachable* — three categories sit comfortably within working memory, each feels intuitively distinct, and students build fluency through repeated application across scenarios. Second, the lens structure makes complex reasoning *analyzable*. A passage that seems confusing as a single phenomenon becomes tractable when a student asks: "What do I see through the Logic lens? The Evidence lens? The Scope lens?" The framework is simple enough to be learnable and rich enough to be useful.

### Multi-Faceted Lenses

Each lens is simple on the surface — one question — but multi-dimensional underneath. Reasoning quality within each lens has multiple facets, and different students naturally attend to different ones.

**Evidence facets:**

| Facet | What it captures |
|---|---|
| Quantity | How much evidence is offered? |
| Quality | How reliable are the sources? |
| Relevance | Does the evidence connect to the claim? |
| Sufficiency | Does the evidence support the scope of the conclusion? |

**Logic facets:**

| Facet | What it captures |
|---|---|
| Validity | Does the conclusion follow from the premises? |
| Consistency | Do the parts cohere with each other? |
| Completeness | Are there missing steps in the reasoning chain? |

**Scope facets:**

| Facet | What it captures |
|---|---|
| Perspectives | Whose viewpoints are considered? |
| Consequences | What outcomes are examined? |
| Conditions | Under what circumstances does the argument hold? |

These facets exist at different levels for different audiences:

| Level | What they see | Purpose |
|---|---|---|
| **Student** | One question per lens and a strong/mixed/weak response | Entry point — simple enough to engage with |
| **Teacher / AI** | The facets within each lens | Explains why students disagree — "You're both saying mixed, but you're looking at different aspects of the evidence" |
| **Pipeline / Researcher** | Full facet structure | Designs passages that are strong on some facets and weak on others, creating productive ambiguity |

Students don't need to name the facets. A struggling student can say "the evidence seems weak." A strong student can say "there's a lot of evidence but the sources aren't reliable." Both are valid perspectives through the same lens — one is more differentiated. Growth over time looks like increasingly differentiated perception, not convergence on a right answer.

### The Spectrum

Students evaluate reasoning quality as **strong**, **mixed**, or **weak** through each lens.

| Value | What it signals | What it demands |
|---|---|---|
| **Strong** | "I see quality here" | Articulate what makes it strong |
| **Weak** | "I see problems here" | Articulate what's lacking |
| **Mixed** | "I see multiple things" | Articulate the different things you see |

**Mixed is not a midpoint.** On a one-dimensional scale, mixed would be the middle — mediocre, average, unremarkable. In this framework, mixed signals multi-dimensionality: there's more than one thing going on. A passage with strong evidence quantity but weak evidence quality is mixed — and two students who both say "mixed" may be attending to entirely different facets. Unpacking what the mix is, and discovering that peers unpacked it differently, is where the richest learning happens.

**Strong and weak are relatively convergent** — students will mostly agree on clear cases and give similar reasons. **Mixed is where perspectival diversity lives**, because the same rating can reflect fundamentally different readings of the same passage. This makes mixed the most pedagogically valuable rating — and it means the pipeline should design for mixed, not just for strong and weak.

### Two Explanatory Vocabularies

Beyond evaluating *what* they see in the reasoning, students explore *why* people think the way they do. Explanations draw from two vocabularies that represent genuinely different mechanisms:

**Cognitive patterns** — individual thinking tendencies that shape how a person processes information and draws conclusions:

| Pattern | Description |
|---|---|
| Confirmation bias | Only looking for information that supports what you already believe |
| Tunnel vision | Focusing so hard on one part that you miss the rest |
| Overgeneralization | Taking one example and assuming it applies to everything |
| False cause | Assuming one thing caused another just because they're connected in time |
| Hasty generalization | Drawing a big conclusion from too few examples |
| Uncritical acceptance | Believing something without checking the source |
| Solution fixation | Getting attached to a favorite idea and making the problem fit |
| Black-and-white thinking | Seeing only two options instead of recognizing nuance |
| Optimism bias | Assuming everything will work out without considering what could go wrong |
| Compartmentalized thinking | Holding contradictory ideas without noticing the conflict |
| Egocentric thinking | Only considering people like yourself |
| False certainty | Feeling sure about something without checking whether the reasoning or evidence supports it |

**Social dynamics** — group interaction patterns that shape how a discussion unfolds:

| Dynamic | Description |
|---|---|
| Conformity | Going along with the group even when you privately disagree |
| Conflict avoidance | Giving up a point you believe in because disagreeing feels uncomfortable |
| Authority deference | Letting the loudest or most confident person win without evaluating their reasoning |
| Groupthink | The group choosing to feel good about their answer instead of checking whether it's right |
| Constructive challenge | Respectfully questioning reasoning and asking for better support |
| Building on ideas | Taking someone else's point and extending it thoughtfully |
| Evidence-based mind-changing | Changing your position because someone made a genuinely good argument |
| Holding accountable | Asking the group to check its reasoning before moving on |

Note that the social dynamics vocabulary includes both negative patterns (conformity, groupthink) and positive ones (constructive challenge, evidence-based mind-changing). This is deliberate — under the perspectival model, explanations aren't reserved for failures. Every moment in a discussion was shaped by cognitive and social forces, whether the reasoning is strong or weak. A student who built a well-supported argument did so in a cognitive and social context, and understanding *why* reasoning succeeds is as valuable as understanding why it fails.

**The distinction between cognitive and social explanations is itself a perspectival tool.** Two students looking at the same moment might offer different readings: one sees a cognitive pattern ("she only looked for evidence that agreed with her"), another sees a social dynamic ("nobody in the group challenged her"). Both are valid perspectives on why the reasoning turned out the way it did. The AI can surface both: "A cognitive scientist might call this confirmation bias. But notice what the group did — nobody asked Maya to consider the other side. The thinking pattern and the group dynamic worked together."

### The Perspectival Learning Model

The framework is grounded in a specific theory of learning: **students learn by articulating perspectives and encountering other perspectives.** This differs from cognitive conflict models (learning through correction) and transmission models (learning through instruction).

**Why perspectives drive learning:**

- **Articulation externalizes thinking.** When a student puts what they see into words, they transform a vague impression into an examinable claim. The act of articulating is itself cognitive work — it forces precision, reveals gaps, and creates something that can be shared.
- **Multiple perspectives reveal multiple dimensions.** No single perspective captures everything about a passage's reasoning quality. When students encounter how peers saw it differently — attended to different facets, used different lenses, offered different explanations — they discover aspects of the reasoning they didn't notice. Understanding grows through accumulation of perspectives, not convergence on one.
- **Expert perspectives offer vocabulary, not verdicts.** The AI introduces formal terms (confirmation bias, groupthink) as named perspectives from cognitive science and social psychology. Students engage with these perspectives — "Does that match what I see? Does it add something I missed? Do I see something the AI doesn't?" — rather than deferring to them as correct answers.

**What counts as learning** under this model is not "did they get the right answer" but:

- **Articulation** — Can the student express what they see and why?
- **Multiplicity** — Can the student consider a passage through more than one lens?
- **Engagement** — Does the student engage meaningfully with peer and AI perspectives?
- **Differentiation** — Do the student's observations become richer and more specific over time?

---

## 3. Learning Experience

### Hybrid Setting

The learning experience is a hybrid of app-based individual work and classroom-based group interaction:

- **Individual work** happens on the app (tablets/laptops), where students articulate their perspectives
- **Group discussion** happens face-to-face in the physical classroom, where perspectival exchange is richest
- **AI perspectives** are revealed on the app under teacher control, adding the expert voice at the right moment

### Phase Rhythm

All three phases follow the same **individual → social → expert** rhythm:

1. **Individual work (on app)** — student forms and articulates their own perspective
2. **Group discussion (in classroom)** — student encounters peer perspectives, with app responses visible for reference
3. **AI reveal + reflect (on app, teacher-initiated)** — student encounters the AI's perspective and engages with it

This is not individual → social → correction. It is **perspective → perspectives → richer perspective.** Each step adds voices without overwriting what came before.

The progression is grounded in learning science:

- **Individual before peers** ensures every student articulates their own perspective before encountering others — preventing weaker students from simply adopting stronger students' views
- **Peers before AI** creates genuine discussion because no one has authority; students argue on merit
- **AI last** adds expert vocabulary and formal analysis *after* students have committed individually and engaged socially — they have a perspective to compare against, not a blank slate to fill

### Phase 1: Notice

**Cognitive task:** Noticing — "What do you see?"

**Student produces:** Free-text response articulating what they notice about each passage's reasoning

Students read passages from the discussion and share what they notice. The prompt is open: "What do you see in the reasoning here?" There is no correct answer to produce. A student who writes "I don't think that's true because my mom said something different" is engaging just as validly as one who writes "they gave a lot of examples but none from reliable sources." What matters is that the student committed to a perspective.

No taxonomy, no categories, no vocabulary — just "tell me what you see."

#### Faded Scaffolding

Passages are presented in a faded scaffolding sequence that gradually withdraws support:

1. **Highlighted passages (scaffolded)** — The first passages are pre-highlighted in the transcript, ordered from most to least salient. The student reads the highlighted passage and writes what they notice about the reasoning.
2. **Hinted passages (guided)** — For subtler moments, the system provides a region hint (e.g., "look carefully at what happens in Alex's second response") with a subtle visual cue. The student locates the relevant moment within the region.
3. **Unhighlighted passages (discovery)** — The final passages have no highlighting or hints. Students scan the transcript to find moments worth examining on their own.

The ratio of highlighted : hinted : unhighlighted is configurable per scenario. A simpler scenario might be 3:1:0; a challenging one might be 2:1:2.

**Making the scaffolding feel natural.** The app frames the progression as increasing trust:

- Highlighted: "Here are some moments we think are worth looking at."
- Hinted: "We think there might be something interesting here."
- Unhighlighted: "What else do you notice in this discussion?"

The unhighlighted tier is explicitly optional — students who don't find anything aren't penalized. Students who do find something share their discoveries during group discussion.

**Important:** Highlighted passages include both strong and weak reasoning. The scaffolding directs attention to *interesting* moments, not just flawed ones. A highlighted passage might feature an unusually well-supported argument, a moment where someone changed their mind for good reasons, or a subtle reasoning error. This prevents the highlighting from becoming a signal that means "something is wrong here."

**Rhythm:**

1. *Individual (on app):* Student works through the scaffolding sequence, articulating what they notice about each passage
2. *Group discussion (in classroom):* Students share what they noticed — comparing observations, discovering things they missed, encountering different readings of the same passages
3. *AI reveal (on app, teacher-initiated):* AI's observations become visible — students compare the AI's perspective with their own and their peers'

### Phase 2: Analyze

**Cognitive task:** Lens-based evaluation — "What do you see through each lens?"

**Student produces:** Strong/mixed/weak rating through each lens, with articulated reasoning

Students revisit each passage with their Phase 1 response visible and evaluate reasoning quality through the three lenses. For each lens, they rate the passage as strong, mixed, or weak and — crucially — articulate *why*. The rating is a scaffold for expression; the articulation is the learning.

When students rate a passage as mixed, the app prompts: "What's strong about it and what's weak?" This forces the perspectival work that mixed demands — and produces the material that makes group discussion rich.

**Rhythm:**

1. *Individual (on app):* Student evaluates all passages through the three lenses, rating and articulating
2. *Group discussion (in classroom):* Students compare evaluations. The richest discussions emerge from passages where students gave different ratings or articulated different reasons for the same rating. "We both said Evidence is mixed, but I was looking at the sources and you were looking at how much evidence there was."
3. *AI reveal (on app, teacher-initiated):* AI's lens-based analysis becomes visible, including its reasoning about facets within each lens. Students engage: "The AI noticed something about the Logic I didn't see."

### Phase 3: Understand

**Cognitive task:** Explanatory reasoning — "Why did they think this way?"

**Student produces:** Free-text explanation drawing on cognitive patterns and/or social dynamics

Students revisit each passage with their Phase 1 and Phase 2 responses visible and explore *why* the reasoning turned out the way it did — whether strong, weak, or mixed. What was going on in the person's thinking? What was going on in the group?

**Scaffolding.** Because reasoning about causes is genuinely advanced for 6th graders, Phase 3 provides sentence starters that guide thinking without constraining it:

- "I think they reasoned this way because they were focused on..." (attention/cognitive)
- "I think they reasoned this way because they felt..." (emotional/social)
- "I think they reasoned this way because they assumed..." (prior beliefs/cognitive)
- "I think the group..." (group dynamics/social)

The starters scaffold two different angles on the "why" question — cognitive ("what was going on in their thinking?") and social ("what was going on in the group?"). Students pick a starter or write freely.

**Rhythm:**

1. *Individual (on app):* Student writes explanations for all passages, using starters or free response
2. *Group discussion (in classroom):* Students compare explanations. Two students might explain the same passage differently — one through a cognitive lens ("tunnel vision"), another through a social lens ("nobody pushed back"). Both perspectives are valid and complementary
3. *AI reveal (on app, teacher-initiated):* AI introduces formal vocabulary from cognitive science and social psychology. "A cognitive scientist might call this confirmation bias — here's what that means in this context." Students engage with the AI's perspective: "Does that match what I see? Does it name something I was trying to say?"

---

## 4. Operationalization Principles

Seven principles govern how the conceptual framework becomes a working system:

**1. Progressive cognitive demand.** Tasks move from noticing (Phase 1) → analyzing (Phase 2) → explaining (Phase 3). Each phase requires a deeper cognitive operation than the last. Students observe before they categorize, and categorize before they reason about causes.

**2. Three sources of perspective.** Every phase moves through individual thinking → peer collaboration → expert voice (AI). Perspective is enriched at each step, not corrected. The rhythm is consistent across all three phases, reducing teacher cognitive load.

**3. Articulation as the learning mechanism.** The primary student activity is always expressing what they see and why. Free-text over multiple-choice. The act of articulating transforms vague impressions into examinable claims — that transformation is itself the cognitive work.

**4. Three lenses, applied consistently.** Logic, Evidence, and Scope are the recurring structure across every phase and every scenario. Repeated application builds fluency — same lenses, different discussions, deepening perception. Students become practiced at *looking through* the lenses, not just knowing their names.

**5. Scaffolding that fades.** Support is withdrawn progressively — across phases within a session (highlighted → hinted → unguided) and across scenarios over a semester. Early scenarios foreground the three-point scale; later scenarios may fade it, leaving just the lens questions and open articulation.

**6. Vocabulary offered, not imposed.** Formal terms from cognitive science and social psychology are introduced in context by the AI as named perspectives. Students encounter the vocabulary by engaging with it — agreeing, questioning, extending — not by selecting it from a list or memorizing definitions.

**7. Designed for productive ambiguity.** The pipeline creates passages with varied reasoning quality across facets within each lens — strong on some, weak on others. This ensures students see different things through the same lens, producing the perspectival diversity that drives discussion and learning.

---

## 5. Implementation

The system has two parts: a **pipeline** that generates discussion scenarios and a **teaching app** that delivers the three-phase learning experience.

### Pipeline

The v4/v5 pipeline's core architecture carries over: scenario planning → script writing → evaluation. The schema-driven approach (YAML artifacts, validation scripts, structured handoffs) and persona design process are reusable. Key modifications:

- **Lens-based quality design.** The script writer produces passages with intentional reasoning quality profiles across the three lenses and their facets. A passage might be designed as strong-Logic, weak-Evidence, mixed-Scope — creating the productive ambiguity that drives perspectival learning.
- **Both strong and weak reasoning.** Transcripts include moments of genuinely strong reasoning alongside weak and mixed. Characters demonstrate good argumentation practices, not just flawed ones.
- **Positive social dynamics.** Transcripts include moments of constructive challenge, evidence-based mind-changing, and accountability alongside conformity and conflict avoidance.
- **Three-phase AI output.** The evaluator produces three progressive AI perspectives per passage: Phase 1 (what the AI notices, in everyday language), Phase 2 (lens-based analysis with facet-level reasoning), Phase 3 (formal cognitive and social vocabulary in context).
- **Facet annotations.** The pipeline annotates each passage with its intended quality profile across facets, giving the evaluator and the teacher dashboard the information needed to facilitate perspectival discussion.

### Teaching App

The app implements the hybrid learning experience: individual articulation and AI reveals on-device, with teacher-controlled mode transitions and a dashboard showing student perspectives.

Key requirements:

- **Faded scaffolding** in Phase 1 — highlighted, hinted, and unhighlighted passages
- **Three-lens evaluation** in Phase 2 — strong/mixed/weak rating per lens with required articulation, and "what's strong / what's weak?" prompts for mixed ratings
- **Sentence starters** in Phase 3 — cognitive and social angles, with free-text option
- **Progressive AI reveal** — teacher controls when the AI's perspective becomes visible in each phase
- **Perspective dashboard** — shows the teacher the distribution of student ratings and the diversity of articulations, surfacing passages where students see different things (rich discussion opportunities)

Detailed implementation plans are in a separate operationalization document.

---

## 6. Open Questions

1. **Facet validation.** The facets within each lens (Evidence: quantity, quality, relevance, sufficiency; Logic: validity, consistency, completeness; Scope: perspectives, consequences, conditions) need validation. Are these the right decompositions? Are they independent? Are there gaps?

2. **Assessment.** Under the perspectival model, assessment shifts from correctness to quality of articulation and engagement. What rubrics capture this? What role does the AI play in helping teachers assess free-text responses?

3. **Scaffolding calibration.** How much structure do the weakest students need? The spectrum (strong/mixed/weak) may be too open-ended for some students, especially early in the semester. The sentence starters in Phase 3 help, but Phase 2's articulation requirement may need additional scaffolding for lower-readiness students.

4. **Mixed-rating prompts.** When a student selects "mixed," the app prompts further articulation. What's the right prompt design? "What's strong and what's weak?" is one option, but it may re-impose binary thinking. An alternative: "What different things do you see?"

5. **Pipeline complexity.** Designing passages with intentional multi-facet quality profiles is harder than designing passages with single embedded flaws. How does this affect pipeline reliability and the scenario authoring process?

---

## 7. Future Work

### Extended Phase Progression

The three v5.2 phases — Notice, Analyze, Understand — form the core of a richer cognitive progression. Three additional phases extend the arc from evaluation through construction and transfer:

| Phase | Cognitive operation | What the student does |
|---|---|---|
| **1. Notice** (v5.2) | Noticing | "Here's what I see" |
| **2. Analyze** (v5.2) | Lens-based evaluation | "Here's what I see through each lens" |
| **3. Understand** (v5.2) | Explanatory reasoning | "Here's why they thought this way" |
| **4. Counter** (future) | Construction | "Here's what stronger reasoning would look like" |
| **5. Transfer** (future) | Application | "I can evaluate reasoning in a new context" |
| **6. Synthesize** (future) | Integration | "Here's my overall evaluation of this discussion" |

### Phase 4: Counter

Students revisit a passage and construct what stronger reasoning would look like — better evidence, sounder logic, broader scope, or healthier group dynamics. This shifts from evaluative to constructive thinking.

### Phase 5: Transfer

Students encounter a different discussion (or real-world material — a news article, an advertisement, a classroom debate) and apply the three lenses without scaffolding. Each new scenario across a semester is itself a transfer opportunity.

### Phase 6: Synthesize

Students step back from individual passages and evaluate the discussion as a whole: Which lenses revealed the most issues? How did individual reasoning moments interact? What would have made this a better discussion? This could work as a teacher-facilitated wrap-up using accumulated data from Phases 1–3.

### Positive Cognitive and Social Vocabulary

The current framework includes positive social dynamics (constructive challenge, evidence-based mind-changing, building on ideas, holding accountable). The cognitive pattern vocabulary is primarily negative (biases and errors). Future work should develop a richer positive cognitive vocabulary — intellectual humility, evidence-seeking, perspective-taking, proportional updating — grounded in empirical research. These patterns are real but less precisely defined than their negative counterparts; careful construction is needed to ensure they are specific, observable, and nameable rather than abstract virtues.

### Implementation Notes

Future phases are not planned for v5.2. The core (Notice → Analyze → Understand) is sufficient for a first operationalization of the perspectival framework. Future phases should be validated through classroom experience before implementation.
