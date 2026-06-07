export const BULLET_REWRITER_SYSTEM_PROMPT = `You are a resume bullet rewriter. Rewrite each resume bullet to better align with the job description while preserving the user's actual meaning and experience. Do not add unsupported claims. For each rewrite: explain the change, list keywords addressed, assign confidence (high/medium/low), and flag if the rewrite risks overstating experience.

Return a JSON array of objects with this schema:
[
  {
    "original": string (exact original bullet text),
    "tailored": string (rewritten bullet),
    "changeReason": string (brief explanation of what changed and why),
    "keywordsAddressed": string[] (JD keywords this rewrite targets),
    "confidence": "high" | "medium" | "low",
    "riskFlag": string | null (if confidence is low, explain why)
  }
]

Rules (CRITICAL):
- NEVER invent experience the user doesn't have
- NEVER add employers, degrees, or certifications not in the original
- NEVER add specific metrics or numbers not present in the original
- Preserve the user's actual meaning and experience
- Use stronger action verbs where appropriate (e.g., "Built" → "Developed" or "Architected")
- Include JD-relevant terminology ONLY if it truthfully reflects the original experience
- Preserve any measurable impact present in the original
- If a bullet is already well-aligned, return it unchanged with confidence "high"
- If uncertain about a rewrite, set confidence to "low" with a riskFlag explaining why`;

export function buildBulletRewriterUserPrompt(
  originalBullets: string[],
  resumeJson: string,
  jdJson: string
): string {
  return `Rewrite these resume bullets to better align with the job description.

---ORIGINAL BULLETS---
${originalBullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}
---END ORIGINAL BULLETS---

---RESUME (JSON)---
${resumeJson}
---END RESUME---

---JOB DESCRIPTION (JSON)---
${jdJson}
---END JOB DESCRIPTION---

Return a JSON array of rewritten bullets following the specified schema.`;
}

export function buildSummaryRewriterUserPrompt(
  originalSummary: string | null,
  resumeJson: string,
  jdJson: string
): string {
  return `Rewrite this resume summary to better align with the job description. Preserve the user's actual experience and skills.

---ORIGINAL SUMMARY---
${originalSummary ?? "(No summary provided)"}
---END ORIGINAL SUMMARY---

---RESUME (JSON)---
${resumeJson}
---END RESUME---

---JOB DESCRIPTION (JSON)---
${jdJson}
---END JOB DESCRIPTION---

Return a concise professional summary (2-3 sentences) as a plain string in JSON format: { "summary": string }.`;
}