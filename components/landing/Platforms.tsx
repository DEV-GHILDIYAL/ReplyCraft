export default function Platforms() {
  const platforms = [
    {
      name: "Google",
      color: "#4285F4",
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
      ),
    },
    {
      name: "Yelp",
      color: "#D32323",
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="#D32323">
          <path d="M20.16 12.594l-4.995 1.433a.587.587 0 01-.78-.458.462.462 0 010-.112l.734-5.19a.586.586 0 01.761-.476 6.296 6.296 0 013.734 3.965.586.586 0 01-.453.838zM14.735 15.13l3.534 3.609a.586.586 0 01-.133.908 6.298 6.298 0 01-4.783.955.586.586 0 01-.403-.811l1.905-4.692a.587.587 0 01.88-.27.452.452 0 01.077.056l-.077.244zM12.75 8.694V2.522a.586.586 0 01.423-.562 6.31 6.31 0 014.742 1.142.586.586 0 01.095.883L13.5 8.963a.586.586 0 01-.868-.082.461.461 0 01-.083-.188zM10.244 10.758L6.51 8.122a.586.586 0 01-.073-.9A6.3 6.3 0 0110.64 5.04a.586.586 0 01.528.72l-1.048 4.807a.587.587 0 01-.735.443.46.46 0 01-.14-.068v-.184zM10.748 14.104l-1.498 4.88a.586.586 0 01-.703.395 6.296 6.296 0 01-4.168-3.084.586.586 0 01.32-.856l5.254-1.752a.587.587 0 01.795.417z" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      color: "#1877F2",
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: "G2",
      color: "#FF492C",
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#FF492C" />
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="sans-serif">G2</text>
        </svg>
      ),
    },
    {
      name: "Trustpilot",
      color: "#00B67A",
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="#00B67A">
          <path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="platforms" className="relative py-24 lg:py-32">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rc-border to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-rc-accent uppercase tracking-wider mb-3">
            Integrations
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-rc-text">
            All Your Platforms, One Dashboard
          </h2>
          <p className="mt-4 text-lg text-rc-muted max-w-2xl mx-auto">
            Connect the platforms your customers use. We aggregate and manage reviews from all major services.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-8">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="group flex flex-col items-center gap-3 p-6 rounded-2xl border border-rc-border bg-rc-card/50 hover:bg-rc-card hover:border-rc-border-light transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 w-[140px]"
            >
              <div className="transition-transform duration-300 group-hover:scale-110">
                {platform.icon}
              </div>
              <span className="text-sm font-medium text-rc-muted group-hover:text-rc-text transition-colors">
                {platform.name}
              </span>
            </div>
          ))}
        </div>

        <p className="text-center mt-10 text-sm text-rc-muted">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-rc-border bg-rc-card/30">
            <span className="h-1.5 w-1.5 rounded-full bg-rc-accent animate-pulse" />
            More platforms coming soon — JustDial, TripAdvisor, Zomato & more
          </span>
        </p>
      </div>
    </section>
  );
}
