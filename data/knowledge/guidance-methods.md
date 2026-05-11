# Guidance Mode Methods & Templates

This document provides concrete, easy-to-use methods and templates specifically designed for students using Guidance Mode. EngiBuddy should provide these templates to users to make tasks easier, breaking down complex requirements into bite-sized pieces.

## Phase 0: Empathize

### Method: The 5 Whys
**Use when:** The user has identified a symptom but not the root cause.
**How to guide the user:** Ask "Why?" 5 times in a row. Present this as a structured template they can fill out step-by-step.
**Example Template to Provide:**
1. Why did the user experience [pain point]? (Your answer here)
2. Why did [answer to 1] happen?
3. Why did [answer to 2] happen?
4. Why did [answer to 3] happen?
5. Why did [answer to 4] happen? (This is your root cause!)

### Method: Empathy Map Template
**Use when:** The user needs to synthesize their user interviews or observations.
**Example Template to Provide:**
```markdown
*   **Says:** What are some quotes and defining words your user said?
*   **Thinks:** What might your user be thinking? What are their beliefs?
*   **Does:** What actions and behaviors did you observe?
*   **Feels:** What emotions might your subject be feeling?
```

## Phase 1: Conceive

### Method: Problem Statement Mad-Libs
**Use when:** The user is struggling to write a clear problem statement.
**Example Template to Provide:**
"Try filling in the blanks to build your problem statement:
I am solving a problem for **[Target User]**. 
Currently, they are struggling with **[Specific Pain Point]** 
because **[Root Cause]**. 
This is important to solve because **[Impact/Cost of not solving it]**."

### Method: MoSCoW Prioritization
**Use when:** The user's scope is too broad and they need to cut features.
**Example Template to Provide:**
"Let's categorize your features to shrink the scope:
*   **Must Have:** (Non-negotiable needs)
*   **Should Have:** (Important but not vital right now)
*   **Could Have:** (Nice to have if time permits)
*   **Won't Have:** (Explicitly out of scope for this iteration)"

## Phase 2: Design

### Method: Pugh Matrix (Decision Matrix)
**Use when:** The user needs to compare technology choices or design alternatives.
**Example Template to Provide:**
"Let's compare your options systematically. Fill out this matrix (use +1 for better, 0 for same, -1 for worse compared to a baseline):
| Criterion | Baseline (Option A) | Option B | Option C |
| :--- | :--- | :--- | :--- |
| Cost | 0 | | |
| Speed/Performance | 0 | | |
| Ease of Use | 0 | | |
| **Total Score** | **0** | | |"

### Method: WBS Outline Template
**Use when:** The user is struggling to break down work.
**Example Template to Provide:**
"Let's break the project into 3 main phases. For Phase 1, what are the first 3 small tasks?
1. **[Major Component 1]**
   - Task 1.1: (e.g., Setup environment)
   - Task 1.2: 
   - Task 1.3: "

## Phase 3: Implement

### Method: Rubber Duck Debugging Protocol
**Use when:** The user's code isn't working and they are frustrated.
**How to guide the user:** Offer to be their "rubber duck".
**Example Template to Provide:**
"Let's debug this step-by-step. Please answer these three questions:
1. What exactly did you expect the code to do?
2. What exactly did it do instead? (Include error messages)
3. Which specific line or function do you suspect is failing?"

### Method: Step-by-step Unit Test Template
**Use when:** The user hasn't written any tests.
**Example Template to Provide:**
"Let's write your first test using the Arrange-Act-Assert method:
*   **Arrange:** What inputs or setup do we need?
*   **Act:** What function are we calling?
*   **Assert:** What output should we expect?"

## Phase 4: Test/Revise

### Method: Peer Review Matrix
**Use when:** The user needs to collect and act on feedback.
**Example Template to Provide:**
"Organize your peer feedback using this simple table:
| Feedback Received | Is it Actionable? (Yes/No) | What will you change? |
| :--- | :--- | :--- |
| "The button is hard to find" | Yes | Move it to the top right |
| | | |"

## Phase 5: Operate

### Method: STAR Presentation Method
**Use when:** The user needs to plan their presentation or final report.
**Example Template to Provide:**
"Structure your presentation using the STAR method:
*   **Situation:** What was the context and who was the user?
*   **Task:** What specific problem did you set out to solve?
*   **Action:** What did you build and how did you build it?
*   **Result:** What was the outcome and what did you learn?"
