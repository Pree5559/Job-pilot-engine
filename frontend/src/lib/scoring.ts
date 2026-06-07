import { callLLM } from "./llm-client";
import { z } from "zod";
import type { ResumeProfile, JobDescriptionProfile, MatchScore } from "./types";
import {
  MATCH_SCORING_SYSTEM_PROMPT,
  buildMatchScoringUserPrompt,
} from "../../prompts/match-scoring";

// Subset of MatchScore that the LLM provides (without algorithmically computed fields)
const LLMScoreSchema = z.object({
  responsibilityAlignmentScore: z.number().min(0).max(100),
  criticalMissingRequirements: z.array(z.string()),
  explanation: z.string(),
});

function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a.map((s) => s.toLowerCase().trim()));
  const setB = new Set(b.map((s) => s.toLowerCase().trim()));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

function computeSkillCoverage(
  resume: ResumeProfile,
  jd: JobDescriptionProfile
): number {
  const requiredScore =
    jaccardSimilarity(resume.skills, jd.requiredSkills) * 100;
  const preferredScore =
    jaccardSimilarity(resume.skills, jd.preferredSkills) * 100;
  return Math.round(requiredScore * 0.7 + preferredScore * 0.3);
}

function computeKeywordScore(
  resume: ResumeProfile,
  jd: JobDescriptionProfile
): number {
  if (jd.keywords.length === 0) return 0;

  const resumeText = [
    resume.summary ?? "",
    ...resume.skills,
    ...resume.experience.flatMap((e) => [e.title, ...e.bullets]),
  ]
    .join(" ")
    .toLowerCase();

  const matched = jd.keywords.filter((kw) =>
    resumeText.includes(kw.toLowerCase())
  ).length;

  return Math.round((matched / jd.keywords.length) * 100);
}

function computeSeniorityScore(
  resume: ResumeProfile,
  jd: JobDescriptionProfile
): number {
  if (!jd.seniorityLevel) return 50; // neutral

  const jdLevel = jd.seniorityLevel.toLowerCase();
  const resumeText = resume.experience
    .map((e) => e.title.toLowerCase())
    .join(" ");

  const senioritySignals = ["senior", "lead", "principal", "staff", "head"];
  const hasSeniority = senioritySignals.some((s) => resumeText.includes(s));

  if (
    (jdLevel.includes("senior") && hasSeniority) ||
    (jdLevel.includes("lead") && hasSeniority) ||
    (jdLevel.includes("junior") && !hasSeniority)
  ) {
    return 100;
  }
  if (hasSeniority) return 50;
  return 0;
}

function estimateExperienceYears(resume: ResumeProfile): number {
  let totalYears = 0;
  for (const exp of resume.experience) {
    const startYear = parseInt(exp.startDate?.match(/\d{4}/)?.[0] ?? "", 10);
    const endYear = parseInt(
      exp.endDate?.match(/\d{4}/)?.[0] ?? `${new Date().getFullYear()}`,
      10
    );
    if (!isNaN(startYear) && !isNaN(endYear) && endYear >= startYear) {
      totalYears += endYear - startYear;
    }
  }
  return totalYears || 5; // default 5 if can't determine
}

function estimateJDExperienceYears(jd: JobDescriptionProfile): number {
  const allText = [
    jd.jobTitle,
    ...jd.qualifications,
    ...jd.responsibilities,
  ].join(" ");
  const match = allText.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
  if (match) return parseInt(match[1], 10);
  return 5; // default 5
}

export async function computeScore(
  resume: ResumeProfile,
  jd: JobDescriptionProfile
): Promise<MatchScore> {
  // Algorithmic scores
  const skillCoverageScore = computeSkillCoverage(resume, jd);
  const keywordScore = computeKeywordScore(resume, jd);
  const seniorityScore = computeSeniorityScore(resume, jd);

  const resumeYears = estimateExperienceYears(resume);
  const jdYears = estimateJDExperienceYears(jd);
  const experienceYearsScore = Math.round(
    (Math.min(resumeYears, jdYears) / Math.max(jdYears, 1)) * 100
  );

  // LLM for qualitative explanation and responsibility alignment
  const llmResult = await callLLM({
    systemPrompt: MATCH_SCORING_SYSTEM_PROMPT,
    userMessage: buildMatchScoringUserPrompt(
      JSON.stringify(resume),
      JSON.stringify(jd)
    ),
    schema: LLMScoreSchema,
  });

  const llmScore = llmResult.data;

  // Merge: use algorithmic scores for numeric values, LLM for explanation
  const responsibilityAlignmentScore = llmScore.responsibilityAlignmentScore;

  // Weighted overall score
  const overallScore = Math.round(
    Math.min(
      100,
      Math.max(
        0,
        skillCoverageScore * 0.4 +
          responsibilityAlignmentScore * 0.25 +
          keywordScore * 0.15 +
          seniorityScore * 0.1 +
          experienceYearsScore * 0.1 -
          llmScore.criticalMissingRequirements.length * 3
      )
    )
  );

  return {
    overallScore,
    skillCoverageScore,
    responsibilityAlignmentScore,
    keywordScore,
    seniorityScore,
    experienceYearsScore,
    criticalMissingRequirements: llmScore.criticalMissingRequirements,
    explanation: llmScore.explanation,
  };
}