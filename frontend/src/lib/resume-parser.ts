import { callLLM, LLMError } from "./llm-client";
import { ResumeProfileSchema } from "./schemas";
import type { ResumeProfile } from "./types";
import {
  RESUME_PARSER_SYSTEM_PROMPT,
  buildResumeParserUserPrompt,
} from "../../prompts/resume-parser";

export async function parseResume(text: string): Promise<ResumeProfile> {
  if (!text || text.trim().length < 50) {
    throw new LLMError(
      "Resume text is too short (<50 chars). Please paste your complete resume.",
      "PARSE_ERROR"
    );
  }

  const { data } = await callLLM({
    systemPrompt: RESUME_PARSER_SYSTEM_PROMPT,
    userMessage: buildResumeParserUserPrompt(text),
    schema: ResumeProfileSchema,
  });

  return data;
}