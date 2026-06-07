"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import useSWR from "swr";
import Script from "next/script";
import { Settings, Shield, User, CreditCard, Sparkles, Check, CheckCircle2 } from "lucide-react";
import { PLANS } from "@/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SettingsPage() {
  const supabase = createClient();
  const { data: payments, mutate: mutatePayments } = useSWR(
    "/api/payments/history",
    fetcher
  );

  const [activeTab, setActiveTab] = useState<"profile" | "billing">("profile");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [plan, setPlan] = useState("");
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  const loadBusiness = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email ?? null);
    }

    const { data: biz } = await supabase
      .from("businesses")
      .select("*")
      .maybeSingle();

    if (biz) {
      setBusinessName(biz.name);
      setCategory(biz.category || "");
      setPlan(biz.plan);
      setPlanExpiresAt(biz.plan_expires_at);
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
      const { error } = await supabase
        .from("businesses")
        .update({ name: businessName, category: category || null })
        .eq("plan", plan); // matches current plan to verify row

      if (error) throw error;
      toast.success("Profile details updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile details");
    } finally {
      setSaving(false);
    }
  };

  const handleUpgrade = async (selectedPlan: "pro" | "business") => {
    setUpgradingPlan(selectedPlan);
    const toastId = toast.loading(`Initiating order for ${selectedPlan} plan...`);
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");

      const orderId = data.order_id;

      if (orderId.startsWith("order_mock_")) {
        // Direct webhook simulation for local mock testing
        const verifyRes = await fetch("/api/payments/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: orderId,
            razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 12)}`,
          }),
        });

        if (verifyRes.ok) {
          toast.success(`Upgraded to ${selectedPlan} plan! (Mock Mode)`, { id: toastId });
          await loadBusiness();
          await mutatePayments();
        } else {
          toast.error("Failed to verify simulated payment.", { id: toastId });
        }
      } else {
        // Open live Razorpay Checkout modal
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_your-key-id",
          amount: data.amount,
          currency: "INR",
          name: "ReplyCraft",
          description: `${selectedPlan.toUpperCase()} Subscription Plan`,
          order_id: orderId,
          handler: async function (response: any) {
            const verifyToast = toast.loading("Verifying transaction details...");
            const verifyRes = await fetch("/api/payments/webhook", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            if (verifyRes.ok) {
              toast.success("Payment verified successfully!", { id: verifyToast });
              await loadBusiness();
              await mutatePayments();
            } else {
              toast.error("Payment validation failed.", { id: verifyToast });
            }
          },
          prefill: {
            email: userEmail || "",
          },
          theme: {
            color: "#00d4aa",
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        toast.dismiss(toastId);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate payment transaction.", { id: toastId });
    } finally {
      setUpgradingPlan(null);
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
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Script Loader for checkout */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-6 w-6 text-rc-accent" />
        <h1 className="text-2xl font-bold text-rc-text">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Navigation Sidebar */}
        <div className="space-y-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full p-4 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === "profile"
                ? "border-rc-accent bg-rc-accent/5 text-rc-accent font-semibold"
                : "border-rc-border bg-rc-card/50 hover:bg-rc-card text-rc-muted hover:text-rc-text"
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-sm">Business Profile</span>
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`w-full p-4 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === "billing"
                ? "border-rc-accent bg-rc-accent/5 text-rc-accent font-semibold"
                : "border-rc-border bg-rc-card/50 hover:bg-rc-card text-rc-muted hover:text-rc-text"
            }`}
          >
            <CreditCard className="h-5 w-5" />
            <span className="text-sm">Billing & Plan</span>
          </button>
        </div>

        {/* Configuration Views */}
        <div className="md:col-span-2">
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="p-6 rounded-xl border border-rc-border bg-rc-card space-y-6 animate-fade-in">
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

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-rc-accent text-rc-bg font-semibold text-sm hover:bg-rc-accent-hover transition-all duration-200 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          )}

          {activeTab === "billing" && (
            <div className="space-y-8 animate-fade-in">
              {/* Current Subscription Status */}
              <div className="p-6 rounded-xl border border-rc-border bg-rc-card space-y-4">
                <h3 className="text-sm font-bold text-rc-muted uppercase tracking-wider">
                  Active Subscription
                </h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-2xl font-black capitalize text-rc-text">
                      {plan} Plan
                    </span>
                    {plan !== "free" && planExpiresAt && (
                      <p className="text-xs text-rc-muted">
                        Renews on: {new Date(planExpiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span className="px-3 py-1 rounded-full bg-rc-accent-soft text-rc-accent border border-rc-accent/30 text-xs font-semibold">
                    {plan === "free" ? "50 replies/mo" : plan === "pro" ? "500 replies/mo" : "Unlimited"}
                  </span>
                </div>
              </div>

              {/* Plans Comparison */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-rc-muted uppercase tracking-wider">
                  Available Plans
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(Object.keys(PLANS) as Array<keyof typeof PLANS>).map((key) => {
                    const item = PLANS[key];
                    const isActive = plan === key;

                    return (
                      <div
                        key={key}
                        className={`p-5 rounded-xl border flex flex-col justify-between hover:border-rc-border-light transition-all ${
                          isActive
                            ? "border-rc-accent bg-rc-accent-soft/5"
                            : "border-rc-border bg-rc-card"
                        }`}
                      >
                        <div>
                          <h4 className="text-sm font-bold text-rc-text capitalize">{item.name}</h4>
                          <div className="mt-2 flex items-baseline">
                            <span className="text-xl font-extrabold text-rc-text">
                              {item.priceDisplay}
                            </span>
                            <span className="text-[10px] text-rc-muted ml-1">/month</span>
                          </div>
                          <ul className="mt-4 space-y-2 text-[11px] text-rc-muted">
                            {item.features.map((feat, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <Check className="h-3.5 w-3.5 text-rc-accent shrink-0" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-6">
                          {isActive ? (
                            <span className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-rc-accent/15 border border-rc-accent/35 text-rc-accent text-xs font-bold">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Active Plan
                            </span>
                          ) : key === "free" ? (
                            <span className="w-full text-center py-2 block rounded-lg bg-rc-border text-rc-muted text-xs font-semibold">
                              Base Tier
                            </span>
                          ) : (
                            <button
                              onClick={() => handleUpgrade(key as "pro" | "business")}
                              disabled={upgradingPlan !== null}
                              className="w-full py-2 rounded-lg bg-rc-accent text-rc-bg text-xs font-bold hover:bg-rc-accent-hover transition-all disabled:opacity-50"
                            >
                              {upgradingPlan === key ? "Processing..." : `Upgrade to ${item.name}`}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment History */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-rc-muted uppercase tracking-wider">
                  Payment History
                </h3>
                <div className="overflow-hidden border border-rc-border rounded-xl bg-rc-card/20">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-rc-border bg-rc-card/50 text-rc-muted font-semibold">
                          <th className="p-4">Date</th>
                          <th className="p-4">Plan</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Transaction ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rc-border/50 text-rc-text">
                        {payments && payments.length > 0 ? (
                          payments.map((p: any) => (
                            <tr key={p.id} className="hover:bg-rc-card/30">
                              <td className="p-4">
                                {new Date(p.created_at).toLocaleDateString()}
                              </td>
                              <td className="p-4 capitalize font-semibold">{p.plan}</td>
                              <td className="p-4">₹{(p.amount / 100).toFixed(2)}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  p.status === "paid"
                                    ? "bg-rc-positive/10 text-rc-positive border border-rc-positive/20"
                                    : p.status === "created" || p.status === "pending"
                                    ? "bg-rc-neutral/10 text-rc-neutral border border-rc-neutral/20"
                                    : "bg-rc-negative/10 text-rc-negative border border-rc-negative/20"
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="p-4 text-rc-muted truncate max-w-[120px]">
                                {p.razorpay_payment_id || p.razorpay_order_id || "N/A"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-rc-muted">
                              No payment transactions recorded.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
