import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform") || "all";
    const rating = searchParams.get("rating") || "all";
    const status = searchParams.get("status") || "all";

    let query = supabase
      .from("reviews")
      .select("*, response_drafts(*)")
      .eq("business_id", business.id);

    // Apply platform filter
    if (platform !== "all") {
      query = query.eq("platform", platform);
    }

    // Apply status filter
    if (status === "pending") {
      query = query.eq("is_responded", false);
    } else if (status === "responded") {
      query = query.eq("is_responded", true);
    }

    // Apply rating filter
    if (rating === "1-2") {
      query = query.in("rating", [1, 2]);
    } else if (rating === "3") {
      query = query.eq("rating", 3);
    } else if (rating === "4-5") {
      query = query.in("rating", [4, 5]);
    }

    // Order by date descending
    const { data: reviews, error: queryError } = await query.order(
      "review_date",
      { ascending: false }
    );

    if (queryError) {
      throw queryError;
    }

    return NextResponse.json(reviews || []);
  } catch (err: any) {
    console.error("GET reviews error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load reviews" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reviewId, action } = body;

    if (!reviewId || !action) {
      return NextResponse.json(
        { error: "reviewId and action are required" },
        { status: 400 }
      );
    }

    if (action === "mark_responded") {
      const { data, error } = await supabase
        .from("reviews")
        .update({
          is_responded: true,
          response_text: "Marked as responded manually",
          response_published_at: new Date().toISOString(),
        })
        .eq("id", reviewId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, review: data });
    }

    if (action === "ignore") {
      const { data, error } = await supabase
        .from("reviews")
        .update({
          is_responded: true,
          response_text: "Ignored",
          response_published_at: new Date().toISOString(),
        })
        .eq("id", reviewId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, review: data });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("POST reviews error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process review action" },
      { status: 500 }
    );
  }
}
