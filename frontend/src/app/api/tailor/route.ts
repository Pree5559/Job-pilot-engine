import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { tailorResume } from "@/lib/tailor";
import { ResumeProfileSchema, JobDescriptionProfileSchema, MatchScoreSchema } from "@/lib/schemas";
import { LLMError } from "@/lib/llm-client";

export const runtime = "nodejs";

const requestSchema = z.object({
  resume: ResumeProfileSchema,
  jd: JobDescriptionProfileSchema,
  score: MatchScoreSchema,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = requestSchema.parse(body);
    const result = await tailorResume(input.resume, input.jd, input.score);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    if (error instanceof LLMError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 502 }
      );
    }
    console.error({ route: "tailor", error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}