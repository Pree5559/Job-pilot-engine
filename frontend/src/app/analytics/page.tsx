"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

interface AnalyticsData {
  jobs: {
    total: number;
    tailored: number;
    applied: number;
    breakdown: Record<string, number>;
    sources: Record<string, number>;
  };
  outreach: {
    total: number;
    sent: number;
    simulated: number;
    drafts: number;
    failed: number;
    average_quality_score: number;
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/outreach/analytics`);
        if (res.ok) {
          const stats = await res.json();
          setData(stats);
        }
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return <div className="py-20 text-center text-muted-foreground">Compiling funnel statistics...</div>;
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 text-center text-muted-foreground">
        Failed to aggregate analytics. Verify database migrations completed successfully.
      </div>
    );
  }

  // Calculate percentages
  const tailorRate = data.jobs.total > 0 ? (data.jobs.tailored / data.jobs.total) * 100 : 0;
  const applyRate = data.jobs.total > 0 ? (data.jobs.applied / data.jobs.total) * 100 : 0;
  
  const totalEmailsDispatched = data.outreach.sent + data.outreach.simulated;
  const emailSuccessRate = totalEmailsDispatched > 0 ? (data.outreach.sent / totalEmailsDispatched) * 100 : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Track conversion rates, scrape analytics, and evaluate cold outreach performance metrics.
        </p>
      </motion.div>

      {/* Numerical Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="p-5">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Scraped</div>
          <div className="text-3xl font-extrabold">{data.jobs.total}</div>
          <p className="text-[10px] text-muted-foreground mt-1">Aggregated job posts in DB</p>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Resumes Tailored</div>
          <div className="text-3xl font-extrabold text-blue-600">{data.jobs.tailored}</div>
          <p className="text-[10px] text-muted-foreground mt-1">{Math.round(tailorRate)}% conversion from scraped</p>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Applied / Sent</div>
          <div className="text-3xl font-extrabold text-green-600">{data.jobs.applied}</div>
          <p className="text-[10px] text-muted-foreground mt-1">{Math.round(applyRate)}% conversion from scraped</p>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Avg Email Quality</div>
          <div className="text-3xl font-extrabold text-indigo-600">{data.outreach.average_quality_score}/100</div>
          <p className="text-[10px] text-muted-foreground mt-1">AI evaluated clarity rating</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Conversion Funnel */}
        <Card className="lg:col-span-8 p-6">
          <h2 className="text-lg font-bold mb-4">Application Funnel Conversion</h2>
          <div className="space-y-6 pt-2">
            {/* Step 1 */}
            <div>
              <div className="flex justify-between text-sm font-semibold mb-1">
                <span>1. Aggregated Listings</span>
                <span className="font-bold">{data.jobs.total} Jobs</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-gray-500 h-3 rounded-full" style={{ width: "100%" }}></div>
              </div>
            </div>

            {/* Step 2 */}
            <div>
              <div className="flex justify-between text-sm font-semibold mb-1">
                <span>2. Tailored Resumes</span>
                <span className="font-bold">{data.jobs.tailored} Jobs ({Math.round(tailorRate)}%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${Math.max(5, tailorRate)}%` }}></div>
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <div className="flex justify-between text-sm font-semibold mb-1">
                <span>3. Email Outreach / Applications</span>
                <span className="font-bold">{data.jobs.applied} Jobs ({Math.round(applyRate)}%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-green-600 h-3 rounded-full transition-all" style={{ width: `${Math.max(5, applyRate)}%` }}></div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Email dispatch detail */}
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Outreach Distribution Details</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg bg-gray-50/50">
              <div className="text-xl font-bold text-green-600">{data.outreach.sent}</div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase mt-1">Sent via SMTP</div>
            </div>
            <div className="text-center p-3 border rounded-lg bg-gray-50/50">
              <div className="text-xl font-bold text-blue-500">{data.outreach.simulated}</div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase mt-1">Simulated</div>
            </div>
            <div className="text-center p-3 border rounded-lg bg-gray-50/50">
              <div className="text-xl font-bold text-amber-500">{data.outreach.drafts}</div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase mt-1">Drafts</div>
            </div>
            <div className="text-center p-3 border rounded-lg bg-gray-50/50">
              <div className="text-xl font-bold text-destructive">{data.outreach.failed}</div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase mt-1">Failed</div>
            </div>
          </div>
        </Card>

        {/* Source Breakdowns */}
        <Card className="lg:col-span-4 p-6">
          <h2 className="text-lg font-bold mb-4">Job Board Sources</h2>
          <div className="space-y-4">
            {Object.keys(data.jobs.sources).length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-10">No scraper sources found.</div>
            ) : (
              Object.entries(data.jobs.sources).map(([source, count]) => {
                const percentage = data.jobs.total > 0 ? (count / data.jobs.total) * 100 : 0;
                return (
                  <div key={source} className="flex flex-col">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-bold">{source}</span>
                      <span className="text-muted-foreground font-semibold">{count} ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Separator className="my-6" />

          <h2 className="text-md font-bold mb-3">Target Conversion Goal</h2>
          <div className="text-xs text-muted-foreground space-y-2">
            <p>
              Your current conversion from aggregated job post to outreach email is{" "}
              <strong>{Math.round(applyRate)}%</strong>.
            </p>
            <p className="bg-indigo-50/50 p-3 rounded-md text-indigo-700 font-semibold border border-indigo-100">
              💡 Tip: Maintain a high average email quality score (above 85) to optimize click-throughs and responses.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
