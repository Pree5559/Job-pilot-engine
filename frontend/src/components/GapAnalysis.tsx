"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ResumeGap } from "@/lib/types";

interface GapAnalysisProps {
  gaps: ResumeGap[] | null;
}

function importanceColor(importance: string): string {
  switch (importance) {
    case "high":
      return "bg-red-100 text-red-800 hover:bg-red-100";
    case "medium":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "low":
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    default:
      return "";
  }
}

export function GapAnalysis({ gaps }: GapAnalysisProps) {
  if (!gaps || gaps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gap Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No gaps found &mdash; great match!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Gap Analysis</CardTitle>
        <p className="text-sm text-muted-foreground">
          Skills and requirements missing or underrepresented in your resume
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {gaps.map((gap, index) => (
            <div
              key={index}
              className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{gap.name}</span>
                  <Badge
                    variant="secondary"
                    className={importanceColor(gap.importance)}
                  >
                    {gap.importance}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">JD says:</span>{" "}
                  {gap.jdEvidence}
                </p>
                <p>
                  <span className="font-medium text-foreground">
                    Your resume:
                  </span>{" "}
                  {gap.resumeEvidence}
                </p>
                <p>
                  <span className="font-medium text-foreground">
                    Suggested action:
                  </span>{" "}
                  {gap.suggestedAction}
                </p>
              </div>
              {gap.canSafelyAdd && (
                <p className="mt-2 text-xs text-green-600">
                  ✓ Can be safely added if you have this experience
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}