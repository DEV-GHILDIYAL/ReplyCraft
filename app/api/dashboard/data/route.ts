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
      .select("id, plan, auto_reply_enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    if (bizError || !business) {
      return NextResponse.json(
        { error: "Business profile not found" },
        { status: 404 }
      );
    }

    const businessId = business.id;

    // Fetch connected Google platform place_id if any
    const { data: googlePlatform } = await supabase
      .from("platforms")
      .select("place_id")
      .eq("business_id", businessId)
      .eq("platform", "google")
      .eq("is_active", true)
      .maybeSingle();


    // Fetch 10 most recent reviews for this business
    const { data: recentReviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("*")
      .eq("business_id", businessId)
      .order("review_date", { ascending: false })
      .limit(10);

    if (reviewsError) {
      throw reviewsError;
    }

    // Fetch pending response drafts count
    const { count: pendingCount, error: pendingError } = await supabase
      .from("response_drafts")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "pending");

    if (pendingError) {
      throw pendingError;
    }

    // Calculate statistics using DB aggregate counts
    const { count: totalReviews } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId);

    let avgRating = 0;
    try {
      const { data: avgData } = await supabase
        .from("reviews")
        .select("rating.avg()")
        .eq("business_id", businessId)
        .maybeSingle();
      if (avgData && typeof avgData === 'object') {
        const val = Object.values(avgData)[0];
        avgRating = val ? Number(Number(val).toFixed(1)) : 0;
      }
    } catch (err) {
      console.warn("Aggregate rating.avg() failed, falling back to manual rating select:", err);
      const { data: ratingRows } = await supabase
        .from("reviews")
        .select("rating")
        .eq("business_id", businessId);
      if (ratingRows && ratingRows.length > 0) {
        const sum = ratingRows.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
        avgRating = Number((sum / ratingRows.length).toFixed(1));
      }
    }

    const { count: respondedCount } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("is_responded", true);

    const { count: positiveCount } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("sentiment", "positive");

    const { count: neutralCount } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("sentiment", "neutral");

    const { count: negativeCount } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("sentiment", "negative");

    const { data: connectedPlatforms } = await supabase
      .from("platforms")
      .select("platform")
      .eq("business_id", businessId);

    const platformBreakdown: Record<string, number> = {};
    if (connectedPlatforms) {
      for (const plat of connectedPlatforms) {
        const { count } = await supabase
          .from("reviews")
          .select("*", { count: "exact", head: true })
          .eq("business_id", businessId)
          .eq("platform", plat.platform);
        platformBreakdown[plat.platform] = count || 0;
      }
    }

    const total = totalReviews || 0;
    const responseRate = total > 0 ? Math.round(((respondedCount || 0) / total) * 100) : 0;

    return NextResponse.json({
      stats: {
        totalReviews,
        avgRating,
        pendingResponses: pendingCount || 0,
        responseRate,
        platformBreakdown,
      },
      sentiment: {
        positive: positiveCount,
        neutral: neutralCount,
        negative: negativeCount,
      },
      recentReviews,
      business: {
        plan: business.plan,
        auto_reply_enabled: business.auto_reply_enabled,
        google_place_id: googlePlatform?.place_id || null,
      },
    });
  } catch (err: any) {
    console.error("Dashboard data API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
