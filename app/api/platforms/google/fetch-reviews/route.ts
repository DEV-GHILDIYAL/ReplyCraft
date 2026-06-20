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
  "mock_place_salon": [
    {
      name: "places/mock_place_salon/reviews/1",
      rating: 5,
      text: { text: "Absolutely loved the haircut and hair spa! The stylists are highly professional and friendly. Recommended!" },
      authorAttribution: { displayName: "Rohan Sharma" },
      publishTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    },
    {
      name: "places/mock_place_salon/reviews/2",
      rating: 2,
      text: { text: "The massage was fine, but I had to wait 30 minutes despite booking an appointment. Very poor management." },
      authorAttribution: { displayName: "Priya Patel" },
      publishTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    },
    {
      name: "places/mock_place_salon/reviews/3",
      rating: 4,
      text: { text: "Clean salon with pleasant background music. Staff is polite and hygiene is well maintained." },
      authorAttribution: { displayName: "Amit Verma" },
      publishTime: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
    }
  ],
  "mock_place_restaurant": [
    {
      name: "places/mock_place_restaurant/reviews/1",
      rating: 5,
      text: { text: "Awesome food! The paneer tikka and garlic naan were delicious. Excellent service and ambiance." },
      authorAttribution: { displayName: "Sneha Rao" },
      publishTime: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
    },
    {
      name: "places/mock_place_restaurant/reviews/2",
      rating: 3,
      text: { text: "Average taste. The chicken biryani was okay but felt overpriced for the quantity served." },
      authorAttribution: { displayName: "Kunal Shah" },
      publishTime: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
    },
    {
      name: "places/mock_place_restaurant/reviews/3",
      rating: 1,
      text: { text: "Terrible experience. The soup was cold and when we complained, the waiter was extremely rude. Avoid!" },
      authorAttribution: { displayName: "Vikram Malhotra" },
      publishTime: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
    }
  ],
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
  business: { id: string; name?: string; plan: string | null; auto_reply_enabled: boolean | null }
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

    // Insert Review with ON CONFLICT DO NOTHING
    const { data: insertedReview, error: insertErr } = await supabase
      .from("reviews")
      .upsert(
        {
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
        },
        {
          onConflict: "business_id,platform_review_id",
          ignoreDuplicates: true,
        }
      )
      .select()
      .maybeSingle();

    if (insertErr || !insertedReview) {
      if (insertErr) {
        console.error("Failed to insert review:", insertErr);
      }
      continue;
    }

    // Generate Draft response
    let draftText = "";
    const defaultTone = "professional";
    const businessName = business.name || "our team";

    if (!groq) {
      draftText = generateDraftHeuristically(
        reviewText,
        rating,
        defaultTone,
        reviewerName
      );
    } else {
      try {
        const reviewer = reviewerName || "customer";
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
          Desired Response Tone: ${defaultTone}

          Rules:
          1. ${promptRules}
          2. Sound human and authentic. Avoid corporate speak, robotic language, or clichés.
          3. Keep the response concise: maximum 120 words.
          4. Focus on building customer loyalty.
          5. NEVER use placeholders, templates, or bracketed variables (like "[Your Name]", "[insert email]", "[contact number]", "[manager's name]"). All information must be complete and ready-to-publish as-is.
          6. Sign off as "${businessName}" or "our team" generically. Do not leave a signature placeholder.

          Respond ONLY with the text of the draft response. No headers, introductory phrases, or signatures like "[Your Name]". Just write the reply.
        `;

        const completion = await groq.chat.completions.create({
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
        draftText = completion.choices[0]?.message?.content?.trim() || "";

        // Cleanup response formatting issues (quotes, etc.)
        if (draftText.startsWith('"') && draftText.endsWith('"')) {
          draftText = draftText.slice(1, -1);
        }
      } catch (err) {
        console.error("Failed to generate AI draft, falling back to heuristics:", err);
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
      .select("id, name, plan, auto_reply_enabled")
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
