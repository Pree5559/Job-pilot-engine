"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScoreCard } from "@/components/ScoreCard";
import { PDFExportButton } from "@/components/PDFExportButton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useTailoringStore } from "@/store/tailoring-store";

export default function ExportPage() {
  const router = useRouter();
  const {
    resume,
    jobDescription,
    originalScore,
    tailoredScore,
    tailoredResume,
    gaps,
    status,
  } = useTailoringStore();

  if (status === "draft") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h2 className="mb-4 text-2xl font-bold">No Export Data</h2>
        <p className="mb-6 text-muted-foreground">
          Please analyze a resume first before exporting.
        </p>
        <Button onClick={() => router.push("/")}>Go to Input</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Export</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/analysis")}>
            Back to Analysis
          </Button>
          <Button variant="outline" onClick={() => router.push("/")}>
            Start Over
          </Button>
        </div>
      </div>

      <ErrorBoundary>
        <div className="space-y-8">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tailoring Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Job Title</p>
                  <p className="font-medium">
                    {jobDescription?.jobTitle ?? "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">
                    {jobDescription?.company ?? "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{status}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {originalScore && (
                  <ScoreCard
                    score={originalScore.overallScore}
                    label="Original Match Score"
                  />
                )}
                {tailoredScore && (
                  <ScoreCard
                    score={tailoredScore.overallScore}
                    label="Tailored Match Score"
                  />
                )}
              </div>

              {gaps && gaps.gaps.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-2 text-sm font-medium">
                      Gaps Identified
                    </h3>
                    <ul className="list-inside list-disc text-sm text-muted-foreground">
                      {gaps.gaps.map((gap, i) => (
                        <li key={i}>
                          {gap.name}
                          <span className="ml-2 text-xs capitalize text-muted-foreground">
                            ({gap.importance})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {tailoredResume && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-2 text-sm font-medium">
                      Total Bullets Rewritten
                    </h3>
                    <p className="text-2xl font-bold">
                      {tailoredResume.tailoredExperience.reduce(
                        (acc, exp) => acc + exp.bullets.length,
                        0
                      )}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Export Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Download</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PDFExportButton />
            </CardContent>
          </Card>

          {/* Disclaimer Card */}
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader>
              <CardTitle className="text-sm text-yellow-800">
                ⚠ Truthfulness Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-yellow-700">
                The tailored resume was generated by an AI system. While the
                system is designed to preserve your original experience and avoid
                fabrication, you are responsible for reviewing all content before
                use. Verify that all rewritten bullets accurately reflect your
                experience, skills, and qualifications. Do not submit content
                that misrepresents your background.
              </p>
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>
    </div>
  );
}