"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ResumeInput } from "@/components/ResumeInput";
import { JDInput } from "@/components/JDInput";
import { useTailoringStore } from "@/store/tailoring-store";
import { sampleResume, sampleJD } from "@/lib/sample-data";
import { motion } from "framer-motion";

export default function HomePage() {
  const router = useRouter();
  const { resumeText, jdText, setResumeText, setJdText, analyze } =
    useTailoringStore();

  const hasContent = resumeText.trim().length > 0 && jdText.trim().length > 0;

  const handleAnalyze = () => {
    if (!hasContent) return;
    analyze();
    router.push("/analysis");
  };

  const handleSampleData = () => {
    setResumeText(sampleResume);
    setJdText(sampleJD);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-7xl px-4 py-8"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="mb-8 text-center"
      >
        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          Resume Shapeshifter
        </h1>
        <p className="text-muted-foreground">
          Paste your resume and a job description to get a tailored resume with
          match scoring, gap analysis, and side-by-side comparison.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="mb-6 flex justify-center"
      >
        <Button
          variant="outline"
          onClick={handleSampleData}
          aria-label="Load sample resume and job description"
          className="text-sm"
        >
          Try with sample data
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        <ResumeInput value={resumeText} onChange={setResumeText} />
        <JDInput value={jdText} onChange={setJdText} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="mt-8 flex justify-center"
      >
        <Button
          size="lg"
          onClick={handleAnalyze}
          disabled={!hasContent}
          className="min-w-[200px]"
          aria-label={hasContent ? "Analyze match" : "Enter resume and JD to begin"}
        >
          {hasContent ? "Analyze Match" : "Enter resume and JD to begin"}
        </Button>
      </motion.div>
    </motion.div>
  );
}
