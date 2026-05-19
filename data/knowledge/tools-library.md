# EngiBuddy Tools Library

Organized by the 6-phase PBL framework (Phase 0–5). Each tool is a coaching scaffold — a structured way to help students make progress. Method names match what EngiBuddy references in coaching.

---

## Phase 0: EMPATHIZE
**Goal:** Understand real users and their frustrations before defining any solution.

### 5 Whys (Root Cause Finder) — Phase 0 Empathize
**Also called:** Root Cause Analysis, Why-Why Diagram
**Use when:** Student describes a user pain point or symptom ("the app is confusing") during empathize phase but hasn't found the underlying root cause through observation or interview.
**How to use:** Ask "Why?" five times in a row. Each answer becomes the input to the next "Why?".
**Exit signal:** Student can name a root cause that is specific, actionable, and surprising enough that it changes their design direction.

---

### Empathy Map (User Synthesis)
**Also called:** User Empathy Map, Says-Thinks-Does-Feels Map
**Use when:** Student has done user interviews or observations but the notes are scattered or unclear.
**Four quadrants:**
- **Says:** Direct quotes from the user
- **Thinks:** What they might believe but not say out loud
- **Does:** Specific actions and behaviors observed
- **Feels:** Emotional state — frustrated? Relieved? Embarrassed?
**Exit signal:** At least 2 quadrants filled with specific observations. Student can write one sentence summarizing the core pain point.

---

### How-Might-We Question Builder (HMW) — Phase 0 Empathize
**Also called:** HMW question, Design challenge framing, How Might We
**Use when:** Student has identified a user pain point through observation or interview and is ready to turn it into a design challenge during the empathize phase.
**Formula:** "How might we help [specific user] to [achieve goal / overcome obstacle] without [unintended consequence]?"
**Exit signal:** One HMW question that is specific (names the user and obstacle) and open enough to allow multiple solution approaches.

---

### User Discovery Guide
**Also called:** Interview guide, User research guide
**Use when:** Student needs to talk to users but doesn't know what to ask.
**Opening question:** "Who is the actual person struggling with this problem right now?"
**Coaching path:**
- If they say "everyone" → "Let's find ONE specific person. Describe them."
- If they describe needs, not people → "That's a need. Who has that need? Name one person."
- If they've never talked to a user → "Who sits near them? Who uses the thing their project targets?"
**Exit signal:** Student can name specific user(s), their daily context, and what frustrates them about the status quo.

---

## Phase 1: CONCEIVE
**Goal:** Write a precise problem statement, define scope, and make success measurable.

### Problem Statement Mad-Libs
**Also called:** Problem Statement Generator, Problem Statement Template
**Use when:** Student can't write a clear problem statement, or their statement is too vague.
**Template:** "I am solving a problem for [Target User]. They struggle with [Specific Pain Point] because [Root Cause]. This matters because [Impact / cost of not solving it]."
**Exit signal:** All four blanks filled with specifics that trace back to Phase 0 user data.

---

### MoSCoW Prioritization
**Also called:** Scope cutter, Feature prioritization, MoSCoW method
**Use when:** Scope is too big, student keeps adding features, or they can't decide what to cut.
**Four categories:**
- **Must Have:** Non-negotiable for v1
- **Should Have:** Important but not blocking launch
- **Could Have:** Nice to have if time allows
- **Won't Have:** Explicitly out of scope this cycle — becomes v2 backlog
**Exit signal:** Student has a "Won't Have" list. Must Haves fit within the project deadline.

---

### Success Criteria Checker
**Also called:** Acceptance criteria, Measurable criteria, Definition of done
**Use when:** Student's criteria are vague — "it works", "it's fast", "users are happy."
**Test for each criterion:** "How would I measure this with a number or a clear pass/fail?"
**Examples:**
- Bad: "The app is fast." → Good: "Main screen loads in under 2 seconds."
- Bad: "Users like it." → Good: "4 out of 5 test users rate usability 4/5 or higher."
**Exit signal:** Every criterion has a threshold. These will be tested one-by-one in Phase 4.

---

### Scope Interrogator
**Also called:** Scope definition tool, Boundary questions
**Use when:** Student's scope is vague, keeps expanding, or they don't know where to draw the line.
**Questions (one at a time):**
1. What will you build?
2. What will you NOT build — even if it would help?
3. Why draw the line there?
4. Given this scope, can you finish by your deadline?
**Exit signal:** Clear boundary document with both in-scope and out-of-scope lists, with reasons.

---

## Phase 2: DESIGN
**Goal:** Make technology choices, plan the work, and specify how parts connect.

### Pugh Matrix (Technology Comparison)
**Also called:** Decision matrix, Technology comparison table, Weighted scoring matrix
**Use when:** Student needs to choose between two or more technologies, frameworks, sensors, or approaches.
**How to use:** List decision criteria (what matters for THIS project). Score each option (+1 better, 0 same, -1 worse vs baseline). Weight criteria by importance. Winner has highest weighted score.
**Exit signal:** Decision recorded with justification. Student can explain why the winner beat the runner-up.

---

### Work Breakdown Structure (WBS)
**Also called:** WBS template, Task breakdown, WBS Wizard
**Use when:** Student has a vague plan, doesn't know where to start, or has tasks that are weeks long.
**Rules:**
- Every task ≤ 1 day of work. If longer — break it down further.
- Add 2-3× buffer on integration tasks (they always take longer).
- Each task has an owner and estimate.
**Exit signal:** Task list where the longest single item is 1 day. Critical path identified.

---

### Interface Definition
**Also called:** Interface spec, Subsystem contracts, API contract, Boundary specification
**Use when:** Two or more subsystems or team members are building parts that will need to connect.
**Define for each connection:**
- What data does A send to B? (format, units, valid range)
- What does B send back? (format, units)
- What happens if something goes wrong?
**Exit signal:** Both sides know exactly what to build. Integration test can be written before either side is done.

---

### Research Scaffold
**Also called:** Research guide, Background research structure
**Use when:** Student doesn't know what to research or how to organize findings.
**Research pillars:**
1. Background knowledge (domain, foundational concepts)
2. Existing solutions (what's already out there, gaps)
3. User research (interviews, surveys, observations)
4. Technology options (if applicable)
**Exit signal:** Research summary with implications tied to design decisions.

---

### Schedule Realism Checker
**Also called:** Timeline review, Buffer check
**Use when:** Timeline feels too optimistic or student has no buffer.
**Reality checks:**
- Are estimates based on past experience or guesses?
- Is there 20-30% buffer for unexpected delays?
- Is integration time budgeted? (Usually the most underestimated.)
- Does each team member have a realistic workload?
**Exit signal:** Revised schedule with documented assumptions and contingency buffer.

---

## Phase 3: IMPLEMENT
**Goal:** Build the system piece by piece, testing and debugging systematically.

### Rubber Duck Debugging Protocol
**Also called:** Debugging Protocol, Systematic debugging, Bug diagnosis
**Use when:** Student says "it doesn't work", is frustrated, or is making random changes hoping something fixes it.
**Steps (ask ONE at a time):**
1. What exactly did you expect to happen?
2. What did it actually do? (exact error message?)
3. What's the last thing you changed before it broke?
4. Can you make it happen consistently?
5. Is the problem in this specific piece or does it happen elsewhere too?
6. What's your hypothesis for the cause?
7. What did you try to fix it? Did it help?
**Exit signal:** Root cause identified. Fix applied and verified. Student can explain why it broke.

---

### Unit Test Template (Arrange-Act-Assert)
**Also called:** Unit test, AAA test pattern, Test-first approach
**Use when:** Student is writing code but hasn't written tests, or doesn't know how to start testing.
**Three parts:**
- **Arrange:** What inputs or setup does the test need?
- **Act:** What function or method are we calling?
- **Assert:** What output or state should we expect?
**Also test:**
- One happy path (normal input → expected output)
- One edge case (boundary input)
- One error case (bad input → expected error or fallback)
**Exit signal:** Test written and passing. Student can describe what the test proves.

---

### Version Control Coach
**Also called:** Git guide, Commit discipline
**Use when:** Student lost work, has merge conflicts, or doesn't use version control.
**Practices:**
- Small frequent commits with clear messages ("fix sensor read timeout" not "stuff")
- One logical change per commit
- Pull before pushing
- Feature branches for major work
**Exit signal:** Clean commit history, no "saved everywhere" panic, teammates can see what changed.

---

## Phase 4: TEST / REVISE
**Goal:** Validate the finished system against Phase 1 success criteria with real evidence.

### Acceptance Test Checklist
**Also called:** Acceptance testing, Criteria validation checker, Test log
**Use when:** Student is ready to check whether the finished system meets Phase 1 success criteria.
**For each criterion:**
1. How will you test it?
2. Run the test. What happened?
3. Evidence: measurement, screenshot, observation (NOT "I think it works")
4. Verdict: Met / Partially Met / Not Met
5. If not met: what will you change?
**Exit signal:** Every Phase 1 criterion has a real-evidence verdict. Test log ready to include in final report.

---

### Peer Review Matrix
**Also called:** Feedback organizer, Peer critique tool, Feedback action log
**Use when:** Student has received feedback and doesn't know which parts to act on.
**For each piece of feedback:**
- Is this actionable? (Can the student change it before the deadline?)
- If yes: what specifically will change?
- If no: park it (style opinion, out of scope, or v2 backlog)
**Rule:** Only act on actionable feedback. Do not revise for style opinions without evidence.
**Exit signal:** Student has a clear list of changes, with reasons. Non-actionable feedback documented but parked.

---

## Phase 5: OPERATE
**Goal:** Present the work, document it for others, and reflect on learning.

### STAR Presentation Method
**Also called:** STAR method, Presentation structure, Report structure
**Use when:** Student is preparing a presentation or structuring their final report.
**Four parts:**
- **Situation:** Who had the problem and why did it matter? (Open with Phase 0 user data — NOT the solution.)
- **Task:** What did you set out to solve? (Problem statement + success criteria.)
- **Action:** What did you build, and why did you make each key decision? (Include alternatives considered.)
- **Result:** What happened? (Use Phase 4 test evidence — real numbers and observations.)
**Exit signal:** Presentation opens with the user problem, not the product. Each major decision has a "why X over Y" sentence.

---

### Handover Document Checklist
**Also called:** Handover doc, README, Deployment guide, Documentation
**Use when:** Student needs to document the project for someone who wasn't on the team.
**Sections:**
1. What is this? (one paragraph: what it does and who it's for)
2. How to set it up (step-by-step, assume a new person)
3. How to run it
4. Known issues (with severity and workaround)
5. Future work (what wasn't finished and why)
6. Contact (who built it, who to ask questions)
**Exit signal:** Someone new could set up and run the project using only this document.

---

### Retrospective (Start / Stop / Continue)
**Also called:** Project retrospective, Lessons learned, Post-mortem, Retro
**Use when:** Project is done or nearly done. Student needs to reflect on what worked and what didn't.
**Three questions:**
- **Start:** What's one thing you'd do from day 1 on the next project that you didn't do this time?
- **Stop:** What's one thing that slowed you down or caused problems that you'd cut next time?
- **Continue:** What's one practice that worked well and should be kept?
**Rule:** Every answer should reference a specific moment in the project, not a vague feeling.
**Exit signal:** Written reflection with at least one specific lesson per category, linked to a phase where it happened.

---

## How Tools Map to Phases

| Phase | Primary Tools |
|-------|--------------|
| 0 Empathize | 5 Whys, Empathy Map, HMW Question Builder, User Discovery Guide |
| 1 Conceive | Problem Statement Mad-Libs, MoSCoW Prioritization, Success Criteria Checker, Scope Interrogator |
| 2 Design | Pugh Matrix, Work Breakdown Structure, Interface Definition, Schedule Realism Checker |
| 3 Implement | Rubber Duck Debugging Protocol, Unit Test Template (AAA), Version Control Coach |
| 4 Test/Revise | Acceptance Test Checklist, Peer Review Matrix |
| 5 Operate | STAR Presentation Method, Handover Document Checklist, Retrospective |
