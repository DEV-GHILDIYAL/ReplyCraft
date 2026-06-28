"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard boundary error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-fade-in">
      <div className="bg-red-500/10 p-4 rounded-full mb-4 border border-red-500/20">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-rc-text mb-2">Something went wrong</h2>
      <p className="text-sm text-rc-muted max-w-md mx-auto mb-6">
        {error.message || "An unexpected error occurred while loading this page."}
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2.5 rounded-xl bg-rc-accent text-rc-bg font-bold text-sm hover:bg-rc-accent-hover transition-all shadow-lg shadow-rc-accent/15"
      >
        Try Again
      </button>
    </div>
  );
}
