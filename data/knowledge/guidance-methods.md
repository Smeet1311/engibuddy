# Guidance Mode Methods & Templates

Concrete, fill-in-the-blank methods and templates for each PBL phase. In Guidance Mode, EngiBuddy presents these directly to students to lower the barrier to entry.

---

## Phase 0: Empathize — Understand Users and Pain Points

### Method: The 5 Whys (Root Cause Finder)
**Use when:** Student identified a symptom but not the root cause of the user's pain point.
**Keywords:** empathize, user, interview, pain point, observation, stakeholder, root cause

**Template to present:**
```
5 Whys — Root Cause Analysis

1. Why does the user experience [pain point]?
   Answer: _______________

2. Why does [answer 1] happen?
   Answer: _______________

3. Why does [answer 2] happen?
   Answer: _______________

4. Why does [answer 3] happen?
   Answer: _______________

5. Why does [answer 4] happen?
   Answer: _______________ ← This is your root cause!
```

**Worked example (filled in):**
```
Problem: Students forget assignment deadlines.
1. Why? → They don't check the course website regularly.
2. Why? → Notifications are sent by email, which they ignore.
3. Why? → Email gets buried under other emails.
4. Why? → There is no priority signal on academic emails.
5. Why? → The university email system has no tagging/priority feature.
Root cause: No low-friction reminder mechanism close to where students already spend time.
```

---

### Method: Empathy Map (User Synthesis)
**Use when:** Student completed user interviews or observations and needs to synthesize findings.
**Keywords:** empathize, empathy map, stakeholder map, user, says, thinks, feels, observation

**Template to present:**
```
Empathy Map — [User Name / Role]

SAYS (direct quotes from your interview or observation):
• "_______________"
• "_______________"

THINKS (what might they be thinking but not saying?):
• _______________
• _______________

DOES (specific actions or behaviors you observed):
• _______________
• _______________

FEELS (emotional state — frustrated? overwhelmed? bored?):
• _______________
• _______________

Key pain point summary:
"[User] struggles with _______________ because _______________."
```

---

### Method: How-Might-We (HMW) Question Builder
**Use when:** Student has identified a pain point and needs to frame it as a solvable design challenge.
**Keywords:** how might we, pain point, empathize, problem framing, stakeholder

**Template to present:**
```
How-Might-We Formula:
"How might we help [specific user] to [achieve goal / overcome obstacle]
without [constraint / unintended consequence]?"

Fill in:
• Specific user: _______________
• Goal or obstacle: _______________
• Constraint to avoid: _______________

Your HMW question: "How might we _______________?"
```

**Worked example:**
```
User: First-year university students
Obstacle: Missing assignment deadlines
Constraint: Without adding another app they have to check

HMW: "How might we help first-year students remember assignment deadlines
without requiring them to check yet another separate application?"
```

---

## Phase 1: Conceive — Problem Statement and Success Criteria

### Method: Problem Statement Mad-Libs
**Use when:** Student is struggling to write a clear, user-grounded problem statement.
**Keywords:** conceive, problem statement, scope, constraint, requirement, user need

**Template to present:**
```
Problem Statement — Fill in the blanks:

"I am solving a problem for [Target User].
Currently, they struggle with [Specific Pain Point]
because [Root Cause from Phase 0].
This matters because [Impact / cost of not solving it].
A solution would be successful if [high-level outcome]."
```

**Worked example:**
```
"I am solving a problem for first-year university students.
Currently, they miss assignment deadlines
because course reminders arrive by email, which gets buried.
This matters because missed deadlines lower grades and increase stress.
A solution would be successful if students submit at least 90% of assignments on time."
```

---

### Method: MoSCoW Prioritization (Scope Cutter)
**Use when:** Scope is too broad or student keeps adding features.
**Keywords:** conceive, scope, must have, should have, could have, won't have, MoSCoW, constraint

**Template to present:**
```
MoSCoW Scope Table — [Project Name]

MUST HAVE (non-negotiable for v1):
• _______________
• _______________

SHOULD HAVE (important, include if time allows):
• _______________

COULD HAVE (nice to have, park for v2):
• _______________

WON'T HAVE THIS CYCLE (explicitly out of scope):
• _______________
• _______________
```

---

### Method: Success Criteria Checker
**Use when:** Student's success criteria are vague ("it works", "users are happy").
**Keywords:** conceive, success criteria, measurable, acceptance, requirement, threshold

**Template to present:**
```
Success Criteria — each must pass this test:
"How would I measure this with a number or a clear pass/fail?"

| Criterion | How to Measure | Pass Threshold |
|-----------|---------------|----------------|
| [criterion 1] | [measurement method] | [number or pass/fail] |
| [criterion 2] | | |
| [criterion 3] | | |

Bad criterion: "The app is fast."
Good criterion: "The app loads the main screen in under 2 seconds on a standard WiFi connection."
```

---

## Phase 2: Design — Research, Architecture, and Planning

### Method: Pugh Matrix (Technology Choice)
**Use when:** Student needs to compare technology choices or design alternatives systematically.
**Keywords:** design, technology choice, technology options, compare, comparison, trade-off, trade-offs, architecture

**Template to present:**
```
Pugh Decision Matrix — [Decision: e.g., "Which database to use?"]

Score: +1 = better than baseline, 0 = same, -1 = worse

| Criterion (weight)     | [Option A — Baseline] | [Option B] | [Option C] |
|------------------------|-----------------------|------------|------------|
| Cost (×2)              | 0                     |            |            |
| Performance (×3)       | 0                     |            |            |
| Ease of use (×2)       | 0                     |            |            |
| Team familiarity (×1)  | 0                     |            |            |
| Community/docs (×1)    | 0                     |            |            |
| **Weighted total**     | **0**                 |            |            |

Winner: _______________ because _______________
```

---

### Method: WBS Outline Template (Work Breakdown Structure)
**Use when:** Student needs to break the project into concrete, manageable tasks.
**Keywords:** design, WBS, work breakdown structure, timeline, planning, task, schedule

**Template to present:**
```
Work Breakdown Structure — [Project Name]

COMPONENT 1: [e.g., Backend API]
  Task 1.1: _______________ — Est: ___ days — Owner: ___
  Task 1.2: _______________ — Est: ___ days — Owner: ___
  Task 1.3: _______________ — Est: ___ days — Owner: ___

COMPONENT 2: [e.g., Frontend UI]
  Task 2.1: _______________ — Est: ___ days — Owner: ___
  Task 2.2: _______________ — Est: ___ days — Owner: ___

COMPONENT 3: [e.g., Integration & Testing]
  Task 3.1: _______________ — Est: ___ days — Owner: ___

RULE: Every task must be ≤ 1 day. If longer, break it down further.
Add 3× buffer on any integration tasks.
```

---

### Method: Interface Definition (Subsystem Contracts)
**Use when:** Multiple subsystems or team members. Need to define the contract between components before building.
**Keywords:** design, interface, architecture diagram, proof-of-concept, integration, protocol

**Template to present:**
```
Interface Definition — [Subsystem A] ↔ [Subsystem B]

Input to B from A:
  Data format: _______________
  Units / encoding: _______________
  Valid range / constraints: _______________

Output from B to A:
  Data format: _______________
  Units / encoding: _______________

Error states B must handle:
  • _______________

How to test this interface in isolation:
  • _______________
```

---

## Phase 3: Implement — Build, Debug, Test

### Method: Rubber Duck Debugging Protocol
**Use when:** Code isn't working and student is frustrated or trying random fixes.
**Keywords:** implement, debug, debugging protocol, unit test, bug, error, build, code

**Template to present:**
```
Debugging Protocol — answer these before touching the code:

1. EXPECTED: What exactly did you expect the code to do?
   _______________

2. ACTUAL: What did it actually do? (include exact error message if any)
   _______________

3. LAST CHANGE: What was the last thing you changed before this broke?
   _______________

4. ISOLATE: Is the problem in [Module A] or [Module B]?
   Test: _______________

5. HYPOTHESIS: What do you think is causing it?
   _______________

6. FIX + VERIFY: What will you try, and how will you confirm it's fixed?
   _______________
```

---

### Method: Unit Test Template (Arrange-Act-Assert)
**Use when:** Student hasn't written tests or doesn't know how to start.
**Keywords:** implement, unit test, integration test, build, code, test

**Template to present:**
```
Unit Test — Arrange / Act / Assert

Function being tested: _______________

ARRANGE (setup — what inputs or state do you need?):
  Input: _______________
  Pre-condition: _______________

ACT (call the function):
  result = _______________([inputs])

ASSERT (what should the output be?):
  Expected: _______________
  Edge case 1: input = ___, expected = ___
  Edge case 2: input = ___, expected = ___
  Error case: input = ___, expected = [error or fallback]
```

---

## Phase 4: Test/Revise — Validate Against Criteria

### Method: Acceptance Test Checklist
**Use when:** Student needs to validate the finished system against Phase 1 success criteria.
**Keywords:** test, revise, validation, acceptance, acceptance test, success criteria, peer critique, criterion

**Template to present:**
```
Acceptance Test Log

For each success criterion from Phase 1:

Criterion 1: _______________
  Test performed: _______________
  Evidence (measurement / screenshot / log): _______________
  Status: [ ] MET  [ ] PARTIAL  [ ] NOT MET
  If partial/not met — what will you change? _______________

Criterion 2: _______________
  Test performed: _______________
  Evidence: _______________
  Status: [ ] MET  [ ] PARTIAL  [ ] NOT MET

(repeat for all criteria)
```

---

### Method: Peer Review Matrix
**Use when:** Student needs to collect and act on feedback from peers or stakeholders.
**Keywords:** test, revise, peer critique, stakeholder re-test, iterate, feedback, validation

**Template to present:**
```
Peer Review Log — [Project Name]  Reviewer: _______________

| Feedback received | Actionable? | What you'll change | Done? |
|-------------------|-------------|-------------------|-------|
| "_______________" | Yes / No    | _______________   | [ ]   |
| "_______________" | Yes / No    | _______________   | [ ]   |
| "_______________" | Yes / No    | _______________   | [ ]   |

Rule: Only act on ACTIONABLE feedback. Mark "No" for style opinions without evidence.
```

---

## Phase 5: Operate — Present, Document, Reflect

### Method: STAR Presentation Structure
**Use when:** Student needs to plan their final presentation or report narrative.
**Keywords:** operate, presentation, final report, demo, retrospective, handover

**Template to present:**
```
STAR Presentation Outline — [Project Name]

SITUATION (1–2 min): Context and user
  • Who is the user?
  • What was the pain point? (open with Phase 0 data, not the solution)

TASK (1–2 min): What you set out to solve
  • Problem statement in one sentence
  • Success criteria (top 3)

ACTION (3–4 min): What you built and key decisions
  • What you built (brief demo or diagram)
  • 2–3 key design decisions — for each: "We chose X over Y because ___"

RESULT (2 min): Evidence it worked
  • Acceptance test results against your criteria
  • One quote or data point from a real user

REFLECTION (1 min): What you learned
  • Biggest surprise
  • What you'd do differently
```

---

### Method: Handover Document Checklist
**Use when:** Student needs to write a handover doc for someone who wasn't on the team.
**Keywords:** operate, handover, handover doc, deploy, final report, documentation

**Template to present:**
```
Handover Document — [Project Name]

1. WHAT IS THIS?
   One paragraph: what the system does and who it's for.

2. HOW TO SET IT UP
   Step-by-step setup instructions (assume a new person):
   Step 1: _______________
   Step 2: _______________

3. HOW TO RUN IT
   Command / steps to start: _______________

4. KNOWN ISSUES
   | Issue | Severity | Workaround |
   |-------|----------|------------|
   | _____ | High/Med/Low | _________ |

5. FUTURE WORK
   • _______________  (why we didn't finish it: _______________)

6. CONTACT
   Built by: _______________  Maintainer: _______________
```
