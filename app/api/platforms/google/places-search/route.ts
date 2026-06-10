import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const MOCK_PLACES = [
  {
    id: "places/mock_place_1",
    displayName: { text: "Bite & Brew Cafe (Mumbai)", languageCode: "en" },
    formattedAddress: "Plot 12, Link Road, Andheri West, Mumbai, India",
    rating: 4.6,
    userRatingCount: 247,
  },
  {
    id: "places/mock_place_2",
    displayName: { text: "The Daily Brew (Bandra)", languageCode: "en" },
    formattedAddress: "Avenue 3, Bandra West, Mumbai, India",
    rating: 4.2,
    userRatingCount: 89,
  },
  {
    id: "places/mock_place_3",
    displayName: { text: "Bite & Brew Bistro (Colaba)", languageCode: "en" },
    formattedAddress: "Regal Cinema Bldg, Colaba, Mumbai, India",
    rating: 4.8,
    userRatingCount: 412,
  }
];

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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const isMock = !apiKey || apiKey === "your-google-places-api-key" || apiKey.trim() === "";

    if (!query) {
      return NextResponse.json({ isMock });
    }

    if (isMock) {
      console.warn("[Google Places] Running in SIMULATION mode because GOOGLE_PLACES_API_KEY is not configured.");
      
      // Filter mock places based on text search query
      const lowerQuery = query.toLowerCase();
      const filtered = MOCK_PLACES.filter(place => 
        place.displayName.text.toLowerCase().includes(lowerQuery) ||
        place.formattedAddress.toLowerCase().includes(lowerQuery)
      );

      return NextResponse.json({ places: filtered });
    }

    // Call real Google Places API (New)
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey!,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount",
      },
      body: JSON.stringify({ textQuery: query }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = `Google API returned status ${response.status}`;
      if (responseText.trim()) {
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch {
          errorMessage += `: ${responseText}`;
        }
      }
      throw new Error(errorMessage);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any = {};
    if (responseText.trim()) {
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error("Failed to parse Google Places API response JSON. Raw text:", responseText);
        throw new Error("Invalid response format received from Google Places API");
      }
    }

    return NextResponse.json({ places: data.places || [] });
  } catch (err: any) {
    console.error("Google Places Search API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to search Google Places" },
      { status: 500 }
    );
  }
}
