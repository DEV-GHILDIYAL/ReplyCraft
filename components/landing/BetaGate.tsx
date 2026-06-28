"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  MessageSquare, 
  Sparkles, 
  Send, 
  Store, 
  BarChart3, 
  Globe, 
  Zap, 
  AlertCircle 
} from "lucide-react";

export default function BetaGate({ onUnlock }: { onUnlock: () => void }) {
  // Beta Code State
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);

  // Waitlist State
  const [email, setEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
  const [waitlistError, setWaitlistError] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");

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
      setCodeError(true);
      setTimeout(() => setCodeError(false), 500); // Remove animation class after playing
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
      setSubmittedEmail(email);
      if (data.count) {
        setWaitlistCount(data.count);
      }
      setEmail("");
    } catch (err: any) {
      setWaitlistStatus("error");
      setWaitlistError(err.message || "An error occurred. Please try again.");
    }
  };

  const WaitlistForm = () => (
    <div className="w-full max-w-md mx-auto">
      {waitlistStatus === "success" ? (
        <div className="bg-rc-positive/10 border border-rc-positive/30 rounded-2xl p-6 text-center animate-fade-in">
          <div className="w-12 h-12 bg-rc-positive/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-rc-positive" />
          </div>
          <h3 className="text-lg font-bold text-rc-text mb-1">You&apos;re on the list!</h3>
          <p className="text-rc-muted text-sm">
            We&apos;ll notify you at <span className="text-rc-text font-medium">{submittedEmail}</span> when we launch.
          </p>
        </div>
      ) : (
        <form onSubmit={handleWaitlistSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              disabled={waitlistStatus === "loading"}
              className="flex-1 px-5 py-3.5 rounded-xl bg-rc-card border border-rc-border text-rc-text placeholder-rc-muted focus:outline-none focus:border-rc-accent focus:ring-1 focus:ring-rc-accent transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={waitlistStatus === "loading"}
              className="px-8 py-3.5 rounded-xl bg-rc-accent text-rc-bg font-bold hover:bg-rc-accent-hover transition-all disabled:opacity-50 flex items-center justify-center whitespace-nowrap shadow-lg shadow-rc-accent/20 hover:shadow-rc-accent/40"
            >
              {waitlistStatus === "loading" ? (
                <svg className="animate-spin h-5 w-5 text-rc-bg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                "Join Waitlist"
              )}
            </button>
          </div>
          {waitlistError && (
            <p className="text-red-400 text-sm text-center flex items-center justify-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              {waitlistError}
            </p>
          )}
          {waitlistCount !== null && (waitlistStatus === "idle" || waitlistStatus === "loading" || waitlistStatus === "error") && (
            <p className="text-sm text-rc-muted text-center flex items-center justify-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rc-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rc-accent"></span>
              </span>
              <span className="font-semibold text-rc-text">{waitlistCount.toLocaleString()}</span> businesses already waiting
            </p>
          )}
        </form>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-rc-bg font-sans flex flex-col relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-rc-accent/5 blur-[120px] animate-float" />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px] animate-float"
          style={{ animationDelay: "2s" }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* NAVBAR */}
      <nav className="relative z-50 border-b border-rc-border/50 bg-rc-bg/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rc-accent/10 border border-rc-accent/20 group-hover:bg-rc-accent/20 transition-colors">
              <img src="/favicon.svg" alt="ReplyDesk Logo" className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-rc-text hidden sm:block">
              Reply<span className="text-rc-accent">Desk</span>
            </span>
          </div>

          <form onSubmit={handleCodeSubmit} className="flex items-center gap-2 relative">
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Beta Code"
              className={`w-32 sm:w-48 px-3 py-1.5 rounded-lg bg-rc-card border ${codeError ? 'border-red-500/50 focus:border-red-500' : 'border-rc-border focus:border-rc-accent'} text-sm text-rc-text placeholder-rc-muted focus:outline-none transition-colors ${codeError ? 'animate-shake' : ''}`}
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-rc-card border border-rc-border text-rc-text text-sm font-medium hover:bg-rc-border-light transition-colors"
            >
              Enter
            </button>
            {codeError && (
              <div className="absolute top-full mt-2 right-0 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-2 py-1 rounded-md">
                Invalid code
              </div>
            )}
          </form>
        </div>
      </nav>

      <main className="flex-grow relative z-10 flex flex-col">
        
        {/* SECTION 1 - HERO */}
        <section className="pt-20 pb-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rc-accent/10 border border-rc-accent/20 text-rc-accent text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Coming Soon
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-rc-text tracking-tight mb-6 leading-tight">
            AI-Powered Review Management for <span className="text-rc-accent">Indian Businesses</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-rc-muted max-w-2xl mx-auto mb-12">
            Automatically respond to Google reviews using AI. Save time, grow your reputation, and turn every customer into a regular.
          </p>

          <WaitlistForm />
        </section>

        {/* SECTION 2 - HOW IT WORKS */}
        <section className="py-24 bg-rc-card/30 border-y border-rc-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-rc-text mb-4">How It Works</h2>
              <p className="text-rc-muted text-lg">Three simple steps to automate your reputation management.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Store,
                  title: "Step 1: Connect",
                  desc: "Securely link your Google Business Profile in just a few clicks."
                },
                {
                  icon: MessageSquare,
                  title: "Step 2: AI Drafts",
                  desc: "Our AI automatically reads incoming reviews and writes context-aware, personalized replies."
                },
                {
                  icon: Send,
                  title: "Step 3: Publish",
                  desc: "Review the drafts and hit publish with one click, or set it to auto-pilot."
                }
              ].map((step, i) => (
                <div key={i} className="bg-rc-card border border-rc-border rounded-2xl p-8 text-center hover:border-rc-accent/50 transition-colors">
                  <div className="w-16 h-16 bg-rc-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rc-accent">
                    <step.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-rc-text mb-3">{step.title}</h3>
                  <p className="text-rc-muted leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3 - FEATURES */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-rc-text mb-4">Everything You Need</h2>
              <p className="text-rc-muted text-lg">Built specifically to save local businesses time and money.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Sparkles, title: "AI Reply Generation", desc: "Human-like responses tailored to the review's sentiment and tone." },
                { icon: BarChart3, title: "Sentiment Analysis", desc: "Track customer satisfaction trends over time with beautiful charts." },
                { icon: Zap, title: "Auto-publish", desc: "Fully automate 5-star review responses while you sleep." },
                { icon: Globe, title: "Multi-platform", desc: "Facebook, Yelp, JustDial support coming soon.", badge: "Coming Soon" }
              ].map((feat, i) => (
                <div key={i} className="bg-rc-card/50 border border-rc-border rounded-2xl p-6 relative overflow-hidden group hover:bg-rc-card transition-colors">
                  <feat.icon className="w-8 h-8 text-rc-accent mb-4" />
                  <h3 className="text-lg font-bold text-rc-text mb-2 flex items-center gap-2">
                    {feat.title}
                    {feat.badge && (
                      <span className="text-[9px] uppercase tracking-wider bg-rc-accent/10 text-rc-accent px-2 py-0.5 rounded-full font-bold">
                        {feat.badge}
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-rc-muted leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4 - PRICING PREVIEW */}
        <section className="py-24 bg-rc-card/30 border-y border-rc-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-rc-text mb-4">Simple Pricing</h2>
              <p className="text-rc-muted text-lg">Affordable plans for businesses of all sizes.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { name: "Starter", price: "₹499", desc: "Perfect for single locations", replies: "50 AI replies/mo" },
                { name: "Growth", price: "₹999", desc: "For growing businesses", replies: "200 AI replies/mo", popular: true },
                { name: "Scale", price: "₹2,000", desc: "For scale operations", replies: "750 AI replies/mo" }
              ].map((plan, i) => (
                <div key={i} className={`bg-rc-card border rounded-2xl p-8 flex flex-col ${plan.popular ? 'border-rc-accent shadow-lg shadow-rc-accent/10 relative' : 'border-rc-border'}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rc-accent text-rc-bg text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-rc-text">{plan.name}</h3>
                  <p className="text-sm text-rc-muted mt-1">{plan.desc}</p>
                  <div className="my-6">
                    <span className="text-4xl font-extrabold text-rc-text">{plan.price}</span>
                    <span className="text-rc-muted">/mo</span>
                  </div>
                  <ul className="mb-8 flex-1 space-y-3">
                    <li className="flex items-center gap-2 text-sm text-rc-text">
                      <div className="w-1.5 h-1.5 rounded-full bg-rc-accent" />
                      {plan.replies}
                    </li>
                    <li className="flex items-center gap-2 text-sm text-rc-text">
                      <div className="w-1.5 h-1.5 rounded-full bg-rc-accent" />
                      Sentiment Dashboard
                    </li>
                  </ul>
                  <div className="w-full py-3 rounded-xl bg-rc-bg border border-rc-border text-rc-muted text-sm font-medium text-center">
                    Launching Soon
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 5 - WAITLIST CTA */}
        <section className="py-32 px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-rc-text mb-6">Be the first to know when we launch</h2>
            <WaitlistForm />
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-rc-border/50 bg-rc-bg py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <img src="/favicon.svg" alt="ReplyDesk Logo" className="h-5 w-5 grayscale opacity-70" />
              <span className="text-lg font-bold text-rc-text">
                Reply<span className="text-rc-muted">Desk</span>
              </span>
            </div>
            <p className="text-sm text-rc-muted">AI Review Management Platform</p>
          </div>
          
          <div className="flex gap-6 text-sm text-rc-muted">
            <a href="#" className="hover:text-rc-text transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-rc-text transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-rc-text transition-colors">Refund Policy</a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 text-center md:text-left text-xs text-rc-muted/50">
          &copy; 2025 ReplyDesk. All rights reserved.
        </div>
      </footer>
      
      {/* Shake animation keyframes */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}} />
    </div>
  );
}
