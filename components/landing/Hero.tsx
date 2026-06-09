import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-12 w-full">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-rc-accent/5 blur-[120px] animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[100px] animate-float"
          style={{ animationDelay: "3s" }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 text-center">
        {/* Social Proof Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rc-accent/10 border border-rc-accent/25 text-xs font-semibold text-rc-accent mb-6 animate-slide-up"
          style={{ animationDelay: "0.05s", opacity: 0 }}
        >
          <span>Join 100+ businesses managing reviews smarter</span>
        </div>

        {/* Headline */}
        <h1
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight animate-slide-up"
          style={{ animationDelay: "0.15s", opacity: 0 }}
        >
          Turn Every Review Into a{" "}
          <br className="hidden sm:block" />
          <span className="text-gradient">Growth Opportunity</span>
        </h1>

        {/* Subtext */}
        <p
          className="mt-6 text-lg sm:text-xl text-rc-muted max-w-2xl mx-auto leading-relaxed animate-slide-up"
          style={{ animationDelay: "0.25s", opacity: 0 }}
        >
          AI drafts perfect responses in seconds.
          <br className="hidden sm:block" /> You approve in one click.
        </p>

        {/* CTA Buttons */}
        <div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-xs sm:max-w-none mx-auto animate-slide-up"
          style={{ animationDelay: "0.4s", opacity: 0 }}
        >
          <Link
            href="/register"
            className="group relative flex sm:inline-flex items-center justify-center px-8 py-3.5 font-semibold text-rc-bg bg-rc-accent rounded-xl hover:bg-rc-accent-hover transition-all duration-300 shadow-lg shadow-rc-accent/20 hover:shadow-rc-accent/30 hover:-translate-y-0.5 w-full sm:w-auto"
          >
            Start Free Trial
            <svg
              className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
          <a
            href="#how-it-works"
            className="flex sm:inline-flex items-center justify-center px-8 py-3.5 font-semibold text-rc-text border border-rc-border rounded-xl hover:bg-rc-card hover:border-rc-border-light transition-all duration-300 w-full sm:w-auto"
          >
            <svg
              className="mr-2 h-5 w-5 text-rc-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            See Demo
          </a>
        </div>

        {/* Dashboard Mockup */}
        <div
          className="mt-16 lg:mt-20 mx-auto max-w-4xl w-full animate-slide-up"
          style={{ animationDelay: "0.6s", opacity: 0 }}
        >
          <div className="relative rounded-2xl border border-rc-border bg-rc-card/80 backdrop-blur-sm p-1 shadow-2xl shadow-black/30">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-rc-border">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-rc-bg/50 text-xs text-rc-muted">
                  app.replydesk.io/dashboard
                </div>
              </div>
            </div>
            {/* Mock dashboard content */}
            <div className="p-3 sm:p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-6">
                {[
                  { label: "Total Reviews", value: "—", change: "" },
                  { label: "Avg Rating", value: "—", change: "" },
                  { label: "Pending", value: "—", change: "" },
                  { label: "Response Rate", value: "—", change: "" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl bg-rc-bg/60 border border-rc-border p-1.5 sm:p-3 min-w-0"
                  >
                    <p className="text-[9px] sm:text-[10px] text-rc-muted uppercase tracking-wider truncate">
                      {stat.label}
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-rc-text mt-1">
                      {stat.value}
                    </p>
                    <span className="text-xs text-rc-positive">
                      {stat.change}
                    </span>
                  </div>
                ))}
              </div>
              {/* Mock review cards */}
              <div className="space-y-3">
                {[
                  {
                    name: "Sarah M.",
                    rating: 5,
                    text: "Amazing service! The staff was incredibly helpful and...",
                    platform: "Google",
                  },
                  {
                    name: "James K.",
                    rating: 3,
                    text: "Good food but waited too long for our table. Would...",
                    platform: "Yelp",
                  },
                ].map((review) => (
                  <div
                    key={review.name}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-lg bg-rc-bg/40 border border-rc-border p-3 w-full min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-rc-accent/10 flex items-center justify-center text-xs font-bold text-rc-accent shrink-0">
                        {review.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="text-xs font-medium text-rc-text">
                            {review.name}
                          </span>
                          <span className="text-[10px] text-rc-muted">
                            {review.platform}
                          </span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <svg
                                key={i}
                                className={`h-3 w-3 ${
                                  i < review.rating
                                    ? "text-yellow-400"
                                    : "text-rc-border"
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-rc-muted truncate mt-0.5">
                          {review.text}
                        </p>
                      </div>
                    </div>
                    <button className="self-end sm:self-auto shrink-0 text-[10px] font-medium bg-rc-accent/10 text-rc-accent px-3 py-1.5 rounded-md hover:bg-rc-accent/20 transition-colors">
                      AI Draft
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Glow effect under card */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-rc-accent/10 blur-[60px] rounded-full" />
        </div>
      </div>
    </section>
  );
}
