"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { JobDescriptionProfile } from "@/lib/types";

interface JDSummaryProps {
  jd: JobDescriptionProfile | null;
}

export function JDSummary({ jd }: JDSummaryProps) {
  if (!jd) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Job Description Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No job description data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Job Description Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xl font-semibold">{jd.jobTitle}</p>
          {jd.company && (
            <p className="text-sm text-muted-foreground">{jd.company}</p>
          )}
          {jd.seniorityLevel && (
            <Badge variant="outline" className="mt-1">
              {jd.seniorityLevel}
            </Badge>
          )}
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium">Required Skills</h4>
          <div className="flex flex-wrap gap-1">
            {jd.requiredSkills.length > 0 ? (
              jd.requiredSkills.map((skill) => (
                <Badge key={skill} variant="default">
                  {skill}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                None specified
              </span>
            )}
          </div>
        </div>

        {jd.preferredSkills.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium">Preferred Skills</h4>
            <div className="flex flex-wrap gap-1">
              {jd.preferredSkills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="mb-2 text-sm font-medium">Responsibilities</h4>
          <ul className="list-inside list-disc space-y-1 text-sm">
            {jd.responsibilities.length > 0 ? (
              jd.responsibilities.map((r, i) => <li key={i}>{r}</li>)
            ) : (
              <li className="text-muted-foreground">None listed</li>
            )}
          </ul>
        </div>

        {jd.tools.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium">Tools & Technologies</h4>
            <div className="flex flex-wrap gap-1">
              {jd.tools.map((tool) => (
                <Badge key={tool} variant="outline">
                  {tool}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}