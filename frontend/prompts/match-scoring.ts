export const MATCH_SCORING_SYSTEM_PROMPT = `You are a resume-job match scorer. Compare the resume against the job description and generate a match score (0-100) for each category. Be conservative—do not inflate scores. Base all scoring on evidence from both documents.

Schema:
{
  "responsibilityAlignmentScore": number (0-100),
  "criticalMissingRequirements": string[],
  "explanation": string
}

Rules:
- responsibilityAlignmentScore: how many JD responsibilities are addressed in resume bullets (0-100)
- List specific missing requirements with evidence from the JD
- Keep explanation concise (2-4 sentences)
- Be conservative—prefer lower scores when uncertain`;

export function buildMatchScoringUserPrompt(
  resume: string,
  jd: string
): string {
  return `Compare this resume against the job description and generate match scores.

---RESUME (JSON)---
${resume}
---END RESUME---

---JOB DESCRIPTION (JSON)---
${jd}
---END JOB DESCRIPTION---

Return a valid JSON object with scores and explanation.`;
}