# Polylogue 4 — Perspectives App UI/UX Design

## How to Use This Document

This document is a **reference specification** for the Perspectives app. It describes what each screen looks like, how each component behaves, what data it consumes, and how interactions work.

**This document is not read linearly.** It is structured for lookup. The developing agent reads `implementation-app.md` as its primary sequencing instructions and references specific sections of this document when building a screen or component. Each implementation phase in `implementation-app.md` points to the exact sections here that the developing agent should consult.

**Cross-reference syntax.** When `implementation-app.md` references this document, it uses the format: `uiux-app.md > Section > Subsection`. For example: `uiux-app.md > Student Flow > Phase 1 > Work Panel`.

### Section Index

| Reference key | Section | What it covers |
|--------------|---------|---------------|
| `Design Principles` | Design Principles | 7 principles governing all UI decisions |
| `Design Language` | Design Language | Visual direction for student vs. teacher interfaces |
| `Design Language > Student` | Design Language > Student Interface | Spacious, visual, touch-first direction |
| `Design Language > Teacher` | Design Language > Teacher Interface | Data-dense, efficient, professional direction |
| `Engagement` | Engagement Mechanics | Discovery moments, progress satisfaction, revision as growth, social presence |
| `Data Contracts` | Data Contracts | Schema-to-component mapping, sentence ID format, evaluation split |
| `Student > Join` | Student Flow > Join Session | Session code entry, authentication |
| `Student > Phase 1` | Student Flow > Phase 1 | Transcript display, sentence selection, annotation creation, detection act picker |
| `Student > Phase 1 > Transcript` | Student Flow > Phase 1 > Transcript Panel | Turn display, sentence selection, annotation markers |
| `Student > Phase 1 > Work Panel` | Student Flow > Phase 1 > Work Panel | Empty state, annotation form, guided first annotation, annotation list |
| `Student > Phase 2` | Student Flow > Phase 2 | Thinking behavior assignment, library browser, submission flow |
| `Student > Phase 2 > Work Panel` | Student Flow > Phase 2 > Work Panel | Annotation checklist, behavior assignment form, progressive disclosure, submit button |
| `Student > Phase 3` | Student Flow > Phase 3 | Peer comparison, three-level comparison logic, free-text handling, revision |
| `Student > Phase 3 > Transcript` | Student Flow > Phase 3 > Transcript Panel | Three-layer annotation markers, color coding |
| `Student > Phase 3 > Comparison` | Student Flow > Phase 3 > Work Panel > Tab 1 | Agreement/disagreement cards, comparison logic |
| `Student > Phase 3 > My Annotations` | Student Flow > Phase 3 > Work Panel > Tab 2 | Revision during discussion, new annotations |
| `Student > Phase 4` | Student Flow > Phase 4 | AI reveal, evaluation display, "AI missed this" discovery |
| `Student > Phase 4 > AI Tab` | Student Flow > Phase 4 > Work Panel > AI Perspective | AI annotation cards, field mapping from evaluation_student.yaml |
| `Teacher > Dashboard` | Teacher Flow > Dashboard Home | Active sessions, available scenarios, import |
| `Teacher > Create Session` | Teacher Flow > Create Session | Scenario selection, group assignment, session code |
| `Teacher > Monitor` | Teacher Flow > Active Session | Student activity table, phase controls, detail panel |
| `Teacher > Monitor > Student Monitor` | Teacher Flow > Active Session > Student Monitor | Per-student status indicators, annotation counts |
| `Teacher > Monitor > Phase Controls` | Teacher Flow > Active Session > Phase Controls | Advance confirmation dialog, force-advance |
| `Teacher > Cheat Sheet` | Teacher Flow > Cheat Sheet Page | Facilitation guide rendering, schema field mapping |
| `Component > TranscriptView` | Component Specifications > TranscriptView | Props, schema, behavior |
| `Component > AnnotationPanel` | Component Specifications > AnnotationPanel | Modes, fields, schema mapping |
| `Component > DetectionActPicker` | Component Specifications > DetectionActPicker | Schema fields, display, output |
| `Component > ThinkingBehaviorBrowser` | Component Specifications > ThinkingBehaviorBrowser | Schema fields, progressive disclosure, library-first |
| `Component > ComparisonView` | Component Specifications > ComparisonView | Three-level comparison logic, free-text handling |
| `Component > PhaseIndicator` | Component Specifications > PhaseIndicator | Display, animation |
| `Component > StudentActivityTable` | Component Specifications > StudentActivityTable | Schema fields, polling, status indicators |
| `Scaffolds` | Learning Scaffolds | Topic context, reading hints, guided first detection, lifelines, reflection |
| `Scaffolds > Lifelines` | Learning Scaffolds > Lifeline System | Graduated hints, targeting logic, lifeline count, schema |
| `Scaffolds > Guided First` | Learning Scaffolds > Guided First Detection | Onboarding mechanic for first 2-3 scenarios |
| `Scaffolds > Reflection` | Learning Scaffolds > Reflection Step | Post-Phase 4 metacognitive prompts |
| `Interactions > Sentence Selection` | Interaction Patterns > Sentence Selection | Tap mechanics, multi-select, cross-turn |
| `Interactions > Annotation Lifecycle` | Interaction Patterns > Annotation Lifecycle | Draft → submitted → revised states |
| `Interactions > Phase Transitions` | Interaction Patterns > Phase Transitions | Transition behavior, polling detection |
| `Interactions > Polling` | Interaction Patterns > Polling Behavior | Intervals, what's polled |
| `Tablet` | Tablet Interaction Model | Device targets, portrait mode, keyboard, gestures, typography |

---

## Design Principles

1. **Transcript is the anchor.** The discussion transcript is always visible. Everything else — annotations, comparisons, AI perspectives — layers on top of it. Students never lose sight of the source text.

2. **Progressive disclosure.** Each phase reveals new capabilities and information. Phase 1 shows only the transcript and annotation tools. Phase 2 adds thinking behaviors. Phase 3 adds peer annotations. Phase 4 adds AI annotations. Nothing appears before its phase.

3. **6th-grade language and complexity.** All UI text — labels, instructions, prompts, tooltips — uses vocabulary and sentence structures appropriate for 11-12 year olds. No jargon. No multi-clause instructions. Buttons say what they do.

4. **Perspectives, not answers.** The UI never frames anything as correct or incorrect. Peer annotations are "what your group noticed." AI annotations are "what the AI noticed." The language is always "do you agree?" not "were you right?"

5. **Touch-first, tablet-native.** Primary users are 6th graders on iPads and Chromebooks. All interactive elements are at least 44px tall. Sentence selection works by tap, not precise cursor placement. Layouts, gestures, and keyboard behavior are designed for tablet use first, desktop second.

6. **Two audiences, two design languages.** The student interface and teacher interface look and feel like different products. Students get a spacious, visual, engaging experience. Teachers get a data-dense, efficient, professional tool. (See Design Language section below.)

7. **Engagement without scoring.** The app keeps 6th graders interested through discovery, progress, and social dynamics — not points, scores, or correctness judgments. Engagement mechanics reinforce the "perspectives, not correctness" principle. (See Engagement Mechanics section below.)

---

## Design Language

The student and teacher interfaces serve different goals and should feel distinct.

### Student Interface — Inviting, Visual, Touch-First

**Goal:** A 6th grader opens this and wants to use it. It feels more like an app they'd choose than a school assignment.

**Visual direction:**
- Spacious layout with generous whitespace — never cramped or text-heavy
- Large type (16-18px body, 20px+ headers), high-contrast colors
- Rounded corners, soft shadows, subtle depth — modern and approachable
- Persona colors are vibrant and distinct (not muted pastels)
- Minimal chrome — the transcript and annotations dominate; navigation and controls recede
- Micro-animations for state changes: annotation saved (brief scale + checkmark), phase transition (smooth panel slide), new peer annotations appearing (fade in)

**Copy tone:**
- Conversational, direct, encouraging
- "Here's what the AI noticed" not "AI Evaluation Results"
- "You found something nobody else caught!" not "Unique annotation detected"
- "It's okay to change your mind!" not "Revision is permitted during Phase 3"
- Error/empty states use friendly language: "Nothing here yet — start reading and tap on anything that seems off" not "No annotations found"

**Interaction model:**
- Touch-first: tap to select, tap to expand, tap to save
- Large, clearly labeled buttons with verbs: "Save," "Submit My Work," "Edit"
- No hover states as primary affordances (unreliable on touch)
- Visual feedback on every tap (ripple, highlight, color change) — the student should never wonder "did that work?"

### Teacher Interface — Efficient, Data-Dense, Professional

**Goal:** A teacher managing 12-15 groups of 4-5 students can scan the room's status in seconds and find the right intervention quickly.

**Visual direction:**
- Compact layout — more information per screen, less whitespace than student view
- Smaller type (14px body, 16px headers), denser information hierarchy
- Clean, professional aesthetic — neutral colors, minimal decoration
- Status indicators use color coding (green/yellow/red) for at-a-glance scanning
- Tables and lists over cards — optimized for scanning, not browsing

**Copy tone:**
- Concise, professional, action-oriented
- "28 of 30 active, 12 submitted" not "Almost everyone is working!"
- "Advance to Phase 3" not "Let's move to the next step!"
- Data labels are short: "Annot." not "Annotations," "Sub." not "Submitted"

**Interaction model:**
- Keyboard-friendly: teacher is likely on a laptop while circulating
- Quick actions: advance phase, view student, view group — minimal clicks
- Bulk operations: force-advance affects all students at once
- The dashboard is optimized for a laptop screen at a teacher's desk or lectern; not tablet-optimized (teacher may use a tablet but it's secondary)

---

## Engagement Mechanics

Engagement mechanics keep 6th graders interested without introducing scoring or correctness judgments. Every mechanic reinforces the learning goals — they reward observation, thoughtful explanation, and intellectual openness, not accuracy.

**Constraint:** No points, scores, leaderboards, accuracy percentages, or comparisons against a "correct" answer. These would contradict the "perspectives, not correctness" principle. The AI's annotations in Phase 4 are explicitly not a scoring rubric.

### Discovery Moments

When the Phase 3 comparison view reveals that a student noticed something unique, the app celebrates it:

- **"Only you caught this!"** — Unique annotation card in Phase 3 uses distinct visual treatment (not just a blue card — a subtle glow or badge) and encouraging language: "You found something nobody else in your group noticed. Tell them about it!"
- **"Look what your group found"** — When Phase 3 opens, a brief animated reveal shows the number of annotations from the group: "Your group marked 9 moments in the discussion. Let's see what everyone noticed."
- **"The AI missed this"** — In Phase 4, if a student annotated a location the AI didn't, the app highlights it: "You noticed something here that the AI didn't. What do you think?"

### Progress Satisfaction

Visual progress through the four phases provides completion satisfaction without scoring:

- **Phase indicator animation.** When a phase completes, the number circle fills with a smooth animation and a checkmark appears. Not a score — just "you did this part."
- **Annotation count as personal progress.** "Your Annotations (3)" grows as the student works. This is visible progress, not a target to hit. No "you need at least X annotations" messaging.
- **Submission moment.** When the student submits in Phase 2, a brief celebration animation: the work panel transitions to a "Submitted!" state with a visual flourish (confetti is too much; a smooth checkmark with a satisfying color change is right). This acknowledges effort, not correctness.

### Revision as Growth

Phase 3 and 4 revisions are framed as intellectual growth, not error correction:

- **"Changed my thinking" label.** Revised annotations show a small badge: "Updated in Phase 3" or "Updated after seeing the AI's perspective." This is a mark of thoughtfulness, not a mark of having been wrong.
- **Revision prompt.** After seeing peer annotations in Phase 3, a gentle prompt: "Now that you've seen what your group found, is there anything you'd change or add?" Not "Were you wrong?" but "Has your thinking evolved?"

### Social Presence

Students see evidence that their peers are engaged, creating social motivation:

- **Group member colors.** Each group member has a distinct, vibrant color. Seeing your color and your peers' colors on the transcript creates ownership and social presence.
- **Comparison as conversation fuel.** The comparison view's prompts ("Talk about it!", "Ask them about it!") push toward verbal interaction. The app creates reasons to talk, not reasons to compete.
- **Peer annotation count in Phase 3.** "Your group marked 9 moments" (aggregate, not per-student) creates collective engagement without individual comparison.

---

## Learning Scaffolds

Learning scaffolds help students succeed at the critical thinking task without giving away answers. They are progressive — available when needed, invisible when not — and they produce research-valuable data about where students struggle.

### Topic Context

Before reading the transcript, students see a brief introduction pulled from the scenario plan's `topic` and `context` fields:

```
┌─────────────────────────────────┐
│  About this discussion          │
│                                 │
│  A group of 6th graders is      │
│  researching ocean plastic      │
│  pollution for their            │
│  environmental science project. │
│  They're planning an awareness  │
│  campaign for their school.     │
│                                 │
│  [Start Reading]                │
└─────────────────────────────────┘
```

This gives students the same background the personas have. Without it, students are evaluating a conversation they walked into mid-stream. The `topic` and `context` fields are not sensitive — they don't reveal flaw design.

### Reading Strategy Hints

Each detection act in the picker includes a one-line reading strategy hint — not just the question, but *how to read* for it:

| Detection act | Question | Reading strategy hint |
|---|---|---|
| Something's wrong | "That's not right" | Read each turn and ask: is that actually true? |
| Not enough support | "How do they know that?" | When someone sounds really sure, check: how much evidence do they have? |
| Something's missing | "They didn't think about ___" | After reading the plan, ask: what would you need to know to actually do this? |
| Doesn't fit together | "That doesn't match" | Compare what they said at the beginning to what they concluded at the end |
| Not really resolved | "They agreed but didn't solve it" | Follow one person's turns in order — did anyone change their mind? Why? |

Hints appear as secondary text below each detection act option in both the empty state reference list and the annotation form's detection act picker. They are static text derived from the detection act library, not generated per scenario.

### Guided First Detection

For the first 2-3 scenarios a student encounters (controlled by the teacher or by session count), the app provides a guided path to the first annotation. This teaches the detection process by example.

**Trigger:** Student finishes reading and has 0 annotations. The work panel transitions from the empty state to a guided prompt.

**Flow:**
1. The app selects the most detectable flaw from the evaluation's `facilitation_guide.what_to_expect` — the entry rated `most_will_catch`.
2. A prompt appears: "Let's start with turn [N]. Read what [persona] says. Does anything stand out to you?" The transcript scrolls to or highlights the target turn.
3. The student reads the narrowed section, selects sentences, and fills in the annotation form. The detection act picker may show a subtle suggestion: "Think about this question: [act's student_question]."
4. After saving, the app celebrates: "Great catch! Now read the rest of the discussion and see if you notice anything else on your own."
5. From here, no more guided prompts — the student annotates independently.

**The guided detection does NOT consume a lifeline.** It is an onboarding mechanic, separate from the lifeline system. It teaches the process; lifelines help when students are stuck after learning the process.

**Data source:** `evaluation.yaml` → `facilitation_guide.what_to_expect[]` — the entry with `difficulty: most_will_catch`. The turn reference and detection act are derived from this entry's `turns` and `flaw` fields.

### Flaw Pattern Library (On-Demand)

After a student creates at least one annotation, the flaw pattern library for each detection act becomes accessible as an optional reference. This gives students vocabulary for what they're finding without turning detection into a matching exercise.

**Presentation:** In the Phase 1 work panel's active state, each detection act in the reference list has a collapsible "What kinds of problems are in this category?" section. Tapping expands it to show the act's patterns — each pattern's `plain_language` name and `description` from the detection act library.

**Not shown by default.** The library is collapsed and only opens when the student actively chooses to look. This preserves intuition-first reading — students notice something first, then optionally check whether it matches a known pattern.

**This is already partially implemented** in the detection act picker's expand behavior (line 381, 425). The enhancement is making the pattern descriptions available in the reference list (not just the annotation form) and framing them as an optional vocabulary resource.

### Re-Reading Nudge

After a student saves their first annotation, a prompt appears at the top of the work panel:

"Nice work! Now try reading the discussion again with a different question in mind."

This nudges re-reading — essential for Acts 3-5, which often require a second pass with a different detection question. The nudge appears once, is dismissible, and does not reappear.

### Lifeline System

Students receive a limited number of **lifelines** per scenario — voluntary hints they can request when stuck. Lifelines provide graduated scaffolding: each level reveals more specific guidance without giving the answer.

**Lifeline count:** Configurable per session by the teacher (default: 3). Stored in the session configuration as `lifelines_per_student: integer`. Resets each scenario.

**Lifeline button:** A persistent button in the Phase 1 and Phase 2 work panels, showing remaining count: "Lifelines: 2 remaining."

**Targeting logic — student-directed:** When the student taps the lifeline button, a prompt appears: "Which part of the discussion do you want help with?" with three options mapping to regions of the transcript (beginning / middle / end, derived by splitting the transcript's turn count into thirds). The system targets the nearest unfound flaw in the selected region by matching each `what_to_expect[].flaw` against the evaluation's `annotations[]` by `argument_flaw.pattern`, then using the annotation's `location.turn` to determine which region it falls in. If no unfound flaw exists in that region, the app suggests trying a different region: "Nothing new to find there — try another section."

**Graduated hint levels:**

| Level | What it reveals | Data source | Example |
|---|---|---|---|
| 1: Character | A persona trait relevant to the flaw | Derived from `scenario.yaml` persona weaknesses via template. If `facilitation_guide.phase_2[].character_hint` is present in the evaluation, use it instead (pre-written, more tailored). Never shown raw. | "Think about Mia. She's really passionate about this topic. How might that affect what she says?" |
| 2: Location | Where to look | Flaw location resolved via `evaluation.yaml` annotations (matched by `what_to_expect[].flaw` → `annotations[].argument_flaw.pattern` → `annotations[].location.turn`) | "Re-read turns 5 through 8. Something interesting happens there." |
| 3: Question | What detection question to ask | `facilitation_guide.phase_1[].prompt` (the detection question) | "As you read those turns, ask yourself: How does Mia know that?" |
| 4: Pattern | The flaw pattern description | Detection act library `patterns[].plain_language` + `description` | "One pattern to watch for: 'They're saying a lot based on very little.'" |

**Level 1 is optional.** The app derives a character hint from `scenario.yaml` persona weaknesses using a template: "Think about [name]. [weakness rephrased as question]." If `character_hint` is present in `facilitation_guide.phase_2[]` for this flaw, it takes precedence (pre-written by the evaluator, more tailored). If neither source produces a usable hint, the system starts at Level 2. Each lifeline use reveals the next available level.

**Phase 2 lifelines.** The same lifeline pool extends to Phase 2. A Phase 2 lifeline narrows the thinking behavior options from 8 to 2-3 (using `facilitation_guide.phase_2[].narrowed_options`) or offers the perspective prompt (using `facilitation_guide.phase_2[].perspective_prompt`). Same graduated approach — first narrow, then prompt.

**Lifeline exhaustion.** When all lifelines are used, the button shows "No lifelines remaining" (disabled). A supportive message appears: "You've used all your lifelines. Keep reading and trying — your teacher can help too." The teacher dashboard flags students who have exhausted lifelines with 0 or few annotations as needing direct intervention.

**Schema addition.** Each student annotation tracks hint usage: `hints_used: integer` (how many lifeline levels were revealed for this annotation, 0 if none). This is research-valuable data — which flaws need the most hints across students and scenarios.

### Inline Perspective Prompts (Phase 2)

When a student is assigning a thinking behavior in Phase 2 and hasn't written anything in the explanation field for 30+ seconds, an optional hint appears below the explanation prompt:

"Need a starting point? Try this: Imagine you're [persona name]. [perspective_prompt from facilitation guide]."

**Data source:** `evaluation.yaml` → `facilitation_guide.phase_2[]` — matched to the student's annotation by flaw pattern overlap. The `perspective_prompt` field provides the empathy-based prompt.

**Presentation:** Collapsible, appears as a subtle "Need a hint?" link. Only one per annotation. Does not consume a lifeline (it's Phase 2-specific scaffolding, not the lifeline system).

### Phase 4: Overlap Framing

When AI annotations are revealed in Phase 4, the app compares student annotations against AI annotations by **sentence ID overlap** (any shared sentence IDs between student and AI annotation locations). Where overlap is found:

```
┌───────────────────────────────┐
│ ✓ You found this too!          │
│                                │
│ Your take:                     │
│ "She said the research proves  │
│  it but she only read two      │
│  articles"                     │
│                                │
│ The AI's take:                 │
│ "The AI thinks Mia might be    │
│  saying a lot more than her    │
│  sources can back up..."       │
│                                │
│ Do you agree with how the AI   │
│ explained it?                  │
└───────────────────────────────┘
```

This frames the AI as a peer to compare against, not an answer key. The student's work is validated ("you found this too") and they're invited to evaluate the AI's explanation rather than accept it.

For AI annotations with no student overlap: "The AI noticed something in turns [N] that you didn't mark. Read it — do you agree?"

### Reflection Step (Post-Phase 4)

After Phase 4 discussion time, before the session ends, a reflection prompt appears in the student's work panel:

```
┌─────────────────────────────────┐
│  Before you go...               │
│                                 │
│  What's one thing you noticed   │
│  on re-reading that you missed  │
│  the first time?                │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│  What will you look for in the  │
│  next discussion?               │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│  [Done]                         │
└─────────────────────────────────┘
```

**Why this matters:** Without structured reflection, the activity ends at Phase 4 and the learning stays in that scenario. Reflection is the metacognitive step that builds transfer — students articulate what strategies worked and what they'd do differently. These responses are stored per student per session and are valuable research data.

**Trigger:** The teacher activates the reflection step (a button on the teacher dashboard after Phase 4 discussion has had sufficient time). Students see the reflection form in their work panel. Responses are optional but encouraged. The session ends after reflection, or when the teacher closes it.

---

## Data Contracts

Every UI component consumes data produced by the pipeline. This section maps UI elements to their source artifacts and specifies which fields render where. The app reads artifacts from researcher-configured paths (`REFERENCE_LIBRARIES_PATH` and `REGISTRY_PATH`) and imports them into SQLite at setup or per-scenario import time. The app never reads from pipeline config directories.

### Pipeline Artifacts Consumed by the App

| Artifact | File | Consumed by | Import timing |
|----------|------|-------------|---------------|
| Detection act library | `detection_act_library.yaml` (from `REFERENCE_LIBRARIES_PATH`) | DetectionActPicker, Phase 1 reference panel | One-time seed at setup |
| Thinking behavior library | `thinking_behavior_library.yaml` (from `REFERENCE_LIBRARIES_PATH`) | ThinkingBehaviorBrowser, Phase 2 assignment | One-time seed at setup |
| Discussion transcript | `script.yaml` (from scenario directory in `REGISTRY_PATH`) | TranscriptView | Per-scenario import |
| Evaluation (student-facing) | `evaluation_student.yaml` (from scenario directory) | Phase 4 AI Perspective tab | Per-scenario import |
| Evaluation (full) | `evaluation.yaml` (from scenario directory) | Teacher dashboard, cheat sheet, detail panel | Per-scenario import |
| Scenario plan | `scenario.yaml` (from scenario directory) | Teacher dashboard context (not student-visible) | Per-scenario import |
| Pedagogical review | `pedagogical_review.yaml` (from scenario directory, optional) | Teacher dashboard quality score | Per-scenario import |

### App-Produced Data (Runtime)

| Data | Prisma model | Produced by | Consumed by |
|------|-------------|-------------|-------------|
| Student annotations | `Annotation` | Student annotation flow (Phases 1-4) | ComparisonView, teacher detail panel |
| Session configuration | `ClassSession` | Teacher session creation + runtime updates | Phase controls, student monitor, phase transitions |

### Sentence ID Format

The pipeline's `enumerate_turns.py` (implementation-pipeline.md Phase 6) assigns sequential IDs to every turn and sentence in the transcript:
- Turn IDs: `turn_01`, `turn_02`, ...
- Sentence IDs: `turn_01.s01`, `turn_01.s02`, ...

These IDs are the universal reference system for locations throughout the app. Student annotations store locations as arrays of sentence IDs (e.g., `["turn_05.s02", "turn_05.s03"]`). Evaluation annotations reference the same IDs. The ComparisonView matches annotations by comparing these ID arrays for overlap.

### Evaluation Split

The pipeline's `export_for_app.py` (implementation-pipeline.md Phase 6) extracts the student-facing subset from the full evaluation into a separate file. The app imports both `evaluation.yaml` (for the teacher) and `evaluation_student.yaml` (for students), routing them to different views:

| Field | `evaluation_student.yaml` | `evaluation.yaml` | Student sees? | Teacher sees? |
|-------|--------------------------|---------------------------|---------------|---------------|
| `annotation.location` | Yes | Yes | Yes | Yes |
| `annotation.argument_flaw.pattern` | Yes | Yes | Yes | Yes |
| `annotation.argument_flaw.detection_act` | Yes | Yes | Yes | Yes |
| `annotation.argument_flaw.explanation` | Yes | Yes | Yes | Yes |
| `annotation.thinking_behavior.pattern` | Yes | Yes | Yes | Yes |
| `annotation.thinking_behavior.explanation` | Yes | Yes | Yes | Yes |
| `annotation.thinking_behavior.plausible_alternatives` | **No** | Yes | No | Yes (cheat sheet) |
| `annotation.planned` | **No** | Yes | No | Yes |
| `quality_assessment` | **No** | Yes | No | Yes |
| `facilitation_guide` | **No** | Yes | No | Yes (cheat sheet) |

### Quality Assessment Awareness

The pipeline's `evaluate_script` produces `quality_assessment.issues` flagging flaws as `"too_subtle"`, `"too_obvious"`, or `"missing_flaw"`. These flags are visible only to the teacher (via `evaluation.yaml`). The student UI renders the transcript as-is — it does not adapt based on quality flags. The teacher uses quality flags to decide which scaffolds to deploy and whether to draw attention to specific turns during facilitation.

---

## Screen Inventory

### Student Screens

| Screen | Route | When visible |
|--------|-------|-------------|
| Join session | `/student` | Before entering a session |
| Activity view | `/student/session/[id]` | All phases — single screen, content changes per phase |

The student experience is a **single persistent screen** that evolves across phases. The transcript and annotation panel are always present; what's available in each panel changes with the active phase. This avoids page navigation confusion for 6th graders — they stay in one place, and new things appear as the teacher advances.

### Teacher Screens

| Screen | Route | When visible |
|--------|-------|-------------|
| Dashboard home | `/teacher` | Always |
| Create session | `/teacher/session/new` | Creating a new session |
| Active session | `/teacher/session/[id]` | Monitoring an in-progress session |
| Cheat sheet | `/teacher/session/[id]/cheatsheet` | Before or during class (printable) |

---

## Student Flow

### Layout: Persistent Two-Panel Structure

The student screen uses a two-panel layout throughout all phases:

```
┌──────────────────────────────────────────────────────────┐
│  Phase Indicator                              [1] 2 3 4  │
├────────────────────────────┬─────────────────────────────┤
│                            │                             │
│   TRANSCRIPT PANEL         │   WORK PANEL                │
│   (left, ~60% width)      │   (right, ~40% width)       │
│                            │                             │
│   Discussion transcript    │   Content changes per phase │
│   with sentence selection  │                             │
│                            │                             │
│                            │                             │
│                            │                             │
│                            │                             │
├────────────────────────────┴─────────────────────────────┤
│  Status bar: "Phase 1: Read the discussion and mark      │
│  anything that seems off"                                │
└──────────────────────────────────────────────────────────┘
```

**Transcript panel (left):** Always shows the full discussion. Scrollable. Sentence selection is always enabled. Visual overlays change per phase (own annotations, peer annotations, AI annotations).

**Work panel (right):** Content depends on the active phase. Phase 1: annotation creation. Phase 2: thinking behavior assignment. Phase 3: peer comparison details. Phase 4: AI perspective details.

**Phase indicator (top):** Shows all 4 phases as numbered steps. Current phase is highlighted. Completed phases are marked. Future phases are grayed out. Not clickable — students cannot navigate between phases; the teacher controls advancement.

**Status bar (bottom):** One sentence describing what to do in the current phase. Changes per phase. Always visible.

On narrow screens (Chromebook <1200px) and iPads in portrait, the panels stack vertically with a panel switcher (see Tablet Interaction Model below).

---

### Join Session

The student enters a session using a code provided by the teacher.

**Layout:**
- Centered card on screen
- Session code input field (6-character alphanumeric, large font)
- Student name input field (full name, e.g., "Amaya Torres")
- "Join" button

**Behavior:**
- Validates session code exists and session is active (not archived)
- Validates student name against the pre-assigned list (case-insensitive, whitespace-trimmed). Error message if no match: "We don't see that name in this session. Check with your teacher."
- On success: redirects to the activity view, Phase 1

**Late-arriving students.** Students always enter Phase 1 regardless of the session's current phase. A student who arrives when the class is in Phase 2 or 3 works through Phase 1 at their own pace. At the next teacher phase advance, they are force-submitted and snapshotted like everyone else — their annotations may be incomplete (no thinking behaviors assigned) and this is handled gracefully in comparison views.

**Reconnection.** If a student's browser has a valid session cookie (JWT), navigating to `/student` redirects them directly to their active session without re-entering credentials. If the cookie has expired (e.g., device restart, cleared cookies), re-entering the same session code + name re-authenticates into their existing session state with all annotations preserved.

**No account creation.** Students are pre-assigned to groups by the teacher. The join screen authenticates them into their assigned slot. The session code + full name combination is the authentication mechanism.

**Display names.** The app stores the full name but displays first name + last initial everywhere (comparison cards, annotation markers, student monitor). Display names are derived automatically — the teacher enters full names during session creation and the app handles the rest.

---

### Phase 1: Recognize Argument Flaws

**Goal:** Student reads the transcript and marks moments where something seems wrong with the argument.

#### Transcript Panel (left)

**Turn display.** The transcript is loaded from `discussion_transcript.yaml`. Each turn is a visually distinct block, identified by its `turn_id` (e.g., `turn_01`). Each sentence within a turn has a unique `id` (e.g., `turn_01.s01`) — these IDs are not displayed to students but are used internally to track selection and annotation locations.

```
┌─────────────────────────────────┐
│  Mia (Researcher)               │  ← personas[].name + personas[].role
│                                 │
│  [turn_01.s01 text]             │  ← turns[0].sentences[0].text
│  [turn_01.s02 text]             │  ← turns[0].sentences[1].text
│  [turn_01.s03 text]             │  ← turns[0].sentences[2].text
└─────────────────────────────────┘
```

- Persona `name` and `role` from the transcript's `personas` array displayed as a header on each turn block (not `perspective`, `strengths`, or `weaknesses` — those are in the scenario plan only and never reach the student)
- Each persona has a distinct color accent (left border or background tint) — consistent across all turns by that persona
- Sentences within a turn are individual selectable units, keyed by their `id` field
- Visual gap between turns to make boundaries clear

**Sentence selection.**
- Tap/click a sentence to select it (highlight with selection color)
- Tap again to deselect
- Can select multiple sentences (contiguous or non-contiguous within or across turns)
- Selected sentences are visually highlighted (background color change, e.g., light yellow)
- When at least one sentence is selected, a "Mark this" button appears at the bottom of the selection, or the work panel activates with the annotation form

**Annotation markers.** After a student creates an annotation, the annotated sentences show a colored underline or left-margin indicator. Tapping an existing annotation marker opens it in the work panel for review/editing.

#### Work Panel (right) — Phase 1

**Empty state (0 annotations, no sentence selected):**

```
┌─────────────────────────────────┐
│                                 │
│  👋 Start by reading the        │
│  discussion on the left.        │
│                                 │
│  When something seems off —     │
│  maybe someone said something   │
│  that doesn't sound right, or   │
│  they didn't back up what they  │
│  said — tap on that sentence.   │
│                                 │
│  Try reading with one of these  │
│  questions in mind:             │
│                                 │
│  ▸ Is something wrong?          │
│  ▸ Is there not enough support? │
│  ▸ Is something missing?        │
│  ▸ Does it not fit together?    │
│  ▸ Is it not really resolved?   │
│                                 │
└─────────────────────────────────┘
```

The empty state uses inviting language and tells the student exactly what to do first: read, then tap. The five detection questions are presented as reading lenses — ways to re-read the transcript with a specific focus.

**Active state (1+ annotations, no sentence selected):** The empty state guidance disappears. Replaced by the annotation list and the five detection questions as a compact reference panel:

```
┌─────────────────────────────────┐
│  Your Annotations (2)           │
│                                 │
│  1. Turn 5, sentences 2-3 (Mia) │
│     ...                         │
│  2. Turn 9, sentence 1 (Jaylen) │
│     ...                         │
│                                 │
│  Try these questions to find    │
│  more:                          │
│  ▸ Is something wrong?          │
│  ▸ Is there not enough support? │
│  ▸ ...                          │
└─────────────────────────────────┘
```

The five detection questions are always visible as a reference list, rendered from `detection_act_library.yaml`. Each is an expandable accordion showing the act's `name` and `student_question`. Tapping expands it to show the act's `patterns` array (each pattern's `plain_language` name and `description`). This is a reference — it does not create an annotation.

**Reading nudge.** If a student has been reading for 3+ minutes with 0 annotations, a gentle prompt appears at the top of the work panel: "Try re-reading the discussion from the beginning. Use one of the questions below as a lens — for example, read it while asking 'How do they know that?'" This prompt is dismissible and does not reappear once dismissed. **This is a client-side computation** — the client starts a local timer when Phase 1 renders and tracks the annotation count from its own state (the client created the annotations, so it knows the count without polling). No server call or `student_activity` polling is needed for this nudge. The server-side `student_activity` fields serve the teacher dashboard, not the student's own UI.

When sentences are selected, the work panel switches to annotation creation:

```
┌─────────────────────────────────┐
│  What did you notice?           │
│                                 │
│  Selected: turn 5, sentences    │
│  2-3 (Mia)                     │
│                                 │
│  What type of problem is this?  │
│                                 │
│  ○ Something's wrong            │
│    "That's not right"           │
│                                 │
│  ○ Not enough support           │
│    "How do they know that?"     │
│                                 │
│  ○ Something's missing          │
│    "They didn't think about___" │
│                                 │
│  ○ Doesn't fit together         │
│    "That doesn't match"         │
│                                 │
│  ○ Not really resolved          │
│    "They agreed but didn't      │
│     actually solve it"          │
│                                 │
│  Describe what you noticed:     │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │ (free text, 2-4 lines)  │    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│  [Save]              [Cancel]   │
└─────────────────────────────────┘
```

**Guided first annotation.** The first time a student selects sentences and sees the annotation form, a brief inline guide appears above the form fields: "Nice! You found something. Now: (1) Pick which type of problem it is, (2) Describe what you noticed in your own words." This guide disappears after the first annotation is saved and does not reappear.

**Detection act selection.** Radio buttons — student picks exactly one. Each option renders from `detection_act_library.yaml`: the act's `name` field (e.g., "Not enough support") and `student_question` field (e.g., "How do they know that?") in smaller text beneath. When selected, the act expands to show its `patterns` array as a secondary reference — each pattern displays its `plain_language` field (e.g., "They're saying a lot based on very little") and `description` field. This is informational, helping the student confirm they chose the right act — not a required sub-selection. The selected act's `act_id` is stored in the annotation's `detection_act` field.

**Description field.** Required free text, stored in the annotation's `description` field. Placeholder text: "What did you notice? Describe it in your own words." Minimum 10 characters to encourage substantive responses.

**Save/Cancel.** Save creates the annotation with: `location.sentences` set to the selected sentence IDs (e.g., `["turn_05.s02", "turn_05.s03"]`), `detection_act` set to the chosen `act_id`, `description` set to the free text, `phase_created: 1`, `submitted: false`, and `thinking_behavior: null`. The annotation appears in the annotation list and as a marker on the transcript. Cancel clears the selection and returns to the reference view.

**Annotation list.** Below the reference questions, a scrollable list of the student's existing annotations:

```
  Your Annotations (2)

  1. Turn 5, sentences 2-3 (Mia)
     Not enough support
     "She said the research proves it
      but she only read two articles"
     [Edit]

  2. Turn 9, sentence 1 (Jaylen)
     Not really resolved
     "He said okay fine but he still
      thinks the salad bar matters"
     [Edit]
```

Each annotation shows: location, detection act, description snippet. Edit button opens the annotation for editing (same form as creation, pre-filled).

#### Status Bar

"Phase 1: Read the discussion and mark anything that seems off."

---

### Phase 2: Identify Thinking Behaviors

**Trigger:** Teacher advances the class to Phase 2. A brief transition moment appears: "Nice work! Now let's think about WHY they said those things." (2-3 seconds, auto-dismiss.) The phase indicator animates to Phase 2.

**Goal:** For each annotation the student created in Phase 1, identify the thinking behavior behind it.

#### Transcript Panel (left)

Same as Phase 1. Sentence selection still works — students can create new annotations in Phase 2 (they just need to also assign a thinking behavior before submission). Existing annotation markers remain visible. Tapping an annotated sentence scrolls the work panel to that annotation's card.

#### Work Panel (right) — Phase 2

**Phase 2 introduction.** When Phase 2 first opens, a brief explanation appears at the top of the work panel (above the annotation checklist): "You found problems in the discussion. Now think about what's going on in their thinking. For each thing you marked, pick the thinking habit that fits best." This introduction collapses into a one-line summary after the student completes their first thinking behavior assignment.

The work panel shows the student's annotations as a checklist to work through:

```
┌─────────────────────────────────┐
│  Why did they think that way?   │
│                                 │
│  For each thing you noticed,    │
│  think about what's going on    │
│  in their thinking.             │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 1. Turn 5 (Mia)       ⚠  │  │
│  │    Not enough support     │  │
│  │    "She said the research │  │
│  │     proves it..."         │  │
│  │    Thinking behavior:     │  │
│  │    [not assigned yet]     │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 2. Turn 9 (Jaylen)    ✓  │  │
│  │    Not really resolved    │  │
│  │    "He said okay fine..." │  │
│  │    Thinking behavior:     │  │
│  │    Going along with the   │  │
│  │    group                  │  │
│  └───────────────────────────┘  │
│                                 │
│  ──────────────────────────     │
│  All annotations need a         │
│  thinking behavior before you   │
│  can submit.                    │
│                                 │
│  [Submit My Work]  (disabled    │
│   until all assigned)           │
└─────────────────────────────────┘
```

**Status indicators.** Each annotation card shows: a warning icon if thinking behavior is not yet assigned, a checkmark if complete.

**Tapping an annotation card** opens the thinking behavior assignment view:

```
┌─────────────────────────────────┐
│  ← Back to list                 │
│                                 │
│  Turn 5, sentences 2-3 (Mia)   │
│  "The research proves that      │
│   gardens work — I read two     │
│   articles about it"            │
│                                 │
│  You said: Not enough support   │
│  "She said the research proves  │
│   it but she only read two      │
│   articles"                     │
│                                 │
│  ─────────────────────────────  │
│  Why do you think they said     │
│  this? What thinking habit      │
│  might be behind it?            │
│                                 │
│  ○ Only seeing what you want    │
│    to see                       │
│    "They only paid attention    │
│     to things that agreed       │
│     with them"                  │
│                                 │
│  ○ Sticking with the first      │
│    thing you heard              │
│    "They got stuck on the       │
│     first thing they heard"     │
│                                 │
│  ○ Feelings instead of          │
│    evidence                     │
│    "They believed it because    │
│     they felt strongly"         │
│                                 │
│  ○ ... (all 8 behaviors)        │
│                                 │
│  ○ None of these fit —          │
│    describe in your own words   │
│    ┌─────────────────────────┐  │
│    │                         │  │
│    └─────────────────────────┘  │
│                                 │
│  ─────────────────────────────  │
│  Explain the connection:        │
│  How does this thinking habit   │
│  lead to the problem you        │
│  noticed?                       │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │ (free text, 2-4 lines)  │    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│  [Save]              [Cancel]   │
└─────────────────────────────────┘
```

**Thinking behavior library.** Rendered from `thinking_behavior_library.yaml`. Displayed as a radio button list. Each behavior shows its `name` field (plain-language, e.g., "Only seeing what you want to see") and `description` field (one-line explanation) beneath it. The `formal_term` field (e.g., "Confirmation bias") is not shown to students — it is for teacher reference only (visible in the cheat sheet). The "none of these fit" option is visually secondary — smaller, at the bottom, with a text input that appears only when selected.

**Progressive disclosure for the behavior list.** Eight behaviors plus descriptions plus own-words is visually dense, especially on a tablet. The list uses a two-step interaction to reduce initial overwhelm:
1. **Initial view:** All 8 behaviors show only their `name` field (one line each), making the full list scannable without scrolling. The list fits on screen.
2. **On tap:** The selected behavior expands to show its `description` field and highlights. Other behaviors collapse to name-only. This lets the student read the full description of the one they're considering without losing sight of the alternatives.

This is the same expand-on-select pattern used in the DetectionActPicker — consistent interaction across both selection components.

**Library-first design.** The 8 library behaviors are presented first and prominently. The own-words option is last, styled as a fallback (smaller font, muted color, separated by a divider). This encourages library selection (which is structurally comparable in Phase 3) without preventing genuine novel observations. When a library behavior is selected, the annotation's `thinking_behavior` field is set to the `behavior_id`, `behavior_source` is set to `"library"`, and `behavior_own_words` is set to `null`. When own-words is used, `thinking_behavior` is set to `null`, `behavior_source` is set to `"own_words"`, and the free-text behavior description is stored in `behavior_own_words`. The `behavior_own_words` field stores what the student wrote to describe the thinking pattern (e.g., "she was just being stubborn about her idea"); this is distinct from `behavior_explanation`, which stores the connection between the behavior and the flaw.

**Explanation field.** Required free text, stored in the annotation's `behavior_explanation` field. Appears only after a thinking behavior is selected (progressive disclosure — don't show the explanation prompt until the student has picked a behavior). Prompt: "How does this thinking habit lead to the problem you noticed?" Minimum 15 characters.

**Submission.** The "Submit My Work" button is at the bottom of the annotation checklist. Disabled until all annotations have a thinking behavior assigned (button shows "Assign all thinking behaviors to submit" when disabled). When tapped:
- Confirmation dialog: "Once you submit, you can't change your answers until Phase 3. Ready?"
- On confirm: all annotations marked as `submitted: true`, locked from editing
- Work panel transitions to a "Submitted!" state with a satisfying visual moment: a smooth checkmark animation and a brief summary: "You marked [N] moments and explained the thinking behind each one. Your teacher will let you know when it's time to see what your group found."
- **30-second undo window:** A prominent "Undo" button appears in the submitted state. Tapping it reverts `submitted` to false on all annotations and returns to the checklist. After 30 seconds, the undo button disappears and submission is final. This prevents regret from accidental or premature submission without undermining the submission mechanic.

**Students who haven't submitted by Phase 2→3 transition** are force-submitted. The app sets `submitted: true` on all their annotations and records the transition in `PhaseTransition` table. Annotations are auto-submitted with whatever state they're in — `thinking_behavior` may be null for annotations where the student hadn't assigned one yet, and `behavior_explanation` may be null. These incomplete annotations display normally in Phase 3 peer comparison, with "No thinking behavior assigned" shown where the behavior would appear. A brief notification appears: "Your teacher moved to the next phase. Your work has been submitted."

#### Status Bar

"Phase 2: For each thing you marked, think about WHY they said it that way. Then submit your work."

---

### Phase 3: Explain (Peer Comparison)

**Trigger:** Teacher advances the class to Phase 3. A transition moment appears with an animated reveal: "Your group marked [N] moments in the discussion. Let's see what everyone noticed!" The peer annotation layer fades in on the transcript.

**Goal:** Students see what their group noticed, compare, discuss verbally, and revise their thinking.

#### Transcript Panel (left) — Phase 3 Additions

The transcript now shows three layers of annotation markers:

```
┌─────────────────────────────────┐
│  Mia (Researcher)               │
│                                 │
│  ●○  The research proves that   │
│  ●●○ gardens work — I read      │
│  ●   two articles about it and  │
│      both said the same thing.  │
└─────────────────────────────────┘

● = your annotation (solid, your color)
○ = peer annotation (outlined, peer's color)
```

**Annotation markers on the transcript:**
- Student's own annotations: solid colored dots in the left margin, using the student's assigned color
- Peer annotations: outlined dots in each peer's assigned color
- Where annotations overlap (same sentences marked by multiple students): dots stack horizontally
- Tapping any marker shows details in the work panel

**Color coding.** Each student in the group is assigned a distinct color (up to 5 colors for a group of 5). The student's own color is always the same; peer colors are consistent within the session.

#### Work Panel (right) — Phase 3

The work panel has two views, toggled by tabs:

**Tab 1: Comparison View (default)**

Shows agreement and disagreement across the group, organized by the three-level comparison logic:

```
┌─────────────────────────────────┐
│  [Comparison]  [My Annotations] │
│                                 │
│  YOUR GROUP'S FINDINGS          │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🟢 AGREEMENT              │  │
│  │ Turn 5, sentences 2-3     │  │
│  │                           │  │
│  │ You + Darius + Amaya      │  │
│  │ All said: Not enough      │  │
│  │ support                   │  │
│  │                           │  │
│  │ Thinking behaviors:       │  │
│  │ You: "Only seeing what    │  │
│  │  you want to see"         │  │
│  │ Darius: "Only seeing what │  │
│  │  you want to see"         │  │
│  │ Amaya: "Narrow focus"     │  │
│  │                           │  │
│  │ ⚡ You and Darius agree    │  │
│  │ on the behavior, but      │  │
│  │ Amaya picked a different  │  │
│  │ one. Talk about it!       │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🟡 DISAGREEMENT           │  │
│  │ Turn 9, sentence 1        │  │
│  │                           │  │
│  │ You: Not really resolved  │  │
│  │ Kenji: Something's missing│  │
│  │                           │  │
│  │ You marked the same spot  │  │
│  │ but picked different      │  │
│  │ types. Why?               │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🔵 ONLY YOU               │  │
│  │ Turn 12, sentence 3       │  │
│  │                           │  │
│  │ Nobody else in your group │  │
│  │ marked this. Tell them    │  │
│  │ what you noticed.         │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🔵 ONLY KENJI             │  │
│  │ Turn 3, sentences 1-2     │  │
│  │                           │  │
│  │ Kenji noticed something   │  │
│  │ here that you didn't.     │  │
│  │ Ask them about it!        │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Three-level comparison display logic:**

| Situation | Card color | Prompt to student |
|-----------|-----------|-------------------|
| Same location + same detection act + same thinking behavior | Green (agreement) | "You all noticed the same thing for the same reason!" |
| Same location + same detection act + different thinking behaviors | Green with sub-disagreement | "You agree something's wrong, but you think it happened for different reasons. Talk about it!" |
| Same location + different detection acts | Yellow (disagreement) | "You marked the same spot but see different problems. Why?" |
| Location marked by only this student | Blue (unique — yours) | "Nobody else in your group marked this. Tell them what you noticed." |
| Location marked by only a peer | Blue (unique — theirs) | "[Name] noticed something here that you didn't. Ask them about it!" |

**Free-text handling.** When a peer used "own words" instead of the library for their thinking behavior, it displays as a quoted block:

```
  Amaya wrote: "she was just being
  stubborn about her idea"

  Does that match any of the thinking
  behaviors in the list?
```

The app does not attempt to match free-text to library entries. It surfaces the free-text as a discussion prompt.

**Tab 2: My Annotations**

Shows the student's own annotations, now editable again:

```
┌─────────────────────────────────┐
│  [Comparison]  [My Annotations] │
│                                 │
│  You can update your work       │
│  based on your discussion.      │
│  It's okay to change your mind! │
│                                 │
│  1. Turn 5 (Mia)               │
│     Not enough support          │
│     "Only seeing what you       │
│      want to see"               │
│     [Edit]                      │
│                                 │
│  2. Turn 9 (Jaylen)            │
│     Not really resolved         │
│     "Going along with the       │
│      group"                     │
│     [Edit]                      │
│                                 │
│  [+ Add new annotation]        │
│                                 │
└─────────────────────────────────┘
```

**Revision.** Students can edit existing annotations or create new ones. When they edit, the app appends to the annotation's `revision_history` array: `{ revised_at: timestamp, phase: 3, change_type: "revision" }`. No field-level snapshot — the current state is overwritten and the history records only that a revision happened and when. The edit form is the same as the Phase 1/2 creation form, pre-filled with current values. A small note appears: "Changed in Phase 3" on revised annotations (derived from the presence of a `revision_history` entry with `phase: 3`).

**New annotations.** Students can create entirely new annotations during Phase 3 (triggered by peer discussion). These are recorded with `phase_created: 3`. A `revision_history` entry is added with `change_type: "new"`.

#### Status Bar

"Phase 3: Compare what you found with your group. Talk about where you agree and disagree. You can update your work."

---

### Phase 4: Evaluate Perspectives

**Trigger:** Teacher advances the class to Phase 4. A transition moment: "One more perspective to consider — here's what the AI noticed." AI annotation markers fade in on the transcript with a brief animation (appearing one at a time, 200ms stagger, to create a sense of the AI "showing" its work).

**Goal:** Students see the AI's perspective and compare it with their own and their peers'.

#### Transcript Panel (left) — Phase 4 Additions

A third layer of annotation markers appears on the transcript:

- Student's own: solid dots (student's color)
- Peers': outlined dots (peers' colors)
- AI's: diamond markers in a distinct neutral color (e.g., gray/purple)

#### Work Panel (right) — Phase 4

Three tabs: Comparison, AI Perspective, My Annotations.

**Tab: AI Perspective (new, default in Phase 4)**

```
┌─────────────────────────────────┐
│  [Comparison] [AI] [My Work]    │
│                                 │
│  Here's what the AI noticed.    │
│  It's one perspective — you     │
│  might agree, disagree, or see  │
│  something it missed.           │
│                                 │
│  ┌───────────────────────────┐  │
│  │ AI Annotation 1           │  │
│  │ Turn 5, sentences 2-3     │  │
│  │                           │  │
│  │ Argument flaw:            │  │
│  │ Not enough support —      │  │
│  │ "Big claim, little        │  │
│  │  evidence"                │  │
│  │                           │  │
│  │ "Mia says 'the research   │  │
│  │  proves' the garden works │  │
│  │  but she only looked at   │  │
│  │  two articles. That's not │  │
│  │  enough to prove          │  │
│  │  something."              │  │
│  │                           │  │
│  │ Thinking behavior:        │  │
│  │ "Only seeing what you     │  │
│  │  want to see"             │  │
│  │                           │  │
│  │ "Mia was excited about    │  │
│  │  the garden and only      │  │
│  │  looked for articles that │  │
│  │  agreed with her. That's  │  │
│  │  why she ended up with    │  │
│  │  so little evidence."     │  │
│  │                           │  │
│  │ Do you agree? ───────     │  │
│  │ Did you notice this too?  │  │
│  │ Did you pick the same     │  │
│  │ thinking behavior?        │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ AI Annotation 2           │  │
│  │ Turn 9-12 (Jaylen)        │  │
│  │ ...                       │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

Each AI annotation card renders fields from `evaluation_student.yaml` (not the full evaluation — `plausible_alternatives`, `planned`, `quality_assessment`, and `facilitation_guide` are excluded by the pipeline's `export_for_app.py` split):
- Location: `annotation.location.turn` + `annotation.location.sentences` (displayed as "Turn 5, sentences 2-3")
- Argument flaw: `annotation.argument_flaw.detection_act` (resolved to the act's `name` via the detection act library) + `annotation.argument_flaw.pattern` (canonical ID, e.g., `big_claim_little_evidence` — resolved to plain-language name via library) + `annotation.argument_flaw.explanation` (6th-grade language)
- Thinking behavior: `annotation.thinking_behavior.pattern` (resolved to the behavior's `name` via the thinking behavior library) + `annotation.thinking_behavior.explanation` (6th-grade language)
- A discussion prompt: "Do you agree?" or a more specific question (hardcoded in the UI, not from the evaluation)

**"You noticed something the AI didn't" discovery moment.** After the AI annotations are displayed, the app checks whether the student has annotations at locations the AI didn't annotate. If so, a highlighted card appears at the top of the AI Perspective tab:

```
┌───────────────────────────┐
│ ⭐ You found something the │
│ AI missed!                 │
│                            │
│ You marked turn 12,        │
│ sentence 3 — the AI didn't │
│ notice anything there.     │
│ What do you think?         │
└───────────────────────────┘
```

This is a powerful engagement moment — it reinforces that the AI is not the authority and that the student's observations have value. The inverse is also shown in the Comparison tab: locations the AI marked that no student in the group marked.

**The Comparison tab** now includes AI annotations in the comparison alongside student and peer annotations. AI annotations are shown in the same card structure but marked as "AI" rather than a student name. The comparison logic treats AI annotations the same way it treats peer annotations — matching by sentence ID overlap, then detection act, then thinking behavior.

**My Annotations tab** remains editable. Students can still revise after seeing the AI perspective. Revisions are tracked with `phase: 4` in the revision history. A gentle prompt appears at the top: "Now that you've seen the AI's perspective, is there anything you'd change or add?"

#### Status Bar

"Phase 4: The AI shared what it noticed. Do you agree with its perspective? Talk about it with your class."

---

## Teacher Flow

### Dashboard Home

```
┌──────────────────────────────────────────────────────────┐
│  Perspectives — Teacher Dashboard              [Logout]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Active Sessions                                         │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ School Garden Discussion        Phase 2  ▸        │  │
│  │ 28 of 30 students active        12 submitted      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  [+ Create New Session]                                  │
│                                                          │
│  ▸ Past Sessions (2)                                     │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│  Available Scenarios                                     │
│                                                          │
│  • school_garden_v1 — 2 flaws, 2 personas  ★4/5         │
│    Opens with enthusiasm, tension over evidence,          │
│    resolves with unexamined agreement.                    │
│  • ocean_pollution_v1 — 2 flaws, 3 personas  ★4/5       │
│    Starts collaborative, one voice dominates,             │
│    concern raised then abandoned.                         │
│                                                          │
│  [Import Scenario ▾]                                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Session auto-archive.** Sessions automatically archive 2 hours after creation. Active sessions appear at the top; archived sessions collapse into a "Past Sessions" section (expandable to view historical sessions). Sessions are within a single class period — 2 hours provides generous buffer beyond typical 45-55 minute periods.

**Available scenarios** lists scenarios that have been imported from the pipeline registry into the database. Each shows the scenario ID, flaw count, persona count, and pedagogical review score (if available). The `discussion_arc` field from `scenario.yaml` is shown as a one-line summary beneath each scenario — giving teachers a quick sense of how the discussion unfolds before selecting it.

**Import Scenario** dropdown lists unimported scenario directories from `REGISTRY_PATH` (researcher-configured). Selecting a directory imports its YAML artifacts (`scenario.yaml`, `script.yaml`, `evaluation.yaml`, `evaluation_student.yaml`, and optionally `pedagogical_review.yaml`). A "Upload Files" fallback option allows file upload for scenarios not in the registry. Validation errors (missing required files, malformed YAML) are shown inline with specific messages per file.

---

### Create Session

```
┌──────────────────────────────────────────────────────────┐
│  ← Back to Dashboard                                     │
│                                                          │
│  Create New Session                                      │
│                                                          │
│  Scenario:  [dropdown: available scenarios]               │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│  Student Groups                                          │
│                                                          │
│  Group 1:                                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Student name    Student name    Student name     │   │
│  │ Student name    [+ add]                          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Group 2:                                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Student name    Student name    Student name     │   │
│  │ Student name    [+ add]                          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [+ Add Group]                                           │
│                                                          │
│  Session code: ABC123 (auto-generated, shown after       │
│  creation for sharing with students)                     │
│                                                          │
│  [Create Session]                                        │
└──────────────────────────────────────────────────────────┘
```

**Group assignment.** Teacher types student full names directly (e.g., "Amaya Torres"). Groups of 4-5. Teacher can add/remove groups and students. **Duplicate name validation:** no two students in the same session can have the same full name — inline error if a duplicate is entered (if two students genuinely share a name, the teacher adds a middle initial to distinguish them). No class roster import for MVP — manual entry only. The app derives display names (first name + last initial) automatically.

**Session code.** Auto-generated on creation. Teacher shares it verbally or writes it on the board. Students use it to join.

---

### Active Session (Monitoring + Controls)

This is the teacher's primary screen during class. Two-panel layout:

```
┌──────────────────────────────────────────────────────────┐
│  School Garden Discussion          Phase 2               │
│  Session code: ABC123              [Advance to Phase 3]  │
│  Arc: Opens with enthusiasm, tension builds around       │
│  evidence quality, resolves with unexamined agreement.   │
├──────────────────────────┬───────────────────────────────┤
│                          │                               │
│  STUDENT MONITOR         │  DETAIL PANEL                 │
│  (left, ~50%)            │  (right, ~50%)                │
│                          │                               │
└──────────────────────────┴───────────────────────────────┘
```

**Discussion arc.** Below the header, a one-line summary of the `discussion_arc` from `scenario.yaml` gives the teacher a narrative overview — how the discussion opens, where tension builds, and how it resolves. This orients the teacher before class and helps them anticipate the shape of student discussions.

#### Student Monitor (left)

```
┌─────────────────────────────────────┐
│  All Students    By Group           │
│                                     │
│  28 of 30 active                    │
│  12 submitted (Phase 2)             │
│  Flaw coverage: 2/2 targets found   │
│  by at least one group              │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ GROUP 1           ◆◆○ (2/3)  │  │
│  │                               │  │
│  │ ● Amaya     3 annot.  ✓      │  │
│  │ ● Darius    2 annot.  ✓      │  │
│  │ ● Kenji     1 annot.  ⚠      │  │
│  │ ○ Marcus    —  not started    │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ GROUP 2           ◆○○ (1/3)  │  │
│  │                               │  │
│  │ ● Jayden    2 annot.  ✓      │  │
│  │ ● Sofia     3 annot.  ✓      │  │
│  │ ● Taylor    0 annot.  ⚠      │  │
│  │ ● Zara      2 annot.         │  │
│  └───────────────────────────────┘  │
│                                     │
│  ... more groups                    │
└─────────────────────────────────────┘

● = active (has opened the transcript)
○ = not started (first_opened is null)
✓ = submitted
⚠ = may need help (active but low/no annotations)
◆ = target flaw found by group, ○ = not yet found
```

**Status indicators per student** (derived from `StudentActivity` records and `Annotation` → `submitted` field):
- Not started (circle outline): `student_activity.first_opened` is null — student hasn't opened the transcript
- Active (solid circle): `student_activity.first_opened` is non-null — student has opened the transcript
- Submitted (checkmark): annotation's `submitted` field is true
- May need help (warning): active for >80% of the scenario's `facilitation_guide.timing.phase_1_minutes` with 0 annotations, or >100% of phase time with fewer annotations than group average (thresholds are derived from the facilitation guide timing for this scenario, not hardcoded)

**Annotation count** displays `student_activity.annotation_count`. Updates via polling (every 5-10 seconds).

**Flaw coverage indicator.** Each group header shows a compact indicator of how many target flaws have been found by at least one student in the group (e.g., "◆◆○ (2/3)"). A flaw is "found" if any student in the group has an annotation whose `location.sentences` overlap with the flaw's annotated sentences from `evaluation.yaml`. The class-level summary shows how many target flaws have been found by at least one group. This helps the teacher decide when to advance phases — "most groups have found at least one target flaw" is a stronger signal than "most students have 2+ annotations." The flaw coverage computation runs server-side (comparing student annotation sentence IDs against AI annotation sentence IDs from `TeacherEvaluation`), updated alongside the activity polling endpoint. **This is teacher-only data** — students never see flaw coverage, which would contradict the "perspectives, not answers" principle.

**Tapping a student name** opens their annotations in the detail panel (read-only view for the teacher).

**Tapping a group name** opens the group comparison view in the detail panel (Phase 3+ only).

#### Phase Controls

The "Advance to Phase X" button is prominently placed in the header. It shows the next phase number and what will happen:

```
┌─────────────────────────────────────────────────┐
│  Advance to Phase 3?                            │
│                                                 │
│  18 of 30 students have submitted.              │
│  12 have not submitted yet.                     │
│                                                 │
│  Advancing will:                                │
│  • Auto-submit unsubmitted students' work       │
│  • Make peer annotations visible within groups  │
│  • Lock Phase 1-2 editing for submitted         │
│    students                                     │
│                                                 │
│  [Advance Now]              [Wait]              │
└─────────────────────────────────────────────────┘
```

The confirmation dialog shows how many students have/haven't submitted and what the transition does. This helps the teacher make an informed decision about timing.

**Low-submission warning.** When fewer than 50% of students have submitted, the dialog shows a prominent color-coded warning (orange/red text): "Only [N] of [M] have submitted. Most students' work will be auto-submitted incomplete." The "Advance Now" button still works — the warning is informational, not blocking.

#### Detail Panel (right)

Context-dependent:
- Default: Cheat sheet summary (what-to-expect section)
- When a student is selected: that student's annotations (read-only)
- When a group is selected (Phase 3+): the group's comparison view (same logic as the student comparison view, but showing all group members)

#### Cheat Sheet Link

A "View Full Cheat Sheet" link opens `/teacher/session/[id]/cheatsheet` — the complete facilitation guide in a printable format (matching the example from the design doc). This is a separate page optimized for reading/printing, not the dashboard.

---

### Cheat Sheet Page

A single-page view rendering the `facilitation_guide` from `evaluation.yaml`, supplemented by `pedagogical_review.yaml` (if available) and `annotations[].thinking_behavior.plausible_alternatives` from `evaluation.yaml`. The facilitation_guide has a specific nested structure; each field maps to a rendered section:

| Section on page | Source field | What it renders |
|----------------|-------------|-----------------|
| TIMING | `facilitation_guide.timing` | `phase_1_minutes`, `phase_2_minutes`, `phase_3_minutes`, `phase_4_minutes` — displayed as "Phase 1: ~12 min \| Phase 2: ~8 min \| ..." |
| WHAT TO EXPECT | `facilitation_guide.what_to_expect[]` | Each entry: `flaw` (pattern name), `turns` (where to look), `signal` (what students should notice), `difficulty` ("most will catch it" / "harder to spot" / "easy to miss") |
| WHY THIS FLAW WORKS | `pedagogical_review.flaw_assessments[]` | Each target flaw's `expression_quality` — a narrative explanation of how the flaw manifests in the transcript and why it's detectable by 6th graders. Helps the teacher understand the reasoning behind each flaw, not just the scaffolding prompts. Collapsible — collapsed by default to keep the cheat sheet scannable, expandable for teachers who want deeper preparation. Only shown if `PedagogicalReview` data is available. |
| PHASE 1 scaffolds | `facilitation_guide.phase_1[]` | Each entry: `prompt` (ready-to-use teacher prompt) + `targets` (which flaw this helps surface) |
| PHASE 2 scaffolds | `facilitation_guide.phase_2[]` | Each entry: `flaw` (which flaw), `narrowed_options[]` (2-3 behaviors from `plausible_alternatives` — a subset of the library for the teacher to offer), `perspective_prompt` (empathy-based prompt) |
| PHASE 2 — VALID ALTERNATIVES | `annotations[].thinking_behavior.plausible_alternatives` from `evaluation.yaml` | For each flaw, the full list of plausible alternative thinking behaviors (resolved to plain-language names). Shown beneath the Phase 2 scaffold for that flaw. Helps the teacher distinguish productive disagreements (student picked a plausible alternative) from confused ones (student picked something not on the list). Formatted as: "Also defensible: [behavior 1], [behavior 2]." |
| PHASE 3 scaffolds | Hardcoded in cheat sheet template | Generic prompts, same for every scenario: "Did you all mark the same turns? Look at where you differ." / "Someone in your group found something you missed. Take another look." |
| PHASE 4 scaffolds | `facilitation_guide.phase_4[]` | Each entry: `type` ("challenge" / "student_victory" / "missed_flaw") + `prompt` (ready-to-use or fill-in-the-blank template) |

Styled for readability and printability:
- Large section headers (TIMING, WHAT TO EXPECT, PHASE 1, etc.)
- Scaffold prompts formatted as quoted text the teacher can read aloud
- `difficulty` values in WHAT TO EXPECT rendered as visual indicators (green/yellow/red)
- "WHY THIS FLAW WORKS" sections collapsible (collapsed on print, expandable on screen)
- "VALID ALTERNATIVES" shown inline beneath each Phase 2 scaffold entry
- Print-friendly: no navigation chrome, clean margins, fits on 1-2 pages
- A "Print" button and a "Back to Session" link

Content follows the exact format from design doc lines 867-902, with the additions of flaw assessment detail and plausible alternatives.

---

## Component Specifications

### TranscriptView

**Purpose:** Displays the discussion transcript with sentence-level selection and annotation markers.

**Schema:** `discussion_transcript.yaml` — consumes `personas[]` (name, role), `turns[]` (turn_id, speaker, sentences[]), and `sentences[]` (id, text).

**Props:**
- `turns`: array of turn objects from transcript schema — each has `turn_id` (e.g., `turn_01`), `speaker`, and `sentences[]` where each sentence has `id` (e.g., `turn_01.s01`) and `text`
- `personas`: array from transcript schema — each has `persona_id`, `name`, `role` (no perspective/strengths/weaknesses — those are in scenario plan only)
- `annotations`: array of annotation objects to display as markers (own from `Annotation` table, peer from same, AI from `AIAnnotation` table)
- `selectedSentences`: currently selected sentence IDs (using the `turn_NN.sNN` format)
- `onSentenceSelect`: callback when sentence is tapped
- `activePhase`: determines which annotation layers are visible
- `personaColors`: color mapping for each persona (consistent left-border accents)

**Behavior:**
- Renders turns as distinct blocks with persona header (`personas[].name` + `personas[].role`)
- Each sentence is an individually tappable element, keyed by its `id` field (e.g., `turn_03.s02`)
- Selected sentences are highlighted (background color)
- Annotation markers appear in the left margin, positioned by matching annotation `location.sentences` to sentence `id` fields:
  - Phase 1-2: own annotations only (solid dots)
  - Phase 3: own + peer annotations (solid + outlined dots)
  - Phase 4: own + peer + AI annotations (solid + outlined + diamond)
- Scrollable, preserves scroll position across phase transitions
- Tapping an annotation marker calls `onAnnotationSelect` to show details in the work panel

### AnnotationPanel

**Purpose:** Create, edit, and view annotations. Content adapts per phase.

**Data:** Reads/writes `Annotation` records. Consumes `DetectionAct`/`FlawPattern` for the act picker and `ThinkingBehavior` for the behavior browser.

**Modes:**
- `create`: sentence selection active, form fields empty — produces a new annotation with `phase_created`, `location.sentences`, `detection_act`, `description`, `submitted: false`
- `edit`: form pre-filled with existing annotation, all fields editable — appends to `revision_history` on save
- `view`: read-only display (used in teacher's student detail view)
- `phase2-assign`: shows thinking behavior assignment for existing Phase 1 annotations — sets `thinking_behavior`, `behavior_source`, `behavior_explanation`

**Fields (mapped to `Annotation` model):**
- Detection act selector → `detection_act` (stores `act_id` from detection act library)
- Description → `description` (free text, required)
- Thinking behavior selector → `thinking_behavior` (stores `behavior_id` from thinking behavior library, or null for own-words) + `behavior_source` (`"library"` or `"own_words"`) + `behavior_own_words` (free-text behavior description when own-words is used, null otherwise)
- Behavior explanation → `behavior_explanation` (free text, required when behavior is assigned)

### DetectionActPicker

**Purpose:** Radio selection of one of the five detection acts.

**Schema:** `detection_act_library.yaml` — renders `detection_acts[]`, each with `act_id`, `name`, `student_question`, and `patterns[]` (each with `pattern_id`, `plain_language`, `description`).

**Display:** Each act shows:
- `name` field (e.g., "Not enough support")
- `student_question` field in smaller text (e.g., "How do they know that?")
- When selected: expands to show `patterns[]` as informational reference — each pattern displays `plain_language` (e.g., "They're saying a lot based on very little") and `description`. The `pattern_id` is not displayed (canonical IDs are internal). This is not a required sub-selection.

**Output:** The selected act's `act_id` (e.g., `"not_enough_support"`), stored in the annotation's `detection_act` field.

**Behavior:** Single selection. Selecting a new act deselects the previous one.

### ThinkingBehaviorBrowser

**Purpose:** Select a thinking behavior from the library or describe in own words.

**Schema:** `thinking_behavior_library.yaml` — renders `thinking_behaviors[]`, each with `behavior_id`, `name`, `description`, `formal_term`.

**Display:**
- 8 library behaviors as radio options, each showing `name` field (plain-language, e.g., "Only seeing what you want to see") and `description` field (one-line explanation) beneath it
- The `formal_term` field (e.g., "Confirmation bias") is not shown to students — teacher reference only
- "None of these fit" option at the bottom, visually secondary (smaller font, muted color)
- When "none of these fit" is selected: text input appears

**Output:** When a library behavior is selected: `thinking_behavior` = `behavior_id` (e.g., `"confirmation_bias"`), `behavior_source` = `"library"`, `behavior_own_words` = `null`. When own-words is used: `thinking_behavior` = `null`, `behavior_source` = `"own_words"`, `behavior_own_words` = the free-text description (e.g., "she was just being stubborn about her idea").

**Behavior:** Library-first design. The library options are prominent. Own-words is a fallback, not an equal option.

### ComparisonView

**Purpose:** Phase 3 comparison display showing agreement/disagreement across the group.

**Data:** Consumes `Annotation` records for all group members. Group membership from `GroupMember` table. In Phase 4, also consumes `AIAnnotation` records.

**Props:**
- `studentAnnotations`: this student's annotations (from `Annotation` table)
- `peerAnnotations`: grouped by peer, each peer's annotations (same model)
- `aiAnnotations`: AI annotations from `AIAnnotation` table, **normalized to the student annotation shape** (Phase 4 only — see normalization below)
- `studentColors`: color assignment per group member

**AI annotation normalization.** AI annotations (`AIAnnotation` records, imported from `evaluation_student.yaml`) use a different data structure than student annotations (`Annotation` records). The ComparisonView uses a single comparison algorithm, not parallel logic. AI annotations must be normalized to the student annotation shape before being passed as a prop:

| `AIAnnotation` field | Normalized to |
|--------------------------------|---------------|
| `annotation.location.sentences` | `location.sentences` (same) |
| `annotation.argument_flaw.detection_act` | `detection_act` |
| `annotation.argument_flaw.pattern` | (displayed in card, not used for comparison matching) |
| `annotation.argument_flaw.explanation` | (displayed in card) |
| `annotation.thinking_behavior.pattern` | `thinking_behavior` (the behavior_id) |
| `annotation.thinking_behavior.explanation` | (displayed in card) |

Normalization happens at the component boundary (in the parent that renders ComparisonView), not at import time — the database stores AI annotations in their original schema, and the normalized shape is computed on read. This keeps the database faithful to pipeline output while giving the ComparisonView a uniform interface.

**Display logic (three-level comparison):**

The following algorithm operates on a uniform annotation shape (student, peer, and normalized AI annotations all have `location.sentences`, `detection_act`, and `thinking_behavior` fields):

1. **Group annotations by location.** Find overlapping sentence selections across all group members (and AI, in Phase 4). Two annotations "overlap" if their `location.sentences` arrays share at least one sentence ID (e.g., both include `"turn_05.s02"`).

2. **For overlapping locations, compare detection acts.** Same `detection_act` value (act_id) = agreement on what's wrong. Different act_ids = disagreement on what's wrong.

3. **For same-act matches, compare thinking behaviors.** Same `thinking_behavior` value (behavior_id) = full agreement. Different behavior_ids, or one with `behavior_source: "library"` and another with `behavior_source: "own_words"` = partial agreement with behavioral disagreement. AI annotations are treated as `behavior_source: "library"` since they always reference a behavior from the library.

4. **Annotations with no location overlap** are "unique" — only this student (or only a peer, or only the AI) noticed it.

**Card rendering:**
- Agreement cards (green): show who agrees and on what, highlight any behavioral sub-disagreements
- Disagreement cards (yellow): show the different detection acts, prompt discussion
- Unique cards (blue): show what only one person noticed, prompt sharing

**Free-text annotations.** When a peer's annotation has `behavior_source: "own_words"`, the ComparisonView displays their `behavior_own_words` field as quoted text within cards. The app adds a discussion prompt: "[Name] wrote: '[behavior_own_words].' Does that match any of the thinking behaviors?"

### PhaseIndicator

**Purpose:** Shows the current phase and progress.

**Display:** Four numbered circles in a horizontal line. Current phase is filled and larger. Completed phases have a checkmark. Future phases are outlined/grayed.

**Not interactive** for students (teacher controls phase). Serves as orientation — "where am I in the process?"

### StudentActivityTable

**Purpose:** Teacher monitoring view showing per-student status and per-group flaw coverage.

**Data:** Consumes `Group`/`GroupMember` (for group membership) and `StudentActivity` (for `first_opened`, `last_active`, `annotation_count`). Also reads `Annotation` → `submitted` for submission status. Flaw coverage data comes from a server-side computation comparing student annotation sentence IDs against AI annotation sentence IDs from `TeacherEvaluation`.

**Props:**
- `groups`: from `Group`/`GroupMember` tables, each with `group_id` and member list
- `studentActivity`: from `StudentActivity` table, each with `student_id`, `first_opened` (timestamp or null), `last_active` (timestamp or null), `annotation_count` (integer)
- `submissionStatus`: from `Annotation` table → whether each student has `submitted: true` on all annotations
- `flawCoverage`: per-group object — for each group, which AI annotation IDs have been "found" (at least one student in the group has an annotation with sentence ID overlap). Computed server-side, returned alongside the activity polling response.

**Display:** Grouped by group. Each group header shows flaw coverage indicator (e.g., "◆◆○ (2/3)"). Each student shows:
- Status indicator (not started / active / submitted / may need help)
- Annotation count (`student_activity.annotation_count`)
- Time since first opened (computed from `student_activity.first_opened` — "may need help" thresholds use the scenario's `facilitation_guide.timing` rather than hardcoded values)

**Polling:** Refreshes every 5-10 seconds via API call. Flaw coverage is included in the same polling response to avoid extra requests.

---

## Interaction Patterns

### Sentence Selection

- **Tap to select.** Single tap on a sentence highlights it. The sentence background changes to a selection color (light yellow or blue).
- **Tap again to deselect.** Same sentence, second tap removes the highlight.
- **Multi-select.** Multiple sentences can be selected at once. No drag-to-select (unreliable on touch devices). Each sentence is tapped individually.
- **Cross-turn selection.** Sentences across different turns can be selected together (for cross-turn flaws like Act 4 and Act 5).
- **Selection persistence.** When the student saves an annotation, the selection clears and the annotated sentences show annotation markers instead of selection highlight.
- **Selection while annotation markers exist.** Students can select sentences that already have annotations. A subtle tooltip appears: "You already marked this — tap the marker to edit, or continue to create a new annotation." This prevents accidental duplicates while still allowing intentional new annotations at the same location (legitimate for different detection acts).

### Annotation Lifecycle

```
[not started] → select sentences → fill form → [Save] → draft (Phase 1)
     ↓
Phase 2: assign thinking behavior → [Submit] → submitted (locked)
     ↓
Phase 3: teacher advances → annotations unlocked for revision
     ↓
[Edit] → modify fields → [Save] → revised (change tracked in revision_history)
     ↓
Phase 4: AI revealed → can still revise
```

**Key states:**
- **Draft:** Created in Phase 1 or 2, not yet submitted. Editable.
- **Submitted:** After Phase 2 submit (with 30-second undo window). Locked until Phase 3.
- **Unlocked for revision:** Phase 3 and 4. Editable again. Changes tracked. The unlock is a client-side phase check (`activePhase >= 3` enables the Edit button); the server validates the session's phase before accepting updates.

### Phase Transitions

When the teacher advances a phase, the student's screen updates:

1. A brief overlay notification appears: "Your teacher moved to Phase [N]" (2-3 seconds, auto-dismiss)
2. The phase indicator updates (new phase highlighted)
3. The status bar text changes
4. New UI elements appear in the work panel (e.g., peer annotations in Phase 3)
5. The transcript panel updates with any new annotation layers

**No page reload.** Phase transitions update the UI in place. The polling mechanism detects the phase change (by comparing the polled `session_configuration.active_phase` value against the current local state) and triggers a re-render. Each transition is recorded in `session_configuration.phase_transitions[]` with `from_phase`, `to_phase`, and `transitioned_at` timestamp.

### Polling Behavior

The student app polls the server at a regular interval:

| What's polled | Interval | Used by |
|--------------|----------|---------|
| Active phase | 5 seconds | Student: detect phase transitions |
| Student activity | 10 seconds | Teacher: monitoring dashboard |

Peer annotations are **not polled**. The Phase 3 comparison view operates on a snapshot taken at the Phase 2→3 transition. A fresh snapshot (including Phase 3 revisions) is taken at the Phase 3→4 transition. See design.md Phase 3 comparison logic.

Polling starts when the student joins the session and stops when they close the tab. Lightweight requests — only changed data, not full re-fetches.

---

## Tablet Interaction Model

6th graders at UMS use iPads or Chromebooks as their primary devices. The app is designed tablet-first for students, laptop-first for teachers.

### Device Targets

| Device | Screen | Orientation | Primary user |
|--------|--------|-------------|-------------|
| iPad (9th-10th gen) | 10.2" / 10.9", 2160x1620 | Landscape + portrait | Students |
| iPad Air | 10.9", 2360x1640 | Landscape + portrait | Students |
| Chromebook | 11.6"-14", 1366x768 to 1920x1080 | Landscape only | Students |
| Laptop | 13"-15" | Landscape only | Teachers |

### Student Layout by Screen Size

**Landscape >=1200px (Chromebook, iPad landscape):** Two-panel side-by-side. Transcript left (~60%), work panel right (~40%). Both panels scroll independently. A clear visual divider separates them. This is the primary layout.

**Portrait or <1200px (iPad portrait, small Chromebook):** Single-panel with switcher. One panel fills the screen at a time. A floating tab bar at the bottom lets the student switch between "Read" (transcript) and "Work" (annotation/comparison panel):

```
┌──────────────────────────────────┐
│  Phase 1                [1]2 3 4 │
├──────────────────────────────────┤
│                                  │
│  [Full-screen transcript         │
│   or full-screen work panel,     │
│   depending on active tab]       │
│                                  │
│                                  │
│                                  │
├──────────────────────────────────┤
│     📖 Read        ✏️ Work       │
└──────────────────────────────────┘
```

When a student selects a sentence in "Read" mode, the app automatically switches to "Work" mode to show the annotation form (200ms slide transition animation for spatial continuity). When the student saves or cancels, it switches back to "Read" mode. This maintains the two-panel mental model without requiring side-by-side space.

**Orientation change handling.** If a student rotates their iPad during a session, the layout adapts without losing state — selected sentences remain selected, the work panel retains its current view, scroll position is preserved.

### Touch Interaction Details

**Sentence tap targets.** Each sentence in the transcript is a distinct tappable region. The tap target extends the full width of the transcript panel and includes the sentence's line height plus 8px padding above and below. For short sentences on a single line, the minimum tap height is 44px. Multi-line sentences have naturally larger targets.

**Tap feedback.** Every tap produces immediate visual feedback:
- Sentence tap: background color changes instantly (before any network request)
- Button tap: subtle scale animation (0.97x for 100ms) + color change
- Annotation marker tap: marker briefly pulses/enlarges

**Scroll containment.** Each panel has its own scroll context. Scrolling in the transcript panel does not scroll the work panel, and vice versa. On single-panel (portrait) mode, the active panel scrolls; the inactive panel preserves its scroll position. This prevents the common tablet frustration of accidentally scrolling the wrong panel.

**Pinch-to-zoom.** Disabled on the app viewport. The app controls its own text sizing. Accidental pinch-zoom on tablets breaks layouts and confuses students. The viewport meta tag disables user scaling.

### Keyboard Management (iPad)

When a student taps a text input (description field, own-words field, behavior explanation), the iOS keyboard slides up and covers approximately 40% of the screen.

**Behavior:**
- The active input field scrolls into view above the keyboard automatically
- The form remains usable — the student can see the field they're typing in, the label above it, and the Save/Cancel buttons
- Detection act radio buttons (above the text field) may scroll out of view — this is acceptable because the student has already selected one before reaching the text field
- On keyboard dismiss (tap outside or swipe down), the layout returns to normal with no jank

**Text input sizing.** Free-text fields (description, behavior explanation) are sized to show 3 lines of text above the keyboard. This gives students enough visible space to write without feeling cramped.

### Gesture Patterns

| Gesture | Where | Action |
|---------|-------|--------|
| Tap | Sentence | Select/deselect for annotation |
| Tap | Annotation marker | Open annotation in work panel |
| Tap | Radio option | Select detection act or thinking behavior |
| Scroll (vertical) | Transcript panel | Scroll through discussion |
| Scroll (vertical) | Work panel | Scroll through annotations/comparison |
| Swipe (not used) | — | No swipe gestures in MVP — they conflict with iOS system gestures and are unreliable for 6th graders |

**No drag-to-select.** Selecting a range of sentences by dragging is unreliable on touch devices (conflicts with scroll). Students tap each sentence individually. For selecting contiguous sentences, this means 2-4 taps, which is acceptable given that most annotations target 1-3 sentences.

### Typography and Sizing

| Element | Student interface | Teacher interface |
|---------|------------------|-------------------|
| Transcript text | 17px, line-height 1.7 | — |
| Body text | 16px, line-height 1.5 | 14px, line-height 1.4 |
| Headers | 20-24px | 16-18px |
| Labels / secondary | 14px | 12-13px |
| Minimum tap target | 44px height | 36px height (mouse-friendly) |
| Transcript max line width | ~65 characters | — |
| Turn block padding | 16px | — |
| Turn block gap | 12px | — |

**Transcript readability.** Turn blocks have generous padding and clear visual separation. Line height of 1.7 for transcript text (higher than typical body text) gives sentences breathing room and makes individual sentences easier to tap precisely. Character width is capped at ~65 characters to maintain comfortable reading for 6th graders.
