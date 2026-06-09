"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Link2, Check, RefreshCw, AlertCircle, Search, X, Lock } from "lucide-react";
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
  const [plan, setPlan] = useState<PlanType>("free");

  // Google Places search / connect states
  const [googleSearchActive, setGoogleSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);

  const loadPlatforms = async () => {
    const { data: biz } = await supabase
      .from("businesses")
      .select("id, plan")
      .maybeSingle();

    if (biz) {
      setBusinessId(biz.id);
      setPlan((biz.plan as PlanType) || "free");
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

  // Check if API key is missing on mount
  useEffect(() => {
    fetch("/api/platforms/google/places-search")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.isMock === "boolean") {
          setIsMockMode(data.isMock);
        }
      })
      .catch((err) => console.error("Error checking places mock status:", err));
  }, []);

  // Handle Toast triggers from URL callback params
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected) {
      toast.success(`Connected to ${connected} Business successfully!`);
      router.replace("/platforms");
    }

    if (error) {
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
      setGoogleSearchActive(true);
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

  const handleGoogleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSelectedPlace(null);
    try {
      const response = await fetch(
        `/api/platforms/google/places-search?query=${encodeURIComponent(searchQuery)}`
      );
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Search failed");

      setSearchResults(resData.places || []);
      if ((resData.places || []).length === 0) {
        toast.error("No businesses found matching that query.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to search Google Places.");
    } finally {
      setSearching(false);
    }
  };

  const handleGoogleConnect = async () => {
    if (!selectedPlace || !businessId) return;

    setConnecting(true);
    const toastId = toast.loading("Connecting your business and syncing reviews...");
    try {
      // Step 3a: Save place_id to platforms table
      const connectResponse = await fetch("/api/platforms/google/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId: selectedPlace.id,
          name: selectedPlace.displayName?.text || selectedPlace.displayName || "Google Business",
          address: selectedPlace.formattedAddress,
        }),
      });

      const connectData = await connectResponse.json();
      if (!connectResponse.ok) throw new Error(connectData.error || "Connection failed");

      // Step 3b: Call /api/platforms/google/fetch-reviews
      const fetchResponse = await fetch("/api/platforms/google/fetch-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: selectedPlace.id }),
      });

      const fetchData = await fetchResponse.json();
      if (!fetchResponse.ok) throw new Error(fetchData.error || "Failed to import reviews");

      toast.success(`${fetchData.importedCount || 0} reviews imported!`, { id: toastId });

      // Reset search states
      setGoogleSearchActive(false);
      setSearchQuery("");
      setSearchResults([]);
      setSelectedPlace(null);

      // Reload platforms
      loadPlatforms();
    } catch (err: any) {
      toast.error(err.message || "Failed to connect business.", { id: toastId });
    } finally {
      setConnecting(false);
    }
  };

  const resetGoogleSearch = () => {
    setGoogleSearchActive(false);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedPlace(null);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-rc-card w-1/4 rounded-lg"></div>
        <div className="h-64 bg-rc-card rounded-xl"></div>
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

                  {key === "google" && googleSearchActive && !connected ? (
                    <div className="mt-4 space-y-4 w-full animate-fade-in">
                      {isMockMode && (
                        <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-[10px] text-yellow-400 flex items-start gap-2 leading-relaxed">
                          <AlertCircle className="h-4 w-4 shrink-0 text-yellow-500" />
                          <span>Configure Google Places API key to enable real reviews (running in simulation mode)</span>
                        </div>
                      )}

                      {/* Step 1: Search Form */}
                      <form onSubmit={handleGoogleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-rc-muted" />
                          <input
                            type="text"
                            placeholder="Search your business on Google"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-rc-bg border border-rc-border rounded-lg pl-8 pr-2 py-2 text-xs text-rc-text placeholder:text-rc-muted focus:outline-none focus:border-rc-accent text-ellipsis"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={searching || !searchQuery.trim()}
                          className="px-3.5 py-2 rounded-lg bg-rc-accent text-rc-bg text-xs font-bold hover:bg-rc-accent-hover transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                        >
                          {searching ? "Searching..." : "Search"}
                        </button>
                      </form>

                      {/* Search Results Dropdown */}
                      {searchResults.length > 0 && !selectedPlace && (
                        <div className="max-h-40 overflow-y-auto border border-rc-border bg-rc-bg rounded-lg divide-y divide-rc-border/60">
                          {searchResults.map((place) => (
                            <button
                              key={place.id}
                              type="button"
                              onClick={() => setSelectedPlace(place)}
                              className="w-full text-left p-2.5 hover:bg-rc-card/50 transition-colors flex flex-col gap-0.5 cursor-pointer"
                            >
                              <span className="text-xs font-semibold text-rc-text">
                                {place.displayName?.text || place.displayName}
                              </span>
                              <span className="text-[10px] text-rc-muted truncate">
                                {place.formattedAddress}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Step 2: Selected Place Confirmation Card */}
                      {selectedPlace && (
                        <div className="p-3 rounded-lg border border-rc-border bg-rc-bg/50 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-rc-text truncate">
                                {selectedPlace.displayName?.text || selectedPlace.displayName}
                              </h4>
                              <p className="text-[10px] text-rc-muted mt-0.5 leading-relaxed">
                                {selectedPlace.formattedAddress}
                              </p>
                              {selectedPlace.rating && (
                                <div className="flex items-center gap-1 mt-1.5">
                                  <span className="text-[10px] text-yellow-500 font-bold">★ {selectedPlace.rating}</span>
                                  <span className="text-[9px] text-rc-muted">({selectedPlace.userRatingCount || 0} reviews)</span>
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedPlace(null)}
                              className="text-rc-muted hover:text-rc-text p-0.5 shrink-0 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={handleGoogleConnect}
                            disabled={connecting}
                            className="w-full py-2 rounded-lg bg-rc-accent text-rc-bg text-xs font-bold hover:bg-rc-accent-hover transition-all shadow-md shadow-rc-accent/15 cursor-pointer disabled:opacity-50 shrink-0"
                          >
                            {connecting ? "Connecting..." : "Connect This Business"}
                          </button>
                        </div>
                      )}

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={resetGoogleSearch}
                          className="text-xs text-rc-muted hover:text-rc-text font-medium cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-rc-muted mt-1 leading-relaxed">
                      {connected
                        ? "Connected and actively syncing reviews."
                        : details.comingSoon
                        ? "This integration will be available in the next release."
                        : "Sync reviews directly from Google Business search lists."}
                    </p>
                  )}
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

              {!(key === "google" && googleSearchActive && !connected) && (
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
                                  PLANS[plan]?.name || "Free"
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
