import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { TailoredResumePDF } from "./pdf-templates/tailored-resume";
import { ComparisonPDF } from "./pdf-templates/comparison";
import type {
  ResumeProfile,
  TailoredResume,
  MatchScore,
  JobDescriptionProfile,
  GapAnalysis,
} from "./types";

/**
 * Generate a PDF buffer for the tailored resume.
 */
export async function generateTailoredResumePDF(data: {
  resume: ResumeProfile;
  tailored: TailoredResume;
  jd: JobDescriptionProfile;
}): Promise<Buffer> {
  const { resume, tailored, jd } = data;
  const element = React.createElement(TailoredResumePDF, {
    resume,
    tailored,
    jd,
  });

  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}

/**
 * Generate a PDF buffer for the side-by-side comparison report.
 */
export async function generateComparisonPDF(data: {
  original: ResumeProfile;
  tailored: TailoredResume;
  originalScore: MatchScore;
  tailoredScore: MatchScore;
  jd: JobDescriptionProfile;
  gaps: GapAnalysis;
}): Promise<Buffer> {
  const { original, tailored, originalScore, tailoredScore, jd, gaps } = data;
  const element = React.createElement(ComparisonPDF, {
    original,
    tailored,
    originalScore,
    tailoredScore,
    jd,
    gaps,
  });

  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}