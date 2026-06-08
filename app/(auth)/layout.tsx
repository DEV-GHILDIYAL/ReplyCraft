import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-rc-bg flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-rc-accent/5 blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-purple-500/5 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Logo */}
      <Link
        href="/"
        className="relative z-10 flex items-center gap-2 mb-8 group"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rc-accent/10 border border-rc-accent/20 group-hover:bg-rc-accent/20 transition-colors">
          <img src="/favicon.svg" alt="ReplyDesk Logo" className="h-6 w-6" />
        </div>
        <span className="text-xl font-bold text-rc-text">
          Reply<span className="text-rc-accent">Desk</span>
        </span>
      </Link>

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-rc-border bg-rc-card/80 backdrop-blur-xl p-5 sm:p-8 shadow-2xl shadow-black/20">
          {children}
        </div>
      </div>
    </div>
  );
}
