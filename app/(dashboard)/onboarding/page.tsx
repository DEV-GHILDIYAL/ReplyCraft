"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BusinessCategory } from "@/types";
import { createClient } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Lock } from "lucide-react";

const categories: { value: BusinessCategory; label: string; icon: string }[] = [
  { value: "restaurant", label: "Restaurant", icon: "🍽️" },
  { value: "salon", label: "Salon & Spa", icon: "💈" },
  { value: "clinic", label: "Clinic", icon: "🏥" },
  { value: "hotel", label: "Hotel", icon: "🏨" },
  { value: "retail", label: "Retail", icon: "🛍️" },
  { value: "other", label: "Other", icon: "🏢" },
];

const ONBOARDING_QUESTIONS = [
  {
    key: "reviewCount",
    question: "How many Google reviews do you currently have?",
    options: ["0-10", "11-50", "51-200", "200+"],
  },
  {
    key: "challenge",
    question: "What is your biggest challenge with reviews?",
    options: [
      "Not enough reviews",
      "Negative reviews",
      "No time to respond",
      "Don't know what to write",
    ],
  },
  {
    key: "responseMethod",
    question: "How do you currently respond to reviews?",
    options: [
      "I don't respond",
      "Manually one by one",
      "Copy-paste template",
      "I have someone else do it",
    ],
  },
  {
    key: "goal",
    question: "What's your goal with ReplyDesk?",
    options: [
      "Save time",
      "Improve rating",
      "Look professional",
      "Get more reviews",
    ],
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState<BusinessCategory | "">("");
  const [loading, setLoading] = useState(false);

  // Questionnaire states
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({
    reviewCount: "",
    challenge: "",
    responseMethod: "",
    goal: "",
  });

  const router = useRouter();
  const supabase = createClient();

  const totalSteps = 3;

  async function handleOnboardingComplete() {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error("You must be logged in to complete onboarding.");
        return;
      }

      // Save business with onboarding_data
      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .insert({
          user_id: user.id,
          name: businessName,
          category: category || null,
          plan: "free",
          onboarding_data: answers,
        })
        .select()
        .single();

      if (businessError) {
        throw businessError;
      }

      toast.success("Business profile created successfully!");
      setStep(3);
    } catch (err: any) {
      toast.error(err.message || "Failed to save business profile.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-rc-muted">
              Step {step} of {totalSteps}
            </span>
            <span className="text-xs text-rc-muted">
              {Math.round((step / totalSteps) * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-rc-border rounded-full overflow-hidden">
            <div
              className="h-full bg-rc-accent rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Business Info */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-rc-text">
                Tell us about your business
              </h2>
              <p className="text-sm text-rc-muted mt-2">
                This helps us tailor AI responses to your industry.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-rc-muted mb-1.5">
                  Business Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your Business Name"
                  className="w-full px-4 py-3 rounded-xl bg-rc-bg/50 border border-rc-border text-rc-text placeholder-rc-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-rc-accent/30 focus:border-rc-accent/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-rc-muted mb-3">
                  Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                        category === cat.value
                          ? "border-rc-accent bg-rc-accent/5 shadow-lg shadow-rc-accent/10"
                          : "border-rc-border bg-rc-card/50 hover:border-rc-border-light hover:bg-rc-card"
                      }`}
                    >
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="text-xs font-medium text-rc-text">
                        {cat.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!businessName || !category}
                className="w-full py-3 px-6 rounded-xl bg-rc-accent text-rc-bg font-semibold text-sm hover:bg-rc-accent-hover transition-all duration-200 shadow-lg shadow-rc-accent/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Questionnaire */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-rc-text">
                Tell us about your business
              </h2>
              <p className="text-xs text-rc-muted mt-2">
                Question {qIndex + 1} of 4
              </p>
              <div className="h-1 bg-rc-border rounded-full overflow-hidden mt-3 w-1/3 mx-auto">
                <div
                  className="h-full bg-rc-accent rounded-full transition-all duration-300"
                  style={{ width: `${((qIndex + 1) / 4) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <h3 className="text-sm font-semibold text-rc-text text-center px-4 leading-relaxed">
                {ONBOARDING_QUESTIONS[qIndex].question}
              </h3>

              <div className="grid grid-cols-1 gap-3">
                {ONBOARDING_QUESTIONS[qIndex].options.map((opt) => {
                  const isSelected = answers[ONBOARDING_QUESTIONS[qIndex].key] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        setAnswers((prev) => ({
                          ...prev,
                          [ONBOARDING_QUESTIONS[qIndex].key]: opt,
                        }))
                      }
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "border-rc-accent bg-rc-accent/5 shadow-md shadow-rc-accent/5"
                          : "border-rc-border bg-rc-card/50 hover:border-rc-border-light hover:bg-rc-card"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-rc-text">{opt}</span>
                        <div
                          className={`h-4 w-4 rounded-full border flex items-center justify-center transition-all ${
                            isSelected
                              ? "border-rc-accent bg-rc-accent"
                              : "border-rc-border bg-transparent"
                          }`}
                        >
                          {isSelected && (
                            <span className="h-1.5 w-1.5 rounded-full bg-rc-bg" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  if (qIndex === 0) {
                    setStep(1);
                  } else {
                    setQIndex(qIndex - 1);
                  }
                }}
                className="flex-1 py-3 px-6 rounded-xl border border-rc-border text-rc-text font-semibold text-sm hover:bg-rc-card transition-all duration-200 cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (qIndex < 3) {
                    setQIndex(qIndex + 1);
                  } else {
                    handleOnboardingComplete();
                  }
                }}
                disabled={loading || !answers[ONBOARDING_QUESTIONS[qIndex].key]}
                className="flex-1 py-3 px-6 rounded-xl bg-rc-accent text-rc-bg font-semibold text-sm hover:bg-rc-accent-hover transition-all duration-200 shadow-lg shadow-rc-accent/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? "Saving..." : qIndex === 3 ? "Complete Setup" : "Next"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="animate-fade-in text-center">
            {/* Success animation */}
            <div className="mb-8">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rc-accent/10 border border-rc-accent/20 animate-scale-in">
                <svg
                  className="h-10 w-10 text-rc-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-rc-text mb-3">
              You&apos;re all set! 🎉
            </h2>
            <p className="text-sm text-rc-muted mb-2">
              <span className="font-medium text-rc-text">{businessName}</span>{" "}
              has been set up successfully.
            </p>
            <p className="text-sm text-rc-muted mb-8 leading-relaxed">
              We&apos;ve customized your experience based on your survey answers. Go ahead and connect your platforms to start syncing reviews!
            </p>

            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3 px-6 rounded-xl bg-rc-accent text-rc-bg font-semibold text-sm hover:bg-rc-accent-hover transition-all duration-200 shadow-lg shadow-rc-accent/20 cursor-pointer"
            >
              Go to Dashboard
              <svg
                className="inline-block ml-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
