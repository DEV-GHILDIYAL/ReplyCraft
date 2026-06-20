import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getGroqClient } from "@/lib/groq";
import { NextResponse } from "next/server";
import { Tone } from "@/types";
import { isTrialExpired, getDraftLimit } from "@/lib/plans";

function generateDraftHeuristically(
  reviewText: string,
  rating: number,
  tone: Tone,
  reviewerName: string | null
): string {
  const name = reviewerName || "there";

  if (rating <= 2) {
    if (tone === "apologetic") {
      return `Hi ${name}, I am truly sorry for the disappointing experience. We always strive to provide top-notch service, and it's clear we fell short here. We would love to make this right for you. Please reach out to us directly at your convenience.`;
    } else if (tone === "formal") {
      return `Dear ${name}, please accept our sincere apologies for the unsatisfactory experience. We take customer feedback very seriously and are taking immediate internal steps to address the issues raised. Please contact our management team to resolve this matter.`;
    } else if (tone === "friendly") {
      return `Hi ${name}, we are really sorry things didn't go well. We want all our guests to leave happy, and we clearly missed the mark. If you are open to it, please drop us a message directly so we can make things right.`;
    } else { // professional
      return `Hi ${name}, thank you for your feedback. We apologize for not meeting your expectations. We are reviewing this with our team to improve our service. Please feel free to contact us directly to discuss your experience further.`;
    }
  } else if (rating === 3) {
    if (tone === "friendly") {
      return `Hey ${name}, thanks for the honest review! We're glad you found some aspects of your visit good, but we want to do even better. We're on it and hope to give you a 5-star experience next time!`;
    } else if (tone === "formal") {
      return `Dear ${name}, thank you for your feedback. We appreciate your constructive remarks. We are committed to continuous improvement and will use your notes to refine our operations. We hope to welcome you back for an improved experience.`;
    } else if (tone === "apologetic") {
      return `Hi ${name}, thank you for sharing your thoughts. We apologize if everything wasn't completely up to our usual standards. We appreciate your patience and will work on getting those details right next time.`;
    } else { // professional
      return `Hi ${name}, thank you for your feedback. We appreciate your honest review. We are constantly working to improve our service, and your comments will be shared with the team to guide our future efforts.`;
    }
  } else { // 4-5 stars
    if (tone === "friendly") {
      return `Hey ${name}! Thank you so much for the awesome review! We are absolutely thrilled to hear you had a great experience with us. Your support means the world to our team. Can't wait to see you again soon!`;
    } else if (tone === "formal") {
      return `Dear ${name}, thank you for your kind review. We appreciate your patronage and are delighted to hear that you had a positive experience. We look forward to serving you again in the future.`;
    } else if (tone === "apologetic") {
      return `Hi ${name}, thank you so much for the feedback! We are glad you had a great experience, and we apologize for any minor delay or inconvenience during your visit. We look forward to providing a flawless experience next time.`;
    } else { // professional
      return `Hi ${name}, thank you for taking the time to share your positive experience. We are thrilled to hear you enjoyed our service. Our team works hard to keep our standards high, and we look forward to welcoming you back soon.`;
    }
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

    const { reviewId, tone } = await request.json();

    if (!reviewId || !tone) {
      return NextResponse.json(
        { error: "reviewId and tone are required" },
        { status: 400 }
      );
    }

    // Fetch review
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", reviewId)
      .maybeSingle();

    if (reviewError || !review) {
      return NextResponse.json(
        { error: "Review not found or access denied" },
        { status: 404 }
      );
    }

    // Fetch business details
    const { data: business, error: bizErr } = await supabase
      .from("businesses")
      .select("id, name, plan, trial_started_at, ai_drafts_used, ai_drafts_reset_at")
      .eq("id", review.business_id)
      .maybeSingle();

    if (bizErr || !business) {
      return NextResponse.json(
        { error: "Business profile not found" },
        { status: 404 }
      );
    }

    // 1. Check Free Trial expiration
    if (business.plan === "trial" && isTrialExpired(business.trial_started_at)) {
      return NextResponse.json(
        { error: "trial_expired", message: "Your 7-day trial has ended. Please upgrade to continue." },
        { status: 403 }
      );
    }

    let currentUsed = business.ai_drafts_used || 0;

    // 2. Check Plan Quota limit (if not on trial)
    if (business.plan !== "trial") {
      const resetAt = new Date(business.ai_drafts_reset_at || new Date());
      const now = new Date();
      const diffMs = now.getTime() - resetAt.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays >= 30) {
        currentUsed = 0;
        await supabase
          .from("businesses")
          .update({
            ai_drafts_used: 0,
            ai_drafts_reset_at: now.toISOString(),
          })
          .eq("id", business.id);
      }

      if (currentUsed >= getDraftLimit(business.plan)) {
        return NextResponse.json(
          { error: "limit_exceeded", plan: business.plan, limit: getDraftLimit(business.plan) },
          { status: 429 }
        );
      }
    }

    const businessName = business?.name || "our team";

    const groq = getGroqClient();
    let draftText = "";

    if (!groq) {
      // Fallback
      draftText = generateDraftHeuristically(
        review.review_text || "",
        review.rating || 5,
        tone as Tone,
        review.reviewer_name
      );
    } else {
      // Prompt construction matching requirements
      const rating = review.rating || 5;
      const reviewText = review.review_text || "";
      const reviewer = review.reviewer_name || "customer";

      let promptRules = "";
      if (rating <= 2) {
        promptRules = `Since the rating is low (${rating} stars), draft an apologetic response, offer a resolution (such as looking into the issue or addressing it internally), and invite direct contact to make it right.`;
      } else if (rating === 3) {
        promptRules = `Since the rating is moderate (${rating} stars), acknowledge their feedback, thank them, and highlight our commitment to improve our service based on their input.`;
      } else {
        promptRules = `Since the rating is high (${rating} stars), thank them warmly for their support and reinforce what they loved about their experience.`;
      }

      const prompt = `
        You are a customer relationship assistant for the business "${businessName}".
        Draft a response to the following customer review.

        Business Name: ${businessName}
        Customer Name: ${reviewer}
        Review Rating: ${rating} stars
        Review Text: "${reviewText}"
        Desired Response Tone: ${tone}

        Rules:
        1. ${promptRules}
        2. Sound human and authentic. Avoid corporate speak, robotic language, or clichés.
        3. Keep the response concise: maximum 120 words.
        4. Focus on building customer loyalty.
        5. NEVER use placeholders, templates, or bracketed variables (like "[Your Name]", "[insert email]", "[contact number]", "[manager's name]"). All information must be complete and ready-to-publish as-is.
        6. Sign off as "${businessName}" or "our team" generically. Do not leave a signature placeholder.

        Respond ONLY with the text of the draft response. No headers, introductory phrases, or signatures like "[Your Name]". Just write the reply.
      `;

      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a customer service assistant writing draft responses to reviews for the business: "${businessName}". 
Output ONLY the final response text.

CRITICAL RULES:
1. NEVER include placeholders, brackets, or template tags like "[insert X]", "[your name]", "[contact details]", "[phone number]", "[email]", etc.
2. Instead of using placeholders, use these generic but professional alternatives:
   - Instead of contact email: say "please contact us directly" or "email us directly"
   - Instead of manager/staff name: say "our team" or "management"
   - Instead of phone number: say "reach out to us directly" or "call us directly"
3. Ensure the response is completely self-contained, warm, professional, and ready to be published as-is without any editing needed.
4. Keep the response concise (maximum 120 words) and maintain the requested tone.`
          },
          { role: "user", content: prompt },
        ],
        model: "llama-3.1-8b-instant",
      });

      draftText = response.choices[0]?.message?.content?.trim() || "";

      // Cleanup response formatting issues (quotes, etc.)
      if (draftText.startsWith('"') && draftText.endsWith('"')) {
        draftText = draftText.slice(1, -1);
      }
    }

    if (!draftText) {
      throw new Error("Failed to generate response content");
    }

    // Check if drafts already exist for this review to prevent duplicates
    const { data: existingDrafts } = await supabase
      .from("response_drafts")
      .select("id")
      .eq("review_id", reviewId);

    let draft;
    let draftError;

    if (existingDrafts && existingDrafts.length > 0) {
      const targetId = existingDrafts[0].id;
      const { data, error } = await supabase
        .from("response_drafts")
        .update({
          draft_text: draftText,
          ai_model: groq ? "llama-3.1-8b-instant" : "fallback-templates",
          status: "pending",
          tone: tone,
        })
        .eq("id", targetId)
        .select()
        .single();
      
      draft = data;
      draftError = error;

      // Clean up any extra duplicate drafts for this review
      if (existingDrafts.length > 1) {
        const otherIds = existingDrafts.slice(1).map((d) => d.id);
        await supabase
          .from("response_drafts")
          .delete()
          .in("id", otherIds);
      }
    } else {
      const { data, error } = await supabase
        .from("response_drafts")
        .insert({
          review_id: reviewId,
          business_id: review.business_id,
          draft_text: draftText,
          ai_model: groq ? "llama-3.1-8b-instant" : "fallback-templates",
          status: "pending",
          tone: tone,
        })
        .select()
        .single();
      
      draft = data;
      draftError = error;
    }

    if (draftError) {
      throw draftError;
    }

    // Update business used quota count
    await supabase
      .from("businesses")
      .update({
        ai_drafts_used: currentUsed + 1,
      })
      .eq("id", business.id);

    // Create notification for AI draft ready
    const reviewerLabel = review.reviewer_name || "Anonymous";
    await supabase.from("notifications").insert({
      business_id: review.business_id,
      type: "draft_ready",
      message: `AI draft ready for ${reviewerLabel}'s review`,
      link: "/responses",
      is_read: false,
    });

    return NextResponse.json({
      success: true,
      draft,
    });
  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("AI Draft API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate AI draft" },
      { status: 500 }
    );
  }
}
