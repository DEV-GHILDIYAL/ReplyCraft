export default function HowItWorks() {
  const steps = [
    {
      step: 1,
      title: "Connect Your Platforms",
      description:
        "Link your Google, Yelp, Facebook, and other review platforms in seconds. We'll sync your reviews automatically.",
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
      ),
    },
    {
      step: 2,
      title: "AI Drafts Responses",
      description:
        "Our AI analyzes each review's sentiment and crafts a thoughtful, on-brand response tailored to the context.",
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
        </svg>
      ),
    },
    {
      step: 3,
      title: "You Approve & Publish",
      description:
        "Review the draft, tweak if needed, and publish with one click. Responses go live on the original platform.",
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="relative py-24 lg:py-32">
      {/* Section bg gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rc-border to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 lg:mb-20">
          <p className="text-sm font-medium text-rc-accent uppercase tracking-wider mb-3">
            Simple & Powerful
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-rc-text">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-rc-muted max-w-2xl mx-auto">
            Get up and running in under 5 minutes. No technical setup required.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-px">
            <div className="w-full h-full bg-gradient-to-r from-rc-accent/30 via-rc-accent/50 to-rc-accent/30" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-rc-accent/50" />
            <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-rc-accent/50" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-rc-accent/50" />
          </div>

          {steps.map((item) => (
            <div
              key={item.step}
              className="group relative flex flex-col items-center text-center"
            >
              {/* Step number circle */}
              <div className="relative mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rc-card border border-rc-border group-hover:border-rc-accent/30 transition-all duration-500 group-hover:shadow-lg group-hover:shadow-rc-accent/10">
                  <div className="text-rc-accent transition-transform duration-500 group-hover:scale-110">
                    {item.icon}
                  </div>
                </div>
                {/* Step badge */}
                <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rc-accent text-rc-bg text-xs font-bold">
                  {item.step}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-rc-text mb-3">
                {item.title}
              </h3>
              <p className="text-sm text-rc-muted leading-relaxed max-w-xs">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
