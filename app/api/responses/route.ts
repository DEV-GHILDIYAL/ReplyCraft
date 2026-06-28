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

    // Fetch all drafts joined with review details and business details
    const { data: drafts, error: draftsError } = await supabase
      .from("response_drafts")
      .select("*, reviews(*), businesses(auto_reply_enabled, auto_reply_schedule)")
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

async function refreshGoogleAccessToken(platform: any, supabase: any) {
  const isMock = platform.access_token?.startsWith("mock_") || platform.place_id?.startsWith("mock_");
  if (isMock) {
    return platform.access_token;
  }

  const now = new Date();
  const expiresAt = platform.token_expires_at ? new Date(platform.token_expires_at) : new Date(0);
  
  if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
    return platform.access_token;
  }


  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        refresh_token: platform.refresh_token || "",
        grant_type: "refresh_token",
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error_description || "Google token refresh failed");
    }

    const newAccessToken = data.access_token;
    const expiresIn = data.expires_in || 3600;
    const newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    await supabase
      .from("platforms")
      .update({
        access_token: newAccessToken,
        token_expires_at: newExpiresAt,
      })
      .eq("id", platform.id);

    return newAccessToken;
  } catch (err) {
    console.error("Failed to refresh Google access token:", err);
    throw err;
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
      let targetDraftId = draftId;
      if (!targetDraftId && reviewId) {
        const { data: existingDrafts } = await supabase
          .from("response_drafts")
          .select("id")
          .eq("review_id", reviewId)
          .limit(1);
        if (existingDrafts && existingDrafts.length > 0) {
          targetDraftId = existingDrafts[0].id;
        }
      }

      const payload: any = {
        business_id: businessId,
        review_id: reviewId,
        draft_text: text,
        status: "approved",
        tone: tone || "professional",
      };

      if (targetDraftId) payload.id = targetDraftId;

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
      // 1. Post reply to Google Business Profile if real platform connection is present
      try {
        const { data: review } = await supabase
          .from("reviews")
          .select("*")
          .eq("id", reviewId)
          .single();

        if (review && review.platform === "google") {
          const { data: platform } = await supabase
            .from("platforms")
            .select("*")
            .eq("business_id", businessId)
            .eq("platform", "google")
            .maybeSingle();

          if (platform && platform.is_active) {
            const isMock = platform.access_token?.startsWith("mock_") || platform.place_id?.startsWith("mock_") || review.platform_review_id.includes("mock_");

            if (isMock) {

            } else {
              const accessToken = await refreshGoogleAccessToken(platform, supabase);
              let reviewIdSegment = review.platform_review_id;
              if (reviewIdSegment.includes("/")) {
                reviewIdSegment = reviewIdSegment.split("/").pop() || reviewIdSegment;
              }

              const gmbReplyUrl = `https://mybusiness.googleapis.com/v1/accounts/${platform.account_id}/locations/${platform.platform_id}/reviews/${reviewIdSegment}/reply`;

              const gmbRes = await fetch(gmbReplyUrl, {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ comment: text }),
              });

              if (!gmbRes.ok) {
                const errText = await gmbRes.text();
                console.error(`Google API reply publication failed: ${gmbRes.status} ${errText}`);
                throw new Error(`Failed to publish response to Google Business Profile: ${errText}`);
              }

            }
          }
        }
      } catch (pubErr: any) {
        console.error("Gracefully caught review response publishing error:", pubErr);
        throw pubErr;
      }

      // 2. Upsert draft to status = 'published'
      let targetDraftId = draftId;
      if (!targetDraftId && reviewId) {
        const { data: existingDrafts } = await supabase
          .from("response_drafts")
          .select("id")
          .eq("review_id", reviewId)
          .limit(1);
        if (existingDrafts && existingDrafts.length > 0) {
          targetDraftId = existingDrafts[0].id;
        }
      }

      const payload: any = {
        business_id: businessId,
        review_id: reviewId,
        draft_text: text,
        status: "published",
        tone: tone || "professional",
      };

      if (targetDraftId) payload.id = targetDraftId;

      const { error: draftError } = await supabase
        .from("response_drafts")
        .upsert(payload);

      if (draftError) throw draftError;

      // 3. Mark review as responded and update response text
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
