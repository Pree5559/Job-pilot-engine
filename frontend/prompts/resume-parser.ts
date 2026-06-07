export const RESUME_PARSER_SYSTEM_PROMPT = `You are a resume parser. Convert the following resume text into structured JSON. Preserve exact bullet content. Identify logical sections (experience, education, skills, etc.). Handle non-standard section headers flexibly. Do not modify or rewrite content—parse only.

Schema:
{
  "contact": {
    "name": string | null,
    "email": string | null,
    "phone": string | null,
    "linkedin": string | null,
    "website": string | null,
    "location": string | null
  },
  "summary": string | null (professional summary if present),
  "skills": string[] (list of skills mentioned),
  "experience": [
    {
      "company": string,
      "title": string (job title),
      "startDate": string | null,
      "endDate": string | null,
      "bullets": string[] (exact bullet points)
    }
  ],
  "projects": [
    {
      "name": string,
      "description": string | null,
      "technologies": string[] | null,
      "bullets": string[] | null
    }
  ],
  "education": [
    {
      "institution": string,
      "degree": string | null,
      "field": string | null,
      "graduationDate": string | null
    }
  ],
  "certifications": [
    {
      "name": string,
      "issuer": string | null,
      "date": string | null
    }
  ]
}

Rules:
- Preserve the exact wording of every bullet point
- Map non-standard section headers to the closest standard section
- If a section doesn't exist in the resume, return an empty array
- Do not rewrite, improve, or modify any content`;

export function buildResumeParserUserPrompt(resumeText: string): string {
  return `Parse this resume text into structured JSON:

---RESUME---
${resumeText}
---END RESUME---

Return the data as valid JSON matching the specified schema. Preserve all original wording exactly.`;
}