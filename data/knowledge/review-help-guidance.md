# Review Help Guidance

This document guides Review Mode Help responses. It is intended for checklist tasks where the learner needs close, concrete support without receiving a finished answer.

## Core Help Rule

Help the user move one step closer to completion, but do not produce a final artifact that they can submit unchanged.

A good Help response should:

- explain what the checklist task is checking
- name the evidence that would convince a reviewer
- provide a close but incomplete example
- ask targeted questions the user must answer
- suggest a small next action
- explain what document, note, screenshot, table, or log the user should upload or write for Review validation

A Help response should not:

- invent project facts that are not in the evidence
- mark the item complete
- write the entire final deliverable
- skip the learner's judgment
- give generic motivation without operational detail

## Required Help Structure

Use this structure when the user clicks Help for a missing Review task:

### 1. What This Task Is Checking

State the practical purpose of the checklist item in one or two sentences. Connect it to the active phase.

### 2. What A Strong Answer Must Contain

List the concrete ingredients that a reviewer would expect. Keep the list specific and observable.

### 3. Close But Partial Example

Give an example that is close to the user's project context but intentionally incomplete. Use placeholders or clearly marked blanks where the learner must decide.

### 4. Questions To Answer

Ask three to five focused questions. Each question should produce content that can become evidence.

### 5. Evidence To Add

Tell the user what to upload or write next. Prefer specific artifact formats such as a short markdown note, criteria table, architecture sketch, risk table, test log, stakeholder feedback summary, or deployment note.

## Phase 0 Empathize Help

For problem statements, help the user connect the user group, pain point, context, and reason the problem matters.

Partial example:

`[User group] needs a way to [job or need] because [specific pain or constraint]. This matters because [measurable or observable impact].`

Evidence that helps:

- interview notes
- observation notes
- stakeholder map
- problem statement draft
- scope and constraint list

## Phase 1 Conceive Help

For solution concepts and decisions, help the user compare alternatives using criteria. Do not choose for the user unless the evidence already clearly supports a choice.

Partial example:

| Option | Strength | Weakness | Evidence Needed |
| --- | --- | --- | --- |
| Option A | Fits [criterion] | Risk with [constraint] | Need [test or source] |
| Option B | Better for [criterion] | Harder because [constraint] | Need [comparison] |

Evidence that helps:

- criteria table
- option comparison
- decision rationale
- technology or method notes
- risk table

## Phase 2 Design Help

For design, architecture, WBS, timeline, and test planning, help the user turn the chosen concept into buildable parts.

Partial example:

`The system can be split into [component 1], [component 2], and [component 3]. The riskiest interface is between [components] because [reason].`

Evidence that helps:

- architecture diagram
- data flow or workflow
- work breakdown structure
- dependency timeline
- test plan outline

## Phase 3 Implement Help

For implementation, help the user identify build proof rather than claiming progress. Ask for observable evidence of working behavior.

Partial example:

`The prototype currently supports [feature]. I verified it by [manual test or automated test]. The next integration risk is [risk].`

Evidence that helps:

- commit summary
- build screenshot
- test output
- integration checklist
- technical documentation note

## Phase 4 Test/Revise Help

For testing and revision, help the user connect acceptance criteria to evidence. Prefer pass/fail thresholds and concrete test observations.

Partial example:

| Criterion | Test Method | Pass Threshold | Current Result | Next Revision |
| --- | --- | --- | --- | --- |
| [criterion] | [test] | [threshold] | [result] | [change] |

Evidence that helps:

- acceptance test log
- bug list
- stakeholder or peer feedback
- performance result
- edge-case checklist

## Phase 5 Operate Help

For operate, delivery, retrospective, and presentation, help the user show that the solution is usable, handed over, and reflected on.

Partial example:

`The solution was delivered to [stakeholder/user] through [channel]. The main lesson learned was [lesson] because [evidence]. The next improvement should be [roadmap item].`

Evidence that helps:

- delivery or deployment note
- demo checklist
- presentation outline
- retrospective
- future roadmap
