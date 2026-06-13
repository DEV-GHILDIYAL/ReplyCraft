"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Shield, Sparkles, AlertTriangle, ArrowRight, Building, MapPin, CheckCircle2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const stepParam = searchParams.get("step");
  const locationsParam = searchParams.get("locations");
  const accessTokenParam = searchParams.get("access_token");
  const refreshTokenParam = searchParams.get("refresh_token");
  const tokenExpiresAtParam = searchParams.get("token_expires_at");
  const errorParam = searchParams.get("error");

  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLoc, setSelectedLoc] = useState<any | null>(null);

  // Parse locations if available from GMB OAuth callback
  useEffect(() => {
    if (locationsParam) {
      try {
        const decoded = JSON.parse(locationsParam);
        setLocations(decoded);
      } catch (e) {
        console.error("Failed to parse locations from query param:", e);
        toast.error("Failed to load Google locations.");
      }
    }
  }, [locationsParam]);

  // Display OAuth or integration errors if present
  useEffect(() => {
    if (errorParam) {
      if (errorParam === "google_auth_failed") {
        toast.error("Google authentication failed. Please try again.");
      } else {
        toast.error("A system error occurred. Please try again.");
      }
    }
  }, [errorParam]);

  // Determine current step based on OAuth redirect query params
  const currentStep = stepParam === "select-location" ? 2 : 1;

  const handleConnectGoogle = () => {
    setLoading(true);
    window.location.href = "/api/platforms/google/connect";
  };

  const handleSelectLocation = async (loc: any) => {
    setSelectedLoc(loc);
    setLoading(true);
    const toastId = toast.loading(`Connecting your Google Business profile...`);
    try {
      const res = await fetch("/api/platforms/google/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationName: loc.name,
          placeId: loc.place_id,
          locationId: loc.location_id,
          accountId: loc.account_id,
          category: loc.primary_category,
          accessToken: accessTokenParam,
          refreshToken: refreshTokenParam,
          tokenExpiresAt: tokenExpiresAtParam,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to connect business");

      toast.success("Business profile created successfully!", { id: toastId });
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to connect Google location", { id: toastId });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-rc-bg relative overflow-hidden">
      {/* Background glow animations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-rc-accent/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        {/* Step 1: Connect Google Profile */}
        {currentStep === 1 && (
          <div className="p-6 sm:p-10 rounded-2xl border border-rc-border bg-rc-card/50 backdrop-blur-md shadow-2xl space-y-8 animate-fade-in text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rc-accent/10 border border-rc-accent/20 text-rc-accent">
              <Building className="h-7 w-7" />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-rc-text">
                Welcome to Reply<span className="text-rc-accent">Craft</span>
              </h2>
              <p className="text-sm text-rc-muted max-w-md mx-auto leading-relaxed">
                Connect your Google Business Profile to get started. We will verify your location to sync reviews and draft AI responses.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-rc-border bg-rc-bg/40 text-left space-y-3">
              <div className="flex gap-3 text-xs text-rc-muted">
                <CheckCircle2 className="h-4 w-4 text-rc-accent shrink-0 mt-0.5" />
                <span>Only verified locations from your Google account will be imported.</span>
              </div>
              <div className="flex gap-3 text-xs text-rc-muted">
                <CheckCircle2 className="h-4 w-4 text-rc-accent shrink-0 mt-0.5" />
                <span>Zero manual entry required — category and address sync automatically.</span>
              </div>
            </div>

            <button
              onClick={handleConnectGoogle}
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-white text-gray-900 font-bold text-sm hover:bg-gray-100 transition-all duration-200 shadow-lg flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="text-gray-700">Redirecting to Google...</span>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-3 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.82 21.56,11.43 21.35,11.1z" fill="#4285F4" />
                    <path d="M12,20.6c2.6,0 4.78,-0.86 6.38,-2.34l-3.3,-2.58c-0.91,0.61 -2.08,0.98 -3.08,0.98 -2.37,0 -4.38,-1.6 -5.1,-3.76H3.4v2.66C5.02,18.8 8.28,20.6 12,20.6z" fill="#34A853" />
                    <path d="M6.9,12.9c-0.18,-0.54 -0.28,-1.11 -0.28,-1.7c0,-0.59 0.1,-1.16 0.28,-1.7V6.84H3.4C2.78,8.08 2.42,9.5 2.42,11.2c0,1.7 0.36,3.12 0.98,4.36L6.9,12.9z" fill="#FBBC05" />
                    <path d="M12,5.74c1.41,0 2.68,0.49 3.68,1.44L18,4.92C16.36,3.4 14.18,2.54 12,2.54 8.28,2.54 5.02,4.34 3.4,7.48L6.9,10.14c0.72,-2.16 2.73,-3.76 5.1,-3.76z" fill="#EA4335" />
                  </svg>
                  Connect with Google
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 2: Select Location OR Handle No Locations */}
        {currentStep === 2 && (
          <div className="animate-fade-in">
            {locations.length > 0 ? (
              <div className="p-6 sm:p-8 rounded-2xl border border-rc-border bg-rc-card/50 backdrop-blur-md shadow-2xl space-y-6">
                <div className="text-center space-y-2 mb-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rc-accent/10 border border-rc-accent/20 text-rc-accent">
                    <Sparkles className="h-5 w-5 animate-pulse" />
                  </div>
                  <h2 className="text-xl font-bold text-rc-text">
                    Select Your Verified Business
                  </h2>
                  <p className="text-xs text-rc-muted">
                    We found {locations.length} verified {locations.length === 1 ? "location" : "locations"} on your Google account.
                  </p>
                </div>

                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {locations.map((loc) => {
                    const isSelected = selectedLoc?.place_id === loc.place_id;
                    return (
                      <button
                        key={loc.place_id}
                        type="button"
                        onClick={() => handleSelectLocation(loc)}
                        disabled={loading}
                        className={`w-full text-left p-4 rounded-xl border flex flex-col gap-1.5 transition-all duration-200 cursor-pointer disabled:opacity-50 ${
                          isSelected
                            ? "border-rc-accent bg-rc-accent/5 ring-1 ring-rc-accent"
                            : "border-rc-border bg-rc-bg/30 hover:border-rc-border-light hover:bg-rc-bg"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-rc-text leading-tight">{loc.name}</span>
                          <span className="text-[10px] font-bold text-rc-accent bg-rc-accent/15 px-2 py-0.5 rounded border border-rc-accent/25 uppercase shrink-0">
                            {loc.primary_category || "Business"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-rc-muted leading-relaxed">
                          <MapPin className="h-3.5 w-3.5 text-rc-accent shrink-0" />
                          <span className="truncate">{loc.address}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 flex flex-col gap-2.5">
                  <p className="text-[11px] text-rc-muted text-center leading-normal">
                    Don&apos;t see your business? Verify that it is registered and verified on Google My Business.
                  </p>
                  <button
                    onClick={handleConnectGoogle}
                    className="w-full py-2.5 border border-rc-border hover:bg-rc-bg text-xs font-semibold rounded-lg text-rc-text transition-all duration-200 cursor-pointer"
                  >
                    Connect a different Google Account
                  </button>
                </div>
              </div>
            ) : (
              // Step 3: No Locations Found View
              <div className="p-6 sm:p-10 rounded-2xl border border-rc-border bg-rc-card/50 backdrop-blur-md shadow-2xl text-center space-y-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
                  <AlertTriangle className="h-6 w-6" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-rc-text">
                    No Verified Business Locations Found
                  </h2>
                  <p className="text-sm text-rc-muted max-w-sm mx-auto leading-relaxed">
                    We couldn&apos;t find any verified Google Business Profile locations under this account.
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-rc-border">
                  <button
                    onClick={handleConnectGoogle}
                    className="w-full py-3 px-6 rounded-xl bg-rc-accent text-rc-bg font-semibold text-sm hover:bg-rc-accent-hover transition-all duration-200 shadow-lg shadow-rc-accent/20 cursor-pointer"
                  >
                    Try a different Google Account
                  </button>
                  <a
                    href="https://business.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-6 rounded-xl border border-rc-border text-rc-text font-semibold text-sm hover:bg-rc-card transition-all duration-200 inline-flex items-center justify-center"
                  >
                    Learn how to verify on Google
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
