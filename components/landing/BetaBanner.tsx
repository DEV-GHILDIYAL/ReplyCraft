import React from "react";

export default function BetaBanner() {
  return (
    <div className="w-full flex justify-center mt-20 mb-2 animate-fade-in relative z-40">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-rc-accent/20 bg-rc-accent/5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rc-accent opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rc-accent" />
        </span>
        <span className="text-xs font-medium text-rc-accent tracking-wide">
          Now in Beta — Free for 14 Days
        </span>
      </div>
    </div>
  );
}
