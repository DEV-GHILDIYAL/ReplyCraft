"use client";

import Link from "next/link";
import useSWR from "swr";
import {
  TrendingUp,
  Smile,
  Meh,
  Frown,
  Activity,
  Layers,
  Tag,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-rc-card border border-rc-border rounded-xl text-xs space-y-1.5 shadow-xl">
        <p className="font-bold text-rc-text">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2" style={{ color: entry.color }}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="capitalize">{entry.name}:</span>
            <span className="font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function SentimentPage() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/sentiment/historical",
    fetcher
  );

  const hasNoBusiness = data && ("error" in data || (data as any).error === "Business profile not found");

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="h-8 bg-rc-card w-1/4 rounded-lg"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[350px] bg-rc-card border border-rc-border rounded-2xl"></div>
          <div className="h-[350px] bg-rc-card border border-rc-border rounded-2xl"></div>
        </div>
        <div className="h-64 bg-rc-card border border-rc-border rounded-2xl"></div>
      </div>
    );
  }

  if (hasNoBusiness) {
    return (
      <div className="p-6 lg:p-8 max-w-xl mx-auto mt-20 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rc-accent/10 border border-rc-accent/20 text-rc-accent">
          <Sparkles className="h-8 w-8 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-rc-text">
            Connect your Google Business Profile to get started
          </h2>
          <p className="text-sm text-rc-muted max-w-sm mx-auto leading-relaxed">
            Connect your profile to start syncing reviews and analyzing user sentiments.
          </p>
        </div>
        <Link
          href="/platforms"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rc-accent text-rc-bg font-semibold text-sm hover:bg-rc-accent-hover transition-all duration-200 shadow-lg shadow-rc-accent/15"
        >
          Connect Google Business Profile
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 lg:p-8 text-center max-w-md mx-auto mt-20">
        <h2 className="text-xl font-bold text-rc-text mb-2">Error Loading Analytics</h2>
        <p className="text-sm text-rc-muted mb-6">
          We encountered an issue fetching your historical reviews data. Please try again.
        </p>
        <button
          onClick={() => mutate()}
          className="px-6 py-2.5 rounded-xl bg-rc-accent text-rc-bg font-semibold text-sm hover:bg-rc-accent-hover transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const { historical, platformComparison, keywords } = data;

  const totalReviews = historical.reduce((acc: number, cur: any) => acc + cur.positive + cur.neutral + cur.negative, 0);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-rc-text tracking-tight">
          Sentiment Analytics
        </h1>
        <p className="text-sm text-rc-muted mt-1">
          Deep-dive customer response trending, keyword clusters, and cross-channel metrics.
        </p>
      </div>

      {/* Grid: 30-Day Trend & Keyword Cloud */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Line Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-rc-border bg-rc-card/45 flex flex-col justify-between">
          <div className="space-y-1 mb-6">
            <div className="flex items-center gap-2 text-rc-accent">
              <Activity className="h-5 w-5" />
              <h2 className="text-base font-bold text-rc-text">30-Day Sentiment Trend</h2>
            </div>
            <p className="text-xs text-rc-muted">
              Monitoring Daily positive, neutral, and negative metrics.
            </p>
          </div>

          <div className="h-[280px] w-full">
            {totalReviews > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historical} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
                  />
                  <Line
                    type="monotone"
                    name="Positive"
                    dataKey="positive"
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    name="Neutral"
                    dataKey="neutral"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    name="Negative"
                    dataKey="negative"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-rc-muted gap-2">
                <Smile className="h-8 w-8 text-rc-border animate-pulse" />
                <span className="text-xs">No historical reviews loaded. Connected accounts sync automatically.</span>
              </div>
            )}
          </div>
        </div>

        {/* Word Tag Cloud */}
        <div className="p-6 rounded-2xl border border-rc-border bg-rc-card/45 flex flex-col justify-between">
          <div className="space-y-1 mb-6">
            <div className="flex items-center gap-2 text-rc-accent">
              <Tag className="h-5 w-5" />
              <h2 className="text-base font-bold text-rc-text">Trending Keywords</h2>
            </div>
            <p className="text-xs text-rc-muted">
              Most recurring topics identified by Llama 3.1 parser.
            </p>
          </div>

          <div className="flex-1 flex flex-wrap gap-2.5 items-center justify-center py-4">
            {keywords.length > 0 ? (
              keywords.map((word: any, i: number) => {
                // Determine styling based on importance/value
                const isFrequent = word.value >= 4;
                const isMedium = word.value === 3 || word.value === 2;

                return (
                  <span
                    key={word.text}
                    className={`px-3.5 py-1.5 rounded-full border tracking-wide transition-all hover:scale-105 duration-200 cursor-default ${
                      isFrequent
                        ? "bg-rc-accent/15 text-rc-accent border-rc-accent/30 text-sm font-extrabold shadow-sm shadow-rc-accent/10"
                        : isMedium
                        ? "bg-rc-card border-rc-border-light text-rc-text text-xs font-semibold"
                        : "bg-rc-card/30 border-rc-border/60 text-rc-muted text-[10px]"
                    }`}
                  >
                    {word.text}
                    <span className="ml-1.5 text-[9px] text-rc-muted font-bold">
                      {word.value}
                    </span>
                  </span>
                );
              })
            ) : (
              <div className="text-center text-rc-muted space-y-2 py-10">
                <Tag className="h-8 w-8 text-rc-border mx-auto animate-pulse" />
                <p className="text-xs leading-relaxed max-w-[180px]">
                  Tag cloud is empty. Sync platforms to load keywords.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cross-channel Platform Comparison */}
      <div className="p-6 rounded-2xl border border-rc-border bg-rc-card/45">
        <div className="space-y-1 mb-6">
          <div className="flex items-center gap-2 text-rc-accent">
            <Layers className="h-5 w-5" />
            <h2 className="text-base font-bold text-rc-text">Cross-Channel Comparison</h2>
          </div>
          <p className="text-xs text-rc-muted">
            Ratio of positive vs negative review counts per platform.
          </p>
        </div>

        <div className="h-[280px] w-full">
          {platformComparison.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformComparison} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" opacity={0.5} />
                <XAxis
                  dataKey="platform"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => val.toUpperCase()}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
                />
                <Bar
                  name="Positive Sentiment"
                  dataKey="positive"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={45}
                />
                <Bar
                  name="Negative Sentiment"
                  dataKey="negative"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-rc-muted gap-2">
              <Layers className="h-8 w-8 text-rc-border animate-pulse" />
              <span className="text-xs">No connected platform data found.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
