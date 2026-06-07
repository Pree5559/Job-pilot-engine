# Resume Shapeshifter — Phase-Wise Implementation Plan

> **Document Version:** 1.0  
> **Last Updated:** 2026-05-23  
> **Based on:** `docs/architecture.md`  
> **Total Estimated Effort:** 8 weeks (part-time)

---

## Table of Contents

1. [Overview & Phase Dependency Map](#1-overview--phase-dependency-map)
2. [Phase 1: Static Prototype (Weeks 1–2)](#2-phase-1-static-prototype-weeks-12)
3. [Phase 2: LLM Integration (Weeks 3–5)](#3-phase-2-llm-integration-weeks-35)
4. [Phase 3: PDF Export (Weeks 5–6)](#4-phase-3-pdf-export-weeks-56)
5. [Phase 4: Validation & Guardrails (Weeks 6–7)](#5-phase-4-validation--guardrails-weeks-67)
6. [Phase 5: Polish & Demo Readiness (Weeks 7–8)](#6-phase-5-polish--demo-readiness-weeks-78)
7. [Scoring Algorithm Reference](#7-scoring-algorithm-reference)
8. [Risk Mitigation Guide](#8-risk-mitigation-guide)

---

## 1. Overview & Phase Dependency Map

### Dependency Graph

```
Phase 1 (Static Prototype) ──────────────────────────────┐
        │                                                 │
        ▼                                                 │
Phase 2 (LLM Integration) ───────────────────────────────┤
        │                                                 │
        ├─────────────────────────────────────────────────┤
        ▼                                                 │
Phase 3 (PDF Export) ────────────────────────────────────┤
        │                                                 │
        ▼                                                 │
Phase 4 (Validation & Guardrails) ◄──────────────────────┘
        │
        ▼
Phase 5 (Polish & Demo Readiness) ───→ PORTFOLIO READY
```

### Phase Summary

| Phase | Name                  | Duration | Dependencies | Key Deliverable                        |
|-------|-----------------------|----------|--------------|----------------------------------------|
| 1     | Static Prototype      | 2 weeks  | None         | Navigable UI with mock data            |
| 2     | LLM Integration       | 3 weeks  | Phase 1      | End-to-end LLM processing              |
| 3     | PDF Export            | 1 week   | Phase 2†     | Downloadable tailored + comparison PDF |
| 4     | Validation & Guardrails | 1.5 weeks | Phase 2    | Truthfulness-checked output            |
| 5     | Polish & Demo         | 1.5 weeks| Phases 1–4   | Portfolio-ready demo                   |

† Phase 2 is a soft prerequisite (needs real tailored data for PDF content)

### Notes

- Phases 3 and 4 can run partially in parallel (PDF templates drawing from Phase 2 data, while guardrails polish the data quality).
- Phase 5 should not start until Phases 1–4 are complete and stable.
- Each phase includes a validation step before marking it done.

---

## 2. Phase 1: Static Prototype (Weeks 1–2)

### 2.1 Goal

Build the complete frontend UI with hardcoded mock data. All screens should be navigable, all components rendered, and the visual layout approved—before writing any LLM or backend logic.

### 2.2 Prerequisites

- Node.js 18+ installed
- npm/pnpm/yarn configured
- OpenAI API key (not used yet, but `.env.local` should be set up)
- Basic familiarity with Next.js App Router and Tailwind CSS

### 2.3 Step-by-Step Tasks

#### Week 1: Project Scaffolding & Layout

- [ ] **1.1 Initialize Next.js project**
  - Command: `npx create-next-app@latest resume-shapeshifter --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
  - Verify: `npm run dev` starts without errors

- [ ] **1.2 Install core dependencies**
  - `npm install zod zustand`
  - `npm install -D @types/node`
  - Verify: `package.json` includes the dependencies

- [ ] **1.3 Install and configure Shadcn UI**
  - `npx shadcn@latest init`
  - Add base primitives as needed: `npx shadcn@latest add button card input textarea badge separator tabs`
  - Verify: a Shadcn button renders correctly

- [ ] **1.4 Create directory structure**
  - Create folders: `src/app/analysis`, `src/app/export`, `src/api/parse-resume`, `src/api/parse-jd`, `src/api/score`, `src/api/tailor`, `src/api/gaps`, `src/api/export-pdf`, `src/components/ui`, `src/lib`, `src/hooks`, `src/store`, `prompts`, `__tests__/services`, `__tests__/prompts`, `__tests__/components`
  - Verify: directory tree matches `architecture.md` section 4

- [ ] **1.5 Set up Zustand store**
  - File: `src/store/tailoring-store.ts`
  - Define store shape with: `resume`, `jobDescription`, `originalScore`, `tailoredScore`, `tailoredResume`, `gaps`, `status`, `errors`
  - No API calls yet—store returns hardcoded mock data via placeholder actions
  - Verify: store compiles and provides typed accessors

- [ ] **1.6 Define Zod schemas (stub)**
  - File: `src/lib/schemas.ts`
  - Implement all 6 schemas from architecture.md section 5
  - Export TypeScript types using `z.infer<typeof Schema>`
  - File: `src/lib/types.ts` – re-export all inferred types
  - Verify: schemas compile and can validate sample JSON

- [ ] **1.7 Build root layout and navigation**
  - File: `src/app/layout.tsx` – Header with app name, navigation links
  - Simple nav between `/`, `/analysis`, `/export`
  - Verify: pages load and navigation works

#### Week 2: Components & Pages

- [ ] **1.8 Build `ResumeInput` component**
  - File: `src/components/ResumeInput.tsx`
  - Textarea for pasting resume text
  - Styled container with label and placeholder
  - Props: `onResumeChange: (text: string) => void`
  - Visual: large textarea with character count, clear button

- [ ] **1.9 Build `JDInput` component**
  - File: `src/components/JDInput.tsx`
  - Same structure as ResumeInput but for JD text
  - Props: `onJDChange: (text: string) => void`

- [ ] **1.10 Build landing page (`/`)**
  - File: `src/app/page.tsx`
  - Two-column or stacked layout: ResumeInput (left) + JDInput (right)
  - "Analyze" button (disabled until both fields have content)
  - On click: navigate to `/analysis`
  - For Phase 1, the button just navigates; URL carries no state (store uses mock data)

- [ ] **1.11 Create mock data file**
  - File: `src/lib/mock-data.ts`
  - Export complete mock `ResumeProfile`, `JobDescriptionProfile`, `MatchScore` (pre & post), `TailoredResume`, `GapAnalysis`
  - Design samples that look realistic: a software engineer resume + a real-looking JD
  - Mock data will be used in store until Phase 2

- [ ] **1.12 Build `ScoreCard` component**
  - File: `src/components/ScoreCard.tsx`
  - Large centered score number (0–100)
  - Before/after: two score cards side by side (pre only for Phase 1, pre+post for  later)
  - Colored ring or bar indicator (green > 80, yellow > 50, red < 50)
  - Props: `score: number`, `label: string`, `color?: string`

- [ ] **1.13 Build `ScoreBreakdown` component**
  - File: `src/components/ScoreBreakdown.tsx`
  - List of sub-scores (skill, keyword, seniority, responsibility) with horizontal bars
  - Props: `subscores: Record<string, number>`

- [ ] **1.14 Build `JDSummary` component**
  - File: `src/components/JDSummary.tsx`
  - Display extracted JD fields in a compact card
  - Sections: job title, company, required skills (badges), responsibilities (short list)
  - Props: `jd: JobDescriptionProfile`

- [ ] **1.15 Build `GapAnalysis` component**
  - File: `src/components/GapAnalysis.tsx`
  - Table/list of gaps with columns: name, importance badge (high/med/low), evidence, suggested action
  - Props: `gaps: ResumeGap[]`
  - Visual: importance badge colored (red=high, yellow=medium, gray=low)

- [ ] **1.16 Build `BulletRewriter` component**
  - File: `src/components/BulletRewriter.tsx`
  - Grouped by experience entry
  - Per-bullet row: original (strikethrough/left) → arrow → tailored (right)
  - Below each row: change reason, keywords addressed badges, confidence label
  - Props: `experience: TailoredExperience[]`
  - Visual: subtle background color for changed rows

- [ ] **1.17 Build `SideBySideDiff` component**
  - File: `src/components/SideBySideDiff.tsx`
  - Two-column layout: left = original resume, right = tailored resume
  - Highlight changed sections
  - Scroll-sync or independent scrolling (use independent for MVP)
  - Props: `original: ResumeProfile`, `tailored: TailoredResume`

- [ ] **1.18 Build `AnalysisDashboard` page (`/analysis`)**
  - File: `src/app/analysis/page.tsx`
  - Tabs or sections: Score → JD Summary → Gaps → Bullet Rewrites → Side-by-Side
  - Reads from Zustand store (which returns mock data in Phase 1)
  - "Generate Tailored Resume" button (in Phase 1, just toggles showing post-tailored data)

- [ ] **1.19 Build `PDFExportButton` component (stub)**
  - File: `src/components/PDFExportButton.tsx`
  - Button that shows "Export PDF (coming in Phase 3)" tooltip
  - Disabled state with `coming soon` styling

- [ ] **1.20 Build `ExportPage` (`/export`)**
  - File: `src/app/export/page.tsx`
  - Summary of the tailoring run
  - Download buttons (disabled, Phase 3)
  - Links back to `/analysis`

- [ ] **1.21 Build `LoadingState` component**
  - File: `src/components/LoadingState.tsx`
  - Multi-step progress indicator: parsing resume → parsing JD → scoring → tailoring → generating PDF
  - Each step shows: pending (gray), in-progress (animated), done (checkmark), error (red X)
  - Props: `stages: Stage[]` where each has `{ id, label, status: "pending"|"loading"|"done"|"error" }`

- [ ] **1.22 Build `ErrorBoundary` component**
  - File: `src/components/ErrorBoundary.tsx`
  - Catches React errors and shows a fallback UI with retry button
  - Props: `children`, `fallback?: ReactNode`

- [ ] **1.23 Wire up routing and navigation flow**
  - `/` → input → click Analyze → `/analysis`
  - `/analysis` → click Export → `/export`
  - Verify full navigation flow works with mock data

### 2.4 Phase 1 Acceptance Criteria

- [ ] All pages render without errors
- [ ] All 6 Zod schemas compile and validate mock JSON
- [ ] Zustand store holds mock data and components read from it
- [ ] Navigation flow: `/` → `/analysis` → `/export` works
- [ ] All major components (`ScoreCard`, `ScoreBreakdown`, `GapAnalysis`, `BulletRewriter`, `SideBySideDiff`, `JDSummary`) render with mock data
- [ ] `LoadingState` shows all 6 stages
- [ ] `ErrorBoundary` catches errors and shows retry UI
- [ ] Responsive layout works on desktop and tablet viewports

### 2.5 Effort Estimate

| Area                | Hours |
|---------------------|-------|
| Scaffolding & config| 3     |
| Schemas & store     | 4     |
| Layout & navigation | 3     |
| Core components     | 12    |
| Pages & routing     | 4     |
| Stub components     | 2     |
| Testing & polish    | 4     |
| **Total**           | **32** (4 days @ 8h/day) |

---

## 3. Phase 2: LLM Integration (Weeks 3–5)

### 3.1 Goal

Replace all mock data with real LLM-powered processing. Every API route calls the OpenAI API through a typed client, validates outputs with Zod, and returns clean data to the frontend.

### 3.2 Prerequisites

- [ ] Phase 1 complete and accepted
- [ ] OpenAI API key in `.env.local` (`OPENAI_API_KEY=sk-...`)
- [ ] API key has access to GPT-4o-mini or GPT-4o

### 3.3 Step-by-Step Tasks

#### Week 3: LLM Client & Prompts

- [x] **2.1 Implement LLM client (Groq)**
  - File: `src/lib/llm-client.ts`
  - Wrapper around Groq SDK (`npm install groq-sdk`)
  - Uses `GROQ_API_KEY` environment variable
  - Primary model: `llama-3.3-70b-versatile` (free tier)
  - Fallback model: `mixtral-8x7b-32768` (if primary fails)
  - Generic function: `async function callLLM<T>(params: { systemPrompt: string; userMessage: string; schema: z.ZodType<T>; model?: string }): Promise<T>`
  - Calls `response_format: { type: "json_object" }` for structured JSON output
  - Retry logic: up to 2 retries on `JSON.parse` failure or Zod validation failure
  - Exponential backoff: 1s → 2s → 4s
  - Auto-fallback to mixtral model if primary model fails
  - Logs: token usage per call (prompt_tokens, completion_tokens, total)
  - Error handling: rate limit (429), validation errors, empty responses

- [ ] **2.2 Write JD Extraction Prompt**
  - File: `prompts/jd-extraction.ts`
  - Export `JD_EXTRACTION_SYSTEM_PROMPT` and `buildJDExtractionUserPrompt(jdText: string): string`
  - System prompt: "You are a job description parser. Extract structured data from the following job description. Return valid JSON matching the schema. Do not infer information not present in the text."
  - Include the `JobDescriptionProfile` schema definition in the prompt
  - Test: paste a real job listing, verify extraction quality

- [ ] **2.3 Write Resume Parser Prompt**
  - File: `prompts/resume-parser.ts`
  - Export `RESUME_PARSER_SYSTEM_PROMPT` and `buildResumeParserUserPrompt(resumeText: string): string`
  - System prompt: "You are a resume parser. Convert the following resume text into structured JSON. Preserve exact bullet content. Identify logical sections (experience, education, skills, etc.). Do not modify or rewrite content."
  - Include the `ResumeProfile` schema definition
  - Test: paste a real resume, verify section extraction accuracy

- [ ] **2.4 Write Match Scoring Prompt**
  - File: `prompts/match-scoring.ts`
  - Export `MATCH_SCORING_SYSTEM_PROMPT` and `buildMatchScoringUserPrompt(resume: ResumeProfile, jd: JobDescriptionProfile): string`
  - System prompt: "You are a resume-job match scorer. Compare the resume against the job description and generate a match score (0-100) for each category. Be conservative—do not inflate scores. Base all scoring on evidence from both documents."
  - Within the user prompt, include both the parsed resume JSON and JD JSON
  - Request the `MatchScore` output shape
  - Note: This prompt is used for qualitative explanation; the algorithmic score from `scoring.ts` is the primary numeric score

- [ ] **2.5 Write Bullet Rewriter Prompt**
  - File: `prompts/bullet-rewriter.ts`
  - Export `BULLET_REWRITER_SYSTEM_PROMPT` and `buildBulletRewriterUserPrompt(originalBullets: string[], context: { resume: ResumeProfile; jd: JobDescriptionProfile }): string`
  - System prompt: "You are a resume bullet rewriter. Rewrite each bullet to better align with the job description while preserving the user's actual meaning and experience. Do not add unsupported claims. For each rewrite: explain the change, list keywords addressed, assign confidence (high/medium/low), and flag if the rewrite risks overstating experience."
  - Include strict instructions about truthfulness
  - Request the `TailoredBullet[]` output shape

- [ ] **2.6 Write Gap Analysis Prompt**
  - File: `prompts/gap-analysis.ts`
  - Export `GAP_ANALYSIS_SYSTEM_PROMPT` and `buildGapAnalysisUserPrompt(resume: ResumeProfile, jd: JobDescriptionProfile, score: MatchScore): string`
  - System prompt: "You are a gap analysis engine. Identify skills, tools, and requirements from the job description that are missing or weakly represented in the resume. Assign importance based on JD emphasis. Provide actionable suggestions."
  - Request the `GapAnalysis` output shape

#### Week 4: Service Layer & API Routes

- [ ] **2.7 Implement Resume Parser service**
  - File: `src/lib/resume-parser.ts`
  - Function: `async function parseResume(text: string): Promise<ResumeProfile>`
  - If text is empty or < 50 chars, throw `ParseError("Resume text too short")`
  - Call LLM with resume parser prompt
  - Validate against `ResumeProfileSchema`; retry once on failure
  - Return parsed profile

- [ ] **2.8 Implement JD Parser service**
  - File: `src/lib/jd-parser.ts`
  - Function: `async function parseJD(text: string): Promise<JobDescriptionProfile>`
  - Same pattern as resume parser
  - Validate against `JobDescriptionProfileSchema`; retry once on failure

- [ ] **2.9 Implement Scoring service**
  - File: `src/lib/scoring.ts`
  - Function: `async function computeScore(resume: ResumeProfile, jd: JobDescriptionProfile): Promise<MatchScore>`
  - Algorithmic scoring:
    1. `skillCoverageScore`: Jaccard similarity between resume skills and JD required skills (weighted 2× for required vs preferred)
    2. `responsibilityAlignmentScore`: Count JD responsibilities reflected in resume bullets (approximate via keyword overlap)
    3. `keywordScore`: TF-IDF-style keyword overlap between resume text and JD keywords
    4. `seniorityScore`: Match seniority level signals (e.g., "Senior" ↔ "senior")
    5. Compute `overallScore` using weighted formula (see Section 7)
  - Also call LLM scoring prompt for qualitative explanation
  - Merge: use algorithmic scores for numeric values, LLM output for `explanation` string and `criticalMissingRequirements`
  - Validate full output against `MatchScoreSchema`

- [ ] **2.10 Implement Tailoring service**
  - File: `src/lib/tailor.ts`
  - Function: `async function tailorResume(resume: ResumeProfile, jd: JobDescriptionProfile, score: MatchScore): Promise<TailoredResume>`
  - For each experience entry, group bullets and call bullet rewriter prompt
  - Rewrite summary if applicable (call LLM with summary-specific sub-prompt)
  - Reorder skills: JD required skills first, then preferred, then rest
  - Validate against `TailoredResumeSchema`
  - Return structured tailored resume

- [ ] **2.11 Implement Gap Analysis service**
  - File: `src/lib/gap-analysis.ts`
  - Function: `async function analyzeGaps(resume: ResumeProfile, jd: JobDescriptionProfile, score: MatchScore): Promise<GapAnalysis>`
  - Call gap analysis prompt with resume, JD, and score
  - Validate against `GapAnalysisSchema`
  - Additional post-processing: cross-check each gap's `canSafelyAdd` with resume evidence
  - Return structured gap analysis

- [ ] **2.12 Implement API route: `POST /api/parse-resume`**
  - File: `src/app/api/parse-resume/route.ts`
  - Accept: `{ text: string }`
  - Validate input with Zod (`z.object({ text: z.string().min(50) })`)
  - Call `parseResume()` service
  - Return `ResumeProfile`
  - Handle errors: empty text → 400, LLM failure → 502, validation failure → 400

- [ ] **2.13 Implement API route: `POST /api/parse-jd`**
  - File: `src/app/api/parse-jd/route.ts`
  - Same pattern as parse-resume

- [ ] **2.14 Implement API route: `POST /api/score`**
  - File: `src/app/api/score/route.ts`
  - Accept: `{ resume: ResumeProfile, jd: JobDescriptionProfile }`
  - Validate both inputs against their Zod schemas
  - Call `computeScore()` service
  - Return `MatchScore`

- [ ] **2.15 Implement API route: `POST /api/tailor`**
  - File: `src/app/api/tailor/route.ts`
  - Accept: `{ resume: ResumeProfile, jd: JobDescriptionProfile, score: MatchScore }`
  - Call `tailorResume()` service
  - Return `TailoredResume`

- [ ] **2.16 Implement API route: `POST /api/gaps`**
  - File: `src/app/api/gaps/route.ts`
  - Accept: `{ resume: ResumeProfile, jd: JobDescriptionProfile, score: MatchScore }`
  - Call `analyzeGaps()` service
  - Return `GapAnalysis`

#### Week 5: Frontend Integration

- [ ] **2.17 Update Zustand store to make real API calls**
  - File: `src/store/tailoring-store.ts`
  - Add async actions: `parseResume(text)`, `parseJD(text)`, `computeScore()`, `generateTailored()`, `analyzeGaps()`
  - Each action: set loading state → call API → update store → handle errors
  - Store tracks which steps are complete for `LoadingState` component
  - On error, store the error message and set step to error state

- [ ] **2.18 Add `LoadingState` to landing page**
  - Show `LoadingState` overlay when user clicks "Analyze"
  - Steps: parsing resume → parsing JD → scoring → (optional) tailoring → gaps
  - Each step updates in real-time as API calls complete
  - On error in any step, show inline error with retry button for that step

- [ ] **2.19 Connect `ResumeInput` to store**
  - On paste/upload, call `parseResume()` after debounce (300ms) or on button click
  - Show parsed resume preview (contact, skills, experience count) after parsing

- [ ] **2.20 Connect `JDInput` to store**
  - Same pattern as resume input
  - Show extracted JD preview after parsing

- [ ] **2.21 Connect `AnalysisDashboard` to real data**
  - All components now read from store (populated by API calls)
  - Remove all mock data references from store (keep `mock-data.ts` for testing)
  - Verify end-to-end flow: paste → analyze → score + gaps → tailor → post-tailor score

- [ ] **2.22 Add error handling to all API calls**
  - Each call wrapped in try/catch
  - Error messages displayed in UI per step
  - Retry button restarts the failed step
  - Full failure: show "Unable to process. Please check your API key and try again."

- [ ] **2.23 Write integration tests for API routes**
  - File: `__tests__/services/scoring.test.ts`
  - File: `__tests__/services/tailor.test.ts`
  - Test with mock LLM responses (fixtures in `__tests__/fixtures/`)
  - Verify Zod validation catches malformed LLM output
  - Verify error handling returns proper error codes

### 3.4 Phase 2 Acceptance Criteria

- [ ] All 5 prompt files written and tested with real JD/resume text
- [ ] All 6 API routes respond correctly with real data (tested via curl or Postman)
- [ ] Full end-to-end flow works: paste resume + JD → analyze → see score, gaps, tailored resume in UI
- [ ] Loading state shows per-step progress
- [ ] Errors display correctly with retry capability
- [ ] Zod validation catches and reports malformed LLM outputs
- [ ] Token usage is logged for cost tracking

### 3.5 Effort Estimate

| Area                | Hours |
|---------------------|-------|
| LLM client          | 4     |
| Prompt writing & testing | 12    |
| Service layer       | 12    |
| API routes          | 6     |
| Store refactor      | 4     |
| Frontend integration| 6     |
| Testing & debugging | 8     |
| **Total**           | **52** (6.5 days) |

---

## 4. Phase 3: PDF Export (Weeks 5–6)

### 4.1 Goal

Generate two downloadable PDFs: a standalone tailored resume and a side-by-side comparison PDF with score visualization, highlighted changes, and gap analysis.

### 4.2 Prerequisites

- [ ] Phase 2 complete (need real `TailoredResume`, `MatchScore`, `GapAnalysis` data)
- [ ] React-PDF or Playwright chosen based on prototyping

### 4.3 Step-by-Step Tasks

#### Start in parallel with Phase 2 final week

- [ ] **3.1 PDF library evaluation (1 day, can run alongside Phase 2 end)**
  - Prototype: Render a simple text page with `@react-pdf/renderer`
  - If issues (e.g., font support, layout constraints), switch to Playwright approach:
    - Install Playwright: `npm install playwright` + `npx playwright install chromium`
    - Create an HTML template for the side-by-side view
  - Decision record: add comment in `src/lib/pdf-generator.ts` noting which approach was chosen

#### If React-PDF chosen:

- [ ] **3.2 Create tailored resume PDF template**
  - File: `src/lib/pdf-templates/tailored-resume.tsx`
  - React-PDF document component with sections:
    - `Document`, `Page`, `StyleSheet`
    - Contact header (name, email, phone, LinkedIn)
    - Summary section
    - Skills section (comma-separated, grouped by relevance to JD)
    - Experience section (per company, with tailored bullets)
    - Education section
    - Certifications section
  - Fonts: Helvetica for body, Helvetica-Bold for headings
  - Colors: dark gray (#333) for body, blue (#2563EB) for headings
  - ATS-friendly: single column, no tables, clean hierarchy

- [ ] **3.3 Create comparison PDF template**
  - File: `src/lib/pdf-templates/comparison.tsx`
  - Page 1 – Header:
    - Job title and company
    - Date of generation
    - Score comparison: two horizontal bars (original gray, tailored blue) with labels and numbers
  - Page 1 – JD Summary:
    - Required skills (badge-style list)
    - Responsibilities (compact list)
  - Page 2+ – Two-column comparison:
    - Left column: "Original Resume" with original bullets
    - Right column: "Tailored Resume" with tailored bullets
    - Changed bullets: light green background for improved, light yellow for rewrites
    - Unchanged bullets: no background
  - Last page – Gap Analysis:
    - Table: gap name | importance | suggested action
  - Footer on each page: truthfulness disclaimer

- [ ] **3.4 Implement PDF Generator service**
  - File: `src/lib/pdf-generator.ts`
  - Function 1: `async function generateTailoredResumePDF(data: { resume: ResumeProfile; tailored: TailoredResume; jd: JobDescriptionProfile }): Promise<Buffer>`
  - Function 2: `async function generateComparisonPDF(data: { original: ResumeProfile; tailored: TailoredResume; originalScore: MatchScore; tailoredScore: MatchScore; jd: JobDescriptionProfile; gaps: GapAnalysis }): Promise<Buffer>`
  - Use `@react-pdf/renderer` `renderToStream()` or `renderToBuffer()`
  - Return PDF as Buffer

- [ ] **3.5 Implement PDF export API route**
  - File: `src/app/api/export-pdf/route.ts`
  - Accept POST with the full tailoring run data
  - Query parameter: `?type=tailored` or `?type=comparison`
  - Generate PDF and return as binary response:
    ```typescript
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="resume-shapeshifter-${type}-${Date.now()}.pdf"`
      }
    });
    ```

- [ ] **3.6 Activate `PDFExportButton` component**
  - File: `src/components/PDFExportButton.tsx`
  - Two buttons: "Download Tailored Resume" and "Download Side-by-Side Comparison"
  - On click: call `/api/export-pdf` with the store data
  - Show loading spinner during generation
  - On completion: trigger browser download
  - On error: show error message

- [ ] **3.7 Update export page with live PDF preview**
  - File: `src/app/export/page.tsx`
  - Remove disabled button state
  - Add PDF embed/iframe preview (if possible) or download instructions
  - Add "Back to Analysis" and "Download All" buttons
  - Include truthfulness disclaimer text visible before export

### 4.4 Phase 3 Acceptance Criteria

- [ ] Tailored resume PDF generates and is downloadable
- [ ] Comparison PDF generates with: scored bars, JD summary, two-column diff, highlighted changes, gap analysis, disclaimer
- [ ] PDFs look professional and are ATS-friendly (no images, tables, or columns in tailored resume)
- [ ] PDF generation shows loading state in UI
- [ ] Error handling: if PDF generation fails, show error with retry
- [ ] Content-Disposition header sets correct filename

### 4.5 Effort Estimate

| Area                | Hours |
|---------------------|-------|
| PDF library decision | 2     |
| Tailored resume template | 6     |
| Comparison template | 8     |
| PDF generator service | 4     |
| API route + frontend | 4     |
| Testing & polish   | 4     |
| **Total**           | **28** (3.5 days) |

---

## 5. Phase 4: Validation & Guardrails (Weeks 6–7)

### 5.1 Goal

Add truthfulness guardrails, confidence scoring, risk flagging, and user confirmation flows to ensure the system never fabricates experience.

### 5.2 Prerequisites

- [ ] Phase 2 complete (LLM output available)
- [ ] Phase 3 complete (or at least the tailored resume flow stable)

### 5.3 Step-by-Step Tasks

- [ ] **4.1 Implement truthfulness guardrail service**
  - File: `src/lib/truthfulness.ts`
  - Function: `async function checkTruthfulness(original: ResumeProfile, tailored: TailoredResume): Promise<AnnotatedTailoredResume>`
  - Checks:
    ```typescript
    interface AnnotatedTailoredResume extends TailoredResume {
      riskFlags: RiskFlag[];
    }
    interface RiskFlag {
      type: "new_employer" | "new_credential" | "new_technology" | "inflated_metric" | "inflated_scope" | "expert_claim_unsupported";
      bulletIndex: number;
      experienceIndex: number;
      description: string;
    }
    ```
  - Detection logic:
    - `new_employer`: Compare company names in tailored vs original
    - `new_credential`: Compare degrees/certifications
    - `new_technology`: Check technologies in tailored bullets not in original skills or bullets
    - `inflated_metric`: Regex for numbers/percentages in tailored but not in original
    - `inflated_scope`: Check for added leadership language ("led", "managed", "headed")
    - `expert_claim_unsupported`: Check for "expert" + proficiency claims

- [ ] **4.2 Integrate guardrails into tailoring pipeline**
  - In `src/lib/tailor.ts`, call `checkTruthfulness()` after LLM returns tailored data
  - For each risk flag found, set the corresponding bullet's `confidence` to `"low"` and populate `riskFlag`
  - If a bullet has no risk flags but was substantially rewritten, set confidence to `"medium"`
  - Add guardrail results to the API response

- [ ] **4.3 Update UI: Confidence badges**
  - In `BulletRewriter` component:
    - High confidence: green badge "✓ High confidence"
    - Medium confidence: yellow badge "! Medium confidence" with subtle highlight
    - Low confidence: red badge "✗ Low confidence" with strong highlight
  - On hover/tooltip: show explanation of why confidence is low

- [ ] **4.4 Update UI: Risk flag display**
  - For bullets with `riskFlag`:
    - Show a warning icon + the risk flag description
    - Add a toggle: "Accept change" / "Revert to original"
    - Default: show tuned-down version or original until user confirms

- [ ] **4.5 Implement user confirmation flow**
  - Flow: user reviews all low-confidence bullets → must click "Confirm all changes" before export
  - Store tracks `confirmedBullets: Set<string>` (by bullet index or hash)
  - Export button is disabled until all low-confidence bullets are reviewed and confirmed
  - If user rejects a rewrite, the original bullet is used in the tailored version

- [ ] **4.6 Add stricter Zod validation**
  - Ensure `TailoredBullet` schema has:
    - `confidence` is required enum
    - `riskFlag` is optional string (present when confidence = low)
    - `keywordsAddressed` is non-empty array
  - Add post-validation check: every keyword in `keywordsAddressed` must appear in JD's `keywords` or `requiredSkills` or `preferredSkills` (log warning if not, but don't reject)

- [ ] **4.7 Add error boundaries to all pages**
  - Wrap each page in `ErrorBoundary`
  - Wrap each major component section in its own `ErrorBoundary` (ScoreCard, GapAnalysis, SideBySideDiff)
  - Error fallback: "Something went wrong in [component name]. [Retry] [Go back]"

- [ ] **4.8 Implement LLM retry with exponential backoff**
  - In `llm-client.ts`, ensure retry logic:
    - Retry on: JSON parse error, Zod validation error, network timeout, 429 rate limit, 500 server error
    - Backoff: 1s → 2s → 4s → fail
    - Log each retry attempt with reason
    - After 3 retries: throw `LLMRetryError` with details

- [ ] **4.9 Write guardrail unit tests**
  - File: `__tests__/services/truthfulness.test.ts`
  - Test each detection case with controlled inputs
  - Edge cases: no changes between original and tailored, all new content, partially modified bullets

### 5.4 Phase 4 Acceptance Criteria

- [ ] Truthfulness service detects all 6 risk flag types
- [ ] UI shows confidence badges (high/medium/low) for every rewritten bullet
- [ ] Low-confidence bullets show risk flag with explanation
- [ ] Export button is disabled until user confirms all low-confidence changes
- [ ] User can revert individual rewrites back to original
- [ ] Error boundaries catch component errors gracefully
- [ ] LLM retry logic works (testable by temporarily setting a low token limit)
- [ ] Export PDF includes truthfulness disclaimer

### 5.5 Effort Estimate

| Area                | Hours |
|---------------------|-------|
| Guardrail service   | 6     |
| Integration into pipeline | 3     |
| UI: confidence badges | 3     |
| UI: risk flags & confirmation | 4     |
| Zod validation tightening | 2     |
| Error boundaries    | 2     |
| Retry & error handling | 3     |
| Testing             | 3     |
| **Total**           | **26** (3.25 days) |

---

## 6. Phase 5: Polish & Demo Readiness (Weeks 7–8)

### 6.1 Goal

Transform the functional prototype into a portfolio-quality demo. Add polish, responsive design, sample data for one-click demo, and write acceptance tests.

### 6.2 Prerequisites

- [ ] Phases 1–4 complete and stable
- [ ] No known bugs in the core flow

### 6.3 Step-by-Step Tasks

- [ ] **5.1 UI Polish: Animations & transitions**
  - Smooth page transitions between `/` → `/analysis` → `/export`
  - Score card: animated count-up on load
  - Gap analysis: staggered fade-in for each gap row
  - Side-by-side diff: highlight pulse animation on changed bullets
  - Loading state: smooth progress bar transitions between steps
  - Consider `framer-motion` for React animations: `npm install framer-motion`

- [ ] **5.2 Responsive design**
  - Mobile (< 768px): single-column layout throughout
  - Tablet (768–1024px): two-column layout where space allows
  - Desktop (> 1024px): full multi-column layouts
  - Side-by-side diff: on mobile, show as stacked (original above, tailored below) instead of side columns
  - Test on: Chrome, Firefox, Safari, Edge

- [ ] **5.3 Add sample data for one-click demo**
  - File: `src/lib/sample-data.ts`
  - Export a realistic sample resume (e.g., "Alex Chen – Full Stack Developer") and a matching JD (e.g., "Senior Full Stack Developer" at a real-looking company)
  - On landing page: "Try with sample data" link/button
  - Clicking it pre-fills both text areas with sample data
  - User can still edit before analyzing

- [ ] **5.4 Download UX: Multiple formats**
  - Update `PDFExportButton` to offer:
    - "Download Tailored Resume (PDF)"
    - "Download Side-by-Side Comparison (PDF)"
    - "Download as Markdown" (bonus, simple template)
  - Show download progress/status
  - After download: "Download again" option or "Start over"

- [ ] **5.5 Accessibility audit and fixes**
  - Add `aria-label` to all buttons and interactive elements
  - Ensure keyboard navigation: Tab order, Enter/Space to activate, Escape to close
  - Color contrast check: all text meets WCAG AA (4.5:1 for normal text, 3:1 for large)
  - Screen reader friendly: semantic HTML, `role` attributes where needed
  - Form labels associated with inputs

- [ ] **5.6 Comprehensive error messages**
  - Review all error messages in the app (API errors, validation errors, LLM errors)
  - Ensure they are: specific, actionable, not technical
  - Examples:
    - Bad: "LLM_ERROR" → Good: "The AI processor encountered an issue while scoring your resume. Please try again."
    - Bad: "Validation error at field skills.0" → Good: "Your resume skills section appears empty. Please ensure you've pasted your complete resume."
    - Bad: "Network error" → Good: "Unable to reach the server. Please check your internet connection and try again."

- [ ] **5.7 Performance optimization**
  - API response caching: cache JD and resume parsing results by text hash (in-memory Map)
  - Lazy load: `SideBySideDiff` loads only when user clicks the tab
  - Debounce: `ResumeInput` and `JDInput` debounce API calls by 500ms
  - Image optimization: if any images, use Next.js `<Image>` component
  - Bundle analysis: run `npm run analyze` to check bundle size

- [ ] **5.8 Write acceptance tests**
  - File: `__tests__/acceptance/full-flow.test.ts`
  - Test the complete user journey programmatically (using Playwright or similar):
    - Navigate to `/`
    - Fill resume textarea with sample resume
    - Fill JD textarea with sample JD
    - Click "Analyze"
    - Wait for results to load
    - Verify score card displays
    - Verify gap analysis renders
    - Click "Generate Tailored Resume"
    - Verify side-by-side diff shows
    - Click "Export"
    - Verify PDF download starts

- [ ] **5.9 Prepare demo script**
  - Document a 5-minute demo flow:
    1. Open the app (30s)
    2. Click "Try with sample data" (10s)
    3. Review parsed resume and JD (30s)
    4. Click "Analyze" → watch loading progress (20s)
    5. Review match score and gaps (60s)
    6. Click "Generate Tailored Resume" (15s)
    7. Scroll through side-by-side diff, highlight key changes (60s)
    8. Click "Export" and download comparison PDF (15s)
    9. Open PDF and pan through key sections (60s)
  - Include talking points: truthfulness guardrails, score explainability, gap analysis actionability

- [ ] **5.10 Final QA pass**
  - Test with a real job listing from LinkedIn/Indeed
  - Test with a multi-column PDF resume (note limitations)
  - Test error scenarios: empty input, very long resume, network disconnect during processing
  - Test on mobile viewport
  - Fix any remaining UI or functional issues

### 6.4 Phase 5 Acceptance Criteria

- [ ] One-click "Try with sample data" works and pre-fills both inputs
- [ ] Responsive design works on mobile, tablet, desktop
- [ ] Keyboard navigation works for all interactive elements
- [ ] All error messages are specific and actionable
- [ ] API response caching reduces redundant LLM calls
- [ ] Acceptance test passes: full flow from input to PDF download
- [ ] Demo script is documented and reproducible
- [ ] Polish level is portfolio-quality (animations, spacing, typography)

### 6.5 Effort Estimate

| Area                | Hours |
|---------------------|-------|
| Animations & transitions | 4     |
| Responsive design   | 4     |
| Sample data & demo  | 2     |
| Format options      | 3     |
| Accessibility       | 4     |
| Error messages      | 2     |
| Performance         | 3     |
| Acceptance tests    | 4     |
| Demo script & QA    | 4     |
| **Total**           | **30** (3.75 days) |

---

## 7. Scoring Algorithm Reference

### 7.1 Weighted Formula

```
overallScore =
  0.40 × skillCoverageScore +
  0.25 × responsibilityAlignmentScore +
  0.15 × keywordScore +
  0.10 × seniorityScore +
  0.10 × experienceYearsScore
  - 0.05 × penaltyForCriticalMissingRequirements
```

### 7.2 Sub-score Calculations

| Sub-score                    | Calculation Method                                     | Range  |
|------------------------------|--------------------------------------------------------|--------|
| `skillCoverageScore`         | Jaccard(requiredSkills, resume.skills) × 0.7 + Jaccard(preferredSkills, resume.skills) × 0.3 | 0–100 |
| `responsibilityAlignmentScore` | % of JD responsibilities matched by at least one resume bullet keyword | 0–100 |
| `keywordScore`               | % of JD keywords present in resume text (case-insensitive) | 0–100 |
| `seniorityScore`             | 100 if seniority levels match, 50 if partial match, 0 if no match | 0–100 |
| `experienceYearsScore`       | Min(jdYears, resumeYears) / jdYears × 100 (if jdYears > 0) | 0–100 |
| `penaltyForCriticalMissingRequirements` | 20 × (count of critical gaps / count of required skills) | 0–20 |

### 7.3 Implementation Notes

- `Jaccard(A, B) = |A ∩ B| / |A ∪ B|` (no weights for simplicity)
- For skill comparison, normalize to lowercase, trim whitespace, split multi-word skills
- Critical missing requirements come from LLM gap analysis
- Score caps at `max(0, min(100, score))`

---

## 8. Risk Mitigation Guide

### 8.1 Known Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| LLM produces malformed JSON | Medium | High | Zod validation + retry (Phase 2) |
| LLM hallucinates experience | Medium | Critical | Truthfulness guardrails (Phase 4) + explicit prompt instructions |
| API rate limiting (429) | Low | Medium | Exponential backoff retry (Phase 4) |
| PDF layout breaks on long content | Medium | Medium | Page break logic + max content length checks (Phase 3) |
| Multi-column PDF parse failure | High | Low | Show raw text with parse warning (MVP scope) |
| User rejects all tailored changes | Low | Low | Allow per-bullet revert; show gaps anyway (Phase 4) |
| OpenAI API key exhaustion | Low | High | Token usage logging + cost estimate in README |
| Browser compatibility issues | Low | Medium | Test on Chrome, Firefox, Safari, Edge (Phase 5) |

### 8.2 Rollback Strategy

If a critical bug is found in production:
1. Revert the last deployed commit
2. Fix in development with new tests
3. Deploy fix after passing acceptance tests

### 8.3 Cost Considerations (OpenAI API)

Estimated per-run token usage (GPT-4o-mini):

| Step                | Prompt Tokens | Completion Tokens | Estimated Cost |
|---------------------|--------------|-------------------|----------------|
| JD Extraction       | ~1,000       | ~300              | ~$0.001       |
| Resume Parsing      | ~1,500       | ~400              | ~$0.001       |
| Match Scoring       | ~2,000       | ~300              | ~$0.001       |
| Bullet Rewriting    | ~2,000       | ~1,000            | ~$0.002       |
| Gap Analysis        | ~2,000       | ~500              | ~$0.001       |
| **Total per run**   | **~8,500**   | **~2,500**        | **~$0.006**   |

At 100 demo runs: ~$0.60. At 1,000 runs: ~$6.00.

---

> **End of Implementation Plan**
>
> This document should be read alongside `docs/architecture.md`. Update task checkboxes as work progresses. Each phase ends with a validation checkpoint before moving to the next.