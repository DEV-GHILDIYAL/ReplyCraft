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

    const businessId = business.id;

    // Fetch 10 most recent notifications
    const { data: notifications, error: notifError } = await supabase
      .from("notifications")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (notifError) throw notifError;

    // Fetch unread count
    const { count: unreadCount, error: countError } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("is_read", false);

    if (countError) throw countError;

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    });
  } catch (err: any) {
    console.error("GET notifications error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load notifications" },
      { status: 500 }
    );
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

    const businessId = business.id;
    const { action, notificationId } = await request.json();

    if (action === "mark_all_read") {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("business_id", businessId)
        .eq("is_read", false);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === "mark_read") {
      if (!notificationId) {
        return NextResponse.json(
          { error: "notificationId is required" },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("business_id", businessId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("POST notifications error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process notifications action" },
      { status: 500 }
    );
  }
}
