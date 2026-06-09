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

const platformOptions = [
  {
    name: "Google",
    id: "google",
    color: "#4285F4",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    ),
  },
  {
    name: "Yelp",
    id: "yelp",
    color: "#D32323",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="#D32323">
        <path d="M20.16 12.594l-4.995 1.433a.587.587 0 01-.78-.458.462.462 0 010-.112l.734-5.19a.586.586 0 01.761-.476 6.296 6.296 0 013.734 3.965.586.586 0 01-.453.838z" />
        <path d="M12.75 8.694V2.522a.586.586 0 01.423-.562 6.31 6.31 0 014.742 1.142.586.586 0 01.095.883L13.5 8.963a.586.586 0 01-.868-.082.461.461 0 01-.083-.188z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    id: "facebook",
    color: "#1877F2",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: "Trustpilot",
    id: "trustpilot",
    color: "#00B67A",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="#00B67A">
        <path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z" />
      </svg>
    ),
  },
  {
    name: "G2",
    id: "g2",
    color: "#FF492C",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#FF492C" />
        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="sans-serif">G2</text>
      </svg>
    ),
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState<BusinessCategory | "">("");
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  const totalSteps = 3;

  function togglePlatform(id: string) {
    if (!connectedPlatforms.includes(id) && connectedPlatforms.length >= 1) {
      toast.error("Free plan is limited to 1 platform connection during setup. Connect others later!");
      return;
    }
    setConnectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleOnboardingComplete() {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error("You must be logged in to complete onboarding.");
        return;
      }
      
      // Save business
      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .insert({
          user_id: user.id,
          name: businessName,
          category: category || null,
          plan: "free",
        })
        .select()
        .single();

      if (businessError) {
        throw businessError;
      }

      // Save connected platforms
      if (connectedPlatforms.length > 0) {
        const platformInserts = connectedPlatforms.map((plat) => ({
          business_id: business.id,
          platform: plat,
          is_active: true,
          platform_url: `https://mock.${plat}.com/biz/123`,
          platform_id: `mock_${plat}_id`,
        }));

        const { error: platformError } = await supabase
          .from("platforms")
          .insert(platformInserts);

        if (platformError) {
          throw platformError;
        }
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
                      onClick={() => setCategory(cat.value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
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
                onClick={() => setStep(2)}
                disabled={!businessName || !category}
                className="w-full py-3 px-6 rounded-xl bg-rc-accent text-rc-bg font-semibold text-sm hover:bg-rc-accent-hover transition-all duration-200 shadow-lg shadow-rc-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Connect Platforms */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-rc-text">
                Connect your platforms
              </h2>
              <p className="text-sm text-rc-muted mt-2">
                Select the platforms where you receive customer reviews.
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {platformOptions.map((platform) => {
                const isSelected = connectedPlatforms.includes(platform.id);
                const isLocked = !isSelected && connectedPlatforms.length >= 1;

                return (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? "border-rc-accent bg-rc-accent/5"
                        : isLocked
                        ? "border-rc-border/40 bg-rc-card/25 opacity-70 cursor-not-allowed"
                        : "border-rc-border bg-rc-card/50 hover:border-rc-border-light hover:bg-rc-card"
                    }`}
                  >
                    {platform.icon}
                    <span className="flex-1 text-left">
                      <span className="text-sm font-medium text-rc-text block">
                        {platform.name}
                      </span>
                      <span className="text-xs text-rc-muted">
                        {isSelected
                          ? "Selected"
                          : isLocked
                          ? "Locked (Limit 1)"
                          : "Click to select"}
                      </span>
                    </span>
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-rc-accent bg-rc-accent"
                          : isLocked
                          ? "border-rc-border/40 bg-transparent"
                          : "border-rc-border"
                      }`}
                    >
                      {isSelected ? (
                        <svg
                          className="h-3 w-3 text-rc-bg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : isLocked ? (
                        <Lock className="h-3 w-3 text-rc-muted" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                disabled={loading}
                className="flex-1 py-3 px-6 rounded-xl border border-rc-border text-rc-text font-semibold text-sm hover:bg-rc-card transition-all duration-200 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleOnboardingComplete}
                disabled={loading}
                className="flex-1 py-3 px-6 rounded-xl bg-rc-accent text-rc-bg font-semibold text-sm hover:bg-rc-accent-hover transition-all duration-200 shadow-lg shadow-rc-accent/20 disabled:opacity-50"
              >
                {loading ? "Saving..." : connectedPlatforms.length > 0 ? "Continue" : "Skip for now"}
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
            {connectedPlatforms.length > 0 && (
              <p className="text-sm text-rc-muted mb-8">
                {connectedPlatforms.length} platform
                {connectedPlatforms.length > 1 ? "s" : ""} selected for
                connection. We&apos;ll guide you through setup in the dashboard.
              </p>
            )}
            {connectedPlatforms.length === 0 && (
              <p className="text-sm text-rc-muted mb-8">
                You can connect platforms later from the dashboard.
              </p>
            )}

            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3 px-6 rounded-xl bg-rc-accent text-rc-bg font-semibold text-sm hover:bg-rc-accent-hover transition-all duration-200 shadow-lg shadow-rc-accent/20"
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
