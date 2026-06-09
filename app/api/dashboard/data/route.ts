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


    // Fetch all reviews for this business
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("*")
      .eq("business_id", businessId)
      .order("review_date", { ascending: false });

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

    // Calculate statistics
    const totalReviews = reviews?.length || 0;
    let avgRating = 0;
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;
    const platformBreakdown: Record<string, number> = {};
    let respondedCount = 0;

    if (totalReviews > 0 && reviews) {
      let sumRating = 0;
      reviews.forEach((r) => {
        sumRating += r.rating || 0;

        // Platform breakdown
        const plat = r.platform || "other";
        platformBreakdown[plat] = (platformBreakdown[plat] || 0) + 1;

        // Sentiment breakdown
        if (r.sentiment === "positive") {
          positiveCount++;
        } else if (r.sentiment === "neutral") {
          neutralCount++;
        } else if (r.sentiment === "negative") {
          negativeCount++;
        }

        // Check if review has a response
        if (r.is_responded) {
          respondedCount++;
        }
      });

      avgRating = Number((sumRating / totalReviews).toFixed(1));
    }

    const responseRate =
      totalReviews > 0 ? Math.round((respondedCount / totalReviews) * 100) : 0;

    // Last 10 reviews
    const recentReviews = reviews ? reviews.slice(0, 10) : [];

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
