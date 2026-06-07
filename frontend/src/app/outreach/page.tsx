"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

interface Resume {
  id: string;
  name: string;
  created_at: string;
}

interface DraftResponse {
  outreach_log_id: string;
  subject: string;
  body: string;
  status: string;
  quality_score: number;
  spam_score: number;
  recommendations: string[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function OutreachPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  
  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newResumeName, setNewResumeName] = useState("");
  const [newResumeText, setNewResumeText] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Job context
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [jobId, setJobId] = useState("");
  const [jobCompany, setJobCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  // Recipient details
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("Hiring Manager");
  const [template, setTemplate] = useState("default");
  const [useLLM, setUseLLM] = useState(true);

  // Loading states
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [draft, setDraft] = useState<DraftResponse | null>(null);

  // Email edits
  const [subjectEdit, setSubjectEdit] = useState("");
  const [bodyEdit, setBodyEdit] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    // Fetch jobs
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/jobs`);
        if (res.ok) {
          const data = await res.json();
          setAvailableJobs(data);
          
          const savedJobId = localStorage.getItem("current_job_id") || "";
          if (savedJobId) {
            setJobId(savedJobId);
            const selectedJob = data.find((j: any) => j.id === savedJobId);
            if (selectedJob) {
              setJobCompany(selectedJob.company);
              setJobTitle(selectedJob.title);
            }
          } else if (data.length > 0) {
            setJobId(data[0].id);
            setJobCompany(data[0].company);
            setJobTitle(data[0].title);
          }
        }
      } catch (err) {
        console.error("Failed to load jobs:", err);
      }
    };
    fetchJobs();

    // Fetch master resumes
    const fetchResumes = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/resumes`);
        if (res.ok) {
          const data = await res.json();
          setResumes(data);
          if (data.length > 0) {
            setSelectedResumeId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load resumes:", err);
      }
    };
    fetchResumes();
  }, []);

  const handleJobChange = (selectedId: string) => {
    setJobId(selectedId);
    const selectedJob = availableJobs.find((j) => j.id === selectedId);
    if (selectedJob) {
      setJobCompany(selectedJob.company);
      setJobTitle(selectedJob.title);
      localStorage.setItem("current_job_id", selectedJob.id);
      localStorage.setItem("current_job_company", selectedJob.company);
      localStorage.setItem("current_job_title", selectedJob.title);
    } else {
      setJobCompany("");
      setJobTitle("");
    }
  };

  const handleUploadResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResumeName.trim() || !newResumeText.trim()) {
      alert("Please enter a name and paste the resume content.");
      return;
    }
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("name", newResumeName);
      formData.append("text_content", newResumeText);
      
      const res = await fetch(`${API_BASE}/api/resumes/upload`, {
        method: "POST",
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        setResumes((prev) => [data, ...prev]);
        setSelectedResumeId(data.id);
        setShowUploadModal(false);
        setNewResumeName("");
        setNewResumeText("");
        alert("Master resume uploaded successfully!");
      } else {
        const errData = await res.json();
        alert(`Failed to upload: ${errData.detail || "Server error"}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error uploading resume. Check backend connection.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId || !selectedResumeId || !recipientEmail) {
      alert("Please enter Job ID, recipient email, and select a master resume.");
      return;
    }
    
    setIsDrafting(true);
    setDraft(null);
    setStatusMessage("");
    
    try {
      // Step 1: In a production layout, we tailor the resume first if not done.
      // For simplicity, we can fetch tailored resume list.
      // But we can call /api/resumes/tailor directly in the backend to ensure we have a tailored_resume_id.
      const tailorRes = await fetch(`${API_BASE}/api/resumes/tailor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId, resume_id: selectedResumeId }),
      });
      
      if (!tailorRes.ok) {
        const errorData = await tailorRes.json().catch(() => ({ detail: "Unknown tailoring error" }));
        throw new Error(errorData.detail || "Tailoring process failed");
      }
      const tailorData = await tailorRes.json();
      
      // Step 2: Request email draft
      const draftRes = await fetch(`${API_BASE}/api/outreach/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          tailored_resume_id: tailorData.tailored_resume_id,
          recipient_email: recipientEmail,
          recipient_name: recipientName,
          template: template,
          use_llm: useLLM
        }),
      });

      if (draftRes.ok) {
        const draftData = await draftRes.json();
        setDraft(draftData);
        setSubjectEdit(draftData.subject);
        setBodyEdit(draftData.body);
      } else {
        const errorData = await draftRes.json().catch(() => ({ detail: "Unknown drafting error" }));
        throw new Error(errorData.detail || "Failed to compile email draft.");
      }
    } catch (err: any) {
      console.error("Outreach drafting error:", err);
      alert(`Error preparing draft: ${err.message || "Please check backend connection and credentials."}`);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!draft) return;
    setIsSending(true);
    setStatusMessage("");
    
    try {
      const res = await fetch(`${API_BASE}/api/outreach/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outreach_log_id: draft.outreach_log_id,
          subject: subjectEdit,
          body: bodyEdit
        }),
      });

      const resData = await res.json();
      if (res.ok) {
        setStatusMessage(resData.message || "Email successfully processed!");
        // Update draft status
        setDraft({ ...draft, status: resData.status === "simulated" ? "Simulated" : "Sent" });
      } else {
        setStatusMessage(`Send failed: ${resData.detail || "Server error"}`);
      }
    } catch (err) {
      console.error("Outreach dispatch error:", err);
      setStatusMessage("Failed to dispatch email. Verify SMTP connection settings.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold tracking-tight">Outreach Desk</h1>
        <p className="text-muted-foreground">
          Compose highly contextual cold emails, evaluate spam risks, and schedule outreach.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Form Panel */}
        <div className="lg:col-span-4">
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Pipeline Inputs</h2>
            <form onSubmit={handleGenerateDraft} className="space-y-4">
              
              {jobTitle && (
                <div className="rounded-md bg-blue-50/50 border border-blue-100 p-3 mb-2 text-xs">
                  <strong>Selected Job:</strong><br />
                  {jobTitle} at {jobCompany}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Select Job</label>
                <select
                  value={jobId}
                  onChange={(e) => handleJobChange(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {availableJobs.length === 0 ? (
                    <option value="">No jobs synced</option>
                  ) : (
                    availableJobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} at {j.company} ({j.source})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Master Resume</label>
                <div className="flex gap-2">
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {resumes.length === 0 ? (
                      <option value="">No resumes uploaded</option>
                    ) : (
                      resumes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))
                    )}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUploadModal(true)}
                    className="px-3"
                    title="Upload new master resume"
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Recipient Email</label>
                <Input
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="recruiter@company.com"
                  type="email"
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Recipient Name</label>
                <Input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="h-9 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Template Type</label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-hidden"
                >
                  <option value="default">Default Template</option>
                  <option value="direct">Direct Appeal</option>
                  <option value="story">Anecdote Story</option>
                  <option value="question">Question Driven</option>
                  <option value="value">Value Prop Offer</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="useLLM"
                  checked={useLLM}
                  onChange={(e) => setUseLLM(e.target.checked)}
                  className="h-4 w-4 rounded-sm border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="useLLM" className="text-xs font-semibold text-muted-foreground">
                  Enhance draft with LLM reasoning
                </label>
              </div>

              <Button type="submit" disabled={isDrafting} className="w-full mt-4 h-10 font-bold text-sm">
                {isDrafting ? "Compiling Draft..." : "Prepare Email Draft"}
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Editor Panel */}
        <div className="lg:col-span-8">
          {isDrafting ? (
            <div className="border border-dashed rounded-lg h-[400px] flex items-center justify-center text-muted-foreground">
              Generating tailored cold email. Please wait...
            </div>
          ) : draft ? (
            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Compose & Review</h2>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Score: {draft.quality_score}/100</Badge>
                    <Badge variant={draft.spam_score > 0.4 ? "destructive" : "outline"}>
                      Spam Risk: {Math.round(draft.spam_score * 100)}%
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-muted-foreground">Subject Line</label>
                    <Input
                      value={subjectEdit}
                      onChange={(e) => setSubjectEdit(e.target.value)}
                      className="font-semibold text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-muted-foreground">Email Body</label>
                    <Textarea
                      value={bodyEdit}
                      onChange={(e) => setBodyEdit(e.target.value)}
                      rows={12}
                      className="text-sm font-mono leading-relaxed"
                    />
                  </div>

                  {draft.recommendations && draft.recommendations.length > 0 && (
                    <div className="rounded-md border border-amber-200 bg-amber-50/50 p-4 text-xs">
                      <strong className="text-amber-800">Clarity & Quality Recommendations:</strong>
                      <ul className="list-disc list-inside mt-2 text-amber-700 space-y-1">
                        {draft.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-muted-foreground font-semibold">
                      Status: <span className="font-bold text-primary">{draft.status}</span>
                    </div>

                    <Button onClick={handleSendEmail} disabled={isSending} className="min-w-[150px] font-bold">
                      {isSending ? "Dispatching..." : "Send Outreach Email"}
                    </Button>
                  </div>

                  {statusMessage && (
                    <div className="rounded-md bg-gray-50 border p-3 text-xs mt-3 font-mono break-all text-muted-foreground">
                      {statusMessage}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ) : (
            <div className="border border-dashed rounded-lg h-[400px] flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
              <svg
                className="h-12 w-12 text-gray-300 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 19v-8.93a2 2 0 01.89-1.664l8-4.75a2 2 0 012.22 0l8 4.75A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                />
              </svg>
              <h3 className="font-bold text-md mb-1">No Draft Prepared</h3>
              <p className="max-w-xs text-xs">
                Fill in the pipeline parameters on the left to trigger the AI email draft composer.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Master Resume Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl rounded-xl border bg-card p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold font-sans">Upload Master Resume</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUploadModal(false)}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>
            <form onSubmit={handleUploadResume} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Resume Name</label>
                <Input
                  value={newResumeName}
                  onChange={(e) => setNewResumeName(e.target.value)}
                  placeholder="e.g. My Master Resume 2026"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Resume Text Content</label>
                <Textarea
                  value={newResumeText}
                  onChange={(e) => setNewResumeText(e.target.value)}
                  placeholder="Paste the full text of your resume here..."
                  rows={12}
                  className="font-mono text-sm leading-relaxed"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? "Uploading & Parsing..." : "Upload Resume"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
