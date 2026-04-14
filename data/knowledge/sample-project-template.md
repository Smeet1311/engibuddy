# Sample Project: "ReachAccess" Accessibility Tech Assistant

This example walks through a real student project using the Hybrid framework, showing what artifacts and deliverables look like at each phase.

---

## PHASE 1: EMPATHIZE - Problem Definition

**Project Duration:** 12 weeks (semester)
**Team Size:** 4 students
**Technology Stack:** React, Node.js, SQLite, Web APIs

### Problem Statement

**Title:** ReachAccess - Accessibility Helper for Website Developers

**The Problem:**
Web developers often struggle to build accessible websites (WCAG 2.1 compliant). They lack real-time feedback on accessibility issues, must learn complex standards, and struggle to test with actual assistive technologies. This results in inaccessible websites that exclude people with disabilities.

**Who Has This Problem?**
- Small web dev agencies (no dedicated accessibility expert)
- Individual freelance developers
- Student developers learning web design
- Non-profits with limited budgets
- ~millions of websites with accessibility barriers

**Impact:**
- 1.3 billion people with disabilities can't access poorly-designed websites
- Legal liability (ADA lawsuits increasing)
- Lost users and revenue
- Moral obligation to be inclusive

**Our Solution:**
Build a browser extension that (1) scans webpage for common accessibility violations, (2) explains issues in plain language, (3) suggests fixes with code examples, (4) guides user through WCAG standards.

**Success Criteria:**
1. Detects 80%+ of common WCAG issues (alt text, color contrast, heading structure, form labels, keyboard navigation)
2. Runs in real-time without slowing page load
3. Explanations understandable to developers without accessibility background
4. Provides actionable fixes (code snippets, resources)
5. Works on modern browsers (Chrome, Firefox, Safari, Edge)

**Constraints:**
- **Time:** 12 week semester (minus exams = ~10 weeks dev)
- **Budget:** $0 (free open-source)
- **Team Skills:** 3 frontend React experts, 1 backend Node.js person
- **Resources:** No accessibility experts on team
- **Deadlines:** Weekly demos, final delivery week 12

### Research Summary

**User Interviews:**  
We interviewed 5 web developers (freelancers and small agencies):
- 4/5 said they "probably" have accessibility issues but don't know how to find them
- 3/5 tried accessibility tools once but found them confusing
- All 5 cited "not having an accessibility expert" as biggest blocker
- All wanted real-time feedback, not post-deployment reports

**Accessibility Standards Research:**
- WCAG 2.1 has 78 criteria (overwhelming—no developer builds against all)
- 80% of accessibility issues are from top 10 problems (focus, alt text, contrast, labels, form handling)
- Automated tools can catch ~30% of issues; remaining require human judgment

**Competitive Analysis:**
- **Axe DevTools:** $249/yr, browser extension, good but technical
- **Wave:** Free, but separate tool, not real-time
- **JAWS (screenreader):** Expensive, not for devs
- **Gap:** No affordable, real-time, developer-friendly tool

### Stakeholder Analysis
| Stakeholder | Interest | Why Matters |
|---|---|---|
| Web developers | Make accessible sites without learning curve | Primary users |
| People with disabilities | Accessible web | Beneficiaries |
| Web standards orgs (W3C) | Adoption of standards | Validation/credibility |
| Browsers | Less non-accessible content | Partners |

---

## PHASE 2: CONCEIVE - Solution Exploration

### Solution Approaches Evaluated

**Option A: Browser Extension (Selected)**
- Pros: Real-time feedback, no server cost, easy distribution
- Cons: Limited access to page internals, user must install

**Option B: Online Service (Upload HTML)**
- Pros: No installation, can be more thorough
- Cons: Privacy concerns, slower, extra server cost

**Option C: Build Into Existing IDE**
- Pros: Developer workflow integration
- Cons: IDE-specific, harder to build (plugin API complexity)

**Decision:** Option A (Extension) because real-time feedback is most valuable and barrier to entry is acceptable for target users.

### Technology Choices

| Decision | Options Evaluated | Selected | Reason |
|---|---|---|---|
| Frontend | React, Vue, Vanilla | React | Team expertise, component reuse |
| Backend | Node.js, Python, Python | Node.js | Team has 1 expert, webhooks for async |
| Storage | SQLite, PostgreSQL | SQLite | Local deployment, zero DevOps |
| Language | TypeScript, JavaScript | TypeScript | Type safety, large codebase prevents bugs |
| Testing | Jest, Mocha | Jest | React ecosystem standard |
| CI/CD | GitHub Actions | GitHub Actions | Free, built-in, team knows it |

---

## PHASE 3: DESIGN - Architecture & Planning

### Work Breakdown Structure

**Phase 1A: Setup (Week 1 - 2 days)**
- Initialize extension project
- Set up React component structure
- Configure webpack/build pipeline
- Team: All

**Phase 1B: Core Accessibility Scanning Engine (Week 1-2, 7 days)**
- Research, design, and validate accessibility checks
- Implement DOM accessibility analyzer
- Detect missing alt text, color contrast, labels
- Test against sample pages
- Team: Frontend Lead, Backend Support

**Phase 1C: Test Framework (Week 1-2, 3 days)**
- Set up Jest testing
- Create accessibility assertion library
- Build test fixtures (HTML samples)
- Team: QA person

**Phase 2: Backend API & Dashboard (Week 3-4, 10 days)**
- Design API endpoints (run scan, get results, save feedback)
- Build Node.js backend
- Create simple dashboard (show scan results)
- Set up SQLite schema
- Team: Backend person (lead), Frontend support

**Phase 3: Extension UI (Week 5-6, 10 days)**
- Design popup interface (issues list, explanations)
- Build React components (button, sidebar, issue detail)
- Integrate scanning engine
- Implement real-time updates
- Team: Frontend team

**Phase 4: AI-Powered Explanations (Week 7-8, 10 days)**
- Design explanation generation (rules-based, then LLM)
- Implement plain-language issue descriptions
- Add code fix suggestions
- Connect to external resources
- Team: Backend person, 1 Frontend person

**Phase 5: Testing & Polish (Week 9-10, 10 days)**
- Comprehensive testing (contrast, labels, keyboard nav)
- Cross-browser testing (Chrome, Firefox, Safari)
- User testing with real developers
- Fix bugs and UX improvements
- Team: QA lead + all hands

**Phase 6: Documentation & Launch (Week 11-12, 5 days)**
- Write user guide
- Create demo video
- Prepare final presentation
- Submit to Chrome Web Store
- Team: All (including doc writing)

**Critical Path:** Setup → Scanning Engine → Backend API + UI (parallel) → Explanations → Testing → Launch
**Total Estimate:** ~55 days of work across 12 weeks (average 11 days/week with 4 people = realistic)

### Timeline & Milestones
```
Week 1-2: MVP Scanning Engine (detects alt text, contrast, labels only)
Week 3-4: Backend + Dashboard (developers can see results web)
Week 5-6: Extension UI (real-time feedback in browser)
Week 7-8: AI Explanations (plain-language descriptions of issues)
Week 9-10: Testing (comprehensive validation, cross-browser)
Week 11-12: Polish, docs, launch
```

### Risk Analysis
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AI API costs (OpenAI) | Medium | High | Build rules-based fallback, budget management |
| Color contrast detection complex | High | Medium | Research libraries, allocate time |
| Cross-browser extension API differences | Medium | Medium | Test early on all browsers |
| Team availability (midterms) | Medium | High | Buffer time, task prioritization |

---

## PHASE 4: IMPLEMENT - Execution

### Weekly Progress Tracking

**Week 1: Setup & Research** ✅
- Extension scaffold: 2 days
- Accessibility research: 3 days
- Jest test setup: 1 day
- **Blockers:** None

**Week 2: Scanning Engine MVP** ✅
- Alt text detection: 2 days
- Color contrast analyzer: 3 days (harder than expected)
- Form label detection: 2 days
- **Blockers:** Color contrast math complicated—brought in accessibility expert
- **Adaptation:** Scope reduced slightly (form labels more complex than planned)

**Week 3-4: Backend & Dashboard** ✅
- API design and validation: 2 days
- Node.js endpoints: 4 days
- SQLite schema: 1 day
- Dashboard UI: 4 days
- **Blockers:** CORS issues between extension and API (2 day delay)
- **Resolution:** Added backend proxy layer

**Week 5-6: Extension UI** ✅
- Extension popup component: 3 days
- Issue list & filtering: 2 days
- Explanation display: 2 days
- Integration with scanning engine: 2 days
- **Blockers:** Extension API messaging complexity (1 day)
- **Resolution:** Pulled in extension expert from CS dept

**Week 7-8: Explanations & Polish** ✅
- Rules-based explanation engine: 3 days
- OpenAI integration (markdown explanations): 3 days
- Code fix suggestions: 2 days
- **Blockers:** Prompt engineering took longer than planned (1 day over)
- **Resolution:** Team worked weekend to catch up

**Week 9-10: Testing** ✅
- Comprehensive test suite: 5 days
- Cross-browser testing: 3 days
- User testing with 5 developers: 2 days
- Bug fixes from testing: 3 days
- **Blockers:** Safari extension APIs different (discovered late) = 2 day panic
- **Resolution:** Workarounds found, shipping without Safari in MVP

**Week 11-12: Documentation & Launch** ✅
- User guide & screenshots: 3 days
- Demo video: 2 days
- Final presentation: 1 day
- Chrome Web Store submission: 1 day

### Code Quality Indicators
- Test coverage: 78% (code), 60% (integration tests)
- Code review: All PRs reviewed before merge
- Accessibility (our own tool): 95+ accessibility score
- Performance: Page scan <500ms, no slowdown on typical sites

---

## PHASE 5: TEST & REVISE - Validation

### Acceptance Criteria Testing

| Criterion | Test Method | Result | Status |
|---|---|---|---|
| Detects 80%+ of common WCAG issues | Test against 10 accessibility samples | 82% (33/40 issues found) | ✅ PASS |
| Real-time without slowing page | Load time benchmark on 5 sites | +140ms avg, acceptable | ✅ PASS |
| Explanations understandable | User testing with 5 developers (non-a11y) | 4.2/5 clarity rating | ✅ PASS |
| Actionable fixes provided | User testing feedback | Developers could apply fixes | ✅ PASS |
| Works on modern browsers | Cross-browser test matrix | Chrome ✅, Firefox ✅, Safari ⚠️ | 🟡 PARTIAL |

### Issue Log (Sample)

| Priority | Issue | Status |
|---|---|---|
| Critical | Color contrast detection on gradients fails | Fixed (improved algorithm) |
| Critical | ARIA attribute detection incomplete | Fixed (added more patterns) |
| High | Firefox extension manifest v2 vs v3 | Patched (manifest v3 support) |
| High | Performance on heavy pages | Optimized (lazy evaluation) |
| Medium | Mobile device extension support? | Deferred to v2 (not in scope) |
| Medium | Keyboard navigation of popup | Fixed (added focus management) |
| Low | Missing Japanese translation | Deferred to v2 |

### User Feedback from Testing
- "Finally! Something that explains what's wrong without jargon"
- "Code examples are super helpful"
- "Wish it worked on my phone too"
- "Can't believe some sites fail these basic checks"

---

## PHASE 6: OPERATE & REFLECT

### Deployment & Launch
- **Chrome Web Store:** Approved week 12, published
- **Download Count (first 2 weeks):** 850 downloads
- **User Rating:** 4.6/5 stars (18 reviews)
- **Feedback:** Users love the explanations, want mobile support

### Lessons Learned - What Went Well
1. **User-centered research paid off** - Early interviews revealed "real-time feedback" was most desired, which became our differentiator
2. **Team collaboration** - Daily standups prevented big surprises, though integration issues caught early
3. **Scope discipline** - Cutting Safari (for MVP) kept timeline realistic without massive quality hits
4. **Testing mindset** - Building tests as we coded meant late-stage testing found edge cases, not core bugs

### Lessons Learned - What Was Hard
1. **Accessibility is nuanced** - Automated detection of accessibility issues is harder than expected (need heuristics, ML helps)
2. **Cross-browser extension development** - Different APIs and approval processes are real pain points
3. **AI integration uncertainty** - Cost and reliability of LLM explanations was unpredictable
4. **Underestimated prompt engineering** - Getting explanations right took more iteration than expected

### What We'd Do Differently
1. **Allocate more time to accessibility research** - Week 7-8 complexity could have been predicted
2. **Multi-browser strategy earlier** - Waiting until testing to discover Safari gaps was risky
3. **User testing earlier** - Prototype interviews in week 3 instead of week 9 would have caught UX issues
4. **Prompt engineering sprint** - Dedicate 1-week focused sprint to get explanation quality right
5. **More contingency buffer** - 10% over timeline would have prevented weekend work

### Supporting Portfolio Evidence
- **GitHub repository:** [github.com/students/reach-access](https://github.com)
  - 247 commits, 78% test coverage, clean history
  - PRs showing code review discipline
- **Demo video:** 2:30 walkthrough showing core functionality
- **User testimonials:** Screenshots of 5-star reviews
- **Presentation slides:** 12-slide deck with problem, solution, evidence
- **Retrospective document:** This summary showing growth as engineers

### Future Roadmap
- **v1.1:** Safari support, mobile WebKit
- **v2.0:** AI-powered fix suggestions (not just explanations)
- **v3.0:** Custom rulesets for team standards
- **v4.0:** IDE integrations (VSCode, GitHub Codespaces)

### Growth & Skills Developed
- **Technical:** Browser extension APIs, async JS, real-time data binding, API design
- **Problem-Solving:** Systematic debugging, trade-off analysis, scope management
- **Teamwork:** Daily coordination, code review discipline, async communication
- **Engineering Discipline:** Testing, deployment, user research, iteration

---

## Key Takeaways from This Project

**This project exemplifies good PBL because:**
1. ✅ Real user problem (not contrived exercise)
2. ✅ Genuine constraints (time, skills, budget)
3. ✅ Iteration and learning (problems discovered, adapted)
4. ✅ User validation (real developers tested and liked it)
5. ✅ Systems thinking (integrated multiple components)
6. ✅ Reflection on learning (clear lessons and growth)
7. ✅ Professional outcome (deployed, users downloading)

**Coaching opportunities EngiBuddy would provide:**
- Week 1-2: "Have you talked to actual developers about this?"
- Week 3-4: "Your timeline slipped because of the CORS issue. How will you catch these earlier?"
- Week 7-8: "Prompts aren't working yet. What's your debugging approach?"
- Week 9-10: "You discovered Safari doesn't work. What's your decision: delay launch or ship without it? What's the trade-off?"
- Week 11-12: "What surprised you most? What changed how you think about engineering?"
