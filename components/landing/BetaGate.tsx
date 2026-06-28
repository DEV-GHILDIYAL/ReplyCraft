"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function BetaGate({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [email, setEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
  const [waitlistError, setWaitlistError] = useState("");

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/waitlist/count");
        if (res.ok) {
          const data = await res.json();
          setWaitlistCount(data.count);
        }
      } catch (err) {
        console.error("Failed to fetch waitlist count", err);
      }
    }
    fetchCount();
  }, []);

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === "REPLYDESK2025") {
      localStorage.setItem("replydesk_beta_access", "true");
      onUnlock();
    } else {
      setCodeError("Invalid access code");
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setWaitlistStatus("loading");
    setWaitlistError("");

    try {
      const res = await fetch("/api/waitlist/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to join waitlist");
      }

      setWaitlistStatus("success");
      if (data.count) {
        setWaitlistCount(data.count);
      }
    } catch (err: any) {
      setWaitlistStatus("error");
      setWaitlistError(err.message || "An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-rc-bg flex flex-col items-center justify-center p-4">
      {/* Background Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-rc-accent/5 blur-[120px] animate-float" />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-purple-500/5 blur-[100px] animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md bg-rc-card/80 backdrop-blur-xl border border-rc-border p-8 rounded-2xl shadow-2xl shadow-black/50">
        
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-rc-accent/10 border border-rc-accent/20 mb-4">
            <img src="/favicon.svg" alt="ReplyDesk Logo" className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold text-rc-text mb-2 tracking-tight">Coming Soon</h1>
          <p className="text-rc-muted text-sm px-4">
            AI-powered review management for Indian businesses
          </p>
        </div>

        {/* Waitlist Section */}
        <div className="mb-8">
          {waitlistStatus === "success" ? (
            <div className="bg-rc-positive/10 border border-rc-positive/20 rounded-xl p-4 text-center">
              <p className="text-rc-positive font-medium">You&apos;re on the list!</p>
              <p className="text-rc-muted text-sm mt-1">We&apos;ll notify you when we launch.</p>
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} className="flex flex-col gap-3">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email to join waitlist"
                  required
                  disabled={waitlistStatus === "loading"}
                  className="w-full px-4 py-3 rounded-xl bg-rc-bg border border-rc-border text-rc-text placeholder-rc-muted focus:outline-none focus:border-rc-accent focus:ring-1 focus:ring-rc-accent transition-colors disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={waitlistStatus === "loading"}
                className="w-full py-3 rounded-xl bg-rc-accent text-rc-bg font-semibold hover:bg-rc-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {waitlistStatus === "loading" ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-rc-bg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  "Join Waitlist"
                )}
              </button>
              {waitlistError && (
                <p className="text-red-400 text-xs text-center mt-1">{waitlistError}</p>
              )}
            </form>
          )}

          {/* Waitlist Count */}
          <div className="mt-4 text-center">
            {waitlistCount !== null && (
              <p className="text-xs text-rc-muted flex items-center justify-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rc-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rc-accent"></span>
                </span>
                {waitlistCount.toLocaleString()} businesses already waiting
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center py-5">
          <div className="flex-grow border-t border-rc-border"></div>
          <span className="flex-shrink-0 mx-4 text-rc-muted text-xs">or</span>
          <div className="flex-grow border-t border-rc-border"></div>
        </div>

        {/* Beta Code Section */}
        <form onSubmit={handleCodeSubmit} className="mt-2">
          <p className="text-xs text-rc-muted text-center mb-3">
            Already have access? Enter your beta code above
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setCodeError("");
              }}
              placeholder="Beta access code"
              className="flex-1 px-4 py-2.5 rounded-xl bg-rc-bg border border-rc-border text-rc-text placeholder-rc-muted text-sm focus:outline-none focus:border-rc-border-light transition-colors"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-rc-bg border border-rc-border text-rc-text text-sm font-medium hover:bg-rc-card hover:border-rc-border-light transition-colors"
            >
              Enter
            </button>
          </div>
          {codeError && (
            <p className="text-red-400 text-xs text-center mt-2">{codeError}</p>
          )}
        </form>
      </div>
    </div>
  );
}
