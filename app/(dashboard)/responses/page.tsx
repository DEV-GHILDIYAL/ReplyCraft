"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "react-hot-toast";
import {
  CheckCircle,
  XCircle,
  Edit2,
  Send,
  Trash2,
  RotateCcw,
  Sparkles,
  Inbox,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import type { ResponseDraft, Review } from "@/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ExtendedDraft extends ResponseDraft {
  reviews: Review; // Joined review details
}

export default function ResponsesPage() {
  const { data: drafts, error, isLoading, mutate } = useSWR<ExtendedDraft[] | { error: string }>(
    "/api/responses",
    fetcher
  );

  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "published" | "rejected">(
    "pending"
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingAction, setSavingAction] = useState<string | null>(null);
  const [bulkApproving, setBulkApproving] = useState(false);

  const hasNoBusiness = drafts && ("error" in drafts || (drafts as any).error === "Business profile not found");

  // Group drafts by status
  const draftsArray = Array.isArray(drafts) ? drafts : [];
  const filteredDrafts = draftsArray.filter(
    (draft) => draft.status === activeTab
  );

  const handleAction = async (
    action: "approve" | "reject" | "publish" | "restore",
    draft: ExtendedDraft
  ) => {
    setSavingAction(`${action}-${draft.id}`);
    const toastId = toast.loading(`Processing draft change...`);
    try {
      let resolvedAction = action;
      if (action === "restore") resolvedAction = "approve"; // Restore behaves like approve/save

      const response = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: resolvedAction,
          draftId: draft.id,
          reviewId: draft.review_id,
          text: draft.draft_text,
          tone: draft.tone,
        }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Action failed");

      toast.success(
        action === "approve"
          ? "Draft approved!"
          : action === "reject"
          ? "Draft rejected!"
          : action === "publish"
          ? "Response published!"
          : "Draft restored to queue!",
        { id: toastId }
      );
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Action failed.", { id: toastId });
    } finally {
      setSavingAction(null);
    }
  };

  const handleSaveEdit = async (draft: ExtendedDraft) => {
    if (!editText.trim()) {
      toast.error("Response content cannot be empty.");
      return;
    }

    setSavingAction(`edit-${draft.id}`);
    try {
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit",
          draftId: draft.id,
          text: editText,
        }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Edit failed");

      toast.success("Draft updated!");
      setEditingId(null);
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to edit draft.");
    } finally {
      setSavingAction(null);
    }
  };

  const handleBulkApprove = async () => {
    const pendingCount = draftsArray.filter((d) => d.status === "pending").length;
    if (pendingCount === 0) {
      toast.error("No pending drafts to approve.");
      return;
    }

    setBulkApproving(true);
    const toastId = toast.loading("Approving all pending drafts...");
    try {
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk_approve" }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Bulk approval failed");

      toast.success(`Successfully approved ${resData.count} drafts!`, { id: toastId });
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Bulk approval failed.", { id: toastId });
    } finally {
      setBulkApproving(false);
    }
  };

  const startEditing = (draft: ExtendedDraft) => {
    setEditingId(draft.id);
    setEditText(draft.draft_text);
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
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-rc-card border border-rc-border rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (hasNoBusiness) {
    return (
      <div className="p-6 lg:p-8 max-w-xl mx-auto mt-20 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rc-accent/10 border border-rc-accent/20 text-rc-accent">
          <Sparkles className="h-8 w-8 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-rc-text">
            Connect your Google Business Profile to get started
          </h2>
          <p className="text-sm text-rc-muted max-w-sm mx-auto leading-relaxed">
            Connect your profile to start syncing reviews and drafting automated, AI-powered response drafts.
          </p>
        </div>
        <Link
          href="/platforms"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rc-accent text-rc-bg font-semibold text-sm hover:bg-rc-accent-hover transition-all duration-200 shadow-lg shadow-rc-accent/15"
        >
          Connect Google Business Profile
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-rc-muted mb-4">Error loading drafts queue.</p>
        <button
          onClick={() => mutate()}
          className="px-4 py-2 rounded-xl bg-rc-accent text-rc-bg text-xs font-semibold hover:bg-rc-accent-hover transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  const tabs: { value: typeof activeTab; label: string; count: number }[] = [
    {
      value: "pending",
      label: "Pending Approval",
      count: draftsArray.filter((d) => d.status === "pending").length,
    },
    {
      value: "approved",
      label: "Approved",
      count: draftsArray.filter((d) => d.status === "approved").length,
    },
    {
      value: "published",
      label: "Published",
      count: draftsArray.filter((d) => d.status === "published").length,
    },
    {
      value: "rejected",
      label: "Rejected",
      count: draftsArray.filter((d) => d.status === "rejected").length,
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-rc-text tracking-tight">
            Responses Queue
          </h1>
          <p className="text-sm text-rc-muted mt-1">
            Review, refine, and dispatch generated drafts to your channels.
          </p>
        </div>

        {activeTab === "pending" && (
          <button
            onClick={handleBulkApprove}
            disabled={bulkApproving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rc-accent text-rc-bg font-semibold text-sm hover:bg-rc-accent-hover transition-all duration-200 shadow-lg shadow-rc-accent/15 disabled:opacity-60"
          >
            {bulkApproving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Bulk Approve
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-rc-border flex gap-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveTab(tab.value);
              setEditingId(null);
            }}
            className={`pb-4 text-sm font-semibold transition-all relative whitespace-nowrap ${
              activeTab === tab.value
                ? "text-rc-accent font-bold"
                : "text-rc-muted hover:text-rc-text"
            }`}
          >
            {tab.label}
            <span className="ml-2 px-2 py-0.5 rounded-full bg-rc-card border border-rc-border text-[10px] font-bold">
              {tab.count}
            </span>
            {activeTab === tab.value && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rc-accent rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filteredDrafts.length > 0 ? (
        <div className="space-y-6">
          {filteredDrafts.map((draft) => {
            const review = draft.reviews;
            const isEditing = editingId === draft.id;
            const isSaving = savingAction?.includes(draft.id);

            return (
              <div
                key={draft.id}
                className="p-6 rounded-2xl border border-rc-border bg-rc-card/35 flex flex-col lg:flex-row gap-6 justify-between hover:border-rc-border-light transition-all"
              >
                {/* Review Context (Left Column) */}
                <div className="lg:w-1/2 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-rc-text block">
                        {review?.reviewer_name || "Anonymous"}
                      </span>
                      <span className="text-[10px] text-rc-muted uppercase tracking-wider block mt-0.5">
                        {review?.platform} • {review?.review_date ? new Date(review.review_date).toLocaleDateString() : "Recent"}
                      </span>
                    </div>

                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <span
                          key={idx}
                          className={`text-xs ${
                            idx < (review?.rating || 0) ? "text-yellow-400" : "text-rc-border"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-rc-bg border border-rc-border/50 text-sm text-rc-muted leading-relaxed">
                    "{review?.review_text || "No review content."}"
                  </div>
                </div>

                {/* Draft Reply Editor (Right Column) */}
                <div className="lg:w-1/2 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-rc-accent uppercase tracking-wider">
                        Response Draft ({draft.tone})
                      </span>
                      {!isEditing && draft.status !== "published" && (
                        <button
                          onClick={() => startEditing(draft)}
                          className="text-rc-muted hover:text-rc-text flex items-center gap-1 font-semibold transition-all"
                        >
                          <Edit2 className="h-3 w-3" /> Edit Response
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={4}
                        className="w-full p-4 rounded-xl bg-rc-bg border border-rc-accent text-rc-text text-sm focus:outline-none transition-all resize-none"
                      />
                    ) : (
                      <div className="p-4 rounded-xl bg-rc-bg/30 border border-rc-border text-sm text-rc-text leading-relaxed">
                        {draft.draft_text}
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="flex gap-2 justify-end">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 rounded-lg border border-rc-border hover:bg-rc-card-hover text-xs font-semibold text-rc-muted"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(draft)}
                          disabled={isSaving}
                          className="px-4 py-2 rounded-lg bg-rc-accent text-rc-bg text-xs font-bold hover:bg-rc-accent-hover flex items-center gap-1"
                        >
                          Save Changes
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Status Dependent Actions */}
                        {draft.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleAction("reject", draft)}
                              disabled={isSaving}
                              className="px-4 py-2 rounded-lg border border-rc-border hover:bg-red-500/10 text-xs font-bold text-rc-muted hover:text-red-400 flex items-center gap-1.5 transition-all"
                            >
                              <XCircle className="h-4 w-4" /> Reject
                            </button>
                            <button
                              onClick={() => handleAction("approve", draft)}
                              disabled={isSaving}
                              className="px-4 py-2 rounded-lg bg-rc-accent/10 hover:bg-rc-accent border border-rc-accent/20 hover:text-rc-bg text-xs font-bold text-rc-accent flex items-center gap-1.5 transition-all"
                            >
                              <CheckCircle className="h-4 w-4" /> Approve
                            </button>
                          </>
                        )}

                        {draft.status === "approved" && (
                          <>
                            <button
                              onClick={() => handleAction("reject", draft)}
                              disabled={isSaving}
                              className="px-4 py-2 rounded-lg border border-rc-border hover:bg-red-500/10 text-xs font-bold text-rc-muted hover:text-red-400 flex items-center gap-1.5 transition-all"
                            >
                              <XCircle className="h-4 w-4" /> Reject
                            </button>
                            <button
                              onClick={() => handleAction("publish", draft)}
                              disabled={isSaving}
                              className="px-4 py-2 rounded-lg bg-rc-accent hover:bg-rc-accent-hover text-xs font-bold text-rc-bg flex items-center gap-1.5 transition-all shadow-md shadow-rc-accent/15"
                            >
                              <Send className="h-4 w-4" /> Publish Response
                            </button>
                          </>
                        )}

                        {draft.status === "published" && (
                          <span className="text-xs font-semibold text-rc-positive flex items-center gap-1.5 bg-rc-positive/10 px-3 py-1.5 border border-rc-positive/20 rounded-lg">
                            <CheckCircle className="h-4 w-4" /> Published to Channel
                          </span>
                        )}

                        {draft.status === "rejected" && (
                          <button
                            onClick={() => handleAction("restore", draft)}
                            disabled={isSaving}
                            className="px-4 py-2 rounded-lg border border-rc-border hover:bg-rc-card-hover text-xs font-bold text-rc-muted hover:text-rc-text flex items-center gap-1.5 transition-all"
                          >
                            <RotateCcw className="h-4 w-4" /> Restore to Queue
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center border-2 border-dashed border-rc-border rounded-2xl bg-rc-card/5 max-w-lg mx-auto">
          <Inbox className="h-10 w-10 text-rc-border mx-auto mb-4" />
          <h3 className="text-base font-bold text-rc-text mb-2 uppercase tracking-wide">
            Queue is Empty
          </h3>
          <p className="text-sm text-rc-muted mb-6">
            There are no drafts in the "{activeTab}" folder at the moment. Generate new drafts from the Reviews feed page!
          </p>
        </div>
      )}
    </div>
  );
}
