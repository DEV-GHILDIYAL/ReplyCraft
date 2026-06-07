"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import {
  LayoutDashboard,
  Star,
  CheckCircle,
  TrendingUp,
  Link2,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Sparkles,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface Business {
  id: string;
  name: string;
  plan: "free" | "pro" | "business";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Sync business from Supabase
  useEffect(() => {
    async function initDashboard() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        setUserEmail(user.email ?? null);

        // Fetch user's business
        const { data: biz, error: bizError } = await supabase
          .from("businesses")
          .select("id, name, plan")
          .maybeSingle();

        if (bizError) {
          console.error("Error fetching business:", bizError);
        }

        if (!biz) {
          // If no business and not on onboarding, redirect to onboarding
          if (pathname !== "/onboarding") {
            router.push("/onboarding");
          }
        } else {
          setBusiness(biz);
          // If on onboarding but business exists, go to dashboard
          if (pathname === "/onboarding") {
            router.push("/dashboard");
          }
        }
      } catch (err) {
        console.error("Dashboard layout initialization error:", err);
      } finally {
        setLoading(false);
      }
    }

    initDashboard();
  }, [pathname, router, supabase]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Reviews", href: "/reviews", icon: Star },
    { name: "Responses", href: "/responses", icon: CheckCircle },
    { name: "Sentiment", href: "/sentiment", icon: TrendingUp },
    { name: "Platforms", href: "/platforms", icon: Link2 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-rc-bg flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rc-accent/10 border border-rc-accent/20 animate-pulse-glow">
            <svg
              className="h-7 w-7 text-rc-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-sm font-semibold text-rc-muted animate-pulse">
            Loading ReplyDesk...
          </p>
        </div>
      </div>
    );
  }

  // On onboarding page, render minimal layout (no sidebar / topbar)
  const isOnboarding = pathname === "/onboarding";

  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-rc-bg text-rc-text">
        <header className="h-16 border-b border-rc-border bg-rc-card/50 backdrop-blur-sm flex items-center px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rc-accent/10 border border-rc-accent/20">
              <svg
                className="h-5 w-5 text-rc-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <span className="text-lg font-bold text-rc-text">
              Reply<span className="text-rc-accent">Desk</span>
            </span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rc-bg flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-rc-border bg-rc-card/50 backdrop-blur-md shrink-0">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-rc-border gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rc-accent/10 border border-rc-accent/20">
            <svg
              className="h-5 w-5 text-rc-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <span className="text-lg font-bold text-rc-text">
            Reply<span className="text-rc-accent">Desk</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-rc-accent text-rc-bg font-semibold shadow-lg shadow-rc-accent/15"
                    : "text-rc-muted hover:text-rc-text hover:bg-rc-card-hover"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-rc-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Menu Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-rc-bg/80 backdrop-blur-sm animate-fade-in">
          <div className="w-64 bg-rc-card border-r border-rc-border p-4 flex flex-col justify-between animate-scale-in">
            <div>
              {/* Brand and Close */}
              <div className="flex items-center justify-between pb-6 border-b border-rc-border">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rc-accent/10">
                    <Sparkles className="h-5 w-5 text-rc-accent" />
                  </div>
                  <span className="text-lg font-bold text-rc-text">ReplyDesk</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-rc-muted hover:text-rc-text hover:bg-rc-border"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="mt-6 space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "bg-rc-accent text-rc-bg font-semibold"
                          : "text-rc-muted hover:text-rc-text hover:bg-rc-card-hover"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Logout button */}
            <div className="border-t border-rc-border pt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-rc-border bg-rc-card/30 backdrop-blur-md flex items-center justify-between px-6 z-10">
          {/* Left info / Mobile toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-rc-muted hover:text-rc-text hover:bg-rc-card transition-all"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Business info */}
            {business && (
              <div className="flex items-center gap-3">
                <span className="text-sm lg:text-base font-bold text-rc-text">
                  {business.name}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  business.plan === "free"
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                    : business.plan === "pro"
                    ? "bg-rc-accent-soft text-rc-accent border border-rc-accent/30"
                    : "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                }`}>
                  {business.plan}
                </span>
              </div>
            )}
          </div>

          {/* Right info */}
          <div className="flex items-center gap-4">
            {/* Bell icon */}
            <button className="relative p-2 text-rc-muted hover:text-rc-text hover:bg-rc-card-hover rounded-xl transition-all">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rc-accent rounded-full ring-2 ring-rc-card" />
            </button>

            {/* Profile avatar */}
            <div className="flex items-center gap-3 border-l border-rc-border pl-4">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs text-rc-muted max-w-[120px] truncate">
                  {userEmail || "User Account"}
                </span>
              </div>
              <div className="h-9 w-9 rounded-xl bg-rc-accent text-rc-bg flex items-center justify-center font-bold border border-rc-accent/20 shadow-md">
                {userEmail ? userEmail.substring(0, 2).toUpperCase() : "RC"}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-rc-bg">
          {children}
        </main>
      </div>
    </div>
  );
}
