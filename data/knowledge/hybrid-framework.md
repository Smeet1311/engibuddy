# Hybrid 6-Phase PBL Framework

The Hybrid 6-Phase framework structures Project-Based Learning into six interconnected phases (numbered 0–5) that build upon each other. Each phase has distinct deliverables, methods, and exit criteria.

**Phase numbering used throughout EngiBuddy:**
- Phase 0 — Empathize
- Phase 1 — Conceive
- Phase 2 — Design
- Phase 3 — Implement
- Phase 4 — Test/Revise
- Phase 5 — Operate

---

## Phase 0: EMPATHIZE
**Purpose:** Deeply understand the problem space and real users before proposing any solution.

**Entry Criteria:**
- Project topic assigned or chosen
- Team members identified
- Initial curiosity present — but NO solution ideas yet

**Key Activities:**
- Observe and interview real end-users
- Document user needs, pain points, and behaviors
- Identify stakeholders and their perspectives
- Use the **5 Whys** to find root causes behind symptoms
- Build an **Empathy Map** (Says / Thinks / Does / Feels) from interview notes
- Frame the problem as a **How-Might-We (HMW)** question

**Exit Criteria:**
- At least one real user interview or observation documented
- One pain point stated in the user's own words
- One HMW question framing the design challenge
- Empathy Map with at least 2 quadrants filled

**EngiBuddy Coaching Behavior:**
- Ask "Who is the actual person this is for? Describe them specifically."
- Ask "What did they say or do that showed you this is a real problem?"
- Offer 5 Whys when student has a symptom but not a root cause
- Offer Empathy Map when student has interview notes but can't synthesize them
- Offer HMW question builder when student has a pain point and needs to frame it

**Common Sticking Points:**
- Jumping to solutions before understanding users
- Vague user ("everyone", "students", "people")
- Assumptions presented as user data

---

## Phase 1: CONCEIVE
**Purpose:** Define precisely what you are solving, for whom, and what success looks like.

**Entry Criteria:**
- Phase 0 complete: real user insight, identified pain point, HMW question
- No solution selected yet — this phase closes the problem definition

**Key Activities:**
- Write a clear problem statement (who + what + why)
- Scope the project — list what IS and IS NOT in scope
- Define 3-5 measurable success criteria
- Use **Problem Statement Mad-Libs** to structure the statement
- Use **MoSCoW Prioritization** to cut scope to a realistic size
- Use **Success Criteria Checker** to make each criterion measurable

**Exit Criteria:**
- Problem statement with user, pain point, root cause, and impact
- In-scope and out-of-scope lists
- 3-5 success criteria each with a number or pass/fail threshold
- Team agreement on what "done" means

**EngiBuddy Coaching Behavior:**
- Ask "In one sentence: what problem are you solving and for whom?"
- Offer Mad-Libs template when student can't structure the statement
- Offer MoSCoW when scope keeps growing
- Ask "How would you measure that?" for each vague criterion

**Common Sticking Points:**
- Vague problem statements ("improve the experience")
- Success criteria that can't be measured ("works well", "is fast")
- Scope that includes everything the student thinks is cool

---

## Phase 2: DESIGN
**Purpose:** Research options, choose technologies, plan the work, and define how parts connect.

**Entry Criteria:**
- Phase 1 complete: problem statement, scope, measurable success criteria
- Ready to think about HOW to solve it

**Key Activities:**
- Research technology options and compare alternatives
- Use **Pugh Matrix** to score and compare options systematically
- Create a **Work Breakdown Structure (WBS)** — tasks ≤ 1 day each
- Plan the schedule with buffer time (especially on integration tasks)
- Use **Interface Definition** to specify what each subsystem sends/receives
- Outline a test plan (to be executed in Phases 3-4)

**Exit Criteria:**
- Technology choices made with at least one comparison documented
- WBS with tasks ≤ 1 day, owner, and estimates
- Schedule with at least 20% buffer on uncertain tasks
- Interface spec for every place two subsystems connect
- Test plan outline

**EngiBuddy Coaching Behavior:**
- Ask "What are the options? Let's compare them with a Pugh Matrix."
- Ask "Can you break that task into pieces that each take about a day?"
- Ask "If this task takes twice as long, does your plan still work?"
- Offer Interface Definition before student starts building two connected parts

**Common Sticking Points:**
- Technology choice made without comparing alternatives ("I'll just use X")
- WBS tasks that are weeks long ("build the whole backend")
- No buffer for integration or unexpected delays
- Ignoring the connections between subsystems until they fail in Phase 3

---

## Phase 3: IMPLEMENT
**Purpose:** Build the system piece by piece, testing each part as you go.

**Entry Criteria:**
- Phase 2 complete: plan, technology choices, WBS, interface specs
- Development environment set up

**Key Activities:**
- Build one subsystem at a time
- Test each piece in isolation before integrating
- Use **Rubber Duck Debugging Protocol** to diagnose bugs systematically
- Write tests using **Unit Test Template (Arrange-Act-Assert)** as you build
- Keep code committed with descriptive messages
- Document decisions and known issues

**Exit Criteria:**
- Each subsystem tested in isolation
- Integration between subsystems working (or failures logged)
- Code committed with descriptive messages
- Known bugs logged with severity and workaround

**EngiBuddy Coaching Behavior:**
- Ask "What are you building right now — one specific piece?"
- Ask "Does that piece work on its own? How do you know?"
- Offer Rubber Duck Debugging when student reports "it doesn't work"
- Offer Unit Test Template when student hasn't written tests
- Ask debugging questions ONE AT A TIME: expected → actual → last change → isolate

**Common Sticking Points:**
- Building everything at once and only discovering problems during integration
- "It doesn't work" — no clear description of expected vs. actual behavior
- No tests written ("I'll test at the end")
- Scope creep during build phase

---

## Phase 4: TEST / REVISE
**Purpose:** Validate the finished system against Phase 1 success criteria, get real feedback, and improve.

**Entry Criteria:**
- Phase 3 complete: system built, subsystems tested
- Now validating the WHOLE system against Phase 1 criteria

**Key Activities:**
- Go through each Phase 1 success criterion — run a real test, record evidence
- Use **Acceptance Test Checklist** to track each criterion: test → evidence → verdict
- Show work to a real person, collect feedback
- Use **Peer Review Matrix** to organize feedback into actionable vs. non-actionable
- Revise based on actionable feedback, re-test

**Exit Criteria:**
- Every success criterion has a real-evidence verdict (met / partial / not met)
- At least one peer or user feedback cycle completed
- Changes made and re-tested
- Revision log: what changed, why, did it help

**EngiBuddy Coaching Behavior:**
- Ask "Pick one criterion — how would you test it right now?"
- Use Acceptance Test Checklist to go through criteria one at a time
- Ask for real evidence (measurement, screenshot, observation) — not "I think it works"
- Offer Peer Review Matrix when student has feedback and doesn't know what to act on

**Common Sticking Points:**
- "I think it works" without any test evidence
- Only testing the happy path, not edge cases
- Treating all feedback as equally important (acts on style opinions, ignores real bugs)
- Running out of time before checking all criteria

---

## Phase 5: OPERATE
**Purpose:** Wrap up the project — present the work, document it, and reflect on what was learned.

**Entry Criteria:**
- Phase 4 complete: system validated, revisions made
- Ready to deliver and reflect

**Key Activities:**
- Structure the final presentation using **STAR Method** (Situation, Task, Action, Result)
- Write the final report explaining design RATIONALE (why each decision was made)
- Create a **Handover Document** so someone new could set up and run the project
- Run a **Retrospective** (Start / Stop / Continue) to capture lessons learned

**Exit Criteria:**
- Presentation with STAR structure, opening with user problem not solution
- Report with rationale for each major decision (why X over Y)
- Handover doc: setup, run instructions, known issues, future work
- Retrospective: at least one specific lesson per category

**EngiBuddy Coaching Behavior:**
- Ask "What's the most important deliverable right now — presentation, report, or docs?"
- Offer STAR template for presentation/report structure
- Ask "For each decision in your report: what was the alternative, and why did you choose this one?"
- Offer Handover Doc Checklist when student needs to write documentation
- Offer Retrospective when student needs to reflect

**Common Sticking Points:**
- Report describes WHAT was built but not WHY decisions were made
- Presentation starts with the solution, not the user problem
- No documentation for anyone who wasn't on the team
- Retrospective is shallow ("we learned teamwork")

---

## Cross-Phase Principles

**Iteration is expected:** Projects don't proceed perfectly forward. Revisiting earlier phases is normal engineering.

**Every phase deposits artifacts:** Phase 0 user data → informs Phase 1 criteria → informs Phase 4 testing.

**Methods build on each other:** HMW (Phase 0) → Mad-Libs statement (Phase 1) → Pugh Matrix choices (Phase 2) → WBS tasks (Phase 2) → Rubber Duck debugging (Phase 3) → Acceptance Test Checklist (Phase 4) → STAR presentation (Phase 5).

**User stays central:** Every phase asks "does this still solve the user's problem?"
