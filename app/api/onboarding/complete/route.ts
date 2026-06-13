import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

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
    const {
      businessName,
      category,
      website,
      goal,
      challenge,
      tone,
      reviewVolume,
    } = body;

    // Validate required fields
    if (!businessName || !category || !goal || !challenge || !tone || !reviewVolume) {
      return NextResponse.json(
        { error: "Missing required onboarding fields" },
        { status: 400 }
      );
    }

    // Insert new business record
    const { data: business, error: insertError } = await supabase
      .from("businesses")
      .insert({
        user_id: user.id,
        name: businessName,
        category: category,
        plan: "trial",
        trial_started_at: new Date().toISOString(),
        ai_drafts_used: 0,
        ai_drafts_reset_at: new Date().toISOString(),
        onboarding_data: {
          goal,
          challenge,
          tone,
          reviewVolume,
          website: website || "",
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert business during onboarding:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Failed to create business profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, business });
  } catch (err: any) {
    console.error("Onboarding complete endpoint error:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
