"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScoreCard } from "@/components/ScoreCard";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { JDSummary } from "@/components/JDSummary";
import { GapAnalysis } from "@/components/GapAnalysis";
import { BulletRewriter } from "@/components/BulletRewriter";
import { SideBySideDiff } from "@/components/SideBySideDiff";
import { LoadingState } from "@/components/LoadingState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useTailoringStore } from "@/store/tailoring-store";

export default function AnalysisPage() {
  const router = useRouter();
  const {
    resume,
    jobDescription,
    originalScore,
    tailoredScore,
    tailoredResume,
    gaps,
    stages,
    isAnalyzing,
    isTailoring,
    status,
    generateTailored,
  } = useTailoringStore();

  // If no data, show prompt to go back
  if (!resume && !jobDescription && status === "draft") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h2 className="mb-4 text-2xl font-bold">No Analysis Data</h2>
        <p className="mb-6 text-muted-foreground">
          Please paste your resume and job description first, then click
          &ldquo;Analyze Match.&rdquo;
        </p>
        <Button onClick={() => router.push("/")}>Go to Input</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analysis Dashboard</h1>
        <div className="flex gap-2">
          {status === "analyzed" && !tailoredResume && (
            <Button onClick={generateTailored} disabled={isTailoring}>
              {isTailoring ? "Generating..." : "Generate Tailored Resume"}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push("/")}
          >
            New Analysis
          </Button>
        </div>
      </div>

      <ErrorBoundary>
        {/* Loading State */}
        {isAnalyzing && (
          <div className="mb-8">
            <LoadingState stages={stages} />
          </div>
        )}

        <div className="space-y-8">
          {/* Score Section */}
          {originalScore && (
            <ErrorBoundary>
              <div>
                <h2 className="mb-4 text-xl font-semibold">Match Score</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <ScoreCard
                    score={originalScore.overallScore}
                    label="Original Resume"
                  />
                  {tailoredScore && (
                    <ScoreCard
                      score={tailoredScore.overallScore}
                      label="Tailored Resume"
                    />
                  )}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <ScoreBreakdown
                    subscores={[
                      {
                        label: "Skill Coverage",
                        score: originalScore.skillCoverageScore,
                      },
                      {
                        label: "Responsibility Alignment",
                        score: originalScore.responsibilityAlignmentScore,
                      },
                      {
                        label: "Keyword Match",
                        score: originalScore.keywordScore,
                      },
                      {
                        label: "Seniority Match",
                        score: originalScore.seniorityScore,
                      },
                    ]}
                  />
                  {tailoredScore && (
                    <ScoreBreakdown
                      subscores={[
                        {
                          label: "Skill Coverage",
                          score: tailoredScore.skillCoverageScore,
                        },
                        {
                          label: "Responsibility Alignment",
                          score: tailoredScore.responsibilityAlignmentScore,
                        },
                        {
                          label: "Keyword Match",
                          score: tailoredScore.keywordScore,
                        },
                        {
                          label: "Seniority Match",
                          score: tailoredScore.seniorityScore,
                        },
                      ]}
                    />
                  )}
                </div>
                {originalScore.explanation && (
                  <div className="mt-4 rounded-lg border p-4">
                    <h3 className="mb-1 text-sm font-medium">Explanation</h3>
                    <p className="text-sm text-muted-foreground">
                      {originalScore.explanation}
                    </p>
                    {originalScore.criticalMissingRequirements.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-xs font-medium text-red-600">
                          Critical Missing Requirements:
                        </h4>
                        <ul className="list-inside list-disc text-xs text-red-600">
                          {originalScore.criticalMissingRequirements.map(
                            (req, i) => (
                              <li key={i}>{req}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ErrorBoundary>
          )}

          <Separator />

          {/* JD Summary */}
          <ErrorBoundary>
            <JDSummary jd={jobDescription} />
          </ErrorBoundary>

          <Separator />

          {/* Gap Analysis */}
          <ErrorBoundary>
            <GapAnalysis gaps={gaps?.gaps ?? null} />
          </ErrorBoundary>

          <Separator />

          {/* Bullet Rewrites */}
          {tailoredResume && (
            <>
              <ErrorBoundary>
                <BulletRewriter experience={tailoredResume.tailoredExperience} />
              </ErrorBoundary>
              <Separator />
            </>
          )}

          {/* Side-by-Side Comparison */}
          {tailoredResume && (
            <ErrorBoundary>
              <SideBySideDiff original={resume} tailored={tailoredResume} />
            </ErrorBoundary>
          )}
        </div>

        {/* Action Buttons */}
        {tailoredResume && (
          <div className="mt-8 flex justify-center gap-4">
            <Button onClick={() => router.push("/export")}>
              Proceed to Export
            </Button>
            <Button variant="outline" onClick={() => router.push("/")}>
              Start Over
            </Button>
          </div>
        )}
      </ErrorBoundary>
    </div>
  );
}