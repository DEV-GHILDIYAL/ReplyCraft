"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);
      } catch (err) {
        console.error("Error checking auth:", err);
        setIsLoggedIn(false);
      } finally {
        setAuthChecked(true);
      }
    }
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session) {
            const { data: { user } } = await supabase.auth.getUser();
            setIsLoggedIn(!!user);
          } else {
            setIsLoggedIn(false);
          }
        } catch (err) {
          console.error("Error on auth state change:", err);
          setIsLoggedIn(false);
        } finally {
          setAuthChecked(true);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rc-accent/10 border border-rc-accent/20 group-hover:bg-rc-accent/20 transition-colors">
              <img src="/favicon.svg" alt="ReplyDesk Logo" className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-rc-text">
              Reply<span className="text-rc-accent">Desk</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#how-it-works"
              className="text-sm text-rc-muted hover:text-rc-text transition-colors"
            >
              How It Works
            </a>
            <a
              href="#platforms"
              className="text-sm text-rc-muted hover:text-rc-text transition-colors"
            >
              Platforms
            </a>
            <a
              href="#pricing"
              className="text-sm text-rc-muted hover:text-rc-text transition-colors"
            >
              Pricing
            </a>
          </div>

          {/* Desktop Auth / Action */}
          <div className="hidden md:flex items-center gap-3">
            {!authChecked ? (
              <div className="w-32 h-9" />
            ) : isLoggedIn ? (
              <Link
                href="/dashboard"
                className="text-sm font-medium bg-rc-accent text-rc-bg px-5 py-2 rounded-lg hover:bg-rc-accent-hover transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-rc-muted hover:text-rc-text transition-colors px-4 py-2"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium bg-rc-accent text-rc-bg px-5 py-2 rounded-lg hover:bg-rc-accent-hover transition-colors"
                >
                  Start Free Trial
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-rc-muted hover:text-rc-text p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-rc-border animate-slide-down">
            <div className="flex flex-col gap-3">
              <a
                href="#how-it-works"
                className="text-sm text-rc-muted hover:text-rc-text px-3 py-2 rounded-md hover:bg-rc-card transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                How It Works
              </a>
              <a
                href="#platforms"
                className="text-sm text-rc-muted hover:text-rc-text px-3 py-2 rounded-md hover:bg-rc-card transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Platforms
              </a>
              <a
                href="#pricing"
                className="text-sm text-rc-muted hover:text-rc-text px-3 py-2 rounded-md hover:bg-rc-card transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Pricing
              </a>
              <div className="border-t border-rc-border pt-3 mt-1 flex flex-col gap-2">
                {!authChecked ? (
                  <div className="h-9" />
                ) : isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium bg-rc-accent text-rc-bg px-4 py-2.5 rounded-lg text-center hover:bg-rc-accent-hover transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-sm text-rc-muted hover:text-rc-text px-3 py-2 rounded-md hover:bg-rc-card transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="text-sm font-medium bg-rc-accent text-rc-bg px-4 py-2.5 rounded-lg text-center hover:bg-rc-accent-hover transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      Start Free Trial
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
