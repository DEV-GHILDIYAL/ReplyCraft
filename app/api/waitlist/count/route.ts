import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createAdminClient();
    const { count, error } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true });

    if (error) {
      throw error;
    }

    const realCount = count || 0;
    
    return NextResponse.json({ count: realCount + 500 });
  } catch (err: any) {
    console.error("Waitlist count error:", err);
    return NextResponse.json(
      { error: "Failed to fetch waitlist count" },
      { status: 500 }
    );
  }
}
