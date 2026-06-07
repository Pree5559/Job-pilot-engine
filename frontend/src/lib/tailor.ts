import { callLLM } from "./llm-client";
import { TailoredResumeSchema } from "./schemas";
import { checkTruthfulness } from "./truthfulness";
import type {
  ResumeProfile,
  JobDescriptionProfile,
  MatchScore,
  TailoredResume,
  TailoredBullet,
} from "./types";
import { z } from "zod";
import {
  BULLET_REWRITER_SYSTEM_PROMPT,
  buildBulletRewriterUserPrompt,
  buildSummaryRewriterUserPrompt,
} from "../../prompts/bullet-rewriter";

const SummaryResponseSchema = z.object({
  summary: z.string(),
});

// More lenient schema that accepts null/empty values from LLM
const LenientBulletSchema = z.object({
  original: z.string().default(""),
  tailored: z.string().default(""),
  changeReason: z.string().default(""),
  keywordsAddressed: z.array(z.string()).default([]),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
  riskFlag: z.string().nullish(),
});

export async function tailorResume(
  resume: ResumeProfile,
  jd: JobDescriptionProfile,
  score: MatchScore
): Promise<TailoredResume> {
  const resumeJson = JSON.stringify(resume);
  const jdJson = JSON.stringify(jd);

  // 1. Rewrite summary if present
  let tailoredSummary: string | undefined;
  if (resume.summary) {
    try {
      const { data } = await callLLM({
        systemPrompt: BULLET_REWRITER_SYSTEM_PROMPT,
        userMessage: buildSummaryRewriterUserPrompt(
          resume.summary,
          resumeJson,
          jdJson
        ),
        schema: SummaryResponseSchema,
      });
      tailoredSummary = data.summary;
    } catch {
      tailoredSummary = resume.summary;
    }
  }

  // 2. Rewrite bullets for each experience entry
  const tailoredExperience = await Promise.all(
    resume.experience.map(async (exp) => {
      if (exp.bullets.length === 0) {
        return { company: exp.company, title: exp.title, bullets: [] };
      }

      try {
        const { data: bulletsRaw } = await callLLM({
          systemPrompt: BULLET_REWRITER_SYSTEM_PROMPT,
          userMessage: buildBulletRewriterUserPrompt(
            exp.bullets,
            resumeJson,
            jdJson
          ),
          schema: z.array(LenientBulletSchema),
        });

        const bullets: TailoredBullet[] = bulletsRaw.map((b: z.infer<typeof LenientBulletSchema>) => ({
          original: b.original,
          tailored: b.tailored,
          changeReason: b.changeReason,
          keywordsAddressed: b.keywordsAddressed,
          confidence: b.confidence,
          riskFlag: b.riskFlag ?? undefined,
        }));

        return {
          company: exp.company,
          title: exp.title,
          bullets,
        };
      } catch {
        // Fallback: return original bullets as-is if rewriting fails
        return {
          company: exp.company,
          title: exp.title,
          bullets: exp.bullets.map((b) => ({
            original: b,
            tailored: b,
            changeReason: "Kept original (rewrite failed)",
            keywordsAddressed: [],
            confidence: "high" as const,
          })),
        };
      }
    })
  );

  // 3. Reorder skills: JD required first, then preferred, then rest
  const jdRequiredLower = jd.requiredSkills.map((s) => s.toLowerCase());
  const jdPreferredLower = jd.preferredSkills.map((s) => s.toLowerCase());

  const requiredSkills = resume.skills.filter((s) =>
    jdRequiredLower.includes(s.toLowerCase())
  );
  const preferredSkills = resume.skills.filter(
    (s) =>
      jdPreferredLower.includes(s.toLowerCase()) &&
      !requiredSkills.includes(s)
  );
  const otherSkills = resume.skills.filter(
    (s) => !requiredSkills.includes(s) && !preferredSkills.includes(s)
  );

  const tailoredSkills = [...requiredSkills, ...preferredSkills, ...otherSkills];

  // 4. Run truthfulness guardrails
  let result: TailoredResume = {
    tailoredSummary,
    tailoredSkills,
    tailoredExperience,
  };

  // Validate against schema first
  result = TailoredResumeSchema.parse(result);

  // Run guardrail checks to adjust confidence and add risk flags
  const annotated = await checkTruthfulness(resume, result);
  return {
    ...annotated,
    tailoredExperience: annotated.tailoredExperience,
  };
}