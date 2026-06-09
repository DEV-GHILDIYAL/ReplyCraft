import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getRazorpayInstance, PLANS_PRICES } from "@/lib/razorpay";
import { NextResponse } from "next/server";
import { PlanType } from "@/types";

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

    const { plan } = await request.json();

    if (!plan || (plan !== "starter" && plan !== "growth" && plan !== "scale")) {
      return NextResponse.json(
        { error: "Invalid plan type. Must be 'starter', 'growth', or 'scale'" },
        { status: 400 }
      );
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

    const amountInPaise = PLANS_PRICES[plan as PlanType] * 100;
    const razorpay = getRazorpayInstance();

    let orderId = "";

    if (!razorpay) {
      // Mock order generation for local development without credentials
      orderId = `order_mock_${Math.random().toString(36).substring(2, 12)}`;
    } else {
      // Create order via Razorpay SDK
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_${business.id.substring(0, 8)}`,
      });
      orderId = order.id;
    }

    // Save order in the payments table
    const { data: paymentRecord, error: insertError } = await supabase
      .from("payments")
      .insert({
        business_id: business.id,
        amount: amountInPaise,
        plan: plan,
        razorpay_order_id: orderId,
        status: "created",
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      order_id: orderId,
      amount: amountInPaise,
      paymentId: paymentRecord.id,
    });
  } catch (err: any) {
    console.error("Create order API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create payment order" },
      { status: 500 }
    );
  }
}
