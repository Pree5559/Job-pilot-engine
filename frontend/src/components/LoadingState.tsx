"use client";

import type { Stage } from "@/lib/types";

interface LoadingStateProps {
  stages: Stage[];
}

function StatusIcon({ status }: { status: Stage["status"] }) {
  switch (status) {
    case "loading":
      return (
        <span className="flex h-5 w-5 items-center justify-center">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </span>
      );
    case "done":
      return <span className="text-green-600">✓</span>;
    case "error":
      return <span className="text-red-600">✗</span>;
    case "pending":
    default:
      return (
        <span className="inline-block h-3 w-3 rounded-full border-2 border-gray-300" />
      );
  }
}

function StatusColor({ status }: { status: Stage["status"] }) {
  switch (status) {
    case "loading":
      return "text-blue-600";
    case "done":
      return "text-green-700";
    case "error":
      return "text-red-700";
    case "pending":
    default:
      return "text-muted-foreground";
  }
}

export function LoadingState({ stages }: LoadingStateProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        Processing...
      </h3>
      <div className="space-y-2">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 transition-colors ${
              stage.status === "loading"
                ? "border-blue-200 bg-blue-50/50"
                : stage.status === "error"
                ? "border-red-200 bg-red-50/50"
                : ""
            }`}
          >
            <StatusIcon status={stage.status} />
            <span className={`text-sm ${StatusColor({ status: stage.status })}`}>
              {stage.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}