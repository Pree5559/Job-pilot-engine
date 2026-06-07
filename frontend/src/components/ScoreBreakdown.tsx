"use client";

interface SubScore {
  label: string;
  score: number;
}

interface ScoreBreakdownProps {
  subscores: SubScore[];
}

export function ScoreBreakdown({ subscores }: ScoreBreakdownProps) {
  if (!subscores || subscores.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Score breakdown not available.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        Score Breakdown
      </h3>
      {subscores.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span>{item.label}</span>
            <span className="font-medium">{item.score}/100</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${
                item.score >= 80
                  ? "bg-green-500"
                  : item.score >= 50
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${item.score}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}