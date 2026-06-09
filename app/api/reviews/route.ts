import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getGroqClient } from "@/lib/groq";
import { NextResponse } from "next/server";

const POSITIVE_WORDS = ["good", "great", "excellent", "love", "friendly", "best", "perfect", "delicious", "amazing", "happy", "recommend"];
const NEGATIVE_WORDS = ["bad", "terrible", "burnt", "rude", "worst", "hate", "slow", "unprofessional", "expensive", "disappointed", "poor", "waste"];

function analyzeSentimentHeuristically(text: string) {
  const cleanText = text.toLowerCase();
  let posCount = 0;
  let negCount = 0;

  POSITIVE_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = cleanText.match(regex);
    if (matches) posCount += matches.length;
  });

  NEGATIVE_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = cleanText.match(regex);
    if (matches) negCount += matches.length;
  });

  let sentiment: "positive" | "neutral" | "negative" = "neutral";
  let score = 0.5;

  if (posCount > negCount) {
    sentiment = "positive";
    score = Math.min(0.5 + (posCount - negCount) * 0.1, 0.98);
  } else if (negCount > posCount) {
    sentiment = "negative";
    score = Math.max(0.5 - (negCount - posCount) * 0.1, 0.02);
  }

  const words = cleanText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/);
  const potentialKeywords = words.filter(w => w.length > 4 && !["about", "there", "their", "would", "could", "should", "place", "service", "people"].includes(w));
  const uniqueKeywords = Array.from(new Set(potentialKeywords)).slice(0, 4);

  return { sentiment, score, keywords: uniqueKeywords };
}

function generateDraftHeuristically(
  reviewText: string,
  rating: number,
  tone: string,
  reviewerName: string | null
): string {
  const name = reviewerName || "there";

  if (rating <= 2) {
    if (tone === "apologetic") {
      return `Hi ${name}, I am truly sorry for the disappointing experience. We always strive to provide top-notch service, and it's clear we fell short here. We would love to make this right for you. Please reach out to us directly at your convenience.`;
    } else {
      return `Hi ${name}, thank you for your feedback. We apologize for not meeting your expectations. We are reviewing this with our team to improve our service. Please feel free to contact us directly to discuss your experience further.`;
    }
  } else if (rating === 3) {
    return `Hi ${name}, thank you for your feedback. We appreciate your honest review. We are constantly working to improve our service, and your comments will be shared with the team to guide our future efforts.`;
  } else { // 4-5 stars
    if (tone === "friendly") {
      return `Hey ${name}! Thank you so much for the awesome review! We are absolutely thrilled to hear you had a great experience with us. Your support means the world to our team. Can't wait to see you again soon!`;
    } else {
      return `Hi ${name}, thank you for taking the time to share your positive experience. We are thrilled to hear you enjoyed our service. Our team works hard to keep our standards high, and we look forward to welcoming you back soon.`;
    }
  }
}


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

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform") || "all";
    const rating = searchParams.get("rating") || "all";
    const status = searchParams.get("status") || "all";

    let query = supabase
      .from("reviews")
      .select("*, response_drafts(*)")
      .eq("business_id", business.id);

    // Apply platform filter
    if (platform !== "all") {
      query = query.eq("platform", platform);
    }

    // Apply status filter
    if (status === "pending") {
      query = query.eq("is_responded", false);
    } else if (status === "responded") {
      query = query.eq("is_responded", true);
    }

    // Apply rating filter
    if (rating === "1-2") {
      query = query.in("rating", [1, 2]);
    } else if (rating === "3") {
      query = query.eq("rating", 3);
    } else if (rating === "4-5") {
      query = query.in("rating", [4, 5]);
    }

    // Order by date descending
    const { data: reviews, error: queryError } = await query.order(
      "review_date",
      { ascending: false }
    );

    if (queryError) {
      throw queryError;
    }

    return NextResponse.json(reviews || []);
  } catch (err: any) {
    console.error("GET reviews error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load reviews" },
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

    const body = await request.json();
    const { reviewId, action } = body;

    if (!action) {
      return NextResponse.json(
        { error: "action parameter is required" },
        { status: 400 }
      );
    }

    if (action === "create") {
      const { reviewerName, rating, platform, reviewText, reviewDate } = body;

      if (!reviewerName || !rating || !platform || !reviewText) {
        return NextResponse.json(
          { error: "reviewerName, rating, platform, and reviewText are required" },
          { status: 400 }
        );
      }

      // 1. Get business profile
      const { data: business, error: bizError } = await supabase
        .from("businesses")
        .select("id, name, plan, auto_reply_enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      if (bizError || !business) {
        return NextResponse.json(
          { error: "Business profile not found" },
          { status: 404 }
        );
      }

      // 2. Classify sentiment
      let sentiment = "neutral";
      let score = 0.5;
      let keywords: string[] = [];

      const groq = getGroqClient();
      if (!groq) {
        const res = analyzeSentimentHeuristically(reviewText);
        sentiment = res.sentiment;
        score = res.score;
        keywords = res.keywords;
      } else {
        try {
          const prompt = `
            Classify sentiment of this review as exactly "positive", "neutral", or "negative".
            Provide score from 0.0 to 1.0. Extract up to 4 keywords.
            Return strictly JSON: { "sentiment": "...", "score": 0.5, "keywords": [] }
            Review: "${reviewText.replace(/"/g, '\\"')}"
          `;
          const completion = await groq.chat.completions.create({
            messages: [
              { role: "system", content: "You are a JSON only output machine." },
              { role: "user", content: prompt },
            ],
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" },
          });
          const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
          sentiment = parsed.sentiment || "neutral";
          score = parsed.score || 0.5;
          keywords = parsed.keywords || [];
        } catch {
          const res = analyzeSentimentHeuristically(reviewText);
          sentiment = res.sentiment;
          score = res.score;
          keywords = res.keywords;
        }
      }

      // 3. Generate unique platform review ID
      const platformReviewId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // 4. Save review
      const { data: insertedReview, error: insertErr } = await supabase
        .from("reviews")
        .insert({
          business_id: business.id,
          platform,
          platform_review_id: platformReviewId,
          reviewer_name: reviewerName,
          rating,
          review_text: reviewText,
          review_date: reviewDate || new Date().toISOString(),
          sentiment,
          sentiment_score: score,
          keywords,
          is_responded: false,
        })
        .select()
        .single();

      if (insertErr) {
        throw insertErr;
      }

      // 5. Generate AI Response Draft
      let draftText = "";
      const defaultTone = "professional";

      if (!groq) {
        draftText = generateDraftHeuristically(
          reviewText,
          rating,
          defaultTone,
          reviewerName
        );
      } else {
        try {
          const prompt = `
            Draft a response to: "${reviewText}"
            Rating: ${rating} stars. Tone: ${defaultTone}.
            Rules: under 120 words, sound human. No placeholder signatures.
          `;
          const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.1-8b-instant",
          });
          draftText = completion.choices[0]?.message?.content?.trim() || "";
        } catch {
          draftText = generateDraftHeuristically(
            reviewText,
            rating,
            defaultTone,
            reviewerName
          );
        }
      }

      // 6. Check if Auto-Reply is active
      const isAutoReply = business.auto_reply_enabled && (business.plan === "growth" || business.plan === "scale");

      // 7. Insert Draft
      const { data: draft, error: draftError } = await supabase
        .from("response_drafts")
        .insert({
          review_id: insertedReview.id,
          business_id: business.id,
          draft_text: draftText,
          ai_model: groq ? "llama-3.1-8b-instant" : "manual-fallback",
          status: isAutoReply ? "published" : "pending",
          tone: defaultTone,
        })
        .select()
        .single();

      if (draftError) {
        throw draftError;
      }

      // 8. If Auto-Reply, update review record directly
      if (isAutoReply) {
        await supabase
          .from("reviews")
          .update({
            is_responded: true,
            response_text: draftText,
            response_published_at: new Date().toISOString(),
          })
          .eq("id", insertedReview.id);
      }

      return NextResponse.json({
        success: true,
        review: insertedReview,
        draft,
        autoPublished: isAutoReply,
      });
    }

    if (!reviewId) {
      return NextResponse.json(
        { error: "reviewId is required for this action" },
        { status: 400 }
      );
    }

    if (action === "mark_responded") {
      const { data, error } = await supabase
        .from("reviews")
        .update({
          is_responded: true,
          response_text: "Marked as responded manually",
          response_published_at: new Date().toISOString(),
        })
        .eq("id", reviewId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, review: data });
    }

    if (action === "ignore") {
      const { data, error } = await supabase
        .from("reviews")
        .update({
          is_responded: true,
          response_text: "Ignored",
          response_published_at: new Date().toISOString(),
        })
        .eq("id", reviewId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, review: data });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("POST reviews error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process review action" },
      { status: 500 }
    );
  }
}
