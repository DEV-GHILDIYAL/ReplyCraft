"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import useSWR from "swr";
import Script from "next/script";
import { CreditCard, Sparkles, Check, CheckCircle2, Shield } from "lucide-react";
import { PLANS } from "@/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function BillingPage() {
  const supabase = createClient();
  const { data: payments, mutate: mutatePayments } = useSWR(
    "/api/payments/history",
    fetcher
  );

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [plan, setPlan] = useState("");
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [trialStartedAt, setTrialStartedAt] = useState<string | null>(null);
  const [aiDraftsUsed, setAiDraftsUsed] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
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
      setBusinessId(biz.id);
      setPlan(biz.plan === "free" ? "trial" : biz.plan);
      setPlanExpiresAt(biz.plan_expires_at);
      setTrialStartedAt(biz.trial_started_at || biz.created_at);
      setAiDraftsUsed(biz.ai_drafts_used || 0);
    } else {
      setBusinessId(null);
      setPlan("trial");
      setPlanExpiresAt(null);
      setTrialStartedAt(new Date().toISOString());
      setAiDraftsUsed(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBusiness();
  }, [supabase]);

  const handleUpgrade = async (selectedPlan: "starter" | "growth" | "scale") => {
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
          name: "ReplyDesk",
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

  // Calculate drafts limit
  const limitValue = plan ? PLANS[plan as keyof typeof PLANS]?.limits.responsesPerMonth ?? 0 : 0;
  const limitDisplay = limitValue === "unlimited" ? "Unlimited" : limitValue;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Script Loader for checkout */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="flex items-center gap-3 mb-8">
        <CreditCard className="h-6 w-6 text-rc-accent" />
        <h1 className="text-2xl font-bold text-rc-text">Billing & Plans</h1>
      </div>

      {/* Trial Countdown Banner */}
      {plan === "trial" && (() => {
        const start = trialStartedAt ? new Date(trialStartedAt) : new Date();
        const now = new Date();
        const diffDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        const daysLeft = Math.max(0, Math.ceil(7 - diffDays));
        return daysLeft > 0 ? (
          <div className="mb-6 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 flex items-center justify-between animate-fade-in text-xs font-semibold">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
              <span>
                You are on the Free Trial. {daysLeft} {daysLeft === 1 ? "day" : "days"} left in your trial.
              </span>
            </div>
          </div>
        ) : null;
      })()}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Plan Summary Card */}
        <div className="p-6 rounded-xl border border-rc-border bg-rc-card space-y-4">
          <span className="text-xs font-bold text-rc-muted uppercase tracking-wider">Plan Summary</span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-bold text-rc-text capitalize">{plan === "trial" ? "Free Trial" : plan}</h3>
            {plan !== "trial" && planExpiresAt && (
              <span className="text-[10px] text-rc-muted">
                Expires: {new Date(planExpiresAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="pt-2 border-t border-rc-border/50">
            <span className="text-xs text-rc-muted block mb-1">AI Drafts Used This Month</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-rc-text">{aiDraftsUsed}</span>
              <span className="text-sm text-rc-muted">/ {limitDisplay} used</span>
            </div>
          </div>
        </div>

        {/* Info card 2 */}
        <div className="md:col-span-2 p-6 rounded-xl border border-rc-border bg-rc-card flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-rc-muted uppercase tracking-wider block mb-2">Usage Insights</span>
            <p className="text-xs text-rc-muted leading-relaxed">
              Your AI draft responses reset monthly on your billing anniversary date. Auto-reply behaves by auto-publishing reviews automatically, which consumes drafts from your quota. Need more answers? Select one of our scalable paid subscriptions below.
            </p>
          </div>
          <div className="text-[10px] text-rc-accent font-semibold pt-4 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Auto-reply auto-publishes responses immediately on all paid plans.
          </div>
        </div>
      </div>

      {/* Plans Comparison */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-bold text-rc-muted uppercase tracking-wider">
          Available Subscription Plans
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {(Object.keys(PLANS) as Array<keyof typeof PLANS>)
            .filter((key) => (key as string) !== "free" && key !== "trial")
            .map((key) => {
              const item = PLANS[key];
              const isActive = plan === key;
              const isPopular = key === "growth";

              return (
                <div
                  key={key}
                  className={`p-6 rounded-xl border flex flex-col justify-between hover:border-rc-border-light transition-all relative ${
                    isActive
                      ? "border-rc-accent bg-rc-accent/5 ring-1 ring-rc-accent"
                      : isPopular
                      ? "border-rc-accent/40 bg-rc-card shadow-lg shadow-rc-accent/5"
                      : "border-rc-border bg-rc-card"
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-rc-accent text-rc-bg text-[10px] font-bold tracking-wide uppercase shadow-sm">
                      Most Popular
                    </span>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-rc-text capitalize">{item.name}</h4>
                    <div className="mt-2 flex items-baseline">
                      <span className="text-2xl font-extrabold text-rc-text">
                        {item.priceDisplay}
                      </span>
                      <span className="text-[10px] text-rc-muted ml-1">/month</span>
                    </div>
                    <ul className="mt-4 space-y-2.5 text-xs text-rc-muted">
                      {item.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <Check className="h-4 w-4 text-rc-accent shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6">
                    {isActive ? (
                      <span className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-rc-accent/15 border border-rc-accent/35 text-rc-accent text-xs font-bold">
                        <CheckCircle2 className="h-4 w-4" />
                        Active Plan
                      </span>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(key as "starter" | "growth" | "scale")}
                        disabled={upgradingPlan !== null}
                        className="w-full py-2.5 rounded-lg bg-rc-accent text-rc-bg text-xs font-bold hover:bg-rc-accent-hover transition-all disabled:opacity-50 cursor-pointer text-center font-bold"
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
      <div className="space-y-4 pt-6">
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

      {/* Trial Expired Hard Paywall Overlay */}
      {plan === "trial" && (() => {
        const start = trialStartedAt ? new Date(trialStartedAt) : new Date();
        const now = new Date();
        const diffDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        const expired = diffDays > 7;
        return expired ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-rc-bg/95 backdrop-blur-md overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
            <div className="max-w-4xl w-full bg-rc-card border border-rc-border rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl relative">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-500 mb-4">
                  <Shield className="h-6 w-6" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-rc-text">
                  Your Free Trial Has Expired
                </h2>
                <p className="mt-3 text-sm text-rc-muted leading-relaxed">
                  Your 7-day free trial has come to an end. To continue syncing customer reviews, generating AI drafts, and using auto-publish rules, please select a paid plan below.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {(Object.keys(PLANS) as Array<keyof typeof PLANS>)
                  .filter((key) => (key as string) !== "free" && key !== "trial")
                  .map((key) => {
                    const item = PLANS[key];
                    const isPopular = key === "growth";

                    return (
                      <div
                        key={key}
                        className={`p-6 rounded-xl border flex flex-col justify-between hover:border-rc-border-light transition-all relative ${
                          isPopular
                            ? "border-rc-accent bg-rc-accent/5 ring-1 ring-rc-accent shadow-lg shadow-rc-accent/5"
                            : "border-rc-border bg-rc-bg/50"
                        }`}
                      >
                        {isPopular && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-rc-accent text-rc-bg text-[10px] font-bold tracking-wide uppercase shadow-sm">
                            Most Popular
                          </span>
                        )}
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
                          <button
                            onClick={() => handleUpgrade(key as "starter" | "growth" | "scale")}
                            disabled={upgradingPlan !== null}
                            className="w-full py-2.5 rounded-lg bg-rc-accent text-rc-bg text-xs font-bold hover:bg-rc-accent-hover transition-all disabled:opacity-50 cursor-pointer text-center font-bold"
                          >
                            {upgradingPlan === key ? "Processing..." : `Upgrade to ${item.name}`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        ) : null;
      })()}
    </div>
  );
}
