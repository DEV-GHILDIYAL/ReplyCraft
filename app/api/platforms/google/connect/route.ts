import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
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
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/platforms/google/callback`;

    const isPlaceholderKeys =
      !clientId || clientId === "your-google-client-id" || clientId.trim() === "";

    if (isPlaceholderKeys) {
      return NextResponse.redirect(
        new URL(`/api/platforms/google/callback?code=mock_google_code`, requestUrl())
      );
    }



    // CSRF Protection: Generate and set state parameter
    const state = crypto.randomUUID();
    const cookieStore = await cookies();
    cookieStore.set("google_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 3600, // 1 hour
    });

    // Direct to Google OAuth with scopes required for GMB location verification
    const scope = "openid email profile https://www.googleapis.com/auth/business.manage";
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent(
      scope
    )}&access_type=offline&prompt=select_account consent&state=${state}`;

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

    const {
      locationName,
      placeId,
      locationId,
      accountId,
      category,
    } = await request.json();

    if (!placeId || !locationName) {
      return NextResponse.json({ error: "locationName and placeId are required" }, { status: 400 });
    }

    // Retrieve tokens from secure HTTP-only cookie
    const cookieStore = await cookies();
    const tempTokensStr = cookieStore.get("google_oauth_temp_tokens")?.value;
    
    let accessToken: string | null = null;
    let refreshToken: string | null = null;
    let tokenExpiresAt: string | null = null;

    if (tempTokensStr) {
      try {
        const tempTokens = JSON.parse(tempTokensStr);
        accessToken = tempTokens.accessToken || null;
        refreshToken = tempTokens.refreshToken || null;
        tokenExpiresAt = tempTokens.expiresAt || null;
      } catch (err) {
        console.error("Failed to parse temp Google OAuth tokens:", err);
      }
      // Clean up secure cookie after reading tokens
      cookieStore.delete("google_oauth_temp_tokens");
    } else {
      console.warn("No google_oauth_temp_tokens cookie found; checking for local mock simulation");
      // Allow simulation mode if no tokens cookie is found and placeId is mock
      if (placeId.startsWith("mock_")) {
        accessToken = "mock_access_token";
        refreshToken = "mock_refresh_token";
        tokenExpiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
      } else {
        return NextResponse.json(
          { error: "OAuth connection session expired. Please connect your Google account again." },
          { status: 400 }
        );
      }
    }

    // Check if user has an existing business
    let businessId = "";
    const { data: existingBiz } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingBiz) {
      businessId = existingBiz.id;
      // Update business name and category
      const { error: updateBizErr } = await supabase
        .from("businesses")
        .update({
          name: locationName,
          category: category || null,
        })
        .eq("id", businessId);

      if (updateBizErr) throw updateBizErr;
    } else {
      // Create new business profile on trial plan
      const { data: newBiz, error: createBizErr } = await supabase
        .from("businesses")
        .insert({
          user_id: user.id,
          name: locationName,
          category: category || null,
          plan: "trial",
          trial_started_at: new Date().toISOString(),
          ai_drafts_used: 0,
          ai_drafts_reset_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (createBizErr || !newBiz) {
        throw createBizErr || new Error("Failed to create business profile");
      }
      businessId = newBiz.id;
    }

    // Save platform connection in database
    const platformPayload = {
      business_id: businessId,
      platform: "google",
      place_id: placeId,
      platform_id: locationId || placeId,
      platform_url: `https://business.google.com/reviews/${locationId || placeId}`,
      access_token: accessToken || null,
      refresh_token: refreshToken || null,
      token_expires_at: tokenExpiresAt || null,
      account_id: accountId || null,
      is_active: true,
      last_synced_at: new Date().toISOString(),
    };

    const { data: existingPlatform } = await supabase
      .from("platforms")
      .select("id")
      .eq("business_id", businessId)
      .eq("platform", "google")
      .maybeSingle();

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

    // Fetch full business details to trigger sync
    try {
      const { data: business } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", businessId)
        .single();
      if (business) {
        await syncGoogleReviews(supabase, placeId, business);
      }
    } catch (syncErr) {
      console.error("Gracefully caught Google Reviews sync error during connect:", syncErr);
    }

    return NextResponse.json({ success: true, businessId });
  } catch (err: any) {
    console.error("Google connect POST error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to connect business profile" },
      { status: 500 }
    );
  }
}

function requestUrl() {
  return process.env.NEXT_PUBLIC_APP_URL!;
}
