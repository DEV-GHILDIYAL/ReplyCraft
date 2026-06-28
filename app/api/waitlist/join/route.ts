import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Insert into waitlist
    const { error } = await supabase
      .from("waitlist")
      .insert({ email });

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return NextResponse.json({ success: true, alreadyJoined: true });
      }
      throw error;
    }

    // Get count
    const { count } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true });

    const totalCount = count || 0;

    return NextResponse.json({ success: true, count: totalCount + 500 });
  } catch (err: any) {
    console.error("Waitlist join error:", err);
    return NextResponse.json(
      { error: "Failed to join waitlist" },
      { status: 500 }
    );
  }
}
