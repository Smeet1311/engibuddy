# Phase-by-Phase Worked Examples

Concrete examples of good student work at each PBL phase. Use these to show students what "good" looks like when they ask for examples or seem stuck.

---

## Phase 0: Empathize — Good Examples

### Good: User Interview Summary
**Keywords:** empathize, interview, user, observation, pain point, stakeholder

```
Interview with: Maria, 2nd-year nursing student
Duration: 20 min  |  Method: semi-structured interview

Key quotes (Says):
• "I write the assignment due dates in my notebook but then forget to check it."
• "By the time I get the reminder email, I've already missed it or I'm panicking."
• "My phone is always with me — if it just buzzed me at the right time, I'd be fine."

What she thinks (inferred):
• Feels embarrassed about missing deadlines — thinks she "should" remember.
• Trusts her phone more than any other reminder system.

What she does:
• Checks Instagram and WhatsApp 20+ times per day.
• Never opens university email on her phone, only on laptop.

Feels: Anxious before submission days. Relieved when reminded in time.

Pain point in her words: "The reminders come too late and in the wrong place."
```

---

### Good: How-Might-We (HMW) Questions After Interviews
**Keywords:** how might we, empathize, pain point, problem framing

After 5 interviews, good HMW questions look like this:

```
HMW: "How might we help nursing students receive deadline reminders
      in the apps they already use daily, without requiring them
      to install or check a new tool?"

HMW: "How might we make course deadlines feel urgent and personal
      rather than generic, so students act on reminders immediately?"

HMW: "How might we surface upcoming deadlines automatically
      without any manual entry by students?"
```

BAD HMW (too vague): "How might we improve student organization?"
GOOD HMW: specific user + specific obstacle + specific constraint.

---

## Phase 1: Conceive — Good Examples

### Good: Problem Statement
**Keywords:** conceive, problem statement, scope, success criteria, constraint

```
Problem Statement — Deadline Reminder System

Target user: First and second-year university students who manage 4+ courses simultaneously.

Pain point: Students miss assignment deadlines because course reminders are
sent by email, which students check infrequently on mobile.

Root cause (from Phase 0 interviews): Students check messaging apps (WhatsApp,
Instagram) 20+ times per day but open university email less than once daily on mobile.

Impact: Missed deadlines → grade penalties and increased academic stress.
Observed in 4 of 5 interviews.

Constraint: Solution must work without students changing their existing behavior
patterns (no new app to remember to open; no manual deadline entry required).
```

---

### Good: Measurable Success Criteria
**Keywords:** conceive, success criteria, measurable, acceptance, requirement

BAD success criteria (vague):
- "Students remember deadlines better."
- "The app is easy to use."
- "Reminders work reliably."

GOOD success criteria (measurable with pass/fail thresholds):
```
1. 90% of registered students receive a reminder at least 48 hours before each deadline.
2. Reminder delivery latency < 5 minutes from scheduled send time (tested over 20 sends).
3. System handles 500 concurrent students with < 2% message delivery failure.
4. Setup time for a new student < 3 minutes (tested with 5 first-year students unfamiliar with the system).
5. At least 4 of 5 test users report the reminder arrived "at a useful time" in post-test survey.
```

---

## Phase 2: Design — Good Examples

### Good: Technology Comparison (Database Choice)
**Keywords:** design, technology choice, technology options, compare, comparison, trade-off, architecture

```
Decision: Which database for storing student reminder preferences?

Criteria (weighted):
• Ease of use for our team (weight: 3) — we have 6 weeks, no DBA
• Cost at student-project scale (weight: 2) — budget is $0
• Query speed for <500 users (weight: 2)
• Community documentation quality (weight: 1)

| Option         | Ease (×3) | Cost (×2) | Speed (×2) | Docs (×1) | Total |
|----------------|-----------|-----------|------------|-----------|-------|
| SQLite         | +1 (3)    | +1 (2)    | +1 (2)     | +1 (1)    | 8     |
| PostgreSQL     |  0 (0)    | +1 (2)    | +1 (2)     | +1 (1)    | 5     |
| MongoDB        | +1 (3)    | +1 (2)    |  0 (0)     |  0 (0)    | 5     |
| Firebase       | +1 (3)    |  0 (0)    | +1 (2)     | +1 (1)    | 6     |

Winner: SQLite. Easiest for our team, free, fast enough at our scale.
Risk: If user count exceeds 1000, we'd migrate to PostgreSQL.
```

---

### Good: WBS Task Breakdown
**Keywords:** design, WBS, work breakdown structure, timeline, planning, schedule

```
Work Breakdown Structure — Deadline Reminder App (3-week sprint)

COMPONENT 1: Backend API
  Task 1.1: Set up FastAPI project and SQLite schema — 0.5 day — Dev A
  Task 1.2: Build /register endpoint (student + course) — 1 day — Dev A
  Task 1.3: Build reminder scheduler (cron job) — 1 day — Dev A
  Task 1.4: Write unit tests for scheduler — 0.5 day — Dev A

COMPONENT 2: WhatsApp/SMS Integration
  Task 2.1: Research Twilio vs. WhatsApp Business API — 0.5 day — Dev B
  Task 2.2: Implement notification sender module — 1 day — Dev B
  Task 2.3: Test 20 sends, log delivery times — 0.5 day — Dev B

COMPONENT 3: Frontend (Admin View)
  Task 3.1: Build course/deadline entry form — 1 day — Dev C
  Task 3.2: Build student roster upload (CSV) — 0.5 day — Dev C

COMPONENT 4: Integration & Acceptance Testing
  Task 4.1: End-to-end test: register → reminder fires — 1 day — All  ← 3× buffer
  Task 4.2: 5-user acceptance test + feedback — 0.5 day — All

Total: ~7.5 dev-days. Buffer added on Task 4.1 (integration always takes longer).
```

---

## Phase 3: Implement — Good Examples

### Good: Debugging Log
**Keywords:** implement, debug, debugging protocol, unit test, bug, code, compile

```
Debugging Log — 2024-03-15

Problem: Reminder not firing for students registered after 6pm.

1. Expected: Scheduler fires reminders for ALL students with deadline within 48h.
2. Actual: Reminders only fire for students registered before the scheduler last ran.
3. Last change: Added timezone conversion (UTC → local) to registration timestamp.

Isolation test:
  • Added print statement to scheduler loop. Confirmed: only iterates over
    students in DB at scheduler START, not at fire time.
  • Root cause: scheduler queries DB once at startup, not each run cycle.

Fix: Move DB query inside the scheduler loop (called every 15 min), not at init.

Verified: Registered a test student after scheduler started → reminder fired correctly
on next cycle. Re-ran 5 times. All pass.

Lesson: Scheduler must be stateless — re-query every cycle, never cache student list.
```

---

## Phase 4: Test/Revise — Good Examples

### Good: Acceptance Test Evidence
**Keywords:** test, revise, validation, acceptance, acceptance test, success criteria, peer critique, criterion

```
Acceptance Test Results — Deadline Reminder App

Criterion 1: 90% of students receive reminder ≥ 48h before deadline.
  Test: Sent 20 reminders to 20 test accounts with deadlines set at T+48h.
  Evidence: Delivery log shows 19/20 delivered within 2 minutes. 1 failed (Twilio timeout).
  Status: PARTIAL — 95% delivered, but 1 failure needs investigation.
  Fix: Add retry logic for failed sends (Task added to backlog).

Criterion 2: Reminder latency < 5 minutes.
  Test: Recorded send-time vs delivery-time over 20 sends.
  Evidence: Max latency observed = 2m 34s. Mean = 47s.
  Status: MET ✓

Criterion 3: Setup time < 3 minutes.
  Test: Timed 5 first-year students setting up with no instructions.
  Evidence: Times: 2:10, 1:55, 3:45, 2:30, 2:15. Mean = 2:31.
  Status: PARTIAL — one student took 3:45 (confused by CSV format).
  Fix: Added example CSV template to setup page.
```

---

### Good: Peer Critique Acted On
**Keywords:** test, revise, peer critique, stakeholder re-test, iterate, feedback

```
Peer Review Session — Reviewer: Priya (team: Mobile App track)

Feedback received:
1. "The confirmation message after registering just says 'OK' — no confirmation of what deadline was saved."
   → Actionable: YES. Changed confirmation to: "Registered: Assignment 3 due Mar 20 at 11:59pm. ✓"

2. "The CSV format is confusing — the date column header says 'due_date' but the example uses slashes not dashes."
   → Actionable: YES. Standardized to ISO format (YYYY-MM-DD) + added note in UI.

3. "I think the color scheme could be nicer."
   → Actionable: NO (style preference, not functionality). Noted for v2.
```

---

## Phase 5: Operate — Good Examples

### Good: Retrospective (Start/Stop/Continue)
**Keywords:** operate, retrospective, final report, handover, presentation, reflection, deploy

```
Project Retrospective — Deadline Reminder App
Team: [names]  Date: 2024-04-10

START doing next time:
• Define interface contracts (data formats between frontend/backend) in Week 1,
  not Week 3. We wasted 2 days fixing mismatched date formats.
• Write acceptance test cases in Phase 1 alongside success criteria — much easier
  than writing them in Phase 4 after building.

STOP doing next time:
• Stop adding features during Phase 3. We added CSV upload mid-sprint which
  caused 3 days of scope creep. Use MoSCoW earlier and enforce "Won't Have."

CONTINUE doing:
• Daily 15-minute standups — kept integration smooth.
• Debugging log (forced us to write hypotheses before changing code → saved time).

Biggest surprise: Twilio sandbox mode silently drops messages >160 chars.
Took 6 hours to diagnose. Now we always test with production keys from day 1.

One lesson to carry forward:
"Third-party APIs always have hidden constraints. Spike them on day 1, not week 3."
```
