"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  Sparkles,
  Building,
  Target,
  AlertCircle,
  Volume2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form fields state
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [website, setWebsite] = useState("");
  const [goal, setGoal] = useState("");
  const [challenge, setChallenge] = useState("");
  const [tone, setTone] = useState("");
  const [reviewVolume, setReviewVolume] = useState("");

  const categories = [
    "Restaurant",
    "Salon",
    "Clinic",
    "Hotel",
    "Retail Store",
    "Cafe",
    "Gym",
    "Spa",
    "Other",
  ];

  const goals = [
    { id: "Get more reviews", label: "Get more reviews", emoji: "🎯", desc: "Increase search ranking and gain reputation" },
    { id: "Improve my rating", label: "Improve my rating", emoji: "⭐", desc: "Build stellar ratings and consumer trust" },
    { id: "Respond faster", label: "Respond faster", emoji: "⚡", desc: "Save time draft-replying instantly with AI" },
    { id: "Look more professional", label: "Look more professional", emoji: "💼", desc: "Engage customers with brand-focused text" },
  ];

  const challenges = [
    { id: "Not enough reviews", label: "Not enough reviews", emoji: "📉", desc: "Struggling to get customers to write reviews" },
    { id: "Negative reviews hurting us", label: "Negative reviews hurting us", emoji: "😤", desc: "Bad feedback ranks us lower in local searches" },
    { id: "No time to respond", label: "No time to respond", emoji: "⏰", desc: "Busy running operations day-to-day" },
    { id: "Don't know what to write", label: "Don't know what to write", emoji: "✍️", desc: "Unsure of how to frame diplomatic responses" },
  ];

  const tones = [
    { id: "Professional", label: "Professional", emoji: "🤝", desc: "Clear and business-like responses" },
    { id: "Friendly", label: "Friendly", emoji: "😊", desc: "Warm and personable replies" },
    { id: "Apologetic", label: "Apologetic", emoji: "🙏", desc: "Empathetic and understanding drafts" },
    { id: "Formal", label: "Formal", emoji: "📋", desc: "Structured and official branding" },
  ];

  const volumes = [
    { id: "1-10", label: "1-10 reviews/mo", emoji: "💬" },
    { id: "11-50", label: "11-50 reviews/mo", emoji: "📈" },
    { id: "51-200", label: "51-200 reviews/mo", emoji: "🚀" },
    { id: "200+", label: "200+ reviews/mo", emoji: "🔥" },
  ];

  const handleNext = () => {
    if (step === 1) {
      if (!businessName.trim()) {
        toast.error("Please enter your business name.");
        return;
      }
      if (!category) {
        toast.error("Please select a business category.");
        return;
      }
    } else if (step === 2) {
      if (!goal) {
        toast.error("Please select your main goal.");
        return;
      }
      if (!challenge) {
        toast.error("Please select your biggest challenge.");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    if (!tone) {
      toast.error("Please select a preferred tone.");
      return;
    }
    if (!reviewVolume) {
      toast.error("Please select your monthly review volume.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Saving your business preferences...");

    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          category,
          website,
          goal,
          challenge,
          tone,
          reviewVolume,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save onboarding settings");

      toast.success("Profile created successfully!", { id: toastId });
      setStep(4); // Advance to final success screen
    } catch (err: any) {
      toast.error(err.message || "An error occurred.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    // Force a complete refresh and redirect to guarantee the layout re-fetches the database business record.
    window.location.href = "/dashboard";
  };

  // Progress percentage logic
  const progressPercent = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="min-h-screen bg-rc-bg text-rc-text flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow animations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-rc-accent/5 blur-[150px] animate-pulse-glow" />
      </div>

      <div className="w-full max-w-2xl relative z-10 space-y-8">
        {/* ReplyDesk Header Logo */}
        <div className="text-center flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rc-accent/10 border border-rc-accent/20">
            <img src="/favicon.svg" alt="ReplyDesk Logo" className="h-7 w-7" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Reply<span className="text-rc-accent">Desk</span>
          </span>
        </div>

        {/* Progress Bar (Only show on wizard steps 1-3) */}
        {step < 4 && (
          <div className="space-y-2.5">
            <div className="flex justify-between text-xs font-semibold text-rc-muted tracking-wider uppercase">
              <span>Step {step} of 3</span>
              <span>{progressPercent}% Complete</span>
            </div>
            <div className="h-2 w-full bg-rc-border rounded-full overflow-hidden">
              <div
                className="h-full bg-rc-accent transition-all duration-500 rounded-full shadow-[0_0_10px_#00d4aa]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Form Wizard Container */}
        <div className="bg-rc-card/50 backdrop-blur-md border border-rc-border p-6 sm:p-10 rounded-3xl shadow-2xl transition-all duration-300">
          
          {/* STEP 1: Tell us about your business */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-rc-accent">
                  <Building className="h-5 w-5" />
                  <h2 className="text-xl font-extrabold tracking-tight">Tell us about your business</h2>
                </div>
                <p className="text-xs text-rc-muted">
                  Let&apos;s establish your business profile information.
                </p>
              </div>

              <div className="space-y-5">
                {/* Name */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-rc-muted uppercase tracking-wider">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Blue Basil Bistro"
                    className="w-full px-4 py-3 rounded-xl bg-rc-bg border border-rc-border text-rc-text placeholder-rc-muted/40 text-sm focus:outline-none focus:border-rc-accent focus:ring-1 focus:ring-rc-accent transition-all duration-200"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-rc-muted uppercase tracking-wider">
                    Business Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-rc-bg border border-rc-border text-rc-text text-sm focus:outline-none focus:border-rc-accent focus:ring-1 focus:ring-rc-accent cursor-pointer transition-all duration-200"
                  >
                    <option value="" disabled>Select a category...</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat.toLowerCase()}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-rc-muted uppercase tracking-wider">
                    Business Website (Optional)
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourbusiness.com"
                    className="w-full px-4 py-3 rounded-xl bg-rc-bg border border-rc-border text-rc-text placeholder-rc-muted/40 text-sm focus:outline-none focus:border-rc-accent focus:ring-1 focus:ring-rc-accent transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Goal and Challenge Selection */}
          {step === 2 && (
            <div className="space-y-8 animate-fade-in">
              {/* Goals */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-rc-accent">
                    <Target className="h-5 w-5" />
                    <h2 className="text-lg font-bold tracking-tight">What is your main goal?</h2>
                  </div>
                  <p className="text-xs text-rc-muted">
                    Select a key objective you wish to drive with ReplyDesk.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {goals.map((g) => {
                    const isSelected = goal === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGoal(g.id)}
                        className={`text-left p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                          isSelected
                            ? "border-rc-accent bg-rc-accent-soft/10 shadow-lg shadow-rc-accent/5 ring-1 ring-rc-accent"
                            : "border-rc-border bg-rc-bg/30 hover:border-rc-border-light hover:bg-rc-bg"
                        }`}
                      >
                        <div className="text-xl mb-1.5">{g.emoji}</div>
                        <h3 className="text-sm font-bold text-rc-text">{g.label}</h3>
                        <p className="text-[11px] text-rc-muted mt-1 leading-normal">{g.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Challenges */}
              <div className="space-y-4 pt-4 border-t border-rc-border/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-rc-accent">
                    <AlertCircle className="h-5 w-5" />
                    <h2 className="text-lg font-bold tracking-tight">What is your biggest challenge?</h2>
                  </div>
                  <p className="text-xs text-rc-muted">
                    Identify your primary pain point in review reputation management.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {challenges.map((c) => {
                    const isSelected = challenge === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setChallenge(c.id)}
                        className={`text-left p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                          isSelected
                            ? "border-rc-accent bg-rc-accent-soft/10 shadow-lg shadow-rc-accent/5 ring-1 ring-rc-accent"
                            : "border-rc-border bg-rc-bg/30 hover:border-rc-border-light hover:bg-rc-bg"
                        }`}
                      >
                        <div className="text-xl mb-1.5">{c.emoji}</div>
                        <h3 className="text-sm font-bold text-rc-text">{c.label}</h3>
                        <p className="text-[11px] text-rc-muted mt-1 leading-normal">{c.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Tone & Review Volume Selection */}
          {step === 3 && (
            <div className="space-y-8 animate-fade-in">
              {/* AI Tones */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-rc-accent">
                    <Volume2 className="h-5 w-5" />
                    <h2 className="text-lg font-bold tracking-tight">Set your AI response style</h2>
                  </div>
                  <p className="text-xs text-rc-muted">
                    Select a default tone for automated AI draft suggestions.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tones.map((t) => {
                    const isSelected = tone === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTone(t.id)}
                        className={`text-left p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                          isSelected
                            ? "border-rc-accent bg-rc-accent-soft/10 shadow-lg shadow-rc-accent/5 ring-1 ring-rc-accent"
                            : "border-rc-border bg-rc-bg/30 hover:border-rc-border-light hover:bg-rc-bg"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-lg">{t.emoji}</span>
                          <h3 className="text-sm font-bold text-rc-text">{t.label}</h3>
                        </div>
                        <p className="text-[11px] text-rc-muted leading-normal">{t.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Monthly Review Volume */}
              <div className="space-y-4 pt-4 border-t border-rc-border/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-rc-accent">
                    <TrendingUp className="h-5 w-5" />
                    <h2 className="text-lg font-bold tracking-tight">How many reviews do you get per month?</h2>
                  </div>
                  <p className="text-xs text-rc-muted">
                    This helps us customize scaling presets for your profile.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {volumes.map((v) => {
                    const isSelected = reviewVolume === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setReviewVolume(v.id)}
                        className={`text-center py-4 px-3 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                          isSelected
                            ? "border-rc-accent bg-rc-accent-soft/10 shadow-lg shadow-rc-accent/5 ring-1 ring-rc-accent"
                            : "border-rc-border bg-rc-bg/30 hover:border-rc-border-light hover:bg-rc-bg"
                        }`}
                      >
                        <span className="text-lg">{v.emoji}</span>
                        <span className="text-xs font-bold text-rc-text">{v.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Success Screen */}
          {step === 4 && (
            <div className="p-4 sm:p-6 text-center space-y-8 animate-fade-in flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rc-accent/15 border border-rc-accent/35 text-rc-accent shadow-[0_0_20px_#00d4aa33] animate-bounce">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-rc-text">
                  You&apos;re all set! 🎉
                </h2>
                <p className="text-sm text-rc-muted max-w-sm mx-auto leading-relaxed">
                  Your dashboard is ready. Connect Google Business when you&apos;re ready to start syncing reviews.
                </p>
              </div>

              <button
                onClick={handleGoToDashboard}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-rc-accent text-rc-bg font-extrabold text-sm hover:bg-rc-accent-hover transition-all duration-200 shadow-xl shadow-rc-accent/20 cursor-pointer flex items-center justify-center gap-2 group"
              >
                Go to Dashboard
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          )}

          {/* Footer Action Navigation Buttons (Steps 1-3) */}
          {step < 4 && (
            <div className="mt-8 pt-6 border-t border-rc-border/50 flex items-center justify-between gap-4">
              {/* Back button */}
              {step > 1 ? (
                <button
                  onClick={handleBack}
                  disabled={loading}
                  className="px-5 py-3 rounded-xl border border-rc-border text-rc-text hover:bg-rc-bg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <div /> // spacer
              )}

              {/* Next/Complete Button */}
              {step < 3 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 rounded-xl bg-rc-accent text-rc-bg hover:bg-rc-accent-hover text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rc-accent/10"
                >
                  Next Step
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-rc-accent text-rc-bg hover:bg-rc-accent-hover text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rc-accent/25 disabled:opacity-60"
                >
                  {loading ? "Completing..." : "Complete Setup 🎉"}
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
