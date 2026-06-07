"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle, CheckCircle, Undo2 } from "lucide-react";
import type { TailoredExperience, TailoredBullet } from "@/lib/types";
import { useTailoringStore } from "@/store/tailoring-store";

interface BulletRewriterProps {
  experience: TailoredExperience[] | null;
}

function confidenceVariant(confidence: string) {
  switch (confidence) {
    case "high":
      return "bg-green-100 text-green-800 border-green-300 hover:bg-green-200";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200";
    case "low":
      return "bg-red-100 text-red-800 border-red-300 hover:bg-red-200";
    default:
      return "";
  }
}

function confidenceLabel(confidence: string): string {
  switch (confidence) {
    case "high":
      return "✓ High confidence";
    case "medium":
      return "! Medium confidence";
    case "low":
      return "✗ Low confidence";
    default:
      return confidence;
  }
}

function ConfidenceBadge({ confidence, riskFlag }: { confidence: string; riskFlag?: string | null }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge
          variant="outline"
          className={`cursor-help ${confidenceVariant(confidence)}`}
        >
          {confidenceLabel(confidence)}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        {confidence === "low" && riskFlag ? (
          <p className="text-xs text-red-700">{riskFlag}</p>
        ) : confidence === "medium" ? (
          <p className="text-xs text-yellow-700">
            This bullet was rewritten but does not appear to introduce unsupported claims.
          </p>
        ) : (
          <p className="text-xs text-green-700">
            This bullet matches the original closely or was unchanged.
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

export function BulletRewriter({ experience }: BulletRewriterProps) {
  const { confirmedBullets, confirmBullet, rejectBullet } = useTailoringStore();

  if (!experience || experience.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rewritten Bullets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No experience entries to display.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rewritten Bullets</CardTitle>
          <p className="text-sm text-muted-foreground">
            Original bullets rewritten to better align with the job description.
            Review low-confidence changes and confirm each one.
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {experience.map((exp, expIndex) => (
            <div key={expIndex}>
              <div className="mb-3">
                <h3 className="font-semibold">{exp.title}</h3>
                <p className="text-sm text-muted-foreground">{exp.company}</p>
              </div>
              <div className="space-y-4">
                {exp.bullets.map((bullet, bulletIndex) => {
                  const bulletKey = `${expIndex}-${bulletIndex}`;
                  const isConfirmed = confirmedBullets.has(bulletKey);
                  const isReverted = bullet.confidence === "low" && !isConfirmed;
                  const displayText = isReverted ? bullet.original : bullet.tailored;

                  return (
                    <div
                      key={bulletIndex}
                      className={`rounded-lg border p-4 transition-colors ${
                        bullet.confidence === "low"
                          ? "border-red-200 bg-red-50/30"
                          : bullet.confidence === "medium"
                          ? "border-yellow-200 bg-yellow-50/30"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <div className="mb-3 space-y-2">
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">
                            Original:
                          </span>
                          <p className="text-sm text-muted-foreground line-through">
                            {bullet.original}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg text-muted-foreground">→</span>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-green-700">
                            Tailored:
                          </span>
                          <p className={`text-sm ${isReverted ? "text-red-500 line-through" : ""}`}>
                            {displayText}
                            {isReverted && (
                              <span className="ml-2 text-xs text-red-600">
                                (reverted to original)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <ConfidenceBadge
                          confidence={isReverted ? "high" : bullet.confidence}
                          riskFlag={bullet.riskFlag}
                        />

                        {bullet.riskFlag && !isReverted && bullet.confidence === "low" && (
                          <Badge
                            variant="outline"
                            className="border-red-300 text-red-700"
                          >
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            {bullet.riskFlag.split("; ")[0]}
                          </Badge>
                        )}

                        <span className="text-muted-foreground">
                          {bullet.changeReason}
                        </span>
                      </div>

                      {bullet.keywordsAddressed.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {bullet.keywordsAddressed.map((kw) => (
                            <Badge
                              key={kw}
                              variant="outline"
                              className="text-xs"
                            >
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Action buttons for low-confidence bullets */}
                      {bullet.confidence === "low" && (
                        <div className="mt-3 flex gap-2">
                          {!isConfirmed ? (
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 text-xs"
                              onClick={() => confirmBullet(bulletKey)}
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Accept Change
                            </Button>
                          ) : (
                            <span className="flex items-center text-xs text-green-700">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Accepted
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            disabled={isReverted}
                            onClick={() => rejectBullet(bulletKey)}
                          >
                            <Undo2 className="mr-1 h-3 w-3" />
                            Revert to Original
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}