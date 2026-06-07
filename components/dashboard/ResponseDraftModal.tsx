"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { X, Sparkles, Send, Check, RefreshCw } from "lucide-react";
import type { Review, Tone } from "@/types";

interface ResponseDraftModalProps {
  review: Review;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ResponseDraftModal({
  review,
  onClose,
  onSuccess,
}: ResponseDraftModalProps) {
  const [tone, setTone] = useState<Tone>("professional");
  const [draftText, setDraftText] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const tones: { value: Tone; label: string; description: string }[] = [
    { value: "professional", label: "💼 Professional", description: "Polite, structured, and helpful" },
    { value: "friendly", label: "😊 Friendly", description: "Warm, casual, and conversational" },
    { value: "apologetic", label: "🙏 Apologetic", description: "Empathetic, understanding, and resolving" },
    { value: "formal", label: "🏛️ Formal", description: "Respectful, clear, and business-focused" },
  ];

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.id, tone }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate draft");

      setDraftText(data.draft.draft_text);
      setDraftId(data.draft.id);
      toast.success("AI draft generated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate AI response.");
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveAndSave = async () => {
    if (!draftText.trim()) {
      toast.error("Draft text cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          draftId: draftId, // if we generated it
          reviewId: review.id, // fallback if we edited directly
          text: draftText,
          tone,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to approve draft");

      toast.success("Response approved and saved!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save response.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!draftText.trim()) {
      toast.error("Draft text cannot be empty.");
      return;
    }

    setPublishing(true);
    try {
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "publish",
          draftId: draftId,
          reviewId: review.id,
          text: draftText,
          tone,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to publish response");

      toast.success("Response published successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to publish response.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-rc-bg/85 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
      {/* Modal Card */}
      <div className="w-full max-w-2xl bg-rc-card border border-rc-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rc-border">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-rc-accent" />
            <h2 className="text-lg font-bold text-rc-text">Draft AI Response</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-rc-muted hover:text-rc-text hover:bg-rc-border transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Review Card Inside Modal */}
          <div className="p-4 rounded-xl bg-rc-bg border border-rc-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rc-text block">
                {review.reviewer_name || "Anonymous"}
              </span>
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
            <p className="text-sm text-rc-text leading-relaxed">
              {review.review_text || "No text provided in this review."}
            </p>
          </div>

          {/* Tone Selector */}
          <div>
            <label className="block text-xs font-bold text-rc-muted uppercase tracking-wider mb-3">
              Select Response Tone
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tones.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    tone === t.value
                      ? "border-rc-accent bg-rc-accent/5 shadow-md shadow-rc-accent/10"
                      : "border-rc-border bg-rc-card hover:border-rc-border-light"
                  }`}
                >
                  <span className="text-sm font-semibold text-rc-text block">
                    {t.label}
                  </span>
                  <span className="text-[10px] text-rc-muted mt-1 block">
                    {t.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate / Editor Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-rc-muted uppercase tracking-wider">
                Response Draft
              </label>
              {draftText && (
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center gap-1 text-xs text-rc-accent hover:text-rc-accent-hover font-semibold transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${generating ? "animate-spin" : ""}`} />
                  Regenerate
                </button>
              )}
            </div>

            {draftText ? (
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                rows={5}
                className="w-full p-4 rounded-xl bg-rc-bg border border-rc-border text-rc-text placeholder-rc-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-rc-accent/30 focus:border-rc-accent/50 transition-all resize-none"
              />
            ) : (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-8 rounded-xl border-2 border-dashed border-rc-border bg-rc-bg/30 flex flex-col items-center justify-center gap-2 hover:border-rc-accent/40 group transition-all"
              >
                <div className="h-10 w-10 rounded-full bg-rc-accent/10 flex items-center justify-center text-rc-accent group-hover:scale-110 transition-transform">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </div>
                <span className="text-sm font-semibold text-rc-text">
                  {generating ? "Crafting response..." : "Generate AI Draft"}
                </span>
                <span className="text-xs text-rc-muted">
                  Using Llama 3.1 model to draft a perfect reply.
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-rc-border bg-rc-card/50 flex flex-wrap gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-rc-border text-rc-text text-sm font-medium hover:bg-rc-bg transition-all"
          >
            Cancel
          </button>
          
          {draftText && (
            <>
              <button
                onClick={handleApproveAndSave}
                disabled={saving || publishing}
                className="px-5 py-2.5 rounded-xl bg-rc-bg border border-rc-border text-rc-text hover:text-rc-accent hover:border-rc-accent/50 text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Approve & Save
              </button>

              <button
                onClick={handlePublish}
                disabled={saving || publishing}
                className="px-5 py-2.5 rounded-xl bg-rc-accent text-rc-bg hover:bg-rc-accent-hover text-sm font-semibold flex items-center gap-2 shadow-lg shadow-rc-accent/10 transition-all disabled:opacity-50"
              >
                {publishing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Publish Response
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
