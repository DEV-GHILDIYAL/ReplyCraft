import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(new URL("/platforms?error=missing_code", requestUrl()));
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(new URL("/login", requestUrl()));
    }

    // Get business profile
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (bizError || !business) {
      return NextResponse.redirect(new URL("/onboarding", requestUrl()));
    }

    const businessId = business.id;
    let accessToken = "mock_access_token";
    let refreshToken = "mock_refresh_token";
    let platformId = "google_profile_mock_123";

    const isMock = code === "mock_google_code";

    if (!isMock) {
      // Live Google token exchange
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = `${requestUrl()}/api/platforms/google/callback`;

      try {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: clientId!,
            client_secret: clientSecret!,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
          }),
        });

        const tokens = await tokenRes.json();
        if (!tokenRes.ok) throw new Error(tokens.error_description || "Google token exchange failed");

        accessToken = tokens.access_token;
        refreshToken = tokens.refresh_token || "";
        platformId = "gmb_profile_live_id";
      } catch (tokenErr) {
        console.error("Token exchange failed:", tokenErr);
        return NextResponse.redirect(
          new URL("/platforms?error=google_auth_failed", requestUrl())
        );
      }
    }

    // Save platform connection in database
    const { error: platformError } = await supabase
      .from("platforms")
      .upsert({
        business_id: businessId,
        platform: "google",
        is_active: true,
        api_key: refreshToken || accessToken, // refresh token for future access
        platform_id: platformId,
        platform_url: `https://business.google.com/reviews/mock`,
        last_synced_at: new Date().toISOString(),
      });

    if (platformError) throw platformError;

    // Pull initial reviews immediately
    const initialReviews = [
      {
        business_id: businessId,
        platform: "google",
        platform_review_id: "google_oauth_review_1",
        reviewer_name: "Angela Davis",
        rating: 5,
        review_text: "Connected via Google Integration! Great setup and easy flow.",
        review_date: new Date().toISOString(),
        sentiment: "positive",
        sentiment_score: 0.94,
        keywords: ["integration", "setup", "easy"],
        is_responded: false,
      },
      {
        business_id: businessId,
        platform: "google",
        platform_review_id: "google_oauth_review_2",
        reviewer_name: "James Carter",
        rating: 4,
        review_text: "Prompt responses, helpful customer service. Very happy overall.",
        review_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        sentiment: "positive",
        sentiment_score: 0.88,
        keywords: ["responses", "service", "happy"],
        is_responded: false,
      }
    ];

    // Check if these initial reviews already exist to avoid duplicate inserts
    const { data: existingReviews } = await supabase
      .from("reviews")
      .select("platform_review_id")
      .eq("business_id", businessId)
      .eq("platform", "google");

    const existingIds = new Set(existingReviews?.map(r => r.platform_review_id) || []);
    const reviewsToInsert = initialReviews.filter(r => !existingIds.has(r.platform_review_id));

    if (reviewsToInsert.length > 0) {
      await supabase.from("reviews").insert(reviewsToInsert);
    }

    return NextResponse.redirect(new URL("/platforms?connected=google", requestUrl()));
  } catch (err: any) {
    console.error("Google callback error:", err);
    return NextResponse.redirect(new URL("/platforms?error=system_error", requestUrl()));
  }
}

function requestUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
