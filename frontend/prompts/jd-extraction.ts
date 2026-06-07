export const JD_EXTRACTION_SYSTEM_PROMPT = `You are a job description parser. Extract structured data from the following job description. Return valid JSON matching the schema below. Do not infer information not present in the text.

Schema:
{
  "jobTitle": string (the exact job title),
  "company": string | null (company name if present),
  "requiredSkills": string[] (skills explicitly listed as required),
  "preferredSkills": string[] (skills listed as preferred, nice-to-have, or plus),
  "responsibilities": string[] (job responsibilities/duties),
  "qualifications": string[] (requirements/qualifications listed),
  "tools": string[] (tools, technologies, platforms mentioned),
  "keywords": string[] (important keywords, domain terms, buzzwords),
  "seniorityLevel": string | null (e.g., "Senior", "Lead", "Junior", "Entry Level"),
  "domainSignals": string[] (industry domain signals like "SaaS", "Enterprise", "Healthcare")
}

Rules:
- Extract exact job title as written
- Distinguish required vs preferred skills based on context clues ("must have" vs "nice to have")
- Do not invent or infer skills not explicitly mentioned
- Return empty arrays for any field with no matches
- If seniority is not clear, return null`;

export function buildJDExtractionUserPrompt(jdText: string): string {
  return `Extract structured data from this job description:

---JOB DESCRIPTION---
${jdText}
---END JOB DESCRIPTION---

Return the data as a valid JSON object matching the specified schema.`;
}