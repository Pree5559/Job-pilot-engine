"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Download, FileText, FileSpreadsheet, FileCode } from "lucide-react";
import { useTailoringStore } from "@/store/tailoring-store";
import { generateMarkdown } from "@/lib/markdown-export";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function downloadPDF(
  type: "tailored" | "comparison",
  data: Record<string, unknown>
) {
  const response = await fetch(`${API_BASE}/api/export-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, ...data }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Download failed" }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `resume-shapeshifter-${type}-${Date.now()}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export function PDFExportButton() {
  const [isExportingTailored, setIsExportingTailored] = useState(false);
  const [isExportingComparison, setIsExportingComparison] = useState(false);
  const [isExportingMarkdown, setIsExportingMarkdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const store = useTailoringStore();

  const {
    resume,
    jobDescription,
    originalScore,
    tailoredScore,
    tailoredResume,
    gaps,
    status,
    allLowConfidenceConfirmed,
    confirmedBullets,
  } = store;

  const hasTailoredData = tailoredResume && status === "tailored";
  const hasComparisonData =
    hasTailoredData && originalScore && tailoredScore && gaps;
  const allConfirmed = allLowConfidenceConfirmed ? allLowConfidenceConfirmed() : true;
  const lowConfidenceBulletsExist = tailoredResume?.tailoredExperience.some(
    (exp) => exp.bullets.some((b) => b.confidence === "low")
  );
  const exportDisabled = lowConfidenceBulletsExist && !allConfirmed;

  const handleExportTailored = async () => {
    if (!resume || !tailoredResume || !jobDescription) return;
    setIsExportingTailored(true);
    setError(null);
    try {
      await downloadPDF("tailored", {
        resume,
        tailored: tailoredResume,
        jd: jobDescription,
        originalScore,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to export tailored resume"
      );
    } finally {
      setIsExportingTailored(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!resume || !tailoredResume || !jobDescription) return;
    setIsExportingMarkdown(true);
    setError(null);
    try {
      const md = generateMarkdown(resume, tailoredResume, jobDescription, originalScore, gaps);
      const blob = new Blob([md], { type: "text/markdown" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume-shapeshifter-tailored-${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export as Markdown");
    } finally {
      setIsExportingMarkdown(false);
    }
  };

  const handleExportComparison = async () => {
    if (
      !resume ||
      !tailoredResume ||
      !jobDescription ||
      !originalScore ||
      !tailoredScore ||
      !gaps
    )
      return;
    setIsExportingComparison(true);
    setError(null);
    try {
      await downloadPDF("comparison", {
        resume,
        tailored: tailoredResume,
        jd: jobDescription,
        originalScore,
        tailoredScore,
        gaps,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to export comparison report"
      );
    } finally {
      setIsExportingComparison(false);
    }
  };

  return (
    <div className="space-y-3">
      {lowConfidenceBulletsExist && !allConfirmed && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
          ⚠ Please review and confirm all low-confidence changes on the Analysis page
          before exporting.
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          variant="default"
          disabled={!hasTailoredData || isExportingTailored || exportDisabled}
          onClick={handleExportTailored}
          className="min-w-[200px]"
        >
          {isExportingTailored ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Download Tailored Resume (PDF)
            </>
          )}
        </Button>

        <Button
          variant="outline"
          disabled={!hasComparisonData || isExportingComparison || exportDisabled}
          onClick={handleExportComparison}
          className="min-w-[200px]"
        >
          {isExportingComparison ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Download Side-by-Side (PDF)
            </>
          )}
        </Button>

        <Button
          variant="secondary"
          disabled={!hasTailoredData || isExportingMarkdown}
          onClick={handleExportMarkdown}
          className="min-w-[180px]"
          aria-label="Download as Markdown"
        >
          {isExportingMarkdown ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileCode className="mr-2 h-4 w-4" />
              Download as Markdown
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!hasTailoredData && (
        <p className="text-xs text-muted-foreground">
          Generate a tailored resume from the Analysis page to enable PDF
          downloads.
        </p>
      )}
    </div>
  );
}