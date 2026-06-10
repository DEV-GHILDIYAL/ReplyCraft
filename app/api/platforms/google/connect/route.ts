import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { syncGoogleReviews } from "../fetch-reviews/route";


export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(new URL("/login", requestUrl()));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${requestUrl()}/api/platforms/google/callback`;

    const isPlaceholderKeys =
      !clientId || clientId === "your-google-client-id" || clientId.trim() === "";

    if (isPlaceholderKeys) {
      // Simulation mode: Redirect straight to the callback route with a mock authorization code
      console.warn(
        "[Google OAuth] Running in SIMULATION mode because GOOGLE_CLIENT_ID is not configured."
      );
      return NextResponse.redirect(
        new URL(`/api/platforms/google/callback?code=mock_google_code`, requestUrl())
      );
    }

    // Direct to Google OAuth
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent(
      "https://www.googleapis.com/auth/business.manage"
    )}&access_type=offline&prompt=consent`;

    return NextResponse.redirect(authUrl);
  } catch (err) {
    console.error("Google connect route error:", err);
    return NextResponse.json({ error: "Failed to initiate Google OAuth" }, { status: 500 });
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
      .select("id, plan, auto_reply_enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    if (bizError || !business) {
      return NextResponse.json({ error: "Business profile not found" }, { status: 404 });
    }

    const { placeId } = await request.json();

    if (!placeId) {
      return NextResponse.json({ error: "placeId is required" }, { status: 400 });
    }

    // Check if google platform is already connected for this business
    const { data: existingPlatform } = await supabase
      .from("platforms")
      .select("id")
      .eq("business_id", business.id)
      .eq("platform", "google")
      .maybeSingle();

    const platformPayload = {
      business_id: business.id,
      platform: "google",
      is_active: true,
      platform_id: placeId,
      place_id: placeId,
      platform_url: `https://places.google.com/${placeId}`,
      last_synced_at: new Date().toISOString(),
    };

    let saveError;
    if (existingPlatform) {
      const { error } = await supabase
        .from("platforms")
        .update(platformPayload)
        .eq("id", existingPlatform.id);
      saveError = error;
    } else {
      const { error } = await supabase
        .from("platforms")
        .insert(platformPayload);
      saveError = error;
    }

    if (saveError) {
      throw saveError;
    }

    // Call fetch-reviews internally and handle errors gracefully - if reviews fail, still show success for connection
    try {
      await syncGoogleReviews(supabase, placeId, business);
    } catch (syncErr) {
      console.error("Gracefully caught Google Reviews sync error during connect:", syncErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("Google connect POST error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to connect business profile" },
      { status: 500 }
    );
  }
}

function requestUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
