import { callLLM, LLMError } from "./llm-client";
import { JobDescriptionProfileSchema } from "./schemas";
import type { JobDescriptionProfile } from "./types";
import {
  JD_EXTRACTION_SYSTEM_PROMPT,
  buildJDExtractionUserPrompt,
} from "../../prompts/jd-extraction";

export async function parseJD(text: string): Promise<JobDescriptionProfile> {
  if (!text || text.trim().length < 20) {
    throw new LLMError(
      "Job description text is too short (<20 chars). Please paste the complete job description.",
      "PARSE_ERROR"
    );
  }

  const { data } = await callLLM({
    systemPrompt: JD_EXTRACTION_SYSTEM_PROMPT,
    userMessage: buildJDExtractionUserPrompt(text),
    schema: JobDescriptionProfileSchema,
  });

  return data;
}