"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "react-hot-toast";
import {
  Star,
  CheckCircle,
  MessageSquare,
  TrendingUp,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Smile,
  Meh,
  Frown,
} from "lucide-react";
import ResponseDraftModal from "@/components/dashboard/ResponseDraftModal";
import type { Review } from "@/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/dashboard/data",
    fetcher
  );
  const [syncing, setSyncing] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const handleSyncMock = async () => {
    setSyncing(true);
    const toastId = toast.loading("Syncing reviews from connected platforms...");
    try {
      const response = await fetch("/api/reviews/mock", {
        method: "POST",
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Sync failed");

      toast.success("Reviews synced successfully!", { id: toastId });
      mutate(); // Refresh dashboard data
    } catch (err: any) {
      toast.error(err.message || "Failed to sync reviews", { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-pulse">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-rc-card rounded-lg"></div>
            <div className="h-4 w-64 bg-rc-card rounded-md mt-2"></div>
          </div>
          <div className="h-10 w-32 bg-rc-card rounded-xl"></div>
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-rc-card border border-rc-border rounded-xl"></div>
          ))}
        </div>

        {/* Content grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-rc-card border border-rc-border rounded-xl"></div>
          <div className="h-96 bg-rc-card border border-rc-border rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !data || data.error) {
    return (
      <div className="p-6 lg:p-8 text-center max-w-md mx-auto mt-20">
        <h2 className="text-xl font-bold text-rc-text mb-2">Error Loading Dashboard</h2>
        <p className="text-sm text-rc-muted mb-6">
          {data?.error || "We encountered an issue fetching your dashboard data. Please try again."}
        </p>
        <button
          onClick={() => mutate()}
          className="px-6 py-2.5 rounded-xl bg-rc-accent text-rc-bg font-semibold text-sm hover:bg-rc-accent-hover transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const stats = data?.stats ?? {
    totalReviews: 0,
    avgRating: 0,
    responseRate: 0,
    pendingResponses: 0,
    platformBreakdown: {}
  };
  const sentiment = data?.sentiment ?? { 
    positive: 0, 
    neutral: 0, 
    negative: 0 
  };
  const recentReviews = data?.recentReviews ?? [];

  // Render donut chart metrics
  const totalSentiment =
    sentiment.positive + sentiment.neutral + sentiment.negative;
  const posPercent = totalSentiment
    ? Math.round((sentiment.positive / totalSentiment) * 100)
    : 0;
  const neuPercent = totalSentiment
    ? Math.round((sentiment.neutral / totalSentiment) * 100)
    : 0;
  const negPercent = totalSentiment
    ? Math.round((sentiment.negative / totalSentiment) * 100)
    : 0;

  // Donut chart stroke metrics (Circumference = 2 * pi * r = 251.2 for r = 40)
  const radius = 40;
  const circ = 2 * Math.PI * radius; // 251.327
  const posStroke = (posPercent / 100) * circ;
  const neuStroke = (neuPercent / 100) * circ;
  const negStroke = (negPercent / 100) * circ;

  const posOffset = 0;
  const neuOffset = -posStroke;
  const negOffset = -(posStroke + neuStroke);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-rc-text tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm text-rc-muted mt-1">
            Monitor review performance and coordinate AI response drafts.
          </p>
        </div>
        <button
          onClick={handleSyncMock}
          disabled={syncing}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rc-accent text-rc-bg font-semibold text-sm hover:bg-rc-accent-hover transition-all duration-200 shadow-lg shadow-rc-accent/15 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          Sync Reviews
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Reviews Card */}
        <div className="relative overflow-hidden group p-6 rounded-2xl border border-rc-border bg-rc-card/50 hover:border-rc-border-light hover:bg-rc-card transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-rc-muted uppercase tracking-wider">
              Total Reviews
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <MessageSquare className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-rc-text">{stats.totalReviews}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(stats.platformBreakdown || {}).map(([platform, count]) => (
              <span
                key={platform}
                className="text-[10px] px-2 py-0.5 rounded-md bg-rc-bg border border-rc-border text-rc-muted capitalize"
              >
                {platform}: {count as number}
              </span>
            ))}
            {Object.keys(stats.platformBreakdown || {}).length === 0 && (
              <span className="text-[10px] text-rc-muted">No platforms connected</span>
            )}
          </div>
        </div>

        {/* Avg Rating Card */}
        <div className="relative overflow-hidden group p-6 rounded-2xl border border-rc-border bg-rc-card/50 hover:border-rc-border-light hover:bg-rc-card transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-rc-muted uppercase tracking-wider">
              Avg Rating
            </span>
            <div className="h-9 w-9 rounded-xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center border border-yellow-500/20">
              <Star className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-rc-text">{stats.avgRating}</p>
            <span className="text-xs text-rc-positive flex items-center gap-0.5">
              ▲ 2.1%
            </span>
          </div>
          <div className="mt-3 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < Math.round(stats.avgRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-rc-border"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Pending Responses Card */}
        <div className="relative overflow-hidden group p-6 rounded-2xl border border-rc-border bg-rc-card/50 hover:border-rc-border-light hover:bg-rc-card transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-rc-muted uppercase tracking-wider">
              Pending Drafts
            </span>
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-rc-text">{stats.pendingResponses}</p>
          <p className="text-xs text-rc-muted mt-3">Needs approval & publish</p>
        </div>

        {/* Response Rate Card */}
        <div className="relative overflow-hidden group p-6 rounded-2xl border border-rc-border bg-rc-card/50 hover:border-rc-border-light hover:bg-rc-card transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-rc-muted uppercase tracking-wider">
              Response Rate
            </span>
            <div className="h-9 w-9 rounded-xl bg-rc-accent/10 text-rc-accent flex items-center justify-center border border-rc-accent/20">
              <CheckCircle className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-rc-text">{stats.responseRate}%</p>
          <div className="mt-3 w-full bg-rc-border rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-rc-accent h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.responseRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Reviews Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-rc-text">Recent Reviews</h2>
            <Link
              href="/reviews"
              className="text-xs text-rc-accent hover:text-rc-accent-hover font-semibold flex items-center gap-1.5 transition-all"
            >
              View All Reviews <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentReviews.length > 0 ? (
              recentReviews.map((review: Review) => (
                <div
                  key={review.id}
                  className="p-5 rounded-xl border border-rc-border bg-rc-card/35 hover:border-rc-border-light transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Platform, Stars, Reviewer */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                          review.platform === "google"
                            ? "bg-[#4285F4]/15 text-[#4285F4]"
                            : review.platform === "yelp"
                            ? "bg-[#D32323]/15 text-[#D32323]"
                            : review.platform === "facebook"
                            ? "bg-[#1877F2]/15 text-[#1877F2]"
                            : "bg-rc-accent/15 text-rc-accent"
                        }`}>
                          {review.platform}
                        </span>
                        <span className="text-xs font-semibold text-rc-text">
                          {review.reviewer_name || "Anonymous"}
                        </span>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <span
                            key={idx}
                            className={`text-sm ${
                              idx < (review.rating || 0)
                                ? "text-yellow-400"
                                : "text-rc-border"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Review Snippet */}
                    <p className="text-sm text-rc-muted line-clamp-3">
                      {review.review_text || "No review text provided."}
                    </p>
                  </div>

                  {/* Actions / Status */}
                  <div className="mt-4 pt-4 border-t border-rc-border/50 flex justify-between items-center">
                    <span className="text-[10px] text-rc-muted">
                      {review.review_date
                        ? new Date(review.review_date).toLocaleDateString()
                        : "Recent"}
                    </span>

                    {review.is_responded ? (
                      <span className="text-xs text-rc-accent font-semibold flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Responded
                      </span>
                    ) : (
                      <button
                        onClick={() => setSelectedReview(review)}
                        className="px-4 py-1.5 rounded-lg bg-rc-accent/10 border border-rc-accent/20 hover:bg-rc-accent hover:text-rc-bg text-xs font-semibold text-rc-accent flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Draft Response
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center rounded-xl border border-dashed border-rc-border bg-rc-card/10">
                <p className="text-sm text-rc-muted mb-4">No reviews found. Seed some to get started!</p>
                <button
                  onClick={handleSyncMock}
                  className="px-5 py-2.5 rounded-xl bg-rc-accent/10 border border-rc-accent/20 hover:bg-rc-accent hover:text-rc-bg text-xs font-semibold text-rc-accent transition-all"
                >
                  Seed Mock Reviews
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sentiment Analysis Sidebar */}
        <div className="p-6 rounded-2xl border border-rc-border bg-rc-card/50 flex flex-col justify-between max-h-[500px]">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-rc-accent" />
              <h2 className="text-lg font-bold text-rc-text">Sentiment Split</h2>
            </div>

            {totalSentiment > 0 ? (
              <div className="space-y-6">
                {/* Custom Donut Chart */}
                <div className="relative flex justify-center py-4">
                  <svg className="w-36 h-36 transform -rotate-90">
                    {/* Background track circle */}
                    <circle
                      cx="72"
                      cy="72"
                      r={radius}
                      stroke="#1e293b"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    {/* Positive segment */}
                    {posStroke > 0 && (
                      <circle
                        cx="72"
                        cy="72"
                        r={radius}
                        stroke="#22c55e"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={`${posStroke} ${circ}`}
                        strokeDashoffset={posOffset}
                      />
                    )}
                    {/* Neutral segment */}
                    {neuStroke > 0 && (
                      <circle
                        cx="72"
                        cy="72"
                        r={radius}
                        stroke="#f59e0b"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={`${neuStroke} ${circ}`}
                        strokeDashoffset={neuOffset}
                      />
                    )}
                    {/* Negative segment */}
                    {negStroke > 0 && (
                      <circle
                        cx="72"
                        cy="72"
                        r={radius}
                        stroke="#ef4444"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={`${negStroke} ${circ}`}
                        strokeDashoffset={negOffset}
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-rc-text">
                      {posPercent}%
                    </span>
                    <span className="text-[10px] font-bold text-rc-positive uppercase tracking-wider">
                      Positive
                    </span>
                  </div>
                </div>

                {/* Legend Breakdown */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Smile className="h-4 w-4 text-rc-positive" />
                      <span className="text-rc-muted font-medium">Positive</span>
                    </div>
                    <span className="text-rc-text font-bold">
                      {sentiment.positive} ({posPercent}%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Meh className="h-4 w-4 text-rc-neutral" />
                      <span className="text-rc-muted font-medium">Neutral</span>
                    </div>
                    <span className="text-rc-text font-bold">
                      {sentiment.neutral} ({neuPercent}%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Frown className="h-4 w-4 text-rc-negative" />
                      <span className="text-rc-muted font-medium">Negative</span>
                    </div>
                    <span className="text-rc-text font-bold">
                      {sentiment.negative} ({negPercent}%)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 flex flex-col items-center gap-3">
                <TrendingUp className="h-10 w-10 text-rc-border animate-pulse" />
                <p className="text-xs text-rc-muted leading-relaxed">
                  No sentiment data available. Sync reviews to populate sentiment breakdown.
                </p>
              </div>
            )}
          </div>

          <div className="text-[10px] text-rc-muted border-t border-rc-border/50 pt-4 mt-4 text-center">
            Updated just now from business imports.
          </div>
        </div>
      </div>

      {/* Response Draft Modal */}
      {selectedReview && (
        <ResponseDraftModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
          onSuccess={() => {
            mutate(); // Refresh stats/recent lists
          }}
        />
      )}
    </div>
  );
}
