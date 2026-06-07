"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ScoreCardProps {
  score: number;
  label: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-600";
}

function getScoreRing(score: number): string {
  if (score >= 80) return "border-green-500";
  if (score >= 50) return "border-yellow-500";
  return "border-red-500";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Strong Match";
  if (score >= 60) return "Good Match";
  if (score >= 40) return "Moderate Match";
  return "Weak Match";
}

export function ScoreCard({ score, label }: ScoreCardProps) {
  const color = getScoreColor(score);
  const ring = getScoreRing(score);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-1">
        <div
          className={`flex h-24 w-24 items-center justify-center rounded-full border-4 ${ring}`}
        >
          <span className={`text-3xl font-bold ${color}`}>{score}</span>
        </div>
        <span className={`text-sm font-medium ${color}`}>
          {getScoreLabel(score)}
        </span>
      </CardContent>
    </Card>
  );
}