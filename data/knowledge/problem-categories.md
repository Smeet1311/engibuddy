# PBL Student Problem Categories

EngiBuddy diagnoses student challenges using these problem categories. When a student explains their situation, these categories help identify the underlying issue and recommend appropriate coaching.

## 1. SCOPE & PLANNING ISSUES

### Unclear or Overly Broad Scope
**Symptoms:**
- Student can't articulate the specific problem
- Project goal is vague ("build an app for social good")
- Student keeps adding features
- Can't estimate timeline or effort
- Stakeholders unclear

**Root Causes:**
- Insufficient time in Empathize/Identify phase
- Missing stakeholder analysis
- No constraints documented
- Conflicting requirements not resolved

**EngiBuddy Diagnosis Questions:**
- "Can you describe the problem in one sentence?"
- "Who specifically would use this, and what problem does it solve for them?"
- "What are you NOT building (out of scope)?"
- "What constraints limit this project (time, budget, skills)?"

**Coaching Response:**
- Recommend: Use Scope Interrogator tool to narrow and clarify
- Point: "You need to understand your users before designing a solution"
- Suggest: "Pick the highest-value user problem and focus there"
- Guide: "Document constraints explicitly—these limit your scope"

**Prevention:**
- Spend 1-2 weeks in Empathize phase before moving to Conceive
- Document problem statement with stakeholder analysis
- List what's in-scope and what's out-of-scope explicitly

---

### Unrealistic Timeline or Planning
**Symptoms:**
- Project timeline is too compressed
- Task estimates are too optimistic
- Discovery happens during execution (no contingency)
- Critical path not understood
- Dependencies not mapped

**Root Causes:**
- No Work Breakdown Structure
- Inexperience estimating engineering work
- Missing integration/testing time
- No contingency buffer (typical: 20-30%)

**EngiBuddy Diagnosis Questions:**
- "How did you arrive at this timeline?"
- "What's your buffer for unexpected problems?"
- "Have you done similar projects before? How long did they take?"
- "What's your critical path (longest sequence of dependent tasks)?"

**Coaching Response:**
- Recommend: Use Schedule Realism Checker tool
- Point: "Engineering rarely goes to plan. Build in 20-30% contingency"
- Suggest: "Add buffers on critical-path items"
- Guide: "Have experienced people review your timeline"

**Prevention:**
- Use WBS Wizard to break work into granular pieces
- Compare to similar past projects
- Add explicit contingency buffer
- Identify critical path and monitor closely

---

## 2. RESEARCH & KNOWLEDGE GAPS

### Insufficient Research
**Symptoms:**
- Student doesn't know what's already been done
- Reinventing the wheel
- Design choices not justified by evidence
- Missing prior art
- User needs assumed, not researched

**Root Causes:**
- Skipped or rushed Conceive/Investigate phase
- Didn't talk to actual users
- No literature review
- Assumed understanding instead of investigating

**EngiBuddy Diagnosis Questions:**
- "What existing solutions did you research?"
- "Have you talked to actual users about their needs?"
- "What's the scientific/technical background of this problem?"
- "What can you learn from how others solved similar problems?"

**Coaching Response:**
- Recommend: Use Research Scaffold tool to structure investigation
- Point: "You can't design a good solution without understanding the problem space"
- Suggest: "Do a literature review, patent search, and user interviews"
- Guide: "Document what you learned and how it changed your approach"

**Prevention:**
- Spend sufficient time in Investigate phase (2-3 weeks minimum)
- Conduct user interviews (5-10 interviews minimum)
- Document all research sources and findings

---

### Technical Knowledge Gaps
**Symptoms:**
- Student doesn't understand technologies needed
- Architectural decisions unmotivated
- Can't troubleshoot technical problems
- Oversimplifies or overcomplicates technical approach

**Root Causes:**
- Chose technology before understanding requirements
- No time for learning curve
- Wrong skill level for project scope
- Insufficient technical mentorship

**EngiBuddy Diagnosis Questions:**
- "Have you used this technology/language before?"
- "What research did you do on technology options?"
- "What's your learning plan for the technical skills you need?"
- "Who can mentor you on the technical challenges?"

**Coaching Response:**
- Recommend: Use Technology Comparison Assistant tool
- Point: "Match technology to your skills and timeline"
- Suggest: "Build in learning time for unfamiliar tech (e.g., 20% of project)"
- Guide: "Find technical mentors and schedule regular reviews"

**Prevention:**
- Assess team skills before choosing technology
- Choose technologies with good documentation and community support
- Build in explicit learning time
- Connect with technical mentors early

---

## 3. TECHNICAL EXECUTION PROBLEMS

### Integration or System Failures
**Symptoms:**
- Components work individually but not together
- Data flow breaks between modules
- System goes down when components interact
- Interfaces not compatible
- No coherent system, just disconnected pieces

**Root Causes:**
- Didn't define interfaces/contracts upfront
- Insufficient integration testing
- Built in isolation without regular integration
- Incompatible technology choices

**EngiBuddy Diagnosis Questions:**
- "When did you last integrate all components?"
- "What interface/contract did you define between modules?"
- "What integration testing have you done?"
- "Which piece is failing when you integrate?"

**Coaching Response:**
- Recommend: Use Integration Planning (part of Design phase)
- Point: "Continuous integration catches problems early"
- Suggest: "Integrate frequently (daily if possible)"
- Guide: "Define clear interfaces before building"

**Prevention:**
- Define component interfaces in Design phase
- Integrate early and often (not at end)
- Automated integration testing
- Regular system-wide testing

---

### Debugging or Troubleshooting Stuck
**Symptoms:**
- Student has a problem but doesn't know how to isolate it
- Randomly tries fixes without hypothesis
- Can't articulate the error
- Frustrated and overwhelmed by complexity

**Root Causes:**
- No systematic debugging methodology
- Didn't learn troubleshooting skills
- Problem too big to debug at once
- Missing tools or monitoring

**EngiBuddy Diagnosis Questions:**
- "What's the exact error message?"
- "What was the last thing that changed?"
- "When did this start happening?"
- "Have you tried isolating the problem (is it in module A or B)?"

**Coaching Response:**
- Recommend: Use Debugging Protocol Guide tool
- Point: "Debugging is a science: form hypothesis, test, observe, refine"
- Suggest: "Start by reproducing the problem consistently"
- Guide: "Use logging, breakpoints, and systematic elimination"

**Prevention:**
- Learn systematic debugging methodology early
- Advocate for instrumentation (logging) from project start
- Have safety net (version control) to experiment
- Regular code review catches issues early

---

## 4. TESTING & VALIDATION PROBLEMS

### Inadequate Testing
**Symptoms:**
- No written test plan
- Only testing "happy path"
- Doesn't test edge cases or error conditions
- Can't demonstrate solution meets requirements
- User feedback triggers new bugs

**Root Causes:**
- Testing seen as "end of project" activity
- No automated testing
- Insufficient time allocated for testing
- No clear acceptance criteria

**EngiBuddy Diagnosis Questions:**
- "How did you establish acceptance criteria?"
- "What edge cases could break your solution?"
- "How will you test error conditions?"
- "Have you done user acceptance testing?"

**Coaching Response:**
- Recommend: Use Test Plan Prompter tool
- Point: "Testing starts in Design phase, not at the end"
- Suggest: "Write tests as you code, not after"
- Guide: "Include edge cases, error paths, and stress tests"

**Prevention:**
- Define test cases in Design phase (before coding)
- Write tests concurrent with implementation
- Automated regression testing
- User acceptance testing 1-2 weeks before delivery

---

### Missing Quality Validation
**Symptoms:**
- Solution works but is slow/buggy
- User experience is poor
- Can't measure whether solution meets non-functional requirements
- No performance benchmarking

**Root Causes:**
- Non-functional requirements not defined
- No performance/UX testing
- Optimization left too late
- Users not involved in validation

**EngiBuddy Diagnosis Questions:**
- "What are your performance requirements (speed, memory, reliability)?"
- "How will you test these non-functional requirements?"
- "Have users tried the solution? What did they say?"
- "What's your usability testing approach?"

**Coaching Response:**
- Recommend: Use Criteria Validation Checker tool
- Point: "Users care about reliability, speed, and usability—test these"
- Suggest: "Build measurement/monitoring into your solution"
- Guide: "Do usability testing with actual users 2-3 weeks before delivery"

**Prevention:**
- Include non-functional requirements in Design phase
- Test quality attributes (speed, reliability, usability) early and often
- Involve users in validation testing

---

## 5. DOCUMENTATION & COMMUNICATION

### Missing or Poor Documentation
**Symptoms:**
- Code has no comments
- No design rationale recorded
- Installation/setup instructions missing
- User can't understand how to use solution
- Team knowledge siloed

**Root Causes:**
- Documentation viewed as "extra work"
- Left until end of project (then rushed)
- No documentation standard or template
- Time pressure causes corners to cut

**EngiBuddy Diagnosis Questions:**
- "Can a new team member understand your code?"
- "Have you documented your architectural decisions and why?"
- "Do users know how to install/use the solution?"
- "Is system deployment documented?"

**Coaching Response:**
- Recommend: Use Documentation Enforcer tool
- Point: "Documentation is part of being an engineer—it's non-negotiable"
- Suggest: "Document as you code, not after"
- Guide: "Create README, architecture docs, user guide, API docs"

**Prevention:**
- Create documentation template in Design phase
- Write documentation concurrent with implementation
- Include in definition of "done"
- Documentation review as part of code review

---

### Weak Presentations or Communication
**Symptoms:**
- Can't articulate why the solution matters
- Doesn't communicate technical decisions clearly
- Presentation is disorganized
- Audience doesn't understand the work
- Fails to persuade stakeholders

**Root Causes:**
- Left presentation until end
- No structured thinking about story/narrative
- Poor public speaking skills
- Doesn't prepare/practice

**EngiBuddy Diagnosis Questions:**
- "What's the core story you're telling (problem, solution, impact)?"
- "Who is your audience and what do they care about?"
- "Have you practiced your presentation?"
- "What questions might your audience ask?"

**Coaching Response:**
- Recommend: Use Presentation Coach tool
- Point: "Being able to communicate your work is as important as doing it"
- Suggest: "Structure your presentation: problem → solution → evidence → impact"
- Guide: "Practice with peers and get feedback"

**Prevention:**
- Start planning presentation 2-3 weeks before deadline
- Record video, get peer feedback
- Practice multiple times with different audiences
- Make slides tell visual story, not text dump

---

## 6. COLLABORATION & SEEKING HELP

### Collaboration Conflicts or Unclear Roles
**Symptoms:**
- Team members stepping on each other's work
- Duplicate work or gaps in coverage
- Communication breaking down
- Some team members disengaged
- Integration chaos because nobody understood the plan

**Root Causes:**
- Roles and responsibilities not defined
- No shared understanding of plan
- Poor communication practices
- Conflict not addressed early
- Feature/task ownership unclear

**EngiBuddy Diagnosis Questions:**
- "What's each person responsible for?"
- "How often does your team synchronize?"
- "How do you resolve disagreements?"
- "Are there conflicts between team members?"

**Coaching Response:**
- Recommend: Team roles and responsibilities matrix (Design phase)
- Point: "Clear roles prevent duplicate work and gaps"
- Suggest: "Daily or every-other-day standups"
- Guide: "Address conflicts early before they fester"

**Prevention:**
- Define roles and responsibilities in Design phase
- Use version control to track work
- Regular team synchronization (standups)
- Clear feature ownership model

---

### Difficulty Asking for Help or Unblocking
**Symptoms:**
- Student stuck but doesn't ask for help
- Spends days on a problem that expert could solve in 30 minutes
- Embarrassed about knowledge gaps
- Doesn't know who to ask or how

**Root Causes:**
- Fear of judgment ("I should know this")
- No clear mentoring relationships
- Don't know what help to ask for
- Mentors not accessible

**EngiBuddy Diagnosis Questions:**
- "Have you asked for help? Who could help?"
- "What specifically are you stuck on?"
- "Is this a knowledge gap or a technical problem?"
- "Who are your mentors/technical resources?"

**Coaching Response:**
- Recommend: Create mentorship plan early
- Point: "Asking for help when blocked is professional, not weakness"
- Suggest: "Define your question clearly before asking"
- Guide: "Identify mentor for each technical area"

**Prevention:**
- Identify mentors in Planning phase
- Schedule regular check-ins (weekly minimum)
- Frame help-seeking as "how to learn"
- Create psychological safety for questions

---

## 7. REFLECTION & LEARNING

### Shallow Reflection or Learning
**Symptoms:**
- Lessons learned are vague ("We learned teamwork")
- Doesn't articulate what changed or why
- Can't apply learning to next project
- Focuses on blame instead of learning
- No portfolio artifact capturing work

**Root Causes:**
- Reflection not built into process
- Time pressure at end of project
- Views reflection as "extra"
- No structure for reflection

**EngiBuddy Diagnosis Questions:**
- "What was the hardest part and how did you solve it?"
- "What would you do differently next time?"
- "What surprised you about this project?"
- "What skills do you have now that you didn't have before?"

**Coaching Response:**
- Recommend: Use Retrospective Facilitator tool
- Point: "Reflection is how learning becomes insight"
- Suggest: "Structure reflection: What went well, what we'd change, lessons learned"
- Guide: "Create portfolio artifact showing problem, process, solution, learning"

**Prevention:**
- Month-long Operate phase dedicated to reflection
- Structured retrospective meeting (not quick debrief)
- Individual reflection journals throughout project
- Portfolio artifact requirement

---

## Summary Table: Problem → Tool Mapping

| Problem Category | Primary Tool | Secondary Tool |
|---|---|---|
| Unclear scope | Scope Interrogator | Problem Statement Generator |
| Unrealistic planning | Schedule Realism Checker | WBS Wizard |
| Insufficient research | Research Scaffold | Technology Comparison Assistant |
| Technical knowledge gap | Technology Comparison Assistant | Debugging Protocol Guide |
| Integration failures | Interface Definition Helper | Debugging Protocol Guide |
| Debugging stuck | Debugging Protocol Guide | Version Control Coach |
| Inadequate testing | Test Plan Prompter | Criteria Validation Checker |
| Poor documentation | Documentation Enforcer | None (Documentation is foundation) |
| Weak communication | Presentation Coach | None (Requires practice) |
| Collaboration problems | Team roles definition | None (Requires team discussion) |
| Not asking for help | Mentorship planning | None (Requires culture change) |
| Shallow reflection | Retrospective Facilitator | None (Requires structured thinking) |
