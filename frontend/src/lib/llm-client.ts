import { z } from "zod";

export class LLMError extends Error {
  constructor(
    message: string,
    public code: "LLM_ERROR" | "VALIDATION_ERROR" | "TIMEOUT" | "RATE_LIMITED" | "PARSE_ERROR"
  ) {
    super(message);
    this.name = "LLMError";
  }
}

interface CallLLMParams<T> {
  systemPrompt: string;
  userMessage: string;
  schema: z.ZodType<T>;
  model?: string;
  maxRetries?: number;
}

interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
}

// Lazy initialization to prevent build-time errors when GROQ_API_KEY is not set
let _groq: any = null;

async function getGroq(): Promise<any> {
  if (!_groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("The GROQ_API_KEY environment variable is missing or empty");
    }
    const mod = await import("groq-sdk");
    const Groq = mod?.default ?? mod;
    _groq = new Groq({ apiKey });
  }
  return _groq;
}

// Fast models for Vercel Hobby plan (10s timeout)
// llama-3.1-8b-instant is ~2s response time
const DEFAULT_MODEL = "llama-3.1-8b-instant";
const FALLBACK_MODEL = "llama-3.3-70b-versatile";
const MAX_RETRIES = 2;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callLLM<T>({
  systemPrompt,
  userMessage,
  schema,
  model = DEFAULT_MODEL,
  maxRetries = MAX_RETRIES,
}: CallLLMParams<T>): Promise<{ data: T; usage: LLMUsage }> {
  let lastError: Error | null = null;
  let currentModel = model;

  // Models that support response_format: "json_object"
  const jsonModeModels = new Set([
    "llama-3.3-70b-versatile",
    "mixtral-8x7b-32768",
    "llama3-70b-8192",
    "llama3-8b-8192",
  ]);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const groq = await getGroq();
      const messages = [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: userMessage },
      ];

      // Only use JSON mode for supported models
      const response = jsonModeModels.has(currentModel)
        ? await groq.chat.completions.create({
            messages,
            model: currentModel,
            temperature: 0.1,
            max_tokens: 8192,
            response_format: { type: "json_object" },
          })
        : await groq.chat.completions.create({
            messages,
            model: currentModel,
            temperature: 0.1,
            max_tokens: 8192,
          });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new LLMError("Empty response from Groq", "LLM_ERROR");
      }

      // Parse JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[1]);
        } else {
          throw new LLMError(
            "Failed to parse JSON from LLM response",
            "LLM_ERROR"
          );
        }
      }

      // Validate with Zod
      const validated = schema.parse(parsed);

      const usage: LLMUsage = {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
        model: currentModel,
      };

      console.log(
        `[LLM] Model=${currentModel} Tokens=${usage.totalTokens} (prompt=${usage.promptTokens}, completion=${usage.completionTokens})`
      );

      return { data: validated, usage };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if it's a rate limit error
      // Rate limit detection: avoid instanceof checks across bundles
      const errAny = error as any;
      if ((errAny?.status === 429) || errAny?.name === "APIError") {
        const backoff = Math.pow(2, attempt) * 1000;
        console.log(
          `[LLM] Rate limited. Retrying in ${backoff}ms (attempt ${attempt + 1}/${maxRetries + 1})`
        );
        await sleep(backoff);
        continue;
      }

      // If it's a Zod validation error, retry with same model
      if (error instanceof z.ZodError) {
        if (attempt < maxRetries) {
          console.log(
            `[LLM] Validation error, retrying (attempt ${attempt + 1}/${maxRetries + 1})`
          );
          await sleep(1000 * (attempt + 1));
          continue;
        }
        throw new LLMError(
          `Validation error: ${error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; ")}`,
          "VALIDATION_ERROR"
        );
      }

      // If model fails, try fallback model
      if (currentModel !== FALLBACK_MODEL && attempt < maxRetries) {
        console.log(
          `[LLM] Model ${currentModel} failed, switching to ${FALLBACK_MODEL}`
        );
        currentModel = FALLBACK_MODEL;
        continue;
      }

      // If all retries exhausted
      if (attempt >= maxRetries) {
        throw new LLMError(
          `LLM call failed after ${maxRetries + 1} attempts: ${lastError.message}`,
          "LLM_ERROR"
        );
      }

      await sleep(1000 * (attempt + 1));
    }
  }

  throw new LLMError(
    `LLM call failed: ${lastError?.message ?? "Unknown error"}`,
    "LLM_ERROR"
  );
}