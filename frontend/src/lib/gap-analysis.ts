import { callLLM } from "./llm-client";
import { GapAnalysisSchema } from "./schemas";
import type { ResumeProfile, JobDescriptionProfile, GapAnalysis } from "./types";
import {
  GAP_ANALYSIS_SYSTEM_PROMPT,
  buildGapAnalysisUserPrompt,
} from "../../prompts/gap-analysis";

export async function analyzeGaps(
  resume: ResumeProfile,
  jd: JobDescriptionProfile
): Promise<GapAnalysis> {
  const { data } = await callLLM({
    systemPrompt: GAP_ANALYSIS_SYSTEM_PROMPT,
    userMessage: buildGapAnalysisUserPrompt(
      JSON.stringify(resume),
      JSON.stringify(jd)
    ),
    schema: GapAnalysisSchema,
  });

  return data;
}