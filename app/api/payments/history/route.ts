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

    // Fetch payments list
    const { data: payments, error: payError } = await supabase
      .from("payments")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });

    if (payError) {
      throw payError;
    }

    return NextResponse.json(payments || []);
  } catch (err: any) {
    console.error("GET payment history error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load payment history" },
      { status: 500 }
    );
  }
}
