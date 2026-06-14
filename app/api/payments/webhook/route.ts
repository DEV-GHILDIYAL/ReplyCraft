import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const headers = request.headers;
    const signature = headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const isProduction = process.env.NODE_ENV === "production";

    // 1. Signature Verification
    if (body.razorpay_signature) {
      // Client-side verification payload from the checkout handler
      const isPlaceholderKeySecret =
        !keySecret || keySecret === "your-razorpay-secret" || keySecret.trim() === "";

      if (isProduction && isPlaceholderKeySecret) {
        return NextResponse.json(
          { error: "Razorpay Key Secret is not configured in production" },
          { status: 500 }
        );
      }

      if (!isPlaceholderKeySecret) {
        const expectedSignature = crypto
          .createHmac("sha256", keySecret!)
          .update(body.razorpay_order_id + "|" + body.razorpay_payment_id)
          .digest("hex");

        if (expectedSignature !== body.razorpay_signature) {
          return NextResponse.json(
            { error: "Invalid payment signature verification" },
            { status: 401 }
          );
        }
      } else {
        console.warn(
          "[Razorpay Webhook] Skipping client signature verification in simulation/mock mode."
        );
      }
    } else {
      // Standard server-to-server webhook
      const isPlaceholderWebhookSecret =
        !webhookSecret || webhookSecret === "your-razorpay-secret" || webhookSecret.trim() === "";

      if (isProduction) {
        if (!signature) {
          return NextResponse.json(
            { error: "x-razorpay-signature header is missing" },
            { status: 401 }
          );
        }
        if (isPlaceholderWebhookSecret) {
          return NextResponse.json(
            { error: "Webhook secret is not configured in production" },
            { status: 500 }
          );
        }
        const expectedSignature = crypto
          .createHmac("sha256", webhookSecret!)
          .update(rawBody)
          .digest("hex");

        if (expectedSignature !== signature) {
          return NextResponse.json(
            { error: "Invalid webhook signature" },
            { status: 401 }
          );
        }
      } else {
        // Development/Simulation mode for webhook
        if (signature && !isPlaceholderWebhookSecret) {
          const expectedSignature = crypto
            .createHmac("sha256", webhookSecret!)
            .update(rawBody)
            .digest("hex");

          if (expectedSignature !== signature) {
            return NextResponse.json(
              { error: "Invalid webhook signature" },
              { status: 401 }
            );
          }
        } else {
          console.warn(
            "[Razorpay Webhook] Running in SIMULATION mode because signature is missing or secret is not configured in development."
          );
        }
      }
    }

    // 2. Extract order info
    // Webhook events could be: order.paid, payment.captured, or manually simulated posts
    let orderId = "";
    let paymentId = "";
    let status = "failed";

    if (body.event === "order.paid" || body.event === "payment.captured") {
      const paymentEntity = body.payload?.payment?.entity;
      orderId = paymentEntity?.order_id || "";
      paymentId = paymentEntity?.id || "";
      status = "paid";
    } else if (body.razorpay_order_id) {
      // Allow direct client verification payload for easy testing
      orderId = body.razorpay_order_id;
      paymentId = body.razorpay_payment_id || "";
      status = "paid";
    } else {
      // If event is not paid/captured, just acknowledge it
      return NextResponse.json({ received: true });
    }

    if (!orderId) {
      return NextResponse.json(
        { error: "No order ID found in payload" },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS since webhooks are server-to-server
    const supabase = await createAdminClient();

    // Find the payment record
    const { data: paymentRecord, error: fetchError } = await supabase
      .from("payments")
      .select("*")
      .eq("razorpay_order_id", orderId)
      .maybeSingle();

    if (fetchError || !paymentRecord) {
      return NextResponse.json(
        { error: `Payment record not found for order: ${orderId}` },
        { status: 404 }
      );
    }

    // If already paid, do not repeat process
    if (paymentRecord.status === "paid") {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    // Update payment record
    const { error: updatePayError } = await supabase
      .from("payments")
      .update({
        razorpay_payment_id: paymentId,
        status: status,
      })
      .eq("id", paymentRecord.id);

    if (updatePayError) throw updatePayError;

    if (status === "paid") {
      // Upgrade subscription plan in businesses table
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30-day billing cycle

      const { error: updateBizError } = await supabase
        .from("businesses")
        .update({
          plan: paymentRecord.plan,
          plan_expires_at: expiryDate.toISOString(),
          ai_drafts_used: 0,
          ai_drafts_reset_at: new Date().toISOString(),
        })
        .eq("id", paymentRecord.business_id);

      if (updateBizError) throw updateBizError;

      // Create notification for plan upgrade
      const planLabel =
        String(paymentRecord.plan).charAt(0).toUpperCase() +
        String(paymentRecord.plan).slice(1);
      await supabase.from("notifications").insert({
        business_id: paymentRecord.business_id,
        type: "plan_upgraded",
        message: `Your plan has been upgraded to ${planLabel}`,
        link: "/settings",
        is_read: false,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed order ${orderId} as ${status}`,
    });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process webhook" },
      { status: 500 }
    );
  }
}
