# Resume Shapeshifter — Architecture Document

> **Document Version:** 1.0  
> **Last Updated:** 2026-05-23  
> **Status:** Draft / MVP Planning

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Directory Structure](#4-directory-structure)
5. [Core Data Models & Zod Schemas](#5-core-data-models--zod-schemas)
6. [Service Layer](#6-service-layer)
7. [LLM Integration Architecture](#7-llm-integration-architecture)
8. [Frontend Component Tree](#8-frontend-component-tree)
9. [Data Flow](#9-data-flow)
10. [API Route Design](#10-api-route-design)
11. [PDF Generation Strategy](#11-pdf-generation-strategy)
12. [Truthfulness & Guardrails Architecture](#12-truthfulness--guardrails-architecture)
13. [Error Handling & Edge Cases](#13-error-handling--edge-cases)
14. [Phase Implementation Plan](#14-phase-implementation-plan)
15. [Appendix: Key Design Decisions](#15-appendix-key-design-decisions)

---

## 1. Project Overview

**Resume Shapeshifter** is a JD-to-resume tailoring engine. Users provide a job description and an existing resume, and the system generates a tailored resume that better aligns with the job listing—while preserving truthfulness and the user's actual experience.

The product rewrites resume bullets, scores the resume-to-JD match, flags missing skills or experience gaps, and generates a side-by-side PDF comparing the original resume with the tailored resume.

**Core principle:** The goal is not to fabricate experience. The system helps users express their existing experience in language that better matches a target role.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Landing   │  │Input     │  │Analysis  │  │Side-by- │   │
│  │Page      │  │(Resume + │  │Dashboard │  │Side Diff │   │
│  │          │  │ JD)      │  │          │  │& Export  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP (Next.js API Routes)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js Application Server                  │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐ │
│  │ API Routes │  │  Services  │  │      LLM Layer         │ │
│  │            │  │            │  │                        │ │
│  │ /api/parse │  │ Parser     │  │ JD Extraction Prompt   │ │
│  │ /api/score │  │ Scorer     │  │ Resume Parser Prompt   │ │
│  │ /api/tailor │  │ Tailor    │  │ Scoring Prompt         │ │
│  │ /api/gaps  │  │ GapAnalyzer│  │ Bullet Rewrite Prompt  │ │
│  │ /api/export │  │ PDFGen    │  │ Gap Analysis Prompt    │ │
│  └────────────┘  └────────────┘  └────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │ LLM API Calls
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Groq (LLM API via Groq SDK)               │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ JD       │  │ Resume   │  │ Scoring  │  │ Bullet   │   │
│  │Extract   │  │ Parse    │  │ Engine   │  │ Rewriter │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐                                                │
│  │ Gap      │                                                │
│  │ Analyzer │                                                │
│  └──────────┘                                                │
└─────────────────────────────────────────────────────────────┘
```

The system follows a **vertical slice architecture**:

- **Frontend:** Next.js React app (single-page application feel with routing)
- **Backend:** Next.js API routes (no separate backend server needed for MVP)
- **LLM Integration:** OpenAI API or another structured-output-capable LLM
- **PDF Generation:** Server-side PDF rendering via Playwright or React-PDF
- **Storage:** Session/local storage for MVP; optional persistent storage later

Each request flows through:
1. **Client** → API Route → **Service** → **LLM Prompt** → **LLM API** → Structured JSON → **Service** (post-process) → **API Route** (validate with Zod) → **Client**

---

## 3. Tech Stack

| Layer              | Technology                                         | Rationale                                         |
|--------------------|----------------------------------------------------|----------------------------------------------------|
| **Framework**      | Next.js 14+ (App Router)                           | Unified frontend + backend, convenient for MVP     |
| **Language**       | TypeScript                                         | Type safety across both frontend and backend       |
| **UI Library**     | React 18+                                          | Industry standard                                  |
| **Styling**        | Tailwind CSS                                       | Utility-first, rapid iteration                     |
| **UI Components**  | Shadcn UI                                          | Accessible, customizable, consistent with Tailwind |
| **Validation**     | Zod                                                | Runtime schema validation for LLM outputs and APIs |
| **LLM Provider**   | Groq SDK (llama-3.3-70b-versatile or mixtral-8x7b-32768) | Free tier available, fast inference, JSON mode |
| **PDF Generation** | @react-pdf/renderer or Playwright                  | Server-side PDF generation with styling control    |
| **Document Parse** | pdf-parse (PDF), mammoth (DOCX)                    | Read PDF/DOCX text content for MVP                 |
| **Storage (MVP)**  | In-memory / sessionStorage / local JSON            | No infrastructure needed                           |
| **Storage (Post)** | SQLite via better-sqlite3 or Supabase              | Optional persistence layer                         |

---

## 4. Directory Structure

```
resume-shapeshifter/
├── public/                     # Static assets
├── prompts/                    # LLM prompts (separate files per engine)
│   ├── jd-extraction.ts
│   ├── resume-parser.ts
│   ├── match-scoring.ts
│   ├── bullet-rewriter.ts
│   └── gap-analysis.ts
│
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Landing / input page
│   │   ├── layout.tsx          # Root layout
│   │   ├── analysis/
│   │   │   └── page.tsx        # Analysis results page
│   │   └── export/
│   │       └── page.tsx        # Export / side-by-side page
│   │
│   ├── api/                    # Next.js API route handlers
│   │   ├── parse-resume/route.ts
│   │   ├── parse-jd/route.ts
│   │   ├── score/route.ts
│   │   ├── tailor/route.ts
│   │   ├── gaps/route.ts
│   │   └── export-pdf/route.ts
│   │
│   ├── components/             # React components
│   │   ├── ui/                 # Shadcn UI primitives
│   │   ├── ResumeInput.tsx
│   │   ├── JDInput.tsx
│   │   ├── ScoreCard.tsx
│   │   ├── ScoreBreakdown.tsx
│   │   ├── GapAnalysis.tsx
│   │   ├── BulletRewriter.tsx
│   │   ├── SideBySideDiff.tsx
│   │   ├── PDFExportButton.tsx
│   │   ├── LoadingState.tsx
│   │   └── ErrorBoundary.tsx
│   │
│   ├── lib/                    # Core business logic
│   │   ├── schemas.ts          # Zod schemas for all data models
│   │   ├── types.ts            # TypeScript type exports
│   │   ├── llm-client.ts       # OpenAI API client wrapper
│   │   ├── resume-parser.ts    # Resume parsing logic
│   │   ├── jd-parser.ts        # JD parsing logic
│   │   ├── scoring.ts          # Match scoring engine
│   │   ├── tailor.ts           # Resume tailoring engine
│   │   ├── gap-analysis.ts     # Gap analysis engine
│   │   ├── pdf-generator.ts    # PDF generation logic
│   │   └── truthfulness.ts     # Guardrail & claim detection
│   │
│   ├── hooks/                  # React hooks
│   │   ├── useTailoring.ts
│   │   └── useExport.ts
│   │
│   └── store/                  # State management (MVP: React context / zustand)
│       └── tailoring-store.ts
│
├── docs/                       # Documentation
│   ├── problemStatement.md
│   └── architecture.md         # This file
│
├── __tests__/                  # Tests
│   ├── services/
│   ├── prompts/
│   └── components/
│
├── .env.local                  # Environment variables (LLM API keys)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 5. Core Data Models & Zod Schemas

All major data structures are defined as both TypeScript types and Zod schemas in `src/lib/schemas.ts`. This ensures runtime validation of LLM outputs, API request bodies, and internal data flow.

### 5.1 ResumeProfile

```typescript
const ResumeProfileSchema = z.object({
  contact: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    linkedin: z.string().optional(),
    website: z.string().optional(),
    location: z.string().optional(),
  }),
  summary: z.string().optional(),
  skills: z.array(z.string()),
  experience: z.array(
    z.object({
      company: z.string(),
      title: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      bullets: z.array(z.string()),
    })
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      technologies: z.array(z.string()).optional(),
      bullets: z.array(z.string()).optional(),
    })
  ),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string().optional(),
      field: z.string().optional(),
      graduationDate: z.string().optional(),
    })
  ),
  certifications: z.array(
    z.object({
      name: z.string(),
      issuer: z.string().optional(),
      date: z.string().optional(),
    })
  ),
});
```

### 5.2 JobDescriptionProfile

```typescript
const JobDescriptionProfileSchema = z.object({
  jobTitle: z.string(),
  company: z.string().optional(),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  qualifications: z.array(z.string()),
  tools: z.array(z.string()),
  keywords: z.array(z.string()),
  seniorityLevel: z.string().optional(),
  domainSignals: z.array(z.string()),
});
```

### 5.3 MatchScore

```typescript
const MatchScoreSchema = z.object({
  overallScore: z.number().min(0).max(100),
  skillCoverageScore: z.number().min(0).max(100),
  responsibilityAlignmentScore: z.number().min(0).max(100),
  keywordScore: z.number().min(0).max(100),
  seniorityScore: z.number().min(0).max(100),
  criticalMissingRequirements: z.array(z.string()),
  explanation: z.string(),
});
```

### 5.4 TailoredResume

```typescript
const TailoredBulletSchema = z.object({
  original: z.string(),
  tailored: z.string(),
  changeReason: z.string(),
  keywordsAddressed: z.array(z.string()),
  confidence: z.enum(["high", "medium", "low"]),
  riskFlag: z.string().optional(),
});

const TailoredExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  bullets: z.array(TailoredBulletSchema),
});

const TailoredResumeSchema = z.object({
  tailoredSummary: z.string().optional(),
  tailoredSkills: z.array(z.string()),
  tailoredExperience: z.array(TailoredExperienceSchema),
});
```

### 5.5 ResumeGap

```typescript
const ResumeGapSchema = z.object({
  name: z.string(),
  importance: z.enum(["high", "medium", "low"]),
  jdEvidence: z.string(),
  resumeEvidence: z.string(),
  suggestedAction: z.string(),
  canSafelyAdd: z.boolean(),
});

const GapAnalysisSchema = z.object({
  gaps: z.array(ResumeGapSchema),
});
```

### 5.6 TailoringRun (Orchestration Entity)

```typescript
const TailoringRunSchema = z.object({
  id: z.string().uuid(),
  resume: ResumeProfileSchema,
  jobDescription: JobDescriptionProfileSchema,
  originalScore: MatchScoreSchema,
  tailoredScore: MatchScoreSchema.optional(),
  tailoredResume: TailoredResumeSchema.optional(),
  gaps: GapAnalysisSchema,
  createdAt: z.string().datetime(),
  status: z.enum(["draft", "analyzed", "tailored", "exported"]),
});
```

---

## 6. Service Layer

Each logical engine is implemented as a service in `src/lib/`. Services focus on one concern and are called from API routes.

### 6.1 Resume Parser Service

- **File:** `src/lib/resume-parser.ts`
- **Input:** Raw text string or file buffer (PDF/DOCX)
- **Output:** `ResumeProfile` (structured JSON)
- **Logic:**
  1. If PDF/DOCX → extract raw text using `pdf-parse` or `mammoth`
  2. Pass raw text to LLM resume-parser prompt
  3. Validate LLM output against `ResumeProfileSchema`
  4. Return structured resume data
  5. On validation failure, retry or return user-facing error

### 6.2 JD Parser Service

- **File:** `src/lib/jd-parser.ts`
- **Input:** Raw job description text
- **Output:** `JobDescriptionProfile` (structured JSON)
- **Logic:**
  1. Pass JD text to LLM jd-extraction prompt
  2. Validate LLM output against `JobDescriptionProfileSchema`
  3. Return structured JD data

### 6.3 Scoring Service

- **File:** `src/lib/scoring.ts`
- **Input:** `ResumeProfile` + `JobDescriptionProfile`
- **Output:** `MatchScore`
- **Logic:**
  1. Compare parsed resume skills vs JD required/preferred skills → skill coverage score
  2. Compare resume experience bullets vs JD responsibilities → responsibility alignment score
  3. Compare keyword overlap → keyword score
  4. Compare seniority signals → seniority score
  5. Aggregate into overall score (weighted average)
  6. Optionally call LLM scoring prompt for refined explanation
  7. Validate output against `MatchScoreSchema`

### 6.4 Tailoring Service

- **File:** `src/lib/tailor.ts`
- **Input:** `ResumeProfile` + `JobDescriptionProfile` + `MatchScore`
- **Output:** `TailoredResume`
- **Logic:**
  1. For each experience entry, pass original bullets + JD context to LLM bullet-rewriter prompt
  2. Receive tailored bullets with metadata (change reason, confidence, risk flag)
  3. Reorder/resummarize skills section based on JD alignment
  4. Rewrite summary if applicable
  5. Validate output against `TailoredResumeSchema`
  6. Return tailored resume

### 6.5 Gap Analysis Service

- **File:** `src/lib/gap-analysis.ts`
- **Input:** `ResumeProfile` + `JobDescriptionProfile` + `MatchScore`
- **Output:** `GapAnalysis`
- **Logic:**
  1. Identify JD required skills not present in resume → high-importance gaps
  2. Identify JD preferred skills not present in resume → medium-importance gaps
  3. Identify JD responsibilities not addressed in resume → medium gaps
  4. Check for domain experience and seniority signals
  5. For each gap, determine suggested action based on `canSafelyAdd`
  6. Validate output against `GapAnalysisSchema`

### 6.6 PDF Generator Service

- **File:** `src/lib/pdf-generator.ts`
- **Input:** `ResumeProfile` + `TailoredResume` + `MatchScore` (original & tailored) + `GapAnalysis` + `JobDescriptionProfile`
- **Output:** PDF buffer / file
- **Logic:**
  1. Generate two PDF documents:
     - Tailored resume PDF (clean, standalone resume)
     - Side-by-side comparison PDF (original vs tailored)
  2. Comparison PDF includes:
     - Header: job title, company
     - Score before and after (visual bars)
     - JD requirements summary
     - Two-column layout: original bullets (left) | tailored bullets (right)
     - Highlighted changes (color-coded)
     - Gap analysis section
     - Disclaimer: "User must verify all content before use"
  3. Return PDF as downloadable file

### 6.7 Truthfulness Guardrail Service

- **File:** `src/lib/truthfulness.ts`
- **Input:** `TailoredResume` + `ResumeProfile`
- **Output:** Annotated `TailoredResume` with risk flags
- **Logic:**
  1. Detect new employer names not in original
  2. Detect new degrees/certifications not in original
  3. Detect technologies not present in original unless marked as suggestion
  4. Detect inflated metrics or leadership scope
  5. Check for "expert-level" proficiency claims without support
  6. Flag low-confidence rewrites for user confirmation
  7. Return enhanced tailored data with risk annotations

---

## 7. LLM Integration Architecture

### 7.1 LLM Client

- **File:** `src/lib/llm-client.ts`
- **Purpose:** Centralized wrapper around Groq SDK
- **LLM Provider:** Groq (using `groq-sdk` npm package)
- **Models:** `llama-3.3-70b-versatile` (primary), `mixtral-8x7b-32768` (fallback)
- **Responsibilities:**
  - Manage API key and configuration (reads `GROQ_API_KEY` from env)
  - Handle rate limiting and retries (exponential backoff)
  - Parse and validate structured JSON responses
  - Provide typed generic caller: `callLLM<T>(prompt, schema): T`
  - Log token usage for cost tracking

### 7.2 Prompt Design

Each prompt is a standalone file in `/prompts/`. Prompts follow a consistent structure:

```
System message (role definition + strict instructions)
---
User message (context + input data)
---
Output format (JSON schema specification + examples)
```

#### 7.2.1 JD Extraction Prompt

- **File:** `prompts/jd-extraction.ts`
- **Role:** Extract structured fields from raw job description text
- **Key instructions:**
  - Extract exact job title, company name
  - Distinguish required vs preferred skills
  - Extract tools, technologies, platforms mentioned
  - Identify seniority level signals (years, titles like "Senior", "Lead")
  - Capture domain-specific keywords
  - Do not infer information not present in the text

#### 7.2.2 Resume Parser Prompt

- **File:** `prompts/resume-parser.ts`
- **Role:** Convert raw resume text into structured JSON sections
- **Key instructions:**
  - Preserve exact content of each bullet
  - Identify logical sections (experience, education, skills, etc.)
  - Handle non-standard section headers
  - Do not modify or rewrite content—parse only

#### 7.2.3 Match Scoring Prompt

- **File:** `prompts/match-scoring.ts`
- **Role:** Generate explainable match score with breakdown
- **Key instructions:**
  - Score 0-100 for each subcategory
  - Provide human-readable explanation
  - List critical missing requirements by name
  - Be conservative—do not inflate scores
  - Base all scoring on evidence from both documents

#### 7.2.4 Bullet Rewriter Prompt

- **File:** `prompts/bullet-rewriter.ts`
- **Role:** Rewrite each resume bullet to better align with the JD
- **Key instructions:**
  - Preserve the user's actual meaning and experience
  - Improve alignment with JD responsibilities and keywords
  - Use stronger action verbs where appropriate
  - Include JD-relevant terminology only if truthful
  - Preserve or improve measurable impact when present
  - Do NOT add unsupported claims
  - For each rewrite: explain the change, list keywords addressed, assign confidence level
  - If uncertain, flag as low confidence with risk explanation

#### 7.2.5 Gap Analysis Prompt

- **File:** `prompts/gap-analysis.ts`
- **Role:** Identify missing or weakly represented skills and requirements
- **Key instructions:**
  - Cross-reference JD required skills vs resume skills
  - Flag skills completely absent vs weakly present
  - Assign importance based on JD emphasis (explicit requirement vs nice-to-have)
  - Provide evidence from JD ("Required: X years of Y")
  - Provide resume evidence ("Mentioned once in context of Z")
  - Suggest actionable next steps per gap

### 7.3 JSON Schema Validation Flow

Every LLM call follows this pattern:

```
User Input → Build Prompt → LLM API Call → Raw Response
  → Parse JSON → Validate with Zod Schema → Success? → Return typed data
                                       → Fail? → Retry (max 2) or fallback
```

Zod validation is critical because LLMs sometimes produce malformed JSON, missing fields, or extra fields. Validation catches:
- Missing required fields
- Wrong field types
- Values out of range
- Extra unexpected fields

---

## 8. Frontend Component Tree

### 8.1 Page Routing

```
/                    → Landing + Input page (resume + JD)
/analysis            → Analysis dashboard (score, gaps, preview)
/analysis?step=diff  → Side-by-side diff view
/export              → Export page (PDF download)
```

### 8.2 Component Hierarchy

```
<Layout>
  <Header />
  <main>
    <LandingPage>                         // "/"
      <ResumeInput />                     // Textarea or file upload
      <JDInput />                         // Textarea
      <AnalyzeButton />                   // Triggers API calls
    </LandingPage>

    <AnalysisDashboard>                   // "/analysis"
      <ScoreCard                          // Overall match score
        originalScore={...}
        tailoredScore={...}
      />
      <ScoreBreakdown />                  // Sub-scores breakdown
      <JDSummary />                       // Extracted JD requirements
      <GapAnalysis                        // Missing skills/experience
        gaps={...}
      />
      <BulletRewriter                     // Per-bullet rewrites
        experience={...}
      />
      <SideBySideDiff                     // Visual diff view
        original={...}
        tailored={...}
      />
    </AnalysisDashboard>

    <ExportPage>                          // "/export"
      <PDFExportButton                    // Download PDFs
        tailoredResume={...}
        comparisonData={...}
      />
    </ExportPage>
  </main>
  <Footer />
</Layout>
```

### 8.3 Key Component Responsibilities

| Component           | Props / Data            | Responsibilities                                      |
|---------------------|-------------------------|-------------------------------------------------------|
| `ResumeInput`       | `onResumeParsed`        | Text pasting / file upload, preview parsed content    |
| `JDInput`           | `onJDParsed`           | Text pasting, preview extracted JD fields             |
| `ScoreCard`         | `originalScore`, `tailoredScore` | Big score display with before/after visual   |
| `ScoreBreakdown`    | `subscores`            | Donut/bar charts for skill, keyword, seniority scores |
| `GapAnalysis`       | `gaps[]`               | Table/card list of missing items with importance tags |
| `BulletRewriter`    | `tailoredExperience[]` | Per-bullet editor with original vs tailored side view |
| `SideBySideDiff`    | `originalResume`, `tailoredResume` | Full page split view, highlighted changes |
| `PDFExportButton`   | `tailoringRun`         | Triggers PDF generation and download                  |
| `LoadingState`      | `stages[]`             | Multi-step progress indicator during processing       |
| `ErrorBoundary`     | (wraps children)       | Gracefully catch component errors, show retry UI      |

---

## 9. Data Flow

### 9.1 End-to-End Flow (Happy Path)

```
[User pastes resume text + JD text]
         │
         ▼
[Client POST /api/parse-resume + /api/parse-jd] (parallel)
         │
         ├──► Resume text → LLM resume-parser → ResumeProfile
         └──► JD text → LLM jd-extraction → JobDescriptionProfile
         │
         ▼
[Client POST /api/score] → ScoringService → MatchScore (pre-tailor)
         │
         ▼
[Client POST /api/gaps] → GapAnalysisService → GapAnalysis
         │
         ▼
[Client renders Analysis Dashboard]
  - JD Summary
  - Original MatchScore
  - Gap Analysis
  - "Generate Tailored Resume" button
         │
         ▼ (user clicks "Generate Tailored Resume")
         │
[Client POST /api/tailor] → TailoringService + TruthfulnessService → TailoredResume
         │
         ▼
[Client POST /api/score] (with tailored resume) → MatchScore (post-tailor)
         │
         ▼
[Client renders Side-by-Side Diff]
  - Original score → Tailored score
  - Original bullets → Tailored bullets (with metadata)
  - Remaining gaps
  - "Export PDF" button
         │
         ▼ (user clicks "Export PDF")
         │
[Client POST /api/export-pdf] → PDFGeneratorService → PDF buffer
         │
         ▼
[Browser downloads comparison PDF + tailored resume PDF]
```

### 9.2 Parallel vs Sequential

- **Parallel:** Resume parsing and JD parsing (independent of each other)
- **Sequential (after parsing):** Scoring depends on both parsings
- **Sequential (after scoring):** Gap analysis depends on both + score; tailoring depends on both + score
- **Sequential (after tailoring):** Post-tailor scoring depends on tailored resume
- **Sequential (after all data):** PDF export depends on all data

### 9.3 State Management Flow

```
LandingPage (input) ──► tailoring-store (zustand) ◄── API responses
                              │
                              ▼
                    AnalysisDashboard reads store
                              │
                              ▼
                    SideBySideDiff reads store
                              │
                              ▼
                    ExportPage reads store → triggers PDF
```

The store holds the entire `TailoringRun` object plus UI state (loading stages, errors, active step).

---

## 10. API Route Design

### 10.1 Route Summary

| Method | Path                 | Input                          | Output                   |
|--------|----------------------|--------------------------------|--------------------------|
| POST   | `/api/parse-resume`  | `{ text: string }`             | `ResumeProfile`          |
| POST   | `/api/parse-jd`      | `{ text: string }`             | `JobDescriptionProfile`  |
| POST   | `/api/score`         | `{ resume, jd }`               | `MatchScore`             |
| POST   | `/api/tailor`        | `{ resume, jd, score }`        | `TailoredResume`         |
| POST   | `/api/gaps`          | `{ resume, jd, score }`        | `GapAnalysis`            |
| POST   | `/api/export-pdf`    | `{ tailoringRun }`             | PDF bytes (binary)       |

### 10.2 Route Handler Pattern

Every API route follows the same structure:

```typescript
// Example: /api/score/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { MatchScoreSchema } from "@/lib/schemas";
import { scoringService } from "@/lib/scoring";

export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json();

    // 2. Validate input with Zod
    const input = ScoreRequestSchema.parse(body);

    // 3. Call service
    const result = await scoringService.compute(input.resume, input.jd);

    // 4. Validate output with Zod
    const validated = MatchScoreSchema.parse(result);

    // 5. Return response
    return NextResponse.json(validated);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Scoring error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### 10.3 Error Response Format

Standardized error envelope:

```typescript
{
  error: string,
  details?: unknown,
  code?: "VALIDATION_ERROR" | "LLM_ERROR" | "PARSE_ERROR" | "INTERNAL_ERROR"
}
```

### 10.4 Rate Limiting & Caching (MVP+)

- In-memory rate limiting per IP (e.g., 10 requests/minute)
- Cache JD extraction results by JD text hash to avoid re-processing identical JDs
- Cache resume parsing results by resume text hash
- Cache invalidation: user explicitly re-submits

---

## 11. PDF Generation Strategy

### 11.1 Approach: React-PDF (Recommended for MVP)

Use `@react-pdf/renderer` for server-side PDF generation.

**Rationale:**
- Written in React/JSX → consistent styling with Tailwind mental model
- No headless browser dependency (simpler than Playwright for MVP)
- Supports text, tables, simple layouts
- Adequate for ATS-friendly resume format

### 11.2 PDF Documents

#### 11.2.1 Tailored Resume PDF

- Single-column, clean layout
- Sections: Contact → Summary → Skills → Experience → Education → Certifications
- Uses tailored content
- ATS-friendly (no complex tables or columns)
- Font: standard system fonts (Helvetica, Times-Roman)

#### 11.2.2 Side-by-Side Comparison PDF

- **Header:** Job title, company, date
- **Score comparison bar:** Two horizontal bars showing original (gray) vs tailored (blue) scores
- **JD requirements summary:** Compact card with key extracted fields
- **Body:** Two-column layout
  - Left: "Original Resume" header + original bullets
  - Right: "Tailored Resume" header + tailored bullets
  - Changed bullets highlighted: light green background for improved, light yellow for rewrites
- **Gap analysis section:** Table with gap name, importance badge, suggested action
- **Footer:** Truthfulness disclaimer at bottom

### 11.3 Known Limitations (MVP)

- No complex multi-column resume support
- No custom fonts in MVP (system fonts only)
- Page break handling may need tuning for long resumes
- No WYSIWYG editor—review happens before PDF generation

### 11.4 Fallback / Alternative

If React-PDF proves limiting, fall back to Playwright:
1. Render the side-by-side view as an HTML page
2. Use Playwright to convert HTML → PDF
3. More flexible but requires Chromium binary

---

## 12. Truthfulness & Guardrails Architecture

### 12.1 Principles

1. **Never invent experience** – The system must not add employers, degrees, or technologies the user does not have.
2. **Evidence-based rewriting** – Every rewrite must be traceable to an original bullet.
3. **Transparency** – Every change is explained (change reason, keywords addressed).
4. **User responsibility** – The user must review and confirm before export.
5. **Conservative scoring** – Scores default lower when uncertain.

### 12.2 Guardrail Layers

```
Layer 1: LLM Prompt Instructions
  └─ "Do not add information not present in the resume"
  └─ "Mark uncertain suggestions with low confidence"
  └─ "Do not fabricate metrics, employers, or education"

Layer 2: Output Validation (Zod)
  └─ Validate tailored resume structure
  └─ Check that all tailored bullets reference original bullets

Layer 3: Post-Processing Guardrails
  └─ Compare tailored resume vs original resume for new entities
  └─ Detect inflated seniority or expertise claims
  └─ Flag rewritten bullets that add unsupported keywords

Layer 4: UI Guardrails
  └─ Show change reason for every rewrite
  └─ Show confidence level (high / medium / low)
  └─ Show risk flag for potentially overreaching changes
  └─ Require user confirmation before PDF export
  └─ Include disclaimer on every export
```

### 12.3 Confidence Scoring

| Confidence | Criteria                                              | UI Behavior                            |
|------------|-------------------------------------------------------|----------------------------------------|
| High       | Rewrite stays very close to original meaning; minor wording improvement | Auto-accepted, minimal highlight      |
| Medium     | Rewrite adds relevant JD terminology or rephrases significantly | Requires quick review, highlighted     |
| Low        | Rewrite introduces new emphasis or uncertain connection to JD | Requires explicit user confirmation, strongly highlighted |

### 12.4 Risk Flags

| Flag                       | Trigger                                                   |
|----------------------------|-----------------------------------------------------------|
| `new_employer`             | Tailored resume mentions an employer not in original      |
| `new_credential`           | Tailored resume adds a degree or certification            |
| `new_technology`           | Tailored resume adds a skill not in original experience   |
| `inflated_metric`          | Adds numbers or percentages not in original               |
| `inflated_scope`           | Claims leadership or scope not present in original        |
| `expert_claim_unsupported` | Claims "expert" proficiency without evidence              |

When a risk flag is triggered, the change is set to `confidence: "low"` and the `riskFlag` field is populated.

---

## 13. Error Handling & Edge Cases

### 13.1 Parsing Edge Cases

| Scenario                          | Handling                                                    |
|-----------------------------------|-------------------------------------------------------------|
| Multi-column PDF                  | Parse may produce garbled text; show raw parse result + allow manual edits |
| Non-standard resume section names | LLM prompt instructed to handle flexibly; fallback: user can tag sections manually |
| Empty or minimal resume           | Return helpful error: "Resume text appears too short. Please paste a complete resume." |
| PDF with images only (scanned)    | Return error: "PDF appears to be scanned. Please paste text directly." |
| Very long resume (>10 pages)      | Truncate to first ~3000 tokens with warning; process in chunks if needed |
| JD text is a URL instead of text  | Show error: "Please paste the job description text, not a URL." (URL support is post-MVP) |

### 13.2 LLM Edge Cases

| Scenario                          | Handling                                                    |
|-----------------------------------|-------------------------------------------------------------|
| Invalid JSON response             | Retry with same prompt (max 2 retries); if still failing, return LLM_ERROR |
| Missing required fields           | Zod validation catches; return validation error with details |
| Token limit exceeded              | Truncate input content with warning; process sections separately |
| Rate limited (429)                | Exponential backoff (1s, 2s, 4s); if still failing, return rate limit error |
| Empty or nonsensical response     | Validate with Zod; if validation fails → retry; if still fails → return error |
| Hallucinated content (new skills) | Caught by post-processing guardrails (see section 12.2) |

### 13.3 UI Error States

Each API call step has three states the UI handles:

1. **Loading:** Show `LoadingState` component with stage indicator (e.g., "Parsing resume...", "Analyzing JD...", "Generating score...")
2. **Error:** Show error message with retry button; specific error messages per failure type
3. **Success:** Transition to next step

### 13.4 Fallback for Offline / API Failure

- **No local processing fallback** – All processing requires LLM API calls
- **Graceful degradation** – If LLM is unavailable, show clear message: "Currently unable to process. Please check your API key and try again."
- **Session preservation** – Parsed data is kept in state so user doesn't lose work if a single step fails

---

## 14. Phase Implementation Plan

### Phase 1: Static Prototype (Weeks 1-2)

**Goal:** Working UI with mock data, no LLM dependencies

- [ ] Set up Next.js project with TypeScript, Tailwind, Shadcn UI
- [ ] Build landing/input page (`ResumeInput`, `JDInput`)
- [ ] Build `AnalysisDashboard` page layout
- [ ] Build `ScoreCard` with hardcoded mock data
- [ ] Build `GapAnalysis` with hardcoded mock gaps
- [ ] Build `SideBySideDiff` with hardcoded before/after
- [ ] Build `PDFExportButton` that runs mock PDF generation
- [ ] No API routes yet—components read from hardcoded JSON

**Deliverable:** User can navigate through all screens with mock data. Visual layout is complete.

### Phase 2: LLM Integration (Weeks 3-5)

**Goal:** All services call real LLM and return structured data

- [ ] Implement `llm-client.ts` (OpenAI wrapper)
- [ ] Write all 5 prompt files in `/prompts/`
- [ ] Implement `jd-parser.ts` → POST /api/parse-jd
- [ ] Implement `resume-parser.ts` → POST /api/parse-resume
- [ ] Implement `scoring.ts` → POST /api/score
- [ ] Implement `tailor.ts` → POST /api/tailor
- [ ] Implement `gap-analysis.ts` → POST /api/gaps
- [ ] Connect frontend components to real API routes
- [ ] Add `LoadingState` with per-stage progress updates

**Deliverable:** End-to-end functional prototype with real LLM processing.

### Phase 3: PDF Export (Weeks 5-6)

**Goal:** Generate downloadable PDFs

- [ ] Set up `@react-pdf/renderer` or Playwright
- [ ] Implement tailored resume PDF generation
- [ ] Implement side-by-side comparison PDF generation
- [ ] Add PDF styling (fonts, colors, layout)
- [ ] Implement PDF download via API route
- [ ] Add PDF export button with loading state
- [ ] Include truthfulness disclaimer in PDF

**Deliverable:** Fully functional PDF export for both documents.

### Phase 4: Validation & Guardrails (Weeks 6-7)

**Goal:** Ensure truthfulness and reliability

- [ ] Implement `truthfulness.ts` guardrail service
- [ ] Add post-processing claim detection
- [ ] Integrate risk flags into UI display
- [ ] Add confidence level badges to each rewrite
- [ ] Implement user confirmation flow for low-confidence changes
- [ ] Add stricter Zod validation schemas
- [ ] Add error boundaries and error states to all components
- [ ] Handle LLM failure retries with exponential backoff

**Deliverable:** Reliable, truthfulness-checked output with clear user guidance.

### Phase 5: Polish & Demo Readiness (Weeks 7-8)

**Goal:** Production-quality demo

- [ ] Improve UI polish (animations, transitions, spacing)
- [ ] Add sample resume and JD for one-click demo
- [ ] Add download buttons for all export formats
- [ ] Add loading states and progress indicators
- [ ] Implement responsive design (mobile-friendly)
- [ ] Add keyboard navigation and accessibility
- [ ] Write comprehensive error messages
- [ ] Performance optimize API calls (caching, parallelization)
- [ ] Write acceptance tests
- [ ] Prepare demo script with real job listing

**Deliverable:** Portfolio-ready demo that meets all acceptance criteria (see section 12 of `problemStatement.md`).

---

## 15. Appendix: Key Design Decisions

### 15.1 Why Next.js API Routes Instead of a Separate Backend?

- **Simplifies deployment** – Single Vercel/Node.js deployment
- **Shared TypeScript types** – Frontend and backend use same Zod schemas
- **Faster initial development** – No cross-service communication overhead
- **Adequate for MVP** – LLM calls are the bottleneck, not request routing

**Trade-off:** If the app needs heavy document processing or background job queues, a separate Python/FastAPI service could be added later.

### 15.2 Why Zod for Validation?

- **Runtime validation** – Critical for catching malformed LLM outputs
- **Type inference** – `z.infer<typeof Schema>` generates TypeScript types automatically
- **Detailed error messages** – Pinpoints exactly which field failed and why
- **Lightweight** – No heavy ORM dependency for MVP

### 15.3 Why React-PDF Over Playwright for MVP?

- **No Chromium dependency** – Smaller install, faster CI/CD
- **React-native style** – Same mental model as frontend
- **Adequate for simple layouts** – MVP uses single-column ATS-friendly format

**Trade-off:** For complex multi-column layouts in future, Playwright may be needed.

### 15.4 Why Session Storage Instead of a Database for MVP?

- **Zero infrastructure** – No database setup, no migrations
- **User privacy** – No stored PII on the server
- **Simpler deployment** – No external services to configure
- **Adequate for single-session use** – Users come, process, download, leave

**Trade-off:** No persistence means users lose work if they close the browser. If retention or history is needed post-MVP, add Supabase or SQLite.

### 15.5 Why Separate Prompts Instead of One Mega-Prompt?

- **Lower token usage** – Each prompt only receives relevant context
- **Easier debugging** – Isolate failures to a specific prompt
- **Better output control** – Each prompt requests a specific structured schema
- **Maintainability** – Modify one engine without affecting others
- **Parallelization** – Resume parsing and JD parsing can happen concurrently

### 15.6 Why a Weighted Scoring Algorithm Instead of Pure LLM Scoring?

- **Explainability** – Weighted formula can be broken down and explained
- **Consistency** – Same inputs always produce same score (LLM scores may vary)
- **Transparency** – Users can see exactly what contributed to the score
- **Hybrid approach** – Use algorithmic scoring as base, LLM for qualitative explanation

The formula (subject to tuning):

```
overallScore =
  0.40 × skillCoverageScore +
  0.25 × responsibilityAlignmentScore +
  0.15 × keywordScore +
  0.10 × seniorityScore +
  0.10 × experienceYearsScore
  - 0.05 × penaltyForCriticalMissingRequirements
```

---

> **End of Architecture Document**
>
> This document is a living reference. As the project evolves through each phase, update this document to reflect architectural decisions, new services, and refinements.