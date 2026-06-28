"use client";

import { useState, useEffect } from "react";
import BetaGate from "./BetaGate";

export default function BetaAccessManager({ children }: { children: React.ReactNode }) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    // Check local storage for access
    const access = localStorage.getItem("replydesk_beta_access") === "true";
    setHasAccess(access);
  }, []);

  // Show a blank dark screen while checking to prevent hydration flicker
  if (hasAccess === null) {
    return <div className="min-h-screen bg-rc-bg" />;
  }

  // If no access, show BetaGate
  if (!hasAccess) {
    return <BetaGate onUnlock={() => setHasAccess(true)} />;
  }

  // If access granted, show actual landing page content
  return <>{children}</>;
}
