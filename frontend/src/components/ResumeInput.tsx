"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResumeInputProps {
  value: string;
  onChange: (text: string) => void;
}

export function ResumeInput({ value, onChange }: ResumeInputProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Paste Your Resume</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Textarea
          placeholder="Paste your resume text here..."
          className="min-h-[300px] resize-y font-mono text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{value.length} characters</span>
          {value.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange("")}
              className="h-6 text-xs"
            >
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}