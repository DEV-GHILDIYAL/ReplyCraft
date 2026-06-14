"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  const supabase = createClient();

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [plan, setPlan] = useState("");
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplySchedule, setAutoReplySchedule] = useState("immediately");
  const [autoReplyTime, setAutoReplyTime] = useState("09:00");
  const [autoReplyDay, setAutoReplyDay] = useState("monday");

  // Business onboarding profile fields
  const [goal, setGoal] = useState("");
  const [challenge, setChallenge] = useState("");
  const [tone, setTone] = useState("Professional");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  const loadBusiness = async () => {
    const { data: biz } = await supabase
      .from("businesses")
      .select("*")
      .maybeSingle();

    if (biz) {
      setBusinessId(biz.id);
      setBusinessName(biz.name);
      setCategory(biz.category || "");
      setPlan(biz.plan === "free" ? "trial" : biz.plan);
      setAutoReplyEnabled(biz.auto_reply_enabled || false);
      setAutoReplySchedule(biz.auto_reply_schedule || "immediately");
      setAutoReplyTime(biz.auto_reply_time || "09:00");
      setAutoReplyDay(biz.auto_reply_day || "monday");

      // Load business preferences from onboarding_data
      const onboardingData = biz.onboarding_data || {};
      setGoal(onboardingData.goal || "");
      setChallenge(onboardingData.challenge || "");
      setTone(onboardingData.tone || "Professional");
    } else {
      setBusinessId(null);
      setBusinessName("");
      setCategory("");
      setPlan("trial");
      setAutoReplyEnabled(false);
      setAutoReplySchedule("immediately");
      setAutoReplyTime("09:00");
      setAutoReplyDay("monday");
      setGoal("");
      setChallenge("");
      setTone("Professional");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBusiness();
  }, [supabase]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User session not found. Please log in.");

      if (businessId) {
        // Update existing business
        const { error } = await supabase
          .from("businesses")
          .update({ 
            name: businessName, 
            category: category || null,
            auto_reply_enabled: autoReplyEnabled,
            auto_reply_schedule: autoReplySchedule,
            auto_reply_time: autoReplyTime,
            auto_reply_day: autoReplyDay
          })
          .eq("id", businessId);

        if (error) throw error;
        toast.success("Business information updated successfully!");
      } else {
        // Create new business profile on trial plan
        const { data: newBiz, error } = await supabase
          .from("businesses")
          .insert({
            user_id: user.id,
            name: businessName,
            category: category || null,
            auto_reply_enabled: autoReplyEnabled,
            auto_reply_schedule: autoReplySchedule,
            auto_reply_time: autoReplyTime,
            auto_reply_day: autoReplyDay,
            plan: "trial",
            trial_started_at: new Date().toISOString(),
            ai_drafts_used: 0,
            ai_drafts_reset_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (error || !newBiz) throw error || new Error("Failed to create business profile");
        setBusinessId(newBiz.id);
        toast.success("Business profile created successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save business information");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPreferences(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User session not found. Please log in.");

      let currentBizId = businessId;
      if (!currentBizId) {
        // Create a default business first if none exists
        const { data: newBiz, error } = await supabase
          .from("businesses")
          .insert({
            user_id: user.id,
            name: "My Business",
            plan: "trial",
            trial_started_at: new Date().toISOString(),
            ai_drafts_used: 0,
            ai_drafts_reset_at: new Date().toISOString(),
            onboarding_data: {
              goal,
              challenge,
              tone
            }
          })
          .select("id")
          .single();

        if (error || !newBiz) throw error || new Error("Failed to create business profile");
        setBusinessId(newBiz.id);
        toast.success("Business profile created & preferences saved!");
      } else {
        // Update existing business preferences
        const { error } = await supabase
          .from("businesses")
          .update({ 
            onboarding_data: {
              goal,
              challenge,
              tone
            }
          })
          .eq("id", currentBizId);

        if (error) throw error;
        toast.success("Business profile preferences updated successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save business preferences");
    } finally {
      setSavingPreferences(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-rc-card w-1/4 rounded-lg"></div>
        <div className="h-64 bg-rc-card rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-6 w-6 text-rc-accent" />
        <h1 className="text-2xl font-bold text-rc-text">Settings</h1>
      </div>

      <div className="space-y-8 animate-fade-in">
        {/* Business Information Card */}
        <form onSubmit={handleSaveProfile} className="p-6 rounded-xl border border-rc-border bg-rc-card space-y-6">
          <h2 className="text-base font-bold text-rc-text mb-4 border-b border-rc-border pb-3">
            Business Information
          </h2>

          <div>
            <label className="block text-sm font-medium text-rc-muted mb-1.5">
              Business Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              placeholder="e.g. My Business"
              className="w-full px-4 py-2.5 rounded-xl bg-rc-bg border border-rc-border text-rc-text placeholder-rc-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-rc-accent/30 focus:border-rc-accent/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-rc-muted mb-1.5">
              Industry Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-rc-bg border border-rc-border text-rc-text text-sm focus:outline-none focus:ring-2 focus:ring-rc-accent/30 focus:border-rc-accent/50 transition-all cursor-pointer"
            >
              <option value="">Select Category</option>
              <option value="restaurant">Restaurant</option>
              <option value="salon">Salon & Spa</option>
              <option value="clinic">Clinic</option>
              <option value="hotel">Hotel</option>
              <option value="retail">Retail</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Auto-Reply Mode Toggle */}
          <div>
            <label className="block text-xs font-bold text-rc-muted uppercase tracking-wider mb-2.5">
              Auto-Reply Mode
            </label>
            <div className={`p-4 rounded-xl border flex flex-col gap-4 transition-all ${
              autoReplyEnabled
                ? "border-rc-accent/40 bg-rc-accent/5"
                : "border-rc-border bg-rc-bg/40"
            }`}>
              <div className="flex items-center justify-between">
                <div className="space-y-1 pr-4">
                  <span className="text-sm font-semibold text-rc-text block">
                    Auto-Publish Replies
                  </span>
                  <span className="text-xs text-rc-muted block leading-relaxed">
                    Automatically publish AI responses to Google based on review synchronization and scheduling.
                  </span>
                </div>

                <div className="relative flex items-center shrink-0">
                  {(plan === "starter" || plan === "growth" || plan === "scale") ? (
                    <button
                      type="button"
                      onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-none ${
                        autoReplyEnabled ? "bg-rc-accent" : "bg-rc-border"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-rc-bg absolute top-1 transition-all ${
                        autoReplyEnabled ? "left-6" : "left-1"
                       }`} />
                    </button>
                  ) : (
                    <div className="flex flex-col items-end gap-1.5">
                      <button
                        type="button"
                        disabled
                        className="w-11 h-6 rounded-full bg-rc-border opacity-50 cursor-not-allowed relative"
                      >
                        <span className="w-4 h-4 rounded-full bg-rc-bg absolute top-1 left-1" />
                      </button>
                      <span className="text-[10px] text-yellow-500 font-semibold bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                        Upgrade to Paid Plan
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {autoReplyEnabled && (
                <div className="border-t border-rc-border pt-4 mt-2 space-y-4 animate-fade-in">
                  <h3 className="text-xs font-bold text-rc-text uppercase tracking-wider">Auto-Reply Schedule Settings</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-rc-muted mb-1.5">
                        Schedule Type
                      </label>
                      <select
                        value={autoReplySchedule}
                        onChange={(e) => setAutoReplySchedule(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-rc-bg border border-rc-border text-rc-text text-xs focus:outline-none focus:ring-1 focus:ring-rc-accent"
                      >
                        <option value="immediately">Immediately</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>

                    {autoReplySchedule !== "immediately" && (
                      <div>
                        <label className="block text-[11px] font-semibold text-rc-muted mb-1.5">
                          Time (24h format)
                        </label>
                        <input
                          type="time"
                          value={autoReplyTime}
                          onChange={(e) => setAutoReplyTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-rc-bg border border-rc-border text-rc-text text-xs focus:outline-none focus:ring-1 focus:ring-rc-accent"
                        />
                      </div>
                    )}

                    {autoReplySchedule === "weekly" && (
                      <div>
                        <label className="block text-[11px] font-semibold text-rc-muted mb-1.5">
                          Day of the Week
                        </label>
                        <select
                          value={autoReplyDay}
                          onChange={(e) => setAutoReplyDay(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-rc-bg border border-rc-border text-rc-text text-xs focus:outline-none focus:ring-1 focus:ring-rc-accent"
                        >
                          <option value="monday">Monday</option>
                          <option value="tuesday">Tuesday</option>
                          <option value="wednesday">Wednesday</option>
                          <option value="thursday">Thursday</option>
                          <option value="friday">Friday</option>
                          <option value="saturday">Saturday</option>
                          <option value="sunday">Sunday</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-rc-accent text-rc-bg font-semibold text-sm hover:bg-rc-accent-hover transition-all duration-200 disabled:opacity-50 cursor-pointer font-bold"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>

        {/* Business Profile Preferences Card */}
        <form onSubmit={handleSavePreferences} className="p-6 rounded-xl border border-rc-border bg-rc-card space-y-6">
          <h2 className="text-base font-bold text-rc-text mb-4 border-b border-rc-border pb-3">
            Business Profile & AI Preferences
          </h2>

          <div>
            <label className="block text-sm font-medium text-rc-muted mb-1.5">
              Business Goal
            </label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-rc-bg border border-rc-border text-rc-text text-sm focus:outline-none focus:ring-2 focus:ring-rc-accent/30 focus:border-rc-accent/50 transition-all cursor-pointer"
            >
              <option value="">Select Goal</option>
              <option value="Get more reviews">Get more reviews</option>
              <option value="Improve rating">Improve rating</option>
              <option value="Respond faster">Respond faster</option>
              <option value="Look professional">Look professional</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-rc-muted mb-1.5">
              Biggest Challenge
            </label>
            <select
              value={challenge}
              onChange={(e) => setChallenge(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-rc-bg border border-rc-border text-rc-text text-sm focus:outline-none focus:ring-2 focus:ring-rc-accent/30 focus:border-rc-accent/50 transition-all cursor-pointer"
            >
              <option value="">Select Challenge</option>
              <option value="Not enough reviews">Not enough reviews</option>
              <option value="Negative reviews">Negative reviews</option>
              <option value="No time to respond">No time to respond</option>
              <option value="Don't know what to write">Don't know what to write</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-rc-muted mb-1.5">
              Response Tone Preference
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-rc-bg border border-rc-border text-rc-text text-sm focus:outline-none focus:ring-2 focus:ring-rc-accent/30 focus:border-rc-accent/50 transition-all cursor-pointer"
            >
              <option value="Professional">Professional</option>
              <option value="Friendly">Friendly</option>
              <option value="Apologetic">Apologetic</option>
              <option value="Formal">Formal</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={savingPreferences}
            className="px-6 py-2.5 rounded-xl bg-rc-accent text-rc-bg font-semibold text-sm hover:bg-rc-accent-hover transition-all duration-200 disabled:opacity-50 cursor-pointer font-bold"
          >
            {savingPreferences ? "Saving..." : "Save Preferences"}
          </button>
        </form>
      </div>
    </div>
  );
}
