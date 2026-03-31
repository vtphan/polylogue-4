# Perspectives App — E2E Testing Script

This script walks through every feature of the app by playing all three roles (researcher/teacher, student A, student B) in a single browser. Use separate tabs or incognito windows to simulate multiple users.

**Estimated time:** 30-45 minutes

---

## Setup

### 1. Prerequisites

```bash
cd app
nvm use              # Node 24 LTS
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL="file:./perspectives.db"
REFERENCE_LIBRARIES_PATH="/absolute/path/to/polylogue-4/configs/reference"
REGISTRY_PATH="/absolute/path/to/polylogue-4/registry"
```

### 3. Configure seed users

```bash
cp seed.yaml.example seed.yaml
```

Edit `seed.yaml`:

```yaml
users:
  - name: "Test Teacher"
    password: "test1234"
    role: researcher
```

### 4. Initialize database

```bash
rm -f perspectives.db*          # start fresh
npx prisma generate
npx prisma db push
npx prisma db seed
```

Note the output — it prints the test session ID and session code (`TEST01`).

### 5. Start the dev server

```bash
npm run dev
```

App runs at `http://localhost:3000`.

### 6. Browser setup

Open **three browser contexts** (to simulate three users independently):

| Context | Role | How |
|---------|------|-----|
| Tab 1 | Teacher | Normal browser tab |
| Tab 2 | Student A | Incognito window |
| Tab 3 | Student B | Different browser (or second incognito profile) |

---

## Part 1: Teacher — Login and Create Session

### Step 1: Teacher login

1. In **Tab 1**, go to `http://localhost:3000/auth/login`
2. Enter username: `Test Teacher`, password: `test1234`
3. Click **Sign In**
4. **Verify:** Redirected to `/teacher` dashboard

### Step 2: Verify dashboard

1. **Verify:** "Active Sessions" section shows the seeded TEST01 session
2. **Verify:** "Available Scenarios" section lists `ocean_plastic_campaign` with flaw count and persona count
3. **Verify:** "Create New Session" button is visible

### Step 3: Create a new session

1. Click **Create New Session**
2. **Verify:** Redirected to `/teacher/session/new`
3. Select scenario: `ocean_plastic_campaign`
4. **Verify:** Discussion arc text appears below the dropdown
5. Set lifeline budget to `6`
6. Leave "Guided first detection" checked
7. In Group 1, type these student names:
   - `Alice Smith`
   - `Bob Jones`
8. Click **+ Add Group**
9. In Group 2, type:
   - `Carol Davis`
   - `Dan Wilson`
10. **Test duplicate detection:** In Group 2, type `Alice Smith` in a third slot
11. **Verify:** Red highlight appears, "Duplicate names" error shown
12. Remove the duplicate entry
13. Click **Create Session**
14. **Verify:** Redirected to active session view with session code displayed in header
15. **Write down the session code** (6 characters, e.g., `K7HN3P`)

### Step 4: Verify session view

1. **Verify:** Header shows scenario topic, session code, "Phase 1"
2. **Verify:** Student Monitor shows Group 1 (Alice, Bob) and Group 2 (Carol, Dan) — all status "not started" (hollow circles)
3. **Verify:** "What to Expect" panel on the right shows flaws with difficulty badges
4. **Verify:** "Advance to Phase 2" button visible
5. **Verify:** "Cheat Sheet" link visible

### Step 5: Check cheat sheet

1. Click **Cheat Sheet**
2. **Verify:** Full facilitation guide renders: Timing, What to Expect, Phase 1-4 scaffolds
3. **Verify:** Flaw names resolved to plain language (not pattern IDs)
4. **Verify:** "Why These Flaws Work" section is collapsible
5. **Verify:** Phase 2 scaffolds show narrowed options and "Also defensible" alternatives
6. Click **Back to Session**

---

## Part 2: Students Join

### Step 6: Student A joins

1. In **Tab 2** (incognito), go to `http://localhost:3000/student`
2. **Verify:** Join form appears with session code and name fields
3. Enter the session code from Step 3
4. Enter name: `Alice Smith`
5. Click **Join**
6. **Verify:** Redirected to `/student/session/[id]`
7. **Verify:** "About this discussion" topic context card appears
8. Click **Start Reading**
9. **Verify:** Two-panel layout appears — transcript on left, work panel on right
10. **Verify:** Phase indicator shows Phase 1 highlighted
11. **Verify:** Transcript shows Mia and Jaylen turns with colored left borders

### Step 7: Student B joins

1. In **Tab 3**, go to `http://localhost:3000/student`
2. Enter the same session code
3. Enter name: `Bob Jones`
4. Click **Join**
5. **Verify:** Same flow as Student A

### Step 8: Test invalid join

1. Open a new tab, go to `http://localhost:3000/student`
2. Enter the session code
3. Enter name: `Nobody`
4. **Verify:** Error: "We don't see that name in this session."

### Step 9: Verify teacher sees students active

1. Switch to **Tab 1** (teacher)
2. **Wait 10 seconds** for polling to update
3. **Verify:** Alice and Bob now show solid green circles (active status)
4. Click on **Alice Smith's name**
5. **Verify:** Right panel changes to "Alice Smith's Annotations" (empty for now)
6. Click **Close** to return to What to Expect view

---

## Part 3: Phase 1 — Annotating

### Step 10: Student A creates annotations

In **Tab 2** (Alice):

1. **Verify:** Empty state shows welcoming text and detection questions
2. Read the transcript. Tap on **Turn 5, sentence 2** (Mia's "the documentary and the article both prove...")
3. **Verify:** Sentence highlights in amber; auto-switches to Work tab if in portrait mode
4. **Verify:** Annotation creation form appears with selected sentence quoted
5. In the detection act picker, select **"Not enough support"**
6. **Verify:** Reading strategy hint visible; patterns expand below
7. In the description field, type: `She only has two sources but says it proves everything`
8. Click **Save**
9. **Verify:** Annotation marker (colored dot) appears next to the sentence
10. **Verify:** Marker briefly animates (scale-up)
11. **Verify:** "Nice work! Now try reading..." nudge appears (different-lens nudge)
12. Dismiss the nudge

13. Create a **second annotation**: Tap Turn 9, sentence 1 (Jaylen's planning turn)
14. Select **"Something's missing"**
15. Type: `He lists lots of cool ideas but never talks about how to actually do them`
16. Click **Save**

### Step 11: Student B creates annotations

In **Tab 3** (Bob):

1. Tap **Turn 5, sentence 2** (same as Alice)
2. Select **"Not enough support"**
3. Type: `Mia says the research proves it but she barely looked into it`
4. Save

5. Create a **second annotation** on **Turn 12, sentence 3** (Mia's conclusion)
6. Select **"Too strong a conclusion"**
7. Type: `She says it will totally change how people think but they haven't even started`
8. Save

### Step 12: Test hint system (Student A)

In **Tab 2** (Alice):

1. **Verify:** Hint button visible at bottom of work panel: "Hints: 6 remaining"
2. Tap the hint button
3. **Verify:** Two options appear: "Where to look" and "About a person"
4. Tap **"Where to look"**
5. **Verify:** Location hint appears with a turn reference and detection question
6. **Verify:** Hint count decrements to 5
7. Tap **"About a person"**
8. **Verify:** Persona picker appears (Mia / Jaylen)
9. Select **Mia**
10. **Verify:** Character card shows strengths and weaknesses
11. **Verify:** Hint count decrements to 4
12. Close the hint panel

### Step 13: Check teacher monitoring

Switch to **Tab 1** (teacher):

1. **Wait for polling update**
2. **Verify:** Alice shows "Annot: 2", Bob shows "Annot: 2"
3. **Verify:** Flaw coverage diamonds updated (some filled)
4. Click **Alice Smith**
5. **Verify:** Her two annotations appear in the detail panel

---

## Part 4: Phase 2 — Thinking Behaviors + Submit

### Step 14: Teacher advances to Phase 2

In **Tab 1** (teacher):

1. Click **Advance to Phase 2**
2. **Verify:** Confirmation dialog shows submitted/unsubmitted counts
3. Click **Advance Now**
4. **Verify:** Phase indicator updates to "Phase 2"

### Step 15: Student A sees Phase 2

Switch to **Tab 2** (Alice):

1. **Wait for phase polling** (up to 5 seconds)
2. **Verify:** Transition overlay: "Your teacher moved to Phase 2"
3. **Verify:** Work panel now shows annotation checklist with status icons (warning triangles)
4. **Verify:** Introduction text: "Why did they think that way?"

5. Tap the **first annotation card**
6. **Verify:** Behavior assignment view opens showing annotation context
7. **Verify:** ThinkingBehaviorBrowser shows 8 behaviors (names only, compact)
8. Tap **"Only seeing what you want to see"**
9. **Verify:** Selected behavior expands to show description
10. **Verify:** Explanation field appears (progressive disclosure)
11. Type explanation (15+ chars): `She only found articles that agreed with her idea`
12. Click **Save**
13. **Verify:** Returns to checklist, first annotation now shows checkmark

14. Assign a behavior to the **second annotation** similarly
15. **Verify:** "Submit My Work" button becomes enabled
16. Click **Submit My Work**
17. **Verify:** Confirmation dialog: "Once you submit..."
18. Click **Submit**
19. **Verify:** Checkmark animation, "Submitted!" state
20. **Verify:** Undo button visible with countdown (30s)
21. Let the undo timer expire

### Step 16: Student B completes Phase 2

In **Tab 3** (Bob), repeat the same flow — assign behaviors and submit.

---

## Part 5: Phase 3 — Peer Comparison

### Step 17: Teacher advances to Phase 3

In **Tab 1** (teacher):

1. Click **Advance to Phase 3**
2. **Verify:** Warning if <50% submitted
3. Click **Advance Now**

### Step 18: Student A sees peer annotations

Switch to **Tab 2** (Alice):

1. **Wait for phase polling**
2. **Verify:** Transition message appears
3. **Verify:** Transcript now shows peer annotation markers (outlined dots in Bob's color)
4. **Verify:** Work panel shows Comparison tab (default) with "Your Group's Findings"
5. **Verify:** Agreement card (green) for Turn 5 — both Alice and Bob annotated it
6. **Verify:** Unique card (blue) for Alice's Turn 9 annotation — "Nobody else in your group marked this"
7. **Verify:** Unique card (blue) for Bob's Turn 12 annotation — "Bob noticed something here..."

8. Switch to **My Annotations** tab
9. **Verify:** "You can update your work" prompt
10. **Verify:** Edit buttons visible on annotations
11. Click **Edit** on the first annotation
12. **Verify:** Form pre-filled with current values
13. Change the description slightly and save
14. **Verify:** "Updated in Phase 3" badge appears

15. Click **+ Add new annotation**
16. **Verify:** Switches to Read tab to select sentences

---

## Part 6: Phase 4 — AI Reveal

### Step 19: Teacher advances to Phase 4

In **Tab 1**, advance to Phase 4.

### Step 20: Student A sees AI annotations

Switch to **Tab 2** (Alice):

1. **Wait for phase polling**
2. **Verify:** Transition: "One more perspective to consider..."
3. **Verify:** AI annotation markers appear on transcript (new colored dots)
4. **Verify:** Work panel defaults to "AI Perspective" tab
5. **Verify:** Header: "Here's what the AI noticed. It's one perspective..."
6. **Verify:** AI cards show:
   - Location (turn + sentences)
   - "ARGUMENT FLAW" section with detection act name + pattern name + explanation
   - "THINKING BEHAVIOR" section with behavior name + explanation
   - Discussion prompt
7. **Verify:** Cards with student overlap show green "You found this too!" badge
8. **Verify:** If student annotated somewhere the AI didn't → "YOU FOUND SOMETHING THE AI MISSED" card

9. Switch to **Comparison** tab
10. **Verify:** AI annotations included in comparison cards (labeled "AI")

11. Switch to **My Work** tab
12. **Verify:** "Now that you've seen the AI's perspective..." prompt
13. **Verify:** Annotations still editable

---

## Part 7: Reflection

### Step 21: Teacher activates reflection

In **Tab 1** (teacher):

1. **Verify:** "Start Reflection" button visible (Phase 4, not yet activated)
2. Click **Start Reflection**
3. **Verify:** Button disappears after activation

### Step 22: Student A completes reflection

Switch to **Tab 2** (Alice):

1. **Wait for polling**
2. **Verify:** Reflection form appears at the bottom of the work panel
3. **Verify:** "Before you go..." header
4. Type in first field: `I missed that Jaylen never answered his own question about sources`
5. Type in second field: `I'll pay more attention to when people drop a concern without resolving it`
6. Click **Done**
7. **Verify:** "Thanks for reflecting!" confirmation

---

## Part 8: End Session

### Step 23: Teacher ends session

In **Tab 1** (teacher):

1. Click **End Session**
2. **Verify:** Confirmation dialog
3. Click **End Session**
4. **Verify:** "Archived" badge appears in header
5. **Verify:** Phase advance and reflection buttons disappear

### Step 24: Verify dashboard

1. Go to `/teacher`
2. **Verify:** The session moved to "Past Sessions" (collapsed section)

---

## Part 9: Portrait Mode (Optional)

### Step 25: Test portrait layout

1. In any student tab, resize browser width below 1200px
2. **Verify:** Single-panel layout with Read/Work tab bar at bottom
3. Tap a sentence
4. **Verify:** Auto-switches to Work tab
5. Save an annotation
6. **Verify:** Auto-switches back to Read tab
7. **Verify:** Tab bar shows annotation count: "Work (3)"

---

## Part 10: Edge Cases (Optional)

### Step 26: Late-arriving student

1. After the session is at Phase 3+, open a new incognito window
2. Join as `Carol Davis` (Group 2)
3. **Verify:** Carol enters Phase 1 (reads transcript, makes annotations)
4. **Verify:** Carol's annotations are independent of Alice and Bob's comparison view

### Step 27: Reconnection

1. Close Student A's tab
2. Open a new tab, go to `/student`
3. Re-enter the session code and `Alice Smith`
4. **Verify:** Redirected to session with all previous annotations intact

### Step 28: Guided first detection

1. Create a new session with "Guided first detection" enabled
2. Join as a student with 0 annotations
3. **Verify:** After dismissing the topic context card, a guided prompt appears:
   "Let's start with turn [N]. Read what [persona] says..."
4. **Verify:** Target turn is highlighted in the transcript
5. Create an annotation on that turn
6. **Verify:** "Great catch!" celebration message

---

## Checklist Summary

| # | Test | Pass? |
|---|------|-------|
| 1-5 | Teacher login, dashboard, session creation, cheat sheet | |
| 6-9 | Student join, invalid join, teacher sees students | |
| 10-13 | Phase 1 annotations, hints, teacher monitoring | |
| 14-16 | Phase 2 behaviors, submit, undo | |
| 17-18 | Phase 3 peer comparison, revision | |
| 19-20 | Phase 4 AI reveal, overlap framing | |
| 21-22 | Reflection | |
| 23-24 | End session, dashboard archive | |
| 25 | Portrait mode (optional) | |
| 26-28 | Edge cases (optional) | |
