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
  Lock,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface Business {
  id: string;
  name: string;
  plan: "trial" | "starter" | "growth" | "scale";
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

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    if (business) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [business]);

  const handleMarkAsRead = async (id: string, link?: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", notificationId: id }),
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(prev - 1, 0));
        if (link) {
          router.push(link);
          setNotificationsOpen(false);
        }
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      }
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

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
          const mappedBiz = {
            ...biz,
            plan: (biz.plan === "free" ? "trial" : biz.plan) as "trial" | "starter" | "growth" | "scale",
          };
          setBusiness(mappedBiz);
          // If on onboarding but business exists, go to dashboard
          if (pathname === "/onboarding") {
            router.push("/dashboard");
          }
          // Route guard for Sentiment page
          if (mappedBiz.plan === "starter" && pathname === "/sentiment") {
            toast.error("Upgrade to Growth plan to access Sentiment Analytics");
            router.push("/settings");
            return;
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
            <img src="/favicon.svg" alt="ReplyDesk Logo" className="h-7 w-7" />
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
        <header className="h-16 border-b border-rc-border bg-rc-card/50 backdrop-blur-sm flex items-center px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rc-accent/10 border border-rc-accent/20">
              <img src="/favicon.svg" alt="ReplyDesk Logo" className="h-5 w-5" />
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
            <img src="/favicon.svg" alt="ReplyDesk Logo" className="h-5 w-5" />
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
            const isLocked = item.name === "Sentiment" && business && business.plan === "starter";

            return (
              <Link
                key={item.name}
                href={isLocked ? "#" : item.href}
                onClick={(e) => {
                  if (isLocked) {
                    e.preventDefault();
                    toast.error("Upgrade to Growth plan to access Sentiment Analytics");
                  }
                }}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-rc-accent text-rc-bg font-semibold shadow-lg shadow-rc-accent/15"
                    : "text-rc-muted hover:text-rc-text hover:bg-rc-card-hover"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </div>
                {isLocked && <Lock className="h-3.5 w-3.5 text-rc-muted shrink-0" />}
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rc-accent/10 border border-rc-accent/20">
                    <img src="/favicon.svg" alt="ReplyDesk Logo" className="h-5 w-5" />
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
                  const isLocked = item.name === "Sentiment" && business && business.plan === "starter";

                  return (
                    <Link
                      key={item.name}
                      href={isLocked ? "#" : item.href}
                      onClick={(e) => {
                        if (isLocked) {
                          e.preventDefault();
                          toast.error("Upgrade to Growth plan to access Sentiment Analytics");
                        } else {
                          setMobileMenuOpen(false);
                        }
                      }}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "bg-rc-accent text-rc-bg font-semibold"
                          : "text-rc-muted hover:text-rc-text hover:bg-rc-card-hover"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </div>
                      {isLocked && <Lock className="h-3.5 w-3.5 text-rc-muted shrink-0" />}
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
        <header className="h-16 border-b border-rc-border bg-rc-card/30 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 z-10">
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
                  business.plan === "trial"
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                    : business.plan === "starter"
                    ? "bg-green-500/15 text-green-400 border border-green-500/30"
                    : business.plan === "growth"
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
            {/* Bell icon and dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-rc-muted hover:text-rc-text hover:bg-rc-card-hover rounded-xl transition-all cursor-pointer focus:outline-none"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-rc-card" />
                )}
              </button>

              {notificationsOpen && (
                <>
                  {/* Backdrop for click outside */}
                  <div
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setNotificationsOpen(false)}
                  />
                  
                  {/* Dropdown Card */}
                  <div className="absolute right-0 mt-2 w-80 bg-rc-card border border-rc-border rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in max-h-96 flex flex-col">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-rc-border bg-rc-card/50 flex items-center justify-between">
                      <span className="text-xs font-bold text-rc-text">
                        Notifications {unreadCount > 0 && `(${unreadCount})`}
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-[10px] text-rc-accent hover:text-rc-accent-hover font-semibold transition-all cursor-pointer focus:outline-none"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    {/* Notification list */}
                    <div className="overflow-y-auto divide-y divide-rc-border/50 max-h-80">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => handleMarkAsRead(notif.id, notif.link)}
                            className={`w-full p-3 text-left hover:bg-rc-card-hover transition-all cursor-pointer flex gap-3 items-start relative focus:outline-none ${
                              !notif.is_read ? "bg-rc-accent/5" : ""
                            }`}
                          >
                            {/* Unread indicator */}
                            {!notif.is_read && (
                              <span className="absolute top-4 right-3 h-2 w-2 bg-blue-500 rounded-full" />
                            )}
                            
                            <div className="flex-1 min-w-0 pr-4">
                              <p className="text-xs text-rc-text leading-relaxed font-medium">
                                {notif.message}
                              </p>
                              <span className="text-[9px] text-rc-muted block mt-1">
                                {new Date(notif.created_at).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-8 text-center text-rc-muted flex flex-col items-center gap-2">
                          <Bell className="h-8 w-8 text-rc-border animate-pulse" />
                          <span className="text-xs font-medium">No notifications yet</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

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
