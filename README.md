# ResaleIQ — Inventory Recovery Intelligence

ResaleIQ helps resellers upload messy inventory and quickly see what is losing money, why it is stale, and what to fix first.

## Product Positioning
ResaleIQ is **not** generic AI listing software.

ResaleIQ is **Inventory Recovery Intelligence**:
- stale inventory detection
- trapped profit visibility
- recovery prioritization
- action-first intervention guidance

---

## Current Workflow (MVP)
1. Upload inventory (CSV/XLSX-like text, pasted exports, screenshots/photos intake entry)
2. Confirm detected fields
3. Review recovery actions
4. Fix high-priority listings

---

## Phased Execution Roadmap

### Phase 1 — Trust + Core Functionality (Now)
**Goal:** Operational trust through reliability and clarity.

#### In scope now
- resilient upload handling for messy CSV/text inputs
- incremental XLSX support hardening
- fuzzy field mapping with editable confirmation
- duplicate/blank-row tolerance
- non-blocking recovery-first messaging
- clear action cards and fix-first prioritization
- operational copy (no enterprise/AI jargon)

#### Required outcomes
- uploads should not crash on malformed input
- users should understand value within minutes
- recommendations should feel believable and specific
- users should know exactly what to fix first

#### Phase 1 validation targets
- upload completion rate in internal testing
- % of scans producing actionable cards
- number of “confusing mapping” events
- trust signal from testers (“would I act on this?”)

---

### Phase 2 — Behavior Validation
**Goal:** Verify that users repeatedly use and trust recovery actions.

#### In scope after Phase 1 stability
- test with real reseller exports (eBay, mixed spreadsheets)
- measure abandoned uploads vs completed scans
- measure recovery-card engagement
- track repeat scans per tester
- collect structured feedback from 2–5 trusted sellers

#### Validation questions
- do users understand outputs quickly?
- do recommendations change behavior?
- do users emotionally recognize trapped inventory risk?

---

### Phase 3 — Operational Intelligence
**Goal:** Improve recommendation credibility and explanation quality.

#### Future scope (only after Phase 1+2)
- improved XLSX extraction quality
- OCR-assisted field extraction from screenshots/photos
- category-aware recommendation logic
- pricing confidence bands
- richer “why this recommendation” explanations

---

### Phase 4 — Scale + Platform Expansion (Later)
- marketplace APIs
- deeper automation
- longitudinal recovery history and intelligence layers
- advanced integrations

> Not in current MVP scope.

---

## Mocked vs Operational (Current State)

### Operational now
- auth redirect and protected routes
- upload intake (file + text entry)
- tolerant parsing for delimited input
- fuzzy field mapping + human confirmation
- prioritized recovery cards
- core stale/profit/health scoring outputs

### Partial / mocked now
- real XLSX binary parsing depth
- OCR/image extraction intelligence
- advanced comp-based pricing recommendations
- marketplace API-grounded visibility signals
- persistent production-grade scan history pipeline

---

## Files / Components Needing Ongoing Updates (Phase 1)
- `app/inventory/page.tsx`
  - upload reliability, mapping UX, action clarity
- `lib/deadListing.ts`
  - recommendation specificity and explanation quality
- `lib/sampleData.ts`
  - realistic internal test datasets (healthy/stale/duplicates/malformed)
- `app/login/page.tsx`, `middleware.ts`
  - auth trust and route-gating polish
- `README.md`
  - phase tracking, mocked vs operational status

---

## Highest-Risk Operational Gaps
1. **XLSX reliability depth** (current parsing path is still limited)
2. **Recommendation trust quality** (some outputs may still feel generic)
3. **No structured behavioral telemetry yet**
4. **No formalized malformed-file regression suite**
5. **Image/screenshot intake is UX-level, not OCR intelligence yet**

---

## Recommended Next Implementation Order
1. Harden upload parser with malformed-file guardrails and blank/duplicate filtering
2. Improve mapping confirmation UX + missing-field fallbacks
3. Upgrade recommendation wording to include concrete reason + financial implication
4. Add internal scenario datasets and regression checks
5. Add minimal tester event instrumentation for Phase 2 decisions

---

## Suggested Internal QA Checklist (Phase 1)
- Upload a malformed CSV (extra delimiters, blank lines, missing headers)
- Upload mixed-format reseller exports with ambiguous column names
- Paste raw inventory text and confirm parsing doesn’t crash
- Confirm mapping step remains editable and understandable
- Verify no hard-fail language is shown
- Verify top actions are visible immediately after confirmation
- Verify protected route redirects for unauthenticated sessions
- Verify key routes build and render successfully

---

## Suggested Tester Workflow (Phase 2)
1. Login
2. Upload real inventory export
3. Confirm detected fields
4. Review top 3 recovery actions
5. Mark whether each recommendation is believable/actionable
6. Report confusion points and missing context
7. Repeat with second export format

Collect:
- completion time
- confusion moments
- trust score per recommendation
- whether they would actually take the action

---

## Tech Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase-auth style session flow

---

## Core Rule
Do not add complexity unless it improves:
- operational trust
- actionability
- reseller decision quality
