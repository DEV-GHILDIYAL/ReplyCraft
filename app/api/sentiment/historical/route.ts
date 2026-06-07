import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get business profile
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (bizError || !business) {
      return NextResponse.json(
        { error: "Business profile not found" },
        { status: 404 }
      );
    }

    const businessId = business.id;

    // Fetch reviews for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("rating, review_date, sentiment, platform, keywords")
      .eq("business_id", businessId)
      .gte("review_date", thirtyDaysAgo.toISOString())
      .order("review_date", { ascending: true });

    if (reviewsError) {
      throw reviewsError;
    }

    // 1. Group reviews by Date for Line Chart (30-day trend)
    const dailyDataMap: Record<string, { positive: number; neutral: number; negative: number; sumRating: number; count: number }> = {};
    
    // Pre-populate last 30 days with zeros so the chart has continuous records
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      dailyDataMap[dateStr] = { positive: 0, neutral: 0, negative: 0, sumRating: 0, count: 0 };
    }

    // Grouping reviews
    reviews?.forEach((r) => {
      if (!r.review_date) return;
      const dateStr = new Date(r.review_date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      
      // If date is outside our pre-populated 30-day range, ignore it or create it
      if (!dailyDataMap[dateStr]) {
        dailyDataMap[dateStr] = { positive: 0, neutral: 0, negative: 0, sumRating: 0, count: 0 };
      }

      const entry = dailyDataMap[dateStr];
      if (r.sentiment === "positive") entry.positive++;
      else if (r.sentiment === "neutral") entry.neutral++;
      else if (r.sentiment === "negative") entry.negative++;

      entry.sumRating += r.rating || 0;
      entry.count++;
    });

    const historical = Object.entries(dailyDataMap).map(([date, metrics]) => ({
      date,
      positive: metrics.positive,
      neutral: metrics.neutral,
      negative: metrics.negative,
      avgRating: metrics.count > 0 ? Number((metrics.sumRating / metrics.count).toFixed(1)) : 0,
    }));

    // 2. Group by Platform for Bar Chart
    const platformMap: Record<string, { positive: number; negative: number; total: number }> = {};
    
    reviews?.forEach((r) => {
      const plat = r.platform || "other";
      if (!platformMap[plat]) {
        platformMap[plat] = { positive: 0, negative: 0, total: 0 };
      }
      
      platformMap[plat].total++;
      if (r.sentiment === "positive") platformMap[plat].positive++;
      else if (r.sentiment === "negative") platformMap[plat].negative++;
    });

    const platformComparison = Object.entries(platformMap).map(([platform, metrics]) => ({
      platform,
      positive: metrics.positive,
      negative: metrics.negative,
      total: metrics.total,
    }));

    // 3. Keywords Frequencies for Word Cloud
    const keywordFreq: Record<string, number> = {};
    reviews?.forEach((r) => {
      if (Array.isArray(r.keywords)) {
        r.keywords.forEach((word) => {
          const clean = word.toLowerCase().trim();
          if (clean.length > 2) {
            keywordFreq[clean] = (keywordFreq[clean] || 0) + 1;
          }
        });
      }
    });

    const keywords = Object.entries(keywordFreq)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15); // Top 15 keywords

    return NextResponse.json({
      historical,
      platformComparison,
      keywords,
    });
  } catch (err: any) {
    console.error("GET historical analytics error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load historical analytics" },
      { status: 500 }
    );
  }
}
