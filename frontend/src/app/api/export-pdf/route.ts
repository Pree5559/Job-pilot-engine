import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ResumeProfileSchema,
  JobDescriptionProfileSchema,
  TailoredResumeSchema,
  MatchScoreSchema,
  GapAnalysisSchema,
} from "@/lib/schemas";
import { generateTailoredResumePDF, generateComparisonPDF } from "@/lib/pdf-generator";

export const runtime = "nodejs";

const ExportPDFRequestSchema = z.object({
  type: z.enum(["tailored", "comparison"]),
  resume: ResumeProfileSchema,
  tailored: TailoredResumeSchema,
  jd: JobDescriptionProfileSchema,
  originalScore: MatchScoreSchema,
  tailoredScore: MatchScoreSchema.optional(),
  gaps: GapAnalysisSchema.optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = ExportPDFRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: parsed.error.issues.map(
            (i) => `${i.path.join(".")}: ${i.message}`
          ),
        },
        { status: 400 }
      );
    }

    const { type, resume, tailored, jd, originalScore, tailoredScore, gaps } =
      parsed.data;

    let pdfBuffer: Buffer;

    if (type === "tailored") {
      pdfBuffer = await generateTailoredResumePDF({
        resume,
        tailored,
        jd,
      });
    } else {
      // comparison type
      if (!tailoredScore || !gaps) {
        return NextResponse.json(
          {
            error:
              "Comparison PDF requires both tailoredScore and gaps data",
          },
          { status: 400 }
        );
      }

      pdfBuffer = await generateComparisonPDF({
        original: resume,
        tailored,
        originalScore,
        tailoredScore,
        jd,
        gaps,
      });
    }

    const filename = `resume-shapeshifter-${type}-${Date.now()}.pdf`;

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const pdfData = new Uint8Array(pdfBuffer);

    return new NextResponse(pdfData, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfData.length.toString(),
      },
    });
  } catch (error) {
    console.error({ route: "export-pdf", error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    const message =
      error instanceof Error ? error.message : "Unknown error generating PDF";
    return NextResponse.json(
      { error: `PDF generation failed: ${message}` },
      { status: 500 }
    );
  }
}