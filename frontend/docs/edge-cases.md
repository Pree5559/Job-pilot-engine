# Resume Shapeshifter — Edge Cases by Phase

> **Document Version:** 1.0  
> **Last Updated:** 2026-05-23  
> **Purpose:** Reference for developers during implementation. Each phase lists the edge cases to handle while coding. Consult this file alongside `docs/implementation-plan.md`.

---

## Table of Contents

1. [General Edge Cases (All Phases)](#1-general-edge-cases-all-phases)
2. [Phase 1: Static Prototype Edge Cases](#2-phase-1-static-prototype-edge-cases)
3. [Phase 2: LLM Integration Edge Cases](#3-phase-2-llm-integration-edge-cases)
4. [Phase 3: PDF Export Edge Cases](#4-phase-3-pdf-export-edge-cases)
5. [Phase 4: Validation & Guardrails Edge Cases](#5-phase-4-validation--guardrails-edge-cases)
6. [Phase 5: Polish & Demo Readiness Edge Cases](#6-phase-5-polish--demo-readiness-edge-cases)
7. [Cross-Phase Testing Scenarios](#7-cross-phase-testing-scenarios)

---

## 1. General Edge Cases (All Phases)

These edge cases apply throughout the project regardless of phase.

| #  | Edge Case | Expected Behavior | Priority |
|----|-----------|-------------------|----------|
| E1 | User opens app on an unsupported browser (IE11, old Safari) | Show graceful degradation message: "Please use Chrome, Firefox, or Edge for the best experience." | Low |
| E2 | User has JavaScript disabled | Show `<noscript>` fallback: "This application requires JavaScript to function." | Medium |
| E3 | User navigates directly to `/analysis` or `/export` without data | Redirect to `/` with a message: "Please paste your resume and job description first." | High |
| E4 | Browser back/forward navigation during API processing | Show warning: "You have an active analysis in progress. Leaving will cancel it." | Medium |
| E5 | User double-clicks "Analyze" or "Generate" button | Disable button immediately on first click; show loading state; ignore subsequent clicks | High |
| E6 | User refreshes the page during processing | Loss of in-progress state (no persistence in MVP); redirect to `/` with message: "Session was reset. Please start again." | Medium |
| E7 | Screen reader encounters loading states | Use `aria-live="polite"` region that announces status changes | Medium |
| E8 | Very long session (>1 hour idle) | No session timeout in MVP—acceptable; user might need to re-enter data | Low |

---

## 2. Phase 1: Static Prototype Edge Cases

### 2.1 Project Scaffolding & Setup

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P1-1 | `npx create-next-app` fails due to Node version mismatch | Error: "Node.js 18+ is required. Run `node --version` to check your version." | Blocking |
| P1-2 | `npm install` fails due to network or permission issues | Show command-line error; suggest `npm cache clean --force` or running terminal as admin | Blocking |
| P1-3 | Shadcn UI init prompts for existing `components.json` | Answer "yes" to overwrite; if conflict persists, manually merge | Low |
| P1-4 | TypeScript strict mode catches unexpected type issues | Fix all type errors before proceeding; do not use `any` or `@ts-ignore` | High |

### 2.2 Zod Schemas

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P1-5 | Schema receives `null` or `undefined` for a required field | Zod throws `ZodError` with clear message; schema validation fails gracefully | High |
| P1-6 | `skills` array is empty | Schema accepts empty array; UI should handle showing "No skills listed" | Medium |
| P1-7 | `experience` array is empty | Schema accepts empty array; UI should handle without rendering an empty section | Medium |
| P1-8 | `bullets` within an experience entry is empty | Schema accepts empty array; UI should show a placeholder "No bullet points listed" | Medium |
| P1-9 | `date` fields contain non-standard formats ("2000-Present", "May 2020", "2000-2005") | Schema uses `z.string().optional()`; no date parsing in MVP; UI displays raw string | Medium |
| P1-10 | Contact object is completely empty `{}` | All fields optional; UI shows "Contact information not provided" | Low |
| P1-11 | Degrees with special characters (PhD, M.Sc., B.Eng.) | Schema accepts any string; no validation on degree names | Low |
| P1-12 | URL fields (linkedin, website) contain invalid URLs | Schema uses `z.string().optional()`; no URL validation in MVP | Low |

### 2.3 Mock Data

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P1-13 | Mock resume has 10+ years of experience listed | Mock data should include varied tenure to test UI rendering | Medium |
| P1-14 | Mock JD has extremely long list of required skills (20+) | UI should handle overflow (scrollable or wrapped badges) | Medium |
| P1-15 | Mock gap analysis has 0 gaps | UI should show "No gaps found" or "Your resume covers all key requirements" | Medium |
| P1-16 | Mock JD has no preferred skills (empty array) | UI should hide "Preferred Skills" section or show "None specified" | Medium |
| P1-17 | Mock tailored resume has no changes (all confidence = high, no risk flags) | UI should indicate no rewrites were needed | Low |

### 2.4 Input Components

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P1-18 | User submits empty resume textarea | "Analyze" button disabled until text is entered | High |
| P1-19 | User submits empty JD textarea | "Analyze" button disabled until text is entered | High |
| P1-20 | User pastes only whitespace | Trim whitespace; treat as empty; keep button disabled | High |
| P1-21 | User pastes extremely long text (50,000+ chars) | Allow paste but show character count warning: "Your input is very long. Consider using a shorter resume/JD." | Medium |
| P1-22 | User types in textarea very fast | No debounce in Phase 1; store raw text on every keystroke (acceptable for MVP) | Low |
| P1-23 | User pastes content with HTML formatting (rich text from Word, Google Docs) | Accept as plain text (textarea strips HTML automatically) | Low |
| P1-24 | User uses browser autofill to fill textareas | Accept autofilled content; button enables if content is non-empty | Low |

### 2.5 Components & Rendering

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P1-25 | ScoreCard receives `score = 0` | Show red "0" with "No match" label; do not show empty ring | Medium |
| P1-26 | ScoreCard receives `score = 100` | Show green "100" with "Perfect match" label | Low |
| P1-27 | ScoreBreakdown receives empty `subscores` object | Show "Score breakdown not available" placeholder | Medium |
| P1-28 | JDSummary receives JD with no `company` name | Show "Company not specified" instead of empty field | Medium |
| P1-29 | GapAnalysis receives empty gaps array | Show "No gaps found—great match!" message | Medium |
| P1-30 | BulletRewriter receives experience with 0 entries | Show "No experience entries to display" message | Medium |
| P1-31 | SideBySideDiff receives empty `original` or empty `tailored` | Show an empty column with "No content to display" | Medium |
| P1-32 | LoadingState receives all stages as "done" | Show all checkmarks; transition to next UI state immediately | Low |
| P1-33 | LoadingState receives all stages as "pending" | Show gray circles for all stages; no animation | Low |
| P1-34 | ErrorBoundary catches a rendering error | Show fallback UI: "Something went wrong. [Retry] [Go back to home]" | High |
| P1-35 | SideBySideDiff overflows vertically with 20+ bullets per experience | Enable scroll within each column; fix column heights to viewport | Medium |
| P1-36 | ScoreCard number animation (if implemented) starts at wrong value | Animate from 0 to target score over 1 second | Low |

### 2.6 Routing & Navigation

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P1-37 | User clicks browser back from `/analysis` to `/` | Store state (if any) is preserved; user can go back without losing data | Medium |
| P1-38 | User tries to access `/export` via direct URL without visiting `/analysis` | Redirect to `/` with message: "No export data available. Please analyze a resume first." | High |
| P1-39 | Multiple rapid navigation clicks cause double render | React batches updates; acceptable but should not duplicate API calls (no API yet) | Low |

---

## 3. Phase 2: LLM Integration Edge Cases

### 3.1 LLM Client

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P2-1 | OpenAI API key is missing or invalid | Return 401 error: "API key is missing or invalid. Check your `.env.local` file." | Blocking |
| P2-2 | OpenAI API returns 429 (rate limited) | Retry after 1s → 2s → 4s; if still failing, return error: "Service is temporarily unavailable. Please wait and try again." | High |
| P2-3 | OpenAI API returns 500 (server error) | Retry with same backoff; if persistent, return error: "AI service encountered an error. Please try again later." | High |
| P2-4 | OpenAI API returns empty response body | Retry once; if still empty, return error: "Received empty response from AI service." | High |
| P2-5 | LLM response contains valid JSON but fields are wrong types (e.g., `overallScore` is a string "85" instead of number 85) | Zod catches type mismatch; retry once; if still fails, return validation error with specific field name | High |
| P2-6 | LLM response JSON is truncated (incomplete output) | `JSON.parse` fails; retry with 2 attempts; if still failing, return "AI response was incomplete. Please try again." | High |
| P2-7 | LLM response contains extra unexpected fields (e.g., `"optionalBonusField": "value"`) | Zod's `.strict()` or `.passthrough()`—choose `.strict()` to reject unknowns; log warning | Medium |
| P2-8 | LLM response is valid but nonsensical (e.g., `overallScore: 100` with `explanation: ""`) | Validation passes; rely on truthfulness guardrails (Phase 4) | Low |
| P2-9 | Network timeout during LLM call (>30 seconds) | Catch timeout error; retry once; if still timeout, return "The AI service is taking too long. Please try again." | High |
| P2-10 | Token limit exceeded on input (resume/JD too long) | Truncate input to model's context window (e.g., 128K tokens for GPT-4o-mini); show warning: "Your input was truncated to fit within the AI's context limit." | Medium |
| P2-11 | Token limit exceeded on output (model can't return full response) | Increase `max_tokens` parameter; if still failing, split request into smaller chunks | Medium |
| P2-12 | API call succeeds but takes >15 seconds | Show loading state with "Still processing... this may take a moment." after 10 seconds | Medium |
| P2-13 | `response_format: { type: "json_object" }` is not supported by the model (e.g., older models) | Fall back to manual JSON extraction from markdown code blocks | Medium |

### 3.2 Prompt Edge Cases

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P2-14 | JD Extraction: JD text contains no job title (e.g., it's a company overview page) | Return empty string for `jobTitle`; set `seniorityLevel` to "unknown" | Medium |
| P2-15 | JD Extraction: JD text lists 50+ required skills | Return all as array; UI handles overflow via scrollable badge list | Low |
| P2-16 | JD Extraction: JD mentions no skills explicitly (vague JD) | Return empty arrays; scoring will be low; gap analysis shows "JD does not specify required skills" | Medium |
| P2-17 | JD Extraction: JD is in a language other than English | Prompt instructs to extract as-is; no translation attempted in MVP | Low |
| P2-18 | Resume Parser: Resume uses non-standard section names ("Career Highlights", "Tech Stack", "Certifications and Training") | LLM prompt instructed to handle flexibly; map to closest standard section | Medium |
| P2-19 | Resume Parser: Resume has no "Skills" section (skills embedded in experience bullets) | Skills array may be empty; scoring accounts for skills found in bullets | Medium |
| P2-20 | Resume Parser: Resume contains tables or columns (parsed text is garbled) | Return whatever text the parser extracted; show warning: "Your resume may contain formatting that was lost during parsing. Please review the extracted content." | High |
| P2-21 | Resume Parser: Resume is a single line of comma-separated items | Parse as best as LLM can; likely low-quality extraction; warn user | Medium |
| P2-22 | Match Scoring: Resume and JD are identical documents | Score should be 100; explanation should note identical content | Low |
| P2-23 | Match Scoring: Resume and JD share no skills or keywords | Score close to 0; gap analysis should list all JD requirements as missing | High |
| P2-24 | Bullet Rewriter: Original bullet is already optimal (no improvement needed) | Return same bullet with confidence: "high" and changeReason: "Already well-aligned with JD" | Medium |
| P2-25 | Bullet Rewriter: Original bullet contains fabricated metrics (numbers that seem unrealistic) | LLM should preserve as-is (not flag—that's Phase 4's job) | Low |
| P2-26 | Bullet Rewriter: Experience entry has 0 bullets | Skip that entry in rewriting; include in tailored resume with empty bullets array | Medium |
| P2-27 | Gap Analysis: Resume has no gaps (covers all JD requirements) | Return empty gaps array; UI shows "No significant gaps found" | Medium |
| P2-28 | Gap Analysis: JD has no requirements explicitly listed (vague text) | Return "JD does not specify clear requirements for gap analysis" message | Medium |

### 3.3 Service Layer Edge Cases

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P2-29 | `parseResume` receives empty string | Throw `ParseError("Resume text is empty")` immediately—don't call LLM | High |
| P2-30 | `parseResume` receives text < 50 characters (likely incomplete) | Throw `ParseError("Resume text is too short (<50 chars). Please paste your complete resume.")` | High |
| P2-31 | `parseJD` receives text containing URL instead of job description | Accept as plain text (LLM will try to parse); but URL extraction not supported in MVP | Low |
| P2-32 | `computeScore` receives mismatched data (e.g., resume for a nurse, JD for a truck driver) | Score will be near 0; explainable via low skill/keyword coverage scores | Medium |
| P2-33 | `tailorResume` receives a resume with 15+ experience entries | Process all entries; may take longer but should not fail | Medium |
| P2-34 | `analyzeGaps` receives JD with 0 extracted skills | Return "Could not extract skills from JD" message; gaps array empty | Medium |

### 3.4 API Route Edge Cases

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P2-35 | POST request body is malformed JSON | Return 400: "Invalid JSON in request body." | High |
| P2-36 | POST request has missing required fields | Zod validation catches; return 400 with specific field errors | High |
| P2-37 | POST request has extra unknown fields | Zod `.strict()` rejects; return 400 "Unknown field: [field name]" | Medium |
| P2-38 | POST request content-type is not `application/json` | Next.js parses automatically; if fails, return 415 "Unsupported Media Type" | Medium |
| P2-39 | POST request body exceeds size limit (default 1MB in Next.js) | Return 413 "Request body too large. Please reduce the resume or JD size." | Medium |
| P2-40 | LLM service takes >30 seconds; API route times out (Vercel hobby: 10s) | Return 504 "Request timed out. Please try again with shorter content." Set longer timeout if possible | High |
| P2-41 | Multiple rapid successive API calls from same client | No rate limiting in MVP; acceptable but monitor usage | Low |

### 3.5 Store & Frontend Integration Edge Cases

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P2-42 | API call fails after user has already seen partial results | Show inline error for the failed step; do not clear already-loaded data | High |
| P2-43 | User clicks "Analyze" while a previous analysis is still loading | Show warning: "An analysis is already in progress."; disable button | High |
| P2-44 | User pastes new resume text after already seeing results | Reset all downstream data (score, gaps, tailored); show "Your input changed. Click 'Analyze' to re-run." | Medium |
| P2-45 | User clicks "Generate Tailored Resume" while gaps are still loading | Show error: "Please wait for the gap analysis to complete."; disable button | Medium |

---

## 4. Phase 3: PDF Export Edge Cases

### 4.1 React-PDF / Library Selection

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P3-1 | `@react-pdf/renderer` fails to install (Node version conflict) | Switch to Playwright approach; log error: "Falling back to Playwright PDF generation." | Medium |
| P3-2 | Playwright Chromium download fails (network issue) | Error: "Failed to download PDF rendering engine. Check your network connection." | Medium |
| P3-3 | Both React-PDF and Playwright fail | Skip PDF generation; show error in UI: "PDF generation is currently unavailable." | High |

### 4.2 Tailored Resume PDF

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P3-4 | Tailored resume has no summary | Skip summary section; do not show empty space | Medium |
| P3-5 | Tailored resume has 0 skills (empty array) | Show "Skills: Not specified" | Medium |
| P3-6 | Tailored resume has 50+ skills | List all skills in comma-separated format; wrap to next line | Medium |
| P3-7 | Experience entry has no end date (current job) | Show "Present" for end date | Low |
| P3-8 | Experience entry has no company name | Show "Company not specified" | Low |
| P3-9 | Resume content exceeds one page | Auto-add pages as needed; React-PDF handles pagination via `wrap={false}` | Medium |
| P3-10 | Unicode/special characters (e.g., "é", "ü", Chinese characters) | Helvetica supports basic Latin; non-Latin chars may render as boxes. Use `@react-pdf/font` to load a Unicode font if needed. | Medium |
| P3-11 | Content is cut off at page break | Use `wrap={true}` on sections; `fixed={true}` on headers | High |

### 4.3 Comparison PDF

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P3-12 | Original and tailored resumes are identical (no changes suggested) | Show identical content in both columns; highlight row says "No changes needed" | Low |
| P3-13 | Score difference is 0 (original = tailored) | Show both bars at same length; label "Score unchanged" | Medium |
| P3-14 | Score comparison bars show original > tailored (degradation) | Unlikely but possible; show "Tailored score lower—review changes" warning | High |
| P3-15 | Gap analysis has 20+ gaps | List all; paginate to additional pages if needed | Medium |
| P3-16 | JD summary has no required skills (empty) | Show "No required skills extracted from JD" | Low |
| P3-17 | Two-column layout causes text overflow on small PDF page | Reduce font size slightly (10pt → 9pt) if content is long | Medium |
| P3-18 | Highlight colors print poorly in grayscale | Use patterns/symbols or distinct shades (light gray for green, dotted underline for yellow) | Low |

### 4.4 API Route & Download

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P3-19 | PDF generation takes >20 seconds | Show "Generating PDF..." progress bar; consider adding a "We'll email you the PDF" option (out of MVP scope) | Medium |
| P3-20 | Browser blocks pop-up during download | Use `<a download>` attribute with programmatic click instead of `window.open` | High |
| P3-21 | User clicks download multiple times | Disable button after first click; show "Downloading..." state | High |
| P3-22 | Download fails mid-stream (network disconnect) | Show error: "Download failed. Please check your connection and try again." | Medium |
| P3-23 | Downloaded PDF filename collides with previous download | Use timestamp in filename: `resume-shapeshifter-comparison-2026-05-23-171500.pdf` | Low |
| P3-24 | PDF file is 0 bytes (generation error) | Do not initiate download; show error message instead | High |
| P3-25 | Large PDF (>10MB) causes long download time | Show file size estimate before download; consider compressing | Low |

---

## 5. Phase 4: Validation & Guardrails Edge Cases

### 5.1 Truthfulness Service

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P4-1 | Original resume has no employers (self-employed/freelancer) | Company field may be empty; `new_employer` check should not flag if both are empty | High |
| P4-2 | Original resume has variant company names ("Google Inc." vs "Google") | Normalize company names (lowercase, strip "Inc", "LLC", "Corp") before comparing | High |
| P4-3 | Tailored resume adds a skill that IS in the original resume's experience bullets but NOT in the skills section | Flag as `new_technology` with lower severity; suggestion: "Consider adding this to your skills section if it's part of your experience." | Medium |
| P4-4 | Original resume has no metrics; tailored adds none | No `inflated_metric` risk flags; normal | Low |
| P4-5 | Original resume has "Led a team of 5"; tailored says "Led a team of 5 across 10 projects" | `inflated_metric` flag: metrics in tailored not present in original | High |
| P4-6 | Original says "Familiar with Python"; tailored says "Expert in Python" | `expert_claim_unsupported` flag triggered | High |
| P4-7 | Tailored resume changes company name from "ABC Corp" to "ABC Corporation" | Normalize before comparison; should not flag (same entity) | Medium |
| P4-8 | Original has no education section; tailored adds none | No `new_credential` flag; normal | Low |
| P4-9 | Original has "Bachelor's in CS"; tailored adds "Master's in CS" | `new_credential` flag triggered | High |

### 5.2 Guardrail Integration

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P4-10 | Every bullet triggers a risk flag | Show all flags; user must confirm each; export remains blocked until all confirmed | High |
| P4-11 | No bullets trigger any risk flag | All confidence high; no confirmation needed; export button active | Low |
| P4-12 | Risk flagging causes the entire experience entry to be flagged | Show flags per bullet, not per entry; user accepts/rejects individually | Medium |
| P4-13 | Confirmation state is lost on page refresh | Session storage saves confirmed bullet IDs; restore on load | Medium |

### 5.3 UI: Confidence & Risk Display

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P4-14 | 50+ bullets all have low confidence | Show a "Review all low-confidence changes" summary banner; bulk confirm option | Medium |
| P4-15 | User hovers over confidence badge on mobile | Show tooltip on tap instead of hover; use `click` event for mobile | Medium |
| P4-16 | Risk flag description is very long (>200 chars) | Show truncated description with "Show more" link | Low |
| P4-17 | User rejects a rewrite; original bullet is restored | Tailored resume now contains original bullet; gap analysis still reflects original gaps | High |
| P4-18 | User partially confirms (confirms some bullets, rejects others) | Exported PDF uses confirmed tailored bullets + rejected originals; clearly labeled per-bullet | High |

### 5.4 User Confirmation Flow

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P4-19 | User closes browser before confirming all changes | Session state lost; next load starts fresh (MVP limitation) | Low |
| P4-20 | User rejects ALL changes | Export still allowed; exported PDF shows original resume with gaps analysis; message: "No tailoring changes were accepted." | Medium |
| P4-21 | "Confirm all changes" button is clicked without reviewing each bullet | Show a confirmation dialog: "Are you sure you want to accept all changes? You can review individual bullets in the side-by-side view." | High |
| P4-22 | User switches tabs while confirmation dialog is open | Dialog remains open on return; no timeout in MVP | Low |

### 5.5 Error Boundaries

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P4-23 | Error boundary catches error in ScoreCard | Rest of page (gap analysis, side-by-side) remains functional; ScoreCard shows "Score unavailable" | High |
| P4-24 | Error boundary catches error in SideBySideDiff | User can still export PDF? No—PDF relies on this data; show "We're unable to display the comparison. Please try regenerating." | High |
| P4-25 | Multiple error boundaries trigger simultaneously | Each shows its own fallback; no cascading failures | Medium |
| P4-26 | "Retry" button inside error boundary fails again | Error boundary should not loop; show "Retry failed. [Go to home] [Contact support]" | High |

### 5.6 LLM Retry & Validation

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P4-27 | LLM fails 3 retries in a row | Return error to user: "The AI service is currently unable to process your request. Please try again in a few minutes." | High |
| P4-28 | LLM succeeds on retry 2 but takes 10 seconds | Accept the result; inform user "Processing completed after a delay." | Medium |
| P4-29 | Zod validation passes but data is semantically wrong (e.g., `skills: ["React", "React", "React"]` duplicates) | Log warning; deduplicate in post-processing | Low |
| P4-30 | Zod validation catches field value out of range (e.g., `overallScore: 150`) | Retry; if still fails, clamp to 0-100 and log warning | Medium |

---

## 6. Phase 5: Polish & Demo Readiness Edge Cases

### 6.1 Animations & Transitions

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P5-1 | User has `prefers-reduced-motion` enabled (accessibility setting) | Disable all animations; use instant transitions | High |
| P5-2 | Animation library (framer-motion) fails to load | Fall back to CSS transitions or no animations; core functionality unaffected | Medium |
| P5-3 | Score count-up animation runs before data is loaded | Only animate after data is available; show spinner during loading | High |
| P5-4 | Multiple elements animate simultaneously causing jank | Use `will-change` sparingly; consider staggering animations | Medium |

### 6.2 Responsive Design

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P5-5 | Viewport width 320px (small mobile) | Single column; smaller font (14px); buttons full-width; side-by-side diff stacked | High |
| P5-6 | Viewport width 1920px (large desktop) | Full multi-column; comfortable spacing; max-width container (1200px) | Medium |
| P5-7 | Viewport height < 500px (landscape mobile) | Reduce header size; minimize padding; content should be scrollable | Medium |
| P5-8 | Tablet in split-screen mode (~600px width) | Two-column layout collapses gracefully to single column on < 768px | High |
| P5-9 | Browsers with zoom set to 200% | Layout should not break; content may wrap but should remain readable | Medium |
| P5-10 | Touch targets on mobile too small for easy tapping | Minimum 44×44px tap targets on all buttons and interactive elements | High |

### 6.3 Sample Data & Demo Mode

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P5-11 | User clicks "Try with sample data" then edits the text | Accept edits; treat as custom input; "Try with sample data" button becomes "Reset to sample" | High |
| P5-12 | User clicks "Try with sample data" multiple times | Do not append duplicate text; reset to fresh sample on each click | Medium |
| P5-13 | Sample resume is too generic (not representative of target user) | Use a realistic sample (e.g., mid-career software engineer); represent common use case | Medium |

### 6.4 Download & Format Options

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P5-14 | Markdown export produces unformatted text | Use a simple template with `#`, `##`, `-`, `**bold` formatting | Medium |
| P5-15 | User tries to download markdown but browser can't handle `.md` extension | Use `.md` with `Content-Type: text/markdown`; browser will download as file | Low |
| P5-16 | "Download All" button downloads 2+ files | Trigger multiple downloads sequentially (first PDF, then second, then .md); or zip all files (out of MVP scope) | Medium |

### 6.5 Accessibility

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P5-17 | Screen reader user navigates to score card | Announce: "Match score: 78 out of 100. Skill coverage score: 85." | High |
| P5-18 | Screen reader user encounters loading state | Use `aria-live="polite"`; announce: "Analyzing resume." / "Parsing complete." / "Scoring in progress." | High |
| P5-19 | Keyboard user cannot Tab to 'Analyze' button | Ensure button is in natural Tab order; remove `tabindex="-1"` if present | High |
| P5-20 | Color-blind user cannot distinguish score colors (red/green) | Use text labels + patterns/icon in addition to color (e.g., "78% ⬤ High" instead of just green) | High |
| P5-21 | Focus indicator is missing or hard to see | Use default browser focus ring or custom 2px blue outline; never set `outline: none` without replacement | High |
| P5-22 | Screen reader reads error messages without context | Use `role="alert"` on error messages for immediate announcement | Medium |

### 6.6 Error Messages

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P5-23 | API returns a technical error message (e.g., Zod error details) | Never show raw error details to user; log to console; show user-friendly message | High |
| P5-24 | Multiple errors occur simultaneously | Show the first blocking error; allow retry; if retry also fails, show "Multiple errors occurred. Please start over." | Medium |
| P5-25 | Error message contains user data (PII from resume) | Sanitize error messages; never include user content in error displays | High |

### 6.7 Performance

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P5-26 | Cache grows unbounded (in-memory Map for API responses) | Limit cache to 50 entries (LRU eviction); or set TTL of 30 minutes | Medium |
| P5-27 | Debounce causes 500ms delay on every keystroke | Only debounce API calls, not UI updates; local state updates immediately | Medium |
| P5-28 | Lazy-loaded SideBySideDiff component shows loading flash | Use skeleton placeholder matching component dimensions | Medium |
| P5-29 | Large bundle size due to Shadcn UI components | Import only used components; run `next build` analysis to identify bloat | Medium |

### 6.8 Acceptance Tests

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P5-30 | Playwright test runs on CI without Chromium installed | Install Chromium in CI pipeline; if install fails, skip PDF tests | Medium |
| P5-31 | Test times out waiting for LLM response (real LLM is slow) | Mock LLM responses in tests; only use real LLM in manual QA | High |
| P5-32 | Test fails due to flaky network conditions | Implement retry in test (3 attempts); log detailed failure context | Medium |
| P5-33 | Test environment has no GPU (headless CI) | Use `chromium.launch({ headless: true })`; no GPU needed for Playwright tests | Low |

### 6.9 Demo Script

| #  | Edge Case | Expected Behavior | Severity |
|----|-----------|-------------------|----------|
| P5-34 | Live demo fails due to API key not set on demo machine | Have a pre-recorded video fallback; or hardcode a demo key for the showcase | High |
| P5-35 | Demo machine has slow internet; loading takes >30 seconds | Show pre-cached results or use mock data for demo mode | High |
| P5-36 | Audience asks about a feature that's out of MVP scope | Respond: "That's on our roadmap for post-MVP. Today I'll show the core flow." | Low |

---

## 7. Cross-Phase Testing Scenarios

These scenarios span multiple phases and should be tested end-to-end.

### 7.1 Full Happy Path

| Step | Expected Result | Phases Covered |
|------|-----------------|----------------|
| Paste a realistic resume and JD | Both inputs accept text; "Analyze" button enables | P1 |
| Click "Analyze" | Loading state shows: parsing resume → parsing JD → scoring | P2 |
| Score card displays with breakdown | 0–100 score with sub-scores and explanation | P1, P2 |
| Gap analysis shows missing skills | Gaps listed with importance badges and suggested actions | P1, P2 |
| Click "Generate Tailored Resume" | Loading state shows; tailored resume appears with per-bullet rewrites | P2 |
| Low-confidence bullets show risk flags | Risk flag icons and descriptions visible | P4 |
| Confirm all changes | Export button enables | P4 |
| Click "Export" | PDF download starts; file is valid PDF | P3 |
| Open PDF | Side-by-side comparison, score bars, gaps, disclaimer visible | P3 |

### 7.2 Error Recovery Path

| Step | Expected Result | Phases Covered |
|------|-----------------|----------------|
| Paste resume, click Analyze, disconnect network during processing | Error shown for the failing step; other steps' data preserved | P2 |
| Click "Retry" on the failed step | That step re-runs; other steps not affected | P2 |
| Network restored; retry succeeds | Flow continues to next step | P2 |
| Some bullets flagged low confidence | User rejects one rewrite; original bullet restored | P4 |
| Export PDF | PDF uses accepted tailored bullets + rejected original | P3, P4 |

### 7.3 Edge Case: Minimal Resume

| Step | Expected Result | Phases Covered |
|------|-----------------|----------------|
| Paste a resume with only name, email, and 2 bullets | Parsing succeeds; many gaps; low score | P1, P2 |
| Generate tailored resume | Bullets rewritten but limited by sparse input | P2 |
| Export PDF | PDF is short but valid; disclaimer present | P3 |

### 7.4 Edge Case: Overly Long Content

| Step | Expected Result | Phases Covered |
|------|-----------------|----------------|
| Paste a 10-page resume | Parsing may truncate; warning shown | P2 |
| Paste a JD with 100 required skills | JD parsing succeeds; scoring calculation handles large arrays | P2 |
| Generate tailored resume | Many bullets to rewrite; may take longer | P2 |
| Export PDF | Multi-page PDF; proper pagination | P3 |

### 7.5 Edge Case: Zero Tailoring Impact

| Step | Expected Result | Phases Covered |
|------|-----------------|----------------|
| Resume already perfectly matches JD | Score is high (80+); few gaps; bullets mostly unchanged | P1, P2 |
| Generate tailored resume | Most bullets have high confidence; changeReason: "Already well-aligned" | P2, P4 |
| Export comparison PDF | Both columns nearly identical; "Score unchanged" shown | P3 |

---

> **End of Edge Cases Document**
>
> This document should be consulted during each phase's implementation and testing. Add new edge cases as they are discovered during development. Code review checklist: verify each relevant edge case has been handled before marking a phase complete.