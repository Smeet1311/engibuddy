# EngiBuddy Tools Library

Organized by the 6-phase PBL framework. Each tool is a Socratic scaffold—not an answer generator, but a structured way to ask better questions and guide students toward competence.

---

## Phase 0: EMPATHIZE
**Goal:** Understand users and the real problem before defining a solution.

### Tool 0.1: USER DISCOVERY GUIDE
### Tool 0.1: USER DISCOVERY GUIDE
**Situation:** Student needs to understand who they're building for.

**Opening Question:** "Who is the actual person struggling with this problem right now?"

**Coaching Path:**
- If they say "everyone" → "Let's find ONE specific person. Describe them in detail."
- If they describe needs, not people → "That's a need. Now, who has that need? Name one person."
- If they're vague → "Tell me about a real conversation you had with someone affected."

**Exit Signal:** Student can name specific user(s), their daily context, and what makes them frustrated about the status quo.

---

### Tool 0.2: PROBLEM ARTICULATION
**Situation:** Student thinks they know the problem but hasn't articulated it clearly.

**Coaching Path:**
- "What specific moment in their day causes them pain?"
- "How does this problem affect them right now? What's at stake?"
- "Why hasn't this been solved yet? What's the blocker?"

**Output:** A clear, one-sentence problem statement grounded in a real user's experience.

---

## Phase 1: CONCEIVE
**Goal:** Define what you're solving for (scope, constraints, success criteria).

### Tool 1.1: SCOPE INTERROGATOR
**Situation:** Student's scope is vague, expanding, or unrealistic.

**Coaching Path:**
- "What's in scope?" (what you WILL build)
- "What's explicitly out of scope?" (what you WON'T build, even if it would help)
- "Why draw that line?"
- "Given this scope, can you finish in [your deadline]?"

**Exit Signal:** Student has a clear boundary document and can explain why choices were made.

---

### Tool 1.2: PROBLEM STATEMENT GENERATOR
**Situation:** Need formal documentation of problem before moving to design.

**Key Sections:**
- Problem Definition (What? Why does it matter?)
- Impact (Who's affected? What's the cost?)
- Success Criteria (5-7 measurable ways to know if solved)
- Constraints (time, budget, skills, resources, legal, safety)

**Exit Signal:** Stakeholders agree on the problem interpretation and success looks achievable.

---

### Tool 1.3: REQUIREMENTS CLARITY CHECKER
**Situation:** Student is confusing needs (REQUIREMENTS) with engineering choices (SPECIFICATIONS).

**Diagnostic Question:** "Is that something the user needs, or how you'll build it?"

**Example Clarifications:**
- "Respond in under 1 second" → REQUIREMENT (user needs speed)
- "Use a database" → SPECIFICATION (your technical choice)
- "Support 1000 users simultaneously" → REQUIREMENT (non-functional)
- "Use React" → SPECIFICATION (your framework choice)

**Exit Signal:** Student can list functional + non-functional requirements separately from technology choices.

---

## Phase 2: DESIGN
**Goal:** Research, plan, and architect the solution.

### Tool 2.1: RESEARCH SCAFFOLD
**Situation:** Student doesn't know what research to do or how to organize it.

**Research Pillars:**
- Background Knowledge (domain research, foundational concepts)
- Existing Solutions (what's already out there, competitive analysis)
- User Research (interviews, surveys, observation)
- Technology Exploration (if applicable to your solution)

**Coaching Question:** "What do you need to understand before you design?"

**Exit Signal:** Student has a 3-5 page research report with implications tied to their design.

---

### Tool 2.2: TECHNOLOGY COMPARISON HELPER
**Situation:** Student needs to justify a technology choice.

**Framework:**
1. Define decision criteria (what actually matters for THIS project?)
2. Evaluate each option against those criteria
3. Weight criteria (learning curve vs. performance — what's actually important?)
4. Score and rank
5. Articulate the risk (what if you're wrong about this choice?)

**Coaching Question:** "How did you decide? Just gut feeling, or did you test?"

**Exit Signal:** Decision matrix with reasoning, not just "I like Python."

---

### Tool 2.3: WBS WIZARD (Work Breakdown Structure)
**Situation:** Student needs to break the project into doable tasks.

**Structure:**
- Major Phases (6-8)
- Tasks per phase (8-15)
- Dependencies (what must finish before this starts?)
- Estimates (days per task)
- Assignments (who's doing it?)

**Coaching Question:** "What happens if Task X takes 50% longer? Will you miss your deadline?"

**Exit Signal:** Detailed task list with critical path identified and 20-30% contingency buffer.

---

### Tool 2.4: SCHEDULE REALISM CHECKER
**Situation:** Timeline feels optimistic. Is it actually achievable?

**Reality Checks:**
- Are estimates based on past projects or guesses?
- Is there buffer for unexpected delays (20-30%)?
- Did you budget time to integrate components?
- Did you allocate 15-20% for testing?
- How long did similar work take in past projects?
- Is new technology slowing you down (learning curve)?

**Coaching Question:** "What happens if you're wrong about one estimate?"

**Exit Signal:** Revised timeline with documented assumptions and risk register.

---

### Tool 2.5: INTERFACE DEFINITION (if multi-component)
**Situation:** Multiple people building different parts. Need to prevent integration surprises.

**Definition:**
- Component Diagram (visual)
- Per interface: Input (format, constraints), Output (format, units), Error Cases, Performance Requirements

**Coaching Question:** "Can you test this component in isolation while your teammate builds the other one?"

**Exit Signal:** Interface specs document + integration test plan.

---

## Phase 3: IMPLEMENT
**Goal:** Build the system incrementally with frequent testing.

### Tool 3.1: UNIT TEST DISCIPLINE
**Situation:** Student is writing code but not testing it as they go.

**Coaching Path:**
- "How do you know that function works?"
- "Write a test first, then the code to pass it."
- "What could go wrong with this code? Test that."

**Exit Signal:** Code has test coverage; student runs tests constantly, not at the end.

---

### Tool 3.2: DEBUGGING PROTOCOL
**Situation:** Code "doesn't work." Student is trying random fixes.

**Systematic Approach:**
1. **Reproduce:** Can you trigger the error consistently?
2. **Isolate:** Is it in Module A or B? This function or that one?
3. **Hypothesize:** What could cause this behavior?
4. **Test:** Add logging, trace execution, gather evidence.
5. **Refine:** Based on evidence, narrow down further.
6. **Fix & Verify:** Apply the fix, verify it works, verify you didn't break something else.

**Anti-patterns:** Random changes, changing multiple things at once, "comment it out to see what happens."

**Exit Signal:** Root cause identified, fix applied, lesson understood.

---

### Tool 3.3: CODE VERSIONING DISCIPLINE
**Situation:** Multiple people working on the same code. Need clean collaboration.

**Practices:**
- Small, frequent commits with clear messages (not "fixed stuff")
- One logical change per commit
- Feature branches for major work
- Pull requests before merging (code review)
- Pull latest before starting work
- Communicate what you're working on

**Coaching Question:** "Can someone else understand what you did from your commit messages?"

**Exit Signal:** Clean git history, no merge conflicts, team coordination without stepping on each other.

---

## Phase 4: TEST & REVISE
**Goal:** Validate solution against requirements and iterate.

### Tool 4.1: TEST PLAN BUILDER
**Situation:** Code is written. Now what needs testing?

**Test Categories:**
- Acceptance Criteria (did we solve the original problem?)
- Functional Testing (happy path, edge cases, error cases)
- Non-Functional (speed, reliability, usability, security)
- Integration Testing (do components work together?)
- User Acceptance (do actual users validate it works?)

**Coaching Question:** "How will you prove this meets the requirements?"

**Exit Signal:** Written test plan with 30-50 test cases, results documented, defects logged.

---

### Tool 4.2: CRITERIA VALIDATION CHECKER
**Situation:** Testing reveals gaps. Which ones matter?

**Validation Framework:**
- Which acceptance criteria are met? Which aren't?
- What's the impact of unmet criteria?
- Can it be fixed before delivery?
- What's the priority for iteration?

**Coaching Question:** "Is this a blocking issue or nice-to-have?"

**Exit Signal:** Gap analysis + prioritized defect list + decision on what gets fixed vs. documented.

---

## Phase 5: OPERATE
**Goal:** Deploy, document, present, and reflect.

### Tool 5.1: DOCUMENTATION ENFORCER
**Situation:** Code is done. Now document it.

**Documentation Must Include:**
- README (what is this, how to run it, who built it)
- Architecture Docs (design overview, why these choices)
- API Documentation (endpoints/functions, parameters, examples, errors)
- Code Comments (why, not what—the code says what)
- User Guide (if end-user facing)
- Deployment Docs (how to run in production)

**Coaching Question:** "If you handed this to someone else, could they run it?"

**Exit Signal:** Complete documentation, anyone can understand and maintain the system.

---

### Tool 5.2: PRESENTATION COACH
**Situation:** Need to present solution to stakeholders/audience.

**Structure:**
1. Hook (30s) — Why does this matter?
2. Problem (2-3 min) — What was it, why important?
3. Solution (3-4 min) — What you built, how it works, why this approach.
4. Evidence (2-3 min) — Demo or user feedback proving it works.
5. Learning (1-2 min) — What surprised you, what would you do differently?
6. Call to Action (30s) — What's next?

**Demo Tips:** Pre-test everything, have a backup video, show real use case, time it (15 min max).

**Exit Signal:** Rehearsed 10-15 slide presentation, working demo, speaker notes.

---

### Tool 5.3: REFLECTION JOURNAL
**Situation:** Project is done. Time to learn from it.

**Reflection Prompts:**
- What surprised you?
- What did you underestimate?
- What would you do differently next time?
- What did you learn about the problem domain?
- What did you learn about your own engineering process?
- Biggest win? Biggest mistake?

**Exit Signal:** Written reflection (1-2 pages) that shows growth and self-awareness.

---

## How to Use This Library

**During a chat, EngiBuddy references tools through Socratic questions, not by naming them.** For example:
- Instead of: "Use Tool 0.1: User Discovery Guide"
- EngiBuddy asks: "Who is one specific person affected by this?"

**The tools are internal scaffolds for the coach, not visible to the student.** Each tool has an opening question, a coaching path, and an exit signal (how you know the student is ready to move on).

**As a student progresses through phases, different tools become relevant.** The framework ensures you don't jump to design before understanding the user, don't start building before you've planned, and don't demo before you've tested.

---

## Tool 15: RETROSPECTIVE FACILITATOR
**Purpose:** Systematically capture learning and lessons from project.

**When to Use:**
- End of project
- Before final presentation
- Creating portfolio artifacts

**Retrospective Structure:**
1. **What Went Well?** (strengths, successes)
   - What worked in your process?
   - What team practices helped?
   - What didn't break because of good planning?

2. **What Was Challenging?** (problems, obstacles)
   - What was harder than expected?
   - What did you struggle with?
   - Where did the plan break down?

3. **Lessons Learned** (insights, understanding)
   - What did you learn about the technical domain?
   - What did you learn about yourself/team?
   - What would you do differently next time?

4. **Applied Knowledge** (growth shown)
   - What skills did you develop?
   - What would you be confident teaching someone else?
   - How has your thinking about engineering changed?

**Portfolio Artifact:**
- 2-3 page retrospective document
- Problem statement (what you were solving)
- Key learnings (what changed your understanding)
- Evidence (demo, code, test results)
- Reflection (how you grew as engineer/problem-solver)

**Deliverable:**
- Comprehensive lessons-learned document
- Portfolio artifact ready to share
- Growth narrative for resume/interview
