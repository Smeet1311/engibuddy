# EngiBuddy Tools Library

Each guided tool helps students work through a specific challenge or deliverable. Tools are scaffolding templates, not answers—students fill in content based on their project.

## Tool 1: SCOPE INTERROGATOR
**Purpose:** Diagnose and sharpen unclear or overly broad project scope.

**When to Use:**
- Student scope statement is vague ("build an app")
- Project goal keeps expanding
- Can't identify what's in/out of scope
- Struggling to estimate timeline

**Student Workflow:**
1. Answer: "Who is your primary user and what specific problem do they have?"
2. Answer: "What will success look like for them?"
3. Answer: "What constraints limit your project (time, budget, skills, resources)?"
4. Answer: "What are you explicitly NOT building (out of scope)?"
5. Create: Refined one-paragraph problem statement

**Expected Output:**
- Clear user definition
- Specific problem statement (not broad goal)
- Documented constraints
- Explicit out-of-scope boundary

---

## Tool 2: PROBLEM STATEMENT GENERATOR
**Purpose:** Create formal problem statement documentation.

**When to Use:**
- Starting a new project (Empathize/Identify phase)
- Need to communicate problem to stakeholders
- Problem definition keeps changing

**Template Sections:**
1. **Problem Definition** (1 paragraph): What is the problem, why does it matter?
2. **Impact** (1 paragraph): Who is affected, what is the cost of the problem?
3. **Users/Stakeholders** (list): Who directly and indirectly affected?
4. **Success Criteria** (5-7 criteria): How will you know if you solved it?
5. **Constraints** (list): Time, budget, skills, resources, legal, safety
6. **Research Summary** (1-2 pages): What did you learn from interviews and literature?

**Expected Output:**
- 3-5 page problem statement document
- Stakeholder agreement on problem interpretation
- Clear scope and constraints

---

## Tool 3: REQUIREMENTS VS. SPECIFICATIONS CHECKER
**Purpose:** Distinguish between what the solution should do (requirements) and how to build it (specifications).

**When to Use:**
- Design phase, defining what needs to be built
- Team confused about functional vs. non-functional requirements
- Specifications and requirements tangled together

**Diagnostic Questions:**
- "What does the user need the system to do?" → REQUIREMENT
- "How fast does it need to respond?" → REQUIREMENT (non-functional)
- "Should you use a database or file storage?" → SPECIFICATION
- "Will you use React or Vue?" → SPECIFICATION

**Template:**
1. **Functional Requirements** (list): What the system does (user-facing)
2. **Non-Functional Requirements** (list): Quality attributes (speed, reliability, usability, security)
3. **Technical Specifications** (outline): Technology choices and architecture
4. **Trade-offs** (table): What you're choosing vs. alternatives and why

**Expected Output:**
- Clear list of requirements (independent of technology)
- Separate technology/architecture specification
- Documented trade-off decisions

---

## Tool 4: RESEARCH SCAFFOLD
**Purpose:** Structure and guide research and learning.

**When to Use:**
- Student doesn't know how to research the problem space
- Needs to learn background context
- Investigating existing solutions
- Exploring technology options

**Research Phases:**
1. **Background** (literature review, domain knowledge)
   - Keywords to search
   - Key papers, resources, textbooks
   - Foundational concepts to understand

2. **Existing Solutions** (prior art, competitive analysis)
   - Similar projects or products
   - How they solve the problem
   - Trade-offs of each approach

3. **User Research** (interviews, surveys, observation)
   - Who to interview (target users, experts, stakeholders)
   - Interview script and questions
   - How to observe/document

4. **Technology Options** (if applicable)
   - Key technologies in this domain
   - Trade-offs (learning curve, maturity, cost, performance)
   - Community support and documentation

**Deliverable:**
- Research report (3-5 pages) with findings and implications
- Bibliography and source links
- How findings shaped your solution approach

---

## Tool 5: TECHNOLOGY COMPARISON ASSISTANT
**Purpose:** Systematically evaluate technology/methodology options.

**When to Use:**
- Choosing programming language, framework, or architecture approach
- Evaluating multiple solutions to the same problem
- Need to justify technology choices

**Comparison Framework:**
1. **Define Criteria** (e.g., learning curve, performance, team skills, documentation, community)
2. **Evaluate Each Option** (for each criterion)
3. **Weight Criteria** (what matters most for YOUR project)
4. **Score and Rank** (matrix: options × weighted criteria)
5. **Risk Assessment** (what's the downside of your choice?)

**Example Comparison:**
| Criterion | Weight | Python | Node.js | Java | Selected | Reason |
|---|---|---|---|---|---|---|
| Team knows it | 40% | 3 | 1 | 1 | Python | Most team experience |
| Docs available | 20% | 5 | 5 | 5 | Any | All strong here |
| Speed (needed?) | 20% | 3 | 4 | 5 | Node.js | Balanced for our needs |
| Learning curve | 20% | 4 | 2 | 1 | Python | Faster onboarding |
| **Total Score** | | **3.6** | **3.2** | **2.4** | **Python** | Winner! |

**Deliverable:**
- Comparison matrix with reasoning
- Risk analysis of chosen technology
- Learning plan if team unfamiliar

---

## Tool 6: WBS WIZARD (Work Breakdown Structure)
**Purpose:** Decompose project into tasks with dependencies and timeline.

**When to Use:**
- Planning phase, breaking work into manageable pieces
- Need to estimate and schedule
- Team doesn't understand dependencies

**Output Structure:**
1. **Major Phases** (6-8 phases from framework)
2. **Milestones** (what's the deliverable at end of each phase)
3. **Tasks** (under each phase, 8-15 tasks per phase)
4. **Dependencies** (what task must finish before this one starts?)
5. **Estimates** (how long for each task, in days)
6. **Assignments** (who's responsible)

**Example Snippet:**
```
Phase 1: Design
├─ Task 1.1: Write requirements (3 days) - Alice
├─ Task 1.2: Create architecture diagram (2 days) - Bob [depends on 1.1]
├─ Task 1.3: Plan database schema (2 days) - Carlos [depends on 1.1]
├─ Task 1.4: Define API contracts (2 days) - Alice [depends on 1.2]
└─ Task 1.5: Get team sign-off (1 day) - Alice [depends on 1.4]
```

**Critical Path:** The longest sequence of dependent tasks (determines minimum timeline)

**Deliverable:**
- Detailed WBS with 50-100 tasks
- Critical path identified
- Timeline with contingency buffer (20-30% extra time)

---

## Tool 7: SCHEDULE REALISM CHECKER
**Purpose:** Validate that project timeline is actually achievable.

**When to Use:**
- Timeline seems too short
- Need to convince stakeholders timeline is realistic
- Estimating if project fits in semester/time constraint

**Reality Checks:**
1. **Estimate Validation:** Did you base estimates on past projects or guesses?
2. **Contingency:** Do you have 20-30% buffer for unexpected delays?
3. **Integration Time:** Did you budget time to integrate components?
4. **Testing Time:** Did you allocate 15-20% of time for testing?
5. **Rework Time:** Did you account for bugs/issues found late?
6. **Team Velocity:** Have similar team built similar things? How long did it take?
7. **Skill Risk:** Is new technology factored into estimates (learning curve)?
8. **Dependencies:** Are there external dependencies on people/resources outside your control?

**Coaching Questions:**
- "How did you arrive at this estimate?"
- "What happens if key component takes 50% longer?"
- "What's your buffer if someone gets sick or busy?"
- "What's your critical path?"

**Deliverable:**
- Timeline validation or timeline revision
- Risk register for schedule risks
- Contingency plan if behind schedule

---

## Tool 8: INTERFACE DEFINITION HELPER
**Purpose:** Clearly define component interfaces and contracts before building.

**When to Use:**
- Multiple people building different components (integration risk)
- Need clarity on data flow between modules
- Preventing "integration surprises"

**Definition Template:**
1. **Component Diagram** (visual representation of components)
2. **For Each Interface:**
   - **Input** (what data, format, constraints)
   - **Output** (what data, format, units)
   - **Error Cases** (what if input is invalid?)
   - **Performance** (latency/throughput requirements)
   - **Version** (if interface will evolve)

**Example:**
```
Interface: UserAuthenticator.authenticate()
Input: username (string, 3-20 chars), password (string, 8+ chars)
Output: UserToken {id, sessionId, expiresAt}
Errors: InvalidUsername, InvalidPassword, AccountLocked
Performance: Must respond within 100ms
```

**Deliverable:**
- Interface specification document
- Component diagram
- Integration test plan based on interfaces

---

## Tool 9: DEBUGGING PROTOCOL GUIDE
**Purpose:** Teach systematic debugging methodology.

**When to Use:**
- Student is stuck and trying random fixes
- Code "doesn't work" but they can't articulate what's wrong
- Need to isolate complex problem

**Debugging Methodology:**
1. **Reproduce** (consistently trigger the problem)
   - "What steps cause the error?"
   - "Can you reproduce it every time?"

2. **Isolate** (narrow down where the error is)
   - "Is it in module A or B?"
   - "Does the error happen with all inputs or specific ones?"

3. **Hypothesize** (form a theory about the cause)
   - "What could cause this behavior?"
   - "What changed recently?"

4. **Test** (gather evidence)
   - "What logging can you add?"
   - "Can you test this hypothesis?"

5. **Refine** (based on evidence, narrow further or confirm)
   - "What did the evidence show?"
   - New hypothesis based on what you learned

6. **Fix and Verify** (apply fix and test broadly)
   - "Does this fix the issue?"
   - "Does it break anything else?"

**Anti-Patterns to Avoid:**
- Random changes hoping one fixes it
- "Commenting out code" to "see what happens"
- Changing multiple things at once (can't tell which fixed it)

**Deliverable:**
- Diagnosed root cause
- Fixed code
- Understanding of why it was broken (lesson learned)

---

## Tool 10: TEST PLAN PROMPTER
**Purpose:** Systematically plan and execute testing.

**When to Use:**
- Starting implementation phase
- Approaching testing phase
- Need to plan quality validation

**Test Plan Outline:**
1. **Acceptance Criteria** (success definition)
2. **Functional Test Cases** (does the system do what it should?)
   - Happy path (normal usage)
   - Edge cases (boundary conditions)
   - Error cases (invalid input, failure scenarios)
3. **Non-Functional Testing** (quality attributes)
   - Performance (speed, memory, scalability)
   - Reliability (error handling, recovery)
   - Usability (user can figure it out)
   - Security (if applicable)
4. **Integration Testing** (components work together)
5. **User Acceptance Testing** (actual users validate)

**Test Case Template:**
```
Test Case: Login with valid credentials
Precondition: User account exists, not locked
Steps:
  1. Navigate to login screen
  2. Enter valid username
  3. Enter valid password
  4. Click submit
Expected Result: Logged in, redirected to home
Actual Result: [to be filled during test]
Pass/Fail: [to be determined]
```

**Deliverable:**
- Written test plan (30-50 test cases)
- Test results documented
- Defects logged and prioritized

---

## Tool 11: VERSION CONTROL COACH
**Purpose:** Establish healthy version control practices.

**When to Use:**
- Starting implementation
- Multiple people building same project
- Need collaboration without conflict

**Practices to Establish:**
1. **Commit Discipline**
   - Frequent, small commits
   - Descriptive commit messages
   - One logical change per commit

2. **Branch Strategy**
   - Main branch always builds/passes tests
   - Feature branches for major work
   - Pull requests before merging

3. **Collaboration**
   - Pull latest before starting
   - Resolve conflicts carefully
   - Code review before merge
   - Communicate what you're working on

4. **Tooling**
   - .gitignore for dependencies and builds
   - Branch protection rules
   - Automated tests on PR

**Anti-Patterns to Avoid:**
- Giant commits with mixed changes
- Vague commit messages ("fixed stuff")
- Merging without testing
- Overwriting others' changes

**Deliverable:**
- Clean git history (descriptive commits)
- No merge conflicts or lost code
- Team coordination without stepping on each other

---

## Tool 12: DOCUMENTATION ENFORCER
**Purpose:** Establish documentation practices as part of development.

**When to Use:**
- Starting implementation (set standard)
- Code review (check for docs)
- Final project phase (prepare handoff docs)

**Documentation To Create:**
1. **README.md** (entry point for anyone)
   - What is this project?
   - How to build/run it?
   - What are key files?
   - Who's the team?

2. **Architecture Docs** (design overview)
   - Component diagram
   - Data flow
   - Technology choices (why did you choose X?)

3. **API Documentation** (if applicable)
   - Endpoints/functions
   - Parameters and return values
   - Examples
   - Error codes

4. **Code Comments** (inline explanations)
   - Why (not what—code says what)
   - Complex logic
   - Non-obvious design decisions
   - Known limitations

5. **User Guide** (if end-user facing)
   - How to install
   - How to use key features
   - Troubleshooting
   - FAQ

6. **Deployment Docs** (how to run in production)
   - System requirements
   - Installation steps
   - Configuration
   - Backup/recovery procedures

**Deliverable:**
- Complete documentation
- Anyone can understand and run your system
- Future team (or your future self) can maintain it

---

## Tool 13: CRITERIA VALIDATION CHECKER
**Purpose:** Verify solution meets requirements and acceptance criteria.

**When to Use:**
- Late implementation (approaching finish)
- Testing phase
- Before delivery/demo

**Validation Framework:**
1. **Acceptance Criteria**
   - Does it solve the problem identified in Empathize?
   - Meet all functional requirements?
   - Meet non-functional requirements (speed, reliability)?

2. **Evidence Gathering**
   - Demonstration (show it working)
   - User testing (actual users try it)
   - Performance benchmark (if applicable)
   - Test results (pass/fail matrix)

3. **Gap Analysis**
   - What criteria isn't met?
   - What's the impact?
   - Can it be fixed before delivery?

4. **Sign-off**
   - Stakeholder/user confirms it solves the problem
   - Team confirms all criteria met
   - Project ready for Operate phase

**Deliverable:**
- Validation matrix (criteria × evidence)
- Stakeholder sign-off
- Defect list (prioritized)
- Known limitations documented

---

## Tool 14: PRESENTATION COACH
**Purpose:** Prepare engaging project presentation and demonstration.

**When to Use:**
- 2-3 weeks before deadline
- Need to communicate solution to non-technical audience
- Preparing portfolio presentation

**Presentation Structure:**
1. **Hook** (30 seconds): Why does this matter?
2. **Problem** (2-3 minutes): What was the problem, who has it, why is it important?
3. **Solution** (3-4 minutes): What did you build, how does it work, why this approach?
4. **Evidence** (2-3 minutes): Demo or user feedback showing it solves the problem
5. **Learning** (1-2 minutes): What did you learn, what surprised you, what would you do differently?
6. **Call to Action** (30 seconds): What's next, how can people engage?

**Demo Tips:**
- Prepare it beforehand (don't live-code on stage)
- Have backup video if tech fails
- Show the real use case (not contrived example)
- Have someone play the "user"
- Time limit: 15 minutes total

**Slide Design:**
- Minimal text (visuals > words)
- One idea per slide
- Large fonts (readable from back)
- Consistent branding
- Practice, practice, practice

**Deliverable:**
- Slides (10-15 slides)
- Demo (working, tested)
- Speaker notes
- Practiced presentation (timing, flow)

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
