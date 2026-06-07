"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "react-hot-toast";
import {
  Sparkles,
  CheckCircle,
  EyeOff,
  Filter,
  RefreshCw,
  Search,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ResponseDraftModal from "@/components/dashboard/ResponseDraftModal";
import type { Review, PlatformName } from "@/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  google: (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  ),
  yelp: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#D32323">
      <path d="M20.16 12.594l-4.995 1.433a.587.587 0 01-.78-.458.462.462 0 010-.112l.734-5.19a.586.586 0 01.761-.476 6.296 6.296 0 013.734 3.965.586.586 0 01-.453.838z" />
      <path d="M12.75 8.694V2.522a.586.586 0 01.423-.562 6.31 6.31 0 014.742 1.142.586.586 0 01.095.883L13.5 8.963a.586.586 0 01-.868-.082.461.461 0 01-.083-.188z" />
    </svg>
  ),
  facebook: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  trustpilot: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#00B67A">
      <path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z" />
    </svg>
  ),
  g2: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#FF492C" />
      <text x="12" y="15" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="sans-serif">G2</text>
    </svg>
  ),
};

function ReviewCard({
  review,
  onOpenDraft,
  onActionSuccess,
}: {
  review: Review;
  onOpenDraft: () => void;
  onActionSuccess: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const text = review.review_text || "";
  const isLong = text.length > 200;
  const displayText = expanded || !isLong ? text : `${text.substring(0, 200)}...`;

  const handleAction = async (action: "mark_responded" | "ignore") => {
    setLoadingAction(action);
    const toastId = toast.loading(
      action === "mark_responded"
        ? "Marking review as responded..."
        : "Marking review as ignored..."
    );
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.id, action }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Action failed");

      toast.success(
        action === "mark_responded" ? "Marked as responded!" : "Review ignored!",
        { id: toastId }
      );
      onActionSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to process request.", { id: toastId });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="p-6 rounded-2xl border border-rc-border bg-rc-card/40 hover:border-rc-border-light hover:bg-rc-card/70 transition-all duration-300 flex flex-col justify-between">
      <div className="space-y-4">
        {/* Top Info */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-rc-bg border border-rc-border flex items-center justify-center">
              {PLATFORM_ICONS[review.platform] || <MessageSquare className="h-4 w-4 text-rc-accent" />}
            </div>
            <div>
              <span className="text-sm font-bold text-rc-text block">
                {review.reviewer_name || "Anonymous"}
              </span>
              <span className="text-[10px] text-rc-muted uppercase tracking-wider block mt-0.5">
                {review.platform} • {review.review_date ? new Date(review.review_date).toLocaleDateString() : "Recent"}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, idx) => (
                <span
                  key={idx}
                  className={`text-sm ${
                    idx < (review.rating || 0) ? "text-yellow-400" : "text-rc-border"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>

            {review.sentiment && (
              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                review.sentiment === "positive"
                  ? "bg-rc-positive/10 text-rc-positive border-rc-positive/20"
                  : review.sentiment === "neutral"
                  ? "bg-rc-neutral/10 text-rc-neutral border-rc-neutral/20"
                  : "bg-rc-negative/10 text-rc-negative border-rc-negative/20"
              }`}>
                {review.sentiment}
              </span>
            )}
          </div>
        </div>

        {/* Text */}
        <div className="text-sm text-rc-text/90 leading-relaxed">
          <p>{displayText}</p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-rc-accent hover:text-rc-accent-hover font-semibold mt-2 flex items-center gap-1 transition-all"
            >
              {expanded ? (
                <>
                  Show Less <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  Expand Review <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Saved Response View */}
        {review.is_responded && review.response_text && (
          <div className="p-3 rounded-xl bg-rc-bg/50 border border-rc-border/60 mt-2 space-y-1">
            <span className="text-[10px] font-bold text-rc-accent uppercase tracking-wider block">
              Response Drafted
            </span>
            <p className="text-xs text-rc-muted leading-relaxed">
              {review.response_text}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!review.is_responded && (
        <div className="mt-6 pt-4 border-t border-rc-border/50 flex flex-wrap gap-2 justify-end">
          <button
            onClick={() => handleAction("ignore")}
            disabled={loadingAction !== null}
            className="px-3.5 py-1.5 rounded-lg border border-rc-border hover:bg-rc-card-hover text-xs font-semibold text-rc-muted hover:text-rc-text flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <EyeOff className="h-3.5 w-3.5" />
            Ignore
          </button>

          <button
            onClick={() => handleAction("mark_responded")}
            disabled={loadingAction !== null}
            className="px-3.5 py-1.5 rounded-lg border border-rc-border hover:bg-rc-card-hover text-xs font-semibold text-rc-muted hover:text-rc-text flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Mark Responded
          </button>

          <button
            onClick={onOpenDraft}
            className="px-4 py-1.5 rounded-lg bg-rc-accent hover:bg-rc-accent-hover text-xs font-bold text-rc-bg flex items-center gap-1.5 transition-all shadow-md shadow-rc-accent/10"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Draft
          </button>
        </div>
      )}
    </div>
  );
}

export default function ReviewsPage() {
  const [platform, setPlatform] = useState("all");
  const [rating, setRating] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const queryUrl = `/api/reviews?platform=${platform}&rating=${rating}&status=${status}`;
  const { data: reviews, error, isLoading, mutate } = useSWR(queryUrl, fetcher);

  // Client side search filter
  const filteredReviews = (reviews || []).filter((r: Review) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.reviewer_name && r.reviewer_name.toLowerCase().includes(q)) ||
      (r.review_text && r.review_text.toLowerCase().includes(q)) ||
      (r.response_text && r.response_text.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-rc-text tracking-tight">
          Customer Reviews
        </h1>
        <p className="text-sm text-rc-muted mt-1">
          Browse reviews across all connected channels and generate replies.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl border border-rc-border bg-rc-card/20 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-rc-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-rc-bg border border-rc-border text-rc-text placeholder-rc-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-rc-accent/30 focus:border-rc-accent/50 transition-all"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Platform */}
          <div className="flex items-center gap-1.5 flex-1 md:flex-none">
            <span className="text-xs text-rc-muted hidden sm:inline">Platform:</span>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-lg bg-rc-bg border border-rc-border text-rc-text text-xs focus:outline-none focus:ring-2 focus:ring-rc-accent/30 transition-all cursor-pointer"
            >
              <option value="all">All Platforms</option>
              <option value="google">Google</option>
              <option value="yelp">Yelp</option>
              <option value="facebook">Facebook</option>
              <option value="trustpilot">Trustpilot</option>
              <option value="g2">G2</option>
            </select>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1.5 flex-1 md:flex-none">
            <span className="text-xs text-rc-muted hidden sm:inline">Rating:</span>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-lg bg-rc-bg border border-rc-border text-rc-text text-xs focus:outline-none focus:ring-2 focus:ring-rc-accent/30 transition-all cursor-pointer"
            >
              <option value="all">All Ratings</option>
              <option value="4-5">4 & 5 Stars</option>
              <option value="3">3 Stars</option>
              <option value="1-2">1 & 2 Stars</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5 flex-1 md:flex-none">
            <span className="text-xs text-rc-muted hidden sm:inline">Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-lg bg-rc-bg border border-rc-border text-rc-text text-xs focus:outline-none focus:ring-2 focus:ring-rc-accent/30 transition-all cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Reply</option>
              <option value="responded">Responded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid / Feed */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-rc-card border border-rc-border rounded-2xl"></div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-sm text-rc-muted mb-4">Error loading reviews.</p>
          <button
            onClick={() => mutate()}
            className="px-4 py-2 rounded-xl bg-rc-accent text-rc-bg text-xs font-semibold hover:bg-rc-accent-hover transition-all"
          >
            Retry
          </button>
        </div>
      ) : filteredReviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReviews.map((review: Review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onOpenDraft={() => setSelectedReview(review)}
              onActionSuccess={mutate}
            />
          ))}
        </div>
      ) : (
        <div className="p-16 text-center border-2 border-dashed border-rc-border rounded-2xl bg-rc-card/5 max-w-lg mx-auto">
          <Filter className="h-8 w-8 text-rc-border mx-auto mb-4" />
          <h3 className="text-base font-bold text-rc-text mb-2">No reviews match your filters</h3>
          <p className="text-sm text-rc-muted mb-6">
            Try adjusting your search query, rating selectors, or platform filters to find what you are looking for.
          </p>
          <button
            onClick={() => {
              setPlatform("all");
              setRating("all");
              setStatus("all");
              setSearch("");
            }}
            className="px-5 py-2.5 rounded-xl bg-rc-accent/10 border border-rc-accent/20 hover:bg-rc-accent hover:text-rc-bg text-xs font-semibold text-rc-accent transition-all"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Response Draft Modal */}
      {selectedReview && (
        <ResponseDraftModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
          onSuccess={mutate}
        />
      )}
    </div>
  );
}
