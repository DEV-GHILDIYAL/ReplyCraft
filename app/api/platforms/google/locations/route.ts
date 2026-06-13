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

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const isMockMode = !clientId || clientId === "your-google-client-id" || clientId.trim() === "";

    if (isMockMode) {
      // Mock Fallback
      const mockLocations = [
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
      return NextResponse.json({ success: true, locations: mockLocations });
    }

    // Fetch user's business
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (bizError || !business) {
      return NextResponse.json({ error: "Business profile not found" }, { status: 404 });
    }

    // Fetch the connected Google platform
    const { data: platform, error: platformError } = await supabase
      .from("platforms")
      .select("*")
      .eq("business_id", business.id)
      .eq("platform", "google")
      .maybeSingle();

    if (platformError || !platform) {
      return NextResponse.json({ error: "Google platform connection not found" }, { status: 404 });
    }

    let accessToken = platform.access_token;
    const refreshToken = platform.refresh_token;
    const tokenExpiresAt = platform.token_expires_at;

    // Check if token has expired (or is close to expiring in 60s)
    const isExpired = tokenExpiresAt ? new Date(tokenExpiresAt).getTime() - Date.now() < 60 * 1000 : true;

    if (isExpired && refreshToken) {
      try {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
          }),
        });

        const data = await tokenRes.json();
        if (tokenRes.ok) {
          accessToken = data.access_token;
          const expiresAtISO = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString();
          
          await supabase
            .from("platforms")
            .update({
              access_token: accessToken,
              token_expires_at: expiresAtISO,
            })
            .eq("id", platform.id);
        } else {
          console.error("Token refresh failed in locations API:", data.error_description || data.error);
        }
      } catch (refreshErr) {
        console.error("Failed to refresh access token:", refreshErr);
      }
    }

    if (!accessToken) {
      return NextResponse.json({ error: "Access token is missing or expired" }, { status: 401 });
    }

    const locations: any[] = [];

    // Fetch GMB accounts
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
            if (!placeId) continue; // Only verified locations

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

    return NextResponse.json({ success: true, locations });
  } catch (err: any) {
    console.error("Locations fetch API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
