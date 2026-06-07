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

function requestUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
