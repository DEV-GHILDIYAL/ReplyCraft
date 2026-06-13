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

    const isMock = code === "mock_google_code";
    let locations: any[] = [];
    let accessToken = "mock_access_token";
    let refreshToken = "mock_refresh_token";
    let expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    if (!isMock) {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = process.env.NEXT_PUBLIC_APP_URL 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/platforms/google/callback`
        : 'http://localhost:3000/api/platforms/google/callback';

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
        const expiresIn = tokens.expires_in || 3600;
        expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

        // Fetch Google My Business Accounts
        const accountsRes = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (accountsRes.ok) {
          const accountsData = await accountsRes.json();
          const accountsList = accountsData.accounts || [];

          for (const account of accountsList) {
            const accountName = account.name; // accounts/{accountId}
            const accountId = accountName.split("/")[1];

            const locationsRes = await fetch(
              `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress,categories,metadata`,
              {
                headers: { Authorization: `Bearer ${accessToken}` }
              }
            );

            if (locationsRes.ok) {
              const locationsData = await locationsRes.json();
              const locationsList = locationsData.locations || [];

              for (const loc of locationsList) {
                const placeId = loc.metadata?.placeId;
                if (!placeId) continue; // Skip unverified locations without place IDs

                const addressObj = loc.storefrontAddress;
                const addressString = [
                  ...(addressObj?.addressLines || []),
                  addressObj?.locality,
                  addressObj?.postalCode,
                  addressObj?.country
                ].filter(Boolean).join(", ");

                const categoryName = loc.categories?.primaryCategory?.displayName || "";
                let mappedCat = "other";
                const catLower = categoryName.toLowerCase();
                if (catLower.includes("salon") || catLower.includes("spa") || catLower.includes("hair")) {
                  mappedCat = "salon";
                } else if (catLower.includes("restaurant") || catLower.includes("food") || catLower.includes("cafe")) {
                  mappedCat = "restaurant";
                } else if (catLower.includes("clinic") || catLower.includes("medical") || catLower.includes("doctor") || catLower.includes("hospital")) {
                  mappedCat = "clinic";
                } else if (catLower.includes("hotel") || catLower.includes("resort") || catLower.includes("motel")) {
                  mappedCat = "hotel";
                } else if (catLower.includes("retail") || catLower.includes("shop") || catLower.includes("store")) {
                  mappedCat = "retail";
                }

                locations.push({
                  name: loc.title || "Unnamed Business",
                  address: addressString || "No address available",
                  place_id: placeId,
                  location_id: loc.name?.split("/")?.[1] || loc.name || "",
                  account_id: accountId,
                  primary_category: mappedCat
                });
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch verified GMB locations:", err);
        return NextResponse.redirect(
          new URL("/platforms?error=google_auth_failed", requestUrl())
        );
      }
    } else {
      // Mock Fallback for local testing/development
      locations = [
        {
          name: "Dev Test Salon",
          address: "123 Haircut Street, Mumbai, Maharashtra, 400001",
          place_id: "mock_place_salon",
          location_id: "mock_loc_salon",
          account_id: "mock_account_123",
          primary_category: "salon"
        },
        {
          name: "Dev Test Restaurant",
          address: "456 Spice Avenue, New Delhi, Delhi, 110001",
          place_id: "mock_place_restaurant",
          location_id: "mock_loc_restaurant",
          account_id: "mock_account_123",
          primary_category: "restaurant"
        }
      ];
    }

    // Redirect user to platforms select-location step
    const redirectUrl = new URL("/platforms", requestUrl());
    redirectUrl.searchParams.set("step", "select-location");
    redirectUrl.searchParams.set("locations", JSON.stringify(locations));
    redirectUrl.searchParams.set("access_token", accessToken);
    redirectUrl.searchParams.set("refresh_token", refreshToken);
    redirectUrl.searchParams.set("token_expires_at", expiresAt);

    return NextResponse.redirect(redirectUrl);
  } catch (err: any) {
    console.error("Google callback error:", err);
    return NextResponse.redirect(new URL("/platforms?error=system_error", requestUrl()));
  }
}

function requestUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
