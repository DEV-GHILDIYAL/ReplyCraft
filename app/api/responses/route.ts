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

    // Fetch all drafts joined with review details
    const { data: drafts, error: draftsError } = await supabase
      .from("response_drafts")
      .select("*, reviews(*)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });

    if (draftsError) {
      throw draftsError;
    }

    return NextResponse.json(drafts);
  } catch (err: any) {
    console.error("GET responses queue error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch responses queue" },
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
    const body = await request.json();
    const { action, draftId, reviewId, text, tone } = body;

    if (!action) {
      return NextResponse.json(
        { error: "action parameter is required" },
        { status: 400 }
      );
    }

    if (action === "bulk_approve") {
      // Approve all pending drafts for this business
      const { data, error } = await supabase
        .from("response_drafts")
        .update({ status: "approved" })
        .eq("business_id", businessId)
        .eq("status", "pending")
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, count: data?.length || 0 });
    }

    // Single item operations require reviewId or draftId
    if (!draftId && !reviewId) {
      return NextResponse.json(
        { error: "Either draftId or reviewId must be provided" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      const payload: any = {
        business_id: businessId,
        review_id: reviewId,
        draft_text: text,
        status: "approved",
        tone: tone || "professional",
      };

      if (draftId) payload.id = draftId;

      const { data, error } = await supabase
        .from("response_drafts")
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, draft: data });
    }

    if (action === "reject") {
      const { data, error } = await supabase
        .from("response_drafts")
        .update({ status: "rejected" })
        .eq("id", draftId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, draft: data });
    }

    if (action === "edit") {
      const { data, error } = await supabase
        .from("response_drafts")
        .update({ draft_text: text })
        .eq("id", draftId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, draft: data });
    }

    if (action === "publish") {
      // 1. Upsert draft to status = 'published'
      const payload: any = {
        business_id: businessId,
        review_id: reviewId,
        draft_text: text,
        status: "published",
        tone: tone || "professional",
      };

      if (draftId) payload.id = draftId;

      const { error: draftError } = await supabase
        .from("response_drafts")
        .upsert(payload);

      if (draftError) throw draftError;

      // 2. Mark review as responded and update response text
      const { error: reviewError } = await supabase
        .from("reviews")
        .update({
          is_responded: true,
          response_text: text,
          response_published_at: new Date().toISOString(),
        })
        .eq("id", reviewId);

      if (reviewError) throw reviewError;

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("POST responses error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process response action" },
      { status: 500 }
    );
  }
}
