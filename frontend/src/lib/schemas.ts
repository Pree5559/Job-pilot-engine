import { z } from "zod";

// ─── ResumeProfile ───────────────────────────────────────────────

// Helper: accepts string or null/undefined (for LLM responses)
const optionalString = z.string().nullish().transform((val) => val ?? undefined);

const optionalStringArray = z.array(z.string()).nullish().transform((val) => val ?? undefined);

export const ResumeProfileSchema = z.object({
  contact: z.object({
    name: optionalString,
    email: optionalString,
    phone: optionalString,
    linkedin: optionalString,
    website: optionalString,
    location: optionalString,
  }),
  summary: optionalString,
  skills: z.array(z.string()),
  experience: z.array(
    z.object({
      company: z.string(),
      title: z.string(),
      startDate: optionalString,
      endDate: optionalString,
      bullets: z.array(z.string()),
    })
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      description: optionalString,
      technologies: optionalStringArray,
      bullets: optionalStringArray,
    })
  ),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: optionalString,
      field: optionalString,
      graduationDate: optionalString,
    })
  ),
  certifications: z.array(
    z.object({
      name: z.string(),
      issuer: optionalString,
      date: optionalString,
    })
  ),
});

export type ResumeProfile = z.infer<typeof ResumeProfileSchema>;

// ─── JobDescriptionProfile ───────────────────────────────────────

export const JobDescriptionProfileSchema = z.object({
  jobTitle: z.string(),
  company: optionalString,
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  qualifications: z.array(z.string()),
  tools: z.array(z.string()),
  keywords: z.array(z.string()),
  seniorityLevel: optionalString,
  domainSignals: z.array(z.string()),
});

export type JobDescriptionProfile = z.infer<typeof JobDescriptionProfileSchema>;

// ─── MatchScore ──────────────────────────────────────────────────

export const MatchScoreSchema = z.object({
  overallScore: z.number().min(0).max(100),
  skillCoverageScore: z.number().min(0).max(100),
  responsibilityAlignmentScore: z.number().min(0).max(100),
  keywordScore: z.number().min(0).max(100),
  seniorityScore: z.number().min(0).max(100),
  experienceYearsScore: z.number().min(0).max(100).nullish().transform((val) => val ?? undefined),
  criticalMissingRequirements: z.array(z.string()),
  explanation: z.string(),
});

export type MatchScore = z.infer<typeof MatchScoreSchema>;

// ─── TailoredResume ──────────────────────────────────────────────

export const TailoredBulletSchema = z.object({
  original: z.string().min(1, "Original bullet cannot be empty"),
  tailored: z.string().min(1, "Tailored bullet cannot be empty"),
  changeReason: z.string().min(1, "Change reason is required"),
  keywordsAddressed: z.array(z.string()),
  confidence: z.enum(["high", "medium", "low"]),
  riskFlag: z.string().nullish(),
});

export type TailoredBullet = z.infer<typeof TailoredBulletSchema>;

export const TailoredExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  bullets: z.array(TailoredBulletSchema),
});

export type TailoredExperience = z.infer<typeof TailoredExperienceSchema>;

export const TailoredResumeSchema = z.object({
  tailoredSummary: optionalString,
  tailoredSkills: z.array(z.string()),
  tailoredExperience: z.array(TailoredExperienceSchema),
});

export type TailoredResume = z.infer<typeof TailoredResumeSchema>;

// ─── ResumeGap / GapAnalysis ────────────────────────────────────

export const ResumeGapSchema = z.object({
  name: z.string(),
  importance: z.enum(["high", "medium", "low"]),
  jdEvidence: z.string(),
  resumeEvidence: z.string(),
  suggestedAction: z.string(),
  canSafelyAdd: z.boolean(),
});

export type ResumeGap = z.infer<typeof ResumeGapSchema>;

export const GapAnalysisSchema = z.object({
  gaps: z.array(ResumeGapSchema),
});

export type GapAnalysis = z.infer<typeof GapAnalysisSchema>;

// ─── TailoringRun ────────────────────────────────────────────────

export const TailoringRunStatusSchema = z.enum([
  "draft",
  "analyzed",
  "tailored",
  "exported",
]);

export type TailoringRunStatus = z.infer<typeof TailoringRunStatusSchema>;

export const TailoringRunSchema = z.object({
  id: z.string().uuid(),
  resume: ResumeProfileSchema,
  jobDescription: JobDescriptionProfileSchema,
  originalScore: MatchScoreSchema,
  tailoredScore: MatchScoreSchema.optional(),
  tailoredResume: TailoredResumeSchema.optional(),
  gaps: GapAnalysisSchema,
  createdAt: z.string().datetime(),
  status: TailoringRunStatusSchema,
});

export type TailoringRun = z.infer<typeof TailoringRunSchema>;

// ─── Stage for LoadingState ──────────────────────────────────────

export const StageStatusSchema = z.enum(["pending", "loading", "done", "error"]);

export type StageStatus = z.infer<typeof StageStatusSchema>;

export const StageSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: StageStatusSchema,
});

export type Stage = z.infer<typeof StageSchema>;