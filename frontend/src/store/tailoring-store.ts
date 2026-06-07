import { create } from "zustand";
import type {
  ResumeProfile,
  JobDescriptionProfile,
  MatchScore,
  TailoredResume,
  GapAnalysis,
  Stage,
  StageStatus,
  TailoringRunStatus,
} from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

interface TailoringState {
  resumeText: string;
  jdText: string;
  resume: ResumeProfile | null;
  jobDescription: JobDescriptionProfile | null;
  originalScore: MatchScore | null;
  tailoredScore: MatchScore | null;
  tailoredResume: TailoredResume | null;
  gaps: GapAnalysis | null;
  status: TailoringRunStatus;
  stages: Stage[];
  errors: Record<string, string>;
  isAnalyzing: boolean;
  isTailoring: boolean;
  confirmedBullets: Set<string>;

  setResumeText: (text: string) => void;
  setJdText: (text: string) => void;
  analyze: () => Promise<void>;
  generateTailored: () => Promise<void>;
  reset: () => void;
  updateStageStatus: (stageId: string, status: StageStatus) => void;
  setError: (stageId: string, message: string) => void;
  clearError: (stageId: string) => void;
  confirmBullet: (bulletKey: string) => void;
  rejectBullet: (bulletKey: string) => void;
  allLowConfidenceConfirmed: () => boolean;
}

const initialStages: Stage[] = [
  { id: "parsing-resume", label: "Parsing resume", status: "pending" },
  { id: "parsing-jd", label: "Parsing job description", status: "pending" },
  { id: "scoring", label: "Scoring match", status: "pending" },
  { id: "gaps", label: "Analyzing gaps", status: "pending" },
  { id: "tailoring", label: "Tailoring resume", status: "pending" },
];

function cloneStages(): Stage[] {
  return initialStages.map((s) => ({ ...s }));
}

const getDefaultState = () => ({
  resumeText: "",
  jdText: "",
  resume: null as ResumeProfile | null,
  jobDescription: null as JobDescriptionProfile | null,
  originalScore: null as MatchScore | null,
  tailoredScore: null as MatchScore | null,
  tailoredResume: null as TailoredResume | null,
  gaps: null as GapAnalysis | null,
  status: "draft" as TailoringRunStatus,
  stages: cloneStages(),
  errors: {} as Record<string, string>,
  isAnalyzing: false,
  isTailoring: false,
  confirmedBullets: new Set<string>(),
});

function markStage(stages: Stage[], id: string, status: StageStatus): Stage[] {
  return stages.map((s) => (s.id === id ? { ...s, status } : s));
}

export const useTailoringStore = create<TailoringState>((set, get) => ({
  ...getDefaultState(),

  setResumeText: (text: string) => {
    set({ resumeText: text });
  },

  setJdText: (text: string) => {
    set({ jdText: text });
  },

  analyze: async () => {
    const { resumeText, jdText } = get();
    if (!resumeText.trim() || !jdText.trim()) return;

    set({ isAnalyzing: true, status: "analyzed", stages: cloneStages() });

    try {
      const stages1 = markStage(get().stages, "parsing-resume", "loading");
      set({ stages: stages1 });
      const resume = await apiPost("/api/parse-resume", { text: resumeText });
      const stages2 = markStage(get().stages, "parsing-resume", "done");
      set({ resume, stages: stages2 });

      const stages3 = markStage(get().stages, "parsing-jd", "loading");
      set({ stages: stages3 });
      const jobDescription = await apiPost("/api/parse-jd", { text: jdText });
      const stages4 = markStage(get().stages, "parsing-jd", "done");
      set({ jobDescription, stages: stages4 });

      const stages5 = markStage(get().stages, "scoring", "loading");
      set({ stages: stages5 });
      const originalScore = await apiPost("/api/score", {
        resume,
        jd: jobDescription,
      });
      const stages6 = markStage(get().stages, "scoring", "done");
      set({ originalScore, stages: stages6 });

      const stages7 = markStage(get().stages, "gaps", "loading");
      set({ stages: stages7 });
      const gaps = await apiPost("/api/gaps", { resume, jd: jobDescription });
      const stages8 = markStage(get().stages, "gaps", "done");
      set({ gaps, stages: stages8 });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An error occurred during analysis";
      const errorStages = get().stages.map((s) =>
        s.status === "loading" ? { ...s, status: "error" as StageStatus } : s
      );
      set({
        errors: { analysis: message },
        stages: errorStages,
      });
    } finally {
      set({ isAnalyzing: false });
    }
  },

  generateTailored: async () => {
    const { resume, jobDescription, originalScore } = get();
    if (!resume || !jobDescription || !originalScore) return;

    set({ isTailoring: true });

    try {
      const stages1 = markStage(get().stages, "tailoring", "loading");
      set({ stages: stages1 });

      const tailoredResume = await apiPost("/api/tailor", {
        resume,
        jd: jobDescription,
        score: originalScore,
      });

      const tailoredScore = await apiPost("/api/score", {
        resume: { ...resume, summary: tailoredResume.tailoredSummary },
        jd: jobDescription,
      });

      const stages2 = markStage(get().stages, "tailoring", "done");
      set({
        status: "tailored",
        tailoredResume,
        tailoredScore,
        stages: stages2,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An error occurred during tailoring";
      const errorStages = markStage(get().stages, "tailoring", "error");
      set({
        errors: { tailoring: message },
        stages: errorStages,
      });
    } finally {
      set({ isTailoring: false });
    }
  },

  reset: () => {
    set(getDefaultState());
  },

  updateStageStatus: (stageId: string, status: StageStatus) => {
    set({ stages: markStage(get().stages, stageId, status) });
  },

  setError: (stageId: string, message: string) => {
    set({
      errors: { ...get().errors, [stageId]: message },
      stages: markStage(get().stages, stageId, "error"),
    });
  },

  clearError: (stageId: string) => {
    const newErrors = { ...get().errors };
    delete newErrors[stageId];
    set({ errors: newErrors });
  },

  confirmBullet: (bulletKey: string) => {
    const newSet = new Set(get().confirmedBullets);
    newSet.add(bulletKey);
    set({ confirmedBullets: newSet });
  },

  rejectBullet: (bulletKey: string) => {
    const newSet = new Set(get().confirmedBullets);
    newSet.delete(bulletKey);
    set({ confirmedBullets: newSet });
  },

  allLowConfidenceConfirmed: () => {
    const { tailoredResume, confirmedBullets } = get();
    if (!tailoredResume) return true;
    const lowConfidenceKeys: string[] = [];
    tailoredResume.tailoredExperience.forEach((exp, expIdx) => {
      exp.bullets.forEach((bullet, bIdx) => {
        if (bullet.confidence === "low") {
          lowConfidenceKeys.push(`${expIdx}-${bIdx}`);
        }
      });
    });
    return lowConfidenceKeys.every((key) => confirmedBullets.has(key));
  },
}));
