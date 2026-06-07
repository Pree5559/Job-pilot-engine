import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJD } from "@/lib/jd-parser";
import { LLMError } from "@/lib/llm-client";

export const runtime = "nodejs";

const requestSchema = z.object({
  text: z.string().min(20, "Job description text must be at least 20 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = requestSchema.parse(body);
    const result = await parseJD(input.text);
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
        { status: error.code === "PARSE_ERROR" ? 400 : 502 }
      );
    }
    console.error({ route: "parse-jd", error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}