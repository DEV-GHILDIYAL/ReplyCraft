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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MOCK_REVIEWS_FOR_PLACES: Record<string, any[]> = {
  "places/mock_place_1": [
    {
      name: "places/mock_place_1/reviews/1",
      rating: 5,
      text: { text: "Absolutely fantastic coffee and quick breakfast! The staff is extremely polite and friendly." },
      authorAttribution: { displayName: "Rohan Sharma" },
      publishTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    },
    {
      name: "places/mock_place_1/reviews/2",
      rating: 2,
      text: { text: "The food was okay but we waited for 40 minutes just to get our coffee. Too slow service." },
      authorAttribution: { displayName: "Priya Patel" },
      publishTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    },
    {
      name: "places/mock_place_1/reviews/3",
      rating: 4,
      text: { text: "Really clean place with nice ambient music. Great for working on laptop." },
      authorAttribution: { displayName: "Amit Verma" },
      publishTime: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
    }
  ],
  "places/mock_place_2": [
    {
      name: "places/mock_place_2/reviews/1",
      rating: 3,
      text: { text: "Average experience. The beverages were fine but pricing was quite steep for the size." },
      authorAttribution: { displayName: "Kunal Shah" },
      publishTime: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
    }
  ],
  "places/mock_place_3": [
    {
      name: "places/mock_place_3/reviews/1",
      rating: 5,
      text: { text: "Exceptional dining! Highly recommend the avocado toast and cold brew." },
      authorAttribution: { displayName: "Sneha Rao" },
      publishTime: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
    }
  ]
};

export async function syncGoogleReviews(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  placeId: string,
  business: { id: string; plan: string | null; auto_reply_enabled: boolean | null }
): Promise<number> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const isMock = !apiKey || apiKey === "your-google-places-api-key" || apiKey.trim() === "" || placeId.includes("mock_");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let apiReviews: any[] = [];

  if (isMock) {
    console.warn("[Google Places Sync] Running in SIMULATION mode.");
    apiReviews = MOCK_REVIEWS_FOR_PLACES[placeId] || [
      {
        name: `${placeId}/reviews/default_1`,
        rating: 4,
        text: { text: "Great place, really liked the service." },
        authorAttribution: { displayName: "Simulated Reviewer" },
        publishTime: new Date().toISOString()
      }
    ];
  } else {
    // Call Google Places API Details
    const cleanPlaceId = placeId.replace(/^places\//, "");
    const url = `https://places.googleapis.com/v1/places/${cleanPlaceId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey!,
        "X-Goog-FieldMask": "reviews,rating,userRatingCount",
      }
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

    apiReviews = data && Array.isArray(data.reviews) ? data.reviews : [];
  }

  // Load existing reviews to prevent duplicates (by reviewer_name + review_date or platform_review_id)
  const { data: existingReviews } = await supabase
    .from("reviews")
    .select("platform_review_id, reviewer_name, review_date")
    .eq("business_id", business.id)
    .eq("platform", "google");

  const existingReviewKeys = new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (existingReviews || []).map((r: any) => `${r.reviewer_name}|${r.review_date ? new Date(r.review_date).toISOString() : ""}`)
  );
  const existingReviewIds = new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (existingReviews || []).map((r: any) => r.platform_review_id)
  );

  const groq = getGroqClient();
  let importedCount = 0;

  for (const apiRev of apiReviews) {
    const reviewerName = apiRev.authorAttribution?.displayName || "Anonymous";
    const rating = apiRev.rating || 5;
    const reviewText = apiRev.text?.text || "";
    const reviewDate = apiRev.publishTime || new Date().toISOString();
    const platformReviewId = apiRev.name || `manual_gen_${Math.random()}`;

    const lookupKey = `${reviewerName}|${new Date(reviewDate).toISOString()}`;

    // Duplicate Check
    if (existingReviewKeys.has(lookupKey) || existingReviewIds.has(platformReviewId)) {
      continue;
    }

    // Classify sentiment
    let sentiment = "neutral";
    let score = 0.5;
    let keywords: string[] = [];

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

    // Insert Review
    const { data: insertedReview, error: insertErr } = await supabase
      .from("reviews")
      .insert({
        business_id: business.id,
        platform: "google",
        platform_review_id: platformReviewId,
        reviewer_name: reviewerName,
        rating,
        review_text: reviewText,
        review_date: reviewDate,
        sentiment,
        sentiment_score: score,
        keywords,
        is_responded: false,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Failed to insert review:", insertErr);
      continue;
    }

    // Generate Draft response
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

    const isAutoReply = business.auto_reply_enabled && (business.plan === "growth" || business.plan === "scale");

    // Save Draft
    await supabase.from("response_drafts").insert({
      review_id: insertedReview.id,
      business_id: business.id,
      draft_text: draftText,
      ai_model: groq ? "llama-3.1-8b-instant" : "places-fallback",
      status: isAutoReply ? "published" : "pending",
      tone: defaultTone,
    });

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

    importedCount++;
  }

  return importedCount;
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
      .select("id, plan, auto_reply_enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    if (bizError || !business) {
      return NextResponse.json({ error: "Business profile not found" }, { status: 404 });
    }

    const { placeId } = await request.json();

    if (!placeId) {
      return NextResponse.json({ error: "placeId is required" }, { status: 400 });
    }

    const importedCount = await syncGoogleReviews(supabase, placeId, business);

    return NextResponse.json({
      success: true,
      importedCount,
    });
  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("Fetch Google Reviews API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to sync Google reviews" },
      { status: 500 }
    );
  }
}
