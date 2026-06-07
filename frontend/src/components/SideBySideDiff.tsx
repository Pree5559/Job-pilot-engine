"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ResumeProfile, TailoredResume } from "@/lib/types";

interface SideBySideDiffProps {
  original: ResumeProfile | null;
  tailored: TailoredResume | null;
}

export function SideBySideDiff({ original, tailored }: SideBySideDiffProps) {
  if (!original || !tailored) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Side-by-Side Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {!original
              ? "No original resume data available."
              : "No tailored resume data available. Click 'Generate Tailored Resume' first."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Side-by-Side Comparison</CardTitle>
        <p className="text-sm text-muted-foreground">
          Original (left) vs Tailored (right)
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Original Column */}
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">
              Original Resume
            </h3>
            {tailored.tailoredSummary && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground">
                  Summary
                </h4>
                <p className="text-sm text-muted-foreground line-through">
                  {original.summary}
                </p>
              </div>
            )}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">
                Skills
              </h4>
              <div className="mt-1 flex flex-wrap gap-1">
                {original.skills.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
            {original.experience.map((exp, i) => (
              <div key={i}>
                <h4 className="text-sm font-medium">{exp.title}</h4>
                <p className="text-xs text-muted-foreground">{exp.company}</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  {exp.bullets.map((b, j) => (
                    <li key={j} className="text-xs text-muted-foreground">
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Tailored Column */}
          <div className="space-y-4 rounded-lg border border-green-200 bg-green-50/30 p-4">
            <h3 className="text-sm font-semibold uppercase text-green-700">
              Tailored Resume
            </h3>
            {tailored.tailoredSummary && (
              <div className="rounded bg-green-100/50 p-2">
                <h4 className="text-xs font-medium text-green-700">Summary</h4>
                <p className="text-sm text-green-900">
                  {tailored.tailoredSummary}
                </p>
              </div>
            )}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">
                Skills
              </h4>
              <div className="mt-1 flex flex-wrap gap-1">
                {tailored.tailoredSkills.map((s) => (
                  <Badge key={s} className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
            {tailored.tailoredExperience.map((exp, i) => (
              <div key={i}>
                <h4 className="text-sm font-medium">{exp.title}</h4>
                <p className="text-xs text-muted-foreground">{exp.company}</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  {exp.bullets.map((b, j) => (
                    <li key={j} className="text-xs text-green-900">
                      {b.tailored}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}