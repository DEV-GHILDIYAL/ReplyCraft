"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Link2, Check, RefreshCw, AlertCircle, Lock, Sparkles, MapPin, AlertTriangle } from "lucide-react";
import type { Platform, PlanType } from "@/types";
import { PLANS } from "@/types";

interface PlatformDetail {
  name: string;
  color: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}

const PLATFORMS_DETAILS: Record<string, PlatformDetail> = {
  google: {
    name: "Google Business Profile",
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
  yelp: {
    name: "Yelp Reviews",
    color: "#D32323",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="#D32323">
        <path d="M20.16 12.594l-4.995 1.433a.587.587 0 01-.78-.458.462.462 0 010-.112l.734-5.19a.586.586 0 01.761-.476 6.296 6.296 0 013.734 3.965.586.586 0 01-.453.838z" />
        <path d="M12.75 8.694V2.522a.586.586 0 01.423-.562 6.31 6.31 0 014.742 1.142.586.586 0 01.095.883L13.5 8.963a.586.586 0 01-.868-.082.461.461 0 01-.083-.188z" />
      </svg>
    ),
    comingSoon: true,
  },
  facebook: {
    name: "Facebook Pages",
    color: "#1877F2",
    comingSoon: true,
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  trustpilot: {
    name: "Trustpilot",
    color: "#00B67A",
    comingSoon: true,
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="#00B67A">
        <path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z" />
      </svg>
    ),
  },
  g2: {
    name: "G2 Crowd",
    color: "#FF492C",
    comingSoon: true,
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#FF492C" />
        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="sans-serif">G2</text>
      </svg>
    ),
  },
};

export default function PlatformsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanType>("trial");

  // Google OAuth connect flow states
  const stepParam = searchParams.get("step");
  const locationsParam = searchParams.get("locations");
  const accessTokenParam = searchParams.get("access_token");
  const refreshTokenParam = searchParams.get("refresh_token");
  const tokenExpiresAtParam = searchParams.get("token_expires_at");
  const errorParam = searchParams.get("error");

  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLoc, setSelectedLoc] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadPlatforms = async () => {
    const { data: biz } = await supabase
      .from("businesses")
      .select("id, plan")
      .maybeSingle();

    if (biz) {
      setBusinessId(biz.id);
      setPlan((biz.plan as string) === "free" ? "trial" : (biz.plan as PlanType) || "trial");
      const { data: plats } = await supabase
        .from("platforms")
        .select("*")
        .eq("business_id", biz.id);

      if (plats) setPlatforms(plats);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPlatforms();
  }, [supabase]);

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

  // Handle Toast triggers from URL callback params
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected) {
      toast.success(`Connected to ${connected} Business successfully!`);
      router.replace("/platforms");
    }

    if (error && error !== "google_auth_failed") {
      toast.error(
        error === "google_auth_failed"
          ? "Failed to connect to Google account."
          : "An error occurred during platform connection."
      );
      router.replace("/platforms");
    }
  }, [searchParams, router]);

  const handleConnect = (platformKey: string) => {
    if (platformKey === "google") {
      setActionLoading(true);
      window.location.href = "/api/platforms/google/connect";
    }
  };

  const handleDisconnect = async (platformId: string) => {
    const toastId = toast.loading("Disconnecting platform...");
    try {
      const { error } = await supabase
        .from("platforms")
        .delete()
        .eq("id", platformId);

      if (error) throw error;

      toast.success("Platform disconnected successfully", { id: toastId });
      loadPlatforms();
    } catch (err: any) {
      toast.error(err.message || "Failed to disconnect platform", { id: toastId });
    }
  };

  if (loading || actionLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-rc-card w-1/4 rounded-lg"></div>
        <div className="h-64 bg-rc-card rounded-xl"></div>
      </div>
    );
  }

  // Intercept render if we are in select-location step
  if (stepParam === "select-location") {
    return (
      <div className="p-6 lg:p-8 max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <Link2 className="h-6 w-6 text-rc-accent" />
          <h1 className="text-2xl font-bold text-rc-text">Connect Google Business</h1>
        </div>

        {locations.length > 0 ? (
          <div className="p-6 sm:p-8 rounded-2xl border border-rc-border bg-rc-card/50 backdrop-blur-md shadow-2xl space-y-6 animate-fade-in">
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
                    onClick={() => setSelectedLoc(loc)}
                    disabled={actionLoading}
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
              <button
                onClick={async () => {
                  if (!selectedLoc) return;
                  setActionLoading(true);
                  const toastId = toast.loading(`Connecting your Google Business profile...`);
                  try {
                    const res = await fetch("/api/platforms/google/connect", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        locationName: selectedLoc.name,
                        placeId: selectedLoc.place_id,
                        locationId: selectedLoc.location_id,
                        accountId: selectedLoc.account_id,
                        category: selectedLoc.primary_category,
                        accessToken: accessTokenParam,
                        refreshToken: refreshTokenParam,
                        tokenExpiresAt: tokenExpiresAtParam,
                      }),
                    });

                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Failed to connect business");

                    toast.success("Business profile connected successfully!", { id: toastId });
                    router.push("/platforms");
                  } catch (err: any) {
                    toast.error(err.message || "Failed to connect Google location", { id: toastId });
                  } finally {
                    setActionLoading(false);
                  }
                }}
                disabled={actionLoading || !selectedLoc}
                className="w-full py-3 px-6 rounded-xl bg-rc-accent text-rc-bg font-bold text-sm hover:bg-rc-accent-hover transition-all duration-200 shadow-lg cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Connecting..." : "Connect This Business"}
              </button>

              <button
                onClick={() => {
                  router.push("/platforms");
                }}
                disabled={actionLoading}
                className="w-full py-2.5 border border-rc-border hover:bg-rc-bg text-xs font-semibold rounded-lg text-rc-text transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-10 rounded-2xl border border-rc-border bg-rc-card/50 backdrop-blur-md shadow-2xl text-center space-y-6 animate-fade-in">
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
                onClick={() => {
                  window.location.href = "/api/platforms/google/connect";
                }}
                className="w-full py-3 px-6 rounded-xl bg-rc-accent text-rc-bg font-semibold text-sm hover:bg-rc-accent-hover transition-all duration-200 shadow-lg shadow-rc-accent/20 cursor-pointer"
              >
                Try a different Google Account
              </button>
              <button
                onClick={() => {
                  router.push("/platforms");
                }}
                className="w-full py-3 px-6 rounded-xl border border-rc-border text-rc-text font-semibold text-sm hover:bg-rc-card transition-all duration-200"
              >
                Go Back
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Calculate platform limits based on plan
  const connectedCount = platforms.length;
  const config = PLANS[plan];
  const platformLimit = config ? config.limits.platforms : 1;
  const isLimitReached =
    platformLimit !== "unlimited" && connectedCount >= platformLimit;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link2 className="h-6 w-6 text-rc-accent" />
        <h1 className="text-2xl font-bold text-rc-text">Review Platforms</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(PLATFORMS_DETAILS).map(([key, details]) => {
          const connected = platforms.find((p) => p.platform === key);
          const isPlatformLimitReached = !connected && isLimitReached;

          return (
            <div
              key={key}
              className={`p-6 rounded-xl border flex flex-col justify-between transition-all ${
                details.comingSoon
                  ? "border-rc-border/40 bg-rc-card/20 opacity-70"
                  : "border-rc-border bg-rc-card hover:border-rc-border-light"
              }`}
            >
              <div className="flex items-start justify-between w-full">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-rc-text truncate">
                      {details.name}
                    </h3>
                    {details.comingSoon && (
                      <span className="px-2 py-0.5 rounded-full bg-rc-border text-[9px] font-semibold text-rc-muted uppercase tracking-wider shrink-0">
                        Coming Soon
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-rc-muted mt-1 leading-relaxed">
                    {connected
                      ? "Connected and actively syncing reviews."
                      : details.comingSoon
                      ? "This integration will be available in the next release."
                      : "Sync reviews directly from Google Business verified profiles."}
                  </p>
                </div>
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ml-2"
                  style={{
                    backgroundColor: `${details.color}15`,
                  }}
                >
                  {details.icon}
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-rc-border/50 pt-4">
                {connected ? (
                  <>
                    <span className="flex items-center gap-1.5 text-xs text-rc-accent font-semibold">
                      <Check className="h-4 w-4" /> Connected
                    </span>
                    <button
                      onClick={() => handleDisconnect(connected.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-xs font-semibold text-red-400 transition-all cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-rc-muted">
                      {details.comingSoon || isPlatformLimitReached ? (
                        <span className="flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Locked
                        </span>
                      ) : (
                        "Not Connected"
                      )}
                    </span>
                    {!details.comingSoon && (
                      <button
                        onClick={() => {
                          if (isPlatformLimitReached) {
                            toast.error(
                              `Your ${
                                PLANS[plan]?.name || "Free Trial"
                              } plan is limited to ${
                                platformLimit
                              } platform connection. Upgrade in Settings!`
                            );
                            return;
                          }
                          handleConnect(key);
                        }}
                        disabled={isPlatformLimitReached}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isPlatformLimitReached
                            ? "bg-rc-border/50 text-rc-muted cursor-not-allowed opacity-50"
                            : "bg-rc-accent text-rc-bg hover:bg-rc-accent-hover"
                        }`}
                      >
                        Connect Account
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
