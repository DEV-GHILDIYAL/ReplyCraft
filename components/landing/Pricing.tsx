import Link from "next/link";

export default function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "₹499",
      period: "/mo",
      description: "Perfect for single-location businesses getting started.",
      features: [
        "1 business location",
        "Google Reviews",
        "50 AI replies/month",
        "Sentiment dashboard",
        "Email support",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Growth",
      price: "₹999",
      period: "/mo",
      description: "For growing businesses that need more power & auto replies.",
      features: [
        "3 business locations",
        "Google + Facebook + Yelp",
        "200 AI replies/month",
        "Advanced sentiment analytics",
        "Priority support",
      ],
      cta: "Get Started",
      popular: true,
    },
    {
      name: "Scale",
      price: "₹2,000",
      period: "/mo",
      description: "For scale operations requiring premium reputation features.",
      features: [
        "10 business locations",
        "All platforms",
        "750 AI replies/month",
        "Dedicated support",
        "More platforms coming soon",
      ],
      cta: "Get Started",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rc-border to-transparent" />
        {/* Subtle accent glow behind pricing */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-rc-accent/3 blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-rc-accent uppercase tracking-wider mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-rc-text">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-rc-muted max-w-2xl mx-auto">
            Start free with our 7-day trial. No credit card required. Upgrade when you&apos;re ready.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-5 sm:p-8 transition-all duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? "border-rc-accent/40 bg-rc-card shadow-xl shadow-rc-accent/5 animate-pulse-glow"
                  : "border-rc-border bg-rc-card/50 hover:border-rc-border-light hover:shadow-lg hover:shadow-black/20"
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-semibold bg-rc-accent text-rc-bg">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-rc-text">
                    {plan.name}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rc-accent/15 text-rc-accent border border-rc-accent/25 uppercase tracking-wider">
                    7-day trial
                  </span>
                </div>
                <p className="text-sm text-rc-muted mt-1">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-8">
                <span className="text-4xl font-bold text-rc-text">
                  {plan.price}
                </span>
                <span className="text-rc-muted text-sm">{plan.period}</span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <svg
                      className={`h-5 w-5 shrink-0 mt-0.5 ${
                        plan.popular ? "text-rc-accent" : "text-rc-accent/70"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm text-rc-muted">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/register"
                className={`block w-full text-center py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  plan.popular
                    ? "bg-rc-accent text-rc-bg hover:bg-rc-accent-hover shadow-lg shadow-rc-accent/20 hover:shadow-rc-accent/30"
                    : "bg-rc-bg border border-rc-border text-rc-text hover:bg-rc-card hover:border-rc-border-light"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
