"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTailoringStore } from "@/store/tailoring-store";
import { motion } from "framer-motion";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  url: string;
  salary: string | null;
  description: string | null;
  source: string;
  status: string;
  scraped_at: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function JobsPage() {
  const router = useRouter();
  const { setJdText } = useTailoringStore();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [syncKeywords, setSyncKeywords] = useState("Software Engineer, Python");
  const [syncLocation, setSyncLocation] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      let url = `${API_BASE}/api/jobs`;
      const params = [];
      if (statusFilter !== "all") params.push(`status=${statusFilter}`);
      if (search) params.push(`search=${search}`);
      if (params.length) url += `?${params.join("&")}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [statusFilter, search]);

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    try {
      const keywordsArray = syncKeywords.split(",").map((k) => k.trim());
      const res = await fetch(`${API_BASE}/api/jobs/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: keywordsArray, location: syncLocation }),
      });
      if (res.ok) {
        alert("Job scraping sync successfully started in background! Check back in a minute.");
        // Auto-update the main search filter to display the synced results
        if (syncLocation) {
          setSearch(syncLocation);
        } else if (syncKeywords) {
          setSearch(keywordsArray[0]);
        } else {
          fetchJobs();
        }
      }
    } catch (err) {
      console.error("Scraper sync request failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTailorJob = (job: Job) => {
    // Set JD text in global tailoring store and navigate to home/builder view
    const jdContent = job.description || `${job.title} at ${job.company}.\nLocation: ${job.location || 'Not Specified'}\nSalary: ${job.salary || 'Not Specified'}\nSource: ${job.source}\nURL: ${job.url}`;
    
    // Set in Zustand store
    setJdText(jdContent);
    
    // Store job details in localStorage for the outreach pipeline
    localStorage.setItem("current_job_id", job.id);
    localStorage.setItem("current_job_company", job.company);
    localStorage.setItem("current_job_title", job.title);
    
    router.push("/");
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/jobs/${jobId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setJobs(jobs.filter((j) => j.id !== jobId));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Discover Board</h1>
          <p className="text-muted-foreground">
            Aggregate and filter job listings from Naukri, RemoteOk, and Wellfound.
          </p>
        </div>

        {/* Sync Card */}
        <form onSubmit={handleSync} className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3 shadow-xs">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground">Keywords</label>
            <Input
              value={syncKeywords}
              onChange={(e) => setSyncKeywords(e.target.value)}
              placeholder="comma-separated"
              className="h-8 w-[200px] text-xs"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground">Location</label>
            <Input
              value={syncLocation}
              onChange={(e) => setSyncLocation(e.target.value)}
              placeholder="e.g. Bangalore"
              className="h-8 w-[120px] text-xs"
            />
          </div>
          <Button type="submit" disabled={isSyncing} className="mt-4 h-8 text-xs font-medium">
            {isSyncing ? "Running..." : "Sync Scrapers"}
          </Button>
        </form>
      </motion.div>

      {/* Filter and Search Panel */}
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row">
        <Input
          placeholder="Search jobs by title, company, location, description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md h-9 text-sm"
        />

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Status Filter:</span>
          {["all", "New", "Tailored", "Applied", "Rejected"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              onClick={() => setStatusFilter(status)}
              className="h-7 px-3 text-xs"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">Loading job listings...</div>
      ) : jobs.length === 0 ? (
        <div className="py-20 text-center border rounded-lg border-dashed text-muted-foreground">
          No job listings found. Try running "Sync Scrapers" to find new opportunities!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {jobs.map((job) => (
            <Card key={job.id} className="p-5 flex flex-col md:flex-row justify-between gap-4 hover:shadow-sm transition-shadow">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-primary">{job.title}</h3>
                  <Badge variant="outline">{job.source}</Badge>
                  <Badge
                    className={
                      job.status === "Applied"
                        ? "bg-green-600 text-white"
                        : job.status === "Tailored"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-500 text-white"
                    }
                  >
                    {job.status}
                  </Badge>
                </div>
                <div className="text-sm font-semibold text-muted-foreground mb-3">
                  {job.company} &bull; {job.location || "Remote"}
                </div>
                
                {job.salary && (
                  <div className="text-xs text-muted-foreground mb-2">
                    <strong>Salary:</strong> {job.salary}
                  </div>
                )}
                
                {job.description && (
                  <p className="text-xs text-muted-foreground line-clamp-3 mb-2 whitespace-pre-line bg-gray-50 p-2 rounded-sm border border-gray-100">
                    {job.description}
                  </p>
                )}

                <div className="text-[10px] text-muted-foreground mt-2">
                  Scraped at: {new Date(job.scraped_at).toLocaleString()}
                </div>
              </div>

              <div className="flex flex-row md:flex-col justify-end items-stretch gap-2 min-w-[150px]">
                <Button onClick={() => handleTailorJob(job)} size="sm" className="text-xs font-semibold">
                  Tailor Resume
                </Button>
                
                <a href={job.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                    View Post
                  </Button>
                </a>
                
                {job.status === "Tailored" && (
                  <Button
                    onClick={() => {
                      localStorage.setItem("current_job_id", job.id);
                      router.push("/outreach");
                    }}
                    variant="secondary"
                    size="sm"
                    className="text-xs font-semibold"
                  >
                    Outreach Email
                  </Button>
                )}

                <Separator className="my-1 hidden md:block" />

                <Button
                  onClick={() => handleDelete(job.id)}
                  variant="ghost"
                  size="sm"
                  className="text-xs font-semibold text-destructive hover:bg-destructive/10"
                >
                  Remove Listing
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
